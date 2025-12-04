# Epic Technical Specification: Document Library & Intelligence

Date: 2025-12-04
Author: Sam
Epic ID: F2
Status: Draft

---

## Overview

Epic F2 introduces a dedicated Document Library page (`/documents`) that provides a comprehensive view of all agency documents with categorization, filtering, and AI-powered intelligence features. Currently, documents exist only in the sidebar - this epic elevates document management to a first-class experience with its own page, enabling better organization through document types (quote vs general) and AI-generated tags/summaries.

The core value proposition: agents can quickly find any document, categorize uploads as "quote" or "general" to keep the comparison page focused, and get AI-generated insights (tags, blurbs) without manual effort.

## Objectives and Scope

**In Scope:**
- Dedicated `/documents` page with full document library view
- Document categorization schema (quote vs general document types)
- AI-powered auto-tagging and summarization on document upload
- Filtering: exclude general documents from `/compare` quote selection
- Manual tag management UI for user-defined tags
- Enhanced document metadata display (upload date, page count, status, tags)

**Out of Scope:**
- Document folders/hierarchies (keep flat for MVP)
- Batch operations (bulk delete, bulk categorize)
- Advanced search (full-text search within documents)
- Document sharing between agencies
- Version control / document history

## System Architecture Alignment

### Components Referenced:
- **Database:** `documents` table (existing) + new columns for categorization
- **UI:** New `/app/(dashboard)/documents/page.tsx` - dedicated library page
- **API:** Enhanced `/api/documents` endpoints for filtering and tagging
- **Edge Function:** `process-document` - enhanced to call AI tagging

### Constraints:
- Must maintain existing sidebar document list functionality
- AI tagging runs async during document processing (not blocking upload)
- Tags stored in existing `documents.metadata` JSONB column
- RLS policies already handle agency isolation

---

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Inputs | Outputs |
|----------------|----------------|--------|---------|
| `DocumentLibraryPage` | Full-page document management UI | User session, agency_id | Document grid/list view |
| `DocumentService.categorize()` | Update document type | document_id, type | Updated document |
| `DocumentService.generateTags()` | AI-powered tag generation | document content | Tags array + summary |
| `TagManager` component | UI for viewing/editing tags | document_id | Tag CRUD operations |
| `DocumentTypeFilter` | Filter by quote/general | filter params | Filtered document list |

### Data Models and Contracts

#### Schema Changes (Migration)

```sql
-- Add document categorization and AI metadata
ALTER TABLE documents
ADD COLUMN document_type varchar(20) DEFAULT 'quote'
  CHECK (document_type IN ('quote', 'general'));

ALTER TABLE documents
ADD COLUMN ai_summary text;

ALTER TABLE documents
ADD COLUMN ai_tags text[] DEFAULT '{}';

-- Index for filtering
CREATE INDEX idx_documents_type ON documents(agency_id, document_type);
CREATE INDEX idx_documents_tags ON documents USING GIN(ai_tags);
```

#### TypeScript Types

```typescript
// Document type enum
type DocumentType = 'quote' | 'general';

// Extended document interface
interface DocumentWithMetadata extends Document {
  document_type: DocumentType;
  ai_summary: string | null;
  ai_tags: string[];
  // Existing fields
  id: string;
  agency_id: string;
  filename: string;
  status: 'processing' | 'ready' | 'failed';
  page_count: number | null;
  created_at: string;
  updated_at: string;
}

// Tag generation response
interface AITaggingResult {
  tags: string[];      // e.g., ["auto liability", "commercial", "Hartford"]
  summary: string;     // 1-2 sentence document summary
  documentType: DocumentType;  // Inferred type (can be overridden)
}
```

### APIs and Interfaces

#### GET /api/documents
Enhanced with filtering parameters.

```typescript
// Request
GET /api/documents?type=quote&tags=liability

// Response
{
  data: DocumentWithMetadata[];
  error: null;
}
```

#### PATCH /api/documents/:id/categorize
Update document type.

```typescript
// Request
PATCH /api/documents/:id/categorize
{ "document_type": "general" }

// Response
{
  data: { id: string; document_type: DocumentType };
  error: null;
}
```

#### PATCH /api/documents/:id/tags
Update document tags (manual).

```typescript
// Request
PATCH /api/documents/:id/tags
{ "tags": ["auto", "commercial", "renewal"] }

// Response
{
  data: { id: string; ai_tags: string[] };
  error: null;
}
```

### Workflows and Sequencing

