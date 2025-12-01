/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '@/components/chat/chat-input';

describe('ChatInput', () => {
  const mockOnSend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-5.1.3: Placeholder text', () => {
    it('displays placeholder text "Ask a question..."', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const textarea = screen.getByRole('textbox', { name: /message input/i });
      expect(textarea).toHaveAttribute('placeholder', 'Ask a question...');
    });

    it('accepts custom placeholder text', () => {
      render(<ChatInput onSend={mockOnSend} placeholder="Custom placeholder" />);
      const textarea = screen.getByRole('textbox', { name: /message input/i });
      expect(textarea).toHaveAttribute('placeholder', 'Custom placeholder');
    });
  });

  describe('AC-5.1.4: Send button visibility and state', () => {
    it('renders send button with arrow icon', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeInTheDocument();
    });

    it('send button is disabled when input is empty', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeDisabled();
    });

    it('send button is enabled when input has content', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      const textarea = screen.getByRole('textbox', { name: /message input/i });
      await user.type(textarea, 'Hello');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).not.toBeDisabled();
    });

    it('send button is disabled when only whitespace is entered', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      const textarea = screen.getByRole('textbox', { name: /message input/i });
      await user.type(textarea, '   ');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeDisabled();
    });
  });

  describe('AC-5.1.5: Keyboard shortcuts', () => {
    it('Enter key sends message', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      const textarea = screen.getByRole('textbox', { name: /message input/i });
      await user.type(textarea, 'Hello world{Enter}');

      expect(mockOnSend).toHaveBeenCalledWith('Hello world');
    });

    it('Shift+Enter inserts newline instead of sending', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      const textarea = screen.getByRole('textbox', { name: /message input/i });
      await user.type(textarea, 'Line 1{Shift>}{Enter}{/Shift}Line 2');

      expect(mockOnSend).not.toHaveBeenCalled();
      expect(textarea).toHaveValue('Line 1\nLine 2');
    });

    it('supports multi-line text input', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      const textarea = screen.getByRole('textbox', { name: /message input/i });
      await user.type(textarea, 'Line 1{Shift>}{Enter}{/Shift}Line 2{Shift>}{Enter}{/Shift}Line 3');

      expect(textarea).toHaveValue('Line 1\nLine 2\nLine 3');
    });
  });

  describe('AC-5.1.6: Auto-focus on load', () => {
    it('input receives focus when autoFocus is true', async () => {
      render(<ChatInput onSend={mockOnSend} autoFocus />);

      await waitFor(() => {
        const textarea = screen.getByRole('textbox', { name: /message input/i });
        expect(textarea).toHaveFocus();
      }, { timeout: 200 });
    });

    it('input does not receive focus when autoFocus is false', () => {
      render(<ChatInput onSend={mockOnSend} autoFocus={false} />);

      const textarea = screen.getByRole('textbox', { name: /message input/i });
      expect(textarea).not.toHaveFocus();
    });
  });

  describe('Send functionality', () => {
    it('clicking send button sends message', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      const textarea = screen.getByRole('textbox', { name: /message input/i });
      await user.type(textarea, 'Test message');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      expect(mockOnSend).toHaveBeenCalledWith('Test message');
    });

    it('clears input after sending message', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      const textarea = screen.getByRole('textbox', { name: /message input/i });
      await user.type(textarea, 'Test message{Enter}');

      expect(textarea).toHaveValue('');
    });

    it('trims whitespace from message before sending', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      const textarea = screen.getByRole('textbox', { name: /message input/i });
      await user.type(textarea, '  Hello world  {Enter}');

      expect(mockOnSend).toHaveBeenCalledWith('Hello world');
    });
  });

  describe('Disabled state', () => {
    it('textarea is disabled when disabled prop is true', () => {
      render(<ChatInput onSend={mockOnSend} disabled />);
      const textarea = screen.getByRole('textbox', { name: /message input/i });
      expect(textarea).toBeDisabled();
    });

    it('send button is disabled when disabled prop is true', () => {
      render(<ChatInput onSend={mockOnSend} disabled />);
      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeDisabled();
    });
  });
});
