# Story Q6.2: Skyvern Agent Integration

Status: done

## Story

As a **docuMINE developer**,
I want **an adapter that integrates with the Skyvern AI agent API for browser automation**,
So that **the quote execution engine can delegate form-filling tasks to Skyvern with progress tracking, result extraction, and error handling**.

## Acceptance Criteria

### SkyvernAdapter Implementation (QuoteAgent Interface)

1. **AC-Q6.2-1:** SkyvernAdapter class implements the QuoteAgent interface with `executeQuote()` and `cancel()` methods as defined in the tech spec

2. **AC-Q6.2-2:** Adapter initializes Skyvern client using `SKYVERN_API_KEY` and `SKYVERN_URL` environment variables, with validation that these are configured

3. **AC-Q6.2-3:** Adapter creates task execution requests that map QuoteClientData to Skyvern-compatible task prompts (carrier portal URL, login credentials, form data context)

### Progress Tracking and Callbacks

4. **AC-Q6.2-4:** Adapter receives and processes progress callbacks from Skyvern during task execution, calling the provided `onProgress` callback with `CarrierStatus` updates (currentStep, progressPct)

5. **AC-Q6.2-5:** Adapter handles task completion by extracting structured quote results (premium, coverages, deductibles) from Skyvern response into `QuoteResultData` format

### Error Handling and Retry Logic

6. **AC-Q6.2-6:** Adapter handles task failure with proper error categorization using the `QuoteError` structure: CREDENTIALS_INVALID, CAPTCHA_FAILED, PORTAL_UNAVAILABLE, FORM_CHANGED, TIMEOUT, UNKNOWN

7. **AC-Q6.2-7:** Retry logic implements exponential backoff (2s, 4s, 8s) for recoverable errors (TIMEOUT, PORTAL_UNAVAILABLE) with maximum 3 attempts

## Tasks / Subtasks

### Task 1: Create Skyvern adapter module structure (AC: 2)

- [x] 1.1 Create `src/lib/quoting/agent/` directory structure
- [x] 1.2 Create `src/lib/quoting/agent/skyvern-adapter.ts` file
- [x] 1.3 Add environment variable validation for SKYVERN_API_KEY and SKYVERN_URL
- [x] 1.4 Document env vars in `.env.example` with placeholders

### Task 2: Define TypeScript types for Skyvern integration (AC: 1, 3)

- [x] 2.1 Create `src/types/quoting/agent.ts` with QuoteAgent interface
- [x] 2.2 Define QuoteExecutionParams interface with all required fields
- [x] 2.3 Define QuoteResult and QuoteResultData interfaces
- [x] 2.4 Define CarrierStatus type with status values
- [x] 2.5 Define SkyvernTaskRequest and SkyvernResponse types for API communication

### Task 3: Implement SkyvernAdapter class (AC: 1, 2, 3)

- [x] 3.1 Implement constructor that initializes Skyvern HTTP client with API key and base URL
- [x] 3.2 Implement `executeQuote()` method signature matching QuoteAgent interface
- [x] 3.3 Implement `mapClientDataToPrompt()` helper to convert QuoteClientData to Skyvern task format
- [x] 3.4 Implement task creation request to Skyvern API (POST /tasks)
- [x] 3.5 Implement `cancel()` method to abort running task

### Task 4: Implement progress tracking (AC: 4)

- [x] 4.1 Set up polling mechanism to check task status from Skyvern API
- [x] 4.2 Parse Skyvern status responses and map to CarrierStatus
- [x] 4.3 Call `onProgress` callback with mapped status updates
- [x] 4.4 Handle progress percentage calculation from Skyvern step count

### Task 5: Implement result extraction (AC: 5)

- [x] 5.1 Implement `extractQuoteResult()` to parse Skyvern task completion response
- [x] 5.2 Map Skyvern extracted data to QuoteResultData structure
- [x] 5.3 Handle partial results (some fields extracted, some missing)
- [x] 5.4 Extract and store screenshot URLs from Skyvern response

### Task 6: Implement error handling (AC: 6)

- [x] 6.1 Create `src/lib/quoting/agent/errors.ts` with QuoteError structure
- [x] 6.2 Implement `mapSkyvernErrorToQuoteError()` function
- [x] 6.3 Categorize Skyvern error codes to QuoteError codes
- [x] 6.4 Implement structured error logging for quote errors
- [x] 6.5 Set `recoverable` flag correctly for each error type

### Task 7: Implement retry logic with exponential backoff (AC: 7)

