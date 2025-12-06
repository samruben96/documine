# Epic 4: Document Upload & Management

> **Related:** Story files at [`docs/sprint-artifacts/epics/epic-4/stories/`](../sprint-artifacts/epics/epic-4/stories/)

**Goal:** Enable users to upload, view, organize, and manage insurance documents. This is the foundation for all document-based features.

**User Value:** Users can upload their policies and quotes, see them in an organized list, and manage their document library.

**FRs Addressed:** FR8, FR9, FR10, FR11, FR12, FR27, FR33

---

## Story 4.1: Document Upload Zone

As a **user**,
I want **to upload PDF documents easily**,
So that **I can analyze my insurance policies and quotes**.

**Acceptance Criteria:**

**Given** I am on the documents page (`/documents`) or document view
**When** I see the upload zone
**Then** I can upload via:
- Drag-and-drop onto dashed-border zone
- Click zone to open file picker
- Multiple files supported (up to 5 at once)

**And** the upload zone shows:
- Default: Dashed border, "Drop a document here or click to upload"
- Drag hover: Border color change to primary (#475569), background highlight
- Uploading: Progress bar per file (percentage)
- Processing: "Analyzing document..." with shimmer animation

**And** file validation:
- PDF only (reject others with toast: "Only PDF files are supported")
- Max 50MB per file (reject with toast: "File too large. Maximum size is 50MB")

**And** on successful upload:
- Document record created with status='processing'
- File uploaded to Supabase Storage at `{agency_id}/{document_id}/{filename}`
- Processing job queued
- Document appears in list with "Processing..." status

**Prerequisites:** Story 1.4

**Technical Notes:**
- Use react-dropzone or similar for drag-drop handling
- Parallel uploads for multiple files
- Generate UUID for document_id before upload
- Store original filename in document record
- Per UX spec: no spinner > 200ms, use skeleton/shimmer instead

---

## Story 4.2: Upload Progress & Status Feedback

As a **user**,
I want **clear feedback during document upload and processing**,
So that **I know the status of my documents**.

**Acceptance Criteria:**

**Given** I upload a document
**When** upload is in progress
**Then** I see:
- Per-file progress bar (0-100%)
- Filename displayed
- "Cancel" option (removes from queue)

**And** when upload completes but processing hasn't:
- Status changes to "Analyzing..."
- Shimmer animation on document card
- Status indicator with progress animation

**And** when processing completes:
- Status changes to "Ready"
- Document immediately available for Q&A
- Success toast: "{filename} is ready"

**And** if processing fails:
- Status shows "Failed" with error icon
- Tooltip/click shows error message
- "Retry" option attempts reprocessing
- "Delete" removes failed document

**And** upload state persists across navigation:
- Can navigate away and return
- Processing status still visible
- Notifications appear when complete

**Prerequisites:** Story 4.1

**Technical Notes:**
- Use Supabase realtime subscriptions to listen for document status changes
- Store processing progress in processing_jobs table
- Consider optimistic UI: show document in list immediately

---

## Story 4.3: Document List View

As a **user**,
I want **to see all my uploaded documents in an organized list**,
So that **I can find and select documents for analysis**.

**Acceptance Criteria:**

**Given** I am on the documents page (`/documents`)
**When** I view the document list
**Then** I see documents in a sidebar list (per UX spec):
- Document icon + filename
- Upload date ("2 hours ago", "Yesterday", "Nov 20")
- Status indicator (Ready ✓, Processing ⟳, Failed ✗)

**And** the list is:
- Sorted by most recently uploaded first
- Scrollable if many documents
- Filterable by search (filename match)

**And** clicking a document:
- Opens split view: Document Viewer + Chat Panel
- Document highlighted as selected in sidebar (left border accent)

**And** empty state (no documents):
- Centered upload zone
- "Upload your first document to get started"

**And** responsive behavior:
- Desktop: Sidebar always visible (240px width)
- Tablet: Collapsible sidebar (hamburger menu)
- Mobile: Bottom navigation with Documents tab

**Prerequisites:** Story 4.1

**Technical Notes:**
- Query documents table filtered by agency_id, ordered by created_at desc
- Use relative time formatting (date-fns or similar)
- Implement search with client-side filter or database ILIKE query
- Sidebar component in `@/components/layout/sidebar.tsx`

---

## Story 4.4: Delete Documents

As a **user**,
I want **to delete documents I no longer need**,
So that **I can keep my document library clean**.

**Acceptance Criteria:**

**Given** I am viewing a document or the document list
**When** I click delete (trash icon or menu option)
**Then** confirmation modal appears:
- "Delete {filename}?"
- "This will permanently delete the document and all conversations about it. This cannot be undone."
- "Cancel" and "Delete" buttons

**And** on confirm:
- Document record deleted (cascades to chunks, conversations, messages)
- File deleted from Supabase Storage
- Success toast: "Document deleted"
- Navigate to documents list if was viewing deleted doc

**And** delete is immediate (no soft delete for MVP)

**Prerequisites:** Story 4.3

**Technical Notes:**
- CASCADE delete configured in database schema
- Delete from storage after database delete succeeds
- Handle case where storage delete fails (log error, don't block)

---

## Story 4.5: Document Organization (Rename/Label)

As a **user**,
I want **to rename documents and add labels**,
So that **I can organize my document library**.

**Acceptance Criteria:**

**Given** I am viewing a document or document list
**When** I click rename (edit icon or right-click menu)
**Then** filename becomes editable inline:
- Current name pre-filled
- Enter to save, Escape to cancel
- Validation: 1-255 characters, no path separators

**And** when I add a label/tag:
- Click "+ Add label" or existing labels area
- Type label name (autocomplete from existing labels)
- Press Enter or click to add
- Labels shown as small pills below filename
- Click X on label to remove

**And** I can filter by label:
- Label dropdown in sidebar
- Selecting label filters document list

**And** labels are agency-scoped (shared across team)

**Prerequisites:** Story 4.3

**Technical Notes:**
- Add `display_name` column to documents table (keeps original filename separate)
- Add `labels` table: id, agency_id, name, color
- Add `document_labels` junction table: document_id, label_id
- Consider simple approach: store labels as jsonb array on document (simpler)

---

## Story 4.6: Document Processing Pipeline (LlamaParse)

As the **system**,
I want **to process uploaded PDFs into searchable chunks with embeddings**,
So that **documents can be queried via natural language**.

**Acceptance Criteria:**

**Given** a document is uploaded with status='processing'
**When** the processing job runs
**Then** the PDF is sent to LlamaParse:
- API call with PDF content
- Returns markdown-formatted text with page numbers
- Preserves tables and structure

**And** the text is chunked:
- Chunk size: ~500 tokens with 50 token overlap
- Each chunk tagged with page number
- Bounding box preserved if available from LlamaParse

**And** embeddings are generated:
- Each chunk sent to OpenAI text-embedding-3-small
- Returns 1536-dimension vector
- Stored in document_chunks table

**And** processing completes:
- Document status updated to 'ready'
- Page count stored in document metadata
- Processing time logged

**And** error handling:
- LlamaParse failure → retry once, then mark 'failed' with error message
- OpenAI failure → retry with exponential backoff
- Partial failure → mark 'failed', log which step failed

**Prerequisites:** Story 4.1, Story 1.5

**Technical Notes:**
- Implement as Supabase Edge Function triggered by processing_jobs insert
- LlamaParse API key: LLAMA_CLOUD_API_KEY
- Chunking strategy: semantic chunking by paragraph/section, with max token limit
- Consider batch embedding API for efficiency
- Edge Function timeout: 150 seconds (Supabase limit)

---

## Story 4.7: Processing Queue Management

As the **system**,
I want **to manage document processing queue during high load**,
So that **uploads don't fail and processing is fair**.

**Acceptance Criteria:**

**Given** multiple documents are uploaded simultaneously
**When** processing jobs are queued
**Then** jobs are processed in FIFO order per agency:
- One active job per agency at a time
- Other jobs wait in pending state
- Cross-agency jobs can run in parallel

**And** queue status is visible:
- "Processing... (2 documents ahead)" for queued docs
- Realtime updates as queue advances

**And** stuck jobs are handled:
- Jobs running > 10 minutes without update → marked stale
- Stale jobs retried once, then marked failed
- Admin can manually retry failed jobs

**And** rate limiting:
- Max 10 documents per agency per hour (prevent abuse)
- Soft limit with warning toast, hard limit blocks upload

**Prerequisites:** Story 4.6

**Technical Notes:**
- Use processing_jobs table status field for queue management
- Postgres advisory locks or simple status check for concurrency
- Scheduled function to clean up stale jobs
- Consider dedicated queue service for scale (out of MVP scope)

---
