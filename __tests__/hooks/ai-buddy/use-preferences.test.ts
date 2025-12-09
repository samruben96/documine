/**
 * Tests for usePreferences hook
 * Story 18.1: Onboarding Flow & Guided Start
 *
 * AC-18.1.5: Preferences persistence
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePreferences } from '@/hooks/ai-buddy/use-preferences';
import type { UserPreferences } from '@/types/ai-buddy';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockPreferences: UserPreferences = {
  displayName: 'John',
  role: 'producer',
  linesOfBusiness: ['Personal Auto', 'Homeowners'],
  favoriteCarriers: ['Progressive', 'Travelers'],
  communicationStyle: 'professional',
  onboardingCompleted: true,
  onboardingCompletedAt: '2025-12-08T12:00:00Z',
};

describe('usePreferences', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('initial state', () => {
    it('starts with loading state', () => {
      mockFetch.mockReturnValue(new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => usePreferences());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.preferences).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('fetches preferences on mount', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: mockPreferences } }),
      });

      const { result } = renderHook(() => usePreferences());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/ai-buddy/preferences');
      expect(result.current.preferences).toEqual(mockPreferences);
    });

    it('handles empty preferences', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: {} } }),
      });

      const { result } = renderHook(() => usePreferences());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.preferences).toEqual({});
    });
  });

  describe('error handling', () => {
    it('handles fetch failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Server error' } }),
      });

      const { result } = renderHook(() => usePreferences());

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });

      expect(result.current.error?.message).toBe('Server error');
      expect(result.current.isLoading).toBe(false);
    });

    it('handles API error response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ error: { message: 'Database error' } }),
      });

      const { result } = renderHook(() => usePreferences());

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });

      expect(result.current.error?.message).toBe('Database error');
    });

    it('handles network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => usePreferences());

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });

      expect(result.current.error?.message).toBe('Network error');
    });
  });

  describe('updatePreferences', () => {
    it('updates preferences optimistically', async () => {
      // Initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: mockPreferences } }),
      });

      const { result } = renderHook(() => usePreferences());

      await waitFor(() => {
        expect(result.current.preferences).toEqual(mockPreferences);
      });

      // Update call - prepare mock before acting
      const updatedPreferences = { ...mockPreferences, displayName: 'Jane' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: updatedPreferences } }),
      });

      await act(async () => {
        await result.current.updatePreferences({ displayName: 'Jane' });
      });

      expect(result.current.preferences?.displayName).toBe('Jane');
    });

    it('sends PATCH request with updates', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: mockPreferences } }),
      });

      const { result } = renderHook(() => usePreferences());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: { ...mockPreferences, displayName: 'Jane' } } }),
      });

      const updates = { displayName: 'Jane' };

      await act(async () => {
        await result.current.updatePreferences(updates);
      });

      expect(mockFetch).toHaveBeenLastCalledWith(
        '/api/ai-buddy/preferences',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
      );
    });

    it('reverts on update failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: mockPreferences } }),
      });

      const { result } = renderHook(() => usePreferences());

      await waitFor(() => {
        expect(result.current.preferences).toEqual(mockPreferences);
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Update failed' } }),
      });

      await act(async () => {
        try {
          await result.current.updatePreferences({ displayName: 'Jane' });
        } catch {
          // Expected to throw
        }
      });

      // Should revert to original
      expect(result.current.preferences?.displayName).toBe('John');
    });

    it('returns updated preferences on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: mockPreferences } }),
      });

      const { result } = renderHook(() => usePreferences());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedPreferences = { ...mockPreferences, displayName: 'Jane' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: updatedPreferences } }),
      });

      let returnedPrefs: UserPreferences | undefined;
      await act(async () => {
        returnedPrefs = await result.current.updatePreferences({ displayName: 'Jane' });
      });

      expect(returnedPrefs?.displayName).toBe('Jane');
    });
  });

  describe('resetPreferences', () => {
    it('resets all preferences to defaults', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: mockPreferences } }),
      });

      const { result } = renderHook(() => usePreferences());

      await waitFor(() => {
        expect(result.current.preferences).toEqual(mockPreferences);
      });

      const resetPreferences: UserPreferences = {
        displayName: undefined,
        role: undefined,
        linesOfBusiness: [],
        favoriteCarriers: [],
        agencyName: undefined,
        licensedStates: [],
        communicationStyle: 'professional',
        onboardingCompleted: false,
        onboardingCompletedAt: undefined,
        onboardingSkipped: false,
        onboardingSkippedAt: undefined,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: resetPreferences } }),
      });

      await act(async () => {
        await result.current.resetPreferences();
      });

      expect(result.current.preferences?.onboardingCompleted).toBe(false);
      expect(result.current.preferences?.displayName).toBeUndefined();
    });
  });

  describe('refetch', () => {
    it('refetches preferences from API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: mockPreferences } }),
      });

      const { result } = renderHook(() => usePreferences());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedPreferences = { ...mockPreferences, displayName: 'Updated' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: updatedPreferences } }),
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.preferences?.displayName).toBe('Updated');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('single fetch on mount', () => {
    it('only fetches once on initial mount', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: mockPreferences } }),
      });

      const { result, rerender } = renderHook(() => usePreferences());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Rerender multiple times
      rerender();
      rerender();
      rerender();

      // Should still only have 1 fetch call
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
