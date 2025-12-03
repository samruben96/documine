'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const MAX_CHARACTER_LIMIT = 1000;
const CHARACTER_COUNT_THRESHOLD = 900;

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  isLoading?: boolean;
}

export interface ChatInputRef {
  focus: () => void;
  setValue: (value: string) => void;
}

/**
 * Chat Input Component
 *
 * Implements AC-5.1.3: Placeholder text "Ask a question..." with muted text color (#64748b)
 * Implements AC-5.1.4: Send button with arrow icon, Primary Slate color, disabled when empty
 * Implements AC-5.1.5: Enter sends message, Shift+Enter inserts newline, multi-line support
 * Implements AC-5.1.6: Auto-focus on load with visible focus indicator (2px outline)
 * Implements AC-5.2.1: Free-form natural language input
 * Implements AC-5.2.2: Multi-line expansion up to 4 lines with smooth animation
 * Implements AC-5.2.3: Character count display at 900+ characters
 * Implements AC-5.2.4: Character limit enforcement (max 1000) with inline error
 * Implements AC-5.2.9: Input disabled during response streaming (isLoading prop)
 */
export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(
  function ChatInput(
    { onSend, disabled = false, placeholder = 'Ask a question...', className, autoFocus = false, isLoading = false },
    ref
  ) {
    const [value, setValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Character count state
    const characterCount = value.length;
    const showCharacterCount = characterCount >= CHARACTER_COUNT_THRESHOLD;
    const isOverLimit = characterCount > MAX_CHARACTER_LIMIT;

    // Combined disabled state - AC-5.2.9
    const isInputDisabled = disabled || isLoading;

    // Expose focus and setValue methods to parent - AC-5.2.6
    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
      setValue: (newValue: string) => {
        setValue(newValue);
      },
    }));

    // Auto-focus on mount - AC-5.1.6
    useEffect(() => {
      if (autoFocus && textareaRef.current) {
        // Small delay to ensure DOM is ready
        const timeout = setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
        return () => clearTimeout(timeout);
      }
      return undefined;
    }, [autoFocus]);

    // Auto-resize textarea based on content
    const adjustHeight = useCallback(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        // Set to scrollHeight, capped at 4 lines (~96px for 14px font with 1.5 line-height)
        const maxHeight = 96;
        const newHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = `${newHeight}px`;
      }
    }, []);

    // Adjust height when value changes
    useEffect(() => {
      adjustHeight();
    }, [value, adjustHeight]);

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
    };

    const handleSend = useCallback(() => {
      const trimmedValue = value.trim();
      // AC-5.2.4: Don't send if over limit
      if (trimmedValue && !isInputDisabled && !isOverLimit) {
        onSend(trimmedValue);
        setValue('');
        // Reset height after clearing
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }, [value, isInputDisabled, isOverLimit, onSend]);

    // Handle keyboard shortcuts - AC-5.1.5, AC-5.2.9
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter sends message (without Shift) - but not when loading (AC-5.2.9) or over limit (AC-5.2.4)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isLoading && !isOverLimit) {
          handleSend();
        }
      }
      // Shift+Enter inserts newline (default behavior, no need to handle)
    };

    const isEmpty = value.trim().length === 0;
    // AC-5.2.4: Also disable send when over limit
    const isSendDisabled = isInputDisabled || isEmpty || isOverLimit;

    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <div className="flex items-end gap-2">
          {/* Multi-line Textarea with Auto-resize */}
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isInputDisabled}
              rows={1}
              data-testid="chat-input"
              className={cn(
                // Base styles
                'w-full resize-none rounded-lg border px-4 py-3',
                'text-sm text-slate-800 bg-white',
                // Border color - red when over limit, slate otherwise
                isOverLimit ? 'border-red-500' : 'border-slate-300',
                // Placeholder styling - AC-5.1.3: muted text color #64748b (slate-500)
                'placeholder:text-slate-500',
                // Focus styling - AC-5.1.6: 2px outline focus indicator, AC-6.8.5: accent color
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                isOverLimit
                  ? 'focus:ring-red-400 focus:border-red-500'
                  : 'focus:ring-primary focus:border-primary',
                // Disabled state - AC-5.2.9
                'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
                // Smooth height transition - AC-5.2.2
                'transition-all duration-150 ease-in-out'
              )}
              aria-label="Message input"
              aria-describedby={isOverLimit ? 'character-limit-error' : undefined}
              aria-invalid={isOverLimit}
              style={{ minHeight: '44px', maxHeight: '96px' }}
            />
            {/* Character Count Display - AC-5.2.3 */}
            {showCharacterCount && (
              <span
                className={cn(
                  'absolute right-3 bottom-2 text-xs',
                  isOverLimit ? 'text-red-600' : 'text-slate-400'
                )}
                aria-live="polite"
              >
                {characterCount}/{MAX_CHARACTER_LIMIT}
              </span>
            )}
          </div>

          {/* Send Button - AC-5.1.4, AC-5.2.9 */}
          <Button
            type="button"
            onClick={handleSend}
            disabled={isSendDisabled}
            variant="default"
            size="icon"
            className={cn(
              // Size for touch target - minimum 44x44px per accessibility
              'h-11 w-11 flex-shrink-0',
              // AC-6.8.1: Primary accent color (Electric Blue)
              'bg-primary hover:bg-primary/90',
              // Disabled state - AC-5.2.9: grayed out when loading
              'disabled:bg-slate-300 disabled:cursor-not-allowed',
              // Focus indicator - AC-6.8.5
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
            )}
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        {/* Error Message - AC-5.2.4 */}
        {isOverLimit && (
          <p
            id="character-limit-error"
            className="text-xs text-red-600 px-1"
            role="alert"
          >
            Message too long. Please keep it under {MAX_CHARACTER_LIMIT} characters.
          </p>
        )}
      </div>
    );
  }
);
