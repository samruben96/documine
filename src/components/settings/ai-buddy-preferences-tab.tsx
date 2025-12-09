/**
 * AI Buddy Preferences Tab Component
 * Story 18.2: Preferences Management
 * Story 18.4: Admin Onboarding Status
 * Story 19.1: Guardrail Admin UI
 *
 * AC-18.2.1: Dedicated settings tab for AI Buddy preferences
 * AC-18.2.2: Load and display current preferences
 * AC-18.4.1: Admin section for onboarding status (when isAdmin=true)
 *
 * Layout: Two sub-tabs on left side
 * - "My AI Buddy" - Personal settings (all users)
 * - "AI Buddy Admin" - Team controls (admin only)
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AlertCircle, User, Shield, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { PreferencesForm } from '@/components/ai-buddy/preferences-form';
import { usePreferences } from '@/hooks/ai-buddy/use-preferences';
import { OnboardingStatusSection } from '@/components/ai-buddy/admin/onboarding-status-section';
import { GuardrailAdminPanel } from '@/components/ai-buddy/admin/guardrail-admin-panel';
import { useSettings } from '@/contexts/settings-context';

export interface AiBuddyPreferencesTabProps {
  /** Agency name to display (read-only) */
  agencyName?: string;
  /** Whether the current user is an admin (AC-18.4.5) */
  isAdmin?: boolean;
}

type SubTab = 'personal' | 'admin';

/**
 * Settings tab container for AI Buddy preferences
 *
 * Fetches preferences on mount and passes to PreferencesForm.
 * Shows skeleton UI during loading.
 * Shows OnboardingStatusSection for admin users (AC-18.4.1, AC-18.4.5).
 */
export function AiBuddyPreferencesTab({ agencyName, isAdmin = false }: AiBuddyPreferencesTabProps) {
  const { preferences, isLoading, error, updatePreferences, resetPreferences, refetch } = usePreferences();
  const { setIsDirty, setOnSave } = useSettings();
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('personal');
  const [isResetting, setIsResetting] = useState(false);
  const [formIsDirty, setFormIsDirty] = useState(false);
  const formSaveRef = useRef<(() => void) | null>(null);

  // Stable callback to pass to PreferencesForm - won't cause re-renders when called
  const handleSaveRef = useCallback((saveFn: (() => void) | null) => {
    formSaveRef.current = saveFn;
  }, []);

  // Handle dirty state from preferences form
  const handleDirtyChange = useCallback((isDirty: boolean) => {
    setFormIsDirty(isDirty);
    setIsDirty(isDirty);
  }, [setIsDirty]);

  // Register save handler with settings context
  useEffect(() => {
    if (formIsDirty) {
      const saveHandler = async () => {
        // Trigger the form submission programmatically via ref
        formSaveRef.current?.();
      };
      // Wrap in arrow function to prevent React from calling it as a functional update
      setOnSave(() => saveHandler);
    } else {
      setOnSave(undefined);
    }
  }, [formIsDirty, setOnSave]);

  // Track initial load for skeleton display
  useEffect(() => {
    if (!isLoading && !hasInitialLoaded) {
      setHasInitialLoaded(true);
    }
  }, [isLoading, hasInitialLoaded]);

  const handleResetPersonalSettings = async () => {
    setIsResetting(true);
    try {
      await resetPreferences();
      toast.success('Personal preferences reset successfully');
    } catch {
      toast.error('Failed to reset preferences');
    } finally {
      setIsResetting(false);
    }
  };

  // Loading skeleton
  if (!hasInitialLoaded && isLoading) {
    return (
      <div className="mt-6 space-y-6" data-testid="preferences-loading">
        {/* Sub-tabs skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
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

  // Preferences loaded
  if (preferences) {
    return (
      <div className="mt-6" data-testid="preferences-tab">
        {/* Sub-tabs navigation */}
        <div className="flex gap-2 mb-6 border-b" data-testid="ai-buddy-sub-tabs">
          <button
            onClick={() => setActiveSubTab('personal')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeSubTab === 'personal'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            )}
            data-testid="subtab-personal"
          >
            <User className="h-4 w-4" />
            My AI Buddy
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveSubTab('admin')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeSubTab === 'admin'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              )}
              data-testid="subtab-admin"
            >
              <Shield className="h-4 w-4" />
              AI Buddy Admin
            </button>
          )}
        </div>

        {/* Personal Settings Tab */}
        {activeSubTab === 'personal' && (
          <div className="space-y-6" data-testid="personal-settings-content">
            {/* Reset Personal Settings - at the top */}
            <Card data-testid="reset-personal-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5" />
                  Reset My AI Buddy Settings
                </CardTitle>
                <CardDescription>
                  These are your personal AI Buddy settings. Resetting will clear your preferences
                  and show the onboarding flow again. This only affects your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={isLoading || isResetting}
                      data-testid="reset-personal-btn"
                    >
                      {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset My Preferences
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset Your AI Buddy Preferences?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will clear all your personal preferences (name, role, lines of business,
                        carriers, communication style) and show the onboarding flow again.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleResetPersonalSettings}
                        disabled={isResetting}
                        data-testid="confirm-reset-personal-btn"
                      >
                        {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Reset My Preferences
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            {/* Preferences Form (without the reset button at the bottom) */}
            <PreferencesForm
              preferences={preferences}
              agencyName={agencyName}
              onSave={updatePreferences}
              onReset={resetPreferences}
              isLoading={isLoading}
              hideResetButton
              onDirtyChange={handleDirtyChange}
              onSaveRef={handleSaveRef}
            />
          </div>
        )}

        {/* Admin Settings Tab */}
        {activeSubTab === 'admin' && isAdmin && (
          <div className="space-y-6" data-testid="admin-settings-content">
            {/* Admin Settings Header */}
            <Card data-testid="admin-settings-header">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Team AI Buddy Controls
                </CardTitle>
                <CardDescription>
                  As an admin, you can configure AI Buddy settings that apply to everyone on your team.
                  Changes here affect all users in your agency.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* AC-18.4.1, AC-18.4.5: Admin-only onboarding status section */}
            <OnboardingStatusSection isAdmin={isAdmin} />

            {/* AC-19.1.1, AC-19.1.12: Admin-only guardrails section */}
            <GuardrailAdminPanel isAdmin={isAdmin} />
          </div>
        )}
      </div>
    );
  }

  return null;
}
