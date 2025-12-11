# Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

## API Response Format

All API responses follow this structure:

```typescript
// Success response
{
  data: T;
  error: null;
}

// Error response
{
  data: null;
  error: {
    code: string;      // e.g., "DOCUMENT_NOT_FOUND"
    message: string;   // Human-readable message
    details?: unknown; // Additional context
  };
}
```

## Streaming Response Format

For chat endpoints, use Server-Sent Events:

```typescript
// Stream format
data: {"type": "text", "content": "The liability"}
data: {"type": "text", "content": " limit is"}
data: {"type": "text", "content": " $1,000,000"}
data: {"type": "source", "content": {"page": 3, "text": "..."}}
data: {"type": "confidence", "content": "high"}
data: [DONE]
```

## Database Query Pattern

Always include agency_id in queries (RLS enforces this, but be explicit):

```typescript
// Good - explicit agency filter
const { data } = await supabase
  .from('documents')
  .select('*')
  .eq('agency_id', user.agency_id)
  .eq('id', documentId);

// RLS policy ensures this anyway, but explicit is better for clarity
```

## File Upload Pattern

```typescript
// 1. Upload to Supabase Storage
const { data: file } = await supabase.storage
  .from('documents')
  .upload(`${agencyId}/${documentId}/${filename}`, fileBuffer);

// 2. Create database record
const { data: document } = await supabase
  .from('documents')
  .insert({
    id: documentId,
    agency_id: agencyId,
    filename,
    storage_path: file.path,
    status: 'processing'
  });

// 3. Trigger processing (Edge Function picks up)
await supabase
  .from('processing_jobs')
  .insert({ document_id: documentId });
```

## RLS Service Client Pattern (Verify-Then-Service)

**Problem:** Supabase RLS UPDATE/DELETE policies can fail with 403 errors in Edge Runtime, even when the user is authenticated and `auth.uid()` should match. This occurs because Edge Runtime's cookie-based auth doesn't always propagate correctly to Supabase for mutating operations.

**Solution:** The "Verify-Then-Service" pattern:
1. **Verify ownership** using a SELECT query (RLS works correctly for SELECT)
2. **Perform mutation** using the service client (bypasses RLS, but safe since ownership is verified)

```typescript
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function DELETE(request: NextRequest, { params }) {
  const { id } = await params;

  // Get authenticated user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Step 1: VERIFY OWNERSHIP via SELECT (RLS works here)
  const { data: resource, error: fetchError } = await supabase
    .from('my_table')
    .select('id, user_id')
    .eq('id', id)
    .eq('user_id', user.id)  // Explicit ownership check
    .single();

  if (fetchError || !resource) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  // Step 2: PERFORM MUTATION with service client (bypasses RLS)
  // Safe because ownership was verified above
  const serviceClient = createServiceClient();
  const { error: deleteError } = await serviceClient
    .from('my_table')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);  // Still include user_id for safety

  if (deleteError) {
    return Response.json({ error: 'Delete failed' }, { status: 500 });
  }

  return Response.json({ deleted: true });
}
```

### When to Use This Pattern

| Operation | Use Pattern? | Notes |
|-----------|--------------|-------|
| SELECT | No | RLS works correctly |
| INSERT | No | RLS works correctly |
| UPDATE | **Yes** | Use verify-then-service |
| DELETE | **Yes** | Use verify-then-service |

### Key Points

1. **Always verify first** - Never skip the SELECT verification step
2. **Include user_id in both queries** - Belt and suspenders for safety
3. **Log operations** - Audit trail for service client mutations
4. **Service client uses `SUPABASE_SERVICE_ROLE_KEY`** - Keep this secret secure

### Reference Implementation

See `src/app/api/ai-buddy/conversations/[id]/route.ts` for the production implementation of this pattern.

### Why Not Fix RLS Policies?

The issue appears to be in how Next.js Edge Runtime handles cookie propagation to Supabase's auth layer for mutating operations. This is a known limitation. The verify-then-service pattern is the recommended workaround until Supabase/Next.js resolve the underlying issue.

**Discovered:** Epic 15, Story 15.4 (Conversation Persistence)
**Documented:** 2025-12-07

## Audit Logging Pattern (Write with Service, Read with RLS)

**Problem:** Audit logs need to be written by any authenticated user (tracking their actions) but only read by admins. RLS policies typically only allow SELECT for admins, blocking INSERT operations from regular users.

**Solution:** Use service client for writes (bypass RLS) and regular client for reads (respect RLS).

```typescript
import { createClient, createServiceClient } from '@/lib/supabase/server';

// ✅ Writing audit logs - service client (any user can create)
export async function logAuditEvent(input: AuditLogInput): Promise<void> {
  // Service client bypasses RLS - allows INSERT without admin permission
  const supabase = createServiceClient();

  await supabase.from('agency_audit_logs').insert({
    agency_id: input.agencyId,
    user_id: input.userId,
    action: input.action,
    metadata: input.metadata,
    logged_at: new Date().toISOString(),
  });
}

// ✅ Reading audit logs - regular client (admin-only via RLS)
export async function queryAuditLogs(agencyId: string): Promise<AuditLogEntry[]> {
  // Regular client respects RLS - only admins can SELECT
  const supabase = await createClient();

  const { data } = await supabase
    .from('agency_audit_logs')
    .select('*')
    .eq('agency_id', agencyId)
    .order('logged_at', { ascending: false });

  return data ?? [];
}
```

