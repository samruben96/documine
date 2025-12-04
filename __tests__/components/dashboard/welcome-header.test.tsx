/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WelcomeHeader } from '@/components/dashboard/welcome-header';

describe('WelcomeHeader', () => {
  // Mock Date to control time-based greetings
  const originalDate = global.Date;

  afterEach(() => {
    global.Date = originalDate;
  });

  const mockDateWithHour = (hour: number) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 11, 3, hour, 0, 0));
  };

  it('renders agency name', () => {
    render(<WelcomeHeader agencyName="Test Agency" />);

    expect(screen.getByText('Test Agency')).toBeInTheDocument();
  });

  it('renders welcome message with agency name', () => {
    render(<WelcomeHeader agencyName="Acme Insurance" />);

    const welcomeText = screen.getByRole('heading', { level: 1 });
    expect(welcomeText).toHaveTextContent('Welcome to');
    expect(welcomeText).toHaveTextContent('Acme Insurance');
    expect(welcomeText).toHaveTextContent('space');
  });

  it('renders helper text', () => {
    render(<WelcomeHeader agencyName="Test Agency" />);

    expect(
      screen.getByText('Choose a tool below to get started with your insurance documents')
    ).toBeInTheDocument();
  });

  it('renders user greeting when userName is provided', () => {
    mockDateWithHour(10);

    render(<WelcomeHeader agencyName="Test Agency" userName="John" />);

    expect(screen.getByText(/Good morning, John/)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('does not render user greeting when userName is not provided', () => {
    render(<WelcomeHeader agencyName="Test Agency" />);

    expect(screen.queryByText(/Good morning/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Good afternoon/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Good evening/)).not.toBeInTheDocument();
  });

  it('shows morning greeting before noon', () => {
    mockDateWithHour(9);

    render(<WelcomeHeader agencyName="Test Agency" userName="Jane" />);

    expect(screen.getByText(/Good morning, Jane/)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('shows afternoon greeting between noon and 5pm', () => {
    mockDateWithHour(14);

    render(<WelcomeHeader agencyName="Test Agency" userName="Jane" />);

    expect(screen.getByText(/Good afternoon, Jane/)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('shows evening greeting after 5pm', () => {
    mockDateWithHour(18);

    render(<WelcomeHeader agencyName="Test Agency" userName="Jane" />);

    expect(screen.getByText(/Good evening, Jane/)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('has data-testid attribute', () => {
    render(<WelcomeHeader agencyName="Test Agency" />);

    expect(screen.getByTestId('welcome-header')).toBeInTheDocument();
  });
});
