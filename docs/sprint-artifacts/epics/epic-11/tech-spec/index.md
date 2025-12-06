# Epic 11: Tech Spec

> **Processing Reliability & Enhanced Progress Visualization**

## Authoritative Technical Reference

The comprehensive technical specification for Epic 11 is embedded in the epic overview due to its architectural nature:

- [Epic 11 Overview](../epic.md) - Full technical design including:
  - Async processing architecture diagrams
  - pg_cron setup and SQL patterns
  - Realtime subscription patterns
  - React hooks for progress tracking
  - Database schema definitions

## Stories

| Story | Description | Status |
|-------|-------------|--------|
| [11.1](../stories/11-1-async-processing-architecture/) | Async Processing Architecture | Done |
| [11.2](../stories/11-2-enhanced-progress-bar-ui/) | Enhanced Progress Bar UI | Done |
| [11.3](../stories/11-3-reliable-job-recovery/) | Reliable Job Recovery | Done |
| [11.4](../stories/11-4-processing-queue-visualization/) | Processing Queue Visualization | Done |
| [11.5](../stories/11-5-error-handling-user-feedback/) | Error Handling & User Feedback | Done |
| [11.6](../stories/11-6-phased-processing-fast-chat/) | Phased Processing - Fast Chat Path | Drafted |
| [11.7](../stories/11-7-comparison-extraction-status/) | Comparison Page Extraction Status | Drafted |
| [11.8](../stories/11-8-document-list-extraction-indicators/) | Document List Extraction Indicators | Drafted |

## Technical Highlights

### Key Architectural Decisions

1. **pg_cron for job scheduling** - Runs every 10 seconds to pick up pending jobs
2. **pg_net for async HTTP** - Invokes Edge Function without blocking
3. **FOR UPDATE SKIP LOCKED** - Prevents race conditions in job pickup
4. **Realtime subscriptions** - Live progress updates to UI

### Database Additions

- `processing_jobs` table with status, stage, progress tracking
- Indexes for efficient pending job queries
- RLS policies for agency isolation

---

## Phase 2: Phased Processing (Stories 11.6-11.8)

Added 2025-12-05 via Party Mode team discussion. These stories optimize the processing pipeline further by splitting it into two phases:

1. **Phase 1 (Fast Path):** Parse → Chunk → Embed → Chat available (~30s)
2. **Phase 2 (Background):** Structured Extraction → Comparison available

This allows users to start chatting with documents immediately while quote extraction continues in the background.

### Key Database Changes

- `extraction_status` column on documents: `pending` | `extracting` | `complete` | `failed` | `skipped`
- New `extract-quote-data` edge function for Phase 2 processing

### UI Changes

- Comparison page shows "Analyzing" banner when extraction pending
- Document cards/table show extraction status badges
- Realtime updates when extraction completes

---

*This epic transforms document processing from synchronous to asynchronous to handle extended processing times (100-250+ seconds) and optimizes for faster time-to-chat.*
