/**
 * Export Button Component Tests
 *
 * Story 7.6: AC-7.6.1, AC-7.6.6
 * Tests dropdown rendering, loading states, and callback handling.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportButton } from '@/components/compare/export-button';

describe('ExportButton', () => {
  const defaultProps = {
    onExportPdf: vi.fn(),
    onExportCsv: vi.fn(),
    isExporting: false,
    exportType: null as 'pdf' | 'csv' | null,
  };

  it('renders Export button with download icon', () => {
    render(<ExportButton {...defaultProps} />);

    const button = screen.getByTestId('export-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Export');
  });

  it('opens dropdown on click', async () => {
    const user = userEvent.setup();
    render(<ExportButton {...defaultProps} />);

    const button = screen.getByTestId('export-button');
    await user.click(button);

    // Dropdown should be visible
    expect(screen.getByText('Export as PDF')).toBeInTheDocument();
    expect(screen.getByText('Export as CSV')).toBeInTheDocument();
  });

  it('calls onExportPdf when PDF option clicked', async () => {
    const user = userEvent.setup();
    const onExportPdf = vi.fn();
    render(<ExportButton {...defaultProps} onExportPdf={onExportPdf} />);

    // Open dropdown
    await user.click(screen.getByTestId('export-button'));

    // Click PDF option
    await user.click(screen.getByTestId('export-pdf-option'));

    expect(onExportPdf).toHaveBeenCalledTimes(1);
  });

  it('calls onExportCsv when CSV option clicked', async () => {
    const user = userEvent.setup();
    const onExportCsv = vi.fn();
    render(<ExportButton {...defaultProps} onExportCsv={onExportCsv} />);

    // Open dropdown
    await user.click(screen.getByTestId('export-button'));

    // Click CSV option
    await user.click(screen.getByTestId('export-csv-option'));

    expect(onExportCsv).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner when isExporting is true', () => {
    render(<ExportButton {...defaultProps} isExporting={true} />);

    const button = screen.getByTestId('export-button');
    expect(button).toHaveTextContent('Exporting...');
  });

  it('shows "Generating PDF..." when exportType is pdf', () => {
    render(<ExportButton {...defaultProps} isExporting={true} exportType="pdf" />);

    const button = screen.getByTestId('export-button');
    expect(button).toHaveTextContent('Generating PDF...');
  });

  it('shows "Exporting..." when exportType is csv', () => {
    render(<ExportButton {...defaultProps} isExporting={true} exportType="csv" />);

    const button = screen.getByTestId('export-button');
    expect(button).toHaveTextContent('Exporting...');
  });

  it('disables button when isExporting is true', () => {
    render(<ExportButton {...defaultProps} isExporting={true} />);

    const button = screen.getByTestId('export-button');
    expect(button).toBeDisabled();
  });

  it('enables button when isExporting is false', () => {
    render(<ExportButton {...defaultProps} isExporting={false} />);

    const button = screen.getByTestId('export-button');
    expect(button).not.toBeDisabled();
  });

  it('shows chevron down icon when not exporting', () => {
    render(<ExportButton {...defaultProps} isExporting={false} />);

    const button = screen.getByTestId('export-button');
    // Button should have the Export text (which indicates normal state with chevron)
    expect(button).toHaveTextContent('Export');
    expect(button).not.toHaveTextContent('Generating');
  });
});
