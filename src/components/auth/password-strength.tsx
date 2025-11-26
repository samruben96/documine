'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
}

type StrengthLevel = 'weak' | 'medium' | 'strong';

/**
 * Password strength indicator component
 * Per AC-2.1.2:
 * - Weak: < 8 chars OR missing requirements (red)
 * - Medium: 8+ chars with 2/4 requirements (amber)
 * - Strong: 8+ chars with all 4 requirements (green)
 *
 * Requirements: uppercase, lowercase, number, special character
 */
export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { strength, label } = useMemo(() => {
    if (!password) {
      return { strength: 'weak' as StrengthLevel, label: '' };
    }

    const checks = {
      hasLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };

    const requirementsMet = [
      checks.hasUppercase,
      checks.hasLowercase,
      checks.hasNumber,
      checks.hasSpecial,
    ].filter(Boolean).length;

    // Weak: < 8 chars OR missing requirements
    if (!checks.hasLength || requirementsMet < 2) {
      return { strength: 'weak' as StrengthLevel, label: 'Weak' };
    }

    // Strong: 8+ chars with all 4 requirements
    if (requirementsMet === 4) {
      return { strength: 'strong' as StrengthLevel, label: 'Strong' };
    }

    // Medium: 8+ chars with 2-3 requirements
    return { strength: 'medium' as StrengthLevel, label: 'Medium' };
  }, [password]);

  if (!password) {
    return null;
  }

  const strengthColors = {
    weak: 'bg-red-500',
    medium: 'bg-amber-500',
    strong: 'bg-emerald-500',
  };

  const strengthWidths = {
    weak: 'w-1/3',
    medium: 'w-2/3',
    strong: 'w-full',
  };

  const textColors = {
    weak: 'text-red-600',
    medium: 'text-amber-600',
    strong: 'text-emerald-600',
  };

  return (
    <div className="mt-2 space-y-1">
      {/* Visual bar */}
      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            strengthColors[strength],
            strengthWidths[strength]
          )}
        />
      </div>
      {/* Text label */}
      <p className={cn('text-xs font-medium', textColors[strength])}>
        {label}
      </p>
    </div>
  );
}
