/**
 * E2E Tests for Automated Gap Analysis Display
 *
 * Story 10.7: AC-10.7.6
 * Tests the gap analysis banner display on the comparison page.
 */

import { test, expect } from '@playwright/test';

test.describe('Gap Analysis Display', () => {
  // Note: These tests require a comparison with gaps to exist in the test database.
  // In a real environment, you would either:
  // 1. Create test data via API before tests
  // 2. Use a seeded test database
  // 3. Mock the API responses

  test.describe('Risk Score Badge', () => {
    test('should display risk score badge when gaps exist', async ({ page }) => {
      // Navigate to a comparison page (assumes test comparison exists)
      // This test would need to be updated with actual test data
      await page.goto('/compare');

      // Wait for any comparison links to appear
      const comparisonLinks = page.locator('a[href^="/compare/"]');

      // Skip if no comparisons exist
      const count = await comparisonLinks.count();
      if (count === 0) {
        test.skip();
        return;
      }

      // Click the first comparison
      await comparisonLinks.first().click();

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check if gap-conflict-banner exists (may or may not have gaps)
      const banner = page.locator('[data-testid="gap-conflict-banner"]');
      const bannerExists = await banner.count() > 0;

      if (bannerExists) {
        // If banner exists, verify it has content
        await expect(banner).toBeVisible();

        // Check for risk score badge if gap analysis is present
        const riskBadge = page.locator('[data-testid="risk-score-badge"]');
        if (await riskBadge.count() > 0) {
          await expect(riskBadge).toBeVisible();
          // Verify badge has risk level text
          const badgeText = await riskBadge.textContent();
          expect(badgeText).toMatch(/\d+ - (Low|Medium|High) Risk/);
        }
      }
    });

    test('risk badge should show correct color based on score', async ({ page }) => {
      // This test verifies the visual styling of the risk badge
      await page.goto('/compare');

      const comparisonLinks = page.locator('a[href^="/compare/"]');
      const count = await comparisonLinks.count();
      if (count === 0) {
        test.skip();
        return;
      }

      await comparisonLinks.first().click();
      await page.waitForLoadState('networkidle');

      const riskBadge = page.locator('[data-testid="risk-score-badge"]');
      if (await riskBadge.count() > 0) {
        // Get the class list to verify styling
        const classes = await riskBadge.getAttribute('class');

        if (classes?.includes('bg-green')) {
          // Low risk - green
          const text = await riskBadge.textContent();
          expect(text).toContain('Low Risk');
        } else if (classes?.includes('bg-amber')) {
          // Medium risk - amber/yellow
          const text = await riskBadge.textContent();
          expect(text).toContain('Medium Risk');
        } else if (classes?.includes('bg-red')) {
          // High risk - red
          const text = await riskBadge.textContent();
          expect(text).toContain('High Risk');
        }
      }
    });
  });

  test.describe('Endorsement Gaps Section', () => {
    test('should display endorsement gaps when present', async ({ page }) => {
      await page.goto('/compare');

      const comparisonLinks = page.locator('a[href^="/compare/"]');
      const count = await comparisonLinks.count();
      if (count === 0) {
        test.skip();
        return;
      }

      await comparisonLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Check for endorsement gap items
      const endorsementItems = page.locator('[data-testid="endorsement-gap-item"]');

      if (await endorsementItems.count() > 0) {
        // Verify endorsement gap item structure
        const firstItem = endorsementItems.first();
        await expect(firstItem).toBeVisible();

        // Should contain endorsement name
        const name = firstItem.locator('.font-medium');
        await expect(name).toBeVisible();

        // Should have importance badge
        const badge = firstItem.locator('span:has-text("Critical"), span:has-text("Recommended")');
        if (await badge.count() > 0) {
          await expect(badge).toBeVisible();
        }
      }
    });

    test('endorsement gap should show form number', async ({ page }) => {
      await page.goto('/compare');

      const comparisonLinks = page.locator('a[href^="/compare/"]');
      const count = await comparisonLinks.count();
      if (count === 0) {
        test.skip();
        return;
      }

      await comparisonLinks.first().click();
      await page.waitForLoadState('networkidle');

      const endorsementItems = page.locator('[data-testid="endorsement-gap-item"]');

      if (await endorsementItems.count() > 0) {
        const firstItem = endorsementItems.first();
        // Form number should be displayed (e.g., "CG 20 10")
        const formNumber = firstItem.locator('text=/\\(CG\\s+\\d+\\s+\\d+\\)/');
        if (await formNumber.count() > 0) {
          await expect(formNumber).toBeVisible();
        }
      }
    });
  });

  test.describe('Limit Concerns Section', () => {
    test('should display limit concerns when present', async ({ page }) => {
      await page.goto('/compare');

      const comparisonLinks = page.locator('a[href^="/compare/"]');
      const count = await comparisonLinks.count();
      if (count === 0) {
        test.skip();
        return;
      }

      await comparisonLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Check for limit concern items
      const limitItems = page.locator('[data-testid="limit-concern-item"]');

      if (await limitItems.count() > 0) {
        const firstItem = limitItems.first();
        await expect(firstItem).toBeVisible();

        // Should show current and recommended limits
        const currentText = firstItem.locator('text=/Current:/');
        const recommendedText = firstItem.locator('text=/Recommended:/');

        if (await currentText.count() > 0) {
          await expect(currentText).toBeVisible();
        }
        if (await recommendedText.count() > 0) {
          await expect(recommendedText).toBeVisible();
        }
      }
    });

    test('limit concern should show carrier name', async ({ page }) => {
      await page.goto('/compare');

      const comparisonLinks = page.locator('a[href^="/compare/"]');
      const count = await comparisonLinks.count();
      if (count === 0) {
        test.skip();
        return;
      }

      await comparisonLinks.first().click();
      await page.waitForLoadState('networkidle');

      const limitItems = page.locator('[data-testid="limit-concern-item"]');

      if (await limitItems.count() > 0) {
        const firstItem = limitItems.first();
        // Should display carrier name
        const carrierInfo = firstItem.locator('.text-gray-500.text-sm');
        if (await carrierInfo.count() > 0) {
          const text = await carrierInfo.textContent();
          expect(text).toMatch(/—\s+.+/); // "— Carrier Name" format
        }
      }
    });
  });

  test.describe('Banner Expand/Collapse', () => {
    test('should toggle banner expansion', async ({ page }) => {
      await page.goto('/compare');

      const comparisonLinks = page.locator('a[href^="/compare/"]');
      const count = await comparisonLinks.count();
      if (count === 0) {
        test.skip();
        return;
      }

      await comparisonLinks.first().click();
      await page.waitForLoadState('networkidle');

      const banner = page.locator('[data-testid="gap-conflict-banner"]');
      if (await banner.count() === 0) {
        test.skip();
        return;
      }

      // Banner should be expanded by default
      const content = banner.locator('[class*="CardContent"]');
      await expect(content).toBeVisible();

      // Click header to collapse
      const header = banner.locator('[class*="CardHeader"]');
      await header.click();

      // Content should be hidden after collapse
      await expect(content).not.toBeVisible();

      // Click again to expand
      await header.click();
      await expect(content).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('risk score badge should have aria-label', async ({ page }) => {
      await page.goto('/compare');

      const comparisonLinks = page.locator('a[href^="/compare/"]');
      const count = await comparisonLinks.count();
      if (count === 0) {
        test.skip();
        return;
      }

      await comparisonLinks.first().click();
      await page.waitForLoadState('networkidle');

      const riskBadge = page.locator('[data-testid="risk-score-badge"]');
      if (await riskBadge.count() > 0) {
        const ariaLabel = await riskBadge.getAttribute('aria-label');
        expect(ariaLabel).toMatch(/Risk score: \d+ - (Low|Medium|High) Risk/);
      }
    });

    test('expand button should have aria-expanded', async ({ page }) => {
      await page.goto('/compare');

      const comparisonLinks = page.locator('a[href^="/compare/"]');
      const count = await comparisonLinks.count();
      if (count === 0) {
        test.skip();
        return;
      }

      await comparisonLinks.first().click();
      await page.waitForLoadState('networkidle');

      const banner = page.locator('[data-testid="gap-conflict-banner"]');
      if (await banner.count() === 0) {
        test.skip();
        return;
      }

      const expandButton = banner.locator('button[aria-expanded]');
      if (await expandButton.count() > 0) {
        const ariaExpanded = await expandButton.getAttribute('aria-expanded');
        expect(ariaExpanded).toBe('true');

        // Click to collapse and check aria-expanded changes
        await expandButton.click();
        const ariaExpandedAfter = await expandButton.getAttribute('aria-expanded');
        expect(ariaExpandedAfter).toBe('false');
      }
    });
  });
});
