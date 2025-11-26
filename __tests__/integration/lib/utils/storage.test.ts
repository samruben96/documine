import { describe, it, expect, beforeEach } from 'vitest';
import { uploadDocument, getDocumentUrl, deleteDocument } from '@/lib/utils/storage';
import {
  createMockSupabaseClient,
  resetMocks,
  mockStorageUpload,
  mockStorageCreateSignedUrl,
  mockStorageRemove,
  createMockFile,
} from '../../../mocks/supabase';

describe('storage utilities', () => {
  const mockSupabase = createMockSupabaseClient();

  beforeEach(() => {
    resetMocks();
  });

  describe('uploadDocument', () => {
    it('should return correct storage path on success', async () => {
      mockStorageUpload.mockResolvedValue({ error: null });

      const file = createMockFile('test-document.pdf');
      const agencyId = 'agency-123';
      const documentId = 'doc-456';

      const result = await uploadDocument(mockSupabase, file, agencyId, documentId);

      expect(result).toBe('agency-123/doc-456/test-document.pdf');
    });

    it('should upload to documents bucket', async () => {
      mockStorageUpload.mockResolvedValue({ error: null });

      const file = createMockFile('test.pdf');
      await uploadDocument(mockSupabase, file, 'agency-1', 'doc-1');

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('documents');
    });

    it('should upload with correct path structure', async () => {
      mockStorageUpload.mockResolvedValue({ error: null });

      const file = createMockFile('contract.pdf');
      const agencyId = 'agency-abc';
      const documentId = 'doc-xyz';

      await uploadDocument(mockSupabase, file, agencyId, documentId);

      expect(mockStorageUpload).toHaveBeenCalledWith(
        'agency-abc/doc-xyz/contract.pdf',
        file
      );
    });

    it('should throw error when upload fails', async () => {
      mockStorageUpload.mockResolvedValue({
        error: { message: 'Storage quota exceeded' },
      });

      const file = createMockFile('large-file.pdf');

      await expect(
        uploadDocument(mockSupabase, file, 'agency-1', 'doc-1')
      ).rejects.toThrow('Failed to upload document: Storage quota exceeded');
    });

    it('should handle filenames with special characters', async () => {
      mockStorageUpload.mockResolvedValue({ error: null });

      const file = createMockFile('my document (copy).pdf');
      const result = await uploadDocument(mockSupabase, file, 'a1', 'd1');

      expect(result).toBe('a1/d1/my document (copy).pdf');
    });
  });

  describe('getDocumentUrl', () => {
    it('should return signed URL on success', async () => {
      const expectedUrl = 'https://storage.example.com/signed/abc123';
      mockStorageCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: expectedUrl },
        error: null,
      });

      const result = await getDocumentUrl(mockSupabase, 'agency-1/doc-1/file.pdf');

      expect(result).toBe(expectedUrl);
    });

    it('should call createSignedUrl with correct path', async () => {
      mockStorageCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://example.com/url' },
        error: null,
      });

      const storagePath = 'agency-x/doc-y/report.pdf';
      await getDocumentUrl(mockSupabase, storagePath);

      expect(mockStorageCreateSignedUrl).toHaveBeenCalledWith(
        'agency-x/doc-y/report.pdf',
        3600 // 1 hour expiry
      );
    });

    it('should use documents bucket', async () => {
      mockStorageCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://example.com/url' },
        error: null,
      });

      await getDocumentUrl(mockSupabase, 'some/path');

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('documents');
    });

    it('should throw error when URL generation fails', async () => {
      mockStorageCreateSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'Object not found' },
      });

      await expect(
        getDocumentUrl(mockSupabase, 'missing/path')
      ).rejects.toThrow('Failed to generate signed URL: Object not found');
    });
  });

  describe('deleteDocument', () => {
    it('should complete successfully when deletion succeeds', async () => {
      mockStorageRemove.mockResolvedValue({ error: null });

      await expect(
        deleteDocument(mockSupabase, 'agency-1/doc-1/file.pdf')
      ).resolves.toBeUndefined();
    });

    it('should call remove with path array', async () => {
      mockStorageRemove.mockResolvedValue({ error: null });

      const storagePath = 'agency-abc/doc-xyz/document.pdf';
      await deleteDocument(mockSupabase, storagePath);

      expect(mockStorageRemove).toHaveBeenCalledWith([
        'agency-abc/doc-xyz/document.pdf',
      ]);
    });

    it('should use documents bucket', async () => {
      mockStorageRemove.mockResolvedValue({ error: null });

      await deleteDocument(mockSupabase, 'any/path');

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('documents');
    });

    it('should throw error when deletion fails', async () => {
      mockStorageRemove.mockResolvedValue({
        error: { message: 'Permission denied' },
      });

      await expect(
        deleteDocument(mockSupabase, 'agency-1/doc-1/file.pdf')
      ).rejects.toThrow('Failed to delete document: Permission denied');
    });

    it('should handle paths with special characters', async () => {
      mockStorageRemove.mockResolvedValue({ error: null });

      const storagePath = 'agency-1/doc-2/report (final).pdf';
      await deleteDocument(mockSupabase, storagePath);

      expect(mockStorageRemove).toHaveBeenCalledWith([storagePath]);
    });
  });
});
