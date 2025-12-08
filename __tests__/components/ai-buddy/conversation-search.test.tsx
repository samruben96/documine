/**
 * Tests for ConversationSearch component
 * Story 16.5: Conversation Search (FR4)
 *
 * Note: Complex interaction tests (clicking results, navigation, CommandList rendering)
 * are covered in E2E tests due to cmdk/radix-ui portal rendering complexity in JSDOM.
 *
 * AC-16.5.3: Results show conversation title, matched text snippet (highlighted), project name, date
 * AC-16.5.4: Clicking result opens that conversation (tested in E2E)
 * AC-16.5.6: No results shows "No conversations found for '[query]'"
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConversationSearch } from '@/components/ai-buddy/conversation-search';

// Mock the hooks and context
const mockSetActiveConversation = vi.fn();
let mockResults: {
  conversationId: string;
  conversationTitle: string | null;
  projectId: string | null;
  projectName: string | null;
  matchedText: string;
  highlightedText: string;
  messageId: string;
  createdAt: string;
}[] = [];
let mockIsLoading = false;
let mockError: Error | null = null;

vi.mock('@/hooks/ai-buddy/use-conversation-search', () => ({
  useConversationSearch: () => ({
    results: mockResults,
    isLoading: mockIsLoading,
    error: mockError,
  }),
}));

vi.mock('@/contexts/ai-buddy-context', () => ({
  useAiBuddyContext: () => ({
    setActiveConversation: mockSetActiveConversation,
  }),
}));

describe('ConversationSearch', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockResults = [];
    mockIsLoading = false;
    mockError = null;
  });

  it('renders search input when open', () => {
    render(<ConversationSearch {...defaultProps} />);

    expect(screen.getByPlaceholderText('Search conversations...')).toBeInTheDocument();
  });

  it('does not render dialog content when closed', () => {
    render(<ConversationSearch {...defaultProps} open={false} />);

    expect(screen.queryByPlaceholderText('Search conversations...')).not.toBeInTheDocument();
  });

  it('shows prompt message for short queries', () => {
    render(<ConversationSearch {...defaultProps} />);

    expect(screen.getByText('Type at least 2 characters to search')).toBeInTheDocument();
  });

  it('shows loading state while searching', () => {
    mockIsLoading = true;

    render(<ConversationSearch {...defaultProps} />);

    // Type a query to trigger the loading state display
    const input = screen.getByPlaceholderText('Search conversations...');
    fireEvent.change(input, { target: { value: 'insurance' } });

    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('shows error state when search fails', () => {
    mockError = new Error('Search failed');

    render(<ConversationSearch {...defaultProps} />);

    expect(screen.getByText('Search failed. Please try again.')).toBeInTheDocument();
  });

  it('shows no results message (AC-16.5.6)', () => {
    render(<ConversationSearch {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search conversations...');
    fireEvent.change(input, { target: { value: 'xyz123' } });

    expect(screen.getByText('No conversations found for "xyz123"')).toBeInTheDocument();
  });

  // Note: Tests for result rendering and clicking are done in E2E tests
  // because cmdk's CommandList renders via portal which doesn't work well in JSDOM
});
