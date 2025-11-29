/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UploadZone, type UploadingFile } from '@/components/documents/upload-zone';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

import { toast } from 'sonner';

describe('UploadZone', () => {
  const mockOnFilesAccepted = vi.fn();
  const mockOnCancelUpload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-4.1.1: Default Upload Zone Display', () => {
    it('renders with dashed border container', () => {
      const { container } = render(
        <UploadZone onFilesAccepted={mockOnFilesAccepted} />
      );

      const dropzone = container.querySelector('.border-dashed');
      expect(dropzone).toBeTruthy();
    });

    it('displays instructional text', () => {
      render(<UploadZone onFilesAccepted={mockOnFilesAccepted} />);

      expect(
        screen.getByText('Drop a document here or click to upload')
      ).toBeInTheDocument();
    });

    it('displays file constraints text', () => {
      render(<UploadZone onFilesAccepted={mockOnFilesAccepted} />);

      expect(
        screen.getByText('PDF files only, up to 50MB each (max 5 files)')
      ).toBeInTheDocument();
    });

    it('has accessible file input', () => {
      render(<UploadZone onFilesAccepted={mockOnFilesAccepted} />);

      const input = screen.getByLabelText('Upload PDF files');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'file');
    });
  });

  describe('AC-4.1.3: File Picker Integration', () => {
    it('file input accepts only PDF files', () => {
      render(<UploadZone onFilesAccepted={mockOnFilesAccepted} />);

      const input = screen.getByLabelText('Upload PDF files');
      expect(input).toHaveAttribute('accept', 'application/pdf,.pdf');
    });
  });

  describe('disabled state', () => {
    it('applies disabled styling when disabled prop is true', () => {
      const { container } = render(
        <UploadZone onFilesAccepted={mockOnFilesAccepted} disabled={true} />
      );

      const dropzone = container.querySelector('.opacity-50');
      expect(dropzone).toBeTruthy();
    });

    it('has cursor-not-allowed when disabled', () => {
      const { container } = render(
        <UploadZone onFilesAccepted={mockOnFilesAccepted} disabled={true} />
      );

      const dropzone = container.querySelector('.cursor-not-allowed');
      expect(dropzone).toBeTruthy();
    });
  });

  describe('uploading files display', () => {
    const uploadingFiles: UploadingFile[] = [
      {
        id: 'test-1',
        file: new File(['test content'], 'test.pdf', { type: 'application/pdf' }),
        progress: 50,
        status: 'uploading',
      },
    ];

    it('renders uploading file with filename', () => {
      render(
        <UploadZone
          onFilesAccepted={mockOnFilesAccepted}
          uploadingFiles={uploadingFiles}
        />
      );

      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    it('shows progress percentage for uploading files', () => {
      render(
        <UploadZone
          onFilesAccepted={mockOnFilesAccepted}
          uploadingFiles={uploadingFiles}
        />
      );

      expect(screen.getByText('50% uploaded')).toBeInTheDocument();
    });

    it('shows cancel button for uploading files', () => {
      render(
        <UploadZone
          onFilesAccepted={mockOnFilesAccepted}
          uploadingFiles={uploadingFiles}
          onCancelUpload={mockOnCancelUpload}
        />
      );

      const cancelButton = screen.getByLabelText('Cancel upload of test.pdf');
      expect(cancelButton).toBeInTheDocument();
    });

    it('calls onCancelUpload when cancel button is clicked', () => {
      render(
        <UploadZone
          onFilesAccepted={mockOnFilesAccepted}
          uploadingFiles={uploadingFiles}
          onCancelUpload={mockOnCancelUpload}
        />
      );

      const cancelButton = screen.getByLabelText('Cancel upload of test.pdf');
      fireEvent.click(cancelButton);

      expect(mockOnCancelUpload).toHaveBeenCalledWith('test-1');
    });
  });

  describe('file status states', () => {
    it('shows processing state with loader', () => {
      const processingFiles: UploadingFile[] = [
        {
          id: 'test-1',
          file: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
          progress: 100,
          status: 'processing',
        },
      ];

      render(
        <UploadZone
          onFilesAccepted={mockOnFilesAccepted}
          uploadingFiles={processingFiles}
        />
      );

      expect(screen.getByText('Analyzing...')).toBeInTheDocument();
    });

    it('shows ready state', () => {
      const readyFiles: UploadingFile[] = [
        {
          id: 'test-1',
          file: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
          progress: 100,
          status: 'ready',
        },
      ];

      render(
        <UploadZone
          onFilesAccepted={mockOnFilesAccepted}
          uploadingFiles={readyFiles}
        />
      );

      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('shows failed state with error message', () => {
      const failedFiles: UploadingFile[] = [
        {
          id: 'test-1',
          file: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
          progress: 0,
          status: 'failed',
          error: 'Network error',
        },
      ];

      render(
        <UploadZone
          onFilesAccepted={mockOnFilesAccepted}
          uploadingFiles={failedFiles}
        />
      );

      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('shows default error message when failed without specific error', () => {
      const failedFiles: UploadingFile[] = [
        {
          id: 'test-1',
          file: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
          progress: 0,
          status: 'failed',
        },
      ];

      render(
        <UploadZone
          onFilesAccepted={mockOnFilesAccepted}
          uploadingFiles={failedFiles}
        />
      );

      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <UploadZone
          onFilesAccepted={mockOnFilesAccepted}
          className="custom-class"
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-class');
    });
  });
});
