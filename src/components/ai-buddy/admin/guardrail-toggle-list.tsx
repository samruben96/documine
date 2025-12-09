/**
 * GuardrailToggleList Component
 * Story 19.1: Guardrail Admin UI
 *
 * AC-19.1.8: Display built-in rules: "E&O Protection Language" and "State Compliance Warnings"
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { GuardrailToggleCard } from './guardrail-toggle-card';
import type { CustomGuardrailRule } from '@/types/ai-buddy';

interface GuardrailToggleListProps {
  rules: CustomGuardrailRule[];
  eandoDisclaimer: boolean;
  onToggleRule: (ruleId: string, enabled: boolean) => Promise<void>;
  onToggleEando: (enabled: boolean) => Promise<void>;
  isLoading?: boolean;
  /** Hide the header (title and description) when parent provides it */
  hideHeader?: boolean;
}

/**
 * List of guardrail rule toggles
 *
 * @example
 * ```tsx
 * <GuardrailToggleList
 *   rules={guardrails.customRules}
 *   eandoDisclaimer={guardrails.eandoDisclaimer}
 *   onToggleRule={toggleRule}
 *   onToggleEando={toggleEando}
 * />
 * ```
 */
export function GuardrailToggleList({
  rules,
  eandoDisclaimer,
  onToggleRule,
  onToggleEando,
  isLoading = false,
  hideHeader = false,
}: GuardrailToggleListProps) {
  // Loading skeleton
  if (isLoading && rules.length === 0) {
    return (
      <div className="space-y-3" data-testid="guardrail-toggle-list-loading">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="guardrail-toggle-list">
      {/* Header - conditionally shown */}
      {!hideHeader && (
        <>
          <h3 className="text-sm font-medium">Guardrail Rules</h3>
          <p className="text-sm text-muted-foreground">
            Enable or disable built-in compliance rules.
          </p>
        </>
      )}

      {/* E&O Disclaimer master toggle */}
      <GuardrailToggleCard
        id="eando-master"
        name="E&O Protection Language"
        description="Adds standard E&O disclaimer language to responses involving coverage advice. Recommends verifying with carrier and reviewing policy language."
        enabled={eandoDisclaimer}
        isBuiltIn={true}
        onToggle={onToggleEando}
      />

      {/* Custom rules */}
      {rules.map((rule) => (
        <GuardrailToggleCard
          key={rule.id}
          id={rule.id}
          name={rule.name}
          description={rule.description}
          enabled={rule.enabled}
          isBuiltIn={rule.isBuiltIn}
          onToggle={(enabled) => onToggleRule(rule.id, enabled)}
        />
      ))}
    </div>
  );
}
