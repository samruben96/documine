/**
 * AI Disclosure Editor Component
 * Story 19.4: AI Disclosure Message
 *
 * AC-19.4.1: Text editor in Guardrails section
 * AC-19.4.2: Placeholder text with example disclosure language
 * AC-19.4.3: Save disclosure message (auto-save with debounce)
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Info, Eye, EyeOff } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AIDisclosureBanner } from '../chat/ai-disclosure-banner';

/**
 * Example disclosure messages for placeholder
 */
const PLACEHOLDER_TEXT = `Example: "You are chatting with AI Buddy, an AI assistant. AI Buddy is not a licensed insurance agent and cannot provide binding coverage advice."`;

/**
 * Recommended max character count for disclosure
 */
const RECOMMENDED_MAX_CHARS = 500;

interface AIDisclosureEditorProps {
  /** Current disclosure message (null means no disclosure configured) */
  value: string | null;
  /** Whether disclosure is enabled */
  enabled?: boolean;
  /** Called when disclosure message changes (debounced) */
  onChange: (message: string | null) => void;
  /** Called when enabled toggle changes */
  onEnabledChange?: (enabled: boolean) => void;
  /** Whether the component is in loading state */
  isLoading?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * AI Disclosure Editor Component
 *
 * Provides a text editor for configuring the AI disclosure message
 * that will be shown to users in the chat interface.
 *
 * Features:
 * - Text editor with placeholder text (AC-19.4.2)
 * - Character count display
 * - Auto-save with 500ms debounce (AC-19.4.3)
 * - Preview of how disclosure will appear
 * - Enable/disable toggle
 *
 * @example
 * ```tsx
 * <AIDisclosureEditor
 *   value={guardrails.aiDisclosureMessage}
 *   enabled={guardrails.aiDisclosureEnabled}
 *   onChange={(msg) => updateGuardrails({ aiDisclosureMessage: msg })}
 *   onEnabledChange={(enabled) => updateGuardrails({ aiDisclosureEnabled: enabled })}
 * />
 * ```
 */
export function AIDisclosureEditor({
  value,
  enabled = true,
  onChange,
  onEnabledChange,
  isLoading = false,
  className,
}: AIDisclosureEditorProps) {
  // Local state for immediate UI updates
  const [localValue, setLocalValue] = useState(value ?? '');
  const [showPreview, setShowPreview] = useState(false);

  // Sync local value with prop when it changes externally
  useEffect(() => {
    setLocalValue(value ?? '');
  }, [value]);

  // Debounced save callback (AC-19.4.3)
  const debouncedSave = useDebouncedCallback(
    (newValue: string) => {
      // Save empty string as null to clear disclosure (AC-19.4.7)
      onChange(newValue.trim() === '' ? null : newValue.trim());
    },
    500 // 500ms debounce per tech spec
  );

  // Handle text change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      debouncedSave(newValue);
    },
    [debouncedSave]
  );

  // Handle enabled toggle
  const handleEnabledChange = useCallback(
    (checked: boolean) => {
      onEnabledChange?.(checked);
    },
    [onEnabledChange]
  );

  // Character count
  const charCount = localValue.length;
  const isOverRecommended = charCount > RECOMMENDED_MAX_CHARS;

  return (
    <div className={cn('space-y-4', className)} data-testid="ai-disclosure-editor">
      {/* Header with enable toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="ai-disclosure-enabled" className="text-sm font-medium">
            Show AI Disclosure
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p>
                  Some states (e.g., Maine, Utah) require chatbots to disclose their AI nature.
                  Enable this to display a disclosure banner to users.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch
          id="ai-disclosure-enabled"
          checked={enabled}
          onCheckedChange={handleEnabledChange}
          disabled={isLoading}
          data-testid="ai-disclosure-enabled-toggle"
        />
      </div>

      {/* Editor (only shown when enabled) */}
      {enabled && (
        <div className="space-y-3">
          {/* Textarea */}
          <div className="space-y-2 relative">
            <Label htmlFor="ai-disclosure-message" className="sr-only">
              AI Disclosure Message
            </Label>
            <Textarea
              id="ai-disclosure-message"
              value={localValue}
              onChange={handleChange}
              placeholder={PLACEHOLDER_TEXT}
              disabled={isLoading}
              className="min-h-[100px] resize-y"
              aria-describedby="ai-disclosure-char-count"
              data-testid="ai-disclosure-textarea"
            />
            {/* Character count */}
            <div
              id="ai-disclosure-char-count"
              className={cn(
                'text-xs text-right',
                isOverRecommended ? 'text-amber-600' : 'text-muted-foreground'
              )}
              data-testid="ai-disclosure-char-count"
            >
              {charCount} / {RECOMMENDED_MAX_CHARS} characters (recommended)
            </div>
          </div>

          {/* Preview toggle */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="ai-disclosure-preview-toggle"
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show Preview
                </>
              )}
            </button>

            {/* Preview banner */}
            {showPreview && (
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <p className="text-xs text-muted-foreground mb-2">
                  Preview: How the disclosure will appear to users
                </p>
                {localValue.trim() ? (
                  <AIDisclosureBanner message={localValue.trim()} />
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Enter a disclosure message above to see the preview
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Help text */}
          <p className="text-xs text-muted-foreground">
            This message will be displayed at the top of the chat for all users.
            It cannot be dismissed by users.
          </p>
        </div>
      )}
    </div>
  );
}
