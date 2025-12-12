/**
 * Copy Button Component
 * Story Q4.1: Copy Button & Carrier Formatters
 *
 * AC-Q4.1-1: Copy for Progressive button
 * AC-Q4.1-2: Copy for Travelers button
 * AC-Q4.1-3: Shows "Copied" with green check icon for 2 seconds
 * AC-Q4.1-4: Resets to default state after 2 seconds
 * AC-Q4.1-5: Screen reader announcement via aria-live="polite"
 * AC-Q4.1-6: Error state with "Failed - Click to retry"
 * AC-Q4.1-7: Keyboard accessible (Enter/Space)
 */

'use client';

import { Clipboard, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { QuoteClientData } from '@/types/quoting';
import { getCarrier } from '@/lib/quoting/carriers';
import { useClipboardCopy } from '@/hooks/quoting/use-clipboard-copy';

export interface CopyButtonProps {
  /** Carrier code (e.g., 'progressive', 'travelers') */
  carrier: string;
  /** Client data to format and copy */
  clientData: QuoteClientData;
  /** Optional callback after successful copy */
  onCopy?: () => void;
  /** Optional callback on error */
  onError?: (error: Error) => void;
  /** Optional className for styling */
  className?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
}

/**
 * Copy button with carrier-specific formatting
 *
 * @example
 * ```tsx
 * <CopyButton
 *   carrier="progressive"
 *   clientData={session.clientData}
 *   onCopy={() => toast.success('Copied!')}
 * />
 * ```
 */
export function CopyButton({
  carrier,
  clientData,
  onCopy,
  onError,
  className,
  disabled = false,
}: CopyButtonProps) {
  const { copyToClipboard, copiedCarrier, error, isLoading, resetError } = useClipboardCopy();

  const carrierInfo = getCarrier(carrier);
  const isCopied = copiedCarrier === carrier;
  const hasError = error !== null && copiedCarrier === null;

  // Handle copy action
  const handleCopy = async () => {
    if (!carrierInfo) {
      onError?.(new Error(`Unknown carrier: ${carrier}`));
      return;
    }

    // Reset error if retrying
    if (hasError) {
      resetError();
    }

    // Format data and copy
    const formattedText = carrierInfo.formatter.formatForClipboard(clientData);
    const success = await copyToClipboard(carrier, formattedText);

    if (success) {
      onCopy?.();
    } else if (error) {
      onError?.(error);
    }
  };

  // Determine button state and appearance
  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Copying...</span>
        </>
      );
    }

    if (isCopied) {
      return (
        <>
          <Check className="h-4 w-4" />
          <span>Copied</span>
        </>
      );
    }

    if (hasError) {
      return (
        <>
          <AlertCircle className="h-4 w-4" />
          <span>Failed - Click to retry</span>
        </>
      );
    }

    return (
      <>
        <Clipboard className="h-4 w-4" />
        <span>Copy for {carrierInfo?.name || carrier}</span>
      </>
    );
  };

  // Determine button variant based on state
  const getButtonVariant = (): 'default' | 'outline' | 'destructive' => {
    if (hasError) return 'destructive';
    return 'outline';
  };

  return (
    <>
      <Button
        variant={getButtonVariant()}
        onClick={handleCopy}
        disabled={disabled || isLoading}
        className={cn(
          'gap-2 transition-colors',
          isCopied && 'bg-green-100 text-green-700 hover:bg-green-200 border-green-300',
          className
        )}
        aria-label={`Copy client data formatted for ${carrierInfo?.name || carrier}`}
        data-carrier={carrier}
        data-testid={`copy-button-${carrier}`}
      >
        {getButtonContent()}
      </Button>

      {/* Screen reader announcement (AC-Q4.1-5) */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {isCopied && `Copied to clipboard for ${carrierInfo?.name || carrier}`}
        {hasError && 'Copy failed. Click to retry.'}
      </div>
    </>
  );
}
