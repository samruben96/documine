/**
 * AI Buddy Project Service
 * Story 16.1: Project Creation & Sidebar
 *
 * Server-side project operations with RLS-aware queries.
 *
 * AC-16.1.4: Create project via API
 * AC-16.1.8: List projects for sidebar
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Project, CreateProjectRequest } from '@/types/ai-buddy';

/**
 * Database row type for ai_buddy_projects
 */
interface ProjectRow {
  id: string;
  agency_id: string;
  user_id: string;
  name: string;
  description: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  document_count?: number;
}

/**
 * Convert database row to Project type
 */
function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    agencyId: row.agency_id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    documentCount: row.document_count ?? 0,
  };
}

export interface ListProjectsOptions {
  /** Include archived projects (default: false) */
  includeArchived?: boolean;
  /** Sort by field (default: 'name') */
  sortBy?: 'name' | 'updated_at' | 'created_at';
  /** Sort order (default: 'asc' for name, 'desc' for dates) */
  sortOrder?: 'asc' | 'desc';
}

export interface ProjectServiceResult<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

/**
 * List projects for a user
 * RLS policy ensures users only see their own projects
 *
 * @param supabase - Supabase client (user context)
 * @param userId - User ID
 * @param options - List options
 */
export async function listProjects(
  supabase: SupabaseClient,
  userId: string,
  options: ListProjectsOptions = {}
): Promise<ProjectServiceResult<Project[]>> {
  const { includeArchived = false, sortBy = 'name', sortOrder } = options;

  // Default sort order: asc for name, desc for dates
  const order = sortOrder ?? (sortBy === 'name' ? 'asc' : 'desc');

  try {
    // Build query with document count subquery
    let query = supabase
      .from('ai_buddy_projects')
      .select(
        `
        id,
        agency_id,
        user_id,
        name,
        description,
        archived_at,
        created_at,
        updated_at,
        ai_buddy_project_documents(count)
      `
      )
      .eq('user_id', userId);

    // Filter archived unless requested
    if (!includeArchived) {
      query = query.is('archived_at', null);
    }

    // Apply sort
    query = query.order(sortBy, { ascending: order === 'asc' });

    const { data: rows, error } = await query;

    if (error) {
      return { data: null, error: { code: 'AIB_006', message: error.message } };
    }

    // Map to Project type with document count
    const projects: Project[] = (rows || []).map((row) => {
      // Extract document count from joined result
      const docCount =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (row as any).ai_buddy_project_documents?.[0]?.count ?? 0;
      return toProject({
        ...row,
        document_count: docCount,
      } as ProjectRow);
    });

    return { data: projects, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: { code: 'AIB_006', message } };
  }
}

/**
 * Get a single project by ID
 *
 * @param supabase - Supabase client (user context)
 * @param projectId - Project ID
 */
export async function getProject(
  supabase: SupabaseClient,
  projectId: string
): Promise<ProjectServiceResult<Project>> {
  try {
    const { data: row, error } = await supabase
      .from('ai_buddy_projects')
      .select(
        `
        id,
        agency_id,
        user_id,
        name,
        description,
        archived_at,
        created_at,
        updated_at,
        ai_buddy_project_documents(count)
      `
      )
      .eq('id', projectId)
      .maybeSingle();

    if (error) {
      return { data: null, error: { code: 'AIB_006', message: error.message } };
    }

    if (!row) {
      return { data: null, error: { code: 'AIB_005', message: 'Project not found' } };
    }

    // Extract document count from joined result
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docCount = (row as any).ai_buddy_project_documents?.[0]?.count ?? 0;

    return {
      data: toProject({
        ...row,
        document_count: docCount,
      } as ProjectRow),
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: { code: 'AIB_006', message } };
  }
}

/**
 * Create a new project
 *
 * @param supabase - Supabase client (user context)
 * @param userId - User ID
 * @param agencyId - Agency ID
 * @param input - Project creation input
 */
export async function createProject(
  supabase: SupabaseClient,
  userId: string,
  agencyId: string,
  input: CreateProjectRequest
): Promise<ProjectServiceResult<Project>> {
  const { name, description } = input;

  // Validation
  if (!name || name.trim().length === 0) {
    return { data: null, error: { code: 'AIB_101', message: 'Project name is required' } };
  }

  if (name.length > 100) {
    return {
      data: null,
      error: { code: 'AIB_102', message: 'Project name exceeds 100 characters' },
    };
  }

  if (description && description.length > 500) {
    return {
      data: null,
      error: { code: 'AIB_103', message: 'Project description exceeds 500 characters' },
    };
  }

  try {
    const { data: row, error } = await supabase
      .from('ai_buddy_projects')
      .insert({
        user_id: userId,
        agency_id: agencyId,
        name: name.trim(),
        description: description?.trim() || null,
      })
      .select(
        `
        id,
        agency_id,
        user_id,
        name,
        description,
        archived_at,
        created_at,
        updated_at
      `
      )
      .single();

    if (error) {
      return { data: null, error: { code: 'AIB_006', message: error.message } };
    }

    return {
      data: toProject({
        ...row,
        document_count: 0,
      } as ProjectRow),
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: { code: 'AIB_006', message } };
  }
}

/**
 * Archive a project (soft delete)
 * Per SOFT-DELETE-001: Never hard delete for audit compliance
 *
 * @param supabase - Supabase client (user context)
 * @param projectId - Project ID
 */
export async function archiveProject(
  supabase: SupabaseClient,
  projectId: string
): Promise<ProjectServiceResult<Project>> {
  try {
    const { data: row, error } = await supabase
      .from('ai_buddy_projects')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', projectId)
      .select(
        `
        id,
        agency_id,
        user_id,
        name,
        description,
        archived_at,
        created_at,
        updated_at
      `
      )
      .single();

    if (error) {
      return { data: null, error: { code: 'AIB_006', message: error.message } };
    }

    if (!row) {
      return { data: null, error: { code: 'AIB_005', message: 'Project not found' } };
    }

    return { data: toProject(row as ProjectRow), error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: { code: 'AIB_006', message } };
  }
}

/**
 * Restore an archived project
 *
 * @param supabase - Supabase client (user context)
 * @param projectId - Project ID
 */
export async function restoreProject(
  supabase: SupabaseClient,
  projectId: string
): Promise<ProjectServiceResult<Project>> {
  try {
    const { data: row, error } = await supabase
      .from('ai_buddy_projects')
      .update({ archived_at: null })
      .eq('id', projectId)
      .select(
        `
        id,
        agency_id,
        user_id,
        name,
        description,
        archived_at,
        created_at,
        updated_at
      `
      )
      .single();

    if (error) {
      return { data: null, error: { code: 'AIB_006', message: error.message } };
    }

    if (!row) {
      return { data: null, error: { code: 'AIB_005', message: 'Project not found' } };
    }

    return { data: toProject(row as ProjectRow), error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: { code: 'AIB_006', message } };
  }
}
