/**
 * RAM Mutual Formatter Unit Tests
 * Story Q7.3: RAM Mutual Carrier + CAPTCHA Solving
 *
 * AC-Q7.3.1: RAM Mutual in CARRIERS registry
 * AC-Q7.3.2: formatForClipboard() outputs correct format
 * AC-Q7.3.3: generatePreview() creates UI preview
 * AC-Q7.3.4: validateRequiredFields() checks required fields
 */

import { describe, it, expect } from 'vitest';
import { ramMutualFormatter } from '@/lib/quoting/carriers/ram-mutual';
import { CARRIERS, getCarrier } from '@/lib/quoting/carriers';
import type { QuoteClientData } from '@/types/quoting';

/**
 * Helper to create mock client data
 */
function createMockClientData(overrides?: Partial<QuoteClientData>): QuoteClientData {
  return {
    personal: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-123-4567',
      dateOfBirth: '1985-06-15',
      mailingAddress: {
        street: '123 Main St',
        city: 'Madison',
        state: 'WI',
        zipCode: '53703',
      },
    },
    property: {
      address: {
        street: '123 Main St',
        city: 'Madison',
        state: 'WI',
        zipCode: '53703',
      },
      yearBuilt: 2005,
      squareFootage: 2000,
      constructionType: 'Frame',
      roofType: 'Asphalt Shingle',
      roofYear: 2018,
      dwellingCoverage: 350000,
      liabilityCoverage: 300000,
      deductible: 1000,
      hasPool: false,
      hasTrampoline: false,
    },
    auto: {
      vehicles: [
        {
          year: 2022,
          make: 'Toyota',
          model: 'Camry',
          vin: '4T1BF1FK2CU123456',
          usage: 'Commute',
          annualMileage: 12000,
        },
      ],
      drivers: [
        {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1985-06-15',
          licenseNumber: 'D123-4567-8901',
          licenseState: 'WI',
          yearsLicensed: 20,
          relationship: 'Self',
          accidentsPast5Years: 0,
          violationsPast5Years: 0,
        },
      ],
      coverage: {
        bodilyInjuryLiability: '100/300',
        propertyDamageLiability: 100000,
        comprehensiveDeductible: 500,
        collisionDeductible: 500,
        uninsuredMotorist: true,
      },
    },
    ...overrides,
  };
}

describe('RAM Mutual Carrier Registry', () => {
  describe('AC-Q7.3.1: Carrier Registry Entry', () => {
    it('should have ram-mutual in CARRIERS registry', () => {
      expect(CARRIERS['ram-mutual']).toBeDefined();
    });

    it('should have correct carrier code', () => {
      expect(CARRIERS['ram-mutual'].code).toBe('ram-mutual');
    });

    it('should have correct display name', () => {
      expect(CARRIERS['ram-mutual'].name).toBe('RAM Mutual');
    });

    it('should have correct portal URL', () => {
      expect(CARRIERS['ram-mutual'].portalUrl).toBe('https://www.rfrm.com/agents');
    });

    it('should have logo path configured', () => {
      expect(CARRIERS['ram-mutual'].logoPath).toBe('/carriers/ram-mutual.svg');
    });

    it('should support home and auto lines of business', () => {
      expect(CARRIERS['ram-mutual'].linesOfBusiness).toContain('home');
      expect(CARRIERS['ram-mutual'].linesOfBusiness).toContain('auto');
    });

    it('should be retrievable via getCarrier()', () => {
      const carrier = getCarrier('ram-mutual');
      expect(carrier).toBeDefined();
      expect(carrier?.name).toBe('RAM Mutual');
    });
  });
});

