/**
 * Tests for profile validation schema
 * Tests AC-2.6.2
 */
import { describe, it, expect } from 'vitest';
import { profileSchema } from '@/lib/validations/auth';

describe('profileSchema', () => {
  describe('fullName validation (AC-2.6.2)', () => {
    it('rejects empty string', () => {
      const result = profileSchema.safeParse({ fullName: '' });
      expect(result.success).toBe(false);
    });

    it('rejects single character', () => {
      const result = profileSchema.safeParse({ fullName: 'A' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name must be at least 2 characters');
      }
    });

    it('accepts exactly 2 characters (minimum)', () => {
      const result = profileSchema.safeParse({ fullName: 'Jo' });
      expect(result.success).toBe(true);
    });

    it('accepts 50 characters', () => {
      const result = profileSchema.safeParse({ fullName: 'A'.repeat(50) });
      expect(result.success).toBe(true);
    });

    it('accepts exactly 100 characters (maximum)', () => {
      const result = profileSchema.safeParse({ fullName: 'A'.repeat(100) });
      expect(result.success).toBe(true);
    });

    it('rejects 101 characters', () => {
      const result = profileSchema.safeParse({ fullName: 'A'.repeat(101) });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name must be at most 100 characters');
      }
    });

    it('accepts typical full names', () => {
      const validNames = [
        'John Doe',
        'Mary Jane Watson',
        'Dr. James Smith Jr.',
        "O'Connor",
        'Jean-Pierre',
      ];

      validNames.forEach((name) => {
        const result = profileSchema.safeParse({ fullName: name });
        expect(result.success).toBe(true);
      });
    });
  });
});
