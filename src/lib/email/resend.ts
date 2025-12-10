import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a password reset email via Resend
 * Per AC-2.5.2:
 * - Subject: "Reset your docuMINE password"
 * - Contains secure reset link with Supabase recovery token
 * - Professional template with docuMINE branding
 * - Link valid for 1 hour (handled by Supabase)
 */
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: 'docuMINE <noreply@documine.com>',
      to: email,
      subject: 'Reset your docuMINE password',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 480px; width: 100%; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; background-color: #1e293b; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #ffffff;">
                docuMINE
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px; background-color: #ffffff; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1e293b;">
                Reset Your Password
              </h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #475569;">
                We received a request to reset your password. Click the button below to create a new password. This link will expire in 1 hour.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}"
                       style="display: inline-block; padding: 14px 32px; background-color: #475569; color: #ffffff; font-size: 16px; font-weight: 500; text-decoration: none; border-radius: 6px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 14px; line-height: 22px; color: #64748b;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                This email was sent by docuMINE. If you have questions, please contact support.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Sends email to old owner after ownership transfer
 * AC-20.5.8: Both old and new owner receive email notifications
 */
export async function sendOwnershipTransferredToOldOwner(
  email: string,
  newOwnerName: string,
  agencyName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: 'docuMINE <noreply@documine.com>',
      to: email,
      subject: `Ownership transferred - ${agencyName}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ownership Transferred</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 480px; width: 100%; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; background-color: #1e293b; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #ffffff;">
                docuMINE
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px; background-color: #ffffff; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1e293b;">
                Ownership Transferred
              </h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #475569;">
                You have successfully transferred ownership of <strong>${agencyName}</strong> to <strong>${newOwnerName}</strong>.
              </p>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #475569;">
                You have been assigned the admin role and retain full access to AI Buddy features except:
              </p>
              <ul style="margin: 0 0 24px; padding-left: 24px; font-size: 16px; line-height: 24px; color: #475569;">
                <li>Transferring ownership</li>
                <li>Managing billing</li>
                <li>Deleting the agency</li>
              </ul>
              <p style="margin: 0; font-size: 14px; line-height: 22px; color: #64748b;">
                If you did not authorize this transfer, please contact our support team immediately.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                This email was sent by docuMINE. If you have questions, please contact support.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send ownership transfer email to old owner:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Sends email to new owner after ownership transfer
 * AC-20.5.8: Both old and new owner receive email notifications
 */
export async function sendOwnershipTransferredToNewOwner(
  email: string,
  oldOwnerName: string,
  agencyName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: 'docuMINE <noreply@documine.com>',
      to: email,
      subject: `You are now the owner of ${agencyName}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You Are Now The Owner</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 480px; width: 100%; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; background-color: #1e293b; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #ffffff;">
                docuMINE
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px; background-color: #ffffff; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 48px;">&#128081;</span>
              </div>
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1e293b; text-align: center;">
                You Are Now The Owner
              </h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #475569;">
                <strong>${oldOwnerName}</strong> has transferred ownership of <strong>${agencyName}</strong> to you.
              </p>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #475569;">
                As the owner, you now have full control including:
              </p>
              <ul style="margin: 0 0 24px; padding-left: 24px; font-size: 16px; line-height: 24px; color: #475569;">
                <li>Managing team members and roles</li>
                <li>Configuring AI Buddy guardrails</li>
                <li>Viewing audit logs and analytics</li>
                <li>Managing billing (contact Archway Computer)</li>
                <li>Transferring ownership to another admin</li>
              </ul>
              <p style="margin: 0; font-size: 14px; line-height: 22px; color: #64748b;">
                With great power comes great responsibility. Please manage your agency responsibly.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                This email was sent by docuMINE. If you have questions, please contact support.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send ownership transfer email to new owner:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
