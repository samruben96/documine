/**
 * Topic Tag List Component
 * Story 14.5: Component Scaffolding
 *
 * Displays and manages restricted topic tags.
 * Stub implementation - full functionality in Epic 19.
 */

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TopicTagListProps {
  tags: string[];
  onRemove?: (tag: string) => void;
  readOnly?: boolean;
  className?: string;
}

export function TopicTagList({
  tags,
  onRemove,
  readOnly = false,
  className,
}: TopicTagListProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-[var(--chat-surface)] text-[var(--text-primary)]"
        >
          {tag}
          {!readOnly && onRemove && (
            <button
              type="button"
              onClick={() => onRemove(tag)}
              className="hover:text-red-400 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}