describe('RAM Mutual Formatter', () => {
  describe('AC-Q7.3.2: formatForClipboard()', () => {
    it('should output applicant information section', () => {
      const data = createMockClientData();
      const output = ramMutualFormatter.formatForClipboard(data);

      expect(output).toContain('=== APPLICANT INFORMATION ===');
      expect(output).toContain('Name:\tJohn Doe');
      expect(output).toContain('Date of Birth:\t06/15/1985');
      expect(output).toContain('Email:\tjohn.doe@example.com');
    });

    it('should format phone number correctly', () => {
      const data = createMockClientData();
      const output = ramMutualFormatter.formatForClipboard(data);

      expect(output).toContain('Phone:\t(555) 123-4567');
    });

    it('should output property information section', () => {
      const data = createMockClientData();
      const output = ramMutualFormatter.formatForClipboard(data);

      expect(output).toContain('=== PROPERTY INFORMATION ===');
      expect(output).toContain('Year Built:\t2005');
      expect(output).toContain('Square Footage:\t2,000');
      expect(output).toContain('Dwelling Coverage:\t$350,000');
    });

    it('should output vehicle information section', () => {
      const data = createMockClientData();
      const output = ramMutualFormatter.formatForClipboard(data);

      expect(output).toContain('=== VEHICLE INFORMATION ===');
      expect(output).toContain('Vehicle:\t2022 Toyota Camry');
      expect(output).toContain('VIN:\t4T1BF1FK2CU123456');
    });

    it('should output driver information section', () => {
      const data = createMockClientData();
      const output = ramMutualFormatter.formatForClipboard(data);

      expect(output).toContain('=== DRIVER INFORMATION ===');
      expect(output).toContain('Name:\tJohn Doe');
      expect(output).toContain('Driver License:\tWI D123-4567-8901');
      expect(output).toContain('Driving Record (5yr):\tClean');
    });

    it('should output auto coverage section', () => {
      const data = createMockClientData();
      const output = ramMutualFormatter.formatForClipboard(data);

      expect(output).toContain('=== AUTO COVERAGE ===');
      expect(output).toContain('Bodily Injury Liability:\t100/300');
      expect(output).toContain('Comprehensive Deductible:\t$500');
    });

    it('should handle missing personal data gracefully', () => {
      const data = createMockClientData({ personal: undefined });
      const output = ramMutualFormatter.formatForClipboard(data);

      // Should not throw and should not have personal section
      expect(output).not.toContain('=== APPLICANT INFORMATION ===');
    });

    it('should handle missing property data gracefully', () => {
      const data = createMockClientData({ property: undefined });
      const output = ramMutualFormatter.formatForClipboard(data);

      expect(output).not.toContain('=== PROPERTY INFORMATION ===');
    });

    it('should show risk factors when present', () => {
      const data = createMockClientData({
        property: {
          ...createMockClientData().property!,
          hasPool: true,
          hasTrampoline: true,
        },
      });
      const output = ramMutualFormatter.formatForClipboard(data);

      expect(output).toContain('Additional Exposures:\tSwimming Pool, Trampoline');
    });

    it('should show driver incidents when present', () => {
      const data = createMockClientData({
        auto: {
          ...createMockClientData().auto!,
          drivers: [
            {
              ...createMockClientData().auto!.drivers![0],
              accidentsPast5Years: 1,
              violationsPast5Years: 2,
            },
          ],
        },
      });
      const output = ramMutualFormatter.formatForClipboard(data);

      expect(output).toContain('1 at-fault accident(s)');
      expect(output).toContain('2 violation(s)');
    });
  });

  describe('AC-Q7.3.3: generatePreview()', () => {
    it('should return sections array', () => {
      const data = createMockClientData();
      const preview = ramMutualFormatter.generatePreview(data);

      expect(preview.sections).toBeDefined();
      expect(Array.isArray(preview.sections)).toBe(true);
    });

    it('should include Applicant Information section', () => {
      const data = createMockClientData();
      const preview = ramMutualFormatter.generatePreview(data);

      const applicantSection = preview.sections.find(s => s.label === 'Applicant Information');
      expect(applicantSection).toBeDefined();
      expect(applicantSection?.fields.some(f => f.name === 'Name')).toBe(true);
    });

    it('should include Property Information section', () => {
      const data = createMockClientData();
      const preview = ramMutualFormatter.generatePreview(data);

      const propertySection = preview.sections.find(s => s.label === 'Property Information');
      expect(propertySection).toBeDefined();
      expect(propertySection?.fields.some(f => f.name === 'Year Built')).toBe(true);
    });

    it('should include Vehicles section', () => {
      const data = createMockClientData();
      const preview = ramMutualFormatter.generatePreview(data);

      const vehiclesSection = preview.sections.find(s => s.label === 'Vehicles');
      expect(vehiclesSection).toBeDefined();
      expect(vehiclesSection?.fields.some(f => f.name === 'Vehicle 1')).toBe(true);
    });

    it('should include Drivers section', () => {
      const data = createMockClientData();
      const preview = ramMutualFormatter.generatePreview(data);

      const driversSection = preview.sections.find(s => s.label === 'Drivers');
      expect(driversSection).toBeDefined();
      expect(driversSection?.fields.some(f => f.name === 'Driver 1')).toBe(true);
    });

    it('should include rawText with formatted clipboard content', () => {
      const data = createMockClientData();
      const preview = ramMutualFormatter.generatePreview(data);

      expect(preview.rawText).toBeDefined();
      expect(preview.rawText).toContain('=== APPLICANT INFORMATION ===');
    });

    it('should handle empty data gracefully', () => {
      const data: QuoteClientData = {};
      const preview = ramMutualFormatter.generatePreview(data);

      expect(preview.sections).toEqual([]);
      expect(preview.rawText).toBe('');
    });
  });

  describe('AC-Q7.3.4: validateRequiredFields()', () => {
    it('should return valid for complete data', () => {
      const data = createMockClientData();
      const result = ramMutualFormatter.validateRequiredFields(data);

      expect(result.isValid).toBe(true);
      expect(result.missingFields).toHaveLength(0);
    });

    it('should require first name', () => {
      const data = createMockClientData({
        personal: { ...createMockClientData().personal!, firstName: '' },
      });
      const result = ramMutualFormatter.validateRequiredFields(data);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('First Name');
    });

    it('should require last name', () => {
      const data = createMockClientData({
        personal: { ...createMockClientData().personal!, lastName: '' },
      });
      const result = ramMutualFormatter.validateRequiredFields(data);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('Last Name');
    });

    it('should require property address fields', () => {
      const data = createMockClientData({
        property: {
          ...createMockClientData().property!,
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
          },
        },
      });
      const result = ramMutualFormatter.validateRequiredFields(data);

      expect(result.missingFields).toContain('Property Street Address');
      expect(result.missingFields).toContain('Property City');
      expect(result.missingFields).toContain('Property State');
      expect(result.missingFields).toContain('Property ZIP Code');
    });

    it('should require at least one vehicle when auto data exists', () => {
      const data = createMockClientData({
        auto: { ...createMockClientData().auto!, vehicles: [] },
      });
      const result = ramMutualFormatter.validateRequiredFields(data);

      expect(result.missingFields).toContain('At least one vehicle');
    });

    it('should require at least one driver when auto data exists', () => {
      const data = createMockClientData({
        auto: { ...createMockClientData().auto!, drivers: [] },
      });
      const result = ramMutualFormatter.validateRequiredFields(data);

      expect(result.missingFields).toContain('At least one driver');
    });

    it('should require driver name', () => {
      const data = createMockClientData({
        auto: {
          ...createMockClientData().auto!,
          drivers: [{ ...createMockClientData().auto!.drivers![0], firstName: '', lastName: '' }],
        },
      });
      const result = ramMutualFormatter.validateRequiredFields(data);

      expect(result.missingFields).toContain('Driver 1: Name');
    });

    it('should require driver date of birth', () => {
      const data = createMockClientData({
        auto: {
          ...createMockClientData().auto!,
          drivers: [{ ...createMockClientData().auto!.drivers![0], dateOfBirth: '' }],
        },
      });
      const result = ramMutualFormatter.validateRequiredFields(data);

      expect(result.missingFields).toContain('Driver 1: Date of Birth');
    });

    it('should warn for non-WI/IL properties', () => {
      const data = createMockClientData({
        property: {
          ...createMockClientData().property!,
          address: {
            ...createMockClientData().property!.address!,
            state: 'CA',
          },
        },
      });
      const result = ramMutualFormatter.validateRequiredFields(data);

      expect(result.warnings.some(w => w.includes('Wisconsin') || w.includes('Illinois'))).toBe(true);
    });

    it('should not warn for WI properties', () => {
      const data = createMockClientData();
      const result = ramMutualFormatter.validateRequiredFields(data);

      expect(result.warnings.some(w => w.includes('Wisconsin') || w.includes('Illinois'))).toBe(false);
    });

    it('should warn for missing year built', () => {
      const data = createMockClientData({
        property: { ...createMockClientData().property!, yearBuilt: undefined },
      });
      const result = ramMutualFormatter.validateRequiredFields(data);

      expect(result.warnings.some(w => w.includes('Year Built'))).toBe(true);
    });

    it('should warn for missing VIN', () => {
      const data = createMockClientData({
        auto: {
          ...createMockClientData().auto!,
          vehicles: [{ ...createMockClientData().auto!.vehicles![0], vin: '' }],
        },
      });
      const result = ramMutualFormatter.validateRequiredFields(data);

      expect(result.warnings.some(w => w.includes('VIN'))).toBe(true);
    });
  });
});
