/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAgencyBranding } from '@/hooks/use-agency-branding';
import { toast } from 'sonner';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock functions for Supabase client
const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockRemove = vi.fn();
const mockFrom = vi.fn();
const mockStorageFrom = vi.fn();

// Create a stable mock client that can be reused
const mockSupabaseClient = {
  from: mockFrom,
  storage: {
    from: mockStorageFrom,
  },
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

describe('useAgencyBranding', () => {
  const mockAgencyId = 'agency-123';
  const mockBrandingData = {
    name: 'Test Agency',
    logo_url: 'https://example.com/logo.png',
    primary_color: '#2563eb',
    secondary_color: '#1e40af',
    phone: '555-1234',
    branding_email: 'contact@test.com',
    address: '123 Main St',
    website: 'https://test.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up mock chain for database queries
    mockSingle.mockResolvedValue({
      data: mockBrandingData,
      error: null,
    });
    mockEq.mockReturnValue({
      single: mockSingle,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    });

    // Set up mock for storage
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://storage.example.com/logo.png' },
    });
    mockRemove.mockResolvedValue({ error: null });
    mockStorageFrom.mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
      remove: mockRemove,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAgencyBranding(mockAgencyId));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.branding).toBeNull();
  });

  it('should fetch branding data on mount', async () => {
    const { result } = renderHook(() => useAgencyBranding(mockAgencyId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.branding).toEqual({
      name: 'Test Agency',
      logoUrl: 'https://example.com/logo.png',
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      phone: '555-1234',
      email: 'contact@test.com',
      address: '123 Main St',
      website: 'https://test.com',
    });
  });

  it('should handle null agencyId', async () => {
    const { result } = renderHook(() => useAgencyBranding(null));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.branding).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should use default colors when not set', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        ...mockBrandingData,
        primary_color: null,
        secondary_color: null,
      },
      error: null,
    });

    const { result } = renderHook(() => useAgencyBranding(mockAgencyId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.branding?.primaryColor).toBe('#2563eb');
    expect(result.current.branding?.secondaryColor).toBe('#1e40af');
  });

  it('should handle fetch error', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
    });

    const { result } = renderHook(() => useAgencyBranding(mockAgencyId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe('Database error');
  });

  describe('updateBranding', () => {
    it('should update branding data', async () => {
      const { result } = renderHook(() => useAgencyBranding(mockAgencyId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateBranding({
          primaryColor: '#ff0000',
          phone: '555-9999',
        });
      });

      expect(toast.success).toHaveBeenCalledWith('Branding updated successfully');
      expect(result.current.branding?.primaryColor).toBe('#ff0000');
      expect(result.current.branding?.phone).toBe('555-9999');
    });

    it('should throw error when no agencyId', async () => {
      const { result } = renderHook(() => useAgencyBranding(null));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        result.current.updateBranding({ primaryColor: '#ff0000' })
      ).rejects.toThrow('No agency ID provided');
    });
  });

  describe('uploadLogo', () => {
    it('should upload logo file', async () => {
      const { result } = renderHook(() => useAgencyBranding(mockAgencyId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const mockFile = new File(['test'], 'logo.png', { type: 'image/png' });

      await act(async () => {
        const url = await result.current.uploadLogo(mockFile);
        expect(url).toBe('https://storage.example.com/logo.png');
      });

      expect(mockUpload).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Logo uploaded successfully');
    });

    it('should reject invalid file type', async () => {
      const { result } = renderHook(() => useAgencyBranding(mockAgencyId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const mockFile = new File(['test'], 'document.pdf', { type: 'application/pdf' });

      await act(async () => {
        const url = await result.current.uploadLogo(mockFile);
        expect(url).toBeNull();
      });

      expect(toast.error).toHaveBeenCalledWith('Only PNG and JPG files are allowed');
    });

    it('should reject files over 2MB', async () => {
      const { result } = renderHook(() => useAgencyBranding(mockAgencyId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Create a file larger than 2MB
      const largeContent = new Array(3 * 1024 * 1024).fill('x').join('');
      const mockFile = new File([largeContent], 'logo.png', { type: 'image/png' });

      await act(async () => {
        const url = await result.current.uploadLogo(mockFile);
        expect(url).toBeNull();
      });

      expect(toast.error).toHaveBeenCalledWith('Logo must be less than 2MB');
    });
  });

  describe('removeLogo', () => {
    it('should remove logo', async () => {
      const { result } = renderHook(() => useAgencyBranding(mockAgencyId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.removeLogo();
      });

      expect(mockRemove).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Logo removed');
    });

    it('should not remove if no logo exists', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          ...mockBrandingData,
          logo_url: null,
        },
        error: null,
      });

      const { result } = renderHook(() => useAgencyBranding(mockAgencyId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.removeLogo();
      });

      expect(mockRemove).not.toHaveBeenCalled();
    });
  });

  describe('refetch', () => {
    it('should refetch branding data', async () => {
      const { result } = renderHook(() => useAgencyBranding(mockAgencyId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Update mock to return different data
      mockSingle.mockResolvedValueOnce({
        data: {
          ...mockBrandingData,
          name: 'Updated Agency',
        },
        error: null,
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.branding?.name).toBe('Updated Agency');
    });
  });
});
