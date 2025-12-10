/**
 * Admin Tab Component
 * Story 21.3: Component & Settings Migration
 *
 * Top-level admin tab in Settings for agency-wide management.
 * AC-21.3.3: Admin tab is top-level with sub-tabs for Users, Usage, Audit, Subscription, AI Buddy
 * AC-21.3.3: Admin tab is only visible to users with admin permissions
 *
 * Layout: Five sub-tabs
 * - Users - User management (manage_users permission)
 * - Usage Analytics - Usage stats and trends (view_usage_analytics permission)
 * - Audit Log - Compliance audit trail (view_audit_logs permission)
 * - Subscription - Billing and ownership (transfer_ownership permission)
 * - AI Buddy - AI Buddy team settings (guardrails, onboarding)
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BarChart3, FileText, CreditCard, Shield, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

import { UserManagementPanel } from '@/components/admin/user-management-panel';
import { UsageAnalyticsPanel } from '@/components/admin/analytics/usage-analytics-panel';
import { AuditLogPanel } from '@/components/admin/audit-log/audit-log-panel';
import { OwnerSettingsPanel } from '@/components/admin/owner';
import { OnboardingStatusSection } from '@/components/ai-buddy/admin/onboarding-status-section';
import { GuardrailAdminPanel } from '@/components/ai-buddy/admin/guardrail-admin-panel';

export interface AdminTabProps {
  /** Whether the admin has manage_users permission (AC-20.2.1) */
  hasManageUsersPermission?: boolean;
  /** Whether the admin has view_usage_analytics permission (AC-20.3.1) */
  hasViewUsageAnalyticsPermission?: boolean;
  /** Whether the admin has view_audit_logs permission (AC-20.4.1) */
  hasViewAuditLogsPermission?: boolean;
  /** Whether the current user has transfer_ownership permission (AC-20.5.4) */
  hasOwnerPermission?: boolean;
}

type AdminSubTab = 'users' | 'usage' | 'audit' | 'subscription' | 'ai-buddy';

/**
 * Top-level Admin tab for agency-wide settings
 *
 * Provides access to:
 * - User Management (invite, remove, role changes)
 * - Usage Analytics (conversations, messages, active users)
 * - Audit Log (compliance trail, exports)
 * - Subscription (billing info, ownership transfer)
 * - AI Buddy (team settings, guardrails, onboarding)
 */
export function AdminTab({
  hasManageUsersPermission = false,
  hasViewUsageAnalyticsPermission = false,
  hasViewAuditLogsPermission = false,
  hasOwnerPermission = false,
}: AdminTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('users');

  const subTabs = [
    {
      id: 'users' as const,
      label: 'Users',
      icon: Users,
      hasPermission: hasManageUsersPermission,
    },
    {
      id: 'usage' as const,
      label: 'Usage Analytics',
      icon: BarChart3,
      hasPermission: hasViewUsageAnalyticsPermission,
    },
    {
      id: 'audit' as const,
      label: 'Audit Log',
      icon: FileText,
      hasPermission: hasViewAuditLogsPermission,
    },
    {
      id: 'subscription' as const,
      label: 'Subscription',
      icon: CreditCard,
      hasPermission: true, // Always visible to admins, content gated inside
    },
    {
      id: 'ai-buddy' as const,
      label: 'AI Buddy',
      icon: Bot,
      hasPermission: true, // Always visible to admins
    },
  ];

  return (
    <div className="mt-6" data-testid="admin-tab">
      {/* Sub-tabs navigation */}
      <div className="flex gap-2 mb-6 border-b" data-testid="admin-sub-tabs">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeSubTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              )}
              data-testid={`admin-subtab-${tab.id}`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Admin Header */}
      <Card className="mb-6" data-testid="admin-header">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Agency Administration
          </CardTitle>
          <CardDescription>
            Manage your agency&apos;s users, view usage analytics, access audit logs, and manage your subscription.
            Changes made here affect all users in your agency.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Users Sub-tab */}
      {activeSubTab === 'users' && (
        <div className="space-y-6" data-testid="admin-users-content">
          <UserManagementPanel hasManageUsersPermission={hasManageUsersPermission} />
        </div>
      )}

      {/* Usage Analytics Sub-tab */}
      {activeSubTab === 'usage' && (
        <div className="space-y-6" data-testid="admin-usage-content">
          <UsageAnalyticsPanel hasPermission={hasViewUsageAnalyticsPermission} />
        </div>
      )}

      {/* Audit Log Sub-tab */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6" data-testid="admin-audit-content">
          <AuditLogPanel hasPermission={hasViewAuditLogsPermission} />
        </div>
      )}

      {/* Subscription Sub-tab */}
      {activeSubTab === 'subscription' && (
        <div className="space-y-6" data-testid="admin-subscription-content">
          <OwnerSettingsPanel hasOwnerPermission={hasOwnerPermission} />
        </div>
      )}

      {/* AI Buddy Sub-tab */}
      {activeSubTab === 'ai-buddy' && (
        <div className="space-y-6" data-testid="admin-ai-buddy-content">
          {/* AI Buddy Admin Settings Header */}
          <Card data-testid="ai-buddy-admin-header">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Buddy Team Settings
              </CardTitle>
              <CardDescription>
                Configure AI Buddy settings that apply to your entire team.
                Manage guardrails, view onboarding status, and control AI behavior.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Onboarding Status Section */}
          <OnboardingStatusSection isAdmin={true} />

          {/* Guardrails Section */}
          <GuardrailAdminPanel isAdmin={true} hasViewAuditLogsPermission={hasViewAuditLogsPermission} />
        </div>
      )}
    </div>
  );
}
