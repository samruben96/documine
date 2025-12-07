# Story 14.2: AI Buddy API Route Structure

Status: done

## Story

As a **developer**,
I want the AI Buddy API route structure and shared utilities to be created,
so that subsequent AI Buddy features have a consistent API layer to build upon.

## Acceptance Criteria

1. **AC 14.2.1 - Route Structure Matches Spec:** All API route directories and stub files created:
   - `src/app/api/ai-buddy/chat/route.ts` - Chat endpoint stub
   - `src/app/api/ai-buddy/projects/route.ts` - Projects CRUD stub
   - `src/app/api/ai-buddy/conversations/route.ts` - Conversations listing stub
   - `src/app/api/ai-buddy/preferences/route.ts` - User preferences stub
   - `src/app/api/ai-buddy/admin/guardrails/route.ts` - Admin guardrails stub
   - `src/app/api/ai-buddy/admin/audit-logs/route.ts` - Admin audit logs stub
   - `src/app/api/ai-buddy/admin/users/route.ts` - Admin users stub

2. **AC 14.2.2 - Shared Utilities Created:** All utility modules exist in `src/lib/ai-buddy/`:
   - `ai-client.ts` - OpenAI client wrapper (stub with types)
   - `guardrails.ts` - Guardrail checking functions (stub)
   - `prompt-builder.ts` - System prompt construction (stub)
   - `audit-logger.ts` - Audit log creation via service role (stub)
   - `rate-limiter.ts` - Rate limit checking (stub)
   - `index.ts` - Barrel export for all utilities

3. **AC 14.2.3 - Types Defined:** All TypeScript interfaces from tech-spec section 6 exist in `src/types/ai-buddy.ts`:
   - Entity types: Project, Conversation, Message, Citation, GuardrailConfig, etc.
   - Enum types: MessageRole, ConfidenceLevel, Permission
   - API types: ApiResponse, ApiError, ChatRequest, StreamChunk, etc.
   - Request/Response types for all endpoints

4. **AC 14.2.4 - Consistent Response Format:** All route stubs use the standard response format:
   - Success: `{ data: T, error: null }`
   - Error: `{ data: null, error: { code: string, message: string, details?: unknown } }`

5. **AC 14.2.5 - Error Codes Follow Pattern:** Error codes utility exports all AIB_XXX codes:
   - AIB_001: Unauthorized (401)
   - AIB_002: Forbidden (403)
   - AIB_003: Rate limit exceeded (429)
   - AIB_004: Invalid request body (400)
   - AIB_005: Resource not found (404)
   - AIB_006: Internal server error (500)
   - AIB_007: AI service unavailable (503)

## Tasks / Subtasks

- [x] Task 1: Create TypeScript types (AC: 14.2.3)
  - [x] 1.1 Create `src/types/ai-buddy.ts` with all entity interfaces
  - [x] 1.2 Add MessageRole, ConfidenceLevel, Permission type aliases
  - [x] 1.3 Add ApiResponse<T> and ApiError interfaces
  - [x] 1.4 Add ChatRequest, StreamChunk, and other API request/response types
  - [x] 1.5 Export all types from file

- [x] Task 2: Create shared utilities (AC: 14.2.2, 14.2.5)
  - [x] 2.1 Create `src/lib/ai-buddy/` directory
  - [x] 2.2 Create `errors.ts` with AIB_XXX error codes and helper functions
  - [x] 2.3 Create `ai-client.ts` stub with type signatures
  - [x] 2.4 Create `guardrails.ts` stub with type signatures
  - [x] 2.5 Create `prompt-builder.ts` stub with type signatures
  - [x] 2.6 Create `audit-logger.ts` stub with type signatures
  - [x] 2.7 Create `rate-limiter.ts` stub with type signatures
  - [x] 2.8 Create `index.ts` barrel export

- [x] Task 3: Create API route stubs (AC: 14.2.1, 14.2.4)
  - [x] 3.1 Create `src/app/api/ai-buddy/` directory structure
  - [x] 3.2 Create `chat/route.ts` with POST stub returning standard format
  - [x] 3.3 Create `projects/route.ts` with GET/POST stubs
  - [x] 3.4 Create `conversations/route.ts` with GET stub
  - [x] 3.5 Create `preferences/route.ts` with GET/PATCH stubs
  - [x] 3.6 Create `admin/guardrails/route.ts` with GET/PATCH stubs
  - [x] 3.7 Create `admin/audit-logs/route.ts` with GET stub
  - [x] 3.8 Create `admin/users/route.ts` with GET/POST/DELETE stubs

- [x] Task 4: Verify implementation (AC: All)
  - [x] 4.1 Run TypeScript compilation to verify types
  - [x] 4.2 Run build to ensure routes compile
  - [x] 4.3 Verify all files exist in correct locations

