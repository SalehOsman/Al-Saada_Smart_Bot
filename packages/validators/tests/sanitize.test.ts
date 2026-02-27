import { describe, it, expect } from 'vitest'
import { sanitizeHtml } from '../src/sanitize'

describe('sanitizeHtml', () => {
  it('should escape HTML characters', () => {
    const input = '<script>alert("XSS")</script> & "quoted"'
    const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt; &amp; &quot;quoted&quot;'
    expect(sanitizeHtml(input)).toBe(expected)
  })

  it('should escape single quotes', () => {
    const input = "I'm a string"
    const expected = 'I&#39;m a string'
    expect(sanitizeHtml(input)).toBe(expected)
  })

  it('should return empty string for null/undefined/empty input', () => {
    expect(sanitizeHtml('')).toBe('')
    // @ts-ignore
    expect(sanitizeHtml(null)).toBe('')
    // @ts-ignore
    expect(sanitizeHtml(undefined)).toBe('')
  })
})