- [x] 7.1 Create retry wrapper with configurable attempts and backoff
- [x] 7.2 Implement exponential backoff (2s, 4s, 8s) for retries
- [x] 7.3 Only retry recoverable errors (TIMEOUT, PORTAL_UNAVAILABLE)
- [x] 7.4 Log retry attempts with attempt number and wait time
- [x] 7.5 After max retries, return final error with retry history

### Task 8: Write unit tests (AC: 1-7)

- [x] 8.1 Create `__tests__/lib/quoting/agent/skyvern-adapter.test.ts`
- [x] 8.2 Test: SkyvernAdapter implements QuoteAgent interface (AC-Q6.2-1)
- [x] 8.3 Test: Adapter validates env vars on construction (AC-Q6.2-2)
- [x] 8.4 Test: Client data mapped correctly to task request (AC-Q6.2-3)
- [x] 8.5 Test: Progress callbacks invoked with mapped status (AC-Q6.2-4)
- [x] 8.6 Test: Result extraction parses Skyvern response correctly (AC-Q6.2-5)
- [x] 8.7 Test: Errors categorized with correct QuoteError codes (AC-Q6.2-6)
- [x] 8.8 Test: Retry logic uses exponential backoff (AC-Q6.2-7)
- [x] 8.9 Test: Cancel aborts running task

### Task 9: Verify build and run tests

- [x] 9.1 Run `npm run build` - verify no TypeScript errors
- [x] 9.2 Run `npm run test` - verify all new tests pass
- [x] 9.3 Run `npm run lint` - verify no lint errors

## Dev Notes

### Architecture Alignment

This story implements the "AI Agent Service Architecture" section from the tech spec. The SkyvernAdapter is the primary implementation of the QuoteAgent interface and will be used by the AgentFactory to execute quote automation tasks.

**Key Architecture Patterns:**

| Pattern | Implementation |
|---------|----------------|
| Adapter Pattern | SkyvernAdapter wraps Skyvern API, exposing QuoteAgent interface |
| Factory Pattern | AgentFactory (Q6.4) will select adapter based on recipe availability |
| Callback Pattern | Progress and CAPTCHA callbacks passed to executeQuote() |
| Error Categorization | All errors mapped to QuoteError structure for consistent handling |

**Integration Points:**

```
┌─────────────────────────┐
│ Quote Orchestrator      │  (Future: Q6.4)
│ (calls executeQuote())  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ SkyvernAdapter          │  ← THIS STORY
│ - executeQuote()        │
│ - cancel()              │
│ - mapClientDataToPrompt │
│ - extractQuoteResult()  │
└───────────┬─────────────┘
            │ HTTP/REST
            ▼
┌─────────────────────────┐
│ Skyvern API             │  (External Service)
│ POST /tasks             │
│ GET /tasks/{id}         │
│ DELETE /tasks/{id}      │
└─────────────────────────┘
```

### Skyvern API Reference

Based on Skyvern documentation, the adapter needs to interact with:

**Create Task:**
```typescript
POST /v1/tasks
{
  "url": "https://carrier-portal.com/login",
  "navigation_goal": "Login with provided credentials and fill quote form",
  "data_extraction_goal": "Extract premium, coverages, and deductibles",
  "navigation_payload": {
    "username": "...",
    "password": "...",
    "client_data": { ... }
  }
}
```

**Get Task Status:**
```typescript
GET /v1/tasks/{task_id}
Response: { status, steps, extracted_data, screenshots }
```

**Cancel Task:**
```typescript
DELETE /v1/tasks/{task_id}
```

### TypeScript Type Definitions

From tech spec, implement these types in `src/types/quoting/`:

```typescript
// agent.ts
export interface QuoteAgent {
  executeQuote(params: QuoteExecutionParams): Promise<QuoteResult>;
  cancel(): Promise<void>;
}

export interface QuoteExecutionParams {
  sessionId: string;
  carrierCode: string;
  clientData: QuoteClientData;
  credentials: DecryptedCredentials;
  recipe?: CarrierRecipe;
  onProgress: (status: CarrierStatus) => void;
  onCaptchaNeeded: (captcha: CaptchaChallenge) => Promise<string>;
}

export interface QuoteResult {
  success: boolean;
  data?: QuoteResultData;
  error?: QuoteError;
  screenshots?: string[];
}

export type CarrierStatus = 'pending' | 'running' | 'captcha_needed' | 'completed' | 'failed';
```

### Error Handling Strategy

**Error Code Mapping:**

| Skyvern Error | QuoteError Code | Recoverable |
|---------------|-----------------|-------------|
| `authentication_failed` | CREDENTIALS_INVALID | No |
| `captcha_detected` | CAPTCHA_FAILED | No (needs human) |
| `site_unavailable`, `connection_error` | PORTAL_UNAVAILABLE | Yes |
| `element_not_found`, `navigation_failed` | FORM_CHANGED | Yes (1 retry) |
| `timeout`, `task_timeout` | TIMEOUT | Yes |
| (all others) | UNKNOWN | No |

