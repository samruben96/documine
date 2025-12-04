/**
 * Tests for middleware route protection and session handling
 * Tests AC-2.4.2 through AC-2.4.5
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { middleware } from '@/middleware';
import { NextRequest, NextResponse } from 'next/server';

// Mock @supabase/ssr
const mockGetUser = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

// Helper to create mock request
function createMockRequest(pathname: string): NextRequest {
  const url = new URL(pathname, 'http://localhost:3000');
  return new NextRequest(url, {
    headers: new Headers(),
  });
}

describe('middleware route protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-2.4.3: Protected routes redirect when unauthenticated', () => {
    beforeEach(() => {
      // No user (unauthenticated)
      mockGetUser.mockResolvedValue({ data: { user: null } });
    });

    it('redirects /documents to /login with redirect param', async () => {
      const request = createMockRequest('/documents');
      const response = await middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/login');
      expect(location).toContain('redirect=%2Fdocuments');
    });

    it('redirects /compare to /login with redirect param', async () => {
      const request = createMockRequest('/compare');
      const response = await middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/login');
      expect(location).toContain('redirect=%2Fcompare');
    });

    it('redirects /settings to /login with redirect param', async () => {
      const request = createMockRequest('/settings');
      const response = await middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/login');
      expect(location).toContain('redirect=%2Fsettings');
    });

    it('redirects nested protected routes', async () => {
      const request = createMockRequest('/documents/upload');
      const response = await middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/login');
    });
  });

  describe('AC-2.4.4: Public routes accessible without auth', () => {
    beforeEach(() => {
      // No user (unauthenticated)
      mockGetUser.mockResolvedValue({ data: { user: null } });
    });

    it('allows access to / (landing page)', async () => {
      const request = createMockRequest('/');
      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('allows access to /login', async () => {
      const request = createMockRequest('/login');
      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('allows access to /signup', async () => {
      const request = createMockRequest('/signup');
      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('allows access to /reset-password', async () => {
      const request = createMockRequest('/reset-password');
      const response = await middleware(request);

      expect(response.status).toBe(200);
    });
  });

  describe('AC-2.4.5: Authenticated users redirected from auth pages', () => {
    beforeEach(() => {
      // Authenticated user
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
    });

    it('redirects authenticated user from /login to /dashboard', async () => {
      const request = createMockRequest('/login');
      const response = await middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/dashboard');
    });

    it('redirects authenticated user from /signup to /dashboard', async () => {
      const request = createMockRequest('/signup');
      const response = await middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/dashboard');
    });

    it('redirects authenticated user from /reset-password to /dashboard', async () => {
      const request = createMockRequest('/reset-password');
      const response = await middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/dashboard');
    });
  });

  describe('AC-2.4.2: Session refresh via getUser', () => {
    it('calls supabase.auth.getUser() for each request', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const request = createMockRequest('/');
      await middleware(request);

      expect(mockGetUser).toHaveBeenCalled();
    });
  });

  describe('Authenticated users can access protected routes', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
    });

    it('allows authenticated user to access /documents', async () => {
      const request = createMockRequest('/documents');
      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('allows authenticated user to access /compare', async () => {
      const request = createMockRequest('/compare');
      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('allows authenticated user to access /settings', async () => {
      const request = createMockRequest('/settings');
      const response = await middleware(request);

      expect(response.status).toBe(200);
    });
  });
});
