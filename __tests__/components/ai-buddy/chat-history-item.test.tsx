/**
 * @vitest-environment happy-dom
 */
/**
 * AI Buddy ChatHistoryItem Component Tests
 * Story 15.4: Conversation Persistence
 * Story 16.6: Conversation Management
 *
 * Tests for:
 * - AC-15.4.4: Display conversation title truncated to fit, relative timestamp
 * - AC-15.4.8: Click to load conversation
 * - AC-16.6.1: Conversation menu includes "Delete" option
 * - AC-16.6.7: Conversation menu includes "Move to Project" option
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatHistoryItem } from '@/components/ai-buddy/chat-history-item';
import { AiBuddyProvider } from '@/contexts/ai-buddy-context';
import type { ReactNode } from 'react';

// Mock the hooks that require Supabase
vi.mock('@/hooks/ai-buddy/use-conversations', () => ({
  useConversations: () => ({
    conversations: [],
    activeConversation: null,
    isLoading: false,
    isLoadingConversation: false,
    error: null,
    nextCursor: null,
    fetchConversations: vi.fn(),
    loadConversation: vi.fn(),
    createConversation: vi.fn(),
    deleteConversation: vi.fn(),
    moveConversation: vi.fn(),
    searchConversations: vi.fn(),
    clearActiveConversation: vi.fn(),
    refresh: vi.fn(),
    addConversation: vi.fn(),
  }),
}));

vi.mock('@/hooks/ai-buddy/use-projects', () => ({
  useProjects: () => ({
    projects: [],
    archivedProjects: [],
    isLoading: false,
    isMutating: false,
    error: null,
    fetchProjects: vi.fn(),
    createProject: vi.fn(),
    archiveProject: vi.fn(),
    updateProject: vi.fn(),
    restoreProject: vi.fn(),
    fetchArchivedProjects: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/hooks/ai-buddy/use-active-project', () => ({
  useActiveProject: () => ({
    activeProject: null,
    activeProjectId: null,
    setActiveProject: vi.fn(),
    clearActiveProject: vi.fn(),
  }),
}));

// Wrapper component to provide context
function TestWrapper({ children }: { children: ReactNode }) {
  return <AiBuddyProvider>{children}</AiBuddyProvider>;
}

describe('ChatHistoryItem', () => {
  const defaultProps = {
    id: 'conv-123',
    title: 'Test Conversation',
    onClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-15.4.4: Display', () => {
    it('renders conversation title', () => {
      render(<ChatHistoryItem {...defaultProps} />, { wrapper: TestWrapper });

      expect(screen.getByText('Test Conversation')).toBeInTheDocument();
    });

    it('shows "New conversation" when title is empty', () => {
      render(<ChatHistoryItem {...defaultProps} title="" />, { wrapper: TestWrapper });

      expect(screen.getByText('New conversation')).toBeInTheDocument();
    });

    it('truncates long titles with CSS', () => {
      const longTitle =
        'This is a very long conversation title that should be truncated when displayed';
      render(<ChatHistoryItem {...defaultProps} title={longTitle} />, { wrapper: TestWrapper });

      const titleElement = screen.getByText(longTitle);
      expect(titleElement).toHaveClass('truncate');
    });

    it('displays title attribute for hover tooltip on long titles', () => {
      const longTitle =
        'This is a very long conversation title that should be truncated';
      render(<ChatHistoryItem {...defaultProps} title={longTitle} />, { wrapper: TestWrapper });

      const titleElement = screen.getByText(longTitle);
      expect(titleElement).toHaveAttribute('title', longTitle);
    });

    it('displays relative timestamp when updatedAt is provided', () => {
      // Use a recent date for predictable output
      const recentDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      render(
        <ChatHistoryItem {...defaultProps} updatedAt={recentDate.toISOString()} />,
        { wrapper: TestWrapper }
      );

      // date-fns formatDistanceToNow should produce something like "2 hours ago"
      // The exact text depends on the timing, so we check for presence of time-related words
      const container = screen.getByTestId('conversation-item-conv-123');
      expect(container.textContent).toMatch(/ago|minute|hour|day/i);
    });

    it('displays preview text when provided', () => {
      render(
        <ChatHistoryItem {...defaultProps} preview="First message preview" />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText('First message preview')).toBeInTheDocument();
    });

    it('renders message icon', () => {
      render(<ChatHistoryItem {...defaultProps} />, { wrapper: TestWrapper });

      // MessageSquare icon should be present
      const button = screen.getByTestId('conversation-item-conv-123');
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Active state', () => {
    it('applies active styling when isActive is true', () => {
      render(<ChatHistoryItem {...defaultProps} isActive={true} />, { wrapper: TestWrapper });

      const button = screen.getByTestId('conversation-item-conv-123');
      expect(button).toHaveClass('bg-[var(--sidebar-active)]');
    });

    it('applies hover styling when isActive is false', () => {
      render(<ChatHistoryItem {...defaultProps} isActive={false} />, { wrapper: TestWrapper });

      const button = screen.getByTestId('conversation-item-conv-123');
      expect(button).toHaveClass('hover:bg-[var(--sidebar-hover)]');
    });
  });

  describe('AC-15.4.8: Click interaction', () => {
    it('calls onClick when conversation is clicked', () => {
      const onClick = vi.fn();
      render(<ChatHistoryItem {...defaultProps} onClick={onClick} />, { wrapper: TestWrapper });

      // Click the inner button within the container
      const container = screen.getByTestId('conversation-item-conv-123');
      const button = container.querySelector('button[type="button"]');
      expect(button).toBeInTheDocument();
      fireEvent.click(button!);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('renders with a clickable button inside for accessibility', () => {
      render(<ChatHistoryItem {...defaultProps} />, { wrapper: TestWrapper });

      const container = screen.getByTestId('conversation-item-conv-123');
      // Outer element is now a div to accommodate ellipsis menu
      expect(container.tagName).toBe('DIV');
      // Inner button is the clickable area
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('Context menu (Story 16.6)', () => {
    it('renders context menu trigger on conversation item', () => {
      render(<ChatHistoryItem {...defaultProps} />, { wrapper: TestWrapper });

      // Context menu trigger wraps the button
      const trigger = screen.getByTestId(`conversation-context-trigger-${defaultProps.id}`);
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('CSS classes', () => {
    it('applies custom className', () => {
      render(<ChatHistoryItem {...defaultProps} className="custom-class" />, { wrapper: TestWrapper });

      const button = screen.getByTestId('conversation-item-conv-123');
      expect(button).toHaveClass('custom-class');
    });

    it('has correct base styles', () => {
      render(<ChatHistoryItem {...defaultProps} />, { wrapper: TestWrapper });

      const button = screen.getByTestId('conversation-item-conv-123');
      expect(button).toHaveClass('w-full');
      expect(button).toHaveClass('flex');
      expect(button).toHaveClass('items-start');
      expect(button).toHaveClass('rounded-lg');
    });
  });

  describe('Data attributes', () => {
    it('has correct test id with conversation id', () => {
      render(<ChatHistoryItem {...defaultProps} id="unique-conv-456" />, { wrapper: TestWrapper });

      expect(
        screen.getByTestId('conversation-item-unique-conv-456')
      ).toBeInTheDocument();
    });
  });
});
