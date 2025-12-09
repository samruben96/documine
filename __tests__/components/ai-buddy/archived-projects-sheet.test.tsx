/**
 * @vitest-environment jsdom
 *
 * Archived Projects Sheet Component Tests
 * Story 16.3: Project Management - Rename & Archive
 *
 * AC-16.3.7: "View Archived" link shows archived projects with restore option
 * AC-16.3.8: Restoring project clears archived_at and returns to main list
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArchivedProjectsSheet } from '@/components/ai-buddy/archived-projects-sheet';
import type { Project } from '@/types/ai-buddy';

describe('ArchivedProjectsSheet', () => {
  const mockArchivedProjects: Project[] = [
    {
      id: 'project-1',
      agencyId: 'agency-1',
      userId: 'user-1',
      name: 'Archived Project 1',
      description: 'First archived project',
      archivedAt: '2024-01-10T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-10T00:00:00Z',
      documentCount: 3,
    },
    {
      id: 'project-2',
      agencyId: 'agency-1',
      userId: 'user-1',
      name: 'Archived Project 2',
      description: 'Second archived project',
      archivedAt: '2024-01-12T00:00:00Z',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-12T00:00:00Z',
      documentCount: 0,
    },
  ];

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    archivedProjects: mockArchivedProjects,
    onRestore: vi.fn(),
    isLoading: false,
    restoringProjectId: null,
  };

  it('renders the sheet when open', () => {
    render(<ArchivedProjectsSheet {...defaultProps} />);

    expect(screen.getByTestId('archived-projects-sheet')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ArchivedProjectsSheet {...defaultProps} open={false} />);

    expect(
      screen.queryByTestId('archived-projects-sheet')
    ).not.toBeInTheDocument();
  });

  it('displays the title "Archived Projects"', () => {
    render(<ArchivedProjectsSheet {...defaultProps} />);

    expect(screen.getByText('Archived Projects')).toBeInTheDocument();
  });

  it('shows count of archived projects', () => {
    render(<ArchivedProjectsSheet {...defaultProps} />);

    expect(screen.getByText('2 archived projects')).toBeInTheDocument();
  });

  it('shows singular form for 1 project', () => {
    render(
      <ArchivedProjectsSheet
        {...defaultProps}
        archivedProjects={[mockArchivedProjects[0]]}
      />
    );

    expect(screen.getByText('1 archived project')).toBeInTheDocument();
  });

  it('displays all archived projects', () => {
    render(<ArchivedProjectsSheet {...defaultProps} />);

    expect(screen.getByText('Archived Project 1')).toBeInTheDocument();
    expect(screen.getByText('Archived Project 2')).toBeInTheDocument();
  });

  it('shows archived date for each project', () => {
    render(<ArchivedProjectsSheet {...defaultProps} />);

    // Check that archived dates are displayed (format may vary by locale)
    const archivedTexts = screen.getAllByText(/Archived/i);
    // Should have 2 archived dates (one for each project) plus possibly header
    expect(archivedTexts.length).toBeGreaterThanOrEqual(2);
  });

  it('renders restore button for each project', () => {
    render(<ArchivedProjectsSheet {...defaultProps} />);

    expect(screen.getByTestId('restore-project-project-1')).toBeInTheDocument();
    expect(screen.getByTestId('restore-project-project-2')).toBeInTheDocument();
  });

  it('calls onRestore with project id when Restore is clicked', () => {
    const onRestore = vi.fn();
    render(<ArchivedProjectsSheet {...defaultProps} onRestore={onRestore} />);

    fireEvent.click(screen.getByTestId('restore-project-project-1'));

    expect(onRestore).toHaveBeenCalledWith('project-1');
  });

  it('shows loading state for project being restored', () => {
    render(
      <ArchivedProjectsSheet
        {...defaultProps}
        restoringProjectId="project-1"
      />
    );

    // The restore button for project-1 should show loading state
    const restoreButton = screen.getByTestId('restore-project-project-1');
    expect(restoreButton).toBeDisabled();
  });

  it('disables all restore buttons when isLoading is true', () => {
    render(<ArchivedProjectsSheet {...defaultProps} isLoading={true} />);

    expect(screen.getByTestId('restore-project-project-1')).toBeDisabled();
    expect(screen.getByTestId('restore-project-project-2')).toBeDisabled();
  });

  it('shows empty state when no archived projects', () => {
    render(
      <ArchivedProjectsSheet {...defaultProps} archivedProjects={[]} />
    );

    // Multiple elements can have "No archived projects" - use getAllByText
    const noProjectsElements = screen.getAllByText('No archived projects');
    expect(noProjectsElements.length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText('Archived projects will appear here')
    ).toBeInTheDocument();
  });
});
