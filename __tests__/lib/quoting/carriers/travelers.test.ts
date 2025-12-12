/**
 * Travelers Formatter Tests
 * Story Q4.1: Copy Button & Carrier Formatters
 *
 * Tests AC-Q4.1-2, AC-Q4.1-8 through AC-Q4.1-11, AC-Q4.1-13
 */

import { describe, it, expect } from 'vitest';
import { travelersFormatter } from '@/lib/quoting/carriers/travelers';
import type { QuoteClientData } from '@/types/quoting';

describe('Travelers Formatter', () => {
  // Test data
  const completeClientData: QuoteClientData = {
    personal: {
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: '1990-07-22',
      email: 'jane.smith@email.com',
      phone: '5559876543',
      mailingAddress: {
        street: '789 Oak Lane',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
      },
    },
    property: {
      address: {
        street: '789 Oak Lane',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
      },
      yearBuilt: 2005,
      squareFootage: 1800,
      constructionType: 'masonry',
      roofType: 'tile',
      roofYear: 2015,
      dwellingCoverage: 280000,
      liabilityCoverage: '500000',
      deductible: '2500',
      hasPool: false,
      hasTrampoline: true,
    },
    auto: {
      vehicles: [
        {
          id: 'v1',
          year: 2021,
          make: 'Honda',
          model: 'Accord',
          vin: '1HGCV1F34LA000001',
          usage: 'pleasure',
          annualMileage: 8000,
        },
        {
          id: 'v2',
          year: 2019,
          make: 'Ford',
          model: 'Escape',
          vin: '1FMCU0GD5KUA00001',
          usage: 'commute',
          annualMileage: 15000,
        },
      ],
      drivers: [
        {
          id: 'd1',
          firstName: 'Jane',
          lastName: 'Smith',
          dateOfBirth: '1990-07-22',
          licenseNumber: 'S1234567',
          licenseState: 'IL',
          yearsLicensed: 15,
          relationship: 'self',
          accidentsPast5Years: 1,
          violationsPast5Years: 0,
        },
        {
          id: 'd2',
          firstName: 'Bob',
          lastName: 'Smith',
          dateOfBirth: '1988-12-01',
          licenseNumber: 'S7654321',
          licenseState: 'IL',
          yearsLicensed: 17,
          relationship: 'spouse',
          accidentsPast5Years: 0,
          violationsPast5Years: 0,
        },
      ],
      coverage: {
        bodilyInjuryLiability: '250/500',
        propertyDamageLiability: '250000',
        comprehensiveDeductible: '250',
        collisionDeductible: '500',
        uninsuredMotorist: true,
      },
    },
  };

  describe('formatForClipboard', () => {
    it('formats complete client data with all sections (AC-Q4.1-13)', () => {
      const result = travelersFormatter.formatForClipboard(completeClientData);

      // Should include all Travelers-style sections
      expect(result).toContain('--- NAMED INSURED ---');
      expect(result).toContain('--- LOCATION ---');
      expect(result).toContain('--- DRIVERS ---');
      expect(result).toContain('--- VEHICLES ---');
      expect(result).toContain('--- AUTO COVERAGES ---');
    });

    it('formats dates as MM/DD/YYYY (AC-Q4.1-8)', () => {
      const result = travelersFormatter.formatForClipboard(completeClientData);

      // Date of birth should be formatted as MM/DD/YYYY
      expect(result).toContain('07/22/1990');
      expect(result).toContain('12/01/1988');
    });

    it('formats phone numbers as (XXX) XXX-XXXX (AC-Q4.1-9)', () => {
      const result = travelersFormatter.formatForClipboard(completeClientData);

      // Phone should be formatted
      expect(result).toContain('(555) 987-6543');
    });

    it('uses Travelers-specific address format (comma-separated)', () => {
      const result = travelersFormatter.formatForClipboard(completeClientData);

      // Travelers uses comma-separated address format
      expect(result).toContain('789 Oak Lane, Springfield, IL 62701');
    });

    it('places drivers before vehicles (Travelers ordering)', () => {
      const result = travelersFormatter.formatForClipboard(completeClientData);

      const driversIndex = result.indexOf('--- DRIVERS ---');
      const vehiclesIndex = result.indexOf('--- VEHICLES ---');

      expect(driversIndex).toBeLessThan(vehiclesIndex);
    });

    it('handles multiple vehicles', () => {
      const result = travelersFormatter.formatForClipboard(completeClientData);

      expect(result).toContain('Vehicle 1:');
      expect(result).toContain('2021 Honda Accord');
      expect(result).toContain('Vehicle 2:');
      expect(result).toContain('2019 Ford Escape');
    });

    it('handles multiple drivers', () => {
      const result = travelersFormatter.formatForClipboard(completeClientData);

      expect(result).toContain('Driver 1:');
      expect(result).toContain('Name: Jane Smith');
      expect(result).toContain('Driver 2:');
      expect(result).toContain('Name: Bob Smith');
    });

    it('handles partial data - personal only', () => {
      const personalOnly: QuoteClientData = {
        personal: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
        },
      };

      const result = travelersFormatter.formatForClipboard(personalOnly);

      expect(result).toContain('--- NAMED INSURED ---');
      expect(result).toContain('Test User');
      expect(result).not.toContain('--- LOCATION ---');
      expect(result).not.toContain('--- VEHICLES ---');
    });

    it('handles missing/blank fields gracefully (AC-Q4.1-11)', () => {
      const sparseData: QuoteClientData = {
        personal: {
          firstName: 'Sparse',
          // No last name, email, phone
        },
        property: {
          yearBuilt: 2010,
          // No address
        },
      };

      // Should not throw
      const result = travelersFormatter.formatForClipboard(sparseData);

      expect(result).toContain('Sparse');
      expect(result).toContain('Built: 2010');
    });

    it('handles empty client data', () => {
      const emptyData: QuoteClientData = {};

      const result = travelersFormatter.formatForClipboard(emptyData);

      // Should return minimal output
      expect(result).toContain('--- NAMED INSURED ---');
    });

    it('includes MVR info for drivers', () => {
      const result = travelersFormatter.formatForClipboard(completeClientData);

      expect(result).toContain('MVR: Accidents: 1');
    });

    it('includes exposures/risk factors', () => {
      const result = travelersFormatter.formatForClipboard(completeClientData);

      expect(result).toContain('Exposures: Trampoline');
    });

    it('formats currency values correctly', () => {
      const result = travelersFormatter.formatForClipboard(completeClientData);

      expect(result).toContain('Dwelling: $280,000');
      expect(result).toContain('Liability: $500,000');
    });

    it('includes coverage deductibles', () => {
      const result = travelersFormatter.formatForClipboard(completeClientData);

      expect(result).toContain('Deductibles: Comp: $250, Coll: $500');
    });
  });

  describe('generatePreview', () => {
    it('returns sections with Travelers-specific labels (AC-Q4.1-13)', () => {
      const preview = travelersFormatter.generatePreview(completeClientData);

      const sectionLabels = preview.sections.map((s) => s.label);
      expect(sectionLabels).toContain('Named Insured');
      expect(sectionLabels).toContain('Location');
      expect(sectionLabels).toContain('Drivers');
      expect(sectionLabels).toContain('Vehicles');
    });

    it('places Drivers before Vehicles in preview', () => {
      const preview = travelersFormatter.generatePreview(completeClientData);

      const sectionLabels = preview.sections.map((s) => s.label);
      const driversIndex = sectionLabels.indexOf('Drivers');
      const vehiclesIndex = sectionLabels.indexOf('Vehicles');

      expect(driversIndex).toBeLessThan(vehiclesIndex);
    });

    it('includes formatted values in fields', () => {
      const preview = travelersFormatter.generatePreview(completeClientData);

      const namedInsuredSection = preview.sections.find((s) => s.label === 'Named Insured');
      expect(namedInsuredSection).toBeDefined();

      const nameField = namedInsuredSection?.fields.find((f) => f.name === 'Name');
      expect(nameField?.value).toBe('Jane Smith');

      const dobField = namedInsuredSection?.fields.find((f) => f.name === 'DOB');
      expect(dobField?.value).toBe('07/22/1990');
    });

    it('includes rawText matching formatForClipboard output', () => {
      const preview = travelersFormatter.generatePreview(completeClientData);
      const directFormat = travelersFormatter.formatForClipboard(completeClientData);

      expect(preview.rawText).toBe(directFormat);
    });

    it('handles empty data', () => {
      const preview = travelersFormatter.generatePreview({});

      expect(preview.sections).toHaveLength(0);
    });
  });

  describe('validateRequiredFields', () => {
    it('returns valid for complete data', () => {
      const result = travelersFormatter.validateRequiredFields(completeClientData);

      expect(result.isValid).toBe(true);
      expect(result.missingFields).toHaveLength(0);
    });

    it('detects missing first name', () => {
      const data: QuoteClientData = {
        personal: {
          lastName: 'Smith',
        },
      };

      const result = travelersFormatter.validateRequiredFields(data);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('First Name');
    });

    it('detects missing last name', () => {
      const data: QuoteClientData = {
        personal: {
          firstName: 'Jane',
        },
      };

      const result = travelersFormatter.validateRequiredFields(data);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Last Name');
    });

    it('detects missing risk address', () => {
      const data: QuoteClientData = {
        personal: {
          firstName: 'Jane',
          lastName: 'Smith',
        },
        property: {
          yearBuilt: 2000,
          // address missing
        },
      };

      const result = travelersFormatter.validateRequiredFields(data);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Risk Address');
    });

    it('detects missing vehicles when auto data present', () => {
      const data: QuoteClientData = {
        personal: {
          firstName: 'Jane',
          lastName: 'Smith',
        },
        auto: {
          drivers: [{ firstName: 'Jane', lastName: 'Smith', dateOfBirth: '1990-01-01' }],
          // vehicles missing
        },
      };

      const result = travelersFormatter.validateRequiredFields(data);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('At least one vehicle');
    });

    it('requires vehicle year/make/model for Travelers', () => {
      const data: QuoteClientData = {
        personal: {
          firstName: 'Jane',
          lastName: 'Smith',
        },
        auto: {
          vehicles: [
            {
              // year, make, model all missing
              vin: '1HGCV1F34LA000001',
            },
          ],
          drivers: [{ firstName: 'Jane', lastName: 'Smith', dateOfBirth: '1990-01-01' }],
        },
      };

      const result = travelersFormatter.validateRequiredFields(data);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Vehicle 1: Year');
      expect(result.missingFields).toContain('Vehicle 1: Make');
      expect(result.missingFields).toContain('Vehicle 1: Model');
    });

    it('detects missing driver DOB', () => {
      const data: QuoteClientData = {
        personal: {
          firstName: 'Jane',
          lastName: 'Smith',
        },
        auto: {
          vehicles: [{ year: 2022, make: 'Honda', model: 'Accord' }],
          drivers: [
            {
              firstName: 'Jane',
              lastName: 'Smith',
              // dateOfBirth missing
            },
          ],
        },
      };

      const result = travelersFormatter.validateRequiredFields(data);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Driver 1: Date of Birth');
    });

    it('includes warnings for recommended fields', () => {
      const data: QuoteClientData = {
        personal: {
          firstName: 'Jane',
          lastName: 'Smith',
          // dateOfBirth missing - recommended
        },
      };

      const result = travelersFormatter.validateRequiredFields(data);

      expect(result.warnings).toContain('Date of Birth is recommended');
    });

    it('includes warning for missing year built', () => {
      const data: QuoteClientData = {
        personal: {
          firstName: 'Jane',
          lastName: 'Smith',
        },
        property: {
          address: {
            street: '123 Main St',
            city: 'Town',
            state: 'IL',
            zipCode: '62701',
          },
          // yearBuilt missing
        },
      };

      const result = travelersFormatter.validateRequiredFields(data);

      expect(result.warnings).toContain('Year Built is required for accurate quote');
    });
  });
});
