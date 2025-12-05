/**
 * CollapsibleSection Component Tests
 *
 * Story 10.8: AC-10.8.1, AC-10.8.7
 * Tests for collapsible section pattern.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollapsibleSection } from '@/components/compare/collapsible-section';

// ============================================================================
// CollapsibleSection Component Tests
// ============================================================================

describe('CollapsibleSection', () => {
  describe('basic rendering', () => {
    it('renders section title', () => {
      render(
        <CollapsibleSection title="Policy Details">
          <p>Content here</p>
        </CollapsibleSection>
      );
      expect(screen.getByText('Policy Details')).toBeInTheDocument();
    });

    it('has data-testid based on title', () => {
      render(
        <CollapsibleSection title="Policy Details">
          <p>Content here</p>
        </CollapsibleSection>
      );
      expect(screen.getByTestId('collapsible-section-policy-details')).toBeInTheDocument();
    });

    it('renders as button element', () => {
      render(
        <CollapsibleSection title="Test">
          <p>Content</p>
        </CollapsibleSection>
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('defaultOpen behavior', () => {
    it('starts collapsed by default', () => {
      render(
        <CollapsibleSection title="Test">
          <p>Hidden content</p>
        </CollapsibleSection>
      );
      expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
    });

    it('starts expanded when defaultOpen is true', () => {
      render(
        <CollapsibleSection title="Test" defaultOpen>
          <p>Visible content</p>
        </CollapsibleSection>
      );
      expect(screen.getByText('Visible content')).toBeInTheDocument();
    });

    it('starts collapsed when defaultOpen is false', () => {
      render(
        <CollapsibleSection title="Test" defaultOpen={false}>
          <p>Hidden content</p>
        </CollapsibleSection>
      );
      expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
    });
  });

  describe('toggle behavior', () => {
    it('expands when clicked', async () => {
      const user = userEvent.setup();
      render(
        <CollapsibleSection title="Test">
          <p>Content revealed</p>
        </CollapsibleSection>
      );

      expect(screen.queryByText('Content revealed')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('Content revealed')).toBeInTheDocument();
    });

    it('collapses when clicked again', async () => {
      const user = userEvent.setup();
      render(
        <CollapsibleSection title="Test" defaultOpen>
          <p>Disappearing content</p>
        </CollapsibleSection>
      );

      expect(screen.getByText('Disappearing content')).toBeInTheDocument();

      await user.click(screen.getByRole('button'));

      expect(screen.queryByText('Disappearing content')).not.toBeInTheDocument();
    });
  });

  describe('accessibility (AC-10.8.7)', () => {
    it('has aria-expanded attribute', () => {
      render(
        <CollapsibleSection title="Test">
          <p>Content</p>
        </CollapsibleSection>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('aria-expanded updates when toggled', async () => {
      const user = userEvent.setup();
      render(
        <CollapsibleSection title="Test">
          <p>Content</p>
        </CollapsibleSection>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');

      await user.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('has aria-controls attribute', () => {
      render(
        <CollapsibleSection title="Test" defaultOpen>
          <p>Content</p>
        </CollapsibleSection>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-controls');
    });

    it('content has role="region" when open', () => {
      render(
        <CollapsibleSection title="Test" defaultOpen>
          <p>Content</p>
        </CollapsibleSection>
      );
      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('keyboard navigation (AC-10.8.7)', () => {
    it('toggles on Enter key', async () => {
      const user = userEvent.setup();
      render(
        <CollapsibleSection title="Test">
          <p>Content</p>
        </CollapsibleSection>
      );

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard('{Enter}');

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('toggles on Space key', async () => {
      const user = userEvent.setup();
      render(
        <CollapsibleSection title="Test">
          <p>Content</p>
        </CollapsibleSection>
      );

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard(' ');

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('collapses on Enter when open', async () => {
      const user = userEvent.setup();
      render(
        <CollapsibleSection title="Test" defaultOpen>
          <p>Content</p>
        </CollapsibleSection>
      );

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard('{Enter}');

      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });
  });

  describe('badge display', () => {
    it('shows badge when provided', () => {
      render(
        <CollapsibleSection title="Coverages" badge={5}>
          <p>Content</p>
        </CollapsibleSection>
      );
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('hides badge when value is 0', () => {
      render(
        <CollapsibleSection title="Coverages" badge={0}>
          <p>Content</p>
        </CollapsibleSection>
      );
      // Title is present but no badge
      expect(screen.getByText('Coverages')).toBeInTheDocument();
      // The number 0 should not appear as a badge
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('hides badge when undefined', () => {
      render(
        <CollapsibleSection title="Test">
          <p>Content</p>
        </CollapsibleSection>
      );
      // No extra numbers should appear
      const button = screen.getByRole('button');
      expect(button).not.toHaveTextContent(/\d/);
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <CollapsibleSection title="Test" className="my-custom-class">
          <p>Content</p>
        </CollapsibleSection>
      );
      expect(container.firstChild).toHaveClass('my-custom-class');
    });
  });

  describe('children rendering', () => {
    it('renders complex children correctly', async () => {
      const user = userEvent.setup();
      render(
        <CollapsibleSection title="Complex">
          <div data-testid="child-container">
            <h3>Header</h3>
            <p>Paragraph</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </CollapsibleSection>
      );

      await user.click(screen.getByRole('button'));

      expect(screen.getByTestId('child-container')).toBeInTheDocument();
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });
});
