/**
 * Usage Stat Card Component
 * Story 14.5: Component Scaffolding
 *
 * Displays a usage statistic with label and value.
 * Stub implementation - full functionality in Epic 20.
 */

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UsageStatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: LucideIcon;
  className?: string;
}

export function UsageStatCard({
  label,
  value,
  change,
  icon: Icon,
  className,
}: UsageStatCardProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-surface)]',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="h-4 w-4 text-[var(--text-muted)]" />}
        <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-2xl font-semibold text-[var(--text-primary)]">
        {value}
      </p>
      {change !== undefined && (
        <p
          className={cn(
            'text-xs mt-1',
            change >= 0 ? 'text-emerald-400' : 'text-red-400'
          )}
        >
          {change >= 0 ? '+' : ''}
          {change}% from last period
        </p>
      )}
    </div>
  );
}
