# Expected Findings Template

```markdown
# Model Evaluation Results

## Executive Summary
Based on evaluation of X queries across 4 categories...

## Recommendation
**Recommended Model:** [GPT-5-mini / GPT-4o / GPT-5.1]

**Rationale:**
- [Cost savings of X% with comparable accuracy]
- [OR] [Accuracy improvement of X% justifies cost]
- [OR] [Maintain GPT-4o until GPT-5.1 stable]

## Detailed Comparison

| Metric | GPT-4o | GPT-5-mini | GPT-5.1 |
|--------|--------|------------|---------|
| Accuracy | X% | X% | X% |
| Avg Latency | Xms | Xms | Xms |
| Cost/1000 | $X.XX | $X.XX | $X.XX |

## Cost Projection
At 10,000 queries/month:
- GPT-4o: $XX/month
- GPT-5-mini: $XX/month (X% savings)

## Trade-offs
- [Document any quality differences]
- [Document latency differences]
- [Document edge cases]

## Migration Path
If recommending model change:
1. Update environment variable
2. Monitor for X days
3. Rollback if issues detected
```

---
