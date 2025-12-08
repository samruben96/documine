/**
 * @vitest-environment happy-dom
 */
/**
 * AI Buddy Chat Input Component Tests
 * Story 15.1: Chat Input Component
 *
 * Tests for all acceptance criteria:
 * - AC-15.1.1: Rounded input box at bottom of chat area
 * - AC-15.1.2: Placeholder text "Message AI Buddy..."
 * - AC-15.1.3: Send button disabled when input is empty
 * - AC-15.1.4: Enter sends message, Shift+Enter inserts newline
 * - AC-15.1.5: Textarea auto-expands up to 4 lines, then scrolls
 * - AC-15.1.6: Character count shown when > 3500 characters
 * - AC-15.1.7: Input clears and refocuses after successful send
 * - AC-15.1.8: Maximum 4000 character limit enforced
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatInput, type ChatInputRef } from '@/components/ai-buddy/chat-input';
import { createRef } from 'react';

describe('ChatInput', () => {
  const mockOnSend = vi.fn();
  const mockOnAttach = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to set large text values efficiently (userEvent.type is too slow for 3500+ chars)
  const setTextValue = (textarea: HTMLElement, value: string) => {
    fireEvent.change(textarea, { target: { value } });
  };

  describe('AC-15.1.1: Rounded input box', () => {
    it('renders a textarea with rounded corners', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveClass('rounded-xl');
    });

    it('has shadow for depth', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      expect(textarea).toHaveClass('shadow-sm');
    });
  });

  describe('AC-15.1.2: Placeholder text', () => {
    it('shows default placeholder "Message AI Buddy..."', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      expect(textarea).toHaveAttribute('placeholder', 'Message AI Buddy...');
    });

    it('allows custom placeholder text', () => {
      render(<ChatInput onSend={mockOnSend} placeholder="Custom placeholder" />);
      const textarea = screen.getByTestId('chat-input');
      expect(textarea).toHaveAttribute('placeholder', 'Custom placeholder');
    });
  });

  describe('AC-15.1.3: Send button disabled when empty', () => {
    it('send button is disabled when input is empty', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toBeDisabled();
    });

    it('send button is disabled when input contains only whitespace', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      setTextValue(textarea, '   ');
      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toBeDisabled();
    });

    it('send button is enabled when input has text', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      setTextValue(textarea, 'Hello');
      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).not.toBeDisabled();
    });

    it('send button is disabled when isLoading is true', () => {
      render(<ChatInput onSend={mockOnSend} isLoading={true} />);
      const textarea = screen.getByTestId('chat-input');
      setTextValue(textarea, 'Hello');
      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toBeDisabled();
    });

    it('send button is disabled when disabled prop is true', () => {
      render(<ChatInput onSend={mockOnSend} disabled={true} />);
      const textarea = screen.getByTestId('chat-input');
      expect(textarea).toBeDisabled();
      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toBeDisabled();
    });
  });

  describe('AC-15.1.4: Keyboard handling', () => {
    it('Enter key sends message', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      await user.type(textarea, 'Hello world{Enter}');
      expect(mockOnSend).toHaveBeenCalledWith('Hello world');
    });

    it('Enter key does not send when input is empty', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      await user.type(textarea, '{Enter}');
      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('Shift+Enter inserts newline instead of sending', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      await user.type(textarea, 'Line 1{Shift>}{Enter}{/Shift}Line 2');
      expect(mockOnSend).not.toHaveBeenCalled();
      expect(textarea).toHaveValue('Line 1\nLine 2');
    });

    it('Enter does not send when isLoading is true', () => {
      render(<ChatInput onSend={mockOnSend} isLoading={true} />);
      const textarea = screen.getByTestId('chat-input');
      setTextValue(textarea, 'Hello');
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });

  describe('AC-15.1.5: Textarea auto-expand', () => {
    it('textarea has correct max-height style', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      expect(textarea).toHaveStyle({ maxHeight: '96px' });
    });

    it('textarea has correct min-height style', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      expect(textarea).toHaveStyle({ minHeight: '44px' });
    });

    it('textarea has resize-none class to prevent manual resize', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      expect(textarea).toHaveClass('resize-none');
    });

    it('starts with single row', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      expect(textarea).toHaveAttribute('rows', '1');
    });
  });

  describe('AC-15.1.6: Character count display', () => {
    it('does not show character count when below threshold (3500)', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      setTextValue(textarea, 'a'.repeat(3499));
      expect(screen.queryByTestId('character-count')).not.toBeInTheDocument();
    });

    it('shows character count at exactly 3500 characters', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      setTextValue(textarea, 'a'.repeat(3500));
      const counter = screen.getByTestId('character-count');
      expect(counter).toBeInTheDocument();
      expect(counter).toHaveTextContent('3500/4000');
    });

    it('shows character count above threshold', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      setTextValue(textarea, 'a'.repeat(3600));
      const counter = screen.getByTestId('character-count');
      expect(counter).toHaveTextContent('3600/4000');
    });

    it('shows amber color when approaching limit (within 100 chars)', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      setTextValue(textarea, 'a'.repeat(3950));
      const counter = screen.getByTestId('character-count');
      expect(counter).toHaveClass('text-amber-600');
    });
  });

  describe('AC-15.1.7: Focus management', () => {
    it('clears input after successful send', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      setTextValue(textarea, 'Hello world');
      expect(textarea).toHaveValue('Hello world');
      fireEvent.click(screen.getByTestId('send-button'));
      expect(textarea).toHaveValue('');
    });

    it('textarea refocuses after successful send', async () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      setTextValue(textarea, 'Hello world');
      fireEvent.click(screen.getByTestId('send-button'));
      await waitFor(() => {
        expect(document.activeElement).toBe(textarea);
      });
    });

    it('exposes focus method via ref', async () => {
      const ref = createRef<ChatInputRef>();
      render(<ChatInput onSend={mockOnSend} ref={ref} />);
      const textarea = screen.getByTestId('chat-input');
      act(() => {
        ref.current?.focus();
      });
      await waitFor(() => {
        expect(document.activeElement).toBe(textarea);
      });
    });

    it('exposes setValue method via ref', () => {
      const ref = createRef<ChatInputRef>();
      render(<ChatInput onSend={mockOnSend} ref={ref} />);
      const textarea = screen.getByTestId('chat-input');
      act(() => {
        ref.current?.setValue('Test value');
      });
      expect(textarea).toHaveValue('Test value');
    });

    it('auto-focuses on mount when autoFocus is true', async () => {
      render(<ChatInput onSend={mockOnSend} autoFocus={true} />);
      const textarea = screen.getByTestId('chat-input');
      await waitFor(
        () => {
          expect(document.activeElement).toBe(textarea);
        },
        { timeout: 200 }
      );
    });
  });

  describe('AC-15.1.8: Maximum character limit', () => {
    it('send button disabled at 4001 characters', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      setTextValue(textarea, 'a'.repeat(4001));
      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toBeDisabled();
    });

    it('send button enabled at exactly 4000 characters', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      setTextValue(textarea, 'a'.repeat(4000));
      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).not.toBeDisabled();
    });

    it('shows error message when over limit', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      setTextValue(textarea, 'a'.repeat(4001));
      const error = screen.getByTestId('character-limit-error');
      expect(error).toBeInTheDocument();
      expect(error).toHaveTextContent('Message too long');
    });

    it('shows red color on counter when over limit', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      setTextValue(textarea, 'a'.repeat(4001));
      const counter = screen.getByTestId('character-count');
      expect(counter).toHaveClass('text-red-600');
    });

    it('textarea border turns red when over limit', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      setTextValue(textarea, 'a'.repeat(4001));
      expect(textarea).toHaveClass('border-red-500');
    });

    it('Enter key does not send when over limit', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      setTextValue(textarea, 'a'.repeat(4001));
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('supports custom maxLength prop', () => {
      render(<ChatInput onSend={mockOnSend} maxLength={100} />);
      const textarea = screen.getByTestId('chat-input');
      setTextValue(textarea, 'a'.repeat(101));
      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Task 5: Attach button', () => {
    it('does not render attach button when onAttach is not provided', () => {
      render(<ChatInput onSend={mockOnSend} />);
      expect(screen.queryByTestId('attach-button')).not.toBeInTheDocument();
    });

    it('renders attach button when onAttach is provided', () => {
      render(<ChatInput onSend={mockOnSend} onAttach={mockOnAttach} />);
      const attachButton = screen.getByTestId('attach-button');
      expect(attachButton).toBeInTheDocument();
    });

    it('calls onAttach when attach button is clicked', () => {
      render(<ChatInput onSend={mockOnSend} onAttach={mockOnAttach} />);
      const attachButton = screen.getByTestId('attach-button');
      fireEvent.click(attachButton);
      expect(mockOnAttach).toHaveBeenCalled();
    });

    it('attach button is disabled when isLoading is true', () => {
      render(<ChatInput onSend={mockOnSend} onAttach={mockOnAttach} isLoading={true} />);
      const attachButton = screen.getByTestId('attach-button');
      expect(attachButton).toBeDisabled();
    });

    it('attach button has proper aria-label', () => {
      render(<ChatInput onSend={mockOnSend} onAttach={mockOnAttach} />);
      const attachButton = screen.getByTestId('attach-button');
      expect(attachButton).toHaveAttribute('aria-label', 'Attach document');
    });
  });

  describe('Accessibility', () => {
    it('textarea has aria-label', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      expect(textarea).toHaveAttribute('aria-label', 'Message input');
    });

    it('send button has aria-label', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toHaveAttribute('aria-label', 'Send message');
    });

    it('sets aria-invalid when over character limit', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      setTextValue(textarea, 'a'.repeat(4001));
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    it('sets aria-describedby when error message is shown', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      setTextValue(textarea, 'a'.repeat(4001));
      expect(textarea).toHaveAttribute('aria-describedby', 'character-limit-error');
    });

    it('character count has aria-live for screen readers', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      setTextValue(textarea, 'a'.repeat(3500));
      const counter = screen.getByTestId('character-count');
      expect(counter).toHaveAttribute('aria-live', 'polite');
    });

    it('error message has role alert', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      setTextValue(textarea, 'a'.repeat(4001));
      const error = screen.getByTestId('character-limit-error');
      expect(error).toHaveAttribute('role', 'alert');
    });
  });

  describe('Styling', () => {
    it('uses emerald accent colors for send button', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toHaveClass('bg-emerald-600');
    });

    it('uses slate colors for borders', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByTestId('chat-input');
      expect(textarea).toHaveClass('border-slate-200');
    });

    it('applies custom className to container', () => {
      render(<ChatInput onSend={mockOnSend} className="custom-class" />);
      // The className is applied to the outermost div
      const container = screen.getByTestId('chat-input').closest('.flex.flex-col');
      expect(container).toHaveClass('custom-class');
    });
  });
});
