import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist the mock to ensure it's set up before any imports
const mockSend = vi.hoisted(() => vi.fn());

vi.mock('resend', () => {
  return {
    Resend: class MockResend {
      emails = {
        send: mockSend,
      };
    },
  };
});

// Import after mocking
import { sendPasswordResetEmail } from '@/lib/email/resend';

describe('sendPasswordResetEmail', () => {
  beforeEach(() => {
    mockSend.mockClear();
  });

  it('sends email with correct subject per AC-2.5.2', async () => {
    mockSend.mockResolvedValue({ id: 'test-id' });

    await sendPasswordResetEmail('test@example.com', 'https://app.com/reset?token=abc');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Reset your docuMINE password',
      })
    );
  });

  it('sends email to correct recipient', async () => {
    mockSend.mockResolvedValue({ id: 'test-id' });

    await sendPasswordResetEmail('user@agency.com', 'https://app.com/reset');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@agency.com',
      })
    );
  });

  it('sends email from docuMINE branded address', async () => {
    mockSend.mockResolvedValue({ id: 'test-id' });

    await sendPasswordResetEmail('test@example.com', 'https://app.com/reset');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'docuMINE <noreply@documine.com>',
      })
    );
  });

  it('includes reset link in email body', async () => {
    mockSend.mockResolvedValue({ id: 'test-id' });
    const resetLink = 'https://app.com/reset?token=secret123';

    await sendPasswordResetEmail('test@example.com', resetLink);

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining(resetLink),
      })
    );
  });

  it('returns success on successful send', async () => {
    mockSend.mockResolvedValue({ id: 'test-id' });

    const result = await sendPasswordResetEmail('test@example.com', 'https://app.com/reset');

    expect(result).toEqual({ success: true });
  });

  it('returns error on failed send', async () => {
    mockSend.mockRejectedValue(new Error('API error'));

    const result = await sendPasswordResetEmail('test@example.com', 'https://app.com/reset');

    expect(result).toEqual({ success: false, error: 'Failed to send email' });
  });

  it('includes docuMINE branding in HTML template', async () => {
    mockSend.mockResolvedValue({ id: 'test-id' });

    await sendPasswordResetEmail('test@example.com', 'https://app.com/reset');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('docuMINE'),
      })
    );
  });

  it('includes password reset instructions in HTML template', async () => {
    mockSend.mockResolvedValue({ id: 'test-id' });

    await sendPasswordResetEmail('test@example.com', 'https://app.com/reset');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('Reset Your Password'),
      })
    );
  });
});
