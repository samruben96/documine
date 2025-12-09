/**
 * RestrictedTopicEditor Component
 * Story 19.1: Guardrail Admin UI
 *
 * AC-19.1.4: Dialog with trigger phrase, description, and redirect guidance inputs
 * AC-19.1.5: Save creates topic and closes dialog
 * AC-19.1.6: Edit mode pre-populates form
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ExtendedRestrictedTopic } from '@/types/ai-buddy';

interface RestrictedTopicEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: ExtendedRestrictedTopic | null;
  onSave: (data: {
    trigger: string;
    description?: string;
    redirectGuidance: string;
    enabled: boolean;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Dialog for creating/editing a restricted topic
 *
 * @example
 * ```tsx
 * <RestrictedTopicEditor
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   topic={editingTopic}
 *   onSave={handleSave}
 * />
 * ```
 */
export function RestrictedTopicEditor({
  open,
  onOpenChange,
  topic,
  onSave,
  isSubmitting = false,
}: RestrictedTopicEditorProps) {
  const [trigger, setTrigger] = useState('');
  const [description, setDescription] = useState('');
  const [redirectGuidance, setRedirectGuidance] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [errors, setErrors] = useState<{
    trigger?: string;
    redirectGuidance?: string;
  }>({});

  const isEditMode = !!topic;

  // Reset form when dialog opens/closes or topic changes
  useEffect(() => {
    if (open) {
      if (topic) {
        // Edit mode - populate form
        setTrigger(topic.trigger);
        setDescription(topic.description || '');
        setRedirectGuidance(topic.redirectGuidance);
        setEnabled(topic.enabled);
      } else {
        // Create mode - clear form
        setTrigger('');
        setDescription('');
        setRedirectGuidance('');
        setEnabled(true);
      }
      setErrors({});
    }
  }, [open, topic]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!trigger.trim()) {
      newErrors.trigger = 'Trigger phrase is required';
    }
    if (!redirectGuidance.trim()) {
      newErrors.redirectGuidance = 'Redirect guidance is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await onSave({
      trigger: trigger.trim(),
      description: description.trim() || undefined,
      redirectGuidance: redirectGuidance.trim(),
      enabled,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        data-testid="restricted-topic-editor"
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Restricted Topic' : 'Add Restricted Topic'}
            </DialogTitle>
            <DialogDescription>
              Define a topic that AI will redirect away from with helpful guidance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Trigger phrase */}
            <div className="space-y-2">
              <Label htmlFor="trigger">
                Trigger Phrase <span className="text-destructive">*</span>
              </Label>
              <Input
                id="trigger"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="e.g., legal advice, file a claim"
                data-testid="topic-trigger-input"
                aria-invalid={!!errors.trigger}
              />
              {errors.trigger && (
                <p className="text-sm text-destructive" data-testid="trigger-error">
                  {errors.trigger}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Keywords or phrases that will trigger this redirect.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Prevents AI from providing legal counsel"
                data-testid="topic-description-input"
              />
              <p className="text-xs text-muted-foreground">
                Internal note explaining why this topic is restricted.
              </p>
            </div>

            {/* Redirect guidance */}
            <div className="space-y-2">
              <Label htmlFor="redirectGuidance">
                Redirect Guidance <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="redirectGuidance"
                value={redirectGuidance}
                onChange={(e) => setRedirectGuidance(e.target.value)}
                placeholder="e.g., Suggest the user consult with a licensed attorney for legal questions."
                rows={3}
                data-testid="topic-redirect-input"
                aria-invalid={!!errors.redirectGuidance}
              />
              {errors.redirectGuidance && (
                <p className="text-sm text-destructive" data-testid="redirect-error">
                  {errors.redirectGuidance}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                How AI should naturally redirect the conversation.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="topic-save-button"
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Topic'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
