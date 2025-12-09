/**
 * AI Buddy Projects Hook
 * Story 16.1: Project Creation & Sidebar
 *
 * Hook for managing projects list, creating, and archiving projects.
 * Follows useState/useCallback pattern from use-conversations.ts
 *
 * AC-16.1.4: Create project and select it as active
 * AC-16.1.5: Optimistic updates for project list
 * AC-16.1.8: List projects for sidebar
 * AC-16.1.12: Projects sorted alphabetically by name
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Project, CreateProjectRequest, AiBuddyApiError } from '@/types/ai-buddy';

export interface UseProjectsOptions {
  /** Auto-fetch projects on mount (default: true) */
  autoFetch?: boolean;
  /** Include archived projects (default: false) */
  includeArchived?: boolean;
}

export interface UseProjectsReturn {
  /** List of projects, sorted alphabetically */
  projects: Project[];
  /** Loading state for list fetch */
  isLoading: boolean;
  /** Loading state for mutations */
  isMutating: boolean;
  /** Error state */
  error: Error | null;
  /** Fetch/refresh projects list */
  fetchProjects: () => Promise<void>;
  /** Create a new project */
  createProject: (input: CreateProjectRequest) => Promise<Project | null>;
  /** Archive a project */
  archiveProject: (projectId: string) => Promise<void>;
  /** Update a project (Story 16.3) */
  updateProject: (projectId: string, input: { name?: string; description?: string }) => Promise<Project | null>;
  /** Restore an archived project (Story 16.3) */
  restoreProject: (projectId: string) => Promise<Project | null>;
  /** Archived projects (Story 16.3) */
  archivedProjects: Project[];
  /** Fetch archived projects (Story 16.3) */
  fetchArchivedProjects: () => Promise<void>;
  /** Refresh projects list */
  refresh: () => Promise<void>;
}

/**
 * API Response types
 */
interface ProjectsListResponse {
  data: Project[] | null;
  error: AiBuddyApiError | null;
}

interface ProjectCreateResponse {
  data: Project | null;
  error: AiBuddyApiError | null;
}

/**
 * Projects management hook for AI Buddy
 *
 * AC-16.1.12: Projects sorted alphabetically by name
 */
