# Infrastructure: OpenRouter Integration

A significant infrastructure change from Epic 5 (Story 5.10) that underpins all Epic 6 work:

## What Changed

docuMINE switched from direct OpenAI API calls to **OpenRouter** as the LLM gateway:

```typescript
// src/lib/llm/config.ts
export const DEFAULT_CONFIG: ModelConfig = {
  provider: 'openrouter',
  chatModel: 'claude-sonnet-4.5', // PRIMARY via OpenRouter
  embeddingModel: 'text-embedding-3-small',
  embeddingDimensions: 1536,
};
```

## Model Hierarchy

| Model | Purpose | Pricing (per 1M tokens) |
|-------|---------|-------------------------|
| **Claude Sonnet 4.5** | Primary - Complex queries, tables, citations | $3/$15 |
| Gemini 2.5 Flash | Cost-optimized - High volume, 1M context | $0.15/$0.60 |
| Claude Haiku 4.5 | Fast - Simple lookups, low latency | $0.80/$4.00 |
| GPT-4o | Fallback - If others unavailable | $2.50/$10.00 |

## Benefits Realized

1. **Model Flexibility:** Can switch between Claude, GPT-4o, Gemini without code changes
2. **A/B Testing Support:** Built-in user-level model assignment via `getModelConfigForUser()`
3. **Cost Optimization:** Can route simple queries to cheaper models
4. **Single API Integration:** One client for multiple providers
5. **Automatic Fallback:** If primary unavailable, can fall back to alternatives

## Configuration

```bash
# Environment variables
OPENROUTER_API_KEY=sk-or-...
LLM_PROVIDER=openrouter
LLM_CHAT_MODEL=claude-sonnet-4.5
```

## Why This Matters

OpenRouter enabled us to use **Claude Sonnet 4.5** as the primary model - the best model for insurance document Q&A with complex tables and citations. The abstraction also enables future cost optimization by routing simple queries to cheaper models.

---
