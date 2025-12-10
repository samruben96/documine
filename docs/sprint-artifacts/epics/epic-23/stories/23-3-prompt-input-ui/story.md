# Story 23.3: Prompt Input UI

Status: done

## Story

As an **insurance agent**,
I want **a text input to describe what report I want (optional)**,
so that **the AI can generate a customized report, or automatically analyze my data if I leave it blank**.

## Acceptance Criteria

1. **AC-23.3.1**: Text input field for optional report description with multi-line support
2. **AC-23.3.2**: Placeholder text explains auto-analysis option (e.g., "Describe the report you want, or leave blank for AI to analyze automatically")
3. **AC-23.3.3**: Suggested prompts from analysis API are clickable chips that populate the input
4. **AC-23.3.4**: "Generate Report" button enabled after file upload completes (prompt is optional)
5. **AC-23.3.5**: Loading state shown while analysis is in progress (between upload and ready state)
6. **AC-23.3.6**: Clear error handling if analysis fails

## Tasks / Subtasks

- [x] **Task 1: PromptInput Component** (AC: 1, 2)
  - [x] Create `src/components/reporting/prompt-input.tsx`
  - [x] Multi-line textarea with appropriate sizing (min-h-[100px])
  - [x] Placeholder text explaining auto-analysis option
  - [x] Character count indicator (optional, max ~500 chars)
  - [x] Proper disabled state during analysis/generation
  - [x] Integrate with shadcn/ui Textarea component

- [x] **Task 2: Suggested Prompts Chips** (AC: 3)
  - [x] Create `src/components/reporting/suggested-prompts.tsx`
  - [x] Render 3-5 clickable chips from `suggestedPrompts` array
  - [x] Clicking a chip populates the textarea
  - [x] Visual feedback on hover/click (scale, color)
  - [x] Accessible keyboard navigation

- [x] **Task 3: ReportingPage Integration** (AC: 4, 5, 6)
  - [x] Update `src/app/(dashboard)/reporting/page.tsx`
  - [x] Add state management for:
    - `sourceId: string | null` (from upload)
    - `analysisData: AnalyzeResponse | null` (from /analyze)
    - `prompt: string` (user input)
    - `isAnalyzing: boolean`
    - `analysisError: string | null`
  - [x] Call `/api/reporting/analyze` after successful upload
  - [x] Display PromptInput and SuggestedPrompts after analysis completes
  - [x] "Generate Report" button with proper enabled/disabled logic
  - [x] Error alert if analysis fails

- [x] **Task 4: useReportingAnalysis Hook** (AC: 4, 5, 6)
  - [x] Create `src/hooks/use-reporting-analysis.ts`
  - [x] Encapsulate analyze API call
  - [x] Return `{ analyze, data, isLoading, error, reset }`
  - [x] Handle abort on unmount

- [x] **Task 5: UI Flow & State Machine** (AC: 4, 5, 6)
  - [x] Implement clear state flow:
    1. Initial: Show FileUploader only
    2. Uploading: FileUploader with progress
    3. Analyzing: Show "Analyzing your data..." spinner below uploader
    4. Ready: Show PromptInput + SuggestedPrompts + Generate button
    5. Generating: (Future story) Disabled state during generation
  - [x] Allow uploading new file to reset flow
  - [x] Clear previous analysis when new file uploaded

- [x] **Task 6: Unit Tests** (AC: 1-6)
  - [x] Test PromptInput renders with placeholder
  - [x] Test PromptInput onChange updates value
  - [x] Test SuggestedPrompts renders chips from array
  - [x] Test clicking chip calls onSelect callback
  - [x] Test useReportingAnalysis hook states
  - [x] Test ReportingPage state transitions

- [x] **Task 7: Integration Test** (AC: 3, 4, 5)
  - [x] E2E: Upload file → wait for analysis → see suggested prompts
  - [x] E2E: Click suggested prompt → verify textarea populated
  - [x] E2E: Generate button enabled after analysis completes
  - [x] E2E: Verify button disabled during analysis

## Dev Notes

### Learnings from Previous Story

**From Story 23.2 (Status: done)**

