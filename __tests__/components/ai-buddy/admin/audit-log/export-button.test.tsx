/**
 * @vitest-environment happy-dom
 */
/**
 * Tests for ExportButton Component
 * Story 20.4: Audit Log Interface
 *
 * Tests:
 * - AC-20.4.7: Export format selection (PDF or CSV)
 * - PDF option includes checkbox for full transcripts
 * - Loading states during export
 *
 * Note: Radix DropdownMenu doesn't render portal content reliably in happy-dom,
 * so we focus on testing the button states and basic rendering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExportButton } from '@/components/ai-buddy/admin/audit-log/export-button';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ExportButton', () => {
  const defaultProps = {
    filters: {},
    onExportPdf: vi.fn().mockResolvedValue(undefined),
    onExportCsv: vi.fn().mockResolvedValue(undefined),
    isExporting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders export button', () => {
      render(<ExportButton {...defaultProps} />);

      expect(screen.getByTestId('export-button')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('shows download icon', () => {
      render(<ExportButton {...defaultProps} />);

      const button = screen.getByTestId('export-button');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator when exporting', () => {
      render(<ExportButton {...defaultProps} isExporting={true} />);

      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });

    it('disables button when exporting', () => {
      render(<ExportButton {...defaultProps} isExporting={true} />);

      expect(screen.getByTestId('export-button')).toBeDisabled();
    });

    it('shows spinner icon when exporting', () => {
      render(<ExportButton {...defaultProps} isExporting={true} />);

      const button = screen.getByTestId('export-button');
      const spinner = button.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Button State', () => {
    it('is enabled when not exporting', () => {
      render(<ExportButton {...defaultProps} />);

      expect(screen.getByTestId('export-button')).not.toBeDisabled();
    });

    it('has proper aria attributes', () => {
      render(<ExportButton {...defaultProps} />);

      const button = screen.getByTestId('export-button');
      expect(button).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('applies custom className', () => {
      render(<ExportButton {...defaultProps} className="custom-class" />);

      const button = screen.getByTestId('export-button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Props', () => {
    it('accepts filter props', () => {
      const filters = { userId: 'user-1', search: 'test' };
      render(<ExportButton {...defaultProps} filters={filters} />);

      // Component should render without errors
      expect(screen.getByTestId('export-button')).toBeInTheDocument();
    });

    it('accepts callback props', () => {
      const onExportPdf = vi.fn();
      const onExportCsv = vi.fn();
      render(
        <ExportButton
          {...defaultProps}
          onExportPdf={onExportPdf}
          onExportCsv={onExportCsv}
        />
      );

      // Component should render without errors
      expect(screen.getByTestId('export-button')).toBeInTheDocument();
    });
  });
});
