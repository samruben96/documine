# Epic Technical Specification: AI Buddy Document Intelligence

Date: 2025-12-08
Author: Sam
Epic ID: 17
Status: Draft

---

## Overview

Epic 17 enables AI Buddy to provide accurate, sourced answers based on users' specific insurance documents. This epic extends AI Buddy's conversational capabilities with document upload, processing status visualization, document preview, and multi-document context synthesis. Users can attach documents to individual conversations for immediate context or to Projects for persistent availability across all project conversations.

This epic bridges AI Buddy with the existing docuMINE document processing pipeline (LlamaParse), ensuring consistent document handling across the platform. Documents uploaded to the main docuMINE library are also accessible within AI Buddy Projects, eliminating duplicate uploads.

## Objectives and Scope

### In Scope

- **Document upload to conversations** - Attach PDFs/images directly to a conversation for immediate AI context
- **Document upload to projects** - Add persistent documents available to all conversations in a project
- **Processing status visualization** - Real-time status: uploading, processing, ready, failed with retry
- **Document preview** - View attached documents within AI Buddy, navigate to cited pages
- **Multi-document context** - AI synthesizes information across multiple documents with proper citations
- **docuMINE library integration** - Select existing documents from library without re-uploading
- **Remove documents from projects** - Clean up project document context as needed

### Out of Scope

- Document OCR improvements (covered by Epic 13 LlamaParse)
- Comparison analysis within AI Buddy (use existing Compare feature)
- Document editing or annotation
- Document sharing between users
- Batch document operations

## System Architecture Alignment

### Component Integration

Epic 17 integrates with existing docuMINE architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Buddy (Epic 15-16)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Chat Panel   │  │ Project      │  │ Document Panel   │   │
│  │ (messages)   │  │ Sidebar      │  │ (NEW: Epic 17)   │   │
│  └──────┬───────┘  └──────────────┘  └────────┬─────────┘   │
│         │                                      │             │
│         ▼                                      ▼             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              RAG Pipeline (Extended)                  │   │
│  │  • Document context from project                      │   │
│  │  • Document context from conversation attachments     │   │
│  │  • Citation generation with page references          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               Existing docuMINE Infrastructure               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Documents    │  │ Supabase     │  │ LlamaParse       │   │
│  │ Table        │  │ Storage      │  │ Edge Function    │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Constraints

- Reuse existing `documents` table and processing pipeline
- Reuse existing `document_chunks` and embedding infrastructure
- Follow AI Buddy patterns from Epic 14-16 (hooks, components, API structure)
- Use existing DocumentViewer component for preview
- SSE streaming format must include document citations

## Detailed Design

### Services and Modules

| Module | Responsibility | Location |
|--------|---------------|----------|
| `DocumentUploadZone` | Drag-drop upload UI for chat and project | `src/components/ai-buddy/documents/document-upload-zone.tsx` |
| `DocumentPanel` | Right panel showing project/conversation documents | `src/components/ai-buddy/documents/document-panel.tsx` |
| `DocumentCard` | Individual document item with status | `src/components/ai-buddy/documents/document-card.tsx` |
| `DocumentLibraryPicker` | Modal to select from existing docuMINE documents | `src/components/ai-buddy/documents/document-library-picker.tsx` |
| `useProjectDocuments` | Hook for project document CRUD | `src/hooks/ai-buddy/use-project-documents.ts` |
| `useConversationAttachments` | Hook for conversation-level attachments | `src/hooks/ai-buddy/use-conversation-attachments.ts` |
| `useDocumentProcessingStatus` | Hook for realtime processing status | `src/hooks/ai-buddy/use-document-processing-status.ts` |

### Data Models and Contracts

**Existing Tables Used:**
- `documents` - Main document storage with processing status
- `document_chunks` - Chunked content with embeddings
- `processing_jobs` - Async processing queue

**New/Extended Tables:**

