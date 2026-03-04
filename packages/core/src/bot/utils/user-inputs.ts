/**
 * @file user-inputs.ts
 * @module bot/utils/user-inputs
 *
 * Reusable input collectors for Egyptian user data.
 *
 * Each function runs a validation loop:
 * - Sends the prompt via the bound wait function
 * - Validates input, re-asks on failure
 * - Returns validated value or empty string / null on cancel
 *
 * Arabic digit normalization is applied automatically to all numeric inputs.
 * Users can type in Arabic digits (\u0660-\u0669) or English digits (0-9).
 */

import { egyptianNationalId, egyptianPhoneNumber, extractEgyptianNationalIdInfo } from '@al-saada/validators'
import type { BotContext } from '../../types/context'
import { prisma } from '../../database/prisma'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Bound wait function - wraps waitForTextOrCancel with tracker already applied */
export type WaitFn = (prompt: string) => Promise<string | null>

/** Result of National ID parsing */
export interface NationalIdInfo {
  nationalId: string
  birthDate?: Date
  gender?: 'MALE' | 'FEMALE'
}

// ---------------------------------------------------------------------------
// Digit Normalization
// ---------------------------------------------------------------------------

/**
 * Normalizes Arabic-Indic digits (\u0660-\u0669) and Extended Arabic-Indic
 * digits (\u06F0-\u06F9) to standard ASCII digits (0-9).
 *
 * This allows users to type numbers in Arabic on their keyboard and have
 * them accepted everywhere in the bot.
 *
 * @param input - Raw user input string
 * @returns String with all Arabic/Persian digits replaced by ASCII digits
 *
 * @example
 * normalizeDigits('\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669') // '0123456789'
 * normalizeDigits('01\u0662\u0663\u0664\u0665\u0666\u06f7\u06f8\u06f9')           // '0123456789'
 * normalizeDigits('hello 123')                                                      // 'hello 123'
 */
export function normalizeDigits(input: string): string {
  return input
    .replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x06F0))
}

// ---------------------------------------------------------------------------
// Name
// ---------------------------------------------------------------------------

/**
 * Prompts for a full Arabic name and validates it.
 * Rules: Arabic letters only, min 2 chars.
 * Returns '' on cancel.
 *
 * @example
 * const fullName = await askForArabicName(ctx, wait)
 * if (!fullName) return // cancelled
 */
