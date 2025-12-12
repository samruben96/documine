/**
 * Travelers Formatter
 * Story Q4.1: Copy Button & Carrier Formatters
 *
 * AC-Q4.1-2: Copy for Travelers
 * AC-Q4.1-8: Date format MM/DD/YYYY
 * AC-Q4.1-9: Phone format (XXX) XXX-XXXX
 * AC-Q4.1-10: Tab-delimited format
 * AC-Q4.1-11: Handle blank/missing fields
 * AC-Q4.1-13: Includes personal, property, auto sections
 *
 * Note: Travelers may have different field ordering than Progressive
 */

import type { QuoteClientData } from '@/types/quoting';
import type { CarrierFormatter, FormattedPreview, ValidationResult, PreviewSection } from './types';
import { formatDate, formatPhoneNumber, formatCurrency } from '../formatters';

/**
 * Format address for clipboard (Travelers style - comma-separated)
 */
function formatAddress(
  street?: string,
  city?: string,
  state?: string,
  zipCode?: string
): string {
  const parts = [street, city, state, zipCode].filter(Boolean);
  if (parts.length === 0) return '';

  // Travelers prefers comma-separated format
  if (street && city && state && zipCode) {
    return `${street}, ${city}, ${state} ${zipCode}`;
  }

  return parts.join(', ');
}

/**
 * Travelers-specific field ordering and formatting
 * Differs from Progressive in section order and some field arrangements
 */
