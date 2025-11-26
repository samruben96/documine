/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PasswordStrength } from '@/components/auth/password-strength';

describe('PasswordStrength', () => {
  it('renders nothing when password is empty', () => {
    const { container } = render(<PasswordStrength password="" />);
    expect(container.firstChild).toBeNull();
  });

  describe('weak password detection', () => {
    it('shows weak for passwords shorter than 8 characters', () => {
      render(<PasswordStrength password="Pass1!" />);
      expect(screen.getByText('Weak')).toBeInTheDocument();
    });

    it('shows weak for passwords with only lowercase', () => {
      render(<PasswordStrength password="password" />);
      expect(screen.getByText('Weak')).toBeInTheDocument();
    });

    it('shows weak for passwords missing most requirements', () => {
      render(<PasswordStrength password="12345678" />);
      expect(screen.getByText('Weak')).toBeInTheDocument();
    });
  });

  describe('medium password detection', () => {
    it('shows medium for passwords with 2-3 requirements', () => {
      render(<PasswordStrength password="Password1" />);
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('shows medium for 8+ chars with uppercase and lowercase only', () => {
      render(<PasswordStrength password="Passwordonly" />);
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });
  });

  describe('strong password detection', () => {
    it('shows strong for passwords meeting all 4 requirements', () => {
      render(<PasswordStrength password="Password1!" />);
      expect(screen.getByText('Strong')).toBeInTheDocument();
    });

    it('shows strong for complex passwords', () => {
      render(<PasswordStrength password="MySecure@Pass123" />);
      expect(screen.getByText('Strong')).toBeInTheDocument();
    });
  });

  describe('visual bar rendering', () => {
    it('renders progress bar with correct color for weak', () => {
      const { container } = render(<PasswordStrength password="weak" />);
      const progressBar = container.querySelector('.bg-red-500');
      expect(progressBar).toBeTruthy();
    });

    it('renders progress bar with correct color for strong', () => {
      const { container } = render(<PasswordStrength password="StrongPass1!" />);
      const progressBar = container.querySelector('.bg-emerald-500');
      expect(progressBar).toBeTruthy();
    });
  });
});
