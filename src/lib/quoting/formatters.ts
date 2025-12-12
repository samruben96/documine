/**
 * Quoting Formatters
 * Story Q3.1: Data Capture Forms
 *
 * AC-Q3.1-3: Phone auto-format as (XXX) XXX-XXXX
 * AC-Q3.1-12: Currency display with $ and thousands separators
 * AC-Q3.1-7: Date formatting MM/DD/YYYY
 * AC-Q3.1-27: License number masking
 */

/**
 * Format phone number as (XXX) XXX-XXXX while typing
 * AC-Q3.1-3: Auto-formats as user enters digits
 *
 * @param value - Raw input value
 * @returns Formatted phone string
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');

  // Limit to 10 digits
  const truncated = digits.slice(0, 10);

  // Format based on length
  if (truncated.length === 0) {
    return '';
  } else if (truncated.length <= 3) {
    return `(${truncated}`;
  } else if (truncated.length <= 6) {
    return `(${truncated.slice(0, 3)}) ${truncated.slice(3)}`;
  } else {
    return `(${truncated.slice(0, 3)}) ${truncated.slice(3, 6)}-${truncated.slice(6)}`;
  }
}

/**
 * Extract raw digits from formatted phone number
 *
 * @param formattedPhone - Formatted phone string like (123) 456-7890
 * @returns Raw digits like 1234567890
 */
export function unformatPhoneNumber(formattedPhone: string): string {
  return formattedPhone.replace(/\D/g, '');
}

/**
 * Validate phone number has 10 digits
 *
 * @param value - Phone number (formatted or raw)
 * @returns True if valid 10-digit phone
 */
export function isValidPhoneNumber(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10;
}

/**
 * Format currency with $ and thousands separators
 * AC-Q3.1-12: Display on blur with $ prefix and commas
 *
 * @param value - Number or string value
 * @returns Formatted string like "$250,000"
 */
export function formatCurrency(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.]/g, '')) : value;

  if (isNaN(numValue)) {
    return '';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
}

/**
 * Format currency for display with optional decimal support
 * AC-Q3.3-14: Display with $ prefix and thousands separators
 * AC-Q3.3-16: Preserve decimals when present
 *
 * @param value - Number or string value
 * @param preserveDecimals - If true, always show 2 decimal places
 * @returns Formatted string like "$350,000" or "$1,234.56"
 */
export function formatCurrencyDisplay(
  value: number | string | undefined | null,
  preserveDecimals = false
): string {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;

  if (isNaN(numValue)) {
    return '';
  }

  // Check if original value had decimals
  const hasDecimals = preserveDecimals || (typeof value === 'string' && value.includes('.'));
  const decimalPlaces = hasDecimals ? 2 : 0;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(numValue);
}

/**
 * Parse currency input for editing (strip formatting)
 * AC-Q3.3-15: Convert back to digits-only for editing on focus
 *
 * @param formattedValue - Formatted currency string like "$350,000"
 * @returns Raw numeric string like "350000" for editing
 */
export function parseCurrencyForEdit(formattedValue: string): string {
  if (!formattedValue) return '';
  // Remove $ and commas, keep digits and decimal point
  return formattedValue.replace(/[^\d.]/g, '');
}

/**
 * Parse currency string to number
 *
 * @param value - Currency string like "$250,000"
 * @returns Number value like 250000
 */
export function parseCurrency(value: string): number | undefined {
  if (!value) return undefined;

  const cleaned = value.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);

  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Format currency while typing (allows partial input)
 * Only formats on blur, this returns cleaned digits for typing
 *
 * @param value - Raw input value
 * @returns Cleaned numeric string for typing
 */
export function formatCurrencyInput(value: string): string {
  // Remove non-numeric except decimal
  return value.replace(/[^\d]/g, '');
}

