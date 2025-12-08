# AI Buddy - Epic Breakdown

**Author:** Sam
**Date:** 2025-12-07
**Project Level:** SaaS B2B Feature Module
**Target Scale:** Independent Insurance Agencies

---

## Overview

This document provides the complete epic and story breakdown for AI Buddy, decomposing the requirements from the [PRD](./prd.md) into implementable stories.

**Living Document Notice:** This version incorporates all available context: PRD + UX Design + Architecture.

## Epics Summary

| Epic | Name | User Value | FRs |
|------|------|------------|-----|
| **1** | AI Buddy Foundation | Setup & infrastructure for all features | FR63 |
| **2** | AI Buddy Core Chat | User can ask questions and get accurate, sourced answers | FR1, FR2, FR5, FR7-10 |
| **3** | AI Buddy Projects | User can organize work by client account | FR3, FR4, FR6, FR11-19 |
| **4** | AI Buddy Document Intelligence | AI can answer questions about user's specific documents | FR20-25, FR65, FR66 |
| **5** | AI Buddy Personalization & Onboarding | Personalized AI experience from first interaction | FR26-32, FR57-62 |
| **6** | AI Buddy Guardrails & Compliance | Admin can control AI behavior for E&O protection | FR35-41 |
| **7** | AI Buddy Admin & Audit | Principal has full visibility and control over agency | FR42-56, FR64 |

**Total:** 7 Epics covering 64 FRs (FR33-34 deferred to Quoting feature)

---

## Functional Requirements Inventory

**Chat & Conversation (FR1-10)**
- **FR1:** Users can start new conversations from the dashboard or within a Project
- **FR2:** Users can send messages and receive streaming AI responses in real-time
- **FR3:** Users can view conversation history organized by date and Project
- **FR4:** Users can search across all their conversations by keyword
- **FR5:** Users can continue previous conversations with full context retained
- **FR6:** Users can delete individual conversations from their history
- **FR7:** AI responses include source citations linking to specific document locations
- **FR8:** AI responses include confidence indicators ([High Confidence], [Needs Review], [Not Found])
- **FR9:** AI responds with "I don't know" when information is not available rather than hallucinating
- **FR10:** AI respects guardrails invisibly - responses stay within configured bounds

**Projects & Workspaces (FR11-19)**
- **FR11:** Users can create new Projects with a name and optional description
- **FR12:** Users can rename and archive Projects
- **FR13:** Users can attach documents (PDF, images) to Projects for persistent context
- **FR14:** Users can remove documents from Projects
- **FR15:** Users can view all documents attached to a Project
- **FR16:** Conversations started within a Project automatically have access to all attached document context
- **FR17:** Users can switch between Projects via sidebar navigation
- **FR18:** Users can start a conversation outside any Project (general chat)
- **FR19:** Users can move a conversation into a Project after the fact

**Document Management (FR20-25)**
- **FR20:** Users can upload documents directly into a conversation for immediate context
- **FR21:** Users can upload documents to a Project for persistent availability
- **FR22:** System processes uploaded documents and makes content available for AI queries
- **FR23:** Users can preview attached documents within the interface
- **FR24:** System displays document processing status (uploading, processing, ready)
- **FR25:** AI can reference multiple documents within a single conversation

**Personalization & Learning (FR26-32)**
- **FR26:** Users can set their display name and role
- **FR27:** Users can specify preferred lines of business (P&C, Commercial, Personal, Life)
- **FR28:** Users can maintain a list of favorite/preferred carriers
- **FR29:** Users can set agency information (name, states licensed)
- **FR30:** Users can choose communication style preference (formal/professional, casual/friendly)
- **FR31:** AI incorporates user preferences into response style and suggestions
- **FR32:** Users can reset their personalization settings to defaults

**Guardrails & Compliance (FR33-41)**
- **FR33:** Admins can configure a list of approved carriers for the agency
- **FR34:** AI only discusses approved carriers when guardrail is enabled
- **FR35:** Admins can define restricted topics that AI will not discuss
- **FR36:** Admins can enable/disable individual guardrail rules
- **FR37:** Guardrail changes take effect immediately for all agency users
- **FR38:** System logs all guardrail enforcement events (what was blocked, when, for whom)
- **FR39:** AI provides helpful redirection when a guardrail prevents a direct answer
- **FR40:** System displays AI disclosure message in compliance with state chatbot laws
- **FR41:** Admins can customize the AI disclosure message

**Admin Panel & User Management (FR42-49)**
- **FR42:** Admins can view a list of all users in their agency
- **FR43:** Admins can invite new users via email
- **FR44:** Admins can remove users from the agency
- **FR45:** Admins can change user roles (Producer ↔ Admin)
- **FR46:** Admins can view usage analytics (conversations per user, documents uploaded, active users)
- **FR47:** Admins can view a usage dashboard with trends over time
- **FR48:** Owners can manage billing and subscription settings
- **FR49:** Owners can transfer ownership to another Admin

**Audit & Reporting (FR50-56)**
- **FR50:** System maintains complete audit log of all AI conversations
- **FR51:** Admins can view audit log filtered by user, date range, or keyword
- **FR52:** Admins can view full conversation transcripts in audit log (read-only)
- **FR53:** Admins can export audit log entries as PDF or CSV
- **FR54:** Audit logs cannot be deleted or modified by any user
- **FR55:** Audit log entries include timestamp, user, conversation ID, and guardrail events
- **FR56:** System retains audit logs for minimum required compliance period

**Onboarding (FR57-62)**
- **FR57:** New users complete a quick personalization flow (< 2 minutes)
- **FR58:** Onboarding collects: name, lines of business, top carriers
- **FR59:** System provides guided first conversation demonstrating AI capabilities
- **FR60:** System offers personalized suggestions based on onboarding answers
- **FR61:** Users can skip onboarding and complete personalization later
- **FR62:** Admins see onboarding completion status for their users

**Integration with docuMINE (FR63-66)**
- **FR63:** AI Buddy is accessible from the main docuMINE dashboard
- **FR64:** Users can navigate between AI Buddy and Document Comparison seamlessly
- **FR65:** Documents uploaded to docuMINE are available in AI Buddy Projects
- **FR66:** AI can reference previously analyzed documents from Document Comparison

---

## FR Coverage Map

**Epic 1 (AI Buddy Foundation):** FR63
- FR63: AI Buddy accessible from main docuMINE dashboard

**Epic 2 (AI Buddy Core Chat):** FR1, FR2, FR5, FR7, FR8, FR9, FR10
- FR1: Start new conversations
- FR2: Streaming AI responses
- FR5: Continue previous conversations
- FR7: Source citations
- FR8: Confidence indicators
- FR9: "I don't know" responses (no hallucination)
- FR10: Invisible guardrail respect

**Epic 3 (AI Buddy Projects):** FR3, FR4, FR6, FR11-19
- FR3: Conversation history by date/project
- FR4: Search conversations by keyword
- FR6: Delete conversations
- FR11: Create Projects with name/description
- FR12: Rename and archive Projects
- FR13: Attach documents to Projects
- FR14: Remove documents from Projects
- FR15: View all Project documents
- FR16: Conversations have Project document context
- FR17: Switch Projects via sidebar
- FR18: Start general chat (no project)
- FR19: Move conversation into Project

**Epic 4 (AI Buddy Document Intelligence):** FR20-25, FR65, FR66
- FR20: Upload documents into conversation
- FR21: Upload documents to Project
- FR22: Process documents for AI queries
- FR23: Preview attached documents
- FR24: Document processing status
- FR25: Reference multiple documents
- FR65: docuMINE documents available in Projects
- FR66: Reference previously analyzed documents

**Epic 5 (AI Buddy Personalization & Onboarding):** FR26-32, FR57-62
- FR26: Set display name and role
- FR27: Specify lines of business
- FR28: Maintain favorite carriers list
- FR29: Set agency information
- FR30: Choose communication style
- FR31: AI incorporates preferences
- FR32: Reset personalization to defaults
- FR57: Quick personalization flow
- FR58: Onboarding collects name, LOB, carriers
- FR59: Guided first conversation
- FR60: Personalized suggestions
- FR61: Skip onboarding option
- FR62: Admin sees onboarding status

**Epic 6 (AI Buddy Guardrails & Compliance):** FR35-41
- FR35: Define restricted topics
- FR36: Enable/disable guardrail rules
- FR37: Guardrails apply immediately
- FR38: Log guardrail enforcement events
- FR39: Helpful redirection when guardrail triggered
- FR40: AI disclosure message (state compliance)
- FR41: Customize AI disclosure message
- ⚠️ FR33-34 (carrier restrictions) deferred to Quoting feature

**Epic 7 (AI Buddy Admin & Audit):** FR42-56, FR64
- FR42: View all agency users
- FR43: Invite users via email
- FR44: Remove users
- FR45: Change user roles
- FR46: View usage analytics
- FR47: Usage dashboard with trends
- FR48: Manage billing/subscription
- FR49: Transfer ownership
- FR50: Complete audit log
- FR51: Filter audit log
- FR52: View conversation transcripts
- FR53: Export audit log (PDF/CSV)
- FR54: Immutable audit logs
- FR55: Audit log metadata
- FR56: Compliance retention period
- FR64: Seamless navigation between features

