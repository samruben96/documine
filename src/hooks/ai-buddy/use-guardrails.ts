/**
 * AI Buddy Guardrails Hook
 * Story 19.1: Guardrail Admin UI
 *
 * Hook for managing guardrail configuration (admin only).
 * Provides CRUD operations for restricted topics and guardrail rules.
 *
 * Key features:
 * - Load agency guardrails from API
 * - Add/update/delete restricted topics
 * - Toggle guardrail rules
 * - Optimistic updates for better UX
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  AgencyGuardrails,
  ExtendedRestrictedTopic,
  CustomGuardrailRule,
} from '@/types/ai-buddy';

export type ResetSection = 'restrictedTopics' | 'customRules' | 'aiDisclosure' | 'all';

export interface UseGuardrailsReturn {
  guardrails: AgencyGuardrails | null;
  isLoading: boolean;
  error: Error | null;
  updateGuardrails: (updates: Partial<AgencyGuardrails>) => Promise<AgencyGuardrails>;
  addTopic: (topic: Omit<ExtendedRestrictedTopic, 'id' | 'createdAt' | 'createdBy' | 'isBuiltIn'>) => Promise<ExtendedRestrictedTopic>;
  updateTopic: (id: string, updates: Partial<ExtendedRestrictedTopic>) => Promise<ExtendedRestrictedTopic>;
  deleteTopic: (id: string) => Promise<void>;
  toggleRule: (ruleId: string, enabled: boolean) => Promise<void>;
  resetToDefaults: (section: ResetSection) => Promise<AgencyGuardrails>;
  refetch: () => Promise<void>;
}

interface GuardrailsApiResponse {
  data?: {
    guardrails: AgencyGuardrails;
  };
  error?: string;
}

interface TopicApiResponse {
  data?: {
    topic: ExtendedRestrictedTopic;
  };
  error?: string;
}

interface DeleteApiResponse {
  data?: {
    deleted: boolean;
  };
  error?: string;
}

interface ResetApiResponse {
  data?: {
    guardrails: AgencyGuardrails;
    resetSection: ResetSection;
  };
  error?: string;
}

/**
 * Hook for managing AI Buddy guardrails (admin only)
 *
 * @example
 * ```tsx
 * const { guardrails, isLoading, addTopic, toggleRule } = useGuardrails();
 *
 * // Add a new restricted topic
 * await addTopic({
 *   trigger: 'medical advice',
 *   description: 'Prevents AI from giving medical advice',
 *   redirectGuidance: 'Suggest consulting a healthcare professional.',
 *   enabled: true,
 * });
 *
 * // Toggle a guardrail rule
 * await toggleRule('builtin-eando', false);
 * ```
 */
