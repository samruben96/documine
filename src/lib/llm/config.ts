/**
 * LLM Configuration Module
 *
 * Centralized configuration for LLM providers and models.
 * Story 5.10: OpenRouter integration with Claude Sonnet 4.5 as primary.
 *
 * @module @/lib/llm/config
 */

import OpenAI from 'openai';

// ============================================================================
// Type Definitions
// ============================================================================

export type LLMProvider = 'openrouter' | 'openai';

/**
 * Chat models available via OpenRouter or direct OpenAI.
 *
 * Model hierarchy (per Party Mode research 2025-12-02):
 * 1. claude-sonnet-4.5 - Primary: Best for complex queries, tables, citations
 * 2. gemini-2.5-flash - Cost-optimized: High-volume, 1M context
 * 3. claude-haiku-4.5 - Fast: Simple lookups, low latency
 * 4. gpt-4o - Fallback: If others unavailable
 */
export type ChatModel =
  | 'claude-sonnet-4.5' // anthropic/claude-sonnet-4.5 (PRIMARY)
  | 'claude-haiku-4.5' // anthropic/claude-haiku-4.5 (fast)
  | 'gemini-2.5-flash' // google/gemini-2.5-flash (cost-optimized)
  | 'gpt-4o'; // openai/gpt-4o (fallback)

export type EmbeddingModel = 'text-embedding-3-small' | 'text-embedding-3-large';

// ============================================================================
// Constants
// ============================================================================

/**
 * OpenRouter model ID mapping.
 * Maps our internal model names to OpenRouter's provider/model format.
 */
export const OPENROUTER_MODEL_IDS: Record<ChatModel, string> = {
  'claude-sonnet-4.5': 'anthropic/claude-sonnet-4.5',
  'claude-haiku-4.5': 'anthropic/claude-3.5-haiku',
  'gemini-2.5-flash': 'google/gemini-2.5-flash-preview',
  'gpt-4o': 'openai/gpt-4o',
};

/**
 * Model pricing (per 1M tokens) for cost calculation.
 * Updated 2025-12-02 from OpenRouter pricing.
 */
export const MODEL_PRICING: Record<
  ChatModel,
  { input: number; output: number }
> = {
  'claude-sonnet-4.5': { input: 3.0, output: 15.0 },
  'claude-haiku-4.5': { input: 0.8, output: 4.0 },
  'gemini-2.5-flash': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10.0 },
};

/**
 * Embedding model dimensions mapping.
 */
export const EMBEDDING_DIMENSIONS: Record<EmbeddingModel, number[]> = {
  'text-embedding-3-small': [512, 1536],
  'text-embedding-3-large': [256, 1024, 3072],
};

// ============================================================================
// Configuration Interface
// ============================================================================

export interface ModelConfig {
  provider: LLMProvider;
  chatModel: ChatModel;
  embeddingModel: EmbeddingModel;
  embeddingDimensions: 512 | 1024 | 1536 | 3072;
}

export const DEFAULT_CONFIG: ModelConfig = {
  provider: 'openrouter',
  chatModel: 'claude-sonnet-4.5', // PRIMARY per Party Mode research
  embeddingModel: 'text-embedding-3-small',
  embeddingDimensions: 1536, // Maintain backward compatibility
};

// ============================================================================
// Configuration Functions
// ============================================================================

/**
 * Get the current model configuration from environment variables.
 *
 * Environment variables:
 * - LLM_PROVIDER: 'openrouter' | 'openai' (default: 'openrouter')
 * - LLM_CHAT_MODEL: ChatModel (default: 'claude-sonnet-4.5')
 * - OPENAI_EMBEDDING_MODEL: EmbeddingModel (default: 'text-embedding-3-small')
 * - OPENAI_EMBEDDING_DIMS: number (default: 1536)
 */
export function getModelConfig(): ModelConfig {
  const provider = parseProvider(process.env.LLM_PROVIDER);
  const chatModel = parseChatModel(process.env.LLM_CHAT_MODEL);
  const embeddingModel = parseEmbeddingModel(process.env.OPENAI_EMBEDDING_MODEL);
  const embeddingDimensions = parseEmbeddingDimensions(
    process.env.OPENAI_EMBEDDING_DIMS,
    embeddingModel
  );

  return {
    provider,
    chatModel,
    embeddingModel,
    embeddingDimensions,
  };
}

/**
 * Get model configuration for a specific user (A/B testing support).
 *
 * When AB_TEST_ENABLED=true and AB_TEST_MODEL is set, users are deterministically
 * assigned to either the default model or the test model based on their userId hash.
 *
 * @param userId - User ID for deterministic assignment
 * @returns ModelConfig with potentially different chatModel for test group
 */
