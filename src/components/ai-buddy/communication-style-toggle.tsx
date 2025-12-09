/**
 * Communication Style Toggle Component
 * Story 18.2: Preferences Management
 *
 * AC-18.2.7: Toggle between "Professional" and "Casual" communication styles
 */

'use client';

import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface CommunicationStyleToggleProps {
  /** Current style value */
  value: 'professional' | 'casual';
  /** Callback when style changes */
  onChange: (value: 'professional' | 'casual') => void;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Professional/Casual communication style toggle
 *
 * @example
 * ```tsx
 * <CommunicationStyleToggle
 *   value={preferences.communicationStyle}
 *   onChange={(style) => updatePreferences({ communicationStyle: style })}
 * />
 * ```
 */
export function CommunicationStyleToggle({
  value,
  onChange,
  disabled = false,
  className,
}: CommunicationStyleToggleProps) {
  const isCasual = value === 'casual';

  const handleToggle = (checked: boolean) => {
    onChange(checked ? 'casual' : 'professional');
  };

  return (
    <div className={cn('space-y-4', className)} data-testid="communication-style-toggle">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">
            Communication Style
          </label>
          <p className="text-sm text-muted-foreground">
            Choose how AI Buddy communicates with you
          </p>
        </div>
        <Switch
          checked={isCasual}
          onCheckedChange={handleToggle}
          disabled={disabled}
          data-testid="style-switch"
          aria-label="Toggle communication style"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div
          className={cn(
            'rounded-lg border p-4 transition-colors',
            !isCasual
              ? 'border-primary bg-primary/5'
              : 'border-border bg-background'
          )}
          data-testid="professional-option"
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                !isCasual ? 'bg-primary' : 'bg-muted'
              )}
            />
            <span className="text-sm font-medium">Professional</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Formal, structured responses with industry terminology
          </p>
        </div>

        <div
          className={cn(
            'rounded-lg border p-4 transition-colors',
            isCasual
              ? 'border-primary bg-primary/5'
              : 'border-border bg-background'
          )}
          data-testid="casual-option"
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                isCasual ? 'bg-primary' : 'bg-muted'
              )}
            />
            <span className="text-sm font-medium">Casual</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Friendly, conversational tone that&apos;s easier to read
          </p>
        </div>
      </div>
    </div>
  );
}
