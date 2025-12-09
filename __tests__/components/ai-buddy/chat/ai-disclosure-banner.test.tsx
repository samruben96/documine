/**
 * AI Disclosure Banner Component Tests
 * Story 19.4: AI Disclosure Message
 *
 * Tests for the AIDisclosureBanner component covering:
 * - AC-19.4.4: Banner renders with custom message
 * - AC-19.4.5: Banner is non-dismissible (no close button)
 * - AC-19.4.6: Banner does not render when message is null/empty
 * - AC-19.4.8: Accessibility requirements (ARIA attributes)
 *
 * @vitest-environment happy-dom
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AIDisclosureBanner } from '@/components/ai-buddy/chat/ai-disclosure-banner';

describe('AIDisclosureBanner', () => {
  // AC-19.4.4: Banner renders with custom message
  describe('rendering with message', () => {
    it('renders banner with provided message', () => {
      render(<AIDisclosureBanner message="You are chatting with an AI assistant." />);

      expect(screen.getByTestId('ai-disclosure-banner')).toBeInTheDocument();
      expect(screen.getByText('You are chatting with an AI assistant.')).toBeInTheDocument();
    });

    it('renders info icon', () => {
      render(<AIDisclosureBanner message="Test message" />);

      // Icon should be present but decorative (aria-hidden)
      const icon = screen.getByTestId('ai-disclosure-banner').querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('applies correct styling classes', () => {
      render(<AIDisclosureBanner message="Test message" />);

      const banner = screen.getByTestId('ai-disclosure-banner');
      expect(banner).toHaveClass('bg-blue-50');
      expect(banner).toHaveClass('border-b');
    });

    it('renders long messages correctly', () => {
      const longMessage =
        'This is a very long disclosure message that should wrap properly. ' +
        'It contains important information about the AI assistant that users need to know. ' +
        'The banner should handle this gracefully without breaking the layout.';

      render(<AIDisclosureBanner message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('accepts custom className', () => {
      render(<AIDisclosureBanner message="Test" className="custom-class" />);

      expect(screen.getByTestId('ai-disclosure-banner')).toHaveClass('custom-class');
    });
  });

  // AC-19.4.5: Banner is non-dismissible
  describe('non-dismissible behavior', () => {
    it('does not have a close button', () => {
      render(<AIDisclosureBanner message="Test message" />);

      // Check for common close button patterns
      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/close/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/dismiss/i)).not.toBeInTheDocument();

      // Check for X or × symbols that might be close buttons
      const banner = screen.getByTestId('ai-disclosure-banner');
      const buttons = banner.querySelectorAll('button');
      expect(buttons.length).toBe(0);
    });

    it('does not have onClick handler for dismissal', () => {
      render(<AIDisclosureBanner message="Test message" />);

      const banner = screen.getByTestId('ai-disclosure-banner');
      // Banner should not have cursor-pointer or interactive styling
      expect(banner).not.toHaveClass('cursor-pointer');
    });

    it('has select-none class to prevent selection', () => {
      render(<AIDisclosureBanner message="Test message" />);

      expect(screen.getByTestId('ai-disclosure-banner')).toHaveClass('select-none');
    });
  });

  // AC-19.4.6: Banner does not render when message is null/empty
  describe('empty message handling', () => {
    it('returns null when message is empty string', () => {
      const { container } = render(<AIDisclosureBanner message="" />);

      expect(container.firstChild).toBeNull();
      expect(screen.queryByTestId('ai-disclosure-banner')).not.toBeInTheDocument();
    });

    it('returns null when message is whitespace only', () => {
      const { container } = render(<AIDisclosureBanner message="   " />);

      expect(container.firstChild).toBeNull();
      expect(screen.queryByTestId('ai-disclosure-banner')).not.toBeInTheDocument();
    });

    it('renders when message has content with surrounding whitespace', () => {
      // Note: Component should still render if there's actual content
      render(<AIDisclosureBanner message="  Test  " />);

      // The component should render because there's actual content (not just whitespace)
      expect(screen.getByTestId('ai-disclosure-banner')).toBeInTheDocument();
    });
  });

  // AC-19.4.8: Accessibility requirements
  describe('accessibility', () => {
    it('has role="status" for live region', () => {
      render(<AIDisclosureBanner message="Test message" />);

      const banner = screen.getByTestId('ai-disclosure-banner');
      expect(banner).toHaveAttribute('role', 'status');
    });

    it('has aria-live="polite"', () => {
      render(<AIDisclosureBanner message="Test message" />);

      const banner = screen.getByTestId('ai-disclosure-banner');
      expect(banner).toHaveAttribute('aria-live', 'polite');
    });

    it('has descriptive aria-label', () => {
      render(<AIDisclosureBanner message="Test message" />);

      const banner = screen.getByTestId('ai-disclosure-banner');
      expect(banner).toHaveAttribute('aria-label', 'AI Assistant Disclosure');
    });

    it('icon is decorative (aria-hidden)', () => {
      render(<AIDisclosureBanner message="Test message" />);

      const icon = screen.getByTestId('ai-disclosure-banner').querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('text has sufficient contrast classes', () => {
      render(<AIDisclosureBanner message="Test message" />);

      const text = screen.getByText('Test message');
      // Text should use high-contrast color classes
      expect(text).toHaveClass('text-blue-800');
    });

    it('can be found by screen readers via role', () => {
      render(<AIDisclosureBanner message="Important disclosure" />);

      // Screen readers should be able to find this by status role
      expect(screen.getByRole('status')).toHaveTextContent('Important disclosure');
    });
  });

  // Color contrast (visual verification)
  describe('WCAG compliance', () => {
    it('uses appropriate background color', () => {
      render(<AIDisclosureBanner message="Test" />);

      const banner = screen.getByTestId('ai-disclosure-banner');
      // bg-blue-50 provides good contrast with blue-800 text
      expect(banner).toHaveClass('bg-blue-50');
    });

    it('uses appropriate text color for contrast', () => {
      render(<AIDisclosureBanner message="Test message" />);

      const text = screen.getByText('Test message');
      // text-blue-800 on bg-blue-50 provides >= 4.5:1 contrast ratio
      expect(text).toHaveClass('text-blue-800');
    });

    it('icon has appropriate color', () => {
      render(<AIDisclosureBanner message="Test" />);

      const icon = screen.getByTestId('ai-disclosure-banner').querySelector('svg');
      // text-blue-600 for icon on bg-blue-50
      expect(icon).toHaveClass('text-blue-600');
    });
  });

  // Dark mode support
  describe('dark mode', () => {
    it('has dark mode background class', () => {
      render(<AIDisclosureBanner message="Test" />);

      const banner = screen.getByTestId('ai-disclosure-banner');
      expect(banner.className).toContain('dark:bg-blue-900/20');
    });

    it('has dark mode text color class', () => {
      render(<AIDisclosureBanner message="Test message" />);

      const text = screen.getByText('Test message');
      expect(text.className).toContain('dark:text-blue-100');
    });

    it('has dark mode icon color class', () => {
      render(<AIDisclosureBanner message="Test" />);

      const icon = screen.getByTestId('ai-disclosure-banner').querySelector('svg');
      expect(icon?.className).toContain('dark:text-blue-400');
    });

    it('has dark mode border color', () => {
      render(<AIDisclosureBanner message="Test" />);

      const banner = screen.getByTestId('ai-disclosure-banner');
      expect(banner.className).toContain('dark:border-blue-800/30');
    });
  });

  // Layout behavior
  describe('layout', () => {
    it('uses flex layout with gap', () => {
      render(<AIDisclosureBanner message="Test" />);

      const banner = screen.getByTestId('ai-disclosure-banner');
      expect(banner).toHaveClass('flex');
      expect(banner).toHaveClass('gap-3');
    });

    it('aligns items to start', () => {
      render(<AIDisclosureBanner message="Test" />);

      const banner = screen.getByTestId('ai-disclosure-banner');
      expect(banner).toHaveClass('items-start');
    });

    it('has appropriate padding', () => {
      render(<AIDisclosureBanner message="Test" />);

      const banner = screen.getByTestId('ai-disclosure-banner');
      expect(banner).toHaveClass('p-3');
    });

    it('icon does not shrink', () => {
      render(<AIDisclosureBanner message="Test" />);

      const icon = screen.getByTestId('ai-disclosure-banner').querySelector('svg');
      expect(icon).toHaveClass('flex-shrink-0');
    });

    it('text uses relaxed leading', () => {
      render(<AIDisclosureBanner message="Test message" />);

      const text = screen.getByText('Test message');
      expect(text).toHaveClass('leading-relaxed');
    });
  });
});
