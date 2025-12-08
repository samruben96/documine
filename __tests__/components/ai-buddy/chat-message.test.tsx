/**
 * @vitest-environment happy-dom
 */
/**
 * AI Buddy Chat Message Component Tests
 * Story 15.2: Message Display Component
 *
 * Tests for all acceptance criteria:
 * - AC-15.2.1: User messages right-aligned with blue avatar (user initials)
 * - AC-15.2.2: AI messages left-aligned with green avatar (AI icon)
 * - AC-15.2.5: Timestamps shown on hover (relative format)
 * - AC-15.2.6: Markdown rendering works (bold, italic, lists, code blocks, links)
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChatMessage } from '@/components/ai-buddy/chat-message';
import type { Message } from '@/types/ai-buddy';

// Mock date for consistent timestamp testing
const mockDate = new Date('2025-12-07T12:00:00Z');

describe('ChatMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Helper to create mock messages
  const createMockMessage = (
    role: 'user' | 'assistant',
    content: string,
    createdAt?: string
  ): Message => ({
    id: `test-${Math.random().toString(36).slice(2)}`,
    conversationId: 'test-conversation',
    agencyId: 'test-agency',
    role,
    content,
    sources: null,
    confidence: null,
    createdAt: createdAt ?? new Date(mockDate.getTime() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
  });

  describe('AC-15.2.1: User messages right-aligned with blue avatar', () => {
    it('renders user message with flex-row-reverse for right alignment', () => {
      const message = createMockMessage('user', 'Hello!');
      render(<ChatMessage message={message} />);

      const messageContainer = screen.getByTestId('chat-message-user');
      expect(messageContainer).toHaveClass('flex-row-reverse');
    });

    it('renders user avatar with blue background', () => {
      const message = createMockMessage('user', 'Hello!');
      render(<ChatMessage message={message} />);

      const avatar = screen.getByTestId('avatar-user');
      expect(avatar).toHaveClass('bg-blue-500');
    });

    it('shows user initials in avatar', () => {
      const message = createMockMessage('user', 'Hello!');
      render(<ChatMessage message={message} userName="John Doe" />);

      const avatar = screen.getByTestId('avatar-user');
      expect(avatar).toHaveTextContent('JD');
    });

    it('shows first letter only for single-word names', () => {
      const message = createMockMessage('user', 'Hello!');
      render(<ChatMessage message={message} userName="John" />);

      const avatar = screen.getByTestId('avatar-user');
      expect(avatar).toHaveTextContent('J');
    });

    it('shows default "U" when no userName provided', () => {
      const message = createMockMessage('user', 'Hello!');
      render(<ChatMessage message={message} />);

      const avatar = screen.getByTestId('avatar-user');
      expect(avatar).toHaveTextContent('U');
    });

    it('handles empty userName gracefully', () => {
      const message = createMockMessage('user', 'Hello!');
      render(<ChatMessage message={message} userName="" />);

      const avatar = screen.getByTestId('avatar-user');
      expect(avatar).toHaveTextContent('U');
    });
  });

  describe('AC-15.2.2: AI messages left-aligned with green avatar', () => {
    it('renders AI message without flex-row-reverse for left alignment', () => {
      const message = createMockMessage('assistant', 'Hello!');
      render(<ChatMessage message={message} />);

      const messageContainer = screen.getByTestId('chat-message-assistant');
      expect(messageContainer).not.toHaveClass('flex-row-reverse');
    });

    it('renders AI avatar with emerald/green background', () => {
      const message = createMockMessage('assistant', 'Hello!');
      render(<ChatMessage message={message} />);

      const avatar = screen.getByTestId('avatar-assistant');
      expect(avatar).toHaveClass('bg-emerald-500');
    });

    it('shows Bot icon in AI avatar', () => {
      const message = createMockMessage('assistant', 'Hello!');
      render(<ChatMessage message={message} />);

      const avatar = screen.getByTestId('avatar-assistant');
      // Check that the avatar contains an SVG (the Bot icon)
      const svg = avatar.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('AC-15.2.5: Timestamps shown on hover', () => {
    it('timestamp is hidden by default', () => {
      const message = createMockMessage('user', 'Hello!');
      render(<ChatMessage message={message} />);

      const timestamp = screen.getByTestId('message-timestamp');
      expect(timestamp).toHaveClass('opacity-0');
    });

    it('timestamp appears on hover', () => {
      const message = createMockMessage('user', 'Hello!');
      render(<ChatMessage message={message} />);

      const messageContainer = screen.getByTestId('chat-message-user');
      fireEvent.mouseEnter(messageContainer);

      const timestamp = screen.getByTestId('message-timestamp');
      expect(timestamp).toHaveClass('opacity-100');
    });

    it('timestamp hides on mouse leave', () => {
      const message = createMockMessage('user', 'Hello!');
      render(<ChatMessage message={message} />);

      const messageContainer = screen.getByTestId('chat-message-user');
      fireEvent.mouseEnter(messageContainer);
      fireEvent.mouseLeave(messageContainer);

      const timestamp = screen.getByTestId('message-timestamp');
      expect(timestamp).toHaveClass('opacity-0');
    });

    it('displays relative timestamp format', () => {
      const message = createMockMessage('user', 'Hello!');
      render(<ChatMessage message={message} />);

      const timestamp = screen.getByTestId('message-timestamp');
      // Should show "2 minutes ago" or similar relative format
      expect(timestamp.textContent).toMatch(/ago|minute|second/i);
    });
  });

  describe('AC-15.2.6: Markdown rendering', () => {
    it('renders bold text', () => {
      const message = createMockMessage('assistant', 'This is **bold** text');
      render(<ChatMessage message={message} />);

      const bubble = screen.getByTestId('message-bubble');
      const boldElement = bubble.querySelector('strong');
      expect(boldElement).toBeInTheDocument();
      expect(boldElement).toHaveTextContent('bold');
    });

    it('renders italic text', () => {
      const message = createMockMessage('assistant', 'This is *italic* text');
      render(<ChatMessage message={message} />);

      const bubble = screen.getByTestId('message-bubble');
      const italicElement = bubble.querySelector('em');
      expect(italicElement).toBeInTheDocument();
      expect(italicElement).toHaveTextContent('italic');
    });

    it('renders unordered lists', () => {
      const message = createMockMessage(
        'assistant',
        '- Item 1\n- Item 2\n- Item 3'
      );
      render(<ChatMessage message={message} />);

      const bubble = screen.getByTestId('message-bubble');
      const list = bubble.querySelector('ul');
      expect(list).toBeInTheDocument();
      const items = list?.querySelectorAll('li');
      expect(items).toHaveLength(3);
    });

    it('renders ordered lists', () => {
      const message = createMockMessage(
        'assistant',
        '1. First\n2. Second\n3. Third'
      );
      render(<ChatMessage message={message} />);

      const bubble = screen.getByTestId('message-bubble');
      const list = bubble.querySelector('ol');
      expect(list).toBeInTheDocument();
    });

    it('renders inline code', () => {
      const message = createMockMessage(
        'assistant',
        'Use `console.log()` for debugging'
      );
      render(<ChatMessage message={message} />);

      const bubble = screen.getByTestId('message-bubble');
      const code = bubble.querySelector('code');
      expect(code).toBeInTheDocument();
      expect(code).toHaveTextContent('console.log()');
    });

    it('renders code blocks with dark theme', () => {
      const message = createMockMessage(
        'assistant',
        '```javascript\nconst x = 1;\n```'
      );
      render(<ChatMessage message={message} />);

      const bubble = screen.getByTestId('message-bubble');
      const preBlock = bubble.querySelector('pre');
      expect(preBlock).toBeInTheDocument();
      expect(preBlock).toHaveClass('bg-slate-800');
    });

    it('renders links', () => {
      const message = createMockMessage(
        'assistant',
        'Check out [this link](https://example.com)'
      );
      render(<ChatMessage message={message} />);

      const bubble = screen.getByTestId('message-bubble');
      const link = bubble.querySelector('a');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    it('external links open in new tab', () => {
      const message = createMockMessage(
        'assistant',
        'Visit [Google](https://google.com)'
      );
      render(<ChatMessage message={message} />);

      const bubble = screen.getByTestId('message-bubble');
      const link = bubble.querySelector('a');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Message bubble styling', () => {
    it('user message has blue background', () => {
      const message = createMockMessage('user', 'Hello!');
      render(<ChatMessage message={message} />);

      const bubble = screen.getByTestId('message-bubble');
      expect(bubble).toHaveClass('bg-blue-500');
    });

    it('user message has white text', () => {
      const message = createMockMessage('user', 'Hello!');
      render(<ChatMessage message={message} />);

      const bubble = screen.getByTestId('message-bubble');
      expect(bubble).toHaveClass('text-white');
    });

    it('AI message has slate background', () => {
      const message = createMockMessage('assistant', 'Hello!');
      render(<ChatMessage message={message} />);

      const bubble = screen.getByTestId('message-bubble');
      expect(bubble).toHaveClass('bg-slate-100');
    });

    it('AI message has dark text', () => {
      const message = createMockMessage('assistant', 'Hello!');
      render(<ChatMessage message={message} />);

      const bubble = screen.getByTestId('message-bubble');
      expect(bubble).toHaveClass('text-slate-800');
    });

    it('messages have rounded corners', () => {
      const message = createMockMessage('user', 'Hello!');
      render(<ChatMessage message={message} />);

      const bubble = screen.getByTestId('message-bubble');
      expect(bubble).toHaveClass('rounded-2xl');
    });

    it('message content has max width of 80%', () => {
      const message = createMockMessage('user', 'Hello!');
      render(<ChatMessage message={message} />);

      // The content container should have max-w-[80%]
      const contentContainer = screen.getByTestId('message-bubble').parentElement;
      expect(contentContainer).toHaveClass('max-w-[80%]');
    });
  });

  describe('Accessibility', () => {
    it('user avatar has aria-label', () => {
      const message = createMockMessage('user', 'Hello!');
      render(<ChatMessage message={message} />);

      const avatar = screen.getByTestId('avatar-user');
      expect(avatar).toHaveAttribute('aria-label', 'User avatar');
    });

    it('AI avatar has aria-label', () => {
      const message = createMockMessage('assistant', 'Hello!');
      render(<ChatMessage message={message} />);

      const avatar = screen.getByTestId('avatar-assistant');
      expect(avatar).toHaveAttribute('aria-label', 'AI avatar');
    });

    it('timestamp has aria-label with time', () => {
      const message = createMockMessage('user', 'Hello!');
      render(<ChatMessage message={message} />);

      const timestamp = screen.getByTestId('message-timestamp');
      expect(timestamp.getAttribute('aria-label')).toContain('Sent');
    });

    it('message container has data-message-id attribute', () => {
      const message = createMockMessage('user', 'Hello!');
      message.id = 'test-message-123';
      render(<ChatMessage message={message} />);

      const messageContainer = screen.getByTestId('chat-message-user');
      expect(messageContainer).toHaveAttribute('data-message-id', 'test-message-123');
    });
  });

  describe('Custom className', () => {
    it('applies custom className to container', () => {
      const message = createMockMessage('user', 'Hello!');
      render(<ChatMessage message={message} className="custom-class" />);

      const messageContainer = screen.getByTestId('chat-message-user');
      expect(messageContainer).toHaveClass('custom-class');
    });
  });
});
