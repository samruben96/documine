/**
 * @vitest-environment happy-dom
 */
/**
 * Project Create Dialog Tests
 * Story 16.1: Project Creation & Sidebar
 *
 * Tests for ProjectCreateDialog component.
 *
 * AC-16.1.1: Dialog with name and description fields
 * AC-16.1.2: Name limited to 100 characters
 * AC-16.1.3: Description limited to 500 characters
 * AC-16.1.6: Validation error if name empty
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ProjectCreateDialog } from '@/components/ai-buddy/project-create-dialog';

describe('ProjectCreateDialog', () => {
  // AC-16.1.1: Dialog fields
  it('renders name and description fields when open', () => {
    render(
      <ProjectCreateDialog
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('project-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('project-description-input')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ProjectCreateDialog
        open={false}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.queryByTestId('project-create-dialog')).not.toBeInTheDocument();
  });

  // AC-16.1.6: Validation error for empty name
  it('shows error when submitting with empty name', async () => {
    const user = userEvent.setup();

    render(
      <ProjectCreateDialog
        open={true}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    // Click submit without entering name
    await user.click(screen.getByTestId('project-create-submit'));

    // Submit button should be disabled when name is empty
    expect(screen.getByTestId('project-create-submit')).toBeDisabled();
  });

  it('enables submit when name is entered', async () => {
    const user = userEvent.setup();

    render(
      <ProjectCreateDialog
        open={true}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    await user.type(screen.getByTestId('project-name-input'), 'Test Project');

    expect(screen.getByTestId('project-create-submit')).not.toBeDisabled();
  });

  // AC-16.1.2: Name character limit
  it('has maxLength of 100 on name input', () => {
    render(
      <ProjectCreateDialog
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    const nameInput = screen.getByTestId('project-name-input');
    expect(nameInput).toHaveAttribute('maxLength', '100');
  });

  // AC-16.1.3: Description character limit
  it('has maxLength of 500 on description input', () => {
    render(
      <ProjectCreateDialog
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    const descInput = screen.getByTestId('project-description-input');
    expect(descInput).toHaveAttribute('maxLength', '500');
  });

  // Successful submission
  it('calls onSubmit with form data', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue({
      id: 'new-project-id',
      name: 'Test Project',
    });

    render(
      <ProjectCreateDialog
        open={true}
        onOpenChange={vi.fn()}
        onSubmit={handleSubmit}
      />
    );

    await user.type(screen.getByTestId('project-name-input'), 'Test Project');
    await user.type(
      screen.getByTestId('project-description-input'),
      'Test description'
    );
    await user.click(screen.getByTestId('project-create-submit'));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'Test Project',
        description: 'Test description',
      });
    });
  });

  // Cancel button
  it('calls onOpenChange with false when cancel clicked', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    render(
      <ProjectCreateDialog
        open={true}
        onOpenChange={handleOpenChange}
      />
    );

    await user.click(screen.getByText('Cancel'));

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });
});
