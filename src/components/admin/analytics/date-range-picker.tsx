/**
 * Date Range Picker Component for Analytics
 * Story 20.3: Usage Analytics Dashboard
 *
 * Date range selector with presets for analytics filtering.
 * AC-20.3.3: Date range filter (This week, This month, Last 30 days, Custom range)
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import type { AnalyticsPeriod } from '@/types/ai-buddy';

export interface AnalyticsDateRange {
  period: AnalyticsPeriod;
  startDate: Date;
  endDate: Date;
}

export interface AnalyticsDateRangePickerProps {
  /** Current date range value */
  value: AnalyticsDateRange;
  /** Callback when date range changes */
  onChange: (range: AnalyticsDateRange) => void;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Preset period options
 */
const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: '30days', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom range' },
];

/**
 * Calculate date range based on period type
 */
function calculateDateRange(period: AnalyticsPeriod): { startDate: Date; endDate: Date } {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  switch (period) {
    case 'week': {
      const start = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
      return { startDate: start, endDate: today };
    }
    case 'month': {
      const start = startOfMonth(today);
      return { startDate: start, endDate: today };
    }
    case '30days':
    default: {
      const start = subDays(today, 29);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: today };
    }
  }
}

/**
 * Default date range (Last 30 days)
 */
export function getDefaultDateRange(): AnalyticsDateRange {
  const { startDate, endDate } = calculateDateRange('30days');
  return { period: '30days', startDate, endDate };
}

/**
 * Analytics Date Range Picker for filtering usage data
 *
 * @example
 * ```tsx
 * const [dateRange, setDateRange] = useState(getDefaultDateRange());
 *
 * <AnalyticsDateRangePicker
 *   value={dateRange}
 *   onChange={setDateRange}
 * />
 * ```
 */
export function AnalyticsDateRangePicker({
  value,
  onChange,
  className,
  testId = 'analytics-date-range-picker',
}: AnalyticsDateRangePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectingStart, setSelectingStart] = useState(true);

  /**
   * Handle preset period selection
   */
  const handlePeriodChange = useCallback(
    (period: AnalyticsPeriod) => {
      if (period === 'custom') {
        // Keep current dates but mark as custom
        onChange({ ...value, period: 'custom' });
      } else {
        const { startDate, endDate } = calculateDateRange(period);
        onChange({ period, startDate, endDate });
      }
    },
    [onChange, value]
  );

  /**
   * Handle custom date selection from calendar
   */
  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;

      if (selectingStart) {
        // Start date selected, wait for end date
        onChange({
          period: 'custom',
          startDate: date,
          endDate: value.endDate,
        });
        setSelectingStart(false);
      } else {
        // End date selected
        let startDate = value.startDate;
        let endDate = date;

        // Swap if end is before start
        if (endDate < startDate) {
          [startDate, endDate] = [endDate, startDate];
        }

        // Ensure end date is end of day
        endDate.setHours(23, 59, 59, 999);

        onChange({
          period: 'custom',
          startDate,
          endDate,
        });
        setSelectingStart(true);
        setIsCalendarOpen(false);
      }
    },
    [onChange, selectingStart, value.startDate, value.endDate]
  );

  /**
   * Format date range for display
   */
  const formatDateRange = () => {
    if (value.period !== 'custom') {
      return PERIOD_OPTIONS.find((opt) => opt.value === value.period)?.label || '';
    }
    return `${format(value.startDate, 'MMM d, yyyy')} - ${format(value.endDate, 'MMM d, yyyy')}`;
  };

  /**
   * Validate date range (AC-20.3.3)
   * - End must be after start
   * - Cannot be in future
   */
  const isValidDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date <= today;
  };

  return (
    <div className={cn('flex items-center gap-2', className)} data-testid={testId}>
      {/* Period preset selector */}
      <Select
        value={value.period}
        onValueChange={(val) => handlePeriodChange(val as AnalyticsPeriod)}
      >
        <SelectTrigger className="w-[160px]" data-testid="period-select">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              data-testid={`period-${option.value}`}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Custom date range selector */}
      {value.period === 'custom' && (
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-start text-left font-normal',
                !value.startDate && 'text-muted-foreground'
              )}
              data-testid="custom-date-trigger"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 border-b">
              <p className="text-sm font-medium">
                {selectingStart ? 'Select start date' : 'Select end date'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectingStart
                  ? 'Click a date to set the start of your range'
                  : 'Click a date to set the end of your range'}
              </p>
            </div>
            <Calendar
              mode="single"
              selected={selectingStart ? value.startDate : value.endDate}
              onSelect={handleDateSelect}
              disabled={(date) => !isValidDate(date)}
              initialFocus
              data-testid="date-calendar"
            />
            <div className="p-3 border-t text-xs text-muted-foreground">
              Current range: {format(value.startDate, 'MMM d')} -{' '}
              {format(value.endDate, 'MMM d, yyyy')}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Show date range summary for non-custom periods */}
      {value.period !== 'custom' && (
        <span className="text-sm text-muted-foreground" data-testid="date-range-summary">
          {format(value.startDate, 'MMM d')} - {format(value.endDate, 'MMM d, yyyy')}
        </span>
      )}
    </div>
  );
}
