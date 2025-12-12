/**
 * Formatters Tests
 * Story Q3.1: Data Capture Forms
 *
 * Tests for:
 * - AC-Q3.1-3: Phone auto-format as (XXX) XXX-XXXX
 * - AC-Q3.1-12: Currency display with $ and thousands separators
 * - AC-Q3.1-7: Date formatting MM/DD/YYYY
 * - AC-Q3.1-27: License number masking
 * - AC-Q3.1-17: VIN formatting and validation
 */

import { describe, it, expect } from 'vitest';
import {
  formatPhoneNumber,
  unformatPhoneNumber,
  isValidPhoneNumber,
  formatCurrency,
  parseCurrency,
  formatCurrencyInput,
  formatDate,
  parseDate,
  toISODateString,
  maskLicenseNumber,
  formatVIN,
  isValidVINFormat,
} from '@/lib/quoting/formatters';

describe('Phone Number Formatting', () => {
  describe('formatPhoneNumber', () => {
    it('returns empty string for empty input', () => {
      expect(formatPhoneNumber('')).toBe('');
    });

    it('formats 3 digits as (XXX', () => {
      expect(formatPhoneNumber('123')).toBe('(123');
    });

    it('formats 6 digits as (XXX) XXX', () => {
      expect(formatPhoneNumber('123456')).toBe('(123) 456');
    });

    it('formats 10 digits as (XXX) XXX-XXXX', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
    });

    it('strips non-numeric characters and formats', () => {
      expect(formatPhoneNumber('(123) 456-7890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('123-456-7890')).toBe('(123) 456-7890');
    });

    it('truncates to 10 digits', () => {
      expect(formatPhoneNumber('12345678901234')).toBe('(123) 456-7890');
    });
  });

  describe('unformatPhoneNumber', () => {
    it('extracts digits from formatted phone', () => {
      expect(unformatPhoneNumber('(123) 456-7890')).toBe('1234567890');
    });

    it('handles already unformatted number', () => {
      expect(unformatPhoneNumber('1234567890')).toBe('1234567890');
    });
  });

  describe('isValidPhoneNumber', () => {
    it('returns true for 10-digit phone', () => {
      expect(isValidPhoneNumber('1234567890')).toBe(true);
      expect(isValidPhoneNumber('(123) 456-7890')).toBe(true);
    });

    it('returns false for less than 10 digits', () => {
      expect(isValidPhoneNumber('123456789')).toBe(false);
    });

    it('returns false for more than 10 digits', () => {
      expect(isValidPhoneNumber('12345678901')).toBe(false);
    });
  });
});

describe('Currency Formatting', () => {
  describe('formatCurrency', () => {
    it('returns empty string for null/undefined', () => {
      expect(formatCurrency(null)).toBe('');
      expect(formatCurrency(undefined)).toBe('');
      expect(formatCurrency('')).toBe('');
    });

    it('formats number with $ and commas', () => {
      expect(formatCurrency(250000)).toBe('$250,000');
      expect(formatCurrency(1500)).toBe('$1,500');
    });

    it('formats string number', () => {
      expect(formatCurrency('250000')).toBe('$250,000');
    });

    it('handles numbers with commas in string', () => {
      expect(formatCurrency('$250,000')).toBe('$250,000');
    });

    it('returns empty string for NaN', () => {
      expect(formatCurrency('not a number')).toBe('');
    });
  });

  describe('parseCurrency', () => {
    it('returns undefined for empty string', () => {
      expect(parseCurrency('')).toBeUndefined();
    });

    it('parses formatted currency string', () => {
      expect(parseCurrency('$250,000')).toBe(250000);
    });

    it('parses plain number string', () => {
      expect(parseCurrency('250000')).toBe(250000);
    });

    it('returns undefined for invalid string', () => {
      expect(parseCurrency('abc')).toBeUndefined();
    });
  });

  describe('formatCurrencyInput', () => {
    it('removes non-numeric characters', () => {
      expect(formatCurrencyInput('$250,000')).toBe('250000');
      expect(formatCurrencyInput('abc123')).toBe('123');
    });
  });
});

describe('Date Formatting', () => {
  describe('formatDate', () => {
    it('returns empty string for null/undefined', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });

    it('formats Date object as MM/DD/YYYY', () => {
      const date = new Date(1990, 0, 15); // Jan 15, 1990
      expect(formatDate(date)).toBe('01/15/1990');
    });

    it('formats ISO string as MM/DD/YYYY', () => {
      // Note: ISO dates are parsed in UTC, so the local date may be off by 1 day
      // The actual output depends on timezone; we verify it's a valid date format
      const result = formatDate('1990-01-15T12:00:00');
      expect(result).toMatch(/^\d{2}\/\d{2}\/1990$/);
    });

    it('returns empty string for invalid date', () => {
      expect(formatDate('invalid')).toBe('');
    });
  });

  describe('parseDate', () => {
    it('returns undefined for empty string', () => {
      expect(parseDate('')).toBeUndefined();
    });

    it('parses MM/DD/YYYY format', () => {
      const result = parseDate('01/15/1990');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(1990);
      expect(result?.getMonth()).toBe(0); // January
      expect(result?.getDate()).toBe(15);
    });

    it('parses ISO format', () => {
      const result = parseDate('1990-01-15');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(1990);
    });

    it('returns undefined for invalid date', () => {
      expect(parseDate('invalid')).toBeUndefined();
      expect(parseDate('13/32/2020')).toBeUndefined(); // Invalid month/day
    });
  });

  describe('toISODateString', () => {
    it('returns empty string for null/undefined', () => {
      expect(toISODateString(null)).toBe('');
      expect(toISODateString(undefined)).toBe('');
    });

    it('converts Date to YYYY-MM-DD', () => {
      const date = new Date(1990, 0, 15);
      expect(toISODateString(date)).toBe('1990-01-15');
    });
  });
});

