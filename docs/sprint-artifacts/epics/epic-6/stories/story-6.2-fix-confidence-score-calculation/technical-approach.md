# Technical Approach

## Option Analysis

| Option | Pros | Cons |
|--------|------|------|
| A: Keep original vector similarity for confidence | Simple, backward compatible | Reranker relevance not used for confidence |
| B: Recalibrate thresholds for Cohere scores | Uses reranker intelligence | Need to analyze score distribution |
| C: Separate properties for each score | Clean separation, explicit | More complex data model |

**Decision: Option C** - Separate properties with appropriate thresholds for each

This provides:
- Clear semantics (no confusion about which score is which)
- Ability to use reranker scores when available, fall back to vector scores
- Logging visibility into both scores for debugging

## Implementation Plan

### Step 1: Fix Reranker Score Handling (SIMPLIFIED)

**VERIFIED:** The `RetrievedChunk` type already has the needed properties:
- `similarityScore: number` - Combined/vector score
- `vectorScore?: number` - Raw vector similarity
- `rerankerScore?: number` - Cohere relevance score

**THE BUG:** Line 114 in `reranker.ts` overwrites `similarityScore`:

```typescript
// Current (buggy) - lines 110-116:
rerankedChunks.push({
  ...chunk,
  rerankerScore: result.relevanceScore,  // ✅ Correct - adds reranker score
  similarityScore: result.relevanceScore, // ❌ BUG - overwrites original!
});

// Fixed - just remove line 114:
rerankedChunks.push({
  ...chunk,
  rerankerScore: result.relevanceScore,  // ✅ Cohere score preserved separately
  // similarityScore preserved from original chunk via spread
});
```

This is a **one-line deletion** fix for the core bug.

### Step 3: Update Confidence Calculation

Update `src/lib/chat/confidence.ts`:

```typescript
export type ConfidenceLevel = 'high' | 'needs_review' | 'not_found' | 'conversational';

// Thresholds calibrated per score type
const VECTOR_THRESHOLDS = {
  high: 0.75,
  needs_review: 0.50,
};

const COHERE_THRESHOLDS = {
  high: 0.30,      // Cohere scores are lower scale
  needs_review: 0.10,
};

export function calculateConfidence(
  vectorScore: number | null,
  rerankerScore: number | null | undefined,
  queryIntent?: QueryIntent
): ConfidenceLevel {
  // For greetings/conversational, return 'conversational'
  if (queryIntent === 'greeting' || queryIntent === 'general') {
    return 'conversational';
  }

  // Use reranker score if available (it's more accurate for relevance)
  if (rerankerScore != null) {
    if (rerankerScore >= COHERE_THRESHOLDS.high) return 'high';
    if (rerankerScore >= COHERE_THRESHOLDS.needs_review) return 'needs_review';
    return 'not_found';
  }

  // Fall back to vector similarity
  if (vectorScore == null) return 'not_found';
  if (vectorScore >= VECTOR_THRESHOLDS.high) return 'high';
  if (vectorScore >= VECTOR_THRESHOLDS.needs_review) return 'needs_review';
  return 'not_found';
}
```

### Step 4: Update RAG Pipeline

Update `src/lib/chat/rag.ts` to pass both scores through the pipeline.

### Step 5: Update UI for 'conversational' Confidence

Update `src/components/chat/confidence-badge.tsx` to handle the new 'conversational' level:

```typescript
const confidenceConfig = {
  high: { icon: CheckCircle, text: 'High Confidence', color: 'text-green-600 bg-green-50' },
  needs_review: { icon: AlertCircle, text: 'Needs Review', color: 'text-yellow-600 bg-yellow-50' },
  not_found: { icon: HelpCircle, text: 'Not Found', color: 'text-gray-600 bg-gray-50' },
  conversational: { icon: MessageCircle, text: 'Conversational', color: 'text-blue-600 bg-blue-50' },
};
```

## Threshold Calibration Notes

The Cohere thresholds (0.30/0.10) are starting points based on:
- Cohere rerank models output relevance scores in a different distribution than cosine similarity
- A score of 0.3+ from Cohere typically indicates high relevance
- These thresholds should be monitored and adjusted based on real-world score distributions

**Recommendation:** Add logging to capture score distributions over first week of usage, then fine-tune thresholds.

---