---

## Epic 1: AI Buddy Foundation

**Goal:** Establish the database schema, API routes, and navigation integration that enables all AI Buddy features.

**FRs Covered:** FR63

**User Value:** Foundation enables all subsequent epics to deliver value.

---

### Story 1.1: AI Buddy Database Schema

**As a** developer,
**I want** the AI Buddy database tables created with proper indexes and RLS policies,
**So that** all AI Buddy features have a secure, performant data layer.

**Acceptance Criteria:**

**Given** the Supabase database
**When** the migration is applied
**Then** the following tables are created:
- `ai_buddy_projects` (id, agency_id, user_id, name, description, archived_at, timestamps)
- `ai_buddy_project_documents` (project_id, document_id, attached_at)
- `ai_buddy_conversations` (id, agency_id, user_id, project_id, title, timestamps)
- `ai_buddy_messages` (id, conversation_id, agency_id, role, content, sources, confidence, created_at)
- `ai_buddy_guardrails` (agency_id, restricted_topics, custom_rules, eando_disclaimer, ai_disclosure_message)
- `ai_buddy_permissions` (id, user_id, permission, granted_by, granted_at)
- `ai_buddy_audit_logs` (id, agency_id, user_id, conversation_id, action, metadata, logged_at)
- `ai_buddy_rate_limits` (tier, messages_per_minute, messages_per_day)

**And** `users` table has `ai_buddy_preferences` JSONB column added

**And** RLS policies enforce:
- Users see only their own projects, conversations, messages
- Admins can manage guardrails for their agency
- Audit logs are append-only (INSERT only, no UPDATE/DELETE)
- Admins can read audit logs for their agency

**And** indexes are created for:
- `idx_projects_user` on projects(user_id) WHERE archived_at IS NULL
- `idx_conversations_project` on conversations(project_id)
- `idx_messages_conversation` on messages(conversation_id)
- `idx_messages_content_fts` using GIN for full-text search
- `idx_audit_logs_agency_date` on audit_logs(agency_id, logged_at DESC)

**Prerequisites:** None (first story)

**Technical Notes:**
- See Architecture document section "Data Architecture" for complete schema
- Use `gen_random_uuid()` for all primary keys
- All timestamps use `timestamptz` with `now()` defaults
- Sources column is JSONB for flexible citation storage
- Confidence enum: 'high', 'medium', 'low'

---

### Story 1.2: AI Buddy API Route Structure

**As a** developer,
**I want** the API route structure and shared utilities created,
**So that** all AI Buddy endpoints follow consistent patterns.

**Acceptance Criteria:**

**Given** the Next.js app router
**When** the API structure is created
**Then** the following route structure exists:
```
src/app/api/ai-buddy/
├── chat/route.ts
├── projects/route.ts
├── conversations/route.ts
├── preferences/route.ts
└── admin/
    ├── guardrails/route.ts
    ├── audit-logs/route.ts
    └── users/route.ts
```

**And** shared utilities are created at `src/lib/ai-buddy/`:
- `ai-client.ts` - OpenRouter wrapper for Claude
- `guardrails.ts` - Guardrail enforcement helpers
- `prompt-builder.ts` - System prompt construction
- `audit-logger.ts` - Audit log helper
- `rate-limiter.ts` - Rate limit checker

**And** types are defined at `src/types/ai-buddy.ts`:
- Project, Conversation, Message interfaces
- GuardrailConfig, UserPreferences interfaces
- AuditLogEntry, Permission interfaces
- API request/response types

**And** all routes return consistent format:
- Success: `{ data: T, error: null }`
- Error: `{ data: null, error: { code: string, message: string } }`

**And** error codes follow pattern `AIB_XXX` (e.g., AIB_001, AIB_002)

**Prerequisites:** Story 1.1 (database schema)

**Technical Notes:**
- See Architecture "Implementation Patterns" section for conventions
- Reuse existing docuMINE auth patterns (Supabase Auth)
- All routes validate authentication via `auth.uid()`

---

### Story 1.3: AI Buddy Navigation Integration

**As a** user,
**I want** to access AI Buddy from the main docuMINE navigation,
**So that** I can easily switch between features. (FR63)

**Acceptance Criteria:**

**Given** I am logged into docuMINE
**When** I view the main navigation header
**Then** I see "AI Buddy" as a nav item between "Compare" and "Settings"

**And** the nav item shows an icon (chat bubble or robot icon)

**And** clicking "AI Buddy" navigates to `/ai-buddy`

**And** mobile bottom nav includes AI Buddy icon

**And** the current page is highlighted in nav when on `/ai-buddy/*` routes

**Given** I am on the AI Buddy page
**When** I click other nav items (Documents, Compare, Settings)
**Then** I navigate to those pages seamlessly

**Prerequisites:** Story 1.2 (API structure)

**Technical Notes:**
- Update `src/components/layout/header.tsx` to add nav item
- Update `src/components/layout/sidebar.tsx` for mobile
- Route: `src/app/(dashboard)/ai-buddy/page.tsx`
- Use existing nav patterns from docuMINE

---

### Story 1.4: AI Buddy Page Layout Shell

**As a** user,
**I want** the AI Buddy page to have a ChatGPT-style dark layout,
**So that** I have a familiar, focused chat experience.

**Acceptance Criteria:**

**Given** I navigate to `/ai-buddy`
**When** the page loads
**Then** I see a dark-themed layout with:
- Left sidebar (260px) with dark background (`#171717`)
- Main chat area with slightly lighter background (`#212121`)
- Header showing "AI Buddy" title

**And** the sidebar contains:
- "New Chat" button at top
- "Projects" section (empty state for now)
- "Recent" section (empty state for now)
- User profile section at bottom

**And** the main chat area shows:
- Centered content (max-width 768px)
- Empty state: "Start a conversation with AI Buddy"
- Input box at bottom (placeholder: "Message AI Buddy...")

**And** the layout is responsive:
- Desktop (>1024px): Full three-column layout
- Tablet (640-1024px): Collapsible sidebar
- Mobile (<640px): Sheet overlay sidebar, full-width chat

**Prerequisites:** Story 1.3 (navigation)

**Technical Notes:**
- See UX Design section "3.1 ChatGPT-Style Interface" for layout
- Color tokens: `--sidebar-bg: #171717`, `--chat-bg: #212121`
- Create `src/app/(dashboard)/ai-buddy/layout.tsx` for dark theme
- Reuse shadcn/ui Sheet component for mobile sidebar

---

### Story 1.5: AI Buddy Component Scaffolding

**As a** developer,
**I want** the component file structure created with empty implementations,
**So that** subsequent stories can implement features incrementally.

**Acceptance Criteria:**

**Given** the component structure
**When** scaffolding is complete
**Then** the following components exist at `src/components/ai-buddy/`:

**Chat components:**
- `chat-message.tsx` - Single message bubble (exports empty component)
- `chat-message-list.tsx` - Scrollable message container
- `chat-input.tsx` - Text input with send button
- `streaming-indicator.tsx` - Typing animation
- `source-citation.tsx` - Document reference link
- `confidence-badge.tsx` - High/Medium/Low indicator

**Project components:**
- `project-sidebar.tsx` - Left sidebar with projects
- `project-card.tsx` - Single project item
- `project-create-dialog.tsx` - Create project modal
- `chat-history-item.tsx` - Past conversation link

**Document components:**
- `document-panel.tsx` - Right panel for docs
- `document-card.tsx` - Document item
- `document-upload-zone.tsx` - Drag-drop upload

**Admin components:**
- `guardrail-toggle.tsx` - Toggle with description
- `topic-tag-list.tsx` - Restricted topics chips
- `audit-log-table.tsx` - Audit entries table
- `usage-stat-card.tsx` - Metric display

**Onboarding components:**
- `onboarding-flow.tsx` - Multi-step flow
- `chip-select.tsx` - Multi-select chips
- `progress-steps.tsx` - Step indicator

**And** barrel export exists at `src/components/ai-buddy/index.ts`

**And** hooks directory exists at `src/hooks/ai-buddy/`:
- `use-chat.ts`
- `use-projects.ts`
- `use-preferences.ts`
- `use-guardrails.ts`
- `use-audit-logs.ts`

**Prerequisites:** Story 1.4 (page layout)

**Technical Notes:**
- Components can be empty shells with TODO comments
- Follow naming convention: kebab-case files, PascalCase exports
- See UX Design "Component Library" section for props interfaces

---

## Epic 2: AI Buddy Core Chat

**Goal:** Deliver the core conversational AI experience with streaming responses, source citations, and confidence indicators.

**FRs Covered:** FR1, FR2, FR5, FR7, FR8, FR9, FR10

**User Value:** Users can ask insurance questions and receive accurate, sourced answers in real-time.

---

### Story 2.1: AI Buddy Chat Input Component

**As a** user,
**I want** to type messages in a chat input box,
**So that** I can communicate with AI Buddy. (FR1)

**Acceptance Criteria:**

**Given** I am on the AI Buddy page
**When** I view the chat input area
**Then** I see a rounded input box at the bottom of the chat area

