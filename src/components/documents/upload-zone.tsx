'use client';

import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { toast } from 'sonner';
import { Upload, FileText, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { shouldWarnLargeFile } from '@/lib/validations/documents';

// Constants for file validation
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 5;
const ACCEPTED_MIME_TYPES = { 'application/pdf': ['.pdf'] };
const FILENAME_MAX_LENGTH = 30;

/**
 * Truncate filename with ellipsis if too long
 * Implements AC-4.2.2: Long filenames truncated with ellipsis (max ~30 chars)
 */
function truncateFilename(filename: string, maxLength: number = FILENAME_MAX_LENGTH): string {
  if (filename.length <= maxLength) return filename;

  // Find extension
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) {
    // No extension or dot at start, just truncate
    return filename.slice(0, maxLength - 3) + '...';
  }

  const extension = filename.slice(lastDot);
  const name = filename.slice(0, lastDot);

  // Keep extension visible, truncate name
  const availableLength = maxLength - extension.length - 3; // 3 for '...'
  if (availableLength <= 0) {
    return filename.slice(0, maxLength - 3) + '...';
  }

  return name.slice(0, availableLength) + '...' + extension;
}

export interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  error?: string;
}

export interface RateLimitInfo {
  remaining: number;
  limit: number;
  tier: string;
}

interface UploadZoneProps {
  onFilesAccepted: (files: File[]) => void;
  uploadingFiles?: UploadingFile[];
  onCancelUpload?: (fileId: string) => void;
  /** Rate limit info to display (AC-4.7.7) */
  rateLimitInfo?: RateLimitInfo;
  disabled?: boolean;
  className?: string;
}

/**
 * Upload Zone Component
 *
 * Implements drag-and-drop file upload with validation:
 * - AC-4.1.1: Dashed border with instructional text
 * - AC-4.1.2: Drag hover state with primary color highlight
 * - AC-4.1.3: Click opens file picker filtered to PDF
 * - AC-4.1.4: Rejects non-PDF files with toast
 * - AC-4.1.5: Rejects files over 50MB with toast
 * - AC-4.1.6: Supports up to 5 simultaneous uploads
 */
export function UploadZone({
  onFilesAccepted,
  uploadingFiles = [],
  onCancelUpload,
  rateLimitInfo,
  disabled = false,
  className,
}: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Handle rejected files
      for (const rejection of rejectedFiles) {
        const { file, errors } = rejection;

        for (const error of errors) {
          if (error.code === 'file-too-large') {
            toast.error('File too large. Maximum size is 50MB');
          } else if (error.code === 'file-invalid-type') {
            toast.error('Only PDF files are supported');
          } else if (error.code === 'too-many-files') {
            toast.error('Maximum 5 files at once');
          } else {
            toast.error(`Error with ${file.name}: ${error.message}`);
          }
        }
      }

      // Handle accepted files
      if (acceptedFiles.length > 0) {
        // Check for large files and show warning (AC-5.8.1.1)
        // Story 5.8.1: Hybrid approach - warn on 10-50MB files
        // Updated for paid tier: can handle larger docs with longer processing
        for (const file of acceptedFiles) {
          if (shouldWarnLargeFile(file.size)) {
            const sizeMB = file.size / (1024 * 1024);
            const timeEstimate = sizeMB > 30 ? '5-8 minutes' : '3-5 minutes';
            toast.warning(`Large file detected. Processing may take ${timeEstimate}.`);
            break; // Only show warning once per batch
          }
        }

        onFilesAccepted(acceptedFiles);
      }
    },
    [onFilesAccepted]
  );

  const onDragEnter = useCallback(() => {
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragActive(false);
  }, []);

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    onDragEnter,
    onDragLeave,
    accept: ACCEPTED_MIME_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES,
    disabled,
    noClick: false,
    noKeyboard: false,
  });

  const hasUploadingFiles = uploadingFiles.length > 0;

  return (
    <div className={cn('w-full', className)}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 transition-all duration-100 cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isDragActive
            ? 'border-slate-600 bg-slate-50'
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50',
          disabled && 'cursor-not-allowed opacity-50',
          hasUploadingFiles && 'pb-4'
        )}
      >
        <input {...getInputProps()} aria-label="Upload PDF files" />

        <div
          className={cn(
            'rounded-full p-3 transition-colors',
            isDragActive ? 'bg-slate-200' : 'bg-slate-100'
          )}
        >
          <Upload
            className={cn(
              'h-6 w-6 transition-colors',
              isDragActive ? 'text-slate-700' : 'text-slate-500'
            )}
          />
        </div>

        <div className="text-center">
          <p
            className={cn(
              'text-sm font-medium transition-colors',
              isDragActive ? 'text-slate-700' : 'text-slate-600'
            )}
          >
            Drop a document here or click to upload
          </p>
          <p className="mt-1 text-xs text-slate-500">
            PDF files only, up to 50MB (recommended: under 10MB for fastest processing)
          </p>
        </div>

        {/* Rate limit info (AC-4.7.7) */}
        {rateLimitInfo && (
          <div
            className={cn(
              'flex items-center gap-2 text-xs',
              rateLimitInfo.remaining <= 3
                ? 'text-amber-600'
                : 'text-slate-400'
            )}
          >
            <span>
              {rateLimitInfo.remaining} of {rateLimitInfo.limit} uploads remaining this hour
            </span>
            <span className="text-slate-300">•</span>
            <span className="capitalize">{rateLimitInfo.tier} tier</span>
          </div>
        )}
      </div>

      {/* Uploading Files List */}
      {hasUploadingFiles && (
        <div className="mt-4 space-y-2">
          {uploadingFiles.map((uploadFile) => (
            <UploadingFileItem
              key={uploadFile.id}
              file={uploadFile}
              onCancel={onCancelUpload}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface UploadingFileItemProps {
  file: UploadingFile;
  onCancel?: (fileId: string) => void;
}

function UploadingFileItem({ file, onCancel }: UploadingFileItemProps) {
  const { id, file: fileData, progress, status, error } = file;

  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-3">
      <div className="flex-shrink-0">
        <FileText className="h-5 w-5 text-slate-500" />
      </div>

      <div className="min-w-0 flex-1">
        {/* Filename with truncation and tooltip per AC-4.2.2 */}
        <p
          className="truncate text-sm font-medium text-slate-700"
          title={fileData.name}
        >
          {truncateFilename(fileData.name)}
        </p>

        {status === 'uploading' && (
          <div className="mt-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-slate-600 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">{progress}% uploaded</p>
          </div>
        )}

        {status === 'processing' && (
          <div className="mt-1 flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
            <p className="text-xs text-slate-500">Analyzing...</p>
          </div>
        )}

        {status === 'ready' && (
          <p className="mt-1 text-xs text-emerald-600">Ready</p>
        )}

        {status === 'failed' && (
          <p className="mt-1 text-xs text-red-600">{error || 'Upload failed'}</p>
        )}
      </div>

      {status === 'uploading' && onCancel && (
        <button
          type="button"
          onClick={() => onCancel(id)}
          className="flex-shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Cancel upload of ${fileData.name}`}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
