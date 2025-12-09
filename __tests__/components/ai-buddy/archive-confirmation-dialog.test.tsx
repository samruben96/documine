/**
 * @vitest-environment jsdom
 *
 * Archive Confirmation Dialog Component Tests
 * Story 16.3: Project Management - Rename & Archive
 *
 * AC-16.3.5: Archive shows confirmation dialog "Archive [Project Name]?"
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArchiveConfirmationDialog } from '@/components/ai-buddy/archive-confirmation-dialog';
import type { Project } from '@/types/ai-buddy';

describe('ArchiveConfirmationDialog', () => {
  const mockProject: Project = {
    id: 'project-1',
    agencyId: 'agency-1',
    userId: 'user-1',
    name: 'Test Project',
    description: 'Test description',
    archivedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    documentCount: 5,
  };

  const defaultProps = {
    project: mockProject,
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    isLoading: false,
  };

  it('renders the dialog when open', () => {
    render(<ArchiveConfirmationDialog {...defaultProps} />);

    expect(screen.getByTestId('archive-confirmation-dialog')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ArchiveConfirmationDialog {...defaultProps} open={false} />);

    expect(
      screen.queryByTestId('archive-confirmation-dialog')
    ).not.toBeInTheDocument();
  });

  it('displays the project name in the title', () => {
    render(<ArchiveConfirmationDialog {...defaultProps} />);

    expect(screen.getByText(`Archive ${mockProject.name}?`)).toBeInTheDocument();
  });

  it('shows informative description about archiving', () => {
    render(<ArchiveConfirmationDialog {...defaultProps} />);

    expect(
      screen.getByText(/will be moved to your archived projects/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/you can restore it at any time/i)
    ).toBeInTheDocument();
  });

  it('calls onConfirm with project id when Archive button is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <ArchiveConfirmationDialog {...defaultProps} onConfirm={onConfirm} />
    );

    fireEvent.click(screen.getByTestId('archive-confirm-button'));

    expect(onConfirm).toHaveBeenCalledWith(mockProject.id);
  });

  it('calls onOpenChange with false when Cancel is clicked', () => {
    const onOpenChange = vi.fn();
    render(
      <ArchiveConfirmationDialog {...defaultProps} onOpenChange={onOpenChange} />
    );

    fireEvent.click(screen.getByTestId('archive-cancel-button'));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables buttons when isLoading is true', () => {
    render(<ArchiveConfirmationDialog {...defaultProps} isLoading={true} />);

    expect(screen.getByTestId('archive-confirm-button')).toBeDisabled();
    expect(screen.getByTestId('archive-cancel-button')).toBeDisabled();
  });

  it('shows "Archiving..." text when isLoading is true', () => {
    render(<ArchiveConfirmationDialog {...defaultProps} isLoading={true} />);

    expect(screen.getByText('Archiving...')).toBeInTheDocument();
  });

  it('shows "Archive" text when isLoading is false', () => {
    render(<ArchiveConfirmationDialog {...defaultProps} isLoading={false} />);

    expect(screen.getByTestId('archive-confirm-button')).toHaveTextContent(
      'Archive'
    );
  });

  it('handles null project gracefully', () => {
    render(<ArchiveConfirmationDialog {...defaultProps} project={null} />);

    expect(screen.getByText('Archive Project?')).toBeInTheDocument();
  });
});
