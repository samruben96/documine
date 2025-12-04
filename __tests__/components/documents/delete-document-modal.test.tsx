/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteDocumentModal } from '@/components/documents/delete-document-modal';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the server action
const mockDeleteDocumentAction = vi.fn();
vi.mock('@/app/(dashboard)/chat-docs/actions', () => ({
  deleteDocumentAction: (id: string) => mockDeleteDocumentAction(id),
}));

describe('DeleteDocumentModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    document: {
      id: 'test-doc-id',
      filename: 'test-document.pdf',
      display_name: null,
    },
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteDocumentAction.mockResolvedValue({ success: true });
  });

  describe('AC-4.4.2: Confirmation Modal Title', () => {
    it('displays modal title with filename', () => {
      render(<DeleteDocumentModal {...defaultProps} />);

      expect(screen.getByText('Delete test-document.pdf?')).toBeInTheDocument();
    });

    it('displays modal title with display_name when set', () => {
      render(
        <DeleteDocumentModal
          {...defaultProps}
          document={{
            id: 'test-doc-id',
            filename: 'test-document.pdf',
            display_name: 'My Custom Name',
          }}
        />
      );

      expect(screen.getByText('Delete My Custom Name?')).toBeInTheDocument();
    });
  });

  describe('AC-4.4.3: Confirmation Modal Body', () => {
    it('displays warning message about permanent deletion', () => {
      render(<DeleteDocumentModal {...defaultProps} />);

      expect(
        screen.getByText(/This will permanently delete the document and all conversations about it/)
      ).toBeInTheDocument();
      expect(screen.getByText(/This cannot be undone/)).toBeInTheDocument();
    });
  });

  describe('AC-4.4.4: Confirmation Modal Buttons', () => {
    it('displays Cancel button', () => {
      render(<DeleteDocumentModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('displays Delete button', () => {
      render(<DeleteDocumentModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('Cancel button closes modal without action', () => {
      const onOpenChange = vi.fn();
      render(<DeleteDocumentModal {...defaultProps} onOpenChange={onOpenChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(mockDeleteDocumentAction).not.toHaveBeenCalled();
    });

    it('Delete button shows loading state during deletion', async () => {
      // Make the action take time
      mockDeleteDocumentAction.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      render(<DeleteDocumentModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Deleting...' })).toBeInTheDocument();
      });
    });
  });

  describe('deletion flow', () => {
    it('calls deleteDocumentAction with document ID on confirm', async () => {
      render(<DeleteDocumentModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(mockDeleteDocumentAction).toHaveBeenCalledWith('test-doc-id');
      });
    });

    it('calls onSuccess callback on successful deletion', async () => {
      const onSuccess = vi.fn();
      render(<DeleteDocumentModal {...defaultProps} onSuccess={onSuccess} />);

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('closes modal on successful deletion', async () => {
      const onOpenChange = vi.fn();
      render(<DeleteDocumentModal {...defaultProps} onOpenChange={onOpenChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('does not call onSuccess on failed deletion', async () => {
      mockDeleteDocumentAction.mockResolvedValue({ success: false, error: 'Delete failed' });
      const onSuccess = vi.fn();
      render(<DeleteDocumentModal {...defaultProps} onSuccess={onSuccess} />);

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(mockDeleteDocumentAction).toHaveBeenCalled();
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('null document handling', () => {
    it('handles null document gracefully', () => {
      render(<DeleteDocumentModal {...defaultProps} document={null} />);

      expect(screen.getByText('Delete this document?')).toBeInTheDocument();
    });
  });
});
