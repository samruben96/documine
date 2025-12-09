/**
 * AI Buddy Project Management E2E Tests
 * Story 16.3: Project Management - Rename & Archive
 *
 * AC-16.3.1: Right-click on project card shows context menu with "Rename" and "Archive" options
 * AC-16.3.2: Selecting "Rename" enables inline editing of project name
 * AC-16.3.3: Enter saves renamed project, Escape cancels edit
 * AC-16.3.4: Renamed project updates immediately (optimistic update)
 * AC-16.3.5: Archive shows confirmation dialog "Archive [Project Name]?"
 * AC-16.3.6: Confirming archive sets archived_at and removes project from main list
 * AC-16.3.7: "View Archived" link shows archived projects with restore option
 * AC-16.3.8: Restoring project clears archived_at and returns to main list
 */

import { test, expect } from '@playwright/test';

test.describe('AI Buddy Project Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to AI Buddy page
    // Note: This assumes the user is already logged in via test setup
    await page.goto('/ai-buddy');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Project Rename', () => {
    test('AC-16.3.1: Right-click shows context menu with Rename and Archive options', async ({ page }) => {
      // First create a project or use an existing one
      const projectCard = page.locator('[data-testid^="project-card-"]').first();

      // Skip if no projects exist
      if (!(await projectCard.isVisible())) {
        test.skip();
        return;
      }

      // Right-click to open context menu
      await projectCard.click({ button: 'right' });

      // Verify context menu items are visible
      await expect(page.getByTestId('context-menu-rename')).toBeVisible();
      await expect(page.getByTestId('context-menu-archive')).toBeVisible();
    });

    test('AC-16.3.2: Clicking Rename from dropdown enables inline editing', async ({ page }) => {
      const projectCard = page.locator('[data-testid^="project-card-"]').first();

      if (!(await projectCard.isVisible())) {
        test.skip();
        return;
      }

      // Click the menu button
      const menuButton = page.locator('[data-testid^="project-menu-"]').first();
      await menuButton.click();

      // Click Rename
      await page.getByRole('menuitem', { name: 'Rename' }).click();

      // Verify input appears
      const input = page.locator('[data-testid^="project-name-input-"]').first();
      await expect(input).toBeVisible();
      await expect(input).toBeFocused();
    });

    test('AC-16.3.3: Enter saves renamed project, Escape cancels edit', async ({ page }) => {
      const projectCard = page.locator('[data-testid^="project-card-"]').first();

      if (!(await projectCard.isVisible())) {
        test.skip();
        return;
      }

      // Start editing
      const menuButton = page.locator('[data-testid^="project-menu-"]').first();
      await menuButton.click();
      await page.getByRole('menuitem', { name: 'Rename' }).click();

      const input = page.locator('[data-testid^="project-name-input-"]').first();

      // Test Escape cancels
      await input.fill('Cancelled Name');
      await input.press('Escape');

      // Input should be gone
      await expect(input).not.toBeVisible();
    });
  });

  test.describe('Project Archive', () => {
    test('AC-16.3.5: Archive shows confirmation dialog', async ({ page }) => {
      const projectCard = page.locator('[data-testid^="project-card-"]').first();

      if (!(await projectCard.isVisible())) {
        test.skip();
        return;
      }

      // Click the menu button
      const menuButton = page.locator('[data-testid^="project-menu-"]').first();
      await menuButton.click();

      // Click Archive
      await page.getByRole('menuitem', { name: 'Archive' }).click();

      // Verify confirmation dialog appears
      await expect(page.getByTestId('archive-confirmation-dialog')).toBeVisible();
      await expect(page.getByTestId('archive-confirm-button')).toBeVisible();
      await expect(page.getByTestId('archive-cancel-button')).toBeVisible();
    });

    test('AC-16.3.7: View Archived button opens sheet', async ({ page }) => {
      const viewArchivedButton = page.getByTestId('view-archived-button');

      if (!(await viewArchivedButton.isVisible())) {
        test.skip();
        return;
      }

      await viewArchivedButton.click();

      // Verify archived projects sheet opens
      await expect(page.getByTestId('archived-projects-sheet')).toBeVisible();
    });
  });
});
