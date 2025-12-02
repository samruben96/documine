/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatPanel } from '@/components/chat/chat-panel';

// Mock useConversation hook
vi.mock('@/hooks/use-conversation', () => ({
  useConversation: vi.fn(() => ({
    conversation: null,
    messages: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    createNew: vi.fn(),
  })),
}));

// Mock useChat hook
vi.mock('@/hooks/use-chat', () => ({
  useChat: vi.fn(() => ({
    messages: [],
    isLoading: false,
    error: null,
    sendMessage: vi.fn(),
    retryMessage: vi.fn(),
    clearMessages: vi.fn(),
    conversationId: null,
  })),
}));

import { useConversation } from '@/hooks/use-conversation';
import { useChat } from '@/hooks/use-chat';

const mockUseConversation = vi.mocked(useConversation);
const mockUseChat = vi.mocked(useChat);

describe('ChatPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default mock implementations
    mockUseConversation.mockReturnValue({
      conversation: null,
      messages: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      createNew: vi.fn(),
    });
    mockUseChat.mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
      sendMessage: vi.fn(),
      retryMessage: vi.fn(),
      clearMessages: vi.fn(),
      conversationId: null,
    });
  });

  describe('AC-5.1.2: Chat Panel structure', () => {
    it('renders chat panel container', () => {
      render(<ChatPanel documentId="test-doc-id" />);
      expect(screen.getByRole('log', { name: /conversation history/i })).toBeInTheDocument();
    });

    it('displays chat header', () => {
      render(<ChatPanel documentId="test-doc-id" />);
      expect(screen.getByText('Chat')).toBeInTheDocument();
    });

    it('renders scrollable conversation history area', () => {
      render(<ChatPanel documentId="test-doc-id" />);
      const historyArea = screen.getByRole('log', { name: /conversation history/i });
      expect(historyArea).toBeInTheDocument();
    });

    it('renders fixed input area at bottom', () => {
      render(<ChatPanel documentId="test-doc-id" />);
      const input = screen.getByRole('textbox', { name: /message input/i });
      expect(input).toBeInTheDocument();
    });
  });

  describe('AC-5.1.3: Placeholder text', () => {
    it('displays placeholder text "Ask a question..." in input', () => {
      render(<ChatPanel documentId="test-doc-id" />);
      const input = screen.getByRole('textbox', { name: /message input/i });
      expect(input).toHaveAttribute('placeholder', 'Ask a question...');
    });
  });

  describe('Empty state', () => {
    it('shows empty state message when no messages', () => {
      render(<ChatPanel documentId="test-doc-id" />);
      expect(screen.getByText('Ask anything about this document')).toBeInTheDocument();
    });

    it('shows source citations hint in empty state', () => {
      render(<ChatPanel documentId="test-doc-id" />);
      expect(screen.getByText('Get answers with source citations')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('conversation history has aria-live="polite"', () => {
      render(<ChatPanel documentId="test-doc-id" />);
      const historyArea = screen.getByRole('log', { name: /conversation history/i });
      expect(historyArea).toHaveAttribute('aria-live', 'polite');
    });
  });

  // Story 5.6 Tests
  describe('AC-5.6.4: Loading skeleton', () => {
    it('shows loading skeleton while fetching conversation history', () => {
      mockUseConversation.mockReturnValue({
        conversation: null,
        messages: [],
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        createNew: vi.fn(),
      });

      render(<ChatPanel documentId="test-doc-id" />);
      expect(screen.getByLabelText('Loading conversation')).toBeInTheDocument();
    });
  });

  describe('AC-5.6.7: New Chat button', () => {
    it('renders New Chat button in header', () => {
      render(<ChatPanel documentId="test-doc-id" />);
      const newChatButton = screen.getByRole('button', { name: /start a new conversation/i });
      expect(newChatButton).toBeInTheDocument();
    });

    it('New Chat button is disabled while streaming', () => {
      mockUseChat.mockReturnValue({
        messages: [
          { id: '1', role: 'assistant', content: 'Hello', createdAt: new Date(), isStreaming: true },
        ],
        isLoading: true,
        error: null,
        sendMessage: vi.fn(),
        retryMessage: vi.fn(),
        clearMessages: vi.fn(),
        conversationId: 'conv-1',
      });

      render(<ChatPanel documentId="test-doc-id" />);
      const newChatButton = screen.getByRole('button', { name: /start a new conversation/i });
      expect(newChatButton).toBeDisabled();
    });
  });

  describe('AC-5.6.8: New Chat confirmation dialog', () => {
    it('shows confirmation dialog when New Chat button is clicked', async () => {
      render(<ChatPanel documentId="test-doc-id" />);
      const newChatButton = screen.getByRole('button', { name: /start a new conversation/i });

      fireEvent.click(newChatButton);

      await waitFor(() => {
        expect(screen.getByText('Start a new conversation?')).toBeInTheDocument();
        expect(screen.getByText(/This will clear the current conversation/)).toBeInTheDocument();
      });
    });

    it('dialog has Cancel and Start New buttons', async () => {
      render(<ChatPanel documentId="test-doc-id" />);
      const newChatButton = screen.getByRole('button', { name: /start a new conversation/i });

      fireEvent.click(newChatButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /start new/i })).toBeInTheDocument();
      });
    });
  });

  describe('AC-5.6.9: New Chat creates new conversation', () => {
    it('calls createNew and clearMessages when Start New is clicked', async () => {
      const mockCreateNew = vi.fn().mockResolvedValue({ id: 'new-conv-id' });
      const mockClearMessages = vi.fn();

      mockUseConversation.mockReturnValue({
        conversation: null,
        messages: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        createNew: mockCreateNew,
      });

      mockUseChat.mockReturnValue({
        messages: [],
        isLoading: false,
        error: null,
        sendMessage: vi.fn(),
        retryMessage: vi.fn(),
        clearMessages: mockClearMessages,
        conversationId: null,
      });

      render(<ChatPanel documentId="test-doc-id" />);
      const newChatButton = screen.getByRole('button', { name: /start a new conversation/i });

      fireEvent.click(newChatButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start new/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /start new/i }));

      await waitFor(() => {
        expect(mockCreateNew).toHaveBeenCalled();
        expect(mockClearMessages).toHaveBeenCalled();
      });
    });
  });

  describe('AC-5.6.11: Error handling', () => {
    it('shows error state with retry button when loading fails', () => {
      mockUseConversation.mockReturnValue({
        conversation: null,
        messages: [],
        isLoading: false,
        error: 'Failed to load conversation',
        refetch: vi.fn(),
        createNew: vi.fn(),
      });

      render(<ChatPanel documentId="test-doc-id" />);
      expect(screen.getByText('Failed to load conversation')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('calls refetch when retry button is clicked', () => {
      const mockRefetch = vi.fn();
      mockUseConversation.mockReturnValue({
        conversation: null,
        messages: [],
        isLoading: false,
        error: 'Failed to load conversation',
        refetch: mockRefetch,
        createNew: vi.fn(),
      });

      render(<ChatPanel documentId="test-doc-id" />);
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('AC-5.6.1: Conversation history display', () => {
    it('displays persisted messages from useConversation', () => {
      mockUseConversation.mockReturnValue({
        conversation: { id: 'conv-1', documentId: 'doc-1', userId: 'user-1', agencyId: 'agency-1', createdAt: new Date(), updatedAt: new Date() },
        messages: [
          { id: '1', role: 'user', content: 'Hello', createdAt: new Date() },
          { id: '2', role: 'assistant', content: 'Hi there!', createdAt: new Date() },
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        createNew: vi.fn(),
      });

      render(<ChatPanel documentId="test-doc-id" />);
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });

    it('shows streaming messages from useChat when available', () => {
      mockUseChat.mockReturnValue({
        messages: [
          { id: '1', role: 'user', content: 'New question', createdAt: new Date() },
          { id: '2', role: 'assistant', content: 'Streaming response...', createdAt: new Date(), isStreaming: true },
        ],
        isLoading: true,
        error: null,
        sendMessage: vi.fn(),
        retryMessage: vi.fn(),
        clearMessages: vi.fn(),
        conversationId: 'conv-1',
      });

      render(<ChatPanel documentId="test-doc-id" />);
      expect(screen.getByText('New question')).toBeInTheDocument();
      expect(screen.getByText('Streaming response...')).toBeInTheDocument();
    });
  });
});
