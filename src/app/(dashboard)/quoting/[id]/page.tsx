/**
 * Quote Session Detail Page
 * Story Q2.3: Quote Session Detail Page Structure
 *
 * AC-Q2.3-1: Page displays back link, header, tabs, content, status
 * AC-Q2.3-2: Tabs show completion indicators
 * AC-Q2.3-3: Property tab hidden for Auto-only quotes
 * AC-Q2.3-4: Auto and Drivers tabs hidden for Home-only quotes
 * AC-Q2.3-5: Client Info tab active by default
 * AC-Q2.3-6: Invalid session redirects to /quoting with error toast
 * AC-Q2.3-7: Page loads within 2 seconds
 */

'use client';

import { use } from 'react';
import Link from 'next/link';
import { ChevronLeft, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { QuoteTypeBadge } from '@/components/quoting/quote-type-badge';
import { StatusBadge } from '@/components/quoting/status-badge';
import { SaveIndicator } from '@/components/quoting/save-indicator';
import { useQuoteSession } from '@/hooks/quoting/use-quote-session';
import {
  QuoteSessionProvider,
  useQuoteSessionContext,
} from '@/contexts/quote-session-context';
import {
  getTabCompletionStatus,
  getVisibleTabs,
  TAB_CONFIG,
  type TabId,
  type TabCompletionStatus,
} from '@/lib/quoting/tab-completion';
import {
  ClientInfoTab,
  PropertyTab,
  AutoTab,
  DriversTab,
  CarriersTab,
  ResultsTab,
} from '@/components/quoting/tabs';

/**
 * Tab content component mapping
 */
const TAB_CONTENT: Record<TabId, React.ComponentType> = {
  'client-info': ClientInfoTab,
  property: PropertyTab,
  auto: AutoTab,
  drivers: DriversTab,
  carriers: CarriersTab,
  results: ResultsTab,
};

/**
 * Save Status Header Component
 * Story Q3.2: Auto-Save Implementation
 * AC-Q3.2-2: Position indicator in quote session header area
 *
 * Must be used within QuoteSessionProvider
 */
function SaveStatusHeader() {
  const { saveState, isOffline, retry } = useQuoteSessionContext();

  return (
    <SaveIndicator
      state={saveState}
      isOffline={isOffline}
      onRetry={retry}
      className="ml-auto"
    />
  );
}

/**
 * Tab Trigger with Completion Indicator
 * AC-Q2.3-2: Shows checkmark when complete, count for multi-item sections
 */
function TabTriggerWithIndicator({
  tabId,
  label,
  status,
  countLabel,
  countLabelPlural,
}: {
  tabId: TabId;
  label: string;
  status: TabCompletionStatus;
  countLabel?: string;
  countLabelPlural?: string;
}) {
  const showCount = status.count !== undefined && status.count > 0;
  const countText = showCount
    ? `${status.count} ${status.count === 1 ? countLabel : countLabelPlural}`
    : null;

  return (
    <TabsTrigger value={tabId} className="gap-1.5" data-testid={`tab-${tabId}`}>
      {label}
      {status.isComplete && !showCount && (
        <Check className="h-3.5 w-3.5 text-green-600" aria-label="Complete" />
      )}
      {showCount && (
        <Badge
          variant="secondary"
          className="ml-1 h-5 px-1.5 text-xs font-normal"
        >
          {countText}
        </Badge>
      )}
    </TabsTrigger>
  );
}

/**
 * Loading Skeleton
 * AC-Q2.3-1: Loading skeleton while session data fetches
 */
function LoadingSkeleton() {
  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-6">
        {/* Back link skeleton */}
        <Skeleton className="h-5 w-28 mb-4" />

        {/* Header skeleton */}
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>

        {/* Tabs skeleton */}
        <Skeleton className="h-10 w-full max-w-2xl mb-6" />

        {/* Content skeleton */}
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

/**
 * Quote Session Detail Page Component
 */
export default function QuoteSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { session, isLoading, refresh } = useQuoteSession(resolvedParams.id);

  // AC-Q2.3-7: Show loading skeleton during fetch
  if (isLoading || !session) {
    return <LoadingSkeleton />;
  }

  // Get visible tabs based on quote type
  // AC-Q2.3-3: Property tab hidden for auto
  // AC-Q2.3-4: Auto/Drivers tabs hidden for home
  const visibleTabs = getVisibleTabs(session.quoteType);
  const tabConfigs = TAB_CONFIG.filter((tab) => visibleTabs.includes(tab.id));

  // Get completion status for all tabs
  // AC-Q2.3-2: Completion indicators
  const completionStatus = getTabCompletionStatus(
    session.clientData,
    session.carrierCount ?? 0
  );

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-6 view-fade-in">
        {/* Back Link - AC-Q2.3-1 */}
        <Link
          href="/quoting"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          data-testid="back-link"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Quotes
        </Link>

        {/* Q3.1/Q3.2: Wrap content in QuoteSessionProvider for context access */}
        <QuoteSessionProvider
          session={session}
          isLoading={isLoading}
          onRefresh={refresh}
        >
          {/* Header - AC-Q2.3-1, AC-Q3.2-2 (save indicator in header) */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <h1
              className="text-2xl font-semibold text-slate-900 dark:text-slate-100"
              data-testid="prospect-name"
            >
              {session.prospectName}
            </h1>
            <QuoteTypeBadge type={session.quoteType} />
            <StatusBadge status={session.status} />
            <SaveStatusHeader />
          </div>

          {/* Tabs - AC-Q2.3-1, AC-Q2.3-5 */}
          <Tabs defaultValue="client-info" className="space-y-6">
            <TabsList className="w-full justify-start overflow-x-auto">
              {tabConfigs.map((tab) => (
                <TabTriggerWithIndicator
                  key={tab.id}
                  tabId={tab.id}
                  label={tab.label}
                  status={completionStatus[tab.id]}
                  countLabel={tab.countLabel}
                  countLabelPlural={tab.countLabelPlural}
                />
              ))}
            </TabsList>

            {/* Tab Content */}
            {tabConfigs.map((tab) => {
              const ContentComponent = TAB_CONTENT[tab.id];
              return (
                <TabsContent key={tab.id} value={tab.id}>
                  <ContentComponent />
                </TabsContent>
              );
            })}
          </Tabs>
        </QuoteSessionProvider>
      </div>
    </div>
  );
}
