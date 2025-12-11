'use client';

/**
 * FileUploader Component
 * Epic 23: Flexible AI Reports
 * Story 23.1: File Upload Infrastructure
 *
 * AC-23.1.1: Upload Excel (.xlsx, .xls), CSV (.csv), and PDF (.pdf) files up to 50MB via dropzone
 * AC-23.1.2: Upload progress indicator shows percentage complete
 * AC-23.1.3: Invalid file types show clear error message with supported formats
 */

import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, Loader2, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ALLOWED_FILE_TYPES,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  type UploadResponse,
  type ApiError,
} from '@/types/reporting';

// Constants
const MAX_FILES = 1; // One file at a time for reports
const FILENAME_MAX_LENGTH = 40;

/**
 * Truncate filename with ellipsis if too long
 */
function truncateFilename(filename: string, maxLength: number = FILENAME_MAX_LENGTH): string {
  if (filename.length <= maxLength) return filename;

  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) {
    return filename.slice(0, maxLength - 3) + '...';
  }

  const extension = filename.slice(lastDot);
  const name = filename.slice(0, lastDot);
  const availableLength = maxLength - extension.length - 3;

  if (availableLength <= 0) {
    return filename.slice(0, maxLength - 3) + '...';
  }

  return name.slice(0, availableLength) + '...' + extension;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'success' | 'failed';
  error?: string;
  sourceId?: string;
}

