# Story 5.4: Source Citation Display

As a **user**,
I want **to see exactly where in the document an answer came from**,
So that **I can verify the AI's response is accurate**.

**Acceptance Criteria:**

**Given** an AI response includes a source citation
**When** I view the response
**Then** the citation shows:
- "View in document →" or "Page X →" link
- Styled subtly (small text, muted color until hover)

**And** multiple sources show as:
- "Sources: Page 3, Page 7, Page 12" (links)
- Or expandable "View 3 sources" if many

**And** the citation includes:
- Page number
- Snippet preview on hover (optional for MVP)

**And** response messages are saved with source metadata:
```typescript
sources: [{
  documentId: string,
  pageNumber: number,
  text: string,  // the quoted passage
  boundingBox?: { x, y, width, height }
}]
```

**Prerequisites:** Story 5.3

**Technical Notes:**
- Sources extracted during RAG pipeline
- Store top 1-3 most relevant chunks as sources
- Source click handling in next story (5.5)

---
