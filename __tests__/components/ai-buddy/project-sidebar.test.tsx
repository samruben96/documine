/**
 * @vitest-environment happy-dom
 */
/**
 * Project Sidebar Tests
 * Story 16.1: Project Creation & Sidebar
 * Story 16.6: Conversation Management
 * Story 17.5: ChatGPT-Style Project Navigation
 *
 * Tests for ProjectSidebar component.
 *
 * AC-16.1.8: Shows Projects section
 * AC-16.1.12: Projects sorted alphabetically
 * AC-16.1.13: Empty state when no projects
 * AC-17.5.1: New Chat defaults to standalone
 * AC-17.5.2: Projects display as collapsible folders
 * AC-17.5.9: Standalone chats section
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProjectSidebar } from '@/components/ai-buddy/project-sidebar';
import { AiBuddyProvider } from '@/contexts/ai-buddy-context';
import type { Project, Conversation } from '@/types/ai-buddy';
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

const mockProjects: Project[] = [
  {
    id: 'project-1',
    agencyId: 'agency-1',
    userId: 'user-1',
    name: 'Acme Insurance',
    description: null,
    archivedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    documentCount: 3,
  },
  {
    id: 'project-2',
    agencyId: 'agency-1',
    userId: 'user-1',
    name: 'Johnson Family',
    description: 'Policy review',
    archivedAt: null,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    documentCount: 5,
  },
];

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    agencyId: 'agency-1',
    userId: 'user-1',
    projectId: null,
    title: 'Chat about coverage',
    deletedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

describe('ProjectSidebar', () => {
  // AC-16.1.8: Projects section
  it('renders Projects section with project cards', () => {
    render(
      <ProjectSidebar
        projects={mockProjects}
        conversations={[]}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Acme Insurance')).toBeInTheDocument();
    expect(screen.getByText('Johnson Family')).toBeInTheDocument();
  });

  // AC-16.1.13: Empty state
  it('shows empty state when no projects', () => {
    render(
      <ProjectSidebar
        projects={[]}
        conversations={[]}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByTestId('projects-empty-state')).toBeInTheDocument();
    expect(screen.getByText('No projects yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first project')).toBeInTheDocument();
  });

  it('shows loading state for projects', () => {
    render(
      <ProjectSidebar
        projects={[]}
        isLoadingProjects={true}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByTestId('projects-loading')).toBeInTheDocument();
  });

  // New Chat button
  it('calls onNewChat when New Chat button clicked', () => {
    const handleNewChat = vi.fn();

    render(
      <ProjectSidebar
        projects={[]}
        conversations={[]}
        onNewChat={handleNewChat}
      />,
      { wrapper: TestWrapper }
    );

    fireEvent.click(screen.getByTestId('new-chat-button'));

    expect(handleNewChat).toHaveBeenCalledTimes(1);
  });

  // New Project button
  it('calls onNewProject when New Project button clicked', () => {
    const handleNewProject = vi.fn();

    render(
      <ProjectSidebar
        projects={[]}
        conversations={[]}
        onNewProject={handleNewProject}
      />,
      { wrapper: TestWrapper }
    );

    fireEvent.click(screen.getByTestId('new-project-button'));

    expect(handleNewProject).toHaveBeenCalledTimes(1);
  });

  // Project selection - Story 17.5: Now uses ProjectFolder with folder-header
  it('calls onSelectProject when project clicked', () => {
    const handleSelectProject = vi.fn();

    render(
      <ProjectSidebar
        projects={mockProjects}
        conversations={[]}
        onSelectProject={handleSelectProject}
      />,
      { wrapper: TestWrapper }
    );

    // Click the folder header (project name) to select
    fireEvent.click(screen.getByTestId(`folder-header-${mockProjects[0].id}`));

    expect(handleSelectProject).toHaveBeenCalledWith(mockProjects[0]);
  });

  // Active project indicator - Story 17.5: Now uses ProjectFolder
  it('marks active project', () => {
    render(
      <ProjectSidebar
        projects={mockProjects}
        activeProjectId={mockProjects[0].id}
        conversations={[]}
      />,
      { wrapper: TestWrapper }
    );

    const activeFolder = screen.getByTestId(`project-folder-${mockProjects[0].id}`);
    expect(activeFolder.className).toContain('bg-[var(--sidebar-active)]');
  });

  // Conversations section
  it('renders Recent conversations section', () => {
    render(
      <ProjectSidebar
        projects={[]}
        conversations={mockConversations}
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText('Recent')).toBeInTheDocument();
    expect(screen.getByText('Chat about coverage')).toBeInTheDocument();
  });

  // Story 17.5: Empty state message changed for standalone chats
  it('shows empty conversations state', () => {
    render(
      <ProjectSidebar
        projects={[]}
        conversations={[]}
      />,
      { wrapper: TestWrapper }
    );

    // AC-17.5.9: Now shows "No standalone chats" for empty Recent section
    expect(screen.getByText('No standalone chats')).toBeInTheDocument();
  });
});
