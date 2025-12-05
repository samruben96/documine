# Novel Pattern: Trust-Transparent AI Responses

docuMINE requires a novel pattern for AI responses that builds user trust through transparency.

## Pattern Definition

Every AI response MUST include:
1. **Answer** - Natural language response
2. **Source Citation** - Exact location in document
3. **Confidence Score** - High/Medium/Low with threshold logic

## Implementation

```typescript
interface AIResponse {
  answer: string;
  sources: {
    documentId: string;
    pageNumber: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
    text: string;  // The exact quoted text
  }[];
  confidence: 'high' | 'needs_review' | 'not_found';
  confidenceScore: number;  // 0-1 for internal use
}

// Confidence thresholds
const CONFIDENCE_THRESHOLDS = {
  high: 0.85,        // >= 85% confident
  needs_review: 0.60, // 60-84% confident
  not_found: 0        // < 60% or no relevant chunks found
};
```

## Retrieval Flow

```
User Query: "What is the liability limit?"
                    │
                    ▼
┌─────────────────────────────────────────┐
│  1. Generate query embedding            │
│     (text-embedding-3-small)            │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  2. Vector search in pgvector           │
│     - Filter by document_id + agency_id │
│     - Return top 5 chunks with scores   │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  3. Build prompt with retrieved chunks  │
│     - Include page numbers              │
│     - Include bounding boxes if avail   │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  4. GPT-4o generates response           │
│     - Structured output with citations  │
│     - Confidence based on chunk scores  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  5. Stream response to client           │
│     - Answer text streams first         │
│     - Citations appear after            │
└─────────────────────────────────────────┘
```
