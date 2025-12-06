# Epic 12: Google Cloud Document AI Migration (2025-12-05)

## Overview

Replacing Docling with Google Cloud Document AI for faster, more reliable PDF parsing.

**Reason:** Docling hangs for 150+ seconds on complex insurance PDFs (e.g., foran auto nationwide.pdf)
**Expected:** 5-30 second processing vs 150+ seconds

## GCP Service Account Auth (Story 12.1)

### JWT Authentication Pattern

```typescript
import { SignJWT, importPKCS8 } from 'jose';

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const jwt = await new SignJWT({
    iss: GCP_CLIENT_EMAIL,
    sub: GCP_CLIENT_EMAIL,
    aud: 'https://documentai.googleapis.com/',
    iat: now,
    exp: now + 3600,
  })
  .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
  .sign(await importPKCS8(GCP_PRIVATE_KEY, 'RS256'));

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const { access_token } = await response.json();
  return access_token;
}
```

### Token Caching

```typescript
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getCachedAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.token;
  }

  const token = await getAccessToken();
  cachedToken = { token, expiresAt: now + 3600000 };
  return token;
}
```

## Document AI Parsing Service (Story 12.2)

### Service Interface

```typescript
interface DocumentAIService {
  parseDocument(fileBuffer: ArrayBuffer): Promise<ParsedDocument>;
}

interface ParsedDocument {
  text: string;
  pages: ParsedPage[];
  tables: ParsedTable[];
}

interface ParsedPage {
  pageNumber: number;
  text: string;
  width: number;
  height: number;
}
```

### API Call Pattern

```typescript
const endpoint = `https://documentai.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/processors/${PROCESSOR_ID}:process`;

const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    rawDocument: {
      content: Buffer.from(fileBuffer).toString('base64'),
      mimeType: 'application/pdf',
    },
  }),
});
```

## Environment Variables

```bash
# Required in Edge Function secrets
GCP_PROJECT_ID=documine-ai
GCP_LOCATION=us
GCP_PROCESSOR_ID=<your-processor-id>
GCP_CLIENT_EMAIL=document-ai@documine-ai.iam.gserviceaccount.com
GCP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

## Error Classification

```typescript
const GCP_ERROR_CLASSIFICATION: Record<string, ErrorCategory> = {
  'RESOURCE_EXHAUSTED': 'transient',     // Rate limit - retry
  'DEADLINE_EXCEEDED': 'transient',      // Timeout - retry
  'INTERNAL': 'transient',               // GCP issue - retry
  'INVALID_ARGUMENT': 'recoverable',     // Bad PDF - user action
  'PERMISSION_DENIED': 'permanent',      // Auth issue - support
};
```

## Cost

- ~$1.50 per 1000 pages (~$0.08 per typical document)
- Much cheaper than Docling Railway hosting

## Migration Status

| Story | Status |
|-------|--------|
| 12.1: Connect GCP Document AI | ✅ Done |
| 12.2: Document AI Parsing Service | ✅ Done |
| 12.3: Edge Function Integration | 🔄 In Progress |
| 12.4: Response Parsing | ⏳ Backlog |
| 12.5: Testing & Validation | ⏳ Backlog |

## Post-Migration Cleanup

After Epic 12 completes:
- Cancel Railway account (Docling service no longer needed)
- Remove Docling-related code from Edge Function
- Update document processing metrics
