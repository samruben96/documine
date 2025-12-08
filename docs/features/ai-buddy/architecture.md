# AI Buddy - Architecture

**Feature Module:** AI Buddy (within docuMINE)
**Author:** Sam
**Date:** 2025-12-07
**Version:** 1.0

---

## Executive Summary

AI Buddy is a personalized AI assistant feature module within docuMINE, purpose-built for independent insurance agents. This architecture extends the existing docuMINE platform with conversational AI capabilities, project-based organization, invisible guardrails for compliance, and immutable audit logging for E&O protection.

**Key Architectural Decisions:**
- **AI Provider:** OpenRouter Claude Sonnet 4.5 (existing integration)
- **Data Model:** Projects → Conversations → Messages hierarchy
- **Guardrails:** Database-stored, system prompt injection (no carrier restrictions)
- **Audit:** Supabase append-only tables with 7-year retention
- **Permissions:** Flexible permission table for Producer/Admin/Owner roles

**Integration Approach:** AI Buddy extends docuMINE's existing Next.js 15 + Supabase + shadcn/ui stack. No new infrastructure required.

---

## Decision Summary

| Category | Decision | Version | Affects FRs | Rationale |
| -------- | -------- | ------- | ----------- | --------- |
| AI Provider | OpenRouter Claude Sonnet 4.5 | Latest | FR1-10 | Already integrated, superior instruction following for guardrails |
| Guardrail Enforcement | Database config + system prompt injection | N/A | FR35-41 | Invisible to users, admin-controlled, auditable |
| Audit Storage | Supabase PostgreSQL append-only | N/A | FR50-56 | Simple, RLS-compatible, 7-year retention capable |
| Project Data Model | Projects → Conversations → Messages | N/A | FR11-19 | Matches agent workflow (client accounts) |
| User Preferences | JSONB column on users table | N/A | FR26-32 | Flexible schema, no joins needed |
| Streaming | SSE via ReadableStream | N/A | FR2 | Reuse existing docuMINE pattern |
| Permissions | Separate permissions table | N/A | FR42-49 | Flexible for future granular permissions |
| Conversation Search | PostgreSQL full-text search | N/A | FR4 | Simple, sufficient for MVP |
| Audit Export | PDF and CSV | N/A | FR53 | PDF for regulators, CSV for analysis |
| Rate Limiting | Database config table | N/A | NFR | Adjustable without deploys |

---

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── ai-buddy/
│   │   │   ├── page.tsx                    # Main AI Buddy interface
│   │   │   ├── layout.tsx                  # AI Buddy layout (dark theme)
│   │   │   ├── [projectId]/
│   │   │   │   └── page.tsx                # Project-specific view
│   │   │   └── loading.tsx                 # Loading state
│   │   └── settings/
│   │       └── page.tsx                    # Add AI Buddy tab
│   └── api/
│       └── ai-buddy/
│           ├── chat/
│           │   └── route.ts                # POST - streaming chat
│           ├── projects/
│           │   └── route.ts                # CRUD for projects
│           ├── conversations/
│           │   └── route.ts                # CRUD for conversations
│           ├── preferences/
│           │   └── route.ts                # User preferences
│           └── admin/
│               ├── guardrails/
│               │   └── route.ts            # Guardrail config
│               ├── audit-logs/
│               │   └── route.ts            # Audit log queries
│               └── users/
│                   └── route.ts            # User management
│
├── components/
│   └── ai-buddy/
│       ├── chat/
│       │   ├── chat-message.tsx
│       │   ├── chat-message-list.tsx
│       │   ├── chat-input.tsx
│       │   ├── streaming-indicator.tsx
│       │   ├── source-citation.tsx
│       │   └── confidence-badge.tsx
│       ├── projects/
│       │   ├── project-sidebar.tsx
│       │   ├── project-card.tsx
│       │   ├── project-create-dialog.tsx
│       │   └── chat-history-item.tsx
│       ├── documents/
│       │   ├── document-panel.tsx
│       │   ├── document-card.tsx
│       │   └── document-upload-zone.tsx
│       ├── admin/
│       │   ├── guardrail-toggle.tsx
│       │   ├── topic-tag-list.tsx
│       │   ├── audit-log-table.tsx
│       │   └── usage-stat-card.tsx
│       └── onboarding/
│           ├── onboarding-flow.tsx
│           ├── chip-select.tsx
│           └── progress-steps.tsx
│
├── hooks/
│   └── ai-buddy/
│       ├── use-chat.ts
│       ├── use-projects.ts
│       ├── use-preferences.ts
│       ├── use-guardrails.ts
│       └── use-audit-logs.ts
│
├── lib/
│   └── ai-buddy/
│       ├── ai-client.ts                    # OpenRouter wrapper
│       ├── guardrails.ts                   # Guardrail enforcement
│       ├── prompt-builder.ts               # System prompt construction
│       ├── audit-logger.ts                 # Audit log helper
│       └── rate-limiter.ts                 # Rate limit checker
│
└── types/
    └── ai-buddy.ts                         # AI Buddy types
