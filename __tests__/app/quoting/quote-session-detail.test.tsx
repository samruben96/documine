/**
 * @vitest-environment happy-dom
 */
/**
 * Quote Session Detail Page Tests
 * Story Q2.3: Quote Session Detail Page Structure
 *
 * Note: The page component uses React's `use()` for async params which is
 * challenging to test with React Testing Library. Core logic is tested via:
 * - __tests__/lib/quoting/tab-completion.test.ts (completion logic)
 * - __tests__/hooks/quoting/use-quote-session.test.ts (data fetching)
 * - __tests__/e2e/quoting/quote-session-detail.spec.ts (E2E tests)
 *
 * This file tests the tab component logic in isolation.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  getTabCompletionStatus,
  getVisibleTabs,
  TAB_CONFIG,
  type TabId,
  type TabCompletionStatus,
} from '@/lib/quoting/tab-completion';

// Import tab components for basic rendering tests
import { ClientInfoTab } from '@/components/quoting/tabs/client-info-tab';
import { PropertyTab } from '@/components/quoting/tabs/property-tab';
import { AutoTab } from '@/components/quoting/tabs/auto-tab';
import { DriversTab } from '@/components/quoting/tabs/drivers-tab';
import { CarriersTab } from '@/components/quoting/tabs/carriers-tab';
import { ResultsTab } from '@/components/quoting/tabs/results-tab';

describe('Tab Components', () => {
  describe('ClientInfoTab', () => {
    it('renders placeholder content', () => {
      render(<ClientInfoTab />);
      // Get the title from the card header
      expect(screen.getByText('Client Information')).toBeInTheDocument();
      expect(screen.getByText(/coming in Story Q3\.1/i)).toBeInTheDocument();
    });
  });

  describe('PropertyTab', () => {
    it('renders placeholder content', () => {
      render(<PropertyTab />);
      expect(screen.getByText('Property Information')).toBeInTheDocument();
      expect(screen.getByText(/coming in Story Q3\.3/i)).toBeInTheDocument();
    });
  });

  describe('AutoTab', () => {
    it('renders placeholder content', () => {
      render(<AutoTab />);
      expect(screen.getByText('Vehicles')).toBeInTheDocument();
      expect(screen.getByText(/coming in Story Q3\.4/i)).toBeInTheDocument();
    });
  });

  describe('DriversTab', () => {
    it('renders placeholder content', () => {
      render(<DriversTab />);
      // Get the title specifically from the card header
      const title = screen.getByText('Drivers');
      expect(title).toBeInTheDocument();
      expect(screen.getByText(/coming in Story Q3\.5/i)).toBeInTheDocument();
    });
  });

  describe('CarriersTab', () => {
    it('renders placeholder content', () => {
      render(<CarriersTab />);
      expect(screen.getByText('Carriers')).toBeInTheDocument();
      expect(screen.getByText(/coming in Story Q4\.3/i)).toBeInTheDocument();
    });
  });

  describe('ResultsTab', () => {
    it('renders placeholder content', () => {
      render(<ResultsTab />);
      expect(screen.getByText('Quote Results')).toBeInTheDocument();
      expect(screen.getByText(/coming in Story Q5\.2/i)).toBeInTheDocument();
    });
  });
});

describe('Tab Completion Logic (via utility)', () => {
  // These tests verify the core logic that powers AC-Q2.3-2

  describe('AC-Q2.3-2: Completion status calculation', () => {
    it('calculates incomplete status for empty data', () => {
      const status = getTabCompletionStatus({}, 0);

      expect(status['client-info'].isComplete).toBe(false);
      expect(status.property.isComplete).toBe(false);
      expect(status.auto.isComplete).toBe(false);
      expect(status.drivers.isComplete).toBe(false);
      expect(status.results.isComplete).toBe(false);
    });

    it('calculates complete status for full client info', () => {
      const status = getTabCompletionStatus({
        personal: {
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@example.com',
          phone: '555-1234',
        },
      }, 0);

      expect(status['client-info'].isComplete).toBe(true);
    });

    it('shows vehicle count', () => {
      const status = getTabCompletionStatus({
        auto: {
          vehicles: [
            { year: 2020, make: 'Toyota', model: 'Camry' },
            { year: 2018, make: 'Honda', model: 'Civic' },
          ],
        },
      }, 0);

      expect(status.auto.count).toBe(2);
    });

    it('shows quote results count', () => {
      const status = getTabCompletionStatus({}, 3);

      expect(status.results.isComplete).toBe(true);
      expect(status.results.count).toBe(3);
    });
  });
});

describe('Tab Visibility Logic (via utility)', () => {
  describe('AC-Q2.3-3: Property tab hidden for Auto-only quotes', () => {
    it('excludes property from auto quote tabs', () => {
      const tabs = getVisibleTabs('auto');
      expect(tabs).not.toContain('property');
      expect(tabs).toContain('auto');
      expect(tabs).toContain('drivers');
    });
  });

  describe('AC-Q2.3-4: Auto and Drivers tabs hidden for Home-only quotes', () => {
    it('excludes auto and drivers from home quote tabs', () => {
      const tabs = getVisibleTabs('home');
      expect(tabs).not.toContain('auto');
      expect(tabs).not.toContain('drivers');
      expect(tabs).toContain('property');
    });
  });

  describe('Bundle shows all tabs', () => {
    it('includes all tabs for bundle', () => {
      const tabs = getVisibleTabs('bundle');
      expect(tabs).toHaveLength(6);
      expect(tabs).toContain('client-info');
      expect(tabs).toContain('property');
      expect(tabs).toContain('auto');
      expect(tabs).toContain('drivers');
      expect(tabs).toContain('carriers');
      expect(tabs).toContain('results');
    });
  });
});
