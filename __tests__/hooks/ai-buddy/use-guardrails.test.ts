/**
 * Unit Tests - useGuardrails Hook
 * Story 19.1: Guardrail Admin UI
 *
 * Tests for guardrails management hook
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useGuardrails } from '@/hooks/ai-buddy/use-guardrails';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useGuardrails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial fetch', () => {
    it('loads guardrails on mount', async () => {
      const mockGuardrails = {
        agencyId: 'agency-123',
        restrictedTopics: [],
        customRules: [],
        eandoDisclaimer: true,
        aiDisclosureMessage: 'Test message',
        aiDisclosureEnabled: true,
        restrictedTopicsEnabled: true,
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { guardrails: mockGuardrails } }),
      });

      const { result } = renderHook(() => useGuardrails());

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.guardrails).toBe(null);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.guardrails).toEqual(mockGuardrails);
      expect(result.current.error).toBe(null);
    });

    it('handles fetch error gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const { result } = renderHook(() => useGuardrails());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.guardrails).toBe(null);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toContain('Server error');
    });
  });

  describe('addTopic', () => {
    it('adds a new topic', async () => {
      const mockGuardrails = {
        agencyId: 'agency-123',
        restrictedTopics: [],
        customRules: [],
        eandoDisclaimer: true,
        aiDisclosureMessage: 'Test',
        aiDisclosureEnabled: true,
        restrictedTopicsEnabled: true,
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const newTopic = {
        id: 'new-topic-id',
        trigger: 'test trigger',
        description: 'Test description',
        redirectGuidance: 'Test redirect',
        enabled: true,
        isBuiltIn: false,
        createdAt: '2024-01-02T00:00:00Z',
        createdBy: 'user-123',
      };

      // Initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { guardrails: mockGuardrails } }),
      });

      const { result } = renderHook(() => useGuardrails());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add topic
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { topic: newTopic } }),
      });

      await act(async () => {
        await result.current.addTopic({
          trigger: 'test trigger',
          description: 'Test description',
          redirectGuidance: 'Test redirect',
          enabled: true,
        });
      });

      expect(result.current.guardrails?.restrictedTopics).toHaveLength(1);
      expect(result.current.guardrails?.restrictedTopics[0].trigger).toBe('test trigger');
    });
  });

  describe('updateGuardrails', () => {
    it('updates guardrails with optimistic update', async () => {
      const mockGuardrails = {
        agencyId: 'agency-123',
        restrictedTopics: [],
        customRules: [],
        eandoDisclaimer: true,
        aiDisclosureMessage: 'Test',
        aiDisclosureEnabled: true,
        restrictedTopicsEnabled: true,
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { guardrails: mockGuardrails } }),
      });

      const { result } = renderHook(() => useGuardrails());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Update
      const updatedGuardrails = { ...mockGuardrails, eandoDisclaimer: false };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { guardrails: updatedGuardrails } }),
      });

      await act(async () => {
        await result.current.updateGuardrails({ eandoDisclaimer: false });
      });

      expect(result.current.guardrails?.eandoDisclaimer).toBe(false);
    });

    it('reverts on error', async () => {
      const mockGuardrails = {
        agencyId: 'agency-123',
        restrictedTopics: [],
        customRules: [],
        eandoDisclaimer: true,
        aiDisclosureMessage: 'Test',
        aiDisclosureEnabled: true,
        restrictedTopicsEnabled: true,
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { guardrails: mockGuardrails } }),
      });

      const { result } = renderHook(() => useGuardrails());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Update fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Update failed' }),
      });

      await act(async () => {
        try {
          await result.current.updateGuardrails({ eandoDisclaimer: false });
        } catch {
          // Expected error
        }
      });

      // Should revert to original value
      expect(result.current.guardrails?.eandoDisclaimer).toBe(true);
    });
  });

  describe('resetToDefaults', () => {
    it('resets to defaults', async () => {
      const mockGuardrails = {
        agencyId: 'agency-123',
        restrictedTopics: [],
        customRules: [],
        eandoDisclaimer: false,
        aiDisclosureMessage: 'Custom message',
        aiDisclosureEnabled: false,
        restrictedTopicsEnabled: false,
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { guardrails: mockGuardrails } }),
      });

      const { result } = renderHook(() => useGuardrails());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Reset
      const resetGuardrails = {
        ...mockGuardrails,
        eandoDisclaimer: true,
        restrictedTopicsEnabled: true,
        restrictedTopics: [
          { id: 'default-1', trigger: 'legal advice', enabled: true },
        ],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: { guardrails: resetGuardrails, resetSection: 'all' }
        }),
      });

      await act(async () => {
        await result.current.resetToDefaults('all');
      });

      expect(result.current.guardrails?.eandoDisclaimer).toBe(true);
      expect(result.current.guardrails?.restrictedTopicsEnabled).toBe(true);
    });
  });

  describe('deleteTopic', () => {
    it('deletes a topic with optimistic update', async () => {
      const mockGuardrails = {
        agencyId: 'agency-123',
        restrictedTopics: [
          {
            id: 'topic-1',
            trigger: 'test',
            redirectGuidance: 'redirect',
            enabled: true,
            isBuiltIn: false,
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
        customRules: [],
        eandoDisclaimer: true,
        aiDisclosureMessage: 'Test',
        aiDisclosureEnabled: true,
        restrictedTopicsEnabled: true,
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { guardrails: mockGuardrails } }),
      });

      const { result } = renderHook(() => useGuardrails());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.guardrails?.restrictedTopics).toHaveLength(1);

      // Delete topic
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { deleted: true } }),
      });

      await act(async () => {
        await result.current.deleteTopic('topic-1');
      });

      expect(result.current.guardrails?.restrictedTopics).toHaveLength(0);
    });
  });
});
