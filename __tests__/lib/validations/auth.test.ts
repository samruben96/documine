import { describe, it, expect } from 'vitest';
import { signupSchema } from '@/lib/validations/auth';

describe('signupSchema', () => {
  describe('fullName validation', () => {
    it('rejects names shorter than 2 characters', () => {
      const result = signupSchema.safeParse({
        fullName: 'J',
        email: 'test@example.com',
        password: 'Password1!',
        agencyName: 'Test Agency',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name must be at least 2 characters');
      }
    });

    it('accepts names between 2-100 characters', () => {
      const result = signupSchema.safeParse({
        fullName: 'John Smith',
        email: 'test@example.com',
        password: 'Password1!',
        agencyName: 'Test Agency',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('email validation', () => {
    it('rejects invalid email format', () => {
      const result = signupSchema.safeParse({
        fullName: 'John Smith',
        email: 'not-an-email',
        password: 'Password1!',
        agencyName: 'Test Agency',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address');
      }
    });

    it('accepts valid email format', () => {
      const result = signupSchema.safeParse({
        fullName: 'John Smith',
        email: 'john@agency.com',
        password: 'Password1!',
        agencyName: 'Test Agency',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('password validation', () => {
    it('rejects passwords shorter than 8 characters', () => {
      const result = signupSchema.safeParse({
        fullName: 'John Smith',
        email: 'test@example.com',
        password: 'Pass1!',
        agencyName: 'Test Agency',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 8 characters');
      }
    });

    it('rejects passwords without uppercase', () => {
      const result = signupSchema.safeParse({
        fullName: 'John Smith',
        email: 'test@example.com',
        password: 'password1!',
        agencyName: 'Test Agency',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must contain at least 1 uppercase letter');
      }
    });

    it('rejects passwords without number', () => {
      const result = signupSchema.safeParse({
        fullName: 'John Smith',
        email: 'test@example.com',
        password: 'Password!',
        agencyName: 'Test Agency',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must contain at least 1 number');
      }
    });

    it('rejects passwords without special character', () => {
      const result = signupSchema.safeParse({
        fullName: 'John Smith',
        email: 'test@example.com',
        password: 'Password1',
        agencyName: 'Test Agency',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must contain at least 1 special character');
      }
    });

    it('accepts valid password with all requirements', () => {
      const result = signupSchema.safeParse({
        fullName: 'John Smith',
        email: 'test@example.com',
        password: 'Password1!',
        agencyName: 'Test Agency',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('agencyName validation', () => {
    it('rejects agency names shorter than 2 characters', () => {
      const result = signupSchema.safeParse({
        fullName: 'John Smith',
        email: 'test@example.com',
        password: 'Password1!',
        agencyName: 'A',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Agency name must be at least 2 characters');
      }
    });

    it('accepts valid agency names', () => {
      const result = signupSchema.safeParse({
        fullName: 'John Smith',
        email: 'test@example.com',
        password: 'Password1!',
        agencyName: 'Smith Insurance Agency',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('complete form validation', () => {
    it('accepts valid complete form data', () => {
      const validData = {
        fullName: 'John Smith',
        email: 'john@agency.com',
        password: 'SecurePass123!',
        agencyName: 'Smith Insurance Agency',
      };
      const result = signupSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });
  });
});
