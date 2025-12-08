# Epic Technical Specification: AI Buddy Projects

Date: 2025-12-07
Author: Sam
Epic ID: 16
Status: Draft

---

## Overview

Epic 16 implements **Projects** - the organizational backbone of AI Buddy that enables users to group conversations and documents by client accounts. Unlike ChatGPT's flat conversation history, AI Buddy organizes work by Projects, matching how insurance agents naturally think about their business (by client/account).

This epic builds on the foundation established in Epic 14 (database schema, API routes, navigation) and Epic 15 (core chat functionality). Projects add persistent document context, conversation organization, and search capabilities - transforming AI Buddy from a simple chatbot into a structured work management tool for insurance agents.

**Key Value Proposition:** Agents can create a "Johnson Family" project, attach all their policy documents, and have multiple conversations about that client - with AI Buddy always having context of the attached documents.

## Objectives and Scope

### In-Scope

**Project Management (FR11, FR12, FR17):**
- Create new Projects with name and optional description
- Rename and archive Projects
- Switch between Projects via sidebar navigation

**Project Context (FR13-16):**
- Conversations within a Project have automatic access to all attached project documents
- Project header shows current context ("AI Buddy · Johnson Family")
- Context switching is immediate (< 200ms per UX spec)

**Conversation Organization (FR3, FR4, FR6):**
- View conversation history organized by date and Project
- Search across all conversations by keyword (PostgreSQL full-text)
- Delete individual conversations (soft delete for audit compliance)

**Flexible Workflows (FR18, FR19):**
- Start general conversations outside any Project
- Move existing conversations into Projects after creation

### Out-of-Scope

- Document upload to Projects (Epic 17: Document Intelligence)
- Removing documents from Projects (Epic 17)
- Project-level document preview (Epic 17)
- Cross-project document sharing
- Project templates or cloning
- Project sharing between users

## System Architecture Alignment

### Architecture Components Referenced

| Component | Usage in Epic 16 |
|-----------|------------------|
| `ai_buddy_projects` table | Primary storage for project metadata |
| `ai_buddy_conversations` table | Links conversations to projects via `project_id` FK |
| `ai_buddy_messages` table | Full-text search index for conversation search |
| `/api/ai-buddy/projects` | CRUD operations for projects |
| `/api/ai-buddy/conversations` | CRUD + search operations for conversations |
| `use-projects.ts` hook | Client-side project management |
| `project-sidebar.tsx` | Project list and navigation UI |

### Key Architecture Constraints

1. **RLS Policies:** Users see only their own projects and conversations (`user_id = auth.uid()`)
2. **Soft Delete Pattern:** Projects use `archived_at`, conversations use `deleted_at` for audit compliance
3. **Verify-Then-Service Pattern:** UPDATE/DELETE operations use service client after ownership verification (per Epic 15 pattern)
4. **Full-Text Search:** PostgreSQL `tsvector` with GIN index for conversation search (no external search service)
5. **Context Persistence:** React Query caching for instant project switching

## Detailed Design

### Services and Modules

#### New Files to Create

**API Routes:**
```
src/app/api/ai-buddy/projects/
├── route.ts                    # GET (list), POST (create)
└── [id]/
    └── route.ts                # GET (single), PATCH (update), DELETE (archive)

src/app/api/ai-buddy/conversations/
└── route.ts                    # Add search parameter to existing route
```

**UI Components:**
```
src/components/ai-buddy/
├── project-sidebar.tsx         # Left sidebar with project list
├── project-card.tsx            # Single project item in sidebar
├── project-create-dialog.tsx   # Create project modal
├── chat-history-item.tsx       # Conversation item in sidebar
├── conversation-search.tsx     # Search dialog (Cmd+K)
└── project-context-header.tsx  # "AI Buddy · Project Name" header
```

**Hooks:**
```
src/hooks/ai-buddy/
├── use-projects.ts             # Project CRUD operations
├── use-active-project.ts       # Current project context
└── use-conversation-search.ts  # Full-text search
```

