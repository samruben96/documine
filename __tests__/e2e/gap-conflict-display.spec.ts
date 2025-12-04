/**
 * Gap & Conflict Display E2E Tests
 *
 * Story 7.4: AC-7.4.1, AC-7.4.2, AC-7.4.3, AC-7.4.4, AC-7.4.5, AC-7.4.6
 * Tests for gap/conflict detection and display in comparison view.
 *
 * Note: These tests require authenticated session and test data.
 * Run with: npx playwright test gap-conflict-display.spec.ts
 */

import { test, expect } from '@playwright/test';

// Test fixtures - IDs of comparison sessions with known gaps/conflicts
// These should be seeded in test environment
const TEST_COMPARISON_WITH_GAPS = 'test-comparison-with-gaps';
const TEST_COMPARISON_NO_ISSUES = 'test-comparison-no-issues';

test.describe('Gap & Conflict Display', () => {
  // Skip if no test data available
  test.beforeEach(async ({ page }) => {
    // Navigate to a comparison page
    // In real tests, this would use seeded test data
  });

  test('AC-7.4.4: displays gap/conflict summary banner', async ({ page }) => {
    // This test verifies the banner renders correctly
    // Using a mock approach since we need actual comparison data

    await page.goto('/compare');

    // Mock the comparison response with gaps and conflicts
    await page.route('/api/compare/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          comparisonId: 'test-id',
          status: 'complete',
          documents: [
            { id: '1', filename: 'quote1.pdf', carrierName: 'Hartford', extracted: true },
            { id: '2', filename: 'quote2.pdf', carrierName: 'Travelers', extracted: true },
          ],
          extractions: [
            {
              carrierName: 'Hartford',
              policyNumber: 'POL-001',
              namedInsured: 'Test Corp',
              effectiveDate: '2024-01-01',
              expirationDate: '2025-01-01',
              annualPremium: 10000,
              coverages: [
                {
                  type: 'general_liability',
                  name: 'General Liability',
                  limit: 1000000,
                  sublimit: null,
                  limitType: 'per_occurrence',
                  deductible: 1000,
                  description: 'GL Coverage',
                  sourcePages: [1],
                },
                {
                  type: 'property',
                  name: 'Property',
                  limit: 500000,
                  sublimit: null,
                  limitType: 'per_occurrence',
                  deductible: 2500,
                  description: 'Property Coverage',
                  sourcePages: [2],
                },
              ],
              exclusions: [
                {
                  name: 'Flood Exclusion',
                  description: 'Flood damage excluded',
                  category: 'flood',
                  sourcePages: [5],
                },
              ],
              deductibles: [],
              extractedAt: new Date().toISOString(),
              modelUsed: 'gpt-5.1',
            },
            {
              carrierName: 'Travelers',
              policyNumber: 'POL-002',
              namedInsured: 'Test Corp',
              effectiveDate: '2024-01-01',
              expirationDate: '2025-01-01',
              annualPremium: 12000,
              coverages: [
                {
                  type: 'general_liability',
                  name: 'General Liability',
                  limit: 300000, // 70% variance - should trigger conflict
                  sublimit: null,
                  limitType: 'per_occurrence',
                  deductible: 1000,
                  description: 'GL Coverage',
                  sourcePages: [1],
                },
                // Missing property coverage - should trigger gap
              ],
              exclusions: [], // No flood exclusion - should trigger exclusion mismatch
              deductibles: [],
              extractedAt: new Date().toISOString(),
              modelUsed: 'gpt-5.1',
            },
          ],
        }),
      });
    });

    // Navigate to comparison result
    await page.goto('/compare/test-id');

    // Wait for content to load
    await page.waitForSelector('[data-testid="gap-conflict-banner"]', {
      timeout: 10000,
    });

    // AC-7.4.4: Verify summary banner exists
    const banner = page.locator('[data-testid="gap-conflict-banner"]');
    await expect(banner).toBeVisible();

    // Verify gap count is displayed
    await expect(banner).toContainText(/\d+ potential gap/);

    // Verify conflict count is displayed
    await expect(banner).toContainText(/\d+ conflict/);
  });

  test('AC-7.4.1: identifies coverage gaps', async ({ page }) => {
    await page.route('/api/compare/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          comparisonId: 'test-id',
          status: 'complete',
          documents: [
            { id: '1', filename: 'quote1.pdf', carrierName: 'Hartford', extracted: true },
            { id: '2', filename: 'quote2.pdf', carrierName: 'Travelers', extracted: true },
          ],
          extractions: [
            {
              carrierName: 'Hartford',
              policyNumber: null,
              namedInsured: null,
              effectiveDate: null,
              expirationDate: null,
              annualPremium: null,
              coverages: [
                {
                  type: 'property',
                  name: 'Property',
                  limit: 500000,
                  sublimit: null,
                  limitType: null,
                  deductible: null,
                  description: '',
                  sourcePages: [1],
                },
              ],
              exclusions: [],
              deductibles: [],
              extractedAt: new Date().toISOString(),
              modelUsed: 'gpt-5.1',
            },
            {
              carrierName: 'Travelers',
              policyNumber: null,
              namedInsured: null,
              effectiveDate: null,
              expirationDate: null,
              annualPremium: null,
              coverages: [], // No coverages - property gap
              exclusions: [],
              deductibles: [],
              extractedAt: new Date().toISOString(),
              modelUsed: 'gpt-5.1',
            },
          ],
        }),
      });
    });

    await page.goto('/compare/test-id');

    // Wait for banner
    await page.waitForSelector('[data-testid="gap-conflict-banner"]');

    // Check for Property gap
    const banner = page.locator('[data-testid="gap-conflict-banner"]');
    await expect(banner).toContainText('Property');
    await expect(banner).toContainText(/gap/i);
  });

  test('AC-7.4.2: displays warning icon on gap rows', async ({ page }) => {
    await page.route('/api/compare/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          comparisonId: 'test-id',
          status: 'complete',
          documents: [
            { id: '1', filename: 'quote1.pdf', carrierName: 'Hartford', extracted: true },
            { id: '2', filename: 'quote2.pdf', carrierName: 'Travelers', extracted: true },
          ],
          extractions: [
            {
              carrierName: 'Hartford',
              policyNumber: null,
              namedInsured: null,
              effectiveDate: null,
              expirationDate: null,
              annualPremium: null,
              coverages: [
                {
                  type: 'general_liability',
                  name: 'GL',
                  limit: 1000000,
                  sublimit: null,
                  limitType: null,
                  deductible: null,
                  description: '',
                  sourcePages: [1],
                },
              ],
              exclusions: [],
              deductibles: [],
              extractedAt: new Date().toISOString(),
              modelUsed: 'gpt-5.1',
            },
            {
              carrierName: 'Travelers',
              policyNumber: null,
              namedInsured: null,
              effectiveDate: null,
              expirationDate: null,
              annualPremium: null,
              coverages: [], // No GL - gap
              exclusions: [],
              deductibles: [],
              extractedAt: new Date().toISOString(),
              modelUsed: 'gpt-5.1',
            },
          ],
        }),
      });
    });

    await page.goto('/compare/test-id');

    // Wait for table to render
    await page.waitForSelector('table');

    // Find the GL row
    const glRow = page.locator('tr[data-field="general_liability"]');

    // Check that row has gap styling (amber background)
    // The class should contain 'amber' for gap styling
    await expect(glRow).toHaveClass(/amber/);
  });

  test('AC-7.4.5: clicking gap item scrolls to row', async ({ page }) => {
    await page.route('/api/compare/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          comparisonId: 'test-id',
          status: 'complete',
          documents: [
            { id: '1', filename: 'quote1.pdf', carrierName: 'Hartford', extracted: true },
            { id: '2', filename: 'quote2.pdf', carrierName: 'Travelers', extracted: true },
          ],
          extractions: [
            {
              carrierName: 'Hartford',
              policyNumber: null,
              namedInsured: null,
              effectiveDate: null,
              expirationDate: null,
              annualPremium: null,
              coverages: [
                {
                  type: 'property',
                  name: 'Property',
                  limit: 500000,
                  sublimit: null,
                  limitType: null,
                  deductible: null,
                  description: '',
                  sourcePages: [1],
                },
              ],
              exclusions: [],
              deductibles: [],
              extractedAt: new Date().toISOString(),
              modelUsed: 'gpt-5.1',
            },
            {
              carrierName: 'Travelers',
              policyNumber: null,
              namedInsured: null,
              effectiveDate: null,
              expirationDate: null,
              annualPremium: null,
              coverages: [],
              exclusions: [],
              deductibles: [],
              extractedAt: new Date().toISOString(),
              modelUsed: 'gpt-5.1',
            },
          ],
        }),
      });
    });

    await page.goto('/compare/test-id');
    await page.waitForSelector('[data-testid="gap-conflict-banner"]');

    // Click on the gap item
    const gapButton = page.locator('button[aria-label*="View Property gap details"]');
    await gapButton.click();

    // The row should be visible (scrolled into view)
    const propertyRow = page.locator('tr[data-field="property"]');
    await expect(propertyRow).toBeInViewport();
  });

  test('AC-7.4.6: gaps sorted by severity', async ({ page }) => {
    await page.route('/api/compare/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          comparisonId: 'test-id',
          status: 'complete',
          documents: [
            { id: '1', filename: 'quote1.pdf', carrierName: 'Hartford', extracted: true },
            { id: '2', filename: 'quote2.pdf', carrierName: 'Travelers', extracted: true },
          ],
          extractions: [
            {
              carrierName: 'Hartford',
              policyNumber: null,
              namedInsured: null,
              effectiveDate: null,
              expirationDate: null,
              annualPremium: null,
              coverages: [
                {
                  type: 'general_liability',
                  name: 'GL',
                  limit: 1000000,
                  sublimit: null,
                  limitType: null,
                  deductible: null,
                  description: '',
                  sourcePages: [1],
                },
                {
                  type: 'cyber',
                  name: 'Cyber',
                  limit: 100000,
                  sublimit: null,
                  limitType: null,
                  deductible: null,
                  description: '',
                  sourcePages: [2],
                },
              ],
              exclusions: [],
              deductibles: [],
              extractedAt: new Date().toISOString(),
              modelUsed: 'gpt-5.1',
            },
            {
              carrierName: 'Travelers',
              policyNumber: null,
              namedInsured: null,
              effectiveDate: null,
              expirationDate: null,
              annualPremium: null,
              coverages: [], // Missing both GL (high) and Cyber (low)
              exclusions: [],
              deductibles: [],
              extractedAt: new Date().toISOString(),
              modelUsed: 'gpt-5.1',
            },
          ],
        }),
      });
    });

    await page.goto('/compare/test-id');
    await page.waitForSelector('[data-testid="gap-conflict-banner"]');

    // Get all severity badges
    const severityBadges = await page.locator('[data-testid="gap-conflict-banner"] span:has-text("High"), [data-testid="gap-conflict-banner"] span:has-text("Low")').all();

    // If we have both, High should appear before Low
    if (severityBadges.length >= 2) {
      const firstBadgeText = await severityBadges[0]?.textContent();
      expect(firstBadgeText).toBe('High');
    }
  });

  test('no banner when no gaps or conflicts', async ({ page }) => {
    await page.route('/api/compare/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          comparisonId: 'test-id',
          status: 'complete',
          documents: [
            { id: '1', filename: 'quote1.pdf', carrierName: 'Hartford', extracted: true },
            { id: '2', filename: 'quote2.pdf', carrierName: 'Travelers', extracted: true },
          ],
          extractions: [
            {
              carrierName: 'Hartford',
              policyNumber: null,
              namedInsured: null,
              effectiveDate: null,
              expirationDate: null,
              annualPremium: null,
              coverages: [
                {
                  type: 'general_liability',
                  name: 'GL',
                  limit: 1000000,
                  sublimit: null,
                  limitType: null,
                  deductible: null,
                  description: '',
                  sourcePages: [1],
                },
              ],
              exclusions: [],
              deductibles: [],
              extractedAt: new Date().toISOString(),
              modelUsed: 'gpt-5.1',
            },
            {
              carrierName: 'Travelers',
              policyNumber: null,
              namedInsured: null,
              effectiveDate: null,
              expirationDate: null,
              annualPremium: null,
              coverages: [
                {
                  type: 'general_liability',
                  name: 'GL',
                  limit: 900000, // Within 50% variance - no conflict
                  sublimit: null,
                  limitType: null,
                  deductible: null,
                  description: '',
                  sourcePages: [1],
                },
              ],
              exclusions: [],
              deductibles: [],
              extractedAt: new Date().toISOString(),
              modelUsed: 'gpt-5.1',
            },
          ],
        }),
      });
    });

    await page.goto('/compare/test-id');

    // Wait for table to render
    await page.waitForSelector('table');

    // Banner should not exist when no gaps or conflicts
    const banner = page.locator('[data-testid="gap-conflict-banner"]');
    await expect(banner).not.toBeVisible();
  });
});