**Retry Strategy:**
```typescript
const RETRY_CONFIG = {
  maxAttempts: 3,
  backoffMs: [2000, 4000, 8000], // Exponential
  recoverableCodes: ['TIMEOUT', 'PORTAL_UNAVAILABLE'],
};
```

### Project Structure Notes

Files to create:
```
src/lib/quoting/agent/
├── index.ts                   # Re-exports, agent factory stub
├── skyvern-adapter.ts         # Main adapter implementation
├── errors.ts                  # QuoteError handling utilities

src/types/quoting/
├── agent.ts                   # QuoteAgent, QuoteExecutionParams, QuoteResult
├── execution.ts               # QuoteJob, CarrierJobStatus (from Q6.1)

__tests__/lib/quoting/agent/
└── skyvern-adapter.test.ts    # Unit tests with mocked Skyvern API
```

### Environment Variables

Add to `.env.example`:
```bash
# Skyvern AI Agent Configuration
SKYVERN_API_KEY=sk_...
SKYVERN_URL=https://api.skyvern.com/v1
```

### Testing Strategy

**Unit Tests (this story):**
- Mock Skyvern HTTP client responses
- Test all interface methods
- Test error mapping completeness
- Test retry logic timing

**Integration Tests (Q6.4+):**
- Real Skyvern API calls (separate test environment)
- End-to-end job execution
- Performance benchmarks

### Learnings from Previous Story

**From Story Q6-1-database-schema-ai-quoting (Status: done)**

- **Database tables created**: `quote_jobs`, `quote_job_carriers`, `carrier_recipes` now exist with all required columns for job tracking
- **TypeScript types available**: `QuoteJob`, `QuoteJobCarrier`, `CarrierRecipe` types in `database.types.ts` - use these for database operations
- **RLS patterns established**: Agency scoping via `get_user_agency_id()` - follow this pattern for any new tables
- **Migration location**: `supabase/migrations/20251212200000_create_ai_quoting_tables.sql` - reference for schema details
- **Test patterns**: RLS integration tests at `__tests__/lib/quoting/quote-jobs-rls.test.ts` - follow similar test structure
- **Status enums**: Job status values (pending, queued, running, completed, failed, partial) and carrier status values (pending, running, captcha_needed, completed, failed) defined in migration

**Key infrastructure to use:**
- `quote_job_carriers.status` column stores CarrierStatus values - adapter updates this
- `quote_job_carriers.current_step` and `progress_pct` for progress tracking
- `quote_job_carriers.result` JSONB for storing QuoteResultData

