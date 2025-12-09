/**
 * GuardrailAdminPanel Component
 * Story 19.1: Guardrail Admin UI
 *
 * AC-19.1.1: Admin section in Settings → AI Buddy with restricted topics and rule toggles
 * AC-19.1.12: Only renders for admin users
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { AlertCircle, Shield, RotateCcw, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { RestrictedTopicsList } from './restricted-topics-list';
import { GuardrailToggleList } from './guardrail-toggle-list';
import { GuardrailEnforcementLog } from './guardrail-enforcement-log';
import { AIDisclosureEditor } from './ai-disclosure-editor';
import { useGuardrails, type ResetSection } from '@/hooks/ai-buddy/use-guardrails';
import { Separator } from '@/components/ui/separator';

interface GuardrailAdminPanelProps {
  /** Whether the current user is an admin */
  isAdmin: boolean;
  /** Whether the current user has view_audit_logs permission (AC-19.2.3) */
  hasViewAuditLogsPermission?: boolean;
}

/**
 * Admin panel for managing guardrails
 *
 * Only renders when isAdmin is true.
 * Contains RestrictedTopicsList and GuardrailToggleList.
 *
 * @example
 * ```tsx
 * <GuardrailAdminPanel isAdmin={isAdmin} />
 * ```
 */
export function GuardrailAdminPanel({ isAdmin, hasViewAuditLogsPermission = false }: GuardrailAdminPanelProps) {
  const {
    guardrails,
    isLoading,
    error,
    addTopic,
    updateTopic,
    deleteTopic,
    toggleRule,
    updateGuardrails,
    resetToDefaults,
    refetch,
  } = useGuardrails();

  const [resetSection, setResetSection] = useState<ResetSection | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async (section: ResetSection) => {
    setIsResetting(true);
    try {
      await resetToDefaults(section);
      const sectionName = section === 'all' ? 'all guardrails' :
        section === 'restrictedTopics' ? 'restricted topics' :
        section === 'customRules' ? 'guardrail rules' : 'AI disclosure';
      toast.success(`Reset ${sectionName} to defaults`);
    } catch {
      toast.error('Failed to reset to defaults');
    } finally {
      setIsResetting(false);
      setResetSection(null);
    }
  };

  // AC-19.1.12: Only render for admins
  if (!isAdmin) {
    return null;
  }

  // Loading skeleton
  if (isLoading && !guardrails) {
    return (
      <Card className="mt-6" data-testid="guardrail-admin-panel-loading">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="mt-6" data-testid="guardrail-admin-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Guardrails
          </CardTitle>
          <CardDescription>
            Configure AI response boundaries and E&O protection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" data-testid="guardrail-admin-panel-error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load guardrails: {error.message}
              <button
                onClick={refetch}
                className="ml-2 underline hover:no-underline"
              >
                Try again
              </button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Reset confirmation dialog helper
  const ResetButton = ({ section, label }: { section: ResetSection; label: string }) => (
    <AlertDialog open={resetSection === section} onOpenChange={(open) => setResetSection(open ? section : null)}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          disabled={isResetting}
          data-testid={`reset-${section}-button`}
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          Reset
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset {label} to defaults?</AlertDialogTitle>
          <AlertDialogDescription>
            This will restore the default configuration for {label.toLowerCase()}.
            Any custom changes will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => handleReset(section)}
            disabled={isResetting}
            data-testid={`confirm-reset-${section}-button`}
          >
            {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset to Defaults
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <Card className="mt-6" data-testid="guardrail-admin-panel">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Guardrails
            </CardTitle>
            <CardDescription>
              Configure AI response boundaries and E&O protection. Changes take effect immediately.
            </CardDescription>
          </div>
          {/* Reset All button */}
          <ResetButton section="all" label="All Guardrails" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Restricted Topics Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Restricted Topics</h3>
              <p className="text-sm text-muted-foreground">
                Topics that AI will redirect away from with helpful guidance.
              </p>
            </div>
            <ResetButton section="restrictedTopics" label="Restricted Topics" />
          </div>
          <RestrictedTopicsList
            topics={guardrails?.restrictedTopics ?? []}
            onAddTopic={addTopic}
            onUpdateTopic={updateTopic}
            onDeleteTopic={deleteTopic}
            isLoading={isLoading}
            hideHeader
          />
        </div>

        {/* Guardrail Rules Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Guardrail Rules</h3>
              <p className="text-sm text-muted-foreground">
                Enable or disable built-in compliance rules.
              </p>
            </div>
            <ResetButton section="customRules" label="Guardrail Rules" />
          </div>
          <GuardrailToggleList
            rules={guardrails?.customRules ?? []}
            eandoDisclaimer={guardrails?.eandoDisclaimer ?? true}
            onToggleRule={toggleRule}
            onToggleEando={async (enabled) => {
              await updateGuardrails({ eandoDisclaimer: enabled });
            }}
            isLoading={isLoading}
            hideHeader
          />
        </div>

        {/* AI Disclosure Section - AC-19.4.1 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">AI Disclosure</h3>
              <p className="text-sm text-muted-foreground">
                Configurable disclosure message for state compliance requirements.
              </p>
            </div>
            <ResetButton section="aiDisclosure" label="AI Disclosure" />
          </div>
          <AIDisclosureEditor
            value={guardrails?.aiDisclosureMessage ?? null}
            enabled={guardrails?.aiDisclosureEnabled ?? true}
            onChange={async (message) => {
              await updateGuardrails({ aiDisclosureMessage: message });
              toast.success('Disclosure message updated');
            }}
            onEnabledChange={async (enabled) => {
              await updateGuardrails({ aiDisclosureEnabled: enabled });
              toast.success(enabled ? 'Disclosure enabled' : 'Disclosure disabled');
            }}
            isLoading={isLoading}
          />
        </div>

        {/* Enforcement Log Section - AC-19.2.3 */}
        {hasViewAuditLogsPermission && (
          <>
            <Separator className="my-6" />
            <GuardrailEnforcementLog />
          </>
        )}
      </CardContent>
    </Card>
  );
}
