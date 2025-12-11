'use client';

import { typography } from '@/lib/typography';
import { cn } from '@/lib/utils';

/**
 * Welcome Header Component
 * Story 9.2: AC-9.2.2 - Welcome header with agency name
 * Story DR.8: Typography standardization
 * Displays "Welcome to [Agency Name] space" with optional user greeting
 */

interface WelcomeHeaderProps {
  agencyName: string;
  userName?: string;
}

export function WelcomeHeader({ agencyName, userName }: WelcomeHeaderProps) {
  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div data-testid="welcome-header">
      {userName && (
        <p className={cn(typography.muted, 'mb-1')}>
          {getGreeting()}, {userName}
        </p>
      )}
      {/* DR.8.1: Page title uses typography.pageTitle, sm:text-3xl override for larger screens */}
      <h1 className={cn(typography.pageTitle, 'sm:text-3xl')}>
        Welcome to <span className="text-electric-blue">{agencyName}</span> space
      </h1>
      <p className={cn(typography.muted, 'mt-2')}>
        Choose a tool below to get started with your insurance documents
      </p>
    </div>
  );
}
