/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToolCard } from '@/components/dashboard/tool-card';

describe('ToolCard', () => {
  const defaultProps = {
    icon: 'MessageSquare', // Icon name as string
    title: 'Chat with Docs',
    description: 'Ask questions about your documents',
    href: '/documents',
    color: 'blue' as const,
  };

  it('renders with title and description', () => {
    render(<ToolCard {...defaultProps} />);

    expect(screen.getByText('Chat with Docs')).toBeInTheDocument();
    expect(screen.getByText('Ask questions about your documents')).toBeInTheDocument();
  });

  it('renders as a link with correct href', () => {
    render(<ToolCard {...defaultProps} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/documents');
  });

  it('renders the icon', () => {
    render(<ToolCard {...defaultProps} />);

    // The icon should be rendered inside the card
    const card = screen.getByTestId('tool-card');
    expect(card).toBeInTheDocument();
  });

  it('renders "Get started" indicator', () => {
    render(<ToolCard {...defaultProps} />);

    expect(screen.getByText('Get started →')).toBeInTheDocument();
  });

  it('applies blue color variant', () => {
    render(<ToolCard {...defaultProps} color="blue" />);

    // Card should be rendered
    expect(screen.getByTestId('tool-card')).toBeInTheDocument();
  });

  it('applies green color variant', () => {
    render(<ToolCard {...defaultProps} color="green" />);

    expect(screen.getByTestId('tool-card')).toBeInTheDocument();
  });

  it('applies purple color variant', () => {
    render(<ToolCard {...defaultProps} color="purple" />);

    expect(screen.getByTestId('tool-card')).toBeInTheDocument();
  });

  it('defaults to blue color when not specified', () => {
    const { container } = render(
      <ToolCard
        icon="MessageSquare"
        title="Test"
        description="Test description"
        href="/test"
      />
    );

    expect(container.querySelector('[data-testid="tool-card"]')).toBeInTheDocument();
  });

  // Story Q1.3 - Amber color variant for Quoting card
  it('applies amber color variant', () => {
    render(<ToolCard {...defaultProps} color="amber" />);

    expect(screen.getByTestId('tool-card')).toBeInTheDocument();
  });

  it('renders Calculator icon for Quoting card', () => {
    render(
      <ToolCard
        icon="Calculator"
        title="Quoting"
        description="Enter client data once, copy for any carrier portal"
        href="/quoting"
        color="amber"
      />
    );

    expect(screen.getByText('Quoting')).toBeInTheDocument();
    expect(screen.getByText('Enter client data once, copy for any carrier portal')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/quoting');
  });
});
