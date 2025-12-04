'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TagEditorProps {
  /** Current tags */
  tags: string[];
  /** Called when tags are updated */
  onTagsChange: (tags: string[]) => void;
  /** Maximum number of tags allowed */
  maxTags?: number;
  /** Disable editing */
  disabled?: boolean;
  /** Show loading state */
  isLoading?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Tag Editor Component
 *
 * Story F2-5: Tag Management UI
 * AC-F2-5.1: Allow adding new tags
 * AC-F2-5.2: Allow removing existing tags
 * AC-F2-5.3: Maximum 10 tags per document
 * AC-F2-5.4: Tags save automatically on change
 */
export function TagEditor({
  tags,
  onTagsChange,
  maxTags = 10,
  disabled = false,
  isLoading = false,
  className,
}: TagEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newTag, setNewTag] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = () => {
    const trimmed = newTag.trim().toLowerCase();
    if (!trimmed) return;
    if (tags.length >= maxTags) return;
    if (tags.includes(trimmed)) {
      setNewTag('');
      return;
    }

    onTagsChange([...tags, trimmed]);
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setNewTag('');
    } else if (e.key === 'Backspace' && !newTag && tags.length > 0) {
      // Remove last tag on backspace when input is empty
      const lastTag = tags[tags.length - 1];
      if (lastTag) handleRemoveTag(lastTag);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className={cn('flex flex-wrap gap-1.5 items-center', className)} data-testid="tag-editor">
      {/* Existing tags */}
      {tags.map((tag) => (
        <span
          key={tag}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
            'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
            'transition-colors'
          )}
        >
          <Tag className="h-3 w-3" />
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="ml-0.5 hover:text-red-500 transition-colors"
              aria-label={`Remove tag: ${tag}`}
              disabled={isLoading}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}

      {/* Add tag input */}
      {!disabled && tags.length < maxTags && (
        <>
          {isEditing ? (
            <div className="inline-flex items-center gap-1">
              <Input
                ref={inputRef}
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (newTag.trim()) {
                    handleAddTag();
                  }
                  setIsEditing(false);
                }}
                placeholder="Add tag..."
                className="h-6 w-24 text-xs px-2"
                maxLength={30}
                disabled={isLoading}
                data-testid="tag-input"
              />
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={startEditing}
              className="h-6 px-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              disabled={isLoading}
              data-testid="add-tag-button"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add tag
            </Button>
          )}
        </>
      )}

      {/* Max tags indicator */}
      {!disabled && tags.length >= maxTags && (
        <span className="text-[10px] text-slate-400">Max {maxTags} tags</span>
      )}
    </div>
  );
}
