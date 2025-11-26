/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/(auth)/login/page';

// Mock the server action
const mockLogin = vi.fn();
vi.mock('@/app/(auth)/login/actions', () => ({
  login: (...args: unknown[]) => mockLogin(...args),
}));

// Mock sonner
const mockToastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: vi.fn(),
  },
}));

// Mock next/navigation
const mockSearchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete('redirect');
  });

  describe('form rendering (AC-2.3.1)', () => {
    it('renders email input field', () => {
      render(<LoginPage />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('renders password input field', () => {
      render(<LoginPage />);
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('renders "Remember me" checkbox', () => {
      render(<LoginPage />);
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    });

    it('renders all required form fields with correct types', () => {
      render(<LoginPage />);

      expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText(/remember me/i)).toHaveAttribute('type', 'checkbox');
    });
  });

  describe('submit button (AC-2.3.2)', () => {
    it('renders submit button with "Sign in" text', () => {
      render(<LoginPage />);
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows loading state when submitting', async () => {
      // Make login hang to see loading state
      mockLogin.mockImplementation(() => new Promise(() => {}));

      render(<LoginPage />);

      // Fill out form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });
    });

    it('disables form inputs during submission', async () => {
      mockLogin.mockImplementation(() => new Promise(() => {}));

      render(<LoginPage />);

      // Fill out form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeDisabled();
        expect(screen.getByLabelText(/password/i)).toBeDisabled();
        expect(screen.getByLabelText(/remember me/i)).toBeDisabled();
      });
    });
  });

  describe('links (AC-2.3.5)', () => {
    it('renders "Forgot password?" link pointing to /reset-password', () => {
      render(<LoginPage />);
      const forgotLink = screen.getByRole('link', { name: /forgot password/i });
      expect(forgotLink).toBeInTheDocument();
      expect(forgotLink).toHaveAttribute('href', '/reset-password');
    });

    it('renders "Sign up" link pointing to /signup', () => {
      render(<LoginPage />);
      const signUpLink = screen.getByRole('link', { name: /sign up/i });
      expect(signUpLink).toBeInTheDocument();
      expect(signUpLink).toHaveAttribute('href', '/signup');
    });

    it('renders "Don\'t have an account?" text', () => {
      render(<LoginPage />);
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    });
  });

  describe('error handling (AC-2.3.4)', () => {
    it('shows toast with generic error on invalid credentials', async () => {
      mockLogin.mockResolvedValue({
        success: false,
        error: 'Invalid email or password',
      });

      render(<LoginPage />);

      // Fill out form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpassword' },
      });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          'Invalid email or password',
          expect.any(Object)
        );
      });
    });

    it('clears password field on error while keeping email', async () => {
      mockLogin.mockResolvedValue({
        success: false,
        error: 'Invalid email or password',
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      // Fill out form
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        // Password should be cleared
        expect(passwordInput).toHaveValue('');
        // Email should remain
        expect(emailInput).toHaveValue('test@example.com');
      });
    });
  });

  describe('form validation', () => {
    it('prevents submission with invalid email format', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      // Enter invalid email and valid password
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Submit to trigger validation
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      // Wait a bit for form to process
      await waitFor(() => {
        // Login should not be called with invalid email
        expect(mockLogin).not.toHaveBeenCalled();
      });
    });

    it('shows error when password is empty on submit', async () => {
      render(<LoginPage />);

      // Submit with empty form to trigger validation
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('redirect handling (AC-2.3.3)', () => {
    it('passes redirect param to login action when present', async () => {
      mockSearchParams.set('redirect', '/dashboard');
      mockLogin.mockResolvedValue({ success: true });

      render(<LoginPage />);

      // Fill out form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'test@example.com',
            password: 'password123',
          }),
          '/dashboard'
        );
      });
    });

    it('uses /documents as default redirect when no param present', async () => {
      mockLogin.mockResolvedValue({ success: true });

      render(<LoginPage />);

      // Fill out form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          expect.any(Object),
          '/documents'
        );
      });
    });
  });

  describe('form accessibility', () => {
    it('has proper form structure', () => {
      const { container } = render(<LoginPage />);
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    it('labels are properly associated with inputs', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const rememberMeInput = screen.getByLabelText(/remember me/i);

      expect(emailInput.tagName).toBe('INPUT');
      expect(passwordInput.tagName).toBe('INPUT');
      expect(rememberMeInput.tagName).toBe('INPUT');
    });

    it('renders header text', () => {
      render(<LoginPage />);
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    });
  });
});
