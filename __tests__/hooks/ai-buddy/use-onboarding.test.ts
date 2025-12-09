/**
 * Tests for useOnboarding hook
 * Story 18.1: Onboarding Flow & Guided Start
 *
 * AC-18.1.1: Check if onboarding should be shown
 * AC-18.1.8: Skip onboarding functionality
 * AC-18.1.9: No re-display after skip
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useOnboarding } from '@/hooks/ai-buddy/use-onboarding';
import type { UserPreferences } from '@/types/ai-buddy';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useOnboarding', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('shouldShowOnboarding', () => {
    it('AC-18.1.1: shows onboarding for new users', async () => {
      const newUserPreferences: UserPreferences = {
        onboardingCompleted: false,
        onboardingSkipped: false,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: newUserPreferences } }),
      });

      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.shouldShowOnboarding).toBe(true);
    });

    it('does not show onboarding when completed', async () => {
      const completedPreferences: UserPreferences = {
        displayName: 'John',
        onboardingCompleted: true,
        onboardingCompletedAt: '2025-12-08T12:00:00Z',
        onboardingSkipped: false,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: completedPreferences } }),
      });

      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.shouldShowOnboarding).toBe(false);
    });

    it('AC-18.1.9: does not show onboarding when skipped', async () => {
      const skippedPreferences: UserPreferences = {
        onboardingCompleted: false,
        onboardingSkipped: true,
        onboardingSkippedAt: '2025-12-08T12:00:00Z',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: skippedPreferences } }),
      });

      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.shouldShowOnboarding).toBe(false);
    });

    it('does not show onboarding while loading', async () => {
      mockFetch.mockReturnValue(new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.shouldShowOnboarding).toBe(false);
    });
  });

  describe('completeOnboarding', () => {
    it('sets onboardingCompleted to true', async () => {
      const newUserPreferences: UserPreferences = {
        onboardingCompleted: false,
        onboardingSkipped: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: newUserPreferences } }),
      });

      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const completedPreferences: UserPreferences = {
        displayName: 'John',
        role: 'producer',
        linesOfBusiness: ['Personal Auto'],
        favoriteCarriers: ['Progressive'],
        onboardingCompleted: true,
        onboardingCompletedAt: expect.any(String),
        onboardingSkipped: false,
        onboardingSkippedAt: undefined,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: completedPreferences } }),
      });

      await act(async () => {
        await result.current.completeOnboarding({
          displayName: 'John',
          role: 'producer',
          linesOfBusiness: ['Personal Auto'],
          favoriteCarriers: ['Progressive'],
        });
      });

      // Check the PATCH was called with correct data
      expect(mockFetch).toHaveBeenLastCalledWith(
        '/api/ai-buddy/preferences',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"onboardingCompleted":true'),
        })
      );
    });

    it('clears onboardingSkipped when completing', async () => {
      const skippedPreferences: UserPreferences = {
        onboardingCompleted: false,
        onboardingSkipped: true,
        onboardingSkippedAt: '2025-12-08T12:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: skippedPreferences } }),
      });

      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              preferences: {
                displayName: 'John',
                onboardingCompleted: true,
                onboardingSkipped: false,
              },
            },
          }),
      });

      await act(async () => {
        await result.current.completeOnboarding({ displayName: 'John' });
      });

      // Check the PATCH includes onboardingSkipped: false
      expect(mockFetch).toHaveBeenLastCalledWith(
        '/api/ai-buddy/preferences',
        expect.objectContaining({
          body: expect.stringContaining('"onboardingSkipped":false'),
        })
      );
    });

    it('includes timestamp when completing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: {} } }),
      });

      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { preferences: { onboardingCompleted: true } },
          }),
      });

      await act(async () => {
        await result.current.completeOnboarding({ displayName: 'John' });
      });

      const lastCall = mockFetch.mock.calls[1];
      const body = JSON.parse(lastCall[1].body);
      expect(body.onboardingCompletedAt).toBeDefined();
      expect(new Date(body.onboardingCompletedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('skipOnboarding', () => {
    it('AC-18.1.8: sets onboardingSkipped to true', async () => {
      const newUserPreferences: UserPreferences = {
        onboardingCompleted: false,
        onboardingSkipped: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: newUserPreferences } }),
      });

      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              preferences: {
                onboardingSkipped: true,
                onboardingSkippedAt: '2025-12-08T12:00:00Z',
              },
            },
          }),
      });

      await act(async () => {
        await result.current.skipOnboarding();
      });

      expect(mockFetch).toHaveBeenLastCalledWith(
        '/api/ai-buddy/preferences',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"onboardingSkipped":true'),
        })
      );
    });

    it('includes timestamp when skipping', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: {} } }),
      });

      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { preferences: { onboardingSkipped: true } },
          }),
      });

      await act(async () => {
        await result.current.skipOnboarding();
      });

      const lastCall = mockFetch.mock.calls[1];
      const body = JSON.parse(lastCall[1].body);
      expect(body.onboardingSkippedAt).toBeDefined();
      expect(new Date(body.onboardingSkippedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('error handling', () => {
    it('exposes error from usePreferences', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Server error' } }),
      });

      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });

      expect(result.current.error?.message).toBe('Server error');
    });

    it('handles completeOnboarding failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: {} } }),
      });

      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Update failed' } }),
      });

      await act(async () => {
        try {
          await result.current.completeOnboarding({ displayName: 'John' });
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('handles skipOnboarding failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: {} } }),
      });

      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Skip failed' } }),
      });

      await act(async () => {
        try {
          await result.current.skipOnboarding();
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('loading state', () => {
    it('is loading initially', () => {
      mockFetch.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.isLoading).toBe(true);
    });

    it('is not loading after preferences loaded', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { preferences: {} } }),
      });

      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