```sql
-- Already exists from Epic 14
CREATE TABLE ai_buddy_project_documents (
  project_id uuid NOT NULL REFERENCES ai_buddy_projects(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  attached_at timestamptz NOT NULL DEFAULT now(),
  attached_by uuid NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (project_id, document_id)
);

-- NEW: Conversation-level attachments (temporary context)
CREATE TABLE ai_buddy_conversation_documents (
  conversation_id uuid NOT NULL REFERENCES ai_buddy_conversations(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  attached_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, document_id)
);

-- Indexes
CREATE INDEX idx_conv_docs_conversation ON ai_buddy_conversation_documents(conversation_id);
CREATE INDEX idx_conv_docs_document ON ai_buddy_conversation_documents(document_id);
```

**TypeScript Types:**

```typescript
// src/types/ai-buddy.ts (extend existing)

export interface ProjectDocument {
  document_id: string;
  attached_at: string;
  attached_by: string;
  document: {
    id: string;
    name: string;
    file_type: string;
    status: DocumentStatus;
    page_count: number | null;
    created_at: string;
  };
}

export interface ConversationAttachment {
  document_id: string;
  attached_at: string;
  document: {
    id: string;
    name: string;
    file_type: string;
    status: DocumentStatus;
  };
}

export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface DocumentUploadResult {
  documentId: string;
  name: string;
  status: DocumentStatus;
}
```

### APIs and Interfaces

**Project Documents:**

```typescript
// GET /api/ai-buddy/projects/[projectId]/documents
// Response: { data: ProjectDocument[], error: null }

// POST /api/ai-buddy/projects/[projectId]/documents
// Request: { documentIds: string[] } // From library
// Or multipart/form-data for file upload
// Response: { data: ProjectDocument[], error: null }

// DELETE /api/ai-buddy/projects/[projectId]/documents/[documentId]
// Response: { data: { removed: true }, error: null }
```

**Conversation Attachments:**

```typescript
// POST /api/ai-buddy/conversations/[conversationId]/attachments
// Request: multipart/form-data with files
// Response: { data: ConversationAttachment[], error: null }

// GET /api/ai-buddy/conversations/[conversationId]/attachments
// Response: { data: ConversationAttachment[], error: null }
```

**Chat API Extension:**

```typescript
// POST /api/ai-buddy/chat (existing, extended)
// Request adds:
{
  conversationId?: string;
  projectId?: string;
  message: string;
  attachmentIds?: string[];  // NEW: Document IDs to include in context
}

// SSE Response adds:
data: {"type":"sources","citations":[
  {"documentId":"...","documentName":"...","page":3,"text":"...","confidence":"high"}
]}
```

### Workflows and Sequencing

**Document Upload Flow:**

```
1. User drags file or clicks attach
2. Client validates file type/size
3. Upload to Supabase Storage via signed URL
4. Create documents table record (status: pending)
5. Link to project or conversation
6. Trigger processing job
7. Poll/subscribe for status updates
8. On complete: document available for RAG
```

**Chat with Documents Flow:**

```
1. User sends message
2. API loads document context:
   a. Project documents (if project_id)
   b. Conversation attachments (if any)
3. Query document_chunks for relevant content
4. Build prompt with document context
5. Stream response with citations
6. Store message with sources JSONB
```

**Document Preview Flow:**

```
1. User clicks citation [📄 Policy.pdf pg. 3]
2. Open DocumentPreviewModal
3. Load document via existing DocumentViewer
4. Navigate to cited page
5. (Optional) Highlight cited text if offsets available
```

## Non-Functional Requirements

### Performance

| Metric | Target | Strategy |
|--------|--------|----------|
| File upload start | < 1s | Signed URLs, chunked upload |
| Processing status update | < 2s latency | Supabase Realtime subscription |
| Document context retrieval | < 500ms | Indexed chunks, top-K retrieval |
| Preview load | < 2s | Existing DocumentViewer optimization |
| Multi-doc synthesis | < 5s response start | Limit to top 5 chunks per doc |

### Security

