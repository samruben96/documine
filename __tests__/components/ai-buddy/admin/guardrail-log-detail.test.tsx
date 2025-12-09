/**
 * Unit Tests - GuardrailLogDetail Component
 * Story 19.2: Enforcement Logging
 *
 * Tests for log entry detail dialog
 *
 * AC-19.2.5: Click log entry to see full detail
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuardrailLogDetail } from '@/components/ai-buddy/admin/guardrail-log-detail';
import type { GuardrailEnforcementEvent } from '@/types/ai-buddy';

describe('GuardrailLogDetail', () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockEvent: GuardrailEnforcementEvent = {
    id: 'log-123',
    agencyId: 'agency-456',
    userId: 'user-789',
    userEmail: 'test@example.com',
    conversationId: 'conv-012',
    triggeredTopic: 'legal advice',
    messagePreview: 'Can you help me sue my neighbor for playing music?',
    redirectApplied: 'I cannot provide legal advice. Please consult with a licensed attorney for legal matters.',
    loggedAt: '2024-01-15T10:30:00Z',
  };

  it('renders nothing when event is null', () => {
    const { container } = render(
      <GuardrailLogDetail event={null} open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders dialog with event details when event is provided', () => {
    render(
      <GuardrailLogDetail event={mockEvent} open={true} onOpenChange={mockOnOpenChange} />
    );

    // Check dialog is rendered
    expect(screen.getByTestId('guardrail-log-detail-dialog')).toBeInTheDocument();

    // Check title
    expect(screen.getByText('Guardrail Event Details')).toBeInTheDocument();

    // Check user email is displayed
    expect(screen.getByText('test@example.com')).toBeInTheDocument();

    // Check triggered topic is displayed
    expect(screen.getByText('legal advice')).toBeInTheDocument();

    // Check message preview is displayed
    expect(screen.getByText(/Can you help me sue my neighbor/)).toBeInTheDocument();

    // Check redirect is displayed
    expect(screen.getByText(/I cannot provide legal advice/)).toBeInTheDocument();

    // Check conversation ID is displayed
    expect(screen.getByText('conv-012')).toBeInTheDocument();

    // Check user ID is displayed
    expect(screen.getByText('user-789')).toBeInTheDocument();
  });

  it('handles event without conversation ID', () => {
    const eventWithoutConv = {
      ...mockEvent,
      conversationId: null,
    };

    render(
      <GuardrailLogDetail event={eventWithoutConv} open={true} onOpenChange={mockOnOpenChange} />
    );

    // Should show "No conversation" for null conversation
    expect(screen.getByText('No conversation')).toBeInTheDocument();
  });

  it('calls onOpenChange when close button is clicked', () => {
    render(
      <GuardrailLogDetail event={mockEvent} open={true} onOpenChange={mockOnOpenChange} />
    );

    const closeButton = screen.getByTestId('close-detail-button');
    fireEvent.click(closeButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not render when open is false', () => {
    render(
      <GuardrailLogDetail event={mockEvent} open={false} onOpenChange={mockOnOpenChange} />
    );

    // Dialog should not be visible when open=false
    expect(screen.queryByTestId('guardrail-log-detail-dialog')).not.toBeInTheDocument();
  });

  it('displays all required labels', () => {
    render(
      <GuardrailLogDetail event={mockEvent} open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Triggered Topic')).toBeInTheDocument();
    expect(screen.getByText('Message Preview')).toBeInTheDocument();
    expect(screen.getByText('Redirect Guidance Applied')).toBeInTheDocument();
    expect(screen.getByText('Timestamp')).toBeInTheDocument();
    expect(screen.getByText('Conversation ID')).toBeInTheDocument();
    expect(screen.getByText('User ID')).toBeInTheDocument();
  });

  it('handles event without message preview', () => {
    const eventWithoutMessage = {
      ...mockEvent,
      messagePreview: '',
    };

    render(
      <GuardrailLogDetail event={eventWithoutMessage} open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText('No preview available')).toBeInTheDocument();
  });

  it('handles event without redirect applied', () => {
    const eventWithoutRedirect = {
      ...mockEvent,
      redirectApplied: '',
    };

    render(
      <GuardrailLogDetail event={eventWithoutRedirect} open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText('No redirect guidance recorded')).toBeInTheDocument();
  });
});