[Source: docs/sprint-artifacts/epics/epic-Q6/stories/Q6-1-database-schema-ai-quoting/story.md#Dev-Agent-Record]

### References

- [Source: docs/sprint-artifacts/epics/epic-Q6/tech-spec.md#Story-Q6.2-Skyvern-Agent-Integration] - Acceptance criteria AC-Q6.2.1 through AC-Q6.2.7
- [Source: docs/sprint-artifacts/epics/epic-Q6/tech-spec.md#APIs-and-Interfaces] - SkyvernAdapter class specification
- [Source: docs/sprint-artifacts/epics/epic-Q6/tech-spec.md#TypeScript-Interfaces] - QuoteAgent interface definition
- [Source: docs/features/quoting/phase-4-architecture.md#AI-Agent-Service-Architecture] - Adapter pattern and agent factory
- [Source: docs/sprint-artifacts/epics/epic-Q6/tech-spec.md#Traceability-Mapping] - AC to component mapping

## Dev Agent Record

### Context Reference

- [Q6-2-skyvern-agent-integration.context.xml](./Q6-2-skyvern-agent-integration.context.xml)

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Implementation followed adapter pattern from tech spec
- Used native fetch() for Skyvern API calls (no SDK package exists)
- Named AI execution status as `AgentExecutionStatus` to avoid confusion with existing `CarrierStatus` in carriers/types.ts
- Polling interval set to 2 seconds as specified in constraints

### Completion Notes List

- **AC-Q6.2-1**: SkyvernAdapter class implements QuoteAgent interface with executeQuote() and cancel() methods
- **AC-Q6.2-2**: Environment validation in loadSkyvernConfig() throws descriptive errors for missing SKYVERN_API_KEY or invalid SKYVERN_URL
- **AC-Q6.2-3**: mapClientDataToTaskRequest() converts QuoteClientData to Skyvern task format with carrier portal URL, credentials, and client data
- **AC-Q6.2-4**: Progress tracking via polling with mapTaskToProgress() calling onProgress callback with status updates
- **AC-Q6.2-5**: extractQuoteResult() parses premium (handles $1,234.56 format), coverages, and deductibles from Skyvern response
- **AC-Q6.2-6**: mapSkyvernErrorToQuoteError() categorizes errors to CREDENTIALS_INVALID, CAPTCHA_FAILED, PORTAL_UNAVAILABLE, FORM_CHANGED, TIMEOUT, UNKNOWN
- **AC-Q6.2-7**: Retry logic with exponential backoff (2s, 4s, 8s), max 3 attempts, only for recoverable errors (TIMEOUT, PORTAL_UNAVAILABLE)
- All 40 unit tests passing covering all acceptance criteria

### File List

**New Files:**
- `src/lib/quoting/agent/index.ts` - Module exports and re-exports
- `src/lib/quoting/agent/skyvern-adapter.ts` - SkyvernAdapter implementation
- `src/lib/quoting/agent/errors.ts` - QuoteAgentError and error mapping utilities
- `src/types/quoting/agent.ts` - QuoteAgent interface and related types
- `src/types/quoting/index.ts` - Types module re-exports
- `__tests__/lib/quoting/agent/skyvern-adapter.test.ts` - Unit tests (40 tests)

**Modified Files:**
- `.env.example` - Added SKYVERN_API_KEY and SKYVERN_URL entries

## Change Log

- 2025-12-12: Story Q6.2 drafted - Skyvern Agent Integration
- 2025-12-12: Story Q6.2 implementation complete - All tasks done, 40 tests passing
- 2025-12-12: Senior Developer Review - APPROVED

## Senior Developer Review (AI)

### Reviewer
Sam (via Claude Opus 4.5)

### Date
2025-12-12

### Outcome
✅ **APPROVED**

All 7 acceptance criteria fully implemented with evidence. All 44 subtasks verified complete. 40 tests passing. Code quality excellent.

### Summary

Story Q6.2 implements the Skyvern Agent Integration for AI-powered browser automation. The implementation follows the adapter pattern as specified in the tech spec, with comprehensive type definitions, error handling, and retry logic.

### Key Findings

**HIGH Severity:** None

**MEDIUM Severity:** None

**LOW Severity:** None

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC-Q6.2-1 | SkyvernAdapter implements QuoteAgent interface | ✅ | `skyvern-adapter.ts:137` |
| AC-Q6.2-2 | Env var validation | ✅ | `skyvern-adapter.ts:109-131` |
| AC-Q6.2-3 | Maps QuoteClientData to Skyvern task | ✅ | `skyvern-adapter.ts:331-353` |
| AC-Q6.2-4 | Progress callbacks via onProgress | ✅ | `skyvern-adapter.ts:457-481` |
| AC-Q6.2-5 | Result extraction to QuoteResultData | ✅ | `skyvern-adapter.ts:500-539` |
| AC-Q6.2-6 | Error categorization (6 codes) | ✅ | `errors.ts:91-185` |
| AC-Q6.2-7 | Exponential backoff retry | ✅ | `skyvern-adapter.ts:93-97,165-224` |

**Summary: 7 of 7 ACs implemented**

### Task Completion Validation

**Summary: 44 of 44 subtasks verified complete, 0 questionable, 0 false completions**

All tasks verified with code evidence:
- Module structure created ✅
- TypeScript types defined ✅
- SkyvernAdapter class implemented ✅
- Progress tracking implemented ✅
- Result extraction implemented ✅
- Error handling implemented ✅
- Retry logic implemented ✅
- Unit tests written (40 tests) ✅
- Build/test/lint passing ✅

### Test Coverage and Gaps

- 40 unit tests covering all acceptance criteria
- Tests use mocked fetch for Skyvern API
- Edge cases covered (partial results, cancel, retries)
- No gaps identified

### Architectural Alignment

✅ Adapter pattern properly implemented
✅ QuoteAgent interface satisfied
✅ Stateless design (only tracks current task)
✅ No direct database writes
✅ Consistent error structure

### Security Notes

✅ API keys validated but never logged
✅ Credentials passed separately, not in logs
✅ No security concerns identified

### Best-Practices and References

- Native fetch() used (no Skyvern SDK exists)
- 2s polling interval as specified
- Comprehensive JSDoc with AC references

### Action Items

**Code Changes Required:**
(none)

**Advisory Notes:**
- Note: Consider renaming `sanitizeClientData` to `copyClientData` for clarity [file: skyvern-adapter.ts:379]
- Note: Integration tests recommended when implementing Q6.4
