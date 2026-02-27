/**
 * Sanitizes a string by replacing HTML-sensitive characters with entities.
 * Prevents XSS when displaying user-provided content.
 * 
 * @param input The raw input string
 * @returns Sanitized string
 */
export function sanitizeHtml(input: string): string {
  if (!input) return ''
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
