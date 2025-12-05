/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentStatus, DocumentStatusBadge } from '@/components/documents/document-status';

describe('DocumentStatus', () => {
  describe('uploading status', () => {
    it('renders progress bar at 0%', () => {
      render(<DocumentStatus status="uploading" progress={0} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('renders progress bar at 50%', () => {
      render(<DocumentStatus status="uploading" progress={50} />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('renders progress bar at 100%', () => {
      render(<DocumentStatus status="uploading" progress={100} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('defaults progress to 0% when not provided', () => {
      render(<DocumentStatus status="uploading" />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('processing status (AC-4.2.4)', () => {
    it('renders Analyzing text with shimmer animation', () => {
      render(<DocumentStatus status="processing" />);
      expect(screen.getByText('Analyzing...')).toBeInTheDocument();
    });

    it('has shimmer animation class applied', () => {
      const { container } = render(<DocumentStatus status="processing" />);
      const shimmerElement = container.querySelector('.animate-shimmer');
      expect(shimmerElement).toBeInTheDocument();
    });
  });

  describe('ready status (AC-4.2.5)', () => {
    it('renders Ready text', () => {
      render(<DocumentStatus status="ready" />);
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('renders with green checkmark indicator', () => {
      const { container } = render(<DocumentStatus status="ready" />);
      const checkIcon = container.querySelector('svg');
      expect(checkIcon).toHaveClass('text-emerald-500');
    });
  });

  describe('failed status (AC-4.2.7)', () => {
    it('renders Failed text', () => {
      render(<DocumentStatus status="failed" />);
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    it('renders with red error indicator', () => {
      const { container } = render(<DocumentStatus status="failed" />);
      const errorIcon = container.querySelector('svg');
      expect(errorIcon).toHaveClass('text-red-500');
    });

    it('shows error message in tooltip', () => {
      const { container } = render(
        <DocumentStatus status="failed" errorMessage="Processing failed" />
      );
      const errorDiv = container.querySelector('[title="Processing failed"]');
      expect(errorDiv).toBeInTheDocument();
    });

    it('renders Retry button when onRetry provided', () => {
      const onRetry = vi.fn();
      render(<DocumentStatus status="failed" onRetry={onRetry} />);
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('calls onRetry when Retry button clicked', () => {
      const onRetry = vi.fn();
      render(<DocumentStatus status="failed" onRetry={onRetry} />);
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('renders Delete button when onDelete provided', () => {
      const onDelete = vi.fn();
      render(<DocumentStatus status="failed" onDelete={onDelete} />);
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('calls onDelete when Delete button clicked', () => {
      const onDelete = vi.fn();
      render(<DocumentStatus status="failed" onDelete={onDelete} />);
      fireEvent.click(screen.getByRole('button', { name: /delete/i }));
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('renders both Retry and Delete buttons when both callbacks provided', () => {
      const onRetry = vi.fn();
      const onDelete = vi.fn();
      render(<DocumentStatus status="failed" onRetry={onRetry} onDelete={onDelete} />);
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('does not render action buttons when no callbacks provided', () => {
      render(<DocumentStatus status="failed" />);
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('applies custom className', () => {
      const { container } = render(
        <DocumentStatus status="ready" className="custom-class" />
      );
      const statusDiv = container.firstChild as HTMLElement;
      expect(statusDiv).toHaveClass('custom-class');
    });
  });
});

describe('DocumentStatusBadge', () => {
  it('renders uploading badge', () => {
    render(<DocumentStatusBadge status="uploading" />);
    expect(screen.getByText('Uploading')).toBeInTheDocument();
  });

  it('renders processing badge with shimmer', () => {
    const { container } = render(<DocumentStatusBadge status="processing" />);
    expect(screen.getByText('Analyzing')).toBeInTheDocument();
    expect(container.querySelector('.animate-shimmer')).toBeInTheDocument();
  });

  it('renders ready badge with checkmark', () => {
    render(<DocumentStatusBadge status="ready" />);
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('renders failed badge with error tooltip', async () => {
    render(
      <DocumentStatusBadge status="failed" errorMessage="Test error" />
    );
    expect(screen.getByText('Failed')).toBeInTheDocument();
    // Story 11.5: Badge uses Tooltip with user-friendly message instead of title attribute
    const badge = screen.getByTestId('failed-status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('cursor-help'); // Indicates tooltip available
  });
});
