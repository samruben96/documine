/**
 * Quote Session Service
 * Story Q2.1: Quote Sessions List Page
 *
 * Business logic for CRUD operations, status calculation, and session management.
 * All operations respect RLS policies scoped to agency_id.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type {
  QuoteSession,
  QuoteSessionRow,
  QuoteSessionStatus,
  QuoteType,
  QuoteClientData,
  ListQuoteSessionsOptions,
} from '@/types/quoting';

/**
 * Calculate session status from client data and quote results count
 *
 * Status calculation rules per tech spec:
 * - draft: client_data is empty OR only has minimal data
 * - in_progress: client_data.personal has at least firstName + lastName
 * - quotes_received: At least one quote_result exists for this session
 * - complete: A comparison document has been generated (status field = 'complete')
 *
 * @param clientData - The session's client data (JSONB)
 * @param carrierCount - Number of quote results for this session
 * @param storedStatus - The stored status field (for 'complete' check)
 * @returns Computed status
 */
export function calculateSessionStatus(
  clientData: QuoteClientData | null | undefined,
  carrierCount: number = 0,
  storedStatus?: string
): QuoteSessionStatus {
  // If stored status is 'complete', respect it (comparison was generated)
  if (storedStatus === 'complete') {
    return 'complete';
  }

  // If there are quote results, status is quotes_received
  if (carrierCount > 0) {
    return 'quotes_received';
  }

  // Check if client data has meaningful content
  if (!clientData || Object.keys(clientData).length === 0) {
    return 'draft';
  }

  // Check for personal info with firstName + lastName
  const personal = clientData.personal;
  if (personal?.firstName && personal?.lastName) {
    return 'in_progress';
  }

  // Check if any other substantial data exists
  const hasPropertyData = clientData.property && Object.keys(clientData.property).length > 0;
  const hasAutoData = clientData.auto && (
    (clientData.auto.vehicles && clientData.auto.vehicles.length > 0) ||
    (clientData.auto.drivers && clientData.auto.drivers.length > 0)
  );

  if (hasPropertyData || hasAutoData) {
    return 'in_progress';
  }

  return 'draft';
}

/**
 * Transform database row to application entity
 *
 * Converts snake_case DB columns to camelCase and parses JSONB
 */
export function transformQuoteSession(
  row: QuoteSessionRow,
  carrierCount: number = 0
): QuoteSession {
  const clientData = (row.client_data as QuoteClientData) ?? {};
  const computedStatus = calculateSessionStatus(clientData, carrierCount, row.status);

  return {
    id: row.id,
    agencyId: row.agency_id,
    userId: row.user_id,
    prospectName: row.prospect_name,
    quoteType: row.quote_type as QuoteType,
    status: computedStatus,
    clientData,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    carrierCount,
  };
}

/**
 * List all quote sessions for the current user's agency
 *
 * AC-Q2.1-1: Sessions sorted by most recently updated first
 *
 * @param supabase - Supabase client instance (RLS-scoped)
 * @param options - Query options (search, status filter, limit)
 * @returns List of quote sessions with computed status and carrier counts
 */
export async function listQuoteSessions(
  supabase: SupabaseClient<Database>,
  options?: ListQuoteSessionsOptions
): Promise<QuoteSession[]> {
  // Query sessions with carrier count
  // Using a subquery pattern to get count of related quote_results
  let query = supabase
    .from('quote_sessions')
    .select(`
      *,
      quote_results(count)
    `)
    .order('updated_at', { ascending: false });

  // Apply search filter on prospect_name
  if (options?.search) {
    query = query.ilike('prospect_name', `%${options.search}%`);
  }

  // Apply limit if specified
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to list quote sessions:', { error: error.message });
    return [];
  }

  if (!data) {
    return [];
  }

  // Transform rows to application entities
  const sessions = data.map((row) => {
    // Extract carrier count from the nested count result
    const carrierCount = Array.isArray(row.quote_results)
      ? row.quote_results.length
      : (row.quote_results as { count: number } | null)?.count ?? 0;

    return transformQuoteSession(row as QuoteSessionRow, carrierCount);
  });

  // Apply status filter if specified (done client-side since status is computed)
  if (options?.status) {
    const statusFilter = Array.isArray(options.status) ? options.status : [options.status];
    return sessions.filter((s) => statusFilter.includes(s.status));
  }

  return sessions;
}

