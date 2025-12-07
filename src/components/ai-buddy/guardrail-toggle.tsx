/**
 * Guardrail Toggle Component
 * Story 14.5: Component Scaffolding
 *
 * Toggle switch for enabling/disabling guardrail rules.
 * Stub implementation - full functionality in Epic 19.
 */

import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface GuardrailToggleProps {
  label: string;
  description?: string;
  enabled: boolean;
  onChange?: (enabled: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function GuardrailToggle({
  label,
  description,
  enabled,
  onChange,
  disabled = false,
  className,
}: GuardrailToggleProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-lg border border-[var(--chat-border)]',
        className
      )}
    >
      <div className="flex-1">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </p>
        {description && (
          <p className="text-xs text-[var(--text-muted)] mt-1">{description}</p>
        )}
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}
