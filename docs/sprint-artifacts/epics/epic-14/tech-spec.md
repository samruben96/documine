# Technical Specification: Epic 14 - AI Buddy Foundation

**Epic ID:** 14
**Epic Name:** AI Buddy Foundation
**Author:** Claude (AI-assisted)
**Date:** 2025-12-07
**Status:** Draft

---

## 1. Overview

### 1.1 Purpose

This technical specification defines the implementation details for **Epic 14: AI Buddy Foundation**, which establishes the foundational infrastructure for the AI Buddy feature module within docuMINE. This epic creates the database schema, API route structure, navigation integration, and component scaffolding that enables all subsequent AI Buddy epics.

### 1.2 PRD Alignment

**Functional Requirements Covered:** FR63 (AI Buddy accessible from main docuMINE dashboard)

**PRD Goals Addressed:**
- Enable AI Buddy as a first-class feature within docuMINE
- Establish secure, performant data layer with RLS policies
- Create consistent API patterns for all AI Buddy endpoints
- Integrate seamlessly with existing docuMINE navigation

### 1.3 Stories in Epic

| Story | Name | Description |
|-------|------|-------------|
| 14.1 | AI Buddy Database Schema | Create tables, indexes, and RLS policies |
| 14.2 | AI Buddy API Route Structure | Establish route structure and shared utilities |
| 14.3 | AI Buddy Navigation Integration | Add AI Buddy to main navigation |
| 14.4 | AI Buddy Page Layout Shell | Create ChatGPT-style dark layout |
| 14.5 | AI Buddy Component Scaffolding | Create component file structure with empty implementations |

### 1.4 User Value

This foundation epic enables all subsequent AI Buddy features to deliver value by establishing:
- Secure data storage for conversations, projects, and audit logs
- Consistent API patterns that future stories can follow
- Navigation entry point for users to access AI Buddy
- Visual foundation matching user expectations (ChatGPT-style)
- Component scaffolding that accelerates development

---

## 2. Scope

### 2.1 In-Scope

**Database Layer:**
- Create 8 new database tables for AI Buddy
- Add `ai_buddy_preferences` JSONB column to existing `users` table
- Implement RLS policies for all tables
- Create performance indexes

**API Layer:**
- Create API route directory structure
- Implement shared utilities (ai-client, guardrails, prompt-builder, audit-logger, rate-limiter)
- Define TypeScript interfaces for all entities
- Establish consistent error response format

**UI Layer:**
- Add "AI Buddy" to main navigation header
- Add AI Buddy to mobile bottom navigation
- Create AI Buddy page layout with dark theme
- Create component file scaffolding (empty implementations)
- Create React hooks scaffolding

**Integration:**
- Navigation integration with existing docuMINE header/sidebar
- Reuse existing Supabase Auth patterns
- Consistent styling with docuMINE design system (extended for dark theme)

### 2.2 Out-of-Scope

- Actual chat functionality (Epic 15 - AI Buddy Core Chat)
- Project CRUD operations (Epic 16 - AI Buddy Projects)
- Document upload and processing (Epic 17 - AI Buddy Document Intelligence)
- User preferences management (Epic 18 - AI Buddy Personalization)
- Guardrail configuration UI (Epic 19 - AI Buddy Guardrails)
- Admin panel and audit logs (Epic 20 - AI Buddy Admin & Audit)
- AI model integration (deferred to Epic 15)
- Streaming response implementation (deferred to Epic 15)

---

## 3. System Design

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        docuMINE Application                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Documents     │  │    Compare      │  │   AI Buddy      │ │
│  │   (existing)    │  │   (existing)    │  │   (NEW)         │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                    Shared Infrastructure                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ Supabase    │ │ shadcn/ui   │ │ Next.js     │ │ Tailwind  │ │
│  │ Auth + DB   │ │ Components  │ │ App Router  │ │ CSS       │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Module Responsibilities

