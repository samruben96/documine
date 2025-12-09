/**
 * Project Context Menu Component
 * Story 16.3: Project Management - Rename & Archive
 *
 * Right-click context menu for project cards with Rename and Archive options.
 *
 * AC-16.3.1: Right-click on project card shows context menu with "Rename" and "Archive" options
 */

'use client';

import { Pencil, Archive } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { Project } from '@/types/ai-buddy';

export interface ProjectContextMenuProps {
  /** The project this menu is for */
  project: Project;
  /** Callback when "Rename" is selected */
  onRename: () => void;
  /** Callback when "Archive" is selected */
  onArchive: () => void;
  /** Trigger element (ProjectCard) */
  children: React.ReactNode;
  /** Disable context menu (e.g., during editing) */
  disabled?: boolean;
}

export function ProjectContextMenu({
  project,
  onRename,
  onArchive,
  children,
  disabled = false,
}: ProjectContextMenuProps) {
  if (disabled) {
    // When disabled, just render children without context menu
    return <>{children}</>;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild data-testid={`project-context-trigger-${project.id}`}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent data-testid={`project-context-menu-${project.id}`}>
        <ContextMenuItem
          onClick={onRename}
          className="cursor-pointer"
          data-testid="context-menu-rename"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem
          onClick={onArchive}
          className="cursor-pointer"
          data-testid="context-menu-archive"
        >
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
