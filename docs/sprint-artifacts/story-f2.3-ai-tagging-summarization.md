# Story F2.3: AI Tagging & Summarization

Status: ready-for-dev

## Story

As an insurance agent,
I want documents to automatically receive AI-generated tags and summaries during processing,
so that I can quickly understand document contents and find documents by topic without manual organization.

## Acceptance Criteria

1. **AC-F2-3.1:** New documents automatically receive AI-generated tags (3-5 tags)
2. **AC-F2-3.2:** New documents receive AI-generated 1-2 sentence summary
3. **AC-F2-3.3:** AI infers document type (quote vs general) with ability to override
4. **AC-F2-3.4:** Tagging completes within 5 seconds of processing start
5. **AC-F2-3.5:** Tagging failure does not prevent document from becoming 'ready'
6. **AC-F2-3.6:** Tags and summary visible in document library and detail view

## Tasks / Subtasks

- [ ] Task 1: Database migration for AI metadata columns (AC: 3.2)
  - [ ] Add `ai_summary text` column to documents table
  - [ ] Add `ai_tags text[] DEFAULT '{}'` column to documents table
  - [ ] Create GIN index on ai_tags for array search
  - [ ] Apply migration via Supabase MCP
  - [ ] Regenerate TypeScript types

- [ ] Task 2: Create AI tagging service (AC: 3.1, 3.2, 3.3, 3.4)
  - [ ] Create `src/lib/documents/ai-tagging.ts`
  - [ ] Define tagging prompt with structured output schema
  - [ ] Use GPT-5.1 with zodResponseFormat for reliable extraction
  - [ ] Extract: tags (3-5), summary (1-2 sentences), inferred document type
  - [ ] Implement 5-second timeout with AbortController
  - [ ] Return graceful fallback on timeout/error

- [ ] Task 3: Integrate tagging into Edge Function (AC: 3.1, 3.4, 3.5)
  - [ ] Update `supabase/functions/process-document/index.ts`
  - [ ] Call AI tagging after chunking completes
  - [ ] Use first 5 chunks (representing ~5 pages) as context
  - [ ] Save ai_tags, ai_summary, inferred document_type to database
  - [ ] Catch and log errors without failing document processing
  - [ ] Log tagging latency for observability

- [ ] Task 4: Update TypeScript types (AC: 3.1, 3.2)
  - [ ] Add `ai_summary: string | null` to Document interface
  - [ ] Add `ai_tags: string[]` to Document interface
  - [ ] Ensure database.types.ts includes new columns

- [ ] Task 5: Display tags in Document Library (AC: 3.6)
  - [ ] Update `DocumentCard` to show ai_tags as tag pills
  - [ ] Limit display to 3 tags with "+N more" indicator
  - [ ] Style tags with subtle background (gray-100)
  - [ ] Show ai_summary in tooltip on hover

- [ ] Task 6: Display tags in Document Viewer (AC: 3.6)
  - [ ] Update document viewer header to show tags
  - [ ] Show full ai_summary below document title
  - [ ] Display all tags (no truncation in detail view)

- [ ] Task 7: Update documents page data fetching (AC: 3.6)
  - [ ] Ensure useDocuments hook fetches ai_tags, ai_summary
  - [ ] Update document list to include new fields

- [ ] Task 8: Write unit tests
  - [ ] Test AI tagging service (mock OpenAI responses)
  - [ ] Test timeout handling and graceful degradation
  - [ ] Test tag display in DocumentCard (truncation logic)
  - [ ] Test tag display in document viewer

- [ ] Task 9: Write E2E test
  - [ ] Test document shows tags after upload/processing
  - [ ] Test tags visible in document library
  - [ ] Test summary visible in document detail view
  - [ ] Test graceful handling when no tags (legacy documents)

## Dev Notes

### Architecture Alignment

- **AI Service:** Use GPT-5.1 with zodResponseFormat (pattern from Story 7.2)
- **Database:** New columns on `documents` table following existing patterns
- **Edge Function:** Enhance existing `process-document` function
- **UI:** Update existing DocumentCard and document viewer components

