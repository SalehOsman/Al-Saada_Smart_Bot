/**
 * PII (Personally Identifiable Information) Filter Utility
 *
 * This utility provides functions to mask or remove sensitive information
 * from logs and error reports before sending them to external services like Sentry.
 */

/**
 * Regular expressions for common Egyptian PII patterns
 */
export const PII_PATTERNS = {
  // Egyptian Phone Numbers (e.g., +201234567890, 01234567890)
  PHONE: /(\+20|0)?1[0125]\d{8}/g,

  // Egyptian National ID (14 digits)
  NATIONAL_ID: /\b\d{14}\b/g,

  // Email addresses
  EMAIL: /[\w.%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi,
}

/**
 * Mask sensitive data in a string
 *
 * @param text The text to filter
 * @returns Filtered text with sensitive data masked
 */
export function maskPII(text: string): string {
  if (!text)
    return text

  let filtered = text

  // Mask National ID (keep first 3 digits)
  filtered = filtered.replace(PII_PATTERNS.NATIONAL_ID, (match) => {
    return `${match.slice(0, 3)}***********`
  })

  // Mask phone numbers (keep first 4 digits)
  filtered = filtered.replace(PII_PATTERNS.PHONE, (match) => {
    return `${match.slice(0, 4)}*******`
  })

  // Mask Email (keep first 2 chars and domain)
  filtered = filtered.replace(PII_PATTERNS.EMAIL, (match) => {
    const [user, domain] = match.split('@')
    return `${user.slice(0, 2)}***@${domain}`
  })

  return filtered
}

/**
 * Deeply filter PII from an object or array
 *
 * @param data The data object to filter
 * @returns A new object with all PII masked
 */
export function filterPIIObject<T>(data: T): T {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data === 'string') {
    return maskPII(data) as unknown as T
  }

  if (Array.isArray(data)) {
    return data.map(item => filterPIIObject(item)) as unknown as T
  }

  if (typeof data === 'object') {
    const result: Record<string, any> = {}

    // List of keys that are known to contain PII
    const piiKeys = ['phone', 'nationalId', 'fullName', 'nickname', 'email', 'address']

    for (const [key, value] of Object.entries(data)) {
      if (piiKeys.includes(key) && typeof value === 'string') {
        result[key] = maskPII(value)
      }
      else {
        result[key] = filterPIIObject(value)
      }
    }

    return result as T
  }

  return data
}
