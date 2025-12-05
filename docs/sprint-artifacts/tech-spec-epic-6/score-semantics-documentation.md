# Score Semantics Documentation

**Learning from Epic 5:** Score conflation caused confidence badge bugs.

## Score Types and Their Meanings

| Score | Source | Range | Meaning |
|-------|--------|-------|---------|
| `vectorSimilarity` | pgvector cosine distance | 0.0 - 1.0 | How similar chunk embedding is to query embedding |
| `rerankerScore` | Cohere rerank API | 0.0 - 1.0 | How relevant chunk is to answering the query |
| `confidenceScore` | Computed | 0.0 - 1.0 | Score used for UI badge display |

## Score Flow Diagram

```
Query → Embedding → pgvector search → vectorSimilarity (0.0-1.0)
                                           ↓
                           [If reranker enabled]
                                           ↓
                    Cohere rerank → rerankerScore (0.0-1.0)
                                           ↓
                    calculateConfidence() → UI Badge
```

## Threshold Calibration (Story 6.2)

**Vector Similarity Thresholds (current):**
| Range | Confidence Level |
|-------|-----------------|
| >= 0.75 | High |
| 0.50 - 0.74 | Needs Review |
| < 0.50 | Not Found |

**Cohere Reranker Thresholds (proposed):**
| Range | Confidence Level |
|-------|-----------------|
| >= 0.30 | High |
| 0.10 - 0.29 | Needs Review |
| < 0.10 | Not Found |

**Note:** Thresholds should be calibrated with actual score distribution logging.

---
