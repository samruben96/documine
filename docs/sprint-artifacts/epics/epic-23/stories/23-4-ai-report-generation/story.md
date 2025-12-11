# Story 23.4: AI Report Generation

Status: done

## Story

As an **insurance agent**,
I want **AI to generate insights, summaries, and chart configurations from my uploaded data**,
so that **I can quickly understand my data and make informed decisions without manual analysis**.

## Acceptance Criteria

1. **AC-23.4.1**: AI generates report title and summary from data + prompt (or auto-generates if no prompt)
2. **AC-23.4.2**: Report includes 3-5 key insights with type indicators (finding, trend, anomaly, recommendation) and severity levels (info, warning, critical)
3. **AC-23.4.3**: Without prompt, AI generates best-effort analysis automatically by identifying key metrics, dimensions, patterns, and outliers
4. **AC-23.4.4**: Generation shows streaming progress feedback via SSE (Server-Sent Events)
5. **AC-23.4.5**: Generation completes within 30 seconds for datasets < 10K rows
6. **AC-23.4.6**: Report includes chart configurations (type, data, axes) for 2-4 recommended visualizations
7. **AC-23.4.7**: Error states are handled gracefully with retry capability

## Tasks / Subtasks

- [ ] **Task 1: POST /api/reporting/generate API Route** (AC: 1, 2, 3, 5)
  - [ ] Create `src/app/api/reporting/generate/route.ts`
  - [ ] Use Edge Runtime for SSE streaming (`export const runtime = 'edge'`)
  - [ ] Accept `GenerateReportRequest` body (`{ sourceId, prompt? }`)
  - [ ] Verify sourceId exists and user has access (RLS via SELECT first)
  - [ ] Load `parsed_data` from `commission_data_sources` table
  - [ ] Validate source status is 'ready' before proceeding
  - [ ] Call OpenAI/OpenRouter with structured output request
  - [ ] Return `GeneratedReport` matching TypeScript types

- [ ] **Task 2: ReportGeneratorService** (AC: 1, 2, 3, 6)
  - [ ] Create `src/lib/reporting/report-generator.ts`
  - [ ] Build system prompt for report generation:
    - Include column info (names, types, stats)
    - Include first 50 rows as sample data (truncate for large datasets)
    - Include total row count and metadata
  - [ ] Implement prompt-based generation (user provides direction)
  - [ ] Implement auto-analysis mode (no prompt):
    - Identify numeric columns → key metrics
    - Identify categorical columns → dimensions
    - Identify date columns → time series potential
    - Generate 2-4 chart recommendations
    - Find patterns, trends, anomalies
  - [ ] Use OpenRouter (Claude or GPT-4o) for generation
  - [ ] Return structured `GeneratedReport` object
  - [ ] Add timeout handling (30s max)

- [ ] **Task 3: SSE Streaming Implementation** (AC: 4)
  - [ ] Follow SSE pattern from `docs/architecture/implementation-patterns.md`
  - [ ] Define SSE event types:
    - `progress`: `{ stage: 'analyzing' | 'generating' | 'charting', percent: number }`
    - `title`: `{ title: string }`
    - `summary`: `{ summary: string }`
    - `insight`: `{ insight: ReportInsight }`
    - `chart`: `{ chart: ChartConfig }`
    - `done`: `{ report: GeneratedReport }`
    - `error`: `{ error: string, code: string }`
  - [ ] Stream progressive updates as AI generates:
    1. First emit `progress` (analyzing)
    2. Then `title` when ready
    3. Then `summary` when ready
    4. Then `insight` events (3-5)
    5. Then `chart` events (2-4)
    6. Finally `done` with full report
  - [ ] Handle AbortController for request cancellation

- [ ] **Task 4: useReportGeneration Hook** (AC: 4, 7)
  - [ ] Create `src/hooks/use-report-generation.ts`
  - [ ] Manage generation state:
    - `isGenerating: boolean`
    - `progress: { stage, percent } | null`
    - `report: GeneratedReport | null`
    - `error: string | null`
  - [ ] Implement SSE stream consumer (follow use-chat.ts pattern)
  - [ ] Buffer handling for incomplete SSE lines
  - [ ] AbortController for cancellation on unmount
  - [ ] `generate(sourceId, prompt?)` function
  - [ ] `reset()` function to clear state

