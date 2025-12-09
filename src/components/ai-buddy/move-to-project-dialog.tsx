/**
 * Move to Project Dialog Component
 * Story 16.6: Conversation Management - Delete & Move
 *
 * Dialog for selecting a project to move a conversation to.
 *
 * AC-16.6.7: Conversation menu includes "Move to Project" option
 * AC-16.6.8: Selecting project updates conversation's project_id
 * AC-16.6.12: Can move from project to "No Project" (general chat)
 */

'use client';

import { useState } from 'react';
import { Check, FolderOpen, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAiBuddyContext } from '@/contexts/ai-buddy-context';

export interface MoveToProjectDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the dialog is closed */
  onOpenChange: (open: boolean) => void;
  /** The conversation to move */
  conversationId: string;
  /** Current project ID of the conversation (null = general chat) */
  currentProjectId: string | null;
}

export function MoveToProjectDialog({
  open,
  onOpenChange,
  conversationId,
  currentProjectId,
}: MoveToProjectDialogProps) {
  const { projects, moveConversation, isMovingConversation } = useAiBuddyContext();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(currentProjectId);

  const handleMove = async () => {
    if (selectedProjectId !== currentProjectId) {
      await moveConversation(conversationId, selectedProjectId);
    }
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset selection when closing
      setSelectedProjectId(currentProjectId);
    }
    onOpenChange(newOpen);
  };

  // Build list: "No Project" option first, then projects
  const hasChanged = selectedProjectId !== currentProjectId;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="move-to-project-dialog">
        <DialogHeader>
          <DialogTitle>Move to Project</DialogTitle>
          <DialogDescription>
            Select a project to move this conversation to, or choose &quot;General Chat&quot; to
            remove it from any project.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[300px] pr-4">
          <div className="space-y-1">
            {/* General Chat option (no project) */}
            <button
              type="button"
              onClick={() => setSelectedProjectId(null)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                selectedProjectId === null
                  ? 'bg-[var(--accent-primary)]/10 border-2 border-[var(--accent-primary)]'
                  : 'hover:bg-[var(--sidebar-hover)] border-2 border-transparent'
              )}
              data-testid="move-target-general"
            >
              <MessageSquare className="h-5 w-5 text-[var(--text-muted)]" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--text-primary)]">General Chat</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Not associated with any project
                </p>
              </div>
              {selectedProjectId === null && (
                <Check className="h-5 w-5 text-[var(--accent-primary)]" />
              )}
            </button>

            {/* Separator */}
            {projects.length > 0 && (
              <div className="py-2">
                <div className="border-t border-[var(--border-color)]" />
              </div>
            )}

            {/* Project options */}
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => setSelectedProjectId(project.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                  selectedProjectId === project.id
                    ? 'bg-[var(--accent-primary)]/10 border-2 border-[var(--accent-primary)]'
                    : 'hover:bg-[var(--sidebar-hover)] border-2 border-transparent'
                )}
                data-testid={`move-target-project-${project.id}`}
                data-current={currentProjectId === project.id ? 'true' : undefined}
              >
                <FolderOpen className="h-5 w-5 text-[var(--text-muted)]" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-primary)] truncate">{project.name}</p>
                  {project.description && (
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {project.description}
                    </p>
                  )}
                </div>
                {selectedProjectId === project.id && (
                  <Check className="h-5 w-5 text-[var(--accent-primary)]" />
                )}
              </button>
            ))}

            {/* Empty state when no projects */}
            {projects.length === 0 && (
              <div className="py-4 text-center text-[var(--text-muted)] text-sm">
                No projects available. Create a project first to organize your conversations.
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isMovingConversation}
            data-testid="move-cancel-button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={!hasChanged || isMovingConversation}
            data-testid="move-confirm-button"
          >
            {isMovingConversation ? 'Moving...' : 'Move'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
