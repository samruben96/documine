'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { QuoteSessionCard } from '@/components/quoting/quote-session-card';
import { QuoteSessionsEmpty } from '@/components/quoting/quote-sessions-empty';
import { NewQuoteDialog, type CreateQuoteSessionFormData } from '@/components/quoting/new-quote-dialog';
import { useQuoteSessions } from '@/hooks/quoting/use-quote-sessions';
import type { QuoteSession } from '@/types/quoting';

/**
 * Quote Sessions List Page
 * Story Q2.1: Quote Sessions List Page
 *
 * AC-Q2.1-1: Sessions displayed sorted by most recently updated first
 * AC-Q2.1-2: Each card shows prospect name, quote type, status, date, carrier count
 * AC-Q2.1-3: Action menu with Edit, Duplicate, Delete options
 * AC-Q2.1-4: Empty state with "No quotes yet" and "New Quote" CTA
 * AC-Q2.1-5: Card click navigates to /quoting/[id]
 */
export default function QuotingPage() {
  const router = useRouter();
  const { sessions, isLoading, isMutating, createSession, deleteSession, duplicateSession } =
    useQuoteSessions();

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // New quote dialog state (AC-Q2.2-1, AC-Q2.2-5)
  const [isNewQuoteDialogOpen, setIsNewQuoteDialogOpen] = useState(false);

  // AC-Q2.2-1: Open dialog when "New Quote" button clicked
  const handleNewQuote = () => {
    setIsNewQuoteDialogOpen(true);
  };

  // AC-Q2.2-3: Create session and redirect to detail page
  const handleCreateSession = async (
    input: CreateQuoteSessionFormData
  ): Promise<QuoteSession | null> => {
    const session = await createSession(input);
    return session;
  };

  // AC-Q2.2-3: Navigate to detail page after successful creation
  const handleSessionCreated = (session: QuoteSession) => {
    toast.success('Quote session created');
    router.push(`/quoting/${session.id}`);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteSession(deleteId);
      toast.success('Quote session deleted');
    } catch {
      toast.error('Failed to delete session');
    } finally {
      setDeleteId(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    const newSession = await duplicateSession(id);
    if (newSession) {
      toast.success('Quote session duplicated');
      // Navigate to the new session (AC-Q2.5-5)
      router.push(`/quoting/${newSession.id}`);
    } else {
      toast.error('Failed to duplicate session');
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-6 view-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Quoting
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage quote sessions for your prospects
            </p>
          </div>
          <Button onClick={handleNewQuote} disabled={isMutating}>
            <Plus className="h-4 w-4" />
            New Quote
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <QuoteSessionsEmpty onNewQuote={handleNewQuote} />
        ) : (
          <div
            className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            data-testid="quote-sessions-grid"
          >
            {sessions.map((session) => (
              <QuoteSessionCard
                key={session.id}
                session={session}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this quote session?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. All associated quote results will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Quote Dialog - AC-Q2.2-1, AC-Q2.2-2, AC-Q2.2-3, AC-Q2.2-4, AC-Q2.2-5 */}
      <NewQuoteDialog
        open={isNewQuoteDialogOpen}
        onOpenChange={setIsNewQuoteDialogOpen}
        onSubmit={handleCreateSession}
        onSessionCreated={handleSessionCreated}
        isLoading={isMutating}
      />
    </div>
  );
}
