'use client';

import { useState, useCallback, useTransition, useEffect } from 'react';
import { toast } from 'sonner';
import { FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

import { UploadZone, type UploadingFile } from '@/components/documents/upload-zone';
import { uploadDocument, getDocuments, type Document } from './actions';

/**
 * Documents Page
 *
 * Main document management interface with upload zone integration.
 * Implements AC-4.1.1 through AC-4.1.8.
 */
export default function DocumentsPage() {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    setIsLoading(true);
    try {
      const result = await getDocuments();
      if (result.success && result.documents) {
        setDocuments(result.documents);
      }
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Handle accepted files from upload zone
   * Creates FormData for each file and calls server action
   */
  const handleFilesAccepted = useCallback((files: File[]) => {
    // Create uploading file entries for each file
    const newUploadingFiles: UploadingFile[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    // Upload each file
    newUploadingFiles.forEach((uploadingFile) => {
      uploadFile(uploadingFile);
    });
  }, []);

  /**
   * Upload a single file using server action
   */
  async function uploadFile(uploadingFile: UploadingFile) {
    const { id, file } = uploadingFile;

    try {
      // Update progress to simulate upload (actual progress tracking requires different approach)
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, progress: 30, status: 'uploading' as const } : f
        )
      );

      // Create FormData and call server action
      const formData = new FormData();
      formData.append('file', file);

      // Update to processing state
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, progress: 80, status: 'uploading' as const } : f
        )
      );

      const result = await uploadDocument(formData);

      if (result.success && result.document) {
        // Mark as ready and show success
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, progress: 100, status: 'ready' as const } : f
          )
        );

        toast.success(`${file.name} is ready`);

        // Add to documents list
        setDocuments((prev) => [result.document!, ...prev]);

        // Remove from uploading list after delay
        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
        }, 2000);
      } else {
        // Mark as failed
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? { ...f, status: 'failed' as const, error: result.error }
              : f
          )
        );
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      // Mark as failed on exception
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                status: 'failed' as const,
                error: error instanceof Error ? error.message : 'Upload failed',
              }
            : f
        )
      );
      toast.error('Upload failed');
    }
  }

  /**
   * Cancel an in-progress upload
   */
  const handleCancelUpload = useCallback((fileId: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
    toast.info('Upload cancelled');
  }, []);

  /**
   * Format relative date for display
   */
  function formatRelativeDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /**
   * Get status icon for document
   */
  function getStatusIcon(status: string) {
    switch (status) {
      case 'ready':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-slate-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-slate-500" />;
    }
  }

  const hasDocuments = documents.length > 0 || uploadingFiles.length > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Documents</h1>
      </div>

      {/* Upload Zone */}
      <UploadZone
        onFilesAccepted={handleFilesAccepted}
        uploadingFiles={uploadingFiles}
        onCancelUpload={handleCancelUpload}
        disabled={isPending}
      />

      {/* Documents List */}
      {isLoading ? (
        <div className="rounded-lg border bg-white p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="ml-2 text-sm text-slate-500">Loading documents...</span>
          </div>
        </div>
      ) : hasDocuments ? (
        <div className="rounded-lg border bg-white divide-y">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex-shrink-0">
                <FileText className="h-5 w-5 text-slate-500" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-700">
                  {doc.display_name || doc.filename}
                </p>
                <p className="text-xs text-slate-500">
                  {formatRelativeDate(doc.created_at)}
                </p>
              </div>

              <div className="flex-shrink-0">
                {getStatusIcon(doc.status)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            No documents yet
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Upload your first document to get started
          </p>
        </div>
      )}
    </div>
  );
}