export function getModelConfigForUser(userId: string): ModelConfig {
  const config = getModelConfig();

  // Check if A/B testing is enabled
  const abTestEnabled = process.env.AB_TEST_ENABLED === 'true';
  const abTestModel = process.env.AB_TEST_MODEL as ChatModel | undefined;

  if (!abTestEnabled || !abTestModel) {
    return config;
  }

  // Validate the A/B test model
  const validTestModel = parseChatModel(abTestModel);

  // Deterministically assign user to test group (50/50 split)
  const useTestModel = hashUserId(userId) % 2 === 0;

  if (useTestModel) {
    return {
      ...config,
      chatModel: validTestModel,
    };
  }

  return config;
}

// ============================================================================
// LLM Client Factory
// ============================================================================

/**
 * Get an OpenAI-compatible client for the configured provider.
 *
 * For OpenRouter: Uses OpenRouter's OpenAI-compatible API with custom headers.
 * For OpenAI: Uses direct OpenAI client.
 *
 * @param overrideProvider - Optional override for the provider
 * @returns OpenAI client configured for the provider
 */
export function getLLMClient(overrideProvider?: LLMProvider): OpenAI {
  const config = getModelConfig();
  const provider = overrideProvider ?? config.provider;

  if (provider === 'openrouter') {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is required when using OpenRouter provider');
    }

    return new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://documine.app',
        'X-Title': 'docuMINE',
      },
    });
  }

  // Direct OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required when using OpenAI provider');
  }

  return new OpenAI({ apiKey });
}

/**
 * Get the model ID string for the current provider.
 *
 * OpenRouter uses format: 'provider/model-id'
 * OpenAI uses format: 'model-id'
 *
 * @param overrideModel - Optional override for the model
 * @returns Model ID string for API calls
 */
export function getModelId(overrideModel?: ChatModel): string {
  const config = getModelConfig();
  const model = overrideModel ?? config.chatModel;

  if (config.provider === 'openrouter') {
    return OPENROUTER_MODEL_IDS[model];
  }

  // Direct OpenAI only supports gpt-4o from our list
  if (model !== 'gpt-4o') {
    throw new Error(`Model ${model} is only available via OpenRouter. Set LLM_PROVIDER=openrouter`);
  }

  return model;
}

/**
 * Get the model ID for a specific user (A/B testing aware).
 *
 * @param userId - User ID for A/B test assignment
 * @returns Model ID string for API calls
 */
export function getModelIdForUser(userId: string): string {
  const config = getModelConfigForUser(userId);

  if (config.provider === 'openrouter') {
    return OPENROUTER_MODEL_IDS[config.chatModel];
  }

  return config.chatModel;
}

// ============================================================================
// Cost Calculation
// ============================================================================

/**
 * Calculate estimated cost for a query based on token usage.
 *
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @param model - Model used (defaults to configured model)
 * @returns Estimated cost in USD
 */
export function calculateQueryCost(
  inputTokens: number,
  outputTokens: number,
  model?: ChatModel
): number {
  const config = getModelConfig();
  const pricing = MODEL_PRICING[model ?? config.chatModel];

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse and validate provider from string.
 */
function parseProvider(value: string | undefined): LLMProvider {
  if (value === 'openai' || value === 'openrouter') {
    return value;
  }
  return DEFAULT_CONFIG.provider;
}

/**
 * Parse and validate chat model from string.
 */
function parseChatModel(value: string | undefined): ChatModel {
  const validModels: ChatModel[] = [
    'claude-sonnet-4.5',
    'claude-haiku-4.5',
    'gemini-2.5-flash',
    'gpt-4o',
  ];

  if (value && validModels.includes(value as ChatModel)) {
    return value as ChatModel;
  }
  return DEFAULT_CONFIG.chatModel;
}

/**
 * Parse and validate embedding model from string.
 */
function parseEmbeddingModel(value: string | undefined): EmbeddingModel {
  if (value === 'text-embedding-3-small' || value === 'text-embedding-3-large') {
    return value;
  }
  return DEFAULT_CONFIG.embeddingModel;
}

/**
 * Parse and validate embedding dimensions from string.
 */
function parseEmbeddingDimensions(
  value: string | undefined,
  model: EmbeddingModel
): 512 | 1024 | 1536 | 3072 {
  const parsed = parseInt(value || '', 10);
  const validDims = EMBEDDING_DIMENSIONS[model];

  if (!isNaN(parsed) && validDims.includes(parsed)) {
    return parsed as 512 | 1024 | 1536 | 3072;
  }

  // Default to 1536 for backward compatibility
  return 1536;
}

/**
 * Deterministic hash function for user ID.
 * Used for consistent A/B test assignment.
 *
 * @param userId - User ID to hash
 * @returns Non-negative integer hash value
 */
export function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
