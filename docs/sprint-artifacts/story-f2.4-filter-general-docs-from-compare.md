# Story F2.4: Filter General Documents from Compare

Status: done

## Story

As an insurance agent,
I want the quote comparison page to only show quote-type documents,
so that I don't accidentally compare general documents like certificates or endorsements.

## Acceptance Criteria

1. **AC-F2-4.1:** Compare page only fetches documents where document_type = 'quote' or null
2. **AC-F2-4.2:** General documents (document_type = 'general') are excluded from comparison selection
3. **AC-F2-4.3:** UI indicates that only quote documents are shown

## Tasks / Subtasks

- [x] Task 1: Update compare page fetchDocuments query (AC: 4.1)
  - [x] Add filter: `or('document_type.eq.quote,document_type.is.null')`
  - [x] Include document_type in select

- [x] Task 2: Update TypeScript interface (AC: 4.2)
  - [x] Add document_type to Document interface in compare/page.tsx
  - [x] Add document_type to Document interface in quote-selector.tsx

- [x] Task 3: Add UI indication (AC: 4.3)
  - [x] Add "Only quote documents shown" note in QuoteSelector

## Dev Agent Record

### Completion Notes

- Simple filter change in Supabase query
- Null check for backward compatibility with existing documents
- Minimal UI change to inform users about filtering

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-04 | 1.0 | Story implemented |
