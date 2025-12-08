/**
 * Project Card Component
 * Story 16.1: Project Creation & Sidebar
 *
 * Displays a project in the sidebar list.
 *
 * AC-16.1.9: Name truncated at 25 chars, document count badge
 * AC-16.1.10: Active project has visual indicator
 */

'use client';

import { FolderOpen, MoreVertical, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import type { Project } from '@/types/ai-buddy';

export interface ProjectCardProps {
  project: Project;
  isActive?: boolean;
  onClick?: () => void;
  onArchive?: (id: string) => void;
  className?: string;
}

/**
 * Truncate text to specified length with ellipsis
 * AC-16.1.9: Name truncated at 25 chars
 */
function truncateName(text: string, maxLength = 25): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function ProjectCard({
  project,
  isActive = false,
  onClick,
  onArchive,
  className,
}: ProjectCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive?.(project.id);
    setIsMenuOpen(false);
  };

  const truncatedName = truncateName(project.name);
  const documentCount = project.documentCount ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`project-card-${project.id}`}
      className={cn(
        'w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left group',
        isActive
          ? 'bg-[var(--sidebar-active)]'
          : 'hover:bg-[var(--sidebar-hover)]',
        className
      )}
    >
      <FolderOpen className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span
          className="text-sm font-medium text-[var(--text-primary)] truncate"
          title={project.name}
        >
          {truncatedName}
        </span>
        {documentCount > 0 && (
          <span
            className="text-xs text-[var(--text-muted)] bg-[var(--sidebar-hover)] px-1.5 py-0.5 rounded-full flex-shrink-0"
            data-testid={`project-doc-count-${project.id}`}
          >
            {documentCount}
          </span>
        )}
      </div>

      {onArchive && (
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <span
              className={cn(
                'h-6 w-6 flex items-center justify-center rounded hover:bg-[var(--sidebar-hover)] cursor-pointer',
                isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}
              data-testid={`project-menu-${project.id}`}
            >
              <MoreVertical className="h-4 w-4 text-[var(--text-muted)]" />
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem
              onClick={handleArchive}
              className="cursor-pointer"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </button>
  );
}
