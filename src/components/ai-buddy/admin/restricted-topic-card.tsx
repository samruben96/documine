/**
 * RestrictedTopicCard Component
 * Story 19.1: Guardrail Admin UI
 *
 * AC-19.1.3: Display trigger phrase, description, redirect guidance, and enable/disable toggle
 */

'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { ExtendedRestrictedTopic } from '@/types/ai-buddy';

interface RestrictedTopicCardProps {
  topic: ExtendedRestrictedTopic;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
}

/**
 * Card displaying a single restricted topic
 *
 * Shows:
 * - Trigger phrase (bold)
 * - Description (if available)
 * - Redirect guidance
 * - Enable/disable toggle
 * - Edit and Delete buttons
 * - "Default" badge for built-in topics
 *
 * @example
 * ```tsx
 * <RestrictedTopicCard
 *   topic={topic}
 *   onEdit={() => handleEdit(topic)}
 *   onDelete={() => handleDelete(topic.id)}
 *   onToggle={(enabled) => handleToggle(topic.id, enabled)}
 * />
 * ```
 */
export function RestrictedTopicCard({
  topic,
  onEdit,
  onDelete,
  onToggle,
}: RestrictedTopicCardProps) {
  return (
    <div
      className={`p-4 border rounded-lg transition-opacity ${
        topic.enabled ? '' : 'opacity-60'
      }`}
      data-testid={`restricted-topic-card-${topic.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Trigger with badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium" data-testid="topic-trigger">
              &quot;{topic.trigger}&quot;
            </span>
            {topic.isBuiltIn && (
              <Badge variant="secondary" className="text-xs" data-testid="topic-default-badge">
                Default
              </Badge>
            )}
            {!topic.enabled && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Disabled
              </Badge>
            )}
          </div>

          {/* Description */}
          {topic.description && (
            <p
              className="text-sm text-muted-foreground"
              data-testid="topic-description"
            >
              {topic.description}
            </p>
          )}

          {/* Redirect guidance */}
          <p className="text-sm" data-testid="topic-redirect">
            <span className="text-muted-foreground">Redirect: </span>
            {topic.redirectGuidance}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Switch
            checked={topic.enabled}
            onCheckedChange={onToggle}
            data-testid="topic-toggle"
            aria-label={`${topic.enabled ? 'Disable' : 'Enable'} ${topic.trigger}`}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            data-testid="topic-edit-button"
            aria-label={`Edit ${topic.trigger}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            data-testid="topic-delete-button"
            aria-label={`Delete ${topic.trigger}`}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
