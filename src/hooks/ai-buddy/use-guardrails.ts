/**
 * AI Buddy Guardrails Hook
 * Story 14.5: Component Scaffolding
 *
 * Hook for managing guardrail configuration (admin only).
 * Stub implementation - full functionality in Epic 19.
 */

import { useState, useCallback } from 'react';
import type { GuardrailConfig } from '@/types/ai-buddy';

export interface UseGuardrailsReturn {
  config: GuardrailConfig | null;
  isLoading: boolean;
  error: Error | null;
  updateConfig: (updates: Partial<GuardrailConfig>) => Promise<void>;
  addRestrictedTopic: (topic: string) => Promise<void>;
  removeRestrictedTopic: (topic: string) => Promise<void>;
  toggleRule: (ruleId: string, enabled: boolean) => Promise<void>;
}

export function useGuardrails(): UseGuardrailsReturn {
  const [config, setConfig] = useState<GuardrailConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateConfig = useCallback(async (_updates: Partial<GuardrailConfig>) => {
    throw new Error('Not implemented - Guardrails configuration deferred to Epic 19');
  }, []);

  const addRestrictedTopic = useCallback(async (_topic: string) => {
    throw new Error('Not implemented - Guardrails configuration deferred to Epic 19');
  }, []);

  const removeRestrictedTopic = useCallback(async (_topic: string) => {
    throw new Error('Not implemented - Guardrails configuration deferred to Epic 19');
  }, []);

  const toggleRule = useCallback(async (_ruleId: string, _enabled: boolean) => {
    throw new Error('Not implemented - Guardrails configuration deferred to Epic 19');
  }, []);

  return {
    config,
    isLoading,
    error,
    updateConfig,
    addRestrictedTopic,
    removeRestrictedTopic,
    toggleRule,
  };
}
