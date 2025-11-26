import { z } from 'zod';

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
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least 1 number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least 1 special character'),
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
  rememberMe: z.boolean().default(false),
});

export type LoginFormData = z.infer<typeof loginSchema>;
