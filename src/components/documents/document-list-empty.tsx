'use client';

import { FileUp } from 'lucide-react';
import { UploadZone } from './upload-zone';

interface DocumentListEmptyProps {
  onFilesAccepted: (files: File[]) => void;
  disabled?: boolean;
}

/**
 * Document List Empty State Component
 *
 * Shown when no documents exist in sidebar.
 * Implements:
 * - AC-4.3.9: Empty state with centered upload zone
 * - AC-6.7.6-10: Engaging empty state with value proposition
 */
export function DocumentListEmpty({
  onFilesAccepted,
  disabled = false,
}: DocumentListEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
      {/* Icon - AC-6.7.6 */}
      <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4">
        <FileUp className="h-8 w-8 text-slate-400 dark:text-slate-500" />
      </div>

      {/* Headline - AC-6.7.6 */}
      <h3 className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
        Ready to analyze
      </h3>

      {/* Value proposition - AC-6.7.6 */}
      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-[200px]">
        Upload a policy, quote, or certificate and start asking questions in seconds
      </p>

      {/* Upload zone - AC-6.7.7 */}
      <div className="mt-5 w-full max-w-xs">
        <UploadZone
          onFilesAccepted={onFilesAccepted}
          disabled={disabled}
          className="border-slate-200 dark:border-slate-700"
        />
      </div>
    </div>
  );
}
