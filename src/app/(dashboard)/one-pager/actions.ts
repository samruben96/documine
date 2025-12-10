'use server';

import { createClient } from '@/lib/supabase/server';
import { logOnePagerGenerated, logOnePagerExported } from '@/lib/admin';

/**
 * One-Pager Server Actions
 *
 * Story 21.4: Audit logging for one-pager generation and export.
 */

/**
 * Log One-Pager Generated Action
 *
 * Called when a one-pager is generated/downloaded.
 * AC-21.4.3: One-pager actions logged with relevant document/comparison IDs.
 */
export async function logOnePagerGeneratedAction(input: {
  sourceDocumentId?: string;
  sourceComparisonId?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get user's agency_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.agency_id) {
      return { success: false, error: 'Failed to get user data' };
    }

    // Generate a unique ID for this one-pager generation event
    const onePagerId = crypto.randomUUID();

    await logOnePagerGenerated(
      userData.agency_id,
      user.id,
      onePagerId,
      input.sourceDocumentId,
      input.sourceComparisonId
    );

    return { success: true };
  } catch (error) {
    console.error('Log one-pager generated failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to log audit event',
    };
  }
}

/**
 * Log One-Pager Exported Action
 *
 * Called when a one-pager PDF is exported.
 * AC-21.4.3: One-pager actions logged with relevant document/comparison IDs.
 */
export async function logOnePagerExportedAction(input: {
  sourceDocumentId?: string;
  sourceComparisonId?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get user's agency_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.agency_id) {
      return { success: false, error: 'Failed to get user data' };
    }

    // Generate a unique ID for this one-pager export event
    const onePagerId = crypto.randomUUID();

    await logOnePagerExported(
      userData.agency_id,
      user.id,
      onePagerId,
      'pdf'
    );

    return { success: true };
  } catch (error) {
    console.error('Log one-pager exported failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to log audit event',
    };
  }
}
