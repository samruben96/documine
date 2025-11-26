/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignupPage from '@/app/(auth)/signup/page';

// Mock the server action
vi.mock('@/app/(auth)/signup/actions', () => ({
  signup: vi.fn(),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('SignupPage', () => {
  describe('form rendering (AC-2.1.1)', () => {
    it('renders all required form fields', () => {
      render(<SignupPage />);

      // AC-2.1.1: Form displays fields: Full name, Email, Password, Agency name
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/agency name/i)).toBeInTheDocument();
    });

    it('renders submit button with correct text', () => {
      render(<SignupPage />);
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('renders header text', () => {
      render(<SignupPage />);
      expect(screen.getByText(/create your account/i)).toBeInTheDocument();
    });
  });

  describe('sign in link (AC-2.1.7)', () => {
    it('renders sign in link pointing to /login', () => {
      render(<SignupPage />);
      const signInLink = screen.getByRole('link', { name: /sign in/i });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute('href', '/login');
    });

    it('renders "Already have an account?" text', () => {
      render(<SignupPage />);
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    });
  });

  describe('form placeholders', () => {
    it('shows appropriate placeholders', () => {
      render(<SignupPage />);

      expect(screen.getByPlaceholderText(/john smith/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/john@agency.com/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/create a strong password/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/smith insurance agency/i)).toBeInTheDocument();
    });
  });

  describe('form validation on blur (AC-2.1.3)', () => {
    it('shows error for invalid email on blur', async () => {
      render(<SignupPage />);

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });
    });

    it('shows error for short name on blur', async () => {
      render(<SignupPage />);

      const nameInput = screen.getByLabelText(/full name/i);
      fireEvent.change(nameInput, { target: { value: 'J' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('shows error for weak password on blur', async () => {
      render(<SignupPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(passwordInput, { target: { value: 'short' } });
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('form accessibility', () => {
    it('has proper form structure', () => {
      const { container } = render(<SignupPage />);
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    it('labels are properly associated with inputs', () => {
      render(<SignupPage />);

      // getByLabelText confirms label-input association
      const fullNameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const agencyInput = screen.getByLabelText(/agency name/i);

      expect(fullNameInput.tagName).toBe('INPUT');
      expect(emailInput.tagName).toBe('INPUT');
      expect(passwordInput.tagName).toBe('INPUT');
      expect(agencyInput.tagName).toBe('INPUT');
    });

    it('inputs have correct types', () => {
      render(<SignupPage />);

      expect(screen.getByLabelText(/full name/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText(/agency name/i)).toHaveAttribute('type', 'text');
    });
  });
});
