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
    refresh,
  };
}
