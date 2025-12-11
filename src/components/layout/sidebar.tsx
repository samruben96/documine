'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  PanelLeft,
  Home,
  FileText,
  BarChart3,
  Calculator,
  Bot,
  BarChart2,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

// Context to share sidebar state across components
interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    return { isOpen: false, setIsOpen: () => {} };
  }
  return context;
}

interface SidebarProviderProps {
  children: React.ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive Sidebar Component
 *
 * Implements AC-4.3.10 + AC-6.8.10: Responsive sidebar behavior
 * - Desktop (>1024px): Always visible at 240px width
 * - Tablet (640-1024px): Collapsible sidebar with toggle in header
 * - Mobile (<640px): Sheet overlay with document list
 */
export function Sidebar({ children, className }: SidebarProps) {
  const { isOpen, setIsOpen } = useSidebar();

  // Close sidebar on route change (handled by parent)
  useEffect(() => {
    const handleResize = () => {
      // Auto-close on desktop
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsOpen]);

  return (
    <>
      {/* Overlay for tablet */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden hidden sm:block"
          aria-hidden="true"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Desktop/Tablet Sidebar */}
      <aside
        id="sidebar"
        className={cn(
          // Base styles
          'fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-60 border-r border-slate-200 bg-slate-50 flex flex-col',
          // Desktop: fill parent (resizable panel), relative positioning
          'lg:relative lg:top-0 lg:h-full lg:w-full lg:translate-x-0',
          // Tablet: slide in/out
          'max-lg:transition-transform max-lg:duration-200 max-lg:ease-in-out',
          isOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full',
          // Mobile: completely hidden (uses Sheet)
          'max-sm:hidden',
          className
        )}
      >
        {/* Sidebar header */}
        <div className="h-14 flex-shrink-0 border-b border-slate-200 flex items-center px-4">
          <span className="font-semibold text-slate-700">Documents</span>
        </div>

        {/* Sidebar content */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </aside>

      {/* Mobile Sheet - AC-6.8.10 */}
      <div className="sm:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="h-14 border-b border-slate-200 flex items-center justify-center">
              <SheetTitle className="text-slate-700">Documents</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-hidden h-[calc(100vh-3.5rem)]">
              {children}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

/**
 * Sidebar Toggle Button - for use in Header
 * AC-6.8.7: Integrated into header to prevent logo truncation
 */
export function SidebarToggle() {
  const { isOpen, setIsOpen } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsOpen(!isOpen)}
      className="lg:hidden"
      aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      aria-expanded={isOpen}
    >
      {isOpen ? (
        <X className="h-5 w-5" />
      ) : (
        <PanelLeft className="h-5 w-5" />
      )}
    </Button>
  );
}

/**
 * Navigation item definition for bottom nav
 * AC: DR.9.3 - Mobile bottom nav includes: Documents, Compare, Quoting, AI Buddy, Reports, Settings
 */
interface BottomNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Bottom navigation items - space constrained to 7 items max
 * AC: DR.9.3 - Includes Dashboard, Documents, Compare, Quoting, AI Buddy, Reports, Settings
 * AC: DR.9.4 - Uses same Lucide icons as AppNavSidebar
 */
const bottomNavItems: BottomNavItem[] = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/documents', label: 'Docs', icon: FileText },
  { href: '/compare', label: 'Compare', icon: BarChart3 },
  { href: '/quoting', label: 'Quoting', icon: Calculator },
  { href: '/ai-buddy', label: 'AI Buddy', icon: Bot },
  { href: '/reporting', label: 'Reports', icon: BarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

/**
 * Determines if a navigation item is active based on current pathname
 * Matches AppNavSidebar pattern - exact match for dashboard, startsWith for others
 * AC: DR.9.5 - Active states match desktop styling
 */
function isActiveRoute(href: string, pathname: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname.startsWith(href);
}

/**
 * Mobile Bottom Navigation Component
 *
 * Shown only on mobile (<640px) per AC-4.3.10
 * AC: DR.9.3 - Includes: Documents, Compare, Quoting, AI Buddy, Reports, Settings
 * AC: DR.9.4 - Uses consistent Lucide icons matching AppNavSidebar
 * AC: DR.9.5 - Active states match desktop styling
 */
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 sm:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-14">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActiveRoute(item.href, pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                // Base styles
                'flex flex-col items-center justify-center flex-1 py-2 min-w-0',
                // AC: DR.9.5 - Active state: text-primary (blue)
                active && 'text-primary dark:text-blue-400',
                // AC: DR.9.5 - Inactive state: text-slate-600 with hover
                !active &&
                  'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              )}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] mt-0.5 truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
