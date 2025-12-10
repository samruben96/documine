/**
 * @vitest-environment happy-dom
 */
/**
 * ReportingPage Tests
 * Epic 23: Flexible AI Reports
 * Story 23.3: Prompt Input UI
 *
 * Tests for page state transitions and component integration
 * AC-23.3.4: Generate Report button enabled after file upload completes
 * AC-23.3.5: Loading state shown while analysis is in progress
 * AC-23.3.6: Clear error handling if analysis fails
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportingPage from '@/app/(dashboard)/reporting/page';

// Mock the hooks and components
vi.mock('@/hooks/use-reporting-analysis', () => ({
  useReportingAnalysis: vi.fn(),
}));

vi.mock('@/components/reporting/file-uploader', () => ({
  FileUploader: vi.fn(({ onUploadComplete, onUploadError }) => (
    <div data-testid="file-uploader">
      <button
        onClick={() => onUploadComplete?.('test-source-id', 'test-file.xlsx')}
        data-testid="mock-upload-success"
      >
        Mock Upload Success
      </button>
      <button
        onClick={() => onUploadError?.('Upload failed')}
        data-testid="mock-upload-error"
      >
        Mock Upload Error
      </button>
    </div>
  )),
}));

// Import the mocked hook
import { useReportingAnalysis } from '@/hooks/use-reporting-analysis';
const mockUseReportingAnalysis = useReportingAnalysis as ReturnType<typeof vi.fn>;

describe('ReportingPage', () => {
  const mockAnalyze = vi.fn();
  const mockReset = vi.fn();

  const defaultHookReturn = {
    analyze: mockAnalyze,
    data: null,
    isLoading: false,
    error: null,
    reset: mockReset,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReportingAnalysis.mockReturnValue(defaultHookReturn);
  });

  describe('Initial state (Step 1 only)', () => {
    it('renders page header', () => {
      render(<ReportingPage />);
      expect(screen.getByText('Data Reports')).toBeInTheDocument();
      expect(
        screen.getByText(/Upload any data file and let AI generate insights/)
      ).toBeInTheDocument();
    });

    it('renders Step 1: Upload Your Data section', () => {
      render(<ReportingPage />);
      expect(screen.getByText('Step 1: Upload Your Data')).toBeInTheDocument();
    });

    it('renders FileUploader component', () => {
      render(<ReportingPage />);
      expect(screen.getByTestId('file-uploader')).toBeInTheDocument();
    });

    it('renders Step 2 section with reduced opacity', () => {
      render(<ReportingPage />);
      const step2Section = screen.getByText('Step 2: What report do you want?').closest('div')?.closest('div[class*="rounded-lg"]');
      expect(step2Section).toHaveClass('opacity-50');
    });

    it('renders Generate button disabled initially', () => {
      render(<ReportingPage />);
      const button = screen.getByRole('button', { name: /Generate Report/i });
      expect(button).toBeDisabled();
    });
  });

  describe('After file upload - triggers analysis', () => {
    it('calls analyze after successful upload', async () => {
      render(<ReportingPage />);

      // Simulate successful upload
      fireEvent.click(screen.getByTestId('mock-upload-success'));

      await waitFor(() => {
        expect(mockAnalyze).toHaveBeenCalledWith('test-source-id');
      });
    });

    it('shows uploaded file status', async () => {
      render(<ReportingPage />);

      fireEvent.click(screen.getByTestId('mock-upload-success'));

      await waitFor(() => {
        expect(screen.getByText('test-file.xlsx')).toBeInTheDocument();
        expect(screen.getByText('File uploaded successfully')).toBeInTheDocument();
      });
    });

    it('shows "Upload different file" button after upload', async () => {
      render(<ReportingPage />);

      fireEvent.click(screen.getByTestId('mock-upload-success'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Upload different file/i })).toBeInTheDocument();
      });
    });
  });

  describe('AC-23.3.5: Loading state during analysis', () => {
    it('shows analyzing indicator when isLoading is true', () => {
      mockUseReportingAnalysis.mockReturnValue({
        ...defaultHookReturn,
        isLoading: true,
      });

      render(<ReportingPage />);

      // Simulate upload first
      fireEvent.click(screen.getByTestId('mock-upload-success'));

      expect(screen.getByText('Analyzing your data...')).toBeInTheDocument();
      expect(
        screen.getByText('Detecting column types and preparing suggestions')
      ).toBeInTheDocument();
    });

    it('Generate button remains disabled during analysis', () => {
      mockUseReportingAnalysis.mockReturnValue({
        ...defaultHookReturn,
        isLoading: true,
      });

      render(<ReportingPage />);
      fireEvent.click(screen.getByTestId('mock-upload-success'));

      const button = screen.getByRole('button', { name: /Generate Report/i });
      expect(button).toBeDisabled();
    });
  });

  describe('AC-23.3.4: Generate button enabled after analysis', () => {
    const mockAnalysisData = {
      sourceId: 'test-source-id',
      status: 'ready' as const,
      columns: [{ name: 'Amount', type: 'currency' as const, sampleValues: [], nullCount: 0, uniqueCount: 10 }],
      rowCount: 100,
      suggestedPrompts: ['Show totals', 'Compare by category', 'Find trends'],
    };

    it('enables Generate button when analysis completes', async () => {
      mockUseReportingAnalysis.mockReturnValue({
        ...defaultHookReturn,
        data: mockAnalysisData,
      });

      render(<ReportingPage />);
      fireEvent.click(screen.getByTestId('mock-upload-success'));

      const button = screen.getByRole('button', { name: /Generate Report/i });
      expect(button).not.toBeDisabled();
    });

    it('shows suggested prompts when analysis completes', () => {
      mockUseReportingAnalysis.mockReturnValue({
        ...defaultHookReturn,
        data: mockAnalysisData,
      });

      render(<ReportingPage />);
      fireEvent.click(screen.getByTestId('mock-upload-success'));

      expect(screen.getByText('AI Suggestions:')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Show totals/i })).toBeInTheDocument();
    });

    it('shows analysis metadata (columns and rows)', () => {
      mockUseReportingAnalysis.mockReturnValue({
        ...defaultHookReturn,
        data: mockAnalysisData,
      });

      render(<ReportingPage />);
      fireEvent.click(screen.getByTestId('mock-upload-success'));

      expect(screen.getByText(/1 columns detected/)).toBeInTheDocument();
      expect(screen.getByText(/100 rows/)).toBeInTheDocument();
    });

    it('Step 2 section has full opacity when ready', () => {
      mockUseReportingAnalysis.mockReturnValue({
        ...defaultHookReturn,
        data: mockAnalysisData,
      });

      render(<ReportingPage />);
      fireEvent.click(screen.getByTestId('mock-upload-success'));

      const step2Section = screen.getByText('Step 2: What report do you want?').closest('div');
      expect(step2Section?.parentElement).not.toHaveClass('opacity-50');
    });
  });

  describe('AC-23.3.6: Error handling', () => {
    it('shows error alert when analysis fails', () => {
      mockUseReportingAnalysis.mockReturnValue({
        ...defaultHookReturn,
        error: 'Failed to analyze file: Invalid format',
      });

      render(<ReportingPage />);
      fireEvent.click(screen.getByTestId('mock-upload-success'));

      expect(screen.getByText('Analysis Failed')).toBeInTheDocument();
      expect(screen.getByText('Failed to analyze file: Invalid format')).toBeInTheDocument();
    });

    it('shows Try Again button on error', () => {
      mockUseReportingAnalysis.mockReturnValue({
        ...defaultHookReturn,
        error: 'Analysis failed',
      });

      render(<ReportingPage />);
      fireEvent.click(screen.getByTestId('mock-upload-success'));

      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    });

    it('calls reset and analyze when Try Again is clicked', async () => {
      mockUseReportingAnalysis.mockReturnValue({
        ...defaultHookReturn,
        error: 'Analysis failed',
      });

      render(<ReportingPage />);
      fireEvent.click(screen.getByTestId('mock-upload-success'));

      const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
      fireEvent.click(tryAgainButton);

      expect(mockReset).toHaveBeenCalled();
      expect(mockAnalyze).toHaveBeenCalled();
    });

    it('Generate button disabled on error', () => {
      mockUseReportingAnalysis.mockReturnValue({
        ...defaultHookReturn,
        error: 'Analysis failed',
      });

      render(<ReportingPage />);
      fireEvent.click(screen.getByTestId('mock-upload-success'));

      const button = screen.getByRole('button', { name: /Generate Report/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Upload different file flow', () => {
    const mockAnalysisData = {
      sourceId: 'test-source-id',
      status: 'ready' as const,
      columns: [],
      rowCount: 100,
      suggestedPrompts: ['Show totals'],
    };

    it('clicking "Upload different file" resets state', async () => {
      mockUseReportingAnalysis.mockReturnValue({
        ...defaultHookReturn,
        data: mockAnalysisData,
      });

      render(<ReportingPage />);
      fireEvent.click(screen.getByTestId('mock-upload-success'));

      const uploadDifferentButton = screen.getByRole('button', {
        name: /Upload different file/i,
      });
      fireEvent.click(uploadDifferentButton);

      expect(mockReset).toHaveBeenCalled();
    });

    it('shows FileUploader again after reset', async () => {
      mockUseReportingAnalysis.mockReturnValue({
        ...defaultHookReturn,
        data: mockAnalysisData,
      });

      const { rerender } = render(<ReportingPage />);
      fireEvent.click(screen.getByTestId('mock-upload-success'));

      // Click upload different file
      fireEvent.click(screen.getByRole('button', { name: /Upload different file/i }));

      // Reset the hook mock to initial state
      mockUseReportingAnalysis.mockReturnValue(defaultHookReturn);

      // Rerender to simulate state update
      rerender(<ReportingPage />);

      // FileUploader should be visible again
      expect(screen.getByTestId('file-uploader')).toBeInTheDocument();
    });
  });

  describe('PromptInput interaction', () => {
    const mockAnalysisData = {
      sourceId: 'test-source-id',
      status: 'ready' as const,
      columns: [],
      rowCount: 100,
      suggestedPrompts: ['Show totals', 'Compare by category'],
    };

    it('PromptInput is enabled when analysis is ready', () => {
      mockUseReportingAnalysis.mockReturnValue({
        ...defaultHookReturn,
        data: mockAnalysisData,
      });

      render(<ReportingPage />);
      fireEvent.click(screen.getByTestId('mock-upload-success'));

      const textarea = screen.getByLabelText('Report description (optional)');
      expect(textarea).not.toBeDisabled();
    });

    it('PromptInput is disabled before analysis', () => {
      render(<ReportingPage />);

      const textarea = screen.getByLabelText('Report description (optional)');
      expect(textarea).toBeDisabled();
    });

    it('clicking suggested prompt populates textarea', async () => {
      mockUseReportingAnalysis.mockReturnValue({
        ...defaultHookReturn,
        data: mockAnalysisData,
      });

      render(<ReportingPage />);
      fireEvent.click(screen.getByTestId('mock-upload-success'));

      const chip = screen.getByRole('button', { name: /Show totals/i });
      await userEvent.click(chip);

      const textarea = screen.getByLabelText('Report description (optional)');
      expect(textarea).toHaveValue('Show totals');
    });
  });

  describe('Generate Report flow', () => {
    const mockAnalysisData = {
      sourceId: 'test-source-id',
      status: 'ready' as const,
      columns: [],
      rowCount: 100,
      suggestedPrompts: [],
    };

    it('clicking Generate Report triggers generation', async () => {
      mockUseReportingAnalysis.mockReturnValue({
        ...defaultHookReturn,
        data: mockAnalysisData,
      });

      render(<ReportingPage />);
      fireEvent.click(screen.getByTestId('mock-upload-success'));

      const generateButton = screen.getByRole('button', { name: /Generate Report/i });
      fireEvent.click(generateButton);

      // Button should show loading state
      expect(screen.getByText('Generating Report...')).toBeInTheDocument();
    });

    it('Generate button disabled during generation', async () => {
      mockUseReportingAnalysis.mockReturnValue({
        ...defaultHookReturn,
        data: mockAnalysisData,
      });

      render(<ReportingPage />);
      fireEvent.click(screen.getByTestId('mock-upload-success'));

      const generateButton = screen.getByRole('button', { name: /Generate Report/i });
      fireEvent.click(generateButton);

      expect(generateButton).toBeDisabled();
    });
  });
});
