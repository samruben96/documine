import { z } from 'zod';

/**
 * Password validation schema
 * Per AC-2.5.4 and Architecture Doc:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 * - At least 1 special character
 *
 * Extracted for reuse in signup and password reset flows.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least 1 number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least 1 special character');

/**
 * Signup form validation schema
 * Per AC-2.1.3:
 * - Full name: 2-100 characters
 * - Email: Valid email format (RFC 5322)
 * - Password: Min 8 chars, 1 uppercase, 1 number, 1 special character
 * - Agency name: 2-100 characters
 */
export const signupSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email: z
    .string()
    .email('Invalid email address'),
  password: passwordSchema,
  agencyName: z
    .string()
    .min(2, 'Agency name must be at least 2 characters')
    .max(100, 'Agency name must be at most 100 characters'),
});

export type SignupFormData = z.infer<typeof signupSchema>;

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Profile update validation schema
 * Per AC-2.6.2: Name must be 2-100 characters
 */
export const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

/**
 * Agency update validation schema
 * Per AC-3.1.2: Name must be 2-100 characters
 */
export const agencySchema = z.object({
  name: z
    .string()
    .min(2, 'Agency name must be at least 2 characters')
    .max(100, 'Agency name must be at most 100 characters'),
});

export type AgencyFormData = z.infer<typeof agencySchema>;

/**
 * Invite user validation schema
 * Per AC-3.2.1: Email field and role selector (Member/Admin)
 */
export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member']),
});

export type InviteUserFormData = z.infer<typeof inviteUserSchema>;