- [ ] **Task 5: ReportingPage Integration** (AC: 4, 7)
  - [ ] Update `src/app/(dashboard)/reporting/page.tsx`
  - [ ] Replace placeholder `handleGenerateReport` with real implementation
  - [ ] Add `pageState: 'generating'` state handling
  - [ ] Show progress indicator during generation:
    - Stage label (Analyzing data... / Generating insights... / Creating charts...)
    - Progress percentage if available
  - [ ] Transition to report view on completion
  - [ ] Handle errors with Alert and retry button
  - [ ] Allow cancellation of in-progress generation

- [ ] **Task 6: ReportView Component** (AC: 1, 2, 6)
  - [ ] Create `src/components/reporting/report-view.tsx`
  - [ ] Display report structure:
    - Title (h1)
    - Summary (prose text)
    - Key Insights section with cards:
      - Icon per type (Lightbulb for finding, TrendingUp for trend, AlertTriangle for anomaly, Target for recommendation)
      - Severity badge (info=blue, warning=yellow, critical=red)
      - Title and description
    - Charts section (placeholder divs for Story 23.5)
    - Data table section (placeholder for Story 23.6)
  - [ ] Export buttons (PDF, Excel) - disabled until Stories 23.7
  - [ ] "Generate New Report" button to restart flow
  - [ ] Show `promptUsed` to indicate what AI analyzed

- [ ] **Task 7: Unit Tests** (AC: 1-7)
  - [ ] Test `report-generator.ts`:
    - Test prompt-based generation
    - Test auto-analysis mode
    - Test timeout handling
    - Test error handling
  - [ ] Test `use-report-generation.ts`:
    - Test initial state
    - Test loading state during generation
    - Test progress updates
    - Test successful generation
    - Test error handling
    - Test cancellation/abort
  - [ ] Test `report-view.tsx`:
    - Test renders title and summary
    - Test renders insights with correct icons/badges
    - Test chart placeholders render
    - Test export buttons are disabled

- [ ] **Task 8: Integration/E2E Tests** (AC: 1, 3, 4, 5)
  - [ ] E2E: Upload file → analyze → enter prompt → generate → see report
  - [ ] E2E: Upload file → analyze → leave prompt blank → generate → see auto-analysis
  - [ ] E2E: Verify progress indicator shows during generation
  - [ ] E2E: Cancel generation mid-stream and verify cleanup
  - [ ] E2E: Error handling → retry flow works

## Dev Notes

### Learnings from Previous Story

**From Story 23.3 (Status: done)**

- **State Machine Pattern**: ReportingPage uses 5 states (initial, analyzing, ready, generating, error) with `getPageState()` function - extend this for generating state
- **useReportingAnalysis Hook**: Located at `src/hooks/use-reporting-analysis.ts` - use similar pattern for report generation
- **PromptInput Component**: `src/components/reporting/prompt-input.tsx` passes prompt value to page state
- **handleGenerateReport Placeholder**: Line ~100 has placeholder `setTimeout` - replace with real API call
- **AbortController Pattern**: Already implemented in useReportingAnalysis - reuse for generation hook
- **Error Alert**: Existing error state and Alert component in page - extend for generation errors

**Key Integration Points**:
- After clicking "Generate Report", call `/api/reporting/generate` with `{ sourceId, prompt }`
- sourceId available from `analysisData.sourceId`
- prompt available from `prompt` state (may be empty string)

