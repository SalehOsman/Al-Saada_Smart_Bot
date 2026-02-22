import { z } from 'zod'

const EGYPTIAN_PHONE_REGEX = /^(010|011|012|015)\d{8}$/

/**
 * Creates a Zod schema for validating an Egyptian phone number.
 *
 * The schema first preprocesses the input by trimming whitespace. It then
 * validates that the input is a string that matches the Egyptian phone number
 * format (11 digits starting with 010, 011, 012, or 015).
 *
 * @returns A Zod schema for an Egyptian phone number.
 */
export function egyptianPhoneNumber() {
  return z.preprocess((val) => {
    if (typeof val === 'string') {
      return val.trim()
    }
    return val
  }, z.string().regex(EGYPTIAN_PHONE_REGEX, {
    message: 'Invalid Egyptian phone number format.',
  }))
}
