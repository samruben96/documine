'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Loader2, Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { logout } from '@/app/(auth)/login/actions';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarToggle } from '@/components/layout/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/documents', label: 'Documents' },
  { href: '/compare', label: 'Compare' },
  { href: '/settings', label: 'Settings' },
];

/**
 * Navigation Links Component
 * Extracted to module level to prevent recreation on every render.
 */
function NavLinks({
  mobile = false,
  pathname,
  onNavigate,
}: {
  mobile?: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive = (href: string) => {
    if (href === '/documents') {
      return pathname === '/documents' || pathname.startsWith('/documents/');
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            'text-sm transition-colors',
            mobile ? 'block py-2' : '',
            isActive(item.href)
              ? 'text-primary font-medium border-b-2 border-primary pb-0.5'
              : 'text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-primary'
          )}
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}

/**
 * Dashboard Header Component
 * AC-6.8.7: Mobile hamburger menu - logo displays fully without truncation
 * AC-6.8.9: Navigation active state with Electric Blue accent
 */
export function Header() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      setIsLoggingOut(false);
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="border-b bg-white dark:bg-slate-900 dark:border-slate-800">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Left side: Sidebar toggle + Logo */}
        <div className="flex items-center gap-2">
          {/* AC-6.8.7, AC-6.8.10: Sidebar toggle for mobile/tablet */}
          <SidebarToggle />

          {/* AC-6.8.7: Logo with proper spacing on mobile */}
          {/* Logo navigates to dashboard (central hub) */}
          <Link
            href="/dashboard"
            className="font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
          >
            docuMINE
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLinks pathname={pathname} />
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

        {/* Mobile Hamburger Menu */}
        {isMobile && (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader>
                <SheetTitle className="text-primary">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                <NavLinks mobile pathname={pathname} onNavigate={closeMobileMenu} />
                <div className="border-t pt-4 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full justify-start text-slate-600 hover:text-primary"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <LogOut className="h-4 w-4 mr-2" />
                    )}
                    Logout
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </header>
  );
}
