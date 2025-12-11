/**
 * Tab Completion Status Utility
 * Story Q2.3: Quote Session Detail Page
 *
 * AC-Q2.3-2: Calculate completion status for each tab
 */

import type { QuoteClientData } from '@/types/quoting';

export interface TabCompletionStatus {
  /** Tab is considered complete */
  isComplete: boolean;
  /** Count for multi-item sections (vehicles, drivers, results) */
  count?: number;
}

export type TabId = 'client-info' | 'property' | 'auto' | 'drivers' | 'carriers' | 'results';

/**
 * Get completion status for all tabs
 *
 * AC-Q2.3-2: Tab completion indicators
 * - Checkmark (isComplete) when section is complete
 * - Count for multi-item sections (e.g., "2 vehicles", "2 drivers")
 *
 * Completion rules:
 * - Client Info: has firstName + lastName + email + phone
 * - Property: has address + yearBuilt
 * - Auto: has at least 1 vehicle
 * - Drivers: has at least 1 driver
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

  const vehicleCount = auto?.vehicles?.length ?? 0;
  const driverCount = auto?.drivers?.length ?? 0;

  return {
    'client-info': {
      isComplete: Boolean(
        personal?.firstName &&
        personal?.lastName &&
        personal?.email &&
        personal?.phone
      ),
    },
    property: {
      isComplete: Boolean(
        property?.address?.street &&
        property?.address?.city &&
        property?.address?.state &&
        property?.address?.zipCode &&
        property?.yearBuilt
      ),
    },
    auto: {
      isComplete: vehicleCount > 0,
      count: vehicleCount > 0 ? vehicleCount : undefined,
    },
    drivers: {
      isComplete: driverCount > 0,
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
