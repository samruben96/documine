import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileTab } from '@/components/settings/profile-tab';
import { AgencyTab } from '@/components/settings/agency-tab';
import { ComingSoonTab } from '@/components/settings/coming-soon-tab';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Settings Page
 * Per AC-2.6.4: Settings page layout with tabs for Profile, Agency, Billing
 * Per AC-3.1.1: Agency tab displays name, tier, seats, created date
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
  if (userData.agency_id) {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', userData.agency_id);
    currentSeats = count || 0;
  }

  return (
    <div className="max-w-4xl">
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
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab user={userData} />
        </TabsContent>

        <TabsContent value="agency">
          <AgencyTab user={userData} currentSeats={currentSeats} />
        </TabsContent>

        <TabsContent value="billing">
          <ComingSoonTab
            title="Billing"
            description="Manage your subscription and payment methods"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
