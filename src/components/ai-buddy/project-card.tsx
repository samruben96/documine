/**
 * Project Card Component
 * Story 14.5: Component Scaffolding
 *
 * Displays a project in the sidebar.
 * Stub implementation - full functionality in Epic 16.
 */

import { Folder, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProjectCardProps {
  name: string;
  documentCount?: number;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ProjectCard({
  name,
  documentCount = 0,
  isActive = false,
  onClick,
  className,
}: ProjectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left',
        isActive
          ? 'bg-[var(--sidebar-active)]'
          : 'hover:bg-[var(--sidebar-hover)]',
        className
      )}
    >
      <Folder className="h-4 w-4 text-[var(--text-muted)]" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
          {name}
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          {documentCount} document{documentCount !== 1 ? 's' : ''}
        </p>
      </div>
      <MoreVertical className="h-4 w-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100" />
    </button>
  );
}
