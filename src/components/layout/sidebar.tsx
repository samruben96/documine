'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { Menu, X, PanelLeft, Bot, BarChart3 } from 'lucide-react';
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
 * Mobile Bottom Navigation Component
 *
 * Shown only on mobile (<640px) per AC-4.3.10
 * AC-14.3.2: Includes AI Buddy navigation item
 * DR.2: Updated to match app navigation structure
 */
export function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 sm:hidden">
      <div className="flex items-center justify-around h-14">
        <Link
          href="/dashboard"
          className="flex flex-col items-center justify-center flex-1 py-2 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-xs mt-0.5">Home</span>
        </Link>
        <Link
          href="/documents"
          className="flex flex-col items-center justify-center flex-1 py-2 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-xs mt-0.5">Docs</span>
        </Link>
        <Link
          href="/ai-buddy"
          className="flex flex-col items-center justify-center flex-1 py-2 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <Bot className="h-5 w-5" />
          <span className="text-xs mt-0.5">AI Buddy</span>
        </Link>
        <Link
          href="/reporting"
          className="flex flex-col items-center justify-center flex-1 py-2 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <BarChart3 className="h-5 w-5" />
          <span className="text-xs mt-0.5">Reports</span>
        </Link>
        <Link
          href="/settings"
          className="flex flex-col items-center justify-center flex-1 py-2 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-xs mt-0.5">Settings</span>
        </Link>
      </div>
    </nav>
  );
}
