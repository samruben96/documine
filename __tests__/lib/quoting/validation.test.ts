/**
 * Validation Schema Tests
 * Story Q3.1: Data Capture Forms
 *
 * Tests for Zod schemas used in form validation
 */

import { describe, it, expect } from 'vitest';
import {
  addressSchema,
  personalInfoSchema,
  propertyInfoSchema,
  vehicleSchema,
  driverSchema,
  autoCoverageSchema,
} from '@/lib/quoting/validation';

describe('addressSchema', () => {
  const validAddress = {
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
  };

  it('accepts valid address', () => {
    const result = addressSchema.safeParse(validAddress);
    expect(result.success).toBe(true);
  });

  it('rejects empty street', () => {
    const result = addressSchema.safeParse({ ...validAddress, street: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty city', () => {
    const result = addressSchema.safeParse({ ...validAddress, city: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid state', () => {
    const result = addressSchema.safeParse({ ...validAddress, state: 'XX' });
    expect(result.success).toBe(false);
  });

  it('accepts valid 5-digit ZIP code', () => {
    const result = addressSchema.safeParse({ ...validAddress, zipCode: '12345' });
    expect(result.success).toBe(true);
  });

  it('accepts valid 9-digit ZIP code', () => {
    const result = addressSchema.safeParse({ ...validAddress, zipCode: '12345-6789' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid ZIP code format', () => {
    const result = addressSchema.safeParse({ ...validAddress, zipCode: '1234' });
    expect(result.success).toBe(false);
  });
});

describe('personalInfoSchema', () => {
  const validPersonalInfo = {
    firstName: 'John',
    lastName: 'Smith',
    dateOfBirth: '1990-01-15',
    email: 'john@example.com',
    phone: '(123) 456-7890',
    mailingAddress: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
    },
  };

  it('accepts valid personal info', () => {
    const result = personalInfoSchema.safeParse(validPersonalInfo);
    expect(result.success).toBe(true);
  });

  it('rejects empty first name', () => {
    const result = personalInfoSchema.safeParse({ ...validPersonalInfo, firstName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty last name', () => {
    const result = personalInfoSchema.safeParse({ ...validPersonalInfo, lastName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = personalInfoSchema.safeParse({ ...validPersonalInfo, email: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid phone (not 10 digits)', () => {
    const result = personalInfoSchema.safeParse({ ...validPersonalInfo, phone: '123456' });
    expect(result.success).toBe(false);
  });
});

describe('propertyInfoSchema', () => {
  const validPropertyInfo = {
    sameAsMailingAddress: false,
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
    },
    yearBuilt: 2000,
    squareFootage: 2000,
    constructionType: 'frame',
    roofType: 'asphalt',
    roofYear: 2015,
    dwellingCoverage: 250000,
    liabilityCoverage: '300000',
    deductible: '1000',
    hasPool: false,
    hasTrampoline: false,
  };

  it('accepts valid property info', () => {
    const result = propertyInfoSchema.safeParse(validPropertyInfo);
    expect(result.success).toBe(true);
  });

  it('rejects year built before 1800', () => {
    const result = propertyInfoSchema.safeParse({ ...validPropertyInfo, yearBuilt: 1799 });
    expect(result.success).toBe(false);
  });

  it('rejects year built in the future', () => {
    const futureYear = new Date().getFullYear() + 2;
    const result = propertyInfoSchema.safeParse({ ...validPropertyInfo, yearBuilt: futureYear });
    expect(result.success).toBe(false);
  });

  it('rejects square footage under 100', () => {
    const result = propertyInfoSchema.safeParse({ ...validPropertyInfo, squareFootage: 50 });
    expect(result.success).toBe(false);
  });

  it('rejects dwelling coverage under $50,000', () => {
    const result = propertyInfoSchema.safeParse({ ...validPropertyInfo, dwellingCoverage: 40000 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid construction type', () => {
    const result = propertyInfoSchema.safeParse({ ...validPropertyInfo, constructionType: 'invalid' });
    expect(result.success).toBe(false);
  });
});

describe('vehicleSchema', () => {
  const validVehicle = {
    year: 2020,
    make: 'Toyota',
    model: 'Camry',
    usage: 'commute',
    annualMileage: 12000,
  };

  it('accepts valid vehicle', () => {
    const result = vehicleSchema.safeParse(validVehicle);
    expect(result.success).toBe(true);
  });

  it('accepts optional VIN', () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, vin: '' });
    expect(result.success).toBe(true);
  });

  it('validates VIN format if provided', () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, vin: '1HGBH41JXMN109186' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid VIN format', () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, vin: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('rejects vehicle year before 1990', () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, year: 1989 });
    expect(result.success).toBe(false);
  });

  it('rejects empty make', () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, make: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty model', () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, model: '' });
    expect(result.success).toBe(false);
  });

  it('rejects negative annual mileage', () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, annualMileage: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects annual mileage over 200,000', () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, annualMileage: 200001 });
    expect(result.success).toBe(false);
  });
});

describe('driverSchema', () => {
  const validDriver = {
    firstName: 'John',
    lastName: 'Smith',
    dateOfBirth: '1990-01-15',
    licenseNumber: 'DL123456',
    licenseState: 'CA',
    yearsLicensed: 10,
    relationship: 'self',
  };

  it('accepts valid driver', () => {
    const result = driverSchema.safeParse(validDriver);
    expect(result.success).toBe(true);
  });

  it('rejects empty first name', () => {
    const result = driverSchema.safeParse({ ...validDriver, firstName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty last name', () => {
    const result = driverSchema.safeParse({ ...validDriver, lastName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty date of birth', () => {
    const result = driverSchema.safeParse({ ...validDriver, dateOfBirth: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty license number', () => {
    const result = driverSchema.safeParse({ ...validDriver, licenseNumber: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid license state', () => {
    const result = driverSchema.safeParse({ ...validDriver, licenseState: 'XX' });
    expect(result.success).toBe(false);
  });

  it('rejects negative years licensed', () => {
    const result = driverSchema.safeParse({ ...validDriver, yearsLicensed: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects years licensed over 70', () => {
    const result = driverSchema.safeParse({ ...validDriver, yearsLicensed: 71 });
    expect(result.success).toBe(false);
  });

  it('accepts optional accidents/violations', () => {
    const result = driverSchema.safeParse(validDriver);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accidentsPast5Years).toBe(0);
      expect(result.data.violationsPast5Years).toBe(0);
    }
  });
});

describe('autoCoverageSchema', () => {
  const validCoverage = {
    bodilyInjuryLiability: '100/300',
    propertyDamageLiability: '100000',
    comprehensiveDeductible: '500',
    collisionDeductible: '500',
    uninsuredMotorist: true,
  };

  it('accepts valid coverage', () => {
    const result = autoCoverageSchema.safeParse(validCoverage);
    expect(result.success).toBe(true);
  });

  it('rejects invalid bodily injury option', () => {
    const result = autoCoverageSchema.safeParse({ ...validCoverage, bodilyInjuryLiability: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid property damage option', () => {
    const result = autoCoverageSchema.safeParse({ ...validCoverage, propertyDamageLiability: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('defaults uninsuredMotorist to false', () => {
    const { uninsuredMotorist, ...withoutUM } = validCoverage;
    const result = autoCoverageSchema.safeParse(withoutUM);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.uninsuredMotorist).toBe(false);
    }
  });
});
