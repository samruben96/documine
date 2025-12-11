'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LogOut, Loader2, Bell } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logout } from '@/app/(auth)/login/actions';
import { SidebarToggle } from '@/components/layout/sidebar';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';

/**
 * Derives user initials from email address.
 * If email has separators (. _ -), uses first char of first two parts.
 * Otherwise, uses first two characters of the local part.
 */
export function getUserInitials(email: string): string {
  if (!email) return '?';
  const localPart = email.split('@')[0] ?? '';
  if (!localPart) return '?';
  const parts = localPart.split(/[._-]/);
  const first = parts[0];
  const second = parts[1];
  if (parts.length >= 2 && first && second && first[0] && second[0]) {
    return (first[0] + second[0]).toUpperCase();
  }
  return localPart.slice(0, 2).toUpperCase();
}

/**
 * Dashboard Header Component
 * DR.1: Header Redesign - Clean, minimal header with logo, bell, and avatar dropdown
 */
export function Header() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      setIsLoggingOut(false);
    }
  };

  const userInitials = getUserInitials(userEmail ?? '');

  return (
    <header className="h-14 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800">
      <div className="flex h-full items-center justify-between px-4">
        {/* Left: Mobile sidebar toggle + Logo (AC: DR.1.1, DR.1.2, DR.1.3, DR.1.10) */}
        <div className="flex items-center gap-3">
          <SidebarToggle />
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">dM</span>
            </div>
            <span className="font-semibold text-lg text-slate-900 dark:text-slate-100">docuMINE</span>
          </Link>
        </div>

        {/* Right: Bell + Avatar dropdown (AC: DR.1.4, DR.1.5, DR.1.6) */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Notifications (coming soon)"
          >
            <Bell className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 p-0"
                aria-label="User menu"
              >
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {userInitials}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
