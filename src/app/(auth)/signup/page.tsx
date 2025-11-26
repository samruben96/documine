'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordStrength } from '@/components/auth/password-strength';
import { signupSchema, type SignupFormData } from '@/lib/validations/auth';
import { signup } from './actions';

/**
 * Signup Page Component
 * Implements:
 * - AC-2.1.1: Form with Full name, Email, Password, Agency name (all required)
 * - AC-2.1.2: Password strength indicator
 * - AC-2.1.3: Real-time validation on blur
 * - AC-2.1.4: Loading state during submission
 * - AC-2.1.6: Error displays as toast notification
 * - AC-2.1.7: UX spec styling (Trustworthy Slate theme)
 */
export default function SignupPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur', // Per AC-2.1.3: validation on blur
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      agencyName: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);

    try {
      const result = await signup(data);

      // If we get here without redirect, there was an error
      if (!result.success && result.error) {
        // Per AC-2.1.6: Error displays as toast notification
        toast.error(result.error, {
          duration: 5000, // Auto-dismiss after 5 seconds per AC
        });
      }
    } catch {
      toast.error('Something went wrong. Please try again.', {
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Per UX spec: Clean, minimal layout */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-slate-800">
          Create your account
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Start analyzing documents in minutes
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name Field - Per AC-2.1.1 */}
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Full name
          </label>
          <Input
            id="fullName"
            type="text"
            placeholder="John Smith"
            disabled={isSubmitting}
            aria-invalid={!!errors.fullName}
            {...register('fullName')}
          />
          {/* Per AC-2.1.3: Error messages in red (#dc2626) below each field */}
          {errors.fullName && (
            <p className="mt-1 text-xs text-red-600">
              {errors.fullName.message}
            </p>
          )}
        </div>

        {/* Email Field - Per AC-2.1.1 */}
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
            placeholder="john@agency.com"
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field - Per AC-2.1.1 */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="Create a strong password"
            disabled={isSubmitting}
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {/* Per AC-2.1.2: Password strength indicator */}
          <PasswordStrength password={password || ''} />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Agency Name Field - Per AC-2.1.1 */}
        <div>
          <label
            htmlFor="agencyName"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Agency name
          </label>
          <Input
            id="agencyName"
            type="text"
            placeholder="Smith Insurance Agency"
            disabled={isSubmitting}
            aria-invalid={!!errors.agencyName}
            {...register('agencyName')}
          />
          {errors.agencyName && (
            <p className="mt-1 text-xs text-red-600">
              {errors.agencyName.message}
            </p>
          )}
        </div>

        {/* Submit Button - Per AC-2.1.4: Loading state */}
        <Button
          type="submit"
          className="w-full bg-slate-600 hover:bg-slate-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>

      {/* Per AC-2.1.7: "Already have an account? Sign in" link to /login */}
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-slate-600 hover:text-slate-800 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
