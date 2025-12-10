/**
 * Audit Filters Component
 * Story 20.4: Audit Log Interface
 *
 * Filter controls for audit log table.
 * AC-20.4.2: Filter by user (dropdown), date range (pickers), keyword search, has guardrail events (checkbox)
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
import { CalendarIcon, Search, X, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from 'use-debounce';

/**
 * Filter state for audit logs
 */
export interface AuditLogFilters {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  hasGuardrailEvents?: boolean;
}

/**
 * User option for dropdown
 */
export interface UserOption {
  id: string;
  name: string | null;
  email: string;
}

export interface AuditFiltersProps {
  /** Current filter values */
  filters: AuditLogFilters;
  /** Callback when filters change */
  onFiltersChange: (filters: AuditLogFilters) => void;
  /** List of users for dropdown */
  users: UserOption[];
  /** Whether users are loading */
  usersLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Audit Filters component
 *
 * @example
 * ```tsx
 * <AuditFilters
 *   filters={filters}
 *   onFiltersChange={setFilters}
 *   users={agencyUsers}
 * />
 * ```
 */
export function AuditFilters({
  filters,
  onFiltersChange,
  users,
  usersLoading = false,
  className,
}: AuditFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [startCalendarOpen, setStartCalendarOpen] = useState(false);
  const [endCalendarOpen, setEndCalendarOpen] = useState(false);

  // Debounced search callback (AC-20.4.2: 300ms debounce)
  const debouncedSearch = useDebouncedCallback((value: string) => {
    onFiltersChange({ ...filters, search: value || undefined });
  }, 300);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  // Handle user selection
  const handleUserChange = useCallback((value: string) => {
    onFiltersChange({
      ...filters,
      userId: value === 'all' ? undefined : value,
    });
  }, [filters, onFiltersChange]);

  // Handle start date selection
  const handleStartDateSelect = useCallback((date: Date | undefined) => {
    onFiltersChange({ ...filters, startDate: date });
    setStartCalendarOpen(false);
  }, [filters, onFiltersChange]);

  // Handle end date selection
  const handleEndDateSelect = useCallback((date: Date | undefined) => {
    if (date) {
      // Set to end of day
      date.setHours(23, 59, 59, 999);
    }
    onFiltersChange({ ...filters, endDate: date });
    setEndCalendarOpen(false);
  }, [filters, onFiltersChange]);

  // Handle guardrail events checkbox
  const handleGuardrailEventsChange = useCallback((checked: boolean) => {
    onFiltersChange({
      ...filters,
      hasGuardrailEvents: checked || undefined,
    });
  }, [filters, onFiltersChange]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setLocalSearch('');
    onFiltersChange({});
  }, [onFiltersChange]);

  // Check if any filters are active
  const hasActiveFilters =
    filters.userId ||
    filters.startDate ||
    filters.endDate ||
    filters.search ||
    filters.hasGuardrailEvents;

  // Validate date (can't be in future)
  const isValidDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date <= today;
  };

  return (
    <div
      className={cn('flex flex-col gap-4', className)}
      data-testid="audit-filters"
    >
      {/* First row: User dropdown and search */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* User dropdown (AC-20.4.2) */}
        <Select
          value={filters.userId || 'all'}
          onValueChange={handleUserChange}
          disabled={usersLoading}
        >
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="user-filter">
            <SelectValue placeholder="All users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name || user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Keyword search (AC-20.4.2) */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations, users, actions..."
            value={localSearch}
            onChange={handleSearchChange}
            className="pl-9"
            data-testid="search-filter"
          />
        </div>
      </div>

      {/* Second row: Date pickers, guardrail checkbox, clear button */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Start date picker (AC-20.4.2) */}
        <Popover open={startCalendarOpen} onOpenChange={setStartCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full sm:w-[160px] justify-start text-left font-normal',
                !filters.startDate && 'text-muted-foreground'
              )}
              data-testid="start-date-filter"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.startDate ? format(filters.startDate, 'MMM d, yyyy') : 'Start date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.startDate}
              onSelect={handleStartDateSelect}
              disabled={(date) => !isValidDate(date)}
              initialFocus
              data-testid="start-date-calendar"
            />
          </PopoverContent>
        </Popover>

        {/* End date picker (AC-20.4.2) */}
        <Popover open={endCalendarOpen} onOpenChange={setEndCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full sm:w-[160px] justify-start text-left font-normal',
                !filters.endDate && 'text-muted-foreground'
              )}
              data-testid="end-date-filter"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.endDate ? format(filters.endDate, 'MMM d, yyyy') : 'End date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.endDate}
              onSelect={handleEndDateSelect}
              disabled={(date) => !isValidDate(date) || (filters.startDate ? date < filters.startDate : false)}
              initialFocus
              data-testid="end-date-calendar"
            />
          </PopoverContent>
        </Popover>

        {/* Has guardrail events checkbox (AC-20.4.2) */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasGuardrailEvents"
            checked={filters.hasGuardrailEvents || false}
            onCheckedChange={handleGuardrailEventsChange}
            data-testid="guardrail-events-filter"
          />
          <Label
            htmlFor="hasGuardrailEvents"
            className="flex items-center gap-1 text-sm cursor-pointer"
          >
            <ShieldAlert className="h-4 w-4 text-destructive" />
            Has guardrail events
          </Label>
        </div>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="gap-1"
            data-testid="clear-filters-btn"
          >
            <X className="h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
