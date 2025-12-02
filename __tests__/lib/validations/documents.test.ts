import { describe, it, expect } from 'vitest';
import {
  uploadDocumentSchema,
  uploadMultipleDocumentsSchema,
  renameDocumentSchema,
  updateLabelsSchema,
  validateUploadFile,
  validateUploadFiles,
  DOCUMENT_CONSTANTS,
  shouldWarnLargeFile,
  formatBytes,
} from '@/lib/validations/documents';

describe('Document Validation Schemas', () => {
  describe('DOCUMENT_CONSTANTS', () => {
    it('defines MAX_FILE_SIZE as 50MB', () => {
      expect(DOCUMENT_CONSTANTS.MAX_FILE_SIZE).toBe(50 * 1024 * 1024);
    });

    it('defines SOFT_FILE_SIZE_WARNING as 10MB (Story 5.8.1)', () => {
      expect(DOCUMENT_CONSTANTS.SOFT_FILE_SIZE_WARNING).toBe(10 * 1024 * 1024);
    });

    it('defines MAX_FILES as 5', () => {
      expect(DOCUMENT_CONSTANTS.MAX_FILES).toBe(5);
    });

    it('defines ACCEPTED_MIME_TYPE as application/pdf', () => {
      expect(DOCUMENT_CONSTANTS.ACCEPTED_MIME_TYPE).toBe('application/pdf');
    });
  });

  describe('uploadDocumentSchema', () => {
    it('accepts valid PDF file', () => {
      const file = new File(['test content'], 'document.pdf', {
        type: 'application/pdf',
      });

      const result = uploadDocumentSchema.safeParse({ file });
      expect(result.success).toBe(true);
    });

    it('rejects non-PDF file', () => {
      const file = new File(['test content'], 'document.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const result = uploadDocumentSchema.safeParse({ file });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Only PDF files are supported');
      }
    });

    it('rejects file over 50MB', () => {
      // Create a mock file object with size > 50MB
      const largeContent = new ArrayBuffer(51 * 1024 * 1024);
      const file = new File([largeContent], 'large.pdf', {
        type: 'application/pdf',
      });

      const result = uploadDocumentSchema.safeParse({ file });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'File too large. Maximum size is 50MB'
        );
      }
    });

    it('accepts file exactly at 50MB limit', () => {
      const content = new ArrayBuffer(50 * 1024 * 1024);
      const file = new File([content], 'exact-limit.pdf', {
        type: 'application/pdf',
      });

      const result = uploadDocumentSchema.safeParse({ file });
      expect(result.success).toBe(true);
    });
  });

  describe('uploadMultipleDocumentsSchema', () => {
    const createPdfFile = (name: string) =>
      new File(['test'], name, { type: 'application/pdf' });

    it('accepts up to 5 files', () => {
      const files = [
        createPdfFile('1.pdf'),
        createPdfFile('2.pdf'),
        createPdfFile('3.pdf'),
        createPdfFile('4.pdf'),
        createPdfFile('5.pdf'),
      ];

      const result = uploadMultipleDocumentsSchema.safeParse({ files });
      expect(result.success).toBe(true);
    });

    it('rejects more than 5 files', () => {
      const files = [
        createPdfFile('1.pdf'),
        createPdfFile('2.pdf'),
        createPdfFile('3.pdf'),
        createPdfFile('4.pdf'),
        createPdfFile('5.pdf'),
        createPdfFile('6.pdf'),
      ];

      const result = uploadMultipleDocumentsSchema.safeParse({ files });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Maximum 5 files at once');
      }
    });

    it('rejects empty file array', () => {
      const result = uploadMultipleDocumentsSchema.safeParse({ files: [] });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least one file is required');
      }
    });

    it('rejects if any file is not PDF', () => {
      const files = [
        createPdfFile('valid.pdf'),
        new File(['test'], 'invalid.docx', { type: 'application/msword' }),
      ];

      const result = uploadMultipleDocumentsSchema.safeParse({ files });
      expect(result.success).toBe(false);
    });
  });

  describe('renameDocumentSchema', () => {
    it('accepts valid display name', () => {
      const result = renameDocumentSchema.safeParse({ displayName: 'My Document' });
      expect(result.success).toBe(true);
    });

    it('rejects empty display name', () => {
      const result = renameDocumentSchema.safeParse({ displayName: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Display name is required');
      }
    });

    it('rejects display name over 255 characters', () => {
      const longName = 'a'.repeat(256);
      const result = renameDocumentSchema.safeParse({ displayName: longName });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Display name must be at most 255 characters'
        );
      }
    });

    it('accepts display name at 255 character limit', () => {
      const maxName = 'a'.repeat(255);
      const result = renameDocumentSchema.safeParse({ displayName: maxName });
      expect(result.success).toBe(true);
    });
  });

  describe('updateLabelsSchema', () => {
    it('accepts valid labels array', () => {
      const result = updateLabelsSchema.safeParse({
        labels: ['Policy', 'Quote', 'Important'],
      });
      expect(result.success).toBe(true);
    });

    it('accepts empty labels array', () => {
      const result = updateLabelsSchema.safeParse({ labels: [] });
      expect(result.success).toBe(true);
    });

    it('rejects more than 10 labels', () => {
      const labels = Array.from({ length: 11 }, (_, i) => `label-${i}`);
      const result = updateLabelsSchema.safeParse({ labels });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Maximum 10 labels allowed');
      }
    });

    it('rejects empty label string', () => {
      const result = updateLabelsSchema.safeParse({ labels: ['Valid', ''] });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Label cannot be empty');
      }
    });

    it('rejects label over 50 characters', () => {
      const longLabel = 'a'.repeat(51);
      const result = updateLabelsSchema.safeParse({ labels: [longLabel] });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Label must be at most 50 characters'
        );
      }
    });
  });

  describe('validateUploadFile', () => {
    it('returns success for valid PDF file', () => {
      const file = new File(['test'], 'doc.pdf', { type: 'application/pdf' });
      const result = validateUploadFile(file);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns error for non-PDF file', () => {
      const file = new File(['test'], 'doc.txt', { type: 'text/plain' });
      const result = validateUploadFile(file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only PDF files are supported');
    });

    it('returns error for oversized file', () => {
      const largeContent = new ArrayBuffer(51 * 1024 * 1024);
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      const result = validateUploadFile(file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('File too large. Maximum size is 50MB');
    });
  });

  describe('validateUploadFiles', () => {
    const createPdfFile = (name: string) =>
      new File(['test'], name, { type: 'application/pdf' });

    it('returns success for valid file array', () => {
      const files = [createPdfFile('1.pdf'), createPdfFile('2.pdf')];
      const result = validateUploadFiles(files);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns error for too many files', () => {
      const files = Array.from({ length: 6 }, (_, i) => createPdfFile(`${i}.pdf`));
      const result = validateUploadFiles(files);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Maximum 5 files at once');
    });

    it('returns error for empty file array', () => {
      const result = validateUploadFiles([]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('At least one file is required');
    });
  });

  // Story 5.8.1: Large file warning tests (AC-5.8.1.1)
  describe('shouldWarnLargeFile', () => {
    it('returns false for files under 10MB', () => {
      const size = 5 * 1024 * 1024; // 5MB
      expect(shouldWarnLargeFile(size)).toBe(false);
    });

    it('returns true for file exactly at 10MB', () => {
      const size = 10 * 1024 * 1024; // 10MB
      expect(shouldWarnLargeFile(size)).toBe(true);
    });

    it('returns true for file between 10-50MB', () => {
      const size = 30 * 1024 * 1024; // 30MB
      expect(shouldWarnLargeFile(size)).toBe(true);
    });

    it('returns true for file exactly at 50MB', () => {
      const size = 50 * 1024 * 1024; // 50MB
      expect(shouldWarnLargeFile(size)).toBe(true);
    });

    it('returns false for file over 50MB (would be rejected)', () => {
      const size = 51 * 1024 * 1024; // 51MB
      expect(shouldWarnLargeFile(size)).toBe(false);
    });
  });

  describe('formatBytes', () => {
    it('formats 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('formats bytes', () => {
      expect(formatBytes(500)).toBe('500.0 Bytes');
    });

    it('formats kilobytes', () => {
      expect(formatBytes(1024)).toBe('1.0 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });

    it('formats megabytes', () => {
      expect(formatBytes(1048576)).toBe('1.0 MB');
      expect(formatBytes(10485760)).toBe('10.0 MB');
      expect(formatBytes(52428800)).toBe('50.0 MB');
    });

    it('formats gigabytes', () => {
      expect(formatBytes(1073741824)).toBe('1.0 GB');
    });
  });
});
