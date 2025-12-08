/**
 * @vitest-environment happy-dom
 */
/**
 * AI Buddy Streaming Indicator Component Tests
 * Story 15.2: Message Display Component
 *
 * Tests for acceptance criteria:
 * - AC-15.2.7: Typing indicator (animated dots) shown during AI response streaming
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StreamingIndicator } from '@/components/ai-buddy/streaming-indicator';

describe('StreamingIndicator', () => {
  describe('AC-15.2.7: Conditional rendering', () => {
    it('renders when isVisible is true', () => {
      render(<StreamingIndicator isVisible={true} />);
      expect(screen.getByTestId('streaming-indicator')).toBeInTheDocument();
    });

    it('does not render when isVisible is false', () => {
      render(<StreamingIndicator isVisible={false} />);
      expect(screen.queryByTestId('streaming-indicator')).not.toBeInTheDocument();
    });

    it('toggles visibility based on prop changes', () => {
      const { rerender } = render(<StreamingIndicator isVisible={false} />);
      expect(screen.queryByTestId('streaming-indicator')).not.toBeInTheDocument();

      rerender(<StreamingIndicator isVisible={true} />);
      expect(screen.getByTestId('streaming-indicator')).toBeInTheDocument();

      rerender(<StreamingIndicator isVisible={false} />);
      expect(screen.queryByTestId('streaming-indicator')).not.toBeInTheDocument();
    });
  });

  describe('AI Avatar', () => {
    it('displays AI avatar with emerald/green background', () => {
      render(<StreamingIndicator isVisible={true} />);
      const avatar = screen.getByTestId('streaming-avatar');
      expect(avatar).toHaveClass('bg-emerald-500');
    });

    it('avatar has rounded-full class', () => {
      render(<StreamingIndicator isVisible={true} />);
      const avatar = screen.getByTestId('streaming-avatar');
      expect(avatar).toHaveClass('rounded-full');
    });

    it('avatar has correct size (h-8 w-8)', () => {
      render(<StreamingIndicator isVisible={true} />);
      const avatar = screen.getByTestId('streaming-avatar');
      expect(avatar).toHaveClass('h-8', 'w-8');
    });

    it('avatar contains Bot icon', () => {
      render(<StreamingIndicator isVisible={true} />);
      const avatar = screen.getByTestId('streaming-avatar');
      const svg = avatar.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Animated Dots', () => {
    it('shows animated dots when no streamingContent', () => {
      render(<StreamingIndicator isVisible={true} />);
      expect(screen.getByTestId('animated-dots')).toBeInTheDocument();
    });

    it('animated dots has three spans', () => {
      render(<StreamingIndicator isVisible={true} />);
      const dotsContainer = screen.getByTestId('animated-dots');
      const dots = dotsContainer.querySelectorAll('span');
      expect(dots).toHaveLength(3);
    });

    it('dots have bounce animation', () => {
      render(<StreamingIndicator isVisible={true} />);
      const dotsContainer = screen.getByTestId('animated-dots');
      const dots = dotsContainer.querySelectorAll('span');
      dots.forEach((dot) => {
        expect(dot).toHaveClass('animate-bounce');
      });
    });

    it('dots have staggered animation delays', () => {
      render(<StreamingIndicator isVisible={true} />);
      const dotsContainer = screen.getByTestId('animated-dots');
      const dots = dotsContainer.querySelectorAll('span');

      // First dot has -0.3s delay
      expect(dots[0]).toHaveClass('[animation-delay:-0.3s]');
      // Second dot has -0.15s delay
      expect(dots[1]).toHaveClass('[animation-delay:-0.15s]');
      // Third dot has no delay class (uses default)
    });

    it('dots have emerald background', () => {
      render(<StreamingIndicator isVisible={true} />);
      const dotsContainer = screen.getByTestId('animated-dots');
      const dots = dotsContainer.querySelectorAll('span');
      dots.forEach((dot) => {
        expect(dot).toHaveClass('bg-emerald-500');
      });
    });

    it('dots are small circles (h-2 w-2 rounded-full)', () => {
      render(<StreamingIndicator isVisible={true} />);
      const dotsContainer = screen.getByTestId('animated-dots');
      const dots = dotsContainer.querySelectorAll('span');
      dots.forEach((dot) => {
        expect(dot).toHaveClass('h-2', 'w-2', 'rounded-full');
      });
    });
  });

  describe('Streaming Content', () => {
    it('shows streaming content when provided', () => {
      render(
        <StreamingIndicator isVisible={true} streamingContent="Hello, I am..." />
      );
      expect(screen.getByText(/Hello, I am.../)).toBeInTheDocument();
    });

    it('hides animated dots when streaming content is provided', () => {
      render(
        <StreamingIndicator isVisible={true} streamingContent="Hello, I am..." />
      );
      expect(screen.queryByTestId('animated-dots')).not.toBeInTheDocument();
    });

    it('shows cursor indicator when streaming', () => {
      render(
        <StreamingIndicator isVisible={true} streamingContent="Partial text" />
      );
      // Cursor should be an animated element
      const bubble = screen.getByTestId('streaming-bubble');
      const cursor = bubble.querySelector('.animate-pulse');
      expect(cursor).toBeInTheDocument();
    });

    it('renders markdown in streaming content', () => {
      render(
        <StreamingIndicator
          isVisible={true}
          streamingContent="This is **bold** text"
        />
      );
      const bubble = screen.getByTestId('streaming-bubble');
      const boldElement = bubble.querySelector('strong');
      expect(boldElement).toBeInTheDocument();
    });

    it('switches between dots and content based on streamingContent', () => {
      const { rerender } = render(<StreamingIndicator isVisible={true} />);
      expect(screen.getByTestId('animated-dots')).toBeInTheDocument();

      rerender(
        <StreamingIndicator isVisible={true} streamingContent="Content..." />
      );
      expect(screen.queryByTestId('animated-dots')).not.toBeInTheDocument();
      expect(screen.getByText(/Content.../)).toBeInTheDocument();

      rerender(<StreamingIndicator isVisible={true} streamingContent="" />);
      expect(screen.getByTestId('animated-dots')).toBeInTheDocument();
    });
  });

  describe('Message Bubble Styling', () => {
    it('has slate background matching AI messages', () => {
      render(<StreamingIndicator isVisible={true} />);
      const bubble = screen.getByTestId('streaming-bubble');
      expect(bubble).toHaveClass('bg-slate-100');
    });

    it('has rounded corners', () => {
      render(<StreamingIndicator isVisible={true} />);
      const bubble = screen.getByTestId('streaming-bubble');
      expect(bubble).toHaveClass('rounded-2xl');
    });

    it('has shadow', () => {
      render(<StreamingIndicator isVisible={true} />);
      const bubble = screen.getByTestId('streaming-bubble');
      expect(bubble).toHaveClass('shadow-sm');
    });

    it('has minimum height for consistent sizing', () => {
      render(<StreamingIndicator isVisible={true} />);
      const bubble = screen.getByTestId('streaming-bubble');
      expect(bubble).toHaveClass('min-h-[40px]');
    });
  });

  describe('Accessibility', () => {
    it('has role="status"', () => {
      render(<StreamingIndicator isVisible={true} />);
      const indicator = screen.getByTestId('streaming-indicator');
      expect(indicator).toHaveAttribute('role', 'status');
    });

    it('has aria-label describing the state', () => {
      render(<StreamingIndicator isVisible={true} />);
      const indicator = screen.getByTestId('streaming-indicator');
      expect(indicator).toHaveAttribute(
        'aria-label',
        'AI is generating a response'
      );
    });

    it('animated dots have aria-label', () => {
      render(<StreamingIndicator isVisible={true} />);
      const dots = screen.getByTestId('animated-dots');
      expect(dots).toHaveAttribute('aria-label', 'AI is typing');
    });

    it('avatar is hidden from screen readers', () => {
      render(<StreamingIndicator isVisible={true} />);
      const avatar = screen.getByTestId('streaming-avatar');
      expect(avatar).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Custom className', () => {
    it('applies custom className to container', () => {
      render(
        <StreamingIndicator isVisible={true} className="custom-class" />
      );
      const indicator = screen.getByTestId('streaming-indicator');
      expect(indicator).toHaveClass('custom-class');
    });
  });

  describe('Layout', () => {
    it('matches AI message layout (left-aligned)', () => {
      render(<StreamingIndicator isVisible={true} />);
      const indicator = screen.getByTestId('streaming-indicator');
      // Should have flex layout without row-reverse
      expect(indicator).toHaveClass('flex');
      expect(indicator).not.toHaveClass('flex-row-reverse');
    });

    it('has gap between avatar and content', () => {
      render(<StreamingIndicator isVisible={true} />);
      const indicator = screen.getByTestId('streaming-indicator');
      expect(indicator).toHaveClass('gap-3');
    });

    it('content area has max-width constraint', () => {
      render(<StreamingIndicator isVisible={true} />);
      const bubble = screen.getByTestId('streaming-bubble');
      const contentContainer = bubble.parentElement;
      expect(contentContainer).toHaveClass('max-w-[80%]');
    });
  });
});
