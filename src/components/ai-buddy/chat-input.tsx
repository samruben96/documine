/**
 * AI Buddy Chat Input Component
 * Story 15.1: Chat Input Component
 *
 * Full-featured text input for sending messages to AI Buddy.
 *
 * Implements:
 * - AC-15.1.1: Rounded input box at bottom of chat area
 * - AC-15.1.2: Placeholder text "Message AI Buddy..."
 * - AC-15.1.3: Send button disabled when input is empty
 * - AC-15.1.4: Enter sends message, Shift+Enter inserts newline
 * - AC-15.1.5: Textarea auto-expands up to 4 lines, then scrolls
 * - AC-15.1.6: Character count shown when > 3500 characters
 * - AC-15.1.7: Input clears and refocuses after successful send
 * - AC-15.1.8: Maximum 4000 character limit enforced
 */

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
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DocumentUploadZone } from './document-upload-zone';
import { PendingAttachments } from './documents';

/** Maximum character limit for AI Buddy messages */
const MAX_CHARACTER_LIMIT = 4000;
/** Character count display threshold */
const CHARACTER_COUNT_THRESHOLD = 3500;
/** Maximum height for textarea (4 lines at ~24px per line) */
const MAX_TEXTAREA_HEIGHT = 96;

export interface ChatInputProps {
  /** Callback when user sends a message */
  onSend: (message: string) => void;
  /** Optional callback for document attachment - receives files from dropzone */
  onAttach?: (files: File[]) => void;
  /** Callback when remove button is clicked on pending attachment */
  onRemoveAttachment?: (id: string) => void;
  /** Callback when retry button is clicked on failed attachment */
  onRetryAttachment?: (id: string) => void;
  /** Pending attachments to display */
  pendingAttachments?: import('@/types/ai-buddy').PendingAttachment[];
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Placeholder text - defaults to "Message AI Buddy..." */
  placeholder?: string;
  /** Maximum character limit - defaults to 4000 */
  maxLength?: number;
  /** Additional CSS classes */
  className?: string;
  /** Auto-focus the input on mount */
  autoFocus?: boolean;
  /** Whether a message is currently being sent/loading */
  isLoading?: boolean;
}

export interface ChatInputRef {
  /** Focus the textarea */
  focus: () => void;
  /** Set the textarea value */
  setValue: (value: string) => void;
}

/**
 * AI Buddy Chat Input Component
 *
 * A text input with:
 * - Auto-expanding textarea (up to 4 lines)
 * - Enter to send, Shift+Enter for newline
 * - Character count display at threshold
 * - Optional attachment button
 * - Focus management with ref
 */
