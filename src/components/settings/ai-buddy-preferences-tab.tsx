/**
 * AI Buddy Preferences Tab Component
 * Story 18.2: Preferences Management
 *
 * AC-18.2.1: Dedicated settings tab for AI Buddy preferences
 * AC-18.2.2: Load and display current preferences
 */

'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

import { PreferencesForm } from '@/components/ai-buddy/preferences-form';
import { usePreferences } from '@/hooks/ai-buddy/use-preferences';

export interface AiBuddyPreferencesTabProps {
  /** Agency name to display (read-only) */
  agencyName?: string;
}

/**
 * Settings tab container for AI Buddy preferences
 *
 * Fetches preferences on mount and passes to PreferencesForm.
 * Shows skeleton UI during loading.
 */
export function AiBuddyPreferencesTab({ agencyName }: AiBuddyPreferencesTabProps) {
  const { preferences, isLoading, error, updatePreferences, resetPreferences, refetch } = usePreferences();
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);

  // Track initial load for skeleton display
  useEffect(() => {
    if (!isLoading && !hasInitialLoaded) {
      setHasInitialLoaded(true);
    }
  }, [isLoading, hasInitialLoaded]);

  // Loading skeleton
  if (!hasInitialLoaded && isLoading) {
    return (
      <div className="mt-6 space-y-6" data-testid="preferences-loading">
        {/* Identity skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>

        {/* LOB skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-24 rounded-full" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Carriers skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-full" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions skeleton */}
        <div className="flex justify-between pt-4">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mt-6" data-testid="preferences-error">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load preferences: {error.message}
            <button
              onClick={refetch}
              className="ml-2 underline hover:no-underline"
            >
              Try again
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Preferences form
  if (preferences) {
    return (
      <div className="mt-6" data-testid="preferences-tab">
        <PreferencesForm
          preferences={preferences}
          agencyName={agencyName}
          onSave={updatePreferences}
          onReset={resetPreferences}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return null;
}