## Dev Notes

### Architecture Patterns
- Route stubs return "not implemented" responses with correct format
- Utilities export function signatures with placeholder implementations
- Types follow camelCase for properties (database uses snake_case, transform on boundary)
- All routes should be async and use NextRequest/NextResponse
- Error helper functions should construct ApiError objects

### Source Tree Components
- `src/types/ai-buddy.ts` - All TypeScript interfaces
- `src/lib/ai-buddy/` - Shared utility modules
- `src/app/api/ai-buddy/` - API route handlers

### Testing Standards
- TypeScript compilation must pass
- Build must complete without errors
- File existence verification for all required paths

### Project Structure Notes
- API routes use Next.js 15 App Router conventions
- Route handlers export named functions: GET, POST, PATCH, DELETE
- Use NextRequest for request parsing, NextResponse for responses

### Learnings from Previous Story
- Story 14.1 established database patterns (user-level isolation, agency scoping)
- RLS uses `auth.uid()` for user identification
- Agency scoping uses `get_user_agency_id()` helper

### References

- [Source: docs/sprint-artifacts/epics/epic-14/tech-spec.md#3.3] Directory Structure
- [Source: docs/sprint-artifacts/epics/epic-14/tech-spec.md#5] API Interfaces
- [Source: docs/sprint-artifacts/epics/epic-14/tech-spec.md#6] TypeScript Interfaces
- [Source: docs/features/ai-buddy/architecture.md] System Architecture

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/epics/epic-14/stories/14-2-api-route-structure/14-2-api-route-structure.context.xml

### Agent Model Used

Claude Opus 4.5

### Debug Log References

### Completion Notes List

- 2025-12-07: All 5 ACs verified and passing
- AC 14.2.1: 7 API route stubs created in correct directory structure
- AC 14.2.2: 7 utility modules created with stub implementations
- AC 14.2.3: TypeScript types file with all entity, enum, and API types
- AC 14.2.4: All routes use standard AiBuddyApiResponse format via notImplementedResponse()
- AC 14.2.5: errors.ts exports AIB_ERROR_CODES with all 7 error codes + helper functions
- TypeScript compilation: PASS
- Build: PASS
- Tests: 1564/1564 pass (no regressions)

### File List

- src/types/ai-buddy.ts (NEW)
- src/lib/ai-buddy/errors.ts (NEW)
- src/lib/ai-buddy/ai-client.ts (NEW)
- src/lib/ai-buddy/guardrails.ts (NEW)
- src/lib/ai-buddy/prompt-builder.ts (NEW)
- src/lib/ai-buddy/audit-logger.ts (NEW)
- src/lib/ai-buddy/rate-limiter.ts (NEW)
- src/lib/ai-buddy/index.ts (NEW)
- src/app/api/ai-buddy/chat/route.ts (NEW)
- src/app/api/ai-buddy/projects/route.ts (NEW)
- src/app/api/ai-buddy/conversations/route.ts (NEW)
- src/app/api/ai-buddy/preferences/route.ts (NEW)
- src/app/api/ai-buddy/admin/guardrails/route.ts (NEW)
- src/app/api/ai-buddy/admin/audit-logs/route.ts (NEW)
- src/app/api/ai-buddy/admin/users/route.ts (NEW)

---

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-07 | 1.0 | Story created from tech-spec |
| 2025-12-07 | 1.1 | Implementation complete - all ACs satisfied |
| 2025-12-07 | 1.2 | Senior Developer Review notes appended - APPROVED |

---

## Senior Developer Review (AI)

### Reviewer
Sam (via Claude Opus 4.5)

### Date
2025-12-07

### Outcome
✅ **APPROVE**

All 5 acceptance criteria fully implemented with evidence. All 22 tasks verified complete. No HIGH or MEDIUM severity issues. Security review passed. Best practices followed.

### Summary

Story 14.2 creates the foundational API infrastructure for AI Buddy with 7 route stubs, 7 utility modules, and comprehensive TypeScript types. The implementation follows Next.js 15 App Router conventions and establishes consistent patterns for error handling and response formats.

### Key Findings

**No HIGH or MEDIUM severity issues found.**

**LOW Severity:**
- [ ] [Low] Consider adding JSDoc @example tags to utility functions for better IDE support [file: src/lib/ai-buddy/errors.ts]

**INFO:**
- Note: All utility stubs correctly throw "Not implemented" errors for deferred functionality
- Note: Route stubs use notImplementedResponse() for consistent 501 responses
- Note: TypeScript types use camelCase per spec (database uses snake_case, transform at boundary)

### Acceptance Criteria Coverage

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| 14.2.1 | Route structure matches spec | ✅ IMPLEMENTED | src/app/api/ai-buddy/**/route.ts (7 files) |
| 14.2.2 | Shared utilities created | ✅ IMPLEMENTED | src/lib/ai-buddy/*.ts (7 files) |
| 14.2.3 | Types defined | ✅ IMPLEMENTED | src/types/ai-buddy.ts:1-198 |
| 14.2.4 | Consistent response format | ✅ IMPLEMENTED | errors.ts:46-64, route stubs line 29-31 |
| 14.2.5 | Error codes follow pattern | ✅ IMPLEMENTED | errors.ts:15-24 |

**Summary: 5 of 5 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| 1.1 Create ai-buddy.ts | [x] | ✅ VERIFIED | src/types/ai-buddy.ts exists |
| 1.2 Add enum types | [x] | ✅ VERIFIED | :11-18 MessageRole, ConfidenceLevel, Permission |
| 1.3 Add ApiResponse/ApiError | [x] | ✅ VERIFIED | :124-133 AiBuddyApiResponse, AiBuddyApiError |
| 1.4 Add ChatRequest, StreamChunk | [x] | ✅ VERIFIED | :137-154 |
| 1.5 Export all types | [x] | ✅ VERIFIED | All interfaces exported |
| 2.1 Create lib/ai-buddy/ | [x] | ✅ VERIFIED | Directory exists with 7 files |
| 2.2 Create errors.ts | [x] | ✅ VERIFIED | errors.ts:1-92 |
| 2.3 Create ai-client.ts | [x] | ✅ VERIFIED | ai-client.ts exists |
| 2.4 Create guardrails.ts | [x] | ✅ VERIFIED | guardrails.ts exists |
| 2.5 Create prompt-builder.ts | [x] | ✅ VERIFIED | prompt-builder.ts exists |
| 2.6 Create audit-logger.ts | [x] | ✅ VERIFIED | audit-logger.ts exists |
| 2.7 Create rate-limiter.ts | [x] | ✅ VERIFIED | rate-limiter.ts exists |
| 2.8 Create index.ts | [x] | ✅ VERIFIED | index.ts:1-64 barrel export |
| 3.1 Create directory structure | [x] | ✅ VERIFIED | api/ai-buddy/ and api/ai-buddy/admin/ |
| 3.2 Create chat/route.ts | [x] | ✅ VERIFIED | chat/route.ts:29-31 POST stub |
| 3.3 Create projects/route.ts | [x] | ✅ VERIFIED | projects/route.ts GET/POST stubs |
| 3.4 Create conversations/route.ts | [x] | ✅ VERIFIED | conversations/route.ts GET stub |
| 3.5 Create preferences/route.ts | [x] | ✅ VERIFIED | preferences/route.ts GET/PATCH stubs |
| 3.6 Create admin/guardrails/route.ts | [x] | ✅ VERIFIED | admin/guardrails/route.ts GET/PATCH stubs |
| 3.7 Create admin/audit-logs/route.ts | [x] | ✅ VERIFIED | admin/audit-logs/route.ts GET stub |
| 3.8 Create admin/users/route.ts | [x] | ✅ VERIFIED | admin/users/route.ts GET/POST/DELETE stubs |
| 4.1 TypeScript compilation | [x] | ✅ VERIFIED | tsc --noEmit passes |
| 4.2 Build | [x] | ✅ VERIFIED | npm run build passes |
| 4.3 Verify file existence | [x] | ✅ VERIFIED | ls -la confirms all 15 files |

**Summary: 22 of 22 completed tasks verified, 0 questionable, 0 falsely marked complete**

### Test Coverage and Gaps

| Test Type | Status | Notes |
|-----------|--------|-------|
| TypeScript compilation | ✅ | Passes |
| Build | ✅ | Passes |
| Regression tests | ✅ | 1564/1564 pass |
| Unit tests for stubs | N/A | Stubs return 501, no functional tests needed |

No test gaps identified for this infrastructure story.

### Architectural Alignment

| Constraint | Status | Notes |
|------------|--------|-------|
| Next.js 15 App Router | ✅ | Routes in app/api/ with named exports |
| Standard response format | ✅ | AiBuddyApiResponse<T> pattern |
| Error code pattern | ✅ | AIB_XXX codes |
| camelCase types | ✅ | All interface properties use camelCase |
| Barrel exports | ✅ | index.ts exports all utilities |

Tech-spec compliance: **100%**

### Security Notes

| Check | Status |
|-------|--------|
| No hardcoded secrets | ✅ |
| Type-safe error handling | ✅ |
| Proper HTTP status codes | ✅ |

No security vulnerabilities identified.

### Best-Practices and References

- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

### Action Items

**Code Changes Required:**
- None required for approval

**Advisory Notes:**
- Note: Consider adding JSDoc @example tags to utility functions for better IDE support
- Note: Future stories will implement actual functionality replacing stub throws
