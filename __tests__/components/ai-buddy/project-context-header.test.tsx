/**
 * @vitest-environment happy-dom
 */
/**
 * Project Context Header Tests
 * Story 16.2: Project Context Switching
 *
 * AC-16.2.1: Header shows "AI Buddy · [Project Name]" when project selected
 * AC-16.2.2: Header shows "AI Buddy" when no project selected (general chat mode)
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProjectContextHeader } from '@/components/ai-buddy/project-context-header';

describe('ProjectContextHeader', () => {
  describe('AC-16.2.2: General chat mode (no project)', () => {
    it('renders "AI Buddy" when projectName is null', () => {
      render(<ProjectContextHeader projectName={null} />);

      expect(screen.getByTestId('project-context-header')).toBeInTheDocument();
      expect(screen.getByTestId('header-title')).toHaveTextContent('AI Buddy');
      expect(screen.queryByTestId('header-project-name')).not.toBeInTheDocument();
      expect(screen.queryByTestId('header-divider')).not.toBeInTheDocument();
    });

    it('renders "AI Buddy" when projectName is undefined', () => {
      render(<ProjectContextHeader />);

      expect(screen.getByTestId('header-title')).toHaveTextContent('AI Buddy');
      expect(screen.queryByTestId('header-project-name')).not.toBeInTheDocument();
    });

    it('renders "AI Buddy" when projectName is empty string', () => {
      render(<ProjectContextHeader projectName="" />);

      expect(screen.getByTestId('header-title')).toHaveTextContent('AI Buddy');
      expect(screen.queryByTestId('header-project-name')).not.toBeInTheDocument();
    });
  });

  describe('AC-16.2.1: Project-scoped mode', () => {
    it('renders "AI Buddy · [Project Name]" when project selected', () => {
      render(<ProjectContextHeader projectName="Johnson Family" />);

      expect(screen.getByTestId('header-title')).toHaveTextContent('AI Buddy');
      expect(screen.getByTestId('header-divider')).toHaveTextContent('·');
      expect(screen.getByTestId('header-project-name')).toHaveTextContent('Johnson Family');
    });

    it('renders project name correctly for short names', () => {
      render(<ProjectContextHeader projectName="Smith Co" />);

      expect(screen.getByTestId('header-project-name')).toHaveTextContent('Smith Co');
    });

    it('renders project name at exactly 30 chars without truncation', () => {
      const exactName = 'A'.repeat(30);
      render(<ProjectContextHeader projectName={exactName} />);

      expect(screen.getByTestId('header-project-name')).toHaveTextContent(exactName);
      // Should not have title attribute (no tooltip needed)
      expect(screen.getByTestId('header-project-name')).not.toHaveAttribute('title');
    });
  });

  describe('Project name truncation', () => {
    it('truncates names longer than 30 characters with ellipsis', () => {
      const longName = 'This is a very long project name that exceeds thirty characters';
      render(<ProjectContextHeader projectName={longName} />);

      const projectName = screen.getByTestId('header-project-name');
      expect(projectName).toHaveTextContent('This is a very long project na...');
      // Should have title attribute with full name for tooltip
      expect(projectName).toHaveAttribute('title', longName);
    });

    it('truncates 35-char name to 30 chars + ellipsis', () => {
      const name35 = 'A'.repeat(35);
      render(<ProjectContextHeader projectName={name35} />);

      const projectName = screen.getByTestId('header-project-name');
      expect(projectName.textContent).toBe('A'.repeat(30) + '...');
      expect(projectName).toHaveAttribute('title', name35);
    });
  });

  describe('Loading state', () => {
    it('renders skeleton when isLoading is true', () => {
      render(<ProjectContextHeader isLoading />);

      expect(screen.getByTestId('project-context-header')).toBeInTheDocument();
      expect(screen.getByTestId('project-name-skeleton')).toBeInTheDocument();
      expect(screen.queryByTestId('header-project-name')).not.toBeInTheDocument();
    });

    it('renders skeleton with "AI Buddy" text visible during loading', () => {
      render(<ProjectContextHeader isLoading />);

      expect(screen.getByText('AI Buddy')).toBeInTheDocument();
      expect(screen.getByTestId('project-name-skeleton')).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('applies custom className to container', () => {
      render(<ProjectContextHeader className="custom-class" />);

      expect(screen.getByTestId('project-context-header')).toHaveClass('custom-class');
    });
  });

  describe('MessageSquare icon', () => {
    it('renders the MessageSquare icon', () => {
      const { container } = render(<ProjectContextHeader />);

      // Lucide icons render as SVG
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('h-4', 'w-4');
    });
  });
});
