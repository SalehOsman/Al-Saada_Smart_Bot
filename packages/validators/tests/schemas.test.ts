import { describe, it, expect } from 'vitest'
import { stringSchema, phoneSchema, nationalIdSchema } from '../src/schemas'

describe('Zod Schemas', () => {
  describe('stringSchema', () => {
    it('should trim strings', () => {
      expect(stringSchema.parse('  hello  ')).toBe('hello')
    })
  })

  describe('phoneSchema', () => {
    it('should validate Egyptian phone numbers', () => {
      expect(phoneSchema.parse('01012345678')).toBe('01012345678')
      expect(phoneSchema.parse('  01112345678  ')).toBe('01112345678')
    })

    it('should reject invalid phone numbers', () => {
      expect(() => phoneSchema.parse('12345678901')).toThrow()
      expect(() => phoneSchema.parse('0121234567')).toThrow() // too short
    })
  })

  describe('nationalIdSchema', () => {
    it('should validate basic National ID format', () => {
      // Just basic regex check in schemas.ts (trimmed)
      expect(nationalIdSchema.parse('29001010123456')).toBe('29001010123456')
    })

    it('should reject invalid National ID format', () => {
      expect(() => nationalIdSchema.parse('19001010123456')).toThrow() // starts with 1
      expect(() => nationalIdSchema.parse('2900101012345')).toThrow() // too short
    })
  })
})
