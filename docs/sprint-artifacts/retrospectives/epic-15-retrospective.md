# Epic 15 Retrospective: AI Buddy Core Chat

**Date:** 2025-12-07
**Facilitator:** Bob (Scrum Master)
**Participants:** Full BMAD Agent Team + Sam (Project Lead)
**Scope:** Epic 15 Complete Analysis (Stories 15.1-15.5)

---

## Epic Summary

| Metric | Value |
|--------|-------|
| **Epic** | 15: AI Buddy Core Chat |
| **Stories Planned** | 5 (originally 7, merged to 5) |
| **Stories Delivered** | 5 (100%) |
| **Story Points** | 37 (3 + 5 + 8 + 5 + 16) |
| **Tests (Total)** | 350+ new tests |
| **Production Incidents** | 0 |
| **Predecessor** | Epic 14 (AI Buddy Foundation) |

### Key Deliverables

**Story 15.1: Chat Input Component (Done - 3 points)**
- Auto-expanding textarea with 4-line max
- Enter to send, Shift+Enter for newline
- Character counter at 3500+ chars
- 47 unit tests covering all 8 ACs
- forwardRef pattern for external control

**Story 15.2: Message Display Component (Done - 5 points)**
- ChatMessage with role-based styling (user/AI)
- Markdown rendering via react-markdown
- Virtualized message list via react-virtuoso
- Streaming indicator with animated dots
- Auto-scroll when near bottom
- 86 unit tests

**Story 15.3: Streaming Chat API (Done - 8 points)**
- Edge Runtime for low latency
- SSE streaming with chunk/sources/confidence/done/error events
- OpenRouter integration with Claude
- Rate limiting (tier-based: free/pro/enterprise)
- useChat hook with SSE connection management
- 56 unit tests

**Story 15.4: Conversation Persistence (Done - 5 points)**
- Conversation auto-creation on first message
- Auto-generated title from first 50 chars
- Full history loading
- Sidebar "Recent" section integration
- DELETE endpoint with service client pattern
- 53 unit tests

**Story 15.5: AI Response Quality & Attribution (Done - 16 points)**
- **Merged from original 15.5, 15.6, 15.7**
- Source citations with tooltips
- Confidence badges (high/medium/low)
- Guardrail-aware responses (invisible enforcement)
- Audit logging for guardrail events
- 145+ tests (unit + E2E)

---

## What Went Well

### 1. Story Merger Decision (15.5-15.7 → 15.5)

The PM and SM decision to merge stories 15.5 (Source Citations), 15.6 (Confidence Indicators), and 15.7 (Guardrail-Aware Responses) into a single 16-point story was excellent. These features share:
- Prompt building logic
- SSE event parsing
- Message display components
- Database storage (sources, confidence columns)

Merging avoided three separate integration phases and reduced handoff overhead.

### 2. Comprehensive Code Reviews

Every story received a thorough Senior Developer Review:
- Story 15.1: APPROVED - 47 tests, excellent accessibility
- Story 15.2: APPROVED - 86 tests, pattern consistency
- Story 15.3: APPROVED - 56 tests, advisory notes for ai-client tests
- Story 15.4: APPROVED - 53 tests, critical DELETE bug fixed
- Story 15.5: APPROVED - 145+ tests, full AC coverage

### 3. Proactive Performance Work

Story 15.2 added react-virtuoso for virtualized message rendering without being asked. This handles 1000+ message conversations without performance degradation.

### 4. Strong Test Coverage

| Story | Unit Tests | E2E Tests |
|-------|-----------|-----------|
| 15.1 | 47 | - |
| 15.2 | 86 | - |
| 15.3 | 56 | - |
| 15.4 | 53 | 1 spec file |
| 15.5 | 120+ | 22 (3 spec files) |

### 5. Edge Runtime for Streaming

Using Vercel Edge Runtime for the chat API enabled:
- Sub-500ms time-to-first-token
- Low-latency SSE streaming
- No cold start issues

---

## Challenges

### 1. RLS 403 Error on DELETE (Story 15.4) - CRITICAL LEARNING

**Problem:** Supabase RLS UPDATE/DELETE policies fail with 403 even when the user is authenticated via Edge Runtime.

**Root Cause:** Edge Runtime's cookie-based auth doesn't properly propagate to Supabase for UPDATE/DELETE operations, even though `auth.uid()` should match.

