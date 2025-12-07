/**
 * Document Upload Zone Component
 * Story 14.5: Component Scaffolding
 *
 * Drag-and-drop zone for uploading documents.
 * Stub implementation - full functionality in Epic 17.
 */

'use client';

import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DocumentUploadZoneProps {
  onUpload?: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

export function DocumentUploadZone({
  onUpload,
  disabled = false,
  className,
}: DocumentUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0 && onUpload) {
        onUpload(files);
      }
    },
    [disabled, onUpload]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors',
        isDragging
          ? 'border-emerald-500 bg-emerald-500/10'
          : 'border-[var(--chat-border)]',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <Upload className="h-8 w-8 text-[var(--text-muted)] mb-2" />
      <p className="text-sm text-[var(--text-muted)]">
        Drag and drop files here
      </p>
    </div>
  );
}
