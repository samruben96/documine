'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { requestPasswordReset } from './actions';

const resetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ResetRequestData = z.infer<typeof resetRequestSchema>;

/**
 * Password Reset Request Page
 * Implements:
 * - AC-2.5.1: Reset request page (/reset-password) accepts email and shows generic success message
 * - Same message whether email exists or not (security: don't reveal if email exists)
 * - Button disabled for 60 seconds after submit to prevent spam
 */
export default function ResetPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetRequestData>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: {
      email: '',
    },
  });

  // 60-second cooldown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }
    const timer = setTimeout(() => {
      setCooldownSeconds(cooldownSeconds - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  const onSubmit = async (data: ResetRequestData) => {
    setIsSubmitting(true);

    try {
      await requestPasswordReset(data.email);
      // Always show success (security: don't reveal if email exists)
      setIsSuccess(true);
      setCooldownSeconds(60); // Start 60-second cooldown
    } catch {
      // Still show success to prevent email enumeration
      setIsSuccess(true);
      setCooldownSeconds(60);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isSubmitting || cooldownSeconds > 0;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-slate-800">
          Reset your password
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      {isSuccess ? (
        // Success state
        <div className="space-y-6">
          <div className="rounded-md bg-emerald-50 border border-emerald-200 p-4">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-emerald-800">
                  Check your email
                </h3>
                <p className="mt-1 text-sm text-emerald-700">
                  If an account exists with that email, we&apos;ve sent you a
                  password reset link. The link will expire in 1 hour.
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-500 text-center">
            Didn&apos;t receive the email? Check your spam folder or{' '}
            <button
              type="button"
              onClick={() => setIsSuccess(false)}
              disabled={cooldownSeconds > 0}
              className="font-medium text-slate-600 hover:text-slate-800 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              try again
              {cooldownSeconds > 0 && ` (${cooldownSeconds}s)`}
            </button>
          </p>

          <Link
            href="/login"
            className="flex items-center justify-center text-sm font-medium text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to login
          </Link>
        </div>
      ) : (
        // Form state
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              disabled={isDisabled}
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Submit Button - Disabled during cooldown */}
          <Button
            type="submit"
            className="w-full bg-slate-600 hover:bg-slate-700"
            disabled={isDisabled}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : cooldownSeconds > 0 ? (
              `Wait ${cooldownSeconds}s`
            ) : (
              'Send reset link'
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
      )}
    </div>
  );
}
