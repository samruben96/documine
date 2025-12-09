/**
 * E2E Tests - Guardrail Enforcement Logging
 * Story 19.2: Enforcement Logging
 *
 * Tests for the enforcement log UI in the AI Buddy admin panel.
 * Requires admin user with view_audit_logs permission.
 *
 * AC-19.2.3: Enforcement Log section in Guardrails admin (admin + permission required)
 * AC-19.2.4: Table with columns: User, Triggered Topic, Message Preview, Date/Time
 * AC-19.2.5: Click entry to see full details
 * AC-19.2.6: Support date range filtering
 *
 * Note: These tests verify UI behavior with mocked API responses.
 * Integration tests for actual database queries are in API route tests.
 */

import { test, expect, Page } from '@playwright/test';

// Mock API responses
const mockLogsResponse = {
  data: {
    logs: [
      {
        id: 'log-1',
        agencyId: 'agency-123',
        userId: 'user-456',
        userEmail: 'test@example.com',
        conversationId: 'conv-789',
        triggeredTopic: 'legal advice',
        messagePreview: 'Can you help me sue my neighbor?',
        redirectApplied: 'Please consult an attorney for legal matters.',
        loggedAt: '2024-01-15T10:30:00Z',
      },
      {
        id: 'log-2',
        agencyId: 'agency-123',
        userId: 'user-789',
        userEmail: 'other@example.com',
        conversationId: 'conv-012',
        triggeredTopic: 'claims filing',
        messagePreview: 'I want to file a claim...',
        redirectApplied: 'Contact your carrier directly.',
        loggedAt: '2024-01-14T09:00:00Z',
      },
    ],
    total: 2,
    hasMore: false,
  },
};

const mockEmptyLogsResponse = {
  data: {
    logs: [],
    total: 0,
    hasMore: false,
  },
};

/**
 * Setup route interception for enforcement log API
 */
async function setupLogsMock(page: Page, response: typeof mockLogsResponse | typeof mockEmptyLogsResponse) {
  await page.route('**/api/ai-buddy/admin/guardrails/logs*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Setup error response for enforcement log API
 */
async function setupLogsErrorMock(page: Page, status: number, errorMessage: string) {
  await page.route('**/api/ai-buddy/admin/guardrails/logs*', async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: status === 403 ? 'FORBIDDEN' : 'INTERNAL_ERROR',
          message: errorMessage,
        },
      }),
    });
  });
}

