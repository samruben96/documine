/**
 * AI Buddy Projects Hook
 * Story 14.5: Component Scaffolding
 *
 * Hook for managing projects list and CRUD operations.
 * Stub implementation - full functionality in Epic 16.
 */

import { useState, useCallback } from 'react';
import type { Project } from '@/types/ai-buddy';

export interface UseProjectsOptions {
  agencyId?: string;
  includeArchived?: boolean;
}

export interface UseProjectsReturn {
  projects: Project[];
  isLoading: boolean;
  error: Error | null;
  createProject: (name: string, description?: string) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

export function useProjects(_options: UseProjectsOptions = {}): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createProject = useCallback(async (_name: string, _description?: string): Promise<Project> => {
    throw new Error('Not implemented - Project creation deferred to Epic 16');
  }, []);

  const updateProject = useCallback(async (_id: string, _updates: Partial<Project>) => {
    throw new Error('Not implemented - Project updates deferred to Epic 16');
  }, []);

  const archiveProject = useCallback(async (_id: string) => {
    throw new Error('Not implemented - Project archiving deferred to Epic 16');
  }, []);

  const refreshProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Stub - actual API call in Epic 16
      setProjects([]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    archiveProject,
    refreshProjects,
  };
}
