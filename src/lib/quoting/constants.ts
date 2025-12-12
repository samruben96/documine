/**
 * Quoting Constants
 * Story Q3.1: Data Capture Forms
 *
 * AC-Q3.1-6: State dropdown contains 50 states + DC (51 options)
 * AC-Q3.1-10, AC-Q3.1-11: Property field options
 * AC-Q3.1-16: Vehicle year dropdown (1990 to current year + 1)
 * AC-Q3.1-22: Auto coverage options
 * AC-Q3.1-25: Driver relationship options
 */

/**
 * US States + DC (51 total)
 * AC-Q3.1-6: State dropdown must contain all 50 US states plus DC
 */
export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District of Columbia' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
] as const;

export type StateCode = (typeof US_STATES)[number]['value'];

/**
 * Construction Types
 * AC-Q3.1-10: Construction Type dropdown
 */
export const CONSTRUCTION_TYPES = [
  { value: 'frame', label: 'Frame' },
  { value: 'masonry', label: 'Masonry' },
  { value: 'superior', label: 'Superior' },
] as const;

export type ConstructionType = (typeof CONSTRUCTION_TYPES)[number]['value'];

/**
 * Roof Types
 * AC-Q3.1-10: Roof Type dropdown
 */
export const ROOF_TYPES = [
  { value: 'asphalt', label: 'Asphalt' },
  { value: 'tile', label: 'Tile' },
  { value: 'metal', label: 'Metal' },
  { value: 'slate', label: 'Slate' },
  { value: 'other', label: 'Other' },
] as const;

export type RoofType = (typeof ROOF_TYPES)[number]['value'];

/**
 * Property Liability Coverage Options
 * AC-Q3.1-11: Liability Coverage dropdown
 */
export const LIABILITY_COVERAGE_OPTIONS = [
  { value: '100000', label: '$100,000' },
  { value: '300000', label: '$300,000' },
  { value: '500000', label: '$500,000' },
  { value: '1000000', label: '$1,000,000' },
] as const;

/**
 * Property Deductible Options
 * AC-Q3.1-11: Deductible dropdown
 */
export const PROPERTY_DEDUCTIBLE_OPTIONS = [
  { value: '500', label: '$500' },
  { value: '1000', label: '$1,000' },
  { value: '2500', label: '$2,500' },
  { value: '5000', label: '$5,000' },
] as const;

/**
 * Vehicle Usage Options
 * AC-Q3.1-16: Usage dropdown
 */
export const VEHICLE_USAGE_OPTIONS = [
  { value: 'commute', label: 'Commute' },
  { value: 'pleasure', label: 'Pleasure' },
  { value: 'business', label: 'Business' },
] as const;

export type VehicleUsage = (typeof VEHICLE_USAGE_OPTIONS)[number]['value'];

/**
 * Generate vehicle year options
 * AC-Q3.1-16: Year dropdown (1990 to current year + 1)
 */
export function getVehicleYearOptions(): { value: string; label: string }[] {
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear + 1;
  const minYear = 1990;
  const years: { value: string; label: string }[] = [];

  for (let year = maxYear; year >= minYear; year--) {
    years.push({ value: year.toString(), label: year.toString() });
  }

  return years;
}

/**
 * Bodily Injury Liability Options
 * AC-Q3.1-22: Bodily Injury Liability dropdown
 */
export const BODILY_INJURY_OPTIONS = [
  { value: '50/100', label: '50/100 ($50K/$100K)' },
  { value: '100/300', label: '100/300 ($100K/$300K)' },
  { value: '250/500', label: '250/500 ($250K/$500K)' },
] as const;

/**
 * Property Damage Liability Options
 * AC-Q3.1-22: Property Damage Liability dropdown
 */
export const PROPERTY_DAMAGE_OPTIONS = [
  { value: '50000', label: '$50,000' },
  { value: '100000', label: '$100,000' },
  { value: '250000', label: '$250,000' },
] as const;

/**
 * Comprehensive/Collision Deductible Options
 * AC-Q3.1-22: Deductible dropdowns
 */
export const AUTO_DEDUCTIBLE_OPTIONS = [
  { value: '250', label: '$250' },
  { value: '500', label: '$500' },
  { value: '1000', label: '$1,000' },
] as const;

/**
 * Driver Relationship Options
 * AC-Q3.1-25: Relationship dropdown
 */
export const DRIVER_RELATIONSHIP_OPTIONS = [
  { value: 'self', label: 'Self' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'other', label: 'Other' },
] as const;

export type DriverRelationship = (typeof DRIVER_RELATIONSHIP_OPTIONS)[number]['value'];

/**
 * Maximum limits
 * AC-Q3.1-15: Maximum 6 vehicles
 * AC-Q3.1-24: Maximum 8 drivers
 */
export const MAX_VEHICLES = 6;
export const MAX_DRIVERS = 8;

/**
 * Years licensed range
 * AC-Q3.1-25: Years Licensed (number: 0-70)
 */
export const MIN_YEARS_LICENSED = 0;
export const MAX_YEARS_LICENSED = 70;

/**
 * Accidents/Violations range
 * AC-Q3.1-25: Accidents/Violations past 5 years (number: 0-10)
 */
export const MIN_INCIDENTS = 0;
export const MAX_INCIDENTS = 10;