| Module | Responsibility | Location |
|--------|---------------|----------|
| **Database Schema** | Store projects, conversations, messages, guardrails, audit logs | `supabase/migrations/` |
| **API Routes** | Handle HTTP requests, enforce auth, return JSON responses | `src/app/api/ai-buddy/` |
| **Shared Utilities** | AI client wrapper, guardrails, prompts, audit logging, rate limiting | `src/lib/ai-buddy/` |
| **Types** | TypeScript interfaces for all entities | `src/types/ai-buddy.ts` |
| **Components** | React components for chat, projects, documents, admin | `src/components/ai-buddy/` |
| **Hooks** | Data fetching and state management hooks | `src/hooks/ai-buddy/` |
| **Pages** | Next.js page components | `src/app/(dashboard)/ai-buddy/` |

### 3.3 Directory Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── ai-buddy/
│   │       ├── page.tsx              # Main AI Buddy page
│   │       └── layout.tsx            # Dark theme layout
│   └── api/
│       └── ai-buddy/
│           ├── chat/route.ts
│           ├── projects/route.ts
│           ├── conversations/route.ts
│           ├── preferences/route.ts
│           └── admin/
│               ├── guardrails/route.ts
│               ├── audit-logs/route.ts
│               └── users/route.ts
├── components/
│   └── ai-buddy/
│       ├── index.ts                  # Barrel export
│       ├── chat-message.tsx
│       ├── chat-message-list.tsx
│       ├── chat-input.tsx
│       ├── streaming-indicator.tsx
│       ├── source-citation.tsx
│       ├── confidence-badge.tsx
│       ├── project-sidebar.tsx
│       ├── project-card.tsx
│       ├── project-create-dialog.tsx
│       ├── chat-history-item.tsx
│       ├── document-panel.tsx
│       ├── document-card.tsx
│       ├── document-upload-zone.tsx
│       ├── guardrail-toggle.tsx
│       ├── topic-tag-list.tsx
│       ├── audit-log-table.tsx
│       ├── usage-stat-card.tsx
│       ├── onboarding-flow.tsx
│       ├── chip-select.tsx
│       └── progress-steps.tsx
├── hooks/
│   └── ai-buddy/
│       ├── use-chat.ts
│       ├── use-projects.ts
│       ├── use-preferences.ts
│       ├── use-guardrails.ts
│       └── use-audit-logs.ts
├── lib/
│   └── ai-buddy/
│       ├── ai-client.ts
│       ├── guardrails.ts
│       ├── prompt-builder.ts
│       ├── audit-logger.ts
│       └── rate-limiter.ts
└── types/
    └── ai-buddy.ts
```

---

## 4. Data Models

### 4.1 Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────────┐
│     agencies     │       │        users         │
│   (existing)     │       │     (existing)       │
├──────────────────┤       ├──────────────────────┤
│ id (PK)          │◄──┐   │ id (PK)              │
│ name             │   │   │ agency_id (FK)       │
│ ...              │   │   │ email                │
└──────────────────┘   │   │ ai_buddy_preferences │ ← NEW JSONB column
                       │   │ ...                  │
                       │   └──────────────────────┘
                       │              │
                       │              │
    ┌──────────────────┼──────────────┼──────────────────┐
    │                  │              │                  │
    ▼                  ▼              ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ ai_buddy_       │ │ ai_buddy_       │ │ ai_buddy_       │
│ projects        │ │ conversations   │ │ guardrails      │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ id (PK)         │ │ id (PK)         │ │ agency_id (PK)  │
│ agency_id (FK)  │ │ agency_id (FK)  │ │ restricted_     │
│ user_id (FK)    │ │ user_id (FK)    │ │   topics        │
│ name            │ │ project_id (FK) │ │ custom_rules    │
│ description     │ │ title           │ │ eando_disclaimer│
│ archived_at     │ │ deleted_at      │ │ ai_disclosure   │
│ created_at      │ │ created_at      │ │ enabled_rules   │
│ updated_at      │ │ updated_at      │ │ updated_at      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
        │                   │
        │                   │
        ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ ai_buddy_       │ │ ai_buddy_       │ │ ai_buddy_       │
│ project_        │ │ messages        │ │ audit_logs      │
│ documents       │ ├─────────────────┤ ├─────────────────┤
├─────────────────┤ │ id (PK)         │ │ id (PK)         │
│ project_id (FK) │ │ conversation_id │ │ agency_id (FK)  │
│ document_id(FK) │ │ agency_id (FK)  │ │ user_id (FK)    │
│ attached_at     │ │ role            │ │ conversation_id │
└─────────────────┘ │ content         │ │ action          │
                    │ sources         │ │ metadata        │
                    │ confidence      │ │ logged_at       │
                    │ created_at      │ └─────────────────┘
                    └─────────────────┘

┌─────────────────┐ ┌─────────────────┐
│ ai_buddy_       │ │ ai_buddy_       │
│ permissions     │ │ rate_limits     │
├─────────────────┤ ├─────────────────┤
│ id (PK)         │ │ tier (PK)       │
│ user_id (FK)    │ │ messages_per_   │
│ permission      │ │   minute        │
│ granted_by (FK) │ │ messages_per_   │
│ granted_at      │ │   day           │
└─────────────────┘ └─────────────────┘
```