- **File validation:** Server-side MIME type validation (PDF, PNG, JPG, JPEG only)
- **Size limits:** 50MB per file, enforced client and server
- **RLS policies:** Users can only access documents in their own projects/conversations
- **Storage isolation:** Documents stored with agency_id prefix
- **No cross-agency access:** Strict RLS on all document-related tables

### Reliability/Availability

- **Upload retry:** Client-side retry on network failure (3 attempts)
- **Processing retry:** Existing async job recovery (Epic 11)
- **Status polling fallback:** If Realtime fails, fall back to polling
- **Citation fallback:** If document unavailable, show "Document no longer available"

### Observability

- **Logging:** Document upload, processing start/complete, attachment events
- **Metrics:** Upload count, processing time, failure rate
- **Audit:** Document attach/remove events in `ai_buddy_audit_logs`
- **Error classification:** Reuse existing error classification from Epic 11

## Dependencies and Integrations

### External Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `@supabase/supabase-js` | ^2.x | Storage, Realtime, Database |
| `react-dropzone` | ^14.x | File upload UI |
| `@tanstack/react-query` | ^5.x | Data fetching/caching |

### Internal Dependencies

| Component | Location | Usage |
|-----------|----------|-------|
| DocumentViewer | `src/components/documents/document-viewer.tsx` | Preview documents |
| useDocumentStatus | `src/hooks/use-document-status.ts` | Processing status |
| useProcessingProgress | `src/hooks/use-processing-progress.ts` | Progress visualization |
| LlamaParse Edge Function | `supabase/functions/process-document` | Document processing |
| RAG Pipeline | `src/lib/chat/rag.ts` | Document retrieval |

### Database Dependencies

- Existing tables: `documents`, `document_chunks`, `processing_jobs`, `agencies`
- Epic 14 tables: `ai_buddy_projects`, `ai_buddy_conversations`
- New table: `ai_buddy_conversation_documents`

## Acceptance Criteria (Authoritative)

### Story 17.1: Document Upload to Conversation with Status

**AC-17.1.1:** Given I am in a conversation, when I click the attach button (📎), then a file picker opens for PDF and image files.

**AC-17.1.2:** Given I select files (max 5), when I attach them, then they appear as pending attachments above the input.

**AC-17.1.3:** Given I send a message with attachments, when processing begins, then I see status indicator per file: Uploading → Processing → Ready.

**AC-17.1.4:** Given processing completes, when AI responds, then it can reference the attached documents with citations.

**AC-17.1.5:** Given I drag files onto the chat area, when I drop them, then they attach to the current message (same as attach button).

**AC-17.1.6:** Given processing fails, when I see Failed status, then I can click retry to reprocess.

### Story 17.2: Project Document Management

**AC-17.2.1:** Given I am viewing a Project, when I click "Add Document", then I see options for "Upload New" and "Select from Library".

**AC-17.2.2:** Given I upload a document to a project, when processing completes, then it appears in the project's document list and is available for all project conversations.

**AC-17.2.3:** Given I click "Select from Library", when I search/filter my docuMINE documents, then I can select existing documents without re-uploading.

**AC-17.2.4:** Given I select a library document, when I add it, then it links to the project (not duplicated) and AI can reference it immediately.

**AC-17.2.5:** Given I click remove (X) on a project document, when I confirm, then the document is removed from project context.

**AC-17.2.6:** Given I remove a document, when I view past conversations, then historical citations remain valid (link to original document).

**AC-17.2.7:** Given I have documents from a previous Comparison, when I add them to a project, then AI has access to the extraction context.

### Story 17.3: Document Preview & Multi-Document Context

**AC-17.3.1:** Given I click on a document in the document panel, when preview opens, then I see the document in a modal with page navigation.

**AC-17.3.2:** Given AI cites a specific page, when I click the citation, then preview opens to that exact page.

**AC-17.3.3:** Given I have multiple documents attached, when I ask a question spanning documents, then AI synthesizes and cites from all relevant documents.

**AC-17.3.4:** Given I have many documents (>10), when I ask a question, then AI uses semantic retrieval to find relevant chunks (not all docs).

