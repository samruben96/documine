# Epic 6: Epic 5 Cleanup & Stabilization + UI Polish

**Goal:** Fix bugs discovered during Epic 5 testing, implement UI polish improvements, establish Playwright E2E testing, and ensure the application is polished and professional before building Quote Comparison.

**User Value:** Users get a polished, reliable document Q&A experience where confidence badges are accurate, source citations navigate correctly, conversations persist across sessions, and the overall UI feels clean and professional.

**Added:** 2025-12-02 based on Epic 5 Full Retrospective (Party Mode Analysis)
**Updated:** 2025-12-02 - Added UI Polish stories (6.5-6.9) based on Party Mode UI exploration

**Tech Spec:** `docs/sprint-artifacts/tech-spec-epic-6.md`
**Research:** `docs/research-ui-best-practices-2025-12-02.md`

---

## Story 6.1: Fix Conversation Loading (406 Error)

As a **user returning to a document**,
I want **my previous conversation to load correctly**,
So that **I can continue where I left off**.

**Problem:** GET /conversations returns HTTP 406 - RLS policy allows INSERT but not SELECT.

**Acceptance Criteria:**

**Given** I have a conversation history with a document
**When** I return to that document
**Then** my previous messages load correctly
**And** no 406 errors appear in console
**And** conversation persists across page refresh

**Prerequisites:** None (first story)

**Technical Notes:**
- Add/fix SELECT policy on conversations table
- Verify chat_messages also has proper SELECT policy
- Add Playwright E2E test for conversation persistence

---

## Story 6.2: Fix Confidence Score Calculation

As a **user asking questions about documents**,
I want **confidence badges to accurately reflect answer quality**,
So that **I can trust the visual indicators**.

**Problem:** Cohere reranker scores replace vector similarity, causing threshold mismatch. Correct answers show "Not Found" badge.

**Acceptance Criteria:**

**Given** I ask a question with a clear answer in the document
**When** the AI provides the correct answer with sources
**Then** confidence badge shows "High Confidence" or "Needs Review"
**And** "Not Found" badge only appears when information genuinely isn't found

**And** for greetings/conversational queries:
**Then** confidence badge is hidden or shows "Conversational"

**Prerequisites:** Story 6.1

**Technical Notes:**
- Separate vectorSimilarity and rerankerScore properties
- Recalibrate thresholds for Cohere scores (0.30/0.10)
- Add query intent awareness for badge display
- Add Playwright E2E test for confidence accuracy

---

## Story 6.3: Fix Source Citation Navigation

As a **user verifying AI answers**,
I want **source citations to navigate to the correct page**,
So that **I can quickly verify the answer**.

**Problem:** Clicking "View page 2 in document" doesn't scroll the PDF viewer to page 2.

**Acceptance Criteria:**

**Given** an AI response with source citations
**When** I click a citation link (e.g., "Page 2")
**Then** the PDF viewer scrolls to that page
**And** the page number input updates to show the current page
**And** there is visual feedback on the citation click

**Prerequisites:** Story 6.1

**Technical Notes:**
- Debug event flow from citation click to document viewer
- Ensure page state is properly wired
- Add Playwright E2E test for citation navigation

---

## Story 6.4: DEFERRED to Epic F4 (Mobile Optimization)

**Note:** Mobile tab state preservation was deferred to Future Epic F4. Mobile optimization is not a priority for MVP. See Epic F4: Mobile Optimization for details.

---

## Story 6.5: Remove Stale UI Text & Fix Page Title

As a **user visiting docuMINE**,
I want **the UI to look professional without outdated references**,
So that **I have confidence in the product**.

**Problem:** "Coming in Epic 5" text appears in empty states. Browser tab shows "Create Next App" instead of "docuMINE".

**Acceptance Criteria:**

**Given** I am using docuMINE
**When** I view any page
**Then** no references to "Epic X" appear in the UI
**And** the browser tab shows "docuMINE" (or "Document Name - docuMINE" for document pages)

**Prerequisites:** None (independent)

**Technical Notes:**
- Update `src/app/layout.tsx` with proper metadata
- Remove stale text from document pages
- Add dynamic titles for document viewer pages
- Effort: XS (15-30 minutes)

