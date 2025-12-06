# Background & Context

## Problem Statement

The confidence badge shows "Not Found" even when the AI provides accurate, sourced answers. This directly contradicts the trust transparency UX pattern and undermines user confidence in the system.

**Evidence:**
```
Query: "What is the total annual premium?"
Response: "Great question! Your total annual premium is $6,060.00..."
Badge: "Not Found" (gray) ❌
Expected Badge: "High Confidence" (green) ✓
```

## Root Cause Analysis

The issue originates in `src/lib/chat/reranker.ts:114`:

```typescript
similarityScore: result.relevanceScore,  // Cohere score replaces vector similarity
```

**The Problem:**

1. **Cohere reranker scores have a different distribution than vector similarity scores:**
   - Vector similarity (cosine): typically 0.0-1.0, with relevant results >= 0.75
   - Cohere relevance scores: different scale, a highly relevant result might score 0.3-0.5

2. **Current thresholds are calibrated for vector similarity:**
   - High Confidence: >= 0.75
   - Needs Review: 0.50 - 0.74
   - Not Found: < 0.50

3. **Result:** Reranker returns a relevant result with score 0.35, but the threshold logic sees this as "Not Found" (< 0.50).

## User Impact

- Users see contradictory UI - helpful, correct answer with "Not Found" badge
- Erodes trust in the system (core product value proposition)
- Violates FR16: "Every answer includes confidence indicator (High Confidence / Needs Review / Not Found)"
- NFR16 violated: "Confidence scoring accurately reflects actual confidence levels"

---
