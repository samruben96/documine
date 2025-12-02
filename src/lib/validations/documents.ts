import { z } from 'zod';

/**
 * Document validation constants
 * Per AC-4.1.4, AC-4.1.5, AC-4.1.6
 * Updated Story 5.8.1: Hybrid approach for large document handling
 * - Soft warning at 10MB (AC-5.8.1.1)
 * - Hard limit at 50MB (existing constraint)
 */
export const DOCUMENT_CONSTANTS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB - hard limit
  SOFT_FILE_SIZE_WARNING: 10 * 1024 * 1024, // 10MB - show warning
  MAX_FILES: 5,
  ACCEPTED_MIME_TYPE: 'application/pdf',
} as const;

/**
 * File upload validation schema
 * Per AC-4.1.4, AC-4.1.5:
 * - Only PDF files accepted (application/pdf MIME type)
 * - Maximum file size: 50MB
 *
 * Uses Zod refinements for custom validation with clear error messages.
 */
export const uploadDocumentSchema = z.object({
  file: z
    .instanceof(File, { message: 'Invalid file' })
    .refine(
      (file) => file.type === DOCUMENT_CONSTANTS.ACCEPTED_MIME_TYPE,
      'Only PDF files are supported'
    )
    .refine(
      (file) => file.size <= DOCUMENT_CONSTANTS.MAX_FILE_SIZE,
      'File too large. Maximum size is 50MB'
    ),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

/**
 * Multi-file upload validation schema
 * Per AC-4.1.6: Maximum 5 files per upload batch
 */
export const uploadMultipleDocumentsSchema = z.object({
  files: z
    .array(uploadDocumentSchema.shape.file)
    .min(1, 'At least one file is required')
    .max(DOCUMENT_CONSTANTS.MAX_FILES, 'Maximum 5 files at once'),
});

export type UploadMultipleDocumentsInput = z.infer<typeof uploadMultipleDocumentsSchema>;

/**
 * Document rename validation schema
 * Per Epic 4 tech spec
 */
export const renameDocumentSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(255, 'Display name must be at most 255 characters'),
});

export type RenameDocumentInput = z.infer<typeof renameDocumentSchema>;

/**
 * Document labels validation schema
 * Per Epic 4 tech spec: max 10 labels, each max 50 chars
 */
export const updateLabelsSchema = z.object({
  labels: z
    .array(
      z.string().min(1, 'Label cannot be empty').max(50, 'Label must be at most 50 characters')
    )
    .max(10, 'Maximum 10 labels allowed'),
});

export type UpdateLabelsInput = z.infer<typeof updateLabelsSchema>;

/**
 * Validate a single file for upload
 * Returns validation result with errors if invalid
 */
export function validateUploadFile(file: File): {
  success: boolean;
  error?: string;
} {
  const result = uploadDocumentSchema.safeParse({ file });

  if (!result.success) {
    const issue = result.error.issues[0];
    return { success: false, error: issue?.message || 'Invalid file' };
  }

  return { success: true };
}

/**
 * Validate multiple files for upload
 * Returns validation result with errors if invalid
 */
export function validateUploadFiles(files: File[]): {
  success: boolean;
  error?: string;
} {
  const result = uploadMultipleDocumentsSchema.safeParse({ files });

  if (!result.success) {
    const issue = result.error.issues[0];
    return { success: false, error: issue?.message || 'Invalid files' };
  }

  return { success: true };
}

/**
 * Check if file size should trigger large file warning
 * Per AC-5.8.1.1: Files 10-50MB should show warning
 * Story 5.8.1 Hybrid Approach
 *
 * @param fileSize - File size in bytes
 * @returns true if file is between 10MB and 50MB (inclusive of 10MB, exclusive of 50MB)
 */
export function shouldWarnLargeFile(fileSize: number): boolean {
  return fileSize >= DOCUMENT_CONSTANTS.SOFT_FILE_SIZE_WARNING &&
         fileSize <= DOCUMENT_CONSTANTS.MAX_FILE_SIZE;
}

/**
 * Format bytes to human-readable string
 * Helper for displaying file sizes in error/warning messages
 *
 * @param bytes - File size in bytes
 * @returns Formatted string like "15.5 MB"
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
