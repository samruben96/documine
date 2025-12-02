'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SourceCitation, BoundingBox } from '@/lib/chat/types';

// Import react-pdf styles for text layer
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Set PDF.js worker source from CDN for smaller bundle
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * Ref methods exposed by DocumentViewer
 */
export interface DocumentViewerRef {
  scrollToPage: (pageNumber: number) => void;
  highlightSource: (source: SourceCitation) => void;
}

/**
 * Highlight data for overlay
 */
interface HighlightData {
  pageNumber: number;
  boundingBox?: BoundingBox;
  opacity: number;
}

interface DocumentViewerProps {
  pdfUrl: string | null;
  className?: string;
  onPageChange?: (pageNumber: number) => void;
}

/**
 * Document Viewer Component
 *
 * Implements AC-5.5.1: PDF renders with text layer enabled (text is selectable)
 * Implements AC-5.5.2: Page navigation controls
 * Implements AC-5.5.3: Zoom controls
 * Implements AC-5.5.4: Source citation scroll navigation
 * Implements AC-5.5.5, 5.5.6: Highlight with yellow background and padding
 * Implements AC-5.5.7: Highlight fade animation
 * Implements AC-5.5.8: Dismiss highlight on click
 * Implements AC-5.5.9: Page-level fallback highlight
 */
