# Story 12.6: Batch Processing for Large Documents

Status: todo

## Story

As a user uploading large insurance documents,
I want the system to automatically handle documents over 15 pages using batch processing,
so that I can process comprehensive policy documents without hitting API limits.

## Acceptance Criteria

### AC-12.6.1: Page Count Detection Before Processing
- [ ] PDF page count extracted before calling Document AI
- [ ] Page count available without fully parsing the document
- [ ] Supports PDF, DOCX, and image formats

### AC-12.6.2: Documents ≤15 Pages Use Online Processing
- [ ] Documents with 15 or fewer pages use synchronous `process` endpoint
- [ ] Online processing completes in single API call
- [ ] Existing progress reporting continues to work

### AC-12.6.3: Documents >15 Pages Use Batch Processing
- [ ] Documents exceeding 15 pages automatically route to batch processing
- [ ] Decision logged for debugging
- [ ] User sees appropriate progress messages for batch mode

### AC-12.6.4: Batch Processing Uploads PDF to GCS
- [ ] PDF uploaded to GCS bucket before processing
- [ ] Unique path: `documine-batch/{document_id}/{filename}`
- [ ] Upload uses service account credentials

### AC-12.6.5: Batch Processing Polls for Completion
- [ ] `batchProcess` API called with GCS input/output URIs
- [ ] Polling interval: 5 seconds
- [ ] Maximum wait time: 5 minutes (300 seconds)
- [ ] Timeout produces recoverable error

### AC-12.6.6: Batch Processing Downloads Results from GCS
- [ ] Results downloaded from GCS output location
- [ ] JSON response parsed into Document AI format
- [ ] Cleanup: input file deleted after processing

### AC-12.6.7: Progress Updates Reflect Batch Processing Stages
- [ ] Stage: "Uploading to cloud..." during GCS upload
- [ ] Stage: "Processing large document..." during batch wait
- [ ] Stage: "Downloading results..." during result retrieval
- [ ] Total progress reflects batch processing timeline

### AC-12.6.8: GCS Bucket Configured with Auto-Delete
- [ ] Bucket lifecycle rule: delete objects after 24 hours
- [ ] Prevents storage cost accumulation
- [ ] Documented in ops runbook

## Tasks / Subtasks

- [ ] Task 1: Create GCS Bucket for Batch Processing (AC: 12.6.4, 12.6.8)
  - [ ] Create bucket `documine-batch-processing` in us region
  - [ ] Configure lifecycle rule: delete after 1 day
  - [ ] Grant service account `storage.objectAdmin` role on bucket
  - [ ] Document bucket in architecture docs

- [ ] Task 2: Implement Page Count Detection (AC: 12.6.1)
  - [ ] Research PDF page count extraction in Deno
  - [ ] Implement `getPageCount(pdfBuffer)` function
  - [ ] Handle edge cases (encrypted PDFs, invalid files)
  - [ ] Test with various document sizes

- [ ] Task 3: Implement Processing Mode Selection (AC: 12.6.2, 12.6.3)
  - [ ] Add `selectProcessingMode(pageCount)` function
  - [ ] Threshold constant: `BATCH_PROCESSING_THRESHOLD = 15`
  - [ ] Log decision for debugging
  - [ ] Update main processing flow to use selector

- [ ] Task 4: Implement GCS Upload/Download (AC: 12.6.4, 12.6.6)
  - [ ] Create `uploadToGCS(buffer, path)` function
  - [ ] Create `downloadFromGCS(path)` function
  - [ ] Create `deleteFromGCS(path)` function
  - [ ] Use signed URLs or service account auth
  - [ ] Test upload/download cycle

- [ ] Task 5: Implement Batch Processing API Call (AC: 12.6.5)
  - [ ] Create `batchProcessDocument(inputUri, outputUri)` function
  - [ ] Implement polling with exponential backoff
  - [ ] Handle timeout (5 minute max)
  - [ ] Parse batch operation response

