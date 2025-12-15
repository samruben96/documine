/**
 * Carrier Registry
 * Story Q4.1: Copy Button & Carrier Formatters
 *
 * AC-Q4.1-1: Progressive carrier support
 * AC-Q4.1-2: Travelers carrier support
 * AC-Q4.1-12: Progressive includes all sections
 * AC-Q4.1-13: Travelers includes all sections
 */

import type { QuoteType } from '@/types/quoting';
import type { CarrierInfo } from './types';
import { progressiveFormatter } from './progressive';
import { travelersFormatter } from './travelers';
import { ramMutualFormatter } from './ram-mutual';

/**
 * Carrier registry
 * Contains all supported carriers with their formatters
 */
export const CARRIERS: Record<string, CarrierInfo> = {
  progressive: {
    code: 'progressive',
    name: 'Progressive',
    portalUrl: 'https://www.foragentsonly.com',
    logoPath: '/carriers/progressive.svg',
    formatter: progressiveFormatter,
    linesOfBusiness: ['home', 'auto', 'bundle'],
  },
  travelers: {
    code: 'travelers',
    name: 'Travelers',
    portalUrl: 'https://www.travelers.com/agent',
    logoPath: '/carriers/travelers.svg',
    formatter: travelersFormatter,
    linesOfBusiness: ['home', 'auto', 'bundle'],
  },
  'ram-mutual': {
    code: 'ram-mutual',
    name: 'RAM Mutual',
    portalUrl: 'https://www.rfrm.com/agents',
    logoPath: '/carriers/ram-mutual.svg',
    formatter: ramMutualFormatter,
    linesOfBusiness: ['home', 'auto'],
  },
};

/**
 * Get carrier by code
 *
 * @param code - Carrier code (e.g., 'progressive')
 * @returns CarrierInfo or undefined
 */
export function getCarrier(code: string): CarrierInfo | undefined {
  return CARRIERS[code.toLowerCase()];
}

/**
 * Get all supported carriers
 *
 * @returns Array of all carrier info
 */
export function getSupportedCarriers(): CarrierInfo[] {
  return Object.values(CARRIERS);
}

/**
 * Get carriers that support a specific quote type
 *
 * @param quoteType - 'home' | 'auto' | 'bundle'
 * @returns Array of carriers supporting that quote type
 */
export function getCarriersForQuoteType(quoteType: QuoteType): CarrierInfo[] {
  return Object.values(CARRIERS).filter((carrier) =>
    carrier.linesOfBusiness.includes(quoteType)
  );
}

// Re-export types
export * from './types';