export async function askForArabicName(ctx: BotContext, wait: WaitFn): Promise<string> {
  const arabicNameRegex = /^[\p{sc=Arabic}\s.,'-]+$/u
  while (true) {
    const text = await wait(ctx.t('join-step-name'))
    if (text === null)
      return ''
    if (!text) { await ctx.reply(ctx.t('error-required-field')); continue }
    if (!arabicNameRegex.test(text)) { await ctx.reply(ctx.t('error-invalid-arabic-name')); continue }
    if (text.length < 2) { await ctx.reply(ctx.t('error-name-too-short')); continue }
    return text
  }
}

// ---------------------------------------------------------------------------
// Nickname
// ---------------------------------------------------------------------------

/**
 * Derives a display nickname from a full Arabic name.
 * Takes the first two "name units", respecting compound prefixes.
 *
 * Compound prefixes:
 * \u0639\u0628\u062f (Abd), \u0639\u0628\u062f\u0647 (Abdeh), \u0623\u0628\u0648/\u0627\u0628\u0648 (Abu), \u0623\u0628\u064a/\u0627\u0628\u064a (Abi), \u0627\u0628\u0646 (Ibn), \u0628\u0646\u062a (Bint), \u0622\u0644 (Al)
 *
 * Examples:
 *   \u0635\u0627\u0644\u062d \u0631\u062c\u0628 \u0645\u062d\u0645\u062f \u0639\u062b\u0645\u0627\u0646  ->  \u0635\u0627\u0644\u062d \u0631\u062c\u0628
 *   \u0639\u0628\u062f \u0627\u0644\u0644\u0647 \u0623\u062d\u0645\u062f        ->  \u0639\u0628\u062f \u0627\u0644\u0644\u0647
 *   \u0623\u0628\u0648 \u0628\u0643\u0631 \u062d\u0633\u064a\u0646         ->  \u0623\u0628\u0648 \u0628\u0643\u0631
 *   \u0639\u0628\u062f \u0627\u0644\u0644\u0647 \u0639\u0628\u062f \u0627\u0644\u0631\u062d\u0645\u0646  ->  \u0639\u0628\u062f \u0627\u0644\u0644\u0647
 */
export function generateNickname(fullName: string): string {
  const COMPOUND_PREFIXES = [
    '\u0639\u0628\u062F',
    '\u0639\u0628\u062F\u0647',
    '\u0623\u0628\u0648',
    '\u0627\u0628\u0648',
    '\u0623\u0628\u064A',
    '\u0627\u0628\u064A',
    '\u0627\u0628\u0646',
    '\u0628\u0646\u062A',
    '\u0622\u0644',
  ]
  const parts = fullName.trim().split(/\s+/)
  const result: string[] = []
  let i = 0
  while (i < parts.length && result.length < 2) {
    const part = parts[i]
    if (COMPOUND_PREFIXES.includes(part) && i + 1 < parts.length) {
      result.push(`${part} ${parts[i + 1]}`)
      i += 2
    }
    else {
      result.push(part)
      i++
    }
  }
  return result.join(' ')
}

// ---------------------------------------------------------------------------
// Phone
// ---------------------------------------------------------------------------

/**
 * Prompts for an Egyptian phone number and validates it.
 * Accepts Arabic or English digits — normalizes to ASCII before validation.
 * Rules: 11 digits, starts with 010/011/012/015, not already in DB.
 * Returns '' on cancel.
 *
 * @example
 * const phone = await askForPhone(ctx, wait)
 * if (!phone) return // cancelled
 */
export async function askForPhone(ctx: BotContext, wait: WaitFn): Promise<string> {
  while (true) {
    const raw = await wait(ctx.t('join-step-phone'))
    if (raw === null)
      return ''
    if (!raw) { await ctx.reply(ctx.t('error-required-field')); continue }
    const text = normalizeDigits(raw)
    const validation = egyptianPhoneNumber().safeParse(text)
    if (!validation.success) { await ctx.reply(ctx.t('error-invalid-phone')); continue }
    const exists = await prisma.user.findUnique({ where: { phone: validation.data } })
    if (exists) { await ctx.reply(ctx.t('error-phone-exists')); continue }
    return validation.data
  }
}

// ---------------------------------------------------------------------------
// National ID
// ---------------------------------------------------------------------------

/**
 * Prompts for an Egyptian National ID and validates it.
 * Accepts Arabic or English digits — normalizes to ASCII before validation.
 * Auto-extracts birth date and gender from the ID.
 * Rules: 14 digits, valid format, not already in DB.
 * Returns null on cancel.
 *
 * @example
 * const result = await askForNationalId(ctx, wait)
 * if (!result) return // cancelled
 * const { nationalId, birthDate, gender } = result
 */
export async function askForNationalId(ctx: BotContext, wait: WaitFn): Promise<NationalIdInfo | null> {
  while (true) {
    const raw = await wait(ctx.t('join-step-national-id'))
    if (raw === null)
      return null
    if (!raw) { await ctx.reply(ctx.t('error-required-field')); continue }
    const text = normalizeDigits(raw)
    const validation = egyptianNationalId().safeParse(text)
    if (!validation.success) { await ctx.reply(ctx.t('error-invalid-national-id')); continue }
    const exists = await prisma.user.findUnique({ where: { nationalId: validation.data } })
    if (exists) { await ctx.reply(ctx.t('error-national-id-exists')); continue }
    const { birthDate, gender } = extractEgyptianNationalIdInfo(validation.data)
    return { nationalId: validation.data, birthDate, gender }
  }
}
