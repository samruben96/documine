# File List

## New Files
- `src/lib/llm/config.ts` - LLM configuration module
- `__tests__/unit/lib/llm/config.test.ts` - Unit tests (32 tests)

## Modified Files
- `src/lib/chat/openai-stream.ts` - Use OpenRouter client
- `src/lib/openai/embeddings.ts` - Use config for model/dimensions
- `src/app/api/chat/route.ts` - API key validation for OpenRouter
- `.env.example` - LLM configuration variables
- `docs/architecture.md` - ADR-005 OpenRouter decision