export const travelersFormatter: CarrierFormatter = {
  formatForClipboard(data: QuoteClientData): string {
    const lines: string[] = [];

    // Travelers starts with named insured information
    lines.push('--- NAMED INSURED ---');

    if (data.personal) {
      const p = data.personal;

      // Full name on one line
      const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ');
      if (fullName) {
        lines.push(fullName);
      }

      // DOB
      if (p.dateOfBirth) {
        lines.push(`DOB: ${formatDate(p.dateOfBirth)}`);
      }

      // Contact info grouped together
      if (p.phone || p.email) {
        const contact = [];
        if (p.phone) contact.push(formatPhoneNumber(p.phone));
        if (p.email) contact.push(p.email);
        lines.push(contact.join('\t'));
      }

      // Mailing address
      if (p.mailingAddress) {
        lines.push('Mailing Address:');
        const addr = formatAddress(
          p.mailingAddress.street,
          p.mailingAddress.city,
          p.mailingAddress.state,
          p.mailingAddress.zipCode
        );
        if (addr) {
          lines.push(addr);
        }
      }
    }

    lines.push('');

    // Property Section (Travelers calls it "Location")
    if (data.property) {
      const prop = data.property;
      lines.push('--- LOCATION ---');

      // Risk address first
      if (prop.address) {
        lines.push('Risk Address:');
        const addr = formatAddress(
          prop.address.street,
          prop.address.city,
          prop.address.state,
          prop.address.zipCode
        );
        if (addr) {
          lines.push(addr);
        }
      }

      // Property details in tabular format
      const details: string[] = [];
      if (prop.yearBuilt) details.push(`Built: ${prop.yearBuilt}`);
      if (prop.squareFootage) details.push(`Sq Ft: ${prop.squareFootage.toLocaleString()}`);
      if (details.length > 0) {
        lines.push(details.join('\t'));
      }

      // Construction details
      const construction: string[] = [];
      if (prop.constructionType) construction.push(`Const: ${prop.constructionType}`);
      if (prop.roofType) construction.push(`Roof: ${prop.roofType}`);
      if (prop.roofYear) construction.push(`Roof Year: ${prop.roofYear}`);
      if (construction.length > 0) {
        lines.push(construction.join('\t'));
      }

      // Coverages
      lines.push('Coverages:');
      if (prop.dwellingCoverage) {
        lines.push(`  Dwelling: ${formatCurrency(prop.dwellingCoverage)}`);
      }
      if (prop.liabilityCoverage) {
        lines.push(`  Liability: ${formatCurrency(prop.liabilityCoverage)}`);
      }
      if (prop.deductible) {
        lines.push(`  Deductible: ${formatCurrency(prop.deductible)}`);
      }

      // Exposures/Risk factors
      if (prop.hasPool || prop.hasTrampoline) {
        const exposures: string[] = [];
        if (prop.hasPool) exposures.push('Swimming Pool');
        if (prop.hasTrampoline) exposures.push('Trampoline');
        lines.push(`Exposures: ${exposures.join(', ')}`);
      }

      lines.push('');
    }

    // Auto Section
    if (data.auto) {
      const auto = data.auto;

      // Travelers groups drivers first, then vehicles
      if (auto.drivers && auto.drivers.length > 0) {
        lines.push('--- DRIVERS ---');
        auto.drivers.forEach((driver, index) => {
          lines.push(`Driver ${index + 1}:`);
          const name = [driver.firstName, driver.lastName].filter(Boolean).join(' ');
          if (name) {
            lines.push(`  Name: ${name}`);
          }
          if (driver.dateOfBirth) {
            lines.push(`  DOB: ${formatDate(driver.dateOfBirth)}`);
          }
          if (driver.relationship) {
            lines.push(`  Relationship: ${driver.relationship}`);
          }
          if (driver.licenseNumber) {
            lines.push(`  License: ${driver.licenseState || ''} ${driver.licenseNumber}`);
          }
          if (driver.yearsLicensed !== undefined) {
            lines.push(`  Yrs Licensed: ${driver.yearsLicensed}`);
          }

          // MVR info
          const mvr: string[] = [];
          if (driver.accidentsPast5Years !== undefined) {
            mvr.push(`Accidents: ${driver.accidentsPast5Years}`);
          }
          if (driver.violationsPast5Years !== undefined) {
            mvr.push(`Violations: ${driver.violationsPast5Years}`);
          }
          if (mvr.length > 0) {
            lines.push(`  MVR: ${mvr.join(', ')}`);
          }
        });
        lines.push('');
      }

      // Vehicles
      if (auto.vehicles && auto.vehicles.length > 0) {
        lines.push('--- VEHICLES ---');
        auto.vehicles.forEach((vehicle, index) => {
          lines.push(`Vehicle ${index + 1}:`);

          // Year Make Model on one line
          const ymm = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ');
          if (ymm) {
            lines.push(`  ${ymm}`);
          }
          if (vehicle.vin) {
            lines.push(`  VIN: ${vehicle.vin}`);
          }
          if (vehicle.usage) {
            lines.push(`  Use: ${vehicle.usage}`);
          }
          if (vehicle.annualMileage) {
            lines.push(`  Miles/Yr: ${vehicle.annualMileage.toLocaleString()}`);
          }
        });
        lines.push('');
      }

      // Coverage preferences
      if (auto.coverage) {
        const cov = auto.coverage;
        lines.push('--- AUTO COVERAGES ---');
        if (cov.bodilyInjuryLiability) {
          lines.push(`BI Limits: ${cov.bodilyInjuryLiability}`);
        }
        if (cov.propertyDamageLiability) {
          lines.push(`PD Limit: ${formatCurrency(cov.propertyDamageLiability)}`);
        }
        if (cov.comprehensiveDeductible || cov.collisionDeductible) {
          const deds: string[] = [];
          if (cov.comprehensiveDeductible) deds.push(`Comp: ${formatCurrency(cov.comprehensiveDeductible)}`);
          if (cov.collisionDeductible) deds.push(`Coll: ${formatCurrency(cov.collisionDeductible)}`);
          lines.push(`Deductibles: ${deds.join(', ')}`);
        }
        if (cov.uninsuredMotorist !== undefined) {
          lines.push(`UM/UIM: ${cov.uninsuredMotorist ? 'Yes' : 'No'}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n').trim();
  },

  generatePreview(data: QuoteClientData): FormattedPreview {
    const sections: PreviewSection[] = [];

    // Named Insured
    if (data.personal) {
      const p = data.personal;
      const fields: PreviewSection['fields'] = [];

      const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ');
      if (fullName) {
        fields.push({ name: 'Name', value: fullName });
      }
      if (p.dateOfBirth) {
        fields.push({ name: 'DOB', value: formatDate(p.dateOfBirth) });
      }
      if (p.phone) {
        fields.push({ name: 'Phone', value: formatPhoneNumber(p.phone) });
      }
      if (p.email) {
        fields.push({ name: 'Email', value: p.email });
      }
      if (p.mailingAddress) {
        const addr = formatAddress(
          p.mailingAddress.street,
          p.mailingAddress.city,
          p.mailingAddress.state,
          p.mailingAddress.zipCode
        );
        if (addr) {
          fields.push({ name: 'Mailing Address', value: addr });
        }
      }

      if (fields.length > 0) {
        sections.push({ label: 'Named Insured', fields });
      }
    }

    // Location (Property)
    if (data.property) {
      const prop = data.property;
      const fields: PreviewSection['fields'] = [];

      if (prop.address) {
        const addr = formatAddress(
          prop.address.street,
          prop.address.city,
          prop.address.state,
          prop.address.zipCode
        );
        if (addr) {
          fields.push({ name: 'Risk Address', value: addr });
        }
      }
      if (prop.yearBuilt) {
        fields.push({ name: 'Year Built', value: String(prop.yearBuilt) });
      }
      if (prop.squareFootage) {
        fields.push({ name: 'Square Feet', value: prop.squareFootage.toLocaleString() });
      }
      if (prop.dwellingCoverage) {
        fields.push({ name: 'Dwelling', value: formatCurrency(prop.dwellingCoverage) });
      }

      if (fields.length > 0) {
        sections.push({ label: 'Location', fields });
      }
    }

    // Drivers (before vehicles for Travelers)
    if (data.auto?.drivers && data.auto.drivers.length > 0) {
      const fields: PreviewSection['fields'] = [];
      data.auto.drivers.forEach((d, i) => {
        const name = [d.firstName, d.lastName].filter(Boolean).join(' ');
        if (name) {
          fields.push({ name: `Driver ${i + 1}`, value: name });
        }
      });
      if (fields.length > 0) {
        sections.push({ label: 'Drivers', fields });
      }
    }

    // Vehicles
    if (data.auto?.vehicles && data.auto.vehicles.length > 0) {
      const fields: PreviewSection['fields'] = [];
      data.auto.vehicles.forEach((v, i) => {
        const desc = [v.year, v.make, v.model].filter(Boolean).join(' ');
        if (desc) {
          fields.push({ name: `Vehicle ${i + 1}`, value: desc });
        }
      });
      if (fields.length > 0) {
        sections.push({ label: 'Vehicles', fields });
      }
    }

    return {
      sections,
      rawText: this.formatForClipboard(data),
    };
  },

  validateRequiredFields(data: QuoteClientData): ValidationResult {
    const missingFields: string[] = [];
    const warnings: string[] = [];

    // Named insured required
    if (!data.personal?.firstName) {
      missingFields.push('First Name');
    }
    if (!data.personal?.lastName) {
      missingFields.push('Last Name');
    }
    if (!data.personal?.dateOfBirth) {
      warnings.push('Date of Birth is recommended');
    }

    // Location validation (if property exists)
    if (data.property) {
      if (!data.property.address?.street) {
        missingFields.push('Risk Address');
      }
      if (!data.property.address?.city) {
        missingFields.push('City');
      }
      if (!data.property.address?.state) {
        missingFields.push('State');
      }
      if (!data.property.address?.zipCode) {
        missingFields.push('ZIP Code');
      }

      // Travelers requires construction details
      if (!data.property.yearBuilt) {
        warnings.push('Year Built is required for accurate quote');
      }
      if (!data.property.constructionType) {
        warnings.push('Construction Type is recommended');
      }
    }

    // Auto validation
    if (data.auto) {
      // Travelers requires at least one driver
      if (!data.auto.drivers || data.auto.drivers.length === 0) {
        missingFields.push('At least one driver');
      }
      if (!data.auto.vehicles || data.auto.vehicles.length === 0) {
        missingFields.push('At least one vehicle');
      }

      // Validate drivers
      data.auto.drivers?.forEach((d, i) => {
        if (!d.firstName || !d.lastName) {
          missingFields.push(`Driver ${i + 1}: Name`);
        }
        if (!d.dateOfBirth) {
          missingFields.push(`Driver ${i + 1}: Date of Birth`);
        }
        if (!d.licenseNumber) {
          warnings.push(`Driver ${i + 1}: License number recommended`);
        }
      });

      // Validate vehicles
      data.auto.vehicles?.forEach((v, i) => {
        if (!v.year) missingFields.push(`Vehicle ${i + 1}: Year`);
        if (!v.make) missingFields.push(`Vehicle ${i + 1}: Make`);
        if (!v.model) missingFields.push(`Vehicle ${i + 1}: Model`);
        if (!v.vin) warnings.push(`Vehicle ${i + 1}: VIN recommended`);
      });
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      warnings,
    };
  },
};
