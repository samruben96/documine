# Key Learnings from Story 5.8.1

**Performance & Resource Constraints:**

During Story 5.8.1 (Large Document Processing), we discovered critical platform limits that impact evaluation strategy:

## 1. **Platform Limits & Evaluation Timing**
- **Free Tier:** 150s platform limit
- **Paid Tier:** 550s platform limit
- **Document Processing:** Can take 1-8 minutes depending on size/complexity
- **Impact on Evaluation:**
  - Must account for processing time when running evaluations
  - Large evaluation sets (50-100 queries) could take hours
  - Should batch queries to avoid rate limits

## 2. **Cost Considerations**

**Document Processing Costs:**
- Each document processed incurs: Docling API costs + OpenAI embedding costs
- Story 5.8.1 showed large documents (30-50MB) can take 5-8 minutes
- Re-processing documents for each evaluation is wasteful

**Recommendation:**
- ✅ Use **pre-processed documents** for evaluation (already embedded)
- ✅ Don't re-upload/re-process documents for each model test
- ✅ Focus evaluation on **query/response quality**, not processing pipeline
- ❌ Avoid creating new documents per evaluation run

## 3. **Evaluation Script Design**

Given Story 5.8.1 insights:

**DO:**
- ✅ Use existing processed documents from database
- ✅ Run evaluation queries against pre-embedded chunks
- ✅ Batch queries with delays to avoid rate limits
- ✅ Cache evaluation results (don't re-run unnecessarily)
- ✅ Profile evaluation script execution time
- ✅ Add progress tracking for long-running evaluations

**DON'T:**
- ❌ Upload/process new documents for evaluation
- ❌ Run all 50 queries in tight loop (rate limits)
- ❌ Assume unlimited API quota
- ❌ Re-embed documents for each model test

## 4. **Resource Budgeting**

From Story 5.8.1 benchmarks (paid tier):

**Query Response Time:**
- Simple lookup: <1s
- Complex reasoning: 2-3s
- Table queries: 1-2s

**Evaluation Timeline Estimate:**
- 50 queries × 2s avg = ~100s active processing
- Add batch delays (rate limits): ~300s total
- Add result capture/analysis: ~60s
- **Total per model: ~6-8 minutes**

**For 3 models (GPT-4o, GPT-5-mini, GPT-5.1):**
- Total evaluation time: ~20-25 minutes
- Fits well within platform limits

## 5. **API Cost Budgeting**

**Per Evaluation Run (50 queries):**

Using GPT-4o baseline:
- Input tokens: ~50 queries × 2000 tokens avg = 100K tokens
- Output tokens: ~50 queries × 500 tokens avg = 25K tokens
- Cost: (100K × $2.50/1M) + (25K × $10/1M) = $0.25 + $0.25 = **~$0.50 per model**

**Total evaluation cost (3 models):**
- ~$1.50 for complete comparison
- Well within budget constraints

**Embedding costs (if re-embedding):**
- NOT RECOMMENDED - use existing embeddings
- If needed: ~$0.02 per document (text-embedding-3-small)

## 6. **Critical Implementation Guidance**

**Evaluation Script Must:**
1. **Use existing documents** - Don't trigger document processing pipeline
2. **Respect rate limits** - Add delays between queries (1-2s)
3. **Track progress** - Console output for long-running evaluations
4. **Cache results** - Save to file, don't re-run unnecessarily
5. **Handle timeouts** - Individual query timeout (30s max)

**Example Safe Pattern:**
```typescript
// DON'T: Upload and process documents
async function evaluateModel_BAD() {
  for (const doc of testDocs) {
    await uploadDocument(doc); // ❌ Triggers full processing!
  }
}

// DO: Use pre-processed documents
async function evaluateModel_GOOD() {
  const processedDocs = await getProcessedDocuments(); // ✅ From DB
  for (const query of testQueries) {
    await sleep(1500); // ✅ Rate limit protection
    const result = await runQuery(query, processedDocs);
    results.push(result);
  }
}
```

## 7. **Test Data Strategy**

**Recommended Approach:**
1. **One-time setup:** Upload and process 3-5 representative insurance documents
2. **Cache document IDs:** Store in test config file
3. **Evaluation runs:** Query against these pre-processed documents
4. **Benefits:**
   - No processing overhead per evaluation
   - Consistent test data across model comparisons
   - Fast iteration (query-only, no document processing)

**Test Document Selection:**
- 1× Small document (<5MB, simple) - Fast baseline
- 1× Medium document (5-20MB, moderate tables) - Typical case
- 1× Large document (20-50MB, complex tables) - Stress test

## 8. **Monitoring During Evaluation**

**Watch for:**
- OpenAI API rate limit errors (429)
- Slow response times (>5s for simple queries)
- Memory usage spikes (if running locally)
- Database connection limits (if many parallel queries)

**Mitigation:**
- Sequential execution with delays (not parallel)
- Respect rate limits (1-2 queries/second max)
- Monitor costs in OpenAI dashboard during run

---
