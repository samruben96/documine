/**
 * @vitest-environment jsdom
 *
 * Conversation Group Component Tests
 * Story 16.4: Conversation History & General Chat
 * Story 16.6: Conversation Management
 *
 * AC-16.4.1: Sidebar "Recent" section shows conversations grouped by date
 * AC-16.4.2: Date groups: Today, Yesterday, Previous 7 days, Older
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConversationGroup } from '@/components/ai-buddy/conversation-group';
import { AiBuddyProvider } from '@/contexts/ai-buddy-context';
import type { Conversation } from '@/types/ai-buddy';
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

describe('ConversationGroup', () => {
  const mockConversations: Conversation[] = [
    {
      id: 'conv-1',
      agencyId: 'agency-1',
      userId: 'user-1',
      projectId: 'project-1',
      title: 'First Conversation',
      deletedAt: null,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T12:00:00Z',
    },
    {
      id: 'conv-2',
      agencyId: 'agency-1',
      userId: 'user-1',
      projectId: null,
      title: 'Second Conversation',
      deletedAt: null,
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T11:00:00Z',
    },
  ];

  const projectNames = new Map([['project-1', 'My Project']]);

  const defaultProps = {
    label: 'Today',
    conversations: mockConversations,
    activeConversationId: null,
    onSelectConversation: vi.fn(),
    onDeleteConversation: vi.fn(),
    projectNames,
  };

  it('renders the group label', () => {
    render(<ConversationGroup {...defaultProps} />, { wrapper: TestWrapper });

    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('renders all conversations in the group', () => {
    render(<ConversationGroup {...defaultProps} />, { wrapper: TestWrapper });

    expect(screen.getByText('First Conversation')).toBeInTheDocument();
    expect(screen.getByText('Second Conversation')).toBeInTheDocument();
  });

  it('has correct testid for the group', () => {
    render(<ConversationGroup {...defaultProps} />, { wrapper: TestWrapper });

    expect(screen.getByTestId('conversation-group-today')).toBeInTheDocument();
  });

  it('handles label with spaces correctly in testid', () => {
    render(<ConversationGroup {...defaultProps} label="Previous 7 days" />, { wrapper: TestWrapper });

    expect(
      screen.getByTestId('conversation-group-previous-7-days')
    ).toBeInTheDocument();
  });

  it('calls onSelectConversation when a conversation is clicked', () => {
    const onSelectConversation = vi.fn();
    render(
      <ConversationGroup
        {...defaultProps}
        onSelectConversation={onSelectConversation}
      />,
      { wrapper: TestWrapper }
    );

    // Click the inner button within the conversation item container
    const container = screen.getByTestId('conversation-item-conv-1');
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    fireEvent.click(button!);

    expect(onSelectConversation).toHaveBeenCalledWith('conv-1');
  });

  it('highlights the active conversation', () => {
    render(
      <ConversationGroup {...defaultProps} activeConversationId="conv-1" />,
      { wrapper: TestWrapper }
    );

    const activeItem = screen.getByTestId('conversation-item-conv-1');
    // Check that it has the active class
    expect(activeItem).toHaveClass('bg-[var(--sidebar-active)]');
  });

  it('passes project name to ChatHistoryItem for conversations with projects', () => {
    render(<ConversationGroup {...defaultProps} />, { wrapper: TestWrapper });

    // First conversation has project-1
    expect(
      screen.getByTestId('conversation-project-badge-conv-1')
    ).toHaveTextContent('My Project');
  });

  it('does not show project badge for general conversations', () => {
    render(<ConversationGroup {...defaultProps} />, { wrapper: TestWrapper });

    // Second conversation has null projectId
    expect(
      screen.queryByTestId('conversation-project-badge-conv-2')
    ).not.toBeInTheDocument();
  });

  it('has context menu on conversations (Story 16.6)', () => {
    render(<ConversationGroup {...defaultProps} />, { wrapper: TestWrapper });

    // Context menu trigger should be present on conversations
    expect(
      screen.getByTestId('conversation-context-trigger-conv-1')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('conversation-context-trigger-conv-2')
    ).toBeInTheDocument();
  });
});
