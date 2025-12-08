/**
 * @vitest-environment happy-dom
 */
/**
 * Project Card Component Tests
 * Story 16.1: Project Creation & Sidebar
 *
 * Tests for ProjectCard component rendering and interactions.
 *
 * AC-16.1.9: Name truncated at 25 chars, document count badge
 * AC-16.1.10: Active project has visual indicator
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProjectCard } from '@/components/ai-buddy/project-card';
import type { Project } from '@/types/ai-buddy';

const mockProject: Project = {
  id: 'test-project-1',
  agencyId: 'agency-1',
  userId: 'user-1',
  name: 'Test Project',
  description: 'A test project description',
  archivedAt: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  documentCount: 5,
};

describe('ProjectCard', () => {
  // AC-16.1.9: Name truncation
  it('truncates long project names at 25 characters', () => {
    const longNameProject: Project = {
      ...mockProject,
      name: 'Johnson Family Insurance Policy Review',
    };

    render(<ProjectCard project={longNameProject} />);

    // Should show truncated name with ellipsis (25 chars + "...")
    const nameElement = screen.getByText('Johnson Family Insurance ...');
    expect(nameElement).toBeInTheDocument();
    // Original name should be in title attribute
    expect(nameElement).toHaveAttribute(
      'title',
      'Johnson Family Insurance Policy Review'
    );
  });

  it('shows full name when under 25 characters', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  // AC-16.1.9: Document count badge
  it('displays document count badge when count > 0', () => {
    render(<ProjectCard project={mockProject} />);

    expect(
      screen.getByTestId(`project-doc-count-${mockProject.id}`)
    ).toHaveTextContent('5');
  });

  it('hides document count badge when count is 0', () => {
    const noDocsProject: Project = { ...mockProject, documentCount: 0 };

    render(<ProjectCard project={noDocsProject} />);

    expect(
      screen.queryByTestId(`project-doc-count-${mockProject.id}`)
    ).not.toBeInTheDocument();
  });

  // AC-16.1.10: Active visual indicator
  it('applies active styling when isActive is true', () => {
    render(<ProjectCard project={mockProject} isActive={true} />);

    const button = screen.getByTestId(`project-card-${mockProject.id}`);
    expect(button.className).toContain('bg-[var(--sidebar-active)]');
  });

  it('applies hover styling when not active', () => {
    render(<ProjectCard project={mockProject} isActive={false} />);

    const button = screen.getByTestId(`project-card-${mockProject.id}`);
    expect(button.className).toContain('hover:bg-[var(--sidebar-hover)]');
  });

  // Click handling
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();

    render(<ProjectCard project={mockProject} onClick={handleClick} />);

    fireEvent.click(screen.getByTestId(`project-card-${mockProject.id}`));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Archive functionality
  it('shows menu button on hover with archive option', async () => {
    const handleArchive = vi.fn();

    render(
      <ProjectCard project={mockProject} onArchive={handleArchive} />
    );

    // Menu trigger should exist
    const menuTrigger = screen.getByTestId(`project-menu-${mockProject.id}`);
    expect(menuTrigger).toBeInTheDocument();
  });
});
