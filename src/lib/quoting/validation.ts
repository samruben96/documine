/**
 * Quoting Validation Schemas
 * Story Q3.1: Data Capture Forms
 * Story Q3.3: Field Validation & Formatting
 *
 * Zod schemas for form validation
 * Used with react-hook-form via @hookform/resolvers/zod
 *
 * Validation Functions (Q3.3):
 * - validateVin: VIN format validation (17 chars, no I/O/Q)
 * - validateZipCode: ZIP code format (5-digit or ZIP+4)
 * - validateEmail: Email format validation
 * - validatePhone: Phone number validation (10 digits)
 */

import { z } from 'zod';

// ============================================================================
// VALIDATION RESULT INTERFACE (AC-Q3.3: Task 1.6)
// ============================================================================

/**
 * Result of field validation
 * AC-Q3.3-11: Used to provide inline error messages
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ============================================================================
// VALIDATION FUNCTIONS (AC-Q3.3: Tasks 1.1-1.5)
// ============================================================================

/**
 * VIN Validation Regex
 * AC-Q3.3-1, AC-Q3.3-2: 17 alphanumeric characters, excluding I, O, Q
 */
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

/**
 * ZIP Code Validation Regex
 * AC-Q3.3-6, AC-Q3.3-7: 5 digits or ZIP+4 format
 */
const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

/**
 * Email Validation Regex (RFC 5322 simplified)
 * AC-Q3.3-9, AC-Q3.3-10: Standard email format
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate VIN format
 * AC-Q3.3-1: Valid VIN shows green checkmark
 * AC-Q3.3-2: Invalid VIN shows inline error
 * AC-Q3.3-3: Auto-uppercase handled by formatVIN in formatters.ts
 *
 * @param vin - VIN string to validate
 * @returns ValidationResult with valid status and optional error message
 */
export function validateVin(vin: string): ValidationResult {
  if (!vin || vin.trim() === '') {
    return { valid: true }; // Empty is valid (optional field)
  }

  const upperVin = vin.toUpperCase();

  if (upperVin.length !== 17) {
    return {
      valid: false,
      error: 'VIN must be exactly 17 characters',
    };
  }

  // Check for invalid characters (I, O, Q)
  if (/[IOQ]/i.test(vin)) {
    return {
      valid: false,
      error: 'VIN cannot contain letters I, O, or Q',
    };
  }

  if (!VIN_REGEX.test(upperVin)) {
    return {
      valid: false,
      error: 'Invalid VIN format',
    };
  }

  return { valid: true };
}

/**
 * Validate ZIP code format
 * AC-Q3.3-6: 5-digit or ZIP+4 format is valid
 * AC-Q3.3-7: Invalid format shows inline error
 *
 * @param zipCode - ZIP code string to validate
 * @returns ValidationResult with valid status and optional error message
 */
export function validateZipCode(zipCode: string): ValidationResult {
  if (!zipCode || zipCode.trim() === '') {
    return { valid: true }; // Empty handled by required validation
  }

  if (!ZIP_REGEX.test(zipCode)) {
    return {
      valid: false,
      error: 'Invalid ZIP code',
    };
  }

  return { valid: true };
}

/**
 * Validate email format
 * AC-Q3.3-9: Valid email shows no error
 * AC-Q3.3-10: Invalid email shows inline error
 *
 * @param email - Email string to validate
 * @returns ValidationResult with valid status and optional error message
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return { valid: true }; // Empty handled by required validation
  }

  if (!EMAIL_REGEX.test(email)) {
    return {
      valid: false,
      error: 'Invalid email address',
    };
  }

  return { valid: true };
}

/**
 * Validate phone number (10 digits)
 * AC-Q3.3-17, AC-Q3.3-18: Phone auto-formats as (XXX) XXX-XXXX
 * AC-Q3.3-19: Fewer than 10 digits shows inline error
 *
 * @param phone - Phone string to validate (formatted or raw)
 * @returns ValidationResult with valid status and optional error message
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone || phone.trim() === '') {
    return { valid: true }; // Empty handled by required validation
  }

  // Extract only digits
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 0) {
    return { valid: true }; // Empty handled by required validation
  }

  if (digits.length !== 10) {
    return {
      valid: false,
      error: 'Phone must be 10 digits',
    };
  }

  return { valid: true };
}
import {
  US_STATES,
  CONSTRUCTION_TYPES,
  ROOF_TYPES,
  VEHICLE_USAGE_OPTIONS,
  DRIVER_RELATIONSHIP_OPTIONS,
  BODILY_INJURY_OPTIONS,
  PROPERTY_DAMAGE_OPTIONS,
  AUTO_DEDUCTIBLE_OPTIONS,
  LIABILITY_COVERAGE_OPTIONS,
  PROPERTY_DEDUCTIBLE_OPTIONS,
  MIN_YEARS_LICENSED,
  MAX_YEARS_LICENSED,
  MIN_INCIDENTS,
  MAX_INCIDENTS,
} from './constants';

/**
 * Address Schema
 * Used in Client Info and Property tabs
 */
