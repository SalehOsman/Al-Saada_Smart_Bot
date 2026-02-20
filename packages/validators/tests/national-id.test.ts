import { describe, it, expect } from 'vitest';
import { egyptianNationalId } from '../src/national-id';

describe('egyptianNationalId', () => {
  // Valid ID: 29901010100018 (Male, born 1999-01-01 in Cairo, Checksum 8)
  it('should validate a correct 14-digit national ID', () => {
    const result = egyptianNationalId().safeParse('29901010100018');
    expect(result.success).toBe(true);
  });

  // Valid ID: 30302010100020 (Female, born 2003-02-01 in Cairo, Checksum 0)
  it('should validate a correct national ID for a person born in the 21st century', () => {
    const result = egyptianNationalId().safeParse('30302010100020');
    expect(result.success).toBe(true);
  });

  it('should fail for a national ID with less than 14 digits', () => {
    const result = egyptianNationalId().safeParse('2990101010001');
    expect(result.success).toBe(false);
  });

  it('should fail for a national ID with more than 14 digits', () => {
    const result = egyptianNationalId().safeParse('299010101000134');
    expect(result.success).toBe(false);
  });

  it('should fail for a national ID with non-digit characters', () => {
    const result = egyptianNationalId().safeParse('2990101010001a');
    expect(result.success).toBe(false);
  });

  it('should fail for an invalid century identifier', () => {
    const result = egyptianNationalId().safeParse('19901010100013');
    expect(result.success).toBe(false);
  });

  it('should fail for an invalid birth month (e.g., 13)', () => {
    const result = egyptianNationalId().safeParse('29913010100013');
    expect(result.success).toBe(false);
  });

  it('should fail for an invalid birth day (e.g., 32)', () => {
    const result = egyptianNationalId().safeParse('29901320100013');
    expect(result.success).toBe(false);
  });

  it('should fail for an invalid governorate code (e.g., 00)', () => {
    const result = egyptianNationalId().safeParse('29901010000013');
    expect(result.success).toBe(false);
  });

  it('should fail for an invalid governorate code (e.g., > 35 and < 88)', () => {
    const result = egyptianNationalId().safeParse('29901014000013');
    expect(result.success).toBe(false);
  });

  it('should trim whitespace and still validate correctly', () => {
    const result = egyptianNationalId().safeParse('  29901010100018  ');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('29901010100018');
    }
  });

  it('should fail for an empty string', () => {
    const result = egyptianNationalId().safeParse('');
    expect(result.success).toBe(false);
  });

  it('should fail for a null value', () => {
    const result = egyptianNationalId().safeParse(null);
    expect(result.success).toBe(false);
  });

  it('should fail for an undefined value', () => {
    const result = egyptianNationalId().safeParse(undefined);
    expect(result.success).toBe(false);
  });

  it('should fail for a national ID with an invalid checksum', () => {
    const result = egyptianNationalId().safeParse('29901010100014');
    expect(result.success).toBe(false);
  });
});
