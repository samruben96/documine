/**
 * Project Create Dialog Component
 * Story 16.1: Project Creation & Sidebar
 *
 * Modal dialog for creating a new project with validation.
 *
 * AC-16.1.1: Dialog with name (required) and description (optional) fields
 * AC-16.1.2: Name limited to 100 characters
 * AC-16.1.3: Description limited to 500 characters
 * AC-16.1.6: Validation error shown if name empty
 */

'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CreateProjectRequest, Project } from '@/types/ai-buddy';

export interface ProjectCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (project: Project) => void;
  /** Async submit handler - returns created project or null on error */
  onSubmit?: (input: CreateProjectRequest) => Promise<Project | null>;
  /** Loading state from parent */
  isLoading?: boolean;
}

export function ProjectCreateDialog({
  open,
  onOpenChange,
  onProjectCreated,
  onSubmit,
  isLoading = false,
}: ProjectCreateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setError(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (!isSubmitting && !isLoading) {
      resetForm();
      onOpenChange(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // AC-16.1.6: Validation error if name empty
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Project name is required');
      return;
    }

    // AC-16.1.2: Name max 100 chars (validated on input, but double-check)
    if (trimmedName.length > 100) {
      setError('Project name exceeds 100 characters');
      return;
    }

    // AC-16.1.3: Description max 500 chars
    const trimmedDescription = description.trim();
    if (trimmedDescription.length > 500) {
      setError('Project description exceeds 500 characters');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (onSubmit) {
        const project = await onSubmit({
          name: trimmedName,
          description: trimmedDescription || undefined,
        });

        if (project) {
          // AC-16.1.4: Select new project as active
          onProjectCreated?.(project);
          resetForm();
          onOpenChange(false);
        } else {
          // Error occurred - API returned null
          setError('Failed to create project. Please try again.');
        }
      }
    } catch {
      setError('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isSubmitting || isLoading;
  const nameLength = name.length;
  const descriptionLength = description.length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent data-testid="project-create-dialog">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a project to organize conversations and documents for a
            client account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="project-name"
              data-testid="project-name-input"
              placeholder="e.g., Johnson Family Insurance"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              maxLength={100}
              disabled={isDisabled}
              aria-describedby={error ? 'name-error' : undefined}
            />
            <div className="flex justify-between text-xs text-[var(--text-muted)]">
              <span>{nameLength}/100</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description (optional)</Label>
            <Textarea
              id="project-description"
              data-testid="project-description-input"
              placeholder="Brief description of the project or client"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              disabled={isDisabled}
              rows={3}
            />
            <div className="flex justify-between text-xs text-[var(--text-muted)]">
              <span>{descriptionLength}/500</span>
            </div>
          </div>

          {error && (
            <p
              id="name-error"
              className="text-sm text-red-500"
              data-testid="project-create-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isDisabled}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isDisabled || !name.trim()}
              data-testid="project-create-submit"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