/**
 * Create a new quote session
 * Story Q2.2: Create New Quote Session
 *
 * AC-Q2.2-3: Creates session with status='draft' and empty client_data
 *
 * @param supabase - Supabase client instance
 * @param userId - The authenticated user's ID
 * @param agencyId - The user's agency ID
 * @param input - Create session input (prospectName, quoteType)
 * @returns Created quote session
 */
export async function createQuoteSession(
  supabase: SupabaseClient<Database>,
  userId: string,
  agencyId: string,
  input: { prospectName: string; quoteType: QuoteType }
): Promise<QuoteSession> {
  const { data, error } = await supabase
    .from('quote_sessions')
    .insert({
      user_id: userId,
      agency_id: agencyId,
      prospect_name: input.prospectName,
      quote_type: input.quoteType,
      status: 'draft', // New sessions start as draft
      client_data: {}, // Empty client data initially
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create quote session:', { error: error.message });
    throw new Error(`Failed to create quote session: ${error.message}`);
  }

  return transformQuoteSession(data as QuoteSessionRow, 0);
}

/**
 * Get a single quote session by ID
 *
 * @param supabase - Supabase client instance
 * @param sessionId - Session ID to fetch
 * @returns Quote session or null if not found
 */
export async function getQuoteSession(
  supabase: SupabaseClient<Database>,
  sessionId: string
): Promise<QuoteSession | null> {
  const { data, error } = await supabase
    .from('quote_sessions')
    .select(`
      *,
      quote_results(count)
    `)
    .eq('id', sessionId)
    .single();

  if (error || !data) {
    if (error?.code !== 'PGRST116') {
      // Not a "not found" error
      console.error('Failed to get quote session:', { sessionId, error: error?.message });
    }
    return null;
  }

  const carrierCount = Array.isArray(data.quote_results)
    ? data.quote_results.length
    : (data.quote_results as { count: number } | null)?.count ?? 0;

  return transformQuoteSession(data as QuoteSessionRow, carrierCount);
}

/**
 * Delete a quote session
 * Story Q2.5: Delete and Duplicate Quote Sessions
 *
 * AC-Q2.5-2: Cascade delete handles quote_results via FK constraint
 *
 * @param supabase - Supabase client instance
 * @param sessionId - Session ID to delete
 * @returns true if deleted, false if not found
 */
export async function deleteQuoteSession(
  supabase: SupabaseClient<Database>,
  sessionId: string
): Promise<boolean> {
  const { error, count } = await supabase
    .from('quote_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    // RLS violation or other error
    if (error.code === 'PGRST116' || error.message.includes('0 rows')) {
      return false;
    }
    console.error('Failed to delete quote session:', { sessionId, error: error.message });
    throw new Error(`Failed to delete quote session: ${error.message}`);
  }

  // Supabase delete returns undefined count when no .select() used
  // If no error and request succeeded, assume deleted
  return true;
}

/**
 * Duplicate a quote session
 * Story Q2.5: Delete and Duplicate Quote Sessions
 *
 * AC-Q2.5-4: Creates copy with "(Copy)" suffix, same quote_type, copied client_data,
 *            no quote_results, status "draft"
 *
 * @param supabase - Supabase client instance
 * @param sessionId - Session ID to duplicate
 * @param userId - Authenticated user ID
 * @param agencyId - User's agency ID
 * @returns New duplicate session or null if original not found
 */
export async function duplicateQuoteSession(
  supabase: SupabaseClient<Database>,
  sessionId: string,
  userId: string,
  agencyId: string
): Promise<QuoteSession | null> {
  // Fetch original session
  const { data: original, error: fetchError } = await supabase
    .from('quote_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (fetchError || !original) {
    if (fetchError?.code !== 'PGRST116') {
      console.error('Failed to fetch session for duplication:', { sessionId, error: fetchError?.message });
    }
    return null;
  }

  // Create duplicate with "(Copy)" suffix
  const { data: newSession, error: insertError } = await supabase
    .from('quote_sessions')
    .insert({
      user_id: userId,
      agency_id: agencyId,
      prospect_name: `${original.prospect_name} (Copy)`,
      quote_type: original.quote_type,
      status: 'draft', // New duplicate starts as draft
      client_data: original.client_data ?? {}, // Copy client_data, no quote_results
    })
    .select()
    .single();

  if (insertError || !newSession) {
    console.error('Failed to create duplicate session:', { sessionId, error: insertError?.message });
    throw new Error(`Failed to duplicate session: ${insertError?.message}`);
  }

  // Return new session (carrier count = 0 since no quote_results copied)
  return transformQuoteSession(newSession as QuoteSessionRow, 0);
}

/**
 * Update quote session client data (partial update with deep merge)
 * Story Q3.1: Data Capture Forms
 *
 * AC-Q3.1 (all): Partial update merging on server (deep merge into client_data)
 *
 * @param supabase - Supabase client instance
 * @param sessionId - Session ID to update
 * @param clientDataPatch - Partial client data to merge
 * @returns Updated quote session or null if not found
 */
export async function updateQuoteSessionClientData(
  supabase: SupabaseClient<Database>,
  sessionId: string,
  clientDataPatch: Partial<QuoteClientData>
): Promise<QuoteSession | null> {
  // Fetch existing session to get current client_data
  const { data: existing, error: fetchError } = await supabase
    .from('quote_sessions')
    .select(`
      *,
      quote_results(count)
    `)
    .eq('id', sessionId)
    .single();

  if (fetchError || !existing) {
    if (fetchError?.code !== 'PGRST116') {
      console.error('Failed to fetch session for update:', { sessionId, error: fetchError?.message });
    }
    return null;
  }

  // Deep merge existing client_data with patch
  const existingClientData = (existing.client_data as QuoteClientData) ?? {};
  const mergedClientData = deepMergeClientData(existingClientData, clientDataPatch);

  // Update session with merged client_data
  const { data: updated, error: updateError } = await supabase
    .from('quote_sessions')
    .update({
      // Cast to satisfy Supabase Json type (structurally compatible but lacks index signature)
      client_data: mergedClientData as unknown as Database['public']['Tables']['quote_sessions']['Update']['client_data'],
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select(`
      *,
      quote_results(count)
    `)
    .single();

  if (updateError || !updated) {
    console.error('Failed to update quote session:', { sessionId, error: updateError?.message });
    throw new Error(`Failed to update quote session: ${updateError?.message}`);
  }

  const carrierCount = Array.isArray(updated.quote_results)
    ? updated.quote_results.length
    : (updated.quote_results as { count: number } | null)?.count ?? 0;

  return transformQuoteSession(updated as QuoteSessionRow, carrierCount);
}

/**
 * Deep merge utility for JSONB client data updates
 *
 * Merges nested objects recursively while replacing arrays (not merging them).
 * This allows partial updates like { personal: { firstName: "John" } } to
 * merge with existing personal data while replacing vehicles/drivers arrays.
 */
function deepMergeClientData(
  target: QuoteClientData,
  source: Partial<QuoteClientData>
): QuoteClientData {
  const result: QuoteClientData = { ...target };

  for (const key of Object.keys(source) as (keyof QuoteClientData)[]) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (
      sourceValue !== undefined &&
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue !== undefined &&
      targetValue !== null &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      // Recursively merge objects
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)[key] = deepMergeClientData(
        targetValue as QuoteClientData,
        sourceValue as Partial<QuoteClientData>
      );
    } else if (sourceValue !== undefined) {
      // Direct assignment for arrays, primitives, and nulls
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)[key] = sourceValue;
    }
  }

  return result;
}