export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(
  function ChatInput(
    {
      onSend,
      onAttach,
      onRemoveAttachment,
      onRetryAttachment,
      pendingAttachments = [],
      disabled = false,
      placeholder = 'Message AI Buddy...',
      maxLength = MAX_CHARACTER_LIMIT,
      className,
      autoFocus = false,
      isLoading = false,
    },
    ref
  ) {
    const [value, setValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Character count state
    const characterCount = value.length;
    const showCharacterCount = characterCount >= CHARACTER_COUNT_THRESHOLD;
    const isOverLimit = characterCount > maxLength;
    const isApproachingLimit = characterCount >= maxLength - 100 && !isOverLimit;

    // Combined disabled state
    const isInputDisabled = disabled || isLoading;

    // Expose focus and setValue methods to parent - AC-15.1.7
    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
      setValue: (newValue: string) => {
        setValue(newValue);
      },
    }));

    // Auto-focus on mount
    useEffect(() => {
      if (autoFocus && textareaRef.current) {
        const timeout = setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
        return () => clearTimeout(timeout);
      }
      return undefined;
    }, [autoFocus]);

    // Auto-resize textarea based on content - AC-15.1.5
    const adjustHeight = useCallback(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        // Cap at 4 lines (~96px), enable scroll beyond
        const newHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
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

    // Handle send message - AC-15.1.7
    const handleSend = useCallback(() => {
      const trimmedValue = value.trim();
      // Don't send if over limit or empty
      if (trimmedValue && !isInputDisabled && !isOverLimit) {
        onSend(trimmedValue);
        // AC-15.1.7: Clear input and refocus after successful send
        setValue('');
        // Reset height after clearing
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.focus();
        }
      }
    }, [value, isInputDisabled, isOverLimit, onSend]);

    // Handle keyboard shortcuts - AC-15.1.4
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter sends message (without Shift) - but not when loading or over limit
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isLoading && !isOverLimit) {
          handleSend();
        }
      }
      // Shift+Enter inserts newline (default behavior, no need to handle)
    };

    const isEmpty = value.trim().length === 0;
    // AC-15.1.3, AC-15.1.8: Disable send when empty or over limit
    const isSendDisabled = isInputDisabled || isEmpty || isOverLimit;

    return (
      <div className={cn('flex flex-col gap-1', className)}>
        {/* Pending Attachments - AC-17.1.2 */}
        <PendingAttachments
          attachments={pendingAttachments}
          onRemove={onRemoveAttachment}
          onRetry={onRetryAttachment}
        />

        <div className="flex items-end gap-2">
          {/* Optional Attach Button - AC-17.1.1 */}
          {onAttach && (
            <DocumentUploadZone
              mode="button"
              onUpload={onAttach}
              disabled={isInputDisabled}
              maxFiles={5 - pendingAttachments.length}
            />
          )}

          {/* Multi-line Textarea with Auto-resize - AC-15.1.1, AC-15.1.5 */}
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
                // Base styles - AC-15.1.1: Rounded input box
                'w-full resize-none rounded-xl border px-4 py-3',
                'text-sm text-slate-800 bg-white',
                // Border color - red when over limit, slate otherwise
                isOverLimit ? 'border-red-500' : 'border-slate-200',
                // AC-15.1.2: Placeholder styling
                'placeholder:text-slate-400',
                // Focus styling with emerald accent
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                isOverLimit
                  ? 'focus:ring-red-400 focus:border-red-500'
                  : 'focus:ring-emerald-500/50 focus:border-emerald-300',
                // Disabled state
                'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
                // Smooth height transition - AC-15.1.5
                'transition-all duration-150 ease-in-out',
                // Shadow for depth
                'shadow-sm'
              )}
              aria-label="Message input"
              aria-describedby={isOverLimit ? 'character-limit-error' : undefined}
              aria-invalid={isOverLimit}
              style={{ minHeight: '44px', maxHeight: `${MAX_TEXTAREA_HEIGHT}px` }}
            />
            {/* Character Count Display - AC-15.1.6 */}
            {showCharacterCount && (
              <span
                className={cn(
                  'absolute right-3 bottom-2 text-xs',
                  isOverLimit
                    ? 'text-red-600'
                    : isApproachingLimit
                    ? 'text-amber-600'
                    : 'text-slate-400'
                )}
                aria-live="polite"
                data-testid="character-count"
              >
                {characterCount}/{maxLength}
              </span>
            )}
          </div>

          {/* Send Button - AC-15.1.3 */}
          <Button
            type="button"
            onClick={handleSend}
            disabled={isSendDisabled}
            size="icon"
            className={cn(
              // Size for touch target - minimum 44x44px
              'h-11 w-11 flex-shrink-0',
              // Emerald accent color for AI Buddy
              'bg-emerald-600 hover:bg-emerald-700',
              // Disabled state
              'disabled:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50',
              // Focus indicator
              'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2'
            )}
            aria-label="Send message"
            data-testid="send-button"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        {/* Error Message - AC-15.1.8 */}
        {isOverLimit && (
          <p
            id="character-limit-error"
            className="text-xs text-red-600 px-1"
            role="alert"
            data-testid="character-limit-error"
          >
            Message too long. Please keep it under {maxLength} characters.
          </p>
        )}
      </div>
    );
  }
);
