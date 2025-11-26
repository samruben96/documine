'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { login } from './actions';

/**
 * Login Page Component
 * Implements:
 * - AC-2.3.1: Login form with Email, Password, and "Remember me" checkbox
 * - AC-2.3.2: Submit button shows loading state during authentication
 * - AC-2.3.3: Successful login redirects to /documents or ?redirect query param
 * - AC-2.3.4: Invalid credentials show generic error "Invalid email or password"
 * - AC-2.3.5: Page includes "Forgot password?" and "Sign up" links
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFormSkeleton() {
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

function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/documents';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setLoginError(null);

    try {
      const result = await login(data, redirectTo);

      // If we get here without redirect, there was an error
      if (!result.success && result.error) {
        // Show error inline and as toast
        setLoginError(result.error);
        toast.error(result.error, {
          duration: 5000,
        });
        // Clear password field on error (keep email) per AC-2.3.4
        setValue('password', '');
      }
    } catch {
      const errorMsg = 'Something went wrong. Please try again.';
      setLoginError(errorMsg);
      toast.error(errorMsg, {
        duration: 5000,
      });
      setValue('password', '');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Per UX spec: Clean, minimal layout */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-slate-800">
          Sign in to your account
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Access your documents and continue your work
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Inline error message for failed login */}
        {loginError && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700 font-medium">{loginError}</p>
          </div>
        )}

        {/* Email Field - Per AC-2.3.1 */}
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

        {/* Password Field - Per AC-2.3.1 */}
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
            placeholder="Enter your password"
            disabled={isSubmitting}
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me Checkbox - Per AC-2.3.1 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="rememberMe"
              type="checkbox"
              className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300 rounded"
              disabled={isSubmitting}
              {...register('rememberMe')}
            />
            <label
              htmlFor="rememberMe"
              className="ml-2 block text-sm text-slate-700"
            >
              Remember me
            </label>
          </div>

          {/* Forgot Password Link - Per AC-2.3.5 */}
          <Link
            href="/reset-password"
            className="text-sm font-medium text-slate-600 hover:text-slate-800 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button - Per AC-2.3.2: Loading state */}
        <Button
          type="submit"
          className="w-full bg-slate-600 hover:bg-slate-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      {/* Sign Up Link - Per AC-2.3.5 */}
      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium text-slate-600 hover:text-slate-800 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
