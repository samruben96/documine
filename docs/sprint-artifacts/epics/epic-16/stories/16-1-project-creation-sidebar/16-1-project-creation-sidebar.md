# Story 16.1: Project Creation & Sidebar

**Epic:** 16 - AI Buddy Projects
**Status:** done
**Points:** 5
**Created:** 2025-12-07
**Completed:** 2025-12-07
**Context:** [16-1-project-creation-sidebar.context.xml](./16-1-project-creation-sidebar.context.xml)

---

## User Story

**As a** user of AI Buddy,
**I want** to create Projects and see them in a sidebar,
**So that** I can organize my work by client and switch between them easily.

---

## Background

This story is the foundation for Epic 16: AI Buddy Projects. It establishes the project creation workflow and the sidebar navigation that enables users to organize their AI conversations by client account. Projects are the organizational backbone of AI Buddy - matching how insurance agents naturally think about their business (by client/account).

**Key Value Proposition:** Users can create a "Johnson Family" project, and later attach documents and have conversations scoped to that client's context.

**Merged From:** Original stories 16.1 (Create Projects) + 16.2 (Project Sidebar) due to tight coupling in UI and state management.

---

## Acceptance Criteria

### Project Creation (FR11)

- [ ] **AC-16.1.1:** Clicking "New Project" opens a dialog with name (required) and description (optional) fields
- [ ] **AC-16.1.2:** Name is required and limited to 100 characters
- [ ] **AC-16.1.3:** Description is optional and limited to 500 characters
- [ ] **AC-16.1.4:** Clicking "Create" creates the project and selects it as active
- [ ] **AC-16.1.5:** New project appears in sidebar immediately (optimistic update)
- [ ] **AC-16.1.6:** Validation error "Project name is required" shown if name empty
- [ ] **AC-16.1.7:** API returns AIB_102 if name exceeds 100 characters

### Project Sidebar (FR17)

- [ ] **AC-16.1.8:** Sidebar shows "Projects" section with all active (non-archived) projects
- [ ] **AC-16.1.9:** Each project card shows name (truncated at 25 chars) and document count badge
- [ ] **AC-16.1.10:** Active project has visual indicator (highlight, different background)
- [ ] **AC-16.1.11:** Clicking a project switches to that project's context
- [ ] **AC-16.1.12:** Projects sorted alphabetically by name
- [ ] **AC-16.1.13:** Empty state shown when no projects exist: "Create your first project"
- [ ] **AC-16.1.14:** Mobile: Sidebar rendered in Sheet overlay

---

## Technical Requirements

### Files to Create

#### API Routes

| File | Purpose |
|------|---------|
| `src/app/api/ai-buddy/projects/route.ts` | GET (list) and POST (create) endpoints |
| `src/app/api/ai-buddy/projects/[id]/route.ts` | GET (single), PATCH (update), DELETE (archive) |

#### UI Components

| Component | File | Purpose |
|-----------|------|---------|
| ProjectSidebar | `src/components/ai-buddy/project-sidebar.tsx` | Left sidebar with project list |
| ProjectCard | `src/components/ai-buddy/project-card.tsx` | Single project item in sidebar |
| ProjectCreateDialog | `src/components/ai-buddy/project-create-dialog.tsx` | Create project modal |

#### Hooks

| Hook | File | Purpose |
|------|------|---------|
| useProjects | `src/hooks/ai-buddy/use-projects.ts` | Project CRUD operations with React Query |
| useActiveProject | `src/hooks/ai-buddy/use-active-project.ts` | Current project context state |

#### Library Functions

| Function | File | Purpose |
|----------|------|---------|
| project-service | `src/lib/ai-buddy/project-service.ts` | Server-side project operations |

### Database Requirements

**ai_buddy_projects table** (from Epic 14 migration - verify exists):
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

-- RLS Policies
ALTER TABLE ai_buddy_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own projects" ON ai_buddy_projects
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own projects" ON ai_buddy_projects
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

