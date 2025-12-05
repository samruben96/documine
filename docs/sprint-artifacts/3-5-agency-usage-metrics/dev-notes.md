# Dev Notes

## Architecture Patterns & Constraints

**Usage Metrics Flow (from Tech Spec):**
```
Admin navigates to Usage tab
    |
    └─> Page Load → Server Action: getUsageMetrics()
        │
        ├─> 1. Verify user is admin (return error/empty for non-admin)
        │
        ├─> 2. Get agency_id from session
        │
        ├─> 3. Aggregate queries:
        │       - Documents: COUNT(*) with created_at filters
        │       - Queries: COUNT(*) from chat_messages WHERE role='user'
        │       - Active Users: DISTINCT user_id from recent activity
        │       - Storage: SUM from documents.metadata or Storage API
        │
        └─> 4. Return UsageMetrics object
```

**UsageMetrics TypeScript Interface (from Tech Spec):**
```typescript
export interface UsageMetrics {
  documentsUploaded: { thisMonth: number; allTime: number };
  queriesAsked: { thisMonth: number; allTime: number };
  activeUsers: number; // Last 7 days
  storageUsedMB: number;
}
```

**Query Patterns for Metrics:**
```sql
-- Documents this month
SELECT COUNT(*) FROM documents
WHERE agency_id = $agency
AND created_at >= date_trunc('month', CURRENT_DATE);

-- Documents all time
SELECT COUNT(*) FROM documents
WHERE agency_id = $agency;

-- Queries this month (user messages only)
SELECT COUNT(*) FROM chat_messages cm
JOIN conversations c ON cm.conversation_id = c.id
WHERE c.agency_id = $agency
AND cm.role = 'user'
AND cm.created_at >= date_trunc('month', CURRENT_DATE);

-- Active users (last 7 days)
SELECT COUNT(DISTINCT activity.user_id) FROM (
  SELECT uploaded_by as user_id FROM documents
  WHERE agency_id = $agency AND created_at >= NOW() - INTERVAL '7 days'
  UNION
  SELECT user_id FROM conversations
  WHERE agency_id = $agency AND updated_at >= NOW() - INTERVAL '7 days'
) activity;

-- Storage (from documents metadata if available, otherwise estimate)
SELECT COALESCE(SUM((metadata->>'size')::bigint), 0) FROM documents
WHERE agency_id = $agency;
```

## Project Structure Notes

**Files to Create:**
```
src/
├── components/
│   └── settings/
│       └── usage-tab.tsx         # Usage metrics display component
```

**Existing Files to Modify:**
```
src/
├── app/
│   └── (dashboard)/
│       └── settings/
│           ├── page.tsx          # Add Usage tab (admin only)
│           └── actions.ts        # Add getUsageMetrics()
├── types/
│   └── team.ts                   # Add UsageMetrics interface (or index.ts)
```

## Learnings from Previous Story

**From Story 3-4-subscription-billing-management (Status: done)**

- **Server Actions Pattern**: Use `createServerClient()` from `@/lib/supabase/server.ts` for all server actions
- **Admin Check Pattern**: Query user role from users table, check `role === 'admin'` before allowing admin actions
- **Tab Component Structure**: Settings page uses shadcn/ui Tabs with TabsList, TabsTrigger, TabsContent
- **Card Display Pattern**: Use shadcn/ui Card, CardHeader, CardTitle, CardDescription, CardContent for metrics display
- **Loading State**: Consider Suspense or loading skeleton for async data
- **View-only Mode**: For this story, non-admins simply don't see the tab (not view-only mode like Team/Billing)
- **Data Fetching Pattern**: Fetch data in server component, pass to client component as props

**Key Files to Reference:**
- `documine/src/app/(dashboard)/settings/actions.ts` - Follow existing patterns (getBillingInfo)
- `documine/src/app/(dashboard)/settings/page.tsx` - Tab structure and conditional rendering
- `documine/src/components/settings/billing-tab.tsx` - Card layout patterns
- `documine/src/lib/constants/plans.ts` - Pattern for constants/types

