/**
 * Carrier Registry Tests
 * Story Q4.1: Copy Button & Carrier Formatters
 *
 * Tests carrier registry functions
 */

import { describe, it, expect } from 'vitest';
import {
  CARRIERS,
  getCarrier,
  getSupportedCarriers,
  getCarriersForQuoteType,
} from '@/lib/quoting/carriers';

describe('Carrier Registry', () => {
  describe('CARRIERS constant', () => {
    it('contains Progressive carrier', () => {
      expect(CARRIERS.progressive).toBeDefined();
      expect(CARRIERS.progressive.name).toBe('Progressive');
      expect(CARRIERS.progressive.code).toBe('progressive');
    });

    it('contains Travelers carrier', () => {
      expect(CARRIERS.travelers).toBeDefined();
      expect(CARRIERS.travelers.name).toBe('Travelers');
      expect(CARRIERS.travelers.code).toBe('travelers');
    });

    it('has portal URLs for each carrier', () => {
      expect(CARRIERS.progressive.portalUrl).toContain('http');
      expect(CARRIERS.travelers.portalUrl).toContain('http');
    });

    it('has formatter for each carrier', () => {
      expect(typeof CARRIERS.progressive.formatter.formatForClipboard).toBe('function');
      expect(typeof CARRIERS.travelers.formatter.formatForClipboard).toBe('function');
    });

    it('has lines of business for each carrier', () => {
      expect(CARRIERS.progressive.linesOfBusiness).toContain('home');
      expect(CARRIERS.progressive.linesOfBusiness).toContain('auto');
      expect(CARRIERS.progressive.linesOfBusiness).toContain('bundle');
    });
  });

  describe('getCarrier', () => {
    it('returns carrier by exact code', () => {
      const carrier = getCarrier('progressive');

      expect(carrier).toBeDefined();
      expect(carrier?.name).toBe('Progressive');
    });

    it('returns carrier with case-insensitive lookup', () => {
      const carrier = getCarrier('PROGRESSIVE');

      expect(carrier).toBeDefined();
      expect(carrier?.name).toBe('Progressive');
    });

    it('returns undefined for unknown carrier', () => {
      const carrier = getCarrier('unknown-carrier');

      expect(carrier).toBeUndefined();
    });

    it('returns Travelers carrier', () => {
      const carrier = getCarrier('travelers');

      expect(carrier).toBeDefined();
      expect(carrier?.name).toBe('Travelers');
    });
  });

  describe('getSupportedCarriers', () => {
    it('returns array of all carriers', () => {
      const carriers = getSupportedCarriers();

      expect(Array.isArray(carriers)).toBe(true);
      expect(carriers.length).toBeGreaterThanOrEqual(2);
    });

    it('includes Progressive', () => {
      const carriers = getSupportedCarriers();
      const progressive = carriers.find((c) => c.code === 'progressive');

      expect(progressive).toBeDefined();
    });

    it('includes Travelers', () => {
      const carriers = getSupportedCarriers();
      const travelers = carriers.find((c) => c.code === 'travelers');

      expect(travelers).toBeDefined();
    });

    it('returns carriers with complete info', () => {
      const carriers = getSupportedCarriers();

      carriers.forEach((carrier) => {
        expect(carrier.code).toBeDefined();
        expect(carrier.name).toBeDefined();
        expect(carrier.portalUrl).toBeDefined();
        expect(carrier.formatter).toBeDefined();
        expect(carrier.linesOfBusiness).toBeDefined();
      });
    });
  });

  describe('getCarriersForQuoteType', () => {
    it('returns carriers for home quote type', () => {
      const carriers = getCarriersForQuoteType('home');

      expect(carriers.length).toBeGreaterThan(0);
      carriers.forEach((c) => {
        expect(c.linesOfBusiness).toContain('home');
      });
    });

    it('returns carriers for auto quote type', () => {
      const carriers = getCarriersForQuoteType('auto');

      expect(carriers.length).toBeGreaterThan(0);
      carriers.forEach((c) => {
        expect(c.linesOfBusiness).toContain('auto');
      });
    });

    it('returns carriers for bundle quote type', () => {
      const carriers = getCarriersForQuoteType('bundle');

      expect(carriers.length).toBeGreaterThan(0);
      carriers.forEach((c) => {
        expect(c.linesOfBusiness).toContain('bundle');
      });
    });

    it('includes both Progressive and Travelers for all quote types', () => {
      const homeCarriers = getCarriersForQuoteType('home');
      const autoCarriers = getCarriersForQuoteType('auto');
      const bundleCarriers = getCarriersForQuoteType('bundle');

      // Both carriers support all lines
      expect(homeCarriers.some((c) => c.code === 'progressive')).toBe(true);
      expect(homeCarriers.some((c) => c.code === 'travelers')).toBe(true);
      expect(autoCarriers.some((c) => c.code === 'progressive')).toBe(true);
      expect(autoCarriers.some((c) => c.code === 'travelers')).toBe(true);
      expect(bundleCarriers.some((c) => c.code === 'progressive')).toBe(true);
      expect(bundleCarriers.some((c) => c.code === 'travelers')).toBe(true);
    });
  });
});
