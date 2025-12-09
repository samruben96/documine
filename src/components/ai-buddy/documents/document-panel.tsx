/**
 * Document Panel Component
 * Story 17.2: Project Document Management
 *
 * Collapsible right panel showing project documents with add/remove actions.
 *
 * AC-17.2.1: Add Document with Upload/Library options
 * AC-17.2.2: Uploaded documents appear in list
 * AC-17.2.5: Remove documents with confirmation
 * AC-17.2.7: Shows extraction context for quote documents
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { FileText, ChevronRight, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectDocuments } from '@/hooks/ai-buddy/use-project-documents';
import { DocumentCard } from './document-card';
import { AddDocumentMenu } from './add-document-menu';
import { DocumentLibraryPicker } from './document-library-picker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface DocumentPanelProps {
  /** Project ID to show documents for */
  projectId: string | null;
  /** Additional CSS classes */
  className?: string;
  /** Whether panel is collapsed */
  collapsed?: boolean;
  /** Callback when collapse state changes */
  onCollapseChange?: (collapsed: boolean) => void;
}

/**
 * Document Panel Component
 * Collapsible right panel for project document management
 */
export function DocumentPanel({
  projectId,
  className,
  collapsed: controlledCollapsed,
  onCollapseChange,
}: DocumentPanelProps) {
  // Internal collapse state if not controlled
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;

  // Library picker modal state
  const [isLibraryPickerOpen, setIsLibraryPickerOpen] = useState(false);

  // Remove confirmation dialog state
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [documentToRemove, setDocumentToRemove] = useState<string | null>(null);

  // File input ref for uploads
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hook for project documents
  const {
    documents,
    isLoading,
    isAdding,
    isUploading,
    isRemoving,
    error,
    addDocuments,
    uploadDocuments,
    removeDocument,
    canAddMore,
    remainingSlots,
  } = useProjectDocuments({ projectId });

  // Toggle collapse
  const toggleCollapse = () => {
    const newValue = !collapsed;
    setInternalCollapsed(newValue);
    onCollapseChange?.(newValue);
  };

  // Handle file upload
  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle file selection
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        try {
          await uploadDocuments(files);
        } catch (err) {
          console.error('Upload failed:', err);
        }
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [uploadDocuments]
  );

  // Handle library selection
  const handleLibrarySelect = useCallback(
    async (documentIds: string[]) => {
      try {
        await addDocuments(documentIds);
      } catch (err) {
        console.error('Add documents failed:', err);
      }
    },
    [addDocuments]
  );

  // Handle remove click - show confirmation
  const handleRemoveClick = useCallback((documentId: string) => {
    setDocumentToRemove(documentId);
    setRemoveDialogOpen(true);
  }, []);

  // Handle remove confirm
  const handleRemoveConfirm = useCallback(async () => {
    if (documentToRemove) {
      try {
        await removeDocument(documentToRemove);
      } catch (err) {
        console.error('Remove failed:', err);
      }
    }
    setRemoveDialogOpen(false);
    setDocumentToRemove(null);
  }, [documentToRemove, removeDocument]);

  // Get document name for confirmation dialog
  const documentToRemoveName = documentToRemove
    ? documents.find((d) => d.document_id === documentToRemove)?.document.name
    : null;

  // Don't render if no project selected
  if (!projectId) {
    return null;
  }

  // Collapsed view - just a toggle button
  if (collapsed) {
    return (
      <div
        className={cn(
          'flex flex-col items-center py-4 border-l border-slate-200 bg-white',
          className
        )}
      >
        <button
          onClick={toggleCollapse}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Expand document panel"
        >
          <ChevronLeft className="h-5 w-5 text-slate-500" />
        </button>
        <div className="flex flex-col items-center gap-2 mt-4">
          <FileText className="h-5 w-5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium [writing-mode:vertical-lr] rotate-180">
            Documents ({documents.length})
          </span>
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div
      className={cn(
        'flex flex-col w-72 border-l border-slate-200 bg-white',
        className
      )}
      data-testid="document-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-slate-600" />
          <h2 className="font-medium text-slate-900">Documents</h2>
          <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            {documents.length}/{25}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <AddDocumentMenu
            onUpload={handleUpload}
            onSelectFromLibrary={() => setIsLibraryPickerOpen(true)}
            disabled={!canAddMore || isAdding || isUploading}
            remainingSlots={remainingSlots}
          />
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Collapse document panel"
          >
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <AlertCircle className="h-6 w-6 text-red-400 mb-2" />
            <p className="text-sm text-red-600">{error.message}</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center p-4">
            <FileText className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No documents yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Add documents to give AI context about this project
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.document_id}
                document={doc}
                onRemove={handleRemoveClick}
                isRemoving={isRemoving}
                disabled={isAdding || isUploading}
              />
            ))}
          </div>
        )}

        {/* Upload/Add status indicators */}
        {(isAdding || isUploading) && (
          <div className="flex items-center gap-2 p-3 mt-2 rounded-lg bg-emerald-50 border border-emerald-200">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            <span className="text-sm text-emerald-700">
              {isUploading ? 'Uploading...' : 'Adding documents...'}
            </span>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={handleFileChange}
        className="hidden"
        data-testid="panel-file-input"
      />

      {/* Library picker modal */}
      <DocumentLibraryPicker
        open={isLibraryPickerOpen}
        onOpenChange={setIsLibraryPickerOpen}
        excludeDocumentIds={documents.map((d) => d.document_id)}
        onSelect={handleLibrarySelect}
        maxSelection={remainingSlots}
      />

      {/* Remove confirmation dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{documentToRemoveName}</strong> from this
              project. The document will remain in your library and any
              historical citations will stay valid.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
