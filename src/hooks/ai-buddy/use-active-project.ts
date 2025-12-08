/**
 * AI Buddy Active Project Hook
 * Story 16.1: Project Creation & Sidebar
 *
 * Hook for managing the currently active/selected project.
 * Uses localStorage for persistence across page navigations.
 *
 * AC-16.1.4: Create project and select it as active
 * AC-16.1.10: Active project has visual indicator
 * AC-16.1.11: Clicking project switches to that project's context
 */

import { useState, useCallback, useEffect } from 'react';
import type { Project } from '@/types/ai-buddy';

const STORAGE_KEY = 'ai-buddy-active-project-id';

export interface UseActiveProjectReturn {
  /** Currently active project */
  activeProject: Project | null;
  /** Currently active project ID (can be set independently of project data) */
  activeProjectId: string | null;
  /** Set the active project */
  setActiveProject: (project: Project | null) => void;
  /** Set active project by ID (for persistence before project data loads) */
  setActiveProjectId: (id: string | null) => void;
  /** Clear the active project */
  clearActiveProject: () => void;
}

/**
 * Active project context hook for AI Buddy
 *
 * Persists selection to localStorage for cross-session consistency.
 */
export function useActiveProject(): UseActiveProjectReturn {
  const [activeProject, setActiveProjectState] = useState<Project | null>(null);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setActiveProjectIdState(stored);
      }
    } catch {
      // localStorage not available (SSR, private browsing, etc.)
    }
  }, []);

  /**
   * Set active project and persist ID
   */
  const setActiveProject = useCallback((project: Project | null) => {
    setActiveProjectState(project);
    setActiveProjectIdState(project?.id ?? null);

    try {
      if (project?.id) {
        localStorage.setItem(STORAGE_KEY, project.id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  /**
   * Set active project ID (for restoring from localStorage)
   */
  const setActiveProjectId = useCallback((id: string | null) => {
    setActiveProjectIdState(id);

    // Clear project data if ID is null
    if (!id) {
      setActiveProjectState(null);
    }

    try {
      if (id) {
        localStorage.setItem(STORAGE_KEY, id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  /**
   * Clear active project selection
   */
  const clearActiveProject = useCallback(() => {
    setActiveProjectState(null);
    setActiveProjectIdState(null);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage not available
    }
  }, []);

  return {
    activeProject,
    activeProjectId,
    setActiveProject,
    setActiveProjectId,
    clearActiveProject,
  };
}
