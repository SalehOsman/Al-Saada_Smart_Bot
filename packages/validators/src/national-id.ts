import { z } from 'zod';

const EGYPTIAN_NATIONAL_ID_REGEX = /^(2|3)\d{13}$/;

// Governorate codes in Egypt as of the last update.
// Note: Codes 01-35 are for governorates, and 88 is for foreigners.
const VALID_GOVERNORATE_CODES = [
  '01', '02', '03', '04', '11', '12', '13', '14', '15', '16', '17', '18',
  '19', '21', '22', '23', '24', '25', '26', '27', '28', '29', '31', '32',
  '33', '34', '35', '88',
];

/**
 * Validates the checksum of an Egyptian National ID.
 * The 14th digit is a checksum calculated from the first 13 digits using Modulus 11.
 */
const isValidChecksum = (id: string): boolean => {
  const weights = [2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  
  for (let i = 0; i < 13; i++) {
    sum += parseInt(id.charAt(i), 10) * weights[i];
  }
  
  const remainder = sum % 11;
  const checkDigit = (11 - remainder) % 11;
  const actualCheckDigit = parseInt(id.charAt(13), 10);
  
  // The official check digit can sometimes deviate in edge cases (e.g. 1 instead of 0),
  // but this covers the standard Modulus 11 implementation.
  // Note: We skip exact strictness if checkDigit is 10 as it's an anomaly, but we'll enforce the calculation standardly.
  return checkDigit === actualCheckDigit;
};

/**
 * Creates a Zod schema for validating an Egyptian National ID.
 *
 * The validation process includes:
 * 1. Preprocessing to trim whitespace.
 * 2. A regex check for the basic 14-digit format and century code.
 * 3. A refinement to validate the birth date extracted from the ID.
 * 4. A refinement to check if the governorate code is valid.
 * 5. A refinement to verify the checksum digit.
 *
 * @returns A Zod schema for an Egyptian National ID.
 */
export const egyptianNationalId = () =>
  z
    .preprocess((val) => {
      if (typeof val === 'string') {
        return val.trim();
      }
      return val;
    }, z.string().regex(EGYPTIAN_NATIONAL_ID_REGEX, {
      message: 'ID must be 14 digits and start with 2 or 3.',
    }))
    .refine(
      (id) => {
        const yearPrefix = id.startsWith('2') ? '19' : '20';
        const year = parseInt(yearPrefix + id.substring(1, 3), 10);
        const month = parseInt(id.substring(3, 5), 10) - 1; // Month is 0-indexed
        const day = parseInt(id.substring(5, 7), 10);

        const date = new Date(year, month, day);

        // Check if the parsed date is valid and matches the input values
        return (
          date.getFullYear() === year &&
          date.getMonth() === month &&
          date.getDate() === day
        );
      },
      { message: 'Invalid birth date in National ID.' },
    )
    .refine(
      (id) => {
        const governorateCode = id.substring(7, 9);
        return VALID_GOVERNORATE_CODES.includes(governorateCode);
      },
      { message: 'Invalid governorate code in National ID.' },
    )
    .refine(isValidChecksum, { message: 'Invalid checksum in National ID.' });
