import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileTab } from '@/components/settings/profile-tab';
import { AgencyTab } from '@/components/settings/agency-tab';
import { TeamTab } from '@/components/settings/team-tab';
import { TeamTabSkeleton } from '@/components/settings/team-tab-skeleton';
import { BillingTab } from '@/components/settings/billing-tab';
import { UsageTab } from '@/components/settings/usage-tab';
import { BrandingTab } from '@/components/settings/branding-tab';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { type PlanTier } from '@/lib/constants/plans';
import { getUsageMetrics } from './actions';

/**
 * Settings Page
 * Per AC-2.6.4: Settings page layout with tabs for Profile, Agency, Team, Billing
 * Per AC-3.1.1: Agency tab displays name, tier, seats, created date
 * Per AC-3.2.7: Team tab displays members and pending invitations
 * Per AC-3.5.5, AC-3.5.6: Usage tab (admin only) displays usage metrics on page load
 */
export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user with agency data including subscription info (per AC-2.6.1, AC-3.1.1)
  const { data: userData, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      full_name,
      role,
      agency_id,
      agency:agencies (
        id,
        name,
        subscription_tier,
        seat_limit,
        created_at
      )
    `)
    .eq('id', user.id)
    .single();

  if (error || !userData) {
    redirect('/login');
  }

  // Get current seat count for agency (per AC-3.1.1)
  let currentSeats = 0;
  let teamMembers: Array<{
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    created_at: string;
  }> = [];
  let invitations: Array<{
    id: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
    expires_at: string;
  }> = [];

  if (userData.agency_id) {
    // Get seat count
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', userData.agency_id);
    currentSeats = count || 0;

    // Get team members (per AC-3.2.7)
    const { data: members } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at')
      .eq('agency_id', userData.agency_id)
      .order('created_at', { ascending: true });
    teamMembers = members || [];

    // Get pending invitations (per AC-3.2.7) - admin only
    if (userData.role === 'admin') {
      const { data: invites } = await supabase
        .from('invitations')
        .select('id, email, role, status, created_at, expires_at')
        .eq('agency_id', userData.agency_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      invitations = invites || [];
    }
  }

  // Check if user is admin for Usage tab visibility (AC-3.5.6)
  const isAdmin = userData.role === 'admin';

  // Fetch usage metrics for admins only (AC-3.5.5, AC-3.5.6)
  const usageMetrics = isAdmin ? await getUsageMetrics() : null;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="agency">Agency</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          {isAdmin && <TabsTrigger value="branding">Branding</TabsTrigger>}
          {isAdmin && <TabsTrigger value="usage">Usage</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab user={userData} />
        </TabsContent>

        <TabsContent value="agency">
          <AgencyTab user={userData} currentSeats={currentSeats} />
        </TabsContent>

        {/* AC-3.6.5: Suspense with skeleton loading for Team tab */}
        <TabsContent value="team">
          <Suspense fallback={<TeamTabSkeleton />}>
            <TeamTab
              user={userData}
              members={teamMembers}
              invitations={invitations}
              agencyName={userData.agency?.name || 'Unknown Agency'}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="billing">
          <BillingTab
            tier={(userData.agency?.subscription_tier as PlanTier) || 'starter'}
            seatLimit={userData.agency?.seat_limit ?? 3}
            currentSeats={currentSeats}
            isAdmin={isAdmin}
          />
        </TabsContent>

        {/* AC-9.1.1: Branding settings tab (admin only) */}
        {/* AC-9.1.5: Non-admin users cannot access branding settings */}
        {isAdmin && userData.agency_id && (
          <TabsContent value="branding">
            <BrandingTab agencyId={userData.agency_id} />
          </TabsContent>
        )}

        {isAdmin && usageMetrics && (
          <TabsContent value="usage">
            <UsageTab metrics={usageMetrics} />
          </TabsContent>
        )}
      </Tabs>
      </div>
    </div>
  );
}
