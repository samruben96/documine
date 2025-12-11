/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header, getUserInitials } from '@/components/layout/header';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock logout action
vi.mock('@/app/(auth)/login/actions', () => ({
  logout: vi.fn(),
}));

// Mock SidebarToggle
vi.mock('@/components/layout/sidebar', () => ({
  SidebarToggle: () => (
    <button data-testid="sidebar-toggle" className="lg:hidden">
      Toggle
    </button>
  ),
}));

// Mock Supabase client
const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

describe('getUserInitials', () => {
  it('returns "?" for empty email', () => {
    expect(getUserInitials('')).toBe('?');
  });

  it('derives initials from email with dot separator (AC: DR.1.5)', () => {
    expect(getUserInitials('john.doe@example.com')).toBe('JD');
  });

  it('derives initials from email with underscore separator', () => {
    expect(getUserInitials('john_doe@example.com')).toBe('JD');
  });

  it('derives initials from email with dash separator', () => {
    expect(getUserInitials('john-doe@example.com')).toBe('JD');
  });

  it('uses first two chars when no separator (AC: DR.1.5)', () => {
    expect(getUserInitials('johndoe@example.com')).toBe('JO');
  });

  it('handles single character parts', () => {
    expect(getUserInitials('j.d@example.com')).toBe('JD');
  });
});

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { email: 'test.user@example.com' } },
    });
  });

  describe('AC: DR.1.1, DR.1.2, DR.1.3 - Logo with link', () => {
    it('renders logo container with correct classes (w-8 h-8 bg-primary rounded-lg)', async () => {
      render(<Header />);

      await waitFor(() => {
        const logoContainer = screen.getByText('dM').parentElement;
        expect(logoContainer).toHaveClass('w-8', 'h-8', 'bg-primary', 'rounded-lg');
      });
    });

    it('renders "dM" text inside logo', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByText('dM')).toBeInTheDocument();
      });
    });

    it('renders "docuMINE" text next to logo with correct styling', async () => {
      render(<Header />);

      await waitFor(() => {
        const logoText = screen.getByText('docuMINE');
        expect(logoText).toHaveClass('font-semibold', 'text-lg');
      });
    });

    it('logo links to /dashboard', async () => {
      render(<Header />);

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /docuMINE/i });
        expect(link).toHaveAttribute('href', '/dashboard');
      });
    });
  });

  describe('AC: DR.1.4 - Notification bell', () => {
    it('renders bell button with correct aria-label', async () => {
      render(<Header />);

      await waitFor(() => {
        const bellButton = screen.getByRole('button', {
          name: /notifications \(coming soon\)/i,
        });
        expect(bellButton).toBeInTheDocument();
      });
    });
  });

  describe('AC: DR.1.5 - User avatar with initials', () => {
    it('displays user initials derived from email', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByText('TU')).toBeInTheDocument();
      });
    });

    it('displays "?" when user email is not available', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      render(<Header />);

      await waitFor(() => {
        expect(screen.getByText('?')).toBeInTheDocument();
      });
    });
  });

  describe('AC: DR.1.6 - Avatar dropdown with logout', () => {
    it('opens dropdown when avatar is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByText('TU')).toBeInTheDocument();
      });

      const avatarButton = screen.getByRole('button', { name: /user menu/i });
      await user.click(avatarButton);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /logout/i })).toBeInTheDocument();
      });
    });

    it('has Logout option in dropdown', async () => {
      const user = userEvent.setup();
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByText('TU')).toBeInTheDocument();
      });

      const avatarButton = screen.getByRole('button', { name: /user menu/i });
      await user.click(avatarButton);

      await waitFor(() => {
        const logoutItem = screen.getByRole('menuitem', { name: /logout/i });
        expect(logoutItem).toBeInTheDocument();
      });
    });
  });

  describe('AC: DR.1.7 - No navigation links', () => {
    it('does not render horizontal navigation links', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
      });

      // Ensure none of the old nav items are present
      expect(screen.queryByText('Documents')).not.toBeInTheDocument();
      expect(screen.queryByText('Compare')).not.toBeInTheDocument();
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });
  });

  describe('AC: DR.1.8, DR.1.9 - Header styling', () => {
    it('header has h-14 height class', async () => {
      render(<Header />);

      await waitFor(() => {
        const header = screen.getByRole('banner');
        expect(header).toHaveClass('h-14');
      });
    });

    it('header has white background and border-slate-200', async () => {
      render(<Header />);

      await waitFor(() => {
        const header = screen.getByRole('banner');
        expect(header).toHaveClass('bg-white', 'border-b', 'border-slate-200');
      });
    });
  });

  describe('AC: DR.1.10 - Mobile sidebar toggle', () => {
    it('renders SidebarToggle with lg:hidden class', async () => {
      render(<Header />);

      await waitFor(() => {
        const toggle = screen.getByTestId('sidebar-toggle');
        expect(toggle).toHaveClass('lg:hidden');
      });
    });
  });
});
