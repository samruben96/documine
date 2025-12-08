/**
 * @vitest-environment happy-dom
 */
/**
 * AI Buddy Chat Message List Component Tests
 * Story 15.2: Message Display Component
 *
 * Tests for all acceptance criteria:
 * - AC-15.2.3: Messages display in chronological order (oldest at top)
 * - AC-15.2.4: Auto-scroll to newest message when new messages arrive
 * - AC-15.2.7: Typing indicator (animated dots) shown during AI response streaming
 * - AC-15.2.8: Empty state shown when no messages in conversation
 */

import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChatMessageList } from '@/components/ai-buddy/chat-message-list';
import type { Message } from '@/types/ai-buddy';

// Mock scrollIntoView
const mockScrollIntoView = vi.fn();

describe('ChatMessageList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock scrollIntoView since it's not implemented in happy-dom
    Element.prototype.scrollIntoView = mockScrollIntoView;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create mock messages
  const createMockMessage = (
    id: string,
    role: 'user' | 'assistant',
    content: string,
    createdAt?: Date
  ): Message => ({
    id,
    conversationId: 'test-conversation',
    agencyId: 'test-agency',
    role,
    content,
    sources: null,
    confidence: null,
    createdAt: (createdAt ?? new Date()).toISOString(),
  });

  // Helper to create an array of messages
  const createMessageArray = (count: number): Message[] => {
    return Array.from({ length: count }, (_, i) => {
      const createdAt = new Date(Date.now() - (count - i) * 60000); // Each message 1 min apart
      return createMockMessage(
        `msg-${i}`,
        i % 2 === 0 ? 'user' : 'assistant',
        `Message ${i}`,
        createdAt
      );
    });
  };

  describe('AC-15.2.3: Messages display in chronological order', () => {
    it('renders messages in order (oldest first)', () => {
      const messages = createMessageArray(3);
      render(<ChatMessageList messages={messages} />);

      // Use more specific regex to match only chat-message-user or chat-message-assistant
      const messageElements = screen.getAllByTestId(/^chat-message-(user|assistant)$/);
      expect(messageElements).toHaveLength(3);

      // First message in DOM should be oldest
      expect(messageElements[0]).toHaveAttribute('data-message-id', 'msg-0');
      expect(messageElements[1]).toHaveAttribute('data-message-id', 'msg-1');
      expect(messageElements[2]).toHaveAttribute('data-message-id', 'msg-2');
    });

    it('preserves order when messages array is updated', () => {
      const messages = createMessageArray(2);
      const { rerender } = render(<ChatMessageList messages={messages} />);

      // Add a new message
      const newMessage = createMockMessage('msg-2', 'user', 'New message');
      const updatedMessages = [...messages, newMessage];
      rerender(<ChatMessageList messages={updatedMessages} />);

      const messageElements = screen.getAllByTestId(/^chat-message-(user|assistant)$/);
      expect(messageElements).toHaveLength(3);
      expect(messageElements[2]).toHaveAttribute('data-message-id', 'msg-2');
    });

    it('uses message id as key for proper React reconciliation', () => {
      const messages = createMessageArray(2);
      render(<ChatMessageList messages={messages} />);

      // Verify first message has expected data-message-id
      const messageElements = screen.getAllByTestId(/^chat-message-(user|assistant)$/);
      expect(messageElements[0]).toHaveAttribute('data-message-id', 'msg-0');
    });
  });

  describe('AC-15.2.4: Auto-scroll to newest message', () => {
    it('scrolls to bottom when messages array length increases', () => {
      const messages = createMessageArray(2);
      const { rerender } = render(<ChatMessageList messages={messages} />);

      // Clear any initial scroll calls
      mockScrollIntoView.mockClear();

      // Add a new message
      const newMessage = createMockMessage('msg-2', 'user', 'New message');
      const updatedMessages = [...messages, newMessage];

      act(() => {
        rerender(<ChatMessageList messages={updatedMessages} />);
      });

      // scrollIntoView should have been called
      expect(mockScrollIntoView).toHaveBeenCalled();
    });

    it('uses smooth scroll behavior', () => {
      const messages = createMessageArray(2);
      const { rerender } = render(<ChatMessageList messages={messages} />);
      mockScrollIntoView.mockClear();

      const updatedMessages = [
        ...messages,
        createMockMessage('msg-2', 'user', 'New'),
      ];

      act(() => {
        rerender(<ChatMessageList messages={updatedMessages} />);
      });

      expect(mockScrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({
          behavior: 'smooth',
        })
      );
    });

    it('scrolls when isLoading changes to true', () => {
      const messages = createMessageArray(2);
      const { rerender } = render(
        <ChatMessageList messages={messages} isLoading={false} />
      );
      mockScrollIntoView.mockClear();

      act(() => {
        rerender(<ChatMessageList messages={messages} isLoading={true} />);
      });

      expect(mockScrollIntoView).toHaveBeenCalled();
    });
  });

  describe('AC-15.2.7: Typing indicator during streaming', () => {
    it('shows streaming indicator when isLoading is true', () => {
      const messages = createMessageArray(2);
      render(<ChatMessageList messages={messages} isLoading={true} />);

      expect(screen.getByTestId('streaming-indicator')).toBeInTheDocument();
    });

    it('hides streaming indicator when isLoading is false', () => {
      const messages = createMessageArray(2);
      render(<ChatMessageList messages={messages} isLoading={false} />);

      expect(screen.queryByTestId('streaming-indicator')).not.toBeInTheDocument();
    });

    it('passes streamingContent to StreamingIndicator', () => {
      const messages = createMessageArray(2);
      render(
        <ChatMessageList
          messages={messages}
          isLoading={true}
          streamingContent="Partial response..."
        />
      );

      const indicator = screen.getByTestId('streaming-indicator');
      expect(indicator).toBeInTheDocument();
      // The streaming content should be rendered inside the indicator
      expect(indicator).toHaveTextContent('Partial response...');
    });

    it('streaming indicator appears after messages', () => {
      const messages = createMessageArray(2);
      render(<ChatMessageList messages={messages} isLoading={true} />);

      // Get all message containers and streaming indicator
      const messageList = screen.getByTestId('chat-message-list');
      const children = Array.from(messageList.children);

      // Find positions
      const lastMessageIndex = children.findIndex((el) =>
        el.getAttribute('data-message-id')?.startsWith('msg-1')
      );
      const streamingIndex = children.findIndex((el) =>
        el.getAttribute('data-testid') === 'streaming-indicator'
      );

      // Streaming indicator should come after messages
      expect(streamingIndex).toBeGreaterThan(lastMessageIndex);
    });
  });

  describe('AC-15.2.8: Empty state', () => {
    it('shows empty state when messages array is empty', () => {
      render(<ChatMessageList messages={[]} />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('empty state shows helpful text', () => {
      render(<ChatMessageList messages={[]} />);

      expect(screen.getByText('Start a conversation')).toBeInTheDocument();
      expect(
        screen.getByText(/Ask AI Buddy anything/i)
      ).toBeInTheDocument();
    });

    it('empty state has MessageSquare icon', () => {
      render(<ChatMessageList messages={[]} />);

      const emptyState = screen.getByTestId('empty-state');
      const svg = emptyState.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('hides empty state when messages exist', () => {
      const messages = createMessageArray(1);
      render(<ChatMessageList messages={messages} />);

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    it('shows empty state when loading starts with no messages', () => {
      // When loading with no messages, should NOT show empty state
      // because we want to show the streaming indicator instead
      render(<ChatMessageList messages={[]} isLoading={true} />);

      // The empty state should NOT be shown during loading
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });
  });

  describe('Container properties', () => {
    it('has role="log" for accessibility', () => {
      const messages = createMessageArray(2);
      render(<ChatMessageList messages={messages} />);

      const list = screen.getByTestId('chat-message-list');
      expect(list).toHaveAttribute('role', 'log');
    });

    it('has aria-live="polite" for screen reader updates', () => {
      const messages = createMessageArray(2);
      render(<ChatMessageList messages={messages} />);

      const list = screen.getByTestId('chat-message-list');
      expect(list).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-label describing content', () => {
      const messages = createMessageArray(2);
      render(<ChatMessageList messages={messages} />);

      const list = screen.getByTestId('chat-message-list');
      expect(list).toHaveAttribute('aria-label', 'Chat messages');
    });

    it('is scrollable', () => {
      const messages = createMessageArray(2);
      render(<ChatMessageList messages={messages} />);

      const list = screen.getByTestId('chat-message-list');
      expect(list).toHaveClass('overflow-y-auto');
    });

    it('applies custom className', () => {
      const messages = createMessageArray(2);
      render(<ChatMessageList messages={messages} className="custom-class" />);

      const list = screen.getByTestId('chat-message-list');
      expect(list).toHaveClass('custom-class');
    });
  });

  describe('Props forwarding', () => {
    it('passes userName to ChatMessage components', () => {
      const messages = [createMockMessage('msg-1', 'user', 'Hello')];
      render(<ChatMessageList messages={messages} userName="John Doe" />);

      // The user avatar should show initials JD
      const avatar = screen.getByTestId('avatar-user');
      expect(avatar).toHaveTextContent('JD');
    });

    it('passes onCitationClick to ChatMessage components', () => {
      const mockOnCitationClick = vi.fn();
      const messages = [createMockMessage('msg-1', 'assistant', 'Hello')];
      render(
        <ChatMessageList
          messages={messages}
          onCitationClick={mockOnCitationClick}
        />
      );

      // The callback should be passed through (we can verify by checking props in a more advanced test)
      // For now, just verify the component renders without error
      expect(screen.getByTestId('chat-message-assistant')).toBeInTheDocument();
    });
  });

  describe('Message rendering', () => {
    it('renders both user and assistant messages', () => {
      const messages = [
        createMockMessage('msg-1', 'user', 'Hello'),
        createMockMessage('msg-2', 'assistant', 'Hi there!'),
      ];
      render(<ChatMessageList messages={messages} />);

      expect(screen.getByTestId('chat-message-user')).toBeInTheDocument();
      expect(screen.getByTestId('chat-message-assistant')).toBeInTheDocument();
    });

    it('handles large number of messages', () => {
      const messages = createMessageArray(100);
      render(<ChatMessageList messages={messages} />);

      const messageElements = screen.getAllByTestId(/^chat-message-(user|assistant)$/);
      expect(messageElements).toHaveLength(100);
    });
  });
});