### 4.2 Table Definitions

#### 4.2.1 ai_buddy_projects

```sql
CREATE TABLE ai_buddy_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_projects_user ON ai_buddy_projects(user_id)
  WHERE archived_at IS NULL;
CREATE INDEX idx_projects_agency ON ai_buddy_projects(agency_id);
```

#### 4.2.2 ai_buddy_project_documents

```sql
CREATE TABLE ai_buddy_project_documents (
  project_id UUID NOT NULL REFERENCES ai_buddy_projects(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  attached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, document_id)
);

-- Index
CREATE INDEX idx_project_docs_project ON ai_buddy_project_documents(project_id);
```

#### 4.2.3 ai_buddy_conversations

```sql
CREATE TABLE ai_buddy_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES ai_buddy_projects(id) ON DELETE SET NULL,
  title VARCHAR(100),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_conversations_user ON ai_buddy_conversations(user_id)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_conversations_project ON ai_buddy_conversations(project_id);
CREATE INDEX idx_conversations_updated ON ai_buddy_conversations(updated_at DESC);
```

#### 4.2.4 ai_buddy_messages

```sql
CREATE TYPE ai_buddy_message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE ai_buddy_confidence_level AS ENUM ('high', 'medium', 'low');

CREATE TABLE ai_buddy_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_buddy_conversations(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  role ai_buddy_message_role NOT NULL,
  content TEXT NOT NULL,
  sources JSONB,  -- Array of {documentId, page, text, startOffset?, endOffset?}
  confidence ai_buddy_confidence_level,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_messages_conversation ON ai_buddy_messages(conversation_id);
CREATE INDEX idx_messages_content_fts ON ai_buddy_messages
  USING GIN (to_tsvector('english', content));
```

#### 4.2.5 ai_buddy_guardrails

```sql
CREATE TABLE ai_buddy_guardrails (
  agency_id UUID PRIMARY KEY REFERENCES agencies(id) ON DELETE CASCADE,
  restricted_topics JSONB DEFAULT '[]'::jsonb,  -- [{trigger: string, redirect: string}]
  custom_rules JSONB DEFAULT '[]'::jsonb,
  eando_disclaimer BOOLEAN DEFAULT true,
  ai_disclosure_message TEXT DEFAULT 'You''re chatting with AI Buddy, an AI assistant. While I strive for accuracy, please verify important information.',
  ai_disclosure_enabled BOOLEAN DEFAULT true,
  restricted_topics_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 4.2.6 ai_buddy_permissions

```sql
CREATE TYPE ai_buddy_permission AS ENUM (
  'use_ai_buddy',
  'manage_own_projects',
  'manage_users',
  'configure_guardrails',
  'view_audit_logs'
);

CREATE TABLE ai_buddy_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission ai_buddy_permission NOT NULL,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission)
);