- **File Parser Service**: `src/lib/reporting/file-parser.ts` handles Excel, CSV, PDF parsing with error handling
- **Data Analyzer Service**: `src/lib/reporting/data-analyzer.ts` detects column types and generates suggested prompts
- **Analyze API**: `POST /api/reporting/analyze` returns `AnalyzeResponse` with `sourceId`, `status`, `columns`, `rowCount`, `suggestedPrompts`
- **Types Available**: `AnalyzeResponse`, `ColumnInfo`, `ParsedData` in `src/types/reporting.ts`
- **Database Schema**: `commission_data_sources` table with `parsed_data`, `parsed_at`, `status` (includes 'ready' value)
- **AI Prompt Generation**: Uses OpenRouter/Claude with fallback defaults for 3-5 suggested prompts

**Key Integration Point**: After `FileUploader.onUploadComplete(sourceId, filename)`, immediately call `/api/reporting/analyze` with `{ sourceId }` to trigger analysis.

[Source: docs/sprint-artifacts/epics/epic-23/stories/23-2-data-analysis-pipeline/story.md#Dev-Agent-Record]

### Relevant Architecture Patterns

- **API Response Format**: [Source: docs/architecture/implementation-patterns.md#API-Response-Format]
  - Success: `{ data: T, error: null }`
  - Error: `{ data: null, error: { code, message, details } }`

- **Component Patterns**: [Source: docs/architecture/uiux-architecture.md]
  - Use shadcn/ui components (Textarea, Button)
  - Lucide icons for visual indicators
  - cn() utility for conditional class merging

- **Hook Pattern**: Follow existing patterns from `src/hooks/` (e.g., `use-chat.ts`, `use-processing-progress.ts`)

### Technical Constraints

- **Prompt Length**: Optional, but recommend max ~500 characters for reasonable AI processing
- **Suggested Prompts**: Always 3-5 from analysis API, fallback handled server-side
- **State Reset**: New file upload should clear previous analysis state
- **Accessibility**: Chips should be keyboard navigable (Tab + Enter/Space)

### Dependencies

**Already in package.json:**

| Package | Purpose |
|---------|---------|
| `@radix-ui/react-*` | shadcn/ui primitives |
| `lucide-react` | Icons |
| `class-variance-authority` | Variant styling |
| `sonner` | Toast notifications |

**Components to use:**

| Component | Location |
|-----------|----------|
| Textarea | `src/components/ui/textarea.tsx` |
| Button | `src/components/ui/button.tsx` |
| Alert | `src/components/ui/alert.tsx` |
| Skeleton | `src/components/ui/skeleton.tsx` |

### Project Structure Notes

- Component: `src/components/reporting/prompt-input.tsx`
- Component: `src/components/reporting/suggested-prompts.tsx`
- Hook: `src/hooks/use-reporting-analysis.ts`
- Page: `src/app/(dashboard)/reporting/page.tsx` (update)
- Tests: `__tests__/components/reporting/`, `__tests__/hooks/`

### UI Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Upload Your Data                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │         [FileUploader - existing component]                 ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  ⏳ Analyzing your data...                                  ││  ← Only shown during analysis
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  STEP 2: What report do you want? (Optional)                ││
│  │  ┌─────────────────────────────────────────────────────┐    ││
│  │  │  Describe the report you want, or leave blank for   │    ││
│  │  │  AI to analyze your data automatically...           │    ││
│  │  │                                                     │    ││
│  │  └─────────────────────────────────────────────────────┘    ││
│  │                                                             ││
│  │  Suggestions:                                               ││
│  │  [📊 Summarize monthly totals] [📈 Show trends over time]  ││
│  │  [🏆 Top 10 by value] [📉 Compare by category]             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              [Generate Report]                              ││  ← Enabled after analysis
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### References

- [Source: docs/sprint-artifacts/epics/epic-23/tech-spec.md#Prompt-Input-Story-23.3]
- [Source: docs/sprint-artifacts/epics/epic-23/tech-spec.md#UI-Components]
- [Source: docs/sprint-artifacts/epics/epic-23/tech-spec.md#Acceptance-Criteria-REVISED]
- [Source: docs/architecture/implementation-patterns.md#API-Response-Format]
- [Source: docs/architecture/uiux-architecture.md]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/23-3-prompt-input-ui.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All ACs implemented with full unit test coverage
- Page state machine: initial → analyzing → ready → generating
- Automatic analysis trigger after file upload
- Reset flow when "Upload different file" clicked

### Completion Notes List

- PromptInput: Multi-line textarea (min-h-[100px]) with character count (500 max), disabled state styling, aria-label and aria-describedby for accessibility
- SuggestedPrompts: Clickable chips with blue theme (bg-blue-50/text-blue-700), hover scale effect, keyboard navigation (Tab + Enter/Space), group role for accessibility
- useReportingAnalysis: Async hook with analyze/reset functions, AbortController for cleanup, proper error handling
- ReportingPage: State machine with 5 states (initial, analyzing, ready, generating, error), auto-analyze on upload, error alert with retry button
- 78 unit tests passing across 4 test files
- E2E tests added to reporting-analyze.spec.ts for Story 23.3 ACs

### File List

**New Files:**
- src/components/reporting/prompt-input.tsx
- src/components/reporting/suggested-prompts.tsx
- src/hooks/use-reporting-analysis.ts
- __tests__/components/reporting/prompt-input.test.tsx
- __tests__/components/reporting/suggested-prompts.test.tsx
- __tests__/hooks/use-reporting-analysis.test.ts
- __tests__/app/reporting/page.test.tsx

**Modified Files:**
- src/app/(dashboard)/reporting/page.tsx
- __tests__/e2e/reporting-analyze.spec.ts
- docs/sprint-artifacts/sprint-status.yaml

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-10 | 1.0 | Initial story draft |
| 2025-12-10 | 1.1 | Story implementation complete - All tasks done, 78 tests passing |
| 2025-12-10 | 1.2 | Senior Developer Review notes appended |

---

## Senior Developer Review (AI)

### Reviewer
Sam

### Date
2025-12-10

### Outcome
✅ **APPROVED**

The implementation is high-quality, well-tested, and fully satisfies all acceptance criteria. The code follows project patterns, demonstrates good separation of concerns, and has comprehensive test coverage.

### Summary

Story 23.3 implements the Prompt Input UI for the Flexible AI Reports feature. The implementation includes:
- A multi-line `PromptInput` component with character count and accessibility features
- A `SuggestedPrompts` component with clickable chips for AI-generated suggestions
- A `useReportingAnalysis` hook encapsulating the analyze API call with proper state management
- Full page integration with a clear 5-state UI flow machine (initial → analyzing → ready → generating → error)

All 78 unit tests pass, build succeeds, and the implementation aligns with the Epic 23 tech spec and project architecture patterns.

### Key Findings

**No HIGH or MEDIUM severity issues found.**

**LOW Severity:**
- [ ] [Low] Consider adding `aria-busy` attribute to the Step 2 section during analyzing state for enhanced screen reader feedback [file: src/app/(dashboard)/reporting/page.tsx:228-269]

**Advisory Notes:**
- Note: The `handleGenerateReport` function has a placeholder `setTimeout` implementation (line 100) - this is expected and will be completed in Story 23.4
- Note: Excellent use of AbortController in the hook for request cancellation and cleanup
- Note: Good progressive disclosure pattern with opacity transitions between states

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC-23.3.1 | Text input field for optional report description with multi-line support | ✅ IMPLEMENTED | `src/components/reporting/prompt-input.tsx:44-57` - Uses shadcn Textarea with `min-h-[100px]` class |
| AC-23.3.2 | Placeholder text explains auto-analysis option | ✅ IMPLEMENTED | `src/components/reporting/prompt-input.tsx:25-27` - Default placeholder includes "leave blank for AI to analyze your data automatically" |
| AC-23.3.3 | Suggested prompts from analysis API are clickable chips that populate the input | ✅ IMPLEMENTED | `src/components/reporting/suggested-prompts.tsx:39-58` - Chips call `onSelect` on click, `src/app/(dashboard)/reporting/page.tsx:103-105` - `handleSuggestedPromptSelect` sets prompt state |
| AC-23.3.4 | "Generate Report" button enabled after file upload completes (prompt is optional) | ✅ IMPLEMENTED | `src/app/(dashboard)/reporting/page.tsx:115` - `canGenerate = pageState === 'ready' && !isGenerating` |
| AC-23.3.5 | Loading state shown while analysis is in progress | ✅ IMPLEMENTED | `src/app/(dashboard)/reporting/page.tsx:168-180` - Spinner with "Analyzing your data..." message shown when `pageState === 'analyzing'` |
| AC-23.3.6 | Clear error handling if analysis fails | ✅ IMPLEMENTED | `src/app/(dashboard)/reporting/page.tsx:209-225` - Alert with error message and "Try Again" button |

**Summary: 6 of 6 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: PromptInput Component | ✅ Complete | ✅ VERIFIED | `src/components/reporting/prompt-input.tsx` - Multi-line textarea, placeholder, character count, disabled state, shadcn integration |
| Task 2: Suggested Prompts Chips | ✅ Complete | ✅ VERIFIED | `src/components/reporting/suggested-prompts.tsx` - Clickable chips with blue theme, hover effects, keyboard navigation (Tab + Enter/Space), proper ARIA |
| Task 3: ReportingPage Integration | ✅ Complete | ✅ VERIFIED | `src/app/(dashboard)/reporting/page.tsx:35-116` - State variables, useEffect for auto-analyze, PromptInput/SuggestedPrompts rendering, Generate button logic |
| Task 4: useReportingAnalysis Hook | ✅ Complete | ✅ VERIFIED | `src/hooks/use-reporting-analysis.ts` - Returns `{ analyze, data, isLoading, error, reset }`, AbortController cleanup |
| Task 5: UI Flow & State Machine | ✅ Complete | ✅ VERIFIED | `src/app/(dashboard)/reporting/page.tsx:33,56-64` - PageState type with 5 states, `getPageState()` function derives state |
| Task 6: Unit Tests | ✅ Complete | ✅ VERIFIED | 78 tests across 4 files: prompt-input.test.tsx (20), suggested-prompts.test.tsx (25), use-reporting-analysis.test.ts (21), page.test.tsx (12) |
| Task 7: Integration Test | ✅ Complete | ✅ VERIFIED | `__tests__/e2e/reporting-analyze.spec.ts:336-475` - E2E tests for AC-23.3.3, 23.3.4, 23.3.5, upload different file flow |

**Summary: 7 of 7 completed tasks verified, 0 questionable, 0 false completions**

### Test Coverage and Gaps

**Coverage:**
- PromptInput: 20 tests covering multi-line support, placeholder, character count, disabled state, accessibility
- SuggestedPrompts: 25 tests covering chip rendering, click behavior, keyboard navigation, disabled state, ARIA
- useReportingAnalysis: 21 tests covering initial state, loading, success, error handling, abort behavior
- ReportingPage: 12 tests covering state transitions, component integration, error handling

**Test Quality:**
- Good use of `userEvent` for realistic interactions
- Proper mocking of hooks and components for isolation
- Coverage of edge cases (empty prompts, undefined prompts, abort scenarios)

**No significant gaps identified.**

### Architectural Alignment

**Tech-Spec Compliance:**
- ✅ Follows Epic 23 tech-spec UI wireframe (Step 1 → Step 2 → Generate flow)
- ✅ Uses specified TypeScript types from `src/types/reporting.ts` (AnalyzeResponse)
- ✅ Integrates with `/api/reporting/analyze` endpoint as specified

**Pattern Compliance:**
- ✅ Follows hook pattern from `docs/architecture/implementation-patterns.md` (returns `{ action, data, isLoading, error, reset }`)
- ✅ Uses shadcn/ui components (Textarea, Button, Alert)
- ✅ Uses cn() utility for conditional class merging
- ✅ Follows API response format (`{ data: T, error: null }` structure)

**No architecture violations found.**

### Security Notes

- ✅ No sensitive data exposure in client components
- ✅ AbortController properly cleans up on unmount (prevents memory leaks)
- ✅ User input is passed to server for validation (max length enforced client-side is advisory)

### Best-Practices and References

- **React 19 patterns**: Uses modern hooks (useState, useCallback, useRef, useEffect) correctly
- **Accessibility**: Both components have proper ARIA labels, roles, and keyboard navigation
- **TypeScript**: Strong typing throughout, no `any` types
- **Refs**: [shadcn/ui Textarea](https://ui.shadcn.com/docs/components/textarea), [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)

### Action Items

**Code Changes Required:**
None required - implementation is complete and correct.

**Advisory Notes:**
- Note: Story 23.4 will implement the actual report generation API call (currently placeholder)
- Note: Consider adding E2E test for keyboard navigation of suggested prompts in future polish story
