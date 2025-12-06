# Story 12.1: Connect GCP Document AI

Status: done

## Story

As a system administrator,
I want the Edge Function to connect to Google Cloud Document AI,
so that document parsing uses a reliable, enterprise-grade service instead of Docling.

## Acceptance Criteria

### AC-12.1.1: Service Account Credentials Configured
- [x] GCP service account JSON key stored as Supabase Edge Function secret
- [x] Secret name: `GOOGLE_SERVICE_ACCOUNT_KEY`
- [x] Key contains: project_id, private_key, client_email

### AC-12.1.2: Environment Variables Configured
- [x] `DOCUMENT_AI_PROCESSOR_ID` environment variable set
- [x] `DOCUMENT_AI_LOCATION` environment variable set (e.g., "us" or "eu")
- [x] Environment variables accessible in Edge Function

### AC-12.1.3: Authentication Verified
- [x] Test API call successfully authenticates with Document AI
- [x] Access token generation from service account works
- [x] JWT signing with RS256 algorithm works in Deno

### AC-12.1.4: Connection Errors Produce Actionable Messages
- [x] Invalid credentials return clear error message
- [x] Missing processor ID returns helpful error
- [x] Network failures are distinguishable from auth failures

## Tasks / Subtasks

- [x] Task 1: Obtain GCP Credentials from Sam (AC: 12.1.1)
  - [x] Get service account JSON key file from Sam
  - [x] Verify key has `documentai.documents.process` permission
  - [x] Note processor ID and region from Sam's GCP console

- [x] Task 2: Configure Edge Function Secrets (AC: 12.1.1, 12.1.2)
  - [x] Set `GOOGLE_SERVICE_ACCOUNT_KEY` secret via Supabase CLI or Dashboard
  - [x] Set `DOCUMENT_AI_PROCESSOR_ID` environment variable
  - [x] Set `DOCUMENT_AI_LOCATION` environment variable
  - [x] Verify secrets are accessible in Edge Function with `Deno.env.get()`

- [x] Task 3: Implement JWT Authentication for GCP (AC: 12.1.3)
  - [x] Create `getAccessToken()` function for service account auth
  - [x] Sign JWT with RS256 using service account private key
  - [x] Exchange JWT for access token via Google OAuth endpoint
  - [x] Cache access token (1 hour TTL)
  - [x] Test: Verify token can be obtained

- [x] Task 4: Create Document AI Client (AC: 12.1.3)
  - [x] Create `documentai-client.ts` module in Edge Function
  - [x] Implement `testConnection()` function
  - [x] Make test API call to Document AI with empty/minimal request
  - [x] Test: Verify connection returns success

- [x] Task 5: Implement Error Handling (AC: 12.1.4)
  - [x] Handle invalid credentials (401 Unauthorized)
  - [x] Handle missing/invalid processor (404 Not Found)
  - [x] Handle network timeouts (ECONNRESET, etc.)
  - [x] Provide actionable error messages for each case
  - [ ] Test: Unit tests for error classification

## Dev Notes

### GCP Service Account Authentication in Deno

Supabase Edge Functions run on Deno, not Node.js. The `google-auth-library` npm package may not work directly. Use raw JWT signing approach:

```typescript
// supabase/functions/process-document/documentai-client.ts

interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

interface AccessTokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: AccessTokenCache | null = null;

/**
 * Get access token for GCP API calls using service account credentials.
 * Implements JWT-based authentication for Deno environment.
 */
export async function getAccessToken(serviceAccount: ServiceAccountKey): Promise<string> {
  // Check cache
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60000) {
    return tokenCache.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  // Base64url encode
  const b64Header = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const b64Payload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${b64Header}.${b64Payload}`;

  // Sign with RS256 using Web Crypto API
  const privateKey = await importPrivateKey(serviceAccount.private_key);
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  const b64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${unsignedToken}.${b64Signature}`;

  // Exchange JWT for access token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

/**
 * Import PEM private key for Web Crypto API
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  // Remove PEM headers and convert to binary
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  return await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}
```

### Document AI Client Configuration

