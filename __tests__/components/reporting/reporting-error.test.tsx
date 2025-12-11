/**
 * @vitest-environment happy-dom
 */
/**
 * ReportingError Component Tests
 * Epic 23: Flexible AI Reports - Story 23.8
 *
 * AC-23.8.3: Error states display user-friendly messages with actionable recovery options
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportingError, type ErrorType } from '@/components/reporting/reporting-error';

describe('ReportingError Component', () => {
  const defaultProps = {
    type: 'analysis' as ErrorType,
    message: 'Failed to analyze the uploaded file.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Display', () => {
    it('renders the error message', () => {
      render(<ReportingError {...defaultProps} />);
      expect(screen.getByText('Failed to analyze the uploaded file.')).toBeInTheDocument();
    });

    it('displays correct title for analysis error', () => {
      render(<ReportingError {...defaultProps} type="analysis" />);
      expect(screen.getByText('Analysis Failed')).toBeInTheDocument();
    });

    it('displays correct title for generation error', () => {
      render(<ReportingError {...defaultProps} type="generation" />);
      expect(screen.getByText('Report Generation Failed')).toBeInTheDocument();
    });

    it('displays correct title for upload error', () => {
      render(<ReportingError {...defaultProps} type="upload" />);
      expect(screen.getByText('Upload Failed')).toBeInTheDocument();
    });

    it('displays correct title for network error', () => {
      render(<ReportingError {...defaultProps} type="network" />);
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
    });

    it('displays correct title for validation error', () => {
      render(<ReportingError {...defaultProps} type="validation" />);
      expect(screen.getByText('Invalid File')).toBeInTheDocument();
    });
  });

  describe('Retry Button', () => {
    it('shows retry button when onRetry is provided', () => {
      const onRetry = vi.fn();
      render(<ReportingError {...defaultProps} onRetry={onRetry} />);
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(<ReportingError {...defaultProps} onRetry={onRetry} />);

      fireEvent.click(screen.getByRole('button', { name: /retry/i }));
      expect(onRetry).toHaveBeenCalledOnce();
    });

    it('disables retry button when isRetrying is true', () => {
      const onRetry = vi.fn();
      render(<ReportingError {...defaultProps} onRetry={onRetry} isRetrying />);

      expect(screen.getByRole('button', { name: /retry/i })).toBeDisabled();
    });

    it('shows "Retrying..." text when isRetrying is true', () => {
      const onRetry = vi.fn();
      render(<ReportingError {...defaultProps} onRetry={onRetry} isRetrying />);

      expect(screen.getByText('Retrying...')).toBeInTheDocument();
    });

    it('does not show retry button for validation errors', () => {
      const onRetry = vi.fn();
      render(<ReportingError {...defaultProps} type="validation" onRetry={onRetry} />);

      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });
  });

  describe('Upload New File Button', () => {
    it('shows upload new button when onUploadNew is provided for analysis error', () => {
      const onUploadNew = vi.fn();
      render(<ReportingError {...defaultProps} type="analysis" onUploadNew={onUploadNew} />);

      expect(screen.getByRole('button', { name: /upload.*different/i })).toBeInTheDocument();
    });

    it('calls onUploadNew when button is clicked', () => {
      const onUploadNew = vi.fn();
      render(<ReportingError {...defaultProps} onUploadNew={onUploadNew} />);

      fireEvent.click(screen.getByRole('button', { name: /upload.*different/i }));
      expect(onUploadNew).toHaveBeenCalledOnce();
    });

    it('does not show upload button for generation errors', () => {
      const onUploadNew = vi.fn();
      render(<ReportingError {...defaultProps} type="generation" onUploadNew={onUploadNew} />);

      expect(screen.queryByRole('button', { name: /upload.*different/i })).not.toBeInTheDocument();
    });

    it('shows upload button for validation errors', () => {
      const onUploadNew = vi.fn();
      render(<ReportingError {...defaultProps} type="validation" onUploadNew={onUploadNew} />);

      expect(screen.getByRole('button', { name: /upload.*different/i })).toBeInTheDocument();
    });
  });

  describe('Technical Details', () => {
    it('shows expand button when details are provided', () => {
      render(<ReportingError {...defaultProps} details="Error code: ERR_PARSE_FAILED" />);
      expect(screen.getByRole('button', { name: /show.*technical/i })).toBeInTheDocument();
    });

    it('does not show expand button when no details provided', () => {
      render(<ReportingError {...defaultProps} />);
      expect(screen.queryByRole('button', { name: /show.*technical/i })).not.toBeInTheDocument();
    });

    it('shows details when expand button is clicked', () => {
      render(<ReportingError {...defaultProps} details="Error code: ERR_PARSE_FAILED" />);

      fireEvent.click(screen.getByRole('button', { name: /show.*technical/i }));
      expect(screen.getByText('Error code: ERR_PARSE_FAILED')).toBeInTheDocument();
    });

    it('hides details when collapse button is clicked', () => {
      render(<ReportingError {...defaultProps} details="Error code: ERR_PARSE_FAILED" />);

      // Expand
      fireEvent.click(screen.getByRole('button', { name: /show.*technical/i }));
      expect(screen.getByText('Error code: ERR_PARSE_FAILED')).toBeInTheDocument();

      // Collapse
      fireEvent.click(screen.getByRole('button', { name: /hide.*technical/i }));
      expect(screen.queryByText('Error code: ERR_PARSE_FAILED')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has role="alert" for screen readers', () => {
      render(<ReportingError {...defaultProps} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('has aria-live="assertive" for immediate announcement', () => {
      render(<ReportingError {...defaultProps} />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('retry button has descriptive aria-label', () => {
      const onRetry = vi.fn();
      render(<ReportingError {...defaultProps} onRetry={onRetry} />);

      expect(screen.getByLabelText(/retry the failed operation/i)).toBeInTheDocument();
    });

    it('upload button has descriptive aria-label', () => {
      const onUploadNew = vi.fn();
      render(<ReportingError {...defaultProps} onUploadNew={onUploadNew} />);

      // Button should be findable by aria-label
      expect(screen.getByRole('button', { name: /upload.*different/i })).toBeInTheDocument();
    });

    it('expand button has aria-expanded attribute', () => {
      render(<ReportingError {...defaultProps} details="Some details" />);

      const expandBtn = screen.getByRole('button', { name: /show.*technical/i });
      expect(expandBtn).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(expandBtn);
      expect(screen.getByRole('button', { name: /hide.*technical/i })).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
