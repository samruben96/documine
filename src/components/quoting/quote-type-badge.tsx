'use client';

import { Home, Car, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { QuoteType } from '@/types/quoting';

/**
 * Quote Type Badge Component
 * Story Q2.1: Quote Sessions List Page
 *
 * AC-Q2.1-2: Quote type badge on session card
 *
 * Types:
 * - Home: Homeowners/property only (blue)
 * - Auto: Vehicle only (purple)
 * - Bundle: Both home + auto (green - best value)
 */

interface QuoteTypeBadgeProps {
  type: QuoteType;
  className?: string;
  showIcon?: boolean;
}

/**
 * Type configuration with variants and icons
 */
const typeConfig: Record<
  QuoteType,
  {
    label: string;
    icon: typeof Home;
    variant: 'status-info' | 'outline' | 'status-success';
  }
> = {
  home: {
    label: 'Home',
    icon: Home,
    variant: 'status-info', // blue
  },
  auto: {
    label: 'Auto',
    icon: Car,
    variant: 'outline', // neutral outline
  },
  bundle: {
    label: 'Bundle',
    icon: Package,
    variant: 'status-success', // green - indicates best value
  },
};

export function QuoteTypeBadge({
  type,
  className,
  showIcon = true,
}: QuoteTypeBadgeProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(className)}
      data-testid="quote-type-badge"
      data-type={type}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
