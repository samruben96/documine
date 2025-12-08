/**
 * @vitest-environment happy-dom
 */
/**
 * AI Buddy ChatHistoryItem Component Tests
 * Story 15.4: Conversation Persistence
 *
 * Tests for:
 * - AC-15.4.4: Display conversation title truncated to fit, relative timestamp
 * - AC-15.4.8: Click to load conversation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatHistoryItem } from '@/components/ai-buddy/chat-history-item';

describe('ChatHistoryItem', () => {
  const defaultProps = {
    id: 'conv-123',
    title: 'Test Conversation',
    onClick: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-15.4.4: Display', () => {
    it('renders conversation title', () => {
      render(<ChatHistoryItem {...defaultProps} />);

      expect(screen.getByText('Test Conversation')).toBeInTheDocument();
    });

    it('shows "New conversation" when title is empty', () => {
      render(<ChatHistoryItem {...defaultProps} title="" />);

      expect(screen.getByText('New conversation')).toBeInTheDocument();
    });

    it('truncates long titles with CSS', () => {
      const longTitle =
        'This is a very long conversation title that should be truncated when displayed';
      render(<ChatHistoryItem {...defaultProps} title={longTitle} />);

      const titleElement = screen.getByText(longTitle);
      expect(titleElement).toHaveClass('truncate');
    });

    it('displays title attribute for hover tooltip on long titles', () => {
      const longTitle =
        'This is a very long conversation title that should be truncated';
      render(<ChatHistoryItem {...defaultProps} title={longTitle} />);

      const titleElement = screen.getByText(longTitle);
      expect(titleElement).toHaveAttribute('title', longTitle);
    });

    it('displays relative timestamp when updatedAt is provided', () => {
      // Use a recent date for predictable output
      const recentDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      render(
        <ChatHistoryItem {...defaultProps} updatedAt={recentDate.toISOString()} />
      );

      // date-fns formatDistanceToNow should produce something like "2 hours ago"
      // The exact text depends on the timing, so we check for presence of time-related words
      const container = screen.getByTestId('conversation-item-conv-123');
      expect(container.textContent).toMatch(/ago|minute|hour|day/i);
    });

    it('displays preview text when provided', () => {
      render(
        <ChatHistoryItem {...defaultProps} preview="First message preview" />
      );

      expect(screen.getByText('First message preview')).toBeInTheDocument();
    });

    it('renders message icon', () => {
      render(<ChatHistoryItem {...defaultProps} />);

      // MessageSquare icon should be present
      const button = screen.getByTestId('conversation-item-conv-123');
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Active state', () => {
    it('applies active styling when isActive is true', () => {
      render(<ChatHistoryItem {...defaultProps} isActive={true} />);

      const button = screen.getByTestId('conversation-item-conv-123');
      expect(button).toHaveClass('bg-[var(--sidebar-active)]');
    });

    it('applies hover styling when isActive is false', () => {
      render(<ChatHistoryItem {...defaultProps} isActive={false} />);

      const button = screen.getByTestId('conversation-item-conv-123');
      expect(button).toHaveClass('hover:bg-[var(--sidebar-hover)]');
    });
  });

  describe('AC-15.4.8: Click interaction', () => {
    it('calls onClick when conversation is clicked', () => {
      const onClick = vi.fn();
      render(<ChatHistoryItem {...defaultProps} onClick={onClick} />);

      const button = screen.getByTestId('conversation-item-conv-123');
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('renders as button element for accessibility', () => {
      render(<ChatHistoryItem {...defaultProps} />);

      const button = screen.getByTestId('conversation-item-conv-123');
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('Delete functionality', () => {
    it('renders delete menu when onDelete is provided', () => {
      render(<ChatHistoryItem {...defaultProps} />);

      // More options button should exist
      const moreButton = screen.getByTestId('conversation-item-conv-123').querySelector('[data-slot="trigger"]')
        || screen.getByTestId('conversation-item-conv-123').querySelector('span');
      expect(moreButton).toBeInTheDocument();
    });

    it('does not render delete menu when onDelete is not provided', () => {
      render(<ChatHistoryItem {...defaultProps} onDelete={undefined} />);

      // The MoreVertical icon wrapper should not be present when onDelete is undefined
      const button = screen.getByTestId('conversation-item-conv-123');
      const moreButtons = button.querySelectorAll('[role="button"]');
      // Only the main button, no dropdown trigger
      expect(moreButtons.length).toBeLessThanOrEqual(1);
    });
  });

  describe('CSS classes', () => {
    it('applies custom className', () => {
      render(<ChatHistoryItem {...defaultProps} className="custom-class" />);

      const button = screen.getByTestId('conversation-item-conv-123');
      expect(button).toHaveClass('custom-class');
    });

    it('has correct base styles', () => {
      render(<ChatHistoryItem {...defaultProps} />);

      const button = screen.getByTestId('conversation-item-conv-123');
      expect(button).toHaveClass('w-full');
      expect(button).toHaveClass('flex');
      expect(button).toHaveClass('items-start');
      expect(button).toHaveClass('rounded-lg');
    });
  });

  describe('Data attributes', () => {
    it('has correct test id with conversation id', () => {
      render(<ChatHistoryItem {...defaultProps} id="unique-conv-456" />);

      expect(
        screen.getByTestId('conversation-item-unique-conv-456')
      ).toBeInTheDocument();
    });
  });
});
