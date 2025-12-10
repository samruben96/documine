/**
 * Transcript Modal Component
 * Story 20.4: Audit Log Interface
 *
 * Modal dialog showing full conversation transcript.
 * AC-20.4.4: Full read-only conversation transcript
 * AC-20.4.5: Messages show role, content, timestamps, source citations, confidence badges
 * AC-20.4.6: Guardrail events highlighted with type and trigger info
 * AC-20.4.10: Read-only - no edit or delete options visible
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import {
  User,
  Bot,
  ShieldAlert,
  FileText,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TranscriptData, TranscriptMessage, TranscriptGuardrailEvent } from '@/app/api/admin/audit-logs/[conversationId]/transcript/route';
import type { Citation, ConfidenceLevel } from '@/types/ai-buddy';

export interface TranscriptModalProps {
  /** Conversation ID to fetch transcript for */
  conversationId: string | null;
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void;
}

/**
 * Format timestamp for display
 */
function formatTimestamp(isoString: string): string {
  try {
    return format(new Date(isoString), 'MMM d, yyyy h:mm a');
  } catch {
    return isoString;
  }
}

/**
 * Get confidence badge variant
 * AC-20.4.5: Confidence badges - high (green), medium (yellow), low (red)
 */
function getConfidenceBadgeVariant(confidence: ConfidenceLevel): 'default' | 'secondary' | 'destructive' {
  switch (confidence) {
    case 'high':
      return 'default'; // Green
    case 'medium':
      return 'secondary'; // Yellow/neutral
    case 'low':
      return 'destructive'; // Red
    default:
      return 'secondary';
  }
}

/**
 * Source citations expandable section
 * AC-20.4.5: Source citations with document name, page, text snippet
 */
function SourceCitations({ citations }: { citations: Citation[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (citations.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-2">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 h-7 px-2">
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <FileText className="h-3 w-3" />
          {citations.length} source{citations.length !== 1 ? 's' : ''}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {citations.map((citation, index) => (
          <div
            key={index}
            className="bg-muted/50 rounded-md p-2 text-sm"
            data-testid={`citation-${index}`}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <FileText className="h-3 w-3" />
              <span className="font-medium">{citation.documentName}</span>
              {citation.page && <span>Page {citation.page}</span>}
            </div>
            <p className="text-xs text-muted-foreground italic">&ldquo;{citation.text}&rdquo;</p>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Single message component
 * AC-20.4.5: Each message shows role (user/assistant), content, timestamps, source citations, confidence badges
 */
function MessageItem({ message, guardrailEvents }: {
  message: TranscriptMessage;
  guardrailEvents: TranscriptGuardrailEvent[];
}) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  // Check if this message has an associated guardrail event (by timestamp proximity)
  const messageTime = new Date(message.createdAt).getTime();
  const associatedGuardrailEvent = guardrailEvents.find(event => {
    const eventTime = new Date(event.loggedAt).getTime();
    // Within 5 seconds
    return Math.abs(eventTime - messageTime) < 5000;
  });

  return (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-lg',
        isUser ? 'bg-primary/5' : isSystem ? 'bg-muted/50' : 'bg-secondary/30'
      )}
      data-testid={`message-${message.id}`}
    >
      {/* Role icon */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary/10' : 'bg-secondary'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0">
        {/* Header with role and timestamp */}
        <div className="flex items-center gap-2 mb-1">
          <Badge variant={isUser ? 'default' : 'secondary'} className="capitalize text-xs">
            {message.role}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(message.createdAt)}
          </span>
          {/* Confidence badge (AC-20.4.5) */}
          {message.confidence && (
            <Badge
              variant={getConfidenceBadgeVariant(message.confidence)}
              className="text-xs"
              data-testid="confidence-badge"
            >
              {message.confidence} confidence
            </Badge>
          )}
        </div>

        {/* Message text */}
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {/* Source citations (AC-20.4.5) */}
        {message.sources && message.sources.length > 0 && (
          <SourceCitations citations={message.sources} />
        )}

        {/* Guardrail event highlight (AC-20.4.6) */}
        {associatedGuardrailEvent && (
          <Alert className="mt-2 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800" data-testid="guardrail-highlight">
            <ShieldAlert className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-sm">
              <span className="font-medium text-orange-700 dark:text-orange-300">
                Guardrail triggered: {associatedGuardrailEvent.triggeredTopic}
              </span>
              {associatedGuardrailEvent.redirectMessage && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  Redirect: {associatedGuardrailEvent.redirectMessage}
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

/**
 * Loading skeleton
 */
function TranscriptSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      {/* Messages skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Transcript Modal component
 *
 * @example
 * ```tsx
 * <TranscriptModal
 *   conversationId={selectedEntry.conversationId}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 * />
 * ```
 */
export function TranscriptModal({
  conversationId,
  open,
  onOpenChange,
}: TranscriptModalProps) {
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch transcript when modal opens
  const fetchTranscript = useCallback(async () => {
    if (!conversationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/audit-logs/${conversationId}/transcript`);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error?.message || `Failed to fetch transcript: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message);
      }

      setTranscript(result.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch transcript'));
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Fetch when modal opens
  useEffect(() => {
    if (open && conversationId) {
      fetchTranscript();
    } else if (!open) {
      // Reset state when closing
      setTranscript(null);
      setError(null);
    }
  }, [open, conversationId, fetchTranscript]);

  // Handle ESC key (AC-20.4.10)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[700px] max-h-[85vh] flex flex-col"
        data-testid="transcript-modal"
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Conversation Transcript</DialogTitle>
          {transcript && (
            <DialogDescription>
              {transcript.conversation.title || 'Untitled conversation'} &middot;{' '}
              {transcript.conversation.projectName || 'No project'} &middot;{' '}
              {transcript.conversation.userName || transcript.conversation.userEmail} &middot;{' '}
              {formatTimestamp(transcript.conversation.createdAt)}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Loading state */}
          {isLoading && (
            <TranscriptSkeleton />
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="transcript-error">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-medium">Failed to load transcript</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {error.message}
              </p>
              <Button variant="outline" onClick={fetchTranscript}>
                Try Again
              </Button>
            </div>
          )}

          {/* Transcript content */}
          {transcript && !isLoading && !error && (
            <ScrollArea className="h-[calc(85vh-180px)]" data-testid="transcript-content">
              {/* Guardrail events summary (AC-20.4.6) */}
              {transcript.guardrailEvents.length > 0 && (
                <Alert className="mb-4 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
                  <ShieldAlert className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <AlertDescription>
                    <span className="font-medium text-orange-700 dark:text-orange-300">
                      {transcript.guardrailEvents.length} guardrail event{transcript.guardrailEvents.length !== 1 ? 's' : ''} in this conversation
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {/* Messages list */}
              {transcript.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No messages</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    This conversation has no messages.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pr-4">
                  {transcript.messages.map((message) => (
                    <MessageItem
                      key={message.id}
                      message={message}
                      guardrailEvents={transcript.guardrailEvents}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>

        {/* Footer with close button (AC-20.4.10: Read-only, only close option) */}
        <div className="flex justify-end pt-4 border-t flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="close-transcript-btn"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
