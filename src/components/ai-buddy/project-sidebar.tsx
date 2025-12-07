/**
 * Project Sidebar Component
 * Story 14.5: Component Scaffolding
 *
 * Sidebar for navigating projects and conversations.
 * Stub implementation - full functionality in Epic 16.
 */

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ProjectSidebarProps {
  onNewChat?: () => void;
  onNewProject?: () => void;
  className?: string;
}

export function ProjectSidebar({
  onNewChat,
  onNewProject,
  className,
}: ProjectSidebarProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="p-4 border-b border-[var(--chat-border)]">
        <Button
          onClick={onNewChat}
          variant="ghost"
          className="w-full justify-start text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)]"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Projects
        </p>
        <p className="text-sm text-[var(--text-muted)]">No projects yet</p>
      </div>
    </div>
  );
}