### API Contracts

#### GET /api/ai-buddy/projects

**Query Parameters:**
```typescript
interface ProjectsListQuery {
  includeArchived?: boolean;
  sortBy?: 'name' | 'updated_at' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface ProjectsListResponse {
  data: Project[];
  error: null;
}
```

#### POST /api/ai-buddy/projects

**Request:**
```typescript
interface CreateProjectRequest {
  name: string;          // Required, max 100 chars
  description?: string;  // Optional, max 500 chars
}
```

**Response:**
```typescript
interface CreateProjectResponse {
  data: Project;
  error: null;
}
```

**Error Codes:**
- `AIB_101`: Name is required
- `AIB_102`: Name exceeds 100 characters
- `AIB_103`: Description exceeds 500 characters

### TypeScript Interfaces

```typescript
// src/types/ai-buddy.ts (extend existing)

export interface Project {
  id: string;
  userId: string;
  agencyId?: string;
  name: string;
  description?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  documentCount?: number;       // Computed from joins
  conversationCount?: number;   // Computed from joins
}

export interface ProjectCreateInput {
  name: string;
  description?: string;
}

export interface ProjectUpdateInput {
  name?: string;
  description?: string;
}
```

---

## Sub-Tasks

### Phase A: Database & API Foundation

- [ ] **T1:** Verify `ai_buddy_projects` table exists with correct schema and RLS policies
- [ ] **T2:** Create `src/lib/ai-buddy/project-service.ts` with CRUD operations
- [ ] **T3:** Create `src/app/api/ai-buddy/projects/route.ts` with GET and POST handlers
- [ ] **T4:** Create Zod validation schemas for project creation
- [ ] **T5:** Unit tests for project service functions

### Phase B: Project Hooks

- [ ] **T6:** Create `src/hooks/ai-buddy/use-projects.ts` with React Query integration
- [ ] **T7:** Create `src/hooks/ai-buddy/use-active-project.ts` for context management
- [ ] **T8:** Implement optimistic updates for project creation
- [ ] **T9:** Unit tests for hooks

### Phase C: UI Components

- [ ] **T10:** Create `src/components/ai-buddy/project-card.tsx` with name truncation and doc count
- [ ] **T11:** Create `src/components/ai-buddy/project-sidebar.tsx` with project list and empty state
- [ ] **T12:** Create `src/components/ai-buddy/project-create-dialog.tsx` with form validation
- [ ] **T13:** Integrate sidebar into AI Buddy page layout
- [ ] **T14:** Implement mobile Sheet overlay for sidebar
- [ ] **T15:** Component tests for all UI components

### Phase D: Integration & Testing

- [ ] **T16:** Integration test: Create project via API
- [ ] **T17:** Integration test: List projects with RLS enforcement
- [ ] **T18:** E2E test: Full project creation flow
- [ ] **T19:** E2E test: Project switching
- [ ] **T20:** E2E test: Mobile sidebar behavior

---

## Test Scenarios

### Unit Tests

| Scenario | Expected |
|----------|----------|
| Create project with valid name | Project created, returns project object |
| Create project with empty name | Returns AIB_101 error |
| Create project with 101-char name | Returns AIB_102 error |
| Create project with 501-char description | Returns AIB_103 error |
| Truncate project name at 25 chars | "Johnson Family Insurance Policy" → "Johnson Family Insurance..." |
| Sort projects alphabetically | "Acme Corp" before "Johnson Family" |

### Integration Tests

| Scenario | Expected |
|----------|----------|
| Unauthorized project access | 401 Unauthorized |
| Access other user's project | Empty result (RLS) |
| Create and retrieve project | Project persisted and returned |
| List archived projects | Excluded by default, included with flag |

### E2E Tests