**Library Functions:**
```
src/lib/ai-buddy/
└── project-service.ts          # Server-side project operations
```

#### Dependencies on Existing Code

- `src/lib/ai-buddy/conversation-service.ts` - Extend for project association
- `src/hooks/ai-buddy/use-conversations.ts` - Add project filtering
- `src/components/ai-buddy/chat-panel.tsx` - Add project context header
- `src/app/(dashboard)/ai-buddy/page.tsx` - Integrate project sidebar

### Data Models and Contracts

#### Database Tables (from Epic 14 migration)

**ai_buddy_projects**
```sql
CREATE TABLE ai_buddy_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_projects_user ON ai_buddy_projects(user_id) WHERE archived_at IS NULL;
CREATE INDEX idx_projects_agency ON ai_buddy_projects(agency_id) WHERE archived_at IS NULL;

-- RLS
ALTER TABLE ai_buddy_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own projects" ON ai_buddy_projects
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own projects" ON ai_buddy_projects
  FOR INSERT WITH CHECK (user_id = auth.uid());
-- UPDATE/DELETE via service role after ownership verification
```

**ai_buddy_conversations (additions)**
```sql
-- Add to existing table
ALTER TABLE ai_buddy_conversations ADD COLUMN project_id UUID REFERENCES ai_buddy_projects(id);
ALTER TABLE ai_buddy_conversations ADD COLUMN deleted_at TIMESTAMPTZ;

-- Index for project filtering
CREATE INDEX idx_conversations_project ON ai_buddy_conversations(project_id) WHERE deleted_at IS NULL;
```

**ai_buddy_messages (full-text search)**
```sql
-- Add full-text search column
ALTER TABLE ai_buddy_messages ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

CREATE INDEX idx_messages_fts ON ai_buddy_messages USING GIN(search_vector);
```

#### TypeScript Interfaces

```typescript
// src/types/ai-buddy.ts

export interface Project {
  id: string;
  userId: string;
  agencyId?: string;
  name: string;
  description?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields from joins
  documentCount?: number;
  conversationCount?: number;
}

export interface ProjectCreateInput {
  name: string;
  description?: string;
}

export interface ProjectUpdateInput {
  name?: string;
  description?: string;
}

export interface ConversationSearchResult {
  conversationId: string;
  conversationTitle: string;
  projectId?: string;
  projectName?: string;
  matchedText: string;
  messageId: string;
  createdAt: string;
}

export interface ConversationGroup {
  label: string;  // "Today", "Yesterday", "Previous 7 days", "Older"
  conversations: Conversation[];
}
```

### APIs and Interfaces

#### Projects API

**GET /api/ai-buddy/projects**
```typescript
// Query params
interface ProjectsListQuery {
  includeArchived?: boolean;
  sortBy?: 'name' | 'updated_at' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

// Response
interface ProjectsListResponse {
  data: Project[];
  error: null;
}
```

**POST /api/ai-buddy/projects**
```typescript
// Request
interface CreateProjectRequest {
  name: string;          // Required, max 100 chars
  description?: string;  // Optional, max 500 chars
}

// Response
interface CreateProjectResponse {
  data: Project;
  error: null;
}

// Errors
// AIB_101: Name is required
// AIB_102: Name exceeds 100 characters
// AIB_103: Description exceeds 500 characters
```

**PATCH /api/ai-buddy/projects/[id]**
```typescript
// Request
interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

// Response: Same as Create

// Errors
// AIB_104: Project not found
// AIB_105: Not authorized to modify this project
```

**DELETE /api/ai-buddy/projects/[id]**
```typescript
// Sets archived_at, does not hard delete
// Response
interface DeleteProjectResponse {
  data: { success: true };
  error: null;
}

// Errors
// AIB_104: Project not found
// AIB_105: Not authorized to delete this project
```

#### Conversations API (Extensions)