```

---

## FR Category to Architecture Mapping

| FR Category | Primary Location | Key Files |
|-------------|------------------|-----------|
| Chat & Conversation (FR1-10) | `api/ai-buddy/chat`, `components/ai-buddy/chat` | `chat-message.tsx`, `route.ts` |
| Projects & Workspaces (FR11-19) | `api/ai-buddy/projects`, `components/ai-buddy/projects` | `project-sidebar.tsx` |
| Document Management (FR20-25) | Existing + `components/ai-buddy/documents` | `document-panel.tsx` |
| Personalization (FR26-32) | `api/ai-buddy/preferences`, `hooks/use-preferences.ts` | `onboarding-flow.tsx` |
| Guardrails (FR35-41) | `api/ai-buddy/admin/guardrails`, `lib/ai-buddy/guardrails.ts` | `guardrail-toggle.tsx` |
| Admin Panel (FR42-49) | `api/ai-buddy/admin`, `components/ai-buddy/admin` | `audit-log-table.tsx` |
| Audit & Reporting (FR50-56) | `api/ai-buddy/admin/audit-logs`, `lib/ai-buddy/audit-logger.ts` | Database tables |
| Onboarding (FR57-62) | `components/ai-buddy/onboarding` | `onboarding-flow.tsx` |
| Integration (FR63-66) | Existing docuMINE patterns | Navigation, document hooks |

**Note:** FR33-34 (carrier restrictions) removed from AI Buddy scope - will be implemented in Quoting feature.

---

## Technology Stack Details

### Core Technologies

**Existing (Inherited from docuMINE):**
- Next.js 15 (App Router) - Server/Client components, API routes
- Supabase - PostgreSQL + pgvector, Auth, Storage, Edge Functions
- OpenRouter - Claude Sonnet 4.5 for AI responses
- shadcn/ui - Component library
- Tailwind CSS - Styling

**AI Buddy Specific:**
- OpenRouter Claude Sonnet 4.5 - Conversational AI with guardrail compliance
- PostgreSQL full-text search - Conversation search
- Upstash Redis - Rate limiting (existing)

### Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                     docuMINE (Existing)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Auth     │  │ Documents│  │ Storage  │  │ UI Components  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬────────┘  │
└───────┼─────────────┼─────────────┼────────────────┼────────────┘
        │             │             │                │
        ▼             ▼             ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AI Buddy (New)                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Projects │  │ Chat     │  │ Guardrails│  │ Audit Logs    │  │
│  │ Prefs    │  │ Stream   │  │ Prompts  │  │ Permissions   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────┐
│   OpenRouter    │
│  Claude 4.5     │
└─────────────────┘
```

---

## Novel Pattern: Invisible Guardrails

### Pattern Definition

