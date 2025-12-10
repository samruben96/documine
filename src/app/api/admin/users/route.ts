/**
 * Agency Admin User Management API
 * Story 21.2: API Route Migration (moved from ai-buddy/admin/users)
 *
 * GET - List users with pagination, sorting, search
 * POST - Invite new user
 * DELETE - Remove user access
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { AIB_ERROR_CODES, type AiBuddyErrorCode } from '@/lib/ai-buddy/errors';
import { logAuditEvent } from '@/lib/ai-buddy/audit-logger';
import type {
  AdminUser,
  AiBuddyInvitation,
  UserRole,
  Permission,
} from '@/types/ai-buddy';

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

type SortColumn = 'name' | 'email' | 'role' | 'lastActiveAt';
type SortDirection = 'asc' | 'desc';

interface UserListParams {
  page: number;
  pageSize: number;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  search: string;
}

interface UserListResponse {
  users: AdminUser[];
  invitations: AiBuddyInvitation[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

/**
 * GET /api/admin/users
 * List agency users with pagination, sorting, and search
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get current user's permissions
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, agency_id, role')
      .eq('id', authUser.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check manage_users permission from agency_permissions table
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params: UserListParams = {
      page: Math.max(1, parseInt(searchParams.get('page') || '1', 10)),
      pageSize: Math.min(
        100,
        Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10))
      ),
      sortColumn: (searchParams.get('sortColumn') || 'name') as SortColumn,
      sortDirection: (searchParams.get('sortDirection') || 'asc') as SortDirection,
      search: searchParams.get('search') || '',
    };

    // Validate sort column
    const validSortColumns: SortColumn[] = ['name', 'email', 'role', 'lastActiveAt'];
    if (!validSortColumns.includes(params.sortColumn)) {
      params.sortColumn = 'name';
    }

    // Use service client for cross-user queries
    const serviceClient = createServiceClient();

    // Build users query
    let usersQuery = serviceClient
      .from('users')
      .select(
        `
        id,
        email,
        full_name,
        role,
        last_active_at,
        removed_at,
        created_at
      `,
        { count: 'exact' }
      )
      .eq('agency_id', currentUser.agency_id)
      .is('removed_at', null);

    // Apply search filter
    if (params.search) {
      const searchPattern = `%${params.search}%`;
      usersQuery = usersQuery.or(
        `full_name.ilike.${searchPattern},email.ilike.${searchPattern}`
      );
    }

    // Apply sorting
    const dbSortColumn =
      params.sortColumn === 'name'
        ? 'full_name'
        : params.sortColumn === 'lastActiveAt'
          ? 'last_active_at'
          : params.sortColumn;

    usersQuery = usersQuery.order(dbSortColumn, {
      ascending: params.sortDirection === 'asc',
      nullsFirst: false,
    });

    // Apply pagination
    const offset = (params.page - 1) * params.pageSize;
    usersQuery = usersQuery.range(offset, offset + params.pageSize - 1);

    const { data: users, error: usersError, count } = await usersQuery;

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Fetch permissions for all users from agency_permissions
    const userIds = users?.map((u) => u.id) || [];
    const { data: allPermissions } = await serviceClient
      .from('agency_permissions')
      .select('user_id, permission')
      .in('user_id', userIds);

    // Create permission map
    const permissionMap = new Map<string, Permission[]>();
    allPermissions?.forEach((p) => {
      const perms = permissionMap.get(p.user_id) || [];
      perms.push(p.permission as Permission);
      permissionMap.set(p.user_id, perms);
    });

    // Check onboarding status for each user from agency_audit_logs
    const { data: onboardingStatuses } = await serviceClient
      .from('agency_audit_logs')
      .select('user_id')
      .in('user_id', userIds)
      .eq('action', 'onboarding_completed');

    const onboardedUserIds = new Set(
      onboardingStatuses?.map((s) => s.user_id) || []
    );

    // Map to AdminUser format
    const adminUsers: AdminUser[] = (users || []).map((user) => {
      const userPerms = permissionMap.get(user.id) || [];
      const isOwner =
        userPerms.includes('transfer_ownership') &&
        userPerms.includes('delete_agency');
      const hasAiBuddy = userPerms.includes('use_ai_buddy');
      const onboardingCompleted = onboardedUserIds.has(user.id);

      // Determine AI Buddy status
      let aiBuddyStatus: AdminUser['aiBuddyStatus'] = 'inactive';
      if (hasAiBuddy) {
        aiBuddyStatus = onboardingCompleted ? 'active' : 'onboarding_pending';
      }

      // Determine role based on permissions
      let role: UserRole = 'producer';
      if (isOwner) {
        role = 'owner';
      } else if (userPerms.includes('manage_users')) {
        role = 'admin';
      }

      return {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role,
        aiBuddyStatus,
        lastActiveAt: user.last_active_at,
        onboardingCompleted,
        isOwner,
      };
    });

    // Fetch pending invitations from invitations table
    const { data: invitations } = await serviceClient
      .from('invitations')
      .select('id, email, role, invited_by, created_at, expires_at')
      .eq('agency_id', currentUser.agency_id)
      .eq('status', 'pending')
      .is('accepted_at', null);

    const now = new Date();
    const pendingInvitations: AiBuddyInvitation[] = (invitations || []).map(
      (inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role as 'producer' | 'admin',
        invitedBy: inv.invited_by,
        invitedAt: inv.created_at,
        expiresAt: inv.expires_at,
        isExpired: new Date(inv.expires_at) < now,
      })
    );

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / params.pageSize);

    const response: UserListResponse = {
      users: adminUsers,
      invitations: pendingInvitations,
      totalCount,
      totalPages,
      currentPage: params.page,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface InviteUserRequest {
  email: string;
  role: 'producer' | 'admin';
}

/**
 * POST /api/admin/users
 * Invite a new user to the agency
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
    const body: InviteUserRequest = await request.json();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!body.email || !emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Valid email address required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!body.role || !['producer', 'admin'].includes(body.role)) {
      return NextResponse.json(
        { error: 'Role must be producer or admin' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();
    const normalizedEmail = body.email.toLowerCase().trim();

    // Check if email already exists in agency
    const { data: existingUser } = await serviceClient
      .from('users')
      .select('id')
      .eq('agency_id', currentUser.agency_id)
      .eq('email', normalizedEmail)
      .is('removed_at', null)
      .single();

    if (existingUser) {
      return errorResponse('AIB_009');
    }

    // Check for existing pending invitation in invitations table
    const { data: existingInvitation } = await serviceClient
      .from('invitations')
      .select('id')
      .eq('agency_id', currentUser.agency_id)
      .eq('email', normalizedEmail)
      .is('accepted_at', null)
      .is('cancelled_at', null)
      .single();

    if (existingInvitation) {
      return errorResponse('AIB_010');
    }

    // Create invitation (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: invitation, error: insertError } = await serviceClient
      .from('invitations')
      .insert({
        agency_id: currentUser.agency_id,
        email: normalizedEmail,
        role: body.role,
        invited_by: authUser.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating invitation:', insertError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent({
      agencyId: currentUser.agency_id,
      userId: authUser.id,
      action: 'user_invited',
      metadata: {
        invitedEmail: normalizedEmail,
        role: body.role,
        invitationId: invitation.id,
      },
    });

    return NextResponse.json(
      {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        invitedAt: invitation.created_at,
        expiresAt: invitation.expires_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users
 * Remove a user's access (soft delete)
 */
export async function DELETE(request: NextRequest) {
  try {
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

    // Get userId from query params
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required' },
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

    // Check if target user is owner (cannot remove owner) from agency_permissions
    const { data: targetPermissions } = await serviceClient
      .from('agency_permissions')
      .select('permission')
      .eq('user_id', userId);

    const targetPerms = targetPermissions?.map((p) => p.permission) || [];
    const isOwner =
      targetPerms.includes('transfer_ownership') &&
      targetPerms.includes('delete_agency');

    if (isOwner) {
      return errorResponse('AIB_011');
    }

    // Soft delete user by setting removed_at
    const { error: updateError } = await serviceClient
      .from('users')
      .update({ removed_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('Error removing user:', updateError);
      return NextResponse.json(
        { error: 'Failed to remove user' },
        { status: 500 }
      );
    }

    // Remove all permissions from agency_permissions
    await serviceClient
      .from('agency_permissions')
      .delete()
      .eq('user_id', userId);

    // Log audit event
    await logAuditEvent({
      agencyId: currentUser.agency_id,
      userId: authUser.id,
      action: 'user_removed',
      metadata: {
        removedUserId: userId,
        removedEmail: targetUser.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
