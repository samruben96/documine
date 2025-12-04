'use client';

/**
 * Welcome Header Component
 * Story 9.2: AC-9.2.2 - Welcome header with agency name
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
        <p className="text-sm text-muted-foreground mb-1">
          {getGreeting()}, {userName}
        </p>
      )}
      <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
        Welcome to <span className="text-electric-blue">{agencyName}</span> space
      </h1>
      <p className="mt-2 text-muted-foreground">
        Choose a tool below to get started with your insurance documents
      </p>
    </div>
  );
}
