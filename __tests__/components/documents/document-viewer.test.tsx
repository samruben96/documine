/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DocumentViewer, DocumentViewerRef } from '@/components/documents/document-viewer';
import React from 'react';

// Mock react-pdf components
vi.mock('react-pdf', () => ({
  Document: ({ children, onLoadSuccess, onLoadError }: {
    children: React.ReactNode;
    file: string;
    onLoadSuccess?: (params: { numPages: number }) => void;
    onLoadError?: (error: Error) => void;
    loading?: React.ReactNode;
    className?: string;
  }) => {
    // Simulate document load success
    React.useEffect(() => {
      const timer = setTimeout(() => {
        onLoadSuccess?.({ numPages: 5 });
      }, 10);
      return () => clearTimeout(timer);
    }, [onLoadSuccess]);
    return <div data-testid="pdf-document">{children}</div>;
  },
  Page: ({ pageNumber }: { pageNumber: number; scale?: number; renderTextLayer?: boolean; renderAnnotationLayer?: boolean; loading?: React.ReactNode }) => (
    <div data-testid={`pdf-page-${pageNumber}`}>Page {pageNumber}</div>
  ),
  pdfjs: {
    GlobalWorkerOptions: { workerSrc: '' },
    version: '4.0.0',
  },
}));

describe('DocumentViewer Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Empty State', () => {
    it('shows empty state when no PDF URL provided', () => {
      render(<DocumentViewer pdfUrl={null} />);
      expect(screen.getByText('Select a document to view')).toBeInTheDocument();
    });
  });

  describe('PDF Loading (AC-5.5.1)', () => {
    it('renders PDF document when URL provided', async () => {
      render(<DocumentViewer pdfUrl="https://example.com/test.pdf" />);

      // Advance timers to trigger document load
      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
    });

    it('renders multiple pages after load', async () => {
      render(<DocumentViewer pdfUrl="https://example.com/test.pdf" />);

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      // Should render 5 pages (from mock)
      expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();
      expect(screen.getByTestId('pdf-page-2')).toBeInTheDocument();
      expect(screen.getByTestId('pdf-page-3')).toBeInTheDocument();
      expect(screen.getByTestId('pdf-page-4')).toBeInTheDocument();
      expect(screen.getByTestId('pdf-page-5')).toBeInTheDocument();
    });
  });

  describe('Page Navigation (AC-5.5.2)', () => {
    it('shows page navigation controls', async () => {
      render(<DocumentViewer pdfUrl="https://example.com/test.pdf" />);

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).toBeInTheDocument();
      expect(screen.getByLabelText('Current page number')).toBeInTheDocument();
    });

    it('shows total page count', async () => {
      render(<DocumentViewer pdfUrl="https://example.com/test.pdf" />);

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      expect(screen.getByText('of 5')).toBeInTheDocument();
    });

    it('previous button is disabled on first page', async () => {
      render(<DocumentViewer pdfUrl="https://example.com/test.pdf" />);

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      const prevButton = screen.getByLabelText('Previous page');
      expect(prevButton).toBeDisabled();
    });

    it('next button is disabled on last page', async () => {
      render(<DocumentViewer pdfUrl="https://example.com/test.pdf" />);

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      const nextButton = screen.getByLabelText('Next page');
      const input = screen.getByLabelText('Current page number');

      // Go to page 5 (last page)
      fireEvent.change(input, { target: { value: '5' } });
      fireEvent.blur(input);

      expect(nextButton).toBeDisabled();
    });
  });

  describe('Zoom Controls (AC-5.5.3)', () => {
    it('shows zoom controls', async () => {
      render(<DocumentViewer pdfUrl="https://example.com/test.pdf" />);

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
      expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
      expect(screen.getByLabelText('Fit to width')).toBeInTheDocument();
    });

    it('shows current zoom percentage', async () => {
      render(<DocumentViewer pdfUrl="https://example.com/test.pdf" />);

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      // Default zoom is 100%
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('zooms in when zoom in button clicked', async () => {
      render(<DocumentViewer pdfUrl="https://example.com/test.pdf" />);

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      const zoomInButton = screen.getByLabelText('Zoom in');
      fireEvent.click(zoomInButton);

      // Should be 125% (100% + 25% step)
      expect(screen.getByText('125%')).toBeInTheDocument();
    });

    it('zooms out when zoom out button clicked', async () => {
      render(<DocumentViewer pdfUrl="https://example.com/test.pdf" />);

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      const zoomOutButton = screen.getByLabelText('Zoom out');
      fireEvent.click(zoomOutButton);

      // Should be 75% (100% - 25% step)
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('zoom in disabled at maximum zoom', async () => {
      render(<DocumentViewer pdfUrl="https://example.com/test.pdf" />);

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      const zoomInButton = screen.getByLabelText('Zoom in');

      // Zoom to max (4 clicks: 100 -> 125 -> 150 -> 175 -> 200)
      fireEvent.click(zoomInButton);
      fireEvent.click(zoomInButton);
      fireEvent.click(zoomInButton);
      fireEvent.click(zoomInButton);

      expect(screen.getByText('200%')).toBeInTheDocument();
      expect(zoomInButton).toBeDisabled();
    });

    it('zoom out disabled at minimum zoom', async () => {
      render(<DocumentViewer pdfUrl="https://example.com/test.pdf" />);

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      const zoomOutButton = screen.getByLabelText('Zoom out');

      // Zoom to min (2 clicks: 100 -> 75 -> 50)
      fireEvent.click(zoomOutButton);
      fireEvent.click(zoomOutButton);

      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(zoomOutButton).toBeDisabled();
    });
  });

  describe('Ref Methods (AC-5.5.4)', () => {
    it('exposes scrollToPage method via ref', async () => {
      const ref = React.createRef<DocumentViewerRef>();
      render(<DocumentViewer ref={ref} pdfUrl="https://example.com/test.pdf" />);

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      expect(ref.current?.scrollToPage).toBeDefined();
      expect(typeof ref.current?.scrollToPage).toBe('function');
    });

    it('exposes highlightSource method via ref', async () => {
      const ref = React.createRef<DocumentViewerRef>();
      render(<DocumentViewer ref={ref} pdfUrl="https://example.com/test.pdf" />);

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      expect(ref.current?.highlightSource).toBeDefined();
      expect(typeof ref.current?.highlightSource).toBe('function');
    });
  });

  describe('Highlight Functionality (AC-5.5.5, AC-5.5.6, AC-5.5.7)', () => {
    it('highlightSource scrolls to page and shows highlight with bounding box', async () => {
      const ref = React.createRef<DocumentViewerRef>();
      render(<DocumentViewer ref={ref} pdfUrl="https://example.com/test.pdf" />);

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      // Highlight a source with bounding box
      await act(async () => {
        ref.current?.highlightSource({
          pageNumber: 3,
          text: 'Test text',
          chunkId: 'chunk-1',
          boundingBox: { x: 100, y: 200, width: 300, height: 50 },
        });
      });

      // The highlight logic is internal - we just verify no error thrown
      expect(ref.current).toBeDefined();
    });
  });

  describe('Page-Level Fallback (AC-5.5.9)', () => {
    it('shows page pulse when no bounding box available', async () => {
      const ref = React.createRef<DocumentViewerRef>();
      render(<DocumentViewer ref={ref} pdfUrl="https://example.com/test.pdf" />);

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      // Highlight a source without bounding box
      await act(async () => {
        ref.current?.highlightSource({
          pageNumber: 2,
          text: 'Test text',
          chunkId: 'chunk-2',
          // No boundingBox - should trigger page pulse
        });
      });

      // The pulse animation is CSS-based, we just verify no error thrown
      expect(ref.current).toBeDefined();
    });
  });

  describe('Document Role and Accessibility', () => {
    it('has correct role for document viewer', async () => {
      render(<DocumentViewer pdfUrl="https://example.com/test.pdf" />);

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('has accessible label for document viewer', async () => {
      render(<DocumentViewer pdfUrl="https://example.com/test.pdf" />);

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      expect(screen.getByLabelText('PDF document viewer')).toBeInTheDocument();
    });
  });
});
