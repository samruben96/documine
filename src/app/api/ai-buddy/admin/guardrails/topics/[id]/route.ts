/**
 * Guardrails Topic [id] API Route
 * Story 19.1: Guardrail Admin UI
 *
 * PATCH - Update an existing restricted topic
 * DELETE - Delete a restricted topic
 *
 * All endpoints require admin authentication via requireAdminAuth()
 */

import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import type { ExtendedRestrictedTopic } from '@/types/ai-buddy';
import { DEFAULT_RESTRICTED_TOPICS } from '@/types/ai-buddy';
import type { Json } from '@/types/database.types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/ai-buddy/admin/guardrails/topics/[id]
 *
 * Update an existing restricted topic.
 * Supports partial updates.
 *
 * AC-19.1.6: Edit button opens editor with pre-populated form
 */
export async function PATCH(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;

  // Check admin authentication
  const auth = await requireAdminAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let updates: Partial<ExtendedRestrictedTopic>;
  try {
    updates = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const supabase = await createClient();
  const serviceClient = createServiceClient();

  // Fetch existing guardrails
  const { data: existing } = await supabase
    .from('ai_buddy_guardrails')
    .select('restricted_topics')
    .eq('agency_id', auth.agencyId)
    .maybeSingle();

  // Parse existing topics
  let currentTopics: ExtendedRestrictedTopic[] = [];
  if (existing?.restricted_topics && Array.isArray(existing.restricted_topics)) {
    currentTopics = existing.restricted_topics as unknown as ExtendedRestrictedTopic[];
  } else {
    currentTopics = [...DEFAULT_RESTRICTED_TOPICS];
  }

  // Find topic to update
  const topicIndex = currentTopics.findIndex((t) => t.id === id);
  if (topicIndex === -1) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
  }

  // Update topic (we already checked that topicIndex !== -1, so this is safe)
  const existingTopic = currentTopics[topicIndex]!;
  const updatedTopic: ExtendedRestrictedTopic = {
    id: existingTopic.id,
    trigger: updates.trigger !== undefined ? updates.trigger.trim() : existingTopic.trigger,
    description: updates.description !== undefined ? (updates.description?.trim() || undefined) : existingTopic.description,
    redirectGuidance: updates.redirectGuidance !== undefined ? updates.redirectGuidance.trim() : existingTopic.redirectGuidance,
    enabled: updates.enabled !== undefined ? updates.enabled : existingTopic.enabled,
    isBuiltIn: existingTopic.isBuiltIn,
    createdAt: existingTopic.createdAt,
    createdBy: existingTopic.createdBy,
  };

  currentTopics[topicIndex] = updatedTopic;

  // Upsert using service client
  const { error: upsertError } = await serviceClient
    .from('ai_buddy_guardrails')
    .upsert(
      {
        agency_id: auth.agencyId,
        restricted_topics: currentTopics as unknown as Json,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'agency_id' }
    );

  if (upsertError) {
    console.error('Failed to update topic:', upsertError);
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // Log the change to audit log
  await serviceClient.from('agency_audit_logs').insert({
    agency_id: auth.agencyId,
    user_id: auth.userId,
    action: 'guardrail_topic_updated',
    metadata: { topicId: id, changes: Object.keys(updates) },
  });

  return NextResponse.json({ data: { topic: updatedTopic } });
}

/**
 * DELETE /api/ai-buddy/admin/guardrails/topics/[id]
 *
 * Delete a restricted topic.
 *
 * AC-19.1.7: Delete button removes topic from list
 */
export async function DELETE(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;

  // Check admin authentication
  const auth = await requireAdminAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();
  const serviceClient = createServiceClient();

  // Fetch existing guardrails
  const { data: existing } = await supabase
    .from('ai_buddy_guardrails')
    .select('restricted_topics')
    .eq('agency_id', auth.agencyId)
    .maybeSingle();

  // Parse existing topics
  let currentTopics: ExtendedRestrictedTopic[] = [];
  if (existing?.restricted_topics && Array.isArray(existing.restricted_topics)) {
    currentTopics = existing.restricted_topics as unknown as ExtendedRestrictedTopic[];
  } else {
    currentTopics = [...DEFAULT_RESTRICTED_TOPICS];
  }

  // Find topic to delete
  const topicIndex = currentTopics.findIndex((t) => t.id === id);
  if (topicIndex === -1) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
  }

  // We already checked that topicIndex !== -1, so this is safe
  const deletedTopic = currentTopics[topicIndex]!;

  // Remove topic
  const updatedTopics = currentTopics.filter((t) => t.id !== id);

  // Upsert using service client
  const { error: upsertError } = await serviceClient
    .from('ai_buddy_guardrails')
    .upsert(
      {
        agency_id: auth.agencyId,
        restricted_topics: updatedTopics as unknown as Json,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'agency_id' }
    );

  if (upsertError) {
    console.error('Failed to delete topic:', upsertError);
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // Log the change to audit log
  await serviceClient.from('agency_audit_logs').insert({
    agency_id: auth.agencyId,
    user_id: auth.userId,
    action: 'guardrail_topic_deleted',
    metadata: { topicId: id, trigger: deletedTopic.trigger },
  });

  return NextResponse.json({ data: { deleted: true } });
}
