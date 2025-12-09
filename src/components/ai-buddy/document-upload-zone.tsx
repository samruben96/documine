/**
 * Document Upload Zone Component
 * Story 17.1: Document Upload to Conversation with Status
 *
 * Drag-and-drop zone for uploading documents using react-dropzone.
 *
 * AC-17.1.1: Click attach button opens file picker for PDF/images
 * AC-17.1.5: Drag files onto chat area to attach
 */

'use client';

import { useCallback, type ReactNode } from 'react';
import { useDropzone, type Accept, type FileRejection } from 'react-dropzone';
import { Upload, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

// Accepted file types per AC-17.1.1
const ACCEPTED_TYPES: Accept = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
};

// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Max files: 5 per message
const MAX_FILES = 5;

export interface DocumentUploadZoneProps {
  /** Callback when valid files are dropped/selected */
  onUpload?: (files: File[]) => void;
  /** Callback when files are rejected */
  onReject?: (rejections: FileRejection[]) => void;
  /** Whether the upload zone is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Mode: 'zone' for full drop zone, 'button' for attach button only */
  mode?: 'zone' | 'button';
  /** Children to render inside the drop zone (for 'zone' mode) */
  children?: ReactNode;
  /** Maximum number of files allowed */
  maxFiles?: number;
}

/**
 * Document Upload Zone Component
 *
 * Supports two modes:
 * - 'zone': Full drag-drop area with visual feedback
 * - 'button': Attach button that opens file picker
 */
export function DocumentUploadZone({
  onUpload,
  onReject,
  disabled = false,
  className,
  mode = 'zone',
  children,
  maxFiles = MAX_FILES,
}: DocumentUploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], rejections: FileRejection[]) => {
      if (acceptedFiles.length > 0 && onUpload) {
        onUpload(acceptedFiles);
      }
      if (rejections.length > 0 && onReject) {
        onReject(rejections);
      }
    },
    [onUpload, onReject]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    open,
  } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles,
    disabled,
    noClick: mode === 'zone', // In zone mode, only drag-drop triggers
    noKeyboard: mode === 'zone',
  });

  // Button mode: Just renders an attach button
  if (mode === 'button') {
    return (
      <>
        <input {...getInputProps()} data-testid="file-input" />
        <button
          type="button"
          onClick={open}
          disabled={disabled}
          className={cn(
            'h-11 w-11 flex items-center justify-center flex-shrink-0 rounded-lg',
            'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-1',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          aria-label="Attach document"
          data-testid="attach-button"
        >
          <Paperclip className="h-5 w-5" />
        </button>
      </>
    );
  }

  // Zone mode: Full drag-drop area
  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative transition-all duration-200',
        className
      )}
      data-testid="document-upload-zone"
    >
      <input {...getInputProps()} data-testid="file-input" />

      {/* Drop zone overlay - shows when dragging */}
      {isDragActive && (
        <div
          className={cn(
            'absolute inset-0 z-50 flex flex-col items-center justify-center',
            'border-2 border-dashed rounded-lg',
            'backdrop-blur-sm bg-white/80',
            'transition-colors duration-150',
            isDragAccept && 'border-emerald-500 bg-emerald-50/80',
            isDragReject && 'border-red-500 bg-red-50/80'
          )}
          data-testid="drop-overlay"
        >
          <Upload
            className={cn(
              'h-10 w-10 mb-3',
              isDragAccept && 'text-emerald-600',
              isDragReject && 'text-red-600'
            )}
          />
          <p
            className={cn(
              'text-sm font-medium',
              isDragAccept && 'text-emerald-700',
              isDragReject && 'text-red-700'
            )}
          >
            {isDragAccept && 'Drop to attach files'}
            {isDragReject && 'File type not supported'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            PDF, PNG, JPG (max 50MB each)
          </p>
        </div>
      )}

      {/* Children (e.g., the chat panel content) */}
      {children}
    </div>
  );
}

/**
 * Standalone drop zone for explicit file upload area
 */
export function DocumentDropZone({
  onUpload,
  disabled = false,
  className,
}: {
  onUpload?: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0 && onUpload) {
        onUpload(acceptedFiles);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex flex-col items-center justify-center p-8',
        'border-2 border-dashed rounded-lg',
        'transition-colors duration-150 cursor-pointer',
        isDragActive
          ? 'border-emerald-500 bg-emerald-500/10'
          : 'border-[var(--chat-border)] hover:border-emerald-400',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      data-testid="document-drop-zone"
    >
      <input {...getInputProps()} />
      <Upload className="h-8 w-8 text-[var(--text-muted)] mb-2" />
      <p className="text-sm text-[var(--text-muted)]">
        {isDragActive ? 'Drop files here' : 'Drag and drop files here'}
      </p>
      <p className="text-xs text-[var(--text-muted)] mt-1">
        or click to browse
      </p>
    </div>
  );
}
