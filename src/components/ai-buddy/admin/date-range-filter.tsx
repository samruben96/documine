/**
 * Date Range Filter Component
 * Story 19.2: Enforcement Logging
 *
 * Filter component for selecting date ranges with quick presets.
 * Used by guardrail enforcement log to filter by date.
 *
 * AC-19.2.6: Support date range filtering
 */

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface DateRange {
  startDate: Date | undefined;
  endDate: Date | undefined;
}

export interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

type PresetValue = 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'custom';

/**
 * Calculate preset date ranges
 */
function getPresetRange(preset: PresetValue): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { startDate: today, endDate: today };

    case 'last7days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { startDate: start, endDate: today };
    }

    case 'last30days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { startDate: start, endDate: today };
    }

    case 'thisMonth': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: start, endDate: today };
    }

    case 'custom':
    default:
      return { startDate: undefined, endDate: undefined };
  }
}

/**
 * Determine which preset matches a date range
 */
function matchPreset(range: DateRange): PresetValue {
  if (!range.startDate || !range.endDate) return 'custom';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Check if endDate is today
  const endIsToday =
    range.endDate.getFullYear() === today.getFullYear() &&
    range.endDate.getMonth() === today.getMonth() &&
    range.endDate.getDate() === today.getDate();

  if (!endIsToday) return 'custom';

  // Check Today preset
  const isSameDay =
    range.startDate.getFullYear() === today.getFullYear() &&
    range.startDate.getMonth() === today.getMonth() &&
    range.startDate.getDate() === today.getDate();

  if (isSameDay) return 'today';

  // Check Last 7 days
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  if (
    range.startDate.getFullYear() === sevenDaysAgo.getFullYear() &&
    range.startDate.getMonth() === sevenDaysAgo.getMonth() &&
    range.startDate.getDate() === sevenDaysAgo.getDate()
  ) {
    return 'last7days';
  }

  // Check Last 30 days
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  if (
    range.startDate.getFullYear() === thirtyDaysAgo.getFullYear() &&
    range.startDate.getMonth() === thirtyDaysAgo.getMonth() &&
    range.startDate.getDate() === thirtyDaysAgo.getDate()
  ) {
    return 'last30days';
  }

  // Check This month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  if (
    range.startDate.getFullYear() === monthStart.getFullYear() &&
    range.startDate.getMonth() === monthStart.getMonth() &&
    range.startDate.getDate() === monthStart.getDate()
  ) {
    return 'thisMonth';
  }

  return 'custom';
}

/**
 * Format date to YYYY-MM-DD for input value
 */
function formatDateForInput(date: Date | undefined): string {
  if (!date) return '';
  const isoStr = date.toISOString();
  return isoStr.split('T')[0] ?? '';
}

/**
 * Date Range Filter component with presets and custom date inputs
 *
 * @example
 * ```tsx
 * const [dateRange, setDateRange] = useState<DateRange>({
 *   startDate: undefined,
 *   endDate: undefined,
 * });
 *
 * <DateRangeFilter
 *   value={dateRange}
 *   onChange={setDateRange}
 * />
 * ```
 */
export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const [selectedPreset, setSelectedPreset] = useState<PresetValue>(() => matchPreset(value));

  /**
   * Handle preset selection
   */
  const handlePresetChange = useCallback(
    (preset: PresetValue) => {
      setSelectedPreset(preset);

      if (preset !== 'custom') {
        const range = getPresetRange(preset);
        onChange(range);
      }
    },
    [onChange]
  );

  /**
   * Handle custom start date change
   */
  const handleStartDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const dateStr = e.target.value;
      const startDate = dateStr ? new Date(dateStr + 'T00:00:00') : undefined;

      setSelectedPreset('custom');
      onChange({ ...value, startDate });
    },
    [onChange, value]
  );

  /**
   * Handle custom end date change
   */
  const handleEndDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const dateStr = e.target.value;
      const endDate = dateStr ? new Date(dateStr + 'T00:00:00') : undefined;

      setSelectedPreset('custom');
      onChange({ ...value, endDate });
    },
    [onChange, value]
  );

  /**
   * Clear date filter
   */
  const handleClear = useCallback(() => {
    setSelectedPreset('custom');
    onChange({ startDate: undefined, endDate: undefined });
  }, [onChange]);

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className ?? ''}`} data-testid="date-range-filter">
      {/* Preset selector */}
      <Select value={selectedPreset} onValueChange={(val) => handlePresetChange(val as PresetValue)}>
        <SelectTrigger className="w-[160px]" data-testid="date-preset-select">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today" data-testid="preset-today">Today</SelectItem>
          <SelectItem value="last7days" data-testid="preset-last7days">Last 7 days</SelectItem>
          <SelectItem value="last30days" data-testid="preset-last30days">Last 30 days</SelectItem>
          <SelectItem value="thisMonth" data-testid="preset-thisMonth">This month</SelectItem>
          <SelectItem value="custom" data-testid="preset-custom">Custom range</SelectItem>
        </SelectContent>
      </Select>

      {/* Custom date inputs */}
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={formatDateForInput(value.startDate)}
          onChange={handleStartDateChange}
          className="w-[140px]"
          aria-label="Start date"
          data-testid="start-date-input"
        />
        <span className="text-muted-foreground">to</span>
        <Input
          type="date"
          value={formatDateForInput(value.endDate)}
          onChange={handleEndDateChange}
          className="w-[140px]"
          aria-label="End date"
          data-testid="end-date-input"
        />
      </div>

      {/* Clear button - show when dates are set */}
      {(value.startDate || value.endDate) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          data-testid="clear-date-filter"
        >
          Clear
        </Button>
      )}
    </div>
  );
}
