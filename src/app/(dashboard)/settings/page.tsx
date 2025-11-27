import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileTab } from '@/components/settings/profile-tab';
import { ComingSoonTab } from '@/components/settings/coming-soon-tab';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Settings Page
 * Per AC-2.6.4: Settings page layout with tabs for Profile, Agency, Billing
 * - Profile tab active by default
 * - Agency and Billing tabs show "Coming soon" placeholder
 */
export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user with agency data (per AC-2.6.1)
  const { data: userData, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      full_name,
      role,
      agency:agencies (
        id,
        name
      )
    `)
    .eq('id', user.id)
    .single();

  if (error || !userData) {
    redirect('/login');
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
          <ComingSoonTab
            title="Agency Settings"
            description="Manage your agency details and team"
          />
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
