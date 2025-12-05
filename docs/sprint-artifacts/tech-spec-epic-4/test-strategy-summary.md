# Test Strategy Summary

## Test Levels

| Level | Scope | Framework | Coverage Target |
|-------|-------|-----------|-----------------|
| Unit | Chunking logic, validation schemas, utility functions | Vitest | 80%+ for core logic |
| Integration | Upload flow, processing pipeline, CRUD operations | Vitest + Supabase local | All server actions |
| Component | Upload zone, document list, status indicators | Vitest + Testing Library | Key user interactions |
| E2E | Full upload-to-ready journey | Manual for MVP, Playwright later | Critical paths |

## Key Test Scenarios

**Upload Zone:**
- Valid PDF uploads successfully
- Invalid file type rejected with correct message
- Oversized file rejected with correct message
- Multiple files upload in parallel
- Progress bar updates during upload
- Cancel aborts upload

**Document List:**
- Documents load and display correctly
- Search filters by filename
- Label filter shows matching documents
- Sort order is newest first
- Selected document highlights correctly
- Empty state displays for new users

**Document Processing:**
- LlamaParse receives PDF and returns markdown
- Chunking produces correct token sizes with overlap
- Embeddings generated for all chunks
- Status updates to 'ready' on success
- Status updates to 'failed' on error with message
- Retry creates new processing job

**Delete:**
- Confirmation modal displays correctly
- Delete removes document from DB
- Delete removes file from storage
- Cascade deletes chunks and conversations
- Navigation after deleting viewed document

**Labels/Rename:**
- Inline rename works with Enter/Escape
- Validation rejects invalid names
- Labels add/remove correctly
- Autocomplete shows existing labels
- Max 10 labels enforced

**Queue Management:**
- FIFO ordering respected
- One job per agency at a time
- Cross-agency parallelism works
- Stale job detection marks failed
- Rate limiting enforced

## Test Data

```typescript
// Test fixtures
const testPdf = new File(['%PDF-1.4...'], 'test-policy.pdf', { type: 'application/pdf' });
const testDocx = new File(['...'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
const largePdf = new File([new ArrayBuffer(51 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });

const mockDocument: Document = {
  id: 'doc-123',
  agencyId: 'agency-456',
  uploadedBy: 'user-789',
  filename: 'test-policy.pdf',
  displayName: null,
  storagePath: 'agency-456/doc-123/test-policy.pdf',
  status: 'ready',
  pageCount: 10,
  labels: ['auto', 'renewal'],
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

## Mocking Strategy

| Dependency | Mock Approach |
|------------|---------------|
| Supabase Storage | Mock upload/download responses |
| Supabase Database | Supabase local for integration, mock for unit |
| Supabase Realtime | Mock subscription callbacks |
| LlamaParse API | MSW or manual mock responses |
| OpenAI Embeddings | Mock fixed 1536-dim vectors |
| Edge Functions | Test locally with Supabase CLI |
