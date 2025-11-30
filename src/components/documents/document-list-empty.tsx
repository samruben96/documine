'use client';

import { FileText } from 'lucide-react';
import { UploadZone } from './upload-zone';

interface DocumentListEmptyProps {
  onFilesAccepted: (files: File[]) => void;
  disabled?: boolean;
}

/**
 * Document List Empty State Component
 *
 * Shown when no documents exist.
 * Implements AC-4.3.9: Empty state with centered upload zone.
 */
export function DocumentListEmpty({
  onFilesAccepted,
  disabled = false,
}: DocumentListEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="rounded-full bg-slate-100 p-4">
        <FileText className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="mt-4 text-sm font-medium text-slate-700">
        No documents yet
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        Upload your first document to get started
      </p>
      <div className="mt-6 w-full max-w-xs">
        <UploadZone
          onFilesAccepted={onFilesAccepted}
          disabled={disabled}
          className="border-slate-200"
        />
      </div>
    </div>
  );
}
