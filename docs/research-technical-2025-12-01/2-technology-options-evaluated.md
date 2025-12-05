# 2. Technology Options Evaluated

## 2.1 AI Chat Models

| Model | Release | Input Cost | Output Cost | Context | Best For |
|-------|---------|------------|-------------|---------|----------|
| **GPT-4o** (current) | 2024 | $2.50/1M | $10.00/1M | 128K | General tasks, multimodal |
| **GPT-4o-mini** | 2024 | $0.15/1M | $0.60/1M | 128K | Cost-sensitive, fast |
| **GPT-4.1** | 2025 | ~$2.50/1M | ~$10.00/1M | 128K | Improved accuracy (61.7%) |
| **GPT-5** | Aug 2025 | $1.25/1M | $10.00/1M | 196K | Frontier intelligence |
| **GPT-5-mini** | Aug 2025 | $0.25/1M | $2.00/1M | 196K | Balanced cost/quality |
| **GPT-5-nano** | Aug 2025 | $0.05/1M | $0.40/1M | 128K | Ultra-low cost |
| **GPT-5.1** | Nov 2025 | ~$1.25/1M | ~$10.00/1M | 196K | Adaptive reasoning, caching |
| **o1** | 2024 | $15.00/1M | $60.00/1M | 128K | Complex reasoning |
| **o1-mini** | 2024 | $1.10/1M | $4.40/1M | 128K | Reasoning, cost-efficient |
| **o3-mini** | 2025 | $1.10/1M | $4.40/1M | 128K | Advanced reasoning |
| **o4-mini** | 2025 | $1.10/1M | $4.40/1M | 200K | Tool-augmented reasoning |

## 2.2 Embedding Models

| Model | Dimensions | Cost/1M tokens | MTEB Score | Best For |
|-------|------------|----------------|------------|----------|
| **text-embedding-3-small** (current) | 1536 | $0.02 | ~61% | General, cost-efficient |
| **text-embedding-3-large** | 3072 (configurable) | $0.13 | 64.6% | High accuracy needs |
| **text-embedding-3-large (1536)** | 1536 (shortened) | $0.13 | ~62% | Drop-in upgrade |
| **Voyage AI voyage-3** | 1024 | $0.06 | ~65% | Document retrieval |
| **Cohere embed-v4** | 1024 | $0.10 | ~64% | Multilingual |
| **E5-large-instruct** (open) | 1024 | Free (self-host) | 100% Top-5 | Self-hosted option |

## 2.3 Chunking Strategies

| Strategy | Complexity | Accuracy Gain | Processing Time | Best For |
|----------|------------|---------------|-----------------|----------|
| **Fixed-size** (current) | Low | Baseline | Fast | Simple docs |
| **RecursiveCharacterTextSplitter** | Low | +5-10% | Fast | General docs |
| **Semantic Chunking** | Medium | +2-3% over Recursive | 10x slower | Topic-diverse docs |
| **Hierarchical Chunking** | High | +10-15% | Medium | Nested structures |
| **Table-Aware Chunking** | Medium | +20% for tables | Medium | Documents with tables |
| **Agentic Chunking** | High | Variable | Slow | Complex mixed docs |

## 2.4 Retrieval Strategies

| Strategy | Complexity | Accuracy Gain | Latency Impact | Best For |
|----------|------------|---------------|----------------|----------|
| **Vector-only** (current) | Low | Baseline | ~100ms | Simple queries |
| **Hybrid (BM25 + Vector)** | Medium | +10-20% | +50ms | Keyword-heavy queries |
| **Hybrid + Reranking** | Medium | +20-48% | +200ms | Production RAG |
| **Multi-stage + Re-ranking** | High | +30-50% | +500ms | Complex queries |

---