-- Index
CREATE INDEX idx_permissions_user ON ai_buddy_permissions(user_id);
```

#### 4.2.7 ai_buddy_audit_logs

```sql
CREATE TABLE ai_buddy_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES ai_buddy_conversations(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,  -- message_sent, guardrail_triggered, conversation_deleted, etc.
  metadata JSONB,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_audit_logs_agency_date ON ai_buddy_audit_logs(agency_id, logged_at DESC);
CREATE INDEX idx_audit_logs_user ON ai_buddy_audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON ai_buddy_audit_logs(action);
```

#### 4.2.8 ai_buddy_rate_limits

```sql
CREATE TABLE ai_buddy_rate_limits (
  tier VARCHAR(20) PRIMARY KEY,  -- 'free', 'pro', 'enterprise'
  messages_per_minute INT NOT NULL,
  messages_per_day INT NOT NULL
);

-- Default values
INSERT INTO ai_buddy_rate_limits (tier, messages_per_minute, messages_per_day) VALUES
  ('free', 10, 100),
  ('pro', 30, 500),
  ('enterprise', 60, 2000);
```

#### 4.2.9 Users Table Extension

```sql
ALTER TABLE users
ADD COLUMN ai_buddy_preferences JSONB DEFAULT '{}'::jsonb;

-- Schema for ai_buddy_preferences:
-- {
--   "displayName": string,
--   "role": "producer" | "csr" | "manager" | "other",
--   "linesOfBusiness": string[],
--   "favoriteCarriers": string[],
--   "communicationStyle": "professional" | "casual",
--   "agencyName": string,
--   "licensedStates": string[],
--   "onboardingCompleted": boolean
-- }
```

### 4.3 Row Level Security Policies

```sql
-- ai_buddy_projects: Users see only their own projects
ALTER TABLE ai_buddy_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON ai_buddy_projects
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own projects" ON ai_buddy_projects
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects" ON ai_buddy_projects
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own projects" ON ai_buddy_projects
  FOR DELETE USING (user_id = auth.uid());

-- ai_buddy_conversations: Users see only their own (non-deleted)
ALTER TABLE ai_buddy_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON ai_buddy_conversations
  FOR SELECT USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can insert own conversations" ON ai_buddy_conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations" ON ai_buddy_conversations
  FOR UPDATE USING (user_id = auth.uid());

-- ai_buddy_messages: Users see messages in their conversations
ALTER TABLE ai_buddy_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in own conversations" ON ai_buddy_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM ai_buddy_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own conversations" ON ai_buddy_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM ai_buddy_conversations WHERE user_id = auth.uid()
    )
  );

-- ai_buddy_guardrails: Admins can manage, users can read
ALTER TABLE ai_buddy_guardrails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view agency guardrails" ON ai_buddy_guardrails
  FOR SELECT USING (
    agency_id IN (
      SELECT agency_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can update agency guardrails" ON ai_buddy_guardrails
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM ai_buddy_permissions
      WHERE user_id = auth.uid()
      AND permission = 'configure_guardrails'
    )
  );

-- ai_buddy_audit_logs: Append-only, admins can read
ALTER TABLE ai_buddy_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can insert audit logs" ON ai_buddy_audit_logs
  FOR INSERT WITH CHECK (true);  -- Inserted via service role

CREATE POLICY "Admins can view agency audit logs" ON ai_buddy_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ai_buddy_permissions
      WHERE user_id = auth.uid()
      AND permission = 'view_audit_logs'
    )
    AND agency_id IN (
      SELECT agency_id FROM users WHERE id = auth.uid()
    )
  );

-- NO UPDATE OR DELETE policies for audit_logs (immutable)
```

---

## 5. API Interfaces

### 5.1 Response Format

All AI Buddy API endpoints follow this consistent response format:

```typescript
// Success response
{
  data: T,
  error: null
}