/**
 * Format date as MM/DD/YYYY
 * AC-Q3.1-7: Date picker display format
 *
 * @param date - Date object or ISO string
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | undefined | null): string {
  if (!date) return '';

  // Handle ISO date strings (YYYY-MM-DD) directly to avoid timezone issues
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const parts = date.split('T')[0]?.split('-');
    if (parts && parts.length >= 3) {
      const [year, month, day] = parts;
      if (year && month && day) {
        return `${month}/${day}/${year}`;
      }
    }
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const year = dateObj.getFullYear();

  return `${month}/${day}/${year}`;
}

/**
 * Parse date string MM/DD/YYYY to Date
 *
 * @param dateStr - Date string like "01/15/1990"
 * @returns Date object or undefined
 */
export function parseDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;

  // Handle ISO format
  if (dateStr.includes('-') && dateStr.length >= 10) {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  }

  // Handle MM/DD/YYYY format
  const parts = dateStr.split('/');
  if (parts.length !== 3) return undefined;

  const numParts = parts.map(Number);
  const month = numParts[0];
  const day = numParts[1];
  const year = numParts[2];
  if (month === undefined || day === undefined || year === undefined) return undefined;
  if (isNaN(month) || isNaN(day) || isNaN(year)) return undefined;

  const date = new Date(year, month - 1, day);

  // Validate the date is real
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
}

/**
 * Format date to ISO string for storage
 *
 * @param date - Date object
 * @returns ISO date string YYYY-MM-DD
 */
export function toISODateString(date: Date | undefined | null): string {
  if (!date) return '';
  const isoStr = date.toISOString();
  return isoStr.split('T')[0] ?? isoStr;
}

/**
 * Mask license number to show only last 4 characters
 * AC-Q3.1-27: Display masked (e.g., "••••••1234")
 *
 * @param licenseNumber - Full license number
 * @returns Masked string
 */
export function maskLicenseNumber(licenseNumber: string | undefined | null): string {
  if (!licenseNumber) return '';

  const len = licenseNumber.length;
  if (len <= 4) {
    return licenseNumber;
  }

  const masked = '•'.repeat(len - 4);
  const visible = licenseNumber.slice(-4);
  return masked + visible;
}

/**
 * Format VIN to uppercase and validate characters
 * AC-Q3.1-17: Auto-uppercase and exclude I, O, Q
 *
 * @param value - Raw VIN input
 * @returns Uppercase VIN with invalid chars removed
 */
export function formatVIN(value: string): string {
  // Convert to uppercase and remove invalid characters (I, O, Q not allowed in VINs)
  return value
    .toUpperCase()
    .replace(/[^A-HJ-NPR-Z0-9]/g, '')
    .slice(0, 17);
}

/**
 * Validate VIN format
 * AC-Q3.1-17: 17 characters, alphanumeric excluding I, O, Q
 *
 * @param vin - VIN string
 * @returns True if valid format
 */
export function isValidVINFormat(vin: string): boolean {
  if (!vin || vin.length !== 17) return false;
  // VINs only contain A-H, J-N, P-R, S-Z, and 0-9 (no I, O, Q)
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
}

/**
 * Format ZIP code with auto-hyphen for ZIP+4
 * AC-Q3.3-8: Auto-insert hyphen after 5th digit for ZIP+4
 *
 * @param value - Raw ZIP code input
 * @returns Formatted ZIP code (XXXXX or XXXXX-XXXX)
 */
export function formatZipCode(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');

  // Limit to 9 digits (5 + 4)
  const truncated = digits.slice(0, 9);

  // Format based on length
  if (truncated.length <= 5) {
    return truncated;
  } else {
    // Insert hyphen after 5th digit
    return `${truncated.slice(0, 5)}-${truncated.slice(5)}`;
  }
}

/**
 * Validate ZIP code format
 * AC-Q3.3-6: 5 digits (XXXXX) or ZIP+4 (XXXXX-XXXX)
 *
 * @param zipCode - ZIP code string
 * @returns True if valid format
 */
export function isValidZipCode(zipCode: string): boolean {
  if (!zipCode) return false;
  return /^\d{5}(-\d{4})?$/.test(zipCode);
}
