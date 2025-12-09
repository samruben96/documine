/**
 * Unit Tests: ProjectFolder Component
 * Story 17.5: ChatGPT-Style Project Navigation
 *
 * Tests for the collapsible project folder component.
 *
 * Test Coverage:
 * - AC-17.5.2: Projects display as collapsible folders
 * - AC-17.5.3: Clicking folder icon expands project
 * - AC-17.5.4: Nested chats show within project
 * - AC-17.5.5: New chat within project context
 * - AC-17.5.6: Hover states for navigation
 * - AC-17.5.7: Active states for current selection
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectFolder, ProjectFolderProps } from '@/components/ai-buddy/project-folder';
import type { Conversation, Project } from '@/types/ai-buddy';

// Mock the useAiBuddyContext hook used by ChatHistoryItem
vi.mock('@/contexts/ai-buddy-context', () => ({
  useAiBuddyContext: () => ({
    showDeleteConfirmation: vi.fn(),
    conversationToDelete: null,
    closeDeleteConfirmation: vi.fn(),
    confirmDelete: vi.fn(),
    // Required for MoveToProjectDialog
    projects: [],
    moveConversation: vi.fn(),
    isMovingConversation: false,
  }),
}));

// Test data
const mockProject: Project = {
  id: 'project-1',
  agencyId: 'agency-1',
  userId: 'user-1',
  name: 'Test Project',
  description: 'Test description',
  archivedAt: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  documentCount: 5,
};

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    agencyId: 'agency-1',
    userId: 'user-1',
    projectId: 'project-1',
    title: 'First Conversation',
    deletedAt: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
  },
  {
    id: 'conv-2',
    agencyId: 'agency-1',
    userId: 'user-1',
    projectId: 'project-1',
    title: 'Second Conversation',
    deletedAt: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T12:00:00Z',
  },
];

const defaultProps: ProjectFolderProps = {
  project: mockProject,
  isExpanded: false,
  isActive: false,
  conversations: mockConversations,
  activeConversationId: null,
  onToggle: vi.fn(),
  onSelectProject: vi.fn(),
  onSelectConversation: vi.fn(),
  onNewChatInProject: vi.fn(),
  onArchive: vi.fn(),
  onRename: vi.fn(),
};

describe('ProjectFolder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Folder Header Rendering (AC-17.5.2)', () => {
    it('renders folder with project name and icons', () => {
      render(<ProjectFolder {...defaultProps} />);

      // Project name should be visible
      expect(screen.getByTestId(`folder-header-${mockProject.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`folder-header-${mockProject.id}`)).toHaveTextContent('Test Project');

      // Chevron should be present
      expect(screen.getByTestId(`folder-chevron-${mockProject.id}`)).toBeInTheDocument();

      // Folder container should exist
      expect(screen.getByTestId(`project-folder-${mockProject.id}`)).toBeInTheDocument();
    });

    it('displays document count badge when > 0', () => {
      render(<ProjectFolder {...defaultProps} />);

      expect(screen.getByTestId(`project-doc-count-${mockProject.id}`)).toHaveTextContent('5');
    });

    it('does not display document count badge when 0', () => {
      const projectWithNoDocuments = { ...mockProject, documentCount: 0 };
      render(<ProjectFolder {...defaultProps} project={projectWithNoDocuments} />);

      expect(screen.queryByTestId(`project-doc-count-${mockProject.id}`)).not.toBeInTheDocument();
    });

    it('truncates long project names', () => {
      const longNameProject = {
        ...mockProject,
        name: 'This is a very long project name that should be truncated',
      };
      render(<ProjectFolder {...defaultProps} project={longNameProject} />);

      const header = screen.getByTestId(`folder-header-${mockProject.id}`);
      expect(header.textContent?.length).toBeLessThan(longNameProject.name.length);
      expect(header).toHaveAttribute('title', longNameProject.name);
    });
  });

  describe('Expand/Collapse Behavior (AC-17.5.3)', () => {
    it('calls onToggle when chevron is clicked', async () => {
      const onToggle = vi.fn();
      render(<ProjectFolder {...defaultProps} onToggle={onToggle} />);

      const chevron = screen.getByTestId(`folder-chevron-${mockProject.id}`);
      await userEvent.click(chevron);

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('hides content when collapsed', () => {
      render(<ProjectFolder {...defaultProps} isExpanded={false} />);

      expect(screen.queryByTestId(`folder-content-${mockProject.id}`)).not.toBeInTheDocument();
    });

    it('shows content when expanded', () => {
      render(<ProjectFolder {...defaultProps} isExpanded={true} />);

      expect(screen.getByTestId(`folder-content-${mockProject.id}`)).toBeInTheDocument();
    });
  });

  describe('Nested Conversations (AC-17.5.4)', () => {
    it('shows conversations when expanded', () => {
      render(<ProjectFolder {...defaultProps} isExpanded={true} />);

      // Should show both conversations
      expect(screen.getByTestId('conversation-item-conv-1')).toBeInTheDocument();
      expect(screen.getByTestId('conversation-item-conv-2')).toBeInTheDocument();
    });

    it('shows empty state when no conversations and expanded', () => {
      render(<ProjectFolder {...defaultProps} isExpanded={true} conversations={[]} />);

      expect(screen.getByTestId(`folder-empty-${mockProject.id}`)).toBeInTheDocument();
      expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    });

    it('calls onSelectConversation when clicking a nested conversation', async () => {
      const onSelectConversation = vi.fn();
      render(
        <ProjectFolder
          {...defaultProps}
          isExpanded={true}
          onSelectConversation={onSelectConversation}
        />
      );

      // Find and click the first conversation
      const conv1 = screen.getByTestId('conversation-item-conv-1');
      const button = conv1.querySelector('button');
      if (button) {
        await userEvent.click(button);
        expect(onSelectConversation).toHaveBeenCalledWith('conv-1');
      }
    });
  });

  describe('New Chat in Project (AC-17.5.5)', () => {
    it('shows "New chat in [Project]" button when expanded', () => {
      render(<ProjectFolder {...defaultProps} isExpanded={true} />);

      expect(screen.getByTestId(`new-chat-in-project-${mockProject.id}`)).toBeInTheDocument();
    });

    it('calls onNewChatInProject when clicked', async () => {
      const onNewChatInProject = vi.fn();
      render(
        <ProjectFolder
          {...defaultProps}
          isExpanded={true}
          onNewChatInProject={onNewChatInProject}
        />
      );

      await userEvent.click(screen.getByTestId(`new-chat-in-project-${mockProject.id}`));

      expect(onNewChatInProject).toHaveBeenCalledTimes(1);
    });

    it('hides "New chat in [Project]" when collapsed', () => {
      render(<ProjectFolder {...defaultProps} isExpanded={false} />);

      expect(screen.queryByTestId(`new-chat-in-project-${mockProject.id}`)).not.toBeInTheDocument();
    });
  });

  describe('Active States (AC-17.5.7)', () => {
    it('applies active state styling when isActive is true', () => {
      render(<ProjectFolder {...defaultProps} isActive={true} />);

      const folder = screen.getByTestId(`project-folder-${mockProject.id}`);
      expect(folder.className).toContain('bg-[var(--sidebar-active)]');
    });

    it('applies hover styling when isActive is false', () => {
      render(<ProjectFolder {...defaultProps} isActive={false} />);

      const folder = screen.getByTestId(`project-folder-${mockProject.id}`);
      expect(folder.className).toContain('hover:bg-[var(--sidebar-hover)]');
    });

    it('highlights active conversation in expanded folder', () => {
      render(
        <ProjectFolder
          {...defaultProps}
          isExpanded={true}
          activeConversationId="conv-1"
        />
      );

      const conv1 = screen.getByTestId('conversation-item-conv-1');
      expect(conv1.className).toContain('bg-[var(--sidebar-active)]');
    });
  });

  describe('Project Name Click (AC-17.5.8)', () => {
    it('calls onSelectProject when project name is clicked', async () => {
      const onSelectProject = vi.fn();
      render(<ProjectFolder {...defaultProps} onSelectProject={onSelectProject} />);

      await userEvent.click(screen.getByTestId(`folder-header-${mockProject.id}`));

      expect(onSelectProject).toHaveBeenCalledTimes(1);
    });

    it('also expands the folder when project name is clicked (if collapsed)', async () => {
      const onToggle = vi.fn();
      const onSelectProject = vi.fn();
      render(
        <ProjectFolder
          {...defaultProps}
          isExpanded={false}
          onToggle={onToggle}
          onSelectProject={onSelectProject}
        />
      );

      await userEvent.click(screen.getByTestId(`folder-header-${mockProject.id}`));

      expect(onSelectProject).toHaveBeenCalledTimes(1);
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Context Menu (Archive & Rename)', () => {
    it('shows menu button on hover (via group-hover)', () => {
      render(<ProjectFolder {...defaultProps} />);

      // Menu button should exist
      expect(screen.getByTestId(`project-menu-${mockProject.id}`)).toBeInTheDocument();
    });

    it('calls onArchive when archive menu item is clicked', async () => {
      const onArchive = vi.fn();
      render(<ProjectFolder {...defaultProps} onArchive={onArchive} />);

      // Open menu
      await userEvent.click(screen.getByTestId(`project-menu-${mockProject.id}`));

      // Find and click Archive option
      const archiveButton = await screen.findByText('Archive');
      await userEvent.click(archiveButton);

      expect(onArchive).toHaveBeenCalledWith(mockProject.id);
    });

    it('enters edit mode when rename is clicked', async () => {
      render(<ProjectFolder {...defaultProps} />);

      // Open menu
      await userEvent.click(screen.getByTestId(`project-menu-${mockProject.id}`));

      // Find and click Rename option
      const renameButton = await screen.findByText('Rename');
      await userEvent.click(renameButton);

      // Should now show input field
      await waitFor(() => {
        expect(screen.getByTestId(`project-name-input-${mockProject.id}`)).toBeInTheDocument();
      });
    });

    it('saves rename on Enter key', async () => {
      const onRename = vi.fn();
      render(<ProjectFolder {...defaultProps} onRename={onRename} />);

      // Open menu and click Rename
      await userEvent.click(screen.getByTestId(`project-menu-${mockProject.id}`));
      const renameButton = await screen.findByText('Rename');
      await userEvent.click(renameButton);

      // Get input and type new name
      const input = await screen.findByTestId(`project-name-input-${mockProject.id}`);
      await userEvent.clear(input);
      await userEvent.type(input, 'New Name{Enter}');

      await waitFor(() => {
        expect(onRename).toHaveBeenCalledWith(mockProject.id, 'New Name');
      });
    });

    it('cancels rename on Escape key', async () => {
      const onRename = vi.fn();
      render(<ProjectFolder {...defaultProps} onRename={onRename} />);

      // Open menu and click Rename
      await userEvent.click(screen.getByTestId(`project-menu-${mockProject.id}`));
      const renameButton = await screen.findByText('Rename');
      await userEvent.click(renameButton);

      // Get input and press Escape
      const input = await screen.findByTestId(`project-name-input-${mockProject.id}`);
      await userEvent.type(input, '{Escape}');

      // Should not call onRename and input should be gone
      expect(onRename).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.queryByTestId(`project-name-input-${mockProject.id}`)).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('chevron button has accessible label', () => {
      render(<ProjectFolder {...defaultProps} />);

      const chevron = screen.getByTestId(`folder-chevron-${mockProject.id}`);
      expect(chevron).toHaveAttribute('aria-label', 'Expand folder');
    });

    it('chevron label changes when expanded', () => {
      render(<ProjectFolder {...defaultProps} isExpanded={true} />);

      const chevron = screen.getByTestId(`folder-chevron-${mockProject.id}`);
      expect(chevron).toHaveAttribute('aria-label', 'Collapse folder');
    });
  });
});
