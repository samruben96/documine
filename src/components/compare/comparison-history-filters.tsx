'use client';

import { useState, useEffect } from 'react';
import { Search, X, Calendar } from 'lucide-react';
import { subDays, format } from 'date-fns';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Comparison History Filters Component
 *
 * Story 7.7: AC-7.7.4
 *
 * Provides search and date range filtering for comparison history:
 * - Text search with 200ms debounce
 * - Date range inputs (From/To)
 * - Quick presets: "Last 7 days", "Last 30 days", "All time"
 */

export interface HistoryFilters {
  search: string;
  fromDate: string; // ISO date string YYYY-MM-DD
  toDate: string; // ISO date string YYYY-MM-DD
  preset: 'all' | '7days' | '30days' | 'custom';
}

interface ComparisonHistoryFiltersProps {
  filters: HistoryFilters;
  onFilterChange: (filters: HistoryFilters) => void;
}

export function ComparisonHistoryFilters({
  filters,
  onFilterChange,
}: ComparisonHistoryFiltersProps) {
  // Local search state for debouncing
  const [localSearch, setLocalSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(localSearch, 200);

  // Sync debounced search to parent
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFilterChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch, filters, onFilterChange]);

  // Clear search
  const handleClearSearch = () => {
    setLocalSearch('');
    onFilterChange({ ...filters, search: '' });
  };

  // Handle date range change
  const handleFromDateChange = (value: string) => {
    onFilterChange({ ...filters, fromDate: value, preset: 'custom' });
  };

  const handleToDateChange = (value: string) => {
    onFilterChange({ ...filters, toDate: value, preset: 'custom' });
  };

  // Handle preset selection
  const handlePresetChange = (preset: HistoryFilters['preset']) => {
    let fromDate = '';
    let toDate = '';

    if (preset === '7days') {
      fromDate = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      toDate = format(new Date(), 'yyyy-MM-dd');
    } else if (preset === '30days') {
      fromDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      toDate = format(new Date(), 'yyyy-MM-dd');
    }
    // 'all' and 'custom' clear the dates

    onFilterChange({ ...filters, fromDate, toDate, preset });
  };

  // Clear all filters
  const handleClearAll = () => {
    setLocalSearch('');
    onFilterChange({ search: '', fromDate: '', toDate: '', preset: 'all' });
  };

  // Check if any filters are active
  const hasActiveFilters = localSearch || filters.fromDate || filters.toDate;

  // Preset label
  const getPresetLabel = () => {
    switch (filters.preset) {
      case '7days':
        return 'Last 7 days';
      case '30days':
        return 'Last 30 days';
      case 'custom':
        return 'Custom';
      default:
        return 'All time';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3" data-testid="comparison-history-filters">
      {/* Search input */}
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search documents..."
          className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          data-testid="comparison-search-input"
        />
        {localSearch && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Date range inputs */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <label htmlFor="from-date" className="text-sm text-slate-500 dark:text-slate-400">
            From:
          </label>
          <input
            id="from-date"
            type="date"
            value={filters.fromDate}
            onChange={(e) => handleFromDateChange(e.target.value)}
            className="px-2 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
            data-testid="from-date-input"
          />
        </div>
        <div className="flex items-center gap-1">
          <label htmlFor="to-date" className="text-sm text-slate-500 dark:text-slate-400">
            To:
          </label>
          <input
            id="to-date"
            type="date"
            value={filters.toDate}
            onChange={(e) => handleToDateChange(e.target.value)}
            className="px-2 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
            data-testid="to-date-input"
          />
        </div>
      </div>

      {/* Preset dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Calendar className="h-4 w-4" />
            {getPresetLabel()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => handlePresetChange('7days')}
            className={filters.preset === '7days' ? 'bg-accent' : ''}
          >
            Last 7 days
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handlePresetChange('30days')}
            className={filters.preset === '30days' ? 'bg-accent' : ''}
          >
            Last 30 days
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handlePresetChange('all')}
            className={filters.preset === 'all' ? 'bg-accent' : ''}
          >
            All time
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear all button */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-slate-500">
          Clear filters
        </Button>
      )}
    </div>
  );
}
