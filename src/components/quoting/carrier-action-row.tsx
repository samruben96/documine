/**
 * Carrier Action Row Component
 * Story Q4.2: Carriers Tab UI & Actions
 *
 * AC-Q4.2-2: Each carrier row displays: logo (24x24), name, status badge
 * AC-Q4.2-3: Each carrier row has "Copy Data" button (primary style)
 * AC-Q4.2-4: Each carrier row has "Open Portal" button (ghost style, external icon)
 * AC-Q4.2-5: "Open Portal" opens carrier URL in new browser tab
 * AC-Q4.2-6: Status badge shows "Not Started" initially (gray)
 * AC-Q4.2-7: Status badge shows "Copied" after data is copied (blue)
 * AC-Q4.2-8: Status badge shows "Quote Entered" when result saved (green)
 */

'use client';

import Image from 'next/image';
import { ExternalLink, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/quoting/copy-button';
import type { CarrierInfo, CarrierStatus } from '@/lib/quoting/carriers/types';
import type { QuoteClientData } from '@/types/quoting';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export interface CarrierActionRowProps {
  /** Carrier information */
  carrier: CarrierInfo;
  /** Current status of this carrier */
  status: CarrierStatus;
  /** Callback when copy succeeds */
  onCopy: () => void;
  /** Optional callback when status changes */
  onStatusChange?: (status: CarrierStatus) => void;
  /** Client data to format and copy */
  clientData: QuoteClientData;
  /** Whether copy is disabled */
  disabled?: boolean;
}

/**
 * Status badge variant mapping
 * AC-Q4.2-6: Not Started = gray (status-default)
 * AC-Q4.2-7: Copied = blue (status-info)
 * AC-Q4.2-8: Quote Entered = green (status-success)
 */
const STATUS_CONFIG: Record<CarrierStatus, {
  label: string;
  variant: 'status-default' | 'status-info' | 'status-success';
}> = {
  not_started: { label: 'Not Started', variant: 'status-default' },
  copied: { label: 'Copied', variant: 'status-info' },
  quote_entered: { label: 'Quote Entered', variant: 'status-success' },
};

/**
 * Carrier Logo component with fallback
 * Renders Image with fallback to Building2 icon
 */
function CarrierLogo({
  carrier,
  className
}: {
  carrier: CarrierInfo;
  className?: string;
}) {
  const [imageError, setImageError] = useState(false);

  if (imageError || !carrier.logoPath) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-muted rounded',
        className
      )}>
        <Building2 className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Image
      src={carrier.logoPath}
      alt={`${carrier.name} logo`}
      width={24}
      height={24}
      className={cn('rounded', className)}
      onError={() => setImageError(true)}
    />
  );
}

/**
 * Carrier Action Row - Per-carrier row with logo, status, and actions
 *
 * @example
 * ```tsx
 * <CarrierActionRow
 *   carrier={carrierInfo}
 *   status="not_started"
 *   onCopy={() => setStatus('copied')}
 *   clientData={session.clientData}
 * />
 * ```
 */
export function CarrierActionRow({
  carrier,
  status,
  onCopy,
  onStatusChange,
  clientData,
  disabled = false,
}: CarrierActionRowProps) {
  const statusConfig = STATUS_CONFIG[status];

  // Handle copy success
  const handleCopy = () => {
    onCopy();
    onStatusChange?.('copied');
    toast.success(`Copied for ${carrier.name}`, {
      description: 'Client data is ready to paste into the carrier portal.',
    });
  };

  // Handle copy error
  const handleError = (error: Error) => {
    toast.error(`Failed to copy for ${carrier.name}`, {
      description: error.message,
    });
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-3 p-4 rounded-lg border bg-card',
        'sm:flex-row sm:items-center sm:justify-between',
      )}
      data-testid={`carrier-row-${carrier.code}`}
      data-carrier={carrier.code}
      data-status={status}
    >
      {/* Left section: Logo, Name, Status */}
      <div className="flex items-center gap-3">
        {/* Carrier Logo */}
        <CarrierLogo carrier={carrier} className="h-6 w-6 shrink-0" />

        {/* Carrier Name */}
        <span className="font-medium text-sm sm:text-base">
          {carrier.name}
        </span>

        {/* Status Badge */}
        <Badge
          variant={statusConfig.variant}
          data-testid={`status-badge-${carrier.code}`}
        >
          {statusConfig.label}
        </Badge>
      </div>

      {/* Right section: Actions */}
      <div className="flex items-center gap-2">
        {/* Copy Data Button - Primary style (AC-Q4.2-3) */}
        <CopyButton
          carrier={carrier.code}
          clientData={clientData}
          onCopy={handleCopy}
          onError={handleError}
          disabled={disabled}
          className="flex-1 sm:flex-none"
        />

        {/* Open Portal Button - Ghost style with external icon (AC-Q4.2-4, AC-Q4.2-5) */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
          asChild
        >
          <a
            href={carrier.portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${carrier.name} portal in new tab`}
            data-testid={`portal-link-${carrier.code}`}
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Open Portal</span>
          </a>
        </Button>
      </div>
    </div>
  );
}
