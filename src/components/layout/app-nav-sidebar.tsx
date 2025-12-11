'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  MessageSquare,
  BarChart3,
  Calculator,
  Bot,
  BarChart2,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/layout/sidebar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

/**
 * Navigation item definition
 */
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Main navigation items for the app sidebar
 * AC: DR.2.3 - Navigation includes: Dashboard, Documents, Chat w/ Docs, Compare, Quoting, AI Buddy, Reporting
 */
const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/chat-docs', label: 'Chat w/ Docs', icon: MessageSquare },
  { href: '/compare', label: 'Compare', icon: BarChart3 },
  { href: '/quoting', label: 'Quoting', icon: Calculator },
  { href: '/ai-buddy', label: 'AI Buddy', icon: Bot },
  { href: '/reporting', label: 'Reporting', icon: BarChart2 },
];

/**
 * Settings nav item - appears at bottom with separator
 * AC: DR.2.4 - Settings appears at bottom with border-t separator
 */
const settingsItem: NavItem = {
  href: '/settings',
  label: 'Settings',
  icon: Settings,
};

/**
 * Determines if a navigation item is active based on current pathname
 * Special case for dashboard: exact match only to avoid false positives
 */
function isActive(href: string, pathname: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname.startsWith(href);
}

/**
 * Navigation link component with proper styling
 * AC: DR.2.5 - icon (w-5 h-5) + text label (text-sm font-medium)
 * AC: DR.2.6 - Active: bg-blue-50 text-primary
 * AC: DR.2.7 - Hover: bg-slate-100
 * AC: DR.2.8 - Base: flex items-center gap-3 px-3 py-2 rounded-lg
 */
function NavLink({
  item,
  pathname,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  onClick?: () => void;
}) {
  const active = isActive(item.href, pathname);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        // AC: DR.2.8 - Base styles
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
        // AC: DR.2.6 - Active state
        active && 'bg-blue-50 text-primary dark:bg-slate-800 dark:text-blue-400',
        // AC: DR.2.7 - Hover state for inactive items
        !active && 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
      )}
      aria-current={active ? 'page' : undefined}
    >
      {/* AC: DR.2.5 - Icon sizing */}
      <Icon className="w-5 h-5" />
      <span>{item.label}</span>
    </Link>
  );
}

/**
 * Navigation content used in both desktop sidebar and mobile sheet
 */
function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Main navigation - flex-1 to push settings to bottom */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            onClick={onNavigate}
          />
        ))}
      </nav>

      {/* AC: DR.2.4 - Settings at bottom with border-t separator */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <NavLink item={settingsItem} pathname={pathname} onClick={onNavigate} />
      </div>
    </>
  );
}

interface AppNavSidebarProps {
  className?: string;
}

/**
 * App Navigation Sidebar Component
 *
 * AC: DR.2.1 - Sidebar width is w-56 (224px) on desktop
 * AC: DR.2.2 - White background (bg-white) and slate-200 right border
 * AC: DR.2.9 - Always visible on desktop (lg: breakpoint)
 * AC: DR.2.10 - Slides in from left on tablet/mobile when triggered
 */
export function AppNavSidebar({ className }: AppNavSidebarProps) {
  const { isOpen, setIsOpen } = useSidebar();

  const handleNavigate = () => {
    // Close sidebar on navigation for mobile/tablet
    setIsOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar - AC: DR.2.9 - Always visible on lg: breakpoint */}
      <aside
        className={cn(
          // AC: DR.2.1 - w-56 (224px) width
          'w-56 shrink-0',
          // AC: DR.2.2 - bg-white with border-r border-slate-200
          'bg-white border-r border-slate-200',
          // Dark mode support
          'dark:bg-slate-900 dark:border-slate-800',
          // Flex column for nav layout
          'flex flex-col',
          // AC: DR.2.9 - Hidden below lg breakpoint (desktop only)
          'hidden lg:flex',
          className
        )}
      >
        <NavContent />
      </aside>

      {/* Tablet Sidebar - AC: DR.2.10 - Slides in from left */}
      {/* Only show on tablet (sm to lg) - not on mobile which uses Sheet */}
      <aside
        className={cn(
          // Position and sizing
          'fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-56',
          // AC: DR.2.2 - bg-white with border-r border-slate-200
          'bg-white border-r border-slate-200',
          // Dark mode support
          'dark:bg-slate-900 dark:border-slate-800',
          // Flex column for nav layout
          'flex flex-col',
          // Slide transition
          'transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Only visible on tablet (hidden on mobile and desktop)
          'hidden sm:flex lg:hidden'
        )}
      >
        <NavContent onNavigate={handleNavigate} />
      </aside>

      {/* Tablet backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 hidden sm:block lg:hidden"
          aria-hidden="true"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sheet - AC: DR.2.10 - Slides in from left on mobile */}
      <div className="sm:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="left" className="w-56 p-0 flex flex-col">
            <SheetHeader className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
              <SheetTitle className="text-slate-700 dark:text-slate-200">
                Menu
              </SheetTitle>
            </SheetHeader>
            <NavContent onNavigate={handleNavigate} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