// Error response
{
  data: null,
  error: {
    code: string,      // AIB_XXX format
    message: string,
    details?: unknown
  }
}
```

### 5.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| AIB_001 | 401 | Unauthorized - not authenticated |
| AIB_002 | 403 | Forbidden - insufficient permissions |
| AIB_003 | 429 | Rate limit exceeded |
| AIB_004 | 400 | Invalid request body |
| AIB_005 | 404 | Resource not found |
| AIB_006 | 500 | Internal server error |
| AIB_007 | 503 | AI service unavailable |

### 5.3 Route Specifications

#### POST /api/ai-buddy/chat

Send a message and receive AI response (streaming).

**Request:**
```typescript
{
  conversationId?: string;  // Optional, creates new if not provided
  projectId?: string;       // Optional project context
  message: string;
  attachments?: {
    documentId: string;
    type: 'pdf' | 'image';
  }[];
}
```

**Response (SSE Stream):**
```
data: {"type":"chunk","content":"Based on..."}
data: {"type":"chunk","content":" the policy..."}
data: {"type":"sources","citations":[{"documentId":"...","page":3,"text":"..."}]}
data: {"type":"confidence","level":"high"}
data: {"type":"done","conversationId":"...","messageId":"..."}
```

#### GET/POST /api/ai-buddy/projects

**GET** - List user's projects
```typescript
// Response
{
  data: {
    projects: Project[];
    total: number;
  }
}
```

**POST** - Create project
```typescript
// Request
{
  name: string;
  description?: string;
}

// Response
{
  data: {
    project: Project;
  }
}
```

#### GET /api/ai-buddy/conversations

List user's conversations with optional filters.

```typescript
// Query params
?projectId=xxx        // Filter by project
&search=keyword       // Full-text search
&limit=20            // Pagination
&offset=0

// Response
{
  data: {
    conversations: Conversation[];
    total: number;
  }
}
```

#### GET/PATCH /api/ai-buddy/preferences

**GET** - Get user preferences
```typescript
{
  data: {
    preferences: UserPreferences;
  }
}
```

**PATCH** - Update preferences
```typescript
// Request (partial update)
{
  displayName?: string;
  linesOfBusiness?: string[];
  // ... any preference field
}
```

#### Admin Routes

##### GET/PATCH /api/ai-buddy/admin/guardrails

Admin only - manage agency guardrails.

##### GET /api/ai-buddy/admin/audit-logs

Admin only - view audit logs with filters.

```typescript
// Query params
?userId=xxx
&dateFrom=2024-01-01
&dateTo=2024-12-31
&action=guardrail_triggered
&search=keyword
&limit=25
&offset=0

// Response
{
  data: {
    logs: AuditLogEntry[];
    total: number;
  }
}
```

##### GET/POST/DELETE /api/ai-buddy/admin/users

Admin only - manage agency users.

---

## 6. TypeScript Interfaces

```typescript
// src/types/ai-buddy.ts

// ============ Entities ============

export interface Project {
  id: string;
  agencyId: string;
  userId: string;
  name: string;
  description: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  documentCount?: number;  // Computed field
}

export interface Conversation {
  id: string;
  agencyId: string;
  userId: string;
  projectId: string | null;
  title: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;   // Computed field
  project?: Project;       // Joined field
}

export type MessageRole = 'user' | 'assistant' | 'system';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface Citation {
  documentId: string;
  documentName: string;
  page: number;
  text: string;
  startOffset?: number;
  endOffset?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  agencyId: string;
  role: MessageRole;
  content: string;
  sources: Citation[] | null;
  confidence: ConfidenceLevel | null;
  createdAt: string;
}

export interface RestrictedTopic {
  trigger: string;
  redirect: string;
}

export interface GuardrailConfig {
  agencyId: string;
  restrictedTopics: RestrictedTopic[];
  customRules: string[];
  eandoDisclaimer: boolean;
  aiDisclosureMessage: string;
  aiDisclosureEnabled: boolean;
  restrictedTopicsEnabled: boolean;
  updatedAt: string;
}

export type Permission =
  | 'use_ai_buddy'
  | 'manage_own_projects'
  | 'manage_users'
  | 'configure_guardrails'
  | 'view_audit_logs';

export interface UserPermission {
  id: string;
  userId: string;
  permission: Permission;
  grantedBy: string | null;
  grantedAt: string;
}

export interface UserPreferences {
  displayName?: string;
  role?: 'producer' | 'csr' | 'manager' | 'other';
  linesOfBusiness?: string[];
  favoriteCarriers?: string[];
  communicationStyle?: 'professional' | 'casual';
  agencyName?: string;
  licensedStates?: string[];
  onboardingCompleted?: boolean;
}

