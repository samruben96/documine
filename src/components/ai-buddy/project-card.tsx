/**
 * Project Card Component
 * Story 16.1: Project Creation & Sidebar
 * Story 16.3: Project Management - Rename & Archive
 *
 * Displays a project in the sidebar list with inline edit support.
 *
 * AC-16.1.9: Name truncated at 25 chars, document count badge
 * AC-16.1.10: Active project has visual indicator
 * AC-16.3.2: Selecting "Rename" enables inline editing
 * AC-16.3.3: Enter saves, Escape cancels
 */

'use client';

import { FolderOpen, MoreVertical, Archive, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useState, useRef, useEffect } from 'react';
import type { Project } from '@/types/ai-buddy';
import { ProjectContextMenu } from './project-context-menu';

export interface ProjectCardProps {
  project: Project;
  isActive?: boolean;
  onClick?: () => void;
  onArchive?: (id: string) => void;
  /** Callback when project is renamed (Story 16.3) */
  onRename?: (id: string, newName: string) => void;
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
  onRename,
  className,
}: ProjectCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(project.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset edit value when project changes
  useEffect(() => {
    setEditValue(project.name);
  }, [project.name]);

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive?.(project.id);
    setIsMenuOpen(false);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditValue(project.name);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue(project.name);
  };

  const handleSaveEdit = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== project.name) {
      onRename?.(project.id, trimmedValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const truncatedName = truncateName(project.name);
  const documentCount = project.documentCount ?? 0;

  const cardContent = (
    <button
      type="button"
      onClick={isEditing ? undefined : onClick}
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
        {isEditing ? (
          // AC-16.3.2: Inline editing mode
          <Input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSaveEdit}
            onClick={(e) => e.stopPropagation()}
            className="h-6 text-sm py-0 px-1"
            maxLength={100}
            data-testid={`project-name-input-${project.id}`}
          />
        ) : (
          <span
            className="text-sm font-medium text-[var(--text-primary)] truncate"
            title={project.name}
          >
            {truncatedName}
          </span>
        )}
        {!isEditing && documentCount > 0 && (
          <span
            className="text-xs text-[var(--text-muted)] bg-[var(--sidebar-hover)] px-1.5 py-0.5 rounded-full flex-shrink-0"
            data-testid={`project-doc-count-${project.id}`}
          >
            {documentCount}
          </span>
        )}
      </div>

      {!isEditing && (onArchive || onRename) && (
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
            {onRename && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartEdit();
                  setIsMenuOpen(false);
                }}
                className="cursor-pointer"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
            )}
            {onArchive && (
              <DropdownMenuItem
                onClick={handleArchive}
                className="cursor-pointer"
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </button>
  );

  // AC-16.3.1: Wrap with context menu for right-click support
  if ((onArchive || onRename) && !isEditing) {
    return (
      <ProjectContextMenu
        project={project}
        onRename={handleStartEdit}
        onArchive={() => onArchive?.(project.id)}
        disabled={isEditing}
      >
        {cardContent}
      </ProjectContextMenu>
    );
  }

  return cardContent;
}