export const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.enum(
    US_STATES.map((s) => s.value) as [string, ...string[]],
    { message: 'Please select a state' }
  ),
  zipCode: z
    .string()
    .min(5, 'ZIP code must be 5 digits')
    .max(10, 'ZIP code is too long')
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
});

export type AddressFormData = z.infer<typeof addressSchema>;

/**
 * Partial Address Schema (for optional fields)
 */
export const partialAddressSchema = z.object({
  street: z.string().optional().default(''),
  city: z.string().optional().default(''),
  state: z.string().optional().default(''),
  zipCode: z.string().optional().default(''),
});

/**
 * Personal Info Schema
 * AC-Q3.1-1: All required fields for Client Info tab
 */
export const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .refine(
      (val) => val.replace(/\D/g, '').length === 10,
      'Phone must be 10 digits'
    ),
  mailingAddress: addressSchema,
});

export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

/**
 * Property Info Schema
 * AC-Q3.1-10, AC-Q3.1-11, AC-Q3.1-13: Property tab fields
 */
export const propertyInfoSchema = z.object({
  sameAsMailingAddress: z.boolean().default(false),
  address: addressSchema,
  yearBuilt: z
    .number({ error: (issue) => issue.input === undefined ? 'Year built is required' : 'Must be a number' })
    .min(1800, 'Year must be 1800 or later')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
  squareFootage: z
    .number({ error: (issue) => issue.input === undefined ? 'Square footage is required' : 'Must be a number' })
    .min(100, 'Must be at least 100 sq ft')
    .max(50000, 'Maximum 50,000 sq ft'),
  constructionType: z.enum(
    CONSTRUCTION_TYPES.map((c) => c.value) as [string, ...string[]],
    { message: 'Please select construction type' }
  ),
  roofType: z.enum(
    ROOF_TYPES.map((r) => r.value) as [string, ...string[]],
    { message: 'Please select roof type' }
  ),
  roofYear: z
    .number({ error: (issue) => issue.input === undefined ? 'Roof year is required' : 'Must be a number' })
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
  dwellingCoverage: z
    .number({ error: (issue) => issue.input === undefined ? 'Dwelling coverage is required' : 'Must be a number' })
    .min(50000, 'Minimum $50,000')
    .max(10000000, 'Maximum $10,000,000'),
  liabilityCoverage: z.enum(
    LIABILITY_COVERAGE_OPTIONS.map((l) => l.value) as [string, ...string[]],
    { message: 'Please select liability coverage' }
  ),
  deductible: z.enum(
    PROPERTY_DEDUCTIBLE_OPTIONS.map((d) => d.value) as [string, ...string[]],
    { message: 'Please select deductible' }
  ),
  hasPool: z.boolean().default(false),
  hasTrampoline: z.boolean().default(false),
});

export type PropertyInfoFormData = z.infer<typeof propertyInfoSchema>;
export type PropertyInfoFormInput = z.input<typeof propertyInfoSchema>;

/**
 * Vehicle Schema
 * AC-Q3.1-16, AC-Q3.1-17: Vehicle entry fields
 */
