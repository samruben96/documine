/**
 * Settings Tabs Wrapper
 *
 * Client component that wraps settings tabs to provide:
 * - Controlled tab state via SettingsProvider context
 * - Unsaved changes warning modal when switching tabs
 */

'use client';

import { ReactNode, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { SettingsProvider, useSettings } from '@/contexts/settings-context';

interface SettingsTabsWrapperProps {
  children: ReactNode;
  defaultTab?: string;
  isAdmin: boolean;
}

interface SettingsTabsContentProps {
  children: ReactNode;
  isAdmin: boolean;
}

function SettingsTabsContent({ children, isAdmin }: SettingsTabsContentProps) {
  const {
    currentTab,
    setCurrentTab,
    showUnsavedModal,
    confirmLeave,
    cancelLeave,
    onSave,
  } = useSettings();
  const [isSaving, setIsSaving] = useState(false);

  // Save changes then switch tab
  const handleSaveAndLeave = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave();
        confirmLeave();
      } catch {
        // Save failed - stay on page (toast will be shown by save handler)
        cancelLeave();
      } finally {
        setIsSaving(false);
      }
    } else {
      // No save callback registered - just leave
      confirmLeave();
    }
  };

  return (
    <>
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="agency">Agency</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          {/* AC-21.3.3: Admin tab is only visible to users with admin permissions */}
          {isAdmin && <TabsTrigger value="admin" data-testid="admin-tab">Admin</TabsTrigger>}
          {isAdmin && <TabsTrigger value="branding">Branding</TabsTrigger>}
          {isAdmin && <TabsTrigger value="usage">Usage</TabsTrigger>}
          <TabsTrigger value="ai-buddy" data-testid="ai-buddy-tab">AI Buddy</TabsTrigger>
        </TabsList>

        {children}
      </Tabs>

      {/* Unsaved Changes Modal */}
      <AlertDialog open={showUnsavedModal} onOpenChange={() => {}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={cancelLeave} disabled={isSaving}>
              Stay on Page
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLeave}
              disabled={isSaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard Changes
            </AlertDialogAction>
            <Button
              onClick={handleSaveAndLeave}
              disabled={isSaving}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function SettingsTabsWrapper({ children, defaultTab = 'profile', isAdmin }: SettingsTabsWrapperProps) {
  return (
    <SettingsProvider defaultTab={defaultTab}>
      <SettingsTabsContent isAdmin={isAdmin}>{children}</SettingsTabsContent>
    </SettingsProvider>
  );
}

// Export TabsContent for use in page
export { TabsContent };
