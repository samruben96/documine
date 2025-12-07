/**
 * Document Panel Component
 * Story 14.5: Component Scaffolding
 *
 * Panel for viewing and managing project documents.
 * Stub implementation - full functionality in Epic 17.
 */

import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DocumentPanelProps {
  documents?: Array<{ id: string; name: string; status: string }>;
  onUpload?: () => void;
  className?: string;
}

export function DocumentPanel({
  documents = [],
  onUpload,
  className,
}: DocumentPanelProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between p-4 border-b border-[var(--chat-border)]">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">
          Documents
        </h3>
        <Button size="sm" variant="ghost" onClick={onUpload}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {documents.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No documents</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 p-2 rounded bg-[var(--chat-surface)]"
              >
                <FileText className="h-4 w-4 text-[var(--text-muted)]" />
                <span className="text-sm text-[var(--text-primary)] truncate">
                  {doc.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
