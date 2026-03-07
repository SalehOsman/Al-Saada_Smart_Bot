import { z } from 'zod'
import { EGYPTIAN_PHONE_REGEX } from './phone'
import { EGYPTIAN_NATIONAL_ID_REGEX } from './national-id'

/**
 * Basic Zod schemas for system-wide validation (T083)
 */

// Basic string schema with trimming
export const stringSchema = z.string().trim()

// Basic Egyptian phone number schema (regex only)
export const phoneSchema = z.string().trim().regex(EGYPTIAN_PHONE_REGEX, {
  message: 'Invalid Egyptian phone number format.',
})

// Basic Egyptian National ID schema (regex only)
export const nationalIdSchema = z.string().trim().regex(EGYPTIAN_NATIONAL_ID_REGEX, {
  message: 'ID must be 14 digits and start with 2 or 3.',
})
