/**
 * Unit Tests - DateRangeFilter Component
 * Story 19.2: Enforcement Logging
 *
 * Tests for date range filter component with presets
 *
 * AC-19.2.6: Support date range filtering
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DateRangeFilter, type DateRange } from '@/components/ai-buddy/admin/date-range-filter';

describe('DateRangeFilter', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date to ensure consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultProps = {
    value: { startDate: undefined, endDate: undefined } as DateRange,
    onChange: mockOnChange,
  };

  it('renders preset selector and date inputs', () => {
    render(<DateRangeFilter {...defaultProps} />);

    expect(screen.getByTestId('date-preset-select')).toBeInTheDocument();
    expect(screen.getByTestId('start-date-input')).toBeInTheDocument();
    expect(screen.getByTestId('end-date-input')).toBeInTheDocument();
  });

  it('does not show clear button when no dates are set', () => {
    render(<DateRangeFilter {...defaultProps} />);

    expect(screen.queryByTestId('clear-date-filter')).not.toBeInTheDocument();
  });

  it('shows clear button when dates are set', () => {
    const propsWithDates = {
      ...defaultProps,
      value: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-15'),
      },
    };

    render(<DateRangeFilter {...propsWithDates} />);

    expect(screen.getByTestId('clear-date-filter')).toBeInTheDocument();
  });

  it('calls onChange with empty dates when clear is clicked', () => {
    const propsWithDates = {
      ...defaultProps,
      value: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-15'),
      },
    };

    render(<DateRangeFilter {...propsWithDates} />);

    fireEvent.click(screen.getByTestId('clear-date-filter'));

    expect(mockOnChange).toHaveBeenCalledWith({
      startDate: undefined,
      endDate: undefined,
    });
  });

  describe('manual date input', () => {
    it('updates start date when input changes', () => {
      render(<DateRangeFilter {...defaultProps} />);

      const startInput = screen.getByTestId('start-date-input');
      fireEvent.change(startInput, { target: { value: '2024-01-10' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        startDate: expect.any(Date),
        endDate: undefined,
      });

      const call = mockOnChange.mock.calls[0][0];
      expect(call.startDate.toISOString().split('T')[0]).toBe('2024-01-10');
    });

    it('updates end date when input changes', () => {
      render(<DateRangeFilter {...defaultProps} />);

      const endInput = screen.getByTestId('end-date-input');
      fireEvent.change(endInput, { target: { value: '2024-01-20' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        startDate: undefined,
        endDate: expect.any(Date),
      });

      const call = mockOnChange.mock.calls[0][0];
      expect(call.endDate.toISOString().split('T')[0]).toBe('2024-01-20');
    });

    it('clears start date when input is cleared', () => {
      const propsWithDates = {
        ...defaultProps,
        value: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-15'),
        },
      };

      render(<DateRangeFilter {...propsWithDates} />);

      const startInput = screen.getByTestId('start-date-input');
      fireEvent.change(startInput, { target: { value: '' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        startDate: undefined,
        endDate: propsWithDates.value.endDate,
      });
    });
  });

  describe('date formatting', () => {
    it('formats dates correctly in inputs', () => {
      const propsWithDates = {
        ...defaultProps,
        value: {
          startDate: new Date('2024-01-05T00:00:00Z'),
          endDate: new Date('2024-01-10T00:00:00Z'),
        },
      };

      render(<DateRangeFilter {...propsWithDates} />);

      const startInput = screen.getByTestId('start-date-input') as HTMLInputElement;
      const endInput = screen.getByTestId('end-date-input') as HTMLInputElement;

      expect(startInput.value).toBe('2024-01-05');
      expect(endInput.value).toBe('2024-01-10');
    });
  });

  describe('accessibility', () => {
    it('has proper aria labels on inputs', () => {
      render(<DateRangeFilter {...defaultProps} />);

      expect(screen.getByLabelText('Start date')).toBeInTheDocument();
      expect(screen.getByLabelText('End date')).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('applies custom className', () => {
      render(<DateRangeFilter {...defaultProps} className="custom-class" />);

      expect(screen.getByTestId('date-range-filter')).toHaveClass('custom-class');
    });
  });
});