AI Buddy enforces compliance guardrails **invisibly** - agents never see "blocked" messages, only helpful redirects. This is achieved through system prompt conditioning rather than post-processing filters.

### Guardrails Scope (AI Buddy)

| Guardrail Type | Included | Example |
|----------------|----------|---------|
| Restricted topics | ✅ | Legal advice, claims filing, binding authority |
| Custom agency rules | ✅ | Agency-specific restrictions |
| E&O protection | ✅ | Disclaimers, "consult your attorney" |
| AI disclosure | ✅ | State-specific chatbot disclosure |
| Carrier restrictions | ❌ | Moved to Quoting feature |

### Implementation

```typescript
// lib/ai-buddy/prompt-builder.ts
export function buildSystemPrompt(
  basePrompt: string,
  guardrails: AgencyGuardrails,
  userPreferences: UserPreferences
): string {
  let prompt = basePrompt;

  // Topic guardrails
  for (const topic of guardrails.restricted_topics) {
    prompt += `\n\nWhen "${topic.trigger}" comes up: ${topic.redirect_guidance}`;
  }

  // E&O protection
  if (guardrails.eando_disclaimer) {
    prompt += `\n\n## E&O Protection\nAlways note that coverage decisions require policy review. Include "verify with the carrier" for binding questions.`;
  }

  // Invisible guardrail instruction
  prompt += `\n\n## Response Style\nNever say "I cannot", "I'm not allowed", or "I'm restricted". Always provide helpful alternatives and frame guidance positively.`;

  return prompt;
}
```

### Audit Flow

```
User Message → Load Guardrails → Build Prompt → AI Response
                     ↓
              Log guardrail context
              (admin sees in audit log)
```

---

## Implementation Patterns

### Naming Conventions

| Entity | Convention | Example |
|--------|------------|---------|
| Database tables | snake_case, plural | `projects`, `audit_logs` |
| Database columns | snake_case | `created_at`, `agency_id` |
| API routes | kebab-case | `/api/ai-buddy/audit-logs` |
| React components | PascalCase | `ChatMessage`, `ProjectSidebar` |
| Component files | kebab-case | `chat-message.tsx` |
| Hooks | camelCase with `use` | `useChat`, `useProjects` |
| Types/Interfaces | PascalCase | `Project`, `AuditLogEntry` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_MESSAGE_LENGTH` |

### API Response Format

```typescript
// Success
{ data: T, error: null }

// Error
{ data: null, error: { code: string, message: string } }

// Streaming (SSE)
data: {"type":"chunk","content":"Hello..."}
data: {"type":"sources","citations":[...]}
data: {"type":"confidence","level":"high"}
data: {"type":"done"}
```

### Error Codes

```typescript
const AI_BUDDY_ERRORS = {
  AIB_001: 'Project not found',
  AIB_002: 'Conversation not found',
  AIB_003: 'Rate limit exceeded',
  AIB_004: 'AI provider error',
  AIB_005: 'Invalid attachment type',
  AIB_006: 'Guardrail configuration invalid',
  AIB_007: 'Insufficient permissions',
  AIB_008: 'Onboarding incomplete',
} as const;
```

### Hook Return Pattern

```typescript
interface UseProjectsReturn {
  data: Project[] | null;
  isLoading: boolean;
  error: Error | null;
  createProject: (input: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, input: UpdateProjectInput) => Promise<Project>;
  archiveProject: (id: string) => Promise<void>;
}
```

---

## Data Architecture

### New Tables