| Scenario | Expected |
|----------|----------|
| Click "New Project" | Dialog opens with name/description fields |
| Enter name and create | Project appears in sidebar, selected |
| Empty name submit | "Project name is required" error |
| Click project in sidebar | Project selected, header updates |
| Mobile hamburger menu | Sheet sidebar opens |

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Epic 14: AI Buddy Foundation | Hard | Done | Database schema, API structure |
| Epic 15: Core Chat | Soft | Done | Chat panel integration |
| AI Buddy page layout | Soft | Done | Story 14.4 |
| shadcn/ui Dialog | Existing | Available | For create dialog |
| shadcn/ui Sheet | Existing | Available | For mobile sidebar |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tanstack/react-query` | ^5.x | State management, caching |
| `zod` | ^3.x | Input validation |
| `@radix-ui/react-dialog` | via shadcn | Create dialog |
| `@radix-ui/react-slot` | via shadcn | Button composition |

---

## Out of Scope

- Project context switching header (Story 16.2)
- Project rename/archive (Story 16.3)
- Conversation history integration (Story 16.4)
- Document attachments (Epic 17)
- Project-level permissions
- Project templates or cloning
- Project sharing between users

---

## Definition of Done

- [ ] All acceptance criteria (AC-16.1.1 through AC-16.1.14) verified
- [ ] All sub-tasks (T1 through T20) completed
- [ ] Unit tests passing (>80% coverage for new code)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Build passes (`npm run build`)
- [ ] Code reviewed and approved
- [ ] Merged to main

---

## Dev Notes

### Architecture Patterns

- **Verify-Then-Service Pattern:** For mutations, verify ownership with RLS, then use service client for UPDATE/DELETE operations (per Epic 15 pattern)
- **Optimistic Updates:** Use React Query's `onMutate` for immediate UI feedback, rollback on error
- **Error Codes:** Follow `AIB_XXX` pattern (AIB_101, AIB_102, etc.)

### Existing Code to Reference

- `src/hooks/ai-buddy/use-chat.ts` - React Query patterns for AI Buddy
- `src/hooks/ai-buddy/use-conversations.ts` - Conversation list hook patterns
- `src/components/ai-buddy/ai-buddy-sidebar.tsx` - Existing sidebar structure (extend)
- `src/lib/ai-buddy/conversation-service.ts` - Service client pattern

### Project Structure Notes

```
src/
├── app/api/ai-buddy/
│   └── projects/
│       ├── route.ts          # GET (list), POST (create)
│       └── [id]/
│           └── route.ts      # GET, PATCH, DELETE (Story 16.3)
├── components/ai-buddy/
│   ├── project-sidebar.tsx   # NEW
│   ├── project-card.tsx      # NEW
│   └── project-create-dialog.tsx  # NEW
├── hooks/ai-buddy/
│   ├── use-projects.ts       # NEW
│   └── use-active-project.ts # NEW
└── lib/ai-buddy/
    └── project-service.ts    # NEW
```

### References

- [Source: docs/sprint-artifacts/epics/epic-16/tech-spec.md#Story-16.1]
- [Source: docs/features/ai-buddy/epics.md#Story-3.1]
- [Source: docs/features/ai-buddy/architecture.md]

---

## Learnings from Previous Story

**From Story 15.5 (Status: Done)**

- **Service Client Pattern**: For RLS bypass after ownership verification, use `createClient()` with service role, not user client
- **SSE Event Structure**: Follow `data: {"type":"...", ...}` format for consistency
- **Test Organization**: Place component tests in `__tests__/components/ai-buddy/`, E2E in `__tests__/e2e/`
- **Optimistic Updates**: Use React Query `useMutation` with `onMutate` for immediate feedback
- **Error Handling**: Return `{ data: null, error: { code: 'AIB_XXX', message: '...' } }` format

[Source: docs/sprint-artifacts/epics/epic-15/stories/15-5-ai-response-quality-attribution/15-5-ai-response-quality-attribution.md#Senior-Developer-Review]

---

## Dev Agent Record

### Context Reference

- [16-1-project-creation-sidebar.context.xml](./16-1-project-creation-sidebar.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