**GET /api/ai-buddy/conversations**
```typescript
// Extended query params
interface ConversationsListQuery {
  projectId?: string;        // Filter by project (null = general chats)
  search?: string;           // Full-text search query
  limit?: number;            // Default 50
  cursor?: string;           // Pagination cursor
}

// Search response
interface ConversationSearchResponse {
  data: ConversationSearchResult[];
  nextCursor?: string;
  error: null;
}
```

**PATCH /api/ai-buddy/conversations/[id]**
```typescript
// Request - move to project
interface MoveConversationRequest {
  projectId: string | null;  // null = move to general
}

// Response: Updated conversation

// Errors
// AIB_201: Conversation not found
// AIB_202: Not authorized to modify this conversation
// AIB_203: Target project not found
```

**DELETE /api/ai-buddy/conversations/[id]**
```typescript
// Soft delete - sets deleted_at
// Response
interface DeleteConversationResponse {
  data: { success: true };
  error: null;
}
```

### Workflows and Sequencing

#### Sequence Diagram: Create Project

```
User         UI              API                    Database
 │           │               │                         │
 │ Click     │               │                         │
 │ "New      │               │                         │
 │ Project"  │               │                         │
 │──────────>│               │                         │
 │           │ Show Dialog   │                         │
 │           │<──────────────│                         │
 │           │               │                         │
 │ Enter     │               │                         │
 │ Name      │               │                         │
 │──────────>│               │                         │
 │           │ POST /projects│                         │
 │           │──────────────>│                         │
 │           │               │ Validate input          │
 │           │               │ INSERT project          │
 │           │               │────────────────────────>│
 │           │               │<────────────────────────│
 │           │   201 Created │                         │
 │           │<──────────────│                         │
 │           │ Close Dialog  │                         │
 │           │ Update sidebar│                         │
 │           │ Select project│                         │
 │<──────────│               │                         │
```

#### Sequence Diagram: Project Context Switch

```
User         UI              API                    ChatAPI
 │           │               │                         │
 │ Click     │               │                         │
 │ Project B │               │                         │
 │──────────>│               │                         │
 │           │ Update state  │                         │
 │           │ (React Query) │                         │
 │           │               │                         │
 │           │ Load project  │                         │
 │           │ conversations │                         │
 │           │──────────────>│                         │
 │           │<──────────────│                         │
 │           │ Update header │                         │
 │           │ "AI Buddy ·   │                         │
 │           │  Project B"   │                         │
 │<──────────│               │                         │
 │           │               │                         │
 │ Send msg  │               │                         │
 │──────────>│               │                         │
 │           │ POST /chat    │                         │
 │           │ {projectId:B} │                         │
 │           │─────────────────────────────────────────>│
 │           │               │ Load Project B documents│
 │           │               │ Include in RAG context  │
 │           │<─────────────────────────────────────────│
```

#### Sequence Diagram: Conversation Search

```
User         UI              API                    Database
 │           │               │                         │
 │ Cmd+K     │               │                         │
 │──────────>│               │                         │
 │           │ Open search   │                         │
 │           │ dialog        │                         │
 │<──────────│               │                         │
 │           │               │                         │
 │ Type      │               │                         │
 │ "liability│               │                         │
 │  limits"  │               │                         │
 │──────────>│               │                         │
 │           │ Debounce 300ms│                         │
 │           │               │                         │
 │           │ GET /conversations?search=... │         │
 │           │──────────────>│                         │
 │           │               │ ts_rank(fts, query)     │
 │           │               │────────────────────────>│
 │           │               │<────────────────────────│
 │           │   Results     │                         │
 │           │<──────────────│                         │
 │           │ Display       │                         │
 │           │ results with  │                         │
 │           │ highlights    │                         │
 │<──────────│               │                         │
```

## Non-Functional Requirements

### Performance

| Metric | Target | Implementation |
|--------|--------|----------------|
| Project switch | < 200ms | React Query cache, prefetch conversations |
| Project list load | < 500ms | Index on `user_id WHERE archived_at IS NULL` |
| Conversation search | < 1s | PostgreSQL GIN index on `tsvector` |
| Create project | < 1s | Single INSERT, optimistic update |
| Sidebar render | < 100ms | Virtualization for >50 projects |

