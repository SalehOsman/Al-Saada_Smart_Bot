import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { egyptianPhoneNumber } from '../src/phone';

describe('egyptianPhoneNumber', () => {
  it('should validate a correct 11-digit mobile number (010)', () => {
    const result = egyptianPhoneNumber().safeParse('01012345678');
    expect(result.success).toBe(true);
  });

  it('should validate a correct 11-digit mobile number (011)', () => {
    const result = egyptianPhoneNumber().safeParse('01112345678');
    expect(result.success).toBe(true);
  });

  it('should validate a correct 11-digit mobile number (012)', () => {
    const result = egyptianPhoneNumber().safeParse('01212345678');
    expect(result.success).toBe(true);
  });

  it('should validate a correct 11-digit mobile number (015)', () => {
    const result = egyptianPhoneNumber().safeParse('01512345678');
    expect(result.success).toBe(true);
  });

  it('should fail validation for a number with incorrect prefix', () => {
    const result = egyptianPhoneNumber().safeParse('01312345678');
    expect(result.success).toBe(false);
  });

  it('should fail validation for a number with less than 11 digits', () => {
    const result = egyptianPhoneNumber().safeParse('0101234567');
    expect(result.success).toBe(false);
  });

  it('should fail validation for a number with more than 11 digits', () => {
    const result = egyptianPhoneNumber().safeParse('010123456789');
    expect(result.success).toBe(false);
  });

  it('should fail validation for a number with non-digit characters', () => {
    const result = egyptianPhoneNumber().safeParse('0101234567a');
    expect(result.success).toBe(false);
  });

  it('should trim whitespace and still validate correctly', () => {
    const result = egyptianPhoneNumber().safeParse('  01012345678  ');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('01012345678');
    }
  });

  it('should fail for an empty string', () => {
    const result = egyptianPhoneNumber().safeParse('');
    expect(result.success).toBe(false);
  });

  it('should fail for a null value', () => {
    const result = egyptianPhoneNumber().safeParse(null);
    expect(result.success).toBe(false);
  });

  it('should fail for an undefined value', () => {
    const result = egyptianPhoneNumber().safeParse(undefined);
    expect(result.success).toBe(false);
  });
});
