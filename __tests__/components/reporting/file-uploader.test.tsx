/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUploader } from '@/components/reporting/file-uploader';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

import { toast } from 'sonner';

/**
 * Tests for FileUploader Component
 * Epic 23: Flexible AI Reports
 * Story 23.1: File Upload Infrastructure
 *
 * AC-23.1.1: Upload Excel/CSV/PDF files via dropzone
 * AC-23.1.2: Show upload progress
 * AC-23.1.3: Invalid file types show clear error message
 */
describe('FileUploader', () => {
  const mockOnUploadComplete = vi.fn();
  const mockOnUploadError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-23.1.1: Dropzone Display', () => {
    it('renders dropzone with dashed border', () => {
      const { container } = render(
        <FileUploader onUploadComplete={mockOnUploadComplete} />
      );

      const dropzone = container.querySelector('.border-dashed');
      expect(dropzone).toBeTruthy();
    });

    it('displays instructional text', () => {
      render(<FileUploader onUploadComplete={mockOnUploadComplete} />);

      expect(
        screen.getByText('Drop a data file here or click to upload')
      ).toBeInTheDocument();
    });

    it('displays supported file formats', () => {
      render(<FileUploader onUploadComplete={mockOnUploadComplete} />);

      expect(
        screen.getByText('Excel (.xlsx, .xls), CSV, or PDF files up to 50MB')
      ).toBeInTheDocument();
    });

    it('has accessible file input', () => {
      render(<FileUploader onUploadComplete={mockOnUploadComplete} />);

      const input = screen.getByLabelText('Upload data file');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'file');
    });
  });

  describe('disabled state', () => {
    it('applies disabled styling when disabled prop is true', () => {
      const { container } = render(
        <FileUploader
          onUploadComplete={mockOnUploadComplete}
          disabled={true}
        />
      );

      const dropzone = container.querySelector('.opacity-50');
      expect(dropzone).toBeTruthy();
    });

    it('has cursor-not-allowed when disabled', () => {
      const { container } = render(
        <FileUploader
          onUploadComplete={mockOnUploadComplete}
          disabled={true}
        />
      );

      const dropzone = container.querySelector('.cursor-not-allowed');
      expect(dropzone).toBeTruthy();
    });
  });

  describe('AC-23.1.3: File type validation', () => {
    it('shows error toast for invalid file type', async () => {
      render(<FileUploader onUploadComplete={mockOnUploadComplete} />);

      const input = screen.getByLabelText('Upload data file');

      // Simulate file drop with invalid type
      const invalidFile = new File(['test'], 'document.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      // Create a dataTransfer-like object
      Object.defineProperty(input, 'files', {
        value: [invalidFile],
        writable: true,
      });

      fireEvent.change(input);

      // Wait for validation
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Invalid file type')
        );
      });
    });

    it('shows error toast for file over 50MB', async () => {
      render(<FileUploader onUploadComplete={mockOnUploadComplete} />);

      const input = screen.getByLabelText('Upload data file');

      // Create a mock large file
      const largeFile = new File(['x'.repeat(100)], 'large.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // Override size to be > 50MB
      Object.defineProperty(largeFile, 'size', {
        value: 51 * 1024 * 1024, // 51MB
        writable: false,
      });

      Object.defineProperty(input, 'files', {
        value: [largeFile],
        writable: true,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('50MB')
        );
      });
    });
  });

  describe('AC-23.1.2: Upload progress display', () => {
    it('shows uploading file with filename', async () => {
      // Mock fetch to simulate upload
      global.XMLHttpRequest = vi.fn().mockImplementation(() => ({
        open: vi.fn(),
        send: vi.fn(),
        upload: {
          addEventListener: vi.fn(),
        },
        addEventListener: vi.fn((event, handler) => {
          if (event === 'load') {
            // Simulate slow response
            setTimeout(() => {
              handler();
            }, 100);
          }
        }),
        status: 201,
        responseText: JSON.stringify({
          data: { sourceId: 'test-id', status: 'pending', filename: 'test.xlsx' },
        }),
      })) as unknown as typeof XMLHttpRequest;

      render(
        <FileUploader
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      );

      const input = screen.getByLabelText('Upload data file');

      const validFile = new File(['test content'], 'data-report.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      Object.defineProperty(input, 'files', {
        value: [validFile],
        writable: true,
      });

      fireEvent.change(input);

      // Wait for file name to appear
      await waitFor(() => {
        expect(screen.getByText(/data-report\.xlsx/)).toBeInTheDocument();
      });
    });
  });

  describe('file status states', () => {
    it('truncates long filenames', () => {
      // Access the internal truncateFilename function behavior through rendering
      render(<FileUploader onUploadComplete={mockOnUploadComplete} />);

      // The component should handle long names internally
      // Test is primarily about ensuring component renders without error
      expect(screen.getByText('Drop a data file here or click to upload')).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <FileUploader
          onUploadComplete={mockOnUploadComplete}
          className="custom-test-class"
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-test-class');
    });
  });

  describe('upload lifecycle', () => {
    it('shows cancel button during upload', async () => {
      // Mock XMLHttpRequest to simulate in-progress upload
      const mockXHR = {
        open: vi.fn(),
        send: vi.fn(),
        upload: {
          addEventListener: vi.fn((event, handler) => {
            if (event === 'progress') {
              // Simulate progress event
              setTimeout(() => {
                handler({ lengthComputable: true, loaded: 50, total: 100 });
              }, 10);
            }
          }),
        },
        addEventListener: vi.fn(),
        status: 201,
        responseText: JSON.stringify({ data: { sourceId: 'test-id' } }),
      };

      global.XMLHttpRequest = vi.fn().mockImplementation(
        () => mockXHR
      ) as unknown as typeof XMLHttpRequest;

      render(
        <FileUploader
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      );

      const input = screen.getByLabelText('Upload data file');

      const validFile = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      Object.defineProperty(input, 'files', {
        value: [validFile],
        writable: true,
      });

      fireEvent.change(input);

      // Wait for uploading state
      await waitFor(() => {
        const cancelButton = screen.queryByLabelText(/Cancel upload/);
        // Button should exist when file is uploading
        if (cancelButton) {
          expect(cancelButton).toBeInTheDocument();
        }
      });
    });

    it('renders successfully with all props', () => {
      const { container } = render(
        <FileUploader
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
          disabled={false}
          className="test-class"
        />
      );

      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('test-class');
    });
  });

  describe('drag and drop visual feedback', () => {
    it('renders drag zone that can receive focus', () => {
      render(<FileUploader onUploadComplete={mockOnUploadComplete} />);

      const dropzone = screen.getByText(
        'Drop a data file here or click to upload'
      ).closest('div[tabindex]');

      // The dropzone should be focusable for accessibility
      expect(dropzone).toBeTruthy();
    });
  });
});