**Solution:** The "Verify-Then-Service" pattern:
1. First, verify ownership via SELECT (uses RLS, confirms user owns resource)
2. Then, use service client to perform UPDATE/DELETE (bypasses RLS, but safe since ownership verified)

**Code Pattern:**
```typescript
// Step 1: Verify ownership (uses RLS)
const { data: conversation } = await supabase
  .from('ai_buddy_conversations')
  .select('id')
  .eq('id', conversationId)
  .single();

if (!conversation) {
  return Response.json({ error: 'Not found' }, { status: 404 });
}

// Step 2: Perform delete with service client (bypasses RLS, ownership verified)
const serviceClient = createServiceClient();
await serviceClient
  .from('ai_buddy_conversations')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', conversationId);
```

**Impact:** This pattern should be documented and used for all future UPDATE/DELETE operations in Edge Runtime routes.

### 2. Large Story Size (15.5 - 16 points)

Story 15.5 was the largest story we've executed (16 points). While the merger was correct, 16 points is at the upper limit of manageable scope. Consider breaking down stories this size in the future if there are natural boundaries.

---

## Key Learnings

### Learning 1: Service Client Pattern for RLS Bypass

Supabase RLS can fail on UPDATE/DELETE in Edge Runtime. Use "verify ownership first, then service client" pattern.

**Document this in:** `docs/architecture/implementation-patterns.md`

### Learning 2: Story Merging Reduces Integration Overhead

Tightly-coupled features should be combined into single stories. Signs to merge:
- Shared database columns
- Shared prompt building
- Shared SSE event types
- Would need to test together anyway

### Learning 3: Virtualization for Long Lists

Add virtualization proactively for any list that might grow large. react-virtuoso is lightweight (~8KB) and handles variable-height items well.

### Learning 4: Edge Runtime + SSE Is the Pattern

