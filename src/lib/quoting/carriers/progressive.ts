/**
 * Progressive Formatter
 * Story Q4.1: Copy Button & Carrier Formatters
 *
 * AC-Q4.1-1: Copy for Progressive
 * AC-Q4.1-8: Date format MM/DD/YYYY
 * AC-Q4.1-9: Phone format (XXX) XXX-XXXX
 * AC-Q4.1-10: Tab-delimited format
 * AC-Q4.1-11: Handle blank/missing fields
 * AC-Q4.1-12: Includes personal, property, auto sections
 */

import type { QuoteClientData } from '@/types/quoting';
import type { CarrierFormatter, FormattedPreview, ValidationResult, PreviewSection } from './types';
import { formatDate, formatPhoneNumber, formatCurrency } from '../formatters';

/**
 * Format address for clipboard
 */
function formatAddress(
  street?: string,
  city?: string,
  state?: string,
  zipCode?: string
): string {
  const parts = [street, city, state, zipCode].filter(Boolean);
  if (parts.length === 0) return '';

  // Format as: street, city\tstate\tzip
  if (street && city && state && zipCode) {
    return `${street}\n${city}\t${state}\t${zipCode}`;
  }

  return parts.join('\t');
}

/**
 * Progressive-specific field ordering and formatting
 */