#### Document Upload with AI Tagging

```
1. User uploads document
2. Document saved to storage, record created (status: 'processing')
3. Edge Function: process-document starts
   3a. Parse PDF via Docling
   3b. Create chunks and embeddings
   3c. [NEW] Call AI tagging service with first 5 chunks
   3d. Save ai_tags, ai_summary, inferred document_type
4. Document status → 'ready'
5. User sees document in library with tags/summary
```

#### AI Tagging Service Flow

```
Input: First 5 chunks of document (representing ~5 pages)
   ↓
GPT-5.1 with structured output:
{
  "tags": ["string array of 3-5 relevant tags"],
  "summary": "1-2 sentence summary of document purpose",
  "documentType": "quote | general"
}
   ↓
Save to documents table
```

---

## Non-Functional Requirements

### Performance

| Metric | Target | Rationale |
|--------|--------|-----------|
| Document library load | < 500ms | SWR caching, pagination |
| AI tagging latency | < 5s | Async, non-blocking |
| Filter response | < 200ms | Indexed queries |
| Tag update | < 100ms | Simple PATCH |

### Security

- RLS policies already protect documents by agency_id
- Tag updates require authenticated user in same agency
- AI tagging uses service role (Edge Function) - no user data exposure
- No PII should be stored in tags (AI prompt instructs against this)

### Reliability/Availability

- AI tagging failures should not fail document processing
- Graceful degradation: if tagging fails, document still marked 'ready' with empty tags
- Tags are optional enhancement, not blocking feature

### Observability

- Log AI tagging success/failure rates
- Track tag generation latency (p50, p95)
- Monitor document type distribution per agency
- Track filter usage patterns

---

## Dependencies and Integrations

| Dependency | Version | Purpose |
|------------|---------|---------|
| `@supabase/supabase-js` | ^2.x | Database operations |
| `openai` | ^4.x | AI tagging (GPT-5.1) |
| `zod` | ^3.x | Schema validation |
| `@tanstack/react-table` | ^8.x | Document table UI (optional) |

**Integration Points:**
- Existing document upload flow (process-document Edge Function)
- Existing `/compare` page (filter by document_type = 'quote')
- Dashboard tool card navigation

---

## Acceptance Criteria (Authoritative)

### Story F2-1: Document Library Page
- **AC-F2-1.1:** Dedicated `/documents` route exists and is accessible from header navigation
- **AC-F2-1.2:** Page displays all agency documents in a grid or list view
- **AC-F2-1.3:** Each document shows: filename, upload date, page count, status, type badge, tags
- **AC-F2-1.4:** Click on document navigates to `/documents/[id]` viewer
- **AC-F2-1.5:** Upload button opens upload modal/zone
- **AC-F2-1.6:** Empty state shows when no documents exist

### Story F2-2: Document Categorization Schema
- **AC-F2-2.1:** `document_type` column added to documents table (quote | general)
- **AC-F2-2.2:** Default type is 'quote' (backward compatible)
- **AC-F2-2.3:** UI toggle/dropdown to change document type
- **AC-F2-2.4:** Type change persists immediately (optimistic update)
- **AC-F2-2.5:** Type displayed as badge on document card/row

### Story F2-3: AI Tagging & Summarization
- **AC-F2-3.1:** New documents automatically receive AI-generated tags (3-5 tags)
- **AC-F2-3.2:** New documents receive AI-generated 1-2 sentence summary
- **AC-F2-3.3:** AI infers document type (quote vs general) with ability to override
- **AC-F2-3.4:** Tagging completes within 5 seconds of processing start
- **AC-F2-3.5:** Tagging failure does not prevent document from becoming 'ready'
- **AC-F2-3.6:** Tags and summary visible in document library and detail view

### Story F2-4: Filter General Docs from Compare
- **AC-F2-4.1:** `/compare` quote selector only shows documents with type='quote'
- **AC-F2-4.2:** Document library can filter by type (All | Quotes | General)
- **AC-F2-4.3:** Filter state reflected in URL for shareability
- **AC-F2-4.4:** Filter UI is prominent and easy to use

### Story F2-5: Tag Management UI
- **AC-F2-5.1:** Users can view all tags on a document
- **AC-F2-5.2:** Users can add custom tags to a document
- **AC-F2-5.3:** Users can remove tags from a document
- **AC-F2-5.4:** Tag input supports autocomplete from existing agency tags
- **AC-F2-5.5:** Document library can filter by tag
- **AC-F2-5.6:** Tag updates are immediately reflected in UI (optimistic)

