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

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export interface ChatInputRef {
  focus: () => void;
}

/**
 * Chat Input Component
 *
 * Implements AC-5.1.3: Placeholder text "Ask a question..." with muted text color (#64748b)
 * Implements AC-5.1.4: Send button with arrow icon, Primary Slate color, disabled when empty
 * Implements AC-5.1.5: Enter sends message, Shift+Enter inserts newline, multi-line support
 * Implements AC-5.1.6: Auto-focus on load with visible focus indicator (2px outline)
 */
export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(
  function ChatInput(
    { onSend, disabled = false, placeholder = 'Ask a question...', className, autoFocus = false },
    ref
  ) {
    const [value, setValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Expose focus method to parent
    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
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
      if (trimmedValue && !disabled) {
        onSend(trimmedValue);
        setValue('');
        // Reset height after clearing
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }, [value, disabled, onSend]);

    // Handle keyboard shortcuts - AC-5.1.5
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter sends message (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      // Shift+Enter inserts newline (default behavior, no need to handle)
    };

    const isEmpty = value.trim().length === 0;
    const isDisabled = disabled || isEmpty;

    return (
      <div className={cn('flex items-end gap-2', className)}>
        {/* Multi-line Textarea with Auto-resize */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              // Base styles
              'w-full resize-none rounded-lg border border-slate-300 px-4 py-3',
              'text-sm text-slate-800 bg-white',
              // Placeholder styling - AC-5.1.3: muted text color #64748b (slate-500)
              'placeholder:text-slate-500',
              // Focus styling - AC-5.1.6: 2px outline focus indicator
              'focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-0 focus:border-slate-400',
              // Disabled state
              'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
              // Smooth height transition
              'transition-[height] duration-100 ease-in-out'
            )}
            aria-label="Message input"
            style={{ minHeight: '44px', maxHeight: '96px' }}
          />
        </div>

        {/* Send Button - AC-5.1.4 */}
        <Button
          type="button"
          onClick={handleSend}
          disabled={isDisabled}
          variant="default"
          size="icon"
          className={cn(
            // Size for touch target - minimum 44x44px per accessibility
            'h-11 w-11 flex-shrink-0',
            // Primary Slate color #475569 (using slate-600)
            'bg-slate-600 hover:bg-slate-700',
            // Disabled state
            'disabled:bg-slate-300 disabled:cursor-not-allowed',
            // Focus indicator
            'focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2'
          )}
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    );
  }
);
