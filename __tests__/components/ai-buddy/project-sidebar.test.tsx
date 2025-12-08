/**
 * @vitest-environment happy-dom
 */
/**
 * Project Sidebar Tests
 * Story 16.1: Project Creation & Sidebar
 *
 * Tests for ProjectSidebar component.
 *
 * AC-16.1.8: Shows Projects section
 * AC-16.1.12: Projects sorted alphabetically
 * AC-16.1.13: Empty state when no projects
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProjectSidebar } from '@/components/ai-buddy/project-sidebar';
import type { Project, Conversation } from '@/types/ai-buddy';

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
      />
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
      />
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
      />
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
      />
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
      />
    );

    fireEvent.click(screen.getByTestId('new-project-button'));

    expect(handleNewProject).toHaveBeenCalledTimes(1);
  });

  // Project selection
  it('calls onSelectProject when project clicked', () => {
    const handleSelectProject = vi.fn();

    render(
      <ProjectSidebar
        projects={mockProjects}
        conversations={[]}
        onSelectProject={handleSelectProject}
      />
    );

    fireEvent.click(screen.getByTestId(`project-card-${mockProjects[0].id}`));

    expect(handleSelectProject).toHaveBeenCalledWith(mockProjects[0]);
  });

  // Active project indicator
  it('marks active project', () => {
    render(
      <ProjectSidebar
        projects={mockProjects}
        activeProjectId={mockProjects[0].id}
        conversations={[]}
      />
    );

    const activeCard = screen.getByTestId(`project-card-${mockProjects[0].id}`);
    expect(activeCard.className).toContain('bg-[var(--sidebar-active)]');
  });

  // Conversations section
  it('renders Recent conversations section', () => {
    render(
      <ProjectSidebar
        projects={[]}
        conversations={mockConversations}
      />
    );

    expect(screen.getByText('Recent')).toBeInTheDocument();
    expect(screen.getByText('Chat about coverage')).toBeInTheDocument();
  });

  it('shows empty conversations state', () => {
    render(
      <ProjectSidebar
        projects={[]}
        conversations={[]}
      />
    );

    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });
});
