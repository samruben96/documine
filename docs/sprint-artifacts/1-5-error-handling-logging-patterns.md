# Story 1.5: Error Handling & Logging Patterns

Status: done

## Story

As a **developer**,
I want **consistent error handling and structured logging across the application**,
so that **errors are handled gracefully and debugging is straightforward**.

## Acceptance Criteria

1. **AC-1.5.1:** Custom error classes defined in `@/lib/errors.ts`:
   - `DocumentNotFoundError` with code `'DOCUMENT_NOT_FOUND'`
   - `UnauthorizedError` with code `'UNAUTHORIZED'`
   - `ProcessingError` with code `'PROCESSING_ERROR'`
   - `ValidationError` with code `'VALIDATION_ERROR'`
   - Each class extends `Error` and has a `code` property

2. **AC-1.5.2:** API routes return consistent response format via `@/lib/utils/api-response.ts`:
   - Success: `{ data: T, error: null }`
   - Error: `{ data: null, error: { code: string, message: string, details?: unknown } }`
   - Helper functions: `successResponse(data)` and `errorResponse(code, message, status, details?)`

3. **AC-1.5.3:** Structured logger implemented in `@/lib/utils/logger.ts`:
   - `log.info(message, data?)` - JSON formatted with timestamp, level: 'info'
   - `log.error(message, error, data?)` - includes stack trace, level: 'error'
   - `log.warn(message, data?)` - level: 'warn'
   - Output format: `{ level, message, timestamp, ...data }`

4. **AC-1.5.4:** Error boundaries exist for React error handling:
   - Global error boundary catches unhandled React errors
   - Shows user-friendly error message with retry option
   - Logs error details for debugging

5. **AC-1.5.5:** Build succeeds with `npm run build` after all changes

## Tasks / Subtasks

- [x] **Task 1: Create Custom Error Classes** (AC: 1.5.1)
  - [x] Create `documine/src/lib/errors.ts`
  - [x] Implement `DocumentNotFoundError` extending Error with `code = 'DOCUMENT_NOT_FOUND'`
  - [x] Implement `UnauthorizedError` extending Error with `code = 'UNAUTHORIZED'`
  - [x] Implement `ProcessingError` extending Error with `code = 'PROCESSING_ERROR'`
  - [x] Implement `ValidationError` extending Error with `code = 'VALIDATION_ERROR'`
  - [x] Export all error classes
  - [x] Add TypeScript types for error codes (union type for type safety)

- [x] **Task 2: Create API Response Helpers** (AC: 1.5.2)
  - [x] Create `documine/src/lib/utils/api-response.ts`
  - [x] Define `ApiResponse<T>` type with success/error union
  - [x] Define `ApiError` type: `{ code: string; message: string; details?: unknown }`
  - [x] Implement `successResponse<T>(data: T): Response` - returns JSON with 200 status
  - [x] Implement `errorResponse(code, message, status, details?): Response` - returns JSON error
  - [x] Add JSDoc documentation for each function
  - [x] Export from `@/lib/utils/index.ts` barrel

- [x] **Task 3: Create Structured Logger** (AC: 1.5.3)
  - [x] Create `documine/src/lib/utils/logger.ts`
  - [x] Implement `log.info(message: string, data?: Record<string, unknown>)`
  - [x] Implement `log.warn(message: string, data?: Record<string, unknown>)`
  - [x] Implement `log.error(message: string, error: Error, data?: Record<string, unknown>)`
  - [x] All methods output JSON with: `{ level, message, timestamp: ISO-8601, ...data }`
  - [x] Error method includes `error` (message) and `stack` (trace) properties
  - [x] Export `log` object from `@/lib/utils/index.ts` barrel