**AC-17.3.5:** Given multiple documents, when AI responds, then each citation indicates which document it came from.

**AC-17.3.6:** Given I zoom or navigate in preview, when I close and reopen, then state resets to default.

### Story 17.4: Document Processing Integration

**AC-17.4.1:** Given I upload a document, when it enters the processing queue, then the existing LlamaParse pipeline processes it.

**AC-17.4.2:** Given processing is async, when job completes, then document_chunks and embeddings are available for RAG.

**AC-17.4.3:** Given the chat API receives a message, when project documents exist, then it includes project document chunks in RAG retrieval.

**AC-17.4.4:** Given conversation attachments exist, when querying, then attachment chunks are included in context.

**AC-17.4.5:** Given a document fails processing, when I retry, then a new processing job is created.

### Story 17.5: ChatGPT-Style Project Navigation

**AC-17.5.1:** Given I click "New Chat" from the main sidebar, when the chat is created, then it is NOT associated with any project (project_id = null).

**AC-17.5.2:** Given I view the sidebar, when I see the Projects section, then each project displays as a collapsible folder with folder icon and expand/collapse chevron.

**AC-17.5.3:** Given I click on a project's folder icon or chevron, when the project expands, then I see all conversations belonging to that project nested below it (indented).

**AC-17.5.4:** Given a project is expanded, when I view its nested conversations, then each chat shows title, optional preview text, and relative date.

**AC-17.5.5:** Given I have expanded a project, when I see the project's chat list, then I see a "New chat in [ProjectName]" action that creates a chat pre-assigned to that project.

**AC-17.5.6:** Given I hover over any sidebar item (project or chat), when my cursor is over the item, then it displays a visible hover background color.

**AC-17.5.7:** Given I am viewing a specific chat or project, when that item is the current context, then it displays an active state (highlighted background, distinct from hover).

**AC-17.5.8:** Given I click on a project name (not the expand icon), when the project is selected, then I navigate to that project's context and can start a new chat within it.

**AC-17.5.9:** Given I have chats not associated with any project, when I view the sidebar, then standalone chats appear in a separate "Chats" or "Recent" section below projects.

**AC-17.5.10:** Given I collapse a project, when I navigate elsewhere and return to the sidebar, then the project remains collapsed (session persistence).

## Traceability Mapping

