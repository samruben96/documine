/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectionIndicator, type ConnectionState } from '@/components/ui/connection-indicator';

describe('ConnectionIndicator', () => {
  describe('AC-6.6.1: Shows "Connected" with green checkmark when connected', () => {
    it('renders "Connected" text when state is connected', () => {
      render(<ConnectionIndicator state="connected" />);
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('has green color styling when connected', () => {
      render(<ConnectionIndicator state="connected" />);
      const indicator = screen.getByTestId('connection-indicator');
      expect(indicator).toHaveAttribute('data-state', 'connected');
      expect(indicator).toHaveClass('text-emerald-600');
    });

    it('does not have spinning icon when connected', () => {
      render(<ConnectionIndicator state="connected" />);
      const icon = screen.getByTestId('connection-indicator').querySelector('svg');
      expect(icon).not.toHaveClass('animate-spin');
    });
  });

  describe('AC-6.6.2: Shows "Connecting..." with spinner during connection', () => {
    it('renders "Connecting..." text when state is connecting', () => {
      render(<ConnectionIndicator state="connecting" />);
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });

    it('has muted color styling when connecting', () => {
      render(<ConnectionIndicator state="connecting" />);
      const indicator = screen.getByTestId('connection-indicator');
      expect(indicator).toHaveAttribute('data-state', 'connecting');
      expect(indicator).toHaveClass('text-slate-400');
    });

    it('has spinning icon when connecting', () => {
      render(<ConnectionIndicator state="connecting" />);
      const icon = screen.getByTestId('connection-indicator').querySelector('svg');
      expect(icon).toHaveClass('animate-spin');
    });
  });

  describe('AC-6.6.3: Shows "Offline" when disconnected', () => {
    it('renders "Offline" text when state is disconnected', () => {
      render(<ConnectionIndicator state="disconnected" />);
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('has red color styling when disconnected', () => {
      render(<ConnectionIndicator state="disconnected" />);
      const indicator = screen.getByTestId('connection-indicator');
      expect(indicator).toHaveAttribute('data-state', 'disconnected');
      expect(indicator).toHaveClass('text-red-500');
    });

    it('does not have spinning icon when disconnected', () => {
      render(<ConnectionIndicator state="disconnected" />);
      const icon = screen.getByTestId('connection-indicator').querySelector('svg');
      expect(icon).not.toHaveClass('animate-spin');
    });
  });

  describe('AC-6.6.5: Shows "Reconnecting..." during auto-reconnect', () => {
    it('renders "Reconnecting..." text when state is reconnecting', () => {
      render(<ConnectionIndicator state="reconnecting" />);
      expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
    });

    it('has amber color styling when reconnecting', () => {
      render(<ConnectionIndicator state="reconnecting" />);
      const indicator = screen.getByTestId('connection-indicator');
      expect(indicator).toHaveAttribute('data-state', 'reconnecting');
      expect(indicator).toHaveClass('text-amber-500');
    });

    it('has spinning icon when reconnecting', () => {
      render(<ConnectionIndicator state="reconnecting" />);
      const icon = screen.getByTestId('connection-indicator').querySelector('svg');
      expect(icon).toHaveClass('animate-spin');
    });
  });

  describe('AC-6.6.4: Indicator is subtle, not distracting', () => {
    it('uses small text size (text-xs)', () => {
      render(<ConnectionIndicator state="connected" />);
      const indicator = screen.getByTestId('connection-indicator');
      expect(indicator).toHaveClass('text-xs');
    });

    it('uses small icon size (h-3 w-3)', () => {
      render(<ConnectionIndicator state="connected" />);
      const icon = screen.getByTestId('connection-indicator').querySelector('svg');
      expect(icon).toHaveClass('h-3', 'w-3');
    });

    it('has appropriate ARIA attributes for accessibility', () => {
      render(<ConnectionIndicator state="connected" />);
      const indicator = screen.getByTestId('connection-indicator');
      expect(indicator).toHaveAttribute('role', 'status');
      expect(indicator).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('className prop', () => {
    it('allows custom className to be passed', () => {
      render(<ConnectionIndicator state="connected" className="custom-class" />);
      const indicator = screen.getByTestId('connection-indicator');
      expect(indicator).toHaveClass('custom-class');
    });
  });

  describe('state type safety', () => {
    it('accepts all valid ConnectionState values', () => {
      const states: ConnectionState[] = ['connecting', 'connected', 'disconnected', 'reconnecting'];
      states.forEach((state) => {
        const { unmount } = render(<ConnectionIndicator state={state} />);
        expect(screen.getByTestId('connection-indicator')).toHaveAttribute('data-state', state);
        unmount();
      });
    });
  });
});
