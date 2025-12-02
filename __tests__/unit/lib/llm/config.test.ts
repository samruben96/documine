/**
 * Unit Tests for LLM Configuration Module
 *
 * Story 5.10: Model Evaluation
 * Tests for OpenRouter integration and model configuration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getModelConfig,
  getModelConfigForUser,
  getModelId,
  getModelIdForUser,
  calculateQueryCost,
  hashUserId,
  DEFAULT_CONFIG,
  OPENROUTER_MODEL_IDS,
  MODEL_PRICING,
  type ModelConfig,
} from '@/lib/llm/config';

describe('LLM Configuration', () => {
  // Store original env values
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear all LLM-related env vars before each test
    delete process.env.LLM_PROVIDER;
    delete process.env.LLM_CHAT_MODEL;
    delete process.env.OPENAI_EMBEDDING_MODEL;
    delete process.env.OPENAI_EMBEDDING_DIMS;
    delete process.env.AB_TEST_ENABLED;
    delete process.env.AB_TEST_MODEL;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
  });

  describe('getModelConfig', () => {
    it('returns default config when no env vars set', () => {
      const config = getModelConfig();

      expect(config).toEqual(DEFAULT_CONFIG);
      expect(config.provider).toBe('openrouter');
      expect(config.chatModel).toBe('claude-sonnet-4.5');
      expect(config.embeddingModel).toBe('text-embedding-3-small');
      expect(config.embeddingDimensions).toBe(1536);
    });

    it('respects LLM_PROVIDER environment variable', () => {
      process.env.LLM_PROVIDER = 'openai';
      const config = getModelConfig();
      expect(config.provider).toBe('openai');
    });

    it('respects LLM_CHAT_MODEL environment variable', () => {
      process.env.LLM_CHAT_MODEL = 'claude-haiku-4.5';
      const config = getModelConfig();
      expect(config.chatModel).toBe('claude-haiku-4.5');
    });

    it('respects OPENAI_EMBEDDING_MODEL environment variable', () => {
      process.env.OPENAI_EMBEDDING_MODEL = 'text-embedding-3-large';
      const config = getModelConfig();
      expect(config.embeddingModel).toBe('text-embedding-3-large');
    });

    it('respects OPENAI_EMBEDDING_DIMS environment variable', () => {
      process.env.OPENAI_EMBEDDING_DIMS = '3072';
      process.env.OPENAI_EMBEDDING_MODEL = 'text-embedding-3-large';
      const config = getModelConfig();
      expect(config.embeddingDimensions).toBe(3072);
    });

    it('falls back to default for invalid provider', () => {
      process.env.LLM_PROVIDER = 'invalid-provider';
      const config = getModelConfig();
      expect(config.provider).toBe(DEFAULT_CONFIG.provider);
    });

    it('falls back to default for invalid chat model', () => {
      process.env.LLM_CHAT_MODEL = 'gpt-3.5-turbo';
      const config = getModelConfig();
      expect(config.chatModel).toBe(DEFAULT_CONFIG.chatModel);
    });

    it('falls back to default for invalid embedding model', () => {
      process.env.OPENAI_EMBEDDING_MODEL = 'invalid-model';
      const config = getModelConfig();
      expect(config.embeddingModel).toBe(DEFAULT_CONFIG.embeddingModel);
    });

    it('falls back to 1536 for invalid embedding dimensions', () => {
      process.env.OPENAI_EMBEDDING_DIMS = '999';
      const config = getModelConfig();
      expect(config.embeddingDimensions).toBe(1536);
    });

    it('supports all valid chat models', () => {
      const validModels = ['claude-sonnet-4.5', 'claude-haiku-4.5', 'gemini-2.5-flash', 'gpt-4o'];

      for (const model of validModels) {
        process.env.LLM_CHAT_MODEL = model;
        const config = getModelConfig();
        expect(config.chatModel).toBe(model);
      }
    });

    it('supports valid embedding dimensions for text-embedding-3-small', () => {
      process.env.OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';

      process.env.OPENAI_EMBEDDING_DIMS = '512';
      expect(getModelConfig().embeddingDimensions).toBe(512);

      process.env.OPENAI_EMBEDDING_DIMS = '1536';
      expect(getModelConfig().embeddingDimensions).toBe(1536);
    });

    it('supports valid embedding dimensions for text-embedding-3-large', () => {
      process.env.OPENAI_EMBEDDING_MODEL = 'text-embedding-3-large';

      process.env.OPENAI_EMBEDDING_DIMS = '256';
      expect(getModelConfig().embeddingDimensions).toBe(256);

      process.env.OPENAI_EMBEDDING_DIMS = '1024';
      expect(getModelConfig().embeddingDimensions).toBe(1024);

      process.env.OPENAI_EMBEDDING_DIMS = '3072';
      expect(getModelConfig().embeddingDimensions).toBe(3072);
    });
  });

  describe('getModelConfigForUser (A/B Testing)', () => {
    it('returns default config when A/B testing is disabled', () => {
      process.env.AB_TEST_ENABLED = 'false';
      process.env.AB_TEST_MODEL = 'claude-haiku-4.5';

      const config = getModelConfigForUser('user-123');
      expect(config.chatModel).toBe(DEFAULT_CONFIG.chatModel);
    });

    it('returns default config when AB_TEST_MODEL is not set', () => {
      process.env.AB_TEST_ENABLED = 'true';
      delete process.env.AB_TEST_MODEL;

      const config = getModelConfigForUser('user-123');
      expect(config.chatModel).toBe(DEFAULT_CONFIG.chatModel);
    });

    it('assigns users consistently (deterministic)', () => {
      process.env.AB_TEST_ENABLED = 'true';
      process.env.AB_TEST_MODEL = 'claude-haiku-4.5';

      // Same user should always get the same model
      const config1 = getModelConfigForUser('user-123');
      const config2 = getModelConfigForUser('user-123');
      const config3 = getModelConfigForUser('user-123');

      expect(config1.chatModel).toBe(config2.chatModel);
      expect(config2.chatModel).toBe(config3.chatModel);
    });

    it('assigns different users to different groups (probabilistic)', () => {
      process.env.AB_TEST_ENABLED = 'true';
      process.env.AB_TEST_MODEL = 'claude-haiku-4.5';

      // Generate configs for many users and check distribution
      const results: Record<string, number> = { control: 0, test: 0 };
      const numUsers = 100;

      for (let i = 0; i < numUsers; i++) {
        const config = getModelConfigForUser(`user-${i}`);
        if (config.chatModel === DEFAULT_CONFIG.chatModel) {
          results.control++;
        } else {
          results.test++;
        }
      }

      // Both groups should have some users (not all in one group)
      expect(results.control).toBeGreaterThan(0);
      expect(results.test).toBeGreaterThan(0);
    });
  });

  describe('hashUserId', () => {
    it('returns consistent hash for same input', () => {
      const hash1 = hashUserId('user-123');
      const hash2 = hashUserId('user-123');
      expect(hash1).toBe(hash2);
    });

    it('returns different hash for different inputs', () => {
      const hash1 = hashUserId('user-123');
      const hash2 = hashUserId('user-456');
      expect(hash1).not.toBe(hash2);
    });

    it('returns non-negative integers', () => {
      const testIds = ['user-1', 'test@example.com', 'uuid-abc-123', ''];
      for (const id of testIds) {
        const hash = hashUserId(id);
        expect(hash).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(hash)).toBe(true);
      }
    });
  });

  describe('getModelId', () => {
    it('returns OpenRouter format for openrouter provider', () => {
      process.env.LLM_PROVIDER = 'openrouter';
      process.env.LLM_CHAT_MODEL = 'claude-sonnet-4.5';

      const modelId = getModelId();
      expect(modelId).toBe(OPENROUTER_MODEL_IDS['claude-sonnet-4.5']);
      expect(modelId).toContain('anthropic/');
    });

    it('returns model name directly for openai provider with gpt-4o', () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.LLM_CHAT_MODEL = 'gpt-4o';

      const modelId = getModelId();
      expect(modelId).toBe('gpt-4o');
    });

    it('throws error for non-gpt-4o models with openai provider', () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.LLM_CHAT_MODEL = 'claude-sonnet-4.5';

      expect(() => getModelId()).toThrow('only available via OpenRouter');
    });

    it('respects override parameter', () => {
      process.env.LLM_PROVIDER = 'openrouter';
      process.env.LLM_CHAT_MODEL = 'claude-sonnet-4.5';

      const modelId = getModelId('claude-haiku-4.5');
      expect(modelId).toBe(OPENROUTER_MODEL_IDS['claude-haiku-4.5']);
    });
  });

  describe('getModelIdForUser', () => {
    it('returns correct model ID for A/B test assignment', () => {
      process.env.LLM_PROVIDER = 'openrouter';
      process.env.AB_TEST_ENABLED = 'true';
      process.env.AB_TEST_MODEL = 'claude-haiku-4.5';

      // Find a user in test group and verify they get test model ID
      for (let i = 0; i < 100; i++) {
        const userId = `user-${i}`;
        const config = getModelConfigForUser(userId);
        const modelId = getModelIdForUser(userId);

        if (config.chatModel === 'claude-haiku-4.5') {
          expect(modelId).toBe(OPENROUTER_MODEL_IDS['claude-haiku-4.5']);
          return; // Test passed - found a test group user
        }
      }
    });
  });

  describe('calculateQueryCost', () => {
    it('calculates cost correctly for claude-sonnet-4.5', () => {
      const cost = calculateQueryCost(1000000, 500000, 'claude-sonnet-4.5');
      // Input: 1M tokens * $3/1M = $3
      // Output: 0.5M tokens * $15/1M = $7.5
      // Total: $10.5
      expect(cost).toBeCloseTo(10.5);
    });

    it('calculates cost correctly for gemini-2.5-flash', () => {
      const cost = calculateQueryCost(1000000, 1000000, 'gemini-2.5-flash');
      // Input: 1M tokens * $0.15/1M = $0.15
      // Output: 1M tokens * $0.6/1M = $0.6
      // Total: $0.75
      expect(cost).toBeCloseTo(0.75);
    });

    it('uses configured model when model not specified', () => {
      process.env.LLM_CHAT_MODEL = 'gpt-4o';
      const cost = calculateQueryCost(1000000, 1000000);
      // Uses gpt-4o pricing: $2.5 + $10 = $12.5
      expect(cost).toBeCloseTo(12.5);
    });

    it('returns 0 for 0 tokens', () => {
      const cost = calculateQueryCost(0, 0, 'claude-sonnet-4.5');
      expect(cost).toBe(0);
    });

    it('handles typical query sizes', () => {
      // Typical RAG query: ~2000 input tokens, ~500 output tokens
      const cost = calculateQueryCost(2000, 500, 'claude-sonnet-4.5');
      // Input: 0.002M * $3 = $0.006
      // Output: 0.0005M * $15 = $0.0075
      // Total: ~$0.0135
      expect(cost).toBeCloseTo(0.0135, 4);
    });
  });

  describe('Constants', () => {
    it('OPENROUTER_MODEL_IDS contains all chat models', () => {
      expect(OPENROUTER_MODEL_IDS['claude-sonnet-4.5']).toBeDefined();
      expect(OPENROUTER_MODEL_IDS['claude-haiku-4.5']).toBeDefined();
      expect(OPENROUTER_MODEL_IDS['gemini-2.5-flash']).toBeDefined();
      expect(OPENROUTER_MODEL_IDS['gpt-4o']).toBeDefined();
    });

    it('MODEL_PRICING contains all chat models', () => {
      expect(MODEL_PRICING['claude-sonnet-4.5']).toBeDefined();
      expect(MODEL_PRICING['claude-haiku-4.5']).toBeDefined();
      expect(MODEL_PRICING['gemini-2.5-flash']).toBeDefined();
      expect(MODEL_PRICING['gpt-4o']).toBeDefined();
    });

    it('DEFAULT_CONFIG has valid values', () => {
      expect(DEFAULT_CONFIG.provider).toBe('openrouter');
      expect(DEFAULT_CONFIG.chatModel).toBe('claude-sonnet-4.5');
      expect(DEFAULT_CONFIG.embeddingModel).toBe('text-embedding-3-small');
      expect(DEFAULT_CONFIG.embeddingDimensions).toBe(1536);
    });
  });
});
