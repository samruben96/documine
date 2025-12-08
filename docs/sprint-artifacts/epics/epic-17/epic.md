# Epic 17: AI Buddy Document Intelligence

**Status:** Backlog
**Created:** 2025-12-07
**Planning Docs:** `docs/features/ai-buddy/`
**Additional Architecture:** `documine/docs/architecture`


## Overview

Enable document upload, processing, and AI-powered document context for accurate, sourced answers.

## Goal

AI can answer questions about user's specific policies, quotes, and applications.

## Functional Requirements

- **FR20:** Users can upload documents directly into a conversation for immediate context
- **FR21:** Users can upload documents to a Project for persistent availability
- **FR22:** System processes uploaded documents and makes content available for AI queries
- **FR23:** Users can preview attached documents within the interface
- **FR24:** System displays document processing status (uploading, processing, ready)
- **FR25:** AI can reference multiple documents within a single conversation
- **FR65:** Documents uploaded to docuMINE are available in AI Buddy Projects
- **FR66:** AI can reference previously analyzed documents from Document Comparison

## Stories

| Story | Name | Description |
|-------|------|-------------|
| 17.1 | Document Upload (Conversation) | Attach documents to current conversation |
| 17.2 | Document Upload (Project) | Upload documents for persistent project context |
| 17.3 | Document Processing Status | Show upload/processing/ready status |
| 17.4 | Document Preview | In-app document viewer with page navigation |
| 17.5 | Multi-Document Context | RAG across multiple documents |
| 17.6 | Remove Project Documents | Remove documents from project context |
| 17.7 | docuMINE Integration | Access existing documents from library |

## Dependencies

- Epic 16: AI Buddy Projects

## Technical Notes

- Reuse existing LlamaParse document processing pipeline
- RAG with top-K retrieval (default K=5 chunks)
- Document preview reuses existing DocumentViewer component
- Max file size: 50MB per file

## References

- PRD: `docs/features/ai-buddy/prd.md`
- Architecture: `docs/features/ai-buddy/architecture.md`
- Epic Breakdown: `docs/features/ai-buddy/epics.md` (Epic 4)
