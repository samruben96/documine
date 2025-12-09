/**
 * @vitest-environment happy-dom
 */
/**
 * Add Document Menu Component Tests
 * Story 17.2: Project Document Management
 *
 * Tests for AddDocumentMenu dropdown component.
 *
 * AC-17.2.1: Add Document shows "Upload New" and "Select from Library" options
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AddDocumentMenu } from '@/components/ai-buddy/documents/add-document-menu';

describe('AddDocumentMenu', () => {
  it('renders the add document button', () => {
    render(
      <AddDocumentMenu
        onUpload={vi.fn()}
        onSelectFromLibrary={vi.fn()}
        remainingSlots={25}
      />
    );

    expect(screen.getByTestId('add-document-button')).toBeInTheDocument();
  });

  it('button shows Add text', () => {
    render(
      <AddDocumentMenu
        onUpload={vi.fn()}
        onSelectFromLibrary={vi.fn()}
        remainingSlots={25}
      />
    );

    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  it('disables button when disabled prop is true', () => {
    render(
      <AddDocumentMenu
        onUpload={vi.fn()}
        onSelectFromLibrary={vi.fn()}
        remainingSlots={25}
        disabled={true}
      />
    );

    const button = screen.getByTestId('add-document-button');
    expect(button).toBeDisabled();
  });

  it('disables button when remainingSlots is 0', () => {
    render(
      <AddDocumentMenu
        onUpload={vi.fn()}
        onSelectFromLibrary={vi.fn()}
        remainingSlots={0}
      />
    );

    const button = screen.getByTestId('add-document-button');
    expect(button).toBeDisabled();
  });

  it('enables button when remainingSlots > 0', () => {
    render(
      <AddDocumentMenu
        onUpload={vi.fn()}
        onSelectFromLibrary={vi.fn()}
        remainingSlots={15}
      />
    );

    const button = screen.getByTestId('add-document-button');
    expect(button).not.toBeDisabled();
  });

  it('includes hidden file input for uploads', () => {
    render(
      <AddDocumentMenu
        onUpload={vi.fn()}
        onSelectFromLibrary={vi.fn()}
        remainingSlots={25}
      />
    );

    const fileInput = screen.getByTestId('hidden-file-input');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('multiple');
    expect(fileInput).toHaveAttribute('accept', '.pdf,.png,.jpg,.jpeg');
  });
});