export function useProjects(options: UseProjectsOptions = {}): UseProjectsReturn {
  const { autoFetch = true, includeArchived = false } = options;

  const [projects, setProjects] = useState<Project[]>([]);
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track if initial fetch has happened
  const hasFetchedRef = useRef(false);

  /**
   * Fetch projects list from API
   */
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('sortBy', 'name');
      params.set('sortOrder', 'asc');
      if (includeArchived) {
        params.set('includeArchived', 'true');
      }

      const response = await fetch(`/api/ai-buddy/projects?${params.toString()}`);
      const result: ProjectsListResponse = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message ?? 'Failed to fetch projects');
      }

      setProjects(result.data ?? []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch projects');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [includeArchived]);

  /**
   * Create a new project with optimistic update
   *
   * AC-16.1.5: New project appears immediately
   */
  const createProject = useCallback(
    async (input: CreateProjectRequest): Promise<Project | null> => {
      setIsMutating(true);
      setError(null);

      // Create optimistic project for immediate UI feedback
      const optimisticProject: Project = {
        id: `temp-${Date.now()}`,
        agencyId: '',
        userId: '',
        name: input.name,
        description: input.description ?? null,
        archivedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        documentCount: 0,
      };

      // Optimistic update - add to list in sorted position
      const previousProjects = [...projects];
      setProjects((prev) => {
        const updated = [...prev, optimisticProject];
        // Sort alphabetically by name
        return updated.sort((a, b) => a.name.localeCompare(b.name));
      });

      try {
        const response = await fetch('/api/ai-buddy/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        const result: ProjectCreateResponse = await response.json();

        if (!response.ok || result.error) {
          // Revert optimistic update on error
          setProjects(previousProjects);
          throw new Error(result.error?.message ?? 'Failed to create project');
        }

        // Replace optimistic project with real one
        if (result.data) {
          setProjects((prev) => {
            const updated = prev.filter((p) => p.id !== optimisticProject.id);
            updated.push(result.data!);
            // Keep sorted alphabetically
            return updated.sort((a, b) => a.name.localeCompare(b.name));
          });
          return result.data;
        }

        return null;
      } catch (err) {
        // Revert optimistic update
        setProjects(previousProjects);
        const error = err instanceof Error ? err : new Error('Failed to create project');
        setError(error);
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [projects]
  );

  /**
   * Archive a project with optimistic update
   */
  const archiveProject = useCallback(
    async (projectId: string) => {
      setIsMutating(true);
      setError(null);

      // Optimistic update - remove from list
      const previousProjects = [...projects];
      setProjects((prev) => prev.filter((p) => p.id !== projectId));

      try {
        const response = await fetch(`/api/ai-buddy/projects/${projectId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          // Revert on failure
          setProjects(previousProjects);
          throw new Error('Failed to archive project');
        }
      } catch (err) {
        // Revert on error
        setProjects(previousProjects);
        const error = err instanceof Error ? err : new Error('Failed to archive project');
        setError(error);
        throw error;
      } finally {
        setIsMutating(false);
      }
    },
    [projects]
  );

  /**
   * Update a project with optimistic update (Story 16.3)
   *
   * AC-16.3.4: Renamed project updates immediately
   */
  const updateProject = useCallback(
    async (projectId: string, input: { name?: string; description?: string }): Promise<Project | null> => {
      setIsMutating(true);
      setError(null);

      // Optimistic update
      const previousProjects = [...projects];
      setProjects((prev) => {
        const updated = prev.map((p) =>
          p.id === projectId
            ? { ...p, name: input.name ?? p.name, description: input.description ?? p.description }
            : p
        );
        // Keep sorted alphabetically
        return updated.sort((a, b) => a.name.localeCompare(b.name));
      });

      try {
        const response = await fetch(`/api/ai-buddy/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        const result = await response.json();

        if (!response.ok || result.error) {
          // Revert optimistic update on error
          setProjects(previousProjects);
          throw new Error(result.error?.message ?? 'Failed to update project');
        }

        // Update with server response
        if (result.data) {
          setProjects((prev) => {
            const updated = prev.map((p) => (p.id === projectId ? result.data : p));
            return updated.sort((a, b) => a.name.localeCompare(b.name));
          });
          return result.data;
        }

        return null;
      } catch (err) {
        setProjects(previousProjects);
        const error = err instanceof Error ? err : new Error('Failed to update project');
        setError(error);
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [projects]
  );

  /**
   * Fetch archived projects (Story 16.3)
   */
  const fetchArchivedProjects = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('includeArchived', 'true');
      params.set('sortBy', 'name');
      params.set('sortOrder', 'asc');

      const response = await fetch(`/api/ai-buddy/projects?${params.toString()}`);
      const result: ProjectsListResponse = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message ?? 'Failed to fetch archived projects');
      }

      // Filter to only archived projects
      const archived = (result.data ?? []).filter((p) => p.archivedAt !== null);
      setArchivedProjects(archived);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch archived projects');
      setError(error);
    }
  }, []);

  /**
   * Restore an archived project (Story 16.3)
   *
   * AC-16.3.8: Restoring project clears archived_at and returns to main list
   */
  const restoreProject = useCallback(
    async (projectId: string): Promise<Project | null> => {
      setIsMutating(true);
      setError(null);

      // Optimistic update - remove from archived, add to main
      const previousArchived = [...archivedProjects];
      const previousProjects = [...projects];
      const projectToRestore = archivedProjects.find((p) => p.id === projectId);

      if (projectToRestore) {
        setArchivedProjects((prev) => prev.filter((p) => p.id !== projectId));
        setProjects((prev) => {
          const updated = [...prev, { ...projectToRestore, archivedAt: null }];
          return updated.sort((a, b) => a.name.localeCompare(b.name));
        });
      }

      try {
        const response = await fetch(`/api/ai-buddy/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restore: true }),
        });

        const result = await response.json();

        if (!response.ok || result.error) {
          // Revert on error
          setArchivedProjects(previousArchived);
          setProjects(previousProjects);
          throw new Error(result.error?.message ?? 'Failed to restore project');
        }

        return result.data ?? null;
      } catch (err) {
        setArchivedProjects(previousArchived);
        setProjects(previousProjects);
        const error = err instanceof Error ? err : new Error('Failed to restore project');
        setError(error);
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [projects, archivedProjects]
  );

  /**
   * Refresh projects list
   */
  const refresh = useCallback(async () => {
    await fetchProjects();
  }, [fetchProjects]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchProjects();
    }
  }, [autoFetch, fetchProjects]);

  return {
    projects,
    isLoading,
    isMutating,
    error,
    fetchProjects,
    createProject,
    archiveProject,
    updateProject,
    restoreProject,
    archivedProjects,
    fetchArchivedProjects,
    refresh,
  };
}
