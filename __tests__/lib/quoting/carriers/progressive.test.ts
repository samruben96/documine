/**
 * Progressive Formatter Tests
 * Story Q4.1: Copy Button & Carrier Formatters
 *
 * Tests AC-Q4.1-1, AC-Q4.1-8 through AC-Q4.1-12
 */

import { describe, it, expect } from 'vitest';
import { progressiveFormatter } from '@/lib/quoting/carriers/progressive';
import type { QuoteClientData } from '@/types/quoting';

describe('Progressive Formatter', () => {
  // Test data
  const completeClientData: QuoteClientData = {
    personal: {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1985-03-15',
      email: 'john.doe@email.com',
      phone: '5551234567',
      mailingAddress: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '90210',
      },
    },
    property: {
      address: {
        street: '456 Oak Ave',
        city: 'Somewhere',
        state: 'CA',
        zipCode: '90211',
      },
      yearBuilt: 1995,
      squareFootage: 2000,
      constructionType: 'frame',
      roofType: 'asphalt',
      roofYear: 2020,
      dwellingCoverage: 350000,
      liabilityCoverage: '300000',
      deductible: '1000',
      hasPool: true,
      hasTrampoline: false,
    },
    auto: {
      vehicles: [
        {
          id: 'v1',
          year: 2022,
          make: 'Toyota',
          model: 'Camry',
          vin: '1HGBH41JXMN109186',
          usage: 'commute',
          annualMileage: 12000,
        },
      ],
      drivers: [
        {
          id: 'd1',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1985-03-15',
          licenseNumber: 'D1234567',
          licenseState: 'CA',
          yearsLicensed: 20,
          relationship: 'self',
          accidentsPast5Years: 0,
          violationsPast5Years: 1,
        },
      ],
      coverage: {
        bodilyInjuryLiability: '100/300',
        propertyDamageLiability: '100000',
        comprehensiveDeductible: '500',
        collisionDeductible: '500',
        uninsuredMotorist: true,
      },
    },
  };

  describe('formatForClipboard', () => {
    it('formats complete client data with all sections (AC-Q4.1-12)', () => {
      const result = progressiveFormatter.formatForClipboard(completeClientData);

      // Should include all sections
      expect(result).toContain('=== PERSONAL INFORMATION ===');
      expect(result).toContain('=== PROPERTY INFORMATION ===');
      expect(result).toContain('=== VEHICLES ===');
      expect(result).toContain('=== DRIVERS ===');
      expect(result).toContain('=== AUTO COVERAGE ===');
    });

    it('formats dates as MM/DD/YYYY (AC-Q4.1-8)', () => {
      const result = progressiveFormatter.formatForClipboard(completeClientData);

      // Date of birth should be formatted as MM/DD/YYYY
      expect(result).toContain('03/15/1985');
    });

    it('formats phone numbers as (XXX) XXX-XXXX (AC-Q4.1-9)', () => {
      const result = progressiveFormatter.formatForClipboard(completeClientData);

      // Phone should be formatted
      expect(result).toContain('(555) 123-4567');
    });

    it('uses tab-delimited format for related fields (AC-Q4.1-10)', () => {
      const result = progressiveFormatter.formatForClipboard(completeClientData);

      // Name fields should be tab-delimited
      expect(result).toContain('John\tDoe');

      // Address city/state/zip should be tab-delimited
      expect(result).toContain('Anytown\tCA\t90210');
    });

    it('handles partial data - personal only', () => {
      const personalOnly: QuoteClientData = {
        personal: {
          firstName: 'Jane',
          lastName: 'Smith',
        },
      };

      const result = progressiveFormatter.formatForClipboard(personalOnly);

      expect(result).toContain('=== PERSONAL INFORMATION ===');
      expect(result).toContain('Jane\tSmith');
      expect(result).not.toContain('=== PROPERTY INFORMATION ===');
      expect(result).not.toContain('=== VEHICLES ===');
    });

    it('handles partial data - property only', () => {
      const propertyOnly: QuoteClientData = {
        property: {
          address: {
            street: '789 Elm St',
            city: 'Town',
            state: 'NY',
            zipCode: '10001',
          },
          yearBuilt: 2000,
        },
      };

      const result = progressiveFormatter.formatForClipboard(propertyOnly);

      expect(result).toContain('=== PROPERTY INFORMATION ===');
      expect(result).toContain('Year Built: 2000');
      expect(result).not.toContain('=== PERSONAL INFORMATION ===');
    });

    it('handles partial data - auto only', () => {
      const autoOnly: QuoteClientData = {
        auto: {
          vehicles: [{ year: 2023, make: 'Honda', model: 'Accord' }],
        },
      };

      const result = progressiveFormatter.formatForClipboard(autoOnly);

      expect(result).toContain('=== VEHICLES ===');
      expect(result).toContain('Vehicle 1: 2023 Honda Accord');
      expect(result).not.toContain('=== PERSONAL INFORMATION ===');
    });

    it('handles missing/blank fields gracefully (AC-Q4.1-11)', () => {
      const sparseData: QuoteClientData = {
        personal: {
          firstName: 'John',
          // lastName missing
          // email missing
        },
        property: {
          // address missing
          yearBuilt: 1990,
        },
      };

      // Should not throw
      const result = progressiveFormatter.formatForClipboard(sparseData);

      expect(result).toContain('John\t');
      expect(result).toContain('Year Built: 1990');
    });

    it('handles empty client data', () => {
      const emptyData: QuoteClientData = {};

      const result = progressiveFormatter.formatForClipboard(emptyData);

      // Should return empty or minimal output
      expect(result).toBe('');
    });

    it('includes risk factors when present', () => {
      const result = progressiveFormatter.formatForClipboard(completeClientData);

      expect(result).toContain('Risk Factors: Pool');
    });

    it('includes driver incidents', () => {
      const result = progressiveFormatter.formatForClipboard(completeClientData);

      expect(result).toContain('1 violation(s)');
    });

    it('formats currency values correctly', () => {
      const result = progressiveFormatter.formatForClipboard(completeClientData);

      expect(result).toContain('Dwelling Coverage: $350,000');
      expect(result).toContain('Liability: $300,000');
    });
  });

  describe('generatePreview', () => {
    it('returns sections with correct labels (AC-Q4.1-12)', () => {
      const preview = progressiveFormatter.generatePreview(completeClientData);

      const sectionLabels = preview.sections.map((s) => s.label);
      expect(sectionLabels).toContain('Personal Information');
      expect(sectionLabels).toContain('Property');
      expect(sectionLabels).toContain('Vehicles');
      expect(sectionLabels).toContain('Drivers');
    });

    it('includes formatted values in fields', () => {
      const preview = progressiveFormatter.generatePreview(completeClientData);

      const personalSection = preview.sections.find((s) => s.label === 'Personal Information');
      expect(personalSection).toBeDefined();

      const nameField = personalSection?.fields.find((f) => f.name === 'Name');
      expect(nameField?.value).toBe('John Doe');

      const dobField = personalSection?.fields.find((f) => f.name === 'Date of Birth');
      expect(dobField?.value).toBe('03/15/1985');
    });

    it('includes rawText matching formatForClipboard output', () => {
      const preview = progressiveFormatter.generatePreview(completeClientData);
      const directFormat = progressiveFormatter.formatForClipboard(completeClientData);

      expect(preview.rawText).toBe(directFormat);
    });

    it('handles empty data', () => {
      const preview = progressiveFormatter.generatePreview({});

      expect(preview.sections).toHaveLength(0);
      expect(preview.rawText).toBe('');
    });
  });

  describe('validateRequiredFields', () => {
    it('returns valid for complete data', () => {
      const result = progressiveFormatter.validateRequiredFields(completeClientData);

      expect(result.isValid).toBe(true);
      expect(result.missingFields).toHaveLength(0);
    });

    it('detects missing first name', () => {
      const data: QuoteClientData = {
        personal: {
          lastName: 'Doe',
        },
      };

      const result = progressiveFormatter.validateRequiredFields(data);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('First Name');
    });

    it('detects missing last name', () => {
      const data: QuoteClientData = {
        personal: {
          firstName: 'John',
        },
      };

      const result = progressiveFormatter.validateRequiredFields(data);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Last Name');
    });

    it('detects missing property address fields', () => {
      const data: QuoteClientData = {
        personal: {
          firstName: 'John',
          lastName: 'Doe',
        },
        property: {
          yearBuilt: 1990,
          // address missing
        },
      };

      const result = progressiveFormatter.validateRequiredFields(data);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Property Street Address');
      expect(result.missingFields).toContain('Property City');
      expect(result.missingFields).toContain('Property State');
      expect(result.missingFields).toContain('Property ZIP Code');
    });

    it('detects missing vehicles when auto data present', () => {
      const data: QuoteClientData = {
        personal: {
          firstName: 'John',
          lastName: 'Doe',
        },
        auto: {
          drivers: [{ firstName: 'John', lastName: 'Doe', dateOfBirth: '1985-01-01' }],
          // vehicles missing
        },
      };

      const result = progressiveFormatter.validateRequiredFields(data);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('At least one vehicle');
    });

    it('detects missing drivers when auto data present', () => {
      const data: QuoteClientData = {
        personal: {
          firstName: 'John',
          lastName: 'Doe',
        },
        auto: {
          vehicles: [{ year: 2022, make: 'Toyota', model: 'Camry' }],
          // drivers missing
        },
      };

      const result = progressiveFormatter.validateRequiredFields(data);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('At least one driver');
    });

    it('detects missing driver DOB', () => {
      const data: QuoteClientData = {
        personal: {
          firstName: 'John',
          lastName: 'Doe',
        },
        auto: {
          vehicles: [{ year: 2022, make: 'Toyota', model: 'Camry' }],
          drivers: [
            {
              firstName: 'Jane',
              lastName: 'Doe',
              // dateOfBirth missing
            },
          ],
        },
      };

      const result = progressiveFormatter.validateRequiredFields(data);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Driver 1: Date of Birth');
    });

    it('includes warnings for recommended fields', () => {
      const data: QuoteClientData = {
        personal: {
          firstName: 'John',
          lastName: 'Doe',
        },
        property: {
          address: {
            street: '123 Main St',
            city: 'Town',
            state: 'CA',
            zipCode: '90210',
          },
          // yearBuilt missing - recommended
        },
      };

      const result = progressiveFormatter.validateRequiredFields(data);

      expect(result.warnings).toContain('Year Built is recommended');
    });

    it('includes VIN warning for vehicles', () => {
      const data: QuoteClientData = {
        personal: {
          firstName: 'John',
          lastName: 'Doe',
        },
        auto: {
          vehicles: [
            {
              year: 2022,
              make: 'Toyota',
              model: 'Camry',
              // VIN missing
            },
          ],
          drivers: [{ firstName: 'John', lastName: 'Doe', dateOfBirth: '1985-01-01' }],
        },
      };

      const result = progressiveFormatter.validateRequiredFields(data);

      expect(result.warnings).toContain('Vehicle 1: VIN is recommended for accurate quotes');
    });
  });
});
