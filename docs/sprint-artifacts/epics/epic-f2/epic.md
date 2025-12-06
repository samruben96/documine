# Epic F2: Document Library & Intelligence

**Status:** Done
**Priority:** P1 - Feature Enhancement
**Created:** 2025-12-04

---

## Goal

Introduce a dedicated Document Library page with categorization, filtering, and AI-powered intelligence features.

## Problem Statement

Documents exist only in the sidebar. Users need a first-class document management experience with better organization, categorization, and AI-generated insights.

## Solution

- Dedicated `/documents` page with full document library view
- Document categorization (quote vs general document types)
- AI-powered auto-tagging and summarization on upload
- Filter general documents from `/compare` quote selection
- Table view for scanability with sorting and filtering

## User Value

Agents can quickly find any document, categorize uploads as "quote" or "general" to keep the comparison page focused, and get AI-generated insights (tags, summaries) without manual effort.

---

## Stories

### Story F2.1: Document Library Page
- Route restructure: /documents → library, /chat-docs/[id] → viewer
- **Status:** Done

### Story F2.2: Document Categorization Schema
- Database migration: document_type column with CHECK constraint
- TypeScript types: DocumentType = 'quote' | 'general'
- **Status:** Done

### Story F2.3: AI Tagging & Summarization
- GPT-5.1 structured outputs for tag/summary generation
- Graceful degradation on failure
- **Status:** Done

### Story F2.4: Filter General Docs from Compare
- Query filter: document_type.eq.quote
- **Status:** Done

### Story F2.5: Tag Management UI
- TagEditor component with add/remove
- Max 10 tags, 30 chars per tag
- **Status:** Done

### Story F2.6: Document Library Table View
- @tanstack/react-table implementation
- Sortable columns, row actions, search
- **Status:** Done

---

## Technical Notes

See full tech spec at: [`tech-spec/tech-spec-epic-f2.md`](./tech-spec/tech-spec-epic-f2.md)
