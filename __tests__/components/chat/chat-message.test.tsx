/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMessage, type ChatMessageData } from '@/components/chat/chat-message';

describe('ChatMessage', () => {
  // Mock timers for consistent relative time testing
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createMessage = (overrides: Partial<ChatMessageData> = {}): ChatMessageData => ({
    id: 'msg-123',
    role: 'user',
    content: 'Test message content',
    createdAt: new Date('2025-01-15T11:59:00.000Z'), // 1 minute ago
    ...overrides,
  });

  describe('AC-5.2.7: Message send behavior', () => {
    it('renders user message content', () => {
      const message = createMessage({ content: 'Hello, how are you?' });
      render(<ChatMessage message={message} />);

      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    });

    it('renders assistant message content', () => {
      const message = createMessage({
        role: 'assistant',
        content: 'I can help you with that.',
      });
      render(<ChatMessage message={message} />);

      expect(screen.getByText('I can help you with that.')).toBeInTheDocument();
    });

    it('user messages are right-aligned', () => {
      const message = createMessage({ role: 'user' });
      render(<ChatMessage message={message} />);

      const container = screen.getByText('Test message content').closest('div[class*="flex"]');
      expect(container).toHaveClass('items-end');
    });

    it('assistant messages are left-aligned', () => {
      const message = createMessage({ role: 'assistant' });
      render(<ChatMessage message={message} />);

      const container = screen.getByText('Test message content').closest('div[class*="flex"]');
      expect(container).toHaveClass('items-start');
    });

    it('user messages have primary color background (slate-600)', () => {
      const message = createMessage({ role: 'user' });
      render(<ChatMessage message={message} />);

      const bubble = screen.getByText('Test message content').closest('div[class*="rounded-lg"]');
      expect(bubble).toHaveClass('bg-slate-600');
      expect(bubble).toHaveClass('text-white');
    });

    it('assistant messages have gray background (slate-100)', () => {
      const message = createMessage({ role: 'assistant' });
      render(<ChatMessage message={message} />);

      const bubble = screen.getByText('Test message content').closest('div[class*="rounded-lg"]');
      expect(bubble).toHaveClass('bg-slate-100');
      expect(bubble).toHaveClass('text-slate-800');
    });

    it('displays timestamp for message', () => {
      const message = createMessage({
        createdAt: new Date('2025-01-15T11:59:00.000Z'), // 1 minute ago
      });
      render(<ChatMessage message={message} />);

      expect(screen.getByText('1 min ago')).toBeInTheDocument();
    });
  });

  describe('Timestamp formatting', () => {
    it('shows "just now" for messages less than 1 minute old', () => {
      const message = createMessage({
        createdAt: new Date('2025-01-15T11:59:45.000Z'), // 15 seconds ago
      });
      render(<ChatMessage message={message} />);

      expect(screen.getByText('just now')).toBeInTheDocument();
    });

    it('shows minutes for messages less than 1 hour old', () => {
      const message = createMessage({
        createdAt: new Date('2025-01-15T11:30:00.000Z'), // 30 minutes ago
      });
      render(<ChatMessage message={message} />);

      expect(screen.getByText('30 min ago')).toBeInTheDocument();
    });

    it('shows "1 hr ago" for messages exactly 1 hour old', () => {
      const message = createMessage({
        createdAt: new Date('2025-01-15T11:00:00.000Z'), // 1 hour ago
      });
      render(<ChatMessage message={message} />);

      expect(screen.getByText('1 hr ago')).toBeInTheDocument();
    });

    it('shows hours for messages less than 24 hours old', () => {
      const message = createMessage({
        createdAt: new Date('2025-01-15T09:00:00.000Z'), // 3 hours ago
      });
      render(<ChatMessage message={message} />);

      expect(screen.getByText('3 hrs ago')).toBeInTheDocument();
    });
  });

  describe('Multi-line content', () => {
    it('preserves whitespace and line breaks', () => {
      const message = createMessage({
        content: 'Line 1\nLine 2\nLine 3',
      });
      render(<ChatMessage message={message} />);

      const contentElement = screen.getByText(/Line 1/);
      expect(contentElement).toHaveClass('whitespace-pre-wrap');
    });

    it('handles long words with word-break', () => {
      const message = createMessage({
        content: 'VeryLongWordWithoutSpacesThatShouldBreak',
      });
      render(<ChatMessage message={message} />);

      const contentElement = screen.getByText(/VeryLongWordWithoutSpaces/);
      expect(contentElement).toHaveClass('break-words');
    });
  });
});
