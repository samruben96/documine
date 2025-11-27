'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { profileSchema, type ProfileFormData } from '@/lib/validations/auth';
import { updateProfile } from '@/app/(dashboard)/settings/actions';

interface ProfileTabProps {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    agency: {
      id: string;
      name: string;
    } | null;
  };
}

/**
 * Profile Tab Component
 * Per AC-2.6.1: Shows editable name, read-only email/agency/role
 * Per AC-2.6.2: Validates name 2-100 chars with real-time validation on blur
 * Per AC-2.6.3: Shows loading state and success/error toast
 */
export function ProfileTab({ user }: ProfileTabProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user.full_name || '',
    },
    mode: 'onBlur', // Per AC-2.6.2: Real-time validation on blur
  });

  const onSubmit = (data: ProfileFormData) => {
    startTransition(async () => {
      const result = await updateProfile(data);

      if (result.success) {
        toast.success('Profile updated');
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your personal details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Editable: Full Name */}
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium text-slate-700">
              Full Name
            </label>
            <Input
              id="fullName"
              {...register('fullName')}
              placeholder="Enter your full name"
              aria-invalid={errors.fullName ? 'true' : 'false'}
            />
            {errors.fullName && (
              <p className="text-sm text-red-600" role="alert">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Read-only: Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Email
            </label>
            <Input
              value={user.email}
              disabled
              className="bg-slate-50 text-slate-500"
            />
            <p className="text-xs text-slate-400">Email cannot be changed</p>
          </div>

          {/* Read-only: Agency Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Agency
            </label>
            <Input
              value={user.agency?.name || 'No agency'}
              disabled
              className="bg-slate-50 text-slate-500"
            />
          </div>

          {/* Read-only: Role */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Role
            </label>
            <div className="flex items-center">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                user.role === 'admin'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-800'
              }`}>
                {user.role === 'admin' ? 'Admin' : 'Member'}
              </span>
            </div>
          </div>

          {/* Save Button - Per AC-2.6.3 */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={isPending || !isDirty}
              className="w-full sm:w-auto"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
