/**
 * Preferences Form Component
 * Story 18.2: Preferences Management
 *
 * AC-18.2.2: Shows current preferences on load
 * AC-18.2.3-18.2.7: All preference sections (identity, LOB, carriers, agency, style)
 * AC-18.2.8: Save button with dirty state detection
 * AC-18.2.9-18.2.11: Reset functionality
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, RotateCcw, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { ChipSelect } from '@/components/ai-buddy/onboarding/chip-select';
import { CommunicationStyleToggle } from '@/components/ai-buddy/communication-style-toggle';
import { LicensedStatesSelect } from '@/components/ai-buddy/licensed-states-select';

import type { UserPreferences } from '@/types/ai-buddy';
import { LINES_OF_BUSINESS, COMMON_CARRIERS, USER_ROLES } from '@/types/ai-buddy';

// Form validation schema
const preferencesSchema = z.object({
  displayName: z.string().max(50, 'Display name must be 50 characters or less').optional().or(z.literal('')),
  role: z.enum(['producer', 'csr', 'manager', 'other']).optional().nullable(),
  linesOfBusiness: z.array(z.string()),
  favoriteCarriers: z.array(z.string()),
  licensedStates: z.array(z.string()),
  communicationStyle: z.enum(['professional', 'casual']),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

export interface PreferencesFormProps {
  /** Current preferences */
  preferences: UserPreferences;
  /** Agency name (read-only display) */
  agencyName?: string;
  /** Callback when save is requested */
  onSave: (updates: Partial<UserPreferences>) => Promise<UserPreferences>;
  /** Callback when reset is requested */
  onReset: () => Promise<void>;
  /** Loading state */
  isLoading?: boolean;
  /** Hide the reset button (when reset is provided elsewhere, e.g., sub-tab layout) */
  hideResetButton?: boolean;
  /** Callback when dirty state changes */
  onDirtyChange?: (isDirty: boolean) => void;
  /** Callback to expose the save trigger function to parent */
  onSaveRef?: (saveFn: (() => void) | null) => void;
}

/**
 * Main preferences form with all editable sections
 */
