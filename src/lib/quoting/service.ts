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
