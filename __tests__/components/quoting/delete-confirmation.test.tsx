/**
 * @vitest-environment happy-dom
 */
/**
 * Delete Confirmation Dialog Tests
 * Story Q2.5: Delete and Duplicate Quote Sessions
 *
 * Tests for:
 * - AC-Q2.5-1: Dialog displays "Delete this quote session? This cannot be undone."
 * - AC-Q2.5-3: Confirmation triggers delete callback, cancel closes without action
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * Simulates the delete confirmation dialog from QuotingPage
 */
function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this quote session?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone. All associated quote results will also be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

describe('Delete Confirmation Dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-Q2.5-1: Dialog displays correct message', () => {
    it('displays title "Delete this quote session?"', () => {
      render(
        <DeleteConfirmationDialog
          open={true}
          onOpenChange={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      expect(screen.getByText('Delete this quote session?')).toBeInTheDocument();
    });

    it('displays description with "This cannot be undone"', () => {
      render(
        <DeleteConfirmationDialog
          open={true}
          onOpenChange={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      expect(screen.getByText(/This cannot be undone/)).toBeInTheDocument();
    });

    it('mentions quote results will also be deleted', () => {
      render(
        <DeleteConfirmationDialog
          open={true}
          onOpenChange={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      expect(screen.getByText(/All associated quote results will also be deleted/)).toBeInTheDocument();
    });
  });

  describe('AC-Q2.5-3: Confirmation and cancel behavior', () => {
    it('calls onConfirm when Delete button is clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();

      render(
        <DeleteConfirmationDialog
          open={true}
          onOpenChange={vi.fn()}
          onConfirm={onConfirm}
        />
      );

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(deleteButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onOpenChange(false) when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <DeleteConfirmationDialog
          open={true}
          onOpenChange={onOpenChange}
          onConfirm={vi.fn()}
        />
      );

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('does not call onConfirm when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();

      render(
        <DeleteConfirmationDialog
          open={true}
          onOpenChange={vi.fn()}
          onConfirm={onConfirm}
        />
      );

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('does not render when open is false', () => {
      render(
        <DeleteConfirmationDialog
          open={false}
          onOpenChange={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      expect(screen.queryByText('Delete this quote session?')).not.toBeInTheDocument();
    });
  });

  describe('Dialog styling', () => {
    it('renders Delete button with destructive styling', () => {
      render(
        <DeleteConfirmationDialog
          open={true}
          onOpenChange={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      expect(deleteButton).toHaveClass('bg-destructive');
    });
  });
});
