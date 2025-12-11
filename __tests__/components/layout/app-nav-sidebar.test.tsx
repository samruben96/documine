/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { AppNavSidebar } from '@/components/layout/app-nav-sidebar';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
    'aria-current': ariaCurrent,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    'aria-current'?: string;
    onClick?: () => void;
  }) => (
    <a href={href} className={className} aria-current={ariaCurrent} onClick={onClick}>
      {children}
    </a>
  ),
}));

// Mock next/navigation
const mockPathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// Mock sidebar context
const mockSetIsOpen = vi.fn();
vi.mock('@/components/layout/sidebar', () => ({
  useSidebar: () => ({
    isOpen: false,
    setIsOpen: mockSetIsOpen,
  }),
}));

// Mock Sheet component - renders nothing when closed
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="sheet-open">{children}</div> : null,
  SheetContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="sheet-content" className={className}>{children}</div>
  ),
  SheetHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="sheet-header" className={className}>{children}</div>
  ),
  SheetTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 data-testid="sheet-title" className={className}>{children}</h2>
  ),
}));

/**
 * Helper to get only the desktop sidebar (the first one with lg:flex class)
 * The component renders multiple sidebars for different breakpoints
 */
function getDesktopSidebar(): HTMLElement {
  const sidebars = screen.getAllByRole('complementary', { hidden: true });
  // Desktop sidebar is the one with lg:flex class
  const desktop = sidebars.find(s => s.classList.contains('lg:flex') && s.classList.contains('hidden'));
  if (!desktop) throw new Error('Desktop sidebar not found');
  return desktop;
}

/**
 * Helper to get nav links from the desktop sidebar only
 */
function getDesktopNavLinks(): HTMLElement[] {
  const sidebar = getDesktopSidebar();
  return within(sidebar).getAllByRole('link');
}

