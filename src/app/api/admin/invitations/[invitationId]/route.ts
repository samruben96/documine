/**
 * Agency Admin Invitation Management
 * Story 21.2: API Route Migration (moved from ai-buddy/admin/invitations/[invitationId])
 *
 * DELETE - Cancel invitation
 * POST - Resend invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { AIB_ERROR_CODES, type AiBuddyErrorCode } from '@/lib/ai-buddy/errors';
import { logAuditEvent } from '@/lib/ai-buddy/audit-logger';

/**
 * Helper to create error response with proper status
 */
function errorResponse(code: AiBuddyErrorCode, customMessage?: string) {
  const { status, message } = AIB_ERROR_CODES[code];
  return NextResponse.json(
    { error: customMessage || message, code },
    { status }
  );
}

/**
 * DELETE /api/admin/invitations/[invitationId]
 * Cancel a pending invitation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const { invitationId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current user's permissions and agency
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, agency_id')
      .eq('id', authUser.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check manage_users permission from agency_permissions
    const { data: permissions } = await supabase
      .from('agency_permissions')
      .select('permission')
      .eq('user_id', authUser.id);

    const hasManageUsers = permissions?.some(
      (p) => p.permission === 'manage_users'
    );

    if (!hasManageUsers) {
      return NextResponse.json(
        { error: 'Forbidden: manage_users permission required' },
        { status: 403 }
      );
    }

    const serviceClient = createServiceClient();

    // Verify invitation exists and belongs to agency (from invitations table)
    const { data: invitation, error: invError } = await serviceClient
      .from('invitations')
      .select('id, email, agency_id, status, accepted_at')
      .eq('id', invitationId)
      .eq('agency_id', currentUser.agency_id)
      .single();

    if (invError || !invitation) {
      return errorResponse('AIB_015');
    }

    // Cannot cancel already accepted or cancelled invitation
    if (invitation.accepted_at || invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invitation has already been processed' },
        { status: 400 }
      );
    }

    // Mark invitation as cancelled using status column
    const { error: updateError } = await serviceClient
      .from('invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId);

    if (updateError) {
      console.error('Error cancelling invitation:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel invitation' },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent({
      agencyId: currentUser.agency_id,
      userId: authUser.id,
      action: 'user_removed',
      metadata: {
        type: 'invitation_cancelled',
        invitationId,
        email: invitation.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/invitations/[invitationId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/invitations/[invitationId]/resend
 * Resend an invitation (extends expiration)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const { invitationId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current user's permissions and agency
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, agency_id')
      .eq('id', authUser.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check manage_users permission from agency_permissions
    const { data: permissions } = await supabase
      .from('agency_permissions')
      .select('permission')
      .eq('user_id', authUser.id);

    const hasManageUsers = permissions?.some(
      (p) => p.permission === 'manage_users'
    );

    if (!hasManageUsers) {
      return NextResponse.json(
        { error: 'Forbidden: manage_users permission required' },
        { status: 403 }
      );
    }

    const serviceClient = createServiceClient();

    // Verify invitation exists and belongs to agency (from invitations table)
    const { data: invitation, error: invError } = await serviceClient
      .from('invitations')
      .select('id, email, role, agency_id, status, accepted_at')
      .eq('id', invitationId)
      .eq('agency_id', currentUser.agency_id)
      .single();

    if (invError || !invitation) {
      return errorResponse('AIB_015');
    }

    // Cannot resend already accepted or cancelled invitation
    if (invitation.accepted_at || invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invitation has already been processed' },
        { status: 400 }
      );
    }

    // Extend expiration by 7 days from now
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    // Reset status to pending and extend expiration
    const { error: updateError } = await serviceClient
      .from('invitations')
      .update({
        expires_at: newExpiresAt.toISOString(),
        status: 'pending',
      })
      .eq('id', invitationId);

    if (updateError) {
      console.error('Error resending invitation:', updateError);
      return NextResponse.json(
        { error: 'Failed to resend invitation' },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent({
      agencyId: currentUser.agency_id,
      userId: authUser.id,
      action: 'user_invited',
      metadata: {
        type: 'invitation_resent',
        invitationId,
        email: invitation.email,
        newExpiresAt: newExpiresAt.toISOString(),
      },
    });

    return NextResponse.json({
      id: invitationId,
      email: invitation.email,
      role: invitation.role,
      expiresAt: newExpiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Error in POST /api/admin/invitations/[invitationId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