**Optimizations:**
- Prefetch project conversations on hover (staleTime: 5min)
- Cache project list with React Query (staleTime: 2min)
- Lazy load conversation history (first 20, then load more)
- Debounce search input (300ms)

### Security

| Concern | Mitigation |
|---------|------------|
| Unauthorized project access | RLS policies enforce `user_id = auth.uid()` |
| Cross-user search | Search API filters by authenticated user only |
| Project enumeration | UUIDs prevent sequential ID guessing |
| Input validation | Server-side validation of all inputs |
| Soft delete bypass | RLS hides `deleted_at IS NOT NULL` records |

**RLS Pattern:**
```sql
-- User can only see their own non-deleted conversations
CREATE POLICY "Users see own conversations" ON ai_buddy_conversations
  FOR SELECT USING (user_id = auth.uid() AND deleted_at IS NULL);
```

### Reliability/Availability

| Component | Strategy |
|-----------|----------|
| Project create | Optimistic UI with rollback on error |
| Conversation delete | Soft delete, recoverable by support |
| Search | Graceful degradation if FTS fails |
| Sidebar state | Persisted in localStorage, restored on reload |

**Error Handling:**
- Project API errors show toast with retry option
- Search errors show "Search unavailable, try again later"
- Network failure preserves local state, syncs on reconnect

### Observability

| Event | Data Captured |
|-------|---------------|
| Project created | `{ projectId, userId, name }` |
| Project archived | `{ projectId, userId }` |
| Context switch | `{ fromProjectId, toProjectId, userId }` |
| Search executed | `{ query, resultCount, latencyMs }` |
| Conversation deleted | `{ conversationId, projectId, userId }` |

**Monitoring:**
- Track project creation/archival rates
- Monitor search latency percentiles (p50, p95, p99)
- Alert on search error rate > 1%

## Dependencies and Integrations

### Internal Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Epic 14: AI Buddy Foundation | Hard | ✅ Complete | Database schema, API structure |
| Epic 15: Core Chat | Hard | ✅ Complete | Conversations, messages, chat API |
| Supabase Auth | Existing | ✅ Available | User authentication, `auth.uid()` |
| React Query | Existing | ✅ Available | State management, caching |
| shadcn/ui | Existing | ✅ Available | Dialog, Sheet, Command components |

### External Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `@tanstack/react-query` | ^5.x | Project/conversation state management |
| `@radix-ui/react-dialog` | via shadcn | Create project dialog |
| `cmdk` | via shadcn | Search dialog (Cmd+K) |
| `date-fns` | ^3.x | Conversation date grouping |

### Database Schema Dependencies

**Migration Order:**
1. `20241207_create_ai_buddy_projects` (new table)
2. `20241207_add_conversations_project_id` (FK to projects)
3. `20241207_add_messages_fts` (full-text search column + index)
4. `20241207_add_conversations_deleted_at` (soft delete support)

### Integration Points

| System | Integration | Direction |
|--------|-------------|-----------|
| Chat API | Pass `projectId` to load document context | Epic 16 → Chat |
| Document Service | Query project documents for RAG | Chat → Documents |
| Audit Logger | Log project operations | Epic 16 → Audit |
| Analytics | Track project usage metrics | Epic 16 → Analytics |

## Acceptance Criteria (Authoritative)

### Story 16.1: Project Creation & Sidebar (FR11, FR17)

*Merged from original stories 16.1 + 16.2*

