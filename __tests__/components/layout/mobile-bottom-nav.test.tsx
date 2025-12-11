/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MobileBottomNav } from '@/components/layout/sidebar';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
    'aria-current': ariaCurrent,
    'aria-label': ariaLabel,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    'aria-current'?: string;
    'aria-label'?: string;
  }) => (
    <a
      href={href}
      className={className}
      aria-current={ariaCurrent}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  ),
}));

// Mock next/navigation
const mockPathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

describe('MobileBottomNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/dashboard');
  });

  describe('AC: DR.9.3 - All nav items present', () => {
    it('renders Home/Dashboard nav item with correct href', () => {
      render(<MobileBottomNav />);
      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toHaveAttribute('href', '/dashboard');
    });

    it('renders Docs/Documents nav item with correct href', () => {
      render(<MobileBottomNav />);
      const docsLink = screen.getByRole('link', { name: 'Docs' });
      expect(docsLink).toHaveAttribute('href', '/documents');
    });

    it('renders Compare nav item with correct href', () => {
      render(<MobileBottomNav />);
      const compareLink = screen.getByRole('link', { name: 'Compare' });
      expect(compareLink).toHaveAttribute('href', '/compare');
    });

    it('renders Quoting nav item with correct href', () => {
      render(<MobileBottomNav />);
      const quotingLink = screen.getByRole('link', { name: 'Quoting' });
      expect(quotingLink).toHaveAttribute('href', '/quoting');
    });

    it('renders AI Buddy nav item with correct href', () => {
      render(<MobileBottomNav />);
      const aiBuddyLink = screen.getByRole('link', { name: 'AI Buddy' });
      expect(aiBuddyLink).toHaveAttribute('href', '/ai-buddy');
    });

    it('renders Reports nav item with correct href', () => {
      render(<MobileBottomNav />);
      const reportsLink = screen.getByRole('link', { name: 'Reports' });
      expect(reportsLink).toHaveAttribute('href', '/reporting');
    });

    it('renders Settings nav item with correct href', () => {
      render(<MobileBottomNav />);
      const settingsLink = screen.getByRole('link', { name: 'Settings' });
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('renders exactly 7 navigation links', () => {
      render(<MobileBottomNav />);
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(7);
    });
  });

  describe('AC: DR.9.4 - Consistent Lucide icons', () => {
    it('each nav item displays an icon with h-5 w-5 classes', () => {
      render(<MobileBottomNav />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        const icon = link.querySelector('svg');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveClass('h-5', 'w-5');
      });
    });

    it('nav items use Lucide icons (SVG elements)', () => {
      render(<MobileBottomNav />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        const svg = link.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe('AC: DR.9.5 - Active state styling', () => {
    it('active nav item has text-primary class when on /dashboard', () => {
      mockPathname.mockReturnValue('/dashboard');
      render(<MobileBottomNav />);
      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toHaveClass('text-primary');
    });

    it('active nav item has dark:text-blue-400 class', () => {
      mockPathname.mockReturnValue('/dashboard');
      render(<MobileBottomNav />);
      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toHaveClass('dark:text-blue-400');
    });

    it('inactive nav item has text-slate-600 class', () => {
      mockPathname.mockReturnValue('/dashboard');
      render(<MobileBottomNav />);
      const docsLink = screen.getByRole('link', { name: 'Docs' });
      expect(docsLink).toHaveClass('text-slate-600');
    });

    it('inactive nav item has hover:text-slate-800 class', () => {
      mockPathname.mockReturnValue('/dashboard');
      render(<MobileBottomNav />);
      const docsLink = screen.getByRole('link', { name: 'Docs' });
      expect(docsLink).toHaveClass('hover:text-slate-800');
    });

    it('inactive nav item has dark:text-slate-400 class', () => {
      mockPathname.mockReturnValue('/dashboard');
      render(<MobileBottomNav />);
      const docsLink = screen.getByRole('link', { name: 'Docs' });
      expect(docsLink).toHaveClass('dark:text-slate-400');
    });

    it('inactive nav item has dark:hover:text-slate-200 class', () => {
      mockPathname.mockReturnValue('/dashboard');
      render(<MobileBottomNav />);
      const docsLink = screen.getByRole('link', { name: 'Docs' });
      expect(docsLink).toHaveClass('dark:hover:text-slate-200');
    });

    it('sets aria-current="page" on active nav item', () => {
      mockPathname.mockReturnValue('/dashboard');
      render(<MobileBottomNav />);
      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toHaveAttribute('aria-current', 'page');
    });

    it('does not set aria-current on inactive nav item', () => {
      mockPathname.mockReturnValue('/dashboard');
      render(<MobileBottomNav />);
      const docsLink = screen.getByRole('link', { name: 'Docs' });
      expect(docsLink).not.toHaveAttribute('aria-current');
    });
  });

  describe('Active route detection', () => {
    it('dashboard route is active only for exact /dashboard path', () => {
      mockPathname.mockReturnValue('/dashboard');
      render(<MobileBottomNav />);
      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toHaveClass('text-primary');
    });

    it('documents route is active for /documents and subpaths', () => {
      mockPathname.mockReturnValue('/documents/123');
      render(<MobileBottomNav />);
      const docsLink = screen.getByRole('link', { name: 'Docs' });
      expect(docsLink).toHaveClass('text-primary');
    });

    it('compare route is active for /compare and subpaths', () => {
      mockPathname.mockReturnValue('/compare/456');
      render(<MobileBottomNav />);
      const compareLink = screen.getByRole('link', { name: 'Compare' });
      expect(compareLink).toHaveClass('text-primary');
    });

    it('quoting route is active for /quoting and subpaths', () => {
      mockPathname.mockReturnValue('/quoting/quote/123');
      render(<MobileBottomNav />);
      const quotingLink = screen.getByRole('link', { name: 'Quoting' });
      expect(quotingLink).toHaveClass('text-primary');
    });

    it('ai-buddy route is active for /ai-buddy and subpaths', () => {
      mockPathname.mockReturnValue('/ai-buddy/project/789');
      render(<MobileBottomNav />);
      const aiBuddyLink = screen.getByRole('link', { name: 'AI Buddy' });
      expect(aiBuddyLink).toHaveClass('text-primary');
    });

    it('reporting route is active for /reporting and subpaths', () => {
      mockPathname.mockReturnValue('/reporting/analysis');
      render(<MobileBottomNav />);
      const reportsLink = screen.getByRole('link', { name: 'Reports' });
      expect(reportsLink).toHaveClass('text-primary');
    });

    it('settings route is active for /settings and subpaths', () => {
      mockPathname.mockReturnValue('/settings/branding');
      render(<MobileBottomNav />);
      const settingsLink = screen.getByRole('link', { name: 'Settings' });
      expect(settingsLink).toHaveClass('text-primary');
    });
  });

  describe('Accessibility', () => {
    it('nav element has aria-label for screen readers', () => {
      render(<MobileBottomNav />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Mobile navigation');
    });

    it('each nav item has aria-label', () => {
      render(<MobileBottomNav />);
      const links = screen.getAllByRole('link');
      const expectedLabels = ['Home', 'Docs', 'Compare', 'Quoting', 'AI Buddy', 'Reports', 'Settings'];
      links.forEach((link, index) => {
        expect(link).toHaveAttribute('aria-label', expectedLabels[index]);
      });
    });
  });

  describe('Mobile-only visibility', () => {
    it('nav has sm:hidden class for mobile-only display', () => {
      render(<MobileBottomNav />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('sm:hidden');
    });
  });

  describe('Layout and positioning', () => {
    it('nav is fixed at bottom of viewport', () => {
      render(<MobileBottomNav />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0');
    });

    it('nav has proper z-index', () => {
      render(<MobileBottomNav />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('z-40');
    });

    it('nav items are evenly distributed', () => {
      render(<MobileBottomNav />);
      const nav = screen.getByRole('navigation');
      const container = nav.querySelector('div');
      expect(container).toHaveClass('flex', 'items-center', 'justify-around');
    });

    it('nav has consistent height', () => {
      render(<MobileBottomNav />);
      const nav = screen.getByRole('navigation');
      const container = nav.querySelector('div');
      expect(container).toHaveClass('h-14');
    });
  });

  describe('Styling', () => {
    it('nav has border-t border-slate-200', () => {
      render(<MobileBottomNav />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('border-t', 'border-slate-200');
    });

    it('nav has bg-white background', () => {
      render(<MobileBottomNav />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('bg-white');
    });

    it('nav has dark mode styles', () => {
      render(<MobileBottomNav />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('dark:bg-slate-900', 'dark:border-slate-800');
    });

    it('nav items have flex-col layout', () => {
      render(<MobileBottomNav />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
      });
    });

    it('nav item labels have small text size', () => {
      render(<MobileBottomNav />);
      const homeLink = screen.getByRole('link', { name: 'Home' });
      const label = homeLink.querySelector('span');
      expect(label).toHaveClass('text-[10px]');
    });
  });
});
