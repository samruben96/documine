/**
 * Project Context Header
 * Story 16.2: Project Context Switching
 *
 * Displays current project context in the header.
 *
 * AC-16.2.1: Header shows "AI Buddy · [Project Name]" when project selected
 * AC-16.2.2: Header shows "AI Buddy" when no project selected (general chat mode)
 */

import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

export interface ProjectContextHeaderProps {
  /** Project name to display (null = general chat mode) */
  projectName?: string | null;
  /** Loading state */
  isLoading?: boolean;
  /** Additional class names */
  className?: string;
}

const MAX_PROJECT_NAME_LENGTH = 30;

/**
 * Truncate project name to max length with ellipsis
 */
function truncateName(name: string, maxLength: number): string {
  if (name.length <= maxLength) {
    return name;
  }
  return name.slice(0, maxLength) + '...';
}

/**
 * Header showing current project context
 *
 * - Shows "AI Buddy" when no project selected (general chat)
 * - Shows "AI Buddy · [Project Name]" when project selected
 * - Project name truncated at 30 chars with tooltip for full name
 * - Light divider dot (·) between AI Buddy and project name
 */
export function ProjectContextHeader({
  projectName,
  isLoading,
  className,
}: ProjectContextHeaderProps) {
  const shouldTruncate = projectName && projectName.length > MAX_PROJECT_NAME_LENGTH;
  const displayName = projectName ? truncateName(projectName, MAX_PROJECT_NAME_LENGTH) : null;

  if (isLoading) {
    return (
      <div
        className={cn('flex items-center gap-2', className)}
        data-testid="project-context-header"
      >
        <MessageSquare className="h-4 w-4 text-slate-500" />
        <span className="text-slate-900 font-medium">AI Buddy</span>
        <span className="text-slate-400">·</span>
        <Skeleton className="h-4 w-24" data-testid="project-name-skeleton" />
      </div>
    );
  }

  // General chat mode (no project)
  if (!projectName) {
    return (
      <div
        className={cn('flex items-center gap-2', className)}
        data-testid="project-context-header"
      >
        <MessageSquare className="h-4 w-4 text-slate-500" />
        <span className="text-slate-900 font-medium" data-testid="header-title">
          AI Buddy
        </span>
      </div>
    );
  }

  // Project-scoped mode
  const projectNameElement = (
    <span
      className="text-slate-700 font-medium"
      data-testid="header-project-name"
      title={shouldTruncate ? projectName : undefined}
    >
      {displayName}
    </span>
  );

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      data-testid="project-context-header"
    >
      <MessageSquare className="h-4 w-4 text-slate-500" />
      <span className="text-slate-900 font-medium" data-testid="header-title">
        AI Buddy
      </span>
      <span className="text-slate-400" data-testid="header-divider">·</span>
      {shouldTruncate ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {projectNameElement}
            </TooltipTrigger>
            <TooltipContent>
              <p>{projectName}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        projectNameElement
      )}
    </div>
  );
}
