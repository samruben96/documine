/**
 * Project Folder Component
 * Story 17.5: ChatGPT-Style Project Navigation
 *
 * Collapsible project folder with nested conversations.
 * Implements ChatGPT-style project organization.
 *
 * AC-17.5.2: Projects display as collapsible folders
 * AC-17.5.3: Clicking folder icon expands project
 * AC-17.5.4: Nested chats show within project
 * AC-17.5.5: New chat within project context
 * AC-17.5.6: Hover states for navigation
 * AC-17.5.7: Active states for current selection
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  MoreVertical,
  Archive,
  Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ChatHistoryItem } from './chat-history-item';
import { ProjectContextMenu } from './project-context-menu';
import type { Conversation, Project } from '@/types/ai-buddy';

export interface ProjectFolderProps {
  /** Project data */
  project: Project;
  /** Whether folder is expanded */
  isExpanded: boolean;
  /** Whether project is currently active */
  isActive: boolean;
  /** Conversations belonging to this project */
  conversations: Conversation[];
  /** Currently active conversation ID */
  activeConversationId: string | null;
  /** Callback to toggle expand/collapse */
  onToggle: () => void;
  /** Callback when project is selected (navigates to project) */
  onSelectProject: () => void;
  /** Callback when a nested conversation is selected */
  onSelectConversation: (id: string) => void;
  /** Callback to create new chat in this project (AC-17.5.5) */
  onNewChatInProject: () => void;
  /** Callback when project is archived */
  onArchive?: (id: string) => void;
  /** Callback when project is renamed */
  onRename?: (id: string, newName: string) => void;
  className?: string;
}

/**
 * Truncate text to specified length with ellipsis
 */
function truncateName(text: string, maxLength = 25): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function ProjectFolder({
  project,
  isExpanded,
  isActive,
  conversations,
  activeConversationId,
  onToggle,
  onSelectProject,
  onSelectConversation,
  onNewChatInProject,
  onArchive,
  onRename,
  className,
}: ProjectFolderProps) {
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

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditValue(project.name);
    setIsMenuOpen(false);
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

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive?.(project.id);
    setIsMenuOpen(false);
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  const handleProjectNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectProject();
    // Also expand when selecting project
    if (!isExpanded) {
      onToggle();
    }
  };

  const truncatedName = truncateName(project.name);
  const documentCount = project.documentCount ?? 0;

  const folderHeader = (
    <div
      data-testid={`project-folder-${project.id}`}
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer group',
        isActive
          ? 'bg-[var(--sidebar-active)]'
          : 'hover:bg-[var(--sidebar-hover)]',
        className
      )}
    >
      {/* Expand/Collapse Chevron (AC-17.5.3) */}
      <button
        type="button"
        onClick={handleChevronClick}
        className="flex-shrink-0 p-0.5 rounded hover:bg-[var(--sidebar-hover)]"
        data-testid={`folder-chevron-${project.id}`}
        aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
        ) : (
          <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
        )}
      </button>

      {/* Folder Icon (AC-17.5.2) */}
      {isExpanded ? (
        <FolderOpen className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
      ) : (
        <Folder className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
      )}

      {/* Project Name (AC-17.5.8: Click navigates to project) */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {isEditing ? (
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
          <button
            type="button"
            onClick={handleProjectNameClick}
            className="text-sm font-medium text-[var(--text-primary)] truncate text-left hover:underline"
            title={project.name}
            data-testid={`folder-header-${project.id}`}
          >
            {truncatedName}
          </button>
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

      {/* Context Menu */}
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
    </div>
  );

  // Wrap with context menu for right-click support
  const folderHeaderWithContextMenu =
    (onArchive || onRename) && !isEditing ? (
      <ProjectContextMenu
        project={project}
        onRename={handleStartEdit}
        onArchive={() => onArchive?.(project.id)}
        disabled={isEditing}
      >
        {folderHeader}
      </ProjectContextMenu>
    ) : (
      folderHeader
    );

  return (
    <div data-testid={`project-folder-container-${project.id}`}>
      {folderHeaderWithContextMenu}

      {/* Expanded Content (AC-17.5.3, AC-17.5.4) */}
      {isExpanded && (
        <div
          className="ml-6 mt-1 transition-all duration-200 ease-in-out"
          data-testid={`folder-content-${project.id}`}
        >
          {/* AC-17.5.5: New chat in project action */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNewChatInProject();
            }}
            className="w-full flex items-center gap-2 p-2 rounded-lg text-sm text-[var(--text-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-primary)] transition-colors"
            data-testid={`new-chat-in-project-${project.id}`}
          >
            <Plus className="h-4 w-4" />
            <span>New chat in {truncateName(project.name, 15)}</span>
          </button>

          {/* Nested Conversations (AC-17.5.4) */}
          {conversations.length > 0 ? (
            <div className="space-y-0.5 mt-1">
              {conversations.map((conv) => (
                <ChatHistoryItem
                  key={conv.id}
                  id={conv.id}
                  title={conv.title || 'New conversation'}
                  updatedAt={conv.updatedAt}
                  isActive={conv.id === activeConversationId}
                  onClick={() => onSelectConversation(conv.id)}
                  projectId={conv.projectId}
                  // Don't show project badge - already in folder context
                  projectName={undefined}
                  className="ml-2"
                />
              ))}
            </div>
          ) : (
            <p
              className="text-xs text-[var(--text-muted)] py-2 px-2"
              data-testid={`folder-empty-${project.id}`}
            >
              No conversations yet
            </p>
          )}
        </div>
      )}
    </div>
  );
}
