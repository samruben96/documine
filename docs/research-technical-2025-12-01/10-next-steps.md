# 10. Next Steps

## Immediate Actions (This Sprint)

1. **Create Story 5.8** with acceptance criteria based on this research
2. **Set up Cohere account** and API key
3. **Benchmark current performance** on test query set
4. **Implement Cohere Reranking** as first optimization

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| High Confidence responses | ~30% | >50% | % of queries with confidence ≥0.85 |
| Average similarity score | ~0.55 | >0.70 | Mean cosine similarity of top result |
| "Not Found" responses | ~40% | <20% | % of queries below threshold |
| Response latency (P50) | ~2s | <3s | Time to first token |

## Test Query Set

Create 50 test queries covering:
- Simple lookups (policy number, effective date)
- Coverage questions (what's covered, limits)
- Table data (deductibles, coverage amounts)
- Exclusion questions (what's not covered)
- Complex comparisons (Policy A vs B)

---
