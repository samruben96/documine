# Implementation Tasks

## Task 1: Database Migration
- [x] Create migration for `chunk_type` column
- [x] Create migration for `summary` column
- [x] Create migration for `embedding_version` column (for A/B testing)
- [x] Create migration for type index
- [x] Apply to Supabase project

## Task 2: Recursive Text Splitter
- [x] Implement `recursiveCharacterTextSplitter` function
- [x] Add separator hierarchy logic ["\n\n", "\n", ". ", " "]
- [x] Implement overlap handling
- [x] Add comprehensive unit tests (44 tests passing)

## Task 3: Table Detection
- [x] Analyze Docling output format for tables (markdown tables)
- [x] Implement `extractTablesWithPlaceholders` function
- [x] Implement `generateTableSummary` (rule-based for speed per Story 5.8.1 learnings)
- [x] Add unit tests for table detection and summary generation

## Task 4: Update Chunking Pipeline
- [x] Integrate recursive splitter into chunking.ts
- [x] Add table extraction before text chunking (extract-placeholder-reinsert pattern)
- [x] Handle page number preservation
- [x] Update process-document Edge Function (deployed)

## Task 5: Re-processing Pipeline
- [x] Create admin API endpoint: `/api/admin/reprocess-documents`
- [x] Implement GET for stats by embedding version
- [x] Implement POST for batch re-processing with A/B testing
- [x] Version 2 chunks coexist with version 1

## Task 6: Testing & Validation
- [x] All 789 unit tests passing
- [x] Production build succeeds
- [x] Edge Function deployed to Supabase
- [ ] Manual testing with real insurance documents (pending)

---
