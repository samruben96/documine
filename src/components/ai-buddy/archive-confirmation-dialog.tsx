/**
 * Archive Confirmation Dialog Component
 * Story 16.3: Project Management - Rename & Archive
 *
 * Confirmation dialog before archiving a project.
 *
 * AC-16.3.5: Archive shows confirmation dialog "Archive [Project Name]?"
 */

'use client';

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
import type { Project } from '@/types/ai-buddy';

export interface ArchiveConfirmationDialogProps {
  /** The project to archive */
  project: Project | null;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the dialog is closed */
  onOpenChange: (open: boolean) => void;
  /** Callback when archive is confirmed */
  onConfirm: (projectId: string) => void;
  /** Whether the archive operation is in progress */
  isLoading?: boolean;
}

export function ArchiveConfirmationDialog({
  project,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: ArchiveConfirmationDialogProps) {
  const handleConfirm = () => {
    if (project) {
      onConfirm(project.id);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="archive-confirmation-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Archive {project?.name || 'Project'}?</AlertDialogTitle>
          <AlertDialogDescription>
            This project will be moved to your archived projects. You can restore it at any time
            from the archived projects list.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} data-testid="archive-cancel-button">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="archive-confirm-button"
          >
            {isLoading ? 'Archiving...' : 'Archive'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
