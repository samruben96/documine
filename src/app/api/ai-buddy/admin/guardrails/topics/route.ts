/**
 * Guardrails Topics API Route
 * Story 19.1: Guardrail Admin UI
 *
 * POST - Create a new restricted topic
 *
 * All endpoints require admin authentication via requireAdminAuth()
 */

import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import type { ExtendedRestrictedTopic } from '@/types/ai-buddy';
import { DEFAULT_RESTRICTED_TOPICS } from '@/types/ai-buddy';
import type { Json } from '@/types/database.types';

/**
 * POST /api/ai-buddy/admin/guardrails/topics
 *
 * Create a new restricted topic.
 * Auto-generates UUID for the topic.
 *
 * AC-19.1.4: Dialog can enter trigger phrase, description, redirect guidance
 * AC-19.1.5: Topic added to list after save
 */
export async function POST(request: Request): Promise<NextResponse> {
  // Check admin authentication
  const auth = await requireAdminAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: {
    trigger: string;
    description?: string;
    redirectGuidance: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validate required fields
  if (!body.trigger || typeof body.trigger !== 'string') {
    return NextResponse.json({ error: 'trigger is required' }, { status: 400 });
  }
  if (!body.redirectGuidance || typeof body.redirectGuidance !== 'string') {
    return NextResponse.json({ error: 'redirectGuidance is required' }, { status: 400 });
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
    // Initialize with defaults if no guardrails exist
    currentTopics = [...DEFAULT_RESTRICTED_TOPICS];
  }

  // Create new topic
  const newTopic: ExtendedRestrictedTopic = {
    id: crypto.randomUUID(),
    trigger: body.trigger.trim(),
    description: body.description?.trim() || undefined,
    redirectGuidance: body.redirectGuidance.trim(),
    enabled: true,
    isBuiltIn: false,
    createdAt: new Date().toISOString(),
    createdBy: auth.userId,
  };

  // Add to list
  const updatedTopics = [...currentTopics, newTopic];

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
    console.error('Failed to create topic:', upsertError);
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // Log the change to audit log
  await serviceClient.from('ai_buddy_audit_logs').insert({
    agency_id: auth.agencyId,
    user_id: auth.userId,
    action: 'guardrail_topic_created',
    metadata: { topicId: newTopic.id, trigger: newTopic.trigger },
  });

  return NextResponse.json({ data: { topic: newTopic } }, { status: 201 });
}
