import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * PageHeader Component
 * Story DR.3: Consistent page headers with proper typography
 *
 * AC-DR.3.4: Page titles use text-2xl font-semibold text-slate-900
 * AC-DR.3.5: Subtitles use text-slate-500 text-sm mt-1
 */

export interface PageHeaderProps {
  /** Page title - required */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional action buttons to display on the right */
  actions?: React.ReactNode;
  /** Optional icon to display before title */
  icon?: React.ReactNode;
  /** Optional className for container */
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  icon,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-6', className)}>
      <div className="flex items-start gap-2">
        {icon && (
          <span className="flex-shrink-0 mt-0.5">{icon}</span>
        )}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
