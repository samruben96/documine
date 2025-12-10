/**
 * Agency Admin Subscription API
 * Story 21.2: API Route Migration (moved from ai-buddy/admin/subscription)
 *
 * GET - Get agency subscription details
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { Permission } from '@/types/ai-buddy';

/**
 * Check if user has a specific permission
 */
async function hasPermission(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  permission: Permission
): Promise<boolean> {
  const { data } = await supabase
    .from('agency_permissions')
    .select('permission')
    .eq('user_id', userId)
    .eq('permission', permission)
    .single();

  return !!data;
}

/**
 * GET /api/admin/subscription
 * Returns subscription info for agency
 * Owner sees full details; non-owner admin sees owner contact only
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

    // Get user's agency
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, agency_id')
      .eq('id', authUser.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is at least an admin (has manage_users or view_audit_logs) from agency_permissions
    const { data: permissions } = await supabase
      .from('agency_permissions')
      .select('permission')
      .eq('user_id', authUser.id);

    const userPermissions = permissions?.map((p) => p.permission) || [];
    const isAdmin =
      userPermissions.includes('manage_users') ||
      userPermissions.includes('view_audit_logs');

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Check if user is owner (has transfer_ownership permission)
    const isOwner = await hasPermission(supabase, authUser.id, 'transfer_ownership');

    const serviceClient = createServiceClient();

    // Get agency details
    const { data: agency, error: agencyError } = await serviceClient
      .from('agencies')
      .select('id, name, subscription_tier, seat_limit')
      .eq('id', currentUser.agency_id)
      .single();

    if (agencyError || !agency) {
      return NextResponse.json(
        { error: 'Agency not found' },
        { status: 404 }
      );
    }

    // Count active users in agency
    const { count: activeUsers } = await serviceClient
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', currentUser.agency_id)
      .is('removed_at', null);

    // If owner, return full subscription details
    if (isOwner) {
      return NextResponse.json({
        isOwner: true,
        plan: agency.subscription_tier || 'Professional',
        billingCycle: 'monthly', // Default - could be stored in agencies table
        seatsUsed: activeUsers || 0,
        maxSeats: agency.seat_limit || 5,
        billingContact: {
          name: 'Archway Computer',
          email: 'billing@archwaycomputer.com',
          message:
            'For billing inquiries, plan changes, or payment questions, contact Archway Computer.',
        },
      });
    }

    // Non-owner admin: find owner and return their email
    const { data: ownerPermission } = await serviceClient
      .from('agency_permissions')
      .select('user_id')
      .eq('permission', 'transfer_ownership')
      .limit(1);

    let ownerEmail = 'Unknown';

    if (ownerPermission && ownerPermission.length > 0) {
      // Get users in this agency with owner permission
      const ownerUserIds = ownerPermission.map((p) => p.user_id);

      const { data: ownerUsers } = await serviceClient
        .from('users')
        .select('id, email')
        .eq('agency_id', currentUser.agency_id)
        .in('id', ownerUserIds)
        .limit(1);

      if (ownerUsers && ownerUsers.length > 0 && ownerUsers[0]?.email) {
        ownerEmail = ownerUsers[0].email;
      }
    }

    return NextResponse.json({
      isOwner: false,
      ownerEmail,
      message: `Contact agency owner (${ownerEmail}) for subscription information.`,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