[Source: docs/sprint-artifacts/3-4-subscription-billing-management.md#Dev-Agent-Record]

## References

- [Source: docs/sprint-artifacts/tech-spec-epic-3.md#Story-3.5-Agency-Usage-Metrics]
- [Source: docs/sprint-artifacts/tech-spec-epic-3.md#Acceptance-Criteria-Authoritative]
- [Source: docs/sprint-artifacts/tech-spec-epic-3.md#APIs-and-Interfaces]
- [Source: docs/epics.md#Story-3.5-Agency-Usage-Metrics]
- [Source: docs/prd.md#FR28]
- [Source: docs/sprint-artifacts/3-4-subscription-billing-management.md#Dev-Notes]

## Technical Notes

**Server Action Pattern (getUsageMetrics):**
```typescript
// src/app/(dashboard)/settings/actions.ts
'use server';

import { createServerClient } from '@/lib/supabase/server';

export interface UsageMetrics {
  documentsUploaded: { thisMonth: number; allTime: number };
  queriesAsked: { thisMonth: number; allTime: number };
  activeUsers: number;
  storageUsedBytes: number;
}

export async function getUsageMetrics(): Promise<UsageMetrics | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user's agency and verify admin
  const { data: userData } = await supabase
    .from('users')
    .select('agency_id, role')
    .eq('id', user.id)
    .single();

  if (!userData?.agency_id || userData.role !== 'admin') {
    return null; // Non-admins get null
  }

  const agencyId = userData.agency_id;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Documents all time
  const { count: docsAllTime } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId);

  // Documents this month
  const { count: docsThisMonth } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId)
    .gte('created_at', startOfMonth.toISOString());

  // Queries (chat_messages with role='user')
  const { count: queriesAllTime } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId)
    .eq('role', 'user');

  const { count: queriesThisMonth } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId)
    .eq('role', 'user')
    .gte('created_at', startOfMonth.toISOString());

  // Active users (distinct users with activity in last 7 days)
  // Check document uploads
  const { data: docUploaders } = await supabase
    .from('documents')
    .select('uploaded_by')
    .eq('agency_id', agencyId)
    .gte('created_at', sevenDaysAgo.toISOString());

  // Check conversation activity
  const { data: conversationUsers } = await supabase
    .from('conversations')
    .select('user_id')
    .eq('agency_id', agencyId)
    .gte('updated_at', sevenDaysAgo.toISOString());

  const activeUserIds = new Set([
    ...(docUploaders?.map(d => d.uploaded_by) || []),
    ...(conversationUsers?.map(c => c.user_id) || []),
  ]);

  // Storage - sum from documents metadata if available
  const { data: storageData } = await supabase
    .from('documents')
    .select('metadata')
    .eq('agency_id', agencyId);

  let storageUsedBytes = 0;
  if (storageData) {
    for (const doc of storageData) {
      if (doc.metadata && typeof doc.metadata === 'object' && 'size' in doc.metadata) {
        storageUsedBytes += Number(doc.metadata.size) || 0;
      }
    }
  }

  return {
    documentsUploaded: {
      thisMonth: docsThisMonth ?? 0,
      allTime: docsAllTime ?? 0,
    },
    queriesAsked: {
      thisMonth: queriesThisMonth ?? 0,
      allTime: queriesAllTime ?? 0,
    },
    activeUsers: activeUserIds.size,
    storageUsedBytes,
  };
}
```

**UsageTab Component Pattern:**
```typescript
// src/components/settings/usage-tab.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { UsageMetrics } from '@/app/(dashboard)/settings/actions';

interface UsageTabProps {
  metrics: UsageMetrics;
}

function formatStorage(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function UsageTab({ metrics }: UsageTabProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Documents Card */}
      <Card>
        <CardHeader>
          <CardTitle>Documents Uploaded</CardTitle>
          <CardDescription>PDF documents analyzed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">This Month</span>
              <span className="font-semibold">{formatNumber(metrics.documentsUploaded.thisMonth)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">All Time</span>
              <span className="font-semibold">{formatNumber(metrics.documentsUploaded.allTime)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queries Card */}
      <Card>
        <CardHeader>
          <CardTitle>Questions Asked</CardTitle>
          <CardDescription>AI queries submitted</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">This Month</span>
              <span className="font-semibold">{formatNumber(metrics.queriesAsked.thisMonth)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">All Time</span>
              <span className="font-semibold">{formatNumber(metrics.queriesAsked.allTime)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Users Card */}
      <Card>
        <CardHeader>
          <CardTitle>Active Users</CardTitle>
          <CardDescription>Users with activity in last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.activeUsers}</div>
        </CardContent>
      </Card>

      {/* Storage Card */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Used</CardTitle>
          <CardDescription>Total document storage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatStorage(metrics.storageUsedBytes)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Settings Page Integration:**
```typescript
// In src/app/(dashboard)/settings/page.tsx

// Add to imports
import { UsageTab } from '@/components/settings/usage-tab';
import { getUsageMetrics } from './actions';

// In component, add:
const usageMetrics = isAdmin ? await getUsageMetrics() : null;

// In TabsList, add (for admins only):
{isAdmin && <TabsTrigger value="usage">Usage</TabsTrigger>}

// Add TabsContent:
{isAdmin && usageMetrics && (
  <TabsContent value="usage">
    <UsageTab metrics={usageMetrics} />
  </TabsContent>
)}
```