### AI Tagging Service Design

```typescript
// src/lib/documents/ai-tagging.ts
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const tagResultSchema = z.object({
  tags: z.array(z.string()).min(3).max(5),
  summary: z.string().max(200),
  documentType: z.enum(['quote', 'general']),
});

export async function generateDocumentTags(
  chunks: string[],
  timeoutMs = 5000
): Promise<TagResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await openai.chat.completions.parse({
      model: 'gpt-5.1',
      messages: [
        { role: 'system', content: TAGGING_SYSTEM_PROMPT },
        { role: 'user', content: chunks.slice(0, 5).join('\n\n---\n\n') },
      ],
      response_format: zodResponseFormat(tagResultSchema, 'document_tags'),
      temperature: 0.1,
    }, { signal: controller.signal });

    return response.choices[0].message.parsed;
  } catch (error) {
    console.error('AI tagging failed:', error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
```

### System Prompt for Tagging

```
You are analyzing an insurance document. Based on the content provided, extract:

1. Tags (3-5): Short, relevant keywords describing the document content.
   - Focus on insurance terms (e.g., "liability", "commercial auto", "workers comp")
   - Include carrier name if identifiable
   - Include policy type (e.g., "BOP", "GL", "umbrella")

2. Summary (1-2 sentences): Brief description of what this document is about.
   - Be specific: mention carrier, policy type, coverage highlights
   - Keep under 200 characters

3. Document Type: Is this a "quote" document (insurance proposal/quote) or "general" document (certificate, endorsement, general info)?

Do NOT include:
- PII (names, addresses, policy numbers)
- Generic tags like "insurance" or "document"
```

### Schema Migration

```sql
-- Add AI metadata columns
ALTER TABLE documents
ADD COLUMN ai_summary text,
ADD COLUMN ai_tags text[] DEFAULT '{}';

-- GIN index for array containment queries
CREATE INDEX idx_documents_ai_tags ON documents USING GIN(ai_tags);
```

### Learnings from Previous Story

**From Story F2-2 (Status: done)**

- **DocumentTypeBadge pattern**: Use similar pill styling for tags
- **PATCH endpoint exists**: `/api/documents/[id]` can be extended if needed
- **Optimistic updates pattern**: Follow same pattern for tag display
- **DocumentCard component**: Already has layout for badges, add tags section below

[Source: docs/sprint-artifacts/story-f2.2-document-categorization-schema.md#Dev-Agent-Record]

### Dependencies

- Story F2-1 (Document Library Page) - COMPLETE
- Story F2-2 (Document Categorization Schema) - COMPLETE
- Existing: `process-document` Edge Function, `DocumentCard` component, GPT-5.1 setup from Story 7.2

### Testing Strategy

| Level | Scope | Target |
|-------|-------|--------|
| Unit | AI service, timeout handling | generateDocumentTags function |
| Unit | UI components | Tag display, truncation |
| E2E | Upload → tags visible | Full flow test |

### Performance Considerations

- AI tagging runs async during processing (non-blocking)
- 5-second timeout prevents slow processing
- First 5 chunks (~5 pages) provide sufficient context
- Tags cached in database (no re-generation on view)

### Error Handling

```typescript
// Graceful degradation pattern in Edge Function
try {
  const tagResult = await generateDocumentTags(chunks);
  if (tagResult) {
    await supabase.from('documents').update({
      ai_tags: tagResult.tags,
      ai_summary: tagResult.summary,
      // Only update document_type if not manually set
      document_type: existingType || tagResult.documentType,
    }).eq('id', documentId);
  }
  // Continue processing regardless of tagging result
} catch (error) {
  log.warn('AI tagging failed, continuing without tags', { documentId, error });
}
```

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-f2.md#Story-F2-3]
- [Source: docs/architecture.md#ADR-007-GPT-5.1-for-Structured-Extraction]
- [Source: docs/sprint-artifacts/story-f2.2-document-categorization-schema.md]

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/f2-3-ai-tagging-summarization.context.xml`

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-04 | 1.0 | Story drafted via create-story workflow |