export function useGuardrails(): UseGuardrailsReturn {
  const [guardrails, setGuardrails] = useState<AgencyGuardrails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Track if initial fetch has happened
  const hasFetchedRef = useRef(false);

  /**
   * Fetch guardrails from API
   */
  const fetchGuardrails = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-buddy/admin/guardrails');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || `Failed to fetch guardrails: ${response.status}`);
      }

      const result: GuardrailsApiResponse = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setGuardrails(result.data?.guardrails || null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch guardrails');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update guardrails via API with optimistic update
   * AC-19.1.10: Changes persisted immediately
   */
  const updateGuardrails = useCallback(
    async (updates: Partial<AgencyGuardrails>): Promise<AgencyGuardrails> => {
      const previousGuardrails = guardrails;

      // Optimistic update
      setGuardrails((prev) =>
        prev
          ? {
              ...prev,
              ...updates,
            }
          : null
      );

      try {
        const response = await fetch('/api/ai-buddy/admin/guardrails', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          // Revert optimistic update
          setGuardrails(previousGuardrails);
          throw new Error(errorData?.error || `Failed to update guardrails: ${response.status}`);
        }

        const result: GuardrailsApiResponse = await response.json();

        if (result.error) {
          // Revert optimistic update
          setGuardrails(previousGuardrails);
          throw new Error(result.error);
        }

        const updatedGuardrails = result.data?.guardrails;
        if (!updatedGuardrails) {
          throw new Error('No guardrails returned from API');
        }

        setGuardrails(updatedGuardrails);
        return updatedGuardrails;
      } catch (err) {
        // Revert on error
        setGuardrails(previousGuardrails);
        const error = err instanceof Error ? err : new Error('Failed to update guardrails');
        setError(error);
        throw error;
      }
    },
    [guardrails]
  );

  /**
   * Add a new restricted topic
   * AC-19.1.4, AC-19.1.5: Add topic via dialog
   */
  const addTopic = useCallback(
    async (
      topic: Omit<ExtendedRestrictedTopic, 'id' | 'createdAt' | 'createdBy' | 'isBuiltIn'>
    ): Promise<ExtendedRestrictedTopic> => {
      try {
        const response = await fetch('/api/ai-buddy/admin/guardrails/topics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(topic),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData?.error || `Failed to add topic: ${response.status}`);
        }

        const result: TopicApiResponse = await response.json();

        if (result.error) {
          throw new Error(result.error);
        }

        const newTopic = result.data?.topic;
        if (!newTopic) {
          throw new Error('No topic returned from API');
        }

        // Update local state
        setGuardrails((prev) =>
          prev
            ? {
                ...prev,
                restrictedTopics: [...prev.restrictedTopics, newTopic],
              }
            : null
        );

        return newTopic;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to add topic');
        setError(error);
        throw error;
      }
    },
    []
  );

  /**
   * Update an existing restricted topic
   * AC-19.1.6: Edit topic via dialog
   */
  const updateTopic = useCallback(
    async (id: string, updates: Partial<ExtendedRestrictedTopic>): Promise<ExtendedRestrictedTopic> => {
      const previousGuardrails = guardrails;

      // Optimistic update
      setGuardrails((prev) =>
        prev
          ? {
              ...prev,
              restrictedTopics: prev.restrictedTopics.map((t) =>
                t.id === id ? { ...t, ...updates } : t
              ),
            }
          : null
      );

      try {
        const response = await fetch(`/api/ai-buddy/admin/guardrails/topics/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          // Revert optimistic update
          setGuardrails(previousGuardrails);
          throw new Error(errorData?.error || `Failed to update topic: ${response.status}`);
        }

        const result: TopicApiResponse = await response.json();

        if (result.error) {
          // Revert optimistic update
          setGuardrails(previousGuardrails);
          throw new Error(result.error);
        }

        const updatedTopic = result.data?.topic;
        if (!updatedTopic) {
          throw new Error('No topic returned from API');
        }

        return updatedTopic;
      } catch (err) {
        // Revert on error
        setGuardrails(previousGuardrails);
        const error = err instanceof Error ? err : new Error('Failed to update topic');
        setError(error);
        throw error;
      }
    },
    [guardrails]
  );

  /**
   * Delete a restricted topic
   * AC-19.1.7: Delete topic
   */
  const deleteTopic = useCallback(
    async (id: string): Promise<void> => {
      const previousGuardrails = guardrails;

      // Optimistic update
      setGuardrails((prev) =>
        prev
          ? {
              ...prev,
              restrictedTopics: prev.restrictedTopics.filter((t) => t.id !== id),
            }
          : null
      );

      try {
        const response = await fetch(`/api/ai-buddy/admin/guardrails/topics/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          // Revert optimistic update
          setGuardrails(previousGuardrails);
          throw new Error(errorData?.error || `Failed to delete topic: ${response.status}`);
        }

        const result: DeleteApiResponse = await response.json();

        if (result.error) {
          // Revert optimistic update
          setGuardrails(previousGuardrails);
          throw new Error(result.error);
        }
      } catch (err) {
        // Revert on error
        setGuardrails(previousGuardrails);
        const error = err instanceof Error ? err : new Error('Failed to delete topic');
        setError(error);
        throw error;
      }
    },
    [guardrails]
  );

  /**
   * Toggle a guardrail rule on/off
   * AC-19.1.9: Toggle guardrail rule
   */
  const toggleRule = useCallback(
    async (ruleId: string, enabled: boolean): Promise<void> => {
      if (!guardrails) return;

      const updatedRules: CustomGuardrailRule[] = guardrails.customRules.map((rule) =>
        rule.id === ruleId ? { ...rule, enabled } : rule
      );

      await updateGuardrails({ customRules: updatedRules });
    },
    [guardrails, updateGuardrails]
  );

  /**
   * Reset guardrails to defaults
   * Supports resetting specific sections or all guardrails
   */
  const resetToDefaults = useCallback(
    async (section: ResetSection): Promise<AgencyGuardrails> => {
      try {
        const response = await fetch('/api/ai-buddy/admin/guardrails/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData?.error || `Failed to reset guardrails: ${response.status}`);
        }

        const result: ResetApiResponse = await response.json();

        if (result.error) {
          throw new Error(result.error);
        }

        const updatedGuardrails = result.data?.guardrails;
        if (!updatedGuardrails) {
          throw new Error('No guardrails returned from API');
        }

        setGuardrails(updatedGuardrails);
        return updatedGuardrails;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to reset guardrails');
        setError(error);
        throw error;
      }
    },
    []
  );

  /**
   * Refetch guardrails
   */
  const refetch = useCallback(async (): Promise<void> => {
    await fetchGuardrails();
  }, [fetchGuardrails]);

  // Fetch guardrails on mount
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchGuardrails();
    }
  }, [fetchGuardrails]);

  return {
    guardrails,
    isLoading,
    error,
    updateGuardrails,
    addTopic,
    updateTopic,
    deleteTopic,
    toggleRule,
    resetToDefaults,
    refetch,
  };
}