### Why This Is Safe

1. **Audit logs are append-only** - No data exposure risk from INSERT
2. **User context is captured** - `userId` and `agencyId` are required inputs
3. **Read access controlled by RLS** - Query functions respect admin-only SELECT policy
4. **Service client never used for reads** - Sensitive data protected

### When to Use This Pattern

| Operation | Client | Reason |
|-----------|--------|--------|
| INSERT audit log | Service | Any user creates their own audit entries |
| SELECT audit logs | Regular | Admin-only viewing via RLS |
| UPDATE/DELETE | Never | Audit logs are immutable |

### Reference Implementation

See `src/lib/admin/audit-logger.ts` for the production implementation.

**Discovered:** Epic 23, Story 23.4 (Reporting Audit Logging)
**Documented:** 2025-12-10

## SSE Streaming Pattern for AI Responses

**Use case:** Streaming AI responses to the client with low latency, including structured metadata (sources, confidence levels).

### Server-Side Pattern (API Route)

```typescript
// Use Edge Runtime for low latency (sub-500ms TTFB)
export const runtime = 'edge';

/**
 * SSE Event types - define your event structure
 */
interface SSEEvent {
  type: 'chunk' | 'sources' | 'confidence' | 'done' | 'error';
  content?: string;
  citations?: Citation[];
  level?: 'high' | 'medium' | 'low';
  conversationId?: string;
  messageId?: string;
  error?: string;
  code?: string;
}

/**
 * Format event for SSE transmission
 * Format: "data: {json}\n\n"
 */
function formatSSEEvent(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: Request): Promise<Response> {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // Initialize AI client
        const completion = await openai.chat.completions.create({
          model: 'claude-sonnet-4-20250514',
          messages: llmMessages,
          stream: true,
        });

        let fullResponse = '';

        // Stream chunks as they arrive
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            fullResponse += content;
            controller.enqueue(
              encoder.encode(formatSSEEvent({ type: 'chunk', content }))
            );
          }
        }

        // Emit metadata after streaming completes
        controller.enqueue(
          encoder.encode(formatSSEEvent({ type: 'sources', citations }))
        );
        controller.enqueue(
          encoder.encode(formatSSEEvent({ type: 'confidence', level: 'high' }))
        );

        // Emit done event with IDs
        controller.enqueue(
          encoder.encode(formatSSEEvent({
            type: 'done',
            conversationId,
            messageId,
          }))
        );

        controller.close();
      } catch (error) {
        // Emit error event - client can handle gracefully
        controller.enqueue(
          encoder.encode(formatSSEEvent({
            type: 'error',
            error: 'AI provider error',
            code: 'AIB_004',
          }))
        );
        controller.close();
      }
    },
  });

  // Return SSE response with required headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Client-Side Pattern (React Hook)

```typescript
async function consumeSSEStream(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';  // Buffer for incomplete lines

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Decode chunk and add to buffer
    buffer += decoder.decode(value, { stream: true });

    // Split on newlines, keep incomplete line in buffer
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      // SSE data lines start with "data: "
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (!data || data === '[DONE]') continue;

        try {
          const event: SSEEvent = JSON.parse(data);

          switch (event.type) {
            case 'chunk':
              // Append to streaming content
              setStreamingContent(prev => prev + event.content);
              break;

            case 'sources':
              setCitations(event.citations ?? []);
              break;

            case 'confidence':
              setConfidence(event.level ?? null);
              break;

            case 'done':
              // Finalize message with IDs from server
              finalizeMessage(event.conversationId, event.messageId);
              break;

            case 'error':
              throw new Error(event.error);
          }
        } catch (parseError) {
          console.warn('Failed to parse SSE event:', data);
        }
      }
    }
  }
}
```

### Request Cancellation

```typescript
// Store abort controller in ref
const abortControllerRef = useRef<AbortController | null>(null);

async function sendMessage(content: string) {
  // Cancel any existing request
  abortControllerRef.current?.abort();
  abortControllerRef.current = new AbortController();

  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message: content }),
    signal: abortControllerRef.current.signal,
  });

  // ... consume stream
}