| AC ID | Acceptance Criteria | Test Type |
|-------|---------------------|-----------|
| AC-16.1.1 | Clicking "New Project" opens a dialog with name (required) and description (optional) fields | E2E |
| AC-16.1.2 | Name is required and limited to 100 characters | Unit |
| AC-16.1.3 | Description is optional and limited to 500 characters | Unit |
| AC-16.1.4 | Clicking "Create" creates the project and selects it as active | Integration |
| AC-16.1.5 | New project appears in sidebar immediately (optimistic update) | E2E |
| AC-16.1.6 | Validation error "Project name is required" shown if name empty | Unit |
| AC-16.1.7 | API returns AIB_102 if name exceeds 100 characters | API |
| AC-16.1.8 | Sidebar shows "Projects" section with all active (non-archived) projects | E2E |
| AC-16.1.9 | Each project card shows name (truncated at 25 chars) and document count badge | Unit |
| AC-16.1.10 | Active project has visual indicator (highlight, different background) | E2E |
| AC-16.1.11 | Clicking a project switches to that project's context | E2E |
| AC-16.1.12 | Projects sorted alphabetically by name | Unit |
| AC-16.1.13 | Empty state shown when no projects exist: "Create your first project" | E2E |
| AC-16.1.14 | Mobile: Sidebar rendered in Sheet overlay | E2E |

### Story 16.2: Project Context Switching (FR16)

| AC ID | Acceptance Criteria | Test Type |
|-------|---------------------|-----------|
| AC-16.2.1 | Header shows "AI Buddy · [Project Name]" when project selected | E2E |
| AC-16.2.2 | Header shows "AI Buddy" when no project selected | E2E |
| AC-16.2.3 | Chat API receives `projectId` parameter for project conversations | Integration |
| AC-16.2.4 | Context switch completes in < 200ms (perceived) | Performance |
| AC-16.2.5 | Conversations in project automatically have document context | Integration |
| AC-16.2.6 | Switching projects loads that project's conversation history | E2E |

### Story 16.3: Project Management - Rename & Archive (FR12)

| AC ID | Acceptance Criteria | Test Type |
|-------|---------------------|-----------|
| AC-16.3.1 | Right-click on project shows context menu with "Rename" and "Archive" options | E2E |
| AC-16.3.2 | Selecting "Rename" enables inline editing of project name | E2E |
| AC-16.3.3 | Enter saves renamed project, Escape cancels edit | Unit |
| AC-16.3.4 | Archive shows confirmation dialog "Archive [Project Name]?" | E2E |
| AC-16.3.5 | Confirming archive sets `archived_at` and removes from main list | Integration |
| AC-16.3.6 | "View Archived" link shows archived projects with restore option | E2E |
| AC-16.3.7 | Restoring project clears `archived_at` and returns to main list | Integration |

### Story 16.4: Conversation History & General Chat (FR3, FR18)

*Merged from original stories 16.5 + 16.8*

| AC ID | Acceptance Criteria | Test Type |
|-------|---------------------|-----------|
| AC-16.4.1 | Sidebar "Recent" section shows conversations grouped by date | E2E |
| AC-16.4.2 | Date groups: Today, Yesterday, Previous 7 days, Older | Unit |
| AC-16.4.3 | Each conversation shows title (first message excerpt), project name, timestamp | Unit |
| AC-16.4.4 | Clicking conversation loads it in chat area | E2E |
| AC-16.4.5 | When project selected, only that project's conversations shown | Integration |
| AC-16.4.6 | Maximum 50 conversations loaded, with "Load more" pagination | E2E |
| AC-16.4.7 | "New Chat" starts conversation without project association | E2E |
| AC-16.4.8 | Header shows "AI Buddy" without project name for general chats | E2E |
| AC-16.4.9 | General conversations appear in "Recent" but not under any project | E2E |
| AC-16.4.10 | General conversations can have in-conversation document attachments | Integration |
| AC-16.4.11 | `project_id` is NULL for general conversations | Integration |

### Story 16.5: Conversation Search (FR4)

| AC ID | Acceptance Criteria | Test Type |
|-------|---------------------|-----------|
| AC-16.5.1 | Cmd/Ctrl+K opens search dialog | E2E |
| AC-16.5.2 | Typing query searches across all user's conversations | Integration |
| AC-16.5.3 | Results show conversation title, matched text snippet (highlighted), project name, date | E2E |
| AC-16.5.4 | Clicking result opens that conversation | E2E |
| AC-16.5.5 | Search results return within 1 second | Performance |
| AC-16.5.6 | No results shows "No conversations found for '[query]'" | E2E |
| AC-16.5.7 | Search uses PostgreSQL full-text search (`tsvector`, `ts_rank`) | Integration |

