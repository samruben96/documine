import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WelcomeHeader } from '@/components/dashboard/welcome-header';
import { ToolCard } from '@/components/dashboard/tool-card';

/**
 * Dashboard Page
 * Story 9.2: Central hub with tool cards and agency welcome
 * AC-9.2.1: Dashboard route accessible at /dashboard
 * AC-9.2.2: Welcome header with agency name
 * AC-9.2.3: Three tool cards for main features
 * AC-9.2.5: Responsive layout (1 col mobile, 3 col desktop)
 */

const TOOLS = [
  {
    icon: 'Bot', // AI Buddy
    title: 'AI Buddy',
    description: 'Your knowledgeable insurance assistant for policy questions',
    href: '/ai-buddy',
    color: 'emerald' as const,
  },
  {
    icon: 'FolderOpen', // Documents library
    title: 'Documents',
    description: 'Upload, organize, and manage your insurance documents',
    href: '/documents',
    color: 'slate' as const,
  },
  {
    icon: 'MessageSquare', // Icon name as string - resolved in client component
    title: 'Chat with Docs',
    description: 'Ask questions about your documents and get AI-powered answers',
    href: '/chat-docs',
    color: 'blue' as const,
  },
  {
    icon: 'GitCompare',
    title: 'Quote Comparison',
    description: 'Compare insurance quotes side by side with gap analysis',
    href: '/compare',
    color: 'green' as const,
  },
  {
    icon: 'FileText',
    title: 'Generate One-Pager',
    description: 'Create professional client summaries from your quotes',
    href: '/one-pager',
    color: 'purple' as const,
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user with agency data for welcome header (AC-9.2.2)
  const { data: userData, error } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
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

  // Handle both array and single object responses from Supabase
  const agency = Array.isArray(userData.agency) ? userData.agency[0] : userData.agency;
  const agencyName = agency?.name || 'Your Agency';

  return (
    <div className="h-full overflow-auto">
      {/* Story 22.3: AC-22.3.2 - Dashboard content fades in smoothly */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 view-fade-in">
        {/* Welcome Header (AC-9.2.2) */}
        <WelcomeHeader
          agencyName={agencyName}
          userName={userData.full_name || undefined}
        />

        {/* Tool Cards Grid (AC-9.2.3, AC-9.2.5, AC-9.2.6) */}
        <div
          className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="tool-cards-grid"
        >
          {TOOLS.map((tool) => (
            <ToolCard
              key={tool.href}
              icon={tool.icon}
              title={tool.title}
              description={tool.description}
              href={tool.href}
              color={tool.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
