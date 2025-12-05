# Story 5.10: Model Evaluation (Phase 3)

As a **system administrator**,
I want **to evaluate and potentially upgrade AI models via OpenRouter**,
So that **response quality and cost-efficiency are optimized with multi-provider flexibility**.

**Updated 2025-12-02:** Based on Party Mode research, decision is to use **OpenRouter** for multi-model access with **Claude Sonnet 4.5** as primary model.

**Acceptance Criteria:**

**Given** OpenRouter provides multi-provider access
**When** evaluating model configurations
**Then** the following are assessed:

**OpenRouter Integration:**
- Configure OpenRouter as primary LLM provider
- Support model hierarchy: Claude Sonnet 4.5 (primary), Claude Haiku 4.5 (fast), Gemini 2.5 Flash (cost-opt), GPT-4o (fallback)
- Environment variables: `OPENROUTER_API_KEY`, `LLM_PROVIDER`, `LLM_CHAT_MODEL`

**Why Claude for Insurance Documents:**
- Superior structured document handling
- Better instruction following, less hallucination
- 200K context window (vs GPT-4o 128K)
- Excellent table comprehension (60%+ of insurance docs are tables)

**Embedding Model Evaluation:**
- Compare text-embedding-3-small vs text-embedding-3-large
- Test with 1536 dimensions (drop-in compatible)
- Test with 3072 dimensions (if retrieval improvement significant)
- Measure retrieval accuracy improvement

**A/B Testing Framework:**
- Feature flag for model selection per request
- Metrics collection for comparison
- User feedback mechanism (optional)

**Cost Analysis:**
- Calculate cost impact of model changes
- Document ROI of improvements
- Recommend optimal configuration

**Success Metrics:**
- Clear recommendation with supporting data
- No regression in response quality
- Cost-neutral or improved cost-efficiency

**Prerequisites:** Story 5.9

**Technical Notes:**
- New config module: `src/lib/llm/config.ts`
- OpenRouter client factory: `src/lib/llm/client.ts`
- Update `src/lib/chat/openai-stream.ts` to use `getLLMClient()`
- Feature flags for A/B testing

---
