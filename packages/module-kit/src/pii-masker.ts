/**
 * PII masking utility for audit logs.
 * Detects fields named phone, nationalId, taxId (case-insensitive) and masks them.
 */
export function maskPII(data: Record<string, any>): Record<string, any> {
  const maskedData = { ...data }
  const piiFields = ['phone', 'nationalid', 'taxid']

  for (const key in maskedData) {
    if (piiFields.includes(key.toLowerCase())) {
      const value = String(maskedData[key])
      if (key.toLowerCase() === 'phone') {
        // Format: +20*******12 (show country code + last 2)
        if (value.startsWith('+20')) {
          maskedData[key] = `+20*******${value.slice(-2)}`
        }
        else if (value.length >= 11) {
          maskedData[key] = `${value.slice(0, 3)}*******${value.slice(-2)}`
        }
        else {
          maskedData[key] = '***MASKED***'
        }
      }
      else if (key.toLowerCase() === 'nationalid') {
        // Format: 299********* (show first 3)
        maskedData[key] = `${value.slice(0, 3)}***********`
      }
      else {
        maskedData[key] = '***MASKED***'
      }
    }
    else if (typeof maskedData[key] === 'object' && maskedData[key] !== null) {
      maskedData[key] = maskPII(maskedData[key])
    }
  }

  return maskedData
}
