# Epic 17: AI Buddy Document Intelligence

**Status:** In Progress
**Created:** 2025-12-07
**Planning Docs:** `docs/features/ai-buddy/`
**Additional Architecture:** `documine/docs/architecture`


## Overview

Enable document upload, processing, and AI-powered document context for accurate, sourced answers.

## Goal

AI can answer questions about user's specific policies, quotes, and applications.

## Functional Requirements

- **FR14:** Users can remove documents from Projects
- **FR20:** Users can upload documents directly into a conversation for immediate context
- **FR21:** Users can upload documents to a Project for persistent availability
- **FR22:** System processes uploaded documents and makes content available for AI queries
- **FR23:** Users can preview attached documents within the interface
- **FR24:** System displays document processing status (uploading, processing, ready)
- **FR25:** AI can reference multiple documents within a single conversation
- **FR65:** Documents uploaded to docuMINE are available in AI Buddy Projects
- **FR66:** AI can reference previously analyzed documents from Document Comparison

## Stories (Consolidated)

Stories consolidated from 7 → 4 for implementation efficiency, plus Story 17.5 added for UI improvements:

| Story | Name | Points | Description | FRs |
|-------|------|--------|-------------|-----|
| 17.1 | Document Upload to Conversation with Status | 3 | Attach documents to current conversation with real-time processing status | FR20, FR24 |
| 17.2 | Project Document Management | 5 | Upload to projects, library picker, remove documents | FR21, FR14, FR65, FR66 |
| 17.3 | Document Preview & Multi-Document Context | 5 | In-app preview, citation navigation, multi-doc RAG | FR23, FR25 |
| 17.4 | Document Processing Integration | 2 | LlamaParse integration, chunk embeddings, retry | FR22 |
| 17.5 | ChatGPT-Style Project Navigation | 3 | Collapsible project folders with nested chats, hover/active states | UX |

**Total Points:** 18

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