export function PreferencesForm({
  preferences,
  agencyName,
  onSave,
  onReset,
  isLoading = false,
  hideResetButton = false,
  onDirtyChange,
  onSaveRef,
}: PreferencesFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [customCarrier, setCustomCarrier] = useState('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      displayName: preferences.displayName || '',
      role: preferences.role,
      linesOfBusiness: preferences.linesOfBusiness || [],
      favoriteCarriers: preferences.favoriteCarriers || [],
      licensedStates: preferences.licensedStates || [],
      communicationStyle: preferences.communicationStyle || 'professional',
    },
  });

  // Reset form when preferences change (e.g., after reset)
  useEffect(() => {
    reset({
      displayName: preferences.displayName || '',
      role: preferences.role,
      linesOfBusiness: preferences.linesOfBusiness || [],
      favoriteCarriers: preferences.favoriteCarriers || [],
      licensedStates: preferences.licensedStates || [],
      communicationStyle: preferences.communicationStyle || 'professional',
    });
  }, [preferences, reset]);

  // Notify parent of dirty state changes
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Watch carriers for custom carrier input
  const currentCarriers = watch('favoriteCarriers');

  const handleAddCustomCarrier = useCallback(() => {
    const trimmed = customCarrier.trim();
    if (trimmed && !currentCarriers.includes(trimmed)) {
      setValue('favoriteCarriers', [...currentCarriers, trimmed], { shouldDirty: true });
      setCustomCarrier('');
    }
  }, [customCarrier, currentCarriers, setValue]);

  const onSubmit = useCallback(async (data: PreferencesFormData) => {
    setIsSaving(true);
    try {
      await onSave({
        displayName: data.displayName || undefined,
        role: data.role ?? undefined,
        linesOfBusiness: data.linesOfBusiness,
        favoriteCarriers: data.favoriteCarriers,
        licensedStates: data.licensedStates,
        communicationStyle: data.communicationStyle,
      });
      toast.success('Preferences saved successfully');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  // Expose form submit function to parent
  // Use useEffect to avoid calling onSaveRef during render (which would cause setState-during-render errors)
  useEffect(() => {
    if (onSaveRef) {
      onSaveRef(() => {
        handleSubmit(onSubmit)();
      });
    }
    return () => {
      onSaveRef?.(null);
    };
  }, [onSaveRef, handleSubmit, onSubmit]);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await onReset();
      toast.success('Preferences reset successfully');
    } catch {
      toast.error('Failed to reset preferences');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="preferences-form">
      {/* Identity Section - AC-18.2.3 */}
      <Card data-testid="identity-section">
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>How AI Buddy addresses you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium text-foreground">
              Display Name
            </label>
            <Input
              id="displayName"
              {...register('displayName')}
              placeholder="Enter your name"
              maxLength={50}
              disabled={isLoading}
              data-testid="display-name-input"
            />
            {errors.displayName && (
              <p className="text-sm text-destructive" role="alert">
                {errors.displayName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium text-foreground">
              Role
            </label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || ''}
                  onValueChange={(value) => field.onChange(value || undefined)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="role" data-testid="role-select">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lines of Business Section - AC-18.2.4 */}
      <Card data-testid="lob-section">
        <CardHeader>
          <CardTitle>Lines of Business</CardTitle>
          <CardDescription>Your primary insurance lines</CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            name="linesOfBusiness"
            control={control}
            render={({ field }) => (
              <ChipSelect
                options={LINES_OF_BUSINESS}
                selected={field.value}
                onChange={field.onChange}
                minSelection={0}
              />
            )}
          />
        </CardContent>
      </Card>

      {/* Favorite Carriers Section - AC-18.2.5 */}
      <Card data-testid="carriers-section">
        <CardHeader>
          <CardTitle>Favorite Carriers</CardTitle>
          <CardDescription>Carriers you work with most often</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Controller
            name="favoriteCarriers"
            control={control}
            render={({ field }) => (
              <ChipSelect
                options={COMMON_CARRIERS}
                selected={field.value}
                onChange={field.onChange}
                minSelection={0}
              />
            )}
          />

          {/* Custom carrier input */}
          <div className="flex gap-2" data-testid="custom-carrier-input">
            <Input
              placeholder="Add custom carrier..."
              value={customCarrier}
              onChange={(e) => setCustomCarrier(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomCarrier();
                }
              }}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddCustomCarrier}
              disabled={!customCarrier.trim() || isLoading}
              data-testid="add-carrier-btn"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Custom carriers display (not in COMMON_CARRIERS) */}
          {currentCarriers.filter((c) => !COMMON_CARRIERS.includes(c as typeof COMMON_CARRIERS[number])).length > 0 && (
            <div className="flex flex-wrap gap-2" data-testid="custom-carriers-list">
              {currentCarriers
                .filter((c) => !COMMON_CARRIERS.includes(c as typeof COMMON_CARRIERS[number]))
                .map((carrier) => (
                  <span
                    key={carrier}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-primary text-primary-foreground"
                  >
                    {carrier}
                    <button
                      type="button"
                      onClick={() => {
                        setValue(
                          'favoriteCarriers',
                          currentCarriers.filter((c) => c !== carrier),
                          { shouldDirty: true }
                        );
                      }}
                      className="ml-1 hover:bg-primary/90 rounded-full"
                      aria-label={`Remove ${carrier}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agency Information Section - AC-18.2.6 */}
      <Card data-testid="agency-section">
        <CardHeader>
          <CardTitle>Agency Information</CardTitle>
          <CardDescription>Your agency details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Agency Name
            </label>
            <Input
              value={agencyName || 'Not set'}
              disabled
              className="bg-muted text-muted-foreground"
              data-testid="agency-name-display"
            />
            <p className="text-xs text-muted-foreground">
              Agency name is managed in Agency Settings
            </p>
          </div>

          <Controller
            name="licensedStates"
            control={control}
            render={({ field }) => (
              <LicensedStatesSelect
                selected={field.value}
                onChange={field.onChange}
                disabled={isLoading}
              />
            )}
          />
        </CardContent>
      </Card>

      {/* Communication Style Section - AC-18.2.7 */}
      <Card data-testid="style-section">
        <CardHeader>
          <CardTitle>Communication Style</CardTitle>
          <CardDescription>How AI Buddy communicates with you</CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            name="communicationStyle"
            control={control}
            render={({ field }) => (
              <CommunicationStyleToggle
                value={field.value}
                onChange={field.onChange}
                disabled={isLoading}
              />
            )}
          />
        </CardContent>
      </Card>

      {/* Actions - AC-18.2.8, AC-18.2.9 */}
      <div className={`flex items-center pt-4 ${hideResetButton ? 'justify-end' : 'justify-between'}`} data-testid="form-actions">
        {!hideResetButton && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isLoading || isSaving || isResetting}
                data-testid="reset-btn"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset to Defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset AI Buddy Preferences?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear all your preferences and show the onboarding flow again.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  disabled={isResetting}
                  data-testid="confirm-reset-btn"
                >
                  {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset Preferences
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <Button
          type="submit"
          disabled={!isDirty || isLoading || isSaving || isResetting}
          data-testid="save-btn"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
