# Key Learnings from Story 5.8.1

**Performance & Resource Constraints:**

During Story 5.8.1 (Large Document Processing), we discovered critical platform limits:

## 1. **Edge Function Timeout Limits**
- **Free Tier:** 150s platform limit (too short for large docs)
- **Paid Tier:** 550s platform limit (supports 50-100MB documents)
- **Current Settings:** 300s Docling, 480s total (optimized for paid tier)

**Impact on Chunking:**
- Chunking happens **AFTER** Docling parsing (which can take 1-5 minutes)
- Chunking must be fast (<15s) to stay within total timeout
- Complex chunking algorithms (table detection, GPT summaries) add processing time
- **Recommendation:** Profile chunking time - ensure it stays <20s even for large docs

## 2. **Resource Limits (CPU/Memory)**
- Encountered `WORKER_LIMIT` errors (error 546) on free tier
- Large documents (30-50MB) consume significant memory during processing
- **Impact on Chunking:**
  - Table extraction from Docling JSON increases memory usage
  - GPT summary generation adds API calls (latency)
  - Batch processing of chunks for embedding is already optimized (20 chunks/batch)

## 3. **Processing Time Benchmarks**
Based on Story 5.8.1 testing (paid tier):
- <5MB: <1 min total
- 5-20MB: 1-3 min total
- 20-50MB: 3-8 min total

**Chunking window:** ~5-20s of the total time
**Available for chunking optimization:** Limited - must stay fast

## 4. **Critical Implementation Guidance**

**DO:**
- ✅ Keep chunking fast (<20s for any document)
- ✅ Profile chunking time separately
- ✅ Consider lazy table summary generation (async after initial processing)
- ✅ Batch GPT calls for table summaries
- ✅ Add timeout checks during chunking phase

**DON'T:**
- ❌ Add expensive operations to chunking pipeline
- ❌ Make GPT calls per-chunk (use batching)
- ❌ Load entire document into memory multiple times
- ❌ Assume unlimited processing time

## 5. **Recommended Chunking Timeline**

From Story 5.8.1, total processing budget (paid tier):
```
Download: 5-10s
Docling:  60-300s  (varies by document complexity)
Chunking: 5-20s    ← THIS STORY - MUST STAY FAST
Embedding: 30-120s (varies by chunk count)
Total:    100-450s (under 480s limit)
```

**Chunking cannot exceed ~20s** or we risk timeouts on complex documents.

## 6. **Table Summary Strategy**

Given tight time constraints:

**Option A (Recommended):** Lazy generation
- Store tables as-is during initial processing
- Generate summaries async in background job
- Update embeddings after summary generation

**Option B:** Inline generation
- Generate summaries during processing
- Batch GPT calls (all tables in doc → single prompt)
- Risk: adds 5-10s to processing time

**Choose Option A** to avoid timeout risks.

---
