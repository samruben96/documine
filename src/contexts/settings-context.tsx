/**
 * Settings Context
 *
 * Provides dirty state tracking for settings page tabs.
 * Shows unsaved changes warning when switching tabs or navigating away.
 */

'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface SettingsContextValue {
  /** Current dirty state */
  isDirty: boolean;
  /** Set dirty state */
  setIsDirty: (dirty: boolean) => void;
  /** Current tab value */
  currentTab: string;
  /** Set current tab (with unsaved changes check) */
  setCurrentTab: (tab: string) => void;
  /** Whether the unsaved changes modal is shown */
  showUnsavedModal: boolean;
  /** Confirm leaving (discard changes) */
  confirmLeave: () => void;
  /** Cancel leaving (stay on current tab) */
  cancelLeave: () => void;
  /** Pending tab to switch to after confirmation */
  pendingTab: string | null;
  /** Save callback from current form */
  onSave: (() => Promise<void>) | undefined;
  /** Register save callback from current form - accepts either a value or a function returning a value (for React's functional update pattern) */
  setOnSave: (callback: (() => Promise<void>) | undefined | (() => (() => Promise<void>) | undefined)) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
  defaultTab?: string;
}

export function SettingsProvider({ children, defaultTab = 'profile' }: SettingsProviderProps) {
  const [isDirty, setIsDirty] = useState(false);
  const [currentTab, setCurrentTabInternal] = useState(defaultTab);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [onSave, setOnSave] = useState<(() => Promise<void>) | undefined>(undefined);

  // Handle browser beforeunload (refresh, close, navigate away)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Set current tab with unsaved changes check
  const setCurrentTab = useCallback((tab: string) => {
    if (tab === currentTab) return;

    if (isDirty) {
      setPendingTab(tab);
      setShowUnsavedModal(true);
    } else {
      setCurrentTabInternal(tab);
    }
  }, [isDirty, currentTab]);

  // Confirm leaving - switch tab and reset dirty state
  const confirmLeave = useCallback(() => {
    setShowUnsavedModal(false);
    setIsDirty(false);
    if (pendingTab) {
      setCurrentTabInternal(pendingTab);
      setPendingTab(null);
    }
  }, [pendingTab]);

  // Cancel leaving - stay on current tab
  const cancelLeave = useCallback(() => {
    setShowUnsavedModal(false);
    setPendingTab(null);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        isDirty,
        setIsDirty,
        currentTab,
        setCurrentTab,
        showUnsavedModal,
        confirmLeave,
        cancelLeave,
        pendingTab,
        onSave,
        setOnSave,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

// Default no-op context for when component is rendered outside SettingsProvider (e.g., tests)
const noopContext: SettingsContextValue = {
  isDirty: false,
  setIsDirty: () => {},
  currentTab: 'profile',
  setCurrentTab: () => {},
  showUnsavedModal: false,
  confirmLeave: () => {},
  cancelLeave: () => {},
  pendingTab: null,
  onSave: undefined,
  setOnSave: () => {},
};

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  // Return noop context if used outside provider (e.g., in tests)
  // This makes the context optional for isolated component testing
  return context ?? noopContext;
}