### Story 16.6: Conversation Management - Delete & Move (FR6, FR19)

*Merged from original stories 16.7 + 16.9*

| AC ID | Acceptance Criteria | Test Type |
|-------|---------------------|-----------|
| AC-16.6.1 | Conversation menu includes "Delete" and "Move to Project" options | E2E |
| AC-16.6.2 | Delete shows confirmation dialog "Delete this conversation?" | E2E |
| AC-16.6.3 | Confirming delete sets `deleted_at` (soft delete) | Integration |
| AC-16.6.4 | Deleted conversation no longer visible to user | E2E |
| AC-16.6.5 | Audit log records deletion event with `conversation_deleted` action | Integration |
| AC-16.6.6 | After delete, user returned to AI Buddy home or project view | E2E |
| AC-16.6.7 | Clicking "Move to Project" shows list of user's projects | E2E |
| AC-16.6.8 | Selecting project updates conversation's `project_id` | Integration |
| AC-16.6.9 | Moved conversation appears in target project's history | E2E |
| AC-16.6.10 | Toast shows "Moved to [Project Name]" confirmation | E2E |
| AC-16.6.11 | Future messages in moved conversation get project document context | Integration |
| AC-16.6.12 | Can move from project to "No Project" (general chat) | E2E |

## Traceability Mapping

### FR to Story Mapping

| FR ID | FR Description | Story | AC Coverage |
|-------|---------------|-------|-------------|
| FR3 | View conversation history organized by date and Project | 16.4 | AC-16.4.1 - AC-16.4.6 |
| FR4 | Search across all conversations by keyword | 16.5 | AC-16.5.1 - AC-16.5.7 |
| FR6 | Delete individual conversations from history | 16.6 | AC-16.6.1 - AC-16.6.6 |
| FR11 | Create new Projects with name and optional description | 16.1 | AC-16.1.1 - AC-16.1.7 |
| FR12 | Rename and archive Projects | 16.3 | AC-16.3.1 - AC-16.3.7 |
| FR13 | Attach documents to Projects for persistent context | Epic 17 | - |
| FR14 | Remove documents from Projects | Epic 17 | - |
| FR15 | View all documents attached to a Project | Epic 17 | - |
| FR16 | Conversations within Project have document context | 16.2 | AC-16.2.3, AC-16.2.5 |
| FR17 | Switch between Projects via sidebar navigation | 16.1 | AC-16.1.8 - AC-16.1.14 |
| FR18 | Start conversation outside any Project (general chat) | 16.4 | AC-16.4.7 - AC-16.4.11 |
| FR19 | Move conversation into a Project after creation | 16.6 | AC-16.6.7 - AC-16.6.12 |

### Story to Component Mapping

| Story | Key Components | Key Files |
|-------|----------------|-----------|
| 16.1 | ProjectCreateDialog, ProjectSidebar, ProjectCard | `project-create-dialog.tsx`, `project-sidebar.tsx`, `project-card.tsx`, `/api/ai-buddy/projects/route.ts`, `use-projects.ts` |
| 16.2 | ProjectContextHeader, ChatPanel | `project-context-header.tsx`, `chat-panel.tsx`, `use-active-project.ts` |
| 16.3 | ContextMenu (rename/archive) | `project-card.tsx` (context menu), `/api/ai-buddy/projects/[id]/route.ts` |
| 16.4 | ChatHistoryItem | `chat-history-item.tsx`, `use-conversations.ts` |
| 16.5 | ConversationSearch | `conversation-search.tsx`, `use-conversation-search.ts` |
| 16.6 | ConversationMenu (delete/move) | `/api/ai-buddy/conversations/[id]/route.ts`, conversation menu extension |

### UX Design Reference

