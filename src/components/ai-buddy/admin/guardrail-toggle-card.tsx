/**
 * GuardrailToggleCard Component
 * Story 19.1: Guardrail Admin UI
 *
 * AC-19.1.8: Display rule name and description with toggle
 * AC-19.1.9: Auto-save on toggle change
 */

'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface GuardrailToggleCardProps {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  isBuiltIn: boolean;
  onToggle: (enabled: boolean) => Promise<void>;
}

/**
 * Card displaying a single guardrail rule with toggle
 *
 * @example
 * ```tsx
 * <GuardrailToggleCard
 *   id="builtin-eando"
 *   name="E&O Protection Language"
 *   description="Adds E&O disclaimer to coverage advice"
 *   enabled={true}
 *   isBuiltIn={true}
 *   onToggle={(enabled) => toggleRule('builtin-eando', enabled)}
 * />
 * ```
 */
export function GuardrailToggleCard({
  id,
  name,
  description,
  enabled,
  isBuiltIn,
  onToggle,
}: GuardrailToggleCardProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async (newEnabled: boolean) => {
    setIsToggling(true);
    try {
      await onToggle(newEnabled);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div
      className={`flex items-start justify-between gap-4 p-4 border rounded-lg transition-opacity ${
        enabled ? '' : 'opacity-60'
      }`}
      data-testid={`guardrail-toggle-card-${id}`}
    >
      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium" data-testid="rule-name">
            {name}
          </span>
          {isBuiltIn && (
            <Badge variant="secondary" className="text-xs" data-testid="rule-builtin-badge">
              Built-in
            </Badge>
          )}
        </div>
        <p
          className="text-sm text-muted-foreground"
          data-testid="rule-description"
        >
          {description}
        </p>
      </div>

      {/* Toggle */}
      <Switch
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={isToggling}
        data-testid="rule-toggle"
        aria-label={`${enabled ? 'Disable' : 'Enable'} ${name}`}
      />
    </div>
  );
}