export const vehicleSchema = z.object({
  id: z.string().optional(), // For tracking in arrays
  year: z
    .number({ error: (issue) => issue.input === undefined ? 'Year is required' : 'Must be a number' })
    .min(1990, 'Year must be 1990 or later')
    .max(new Date().getFullYear() + 1, 'Year cannot be more than 1 year in future'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  vin: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || /^[A-HJ-NPR-Z0-9]{17}$/.test(val),
      'VIN must be 17 characters (excluding I, O, Q)'
    ),
  usage: z.enum(
    VEHICLE_USAGE_OPTIONS.map((u) => u.value) as [string, ...string[]],
    { message: 'Please select usage' }
  ),
  annualMileage: z
    .number({ error: (issue) => issue.input === undefined ? 'Annual mileage is required' : 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(200000, 'Maximum 200,000 miles'),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;

/**
 * Auto Coverage Schema
 * AC-Q3.1-22: Auto coverage preferences (once per quote)
 */
export const autoCoverageSchema = z.object({
  bodilyInjuryLiability: z.enum(
    BODILY_INJURY_OPTIONS.map((b) => b.value) as [string, ...string[]],
    { message: 'Please select bodily injury limit' }
  ),
  propertyDamageLiability: z.enum(
    PROPERTY_DAMAGE_OPTIONS.map((p) => p.value) as [string, ...string[]],
    { message: 'Please select property damage limit' }
  ),
  comprehensiveDeductible: z.enum(
    AUTO_DEDUCTIBLE_OPTIONS.map((d) => d.value) as [string, ...string[]],
    { message: 'Please select comprehensive deductible' }
  ),
  collisionDeductible: z.enum(
    AUTO_DEDUCTIBLE_OPTIONS.map((d) => d.value) as [string, ...string[]],
    { message: 'Please select collision deductible' }
  ),
  uninsuredMotorist: z.boolean().optional().default(false),
});

export type AutoCoverageFormData = z.infer<typeof autoCoverageSchema>;

/**
 * Driver Schema
 * AC-Q3.1-25: Driver entry fields
 */
export const driverSchema = z.object({
  id: z.string().optional(), // For tracking in arrays
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseState: z.enum(
    US_STATES.map((s) => s.value) as [string, ...string[]],
    { message: 'Please select license state' }
  ),
  yearsLicensed: z
    .number({ error: (issue) => issue.input === undefined ? 'Years licensed is required' : 'Must be a number' })
    .min(MIN_YEARS_LICENSED, `Minimum ${MIN_YEARS_LICENSED}`)
    .max(MAX_YEARS_LICENSED, `Maximum ${MAX_YEARS_LICENSED}`),
  relationship: z.enum(
    DRIVER_RELATIONSHIP_OPTIONS.map((r) => r.value) as [string, ...string[]],
    { message: 'Please select relationship' }
  ),
  accidentsPast5Years: z
    .number()
    .min(MIN_INCIDENTS, `Minimum ${MIN_INCIDENTS}`)
    .max(MAX_INCIDENTS, `Maximum ${MAX_INCIDENTS}`)
    .optional()
    .default(0),
  violationsPast5Years: z
    .number()
    .min(MIN_INCIDENTS, `Minimum ${MIN_INCIDENTS}`)
    .max(MAX_INCIDENTS, `Maximum ${MAX_INCIDENTS}`)
    .optional()
    .default(0),
});

export type DriverFormData = z.infer<typeof driverSchema>;

/**
 * Combined Auto Tab Schema (vehicles + coverage)
 */
export const autoTabSchema = z.object({
  vehicles: z.array(vehicleSchema).max(6, 'Maximum 6 vehicles allowed'),
  coverage: autoCoverageSchema.optional(),
});

export type AutoTabFormData = z.infer<typeof autoTabSchema>;

/**
 * Drivers Tab Schema
 */
export const driversTabSchema = z.object({
  drivers: z.array(driverSchema).max(8, 'Maximum 8 drivers allowed'),
});

export type DriversTabFormData = z.infer<typeof driversTabSchema>;

/**
 * Full Client Data Schema (for complete validation)
 */
export const clientDataSchema = z.object({
  personal: personalInfoSchema.optional(),
  property: propertyInfoSchema.optional(),
  auto: z
    .object({
      vehicles: z.array(vehicleSchema).optional(),
      drivers: z.array(driverSchema).optional(),
      coverage: autoCoverageSchema.optional(),
    })
    .optional(),
});

export type ClientDataFormData = z.infer<typeof clientDataSchema>;