- [ ] Task 6: Update Progress Reporting (AC: 12.6.7)
  - [ ] Add batch-specific stage names
  - [ ] Update progress calculation for batch mode
  - [ ] Test Realtime updates during batch processing

- [ ] Task 7: Integration Testing (AC: all)
  - [ ] Test with 10-page document (online mode)
  - [ ] Test with 20-page document (batch mode)
  - [ ] Test with 50-page document (batch mode)
  - [ ] Verify progress updates in UI

## Dev Notes

### GCS Bucket Setup

```bash
# Create bucket (run once)
gcloud storage buckets create gs://documine-batch-processing \
  --project=documine-480319 \
  --location=us \
  --uniform-bucket-level-access

# Set lifecycle rule
cat > lifecycle.json << EOF
{
  "rule": [{
    "action": {"type": "Delete"},
    "condition": {"age": 1}
  }]
}
EOF
gcloud storage buckets update gs://documine-batch-processing --lifecycle-file=lifecycle.json

# Grant service account access
gcloud storage buckets add-iam-policy-binding gs://documine-batch-processing \
  --member=serviceAccount:documine@documine-480319.iam.gserviceaccount.com \
  --role=roles/storage.objectAdmin
```

### PDF Page Count Detection

Option 1: Parse PDF header (fast, no external deps)
```typescript
function getPageCount(pdfBuffer: Uint8Array): number {
  const text = new TextDecoder().decode(pdfBuffer.slice(0, 10000));
  const match = text.match(/\/Type\s*\/Page[^s]/g);
  return match ? match.length : 1;
}
```

Option 2: Use pdf-lib (more reliable)
```typescript
import { PDFDocument } from 'pdf-lib';

async function getPageCount(pdfBuffer: Uint8Array): Promise<number> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  return pdfDoc.getPageCount();
}
```

### Batch Processing Flow

```typescript
// Document AI Batch Processing
const inputUri = `gs://documine-batch-processing/${documentId}/input.pdf`;
const outputUri = `gs://documine-batch-processing/${documentId}/output/`;

// 1. Upload PDF to GCS
await uploadToGCS(pdfBuffer, inputUri);

// 2. Start batch process
const operation = await startBatchProcess(inputUri, outputUri);

// 3. Poll for completion
const result = await pollOperation(operation.name, { maxWaitMs: 300000 });

// 4. Download result
const output = await downloadFromGCS(`${outputUri}0/output.json`);

// 5. Cleanup
await deleteFromGCS(inputUri);
```

### Batch Process API Request

```typescript
const request = {
  name: `projects/${projectId}/locations/${location}/processors/${processorId}`,
  inputDocuments: {
    gcsDocuments: {
      documents: [{
        gcsUri: inputUri,
        mimeType: 'application/pdf'
      }]
    }
  },
  documentOutputConfig: {
    gcsOutputConfig: {
      gcsUri: outputUri
    }
  }
};

const response = await fetch(
  `https://${location}-documentai.googleapis.com/v1/${request.name}:batchProcess`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  }
);
```

### Environment Variables Required

```bash
# Additional secrets for batch processing
GCS_BUCKET_NAME=documine-batch-processing
```

### Learnings from Story 12.1

- JWT auth works correctly in Deno using Web Crypto API
- Service account needs Document AI API User role at project level
- Token caching reduces auth latency

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-12.md#Story-12.6] - Acceptance criteria
- [Document AI Batch Processing](https://cloud.google.com/document-ai/docs/send-request#batch-process)
- [GCS Node.js Client](https://cloud.google.com/storage/docs/reference/libraries#client-libraries-install-nodejs)

---

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/12-6-batch-processing-large-documents.context.xml`

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-05 | Story drafted | Claude |

---

_Drafted: 2025-12-05_
_Epic: Epic 12 - Google Cloud Document AI Migration_
