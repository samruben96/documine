# Implementation Tasks

## Task 1: OpenRouter Configuration Module
- [x] Create `src/lib/llm/config.ts` with OpenRouter support
- [x] Define types for Claude Sonnet 4.5, Claude Haiku 4.5, Gemini 2.5 Flash, GPT-4o
- [x] Create `OPENROUTER_MODEL_IDS` mapping
- [x] Implement `getLLMClient()` factory function
- [x] Implement `getModelId()` for provider-specific IDs
- [x] Add A/B testing support with `getModelConfigForUser()`
- [x] Write unit tests

## Task 2: Update Existing Code for OpenRouter
- [x] Update `openai-stream.ts` to use `getLLMClient()` and `getModelId()`
- [x] Update `embeddings.ts` to use config (still direct OpenAI for embeddings)
- [x] Ensure backward compatibility with `LLM_PROVIDER=openai`
- [x] Test with Claude Sonnet 4.5 as default

## Task 3: Environment Configuration
- [x] Update `.env.example` with OpenRouter variables
- [ ] Add `OPENROUTER_API_KEY` to Supabase Edge Function secrets (deferred - manual step)
- [x] Document model selection in .env.example comments

## Task 4: Evaluation Script (Optional - Deferred)
- [ ] Create evaluation runner script (deferred to post-MVP)
- [ ] Implement metrics collection across providers (deferred)
- [ ] Generate comparison JSON output (deferred)

## Task 5: Documentation
- [x] Update architecture.md with OpenRouter decision (ADR-005)
- [x] Document model hierarchy and fallback strategy
- [ ] Create troubleshooting guide for provider issues (deferred)

---
