/**
 * Validation Schema Tests
 * Story Q3.1: Data Capture Forms
 * Story Q3.3: Field Validation & Formatting
 *
 * Tests for Zod schemas and validation functions used in form validation
 */

import { describe, it, expect } from 'vitest';
import {
  addressSchema,
  personalInfoSchema,
  propertyInfoSchema,
  vehicleSchema,
  driverSchema,
  autoCoverageSchema,
  validateVin,
  validateZipCode,
  validateEmail,
  validatePhone,
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

// =============================================================================
// Q3.3 Validation Function Tests
// =============================================================================

describe('validateVin - Q3.3', () => {
  describe('valid VINs', () => {
    it('should accept valid 17-character VIN', () => {
      const result = validateVin('1HGBH41JXMN109186');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept lowercase VIN (auto-uppercase)', () => {
      const result = validateVin('1hgbh41jxmn109186');
      expect(result.valid).toBe(true);
    });

    it('should accept empty string as valid (optional field)', () => {
      const result = validateVin('');
      expect(result.valid).toBe(true);
    });

    it('should accept whitespace-only as valid (optional field)', () => {
      const result = validateVin('   ');
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid VINs', () => {
    it('should reject VIN shorter than 17 characters', () => {
      const result = validateVin('1HGBH41JX');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('VIN must be exactly 17 characters');
    });

    it('should reject VIN containing letter I', () => {
      const result = validateVin('1HGBH41IXMN109186');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('VIN cannot contain letters I, O, or Q');
    });

    it('should reject VIN containing letter O', () => {
      const result = validateVin('1HGBH41OXMN109186');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('VIN cannot contain letters I, O, or Q');
    });

    it('should reject VIN containing letter Q', () => {
      const result = validateVin('1HGBH41QXMN109186');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('VIN cannot contain letters I, O, or Q');
    });
  });
});

describe('validateZipCode - Q3.3', () => {
  describe('valid ZIP codes', () => {
    it('should accept 5-digit ZIP code', () => {
      const result = validateZipCode('78701');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept ZIP+4 format', () => {
      const result = validateZipCode('78701-1234');
      expect(result.valid).toBe(true);
    });

    it('should accept empty string as valid', () => {
      const result = validateZipCode('');
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid ZIP codes', () => {
    it('should reject ZIP with fewer than 5 digits', () => {
      const result = validateZipCode('7870');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid ZIP code');
    });

    it('should reject incomplete ZIP+4', () => {
      const result = validateZipCode('78701-12');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid ZIP code');
    });

    it('should reject ZIP with letters', () => {
      const result = validateZipCode('7870A');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid ZIP code');
    });
  });
});

describe('validateEmail - Q3.3', () => {
  describe('valid emails', () => {
    it('should accept standard email format', () => {
      const result = validateEmail('test@example.com');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept email with subdomain', () => {
      const result = validateEmail('user@mail.example.com');
      expect(result.valid).toBe(true);
    });

    it('should accept email with plus sign', () => {
      const result = validateEmail('user+tag@example.com');
      expect(result.valid).toBe(true);
    });

    it('should accept empty string as valid', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid emails', () => {
    it('should reject email without @', () => {
      const result = validateEmail('testexample.com');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid email address');
    });

    it('should reject email without domain', () => {
      const result = validateEmail('test@');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid email address');
    });

    it('should reject email without TLD', () => {
      const result = validateEmail('test@example');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid email address');
    });
  });
});

describe('validatePhone - Q3.3', () => {
  describe('valid phone numbers', () => {
    it('should accept 10-digit phone number', () => {
      const result = validatePhone('5551234567');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept formatted phone (XXX) XXX-XXXX', () => {
      const result = validatePhone('(555) 123-4567');
      expect(result.valid).toBe(true);
    });

    it('should accept phone with dashes', () => {
      const result = validatePhone('555-123-4567');
      expect(result.valid).toBe(true);
    });

    it('should accept empty string as valid', () => {
      const result = validatePhone('');
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid phone numbers', () => {
    it('should reject phone with fewer than 10 digits', () => {
      const result = validatePhone('55512345');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Phone must be 10 digits');
    });

    it('should reject phone with more than 10 digits', () => {
      const result = validatePhone('555123456789');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Phone must be 10 digits');
    });
  });
});
