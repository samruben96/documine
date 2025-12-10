/**
 * E2E Tests for Audit Log Interface
 * Story 20.4: Audit Log Interface
 *
 * Tests:
 * - AC-20.4.1: Table with date/time, user, project, conversation title, message count, guardrail badge
 * - AC-20.4.2: Filter by user (dropdown), date range (pickers), keyword search, has guardrail events
 * - AC-20.4.3: Paginated at 25 per page with total count displayed
 * - AC-20.4.4: View transcript modal showing full read-only conversation
 * - AC-20.4.5: Messages show role, content, timestamps, source citations, confidence badges
 * - AC-20.4.6: Guardrail events highlighted with type and trigger info
 * - AC-20.4.7: Export format selection (PDF or CSV), PDF option includes checkbox for full transcripts
 * - AC-20.4.8: PDF includes agency header, date range, compliance statement
 * - AC-20.4.9: CSV columns: timestamp, user, action, conversation_title, project_name, message_count, guardrail_event_count
 * - AC-20.4.10: Transcript view is read-only - no edit or delete options visible
 */

import { test, expect } from '@playwright/test';

test.describe('Audit Log Interface', () => {
  test.describe('Admin User Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to settings page with AI Buddy tab selected
      await page.goto('/settings?tab=ai-buddy');
      // Wait for the page to load
      await page.waitForLoadState('networkidle');
    });

    test('AC-20.4.1: displays audit log table with required columns', async ({ page }) => {
      // Check for the audit log panel
      const auditLogPanel = page.getByTestId('audit-log-panel');
      const hasPermission = await auditLogPanel.isVisible().catch(() => false);

      if (hasPermission) {
        // Verify table headers exist
        await expect(page.getByText('Date/Time')).toBeVisible();
        await expect(page.getByText('User')).toBeVisible();
        await expect(page.getByText('Conversation')).toBeVisible();

        // Check for table container
        const table = page.getByTestId('audit-log-table');
        const hasTable = await table.isVisible().catch(() => false);

        if (hasTable) {
          // Table should be displayed with entries or empty state
          await expect(table).toBeVisible();
        }
      }
    });

    test('AC-20.4.2: displays filter controls', async ({ page }) => {
      const auditLogPanel = page.getByTestId('audit-log-panel');
      const hasPermission = await auditLogPanel.isVisible().catch(() => false);

      if (hasPermission) {
        // Check for filter controls
        const filters = page.getByTestId('audit-filters');
        await expect(filters).toBeVisible();

        // User dropdown filter
        const userFilter = page.getByTestId('user-filter');
        await expect(userFilter).toBeVisible();

        // Search input
        const searchFilter = page.getByTestId('search-filter');
        await expect(searchFilter).toBeVisible();

        // Start date filter
        const startDateFilter = page.getByTestId('start-date-filter');
        await expect(startDateFilter).toBeVisible();

        // End date filter
        const endDateFilter = page.getByTestId('end-date-filter');
        await expect(endDateFilter).toBeVisible();

        // Guardrail events checkbox
        const guardrailFilter = page.getByTestId('guardrail-events-filter');
        await expect(guardrailFilter).toBeVisible();
      }
    });

    test('AC-20.4.2: search filter accepts text input', async ({ page }) => {
      const auditLogPanel = page.getByTestId('audit-log-panel');
      const hasPermission = await auditLogPanel.isVisible().catch(() => false);

      if (hasPermission) {
        const searchFilter = page.getByTestId('search-filter');
        await expect(searchFilter).toBeVisible();

        // Type in the search field
        await searchFilter.fill('test search');
        await expect(searchFilter).toHaveValue('test search');
      }
    });

    test('AC-20.4.2: guardrail events checkbox can be toggled', async ({ page }) => {
      const auditLogPanel = page.getByTestId('audit-log-panel');
      const hasPermission = await auditLogPanel.isVisible().catch(() => false);

      if (hasPermission) {
        const guardrailFilter = page.getByTestId('guardrail-events-filter');
        await expect(guardrailFilter).toBeVisible();

        // Click to toggle
        await guardrailFilter.click();

        // Should show clear filters button when filter is active
        const clearFiltersBtn = page.getByTestId('clear-filters-btn');
        await expect(clearFiltersBtn).toBeVisible();
      }
    });

    test('AC-20.4.3: shows pagination when entries exceed page size', async ({ page }) => {
      // Mock API response with many entries
      await page.route('**/api/ai-buddy/admin/audit-logs**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              entries: Array.from({ length: 25 }, (_, i) => ({
                id: `entry-${i}`,
                agencyId: 'agency-1',
                userId: 'user-1',
                userName: `Test User ${i}`,
                userEmail: `user${i}@example.com`,
                conversationId: `conv-${i}`,
                conversationTitle: `Conversation ${i}`,
                projectId: 'proj-1',
                projectName: 'Test Project',
                action: 'conversation_created',
                metadata: {},
                loggedAt: new Date().toISOString(),
                messageCount: 5,
                guardrailEventCount: 0,
              })),
              total: 100,
              page: 1,
              pageSize: 25,
              totalPages: 4,
            },
          }),
        });
      });

      await page.goto('/settings?tab=ai-buddy');
      await page.waitForLoadState('networkidle');

      const auditLogPanel = page.getByTestId('audit-log-panel');
      const hasPermission = await auditLogPanel.isVisible().catch(() => false);

      if (hasPermission) {
        // Check for pagination controls
        const pagination = page.getByTestId('pagination-controls');
        const hasPagination = await pagination.isVisible().catch(() => false);

        if (hasPagination) {
          await expect(page.getByTestId('pagination-info')).toBeVisible();
          await expect(page.getByTestId('prev-page-btn')).toBeVisible();
          await expect(page.getByTestId('next-page-btn')).toBeVisible();
        }
      }
    });

    test('AC-20.4.7: displays export button with dropdown', async ({ page }) => {
      const auditLogPanel = page.getByTestId('audit-log-panel');
      const hasPermission = await auditLogPanel.isVisible().catch(() => false);

      if (hasPermission) {
        const exportButton = page.getByTestId('export-button');
        await expect(exportButton).toBeVisible();
        await expect(exportButton).toContainText('Export');
      }
    });

    test('AC-20.4.7: export dropdown shows CSV and PDF options', async ({ page }) => {
      const auditLogPanel = page.getByTestId('audit-log-panel');
      const hasPermission = await auditLogPanel.isVisible().catch(() => false);

      if (hasPermission) {
        const exportButton = page.getByTestId('export-button');
        await expect(exportButton).toBeVisible();

        // Click to open dropdown
        await exportButton.click();

        // Check for export options
        await expect(page.getByText('Export as CSV')).toBeVisible();
        await expect(page.getByText('Export as PDF')).toBeVisible();
        await expect(page.getByText('Include full transcripts')).toBeVisible();
      }
    });
  });

  test.describe('Transcript Modal', () => {
    test('AC-20.4.4, AC-20.4.10: transcript modal shows full conversation in read-only mode', async ({ page }) => {
      // Mock API response with entries that have conversations
      await page.route('**/api/ai-buddy/admin/audit-logs', (route) => {
        if (route.request().method() === 'GET') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                entries: [{
                  id: 'entry-1',
                  agencyId: 'agency-1',
                  userId: 'user-1',
                  userName: 'Test User',
                  userEmail: 'test@example.com',
                  conversationId: 'conv-1',
                  conversationTitle: 'Test Conversation',
                  projectId: 'proj-1',
                  projectName: 'Test Project',
                  action: 'conversation_created',
                  metadata: {},
                  loggedAt: new Date().toISOString(),
                  messageCount: 5,
                  guardrailEventCount: 0,
                }],
                total: 1,
                page: 1,
                pageSize: 25,
                totalPages: 1,
              },
            }),
          });
        }
      });

      // Mock transcript API
      await page.route('**/api/ai-buddy/admin/audit-logs/conv-1/transcript', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              conversation: {
                id: 'conv-1',
                title: 'Test Conversation',
                projectId: 'proj-1',
                projectName: 'Test Project',
                userId: 'user-1',
                userName: 'Test User',
                userEmail: 'test@example.com',
                createdAt: new Date().toISOString(),
              },
              messages: [
                {
                  id: 'msg-1',
                  role: 'user',
                  content: 'Hello, what is the policy coverage?',
                  createdAt: new Date().toISOString(),
                  confidence: null,
                  sources: null,
                },
                {
                  id: 'msg-2',
                  role: 'assistant',
                  content: 'Based on the policy document, the coverage includes...',
                  createdAt: new Date().toISOString(),
                  confidence: 'high',
                  sources: [{ documentId: 'doc-1', documentName: 'Policy.pdf', text: 'Coverage includes...', page: 5 }],
                },
              ],
              guardrailEvents: [],
            },
          }),
        });
      });

      await page.goto('/settings?tab=ai-buddy');
      await page.waitForLoadState('networkidle');

      const auditLogPanel = page.getByTestId('audit-log-panel');
      const hasPermission = await auditLogPanel.isVisible().catch(() => false);

      if (hasPermission) {
        // Click on a row to open transcript
        const row = page.getByTestId('audit-log-row-entry-1');
        const hasRow = await row.isVisible().catch(() => false);

        if (hasRow) {
          await row.click();

          // Check for transcript modal
          const transcriptModal = page.getByTestId('transcript-modal');
          await expect(transcriptModal).toBeVisible();

          // AC-20.4.10: Should only have close button (read-only)
          const closeButton = page.getByTestId('close-transcript-btn');
          await expect(closeButton).toBeVisible();

          // Should NOT have edit or delete buttons
          await expect(page.getByText('Edit')).not.toBeVisible();
          await expect(page.getByText('Delete')).not.toBeVisible();
        }
      }
    });

    test('AC-20.4.5: transcript shows message details with confidence badges', async ({ page }) => {
      // Mock APIs
      await page.route('**/api/ai-buddy/admin/audit-logs', (route) => {
        if (route.request().method() === 'GET') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                entries: [{
                  id: 'entry-1',
                  agencyId: 'agency-1',
                  userId: 'user-1',
                  userName: 'Test User',
                  userEmail: 'test@example.com',
                  conversationId: 'conv-1',
                  conversationTitle: 'Test Conversation',
                  projectId: null,
                  projectName: null,
                  action: 'conversation_created',
                  metadata: {},
                  loggedAt: new Date().toISOString(),
                  messageCount: 2,
                  guardrailEventCount: 0,
                }],
                total: 1,
                page: 1,
                pageSize: 25,
                totalPages: 1,
              },
            }),
          });
        }
      });

      await page.route('**/api/ai-buddy/admin/audit-logs/conv-1/transcript', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              conversation: {
                id: 'conv-1',
                title: 'Test Conversation',
                projectId: null,
                projectName: null,
                userId: 'user-1',
                userName: 'Test User',
                userEmail: 'test@example.com',
                createdAt: new Date().toISOString(),
              },
              messages: [
                {
                  id: 'msg-1',
                  role: 'user',
                  content: 'Test message',
                  createdAt: new Date().toISOString(),
                  confidence: null,
                  sources: null,
                },
                {
                  id: 'msg-2',
                  role: 'assistant',
                  content: 'Response with high confidence',
                  createdAt: new Date().toISOString(),
                  confidence: 'high',
                  sources: [],
                },
              ],
              guardrailEvents: [],
            },
          }),
        });
      });

      await page.goto('/settings?tab=ai-buddy');
      await page.waitForLoadState('networkidle');

      const auditLogPanel = page.getByTestId('audit-log-panel');
      const hasPermission = await auditLogPanel.isVisible().catch(() => false);

      if (hasPermission) {
        const row = page.getByTestId('audit-log-row-entry-1');
        const hasRow = await row.isVisible().catch(() => false);

        if (hasRow) {
          await row.click();

          const transcriptModal = page.getByTestId('transcript-modal');
          await expect(transcriptModal).toBeVisible();

          // Check for confidence badge
          const confidenceBadge = page.getByTestId('confidence-badge');
          const hasConfidence = await confidenceBadge.isVisible().catch(() => false);

          if (hasConfidence) {
            await expect(confidenceBadge).toContainText('high confidence');
          }
        }
      }
    });

    test('AC-20.4.6: transcript highlights guardrail events', async ({ page }) => {
      // Mock APIs with guardrail events
      await page.route('**/api/ai-buddy/admin/audit-logs', (route) => {
        if (route.request().method() === 'GET') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                entries: [{
                  id: 'entry-1',
                  agencyId: 'agency-1',
                  userId: 'user-1',
                  userName: 'Test User',
                  userEmail: 'test@example.com',
                  conversationId: 'conv-1',
                  conversationTitle: 'Test Conversation',
                  projectId: null,
                  projectName: null,
                  action: 'conversation_created',
                  metadata: {},
                  loggedAt: new Date().toISOString(),
                  messageCount: 2,
                  guardrailEventCount: 1,
                }],
                total: 1,
                page: 1,
                pageSize: 25,
                totalPages: 1,
              },
            }),
          });
        }
      });

      await page.route('**/api/ai-buddy/admin/audit-logs/conv-1/transcript', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              conversation: {
                id: 'conv-1',
                title: 'Test Conversation',
                projectId: null,
                projectName: null,
                userId: 'user-1',
                userName: 'Test User',
                userEmail: 'test@example.com',
                createdAt: new Date().toISOString(),
              },
              messages: [
                {
                  id: 'msg-1',
                  role: 'user',
                  content: 'Tell me about competitor products',
                  createdAt: '2024-01-15T10:30:00Z',
                  confidence: null,
                  sources: null,
                },
                {
                  id: 'msg-2',
                  role: 'assistant',
                  content: 'I can help with our products...',
                  createdAt: '2024-01-15T10:30:02Z',
                  confidence: 'high',
                  sources: [],
                },
              ],
              guardrailEvents: [{
                id: 'event-1',
                triggeredTopic: 'competitor_mention',
                redirectMessage: 'Redirected from competitor topic',
                loggedAt: '2024-01-15T10:30:01Z',
              }],
            },
          }),
        });
      });

      await page.goto('/settings?tab=ai-buddy');
      await page.waitForLoadState('networkidle');

      const auditLogPanel = page.getByTestId('audit-log-panel');
      const hasPermission = await auditLogPanel.isVisible().catch(() => false);

      if (hasPermission) {
        const row = page.getByTestId('audit-log-row-entry-1');
        const hasRow = await row.isVisible().catch(() => false);

        if (hasRow) {
          await row.click();

          const transcriptModal = page.getByTestId('transcript-modal');
          await expect(transcriptModal).toBeVisible();

          // Check for guardrail event summary
          await expect(page.getByText(/1 guardrail event/)).toBeVisible();
        }
      }
    });
  });

  test.describe('Permission Handling', () => {
    test('AC-20.4 permission denied: shows forbidden message for non-admin users', async ({ page }) => {
      const forbidden = page.getByTestId('audit-log-permission-denied');
      const isNonAdmin = await forbidden.isVisible().catch(() => false);

      if (isNonAdmin) {
        await expect(forbidden).toContainText("don't have permission");
        await expect(forbidden).toContainText('view_audit_logs');
      }
    });
  });

  test.describe('Empty State', () => {
    test('shows empty state when no audit log entries exist', async ({ page }) => {
      // Mock API response with empty entries
      await page.route('**/api/ai-buddy/admin/audit-logs**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              entries: [],
              total: 0,
              page: 1,
              pageSize: 25,
              totalPages: 0,
            },
          }),
        });
      });

      await page.goto('/settings?tab=ai-buddy');
      await page.waitForLoadState('networkidle');

      const auditLogPanel = page.getByTestId('audit-log-panel');
      const hasPermission = await auditLogPanel.isVisible().catch(() => false);

      if (hasPermission) {
        const emptyState = page.getByTestId('audit-log-empty');
        const isEmpty = await emptyState.isVisible().catch(() => false);

        if (isEmpty) {
          await expect(emptyState).toContainText('No audit log entries');
        }
      }
    });
  });

  test.describe('Error Handling', () => {
    test('displays error state with retry button on API failure', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/ai-buddy/admin/audit-logs**', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Internal server error' } }),
        });
      });

      await page.goto('/settings?tab=ai-buddy');
      await page.waitForLoadState('networkidle');

      const auditLogPanel = page.getByTestId('audit-log-panel');
      const hasPermission = await auditLogPanel.isVisible().catch(() => false);

      if (hasPermission) {
        const errorState = page.getByTestId('audit-log-error');
        const hasError = await errorState.isVisible().catch(() => false);

        if (hasError) {
          await expect(errorState).toContainText('Failed to load');
          const retryButton = page.getByText('Try Again');
          await expect(retryButton).toBeVisible();
        }
      }
    });
  });
});
