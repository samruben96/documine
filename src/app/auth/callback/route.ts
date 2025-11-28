import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

/**
 * Auth callback route handler
 * Handles OAuth, email link, and invitation callbacks from Supabase
 *
 * For password reset:
 * - Supabase redirects here with ?code=xxx&type=recovery
 * - We exchange the code for a session server-side
 * - Then redirect to the password update page
 *
 * For invitations (AC-3.2.10):
 * - Supabase redirects here after invitee completes signup
 * - User metadata contains agency_id, role, invitation_id
 * - We create the user record and mark invitation as accepted
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/documents';

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[Auth Callback] Code exchange failed:', error.message);

      // For password recovery, redirect to reset page with error
      if (type === 'recovery') {
        return NextResponse.redirect(
          `${origin}/reset-password?error=expired`
        );
      }

      // For other flows, redirect to login with error
      return NextResponse.redirect(
        `${origin}/login?error=auth_callback_error`
      );
    }

    // For password recovery, redirect to update password page
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/reset-password/update`);
    }

    // Check if this is an invitation acceptance (AC-3.2.10)
    const user = sessionData?.user;
    if (user?.user_metadata?.invitation_id) {
      const { agency_id, role, invitation_id } = user.user_metadata as {
        agency_id?: string;
        role?: string;
        invitation_id?: string;
      };

      // Check if user record already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!existingUser && agency_id && user.email) {
        // Create user record with invitation's agency_id and role
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            agency_id: agency_id,
            email: user.email,
            full_name: (user.user_metadata?.full_name as string) || null,
            role: role || 'member',
          });

        if (userError) {
          console.error('[Auth Callback] Failed to create user for invitation:', userError.message);
        } else if (invitation_id) {
          // Mark invitation as accepted using service client (bypasses RLS)
          const serviceClient = createServiceClient();
          await serviceClient
            .from('invitations')
            .update({
              status: 'accepted',
              accepted_at: new Date().toISOString(),
            })
            .eq('id', invitation_id);
        }
      }
    }

    // For other flows (OAuth, magic link, invitation), redirect to next page
    return NextResponse.redirect(`${origin}${next}`);
  }

  // No code present - redirect to home
  console.error('[Auth Callback] No code in callback URL');
  return NextResponse.redirect(`${origin}/login?error=missing_code`);
}