export interface AuditLogEntry {
  id: string;
  agencyId: string;
  userId: string;
  conversationId: string | null;
  action: string;
  metadata: Record<string, unknown>;
  loggedAt: string;
  user?: {
    email: string;
    name: string;
  };
}

export interface RateLimit {
  tier: 'free' | 'pro' | 'enterprise';
  messagesPerMinute: number;
  messagesPerDay: number;
}

// ============ API Types ============

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// Chat API
export interface ChatRequest {
  conversationId?: string;
  projectId?: string;
  message: string;
  attachments?: {
    documentId: string;
    type: 'pdf' | 'image';
  }[];
}

export interface StreamChunk {
  type: 'chunk' | 'sources' | 'confidence' | 'done';
  content?: string;
  citations?: Citation[];
  level?: ConfidenceLevel;
  conversationId?: string;
  messageId?: string;
}

// Project API
export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
}

// Conversation API
export interface ConversationListParams {
  projectId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
}

// Admin API
export interface AuditLogParams {
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  action?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogResponse {
  logs: AuditLogEntry[];
  total: number;
}
```

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Metric | Target | Rationale |
|--------|--------|-----------|
| First response streaming | < 500ms | User perceives instant response |
| Project/conversation switch | < 200ms | Seamless context change |
| Search results | < 1s | Quick lookup |
| Page load | < 2s | LCP metric |
| Database query | < 100ms | p95 latency |

**Implementation Approach:**
- Use Edge Runtime for chat API route
- Indexes on all frequently queried columns
- React Query/SWR for client-side caching
- Optimistic UI updates

### 7.2 Security

| Requirement | Implementation |
|-------------|----------------|
| Authentication | Supabase Auth with JWT |
| Authorization | RLS policies + permission checks |
| Data isolation | agency_id scoping on all queries |
| Audit trail | Immutable audit_logs table |
| Input validation | Zod schemas on all API inputs |
| XSS prevention | React's built-in escaping |
| Rate limiting | Per-user limits based on tier |

### 7.3 Reliability

| Requirement | Implementation |
|-------------|----------------|
| Data durability | Supabase managed Postgres (99.9% SLA) |
| Error handling | Try-catch with structured error responses |
| Graceful degradation | Fallback states when AI unavailable |
| Transaction safety | Use Supabase transactions for multi-table ops |

### 7.4 Observability

| Aspect | Implementation |
|--------|----------------|
| Logging | Structured JSON logs to console (Vercel captures) |
| Errors | Error boundary components + Sentry (existing) |
| Performance | Web Vitals tracking (existing) |
| Usage | Audit log provides usage metrics |

---

## 8. Dependencies & Integrations

### 8.1 Internal Dependencies

| Dependency | Version | Usage |
|------------|---------|-------|
| Supabase Client | ^2.84.0 | Database, Auth, Realtime |
| Next.js | ^16.0.7 | App framework, API routes |
| shadcn/ui | Latest | UI components |
| Tailwind CSS | ^4 | Styling |
| Zod | ^4.1.13 | Schema validation |
| date-fns | ^4.1.0 | Date formatting |

### 8.2 External Dependencies (Future Epics)

| Dependency | Usage | Epic |
|------------|-------|------|
| OpenAI API | AI chat responses | Epic 15 |
| LlamaParse | Document processing | Epic 17 |

### 8.3 Integration Points

| System | Integration Type | Notes |
|--------|-----------------|-------|
| Supabase Auth | Existing | Reuse auth.uid() patterns |
| Documents table | Existing | FK relationship for project docs |
| Navigation | Existing | Add nav item to header/sidebar |
| Settings page | Existing | Add AI Buddy tab |

---

## 9. Acceptance Criteria Traceability

### Story 14.1: Database Schema

| AC ID | Acceptance Criteria | Spec Section | Component | Test |
|-------|---------------------|--------------|-----------|------|
| 14.1.1 | Tables created with correct schema | 4.2 | Migration | Schema test |
| 14.1.2 | RLS policies enforce user isolation | 4.3 | Migration | RLS test |
| 14.1.3 | Indexes created for performance | 4.2 | Migration | Query plan test |
| 14.1.4 | Audit logs are append-only | 4.3 | RLS policy | Permission test |
| 14.1.5 | Users table has ai_buddy_preferences | 4.2.9 | Migration | Schema test |

### Story 14.2: API Route Structure

| AC ID | Acceptance Criteria | Spec Section | Component | Test |
|-------|---------------------|--------------|-----------|------|
| 14.2.1 | Route structure matches spec | 3.3 | API routes | Route existence test |
| 14.2.2 | Shared utilities created | 3.3 | lib/ai-buddy | Import test |
| 14.2.3 | Types defined | 6 | types/ai-buddy.ts | TypeScript compilation |
| 14.2.4 | Consistent response format | 5.1 | All routes | API test |
| 14.2.5 | Error codes follow pattern | 5.2 | Error handler | Unit test |

### Story 14.3: Navigation Integration

| AC ID | Acceptance Criteria | Spec Section | Component | Test |
|-------|---------------------|--------------|-----------|------|
| 14.3.1 | AI Buddy in header nav | 3.2 | header.tsx | Visual test |
| 14.3.2 | Mobile bottom nav includes AI Buddy | 3.2 | sidebar.tsx | Visual test |
| 14.3.3 | Nav item highlights on /ai-buddy/* | 3.2 | Navigation | E2E test |
| 14.3.4 | Clicking navigates to /ai-buddy | 3.2 | Navigation | E2E test |

### Story 14.4: Page Layout Shell

| AC ID | Acceptance Criteria | Spec Section | Component | Test |
|-------|---------------------|--------------|-----------|------|
| 14.4.1 | Dark theme layout | Appendix A | layout.tsx | Visual test |
| 14.4.2 | Sidebar 260px with dark bg | Appendix A | Layout | CSS test |
| 14.4.3 | Main chat area with #212121 bg | Appendix A | Layout | CSS test |
| 14.4.4 | Responsive breakpoints | UX Design 8.1 | Layout | Responsive test |
| 14.4.5 | Empty state displayed | UX Design 7.2 | page.tsx | Visual test |

### Story 14.5: Component Scaffolding

| AC ID | Acceptance Criteria | Spec Section | Component | Test |
|-------|---------------------|--------------|-----------|------|
| 14.5.1 | All components exist | 3.3 | components/ai-buddy | File existence test |
| 14.5.2 | Barrel export works | 3.3 | index.ts | Import test |
| 14.5.3 | Hooks directory exists | 3.3 | hooks/ai-buddy | File existence test |
| 14.5.4 | Components export valid React | 3.3 | All components | Render test |

---

## 10. Risks & Assumptions

### 10.1 Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Dark theme conflicts with existing docuMINE styling | Medium | Low | Scope dark theme to /ai-buddy routes only |
| Database migration affects existing tables | High | Low | Test migration on staging first |
| Component naming conflicts | Low | Medium | Use ai-buddy prefix for all components |
| RLS policies too restrictive | Medium | Medium | Thorough testing with different user roles |

### 10.2 Assumptions

| Assumption | Validation |
|------------|------------|
| Users table has `agency_id` foreign key | Check existing schema |
| Documents table exists with compatible structure | Verify FK compatibility |
| Supabase supports all SQL features used | Test in dev environment |
| shadcn/ui components work with dark theme | Test with next-themes |

### 10.3 Open Questions

| Question | Decision Needed By | Owner |
|----------|-------------------|-------|
| Should rate limits be configurable per agency? | Story 14.1 | Product |
| Default permissions for new users? | Story 14.1 | Product |
| Archive vs delete behavior for projects? | Story 14.1 | Product |

---

## 11. Test Strategy

### 11.1 Unit Tests

**Database Schema (Story 14.1):**
- Migration applies without errors
- All tables created with correct columns and types
- Indexes exist and are used by query planner
- RLS policies block unauthorized access
- Audit logs reject UPDATE/DELETE operations

**API Routes (Story 14.2):**
- Route handlers return correct response format
- Error codes match specification
- Authentication required on all routes
- Input validation rejects invalid data

**Utilities (Story 14.2):**
- ai-client wrapper handles errors gracefully
- rate-limiter correctly calculates limits
- audit-logger creates valid log entries

### 11.2 Integration Tests

**Navigation (Story 14.3):**
- AI Buddy nav item visible when logged in
- Navigation to /ai-buddy works
- Active state shown on correct routes
- Mobile nav includes AI Buddy

**Page Layout (Story 14.4):**
- Dark theme renders correctly
- Layout responsive at all breakpoints
- No style conflicts with rest of app

### 11.3 E2E Tests

```typescript
// tests/e2e/ai-buddy-foundation.spec.ts

test.describe('AI Buddy Foundation', () => {
  test('navigation shows AI Buddy link', async ({ page }) => {
    await page.goto('/documents');
    await expect(page.getByRole('link', { name: 'AI Buddy' })).toBeVisible();
  });

  test('can navigate to AI Buddy page', async ({ page }) => {
    await page.goto('/documents');
    await page.click('text=AI Buddy');
    await expect(page).toHaveURL('/ai-buddy');
  });

  test('AI Buddy page shows dark theme', async ({ page }) => {
    await page.goto('/ai-buddy');
    const main = page.locator('main');
    await expect(main).toHaveCSS('background-color', 'rgb(33, 33, 33)');
  });

  test('empty state shows correct message', async ({ page }) => {
    await page.goto('/ai-buddy');
    await expect(page.getByText('Start a conversation')).toBeVisible();
  });
});
```

### 11.4 Test Coverage Requirements

| Area | Target Coverage |
|------|----------------|
| Database migrations | 100% (all tables, policies) |
| API routes | 80% line coverage |
| Utilities | 90% line coverage |
| Components | 70% (scaffolding only) |
| E2E | All critical paths |

---

## 12. Implementation Order

1. **Story 14.1: Database Schema** (Day 1)
   - Create migration file
   - Apply and test in dev
   - Verify RLS policies

2. **Story 14.2: API Route Structure** (Day 1-2)
   - Create directory structure
   - Implement shared utilities
   - Define TypeScript types

3. **Story 14.3: Navigation Integration** (Day 2)
   - Update header.tsx
   - Update mobile nav
   - Test navigation

4. **Story 14.4: Page Layout Shell** (Day 2-3)
   - Create layout.tsx with dark theme
   - Create page.tsx with empty state
   - Test responsiveness

5. **Story 14.5: Component Scaffolding** (Day 3)
   - Create all component files
   - Create barrel export
   - Create hooks directory

---

## Appendix A: CSS Variables for Dark Theme

```css
/* src/app/(dashboard)/ai-buddy/globals.css */

:root {
  --sidebar-bg: #171717;
  --sidebar-hover: #212121;
  --sidebar-active: #2d2d2d;
  --chat-bg: #212121;
  --chat-surface: #2d2d2d;
  --chat-border: #3d3d3d;
  --text-primary: #ececec;
  --text-muted: #8e8e8e;
  --ai-avatar: #10b981;
  --user-avatar: #3b82f6;
  --confidence-high-bg: rgba(16, 185, 129, 0.2);
  --confidence-high-text: #10b981;
  --confidence-medium-bg: rgba(245, 158, 11, 0.2);
  --confidence-medium-text: #f59e0b;
}
```

---

## Appendix B: Migration File Template

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_ai_buddy_foundation.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE ai_buddy_message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE ai_buddy_confidence_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE ai_buddy_permission AS ENUM (
  'use_ai_buddy',
  'manage_own_projects',
  'manage_users',
  'configure_guardrails',
  'view_audit_logs'
);

-- Create tables (see Section 4.2 for full definitions)
-- ...

-- Create RLS policies (see Section 4.3 for full definitions)
-- ...

-- Add column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS ai_buddy_preferences JSONB DEFAULT '{}'::jsonb;
```

---

**Document Version:** 1.0
**Last Updated:** 2025-12-07
**Status:** Ready for Review
