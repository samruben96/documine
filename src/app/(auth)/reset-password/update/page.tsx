'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordStrength } from '@/components/auth/password-strength';
import { passwordSchema } from '@/lib/validations/auth';
import { updatePassword } from '../actions';

const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type UpdatePasswordData = z.infer<typeof updatePasswordSchema>;

/**
 * Password Update Page
 * Implements:
 * - AC-2.5.3: Reset link redirects to password update page
 * - AC-2.5.4: New password must meet strength requirements with indicator
 * - AC-2.5.5: Expired link shows error with "Request new link" option
 * - AC-2.5.6: Successful reset redirects to login with success message
 *
 * Note: Code exchange happens server-side in /auth/callback route
 * This page is only shown after successful session establishment
 */
export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<UpdatePasswordSkeleton />}>
      <UpdatePasswordForm />
    </Suspense>
  );
}

function UpdatePasswordSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="mb-6 text-center">
        <div className="h-6 bg-slate-200 rounded w-3/4 mx-auto mb-2" />
        <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto" />
      </div>
      <div className="space-y-4">
        <div className="h-10 bg-slate-200 rounded" />
        <div className="h-10 bg-slate-200 rounded" />
        <div className="h-10 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

function UpdatePasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const searchParams = useSearchParams();

  // Check for error in URL (from callback or hash)
  useEffect(() => {
    // Check for error query param from callback
    const errorParam = searchParams.get('error');
    if (errorParam === 'expired') {
      setIsExpired(true);
      setError('This reset link has expired. Please request a new one.');
      return;
    }

    // Check for error in URL hash (Supabase sometimes passes errors via hash)
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const errorCode = params.get('error');
      const errorDescription = params.get('error_description');

      if (errorCode) {
        setIsExpired(true);
        setError(errorDescription?.replace(/\+/g, ' ') || 'This reset link has expired or is invalid.');
      }
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UpdatePasswordData>({
    resolver: zodResolver(updatePasswordSchema),
    mode: 'onBlur',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: UpdatePasswordData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updatePassword(data.password);

      // If we get here without redirect, there was an error
      if (!result.success && result.error) {
        if (result.error.includes('expired')) {
          setIsExpired(true);
        }
        setError(result.error);
        toast.error(result.error, { duration: 5000 });
      }
    } catch {
      const errorMsg = 'Something went wrong. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg, { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show expired/error state
  if (isExpired) {
    return (
      <div className="w-full">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-slate-800">
            Link Expired
          </h2>
        </div>

        <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                This link has expired
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {error || 'Password reset links are only valid for 1 hour. Please request a new one.'}
              </p>
            </div>
          </div>
        </div>

        <Link href="/reset-password">
          <Button className="w-full bg-slate-600 hover:bg-slate-700">
            Request new link
          </Button>
        </Link>

        <Link
          href="/login"
          className="flex items-center justify-center text-sm font-medium text-slate-600 hover:text-slate-800 mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-slate-800">
          Create new password
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Enter a strong password for your account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Error message */}
        {error && !isExpired && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* New Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            New password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="Create a strong password"
            disabled={isSubmitting}
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {/* Password strength indicator */}
          <PasswordStrength password={password || ''} />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Confirm new password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            disabled={isSubmitting}
            aria-invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-slate-600 hover:bg-slate-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            'Update password'
          )}
        </Button>

        {/* Back to login link */}
        <Link
          href="/login"
          className="flex items-center justify-center text-sm font-medium text-slate-600 hover:text-slate-800 mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to login
        </Link>
      </form>
    </div>
  );
}
