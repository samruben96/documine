/**
 * Tab Completion Status Tests
 * Story Q2.3: Quote Session Detail Page
 *
 * Tests for:
 * - AC-Q2.3-2: Tab completion indicators
 * - AC-Q2.3-3: Property tab hidden for Auto-only quotes
 * - AC-Q2.3-4: Auto and Drivers tabs hidden for Home-only quotes
 */

import { describe, it, expect } from 'vitest';
import {
  getTabCompletionStatus,
  getVisibleTabs,
  TAB_CONFIG,
  type TabId,
} from '@/lib/quoting/tab-completion';
import type { QuoteClientData } from '@/types/quoting';

describe('getTabCompletionStatus', () => {
  describe('Client Info tab', () => {
    it('returns isComplete: false when clientData is null', () => {
      const result = getTabCompletionStatus(null, 0);
      expect(result['client-info'].isComplete).toBe(false);
    });

    it('returns isComplete: false when clientData is empty', () => {
      const result = getTabCompletionStatus({}, 0);
      expect(result['client-info'].isComplete).toBe(false);
    });

    it('returns isComplete: false when only partial personal info', () => {
      const clientData: QuoteClientData = {
        personal: {
          firstName: 'John',
          lastName: 'Smith',
        },
      };
      const result = getTabCompletionStatus(clientData, 0);
      expect(result['client-info'].isComplete).toBe(false);
    });

    it('returns isComplete: true when all required personal fields present', () => {
      const clientData: QuoteClientData = {
        personal: {
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@example.com',
          phone: '555-1234',
        },
      };
      const result = getTabCompletionStatus(clientData, 0);
      expect(result['client-info'].isComplete).toBe(true);
    });
  });

  describe('Property tab', () => {
    it('returns isComplete: false when property is empty', () => {
      const result = getTabCompletionStatus({}, 0);
      expect(result.property.isComplete).toBe(false);
    });

    it('returns isComplete: false when only partial property info', () => {
      const clientData: QuoteClientData = {
        property: {
          yearBuilt: 2000,
        },
      };
      const result = getTabCompletionStatus(clientData, 0);
      expect(result.property.isComplete).toBe(false);
    });

    it('returns isComplete: true when address and yearBuilt present', () => {
      const clientData: QuoteClientData = {
        property: {
          address: {
            street: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            zipCode: '12345',
          },
          yearBuilt: 2000,
        },
      };
      const result = getTabCompletionStatus(clientData, 0);
      expect(result.property.isComplete).toBe(true);
    });
  });

  describe('Auto tab', () => {
    it('returns isComplete: false and no count when no vehicles', () => {
      const result = getTabCompletionStatus({}, 0);
      expect(result.auto.isComplete).toBe(false);
      expect(result.auto.count).toBeUndefined();
    });

    it('returns isComplete: false and no count when vehicles array is empty', () => {
      const clientData: QuoteClientData = {
        auto: {
          vehicles: [],
        },
      };
      const result = getTabCompletionStatus(clientData, 0);
      expect(result.auto.isComplete).toBe(false);
      expect(result.auto.count).toBeUndefined();
    });

    it('returns isComplete: true and count when has vehicles', () => {
      const clientData: QuoteClientData = {
        auto: {
          vehicles: [
            { year: 2020, make: 'Toyota', model: 'Camry' },
            { year: 2018, make: 'Honda', model: 'Civic' },
          ],
        },
      };
      const result = getTabCompletionStatus(clientData, 0);
      expect(result.auto.isComplete).toBe(true);
      expect(result.auto.count).toBe(2);
    });
  });

  describe('Drivers tab', () => {
    it('returns isComplete: false and no count when no drivers', () => {
      const result = getTabCompletionStatus({}, 0);
      expect(result.drivers.isComplete).toBe(false);
      expect(result.drivers.count).toBeUndefined();
    });

    it('returns isComplete: true and count when has drivers', () => {
      const clientData: QuoteClientData = {
        auto: {
          drivers: [
            { firstName: 'John', lastName: 'Smith' },
          ],
        },
      };
      const result = getTabCompletionStatus(clientData, 0);
      expect(result.drivers.isComplete).toBe(true);
      expect(result.drivers.count).toBe(1);
    });
  });

  describe('Carriers tab', () => {
    it('always returns isComplete: false (action tab)', () => {
      const result = getTabCompletionStatus({}, 0);
      expect(result.carriers.isComplete).toBe(false);
    });
  });

  describe('Results tab', () => {
    it('returns isComplete: false and no count when carrierCount is 0', () => {
      const result = getTabCompletionStatus({}, 0);
      expect(result.results.isComplete).toBe(false);
      expect(result.results.count).toBeUndefined();
    });

    it('returns isComplete: true and count when carrierCount > 0', () => {
      const result = getTabCompletionStatus({}, 3);
      expect(result.results.isComplete).toBe(true);
      expect(result.results.count).toBe(3);
    });
  });
});

describe('getVisibleTabs', () => {
  describe('AC-Q2.3-3: Property tab hidden for Auto-only quotes', () => {
    it('excludes property tab for auto quote type', () => {
      const tabs = getVisibleTabs('auto');
      expect(tabs).not.toContain('property');
    });

    it('includes client-info, auto, drivers, carriers, results for auto', () => {
      const tabs = getVisibleTabs('auto');
      expect(tabs).toContain('client-info');
      expect(tabs).toContain('auto');
      expect(tabs).toContain('drivers');
      expect(tabs).toContain('carriers');
      expect(tabs).toContain('results');
    });
  });

  describe('AC-Q2.3-4: Auto and Drivers tabs hidden for Home-only quotes', () => {
    it('excludes auto tab for home quote type', () => {
      const tabs = getVisibleTabs('home');
      expect(tabs).not.toContain('auto');
    });

    it('excludes drivers tab for home quote type', () => {
      const tabs = getVisibleTabs('home');
      expect(tabs).not.toContain('drivers');
    });

    it('includes client-info, property, carriers, results for home', () => {
      const tabs = getVisibleTabs('home');
      expect(tabs).toContain('client-info');
      expect(tabs).toContain('property');
      expect(tabs).toContain('carriers');
      expect(tabs).toContain('results');
    });
  });

  describe('Bundle shows all tabs', () => {
    it('includes all tabs for bundle quote type', () => {
      const tabs = getVisibleTabs('bundle');
      const allTabs: TabId[] = ['client-info', 'property', 'auto', 'drivers', 'carriers', 'results'];
      expect(tabs).toEqual(allTabs);
    });
  });
});

describe('TAB_CONFIG', () => {
  it('has configuration for all tabs', () => {
    const tabIds: TabId[] = ['client-info', 'property', 'auto', 'drivers', 'carriers', 'results'];
    const configTabIds = TAB_CONFIG.map((t) => t.id);
    expect(configTabIds).toEqual(tabIds);
  });

  it('has count labels for multi-item tabs', () => {
    const autoTab = TAB_CONFIG.find((t) => t.id === 'auto');
    expect(autoTab?.countLabel).toBe('vehicle');
    expect(autoTab?.countLabelPlural).toBe('vehicles');

    const driversTab = TAB_CONFIG.find((t) => t.id === 'drivers');
    expect(driversTab?.countLabel).toBe('driver');
    expect(driversTab?.countLabelPlural).toBe('drivers');

    const resultsTab = TAB_CONFIG.find((t) => t.id === 'results');
    expect(resultsTab?.countLabel).toBe('quote');
    expect(resultsTab?.countLabelPlural).toBe('quotes');
  });
});
