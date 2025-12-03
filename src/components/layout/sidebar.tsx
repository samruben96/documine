'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive Sidebar Component
 *
 * Implements AC-4.3.10: Responsive sidebar behavior
 * - Desktop (>1024px): Always visible at 240px width
 * - Tablet (640-1024px): Collapsible sidebar with hamburger toggle
 * - Mobile (<640px): Hidden, uses bottom navigation instead
 */
export function Sidebar({ children, className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when clicking outside on tablet
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const sidebar = document.getElementById('sidebar');
      const toggleButton = document.getElementById('sidebar-toggle');

      if (
        sidebar &&
        !sidebar.contains(target) &&
        toggleButton &&
        !toggleButton.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close sidebar on route change (handled by parent)
  useEffect(() => {
    const handleResize = () => {
      // Auto-close on desktop, keep closed on mobile
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Mobile/Tablet toggle button */}
      <button
        id="sidebar-toggle"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed top-4 left-4 z-50 p-2 rounded-md bg-white border border-slate-200 shadow-sm',
          'lg:hidden', // Hide on desktop
          'focus:outline-none focus:ring-2 focus:ring-primary'
        )}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="h-5 w-5 text-slate-600" />
        ) : (
          <Menu className="h-5 w-5 text-slate-600" />
        )}
      </button>

      {/* Overlay for tablet */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          aria-hidden="true"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={cn(
          // Base styles
          'fixed top-0 left-0 z-40 h-full w-60 border-r border-slate-200 bg-slate-50 flex flex-col',
          // Desktop: always visible
          'lg:relative lg:translate-x-0',
          // Tablet/Mobile: slide in/out
          'max-lg:transition-transform max-lg:duration-200 max-lg:ease-in-out',
          isOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full',
          // Mobile: completely hidden (uses bottom nav)
          'max-sm:hidden',
          className
        )}
      >
        {/* Sidebar header with padding for toggle button on tablet */}
        <div className="h-14 flex-shrink-0 border-b border-slate-200 flex items-center px-4 sm:px-4 lg:px-4">
          <span className="font-semibold text-slate-700 pl-10 sm:pl-10 lg:pl-0">
            Documents
          </span>
        </div>

        {/* Sidebar content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </aside>
    </>
  );
}

/**
 * Mobile Bottom Navigation Component
 *
 * Shown only on mobile (<640px) per AC-4.3.10
 */
export function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white sm:hidden">
      <div className="flex items-center justify-around h-14">
        <a
          href="/documents"
          className="flex flex-col items-center justify-center flex-1 py-2 text-slate-600 hover:text-slate-800"
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
          <span className="text-xs mt-0.5">Documents</span>
        </a>
        <a
          href="/compare"
          className="flex flex-col items-center justify-center flex-1 py-2 text-slate-600 hover:text-slate-800"
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span className="text-xs mt-0.5">Compare</span>
        </a>
        <a
          href="/settings"
          className="flex flex-col items-center justify-center flex-1 py-2 text-slate-600 hover:text-slate-800"
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
        </a>
      </div>
    </nav>
  );
}