export const progressiveFormatter: CarrierFormatter = {
  formatForClipboard(data: QuoteClientData): string {
    const lines: string[] = [];

    // Personal Information Section
    if (data.personal) {
      const p = data.personal;
      lines.push('=== PERSONAL INFORMATION ===');

      // Name (tab-delimited first/last)
      if (p.firstName || p.lastName) {
        lines.push(`${p.firstName || ''}\t${p.lastName || ''}`);
      }

      // Date of Birth
      if (p.dateOfBirth) {
        lines.push(formatDate(p.dateOfBirth));
      }

      // Email
      if (p.email) {
        lines.push(p.email);
      }

      // Phone
      if (p.phone) {
        lines.push(formatPhoneNumber(p.phone));
      }

      // Mailing Address
      if (p.mailingAddress) {
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

      lines.push('');
    }

    // Property Section
    if (data.property) {
      const prop = data.property;
      lines.push('=== PROPERTY INFORMATION ===');

      // Property Address
      if (prop.address) {
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

      // Year Built
      if (prop.yearBuilt) {
        lines.push(`Year Built: ${prop.yearBuilt}`);
      }

      // Square Footage
      if (prop.squareFootage) {
        lines.push(`Square Feet: ${prop.squareFootage.toLocaleString()}`);
      }

      // Construction & Roof
      if (prop.constructionType) {
        lines.push(`Construction: ${prop.constructionType}`);
      }
      if (prop.roofType) {
        lines.push(`Roof: ${prop.roofType}${prop.roofYear ? ` (${prop.roofYear})` : ''}`);
      }

      // Coverage amounts
      if (prop.dwellingCoverage) {
        lines.push(`Dwelling Coverage: ${formatCurrency(prop.dwellingCoverage)}`);
      }
      if (prop.liabilityCoverage) {
        lines.push(`Liability: ${formatCurrency(prop.liabilityCoverage)}`);
      }
      if (prop.deductible) {
        lines.push(`Deductible: ${formatCurrency(prop.deductible)}`);
      }

      // Risk factors
      const risks: string[] = [];
      if (prop.hasPool) risks.push('Pool');
      if (prop.hasTrampoline) risks.push('Trampoline');
      if (risks.length > 0) {
        lines.push(`Risk Factors: ${risks.join(', ')}`);
      }

      lines.push('');
    }

    // Auto Section
    if (data.auto) {
      const auto = data.auto;

      // Vehicles
      if (auto.vehicles && auto.vehicles.length > 0) {
        lines.push('=== VEHICLES ===');
        auto.vehicles.forEach((vehicle, index) => {
          const vehLine = [
            vehicle.year,
            vehicle.make,
            vehicle.model,
          ].filter(Boolean).join(' ');

          if (vehLine) {
            lines.push(`Vehicle ${index + 1}: ${vehLine}`);
          }
          if (vehicle.vin) {
            lines.push(`VIN: ${vehicle.vin}`);
          }
          if (vehicle.usage) {
            lines.push(`Usage: ${vehicle.usage}`);
          }
          if (vehicle.annualMileage) {
            lines.push(`Annual Mileage: ${vehicle.annualMileage.toLocaleString()}`);
          }
        });
        lines.push('');
      }

      // Drivers
      if (auto.drivers && auto.drivers.length > 0) {
        lines.push('=== DRIVERS ===');
        auto.drivers.forEach((driver, index) => {
          const name = [driver.firstName, driver.lastName].filter(Boolean).join(' ');
          if (name) {
            lines.push(`Driver ${index + 1}: ${name}`);
          }
          if (driver.dateOfBirth) {
            lines.push(`DOB: ${formatDate(driver.dateOfBirth)}`);
          }
          if (driver.licenseNumber && driver.licenseState) {
            lines.push(`License: ${driver.licenseState} ${driver.licenseNumber}`);
          } else if (driver.licenseNumber) {
            lines.push(`License: ${driver.licenseNumber}`);
          }
          if (driver.yearsLicensed !== undefined) {
            lines.push(`Years Licensed: ${driver.yearsLicensed}`);
          }
          if (driver.relationship) {
            lines.push(`Relationship: ${driver.relationship}`);
          }

          // Accidents/Violations
          const incidents: string[] = [];
          if (driver.accidentsPast5Years !== undefined && driver.accidentsPast5Years > 0) {
            incidents.push(`${driver.accidentsPast5Years} accident(s)`);
          }
          if (driver.violationsPast5Years !== undefined && driver.violationsPast5Years > 0) {
            incidents.push(`${driver.violationsPast5Years} violation(s)`);
          }
          if (incidents.length > 0) {
            lines.push(`Past 5 Years: ${incidents.join(', ')}`);
          }
        });
        lines.push('');
      }

      // Coverage preferences
      if (auto.coverage) {
        const cov = auto.coverage;
        lines.push('=== AUTO COVERAGE ===');
        if (cov.bodilyInjuryLiability) {
          lines.push(`Bodily Injury: ${cov.bodilyInjuryLiability}`);
        }
        if (cov.propertyDamageLiability) {
          lines.push(`Property Damage: ${formatCurrency(cov.propertyDamageLiability)}`);
        }
        if (cov.comprehensiveDeductible) {
          lines.push(`Comprehensive Ded: ${formatCurrency(cov.comprehensiveDeductible)}`);
        }
        if (cov.collisionDeductible) {
          lines.push(`Collision Ded: ${formatCurrency(cov.collisionDeductible)}`);
        }
        if (cov.uninsuredMotorist !== undefined) {
          lines.push(`Uninsured Motorist: ${cov.uninsuredMotorist ? 'Yes' : 'No'}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n').trim();
  },

  generatePreview(data: QuoteClientData): FormattedPreview {
    const sections: PreviewSection[] = [];

    // Personal Information
    if (data.personal) {
      const p = data.personal;
      const fields: PreviewSection['fields'] = [];

      if (p.firstName || p.lastName) {
        fields.push({ name: 'Name', value: `${p.firstName || ''} ${p.lastName || ''}`.trim() });
      }
      if (p.dateOfBirth) {
        fields.push({ name: 'Date of Birth', value: formatDate(p.dateOfBirth) });
      }
      if (p.email) {
        fields.push({ name: 'Email', value: p.email });
      }
      if (p.phone) {
        fields.push({ name: 'Phone', value: formatPhoneNumber(p.phone) });
      }
      if (p.mailingAddress) {
        const addr = p.mailingAddress;
        const addrStr = [addr.street, `${addr.city}, ${addr.state} ${addr.zipCode}`]
          .filter(Boolean)
          .join(', ');
        if (addrStr) {
          fields.push({ name: 'Address', value: addrStr });
        }
      }

      if (fields.length > 0) {
        sections.push({ label: 'Personal Information', fields });
      }
    }

    // Property
    if (data.property) {
      const prop = data.property;
      const fields: PreviewSection['fields'] = [];

      if (prop.address) {
        const addr = prop.address;
        const addrStr = [addr.street, `${addr.city}, ${addr.state} ${addr.zipCode}`]
          .filter(Boolean)
          .join(', ');
        if (addrStr) {
          fields.push({ name: 'Property Address', value: addrStr });
        }
      }
      if (prop.yearBuilt) {
        fields.push({ name: 'Year Built', value: String(prop.yearBuilt) });
      }
      if (prop.squareFootage) {
        fields.push({ name: 'Square Feet', value: prop.squareFootage.toLocaleString() });
      }
      if (prop.dwellingCoverage) {
        fields.push({ name: 'Dwelling Coverage', value: formatCurrency(prop.dwellingCoverage) });
      }

      if (fields.length > 0) {
        sections.push({ label: 'Property', fields });
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

    // Drivers
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

    return {
      sections,
      rawText: this.formatForClipboard(data),
    };
  },

  validateRequiredFields(data: QuoteClientData): ValidationResult {
    const missingFields: string[] = [];
    const warnings: string[] = [];

    // Personal info is always required
    if (!data.personal?.firstName) {
      missingFields.push('First Name');
    }
    if (!data.personal?.lastName) {
      missingFields.push('Last Name');
    }

    // Property fields (if property data exists)
    if (data.property) {
      if (!data.property.address?.street) {
        missingFields.push('Property Street Address');
      }
      if (!data.property.address?.city) {
        missingFields.push('Property City');
      }
      if (!data.property.address?.state) {
        missingFields.push('Property State');
      }
      if (!data.property.address?.zipCode) {
        missingFields.push('Property ZIP Code');
      }
      if (!data.property.yearBuilt) {
        warnings.push('Year Built is recommended');
      }
    }

    // Auto fields (if auto data exists)
    if (data.auto) {
      if (!data.auto.vehicles || data.auto.vehicles.length === 0) {
        missingFields.push('At least one vehicle');
      }
      if (!data.auto.drivers || data.auto.drivers.length === 0) {
        missingFields.push('At least one driver');
      }

      // Check each vehicle
      data.auto.vehicles?.forEach((v, i) => {
        if (!v.year) warnings.push(`Vehicle ${i + 1}: Year is recommended`);
        if (!v.make) warnings.push(`Vehicle ${i + 1}: Make is recommended`);
        if (!v.model) warnings.push(`Vehicle ${i + 1}: Model is recommended`);
        if (!v.vin) warnings.push(`Vehicle ${i + 1}: VIN is recommended for accurate quotes`);
      });

      // Check each driver
      data.auto.drivers?.forEach((d, i) => {
        if (!d.firstName || !d.lastName) {
          missingFields.push(`Driver ${i + 1}: Name`);
        }
        if (!d.dateOfBirth) {
          missingFields.push(`Driver ${i + 1}: Date of Birth`);
        }
        if (!d.licenseNumber) {
          warnings.push(`Driver ${i + 1}: License number is recommended`);
        }
      });
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      warnings,
    };
  },
};