// Cleanup on unmount
useEffect(() => {
  return () => abortControllerRef.current?.abort();
}, []);
```

### SSE Event Types

| Event Type | Purpose | Payload |
|------------|---------|---------|
| `chunk` | Streaming text content | `{ content: string }` |
| `sources` | Citation metadata | `{ citations: Citation[] }` |
| `confidence` | Response confidence level | `{ level: 'high' \| 'medium' \| 'low' }` |
| `done` | Stream complete | `{ conversationId, messageId }` |
| `error` | Error occurred | `{ error: string, code: string }` |

### Key Points

1. **Edge Runtime required** - Vercel Edge provides sub-500ms TTFB
2. **TextEncoder/TextDecoder** - Convert between strings and Uint8Array
3. **Buffer management** - SSE lines can be split across chunks
4. **AbortController** - Essential for cancellation and cleanup
5. **Error events** - Stream errors as events, don't throw mid-stream
6. **Metadata after content** - Sources/confidence after text chunks

### Performance Targets

| Metric | Target | How to Achieve |
|--------|--------|----------------|
| Time to first token | < 500ms | Edge Runtime, streaming |
| Perceived latency | Immediate | Optimistic UI updates |
| Memory usage | Stable | Process chunks, don't buffer full response |

### Reference Implementation

- **Server:** `src/app/api/ai-buddy/chat/route.ts`
- **Client:** `src/hooks/ai-buddy/use-chat.ts`

**Established:** Epic 15, Story 15.3 (Streaming Chat API)
**Documented:** 2025-12-07

## PostgreSQL JSONB Type Casting Pattern

**Problem:** TypeScript types generated by Supabase CLI (`src/types/database.types.ts`) define a `Json` type for JSONB columns. When writing typed objects to these columns or reading them back, TypeScript requires explicit type casting to maintain type safety while working with the flexible `Json` type.

### The Json Type

```typescript
// From src/types/database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
```

### Standard Pattern: `as unknown as Json`

**Writing to JSONB columns:**
```typescript
import type { Json } from '@/types/database.types';

// When inserting/updating JSONB columns, cast through `unknown`
const { error } = await supabase
  .from('ai_buddy_guardrails')
  .upsert({
    agency_id: agencyId,
    restricted_topics: restrictedTopics as unknown as Json,
    custom_rules: customRules as unknown as Json,
  });
```

**Reading from JSONB columns:**
```typescript
// When reading, cast from `unknown` to your typed interface
const rawTopics = data.restricted_topics as unknown[];
const topics: MyTopicType[] = rawTopics.map((t) => {
  const topic = t as Record<string, unknown>;
  return {
    id: topic.id as string,
    name: topic.name as string,
    // ... map other fields
  };
});
```

### Why `as unknown as Json`?

Direct casting (`value as Json`) can fail TypeScript's type checker because the types aren't directly compatible. Using `unknown` as an intermediate:
1. Tells TypeScript to "forget" the original type
2. Allows casting to the target type
3. Is the recommended pattern for complex type conversions

### Defensive Mapping Pattern

For reading JSONB data, use defensive mapping to handle:
- Missing fields (backwards compatibility)
- Type mismatches (data migration)
- Null values

```typescript
// Example: Reading guardrails with format migration
function mapDbToGuardrails(data: unknown): GuardrailConfig {
  const raw = data as Record<string, unknown>;

  // Handle both old and new format
  const topics = (raw.restricted_topics as unknown[])?.map((t) => {
    const topic = t as Record<string, unknown>;

    // Support old format {redirect} and new format {redirectGuidance}
    return {
      trigger: (topic.trigger as string) || '',
      redirect: (topic.redirectGuidance as string)
        || (topic.redirect as string)
        || '',
      enabled: topic.enabled !== false, // Default to true
    };
  }) ?? [];

  return { topics, /* ... */ };
}
```

### RPC Function Type Casting

For Supabase RPC functions (like vector search), use broader type assertions:

```typescript
// Cast the entire RPC call for proper typing
const { data, error } = await (supabase.rpc as unknown as (
  fn: string,
  args: {
    query_embedding: number[];
    match_count: number;
    similarity_threshold: number;
  }
) => Promise<{ data: SearchResult[] | null; error: PostgrestError | null }>)(
  'hybrid_search_document_chunks',
  {
    query_embedding: embedding,
    match_count: 10,
    similarity_threshold: 0.7,
  }
);
```

### Common Use Cases

| Use Case | Pattern | Example Location |
|----------|---------|------------------|
| Guardrails config | Write: `as unknown as Json` | `src/app/api/ai-buddy/admin/guardrails/route.ts` |
| User preferences | Write: `as unknown as Json` | `src/app/api/ai-buddy/preferences/route.ts` |
| Extraction data | Write/Read with mapping | `src/lib/compare/extraction.ts` |
| Vector search | RPC type assertion | `src/lib/chat/vector-search.ts` |

### Anti-Patterns to Avoid

```typescript
// ❌ Direct cast - may fail TypeScript checks
restricted_topics: restrictedTopics as Json,

// ❌ Any type - loses all type safety
restricted_topics: restrictedTopics as any,

// ✅ Correct - cast through unknown
restricted_topics: restrictedTopics as unknown as Json,
```

### Key Points

1. **Always use `as unknown as Json`** for writing typed objects to JSONB columns
2. **Use defensive mapping** when reading JSONB data to handle format variations
3. **Provide defaults** for optional/missing fields during mapping
4. **Support format migration** by checking for both old and new field names
5. **Import `Json` type** from `@/types/database.types`

**Discovered:** Epic 14-16 (AI Buddy development)
**Documented:** 2025-12-08
