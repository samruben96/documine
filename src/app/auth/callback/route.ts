import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Auth callback route handler
 * Handles OAuth and email link callbacks from Supabase
 *
 * For password reset:
 * - Supabase redirects here with ?code=xxx&type=recovery
 * - We exchange the code for a session server-side
 * - Then redirect to the password update page
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/documents';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

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

    // For other flows (OAuth, magic link), redirect to next page
    return NextResponse.redirect(`${origin}${next}`);
  }

  // No code present - redirect to home
  console.error('[Auth Callback] No code in callback URL');
  return NextResponse.redirect(`${origin}/login?error=missing_code`);
}