**And** the input has placeholder text "Message AI Buddy..."

**And** there is a send button (arrow icon) on the right side

**And** the send button is disabled when input is empty

**And** pressing Enter sends the message (Shift+Enter for newline)

**And** the input auto-expands up to 4 lines, then becomes scrollable

**And** after sending, the input clears and refocuses

**Given** I am typing a message
**When** the message exceeds 4000 characters
**Then** I see a character count indicator showing remaining characters

**Prerequisites:** Story 1.5 (component scaffolding)

**Technical Notes:**
- Component: `src/components/ai-buddy/chat-input.tsx`
- Use shadcn/ui Textarea with custom styling
- Max message length: 4000 characters
- Keyboard handling: Enter to send, Shift+Enter for newline

---

### Story 2.2: AI Buddy Message Display

**As a** user,
**I want** to see my messages and AI responses in a chat format,
**So that** I can follow the conversation flow.

**Acceptance Criteria:**

**Given** I have sent a message
**When** it appears in the chat
**Then** my message shows on the right with a blue user avatar

**And** AI responses show on the left with a green AI avatar

**And** messages are displayed in chronological order (oldest at top)

**And** the chat auto-scrolls to the newest message

**And** timestamps are shown on hover (relative format: "2 min ago")

**And** message content supports markdown formatting (bold, lists, code blocks)

**Given** the AI is responding
**When** streaming is in progress
**Then** I see a typing indicator (three animated dots) before content appears

**Prerequisites:** Story 2.1 (chat input)

**Technical Notes:**
- Components: `chat-message.tsx`, `chat-message-list.tsx`, `streaming-indicator.tsx`
- Use `react-markdown` for rendering (already in docuMINE)
- Avatar colors: User `#3b82f6`, AI `#10b981`
- Auto-scroll using `scrollIntoView({ behavior: 'smooth' })`

---

### Story 2.3: AI Buddy Streaming Chat API

**As a** user,
**I want** AI responses to stream in real-time,
**So that** I see answers progressively without waiting. (FR2)

**Acceptance Criteria:**

**Given** I send a message to AI Buddy
**When** the API processes my request
**Then** the response streams back using Server-Sent Events (SSE)

**And** streaming begins within 500ms of sending

**And** text appears word-by-word as it generates

**And** the streaming indicator shows while generating

**And** the SSE format follows:
```
data: {"type":"chunk","content":"Based on..."}
data: {"type":"chunk","content":" the policy..."}
data: {"type":"done","conversationId":"...","messageId":"..."}
```

**Given** an error occurs during streaming
**When** the API fails
**Then** I see a user-friendly error message
**And** I can retry sending the message

**Prerequisites:** Story 2.2 (message display)

**Technical Notes:**
- API: `POST /api/ai-buddy/chat`
- Use Edge Runtime for low TTFB
- OpenRouter Claude Sonnet 4.5 via existing integration
- Rate limiting: Check before API call, return AIB_003 if exceeded
- Log to audit: message_sent action with metadata

---

### Story 2.4: AI Buddy Conversation Persistence

**As a** user,
**I want** my conversations saved automatically,
**So that** I can continue them later. (FR5)

**Acceptance Criteria:**

**Given** I start a new conversation
**When** I send my first message
**Then** a new conversation is created in the database

**And** the conversation is assigned an auto-generated title (first 50 chars of first message)

**Given** I return to AI Buddy later
**When** I click on a previous conversation in the sidebar
**Then** the full conversation history loads

**And** I can continue the conversation with full context retained

**And** the AI remembers what was discussed previously

**Given** I have multiple conversations
**When** I view the sidebar
**Then** I see my conversations listed under "Recent" section

**And** conversations are sorted by most recent activity

**Prerequisites:** Story 2.3 (streaming API)

**Technical Notes:**
- Store messages in `ai_buddy_messages` table
- Conversation context: Load last N messages (configurable, default 20)
- Include conversation history in AI prompt for context
- Update `updated_at` timestamp on each new message

---

### Story 2.5: AI Buddy Source Citations

**As a** user,
**I want** AI responses to cite their sources,
**So that** I can verify information and trust the answers. (FR7)

**Acceptance Criteria:**

**Given** AI Buddy references information from an attached document
**When** the response is displayed
**Then** inline citations appear as clickable links: `[📄 Document Name pg. X]`

**And** citations are styled in blue (`#3b82f6`) to indicate interactivity

**And** hovering over a citation shows a tooltip with the quoted text

**Given** I click on a citation
**When** a document is attached to the conversation
**Then** the document preview opens to the cited page/section

**And** the SSE stream includes citation data:
```
data: {"type":"sources","citations":[{"documentId":"...","page":3,"text":"..."}]}
```

