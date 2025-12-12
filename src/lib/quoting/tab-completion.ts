/**
 * Tab Completion Status Utility
 * Story Q2.3: Quote Session Detail Page
 * Story Q3.1: Data Capture Forms
 *
 * AC-Q2.3-2: Calculate completion status for each tab
 * AC-Q3.1-30: Show ✓ checkmark when all required fields filled with valid data
 * AC-Q3.1-31: Show item counts (vehicles, drivers)
 */

import type { QuoteClientData, Vehicle, Driver } from '@/types/quoting';

export interface TabCompletionStatus {
  /** Tab is considered complete */
  isComplete: boolean;
  /** Count for multi-item sections (vehicles, drivers, results) */
  count?: number;
}

export type TabId = 'client-info' | 'property' | 'auto' | 'drivers' | 'carriers' | 'results';

/**
 * Check if a vehicle has all required fields filled
 * Required: year, make, model, usage, annualMileage
 */
function isVehicleComplete(vehicle: Vehicle): boolean {
  return Boolean(
    vehicle.year &&
    vehicle.make?.trim() &&
    vehicle.model?.trim() &&
    vehicle.usage &&
    vehicle.annualMileage
  );
}

/**
 * Check if a driver has all required fields filled
 * Required: firstName, lastName, dateOfBirth, licenseNumber, licenseState
 */
function isDriverComplete(driver: Driver): boolean {
  return Boolean(
    driver.firstName?.trim() &&
    driver.lastName?.trim() &&
    driver.dateOfBirth &&
    driver.licenseNumber?.trim() &&
    driver.licenseState
  );
}

/**
 * Get completion status for all tabs
 *
 * AC-Q2.3-2: Tab completion indicators
 * AC-Q3.1-30: Checkmark when ALL required fields in section are filled with valid data
 * AC-Q3.1-31: Tab labels show counts (e.g., "Auto (2 vehicles)", "Drivers (3 drivers)")
 *
 * Completion rules:
 * - Client Info: firstName, lastName, email, phone, dateOfBirth, full mailing address
 * - Property: property address fields + yearBuilt
 * - Auto: at least 1 complete vehicle (year, make, model, usage, mileage)
 * - Drivers: at least 1 complete driver (firstName, lastName, DOB, license, state)
 * - Carriers: N/A (always show neutral - no completion indicator)
 * - Results: has at least 1 quote result
 */
export function getTabCompletionStatus(
  clientData: QuoteClientData | null | undefined,
  carrierCount: number = 0
): Record<TabId, TabCompletionStatus> {
  const personal = clientData?.personal;
  const property = clientData?.property;
  const auto = clientData?.auto;

  const vehicles = auto?.vehicles ?? [];
  const drivers = auto?.drivers ?? [];

  // Count all items (for display)
  const vehicleCount = vehicles.length;
  const driverCount = drivers.length;

  // Count complete items (for completion check)
  const completeVehicleCount = vehicles.filter(isVehicleComplete).length;
  const completeDriverCount = drivers.filter(isDriverComplete).length;

  return {
    'client-info': {
      // AC-Q3.1-30: All required fields filled
      isComplete: Boolean(
        personal?.firstName?.trim() &&
        personal?.lastName?.trim() &&
        personal?.email?.trim() &&
        personal?.phone?.trim() &&
        personal?.dateOfBirth &&
        personal?.mailingAddress?.street?.trim() &&
        personal?.mailingAddress?.city?.trim() &&
        personal?.mailingAddress?.state &&
        personal?.mailingAddress?.zipCode?.trim()
      ),
    },
    property: {
      // AC-Q3.1-30: Property address and required fields
      isComplete: Boolean(
        property?.address?.street?.trim() &&
        property?.address?.city?.trim() &&
        property?.address?.state &&
        property?.address?.zipCode?.trim() &&
        property?.yearBuilt
      ),
    },
    auto: {
      // AC-Q3.1-30: At least 1 complete vehicle
      isComplete: completeVehicleCount > 0,
      // AC-Q3.1-31: Show total vehicle count
      count: vehicleCount > 0 ? vehicleCount : undefined,
    },
    drivers: {
      // AC-Q3.1-30: At least 1 complete driver
      isComplete: completeDriverCount > 0,
      // AC-Q3.1-31: Show total driver count
      count: driverCount > 0 ? driverCount : undefined,
    },
    carriers: {
      // Carriers tab never shows completion - it's an action tab
      isComplete: false,
    },
    results: {
      isComplete: carrierCount > 0,
      count: carrierCount > 0 ? carrierCount : undefined,
    },
  };
}

/**
 * Get visible tabs based on quote type
 *
 * AC-Q2.3-3: Property tab hidden for Auto-only quotes
 * AC-Q2.3-4: Auto and Drivers tabs hidden for Home-only quotes
 */
export function getVisibleTabs(quoteType: 'home' | 'auto' | 'bundle'): TabId[] {
  const allTabs: TabId[] = ['client-info', 'property', 'auto', 'drivers', 'carriers', 'results'];

  switch (quoteType) {
    case 'home':
      // Hide Auto and Drivers tabs
      return allTabs.filter((tab) => tab !== 'auto' && tab !== 'drivers');
    case 'auto':
      // Hide Property tab
      return allTabs.filter((tab) => tab !== 'property');
    case 'bundle':
      // Show all tabs
      return allTabs;
    default:
      return allTabs;
  }
}

/**
 * Tab configuration
 */
export interface TabConfig {
  id: TabId;
  label: string;
  /** Label for count badge (singular) */
  countLabel?: string;
  /** Label for count badge (plural) */
  countLabelPlural?: string;
}

export const TAB_CONFIG: TabConfig[] = [
  { id: 'client-info', label: 'Client Info' },
  { id: 'property', label: 'Property' },
  { id: 'auto', label: 'Auto', countLabel: 'vehicle', countLabelPlural: 'vehicles' },
  { id: 'drivers', label: 'Drivers', countLabel: 'driver', countLabelPlural: 'drivers' },
  { id: 'carriers', label: 'Carriers' },
  { id: 'results', label: 'Results', countLabel: 'quote', countLabelPlural: 'quotes' },
];