| AC | Spec Section | Component/API | Test Idea |
|----|--------------|---------------|-----------|
| AC-17.1.1 | APIs - Attachments | `DocumentUploadZone`, POST attachments | Click attach, verify file picker |
| AC-17.1.2 | Data Models | `useConversationAttachments` | Attach 5 files, verify UI |
| AC-17.1.3 | Workflows | `useDocumentProcessingStatus` | Mock processing, verify states |
| AC-17.1.4 | APIs - Chat | Chat API, RAG pipeline | E2E: upload + question + verify citation |
| AC-17.1.5 | Services | `DocumentUploadZone` | Drag-drop test |
| AC-17.1.6 | Reliability | Retry button, processing jobs | Mock failure, click retry |
| AC-17.2.1 | APIs - Project Docs | `DocumentPanel` | Click Add, verify options |
| AC-17.2.2 | Workflows | POST project documents | Upload, verify in list |
| AC-17.2.3 | Services | `DocumentLibraryPicker` | Open picker, search, select |
| AC-17.2.4 | Data Models | Junction table, no duplication | Add library doc, verify no new upload |
| AC-17.2.5 | APIs - DELETE | DELETE endpoint | Remove, verify gone |
| AC-17.2.6 | Data Models | Soft reference | Remove doc, check old citations |
| AC-17.2.7 | Integration | Extraction data | Add compared doc, verify extraction context |
| AC-17.3.1 | Services | `DocumentPreviewModal` | Click doc, verify preview |
| AC-17.3.2 | Workflows | Citation click handler | Click citation, verify page |
| AC-17.3.3 | APIs - Chat | RAG multi-doc | Ask cross-doc question |
| AC-17.3.4 | Performance | RAG top-K retrieval | 15 docs, verify fast response |
| AC-17.3.5 | Data Models | Citation format | Verify doc name in citation |
| AC-17.3.6 | Services | Preview state | Zoom, close, reopen |
| AC-17.4.1 | Integration | LlamaParse | Upload, verify job created |
| AC-17.4.2 | Data Models | document_chunks | After processing, query chunks |
| AC-17.4.3 | APIs - Chat | RAG context | Mock project docs, verify in context |
| AC-17.4.4 | APIs - Chat | RAG context | Mock attachments, verify in context |
| AC-17.4.5 | Reliability | Retry flow | Fail processing, retry |
| AC-17.5.1 | Services | `ProjectSidebar`, `onNewChat` | Click new chat, verify no project_id |
| AC-17.5.2 | Services | `ProjectFolder` | Verify folder icon, chevron render |
| AC-17.5.3 | Services | `ProjectFolder` | Click expand, verify nested chats |
| AC-17.5.4 | Services | `ChatHistoryItem` | Verify title, date, preview |
| AC-17.5.5 | Services | `ProjectFolder` | Click "New chat in X", verify project_id |
| AC-17.5.6 | UI/UX | CSS hover states | Hover over items, verify background |
| AC-17.5.7 | UI/UX | CSS active states | Select item, verify highlight |
| AC-17.5.8 | Services | `ProjectFolder` | Click project name, verify navigation |
| AC-17.5.9 | Services | `ProjectSidebar` | Verify standalone chats section |
| AC-17.5.10 | Services | localStorage/context | Collapse, navigate, return - verify state |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Large documents slow chat** | High | Limit chunks per doc, async processing, clear status |
| **Duplicate documents waste storage** | Medium | Library picker encourages reuse, deduplication check |
| **Citation page mismatch** | Medium | Validate page references, fallback to doc-level citation |
| **Processing failures block chat** | High | Clear failed status, retry option, chat works without failed docs |

### Assumptions

- Existing document processing pipeline handles all supported formats
- Document embeddings are compatible with AI Buddy RAG queries
- Users have < 50 documents per project (MVP scale)
- Existing DocumentViewer component works in AI Buddy context

### Open Questions

| Question | Owner | Status |
|----------|-------|--------|
| Should removed project documents delete from storage? | PM | **Decision: No** - keep in library |
| Max documents per project? | PM | **Decision: 25** for MVP |
| Show extraction_data in AI Buddy? | Dev | **Decision: Yes** - if quote document |

## Test Strategy Summary

### Unit Tests

- `DocumentUploadZone` - File validation, drag-drop, multi-file
- `DocumentPanel` - List rendering, add/remove actions
- `DocumentLibraryPicker` - Search, selection, pagination
- `useProjectDocuments` - CRUD operations, optimistic updates
- `useDocumentProcessingStatus` - Realtime subscription, fallback polling

### Integration Tests

- Upload flow: File → Storage → Processing → Chunks
- RAG integration: Document context in chat responses
- Citation flow: Click citation → Open preview → Correct page

### E2E Tests

- Full upload and chat flow with document context
- Project document management (add library, upload, remove)
- Multi-document question answering
- Processing failure and retry

### Performance Tests

- 10-document project chat response time
- Large document (100+ pages) processing
- Concurrent uploads (5 files)

---

**Story Summary:**

| Story | Title | Points | FRs |
|-------|-------|--------|-----|
| 17.1 | Document Upload to Conversation with Status | 3 | FR20, FR24 |
| 17.2 | Project Document Management | 5 | FR21, FR14, FR65, FR66 |
| 17.3 | Document Preview & Multi-Document Context | 5 | FR23, FR25 |
| 17.4 | Document Processing Integration | 2 | FR22 |
| 17.5 | ChatGPT-Style Project Navigation | 3 | UX |

**Total Points:** 18
**Total FRs Covered:** 8 (FR14, FR20-25, FR65, FR66)