```sql
-- Projects (client account organization)
CREATE TABLE ai_buddy_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id),
  user_id uuid NOT NULL REFERENCES users(id),
  name text NOT NULL,
  description text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Project-Document junction
CREATE TABLE ai_buddy_project_documents (
  project_id uuid NOT NULL REFERENCES ai_buddy_projects(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  attached_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, document_id)
);

-- Conversations
CREATE TABLE ai_buddy_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id),
  user_id uuid NOT NULL REFERENCES users(id),
  project_id uuid REFERENCES ai_buddy_projects(id) ON DELETE SET NULL,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Messages
CREATE TABLE ai_buddy_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES ai_buddy_conversations(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES agencies(id),
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  sources jsonb,
  confidence text CHECK (confidence IN ('high', 'medium', 'low')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Guardrails (per agency)
CREATE TABLE ai_buddy_guardrails (
  agency_id uuid PRIMARY KEY REFERENCES agencies(id),
  restricted_topics jsonb NOT NULL DEFAULT '[]',
  custom_rules jsonb NOT NULL DEFAULT '[]',
  eando_disclaimer boolean NOT NULL DEFAULT true,
  ai_disclosure_message text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES users(id)
);

-- User permissions
CREATE TABLE ai_buddy_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission text NOT NULL,
  granted_by uuid REFERENCES users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission)
);

-- Audit logs (append-only)
CREATE TABLE ai_buddy_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id),
  user_id uuid NOT NULL REFERENCES users(id),
  conversation_id uuid REFERENCES ai_buddy_conversations(id),
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  logged_at timestamptz NOT NULL DEFAULT now()
);

-- Rate limits (configurable)
CREATE TABLE ai_buddy_rate_limits (
  tier text PRIMARY KEY,
  messages_per_minute int NOT NULL,
  messages_per_day int,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User preferences (add column to existing users table)
ALTER TABLE users ADD COLUMN ai_buddy_preferences jsonb DEFAULT '{
  "lines_of_business": [],
  "favorite_carriers": [],
  "communication_style": "professional",
  "onboarding_completed": false
}';
```

### Indexes

```sql
CREATE INDEX idx_projects_user ON ai_buddy_projects(user_id) WHERE archived_at IS NULL;
CREATE INDEX idx_conversations_project ON ai_buddy_conversations(project_id);
CREATE INDEX idx_conversations_user ON ai_buddy_conversations(user_id);
CREATE INDEX idx_messages_conversation ON ai_buddy_messages(conversation_id);
CREATE INDEX idx_audit_logs_agency_date ON ai_buddy_audit_logs(agency_id, logged_at DESC);
CREATE INDEX idx_audit_logs_user ON ai_buddy_audit_logs(user_id, logged_at DESC);

-- Full-text search on conversations
CREATE INDEX idx_messages_content_fts ON ai_buddy_messages
  USING gin(to_tsvector('english', content));
```

### RLS Policies

```sql
-- Enable RLS
ALTER TABLE ai_buddy_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_buddy_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_buddy_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_buddy_guardrails ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_buddy_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_buddy_audit_logs ENABLE ROW LEVEL SECURITY;

-- Projects: User sees own projects
CREATE POLICY "Users see own projects" ON ai_buddy_projects
  FOR ALL USING (user_id = auth.uid());

-- Conversations: User sees own conversations
CREATE POLICY "Users see own conversations" ON ai_buddy_conversations
  FOR ALL USING (user_id = auth.uid());

-- Messages: User sees messages in own conversations
CREATE POLICY "Users see own messages" ON ai_buddy_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM ai_buddy_conversations WHERE user_id = auth.uid()
    )
  );

-- Guardrails: Admins can manage, all can read
CREATE POLICY "Agency members read guardrails" ON ai_buddy_guardrails
  FOR SELECT USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins manage guardrails" ON ai_buddy_guardrails
  FOR ALL USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM ai_buddy_permissions
      WHERE user_id = auth.uid() AND permission = 'configure_guardrails'
    )
  );

-- Audit logs: Append-only, admin read
CREATE POLICY "Append audit logs" ON ai_buddy_audit_logs
  FOR INSERT WITH CHECK (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins read audit logs" ON ai_buddy_audit_logs
  FOR SELECT USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM ai_buddy_permissions
      WHERE user_id = auth.uid() AND permission = 'view_audit_logs'
    )
  );
```

---

## API Contracts

