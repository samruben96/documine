/**
 * useDisclosure Hook Tests
 * Story 19.4: AI Disclosure Message
 *
 * Tests for the useDisclosure hook covering:
 * - AC-19.4.4: Fetch disclosure message from API
 * - AC-19.4.6: Handle when no disclosure is configured
 *
 * @vitest-environment happy-dom
 */

import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useDisclosure } from '@/hooks/ai-buddy/use-disclosure';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useDisclosure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('successful fetch', () => {
    it('fetches disclosure message successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            aiDisclosureMessage: 'You are chatting with an AI.',
            aiDisclosureEnabled: true,
          },
        }),
      });

      const { result } = renderHook(() => useDisclosure());

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.message).toBe('You are chatting with an AI.');
      expect(result.current.enabled).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('handles disabled disclosure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            aiDisclosureMessage: 'Hidden message',
            aiDisclosureEnabled: false,
          },
        }),
      });

      const { result } = renderHook(() => useDisclosure());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.message).toBe('Hidden message');
      expect(result.current.enabled).toBe(false);
    });

    it('handles null disclosure message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            aiDisclosureMessage: null,
            aiDisclosureEnabled: true,
          },
        }),
      });

      const { result } = renderHook(() => useDisclosure());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.message).toBeNull();
      expect(result.current.enabled).toBe(true);
    });
  });

  describe('error handling', () => {
    it('handles 401 unauthorized by returning no disclosure', async () => {
      // First call fails with 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      // Second call to public endpoint also fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useDisclosure());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should return empty state for unauthenticated
      expect(result.current.message).toBeNull();
      expect(result.current.enabled).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('handles 403 forbidden by trying public endpoint', async () => {
      // First call fails with 403 (not admin)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      // Second call to public endpoint succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            aiDisclosureMessage: 'Public disclosure',
            aiDisclosureEnabled: true,
          },
        }),
      });

      const { result } = renderHook(() => useDisclosure());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.message).toBe('Public disclosure');
      expect(result.current.enabled).toBe(true);
    });

    it('handles server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      const { result } = renderHook(() => useDisclosure());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Server error');
    });

    it('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useDisclosure());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
    });
  });

  describe('refetch', () => {
    it('refetches disclosure when refetch is called', async () => {
      // Initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            aiDisclosureMessage: 'Initial message',
            aiDisclosureEnabled: true,
          },
        }),
      });

      const { result } = renderHook(() => useDisclosure());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.message).toBe('Initial message');

      // Updated fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            aiDisclosureMessage: 'Updated message',
            aiDisclosureEnabled: true,
          },
        }),
      });

      // Call refetch
      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.message).toBe('Updated message');
      });
    });
  });

  describe('API endpoint', () => {
    it('calls the correct API endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            aiDisclosureMessage: 'Test',
            aiDisclosureEnabled: true,
          },
        }),
      });

      renderHook(() => useDisclosure());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/ai-buddy/disclosure');
      });
    });
  });
});