interface FileUploaderProps {
  onUploadComplete?: (sourceId: string, filename: string) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * FileUploader Component for data files
 *
 * Features:
 * - Drag-and-drop file upload
 * - File type validation (xlsx, xls, csv, pdf)
 * - File size validation (50MB limit)
 * - Upload progress indicator
 * - Success/error states
 */
export function FileUploader({
  onUploadComplete,
  onUploadError,
  disabled = false,
  className,
}: FileUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<UploadingFile | null>(null);

  const uploadFile = async (file: File) => {
    const fileId = crypto.randomUUID();
    setUploadingFile({
      id: fileId,
      file,
      progress: 0,
      status: 'uploading',
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use XMLHttpRequest for progress tracking (AC-23.1.2)
      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise<UploadResponse>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadingFile((prev) =>
              prev ? { ...prev, progress } : null
            );
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.data) {
                resolve(response.data as UploadResponse);
              } else if (response.error) {
                reject(new Error(response.error.message));
              } else {
                reject(new Error('Invalid response format'));
              }
            } catch {
              reject(new Error('Failed to parse response'));
            }
          } else {
            try {
              const response = JSON.parse(xhr.responseText);
              const error = response.error as ApiError;
              reject(new Error(error?.message || `Upload failed with status ${xhr.status}`));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });

        xhr.open('POST', '/api/reporting/upload');
        xhr.send(formData);
      });

      const result = await uploadPromise;

      // Update to success state
      setUploadingFile((prev) =>
        prev
          ? {
              ...prev,
              progress: 100,
              status: 'success',
              sourceId: result.sourceId,
            }
          : null
      );

      toast.success(`${file.name} uploaded successfully`);
      onUploadComplete?.(result.sourceId, file.name);

      // Clear after a delay
      setTimeout(() => {
        setUploadingFile(null);
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';

      setUploadingFile((prev) =>
        prev
          ? {
              ...prev,
              status: 'failed',
              error: errorMessage,
            }
          : null
      );

      toast.error(errorMessage);
      onUploadError?.(errorMessage);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Handle rejected files
      for (const rejection of rejectedFiles) {
        const { file, errors } = rejection;

        for (const error of errors) {
          if (error.code === 'file-too-large') {
            toast.error(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
          } else if (error.code === 'file-invalid-type') {
            toast.error(
              `Invalid file type. Supported formats: ${ALLOWED_FILE_TYPES.join(', ').toUpperCase()}`
            );
          } else if (error.code === 'too-many-files') {
            toast.error('Please upload one file at a time');
          } else {
            toast.error(`Error with ${file.name}: ${error.message}`);
          }
        }
      }

      // Handle accepted files (one at a time)
      if (acceptedFiles.length > 0 && acceptedFiles[0]) {
        uploadFile(acceptedFiles[0]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const onDragEnter = useCallback(() => {
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragActive(false);
  }, []);

  const cancelUpload = () => {
    setUploadingFile(null);
  };

  // Build accept object for react-dropzone
  const acceptConfig = Object.fromEntries(
    Object.entries(ALLOWED_MIME_TYPES).flatMap(([, mimeTypes]) =>
      mimeTypes.map((mime) => [mime, []])
    )
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter,
    onDragLeave,
    accept: acceptConfig,
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES,
    disabled: disabled || uploadingFile?.status === 'uploading',
    noClick: false,
    noKeyboard: false,
  });

  const isUploading = uploadingFile?.status === 'uploading';

  return (
    <div className={cn('w-full', className)}>
      {/* Drop Zone - AC-23.8.1, AC-23.8.4: Enhanced accessibility and mobile touch targets */}
      <div
        {...getRootProps()}
        role="button"
        tabIndex={disabled || isUploading ? -1 : 0}
        aria-label="Upload data file. Drag and drop or click to select. Supported formats: Excel, CSV, PDF up to 50MB"
        aria-disabled={disabled || isUploading}
        className={cn(
          'relative flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed transition-all duration-100 cursor-pointer',
          // Mobile: larger touch target (min 44px height with p-6), Desktop: p-8
          'p-6 min-h-[120px] sm:p-8 sm:min-h-[160px]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50',
          (disabled || isUploading) && 'cursor-not-allowed opacity-50'
        )}
      >
        <input {...getInputProps()} aria-label="Upload data file" />

        <div
          className={cn(
            'rounded-full p-3 transition-colors',
            isDragActive ? 'bg-primary/10' : 'bg-slate-100'
          )}
          aria-hidden="true"
        >
          <Upload
            className={cn(
              'h-6 w-6 transition-colors',
              isDragActive ? 'text-primary' : 'text-slate-500'
            )}
            aria-hidden="true"
          />
        </div>

        <div className="text-center">
          <p
            className={cn(
              'text-sm font-medium transition-colors',
              isDragActive ? 'text-primary' : 'text-slate-600'
            )}
          >
            Drop a data file here or click to upload
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Excel (.xlsx, .xls), CSV, or PDF files up to 50MB
          </p>
        </div>
      </div>

      {/* Uploading File Status */}
      {uploadingFile && (
        <div className="mt-4">
          <UploadingFileItem file={uploadingFile} onCancel={cancelUpload} />
        </div>
      )}
    </div>
  );
}

interface UploadingFileItemProps {
  file: UploadingFile;
  onCancel?: () => void;
}

function UploadingFileItem({ file, onCancel }: UploadingFileItemProps) {
  const { file: fileData, progress, status, error } = file;

  return (
    <div
      className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-3"
      role="status"
      aria-live="polite"
      aria-label={`File ${fileData.name}: ${status === 'uploading' ? `${progress}% uploaded` : status}`}
    >
      <div className="flex-shrink-0" aria-hidden="true">
        <FileSpreadsheet className="h-5 w-5 text-slate-500" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className="truncate text-sm font-medium text-slate-700"
            title={fileData.name}
          >
            {truncateFilename(fileData.name)}
          </p>
          <span className="text-xs text-slate-400">
            {formatFileSize(fileData.size)}
          </span>
        </div>

        {status === 'uploading' && (
          <div className="mt-1.5">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Upload progress: ${progress}%`}
            >
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500" aria-hidden="true">{progress}% uploaded</p>
          </div>
        )}

        {status === 'processing' && (
          <div className="mt-1 flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin text-slate-500" aria-hidden="true" />
            <p className="text-xs text-slate-500">Processing...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" aria-hidden="true" />
            <p className="text-xs text-emerald-600">Uploaded successfully</p>
          </div>
        )}

        {status === 'failed' && (
          <p className="mt-1 text-xs text-red-600" role="alert">{error || 'Upload failed'}</p>
        )}
      </div>

      {status === 'uploading' && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="flex-shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Cancel upload of ${fileData.name}`}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
