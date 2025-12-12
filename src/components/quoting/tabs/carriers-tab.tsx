/**
 * Carriers Tab
 * Story Q4.2: Carriers Tab UI & Actions
 *
 * AC-Q4.2-1: Carriers tab shows list of supported carriers (Progressive, Travelers)
 * AC-Q4.2-2: Each carrier row displays: logo (24x24), name, status badge
 * AC-Q4.2-3: Each carrier row has "Copy Data" button (primary style)
 * AC-Q4.2-4: Each carrier row has "Open Portal" button (ghost style, external icon)
 * AC-Q4.2-5: "Open Portal" opens carrier URL in new browser tab
 * AC-Q4.2-6-9: Status badge system (Not Started, Copied, Quote Entered)
 * AC-Q4.2-10: Carriers filtered by quote type
 * AC-Q4.2-11: Ready indicator shows when all required data is entered
 */

'use client';

import { useState } from 'react';
import { Building2, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuoteSessionContext } from '@/contexts/quote-session-context';
import { getSupportedCarriers, getCarriersForQuoteType, type CarrierStatus } from '@/lib/quoting/carriers';
import { CarrierActionRow } from '@/components/quoting/carrier-action-row';
import type { QuoteClientData } from '@/types/quoting';

/**
 * Check data completeness for copying
 * AC-Q4.2-11: Ready indicator shows when all required data is entered
 *
 * @param clientData - Client data from quote session
 * @returns Validation result with ready status and missing fields
 */
function checkDataReadiness(clientData: QuoteClientData): {
  isReady: boolean;
  hasMinimum: boolean;
  missingFields: string[];
} {
  const missing: string[] = [];

  // Minimum required: first and last name
  if (!clientData?.personal?.firstName) {
    missing.push('First Name');
  }
  if (!clientData?.personal?.lastName) {
    missing.push('Last Name');
  }

  const hasMinimum = missing.length === 0;

  // Additional recommended fields for better copy
  const recommended: string[] = [];
  if (!clientData?.personal?.mailingAddress?.street) {
    recommended.push('Address');
  }

  return {
    isReady: hasMinimum,
    hasMinimum,
    missingFields: missing,
  };
}

/**
 * Ready Indicator Component
 * AC-Q4.2-11: Shows data completeness status
 */
function ReadyIndicator({
  isReady,
  missingFields,
}: {
  isReady: boolean;
  missingFields: string[];
}) {
  if (isReady) {
    return (
      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Ready to copy</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
      <AlertTriangle className="h-4 w-4" />
      <span className="text-sm font-medium">
        Missing: {missingFields.join(', ')}
      </span>
    </div>
  );
}

/**
 * Carriers Tab Component
 * Displays carrier action rows with copy buttons and portal links
 */
export function CarriersTab() {
  const { session } = useQuoteSessionContext();
  const [carrierStatuses, setCarrierStatuses] = useState<Record<string, CarrierStatus>>({});

  const clientData = session?.clientData || {};
  const quoteType = session?.quoteType;

  // Get carriers based on quote type (or all if no session) - AC-Q4.2-10
  const carriers = quoteType
    ? getCarriersForQuoteType(quoteType)
    : getSupportedCarriers();

  // Check data readiness - AC-Q4.2-11
  const { isReady, hasMinimum, missingFields } = checkDataReadiness(clientData);

  // Handle status change (AC-Q4.2-9: Persist during session)
  const handleStatusChange = (carrierCode: string, status: CarrierStatus) => {
    setCarrierStatuses((prev) => ({
      ...prev,
      [carrierCode]: status,
    }));
  };

  // Calculate summary stats
  const copiedCount = Object.values(carrierStatuses).filter(s => s === 'copied' || s === 'quote_entered').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Carriers</CardTitle>
          </div>

          {/* Ready Indicator - AC-Q4.2-11 */}
          <ReadyIndicator isReady={isReady} missingFields={missingFields} />
        </div>
        <CardDescription className="flex items-center justify-between">
          <span>Copy formatted client data to carrier portals</span>
          {copiedCount > 0 && (
            <Badge variant="status-info" className="ml-2">
              {copiedCount} copied
            </Badge>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Incomplete data message */}
        {!hasMinimum && (
          <div className="rounded-lg bg-muted/50 p-4 mb-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Enter client information to enable carrier copy
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  At minimum, enter the client&apos;s first and last name in the Client Info tab.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {carriers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              No carriers available for this quote type.
            </p>
          </div>
        ) : (
          /* Carrier list - AC-Q4.2-1 */
          <div className="space-y-3">
            {carriers.map((carrier) => (
              <CarrierActionRow
                key={carrier.code}
                carrier={carrier}
                status={carrierStatuses[carrier.code] || 'not_started'}
                onCopy={() => {}}
                onStatusChange={(status) => handleStatusChange(carrier.code, status)}
                clientData={clientData}
                disabled={!hasMinimum}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