| UX Section | Stories Implementing |
|------------|---------------------|
| 3.1 ChatGPT-Style Interface | 16.1, 16.2, 16.4 |
| Pattern 1: Projects as Organizational Units | 16.1, 16.2 |
| 5.1 Critical User Paths - Starting a Conversation | 16.4, 16.6 |
| 7.2 Interaction Patterns - Project Switching | 16.1, 16.2 |
| Keyboard Shortcuts (Cmd+K) | 16.5 |

### Architecture Decision Reference

| ADR | Decision | Stories Affected |
|-----|----------|------------------|
| ADR-001 | Supabase for database | All (RLS policies) |
| ADR-002 | PostgreSQL FTS over external search | 16.5 |
| ADR-003 | Soft delete for audit compliance | 16.3, 16.6 |
| ADR-004 | React Query for client state | 16.1, 16.2, 16.4 |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Full-text search performance degrades with scale | Medium | Medium | GIN index optimized for FTS; monitor query times; consider pg_trgm fallback |
| Users create too many projects, making navigation cumbersome | Low | Low | Add "Favorites" feature in future; alphabetical sort helps |
| Project context switching causes perceived latency | Medium | High | React Query prefetching; optimistic updates; target < 200ms |
| RLS policy misconfiguration exposes data | Low | Critical | Comprehensive integration tests; security review before merge |

### Assumptions

| Assumption | Impact if Wrong | Validation |
|------------|-----------------|------------|
| Epic 14/15 database schema supports FK for `project_id` | Blocks implementation | Verify schema before starting |
| Users will have < 100 projects on average | Performance may degrade | Monitor project counts in production |
| PostgreSQL FTS is sufficient for conversation search | May need external search service | Load test with realistic data volume |
| React Query v5 caching is adequate for project state | May need different state management | Evaluate during implementation |
| Soft delete pattern meets audit compliance needs | May need hard delete fallback | Confirm with compliance requirements |

### Open Questions

| Question | Owner | Status | Resolution |
|----------|-------|--------|------------|
| Should projects have a "color" or "icon" for visual distinction? | Sam | Open | Decide during UX refinement |
| Maximum number of projects per user? | Product | Open | Propose: No limit initially, add if needed |
| Should archived projects be permanently deleted after N days? | Product | Open | Recommend: Keep indefinitely for compliance |
| How to handle moving conversation with document attachments? | Engineering | Open | Propose: Documents stay with conversation, not moved to project |
| Should search include archived projects? | Product | Open | Propose: No by default, with toggle option |

### Technical Debt Considerations

| Item | Rationale | When to Address |
|------|-----------|-----------------|
| No project-level permissions | Single-user projects for MVP | Epic 20+ (multi-user features) |
| No project cloning/templates | Not in FRs | Consider for v2 |
| Manual conversation grouping | Using date-fns in client | Consider server-side grouping if slow |
| Inline edit for rename | Simpler for MVP | Could use dialog for consistency |

## Test Strategy Summary

### Unit Tests

**Location:** `__tests__/components/ai-buddy/`, `__tests__/lib/ai-buddy/`

| Component/Module | Test Focus |
|------------------|------------|
| `project-card.tsx` | Name truncation, document count display, active state |
| `chat-history-item.tsx` | Date formatting, relative time display |
| `use-projects.ts` | CRUD operations, optimistic updates, error handling |
| `use-conversation-search.ts` | Debouncing, query building, result parsing |
| Project validation | Name length, description length, required fields |
| Date grouping logic | Today/Yesterday/Previous 7 days/Older classification |

**Coverage Target:** 80%

### Integration Tests

**Location:** `__tests__/api/ai-buddy/`

| API Endpoint | Test Cases |
|--------------|------------|
| `POST /api/ai-buddy/projects` | Create success, validation errors, auth required |
| `PATCH /api/ai-buddy/projects/[id]` | Update name, update description, not found, unauthorized |
| `DELETE /api/ai-buddy/projects/[id]` | Archive success, not found, unauthorized |
| `GET /api/ai-buddy/conversations?search=` | FTS query, empty results, result ranking |
| `PATCH /api/ai-buddy/conversations/[id]` | Move to project, move to general, invalid project |
| `DELETE /api/ai-buddy/conversations/[id]` | Soft delete, audit log created |

