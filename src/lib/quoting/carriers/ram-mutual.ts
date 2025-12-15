/**
 * RAM Mutual Formatter
 * Story Q7.3: RAM Mutual Carrier + CAPTCHA Solving
 *
 * AC-Q7.3.1: RAM Mutual added to CARRIERS registry
 * AC-Q7.3.2: Clipboard formatter with proper field order
 * AC-Q7.3.3: generatePreview() for UI preview
 * AC-Q7.3.4: validateRequiredFields() checks required fields
 */

import type { QuoteClientData } from '@/types/quoting';
import type { CarrierFormatter, FormattedPreview, ValidationResult, PreviewSection } from './types';
import { formatDate, formatPhoneNumber, formatCurrency } from '../formatters';

/**
 * Format address for RAM Mutual clipboard format
 */
function formatAddress(
  street?: string,
  city?: string,
  state?: string,
  zipCode?: string
): string {
  if (!street && !city && !state && !zipCode) return '';

  // RAM Mutual format: Street on one line, city/state/zip on next
  const lines: string[] = [];
  if (street) {
    lines.push(street);
  }
  const cityStateZip = [city, state, zipCode].filter(Boolean).join(', ');
  if (cityStateZip) {
    lines.push(cityStateZip);
  }
  return lines.join('\n');
}

/**
 * RAM Mutual specific formatter
 * Wisconsin/Illinois regional carrier - Personal lines focus
 */
