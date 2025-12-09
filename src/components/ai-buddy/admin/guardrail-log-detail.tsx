/**
 * Guardrail Log Detail Dialog
 * Story 19.2: Enforcement Logging
 *
 * Modal dialog showing full details of a guardrail enforcement event.
 * Includes user info, triggered topic, message preview, redirect applied, and timestamp.
 *
 * AC-19.2.5: Click entry to see full details including redirect guidance
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { GuardrailEnforcementEvent } from '@/types/ai-buddy';
import { format } from 'date-fns';

export interface GuardrailLogDetailProps {
  event: GuardrailEnforcementEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Format timestamp for display
 */
function formatTimestamp(isoString: string): string {
  try {
    return format(new Date(isoString), 'PPpp'); // e.g., "Jan 15, 2024, 3:30:00 PM"
  } catch {
    return isoString;
  }
}

/**
 * Detail row component for consistent styling
 */
function DetailRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1 ${className ?? ''}`}>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

/**
 * Guardrail Log Detail dialog component
 *
 * @example
 * ```tsx
 * <GuardrailLogDetail
 *   event={selectedEvent}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 * />
 * ```
 */
export function GuardrailLogDetail({ event, open, onOpenChange }: GuardrailLogDetailProps) {
  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="guardrail-log-detail-dialog">
        <DialogHeader>
          <DialogTitle>Guardrail Event Details</DialogTitle>
          <DialogDescription>
            Guardrail enforcement event triggered on {formatTimestamp(event.loggedAt)}
          </DialogDescription>
        </DialogHeader>

        <dl className="space-y-4" data-testid="guardrail-log-detail-content">
          <DetailRow
            label="User"
            value={event.userEmail}
          />

          <DetailRow
            label="Triggered Topic"
            value={
              <span className="font-medium text-orange-600 dark:text-orange-400">
                {event.triggeredTopic}
              </span>
            }
          />

          <DetailRow
            label="Message Preview"
            value={
              <div className="bg-muted rounded-md p-3 text-sm">
                {event.messagePreview || <span className="text-muted-foreground italic">No preview available</span>}
              </div>
            }
          />

          <DetailRow
            label="Redirect Guidance Applied"
            value={
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3 text-sm">
                {event.redirectApplied || <span className="text-muted-foreground italic">No redirect guidance recorded</span>}
              </div>
            }
          />

          <DetailRow
            label="Timestamp"
            value={formatTimestamp(event.loggedAt)}
          />

          <DetailRow
            label="Conversation ID"
            value={
              event.conversationId ? (
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {event.conversationId}
                </code>
              ) : (
                <span className="text-muted-foreground italic">No conversation</span>
              )
            }
          />

          <DetailRow
            label="User ID"
            value={
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {event.userId}
              </code>
            }
          />
        </dl>

        <div className="flex justify-end pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="close-detail-button"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
