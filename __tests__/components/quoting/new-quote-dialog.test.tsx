/**
 * @vitest-environment happy-dom
 */
/**
 * NewQuoteDialog Component Tests
 * Story Q2.2: Create New Quote Session
 *
 * Tests for:
 * - AC-Q2.2-1: Dialog with prospect name input and quote type selector
 * - AC-Q2.2-2: Bundle selected as default quote type
 * - AC-Q2.2-4: Validation error for empty prospect name
 * - AC-Q2.2-5: Cancel closes dialog without creating session
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewQuoteDialog } from '@/components/quoting/new-quote-dialog';
import type { QuoteSession } from '@/types/quoting';

const mockSession: QuoteSession = {
  id: 'new-session-123',
  agencyId: 'agency-456',
  userId: 'user-789',
  prospectName: 'Test Prospect',
  quoteType: 'bundle',
  status: 'draft',
  clientData: {},
  createdAt: '2025-12-11T10:00:00Z',
  updatedAt: '2025-12-11T10:00:00Z',
  carrierCount: 0,
};

describe('NewQuoteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-Q2.2-1: Dialog content', () => {
    it('renders dialog with title and description when open', () => {
      render(
        <NewQuoteDialog
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByText('New Quote')).toBeInTheDocument();
      expect(screen.getByText(/Create a quote session/)).toBeInTheDocument();
    });

    it('renders prospect name input field', () => {
      render(
        <NewQuoteDialog
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      const input = screen.getByTestId('prospect-name-input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'e.g., John Smith');
    });

    it('renders quote type selector', () => {
      render(
        <NewQuoteDialog
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      const selectTrigger = screen.getByTestId('quote-type-select');
      expect(selectTrigger).toBeInTheDocument();
      // Default value should be Bundle
      expect(selectTrigger).toHaveTextContent('Bundle');
    });

    it('renders Create Quote and Cancel buttons', () => {
      render(
        <NewQuoteDialog
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByTestId('create-quote-button')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <NewQuoteDialog
          open={false}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.queryByText('New Quote')).not.toBeInTheDocument();
    });
  });

  describe('AC-Q2.2-2: Bundle as default', () => {
    it('has Bundle selected as the default quote type', () => {
      render(
        <NewQuoteDialog
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      const selectTrigger = screen.getByTestId('quote-type-select');
      expect(selectTrigger).toHaveTextContent('Bundle (Home + Auto)');
    });
  });

  describe('AC-Q2.2-4: Validation errors', () => {
    it('shows validation error when submitting with empty prospect name', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <NewQuoteDialog
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={onSubmit}
        />
      );

      const submitButton = screen.getByTestId('create-quote-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('prospect-name-error')).toBeInTheDocument();
        expect(screen.getByTestId('prospect-name-error')).toHaveTextContent('Prospect name is required');
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows validation error when prospect name is less than 2 characters', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <NewQuoteDialog
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={onSubmit}
        />
      );

      const input = screen.getByTestId('prospect-name-input');
      await user.type(input, 'A');

      const submitButton = screen.getByTestId('create-quote-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('prospect-name-error')).toBeInTheDocument();
        expect(screen.getByTestId('prospect-name-error')).toHaveTextContent('at least 2 characters');
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('clears validation error when user types valid input', async () => {
      const user = userEvent.setup();
      render(
        <NewQuoteDialog
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Trigger validation error
      const submitButton = screen.getByTestId('create-quote-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('prospect-name-error')).toBeInTheDocument();
      });

      // Type valid input
      const input = screen.getByTestId('prospect-name-input');
      await user.type(input, 'Valid Name');

      await waitFor(() => {
        expect(screen.queryByTestId('prospect-name-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('AC-Q2.2-5: Cancel functionality', () => {
    it('calls onOpenChange(false) when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(
        <NewQuoteDialog
          open={true}
          onOpenChange={onOpenChange}
        />
      );

      const cancelButton = screen.getByTestId('cancel-button');
      await user.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('does not call onSubmit when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <NewQuoteDialog
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={onSubmit}
        />
      );

      const cancelButton = screen.getByTestId('cancel-button');
      await user.click(cancelButton);

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('resets form when dialog is closed', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const { rerender } = render(
        <NewQuoteDialog
          open={true}
          onOpenChange={onOpenChange}
        />
      );

      // Type something in the input
      const input = screen.getByTestId('prospect-name-input');
      await user.type(input, 'Test Name');

      // Close the dialog
      const cancelButton = screen.getByTestId('cancel-button');
      await user.click(cancelButton);

      // Reopen the dialog
      rerender(
        <NewQuoteDialog
          open={true}
          onOpenChange={onOpenChange}
        />
      );

      // Input should be empty (form reset)
      const newInput = screen.getByTestId('prospect-name-input');
      expect(newInput).toHaveValue('');
    });
  });

  describe('Form submission', () => {
    it('calls onSubmit with form data when valid', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(mockSession);
      const onSessionCreated = vi.fn();
      render(
        <NewQuoteDialog
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={onSubmit}
          onSessionCreated={onSessionCreated}
        />
      );

      const input = screen.getByTestId('prospect-name-input');
      await user.type(input, 'Smith Family');

      const submitButton = screen.getByTestId('create-quote-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          prospectName: 'Smith Family',
          quoteType: 'bundle',
        });
      });
    });

    it('calls onSessionCreated after successful submit', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(mockSession);
      const onSessionCreated = vi.fn();
      const onOpenChange = vi.fn();
      render(
        <NewQuoteDialog
          open={true}
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
          onSessionCreated={onSessionCreated}
        />
      );

      const input = screen.getByTestId('prospect-name-input');
      await user.type(input, 'Smith Family');

      const submitButton = screen.getByTestId('create-quote-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSessionCreated).toHaveBeenCalledWith(mockSession);
      });
    });

    it('closes dialog after successful submit', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(mockSession);
      const onOpenChange = vi.fn();
      render(
        <NewQuoteDialog
          open={true}
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
        />
      );

      const input = screen.getByTestId('prospect-name-input');
      await user.type(input, 'Smith Family');

      const submitButton = screen.getByTestId('create-quote-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('does not close dialog if onSubmit returns null', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(null);
      const onOpenChange = vi.fn();
      render(
        <NewQuoteDialog
          open={true}
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
        />
      );

      const input = screen.getByTestId('prospect-name-input');
      await user.type(input, 'Smith Family');

      const submitButton = screen.getByTestId('create-quote-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      // onOpenChange should not be called with false for closing
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });

    it('submits with default bundle quote type', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(mockSession);
      render(
        <NewQuoteDialog
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={onSubmit}
        />
      );

      // Enter prospect name (quote type is already bundle by default)
      const input = screen.getByTestId('prospect-name-input');
      await user.type(input, 'Bundle Client');

      // Submit
      const submitButton = screen.getByTestId('create-quote-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          prospectName: 'Bundle Client',
          quoteType: 'bundle',
        });
      });
    });
  });

  describe('Loading state', () => {
    it('shows loading spinner during submission', async () => {
      const user = userEvent.setup();
      // Create a promise that doesn't resolve immediately
      let resolveSubmit: (value: QuoteSession) => void;
      const onSubmit = vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveSubmit = resolve;
        })
      );
      render(
        <NewQuoteDialog
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={onSubmit}
        />
      );

      const input = screen.getByTestId('prospect-name-input');
      await user.type(input, 'Smith Family');

      const submitButton = screen.getByTestId('create-quote-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeInTheDocument();
      });

      // Resolve the promise
      resolveSubmit!(mockSession);
    });

    it('disables inputs during loading', async () => {
      render(
        <NewQuoteDialog
          open={true}
          onOpenChange={vi.fn()}
          isLoading={true}
        />
      );

      const input = screen.getByTestId('prospect-name-input');
      const cancelButton = screen.getByTestId('cancel-button');
      const submitButton = screen.getByTestId('create-quote-button');

      expect(input).toBeDisabled();
      expect(cancelButton).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });
});
