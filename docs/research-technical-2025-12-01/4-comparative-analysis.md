# 4. Comparative Analysis

## 4.1 Chat Model Comparison

| Factor | GPT-4o | GPT-4.1 | GPT-5-mini | GPT-5.1 | o1-mini |
|--------|--------|---------|------------|---------|---------|
| **Accuracy** | Good | Better | Better | Best | Excellent (reasoning) |
| **Cost** | $$$ | $$$ | $$ | $$ | $$ |
| **Latency** | Fast | Fast | Fast | Adaptive | Slow |
| **Streaming** | Yes | Yes | Yes | Yes | Limited |
| **Context** | 128K | 128K | 196K | 196K | 128K |
| **Caching** | Standard | Standard | Standard | 24h extended | Standard |
| **Recommendation** | Current | Quick win | Balanced | Advanced | Complex queries |

## 4.2 Chunking Strategy Comparison

| Factor | Fixed-size | Recursive | Semantic | Table-Aware |
|--------|------------|-----------|----------|-------------|
| **Implementation** | Simple | Simple | Medium | Medium |
| **Accuracy** | Baseline | +5-10% | +7-13% | +20% (tables) |
| **Processing Time** | Fast | Fast | 10x slower | 1.5x slower |
| **Maintenance** | Low | Low | Medium | Low |
| **Insurance Fit** | Poor | Good | Good | Excellent |
| **Recommendation** | Avoid | Yes | Maybe | Yes |

## 4.3 Retrieval Strategy Comparison

| Factor | Vector Only | Hybrid | Vector + Rerank | Hybrid + Rerank |
|--------|-------------|--------|-----------------|-----------------|
| **Accuracy** | Baseline | +10-20% | +20-40% | +30-48% |
| **Latency** | ~100ms | ~150ms | ~300ms | ~350ms |
| **Cost** | Embeddings only | Same | +$1/1000 | +$1/1000 |
| **Complexity** | Low | Medium | Medium | Medium |
| **Keyword Match** | Poor | Excellent | Poor | Excellent |
| **Recommendation** | Avoid | Good | Better | Best |

---
