'use client';

import { Circle, Clock, CheckCircle, FileCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { QuoteSessionStatus } from '@/types/quoting';

/**
 * Status Badge Component
 * Story Q2.1: Quote Sessions List Page
 *
 * AC-Q2.1-2: Status indicator on session card
 * AC-Q2.4-1: Draft displayed with gray badge
 * AC-Q2.4-2: In Progress displayed with amber badge
 * AC-Q2.4-3: Quotes Received displayed with blue badge
 * AC-Q2.4-4: Complete displayed with green badge
 */

interface StatusBadgeProps {
  status: QuoteSessionStatus;
  className?: string;
  showIcon?: boolean;
}

/**
 * Status configuration with variants and icons
 */
const statusConfig: Record<
  QuoteSessionStatus,
  {
    label: string;
    icon: typeof Circle;
    variant: 'status-default' | 'status-progress' | 'status-info' | 'status-success';
  }
> = {
  draft: {
    label: 'Draft',
    icon: Circle,
    variant: 'status-default', // gray
  },
  in_progress: {
    label: 'In Progress',
    icon: Clock,
    variant: 'status-progress', // amber
  },
  quotes_received: {
    label: 'Quotes Received',
    icon: FileCheck,
    variant: 'status-info', // blue
  },
  complete: {
    label: 'Complete',
    icon: CheckCircle,
    variant: 'status-success', // green
  },
};

export function StatusBadge({
  status,
  className,
  showIcon = true,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(className)}
      data-testid="status-badge"
      data-status={status}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