export const ramMutualFormatter: CarrierFormatter = {
  formatForClipboard(data: QuoteClientData): string {
    const lines: string[] = [];

    // Applicant Information Section
    if (data.personal) {
      const p = data.personal;
      lines.push('=== APPLICANT INFORMATION ===');

      // Full Name
      if (p.firstName || p.lastName) {
        lines.push(`Name:\t${p.firstName || ''} ${p.lastName || ''}`);
      }

      // Date of Birth (critical for underwriting)
      if (p.dateOfBirth) {
        lines.push(`Date of Birth:\t${formatDate(p.dateOfBirth)}`);
      }

      // Contact Info
      if (p.email) {
        lines.push(`Email:\t${p.email}`);
      }
      if (p.phone) {
        lines.push(`Phone:\t${formatPhoneNumber(p.phone)}`);
      }

      // Mailing Address
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

      lines.push('');
    }

    // Property Information Section (Home)
    if (data.property) {
      const prop = data.property;
      lines.push('=== PROPERTY INFORMATION ===');

      // Property Address
      if (prop.address) {
        lines.push('Property Location:');
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

      // Property Details
      if (prop.yearBuilt) {
        lines.push(`Year Built:\t${prop.yearBuilt}`);
      }
      if (prop.squareFootage) {
        lines.push(`Square Footage:\t${prop.squareFootage.toLocaleString()}`);
      }
      if (prop.constructionType) {
        lines.push(`Construction Type:\t${prop.constructionType}`);
      }
      if (prop.roofType) {
        const roofInfo = prop.roofYear
          ? `${prop.roofType} (Installed: ${prop.roofYear})`
          : prop.roofType;
        lines.push(`Roof Type:\t${roofInfo}`);
      }

      // Coverage Information
      lines.push('--- Coverage ---');
      if (prop.dwellingCoverage) {
        lines.push(`Dwelling Coverage:\t${formatCurrency(prop.dwellingCoverage)}`);
      }
      if (prop.liabilityCoverage) {
        lines.push(`Personal Liability:\t${formatCurrency(prop.liabilityCoverage)}`);
      }
      if (prop.deductible) {
        lines.push(`Deductible:\t${formatCurrency(prop.deductible)}`);
      }

      // Risk Factors
      const risks: string[] = [];
      if (prop.hasPool) risks.push('Swimming Pool');
      if (prop.hasTrampoline) risks.push('Trampoline');
      if (risks.length > 0) {
        lines.push(`Additional Exposures:\t${risks.join(', ')}`);
      }

      lines.push('');
    }

    // Vehicle Information Section (Auto)
    if (data.auto?.vehicles && data.auto.vehicles.length > 0) {
      lines.push('=== VEHICLE INFORMATION ===');

      data.auto.vehicles.forEach((vehicle, index) => {
        lines.push(`--- Vehicle ${index + 1} ---`);

        // Year Make Model
        const ymm = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ');
        if (ymm) {
          lines.push(`Vehicle:\t${ymm}`);
        }

        // VIN
        if (vehicle.vin) {
          lines.push(`VIN:\t${vehicle.vin}`);
        }

        // Usage & Mileage
        if (vehicle.usage) {
          lines.push(`Primary Use:\t${vehicle.usage}`);
        }
        if (vehicle.annualMileage) {
          lines.push(`Annual Mileage:\t${vehicle.annualMileage.toLocaleString()}`);
        }
      });

      lines.push('');
    }

    // Driver Information Section
    if (data.auto?.drivers && data.auto.drivers.length > 0) {
      lines.push('=== DRIVER INFORMATION ===');

      data.auto.drivers.forEach((driver, index) => {
        lines.push(`--- Driver ${index + 1} ---`);

        // Name
        const name = [driver.firstName, driver.lastName].filter(Boolean).join(' ');
        if (name) {
          lines.push(`Name:\t${name}`);
        }

        // DOB
        if (driver.dateOfBirth) {
          lines.push(`Date of Birth:\t${formatDate(driver.dateOfBirth)}`);
        }

        // License Info
        if (driver.licenseNumber) {
          const license = driver.licenseState
            ? `${driver.licenseState} ${driver.licenseNumber}`
            : driver.licenseNumber;
          lines.push(`Driver License:\t${license}`);
        }

        // Experience
        if (driver.yearsLicensed !== undefined) {
          lines.push(`Years Licensed:\t${driver.yearsLicensed}`);
        }

        // Relationship
        if (driver.relationship) {
          lines.push(`Relationship:\t${driver.relationship}`);
        }

        // Driving Record
        const incidents: string[] = [];
        if (driver.accidentsPast5Years !== undefined && driver.accidentsPast5Years > 0) {
          incidents.push(`${driver.accidentsPast5Years} at-fault accident(s)`);
        }
        if (driver.violationsPast5Years !== undefined && driver.violationsPast5Years > 0) {
          incidents.push(`${driver.violationsPast5Years} violation(s)`);
        }
        if (incidents.length > 0) {
          lines.push(`Driving Record (5yr):\t${incidents.join(', ')}`);
        } else if (driver.accidentsPast5Years === 0 && driver.violationsPast5Years === 0) {
          lines.push(`Driving Record (5yr):\tClean`);
        }
      });

      lines.push('');
    }

    // Auto Coverage Section
    if (data.auto?.coverage) {
      const cov = data.auto.coverage;
      lines.push('=== AUTO COVERAGE ===');

      if (cov.bodilyInjuryLiability) {
        lines.push(`Bodily Injury Liability:\t${cov.bodilyInjuryLiability}`);
      }
      if (cov.propertyDamageLiability) {
        lines.push(`Property Damage Liability:\t${formatCurrency(cov.propertyDamageLiability)}`);
      }
      if (cov.comprehensiveDeductible) {
        lines.push(`Comprehensive Deductible:\t${formatCurrency(cov.comprehensiveDeductible)}`);
      }
      if (cov.collisionDeductible) {
        lines.push(`Collision Deductible:\t${formatCurrency(cov.collisionDeductible)}`);
      }
      if (cov.uninsuredMotorist !== undefined) {
        lines.push(`Uninsured/Underinsured:\t${cov.uninsuredMotorist ? 'Yes' : 'No'}`);
      }

      lines.push('');
    }

    return lines.join('\n').trim();
  },

  generatePreview(data: QuoteClientData): FormattedPreview {
    const sections: PreviewSection[] = [];

    // Applicant Information
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
          fields.push({ name: 'Mailing Address', value: addrStr });
        }
      }

      if (fields.length > 0) {
        sections.push({ label: 'Applicant Information', fields });
      }
    }

    // Property Information
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
        fields.push({ name: 'Square Footage', value: prop.squareFootage.toLocaleString() });
      }
      if (prop.dwellingCoverage) {
        fields.push({ name: 'Dwelling Coverage', value: formatCurrency(prop.dwellingCoverage) });
      }

      if (fields.length > 0) {
        sections.push({ label: 'Property Information', fields });
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
        if (v.vin) {
          fields.push({ name: `VIN ${i + 1}`, value: v.vin });
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
        if (d.dateOfBirth) {
          fields.push({ name: `DOB ${i + 1}`, value: formatDate(d.dateOfBirth) });
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
    if (!data.personal?.dateOfBirth) {
      warnings.push('Date of Birth is recommended');
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

      // RAM Mutual regional check - Wisconsin/Illinois focus
      const state = data.property.address?.state?.toUpperCase();
      if (state && !['WI', 'IL', 'WISCONSIN', 'ILLINOIS'].includes(state)) {
        warnings.push(`RAM Mutual primarily serves Wisconsin and Illinois. Property is in ${state}.`);
      }

      if (!data.property.yearBuilt) {
        warnings.push('Year Built is recommended for accurate quotes');
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
