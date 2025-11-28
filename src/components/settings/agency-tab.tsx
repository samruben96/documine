'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { agencySchema, type AgencyFormData } from '@/lib/validations/auth';
import { updateAgency } from '@/app/(dashboard)/settings/actions';

interface AgencyTabProps {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    agency: {
      id: string;
      name: string;
      subscription_tier: string;
      seat_limit: number;
      created_at: string;
    } | null;
  };
  currentSeats: number;
}

const tierDisplay: Record<string, { label: string; color: string }> = {
  starter: { label: 'Starter', color: 'bg-gray-100 text-gray-800' },
  professional: { label: 'Professional', color: 'bg-blue-100 text-blue-800' },
  agency: { label: 'Agency', color: 'bg-purple-100 text-purple-800' },
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Agency Tab Component
 * Per AC-3.1.1: Shows agency name (editable for admin), tier, seats, created date
 * Per AC-3.1.2: Validates name 2-100 chars with real-time validation on blur
 * Per AC-3.1.3: Shows loading state and success/error toast
 * Per AC-3.1.4: Non-admins see view-only mode
 */
export function AgencyTab({ user, currentSeats }: AgencyTabProps) {
  const [isPending, startTransition] = useTransition();
  const isAdmin = user.role === 'admin';

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<AgencyFormData>({
    resolver: zodResolver(agencySchema),
    defaultValues: {
      name: user.agency?.name || '',
    },
    mode: 'onBlur', // Per AC-3.1.2: Real-time validation on blur
  });

  const onSubmit = (data: AgencyFormData) => {
    startTransition(async () => {
      const result = await updateAgency(data);

      if (result.success) {
        toast.success('Agency settings updated');
      } else {
        toast.error(result.error || 'Failed to update agency settings');
      }
    });
  };

  if (!user.agency) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Agency Settings</CardTitle>
          <CardDescription>Manage your agency details</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">No agency associated with this account.</p>
        </CardContent>
      </Card>
    );
  }

  const tier = tierDisplay[user.agency.subscription_tier] || { label: 'Starter', color: 'bg-gray-100 text-gray-800' };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Agency Settings</CardTitle>
        <CardDescription>Manage your agency details and subscription</CardDescription>
      </CardHeader>
      <CardContent>
        {isAdmin ? (
          // Admin: Editable form
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Editable: Agency Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-700">
                Agency Name
              </label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter agency name"
                aria-invalid={errors.name ? 'true' : 'false'}
              />
              {errors.name && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Read-only: Subscription Tier */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Subscription Tier
              </label>
              <div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tier.color}`}>
                  {tier.label}
                </span>
              </div>
            </div>

            {/* Read-only: Seat Usage */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Seat Usage
              </label>
              <p className="text-sm text-slate-600">
                {currentSeats} of {user.agency.seat_limit} seats used
              </p>
            </div>

            {/* Read-only: Created Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Created
              </label>
              <p className="text-sm text-slate-600">
                {formatDate(user.agency.created_at)}
              </p>
            </div>

            {/* Save Button - Per AC-3.1.3 */}
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
        ) : (
          // Member: View-only display
          <div className="space-y-6">
            {/* Read-only: Agency Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Agency Name
              </label>
              <p className="text-sm text-slate-600">{user.agency.name}</p>
            </div>

            {/* Read-only: Subscription Tier */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Subscription Tier
              </label>
              <div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tier.color}`}>
                  {tier.label}
                </span>
              </div>
            </div>

            {/* Read-only: Seat Usage */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Seat Usage
              </label>
              <p className="text-sm text-slate-600">
                {currentSeats} of {user.agency.seat_limit} seats used
              </p>
            </div>

            {/* Read-only: Created Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Created
              </label>
              <p className="text-sm text-slate-600">
                {formatDate(user.agency.created_at)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