---

## Traceability Mapping

| AC | Spec Section | Component(s) | Test Idea |
|----|--------------|--------------|-----------|
| AC-F2-1.1 | APIs | `/documents/page.tsx`, Header | Route exists, navigation works |
| AC-F2-1.2 | Data Models | DocumentLibraryPage | Render document list with mocked data |
| AC-F2-1.3 | Data Models | DocumentCard component | All metadata fields displayed |
| AC-F2-1.4 | Workflows | DocumentCard onClick | Navigation test |
| AC-F2-1.5 | Workflows | UploadZone integration | Modal opens on click |
| AC-F2-1.6 | UI | EmptyState component | Render when docs.length === 0 |
| AC-F2-2.1 | Data Models | Migration | Column exists in schema |
| AC-F2-2.2 | Data Models | Migration | New docs default to 'quote' |
| AC-F2-2.3 | APIs | DocumentTypeToggle | Toggle renders, calls API |
| AC-F2-2.4 | APIs | PATCH endpoint | Optimistic update in hook |
| AC-F2-2.5 | UI | DocumentTypeBadge | Badge shows correct color/text |
| AC-F2-3.1 | Workflows | process-document | Tags array populated after processing |
| AC-F2-3.2 | Workflows | process-document | ai_summary not null after processing |
| AC-F2-3.3 | Workflows | AI tagging service | document_type inferred correctly |
| AC-F2-3.4 | Performance | process-document | Timing assertion |
| AC-F2-3.5 | Reliability | process-document | Error handling test |
| AC-F2-3.6 | UI | DocumentCard, DocumentDetail | Tags/summary rendered |
| AC-F2-4.1 | APIs | QuoteSelector | Only type='quote' returned |
| AC-F2-4.2 | UI | DocumentTypeFilter | Filter buttons work |
| AC-F2-4.3 | UI | URL state | searchParams updated |
| AC-F2-4.4 | UI | Filter component | Prominent placement |
| AC-F2-5.1 | UI | TagList component | Tags rendered |
| AC-F2-5.2 | APIs | TagInput component | Add tag flow |
| AC-F2-5.3 | APIs | TagList component | Remove tag flow |
| AC-F2-5.4 | UI | TagInput | Autocomplete from agency tags |
| AC-F2-5.5 | APIs | GET /documents?tags= | Filter by tag works |
| AC-F2-5.6 | APIs | useDocuments hook | Optimistic update |

---

## Risks, Assumptions, Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI tagging accuracy low | Medium | Low | Tags are suggestions, users can edit |
| Tagging adds processing latency | Low | Medium | Async, non-blocking, timeout at 5s |
| Tag pollution (too many unique tags) | Medium | Low | Suggest existing tags, limit to 10 per doc |

### Assumptions

- Users will primarily use document types, not complex folder structures
- AI can reliably distinguish quote documents from general documents
- 3-5 tags per document is sufficient granularity
- Agents will find auto-tagging more valuable than manual organization

### Open Questions

1. **Q:** Should we show tag suggestions during upload, or only after processing?
   **A:** After processing - keeps upload flow simple.

2. **Q:** Should general documents still be visible in the sidebar?
   **A:** Yes, sidebar shows all documents. Filter is only on /documents and /compare.

3. **Q:** Max tags per document?
   **A:** 10 tags (5 AI-generated + 5 user-added).

---

## Test Strategy Summary

### Test Levels

| Level | Scope | Framework | Coverage Target |
|-------|-------|-----------|-----------------|
| Unit | Components, hooks, utils | Vitest + RTL | 80% |
| Integration | API routes, database | Vitest | Key flows |
| E2E | Critical user journeys | Playwright | Happy paths |

### Key Test Scenarios

1. **Document Library Page**
   - Renders document grid with all metadata
   - Empty state when no documents
   - Navigation to document viewer

2. **Document Categorization**
   - Type toggle updates database
   - Optimistic update in UI
   - Type persists on page refresh

3. **AI Tagging**
   - Tags generated after upload
   - Summary generated after upload
   - Graceful failure handling

4. **Filtering**
   - Type filter works on /documents
   - Compare page excludes general docs
   - Tag filter works

5. **Tag Management**
   - Add tag to document
   - Remove tag from document
   - Autocomplete suggestions

### E2E Scenarios (Playwright)

- Upload document → verify tags appear after processing
- Change document type → verify compare page filters correctly
- Add/remove manual tag → verify persistence
