/**
 * Agency Admin User Management - Individual User Operations
 * Story 21.2: API Route Migration (moved from ai-buddy/admin/users/[userId])
 *
 * PATCH - Change user role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { AIB_ERROR_CODES, type AiBuddyErrorCode } from '@/lib/ai-buddy/errors';
import { logAuditEvent } from '@/lib/ai-buddy/audit-logger';
import type { Permission, UserRole } from '@/types/ai-buddy';

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

// Define default permissions inline to avoid runtime import issues
const rolePermissions: Record<UserRole, Permission[]> = {
  producer: ['use_ai_buddy', 'manage_own_projects'],
  admin: [
    'use_ai_buddy',
    'manage_own_projects',
    'manage_users',
    'configure_guardrails',
    'view_audit_logs',
    'view_usage_analytics',
  ],
  owner: [
    'use_ai_buddy',
    'manage_own_projects',
    'manage_users',
    'configure_guardrails',
    'view_audit_logs',
    'view_usage_analytics',
    'manage_billing',
    'transfer_ownership',
    'delete_agency',
  ],
};

interface ChangeRoleRequest {
  role: 'producer' | 'admin';
}

/**
 * PATCH /api/admin/users/[userId]
 * Change a user's role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
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

    // Parse request body
    const body: ChangeRoleRequest = await request.json();

    // Validate role
    if (!body.role || !['producer', 'admin'].includes(body.role)) {
      return NextResponse.json(
        { error: 'Role must be producer or admin' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Verify target user exists and is in the same agency
    const { data: targetUser, error: targetError } = await serviceClient
      .from('users')
      .select('id, email, agency_id')
      .eq('id', userId)
      .eq('agency_id', currentUser.agency_id)
      .is('removed_at', null)
      .single();

    if (targetError || !targetUser) {
      return errorResponse('AIB_014');
    }

    // Get target user's current permissions from agency_permissions
    const { data: targetPermissions } = await serviceClient
      .from('agency_permissions')
      .select('permission')
      .eq('user_id', userId);

    const currentPerms = targetPermissions?.map((p) => p.permission) || [];
    const isOwner =
      currentPerms.includes('transfer_ownership') &&
      currentPerms.includes('delete_agency');

    // Cannot change owner's role
    if (isOwner) {
      return errorResponse('AIB_013');
    }

    // Determine current role
    const currentRole: UserRole = currentPerms.includes('manage_users')
      ? 'admin'
      : 'producer';

    // If demoting admin, check if this is the last admin
    if (currentRole === 'admin' && body.role === 'producer') {
      // Count admins in the agency (excluding owner)
      const { data: agencyUsers } = await serviceClient
        .from('users')
        .select('id')
        .eq('agency_id', currentUser.agency_id)
        .is('removed_at', null);

      const userIds = agencyUsers?.map((u) => u.id) || [];

      const { data: allPerms } = await serviceClient
        .from('agency_permissions')
        .select('user_id, permission')
        .in('user_id', userIds)
        .eq('permission', 'manage_users');

      // Check which of these users are NOT owners
      const { data: ownerPerms } = await serviceClient
        .from('agency_permissions')
        .select('user_id')
        .in('user_id', userIds)
        .eq('permission', 'transfer_ownership');

      const ownerIds = new Set(ownerPerms?.map((p) => p.user_id) || []);
      const adminCount =
        allPerms?.filter((p) => !ownerIds.has(p.user_id)).length || 0;

      if (adminCount <= 1) {
        return errorResponse('AIB_012');
      }
    }

    // Delete all existing permissions from agency_permissions
    await serviceClient
      .from('agency_permissions')
      .delete()
      .eq('user_id', userId);

    // Insert new permissions based on role
    const newPermissions = rolePermissions[body.role];
    const permissionInserts = newPermissions.map((permission) => ({
      user_id: userId,
      permission,
      granted_by: authUser.id,
    }));

    const { error: insertError } = await serviceClient
      .from('agency_permissions')
      .insert(permissionInserts);

    if (insertError) {
      console.error('Error updating permissions:', insertError);
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent({
      agencyId: currentUser.agency_id,
      userId: authUser.id,
      action: 'permission_granted',
      metadata: {
        targetUserId: userId,
        targetEmail: targetUser.email,
        previousRole: currentRole,
        newRole: body.role,
      },
    });

    return NextResponse.json({
      id: userId,
      role: body.role,
      previousRole: currentRole,
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/users/[userId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
