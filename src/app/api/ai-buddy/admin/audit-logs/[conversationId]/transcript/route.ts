/**
 * AI Buddy Admin Audit Logs Transcript API Route
 * Story 20.4: Audit Log Interface
 *
 * GET /api/ai-buddy/admin/audit-logs/[conversationId]/transcript - Get full conversation transcript
 * Admin only - requires view_audit_logs permission.
 *
 * AC-20.4.4: Returns full read-only conversation transcript
 * AC-20.4.5: Messages show role, content, timestamps, source citations, confidence badges
 * AC-20.4.6: Guardrail events highlighted with type and trigger info
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import type { Citation, ConfidenceLevel } from '@/types/ai-buddy';

/**
 * Transcript message with full details
 * AC-20.4.5: role, content, timestamps, source citations, confidence badges
 */
export interface TranscriptMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources: Citation[] | null;
  confidence: ConfidenceLevel | null;
  createdAt: string;
}

/**
 * Guardrail event for highlighting in transcript
 * AC-20.4.6: type and trigger information
 */
export interface TranscriptGuardrailEvent {
  id: string;
  triggeredTopic: string;
  messagePreview: string;
  redirectMessage: string;
  loggedAt: string;
}

/**
 * Full transcript response
 */
export interface TranscriptData {
  conversation: {
    id: string;
    title: string | null;
    projectId: string | null;
    projectName: string | null;
    userId: string;
    userName: string | null;
    userEmail: string;
    createdAt: string;
  };
  messages: TranscriptMessage[];
  guardrailEvents: TranscriptGuardrailEvent[];
}

/**
 * GET /api/ai-buddy/admin/audit-logs/[conversationId]/transcript
 * Get full conversation transcript with messages and guardrail events
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
): Promise<Response> {
  // Check admin authentication with view_audit_logs permission
  const auth = await requireAdminAuth('view_audit_logs');
  if (!auth.success) {
    return NextResponse.json(
      { data: null, error: { code: auth.status === 401 ? 'AIB_001' : 'AIB_002', message: auth.error } },
      { status: auth.status }
    );
  }

  const { conversationId } = await params;

  if (!conversationId) {
    return NextResponse.json(
      { data: null, error: { code: 'AIB_004', message: 'Conversation ID is required' } },
      { status: 400 }
    );
  }

  const serviceClient = createServiceClient();

  try {
    // Get conversation with user and project details
    const { data: conversation, error: convError } = await serviceClient
      .from('ai_buddy_conversations')
      .select(`
        id,
        title,
        project_id,
        user_id,
        created_at,
        agency_id,
        ai_buddy_projects(name),
        users!user_id(full_name, email)
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { data: null, error: { code: 'AIB_005', message: 'Conversation not found' } },
        { status: 404 }
      );
    }

    // Verify conversation belongs to admin's agency
    if (conversation.agency_id !== auth.agencyId) {
      return NextResponse.json(
        { data: null, error: { code: 'AIB_002', message: 'Not authorized to view this conversation' } },
        { status: 403 }
      );
    }

    // Get all messages for conversation
    const { data: messages, error: messagesError } = await serviceClient
      .from('ai_buddy_messages')
      .select('id, role, content, sources, confidence, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Failed to fetch messages:', messagesError);
      return NextResponse.json(
        { data: null, error: { code: 'AIB_006', message: 'Failed to retrieve messages' } },
        { status: 500 }
      );
    }

    // Get guardrail events for this conversation
    const { data: guardrailLogs, error: guardrailError } = await serviceClient
      .from('ai_buddy_audit_logs')
      .select('id, metadata, logged_at')
      .eq('conversation_id', conversationId)
      .eq('action', 'guardrail_triggered')
      .order('logged_at', { ascending: true });

    if (guardrailError) {
      console.error('Failed to fetch guardrail events:', guardrailError);
      // Don't fail, just return empty guardrail events
    }

    // Map messages to response format
    const transcriptMessages: TranscriptMessage[] = (messages ?? []).map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      sources: msg.sources as Citation[] | null,
      confidence: msg.confidence as ConfidenceLevel | null,
      createdAt: msg.created_at,
    }));

    // Map guardrail events to response format
    const guardrailEvents: TranscriptGuardrailEvent[] = (guardrailLogs ?? []).map(log => {
      const metadata = log.metadata as Record<string, unknown> | null;
      return {
        id: log.id,
        triggeredTopic: (metadata?.triggeredTopic as string) ?? 'Unknown',
        messagePreview: (metadata?.messagePreview as string) ?? '',
        redirectMessage: (metadata?.redirectMessage as string) ?? '',
        loggedAt: log.logged_at,
      };
    });

    // Build response
    const users = conversation.users as { full_name: string | null; email: string } | null;
    const project = conversation.ai_buddy_projects as { name: string } | null;

    const transcriptData: TranscriptData = {
      conversation: {
        id: conversation.id,
        title: conversation.title,
        projectId: conversation.project_id,
        projectName: project?.name ?? null,
        userId: conversation.user_id,
        userName: users?.full_name ?? null,
        userEmail: users?.email ?? 'Unknown',
        createdAt: conversation.created_at,
      },
      messages: transcriptMessages,
      guardrailEvents,
    };

    return NextResponse.json({
      data: transcriptData,
      error: null,
    });
  } catch (error) {
    console.error('Error in GET /api/ai-buddy/admin/audit-logs/[conversationId]/transcript:', error);
    return NextResponse.json(
      { data: null, error: { code: 'AIB_006', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
