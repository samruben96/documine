/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExtractionStatusBadge } from '@/components/documents/extraction-status-badge';
import type { ExtractionStatus } from '@/types';

// Mock Radix Tooltip to avoid testing portal behavior
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? <>{children}</> : <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}));

describe('ExtractionStatusBadge', () => {
  describe('Status States Display (AC-11.8.2)', () => {
    it('renders pending status with Loader2 icon and "Queued" label', () => {
      render(<ExtractionStatusBadge status="pending" />);

      const badge = screen.getByTestId('extraction-status-pending');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Queued');
    });

    it('renders extracting status with spinning Loader2 icon and "Analyzing..." label', () => {
      render(<ExtractionStatusBadge status="extracting" />);

      const badge = screen.getByTestId('extraction-status-extracting');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Analyzing...');

      // Check for spinning animation class on icon
      const icon = badge.querySelector('svg');
      expect(icon).toHaveClass('animate-spin');
    });

    it('renders complete status with CheckCheck icon and "Fully Analyzed" label', () => {
      render(<ExtractionStatusBadge status="complete" />);

      const badge = screen.getByTestId('extraction-status-complete');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Fully Analyzed');
    });

    it('renders failed status with AlertTriangle icon and "Analysis Failed" label', () => {
      render(<ExtractionStatusBadge status="failed" />);

      const badge = screen.getByTestId('extraction-status-failed');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Analysis Failed');
    });

    it('renders skipped status with Check icon and "Ready" label', () => {
      render(<ExtractionStatusBadge status="skipped" />);

      const badge = screen.getByTestId('extraction-status-skipped');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Ready');
    });

    it('handles null status by defaulting to pending', () => {
      render(<ExtractionStatusBadge status={null} />);

      const badge = screen.getByTestId('extraction-status-pending');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Queued');
    });
  });

  describe('Tooltip Explanations (AC-11.8.4)', () => {
    it.each([
      ['pending', 'This document is ready for chat. Quote analysis is queued.'],
      ['extracting', 'Extracting quote details for comparison. Chat is available now.'],
      ['complete', 'This document is fully analyzed and ready for comparison.'],
      ['failed', 'Quote extraction failed. Click to retry.'],
      ['skipped', 'This document is ready. (General documents don\'t require quote extraction.)'],
    ] as [ExtractionStatus, string][])('shows correct tooltip for %s status', (status, expectedTooltip) => {
      render(<ExtractionStatusBadge status={status} />);

      const tooltip = screen.getByTestId('tooltip-content');
      expect(tooltip).toHaveTextContent(expectedTooltip);
    });
  });

  describe('Document Type Filtering', () => {
    it('shows badge for quote documents', () => {
      render(<ExtractionStatusBadge status="extracting" documentType="quote" />);

      expect(screen.getByTestId('extraction-status-extracting')).toBeInTheDocument();
    });

    it('hides badge for general documents (non-complete status)', () => {
      const { container } = render(
        <ExtractionStatusBadge status="pending" documentType="general" />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('shows badge for general documents with complete status', () => {
      render(<ExtractionStatusBadge status="complete" documentType="general" />);

      expect(screen.getByTestId('extraction-status-complete')).toBeInTheDocument();
    });

    it('shows badge when documentType is null (default behavior)', () => {
      render(<ExtractionStatusBadge status="extracting" documentType={null} />);

      expect(screen.getByTestId('extraction-status-extracting')).toBeInTheDocument();
    });
  });

  describe('Retry Action (AC-11.8.2)', () => {
    it('shows retry icon for failed status when onRetry is provided', () => {
      render(<ExtractionStatusBadge status="failed" onRetry={() => {}} />);

      expect(screen.getByTestId('extraction-retry-button')).toBeInTheDocument();
    });

    it('does not show retry icon when onRetry is not provided', () => {
      render(<ExtractionStatusBadge status="failed" />);

      expect(screen.queryByTestId('extraction-retry-button')).not.toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
      const handleRetry = vi.fn();
      render(<ExtractionStatusBadge status="failed" onRetry={handleRetry} />);

      // Story 11.8: Retry button is now a separate prominent button
      const retryButton = screen.getByTestId('extraction-retry-button');
      fireEvent.click(retryButton);

      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('shows "Retrying..." label on retry button when isRetrying is true', () => {
      render(<ExtractionStatusBadge status="failed" onRetry={() => {}} isRetrying />);

      // Story 11.8: Retry button shows "Retrying..." text
      const retryButton = screen.getByTestId('extraction-retry-button');
      expect(retryButton).toHaveTextContent('Retrying...');
    });

    it('retry button is disabled when isRetrying is true', () => {
      render(<ExtractionStatusBadge status="failed" onRetry={() => {}} isRetrying />);

      const retryButton = screen.getByTestId('extraction-retry-button');
      expect(retryButton).toBeDisabled();
    });

    it('shows spinner on retry button when isRetrying is true', () => {
      render(<ExtractionStatusBadge status="failed" onRetry={() => {}} isRetrying />);

      // Story 11.8: Spinner is in the retry button, not the status badge
      const retryButton = screen.getByTestId('extraction-retry-button');
      const icon = retryButton.querySelector('svg');
      expect(icon).toHaveClass('animate-spin');
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      render(<ExtractionStatusBadge status="complete" className="custom-class" />);

      const badge = screen.getByTestId('extraction-status-complete');
      expect(badge).toHaveClass('custom-class');
    });

    // DR.7: Updated to use status variant colors (slate-600, blue-700, green-700, red-700)
    it('applies correct color classes for each status', () => {
      const { rerender } = render(<ExtractionStatusBadge status="pending" />);
      expect(screen.getByTestId('extraction-status-pending')).toHaveClass('text-slate-600');

      rerender(<ExtractionStatusBadge status="extracting" />);
      expect(screen.getByTestId('extraction-status-extracting')).toHaveClass('text-blue-700');

      rerender(<ExtractionStatusBadge status="complete" />);
      expect(screen.getByTestId('extraction-status-complete')).toHaveClass('text-green-700');

      rerender(<ExtractionStatusBadge status="failed" />);
      expect(screen.getByTestId('extraction-status-failed')).toHaveClass('text-red-700');

      rerender(<ExtractionStatusBadge status="skipped" />);
      expect(screen.getByTestId('extraction-status-skipped')).toHaveClass('text-green-700');
    });

    it('renders separate retry button for failed status with onRetry', () => {
      // Story 11.8: Failed status now renders a prominent separate retry button
      render(<ExtractionStatusBadge status="failed" onRetry={() => {}} />);

      // Badge should still show the status
      const badge = screen.getByTestId('extraction-status-failed');
      expect(badge).toHaveTextContent('Analysis Failed');

      // Separate retry button should be present
      const retryButton = screen.getByTestId('extraction-retry-button');
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveTextContent('Retry');
    });
  });
});