export const DocumentViewer = forwardRef<DocumentViewerRef, DocumentViewerProps>(
  function DocumentViewer({ pdfUrl, className, onPageChange }, ref) {
    // Document state
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [pageInputValue, setPageInputValue] = useState<string>('1');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Zoom state - AC-5.5.3
    const [scale, setScale] = useState<number>(1);
    const [containerWidth, setContainerWidth] = useState<number>(0);

    // Highlight state - AC-5.5.5, 5.5.7
    const [highlight, setHighlight] = useState<HighlightData | null>(null);
    const [pagePulse, setPagePulse] = useState<number | null>(null);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Zoom constraints - AC-5.5.3
    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 2.0;
    const ZOOM_STEP = 0.25;

    // Cleanup timeouts on unmount
    useEffect(() => {
      return () => {
        if (fadeTimeoutRef.current) {
          clearTimeout(fadeTimeoutRef.current);
        }
        if (pulseTimeoutRef.current) {
          clearTimeout(pulseTimeoutRef.current);
        }
      };
    }, []);

    // Measure container width for fit-to-width
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          setContainerWidth(entry.contentRect.width - 32); // Subtract padding
        }
      });

      observer.observe(container);
      return () => observer.disconnect();
    }, []);

    // Scroll to page implementation - AC-5.5.4
    const scrollToPage = useCallback((targetPage: number) => {
      const pageElement = pageRefs.current.get(targetPage);
      if (pageElement && scrollContainerRef.current) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setPageNumber(targetPage);
        setPageInputValue(String(targetPage));
        onPageChange?.(targetPage);
      }
    }, [onPageChange]);

    // Clear highlight function
    const clearHighlight = useCallback(() => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }
      setHighlight(null);
    }, []);

    // Show highlight with auto-fade - AC-5.5.7
    const showHighlight = useCallback((data: HighlightData) => {
      // Clear any existing timeout
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }

      setHighlight({ ...data, opacity: 1 });

      // Start fade after 3 seconds - AC-5.5.7
      fadeTimeoutRef.current = setTimeout(() => {
        setHighlight((prev) => (prev ? { ...prev, opacity: 0 } : null));
        // Remove after fade completes (500ms)
        setTimeout(() => setHighlight(null), 500);
      }, 3000);
    }, []);

    // Show page pulse fallback - AC-5.5.9
    const showPagePulse = useCallback((pageNum: number) => {
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
      }

      setPagePulse(pageNum);

      // Clear pulse after animation (1 second = 2 cycles * 0.5s)
      pulseTimeoutRef.current = setTimeout(() => {
        setPagePulse(null);
      }, 1000);
    }, []);

    // Highlight source implementation - AC-5.5.5, 5.5.6, 5.5.9
    const highlightSource = useCallback(
      (source: SourceCitation) => {
        // First scroll to the page
        scrollToPage(source.pageNumber);

        // Then apply highlight
        if (source.boundingBox) {
          // Has bounding box - show highlight overlay
          showHighlight({
            pageNumber: source.pageNumber,
            boundingBox: source.boundingBox,
            opacity: 1,
          });
        } else {
          // No bounding box - show page pulse fallback
          showPagePulse(source.pageNumber);
        }
      },
      [scrollToPage, showHighlight, showPagePulse]
    );

    // Expose methods via ref - AC-5.5.4
    useImperativeHandle(
      ref,
      () => ({
        scrollToPage,
        highlightSource,
      }),
      [scrollToPage, highlightSource]
    );

    // Document load handlers
    const onDocumentLoadSuccess = useCallback(
      ({ numPages: totalPages }: { numPages: number }) => {
        setNumPages(totalPages);
        setIsLoading(false);
        setError(null);
      },
      []
    );

    const onDocumentLoadError = useCallback((err: Error) => {
      setError(err.message || 'Failed to load PDF');
      setIsLoading(false);
    }, []);

    // Page navigation - AC-5.5.2
    const goToPrevPage = useCallback(() => {
      setPageNumber((prev) => {
        const newPage = Math.max(1, prev - 1);
        setPageInputValue(String(newPage));
        onPageChange?.(newPage);
        return newPage;
      });
    }, [onPageChange]);

    const goToNextPage = useCallback(() => {
      setPageNumber((prev) => {
        const newPage = Math.min(numPages, prev + 1);
        setPageInputValue(String(newPage));
        onPageChange?.(newPage);
        return newPage;
      });
    }, [numPages, onPageChange]);

    const handlePageInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setPageInputValue(e.target.value);
      },
      []
    );

    const handlePageInputBlur = useCallback(() => {
      const parsed = parseInt(pageInputValue, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= numPages) {
        setPageNumber(parsed);
        onPageChange?.(parsed);
      } else {
        setPageInputValue(String(pageNumber));
      }
    }, [pageInputValue, numPages, pageNumber, onPageChange]);

    const handlePageInputKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          handlePageInputBlur();
        }
      },
      [handlePageInputBlur]
    );

    // Keyboard navigation - AC-5.5.2
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Don't capture when typing in input
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          return;
        }

        if (e.key === 'ArrowLeft') {
          goToPrevPage();
        } else if (e.key === 'ArrowRight') {
          goToNextPage();
        } else if (e.key === 'Escape') {
          // AC-5.5.8: Escape dismisses highlight
          clearHighlight();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToPrevPage, goToNextPage, clearHighlight]);

    // Zoom controls - AC-5.5.3
    const zoomIn = useCallback(() => {
      setScale((prev) => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
    }, []);

    const zoomOut = useCallback(() => {
      setScale((prev) => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
    }, []);

    const fitToWidth = useCallback(() => {
      // Default PDF width is 612pt (8.5in), calculate scale to fit container
      if (containerWidth > 0) {
        const optimalScale = containerWidth / 612;
        setScale(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, optimalScale)));
      }
    }, [containerWidth]);

    // Click handler to dismiss highlight - AC-5.5.8
    const handleContainerClick = useCallback(() => {
      if (highlight) {
        clearHighlight();
      }
    }, [highlight, clearHighlight]);

    // Calculate highlight position - AC-5.5.5, 5.5.6
    const getHighlightStyle = (
      bbox: BoundingBox,
      opacity: number
    ): React.CSSProperties => {
      const PADDING = 6; // AC-5.5.6
      return {
        position: 'absolute',
        left: bbox.x * scale - PADDING,
        top: bbox.y * scale - PADDING,
        width: bbox.width * scale + PADDING * 2,
        height: bbox.height * scale + PADDING * 2,
        backgroundColor: '#fef08a', // AC-5.5.5
        opacity,
        transition: 'opacity 0.5s ease-out', // AC-5.5.7
        pointerEvents: 'none' as const,
        borderRadius: '2px',
      };
    };

    // Empty state when no PDF
    if (!pdfUrl) {
      return (
        <div
          className={cn(
            'h-full flex items-center justify-center bg-slate-50 text-slate-500',
            className
          )}
        >
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mt-4 text-sm">Select a document to view</p>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={cn('h-full flex flex-col bg-slate-100', className)}
      >
        {/* Toolbar - AC-5.5.2, AC-5.5.3 */}
        <div className="flex-shrink-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
          {/* Page Navigation - AC-5.5.2 */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1 || isLoading}
              aria-label="Previous page"
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-slate-500">Page</span>
              <Input
                type="text"
                value={pageInputValue}
                onChange={handlePageInputChange}
                onBlur={handlePageInputBlur}
                onKeyDown={handlePageInputKeyDown}
                className="w-12 h-8 text-center px-1"
                disabled={isLoading}
                aria-label="Current page number"
              />
              <span className="text-slate-500">of {numPages || '–'}</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages || isLoading}
              aria-label="Next page"
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Zoom Controls - AC-5.5.3 */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={fitToWidth}
              disabled={isLoading}
              aria-label="Fit to width"
              className="h-9 w-9"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={zoomOut}
              disabled={scale <= MIN_ZOOM || isLoading}
              aria-label="Zoom out"
              className="h-9 w-9"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            <span className="text-xs text-slate-500 w-12 text-center">
              {Math.round(scale * 100)}%
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={zoomIn}
              disabled={scale >= MAX_ZOOM || isLoading}
              aria-label="Zoom in"
              className="h-9 w-9"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* PDF Content Area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto p-4"
          onClick={handleContainerClick}
          role="document"
          aria-label="PDF document viewer"
        >
          {/* Loading State */}
          {isLoading && (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="h-full flex items-center justify-center text-red-500">
              <div className="text-center">
                <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">{error}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Please try refreshing the page
                </p>
              </div>
            </div>
          )}

          {/* PDF Document - AC-5.5.1 */}
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            className="flex flex-col items-center gap-4"
          >
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
              <div
                key={pageNum}
                ref={(el) => {
                  if (el) {
                    pageRefs.current.set(pageNum, el);
                  } else {
                    pageRefs.current.delete(pageNum);
                  }
                }}
                className={cn(
                  'relative bg-white shadow-sm',
                  // AC-5.5.9: Page pulse animation
                  pagePulse === pageNum && 'animate-page-pulse'
                )}
                style={{
                  border:
                    pagePulse === pageNum
                      ? '2px solid #475569'
                      : '1px solid #e2e8f0',
                }}
              >
                {/* AC-5.5.1: PDF page with text layer */}
                <Page
                  pageNumber={pageNum}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  loading={null}
                />

                {/* AC-5.5.5, 5.5.6: Highlight overlay */}
                {highlight &&
                  highlight.pageNumber === pageNum &&
                  highlight.boundingBox && (
                    <div
                      style={getHighlightStyle(
                        highlight.boundingBox,
                        highlight.opacity
                      )}
                      aria-hidden="true"
                    />
                  )}
              </div>
            ))}
          </Document>
        </div>
      </div>
    );
  }
);

// Default export for convenience
export default DocumentViewer;