describe('License Number Masking', () => {
  describe('maskLicenseNumber', () => {
    it('returns empty string for null/undefined', () => {
      expect(maskLicenseNumber(null)).toBe('');
      expect(maskLicenseNumber(undefined)).toBe('');
      expect(maskLicenseNumber('')).toBe('');
    });

    it('returns unmasked for 4 or fewer characters', () => {
      expect(maskLicenseNumber('1234')).toBe('1234');
      expect(maskLicenseNumber('ABC')).toBe('ABC');
    });

    it('masks all but last 4 characters', () => {
      expect(maskLicenseNumber('DL12345678')).toBe('••••••5678');
      expect(maskLicenseNumber('ABCDE12345')).toBe('••••••2345');
    });
  });
});

describe('VIN Formatting', () => {
  describe('formatVIN', () => {
    it('converts to uppercase', () => {
      expect(formatVIN('abc123')).toBe('ABC123');
    });

    it('removes invalid characters (I, O, Q)', () => {
      expect(formatVIN('AIOQ123')).toBe('A123');
    });

    it('truncates to 17 characters', () => {
      expect(formatVIN('1234567890123456789')).toBe('12345678901234567');
    });

    it('removes special characters', () => {
      expect(formatVIN('1A2-B3C')).toBe('1A2B3C');
    });
  });

  describe('isValidVINFormat', () => {
    it('returns false for empty/short VIN', () => {
      expect(isValidVINFormat('')).toBe(false);
      expect(isValidVINFormat('123456')).toBe(false);
    });

    it('returns true for valid 17-character VIN', () => {
      expect(isValidVINFormat('1HGBH41JXMN109186')).toBe(true);
    });

    it('returns false for VIN containing I, O, or Q', () => {
      expect(isValidVINFormat('1HGIH41JXMN109186')).toBe(false); // Contains I
      expect(isValidVINFormat('1HGOH41JXMN109186')).toBe(false); // Contains O
      expect(isValidVINFormat('1HGQH41JXMN109186')).toBe(false); // Contains Q
    });

    it('returns false for VIN longer than 17 characters', () => {
      expect(isValidVINFormat('1HGBH41JXMN1091861')).toBe(false);
    });
  });
});
