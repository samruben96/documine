/**
 * Admin Authentication Helpers
 *
 * Provides reusable authentication and authorization checks for admin API routes.
 * Follows established patterns from settings/actions.ts.
 *
 * @module @/lib/auth/admin
 */

import { createClient } from '@/lib/supabase/server';

export interface AdminAuthResult {
  success: true;
  userId: string;
  agencyId: string;
  role: 'admin';
}

export interface AdminAuthError {
  success: false;
  error: string;
  status: 401 | 403;
}

export type AdminAuthResponse = AdminAuthResult | AdminAuthError;

/**
 * Verify that the current request is from an authenticated admin user.
 *
 * Checks:
 * 1. User is authenticated (has valid session)
 * 2. User exists in users table
 * 3. User has 'admin' role
 * 4. (Optional) User has specific permission
 *
 * @param requiredPermission - Optional specific permission to check
 * @returns AdminAuthResult on success, AdminAuthError on failure
 *
 * @example
 * ```typescript
 * // Basic admin check
 * export async function GET(): Promise<NextResponse> {
 *   const auth = await requireAdminAuth();
 *   if (!auth.success) {
 *     return NextResponse.json({ error: auth.error }, { status: auth.status });
 *   }
 *   // auth.userId, auth.agencyId, auth.role are available
 *   // ... admin operation
 * }
 *
 * // With specific permission check
 * export async function GET(): Promise<NextResponse> {
 *   const auth = await requireAdminAuth('view_audit_logs');
 *   if (!auth.success) {
 *     return NextResponse.json({ error: auth.error }, { status: auth.status });
 *   }
 *   // User is admin AND has view_audit_logs permission
 * }
 * ```
 */
export async function requireAdminAuth(
  requiredPermission?: 'use_ai_buddy' | 'manage_own_projects' | 'manage_users' | 'configure_guardrails' | 'view_audit_logs'
): Promise<AdminAuthResponse> {
  const supabase = await createClient();

  // Step 1: Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: 'Not authenticated',
      status: 401,
    };
  }

  // Step 2: Get user record with role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, agency_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    return {
      success: false,
      error: 'User not found',
      status: 401,
    };
  }

  // Step 3: Check admin role
  if (userData.role !== 'admin') {
    return {
      success: false,
      error: 'Admin access required',
      status: 403,
    };
  }

  // Step 4: Check specific permission if required
  if (requiredPermission) {
    const { data: permission, error: permissionError } = await supabase
      .from('ai_buddy_permissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('permission', requiredPermission)
      .maybeSingle();

    if (permissionError) {
      console.error('Failed to check permission:', permissionError);
      return {
        success: false,
        error: 'Failed to verify permissions',
        status: 403,
      };
    }

    if (!permission) {
      return {
        success: false,
        error: `Permission '${requiredPermission}' required`,
        status: 403,
      };
    }
  }

  return {
    success: true,
    userId: user.id,
    agencyId: userData.agency_id,
    role: 'admin',
  };
}
