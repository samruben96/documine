/**
 * Archived Projects Sheet Component
 * Story 16.3: Project Management - Rename & Archive
 *
 * Side sheet showing archived projects with restore option.
 *
 * AC-16.3.7: "View Archived" link shows archived projects with restore option
 * AC-16.3.8: Restoring project clears archived_at and returns to main list
 */

'use client';

import { Archive, RotateCcw, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import type { Project } from '@/types/ai-buddy';

export interface ArchivedProjectsSheetProps {
  /** Whether the sheet is open */
  open: boolean;
  /** Callback when the sheet is closed */
  onOpenChange: (open: boolean) => void;
  /** List of archived projects */
  archivedProjects: Project[];
  /** Callback when a project is restored */
  onRestore: (projectId: string) => void;
  /** Whether the restore operation is in progress */
  isLoading?: boolean;
  /** ID of project currently being restored */
  restoringProjectId?: string | null;
}

export function ArchivedProjectsSheet({
  open,
  onOpenChange,
  archivedProjects,
  onRestore,
  isLoading = false,
  restoringProjectId = null,
}: ArchivedProjectsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]" data-testid="archived-projects-sheet">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archived Projects
          </SheetTitle>
          <SheetDescription>
            {archivedProjects.length === 0
              ? 'No archived projects'
              : `${archivedProjects.length} archived project${archivedProjects.length !== 1 ? 's' : ''}`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-2">
          {archivedProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Archive className="h-12 w-12 text-[var(--text-muted)] mb-4 opacity-50" />
              <p className="text-sm text-[var(--text-muted)]">
                No archived projects
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Archived projects will appear here
              </p>
            </div>
          ) : (
            archivedProjects.map((project) => {
              const isRestoring = restoringProjectId === project.id;

              return (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-[var(--chat-border)] bg-[var(--sidebar-background)]"
                  data-testid={`archived-project-${project.id}`}
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p
                      className="text-sm font-medium text-[var(--text-primary)] truncate"
                      title={project.name}
                    >
                      {project.name}
                    </p>
                    {project.archivedAt && (
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Archived{' '}
                        {new Date(project.archivedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRestore(project.id)}
                    disabled={isLoading || isRestoring}
                    className="shrink-0"
                    data-testid={`restore-project-${project.id}`}
                  >
                    {isRestoring ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Restore
                      </>
                    )}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