[Source: docs/sprint-artifacts/epics/epic-23/stories/23-3-prompt-input-ui/story.md#Dev-Agent-Record]

### Relevant Architecture Patterns

- **SSE Streaming Pattern**: [Source: docs/architecture/implementation-patterns.md#SSE-Streaming-Pattern]
  - Use Edge Runtime for low latency
  - TextEncoder/TextDecoder for string/Uint8Array conversion
  - Buffer management for SSE lines split across chunks
  - AbortController for cancellation
  - Error events streamed, not thrown mid-stream

- **API Response Format**: [Source: docs/architecture/implementation-patterns.md#API-Response-Format]
  - Success: `{ data: T, error: null }`
  - Error: `{ data: null, error: { code, message, details } }`

- **Verify-Then-Service Pattern**: [Source: docs/architecture/implementation-patterns.md#RLS-Service-Client-Pattern]
  - SELECT first to verify access (RLS works)
  - Service client for mutations if needed

### Technical Constraints

- **Token Limits**: For large datasets (>10K rows), send only:
  - Column metadata (names, types, stats)
  - First 50 rows as sample
  - Summary statistics
  - Total row count
- **Timeout**: 30 second max generation time
- **Chart Configs**: Must match `ChartConfig` type for Recharts compatibility (Story 23.5)
- **OpenRouter API**: Use `OPENROUTER_API_KEY` env var, model `anthropic/claude-sonnet-4-20250514` or `openai/gpt-4o`

### AI Prompt Strategy

**System Prompt Structure**:
```
You are a data analyst expert. Analyze the provided dataset and generate a comprehensive report.

Dataset Information:
- File: {filename}
- Rows: {totalRows}
- Columns: {columns with types and stats}

Sample Data (first 50 rows):
{JSON sample}

User Request: {prompt or "Generate a comprehensive analysis of this data"}

Generate a report with:
1. Title: A descriptive title for the report
2. Summary: 2-3 paragraph executive summary
3. Insights: 3-5 key findings, each with:
   - type: finding | trend | anomaly | recommendation
   - severity: info | warning | critical
   - title: short headline
   - description: detailed explanation
4. Charts: 2-4 recommended visualizations, each with:
   - type: bar | line | pie | area
   - title: chart title
   - xKey: column for x-axis
   - yKey: column(s) for y-axis
   - description: what the chart shows

Output as valid JSON matching the GeneratedReport type.
```

### Dependencies

**Already in package.json:**
- `openai` - OpenRouter compatible client
- `lucide-react` - Icons for insight types

**Environment Variables Required:**
- `OPENROUTER_API_KEY` - For AI model access

### Project Structure Notes

- API Route: `src/app/api/reporting/generate/route.ts`
- Service: `src/lib/reporting/report-generator.ts`
- Hook: `src/hooks/use-report-generation.ts`
- Component: `src/components/reporting/report-view.tsx`
- Page: `src/app/(dashboard)/reporting/page.tsx` (update)
- Tests: `__tests__/api/reporting/generate.test.ts`, `__tests__/lib/reporting/`, `__tests__/hooks/`, `__tests__/components/reporting/`

### TypeScript Types Available

From `src/types/reporting.ts`:
- `GenerateReportRequest` - API request body
- `GeneratedReport` - Full report output
- `ReportInsight` - Individual insight
- `ChartConfig` - Chart configuration
- `GenerateResponse` - API response wrapper
- `ParsedData` - Source data structure
- `ColumnInfo` - Column metadata

### References

- [Source: docs/sprint-artifacts/epics/epic-23/tech-spec.md#Report-Generation-Story-23.4]
- [Source: docs/sprint-artifacts/epics/epic-23/tech-spec.md#Workflows]
- [Source: docs/sprint-artifacts/epics/epic-23/tech-spec.md#Services-and-Modules]
- [Source: docs/architecture/implementation-patterns.md#SSE-Streaming-Pattern]
- [Source: docs/architecture/implementation-patterns.md#API-Response-Format]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/23-4-ai-report-generation.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-10 | 1.0 | Initial story draft |
| 2025-12-10 | 1.1 | Code review passed. Fixed audit logging RLS violation - `logAuditEvent()` now uses `createServiceClient()` |

## Code Review Notes (2025-12-10)

### Review Result: APPROVED ✅

All 7 acceptance criteria verified and passing. Implementation follows project patterns correctly.

### Bug Fix During Review

**Issue:** Audit logging failed with RLS policy violation:
```
"new row violates row-level security policy for table \"agency_audit_logs\""
```

**Root Cause:** `logAuditEvent()` in `src/lib/admin/audit-logger.ts` was using `createClient()` (regular user-authenticated client) instead of `createServiceClient()` (service role client). The RLS policy on `agency_audit_logs` only allows admins to SELECT records but has no INSERT policy for regular users.

**Fix:** Changed `logAuditEvent()` to use `createServiceClient()` which bypasses RLS. This is correct because:
1. Audit logs are append-only and must always succeed regardless of user permissions
2. The service client has full database access for insertions
3. Query functions (`queryAuditLogs`, `exportAuditLogs`) still use regular client to enforce admin-only viewing via RLS

**Files Changed:**
- `src/lib/admin/audit-logger.ts` - Added `createServiceClient` import, changed `logAuditEvent()` to use service client

**Reference:** See `docs/claude-md/known-issues-bug-fixes.md` for full documentation of this pattern.