---

## Story 6.6: Connection Status & Realtime Indicator

As a **user viewing documents**,
I want **clear feedback about connection status**,
So that **I know when the system is ready**.

**Problem:** "Connecting..." text appears without ever resolving to a meaningful state.

**Acceptance Criteria:**

**Given** I am viewing a document
**When** realtime connection is established
**Then** I see "Connected" with a checkmark indicator
**And** during connection I see "Connecting..." with a spinner
**And** if disconnected I see appropriate offline indicator

**Prerequisites:** None (independent)

**Technical Notes:**
- Update `src/hooks/use-realtime.ts` to expose connection state
- Create `src/components/ui/connection-indicator.tsx`
- Effort: S (1-2 hours)

---

## Story 6.7: Document Selection Visual Feedback

As a **user navigating documents**,
I want **to clearly see which document is currently selected**,
So that **I can quickly orient myself**.

**Problem:** No visual distinction between selected and unselected documents in the sidebar.

**Acceptance Criteria:**

**Given** I click on a document in the sidebar
**When** the document loads
**Then** the selected document has a distinct highlight (background color + left border)
**And** hover states are visually distinct from selected state
**And** selection is accessible (aria-selected attribute)

**Prerequisites:** None (independent)

**Technical Notes:**
- Update `src/components/documents/document-list-item.tsx` with `isSelected` prop
- Pass selection state from URL params
- Effort: S (1-2 hours)

---

## Story 6.8: Empty State UX Improvement

As a **new user**,
I want **helpful guidance when no document is selected**,
So that **I understand what to do next**.

**Problem:** Empty state is bland ("Select a document") and doesn't inspire action.

**Acceptance Criteria:**

**Given** no document is selected
**When** I view the documents page
**Then** I see an engaging empty state with:
- Friendly headline ("Ready to analyze your documents")
- Clear description of what to do
- Prominent upload button (if no documents)
- Visual icon/illustration

**And** different variants for "no documents" vs "select document" states

**Prerequisites:** None (independent)

**Technical Notes:**
- Create `src/components/documents/empty-state.tsx` with variants
- Follow empty state UX best practices from research
- Effort: S (1-2 hours)

---

## Story 6.9: Long Filename Handling

As a **user with verbose document names**,
I want **to see full filenames without breaking the layout**,
So that **I can distinguish between similarly named documents**.

**Problem:** Long filenames are truncated without any way to see the full name.

**Acceptance Criteria:**

**Given** a document has a long filename
**When** I view it in the sidebar
**Then** the filename is truncated with ellipsis
**And** a tooltip shows the full filename on hover
**And** the same behavior applies in the document header

**Prerequisites:** None (independent)

**Technical Notes:**
- Add shadcn/ui Tooltip component if needed
- Update `src/components/documents/document-list-item.tsx`
- Effort: XS (30 minutes - 1 hour)

---

## Story 6.8: Design System Refresh

As a **user of docuMINE**,
I want **a modern, visually engaging design with color and proper spacing**,
So that **the application feels professional, inviting, and easy to use**.

**Added:** 2025-12-02 based on user feedback ("too grey, doesn't feel modern")

**Problem:** Current design dominated by slate/grey tones with no brand accent color. Spacing inconsistencies. Feels like "Enterprise Grey Syndrome."

**Acceptance Criteria:**

**Given** the current slate-only palette
**When** viewing any page in docuMINE
**Then** a brand accent color is visible in primary buttons, active states, and interactive elements
**And** the color palette is refreshed with improved visual hierarchy
**And** spacing is consistent across document list, chat panel, and settings
**And** button styling is modern with proper hover/focus states
**And** interactive states (hover, focus, selected) are visually distinct

**Prerequisites:** Story 6.7 should complete first to avoid conflicts

**Technical Notes:**
- Update CSS custom properties in `globals.css`
- Accent color: Electric Blue (#3b82f6) — CONFIRMED
- Update shadcn/ui component variants
- Spacing audit across major views
- Effort: M (4-6 hours)
- Full story: `docs/sprint-artifacts/story-6.8-design-system-refresh.md`

---
