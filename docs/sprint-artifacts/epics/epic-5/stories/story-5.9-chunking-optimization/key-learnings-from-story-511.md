# Key Learnings from Story 5.11

**Critical Observation:** During Story 5.11 bug fixes, we discovered important RAG behavior:

**Example Query:** "Whats in the dwelling info"
**Result:** GPT gave an excellent response with specific coverage amounts from page 1, but the confidence badge showed "Not Found"

**Relevance to Chunking:**

1. **Chunk Quality Matters More Than Similarity Score**: Even with low similarity scores (< 0.60), if the correct chunk is retrieved, GPT can extract and present the information accurately. This suggests:
   - Chunk semantic coherence is crucial
   - Tables being split hurts retrieval AND comprehension
   - Better chunks → better retrieval → higher confidence scores

2. **Current Chunking May Be Hurting Similarity Scores**: The "dwelling info" query likely:
   - Found relevant chunks but with fragmented content
   - Embedding similarity suffered due to content fragmentation
   - Better semantic chunking should improve scores

3. **Don't Rely on Code to Override LLM**: Story 5.11 removed forced "not found" responses because:
   - GPT-4o is smart enough to handle retrieved context intelligently
   - System prompt already guides behavior
   - Code overrides blocked legitimate good responses

**Recommendation for This Story:**
- Include "dwelling info" style queries in test cases
- Measure if new chunking improves similarity scores (not just response quality)
- Track whether improved chunking reduces false "not found" badges
- Tables preserved as single chunks should significantly improve table query similarity scores

---
