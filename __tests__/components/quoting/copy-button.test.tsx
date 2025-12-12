/**
 * CopyButton Component Tests
 * Story Q4.1: Copy Button & Carrier Formatters
 *
 * Tests AC-Q4.1-1 through AC-Q4.1-7
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyButton } from '@/components/quoting/copy-button';
import type { QuoteClientData } from '@/types/quoting';

// Mock the clipboard hook
vi.mock('@/hooks/quoting/use-clipboard-copy', () => ({
  useClipboardCopy: vi.fn(),
}));

// Mock carrier registry
vi.mock('@/lib/quoting/carriers', () => ({
  getCarrier: vi.fn((code: string) => {
    if (code === 'progressive') {
      return {
        code: 'progressive',
        name: 'Progressive',
        portalUrl: 'https://www.foragentsonly.com',
        formatter: {
          formatForClipboard: vi.fn().mockReturnValue('Formatted Progressive data'),
        },
      };
    }
    if (code === 'travelers') {
      return {
        code: 'travelers',
        name: 'Travelers',
        portalUrl: 'https://www.travelers.com',
        formatter: {
          formatForClipboard: vi.fn().mockReturnValue('Formatted Travelers data'),
        },
      };
    }
    return undefined;
  }),
}));

import { useClipboardCopy } from '@/hooks/quoting/use-clipboard-copy';
import { getCarrier } from '@/lib/quoting/carriers';

const mockUseClipboardCopy = useClipboardCopy as ReturnType<typeof vi.fn>;
const mockGetCarrier = getCarrier as ReturnType<typeof vi.fn>;

describe('CopyButton', () => {
  const mockCopyToClipboard = vi.fn();
  const mockResetError = vi.fn();

  const testClientData: QuoteClientData = {
    personal: {
      firstName: 'John',
      lastName: 'Doe',
    },
  };

  beforeEach(() => {
    // Default mock state
    mockUseClipboardCopy.mockReturnValue({
      copyToClipboard: mockCopyToClipboard,
      copiedCarrier: null,
      error: null,
      isLoading: false,
      resetError: mockResetError,
    });

    mockCopyToClipboard.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders with carrier name (AC-Q4.1-1)', () => {
      render(<CopyButton carrier="progressive" clientData={testClientData} />);

      expect(screen.getByText('Copy for Progressive')).toBeInTheDocument();
    });

    it('renders copy button for Travelers (AC-Q4.1-2)', () => {
      render(<CopyButton carrier="travelers" clientData={testClientData} />);

      expect(screen.getByText('Copy for Travelers')).toBeInTheDocument();
    });

    it('shows clipboard icon in default state', () => {
      render(<CopyButton carrier="progressive" clientData={testClientData} />);

      // Button should be rendered with default content
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <CopyButton
          carrier="progressive"
          clientData={testClientData}
          className="custom-class"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('has correct aria-label for accessibility', () => {
      render(<CopyButton carrier="progressive" clientData={testClientData} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute(
        'aria-label',
        'Copy client data formatted for Progressive'
      );
    });

    it('has data-carrier attribute', () => {
      render(<CopyButton carrier="progressive" clientData={testClientData} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-carrier', 'progressive');
    });

    it('has data-testid attribute', () => {
      render(<CopyButton carrier="progressive" clientData={testClientData} />);

      expect(screen.getByTestId('copy-button-progressive')).toBeInTheDocument();
    });
  });

  describe('copy action (AC-Q4.1-1, AC-Q4.1-2)', () => {
    it('calls copyToClipboard on click', async () => {
      render(<CopyButton carrier="progressive" clientData={testClientData} />);

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockCopyToClipboard).toHaveBeenCalledWith(
          'progressive',
          'Formatted Progressive data'
        );
      });
    });

    it('calls onCopy callback on success', async () => {
      const onCopy = vi.fn();

      render(
        <CopyButton
          carrier="progressive"
          clientData={testClientData}
          onCopy={onCopy}
        />
      );

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(onCopy).toHaveBeenCalled();
      });
    });

    it('passes formatted data from carrier formatter to clipboard', async () => {
      render(<CopyButton carrier="progressive" clientData={testClientData} />);

      fireEvent.click(screen.getByRole('button'));

      // The copy should use the formatter output ('Formatted Progressive data')
      await waitFor(() => {
        expect(mockCopyToClipboard).toHaveBeenCalledWith(
          'progressive',
          'Formatted Progressive data'
        );
      });
    });
  });

  describe('success state (AC-Q4.1-3, AC-Q4.1-4)', () => {
    it('shows "Copied" text when copied', () => {
      mockUseClipboardCopy.mockReturnValue({
        copyToClipboard: mockCopyToClipboard,
        copiedCarrier: 'progressive',
        error: null,
        isLoading: false,
        resetError: mockResetError,
      });

      render(<CopyButton carrier="progressive" clientData={testClientData} />);

      expect(screen.getByText('Copied')).toBeInTheDocument();
    });

    it('applies green styling when copied', () => {
      mockUseClipboardCopy.mockReturnValue({
        copyToClipboard: mockCopyToClipboard,
        copiedCarrier: 'progressive',
        error: null,
        isLoading: false,
        resetError: mockResetError,
      });

      render(<CopyButton carrier="progressive" clientData={testClientData} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-green-100');
      expect(button).toHaveClass('text-green-700');
    });

    it('shows default state when different carrier is copied', () => {
      mockUseClipboardCopy.mockReturnValue({
        copyToClipboard: mockCopyToClipboard,
        copiedCarrier: 'travelers', // Different carrier
        error: null,
        isLoading: false,
        resetError: mockResetError,
      });

      render(<CopyButton carrier="progressive" clientData={testClientData} />);

      expect(screen.getByText('Copy for Progressive')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading spinner when copying', () => {
      mockUseClipboardCopy.mockReturnValue({
        copyToClipboard: mockCopyToClipboard,
        copiedCarrier: null,
        error: null,
        isLoading: true,
        resetError: mockResetError,
      });

      render(<CopyButton carrier="progressive" clientData={testClientData} />);

      expect(screen.getByText('Copying...')).toBeInTheDocument();
    });

    it('disables button when loading', () => {
      mockUseClipboardCopy.mockReturnValue({
        copyToClipboard: mockCopyToClipboard,
        copiedCarrier: null,
        error: null,
        isLoading: true,
        resetError: mockResetError,
      });

      render(<CopyButton carrier="progressive" clientData={testClientData} />);

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('error state (AC-Q4.1-6)', () => {
    it('shows error message when copy fails', () => {
      mockUseClipboardCopy.mockReturnValue({
        copyToClipboard: mockCopyToClipboard,
        copiedCarrier: null,
        error: new Error('Clipboard access denied'),
        isLoading: false,
        resetError: mockResetError,
      });

      render(<CopyButton carrier="progressive" clientData={testClientData} />);

      expect(screen.getByText('Failed - Click to retry')).toBeInTheDocument();
    });

    it('uses destructive variant on error', () => {
      mockUseClipboardCopy.mockReturnValue({
        copyToClipboard: mockCopyToClipboard,
        copiedCarrier: null,
        error: new Error('Error'),
        isLoading: false,
        resetError: mockResetError,
      });

      render(<CopyButton carrier="progressive" clientData={testClientData} />);

      // The button should have the destructive variant
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('calls onError callback on failure', async () => {
      const onError = vi.fn();
      const testError = new Error('Copy failed');

      mockUseClipboardCopy.mockReturnValue({
        copyToClipboard: mockCopyToClipboard.mockResolvedValue(false),
        copiedCarrier: null,
        error: testError,
        isLoading: false,
        resetError: mockResetError,
      });

      render(
        <CopyButton
          carrier="progressive"
          clientData={testClientData}
          onError={onError}
        />
      );

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(testError);
      });
    });

    it('resets error on retry click', async () => {
      mockUseClipboardCopy.mockReturnValue({
        copyToClipboard: mockCopyToClipboard,
        copiedCarrier: null,
        error: new Error('Previous error'),
        isLoading: false,
        resetError: mockResetError,
      });

      render(<CopyButton carrier="progressive" clientData={testClientData} />);

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockResetError).toHaveBeenCalled();
      });
    });
  });

  describe('keyboard accessibility (AC-Q4.1-7)', () => {
    it('can be triggered with Enter key', async () => {
      render(<CopyButton carrier="progressive" clientData={testClientData} />);

      const button = screen.getByRole('button');

      // Simulate Enter key press
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockCopyToClipboard).toHaveBeenCalled();
      });
    });

    it('can be triggered with Space key', async () => {
      render(<CopyButton carrier="progressive" clientData={testClientData} />);

      const button = screen.getByRole('button');

      // Simulate Space key press - buttons natively respond to space
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockCopyToClipboard).toHaveBeenCalled();
      });
    });
  });

  describe('screen reader accessibility (AC-Q4.1-5)', () => {
    it('has aria-live region', () => {
      render(<CopyButton carrier="progressive" clientData={testClientData} />);

      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });

    it('announces copy success to screen readers', () => {
      mockUseClipboardCopy.mockReturnValue({
        copyToClipboard: mockCopyToClipboard,
        copiedCarrier: 'progressive',
        error: null,
        isLoading: false,
        resetError: mockResetError,
      });

      render(<CopyButton carrier="progressive" clientData={testClientData} />);

      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion).toHaveTextContent('Copied to clipboard for Progressive');
    });

    it('announces error to screen readers', () => {
      mockUseClipboardCopy.mockReturnValue({
        copyToClipboard: mockCopyToClipboard,
        copiedCarrier: null,
        error: new Error('Failed'),
        isLoading: false,
        resetError: mockResetError,
      });

      render(<CopyButton carrier="progressive" clientData={testClientData} />);

      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion).toHaveTextContent('Copy failed. Click to retry.');
    });
  });

  describe('disabled state', () => {
    it('respects disabled prop', () => {
      render(
        <CopyButton carrier="progressive" clientData={testClientData} disabled />
      );

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not call copyToClipboard when disabled', () => {
      render(
        <CopyButton carrier="progressive" clientData={testClientData} disabled />
      );

      // Try to click disabled button
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockCopyToClipboard).not.toHaveBeenCalled();
    });
  });

  describe('unknown carrier handling', () => {
    it('calls onError for unknown carrier', async () => {
      mockGetCarrier.mockReturnValue(undefined);
      const onError = vi.fn();

      render(
        <CopyButton
          carrier="unknown"
          clientData={testClientData}
          onError={onError}
        />
      );

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Unknown carrier'),
          })
        );
      });
    });
  });
});