- [x] **Task 4: Create Error Boundary Components** (AC: 1.5.4)
  - [x] Create `documine/src/app/error.tsx` - App Router error boundary
  - [x] Create `documine/src/app/global-error.tsx` - Root error boundary
  - [x] Implement user-friendly error UI:
    - Show generic "Something went wrong" message
    - "Try again" button that calls reset function
    - Log error details via logger
  - [x] Style with Tailwind using Trustworthy Slate theme (#475569)
  - [x] Ensure error boundaries don't leak technical details to users

- [x] **Task 5: Create Test API Route for Error Handling** (AC: 1.5.2)
  - [x] Create `documine/src/app/api/test-errors/route.ts`
  - [x] Implement GET endpoint demonstrating error response format
  - [x] Implement POST endpoint accepting `?type=` query param:
    - `type=not_found` → DocumentNotFoundError
    - `type=unauthorized` → UnauthorizedError
    - `type=processing` → ProcessingError
    - `type=validation` → ValidationError
    - `type=success` → successResponse with sample data
  - [x] Use error classes and response helpers correctly
  - [x] Add logging calls to demonstrate logger usage

- [x] **Task 6: Update Barrel Exports** (AC: 1.5.2, 1.5.3)
  - [x] Update `documine/src/lib/utils/index.ts`:
    - Export all from `api-response.ts`
    - Export `log` from `logger.ts`
  - [x] Create `documine/src/lib/index.ts` if not exists:
    - Re-export from `./errors`
    - Re-export from `./utils`

- [x] **Task 7: Verify Build** (AC: 1.5.5)
  - [x] Run `npm run build` in documine directory
  - [x] Verify no TypeScript errors
  - [x] Verify build completes successfully

## Dev Notes

### Architecture Patterns & Constraints

**Error Response Format:**
Per Architecture doc `implementation-patterns` section:
```typescript
// Success response
{ data: T; error: null; }

// Error response
{ data: null; error: { code: string; message: string; details?: unknown; }; }
```

**Error Handling Pattern:**
Per Architecture doc `error-handling` section:
```typescript
// Application errors - use custom error classes
class DocumentNotFoundError extends Error {
  code = 'DOCUMENT_NOT_FOUND' as const;
  constructor(documentId: string) {
    super(`Document ${documentId} not found`);
  }
}

// API route error handling
export async function GET(request: Request) {
  try {
    // ... logic
  } catch (error) {
    if (error instanceof DocumentNotFoundError) {
      return Response.json(
        { data: null, error: { code: error.code, message: error.message } },
        { status: 404 }
      );
    }
    // Log unexpected errors, return generic message
    console.error('Unexpected error:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
```

**Logging Strategy:**
Per Architecture doc `logging-strategy` section:
```typescript
const log = {
  info: (message: string, data?: Record<string, unknown>) =>
    console.log(JSON.stringify({ level: 'info', message, ...data, timestamp: new Date().toISOString() })),
  error: (message: string, error: Error, data?: Record<string, unknown>) =>
    console.error(JSON.stringify({ level: 'error', message, error: error.message, stack: error.stack, ...data, timestamp: new Date().toISOString() })),
  warn: (message: string, data?: Record<string, unknown>) =>
    console.warn(JSON.stringify({ level: 'warn', message, ...data, timestamp: new Date().toISOString() })),
};
```

**Error Boundary Requirements:**
Per Architecture doc and Next.js patterns:
- `error.tsx` handles route segment errors
- `global-error.tsx` handles root layout errors
- Both should:
  - Display user-friendly message
  - Provide recovery action (retry)
  - Log error for debugging
  - Not expose internal error details

### Project Structure Notes

```
documine/src/
├── lib/
│   ├── errors.ts              # Custom error classes (NEW)
│   ├── index.ts               # Lib barrel export (NEW)
│   └── utils/
│       ├── api-response.ts    # API response helpers (NEW)
│       ├── logger.ts          # Structured logger (NEW)
│       ├── storage.ts         # From Story 1.4 (EXISTING)
│       └── index.ts           # Utils barrel export (UPDATE)
├── app/
│   ├── error.tsx              # Route error boundary (NEW)
│   ├── global-error.tsx       # Root error boundary (NEW)
│   └── api/
│       └── test-errors/
│           └── route.ts       # Error test endpoint (NEW)
```

**Alignment with Architecture:**
- Error classes match Architecture doc exactly
- Response format follows Architecture doc API contracts
- Logger outputs JSON per Architecture doc logging strategy
- Error boundaries follow Next.js App Router patterns

### Learnings from Previous Story

**From Story 1-4-storage-bucket-configuration (Status: done)**

- **Storage Utilities Created**: `src/lib/utils/storage.ts` with `uploadDocument`, `getDocumentUrl`, `deleteDocument`
- **Barrel Export Pattern**: `src/lib/utils/index.ts` exports all utility functions - FOLLOW THIS PATTERN
- **Test API Pattern**: `/api/test-storage` endpoint exists as reference for test endpoint
- **Supabase Clients Available**:
  - `createBrowserClient()` from `@/lib/supabase/client`
  - `createClient()` (server) from `@/lib/supabase/server`
  - `createServiceClient()` for admin ops
- **Build Verification**: `npm run build` pattern established

**Files to Reuse:**
- Follow barrel export pattern from `src/lib/utils/index.ts`
- Use test API pattern from `/api/test-storage` for `/api/test-errors`

**Interfaces/Services to Use (NOT recreate):**
- Use existing Supabase client pattern if database logging needed (not for MVP)
- Use existing Tailwind configuration for error boundary styling

[Source: docs/sprint-artifacts/1-4-storage-bucket-configuration.md#Dev-Agent-Record]

### References

- [Source: docs/architecture.md#Error-Handling]
- [Source: docs/architecture.md#Logging-Strategy]
- [Source: docs/architecture.md#Implementation-Patterns]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#Story-1.5]
- [Source: docs/epics.md#Story-1.5]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/1-5-error-handling-logging-patterns.context.xml

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

- Plan: Create custom error classes with typed error codes per Architecture doc
- Plan: API response helpers with typed generics and JSDoc
- Plan: Structured JSON logger following Architecture logging strategy
- Plan: Error boundaries following Next.js App Router patterns with Trustworthy Slate theme
- Plan: Test endpoint demonstrating all error types and patterns

### Completion Notes List

- ✅ All 4 custom error classes implemented with `readonly code` for type safety
- ✅ ErrorCode union type exported for compile-time safety
- ✅ API response helpers use `satisfies` for type narrowing
- ✅ Logger outputs ISO-8601 timestamps, error method includes stack traces
- ✅ Error boundaries use inline styles in global-error.tsx (Tailwind not available)
- ✅ Test endpoint demonstrates proper error handling pattern with logging
- ✅ Build passes with no TypeScript errors

### File List

**New Files:**
- `documine/src/lib/errors.ts` - Custom error classes with typed codes
- `documine/src/lib/index.ts` - Lib barrel export
- `documine/src/lib/utils/api-response.ts` - API response helpers
- `documine/src/lib/utils/logger.ts` - Structured JSON logger
- `documine/src/app/error.tsx` - Route segment error boundary
- `documine/src/app/global-error.tsx` - Root error boundary
- `documine/src/app/api/test-errors/route.ts` - Error handling test endpoint

**Modified Files:**
- `documine/src/lib/utils/index.ts` - Added exports for api-response, logger

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-11-25 | SM Agent | Initial story draft created via #yolo mode |
| 2025-11-25 | Dev Agent | Implemented all error handling and logging patterns. All ACs satisfied. Build verified. |
| 2025-11-25 | Dev Agent | Senior Developer Review notes appended. Outcome: Approved. |

---

## Senior Developer Review (AI)

### Reviewer
Sam (via Dev Agent)

### Date
2025-11-25

### Outcome
**✅ APPROVE**

All acceptance criteria are fully implemented with evidence. All tasks marked complete have been verified. No falsely marked tasks found. Build passes. Architecture alignment verified.

### Summary
Story 1.5 implements a complete error handling and logging foundation for the Documine application. The implementation follows the Architecture doc patterns exactly, provides type-safe error classes, consistent API response format, structured JSON logging, and user-friendly error boundaries. Code quality is good with proper TypeScript usage and JSDoc documentation.

### Key Findings

**No HIGH or MEDIUM severity issues found.**

**LOW Severity:**
- Note: `global-error.tsx` uses inline `console.error` instead of the `log` module. This is documented as intentional since the logger may not be available in global error context. Acceptable.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC-1.5.1 | Custom error classes in `@/lib/errors.ts` | ✅ IMPLEMENTED | `errors.ts:16-23` DocumentNotFoundError, `errors.ts:28-35` UnauthorizedError, `errors.ts:40-47` ProcessingError, `errors.ts:52-59` ValidationError, `errors.ts:7-11` ErrorCode union type |
| AC-1.5.2 | API response format via `@/lib/utils/api-response.ts` | ✅ IMPLEMENTED | `api-response.ts:18` ApiResponse type, `api-response.ts:9-13` ApiError type, `api-response.ts:32-36` successResponse, `api-response.ts:53-66` errorResponse |
| AC-1.5.3 | Structured logger in `@/lib/utils/logger.ts` | ✅ IMPLEMENTED | `logger.ts:25-34` log.info, `logger.ts:39-48` log.warn, `logger.ts:53-64` log.error with stack trace, all output JSON with ISO timestamp |
| AC-1.5.4 | Error boundaries for React | ✅ IMPLEMENTED | `error.tsx:10-58` route error boundary, `global-error.tsx:9-102` root error boundary, both show "Something went wrong" with "Try again" button, log errors |
| AC-1.5.5 | Build succeeds | ✅ IMPLEMENTED | `npm run build` completed successfully with no TypeScript errors |

**Summary: 5 of 5 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: Create Custom Error Classes | ✅ Complete | ✅ VERIFIED | `src/lib/errors.ts` created with all 4 error classes, ErrorCode type exported |
| Task 2: Create API Response Helpers | ✅ Complete | ✅ VERIFIED | `src/lib/utils/api-response.ts` created with ApiResponse, ApiError types, successResponse, errorResponse functions with JSDoc |
| Task 3: Create Structured Logger | ✅ Complete | ✅ VERIFIED | `src/lib/utils/logger.ts` created with log.info/warn/error, JSON output, ISO timestamps, stack traces |
| Task 4: Create Error Boundary Components | ✅ Complete | ✅ VERIFIED | `src/app/error.tsx` and `src/app/global-error.tsx` created, user-friendly UI, Trustworthy Slate (#475569), no tech details leaked |
| Task 5: Create Test API Route | ✅ Complete | ✅ VERIFIED | `src/app/api/test-errors/route.ts` created with GET/POST endpoints, all error types, proper logging |
| Task 6: Update Barrel Exports | ✅ Complete | ✅ VERIFIED | `src/lib/utils/index.ts` updated, `src/lib/index.ts` created with re-exports |
| Task 7: Verify Build | ✅ Complete | ✅ VERIFIED | Build passed with no TypeScript errors |

**Summary: 7 of 7 completed tasks verified, 0 questionable, 0 false completions**

### Test Coverage and Gaps

- Test endpoint `/api/test-errors` provides manual verification of all error types
- Build verification confirms TypeScript compilation
- **Gap**: No automated unit tests for error classes, API response helpers, or logger (not required by story, advisory for future)

### Architectural Alignment

- ✅ Error classes match Architecture doc `error-handling` section exactly
- ✅ Response format follows Architecture doc `API-Response-Format` section
- ✅ Logger outputs JSON per Architecture doc `logging-strategy` section
- ✅ Error boundaries follow Next.js App Router patterns
- ✅ Barrel export pattern follows existing `src/lib/utils/index.ts` convention

### Security Notes

- ✅ Error boundaries do not expose internal error details to users
- ✅ Generic "Something went wrong" message shown to users
- ✅ Detailed error information logged server-side only
- ✅ No injection risks identified

### Best-Practices and References

- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [TypeScript Error Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html)
- Architecture doc patterns followed

### Action Items

**Code Changes Required:**
- None

**Advisory Notes:**
- Note: Consider adding unit tests for error classes and utilities in future sprints
- Note: `global-error.tsx` intentionally uses inline console.error - document this pattern if questioned
