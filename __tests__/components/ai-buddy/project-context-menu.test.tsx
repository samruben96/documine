/**
 * @vitest-environment jsdom
 *
 * Project Context Menu Component Tests
 * Story 16.3: Project Management - Rename & Archive
 *
 * AC-16.3.1: Right-click on project card shows context menu with "Rename" and "Archive" options
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectContextMenu } from '@/components/ai-buddy/project-context-menu';
import type { Project } from '@/types/ai-buddy';

describe('ProjectContextMenu', () => {
  const mockProject: Project = {
    id: 'project-1',
    agencyId: 'agency-1',
    userId: 'user-1',
    name: 'Test Project',
    description: 'Test description',
    archivedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    documentCount: 0,
  };

  const defaultProps = {
    project: mockProject,
    onRename: vi.fn(),
    onArchive: vi.fn(),
  };

  it('renders children', () => {
    render(
      <ProjectContextMenu {...defaultProps}>
        <button data-testid="child-button">Click me</button>
      </ProjectContextMenu>
    );

    expect(screen.getByTestId('child-button')).toBeInTheDocument();
  });

  it('has context menu trigger with correct testid', () => {
    render(
      <ProjectContextMenu {...defaultProps}>
        <button>Click me</button>
      </ProjectContextMenu>
    );

    expect(
      screen.getByTestId(`project-context-trigger-${mockProject.id}`)
    ).toBeInTheDocument();
  });

  it('shows Rename and Archive options when context menu is opened', async () => {
    render(
      <ProjectContextMenu {...defaultProps}>
        <button>Click me</button>
      </ProjectContextMenu>
    );

    const trigger = screen.getByTestId(`project-context-trigger-${mockProject.id}`);

    // Simulate right-click (context menu event)
    fireEvent.contextMenu(trigger);

    // Wait for context menu to appear
    expect(await screen.findByTestId('context-menu-rename')).toBeInTheDocument();
    expect(screen.getByTestId('context-menu-archive')).toBeInTheDocument();
  });

  it('calls onRename when Rename is clicked', async () => {
    const onRename = vi.fn();
    render(
      <ProjectContextMenu {...defaultProps} onRename={onRename}>
        <button>Click me</button>
      </ProjectContextMenu>
    );

    const trigger = screen.getByTestId(`project-context-trigger-${mockProject.id}`);
    fireEvent.contextMenu(trigger);

    const renameItem = await screen.findByTestId('context-menu-rename');
    fireEvent.click(renameItem);

    expect(onRename).toHaveBeenCalled();
  });

  it('calls onArchive when Archive is clicked', async () => {
    const onArchive = vi.fn();
    render(
      <ProjectContextMenu {...defaultProps} onArchive={onArchive}>
        <button>Click me</button>
      </ProjectContextMenu>
    );

    const trigger = screen.getByTestId(`project-context-trigger-${mockProject.id}`);
    fireEvent.contextMenu(trigger);

    const archiveItem = await screen.findByTestId('context-menu-archive');
    fireEvent.click(archiveItem);

    expect(onArchive).toHaveBeenCalled();
  });

  it('does not show context menu when disabled', () => {
    render(
      <ProjectContextMenu {...defaultProps} disabled>
        <button data-testid="child-button">Click me</button>
      </ProjectContextMenu>
    );

    // Context trigger should not be present when disabled
    expect(
      screen.queryByTestId(`project-context-trigger-${mockProject.id}`)
    ).not.toBeInTheDocument();

    // Child should still be rendered
    expect(screen.getByTestId('child-button')).toBeInTheDocument();
  });
});
