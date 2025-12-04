/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnePagerForm } from '@/components/one-pager/one-pager-form';

/**
 * OnePagerForm Component Tests
 * Story 9.3: AC-9.3.5 (client name), AC-9.3.6 (agent notes), AC-9.3.7 (debounced updates)
 */

describe('OnePagerForm', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('AC-9.3.5: renders client name input', () => {
      render(<OnePagerForm onChange={mockOnChange} />);

      expect(screen.getByTestId('client-name-input')).toBeInTheDocument();
      expect(screen.getByText('Client Name')).toBeInTheDocument();
    });

    it('AC-9.3.6: renders agent notes textarea', () => {
      render(<OnePagerForm onChange={mockOnChange} />);

      expect(screen.getByTestId('agent-notes-input')).toBeInTheDocument();
      expect(screen.getByText('Agent Notes')).toBeInTheDocument();
      expect(screen.getByText('(optional)')).toBeInTheDocument();
    });

    it('AC-9.3.5: pre-populates client name from defaultClientName', () => {
      render(
        <OnePagerForm
          defaultClientName="Acme Corp"
          onChange={mockOnChange}
        />
      );

      const input = screen.getByTestId('client-name-input');
      expect(input).toHaveValue('Acme Corp');
    });

    it('AC-9.3.6: shows character count for agent notes', () => {
      render(<OnePagerForm onChange={mockOnChange} />);

      expect(screen.getByText('0/500')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('AC-9.3.5: client name is required', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<OnePagerForm onChange={mockOnChange} />);

      const input = screen.getByTestId('client-name-input');
      // Type something then clear it to trigger validation
      await user.type(input, 'a');
      await user.clear(input);

      await waitFor(() => {
        expect(screen.getByText('Client name is required')).toBeInTheDocument();
      });
    });

    it('AC-9.3.5: client name max 100 characters', async () => {
      render(<OnePagerForm onChange={mockOnChange} />);

      const input = screen.getByTestId('client-name-input');
      expect(input).toHaveAttribute('maxLength', '100');
    });

    it('AC-9.3.6: agent notes max 500 characters', async () => {
      render(<OnePagerForm onChange={mockOnChange} />);

      const textarea = screen.getByTestId('agent-notes-input');
      expect(textarea).toHaveAttribute('maxLength', '500');
    });
  });

  describe('Character Counter', () => {
    it('updates character count as user types', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<OnePagerForm onChange={mockOnChange} />);

      const textarea = screen.getByTestId('agent-notes-input');
      await user.type(textarea, 'Hello World');

      expect(screen.getByText('11/500')).toBeInTheDocument();
    });

    it('shows warning color when approaching limit (>450)', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<OnePagerForm onChange={mockOnChange} />);

      const textarea = screen.getByTestId('agent-notes-input');
      const longText = 'a'.repeat(455);
      await user.type(textarea, longText);

      const counter = screen.getByText('455/500');
      expect(counter).toHaveClass('text-amber-600');
    });
  });

  describe('Debounced onChange', () => {
    it('AC-9.3.7: calls onChange after debounce delay', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(
        <OnePagerForm
          onChange={mockOnChange}
          debounceMs={300}
        />
      );

      const clientInput = screen.getByTestId('client-name-input');
      await user.type(clientInput, 'Test Client');

      // Should not be called immediately
      expect(mockOnChange).not.toHaveBeenCalled();

      // Advance time past debounce
      vi.advanceTimersByTime(350);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('AC-9.3.7: only fires once after rapid typing', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(
        <OnePagerForm
          onChange={mockOnChange}
          debounceMs={300}
        />
      );

      const clientInput = screen.getByTestId('client-name-input');

      // Rapid typing
      await user.type(clientInput, 'A');
      vi.advanceTimersByTime(100);
      await user.type(clientInput, 'B');
      vi.advanceTimersByTime(100);
      await user.type(clientInput, 'C');
      vi.advanceTimersByTime(100);

      // Still shouldn't be called
      expect(mockOnChange).not.toHaveBeenCalled();

      // Now wait for debounce
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Form Data', () => {
    it('includes both client name and agent notes in onChange', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(
        <OnePagerForm
          onChange={mockOnChange}
          debounceMs={300}
        />
      );

      const clientInput = screen.getByTestId('client-name-input');
      const notesInput = screen.getByTestId('agent-notes-input');

      await user.type(clientInput, 'Test Client');
      await user.type(notesInput, 'Some notes');

      vi.advanceTimersByTime(350);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            clientName: 'Test Client',
            agentNotes: 'Some notes',
          })
        );
      });
    });
  });
});
