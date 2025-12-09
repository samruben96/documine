/**
 * Unsaved Changes Warning Hook
 *
 * Provides warning when user tries to leave a page with unsaved changes:
 * - Intercepts browser navigation (refresh, close, back)
 * - Provides modal state for in-app navigation
 *
 * Usage:
 * const { isDirty, setIsDirty, showModal, confirmLeave, cancelLeave, pendingAction, triggerLeave } = useUnsavedChangesWarning();
 */

'use client';

import { useEffect, useState, useCallback } from 'react';

interface UseUnsavedChangesWarningReturn {
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Set dirty state */
  setIsDirty: (dirty: boolean) => void;
  /** Whether the confirmation modal should be shown */
  showModal: boolean;
  /** Call when user confirms they want to leave (discard changes) */
  confirmLeave: () => void;
  /** Call when user cancels leaving */
  cancelLeave: () => void;
  /** The pending action to execute after confirming leave */
  pendingAction: (() => void) | null;
  /** Trigger navigation/action with unsaved changes check */
  triggerLeave: (action: () => void) => void;
}

export function useUnsavedChangesWarning(): UseUnsavedChangesWarningReturn {
  const [isDirty, setIsDirty] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Handle browser beforeunload (refresh, close, navigate away)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        // Most browsers ignore custom message and show default
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Trigger a navigation/action with unsaved changes check
  const triggerLeave = useCallback((action: () => void) => {
    if (isDirty) {
      setPendingAction(() => action);
      setShowModal(true);
    } else {
      action();
    }
  }, [isDirty]);

  // User confirms they want to leave (discard changes)
  const confirmLeave = useCallback(() => {
    setShowModal(false);
    setIsDirty(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  // User cancels leaving
  const cancelLeave = useCallback(() => {
    setShowModal(false);
    setPendingAction(null);
  }, []);

  return {
    isDirty,
    setIsDirty,
    showModal,
    confirmLeave,
    cancelLeave,
    pendingAction,
    triggerLeave,
  };
}
