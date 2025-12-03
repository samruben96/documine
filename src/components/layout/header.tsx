'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LogOut, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { logout } from '@/app/(auth)/login/actions';

/**
 * Dashboard Header Component
 * Per AC-2.4.6: Includes logout button that clears session and redirects to /login
 */
export function Header() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // Redirect will happen, error state rarely reached
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="border-b bg-white dark:bg-slate-900 dark:border-slate-800">
      <div className="flex h-14 items-center justify-between px-6">
        {/* AC-6.8.1: Brand name with accent color */}
        <Link href="/documents" className="font-semibold text-primary hover:text-primary/80 transition-colors">
          docuMINE
        </Link>

        <nav className="flex items-center gap-4">
          {/* AC-6.8.5: Navigation links with accent hover */}
          <Link
            href="/documents"
            className="text-sm text-slate-600 hover:text-primary transition-colors dark:text-slate-400 dark:hover:text-primary"
          >
            Documents
          </Link>
          <Link
            href="/compare"
            className="text-sm text-slate-600 hover:text-primary transition-colors dark:text-slate-400 dark:hover:text-primary"
          >
            Compare
          </Link>
          <Link
            href="/settings"
            className="text-sm text-slate-600 hover:text-primary transition-colors dark:text-slate-400 dark:hover:text-primary"
          >
            Settings
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-slate-600 hover:text-primary dark:text-slate-400"
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            <span className="ml-2">Logout</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
