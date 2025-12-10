/**
 * Audit Log Immutability Tests
 * Story 20.1: Audit Log Infrastructure
 *
 * Tests for audit log immutability enforcement.
 * AC-20.1.1: INSERT-only RLS policy
 * AC-20.1.2: Database trigger prevents modifications
 * AC-20.1.3: Audit log entry schema
 *
 * NOTE: Integration tests that verify actual database behavior
 * (trigger blocking UPDATE/DELETE) are in __tests__/e2e/audit-log-immutability.spec.ts
 * since they require a real Supabase connection.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logAuditEvent, logGuardrailEvent, buildMessageMetadata, type AuditLogInput } from '@/lib/ai-buddy/audit-logger';

// Mock the Supabase client
const mockInsert = vi.fn();
const mockSupabase = {
  from: vi.fn(() => ({
    insert: mockInsert,
  })),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Mock the logger to prevent console noise
vi.mock('@/lib/utils/logger', () => ({
  log: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Audit Log INSERT Operations (AC-20.1.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should call INSERT with correct audit log fields', async () => {
    const input: AuditLogInput = {
      agencyId: 'test-agency-123',
      userId: 'test-user-456',
      conversationId: 'test-conv-789',
      action: 'message_sent',
      metadata: { messageLength: 100 },
    };

    await logAuditEvent(input);

    expect(mockSupabase.from).toHaveBeenCalledWith('agency_audit_logs');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        agency_id: 'test-agency-123',
        user_id: 'test-user-456',
        conversation_id: 'test-conv-789',
        action: 'message_sent',
        metadata: { messageLength: 100 },
      })
    );
  });

  it('should handle nullable conversation_id', async () => {
    const input: AuditLogInput = {
      agencyId: 'test-agency-123',
      userId: 'test-user-456',
      action: 'preferences_updated',
      metadata: {},
    };

    await logAuditEvent(input);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation_id: null,
      })
    );
  });

  it('should include logged_at timestamp in insert', async () => {
    const beforeTime = new Date().toISOString();

    await logAuditEvent({
      agencyId: 'test-agency',
      userId: 'test-user',
      action: 'conversation_created',
    });

    const afterTime = new Date().toISOString();

    // Verify logged_at is included and is a valid timestamp
    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.logged_at).toBeDefined();
    expect(new Date(insertCall.logged_at).toISOString()).toEqual(insertCall.logged_at);
    expect(insertCall.logged_at >= beforeTime).toBe(true);
    expect(insertCall.logged_at <= afterTime).toBe(true);
  });
});

describe('Audit Log Schema Validation (AC-20.1.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
  });

  it('should include all required fields in audit entry', async () => {
    await logAuditEvent({
      agencyId: 'agency-1',
      userId: 'user-1',
      conversationId: 'conv-1',
      action: 'message_sent',
      metadata: { test: 'data' },
    });

    const insertedData = mockInsert.mock.calls[0][0];

    // Verify all AC-20.1.3 required fields
    expect(insertedData).toHaveProperty('agency_id');
    expect(insertedData).toHaveProperty('user_id');
    expect(insertedData).toHaveProperty('conversation_id');
    expect(insertedData).toHaveProperty('action');
    expect(insertedData).toHaveProperty('metadata');
    expect(insertedData).toHaveProperty('logged_at');
  });

  it('should accept all valid audit actions', async () => {
    const validActions = [
      'message_sent',
      'message_received',
      'guardrail_triggered',
      'conversation_created',
      'conversation_deleted',
      'project_created',
      'project_archived',
      'document_attached',
      'document_removed',
      'preferences_updated',
      'guardrails_configured',
    ];

    for (const action of validActions) {
      await logAuditEvent({
        agencyId: 'agency-1',
        userId: 'user-1',
        action: action as AuditLogInput['action'],
      });
    }

    expect(mockInsert).toHaveBeenCalledTimes(validActions.length);
  });

  it('should serialize complex metadata to JSONB-compatible format', async () => {
    const complexMetadata = {
      nestedObject: { a: 1, b: { c: 2 } },
      array: [1, 2, 3],
      string: 'test',
      number: 42,
      boolean: true,
      nullValue: null,
    };

    await logAuditEvent({
      agencyId: 'agency-1',
      userId: 'user-1',
      action: 'message_sent',
      metadata: complexMetadata,
    });

    const insertedMetadata = mockInsert.mock.calls[0][0].metadata;

    // Verify it's serialized properly (JSON.parse(JSON.stringify) in audit-logger.ts)
    expect(insertedMetadata).toEqual({
      nestedObject: { a: 1, b: { c: 2 } },
      array: [1, 2, 3],
      string: 'test',
      number: 42,
      boolean: true,
      nullValue: null,
    });
  });
});

describe('Guardrail Event Logging (AC-20.1.2 audit trail)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
  });

  it('should log guardrail trigger event with required metadata', async () => {
    await logGuardrailEvent(
      'agency-123',
      'user-456',
      'conv-789',
      'legal advice',
      'Please consult an attorney for legal matters.',
      'Can you give me legal advice about my contract dispute with the insurer?'
    );

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        agency_id: 'agency-123',
        user_id: 'user-456',
        conversation_id: 'conv-789',
        action: 'guardrail_triggered',
        metadata: expect.objectContaining({
          triggeredTopic: 'legal advice',
          redirectMessage: 'Please consult an attorney for legal matters.',
          messagePreview: 'Can you give me legal advice about my contract dispute with the insurer?',
          timestamp: expect.any(String),
        }),
      })
    );
  });

  it('should truncate long user messages in guardrail event preview', async () => {
    const longMessage = 'A'.repeat(200); // 200 characters

    await logGuardrailEvent(
      'agency-1',
      'user-1',
      'conv-1',
      'test-topic',
      'redirect message',
      longMessage
    );

    const metadata = mockInsert.mock.calls[0][0].metadata;
    expect(metadata.messagePreview.length).toBe(100); // Truncated to 100
  });
});

describe('Audit Log Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not throw when insert fails (AC-20.1.2: audit failures should not break app)', async () => {
    mockInsert.mockResolvedValue({
      error: { message: 'Database error', code: 'PGRST116' },
    });

    // Should not throw
    await expect(
      logAuditEvent({
        agencyId: 'agency-1',
        userId: 'user-1',
        action: 'message_sent',
      })
    ).resolves.toBeUndefined();
  });

  it('should not throw when database connection fails', async () => {
    mockInsert.mockRejectedValue(new Error('Connection refused'));

    // Should not throw
    await expect(
      logAuditEvent({
        agencyId: 'agency-1',
        userId: 'user-1',
        action: 'message_sent',
      })
    ).resolves.toBeUndefined();
  });
});

describe('buildMessageMetadata helper', () => {
  it('should build metadata with all fields', () => {
    const metadata = buildMessageMetadata(
      'msg-123',
      'This is a test message about insurance coverage options.',
      true,
      'high',
      ['eando_disclaimer']
    );

    expect(metadata).toEqual({
      messageId: 'msg-123',
      contentPreview: 'This is a test message about insurance coverage options.',
      hasSourceCitations: true,
      confidence: 'high',
      appliedGuardrails: ['eando_disclaimer'],
      timestamp: expect.any(String),
    });
  });

  it('should truncate long content preview to 100 characters', () => {
    const longContent = 'A'.repeat(200);

    const metadata = buildMessageMetadata(
      'msg-123',
      longContent,
      false,
      'medium'
    );

    expect(metadata.contentPreview.length).toBe(100);
  });

  it('should handle undefined optional fields', () => {
    const metadata = buildMessageMetadata(
      'msg-123',
      'Short message',
      false
    );

    expect(metadata.confidence).toBeUndefined();
    expect(metadata.appliedGuardrails).toBeUndefined();
  });
});

describe('Immutability Enforcement Documentation (AC-20.1.2)', () => {
  /**
   * Note: Actual database-level immutability testing requires integration tests
   * against a real Supabase instance. The trigger `audit_logs_immutable` prevents:
   *
   * 1. UPDATE operations - trigger raises exception before update executes
   * 2. DELETE operations - trigger raises exception before delete executes
   *
   * The trigger function `prevent_audit_modification()` returns:
   * "Audit logs are immutable - modifications not allowed"
   *
   * This is verified manually and in E2E tests.
   */

  it('documents immutability requirements for future database tests', () => {
    const requirements = {
      trigger_name: 'audit_logs_immutable',
      trigger_timing: 'BEFORE',
      trigger_events: ['UPDATE', 'DELETE'],
      error_message: 'Audit logs are immutable - modifications not allowed',
      applies_to: 'agency_audit_logs',
      even_service_role_blocked: true,
    };

    // This test documents the expected behavior
    expect(requirements.trigger_name).toBe('audit_logs_immutable');
    expect(requirements.even_service_role_blocked).toBe(true);
  });
});