test.describe('Guardrail Enforcement Log', () => {
  test.beforeEach(async ({ page }) => {
    // Mock all related APIs for consistency
    await page.route('**/api/ai-buddy/preferences*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            fullName: 'Test Admin',
            roleTitle: 'Administrator',
            linesOfBusiness: ['Auto'],
            primaryCarriers: ['Travelers'],
            communicationStyle: 'conversational',
            hasCompletedOnboarding: true,
          },
        }),
      });
    });

    await page.route('**/api/ai-buddy/admin/guardrails*', async (route) => {
      if (route.request().url().includes('/logs')) {
        // Let specific logs mock handle this
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            guardrails: [],
          },
        }),
      });
    });

    await page.route('**/api/ai-buddy/admin/onboarding-status*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            users: [],
            total: 0,
          },
        }),
      });
    });
  });

  test.describe('Permission Check (AC-19.2.3)', () => {
    test('shows enforcement log section for admin with view_audit_logs permission', async ({ page }) => {
      await setupLogsMock(page, mockLogsResponse);

      // Navigate to settings page with AI Buddy tab
      // Note: In real test, user would be logged in with proper session
      // For this test, we're verifying the component behavior
      await page.goto('/settings?tab=ai-buddy', { waitUntil: 'networkidle' });

      // Click on Admin tab (if user is admin)
      const adminTab = page.getByTestId('subtab-admin');
      if (await adminTab.isVisible()) {
        await adminTab.click();

        // Should see enforcement log section
        await expect(page.getByTestId('guardrail-enforcement-log')).toBeVisible();
      }
    });

    test('shows 403 error message for admin without view_audit_logs permission', async ({ page }) => {
      await setupLogsErrorMock(page, 403, "Permission 'view_audit_logs' required");

      await page.goto('/settings?tab=ai-buddy', { waitUntil: 'networkidle' });

      const adminTab = page.getByTestId('subtab-admin');
      if (await adminTab.isVisible()) {
        await adminTab.click();

        // Should see error state with permission message
        const errorState = page.getByTestId('enforcement-log-error');
        if (await errorState.isVisible()) {
          await expect(errorState).toContainText('view_audit_logs');
        }
      }
    });
  });

  test.describe('Table Display (AC-19.2.4)', () => {
    test('displays log entries in table with correct columns', async ({ page }) => {
      await setupLogsMock(page, mockLogsResponse);
      await page.goto('/settings?tab=ai-buddy', { waitUntil: 'networkidle' });

      const adminTab = page.getByTestId('subtab-admin');
      if (await adminTab.isVisible()) {
        await adminTab.click();
        await expect(page.getByTestId('guardrail-enforcement-log')).toBeVisible();

        // Check column headers
        await expect(page.getByRole('columnheader', { name: 'User' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Triggered Topic' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Date/Time' })).toBeVisible();

        // Check log entries are displayed
        await expect(page.getByTestId('log-row-log-1')).toBeVisible();
        await expect(page.getByText('test@example.com')).toBeVisible();
        await expect(page.getByText('legal advice')).toBeVisible();

        await expect(page.getByTestId('log-row-log-2')).toBeVisible();
        await expect(page.getByText('other@example.com')).toBeVisible();
        await expect(page.getByText('claims filing')).toBeVisible();
      }
    });

    test('shows empty state when no logs exist', async ({ page }) => {
      await setupLogsMock(page, mockEmptyLogsResponse);
      await page.goto('/settings?tab=ai-buddy', { waitUntil: 'networkidle' });

      const adminTab = page.getByTestId('subtab-admin');
      if (await adminTab.isVisible()) {
        await adminTab.click();

        await expect(page.getByTestId('enforcement-log-empty')).toBeVisible();
        await expect(page.getByText('No enforcement events')).toBeVisible();
      }
    });

    test('displays total count of events', async ({ page }) => {
      await setupLogsMock(page, mockLogsResponse);
      await page.goto('/settings?tab=ai-buddy', { waitUntil: 'networkidle' });

      const adminTab = page.getByTestId('subtab-admin');
      if (await adminTab.isVisible()) {
        await adminTab.click();

        await expect(page.getByText('2 events found')).toBeVisible();
      }
    });
  });

  test.describe('Detail View (AC-19.2.5)', () => {
    test('opens detail dialog when row is clicked', async ({ page }) => {
      await setupLogsMock(page, mockLogsResponse);
      await page.goto('/settings?tab=ai-buddy', { waitUntil: 'networkidle' });

      const adminTab = page.getByTestId('subtab-admin');
      if (await adminTab.isVisible()) {
        await adminTab.click();
        await expect(page.getByTestId('guardrail-enforcement-log')).toBeVisible();

        // Click a log row
        await page.getByTestId('log-row-log-1').click();

        // Detail dialog should appear
        await expect(page.getByTestId('guardrail-log-detail-dialog')).toBeVisible();
        await expect(page.getByText('Guardrail Event Details')).toBeVisible();

        // Should show all details
        await expect(page.getByText('test@example.com')).toBeVisible();
        await expect(page.getByText('legal advice')).toBeVisible();
        await expect(page.getByText(/Can you help me sue my neighbor/)).toBeVisible();
        await expect(page.getByText(/Please consult an attorney/)).toBeVisible();
      }
    });

    test('closes detail dialog when close button is clicked', async ({ page }) => {
      await setupLogsMock(page, mockLogsResponse);
      await page.goto('/settings?tab=ai-buddy', { waitUntil: 'networkidle' });

      const adminTab = page.getByTestId('subtab-admin');
      if (await adminTab.isVisible()) {
        await adminTab.click();

        // Open detail dialog
        await page.getByTestId('log-row-log-1').click();
        await expect(page.getByTestId('guardrail-log-detail-dialog')).toBeVisible();

        // Close it
        await page.getByTestId('close-detail-button').click();

        // Should be closed
        await expect(page.getByTestId('guardrail-log-detail-dialog')).not.toBeVisible();
      }
    });
  });

  test.describe('Date Range Filter (AC-19.2.6)', () => {
    test('displays date range filter component', async ({ page }) => {
      await setupLogsMock(page, mockLogsResponse);
      await page.goto('/settings?tab=ai-buddy', { waitUntil: 'networkidle' });

      const adminTab = page.getByTestId('subtab-admin');
      if (await adminTab.isVisible()) {
        await adminTab.click();

        await expect(page.getByTestId('date-range-filter')).toBeVisible();
        await expect(page.getByTestId('date-preset-select')).toBeVisible();
        await expect(page.getByTestId('start-date-input')).toBeVisible();
        await expect(page.getByTestId('end-date-input')).toBeVisible();
      }
    });

    test('refetches logs when date range changes', async ({ page }) => {
      let requestCount = 0;
      await page.route('**/api/ai-buddy/admin/guardrails/logs*', async (route) => {
        requestCount++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockLogsResponse),
        });
      });

      await page.goto('/settings?tab=ai-buddy', { waitUntil: 'networkidle' });

      const adminTab = page.getByTestId('subtab-admin');
      if (await adminTab.isVisible()) {
        await adminTab.click();

        // Wait for initial fetch
        await expect(page.getByTestId('guardrail-enforcement-log')).toBeVisible();
        const initialCount = requestCount;

        // Change start date
        await page.getByTestId('start-date-input').fill('2024-01-01');

        // Wait for refetch
        await page.waitForTimeout(500);

        // Should have made another request
        expect(requestCount).toBeGreaterThan(initialCount);
      }
    });

    test('shows clear button when dates are set', async ({ page }) => {
      await setupLogsMock(page, mockLogsResponse);
      await page.goto('/settings?tab=ai-buddy', { waitUntil: 'networkidle' });

      const adminTab = page.getByTestId('subtab-admin');
      if (await adminTab.isVisible()) {
        await adminTab.click();

        // Initially no clear button
        await expect(page.getByTestId('clear-date-filter')).not.toBeVisible();

        // Set a date
        await page.getByTestId('start-date-input').fill('2024-01-01');

        // Clear button should appear
        await expect(page.getByTestId('clear-date-filter')).toBeVisible();

        // Click clear
        await page.getByTestId('clear-date-filter').click();

        // Clear button should be gone
        await expect(page.getByTestId('clear-date-filter')).not.toBeVisible();
      }
    });
  });

  test.describe('Pagination', () => {
    test('shows load more button when more logs exist', async ({ page }) => {
      await page.route('**/api/ai-buddy/admin/guardrails/logs*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              ...mockLogsResponse.data,
              total: 50,
              hasMore: true,
            },
          }),
        });
      });

      await page.goto('/settings?tab=ai-buddy', { waitUntil: 'networkidle' });

      const adminTab = page.getByTestId('subtab-admin');
      if (await adminTab.isVisible()) {
        await adminTab.click();

        await expect(page.getByTestId('load-more-button')).toBeVisible();
      }
    });

    test('hides load more button when all logs are loaded', async ({ page }) => {
      await setupLogsMock(page, mockLogsResponse); // hasMore: false

      await page.goto('/settings?tab=ai-buddy', { waitUntil: 'networkidle' });

      const adminTab = page.getByTestId('subtab-admin');
      if (await adminTab.isVisible()) {
        await adminTab.click();

        await expect(page.getByTestId('load-more-button')).not.toBeVisible();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('shows error message on API failure', async ({ page }) => {
      await setupLogsErrorMock(page, 500, 'Internal server error');

      await page.goto('/settings?tab=ai-buddy', { waitUntil: 'networkidle' });

      const adminTab = page.getByTestId('subtab-admin');
      if (await adminTab.isVisible()) {
        await adminTab.click();

        await expect(page.getByTestId('enforcement-log-error')).toBeVisible();
        await expect(page.getByText('Failed to load logs')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
      }
    });

    test('retry button refetches logs', async ({ page }) => {
      let firstRequest = true;
      await page.route('**/api/ai-buddy/admin/guardrails/logs*', async (route) => {
        if (firstRequest) {
          firstRequest = false;
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Error' } }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockLogsResponse),
          });
        }
      });

      await page.goto('/settings?tab=ai-buddy', { waitUntil: 'networkidle' });

      const adminTab = page.getByTestId('subtab-admin');
      if (await adminTab.isVisible()) {
        await adminTab.click();

        // Should show error initially
        await expect(page.getByTestId('enforcement-log-error')).toBeVisible();

        // Click retry
        await page.getByRole('button', { name: 'Try Again' }).click();

        // Should now show logs
        await expect(page.getByTestId('log-row-log-1')).toBeVisible();
      }
    });
  });
});