For AI streaming responses:
- Edge Runtime for low latency
- ReadableStream + TextEncoderStream for SSE
- Proper headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`

---

## Previous Retrospective Follow-Through

**Epic 14 Action Items:**

| # | Action Item | Status | Notes |
|---|-------------|--------|-------|
| 1 | Continue using epic-yolo for foundation/scaffolding epics | N/A | Epic 15 was functional, not foundation |
| 2 | Tech specs as prerequisite for epic-yolo mode | APPLIED | Tech spec was comprehensive and enabled clear implementation |
| 3 | Add tests for component stubs as functionality is implemented | COMPLETED | 350+ tests added in Epic 15 |

---

## Action Items

### Process Improvements

| # | Action Item | Owner | Success Criteria |
|---|-------------|-------|------------------|
| 1 | Document "Verify-Then-Service" pattern for RLS bypass | Charlie | Pattern added to implementation-patterns.md |
| 2 | Add story size warning at 13+ points | Bob (SM) | Story drafts flag large stories for review |
| 3 | Continue story merging for tightly-coupled features | Alice (PM) | No integration stories needed |

### Technical Debt

| # | Item | Owner | Priority |
|---|------|-------|----------|
| 1 | Add dedicated ai-client.test.ts | Elena | Low (covered indirectly) |
| 2 | Clean up React act() warnings in tests | Charlie | Low |
| 3 | Add monitoring for audit log failures | Charlie | Medium |

### Documentation

| # | Item | Owner | Timeline |
|---|------|-------|----------|
| 1 | Document RLS service client pattern | Charlie | ✅ DONE 2025-12-07 |
| 2 | Document SSE streaming patterns | Winston | ✅ DONE 2025-12-07 |

### Team Agreements

- **Tightly-coupled features → merge into single story**
- **UPDATE/DELETE in Edge Runtime → use service client pattern**
- **Lists that might grow large → add virtualization**
- **Code review on every story (no exceptions)**

---

## Epic 16 Preparation

### Dependencies on Epic 15 (All Ready)

| Component | Status |
|-----------|--------|
| Chat input component | Ready |
| Message display with streaming | Ready |
| Conversation persistence | Ready |
| Source citations | Ready |
| Confidence indicators | Ready |
| useChat hook | Ready |
| useConversations hook | Ready |

### Epic 16: AI Buddy Projects (9 Stories)

| Story | Name | Description |
|-------|------|-------------|
| 16.1 | Create Project | Dialog to create project with name/description |
| 16.2 | Project Sidebar | List projects with doc count, selection state |
| 16.3 | Project Context | Conversations use project document context |
| 16.4 | Rename/Archive Projects | Context menu for project management |
| 16.5 | Conversation History | Recent conversations grouped by date |
| 16.6 | Search Conversations | Full-text search across messages |
| 16.7 | Delete Conversations | Soft delete with audit log |
| 16.8 | General Chat | Conversations without project context |
| 16.9 | Move to Project | Move existing conversation into a project |

### Preparation Tasks

| # | Task | Owner | Priority |
|---|------|-------|----------|
| 1 | Review PostgreSQL full-text search for conversation search | Charlie | P1 |
| 2 | Design project context switching (<200ms target) | Winston | P1 |
| 3 | Create tech spec for Epic 16 | Winston | P0 |
| 4 | Plan document upload integration with existing docuMINE | Elena | P2 |

### No Critical Blockers

Epic 15 foundation is solid. Epic 16 can begin immediately.

---

## Epic Grade: A

| Category | Grade | Notes |
|----------|-------|-------|
| Delivery | A | 5/5 stories, 100% completion |
| Technical Quality | A | 350+ tests, comprehensive code reviews |
| Risk | A | Zero production incidents |
| Innovation | A | Story merger, proactive virtualization |
| Documentation | A | All stories have completion notes and review |

**Overall: A** - Epic 15 delivered the core AI Buddy chat experience with excellent quality. The story merger decision and RLS bug fix are valuable lessons for future epics.

---

## Next Steps

### Immediate
1. Begin Epic 16: AI Buddy Projects
2. Create tech spec for Epic 16
3. Document service client pattern in architecture docs

### AI Buddy Roadmap

| Epic | Name | Stories | Status |
|------|------|---------|--------|
| 14 | AI Buddy Foundation | 5 | DONE |
| 15 | AI Buddy Core Chat | 5 | DONE |
| 16 | AI Buddy Projects | 9 | **NEXT** |
| 17 | AI Buddy Document Intelligence | 7 | Backlog |
| 18 | AI Buddy Personalization & Onboarding | 8 | Backlog |
| 19 | AI Buddy Guardrails & Compliance | 6 | Backlog |
| 20 | AI Buddy Admin & Audit | 13 | Backlog |

---

## Team Reflections

### Alice (Product Owner)
"Epic 15 is where AI Buddy became real for users. The streaming responses, citations, and confidence indicators deliver the trust and transparency users need. The story merger was the right call."

### Winston (Architect)
"The Edge Runtime + SSE pattern is proven now. The service client workaround for RLS is ugly but necessary - we should document it clearly. Overall, solid technical execution."

### Charlie (Senior Dev)
"350+ tests is excellent coverage. The RLS bug was a surprise - Supabase documentation doesn't make this clear. We need to share this knowledge with the community. The virtualization addition shows good forward thinking."

### Dana (QA)
"Code reviews caught issues before they became problems. The merged story 15.5 worked well because the test strategy covered all three original stories' requirements."

### Elena (Junior Dev)
"I learned so much about SSE streaming and React hooks. The useChat hook is a great example of managing complex async state. Looking forward to Epic 16."

### Bob (Scrum Master)
"Epic 15 gets an A. We delivered all stories, maintained quality, and learned valuable lessons. The story merger saved us time. The RLS pattern is documented for future reference. Epic 16 is unblocked."

---

## Retrospective Metadata

- **Generated:** 2025-12-07
- **Method:** BMAD Retrospective Workflow
- **Participants:** Full BMAD Agent Team + Sam (Project Lead)
- **Previous Retrospective:** Epic 14 (AI Buddy Foundation)
- **Next Epic:** 16 (AI Buddy Projects)

### Files Referenced

- `docs/sprint-artifacts/epics/epic-15/epic.md`
- `docs/sprint-artifacts/epics/epic-15/tech-spec.md`
- `docs/sprint-artifacts/epics/epic-15/stories/15-1-chat-input-component/15-1-chat-input-component.md`
- `docs/sprint-artifacts/epics/epic-15/stories/15-2-message-display/15-2-message-display.md`
- `docs/sprint-artifacts/epics/epic-15/stories/15-3-streaming-chat-api/15-3-streaming-chat-api.md`
- `docs/sprint-artifacts/epics/epic-15/stories/15-4-conversation-persistence/15-4-conversation-persistence.md`
- `docs/sprint-artifacts/epics/epic-15/stories/15-5-ai-response-quality-attribution/15-5-ai-response-quality-attribution.md`
- `docs/sprint-artifacts/retrospectives/epic-14-retrospective.md`
