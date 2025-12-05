# Acceptance Criteria

## AC-5.8.1.1: File Size Validation (Frontend)
**Given** a user uploads a document
**When** the file exceeds the size limit
**Then**:
- Files > 15MB are rejected with clear error message
- Error: "File too large. Maximum size is 15MB."
- Validation happens before upload starts

## AC-5.8.1.2: Page Count Warning
**Given** a user uploads a PDF > 5MB
**When** the upload is initiated
**Then** a warning displays: "Large documents may take 2-5 minutes to process"

## AC-5.8.1.3: Docling Timeout Reduction
**Given** a document is being parsed
**When** Docling is called
**Then**:
- Timeout reduced from 150s to 90s
- Leaves 60s buffer for download + chunking + embedding
- On timeout, clear error message saved to processing_jobs

## AC-5.8.1.4: Graceful Timeout Handling
**Given** the edge function approaches timeout
**When** processing exceeds 120s total
**Then**:
- Document marked as 'failed' (not stuck in 'processing')
- Error message: "Document too large. Try splitting into smaller files."
- User can delete and retry with smaller file

## AC-5.8.1.5: Processing Progress Visibility
**Given** a document is processing
**When** the user views the document list
**Then**:
- Processing stage shown: "Parsing..." / "Generating embeddings..."
- Elapsed time displayed: "Processing (45s...)"
- Or estimated time: "~2 min remaining"

## AC-5.8.1.6: Stale Job Auto-Recovery
**Given** a job is stuck in 'processing' for >10 minutes
**When** any edge function runs
**Then**:
- Job automatically marked as 'failed'
- Document status updated to 'failed'
- Error message: "Processing timed out"
- ✅ Already implemented via `mark_stale_jobs_failed()` RPC

---
