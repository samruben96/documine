/**
 * @vitest-environment happy-dom
 */
/**
 * Tests for AnalyticsDateRangePicker Component
 * Story 20.3: Usage Analytics Dashboard
 *
 * Tests:
 * - AC-20.3.3: Date range picker with presets
 * - Period selection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalyticsDateRangePicker, getDefaultDateRange } from '@/components/ai-buddy/admin/analytics/date-range-picker';
import type { AnalyticsDateRange } from '@/components/ai-buddy/admin/analytics/date-range-picker';

describe('AnalyticsDateRangePicker', () => {
  const mockOnChange = vi.fn();

  const defaultValue: AnalyticsDateRange = {
    period: '30days',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-14'),
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('renders the date range picker container', () => {
      render(<AnalyticsDateRangePicker value={defaultValue} onChange={mockOnChange} />);

      expect(screen.getByTestId('analytics-date-range-picker')).toBeInTheDocument();
    });

    it('renders a period selector', () => {
      render(<AnalyticsDateRangePicker value={defaultValue} onChange={mockOnChange} />);

      expect(screen.getByTestId('period-select')).toBeInTheDocument();
    });

    it('displays the date range summary', () => {
      render(<AnalyticsDateRangePicker value={defaultValue} onChange={mockOnChange} />);

      expect(screen.getByTestId('date-range-summary')).toBeInTheDocument();
    });

    it('displays formatted date range text', () => {
      render(<AnalyticsDateRangePicker value={defaultValue} onChange={mockOnChange} />);

      // The date range summary should be visible
      const summary = screen.getByTestId('date-range-summary');
      expect(summary).toHaveTextContent(/Jan/);
    });
  });

  describe('getDefaultDateRange', () => {
    it('returns a valid date range object', () => {
      const range = getDefaultDateRange();

      expect(range.period).toBe('30days');
      expect(range.startDate).toBeInstanceOf(Date);
      expect(range.endDate).toBeInstanceOf(Date);
    });

    it('returns endDate that is today or very recent', () => {
      const range = getDefaultDateRange();
      const now = new Date();
      const endDiff = Math.abs(range.endDate.getTime() - now.getTime());

      // Within 24 hours
      expect(endDiff).toBeLessThan(24 * 60 * 60 * 1000);
    });

    it('returns a range spanning approximately 30 days', () => {
      const range = getDefaultDateRange();
      const daysDiff = (range.endDate.getTime() - range.startDate.getTime()) / (1000 * 60 * 60 * 24);

      // Should be around 29-30 days (depending on implementation)
      expect(Math.round(daysDiff)).toBeGreaterThanOrEqual(29);
      expect(Math.round(daysDiff)).toBeLessThanOrEqual(31);
    });
  });

});
