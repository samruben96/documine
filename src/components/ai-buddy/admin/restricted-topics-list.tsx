/**
 * RestrictedTopicsList Component
 * Story 19.1: Guardrail Admin UI
 *
 * AC-19.1.2: Display restricted topics with their redirect guidance
 * AC-19.1.4: Add Topic button opens dialog
 */

'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RestrictedTopicCard } from './restricted-topic-card';
import { RestrictedTopicEditor } from './restricted-topic-editor';
import type { ExtendedRestrictedTopic } from '@/types/ai-buddy';

interface RestrictedTopicsListProps {
  topics: ExtendedRestrictedTopic[];
  onAddTopic: (topic: Omit<ExtendedRestrictedTopic, 'id' | 'createdAt' | 'createdBy' | 'isBuiltIn'>) => Promise<ExtendedRestrictedTopic>;
  onUpdateTopic: (id: string, updates: Partial<ExtendedRestrictedTopic>) => Promise<ExtendedRestrictedTopic>;
  onDeleteTopic: (id: string) => Promise<void>;
  isLoading?: boolean;
  /** Hide the header (title and description) when parent provides it */
  hideHeader?: boolean;
}

/**
 * List of restricted topics with add/edit/delete functionality
 *
 * @example
 * ```tsx
 * <RestrictedTopicsList
 *   topics={guardrails.restrictedTopics}
 *   onAddTopic={addTopic}
 *   onUpdateTopic={updateTopic}
 *   onDeleteTopic={deleteTopic}
 * />
 * ```
 */
export function RestrictedTopicsList({
  topics,
  onAddTopic,
  onUpdateTopic,
  onDeleteTopic,
  isLoading = false,
  hideHeader = false,
}: RestrictedTopicsListProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<ExtendedRestrictedTopic | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = () => {
    setEditingTopic(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (topic: ExtendedRestrictedTopic) => {
    setEditingTopic(topic);
    setIsEditorOpen(true);
  };

  const handleSave = async (data: {
    trigger: string;
    description?: string;
    redirectGuidance: string;
    enabled: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      if (editingTopic) {
        // Update existing topic
        await onUpdateTopic(editingTopic.id, data);
      } else {
        // Create new topic
        await onAddTopic(data);
      }
      setIsEditorOpen(false);
      setEditingTopic(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await onDeleteTopic(id);
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    await onUpdateTopic(id, { enabled });
  };

  // Loading skeleton
  if (isLoading && topics.length === 0) {
    return (
      <div className="space-y-3" data-testid="restricted-topics-list-loading">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="restricted-topics-list">
      {/* Header with Add button - conditionally shown */}
      {!hideHeader && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Restricted Topics</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAdd}
              data-testid="add-topic-button"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Topic
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Topics that AI will redirect away from with helpful guidance.
          </p>
        </>
      )}

      {/* Add button when header is hidden */}
      {hideHeader && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdd}
            data-testid="add-topic-button"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Topic
          </Button>
        </div>
      )}

      {/* Topics list */}
      {topics.length === 0 ? (
        <div
          className="py-8 text-center text-muted-foreground border border-dashed rounded-lg"
          data-testid="restricted-topics-empty"
        >
          No restricted topics configured. Click &quot;Add Topic&quot; to create one.
        </div>
      ) : (
        <div className="space-y-2">
          {topics.map((topic) => (
            <RestrictedTopicCard
              key={topic.id}
              topic={topic}
              onEdit={() => handleEdit(topic)}
              onDelete={() => handleDelete(topic.id)}
              onToggle={(enabled) => handleToggle(topic.id, enabled)}
            />
          ))}
        </div>
      )}

      {/* Editor dialog */}
      <RestrictedTopicEditor
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        topic={editingTopic}
        onSave={handleSave}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
