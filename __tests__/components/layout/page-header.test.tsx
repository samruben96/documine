/**
 * @vitest-environment happy-dom
 */
/**
 * PageHeader Component Tests
 * Story DR.3: Page Layout & Background Update
 *
 * Tests for:
 * - AC-DR.3.4: Page titles use text-2xl font-semibold text-slate-900
 * - AC-DR.3.5: Subtitles use text-slate-500 text-sm mt-1
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from '@/components/layout/page-header';
import { FileText } from 'lucide-react';

describe('PageHeader', () => {
  describe('Title rendering', () => {
    it('renders title with correct classes (AC-DR.3.4)', () => {
      render(<PageHeader title="Test Title" />);

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveTextContent('Test Title');
      expect(title).toHaveClass('text-2xl');
      expect(title).toHaveClass('font-semibold');
      expect(title).toHaveClass('text-slate-900');
    });

    it('renders title with dark mode class (AC-DR.3.4)', () => {
      render(<PageHeader title="Dark Mode Title" />);

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('dark:text-slate-100');
    });

    it('renders only title when no other props provided', () => {
      render(<PageHeader title="Only Title" />);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
    });
  });

  describe('Subtitle rendering', () => {
    it('renders subtitle with correct classes (AC-DR.3.5)', () => {
      render(<PageHeader title="Title" subtitle="Test Subtitle" />);

      const subtitle = screen.getByText('Test Subtitle');
      expect(subtitle).toHaveClass('text-slate-500');
      expect(subtitle).toHaveClass('text-sm');
      expect(subtitle).toHaveClass('mt-1');
    });

    it('renders subtitle with dark mode class (AC-DR.3.5)', () => {
      render(<PageHeader title="Title" subtitle="Dark Subtitle" />);

      const subtitle = screen.getByText('Dark Subtitle');
      expect(subtitle).toHaveClass('dark:text-slate-400');
    });

    it('does not render subtitle when not provided', () => {
      render(<PageHeader title="Title Only" />);

      // Only the title should be present, no paragraph element
      expect(screen.getByRole('heading')).toBeInTheDocument();
      // Subtitle uses <p> tag - there should be no paragraph elements
      const paragraphs = document.querySelectorAll('p');
      expect(paragraphs.length).toBe(0);
    });
  });

  describe('Actions slot', () => {
    it('renders actions slot when provided', () => {
      render(
        <PageHeader
          title="With Actions"
          actions={<button type="button">Action Button</button>}
        />
      );

      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
    });

    it('renders multiple actions in flex container', () => {
      render(
        <PageHeader
          title="Multiple Actions"
          actions={
            <>
              <button type="button">Action 1</button>
              <button type="button">Action 2</button>
            </>
          }
        />
      );

      expect(screen.getByRole('button', { name: 'Action 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action 2' })).toBeInTheDocument();
    });

    it('does not render actions container when not provided', () => {
      const { container } = render(<PageHeader title="No Actions" />);

      // Actions container should not exist - check by looking for the flex gap-2 container
      const actionsContainer = container.querySelector('.gap-2.flex-shrink-0');
      expect(actionsContainer).not.toBeInTheDocument();
    });
  });

  describe('Icon rendering', () => {
    it('renders icon when provided', () => {
      render(
        <PageHeader
          title="With Icon"
          icon={<FileText data-testid="page-icon" className="h-5 w-5 text-primary" />}
        />
      );

      expect(screen.getByTestId('page-icon')).toBeInTheDocument();
    });

    it('does not render icon when not provided', () => {
      render(<PageHeader title="No Icon" />);

      expect(screen.queryByTestId('page-icon')).not.toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('applies custom className to container', () => {
      const { container } = render(
        <PageHeader title="Custom Class" className="custom-class" />
      );

      // Find the root container
      const rootElement = container.firstChild;
      expect(rootElement).toHaveClass('custom-class');
    });

    it('preserves default classes when custom className added', () => {
      const { container } = render(
        <PageHeader title="Custom Class" className="custom-class" />
      );

      const rootElement = container.firstChild;
      expect(rootElement).toHaveClass('flex');
      expect(rootElement).toHaveClass('items-start');
      expect(rootElement).toHaveClass('justify-between');
      expect(rootElement).toHaveClass('mb-6');
    });
  });

  describe('Layout structure', () => {
    it('renders with flex justify-between layout', () => {
      const { container } = render(
        <PageHeader
          title="Layout Test"
          subtitle="With subtitle"
          actions={<button type="button">Action</button>}
        />
      );

      const rootElement = container.firstChild;
      expect(rootElement).toHaveClass('flex');
      expect(rootElement).toHaveClass('items-start');
      expect(rootElement).toHaveClass('justify-between');
    });

    it('has mb-6 bottom margin', () => {
      const { container } = render(<PageHeader title="Margin Test" />);

      const rootElement = container.firstChild;
      expect(rootElement).toHaveClass('mb-6');
    });
  });

  describe('Complete rendering', () => {
    it('renders all props together correctly', () => {
      render(
        <PageHeader
          title="Complete Test"
          subtitle="Full description"
          icon={<FileText data-testid="complete-icon" className="h-5 w-5" />}
          actions={
            <>
              <button type="button">Primary</button>
              <button type="button">Secondary</button>
            </>
          }
          className="extra-class"
        />
      );

      // Title
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveTextContent('Complete Test');
      expect(title).toHaveClass('text-2xl', 'font-semibold', 'text-slate-900');

      // Subtitle
      const subtitle = screen.getByText('Full description');
      expect(subtitle).toHaveClass('text-slate-500', 'text-sm', 'mt-1');

      // Icon
      expect(screen.getByTestId('complete-icon')).toBeInTheDocument();

      // Actions
      expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Secondary' })).toBeInTheDocument();
    });
  });
});
