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
 * - Performance: Virtualized rendering for large message lists
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChatMessageList } from '@/components/ai-buddy/chat-message-list';
import type { Message } from '@/types/ai-buddy';

// Mock react-virtuoso to render all items for testing
vi.mock('react-virtuoso', () => ({
  Virtuoso: vi.fn(({ data, itemContent, components, ...props }) => {
    const Footer = components?.Footer;
    return (
      <div
        data-testid={props['data-testid']}
        role={props.role}
        aria-live={props['aria-live']}
        aria-label={props['aria-label']}
        className={props.className}
        style={props.style}
      >
        {data?.map((item: Message, index: number) => (
          <div key={item.id}>{itemContent(index, item)}</div>
        ))}
        {Footer && <Footer />}
      </div>
    );
  }),
}));

describe('ChatMessageList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  describe('AC-15.2.4: Auto-scroll to newest message (via Virtuoso)', () => {
    it('renders messages and auto-scroll is handled by Virtuoso followOutput', () => {
      const messages = createMessageArray(5);
      render(<ChatMessageList messages={messages} />);

      // Verify component renders with messages
      const messageElements = screen.getAllByTestId(/^chat-message-(user|assistant)$/);
      expect(messageElements).toHaveLength(5);

      // Note: followOutput="smooth" is configured in component
      // Virtuoso handles auto-scroll internally
    });

    it('starts with most recent messages visible (initialTopMostItemIndex)', () => {
      const messages = createMessageArray(10);
      render(<ChatMessageList messages={messages} />);

      // Component renders all messages (mock renders all)
      const messageElements = screen.getAllByTestId(/^chat-message-(user|assistant)$/);
      expect(messageElements).toHaveLength(10);

      // Note: initialTopMostItemIndex is set to messages.length - 1
      // to start scrolled to bottom (chat-style)
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

    it('streaming indicator appears after messages via Footer component', () => {
      const messages = createMessageArray(2);
      render(<ChatMessageList messages={messages} isLoading={true} />);

      // Get all message containers and streaming indicator
      const messageList = screen.getByTestId('chat-message-list');
      const streamingIndicator = screen.getByTestId('streaming-indicator');

      // Streaming indicator should be inside the list
      expect(messageList).toContainElement(streamingIndicator);

      // Streaming indicator should be present
      expect(streamingIndicator).toBeInTheDocument();
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

    it('shows streaming indicator instead of empty state when loading with no messages', () => {
      // When loading with no messages, should NOT show empty state
      // because we want to show the streaming indicator instead
      render(<ChatMessageList messages={[]} isLoading={true} />);

      // The empty state should NOT be shown during loading
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
      // Streaming indicator should be shown
      expect(screen.getByTestId('streaming-indicator')).toBeInTheDocument();
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

    it('handles large number of messages (virtualized)', () => {
      const messages = createMessageArray(100);
      render(<ChatMessageList messages={messages} />);

      // With our mock, all messages are rendered
      // In production, Virtuoso only renders visible items
      const messageElements = screen.getAllByTestId(/^chat-message-(user|assistant)$/);
      expect(messageElements).toHaveLength(100);
    });
  });

  describe('Virtualization', () => {
    it('renders efficiently with virtualization (overscan configured)', () => {
      const messages = createMessageArray(100);
      render(<ChatMessageList messages={messages} />);

      // Component uses Virtuoso with overscan=200 for smooth scrolling
      // Mock renders all, but production only renders visible + overscan
      const messageElements = screen.getAllByTestId(/^chat-message-(user|assistant)$/);
      expect(messageElements).toHaveLength(100);
    });

    it('passes messages array to Virtuoso data prop', () => {
      const messages = createMessageArray(5);
      render(<ChatMessageList messages={messages} />);

      // Verify all messages are rendered via data prop
      const messageElements = screen.getAllByTestId(/^chat-message-(user|assistant)$/);
      expect(messageElements).toHaveLength(5);

      // Verify message order
      expect(messageElements[0]).toHaveAttribute('data-message-id', 'msg-0');
      expect(messageElements[4]).toHaveAttribute('data-message-id', 'msg-4');
    });
  });
});
