/**
 * Agency Admin Transfer Ownership API
 * Story 21.2: API Route Migration (moved from ai-buddy/admin/transfer-ownership)
 *
 * POST - Transfer agency ownership to another admin
 * GET - List eligible admins for ownership transfer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { AIB_ERROR_CODES, type AiBuddyErrorCode } from '@/lib/ai-buddy/errors';
import { logAuditEvent } from '@/lib/admin/audit-logger';
import {
  sendOwnershipTransferredToOldOwner,
  sendOwnershipTransferredToNewOwner,
} from '@/lib/email/resend';

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

interface TransferOwnershipRequest {
  newOwnerId: string;
  confirmPassword: string;
}

/**
 * GET /api/admin/transfer-ownership
 * Get list of eligible admins for ownership transfer
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user is owner (has transfer_ownership permission) from agency_permissions
    const { data: ownerPerm } = await supabase
      .from('agency_permissions')
      .select('permission')
      .eq('user_id', authUser.id)
      .eq('permission', 'transfer_ownership')
      .single();

    if (!ownerPerm) {
      return errorResponse('AIB_019');
    }

    // Get current user's agency
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, agency_id')
      .eq('id', authUser.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const serviceClient = createServiceClient();

    // Get all users in agency
    const { data: agencyUsers } = await serviceClient
      .from('users')
      .select('id, email, full_name')
      .eq('agency_id', currentUser.agency_id)
      .is('removed_at', null)
      .neq('id', authUser.id); // Exclude current owner

    if (!agencyUsers || agencyUsers.length === 0) {
      return NextResponse.json({ admins: [], message: 'No other users in agency' });
    }

    // Get permissions for all agency users from agency_permissions
    const userIds = agencyUsers.map((u) => u.id);
    const { data: permissions } = await serviceClient
      .from('agency_permissions')
      .select('user_id, permission')
      .in('user_id', userIds);

    // Group permissions by user
    const userPermissions = new Map<string, string[]>();
    permissions?.forEach((p) => {
      const existing = userPermissions.get(p.user_id) || [];
      existing.push(p.permission);
      userPermissions.set(p.user_id, existing);
    });

    // Filter to only admins (have manage_users permission but not transfer_ownership)
    const eligibleAdmins = agencyUsers.filter((user) => {
      const perms = userPermissions.get(user.id) || [];
      const isAdmin = perms.includes('manage_users');
      const isOwner = perms.includes('transfer_ownership');
      return isAdmin && !isOwner;
    });

    return NextResponse.json({
      admins: eligibleAdmins.map((admin) => ({
        id: admin.id,
        email: admin.email,
        name: admin.full_name,
      })),
      count: eligibleAdmins.length,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/transfer-ownership:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/transfer-ownership
 * Execute ownership transfer
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: TransferOwnershipRequest = await request.json();

    if (!body.newOwnerId || !body.confirmPassword) {
      return NextResponse.json(
        { error: 'newOwnerId and confirmPassword are required' },
        { status: 400 }
      );
    }

    // Get current user's agency
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, agency_id, email, full_name')
      .eq('id', authUser.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if current user is owner (has transfer_ownership permission) from agency_permissions
    const { data: ownerPerm } = await supabase
      .from('agency_permissions')
      .select('permission')
      .eq('user_id', authUser.id)
      .eq('permission', 'transfer_ownership')
      .single();

    if (!ownerPerm) {
      // Log failed attempt
      await logAuditEvent({
        agencyId: currentUser.agency_id,
        userId: authUser.id,
        action: 'ownership_transfer_failed',
        metadata: {
          reason: 'Not owner',
          targetUserId: body.newOwnerId,
        },
      });
      return errorResponse('AIB_019');
    }

    // Verify password by re-signing in
    // Using Supabase's signInWithPassword to verify the current password
    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email: authUser.email!,
      password: body.confirmPassword,
    });

    if (passwordError) {
      // Log failed attempt
      await logAuditEvent({
        agencyId: currentUser.agency_id,
        userId: authUser.id,
        action: 'ownership_transfer_failed',
        metadata: {
          reason: 'Invalid password',
          targetUserId: body.newOwnerId,
        },
      });
      return errorResponse('AIB_017');
    }

    const serviceClient = createServiceClient();

    // Verify target user exists and is in same agency
    const { data: targetUser, error: targetError } = await serviceClient
      .from('users')
      .select('id, email, full_name, agency_id')
      .eq('id', body.newOwnerId)
      .eq('agency_id', currentUser.agency_id)
      .is('removed_at', null)
      .single();

    if (targetError || !targetUser) {
      await logAuditEvent({
        agencyId: currentUser.agency_id,
        userId: authUser.id,
        action: 'ownership_transfer_failed',
        metadata: {
          reason: 'Target user not found in agency',
          targetUserId: body.newOwnerId,
        },
      });
      return errorResponse('AIB_014');
    }

    // Verify target is an admin (has manage_users permission) from agency_permissions
    const { data: targetPerm } = await serviceClient
      .from('agency_permissions')
      .select('permission')
      .eq('user_id', body.newOwnerId)
      .eq('permission', 'manage_users')
      .single();

    if (!targetPerm) {
      await logAuditEvent({
        agencyId: currentUser.agency_id,
        userId: authUser.id,
        action: 'ownership_transfer_failed',
        metadata: {
          reason: 'Target user is not an admin',
          targetUserId: body.newOwnerId,
          targetEmail: targetUser.email,
        },
      });
      return errorResponse('AIB_018');
    }

    // Execute atomic ownership transfer via RPC
    // Note: The RPC function is defined in migration 20251211000000_transfer_ownership_function.sql
    // Using type assertion since the function may not be in generated types yet
    const { data: transferResult, error: transferError } = await serviceClient.rpc(
      'transfer_ownership' as unknown as never,
      {
        p_current_owner_id: authUser.id,
        p_new_owner_id: body.newOwnerId,
        p_agency_id: currentUser.agency_id,
      } as unknown as never
    );

    if (transferError) {
      console.error('Transfer ownership error:', transferError);
      await logAuditEvent({
        agencyId: currentUser.agency_id,
        userId: authUser.id,
        action: 'ownership_transfer_failed',
        metadata: {
          reason: 'Database transaction failed',
          error: transferError.message,
          targetUserId: body.newOwnerId,
          targetEmail: targetUser.email,
        },
      });
      return NextResponse.json(
        { error: 'Failed to transfer ownership', details: transferError.message },
        { status: 500 }
      );
    }

    // Log successful transfer
    await logAuditEvent({
      agencyId: currentUser.agency_id,
      userId: authUser.id,
      action: 'ownership_transferred',
      metadata: {
        previousOwnerId: authUser.id,
        previousOwnerEmail: currentUser.email,
        newOwnerId: body.newOwnerId,
        newOwnerEmail: targetUser.email,
        transferredAt: new Date().toISOString(),
      },
    });

    // Get agency name for email
    const { data: agency } = await serviceClient
      .from('agencies')
      .select('name')
      .eq('id', currentUser.agency_id)
      .single();

    const agencyName = agency?.name || 'Your Agency';

    // Send email notifications
    // Non-blocking - don't fail if emails fail
    await Promise.allSettled([
      sendOwnershipTransferredToOldOwner(
        currentUser.email,
        targetUser.full_name || targetUser.email,
        agencyName
      ),
      sendOwnershipTransferredToNewOwner(
        targetUser.email,
        currentUser.full_name || currentUser.email,
        agencyName
      ),
    ]);

    // Return success response
    return NextResponse.json({
      transferred: true,
      previousOwner: {
        id: authUser.id,
        email: currentUser.email,
        name: currentUser.full_name,
      },
      newOwner: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.full_name,
      },
      transferredAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in POST /api/admin/transfer-ownership:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
