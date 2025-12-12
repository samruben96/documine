/**
 * @vitest-environment happy-dom
 */
/**
 * Save Indicator Component Tests
 * Story Q3.2: Auto-Save Implementation
 *
 * Tests for SaveIndicator component covering:
 * - AC-Q3.2-2: "Saving..." indicator with loader
 * - AC-Q3.2-3: "Saved" indicator with checkmark
 * - AC-Q3.2-4: Error state with retry button
 * - AC-Q3.2-15: Offline indicator
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { SaveIndicator } from '@/components/quoting/save-indicator';

describe('SaveIndicator', () => {
  describe('Idle State', () => {
    it('should render nothing in idle state', () => {
      const { container } = render(<SaveIndicator state="idle" />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('AC-Q3.2-2: Saving State', () => {
    it('should show "Saving..." text', () => {
      render(<SaveIndicator state="saving" />);
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should have role="status" for accessibility', () => {
      render(<SaveIndicator state="saving" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-live="polite"', () => {
      render(<SaveIndicator state="saving" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('AC-Q3.2-3: Saved State', () => {
    it('should show "Saved" text', () => {
      render(<SaveIndicator state="saved" />);
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('should have green text styling', () => {
      render(<SaveIndicator state="saved" />);
      const container = screen.getByRole('status');
      expect(container).toHaveClass('text-green-700');
    });

    it('should have role="status" for accessibility', () => {
      render(<SaveIndicator state="saved" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('AC-Q3.2-4: Error State', () => {
    it('should show "Save failed" text', () => {
      render(<SaveIndicator state="error" />);
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });

    it('should show retry button when onRetry is provided', () => {
      const onRetry = vi.fn();
      render(<SaveIndicator state="error" onRetry={onRetry} />);
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should not show retry button when onRetry is not provided', () => {
      render(<SaveIndicator state="error" />);
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(<SaveIndicator state="error" onRetry={onRetry} />);

      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should have role="alert" for error state', () => {
      render(<SaveIndicator state="error" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have aria-live="assertive" for error state', () => {
      render(<SaveIndicator state="error" />);
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have red/destructive text styling', () => {
      render(<SaveIndicator state="error" />);
      const container = screen.getByRole('alert');
      expect(container).toHaveClass('text-red-700');
    });
  });

  describe('AC-Q3.2-15: Offline State', () => {
    it('should show offline indicator when isOffline is true', () => {
      render(<SaveIndicator state="idle" isOffline={true} />);
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });

    it('should show "changes queued" message when offline', () => {
      render(<SaveIndicator state="idle" isOffline={true} />);
      expect(screen.getByText(/queued/i)).toBeInTheDocument();
    });

    it('should show offline indicator regardless of save state', () => {
      render(<SaveIndicator state="saving" isOffline={true} />);
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });

    it('should have amber/warning styling for offline', () => {
      render(<SaveIndicator state="idle" isOffline={true} />);
      const container = screen.getByRole('status');
      expect(container).toHaveClass('text-amber-700');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(<SaveIndicator state="saving" className="custom-class" />);
      const container = screen.getByRole('status');
      expect(container).toHaveClass('custom-class');
    });
  });
});
