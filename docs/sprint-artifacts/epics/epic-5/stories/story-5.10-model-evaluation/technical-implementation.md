# Technical Implementation

## New Files

| File | Purpose |
|------|---------|
| `src/lib/llm/config.ts` | Centralized LLM configuration with OpenRouter support |
| `src/lib/llm/client.ts` | OpenRouter/OpenAI client factory |
| `scripts/model-evaluation.ts` | Evaluation runner script |
| `docs/model-evaluation-results.md` | Findings documentation |

## Modified Files

| File | Changes |
|------|---------|
| `src/lib/openai/embeddings.ts` | Use config for embedding model selection |
| `src/lib/chat/openai-stream.ts` | Use `getLLMClient()` and `getModelId()` from config |
| `.env.example` | Add OpenRouter API key and LLM config vars |

## Model Configuration (OpenRouter Integration)

```typescript
// src/lib/llm/config.ts

export type LLMProvider = 'openrouter' | 'openai';

// Chat models available via OpenRouter
export type ChatModel =
  | 'claude-sonnet-4.5'    // anthropic/claude-sonnet-4.5 (PRIMARY)
  | 'claude-haiku-4.5'     // anthropic/claude-haiku-4.5 (fast)
  | 'gemini-2.5-flash'     // google/gemini-2.5-flash (cost-optimized)
  | 'gpt-4o';              // openai/gpt-4o (fallback)

export type EmbeddingModel = 'text-embedding-3-small' | 'text-embedding-3-large';

// OpenRouter model ID mapping
export const OPENROUTER_MODEL_IDS: Record<ChatModel, string> = {
  'claude-sonnet-4.5': 'anthropic/claude-sonnet-4.5',
  'claude-haiku-4.5': 'anthropic/claude-haiku-4.5',
  'gemini-2.5-flash': 'google/gemini-2.5-flash',
  'gpt-4o': 'openai/gpt-4o',
};

export interface ModelConfig {
  provider: LLMProvider;
  chatModel: ChatModel;
  embeddingModel: EmbeddingModel;
  embeddingDimensions: 1536 | 3072;
}

export const DEFAULT_CONFIG: ModelConfig = {
  provider: 'openrouter',
  chatModel: 'claude-sonnet-4.5',  // UPDATED: Claude as primary
  embeddingModel: 'text-embedding-3-small',
  embeddingDimensions: 1536,
};

export function getModelConfig(): ModelConfig {
  return {
    provider: (process.env.LLM_PROVIDER as LLMProvider) || DEFAULT_CONFIG.provider,
    chatModel: (process.env.LLM_CHAT_MODEL as ChatModel) || DEFAULT_CONFIG.chatModel,
    embeddingModel: (process.env.OPENAI_EMBEDDING_MODEL as EmbeddingModel) || DEFAULT_CONFIG.embeddingModel,
    embeddingDimensions: parseInt(process.env.OPENAI_EMBEDDING_DIMS || '1536') as 1536 | 3072,
  };
}

// Get the OpenAI-compatible client for the configured provider
export function getLLMClient() {
  const config = getModelConfig();

  if (config.provider === 'openrouter') {
    return new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://documine.app',
        'X-Title': 'docuMINE',
      },
    });
  }

  // Fallback to direct OpenAI
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Get the model ID for the current provider
export function getModelId(): string {
  const config = getModelConfig();

  if (config.provider === 'openrouter') {
    return OPENROUTER_MODEL_IDS[config.chatModel];
  }

  // Direct OpenAI uses model name directly
  return config.chatModel;
}

// Feature flag for A/B testing
export function getModelConfigForUser(userId: string): ModelConfig {
  const useNewModel = hashUserId(userId) % 2 === 0;

  if (useNewModel && process.env.AB_TEST_MODEL) {
    return {
      ...getModelConfig(),
      chatModel: process.env.AB_TEST_MODEL as ChatModel,
    };
  }

  return getModelConfig();
}

function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}
```

## Environment Variables

```bash
# LLM Provider Configuration (OpenRouter recommended)
LLM_PROVIDER=openrouter                    # openrouter | openai
LLM_CHAT_MODEL=claude-sonnet-4.5           # claude-sonnet-4.5 | claude-haiku-4.5 | gemini-2.5-flash | gpt-4o

# API Keys
OPENROUTER_API_KEY=sk-or-v1-xxxxx          # Get from openrouter.ai/keys
OPENAI_API_KEY=sk-xxxxx                    # Still needed for embeddings

# Embedding Configuration (still uses OpenAI directly)
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMS=1536

# A/B Testing (optional)
AB_TEST_MODEL=claude-haiku-4.5             # Model for test group
AB_TEST_ENABLED=false
```

## Evaluation Script

```typescript
// scripts/model-evaluation.ts

interface EvaluationConfig {
  model: ChatModel;
  testSetPath: string;
  outputPath: string;
}

interface QueryResult {
  queryId: string;
  query: string;
  category: 'lookup' | 'table' | 'semantic' | 'complex';
  response: string;
  confidenceLevel: string;
  latencyFirstToken: number;
  latencyTotal: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}

interface EvaluationSummary {
  model: string;
  testSetSize: number;
  avgLatencyFirstToken: number;
  avgLatencyTotal: number;
  avgCost: number;
  totalCost: number;
  confidenceDistribution: {
    high: number;
    needsReview: number;
    notFound: number;
  };
  byCategory: {
    [key: string]: {
      count: number;
      avgLatency: number;
      avgConfidence: number;
    };
  };
}

async function runEvaluation(config: EvaluationConfig): Promise<EvaluationSummary> {
  // 1. Load test queries
  // 2. Run each query against specified model
  // 3. Capture metrics
  // 4. Generate summary
  // 5. Output to file
}
```

---