```typescript
// supabase/functions/process-document/documentai-client.ts (continued)

interface DocumentAIConfig {
  projectId: string;
  location: string;
  processorId: string;
}

/**
 * Get Document AI configuration from environment
 */
export function getDocumentAIConfig(): DocumentAIConfig {
  const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
  if (!serviceAccountJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not configured. Add service account JSON as Edge Function secret.');
  }

  const processorId = Deno.env.get('DOCUMENT_AI_PROCESSOR_ID');
  if (!processorId) {
    throw new Error('DOCUMENT_AI_PROCESSOR_ID not configured. Set processor ID from GCP Console.');
  }

  const location = Deno.env.get('DOCUMENT_AI_LOCATION') || 'us';

  const serviceAccount: ServiceAccountKey = JSON.parse(serviceAccountJson);

  return {
    projectId: serviceAccount.project_id,
    location,
    processorId,
  };
}

/**
 * Test connection to Document AI API
 */
export async function testDocumentAIConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const config = getDocumentAIConfig();
    const serviceAccount: ServiceAccountKey = JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY')!);
    const accessToken = await getAccessToken(serviceAccount);

    // Make a lightweight API call to verify connection
    const endpoint = `https://${config.location}-documentai.googleapis.com/v1/projects/${config.projectId}/locations/${config.location}/processors/${config.processorId}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: `Document AI API error: ${error.error?.message || response.statusText}`,
      };
    }

    const processor = await response.json();
    return {
      success: true,
      message: `Connected to processor: ${processor.displayName} (${processor.type})`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
```

### Error Handling

```typescript
// Error classification for Document AI connection issues

export type DocumentAIErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_MISSING_KEY'
  | 'PROCESSOR_NOT_FOUND'
  | 'PROCESSOR_INVALID_REGION'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface DocumentAIConnectionError {
  code: DocumentAIErrorCode;
  message: string;
  userMessage: string;
  suggestedAction: string;
}

export function classifyDocumentAIError(error: Error | string): DocumentAIConnectionError {
  const errorMessage = typeof error === 'string' ? error : error.message;

  if (/GOOGLE_SERVICE_ACCOUNT_KEY not configured/i.test(errorMessage)) {
    return {
      code: 'AUTH_MISSING_KEY',
      message: errorMessage,
      userMessage: 'Document AI credentials not configured.',
      suggestedAction: 'Contact administrator to configure GCP service account.',
    };
  }

  if (/401|Unauthorized|invalid.*credential/i.test(errorMessage)) {
    return {
      code: 'AUTH_INVALID_CREDENTIALS',
      message: errorMessage,
      userMessage: 'Document AI authentication failed.',
      suggestedAction: 'Verify service account key is valid and has correct permissions.',
    };
  }

  if (/404|not.*found|processor/i.test(errorMessage)) {
    return {
      code: 'PROCESSOR_NOT_FOUND',
      message: errorMessage,
      userMessage: 'Document AI processor not found.',
      suggestedAction: 'Verify processor ID and region are correct in GCP Console.',
    };
  }

  if (/ECONNRESET|ECONNREFUSED|network|timeout/i.test(errorMessage)) {
    return {
      code: 'NETWORK_ERROR',
      message: errorMessage,
      userMessage: 'Unable to reach Document AI service.',
      suggestedAction: 'Check network connectivity and try again.',
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: errorMessage,
    userMessage: 'An unexpected error occurred connecting to Document AI.',
    suggestedAction: 'Contact support with error details.',
  };
}
```

### Environment Setup Commands

```bash
# Set Edge Function secrets via Supabase CLI
# First, get the service account JSON from Sam

# Option 1: Via CLI (recommended)
supabase secrets set GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
supabase secrets set DOCUMENT_AI_PROCESSOR_ID='your-processor-id'
supabase secrets set DOCUMENT_AI_LOCATION='us'

# Option 2: Via Supabase Dashboard
# Project Settings > Edge Functions > Secrets
```

### Learnings from Previous Story

**From Story 11.5 (Error Handling & User Feedback) - Status: done**

Key patterns to reuse:

- **Error classification pattern** (`src/lib/documents/error-classification.ts`): Story 12.1 follows same pattern with `DocumentAIErrorCode` type and `classifyDocumentAIError()` function. User messages are non-technical with suggested actions.

- **Edge Function error handling**: Story 11.5 stores `error_category` and `error_code` in processing_jobs table. Document AI connection errors should integrate with this existing classification system.

- **Defensive defaults**: Unknown errors default to permanent category with no auto-retry. Same principle applies to auth failures.

**From Epic 11 Retrospective:**

- **Root cause:** Docling hangs 150+ seconds on complex insurance PDFs. Document AI is the fix.
- **Infrastructure ready:** pg_cron, progress tracking, error handling all work. Just need to swap the parsing service.
- **Test with real docs:** Use `foran auto nationwide.pdf` as litmus test (in `docs/test-documents/`)

[Source: docs/sprint-artifacts/story-11.5-error-handling-user-feedback.md#Dev-Agent-Record]
[Source: docs/sprint-artifacts/epic-11-retrospective.md#Action-Items-for-Epic-12]

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-12.md#Story-12.1] - Acceptance criteria (AC-12.1.1 to AC-12.1.4)
- [Source: docs/sprint-artifacts/tech-spec-epic-12.md#Deno-Compatibility] - JWT auth approach for Deno
- [Source: docs/sprint-artifacts/tech-spec-epic-12.md#Security] - Service account permissions
- [Source: docs/sprint-artifacts/epic-11-retrospective.md#Critical-Priority-P0] - Document AI migration rationale

### Project Structure Notes

**Files to create:**
- `supabase/functions/process-document/documentai-client.ts` - Document AI client module

**Files to modify:**
- `supabase/functions/process-document/index.ts` - Import and use documentai-client (Story 12.3)

**Environment/Secrets to configure:**
- `GOOGLE_SERVICE_ACCOUNT_KEY` - Edge Function secret (JSON string)
- `DOCUMENT_AI_PROCESSOR_ID` - Environment variable
- `DOCUMENT_AI_LOCATION` - Environment variable (default: "us")

**No database migrations required** - Story 12.1 is configuration only

**Testing approach:**
- Manual verification via Supabase Dashboard
- `testDocumentAIConnection()` function for verification
- Integration with existing error classification

---

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/12-1-connect-gcp-document-ai.context.xml`

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- JWT authentication implemented using Web Crypto API (Deno-native)
- Access token caching with 1-hour TTL (60s buffer before expiry)
- Service account requires "Document AI API User" role at project level
- Processor verified: docuMine (OCR_PROCESSOR, ENABLED)
- All secrets configured via Supabase CLI

### File List

- `supabase/functions/process-document/documentai-client.ts` - NEW: Document AI client module

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-05 | Story drafted from create-story workflow | SM Agent |
| 2025-12-05 | Senior Developer Review - APPROVED | Claude (AI) |

---

_Drafted: 2025-12-05_
_Epic: Epic 12 - Google Cloud Document AI Migration_

---

## Senior Developer Review (AI)

### Reviewer
Sam

### Date
2025-12-05

### Outcome
✅ **APPROVE**

**Justification:** All acceptance criteria are fully implemented with excellent code quality. The implementation follows architectural patterns for error handling and logging. The only minor gap is the missing unit tests for error classification, which will be addressed in Story 12.5 (Testing & Validation).

---

### Summary

Story 12.1 successfully connects the Edge Function to Google Cloud Document AI with JWT-based authentication using Deno's native Web Crypto API. The implementation includes robust error classification with actionable user messages and proper token caching.

**Key accomplishments:**
- JWT authentication implemented using Web Crypto API (Deno-native, no npm dependencies)
- Access token caching with 1-hour TTL and 60-second refresh buffer
- Comprehensive error classification covering auth, processor, network, and timeout failures
- Connection test function verified against production Document AI processor

---

### Key Findings

| Severity | Finding | Details |
|----------|---------|---------|
| LOW | Unit tests for error classification not implemented | Task 5 subtask "Test: Unit tests for error classification" was not done. Deferred to Story 12.5. |
| LOW | Task/AC checkboxes were not marked | All work was completed but checkboxes in story file remained unchecked. Corrected in this review. |

---

### Acceptance Criteria Coverage

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC-12.1.1 | Service Account Credentials Configured | ✅ IMPLEMENTED | |
| ↳ | GCP service account JSON key stored as secret | ✅ | `documentai-client.ts:77-82` |
| ↳ | Secret name: `GOOGLE_SERVICE_ACCOUNT_KEY` | ✅ | `documentai-client.ts:77` |
| ↳ | Key contains required fields | ✅ | `documentai-client.ts:20-29` |
| AC-12.1.2 | Environment Variables Configured | ✅ IMPLEMENTED | |
| ↳ | `DOCUMENT_AI_PROCESSOR_ID` set | ✅ | `documentai-client.ts:84-89` |
| ↳ | `DOCUMENT_AI_LOCATION` set | ✅ | `documentai-client.ts:91` |
| ↳ | Variables accessible via `Deno.env.get()` | ✅ | Native Deno API used |
| AC-12.1.3 | Authentication Verified | ✅ IMPLEMENTED | |
| ↳ | Test API call authenticates | ✅ | `documentai-client.ts:268-319` |
| ↳ | Access token generation works | ✅ | `documentai-client.ts:189-249` |
| ↳ | JWT signing with RS256 | ✅ | `documentai-client.ts:214-220` |
| AC-12.1.4 | Connection Errors Produce Actionable Messages | ✅ IMPLEMENTED | |
| ↳ | Invalid credentials error | ✅ | `documentai-client.ts:371-387` |
| ↳ | Missing processor ID error | ✅ | `documentai-client.ts:343-349` |
| ↳ | Network vs auth errors distinguishable | ✅ | Different error codes used |

**Summary:** 12 of 12 AC sub-items fully implemented

---

### Task Completion Validation

| Task | Marked | Verified | Evidence |
|------|--------|----------|----------|
| Task 1: Obtain GCP Credentials | ✅ | ✅ | Completion notes confirm credentials received |
| Task 2: Configure Edge Function Secrets | ✅ | ✅ | All 3 secrets configured via Supabase CLI |
| Task 3: Implement JWT Authentication | ✅ | ✅ | `getAccessToken()` with full JWT flow |
| Task 4: Create Document AI Client | ✅ | ✅ | `documentai-client.ts` created |
| Task 5: Implement Error Handling | ⚠️ | ⚠️ | Done except unit tests (deferred to 12.5) |

**Summary:** 19 of 20 task items verified complete, 1 deferred (unit tests), 0 false completions

---

### Test Coverage and Gaps

| Area | Tests | Gap |
|------|-------|-----|
| Error classification | None | Unit tests for `classifyDocumentAIError()` not created |
| Connection test | Manual | `testDocumentAIConnection()` verified manually in dev |
| JWT authentication | Manual | Token generation verified manually |

**Note:** Story 12.5 (Testing & Validation) will address test coverage comprehensively.

---

### Architectural Alignment

✅ **Fully Aligned**

| Requirement | Status | Notes |
|-------------|--------|-------|
| Deno-native JWT auth | ✅ | Uses Web Crypto API per ADR-009 |
| Structured logging | ✅ | Matches `consistency-rules.md` pattern |
| Error classification | ✅ | Follows Epic 11 pattern with user messages + suggested actions |
| Secret management | ✅ | Uses Edge Function secrets, not hardcoded |

---

### Security Notes

✅ **No security issues found**

- Service account key read from environment, never logged
- Token caching is module-scoped, not exposed
- Private key material only used for signing operations
- No PII or document content logged

---

### Best-Practices and References

- [Google Cloud Document AI Authentication](https://cloud.google.com/document-ai/docs/authentication)
- [Web Crypto API for JWT Signing](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign)
- [Deno Environment Variables](https://deno.land/manual/basics/env_variables)

---

### Action Items

**Code Changes Required:**
- [ ] [Low] Add unit tests for `classifyDocumentAIError()` in Story 12.5 [file: __tests__/supabase/documentai-client.test.ts]

**Advisory Notes:**
- Note: Consider adding `warn` method to log helper for consistency with architecture logging pattern
- Note: Token cache is per-instance; if Edge Function cold starts frequently, cache may be ineffective (acceptable for now)