describe('AppNavSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/dashboard');
  });

  describe('AC: DR.2.1 - Sidebar width', () => {
    it('sidebar has w-56 (224px) width class', () => {
      render(<AppNavSidebar />);
      const sidebar = getDesktopSidebar();
      expect(sidebar).toHaveClass('w-56');
    });
  });

  describe('AC: DR.2.2 - Sidebar background and border', () => {
    it('sidebar has bg-white background', () => {
      render(<AppNavSidebar />);
      const sidebar = getDesktopSidebar();
      expect(sidebar).toHaveClass('bg-white');
    });

    it('sidebar has border-r border-slate-200', () => {
      render(<AppNavSidebar />);
      const sidebar = getDesktopSidebar();
      expect(sidebar).toHaveClass('border-r', 'border-slate-200');
    });
  });

  describe('AC: DR.2.3 - Navigation items', () => {
    it('renders Dashboard nav item with correct href', () => {
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const dashboardLink = links.find(l => l.textContent?.includes('Dashboard'));
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    it('renders Documents nav item with correct href', () => {
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const documentsLink = links.find(l => l.textContent?.includes('Documents'));
      expect(documentsLink).toHaveAttribute('href', '/documents');
    });

    it('renders Chat w/ Docs nav item with correct href', () => {
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const chatDocsLink = links.find(l => l.textContent?.includes('Chat w/ Docs'));
      expect(chatDocsLink).toHaveAttribute('href', '/chat-docs');
    });

    it('renders Compare nav item with correct href', () => {
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const compareLink = links.find(l => l.textContent?.includes('Compare'));
      expect(compareLink).toHaveAttribute('href', '/compare');
    });

    it('renders Quoting nav item with correct href', () => {
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const quotingLink = links.find(l => l.textContent?.includes('Quoting'));
      expect(quotingLink).toHaveAttribute('href', '/quoting');
    });

    it('renders AI Buddy nav item with correct href', () => {
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const aiBuddyLink = links.find(l => l.textContent?.includes('AI Buddy'));
      expect(aiBuddyLink).toHaveAttribute('href', '/ai-buddy');
    });

    it('renders Reporting nav item with correct href', () => {
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const reportingLink = links.find(l => l.textContent?.includes('Reporting'));
      expect(reportingLink).toHaveAttribute('href', '/reporting');
    });
  });

  describe('AC: DR.2.4 - Settings at bottom with separator', () => {
    it('renders Settings nav item with correct href', () => {
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const settingsLink = links.find(l => l.textContent?.includes('Settings'));
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('Settings section has border-t separator', () => {
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const settingsLink = links.find(l => l.textContent?.includes('Settings'));
      const settingsContainer = settingsLink?.parentElement;
      expect(settingsContainer).toHaveClass('border-t');
    });
  });

  describe('AC: DR.2.5 - Icon and text styling', () => {
    it('nav items display icon with w-5 h-5 classes', () => {
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const dashboardLink = links.find(l => l.textContent?.includes('Dashboard'));
      const icon = dashboardLink?.querySelector('svg');
      expect(icon).toHaveClass('w-5', 'h-5');
    });

    it('nav items have text-sm font-medium classes', () => {
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const dashboardLink = links.find(l => l.textContent?.includes('Dashboard'));
      expect(dashboardLink).toHaveClass('text-sm', 'font-medium');
    });
  });

  describe('AC: DR.2.6 - Active state styling', () => {
    it('active nav item has bg-blue-50 class', () => {
      mockPathname.mockReturnValue('/dashboard');
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const dashboardLink = links.find(l => l.textContent?.includes('Dashboard'));
      expect(dashboardLink).toHaveClass('bg-blue-50');
    });

    it('active nav item has text-primary class', () => {
      mockPathname.mockReturnValue('/dashboard');
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const dashboardLink = links.find(l => l.textContent?.includes('Dashboard'));
      expect(dashboardLink).toHaveClass('text-primary');
    });

    it('inactive nav item does not have bg-blue-50', () => {
      mockPathname.mockReturnValue('/dashboard');
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const documentsLink = links.find(l => l.textContent?.includes('Documents'));
      expect(documentsLink).not.toHaveClass('bg-blue-50');
    });

    it('sets aria-current="page" on active nav item', () => {
      mockPathname.mockReturnValue('/dashboard');
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const dashboardLink = links.find(l => l.textContent?.includes('Dashboard'));
      expect(dashboardLink).toHaveAttribute('aria-current', 'page');
    });

    it('does not set aria-current on inactive nav item', () => {
      mockPathname.mockReturnValue('/dashboard');
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const documentsLink = links.find(l => l.textContent?.includes('Documents'));
      expect(documentsLink).not.toHaveAttribute('aria-current');
    });
  });

  describe('AC: DR.2.7 - Hover state', () => {
    it('inactive nav items have hover:bg-slate-100 class', () => {
      mockPathname.mockReturnValue('/dashboard');
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const documentsLink = links.find(l => l.textContent?.includes('Documents'));
      expect(documentsLink).toHaveClass('hover:bg-slate-100');
    });
  });

  describe('AC: DR.2.8 - Nav item base classes', () => {
    it('nav items have flex items-center gap-3 classes', () => {
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const dashboardLink = links.find(l => l.textContent?.includes('Dashboard'));
      expect(dashboardLink).toHaveClass('flex', 'items-center', 'gap-3');
    });

    it('nav items have px-3 py-2 classes', () => {
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const dashboardLink = links.find(l => l.textContent?.includes('Dashboard'));
      expect(dashboardLink).toHaveClass('px-3', 'py-2');
    });

    it('nav items have rounded-lg class', () => {
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const dashboardLink = links.find(l => l.textContent?.includes('Dashboard'));
      expect(dashboardLink).toHaveClass('rounded-lg');
    });
  });

  describe('AC: DR.2.9 - Desktop visibility', () => {
    it('sidebar is hidden below lg breakpoint (hidden lg:flex)', () => {
      render(<AppNavSidebar />);
      const sidebar = getDesktopSidebar();
      expect(sidebar).toHaveClass('hidden', 'lg:flex');
    });
  });

  describe('Active route detection', () => {
    it('dashboard route is active only for exact /dashboard path', () => {
      mockPathname.mockReturnValue('/dashboard');
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const dashboardLink = links.find(l => l.textContent?.includes('Dashboard'));
      expect(dashboardLink).toHaveClass('bg-blue-50');
    });

    it('documents route is active for /documents and subpaths', () => {
      mockPathname.mockReturnValue('/documents/123');
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const documentsLink = links.find(l => l.textContent?.includes('Documents'));
      expect(documentsLink).toHaveClass('bg-blue-50');
    });

    it('chat-docs route is active for /chat-docs and subpaths', () => {
      mockPathname.mockReturnValue('/chat-docs/456');
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const chatDocsLink = links.find(l => l.textContent?.includes('Chat w/ Docs'));
      expect(chatDocsLink).toHaveClass('bg-blue-50');
    });

    it('ai-buddy route is active for /ai-buddy and subpaths', () => {
      mockPathname.mockReturnValue('/ai-buddy/project/456');
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const aiBuddyLink = links.find(l => l.textContent?.includes('AI Buddy'));
      expect(aiBuddyLink).toHaveClass('bg-blue-50');
    });

    it('settings route is active for /settings', () => {
      mockPathname.mockReturnValue('/settings');
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      const settingsLink = links.find(l => l.textContent?.includes('Settings'));
      expect(settingsLink).toHaveClass('bg-blue-50');
    });
  });

  describe('Total nav items count', () => {
    it('renders exactly 8 navigation links in desktop sidebar (7 main + 1 settings)', () => {
      render(<AppNavSidebar />);
      const links = getDesktopNavLinks();
      expect(links).toHaveLength(8);
    });
  });
});