**Database Tests:**
- RLS policies prevent cross-user access
- Soft delete hides records from queries
- FTS index returns ranked results

### E2E Tests

**Location:** `__tests__/e2e/ai-buddy/`

| Test Suite | Stories Covered | Scenarios |
|------------|-----------------|-----------|
| `projects.spec.ts` | 16.1, 16.2, 16.3 | Create project, sidebar display, context switching, rename, archive |
| `conversations.spec.ts` | 16.4, 16.6 | View history, general chat, delete, move to project |
| `search.spec.ts` | 16.5 | Cmd+K search, results display, navigation |

**Key E2E Scenarios:**
```typescript
describe('AI Buddy Projects', () => {
  it('creates a new project and selects it', async () => {
    // Click New Project
    // Enter name "Johnson Family"
    // Click Create
    // Assert project in sidebar
    // Assert header shows "AI Buddy · Johnson Family"
  });

  it('searches conversations by keyword', async () => {
    // Cmd+K
    // Type "liability"
    // Assert results appear
    // Click result
    // Assert conversation loads
  });

  it('moves conversation from general to project', async () => {
    // Start general chat
    // Open menu, click "Move to Project"
    // Select project
    // Assert toast confirmation
    // Assert conversation in project history
  });
});
```

### Performance Tests

| Metric | Test Approach | Target |
|--------|---------------|--------|
| Project switch latency | Measure time from click to header update | < 200ms |
| Search query latency | API response time with 1000+ messages | < 1s |
| Sidebar render time | React DevTools profiler | < 100ms |

### Security Tests

| Test | Expected Behavior |
|------|-------------------|
| Access other user's project via API | 404 Not Found (not 403 to prevent enumeration) |
| Search returns only own conversations | Results filtered by `user_id = auth.uid()` |
| Soft-deleted conversations not in search | `deleted_at IS NULL` filter applied |
| Direct DB query bypasses RLS | Not possible with Supabase client |

### Test Data Requirements

```typescript
// Fixtures
const testUser = { id: 'test-user-1', email: 'test@example.com' };
const testProjects = [
  { name: 'Johnson Family', description: 'Personal auto client' },
  { name: 'Acme Corp', description: 'Commercial client' },
  { name: 'Smith Manufacturing', description: null },
];
const testConversations = [
  { title: 'Coverage limits question', projectId: 'project-1', messages: 5 },
  { title: 'Quote comparison', projectId: 'project-1', messages: 3 },
  { title: 'General inquiry', projectId: null, messages: 2 },
];
```

---

## Implementation Notes

### Story Execution Order (6 Stories)

| Order | Story | Name | Reason |
|-------|-------|------|--------|
| 1 | 16.1 | Project Creation & Sidebar | Foundation - creates projects, displays in sidebar |
| 2 | 16.2 | Project Context Switching | Depends on 16.1 - context switching between projects |
| 3 | 16.4 | Conversation History & General Chat | Can start after 16.1 - conversation display |
| 4 | 16.3 | Project Management | Depends on 16.1 - rename/archive projects |
| 5 | 16.5 | Conversation Search | Depends on 16.4 - search over conversations |
| 6 | 16.6 | Conversation Management | Depends on 16.1, 16.4 - delete/move conversations |

**Parallelization Opportunities:**
- 16.3 and 16.4 can run in parallel (different concerns)
- 16.5 and 16.6 can run in parallel after 16.4 completes

### Migration Checklist

- [ ] Create `ai_buddy_projects` table
- [ ] Add `project_id` FK to `ai_buddy_conversations`
- [ ] Add `deleted_at` to `ai_buddy_conversations`
- [ ] Add FTS column and index to `ai_buddy_messages`
- [ ] Create RLS policies for projects
- [ ] Update conversation RLS to include `deleted_at` filter
- [ ] Test migrations in staging before production

---

_Tech spec generated: 2025-12-07_
_Author: Sam_
_Epic: 16 - AI Buddy Projects_