### Chat Endpoint

```typescript
// POST /api/ai-buddy/chat
// Request
{
  conversationId?: string;  // Continue existing or create new
  projectId?: string;       // Optional project context
  message: string;
  attachments?: string[];   // Document IDs
}

// Response: Server-Sent Events
data: {"type":"chunk","content":"Based on the policy..."}
data: {"type":"chunk","content":" the liability limit is..."}
data: {"type":"sources","citations":[{"documentId":"...","page":3,"text":"..."}]}
data: {"type":"confidence","level":"high"}
data: {"type":"done","conversationId":"...","messageId":"..."}
```

### Projects CRUD

```typescript
// GET /api/ai-buddy/projects
{ data: Project[], error: null }

// POST /api/ai-buddy/projects
// Request: { name: string, description?: string }
{ data: Project, error: null }

// PATCH /api/ai-buddy/projects/[id]
// Request: { name?: string, description?: string }
{ data: Project, error: null }

// DELETE /api/ai-buddy/projects/[id]
// Soft delete (sets archived_at)
{ data: { archived: true }, error: null }
```

### Admin Endpoints

```typescript
// GET /api/ai-buddy/admin/audit-logs
// Query: ?userId=...&startDate=...&endDate=...&search=...
{ data: AuditLogEntry[], error: null }

// GET /api/ai-buddy/admin/audit-logs/export
// Query: ?format=pdf|csv&...
// Response: File download

// GET /api/ai-buddy/admin/guardrails
{ data: GuardrailConfig, error: null }

// PATCH /api/ai-buddy/admin/guardrails
// Request: Partial<GuardrailConfig>
{ data: GuardrailConfig, error: null }
```

---

## Security Architecture

### Authentication

Inherits docuMINE authentication:
- Supabase Auth (email/password, Google OAuth)
- JWT in httpOnly cookies
- RLS policies use `auth.uid()`

### Authorization

```typescript
// Permission check helper
async function requirePermission(permission: string) {
  const { data, error } = await supabase
    .from('ai_buddy_permissions')
    .select('permission')
    .eq('user_id', user.id)
    .eq('permission', permission)
    .single();

  if (error || !data) {
    throw new AIBuddyError('Insufficient permissions', 'AIB_007', 403);
  }
}

// Default permissions by role
const DEFAULT_PERMISSIONS = {
  producer: ['use_ai_buddy', 'manage_own_projects'],
  admin: ['use_ai_buddy', 'manage_own_projects', 'manage_users',
          'configure_guardrails', 'view_audit_logs', 'view_usage_analytics'],
  owner: ['use_ai_buddy', 'manage_own_projects', 'manage_users',
          'configure_guardrails', 'view_audit_logs', 'view_usage_analytics',
          'manage_billing', 'transfer_ownership', 'delete_agency'],
};
```

### Audit Logging

```typescript
// All significant actions are logged
await auditLog({
  action: 'message_sent',
  metadata: {
    conversationId,
    messageLength: message.length,
    hasAttachments: attachments.length > 0,
    guardrailsApplied: appliedGuardrails,
  }
});
```

### Rate Limiting

```typescript
// Per-user rate limiting with database config
const limits = await getRateLimits(user.subscription_tier);
const result = await ratelimit.limit(`ai_buddy:${user.id}`, {
  rate: limits.messages_per_minute,
  window: '60s',
});

if (!result.success) {
  throw new AIBuddyError('Rate limit exceeded', 'AIB_003', 429);
}
```

---

## Performance Considerations

### Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| Chat streaming start | < 500ms | Edge runtime, OpenRouter streaming |
| Project switching | < 200ms | Client-side state, prefetching |
| Conversation search | < 1s | PostgreSQL full-text indexes |
| Document upload | < 30s | Existing processing pipeline |
| Audit log queries | < 2s | Indexed by agency_id + logged_at |

### Optimizations