**Given** no documents are attached
**When** AI provides general knowledge answers
**Then** no citations are shown (general knowledge doesn't need citations)

**Prerequisites:** Story 2.4 (conversation persistence)

**Technical Notes:**
- Component: `source-citation.tsx`
- Store citations in message `sources` JSONB column
- Citation format: `{ documentId, page, text, startOffset?, endOffset? }`
- Integrate with existing document preview component

---

### Story 2.6: AI Buddy Confidence Indicators

**As a** user,
**I want** to see how confident AI Buddy is in its answers,
**So that** I know when to verify information myself. (FR8)

**Acceptance Criteria:**

**Given** AI Buddy responds to my question
**When** the response is complete
**Then** a confidence badge appears below the response

**And** confidence levels are:
- **High Confidence** (green badge): Information found in attached documents
- **Needs Review** (amber badge): Based on general knowledge, verify before using
- **Not Found** (gray badge): Information not available in context

**And** the badge includes a brief explanation on hover:
- High: "This answer is based on your attached documents"
- Medium: "This is general guidance - please verify for your specific situation"
- Low: "I couldn't find this information in your documents"

**And** the SSE stream includes confidence data:
```
data: {"type":"confidence","level":"high"}
```

**Prerequisites:** Story 2.5 (source citations)

**Technical Notes:**
- Component: `confidence-badge.tsx`
- Store confidence in message `confidence` column
- Colors from UX Design: High `#dcfce7/#166534`, Medium `#fef3c7/#92400e`
- AI determines confidence based on RAG retrieval score

---

### Story 2.7: AI Buddy Guardrail-Aware Responses

**As a** user,
**I want** AI Buddy to stay within agency guidelines invisibly,
**So that** I get helpful responses without feeling restricted. (FR9, FR10)

**Acceptance Criteria:**

**Given** I ask about a restricted topic (configured by admin)
**When** AI Buddy responds
**Then** AI provides a helpful redirection WITHOUT saying "I cannot" or "blocked"

**And** the response guides me toward appropriate alternatives

**Example:** Instead of "I cannot provide legal advice", AI says:
"For questions about policy interpretation and legal implications, I'd recommend consulting with your agency's legal counsel. I can help you find the relevant policy language to discuss with them."

**Given** I ask a question AI cannot answer
**When** AI doesn't have sufficient information
**Then** AI responds with "I don't know" rather than making up an answer (FR9)

**And** AI suggests what information would help answer the question

**Given** guardrails are enforced
**When** the conversation is logged
**Then** audit log includes `guardrailsApplied` metadata (admin-visible only)

**Prerequisites:** Story 2.6 (confidence indicators)

**Technical Notes:**
- Guardrail enforcement via system prompt injection (see Architecture)
- Load agency guardrails from `ai_buddy_guardrails` table
- Use `prompt-builder.ts` to construct system prompt with guardrails
- Never expose guardrail configuration to users in responses
- Log guardrail events to audit log with action `guardrail_applied`

---

## Epic 3: AI Buddy Projects

**Goal:** Enable users to organize their work by client accounts using Projects with persistent document context.

**FRs Covered:** FR3, FR4, FR6, FR11-19

**User Value:** Users can organize conversations by client account, matching how insurance agents naturally work.

**Stories:** 6 stories (merged from original 9 for implementation efficiency)

---

### Story 3.1: Project Creation & Sidebar (FR11, FR17)

*Merged from original stories 3.1 + 3.2*

**As a** user,
**I want** to create Projects and see them in a sidebar,
**So that** I can organize my work by client and switch between them easily.

**Acceptance Criteria:**

**Project Creation (FR11):**

**Given** I am on the AI Buddy page
**When** I click "New Project" in the sidebar
**Then** a dialog opens asking for project name and optional description

**And** name is required (max 100 characters)

**And** description is optional (max 500 characters)

**And** clicking "Create" creates the project and selects it

**And** the new project appears in the sidebar under "Projects"

**Given** I try to create a project with no name
**When** I click "Create"
**Then** I see a validation error "Project name is required"

**Project Sidebar (FR17):**

**Given** I have created Projects
**When** I view the sidebar
**Then** I see a "Projects" section listing all my active projects

**And** each project shows:
- Project name (truncated at 25 chars)
- Document count badge (e.g., "3 docs")
- Active indicator when selected

**And** projects are sorted alphabetically

**And** clicking a project switches to that project's context

**Given** I have no projects
**When** I view the sidebar
**Then** I see an empty state: "Create your first project to organize by client"

**And** mobile: Sidebar rendered in Sheet overlay

**Prerequisites:** Story 2.7 (core chat complete)

**Technical Notes:**
- Components: `project-create-dialog.tsx`, `project-sidebar.tsx`, `project-card.tsx`
- API: `POST /api/ai-buddy/projects`
- Hook: `use-projects.ts` for data fetching with React Query
- Store in `ai_buddy_projects` table
- Auto-select new project after creation (optimistic update)

---

### Story 3.2: Project Context Switching (FR16)

**As a** user,
**I want** conversations within a Project to have access to project documents,
**So that** AI can answer questions about my client's policies.

**Acceptance Criteria:**

**Given** I have a Project with attached documents
**When** I start a conversation in that Project
**Then** AI Buddy automatically has context of all project documents

**And** I can ask questions about documents without re-uploading

**And** the header shows "AI Buddy · [Project Name]" to indicate context

**Given** I switch to a different Project
**When** I ask a question
**Then** AI uses the new project's document context

**And** previous project's documents are no longer in context

**Given** I start a conversation outside any Project
**When** I ask a question
**Then** AI responds with general knowledge (no document context)

**And** the header shows "AI Buddy" without a project name

**And** context switch completes in < 200ms (perceived)

**Prerequisites:** Story 3.1 (project creation & sidebar)

**Technical Notes:**
- Components: `project-context-header.tsx`, update `chat-panel.tsx`
- Hook: `use-active-project.ts`
- Pass project_id to chat API
- Load project documents via `ai_buddy_project_documents` junction
- Include document content in RAG pipeline

---

### Story 3.3: Project Management - Rename & Archive (FR12)

**As a** user,
**I want** to rename and archive Projects,
**So that** I can keep my workspace organized.

**Acceptance Criteria:**

**Given** I right-click on a project in the sidebar
**When** I select "Rename"
**Then** the project name becomes editable inline

**And** pressing Enter saves the new name

**And** pressing Escape cancels the edit

**Given** I right-click on a project
**When** I select "Archive"
**Then** I see a confirmation dialog "Archive [Project Name]?"

**And** confirming moves the project to archived state

**And** archived projects no longer appear in the main list

**Given** I want to see archived projects
**When** I click "View Archived" at the bottom of Projects section
**Then** I see a list of archived projects

**And** I can restore an archived project (clears `archived_at`)

**Prerequisites:** Story 3.1 (project creation & sidebar)

**Technical Notes:**
- Extend `project-card.tsx` with context menu
- API: `PATCH /api/ai-buddy/projects/[id]` for rename
- API: `DELETE /api/ai-buddy/projects/[id]` sets `archived_at`
- Soft delete pattern - never hard delete projects
- Use shadcn/ui ContextMenu for right-click options

---

### Story 3.4: Conversation History & General Chat (FR3, FR18)

*Merged from original stories 3.5 + 3.8*

**As a** user,
**I want** to see my conversation history and start general chats,
**So that** I can find past conversations and ask quick questions.

**Acceptance Criteria:**

**Conversation History (FR3):**

**Given** I have had multiple conversations
**When** I view the sidebar "Recent" section
**Then** I see my recent conversations grouped by:
- Today
- Yesterday
- Previous 7 days
- Older

**And** each conversation shows:
- Auto-generated title (first message excerpt)
- Project name (if associated)
- Relative timestamp

**And** clicking a conversation loads it in the chat area

**Given** I am viewing a Project
**When** I look at the sidebar
**Then** I see conversations filtered to that Project only

**And** maximum 50 conversations loaded, with "Load more" pagination

**General Chat (FR18):**

**Given** I click "New Chat" in the sidebar
**When** no project is selected
**Then** I start a general conversation (not associated with any project)

**And** the header shows "AI Buddy" without a project name

**And** I can still attach documents to this specific conversation

**And** `project_id` is NULL for general conversations

**And** general conversations appear in "Recent" but not under any project

**Prerequisites:** Story 3.1 (project creation & sidebar)

**Technical Notes:**
- Component: `chat-history-item.tsx`
- Extend `use-conversations.ts` hook
- Group by date using date-fns
- Filter by project_id when project is selected
- `project_id` is nullable in conversations table

---

### Story 3.5: Conversation Search (FR4)

**As a** user,
**I want** to search across my conversations,
**So that** I can find past discussions quickly.

**Acceptance Criteria:**

**Given** I am on the AI Buddy page
**When** I press Cmd/Ctrl+K or click the search icon
**Then** a search dialog opens with a text input

**And** I can type keywords to search

**Given** I type a search query
**When** results are found
**Then** I see matching conversations listed with:
- Conversation title
- Matching text snippet (highlighted)
- Project name
- Date

**And** clicking a result opens that conversation

**And** results return within 1 second

**Given** no results match my query
**When** search completes
**Then** I see "No conversations found for '[query]'"

**And** I can clear the search to return to normal view

**And** search uses PostgreSQL full-text search (`tsvector`, `ts_rank`)

**Prerequisites:** Story 3.4 (conversation history)

**Technical Notes:**
- Component: `conversation-search.tsx`
- Hook: `use-conversation-search.ts`
- Use PostgreSQL full-text search on `ai_buddy_messages.content`
- API: `GET /api/ai-buddy/conversations?search=query`
- Component: Search dialog using shadcn/ui Command component
- Index: `idx_messages_content_fts` GIN index
- Debounce search input (300ms)

---

### Story 3.6: Conversation Management - Delete & Move (FR6, FR19)

*Merged from original stories 3.7 + 3.9*

**As a** user,
**I want** to delete conversations and move them between projects,
**So that** I can keep my history clean and organized.

**Acceptance Criteria:**

**Delete Conversations (FR6):**

**Given** I am viewing a conversation
**When** I click the menu icon and select "Delete"
**Then** I see a confirmation dialog "Delete this conversation?"

**And** confirming sets `deleted_at` (soft delete)

**And** deleted conversation no longer visible to user

**And** I am returned to the AI Buddy home (empty state or last project)

**And** audit log records deletion event with `conversation_deleted` action

**Move Conversation to Project (FR19):**

**Given** I have a conversation (general or in another project)
**When** I click menu → "Move to Project"
**Then** I see a list of my projects to choose from

**And** selecting a project updates conversation's `project_id`

**And** the conversation now appears under that project's history

**And** toast shows "Moved to [Project Name]" confirmation

**Given** I move a conversation to a project
**When** the move completes
**Then** future messages in that conversation have project document context

**And** the header updates to show the project name

**And** can move from project to "No Project" (general chat)

**Prerequisites:** Story 3.1 (project creation), Story 3.4 (conversation history)

**Technical Notes:**
- Extend conversation menu
- API: `DELETE /api/ai-buddy/conversations/[id]` - soft delete with `deleted_at`
- API: `PATCH /api/ai-buddy/conversations/[id]` with `project_id`
- RLS policy hides deleted conversations from user queries
- Moving doesn't retroactively change past messages
- Future messages get project context

---

## Epic 4: AI Buddy Document Intelligence

**Goal:** Enable document upload, processing, and AI-powered document context for accurate, sourced answers.

**FRs Covered:** FR20-25, FR65, FR66

**User Value:** AI can answer questions about user's specific policies, quotes, and applications.

---

### Story 4.1: AI Buddy Document Upload to Conversation

**As a** user,
**I want** to attach documents to a conversation,
**So that** AI can answer questions about them immediately. (FR20)

**Acceptance Criteria:**

**Given** I am in a conversation
**When** I click the attach button (📎) in the input area
**Then** a file picker opens for PDF and image files

**And** I can select one or more files (max 5 at once)

**And** selected files show as pending attachments above the input

**Given** I send a message with attachments
**When** the message is sent
**Then** documents are uploaded and processing begins

**And** I see upload progress for each file

**And** once processed, AI can reference the documents in its response

**Given** I drag files onto the chat area
**When** I drop them
**Then** files are attached to the current message (same as attach button)

**Prerequisites:** Epic 3 complete (projects)

**Technical Notes:**
- Reuse existing docuMINE document upload pipeline
- Store conversation-document link in messages or separate table
- Supported formats: PDF, PNG, JPG, JPEG
- Max file size: 50MB per file
- Process via existing LlamaParse integration

---

### Story 4.2: AI Buddy Document Upload to Project

**As a** user,
**I want** to upload documents to a Project for persistent availability,
**So that** all conversations in that project can reference them. (FR21)

**Acceptance Criteria:**

**Given** I am viewing a Project
**When** I click "Add Document" in the document panel
**Then** I can upload documents that persist for the entire project

**And** uploaded documents appear in the project's document list

**And** all conversations in this project can reference these documents

**Given** I upload a document to a project
**When** the upload completes
**Then** the document is available for AI context immediately

**And** document count badge updates in sidebar

**Prerequisites:** Story 4.1 (conversation upload)

**Technical Notes:**
- Store in `ai_buddy_project_documents` junction table
- Reuse existing document storage (Supabase Storage)
- Documents are shared across all project conversations
- Remove duplicates if same document uploaded twice

---

### Story 4.3: AI Buddy Document Processing Status

**As a** user,
**I want** to see document processing status,
**So that** I know when documents are ready for AI queries. (FR24)

**Acceptance Criteria:**

**Given** I upload a document
**When** processing begins
**Then** I see a status indicator: "Uploading..." → "Processing..." → "Ready"

**And** each status has an appropriate icon (upload, spinner, checkmark)

**And** processing typically completes within 30 seconds for standard PDFs

**Given** document processing fails
**When** an error occurs
**Then** I see "Failed" status with error message

**And** I can retry the upload

**Given** I view a project's documents
**When** some are still processing
**Then** I see which documents are ready vs. still processing

**Prerequisites:** Story 4.2 (project upload)

**Technical Notes:**
- Reuse existing document processing status from docuMINE
- Poll for status updates or use Supabase Realtime
- Status stored in documents table
- Show progress percentage if available

---

### Story 4.4: AI Buddy Document Preview

**As a** user,
**I want** to preview attached documents within AI Buddy,
**So that** I can reference them while chatting. (FR23)

**Acceptance Criteria:**

**Given** I click on a document in the document panel
**When** the preview opens
**Then** I see the document content in a modal or side panel

**And** I can navigate pages (for multi-page PDFs)

**And** I can zoom in/out

**And** I can close the preview to return to chat

**Given** AI cites a specific page
**When** I click the citation
**Then** the preview opens to that specific page

**And** the cited text is highlighted if possible

**Prerequisites:** Story 4.3 (processing status)

**Technical Notes:**
- Reuse existing document preview component from docuMINE
- Pass page number from citation to open at correct location
- Mobile: Preview opens as full-screen modal
- Desktop: Can open in right panel alongside chat

---

### Story 4.5: AI Buddy Multi-Document Context

**As a** user,
**I want** AI to reference multiple documents in a single conversation,
**So that** I can compare or synthesize information. (FR25)

**Acceptance Criteria:**

**Given** I have multiple documents attached (to conversation or project)
**When** I ask a question that spans documents
**Then** AI can reference and synthesize information from all documents

**And** citations indicate which document each piece came from

**Example:** "Compare the liability limits" → AI shows limits from Policy A and Policy B

**Given** I have many documents (>10)
**When** I ask a question
**Then** AI intelligently retrieves relevant documents (not all of them)

**And** response time remains reasonable (< 5 seconds)

**Prerequisites:** Story 4.4 (document preview)

**Technical Notes:**
- RAG retrieval across multiple documents
- Chunk and embed documents for semantic search
- Top-K retrieval (configurable, default K=5 chunks)
- Include document name in citation for disambiguation

---

### Story 4.6: AI Buddy Remove Project Documents

**As a** user,
**I want** to remove documents from a Project,
**So that** I can keep project context relevant. (FR14)

**Acceptance Criteria:**

**Given** I view a project's document list
**When** I click the remove button (X) on a document
**Then** I see a confirmation "Remove document from project?"

**And** confirming removes the document from project context

**And** the document is no longer used for AI responses in this project

**Given** I remove a document
**When** it's removed
**Then** existing conversations that referenced it keep their citations

**And** new conversations won't have access to that document

**Prerequisites:** Story 4.5 (multi-document)

**Technical Notes:**
- Delete from `ai_buddy_project_documents` junction table
- Don't delete the actual document (may be used elsewhere)
- Historical citations remain valid (link to original document)

---

### Story 4.7: AI Buddy docuMINE Document Integration

**As a** user,
**I want** to access documents I've uploaded to docuMINE in AI Buddy,
**So that** I don't have to re-upload files. (FR65, FR66)

**Acceptance Criteria:**

**Given** I have documents in my docuMINE document library
**When** I click "Add Document" in AI Buddy project
**Then** I see an option to "Select from Library" in addition to "Upload New"

**And** selecting "from Library" shows my existing docuMINE documents

**And** I can search/filter my document library

**Given** I select a document from my library
**When** I add it to a project
**Then** the document is linked (not duplicated)

**And** AI can reference it immediately (already processed)

**Given** I used Document Comparison on a set of documents
**When** I add those documents to an AI Buddy project
**Then** AI can reference the comparison analysis context

**Prerequisites:** Story 4.6 (remove documents)

**Technical Notes:**
- Query existing `documents` table for user's documents
- Link via `ai_buddy_project_documents` without duplicating storage
- Include any existing RAG embeddings
- FR66: Consider storing comparison results for AI context

---

## Epic 5: AI Buddy Personalization & Onboarding

**Goal:** Create a personalized AI experience that learns user preferences from first interaction.

**FRs Covered:** FR26-32, FR57-62

**User Value:** AI Buddy knows the user and their preferences, making every interaction more relevant.

---

### Story 5.1: AI Buddy Onboarding Flow

**As a** new user,
**I want** a quick personalization flow when I first use AI Buddy,
**So that** AI is helpful from the start. (FR57, FR58)

**Acceptance Criteria:**

**Given** I access AI Buddy for the first time
**When** the page loads
**Then** I see a welcome modal: "Welcome to AI Buddy - Let's personalize your experience"

**And** the flow has 3 steps with progress indicator

**Step 1 - Your Info:**
- Display name (pre-filled from account if available)
- Role dropdown (Producer, CSR, Manager, Other)

**Step 2 - Lines of Business:**
- Chip selection: Personal Auto, Homeowners, Commercial, Life, Health, Other
- Multi-select allowed

**Step 3 - Preferred Carriers:**
- Chip selection with common carriers
- Can type to add custom carriers
- Multi-select allowed

**And** the entire flow takes < 2 minutes

**And** clicking "Get Started" completes onboarding and shows AI Buddy

**Prerequisites:** Epic 4 complete (document intelligence)

**Technical Notes:**
- Component: `onboarding-flow.tsx`, `chip-select.tsx`, `progress-steps.tsx`
- Store preferences in `users.ai_buddy_preferences` JSONB
- Set `onboarding_completed: true` when done
- Track onboarding completion in analytics

---

### Story 5.2: AI Buddy Skip Onboarding

**As a** user,
**I want** to skip onboarding and set preferences later,
**So that** I can start using AI Buddy immediately. (FR61)

**Acceptance Criteria:**

**Given** I see the onboarding modal
**When** I click "Skip for now" link at the bottom
**Then** the modal closes and I can use AI Buddy

**And** my preferences are set to defaults

**And** I see a subtle prompt: "Set your preferences in Settings for a better experience"

**Given** I skipped onboarding
**When** I go to Settings → AI Buddy
**Then** I can complete personalization there

**And** completing settings marks onboarding as done

**Prerequisites:** Story 5.1 (onboarding flow)

**Technical Notes:**
- Default preferences: empty arrays for LOB/carriers, 'professional' style
- `onboarding_completed: false` when skipped
- Settings page shows onboarding completion status
- Consider showing onboarding prompt again after 3 sessions if not completed

---

### Story 5.3: AI Buddy User Preferences Management

**As a** user,
**I want** to manage my AI Buddy preferences in Settings,
**So that** I can update my information over time. (FR26-30)

**Acceptance Criteria:**

**Given** I navigate to Settings → AI Buddy tab
**When** I view my preferences
**Then** I see editable fields for:
- Display name (FR26)
- Role (FR26)
- Lines of business (FR27) - multi-select chips
- Favorite carriers (FR28) - multi-select with search
- Communication style (FR30) - Professional / Casual toggle

**And** changes save automatically (no save button needed)

**And** I see a success toast when preferences update

**Given** I change my lines of business
**When** I return to AI Buddy
**Then** AI incorporates my updated preferences in responses

**Prerequisites:** Story 5.2 (skip onboarding)

**Technical Notes:**
- API: `GET/PATCH /api/ai-buddy/preferences`
- Store in `users.ai_buddy_preferences` JSONB
- Use debounced auto-save (500ms after last change)
- Add AI Buddy tab to existing Settings page

---

### Story 5.4: AI Buddy Agency Information

**As a** user,
**I want** to set my agency information,
**So that** AI understands my agency context. (FR29)

**Acceptance Criteria:**

**Given** I am in Settings → AI Buddy
**When** I view agency information section
**Then** I see:
- Agency name (text input)
- States licensed (multi-select state picker)
- Agency appointments (carrier list, may be admin-managed)

**And** agency name and states are editable by user

**And** carrier appointments may be view-only (set by admin) or editable

**Given** I set my licensed states
**When** I ask AI about state-specific regulations
**Then** AI considers my licensed states in responses

**Example:** "What are the auto insurance requirements?" → AI asks which state or shows info for my licensed states

**Prerequisites:** Story 5.3 (preferences management)

**Technical Notes:**
- Agency info may be shared across all users in agency
- Some fields may require admin permission to edit
- States: Use ISO 3166-2:US state codes
- Pre-populate from existing agency data if available

---

### Story 5.5: AI Buddy Preference-Aware Responses

**As a** user,
**I want** AI to incorporate my preferences into responses,
**So that** answers are tailored to my context. (FR31)

**Acceptance Criteria:**

**Given** I have set my communication style to "Professional"
**When** AI responds
**Then** responses use formal language, complete sentences, no casual expressions

**Given** I have set my communication style to "Casual"
**When** AI responds
**Then** responses are conversational, may use contractions, friendly tone

**Given** I have set my favorite carriers
**When** AI suggests carriers for a risk
**Then** AI prioritizes my favorite carriers in suggestions

**Given** I have set my lines of business
**When** I ask general questions
**Then** AI defaults to my preferred lines for examples

**Prerequisites:** Story 5.4 (agency information)

**Technical Notes:**
- Include preferences in system prompt via `prompt-builder.ts`
- Preference prompt section: "The user prefers [style] communication..."
- Don't override specific user requests (if user asks for formal, use formal)

---

### Story 5.6: AI Buddy Reset Preferences

**As a** user,
**I want** to reset my preferences to defaults,
**So that** I can start fresh if needed. (FR32)

**Acceptance Criteria:**

**Given** I am in Settings → AI Buddy
**When** I click "Reset to Defaults"
**Then** I see a confirmation dialog "Reset all AI Buddy preferences?"

**And** confirming resets all preferences to default values

**And** I see confirmation toast "Preferences reset to defaults"

**Given** I reset preferences
**When** I return to AI Buddy
**Then** AI behaves as if I were a new user (without triggering onboarding again)

**Prerequisites:** Story 5.5 (preference-aware responses)

**Technical Notes:**
- Default values defined in constants
- Keep `onboarding_completed: true` after reset
- Reset: LOB=[], carriers=[], style='professional', name unchanged
- Log preference reset to audit log

---

### Story 5.7: AI Buddy Guided First Conversation

**As a** new user,
**I want** a guided first conversation after onboarding,
**So that** I understand AI Buddy's capabilities. (FR59, FR60)

**Acceptance Criteria:**

**Given** I complete onboarding
**When** AI Buddy loads
**Then** AI starts with a personalized greeting:
"Hi [Name]! I see you work in [LOB]. I'm here to help with insurance questions, policy analysis, and more. Try asking me something like '[suggestion based on LOB]'."

**And** AI provides 3 suggested questions based on my preferences:
- LOB-specific question
- General insurance question
- Document-related question

**And** clicking a suggestion populates the input

**Given** I ask my first question
**When** AI responds
**Then** response is tailored to my preferences and demonstrates capabilities

**Prerequisites:** Story 5.6 (reset preferences)

**Technical Notes:**
- Suggestion templates based on LOB:
  - Personal Auto: "What coverages should I recommend for a new driver?"
  - Commercial: "What are the key differences between occurrence and claims-made?"
  - Life: "How do I explain term vs. whole life to a client?"
- Store suggested questions in config, not hardcoded

---

### Story 5.8: AI Buddy Admin Onboarding Status

**As an** admin,
**I want** to see onboarding completion status for my users,
**So that** I can ensure my team is set up. (FR62)

**Acceptance Criteria:**

**Given** I am an admin viewing the user list
**When** I see the AI Buddy column
**Then** I see onboarding status for each user:
- ✓ Completed (green)
- ○ Not started (gray)
- ◐ Skipped (yellow)

**And** I can filter users by onboarding status

**Given** a user hasn't completed onboarding
**When** I click on their status
**Then** I see option to send them a reminder email (future feature)

**Prerequisites:** Story 5.7 (guided first conversation)

**Technical Notes:**
- Query `users.ai_buddy_preferences.onboarding_completed`
- Add column to existing admin user management table
- Status: completed (true), skipped (false but used AI Buddy), not_started (null)

---

## Epic 6: AI Buddy Guardrails & Compliance

**Goal:** Enable admin-controlled guardrails that enforce compliance while remaining invisible to users.

**FRs Covered:** FR35-41

**User Value:** Principals can protect their agency from E&O exposure while producers get helpful AI assistance.

---

### Story 6.1: AI Buddy Restricted Topics Configuration

**As an** admin,
**I want** to define topics AI should not discuss,
**So that** I can protect my agency from liability. (FR35)

**Acceptance Criteria:**

**Given** I am an admin in Settings → AI Buddy → Guardrails
**When** I view the "Restricted Topics" section
**Then** I see a list of currently restricted topics (if any)

**And** I can add new topics using a text input + "Add" button

**And** each topic shows:
- Topic name/trigger phrase
- Optional redirect guidance (how AI should respond instead)
- Delete button

**Given** I add a restricted topic
**When** I enter "legal advice" and click Add
**Then** the topic appears in the list

**And** I can optionally add redirect guidance: "Recommend consulting an attorney"

**Given** I save guardrail changes
**When** producers use AI Buddy
**Then** AI avoids the topic and uses redirect guidance

**Prerequisites:** Epic 5 complete (personalization)

**Technical Notes:**
- Store in `ai_buddy_guardrails.restricted_topics` JSONB array
- Format: `[{ trigger: "legal advice", redirect: "Recommend consulting..." }]`
- Component: `topic-tag-list.tsx`
- Suggest common topics: "Legal advice", "Claims filing", "Binding authority"

---

### Story 6.2: AI Buddy Guardrail Rules Toggle

**As an** admin,
**I want** to enable/disable guardrail rules,
**So that** I can customize AI behavior for my agency. (FR36)

**Acceptance Criteria:**

**Given** I am in Guardrails settings
**When** I view available guardrail rules
**Then** I see toggles for:
- E&O Disclaimer (enabled by default)
- AI Disclosure Message (enabled by default)
- Restricted Topics Enforcement (enabled by default)

**And** each toggle has a description explaining its effect

**Given** I toggle a guardrail off
**When** the change saves
**Then** that guardrail is no longer enforced

**And** I see a warning for disabling E&O disclaimer: "Disabling may increase liability exposure"

**Prerequisites:** Story 6.1 (restricted topics)

**Technical Notes:**
- Store boolean flags in `ai_buddy_guardrails` table
- Component: `guardrail-toggle.tsx`
- Default all guardrails to enabled
- Log guardrail toggle changes to audit log

---

### Story 6.3: AI Buddy Immediate Guardrail Effect

**As an** admin,
**I want** guardrail changes to take effect immediately,
**So that** I can respond to compliance issues quickly. (FR37)

**Acceptance Criteria:**

**Given** I change a guardrail setting
**When** I save the change
**Then** the change applies to all producers immediately (no delay)

**And** current conversations begin using new guardrails

**And** I see confirmation: "Guardrails updated - effective immediately for all users"

**Given** a producer is mid-conversation
**When** I update guardrails
**Then** their next message uses the new guardrail configuration

**Prerequisites:** Story 6.2 (guardrail toggles)

**Technical Notes:**
- No caching of guardrails - load fresh on each API call
- Or use short TTL cache (30 seconds) with invalidation
- Consider Supabase Realtime for instant propagation
- Update `updated_at` timestamp on guardrails table

---

### Story 6.4: AI Buddy Guardrail Enforcement Logging

**As an** admin,
**I want** guardrail enforcement events logged,
**So that** I have a compliance audit trail. (FR38)

**Acceptance Criteria:**

**Given** a guardrail prevents a direct answer
**When** AI provides a redirected response
**Then** an audit log entry is created with:
- Timestamp
- User ID
- Conversation ID
- Guardrail type triggered (restricted_topic, eando, etc.)
- Original query (for context)
- Redirected response summary

**And** this log is visible only to admins in the audit log

**Given** I view the audit log
**When** I filter by "Guardrail Events"
**Then** I see all guardrail enforcement events

**And** I can see patterns (which topics trigger most often, which users)

**Prerequisites:** Story 6.3 (immediate effect)

**Technical Notes:**
- Log action: `guardrail_triggered`
- Metadata: `{ guardrailType, trigger, userId, conversationId }`
- Don't log full message content (privacy)
- Aggregate stats for admin dashboard

---

### Story 6.5: AI Buddy Invisible Guardrail Responses

**As a** producer,
**I want** helpful responses even when guardrails apply,
**So that** I never feel blocked or restricted. (FR39)

**Acceptance Criteria:**

**Given** I ask about a restricted topic
**When** AI responds
**Then** AI NEVER says:
- "I cannot..."
- "I'm not allowed..."
- "This topic is restricted..."
- "My guardrails prevent..."

**And** AI ALWAYS provides a helpful alternative:
- Redirects to appropriate resource
- Suggests a different approach
- Offers related information it CAN provide

**Example restricted topic: "legal advice"**
- User: "Is my client legally liable for this accident?"
- AI: "Coverage and liability are closely related! I can help you review the policy language around liability coverage. For specific legal liability questions, your agency's legal counsel would be the best resource. Would you like me to find the relevant policy sections?"

**Prerequisites:** Story 6.4 (enforcement logging)

**Technical Notes:**
- Guardrail handling is entirely in system prompt
- See Architecture "Novel Pattern: Invisible Guardrails"
- Test each restricted topic for natural-sounding redirects
- Redirect guidance is used as hint, AI generates natural response

---

### Story 6.6: AI Buddy AI Disclosure Message

**As an** admin,
**I want** to display an AI disclosure message,
**So that** we comply with state chatbot disclosure laws. (FR40, FR41)

**Acceptance Criteria:**

**Given** AI disclosure is enabled (default)
**When** a user starts a conversation
**Then** they see a disclosure message:
"You're chatting with AI Buddy, an AI assistant. While I strive for accuracy, please verify important information."

**And** the message appears once per session (not every conversation)

**And** the message is dismissible

**Given** I am an admin
**When** I go to Guardrails settings
**Then** I can customize the disclosure message text (FR41)

**And** I see preview of how it will appear

**Given** AI disclosure is disabled
**When** users chat
**Then** no disclosure message appears (admin's compliance decision)

**Prerequisites:** Story 6.5 (invisible guardrails)

**Technical Notes:**
- Store custom message in `ai_buddy_guardrails.ai_disclosure_message`
- If null, use default message
- Track dismissal in session storage
- Some states require disclosure (Maine, Utah) - admin responsibility

---

## Epic 7: AI Buddy Admin & Audit

**Goal:** Provide admins with user management, usage analytics, and complete audit trail for compliance.

**FRs Covered:** FR42-56, FR64

**User Value:** Principals have full visibility and control over their agency's AI usage.

---

### Story 7.1: AI Buddy Admin User List

**As an** admin,
**I want** to view all users in my agency,
**So that** I can manage AI Buddy access. (FR42)

**Acceptance Criteria:**

**Given** I am an admin in Settings → Users
**When** I view the user list
**Then** I see all agency users with:
- Name
- Email
- Role (Producer/Admin/Owner)
- AI Buddy status (Active/Onboarding pending)
- Last active date

**And** I can sort by any column

**And** I can search users by name or email

**Given** I have many users (>20)
**When** I view the list
**Then** pagination is available (20 per page)

**Prerequisites:** Epic 6 complete (guardrails)

**Technical Notes:**
- Extend existing user management if available
- Add AI Buddy-specific columns
- Query with agency_id filter (RLS)
- Show only users with AI Buddy access (if feature-gated)

---

### Story 7.2: AI Buddy Invite Users

**As an** admin,
**I want** to invite new users to my agency,
**So that** my team can use AI Buddy. (FR43)

**Acceptance Criteria:**

**Given** I am in the user management section
**When** I click "Invite User"
**Then** I see a form with:
- Email address (required)
- Role selection (Producer/Admin)
- Send invite checkbox (default checked)

**And** clicking "Send Invite" sends an email invitation

**Given** an invitation is sent
**When** the invitee clicks the link
**Then** they can set up their account

**And** they're added to my agency with the selected role

**Given** I invite someone who already has an account
**When** I send the invite
**Then** I see an error: "This email is already registered"

**Prerequisites:** Story 7.1 (user list)

**Technical Notes:**
- Use Supabase Auth invite functionality
- Store pending invites with expiration (7 days)
- Email template includes agency name and inviter
- May extend existing invite flow if available

---

### Story 7.3: AI Buddy Remove Users

**As an** admin,
**I want** to remove users from my agency,
**So that** I can manage team changes. (FR44)

**Acceptance Criteria:**

**Given** I view a user in the list
**When** I click "Remove User"
**Then** I see confirmation: "Remove [Name] from agency?"

**And** the dialog explains: "They will lose access to AI Buddy and all agency data"

**Given** I confirm removal
**When** the user is removed
**Then** they can no longer access AI Buddy for this agency

**And** their conversations remain in audit logs (compliance)

**And** their personal data is handled per privacy policy

**Given** I try to remove the owner
**When** I click Remove
**Then** I see error: "Cannot remove agency owner. Transfer ownership first."

**Prerequisites:** Story 7.2 (invite users)

**Technical Notes:**
- Soft delete user-agency relationship
- Keep audit logs intact
- Remove from `ai_buddy_permissions`
- Notify user via email of removal

---

### Story 7.4: AI Buddy Change User Roles

**As an** admin,
**I want** to change user roles,
**So that** I can promote producers to admins. (FR45)

**Acceptance Criteria:**

**Given** I view a user in the list
**When** I click on their role dropdown
**Then** I can select: Producer, Admin

**And** changing role takes effect immediately

**And** I see confirmation: "[Name] is now an Admin"

**Given** I try to demote myself (last admin)
**When** I select Producer
**Then** I see error: "Agency must have at least one admin"

**Given** the user is the Owner
**When** I view their role
**Then** it shows "Owner (cannot change)" - not editable

**Prerequisites:** Story 7.3 (remove users)

**Technical Notes:**
- Update `ai_buddy_permissions` table
- Producer permissions: use_ai_buddy, manage_own_projects
- Admin adds: manage_users, configure_guardrails, view_audit_logs
- Validate at least one admin always exists

---

### Story 7.5: AI Buddy Usage Analytics

**As an** admin,
**I want** to view usage analytics,
**So that** I understand how my team uses AI Buddy. (FR46)

**Acceptance Criteria:**

**Given** I am an admin in Settings → AI Buddy → Analytics
**When** I view the analytics dashboard
**Then** I see summary cards:
- Total conversations (this month)
- Active users (this month)
- Documents uploaded (this month)
- Messages sent (this month)

**And** I can see breakdown by user:
- Conversations per user
- Messages per user
- Documents uploaded per user

**And** I can select date range (This week, This month, Last 30 days, Custom)

**Prerequisites:** Story 7.4 (change roles)

**Technical Notes:**
- Query aggregates from `ai_buddy_conversations`, `ai_buddy_messages`
- Component: `usage-stat-card.tsx`
- Consider caching daily aggregates for performance
- Don't show message content (privacy)

---

### Story 7.6: AI Buddy Usage Dashboard Trends

**As an** admin,
**I want** to see usage trends over time,
**So that** I can track adoption and identify patterns. (FR47)

**Acceptance Criteria:**

**Given** I view the analytics dashboard
**When** I scroll to the trends section
**Then** I see a line chart showing:
- Daily active users over past 30 days
- Daily conversations over past 30 days

**And** I can toggle between metrics

**And** I can hover to see exact values per day

**Given** I want to export data
**When** I click "Export"
**Then** I can download usage data as CSV

**Prerequisites:** Story 7.5 (usage analytics)

**Technical Notes:**
- Use a lightweight charting library (recharts recommended)
- Aggregate data by day for chart
- CSV export includes: date, active_users, conversations, messages
- Cache trend data (regenerate daily)

---

### Story 7.7: AI Buddy Audit Log View

**As an** admin,
**I want** to view the audit log of all conversations,
**So that** I can review AI interactions for compliance. (FR50, FR51)

**Acceptance Criteria:**

**Given** I am an admin in Settings → AI Buddy → Audit Log
**When** I view the audit log
**Then** I see a table of conversation entries:
- Date/Time
- User name
- Project name (if any)
- Conversation title
- Message count
- Guardrail events (badge count if any)

**And** entries are sorted by most recent first

**And** I can filter by:
- User (dropdown)
- Date range (date pickers)
- Search keyword (searches message content)
- Has guardrail events (checkbox)

**And** results update as I change filters

**Prerequisites:** Story 7.6 (usage dashboard)

**Technical Notes:**
- Component: `audit-log-table.tsx`
- API: `GET /api/ai-buddy/admin/audit-logs`
- Pagination: 25 entries per page
- Full-text search on messages for keyword filter
- Only admins can access (RLS + permission check)

---

### Story 7.8: AI Buddy Audit Log Transcript View

**As an** admin,
**I want** to view full conversation transcripts,
**So that** I can review specific interactions. (FR52)

**Acceptance Criteria:**

**Given** I click on an audit log entry
**When** the transcript opens
**Then** I see the full conversation in read-only format:
- All messages in chronological order
- User and AI messages clearly distinguished
- Timestamps for each message
- Source citations shown (if any)
- Guardrail events highlighted (if any)

**And** I cannot edit or delete any content

**And** I can scroll through the entire conversation

**Given** a guardrail was triggered
**When** I view that message
**Then** I see a subtle indicator: "Guardrail: [type]" (admin-only)

**Prerequisites:** Story 7.7 (audit log view)

**Technical Notes:**
- Open in modal or slide-out panel
- Load all messages for conversation
- Guardrail events from audit log metadata
- Export button for this specific conversation

---

### Story 7.9: AI Buddy Audit Log Export

**As an** admin,
**I want** to export audit logs,
**So that** I can provide records for regulatory review. (FR53)

**Acceptance Criteria:**

**Given** I am viewing the audit log
**When** I click "Export"
**Then** I see options:
- Export current view (filtered results)
- Export all (full history)
- Format: PDF or CSV

**Given** I select PDF export
**When** the export completes
**Then** I receive a formatted PDF with:
- Agency name and export date
- Summary statistics
- Conversation list with transcripts
- Guardrail events flagged

**Given** I select CSV export
**When** the export completes
**Then** I receive a CSV with columns:
- timestamp, user_email, user_name, project_name, message_role, message_content, sources, confidence, guardrail_events

**Prerequisites:** Story 7.8 (transcript view)

**Technical Notes:**
- API: `GET /api/ai-buddy/admin/audit-logs/export?format=pdf|csv`
- PDF: Use @react-pdf/renderer or similar
- CSV: Stream for large exports
- Include compliance header in PDF

---

### Story 7.10: AI Buddy Audit Log Immutability

**As an** admin,
**I want** audit logs to be immutable,
**So that** they're valid for compliance purposes. (FR54, FR55, FR56)

**Acceptance Criteria:**

**Given** audit logs exist
**When** anyone tries to modify them
**Then** the database rejects the operation (no UPDATE/DELETE allowed)

**And** RLS policies enforce append-only access

**Given** I view audit log entries
**When** I see the metadata
**Then** each entry includes:
- Unique ID
- Timestamp (cannot be changed)
- User ID
- Conversation ID
- Action type
- Metadata (guardrail events, etc.)

**Given** the system retention policy
**When** logs age
**Then** logs are retained for minimum 7 years (insurance compliance standard)

**Prerequisites:** Story 7.9 (audit export)

**Technical Notes:**
- RLS: Only INSERT policy, no UPDATE/DELETE
- Database triggers to prevent modification
- Consider table partitioning for 7-year retention
- Archive strategy for old logs (consider S3 for cost)

---

### Story 7.11: AI Buddy Owner Billing Management

**As an** agency owner,
**I want** to manage billing and subscription,
**So that** I can control my agency's plan. (FR48)

**Acceptance Criteria:**

**Given** I am the agency owner
**When** I go to Settings → Billing
**Then** I see:
- Current plan (with AI Buddy feature)
- Billing cycle and next payment date
- Payment method on file
- Invoice history

**And** I can:
- Update payment method
- View/download invoices
- See usage against plan limits

**Given** I am an admin (not owner)
**When** I try to access billing
**Then** I see "Contact your agency owner for billing changes"

**Prerequisites:** Story 7.10 (audit immutability)

**Technical Notes:**
- Integrate with existing billing (Stripe or similar)
- AI Buddy may be included in plan or add-on
- Owner-only access enforced
- Consider usage-based billing display

---

### Story 7.12: AI Buddy Transfer Ownership

**As an** agency owner,
**I want** to transfer ownership to another admin,
**So that** I can transition leadership. (FR49)

**Acceptance Criteria:**

**Given** I am the agency owner
**When** I go to Settings → Agency → Transfer Ownership
**Then** I see a list of current admins

**And** I can select an admin to transfer ownership to

**Given** I select an admin and confirm
**When** the transfer completes
**Then** they become the new owner

**And** I am demoted to admin role

**And** they receive email notification of ownership

**And** I see confirmation: "Ownership transferred to [Name]"

**Given** there are no other admins
**When** I try to transfer ownership
**Then** I see: "Promote a user to admin first before transferring ownership"

**Prerequisites:** Story 7.11 (billing management)

**Technical Notes:**
- Require owner password/2FA for transfer
- Atomic database transaction
- Email both parties (old owner, new owner)
- Audit log: `ownership_transferred`

---

### Story 7.13: AI Buddy Feature Navigation Polish

**As a** user,
**I want** seamless navigation between AI Buddy and other docuMINE features,
**So that** my workflow is smooth. (FR64)

**Acceptance Criteria:**

**Given** I am in AI Buddy with a document open
**When** I click "Compare" in the navigation
**Then** I navigate to Document Comparison

**And** my AI Buddy state is preserved (conversation, project)

**Given** I am in Document Comparison
**When** I click "AI Buddy"
**Then** I return to AI Buddy where I left off

**And** transition is instant (< 200ms perceived)

**Given** I have documents in Document Comparison
**When** I want to discuss them in AI Buddy
**Then** I can easily add them to an AI Buddy project (see Epic 4)

**Prerequisites:** Story 7.12 (transfer ownership)

**Technical Notes:**
- Use client-side state preservation
- React Query cache keeps AI Buddy state warm
- Consider cross-feature shortcuts (keyboard, quick actions)
- Final polish and testing of navigation flows

---

## FR Coverage Matrix

| FR | Description | Epic | Story |
|----|-------------|------|-------|
| FR1 | Start new conversations | 2 | 2.1, 2.4 |
| FR2 | Streaming AI responses | 2 | 2.3 |
| FR3 | Conversation history by date/project | 3 | 3.4 |
| FR4 | Search conversations | 3 | 3.5 |
| FR5 | Continue previous conversations | 2 | 2.4 |
| FR6 | Delete conversations | 3 | 3.6 |
| FR7 | Source citations | 2 | 2.5 |
| FR8 | Confidence indicators | 2 | 2.6 |
| FR9 | "I don't know" responses | 2 | 2.7 |
| FR10 | Invisible guardrail respect | 2 | 2.7 |
| FR11 | Create Projects | 3 | 3.1 |
| FR12 | Rename/archive Projects | 3 | 3.3 |
| FR13 | Attach documents to Projects | 4 | 4.2 |
| FR14 | Remove documents from Projects | 4 | 4.6 |
| FR15 | View Project documents | 4 | 4.2, 4.4 |
| FR16 | Project document context | 3 | 3.2 |
| FR17 | Switch Projects | 3 | 3.1 |
| FR18 | General chat (no project) | 3 | 3.4 |
| FR19 | Move conversation to Project | 3 | 3.6 |
| FR20 | Upload to conversation | 4 | 4.1 |
| FR21 | Upload to Project | 4 | 4.2 |
| FR22 | Process documents for AI | 4 | 4.3 |
| FR23 | Preview documents | 4 | 4.4 |
| FR24 | Document processing status | 4 | 4.3 |
| FR25 | Multi-document context | 4 | 4.5 |
| FR26 | Set display name/role | 5 | 5.3 |
| FR27 | Specify lines of business | 5 | 5.1, 5.3 |
| FR28 | Favorite carriers list | 5 | 5.1, 5.3 |
| FR29 | Agency information | 5 | 5.4 |
| FR30 | Communication style | 5 | 5.3 |
| FR31 | AI incorporates preferences | 5 | 5.5 |
| FR32 | Reset preferences | 5 | 5.6 |
| FR33 | Approved carriers list | - | *Deferred to Quoting* |
| FR34 | AI discusses approved carriers only | - | *Deferred to Quoting* |
| FR35 | Restricted topics | 6 | 6.1 |
| FR36 | Enable/disable guardrails | 6 | 6.2 |
| FR37 | Immediate guardrail effect | 6 | 6.3 |
| FR38 | Log guardrail events | 6 | 6.4 |
| FR39 | Helpful guardrail redirects | 6 | 6.5 |
| FR40 | AI disclosure message | 6 | 6.6 |
| FR41 | Customize disclosure message | 6 | 6.6 |
| FR42 | View agency users | 7 | 7.1 |
| FR43 | Invite users | 7 | 7.2 |
| FR44 | Remove users | 7 | 7.3 |
| FR45 | Change user roles | 7 | 7.4 |
| FR46 | View usage analytics | 7 | 7.5 |
| FR47 | Usage dashboard with trends | 7 | 7.6 |
| FR48 | Manage billing | 7 | 7.11 |
| FR49 | Transfer ownership | 7 | 7.12 |
| FR50 | Complete audit log | 7 | 7.7, 7.10 |
| FR51 | Filter audit log | 7 | 7.7 |
| FR52 | View transcripts | 7 | 7.8 |
| FR53 | Export audit logs | 7 | 7.9 |
| FR54 | Immutable audit logs | 7 | 7.10 |
| FR55 | Audit log metadata | 7 | 7.10 |
| FR56 | Compliance retention | 7 | 7.10 |
| FR57 | Quick onboarding flow | 5 | 5.1 |
| FR58 | Onboarding collects info | 5 | 5.1 |
| FR59 | Guided first conversation | 5 | 5.7 |
| FR60 | Personalized suggestions | 5 | 5.7 |
| FR61 | Skip onboarding | 5 | 5.2 |
| FR62 | Admin sees onboarding status | 5 | 5.8 |
| FR63 | Accessible from dashboard | 1 | 1.3 |
| FR64 | Seamless navigation | 7 | 7.13 |
| FR65 | docuMINE documents available | 4 | 4.7 |
| FR66 | Reference analyzed documents | 4 | 4.7 |

---

## Summary

**AI Buddy Epic Breakdown Complete**

| Epic | Name | Stories | FRs Covered |
|------|------|---------|-------------|
| 1 | AI Buddy Foundation | 5 | FR63 |
| 2 | AI Buddy Core Chat | 7 | FR1, FR2, FR5, FR7-10 |
| 3 | AI Buddy Projects | 6 | FR3, FR4, FR6, FR11-19 |
| 4 | AI Buddy Document Intelligence | 7 | FR20-25, FR65, FR66 |
| 5 | AI Buddy Personalization & Onboarding | 8 | FR26-32, FR57-62 |
| 6 | AI Buddy Guardrails & Compliance | 6 | FR35-41 |
| 7 | AI Buddy Admin & Audit | 13 | FR42-56, FR64 |

**Totals:**
- **7 Epics**
- **52 Stories** (Epic 3 consolidated from 9 to 6 stories)
- **64 FRs covered** (FR33-34 deferred to Quoting feature)

**Context Incorporated:**
- ✅ PRD requirements
- ✅ UX Design interaction patterns and components
- ✅ Architecture technical decisions and data models

**Deferred Items:**
- FR33, FR34 (carrier restrictions) → Quoting feature per Architecture decision

**Ready for:** Phase 4 Sprint Planning and Implementation

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._

_This document incorporates PRD + UX Design + Architecture for complete implementation context._