- **Streaming:** SSE from Edge runtime for low TTFB
- **Caching:** React Query for projects/conversations
- **Prefetching:** Load adjacent conversations on project select
- **Pagination:** Cursor-based for messages and audit logs
- **Indexes:** Full-text search, composite indexes for common queries

---

## Deployment Architecture

AI Buddy deploys as part of docuMINE:

- **Frontend:** Vercel (existing)
- **API Routes:** Vercel Serverless + Edge
- **Database:** Supabase PostgreSQL (existing)
- **Storage:** Supabase Storage (existing)
- **AI Provider:** OpenRouter (existing)
- **Rate Limiting:** Upstash Redis (existing)

No new infrastructure required.

---

## Development Environment

### Prerequisites

- Node.js 20+
- pnpm (existing docuMINE setup)
- Supabase CLI (for migrations)
- OpenRouter API key

### Setup Commands

```bash
# From docuMINE root
pnpm install

# Run migrations for AI Buddy tables
pnpm supabase db push

# Seed rate limits
pnpm supabase db seed --file supabase/seeds/ai-buddy-rate-limits.sql

# Start dev server
pnpm dev
```

### Environment Variables

```bash
# Add to .env.local
OPENROUTER_API_KEY=...  # Already exists
# No new env vars required for AI Buddy
```

---

## Architecture Decision Records (ADRs)

### ADR-AIB-001: OpenRouter Claude for Chat

**Decision:** Use OpenRouter Claude Sonnet 4.5 for AI Buddy conversational AI.

**Context:** Need an AI provider for chat that follows guardrail instructions precisely.

**Options Considered:**
- OpenAI GPT-4 - Good but less instruction-following
- Anthropic Claude direct - Would need new integration
- OpenRouter Claude - Already integrated, superior instruction following

**Decision:** OpenRouter Claude. Reuses existing integration, Claude excels at following complex guardrail instructions invisibly.

### ADR-AIB-002: Invisible Guardrails via Prompt Injection

**Decision:** Enforce guardrails through system prompt conditioning, not post-processing.

**Context:** Agents should never see "blocked" messages - compliance must be invisible.

**Options Considered:**
- Post-processing filter - Rejects responses, user sees errors
- Prompt injection - AI naturally stays within bounds
- Hybrid - Both approaches

**Decision:** Prompt injection only. Claude follows instructions well enough that post-processing isn't needed. Simpler, better UX.

### ADR-AIB-003: Append-Only Audit Logs in Supabase

**Decision:** Store audit logs in Supabase PostgreSQL with append-only RLS policies.

**Context:** Insurance compliance requires 7-year retention and immutable logs.

**Options Considered:**
- Supabase PostgreSQL append-only - Simple, integrated
- Supabase + S3 archive - Cold storage for old logs
- Third-party audit service - Built for compliance

**Decision:** Supabase append-only for MVP. Scale is manageable, RLS provides isolation. Add archival later if needed.

### ADR-AIB-004: Separate Permissions Table

**Decision:** Use a separate `ai_buddy_permissions` table instead of role column.

**Context:** Need flexible permission model for Producer/Admin/Owner with future expansion.

**Options Considered:**
- Role column on users - Simple but inflexible
- Permissions table - Granular, expandable

**Decision:** Permissions table. Allows granting specific permissions (e.g., "senior producer can view team conversations") without role changes.

### ADR-AIB-005: No Carrier Restrictions in AI Buddy

**Decision:** Remove carrier restrictions from AI Buddy guardrails scope.

**Context:** User clarified that agents should discuss any carrier in AI Buddy.

**Rationale:** AI Buddy is for research/questions where agents need full carrier knowledge. Carrier restrictions will apply to the Quoting feature where actual quotes are generated.

---

## Related Documents

- [AI Buddy PRD](./prd.md)
- [AI Buddy UX Design](./ux-design/ux-design-specification.md)
- [docuMINE Architecture](../../architecture/index.md)

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-12-07_
_For: Sam_
