/**
 * E2E Tests: AI Buddy Projects
 * Story 16.1: Project Creation & Sidebar
 *
 * End-to-end tests for project creation and sidebar functionality.
 *
 * AC-16.1.1: Click New Project opens dialog
 * AC-16.1.5: New project appears in sidebar immediately
 * AC-16.1.11: Clicking project switches context
 * AC-16.1.14: Mobile sidebar in Sheet
 */

import { test, expect } from '@playwright/test';

test.describe('AI Buddy Projects', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to AI Buddy page (assumes user is logged in via auth setup)
    await page.goto('/ai-buddy');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Project Creation Dialog', () => {
    test('AC-16.1.1: New Project button opens dialog', async ({ page }) => {
      // Click the New Project button in sidebar
      await page.getByTestId('new-project-button').click();

      // Dialog should be visible
      await expect(page.getByTestId('project-create-dialog')).toBeVisible();
      await expect(page.getByTestId('project-name-input')).toBeVisible();
      await expect(page.getByTestId('project-description-input')).toBeVisible();
    });

    test('AC-16.1.6: Shows error when name is empty', async ({ page }) => {
      await page.getByTestId('new-project-button').click();

      // Submit button should be disabled when name is empty
      await expect(page.getByTestId('project-create-submit')).toBeDisabled();
    });

    test('AC-16.1.4, AC-16.1.5: Create project flow', async ({ page }) => {
      await page.getByTestId('new-project-button').click();

      // Fill in project details
      await page.getByTestId('project-name-input').fill('E2E Test Project');
      await page.getByTestId('project-description-input').fill('Test description');

      // Submit
      await page.getByTestId('project-create-submit').click();

      // Wait for dialog to close
      await expect(page.getByTestId('project-create-dialog')).not.toBeVisible();

      // Project should appear in sidebar (optimistic update)
      await expect(page.getByText('E2E Test Project')).toBeVisible();
    });
  });

  test.describe('Project Sidebar', () => {
    test('AC-16.1.8: Shows Projects section', async ({ page }) => {
      await expect(page.getByText('Projects')).toBeVisible();
    });

    test('AC-16.1.13: Shows empty state when no projects', async ({ page }) => {
      // If no projects, empty state should show
      // This test assumes a fresh user with no projects
      const emptyState = page.getByTestId('projects-empty-state');
      const projectCards = page.locator('[data-testid^="project-card-"]');

      // Either empty state shows or there are project cards
      const hasProjects = await projectCards.count() > 0;
      if (!hasProjects) {
        await expect(emptyState).toBeVisible();
        await expect(page.getByText('Create your first project')).toBeVisible();
      }
    });

    test('AC-16.1.11: Clicking project selects it', async ({ page }) => {
      // First create a project
      await page.getByTestId('new-project-button').click();
      await page.getByTestId('project-name-input').fill('Select Test Project');
      await page.getByTestId('project-create-submit').click();

      // Wait for dialog to close
      await expect(page.getByTestId('project-create-dialog')).not.toBeVisible();

      // Find and click the project
      const projectCard = page.locator('[data-testid^="project-card-"]').first();
      await projectCard.click();

      // Should have active class
      await expect(projectCard).toHaveClass(/bg-\[var\(--sidebar-active\)\]/);
    });
  });

  test.describe('Mobile Sidebar', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

    test('AC-16.1.14: Mobile hamburger opens sidebar sheet', async ({ page }) => {
      // On mobile, sidebar should be hidden initially
      const sidebar = page.locator('aside');

      // Click hamburger menu
      await page.getByTestId('mobile-menu-button').click();

      // Sheet should be visible with sidebar content
      await expect(page.getByText('Projects')).toBeVisible();
      await expect(page.getByTestId('new-chat-button')).toBeVisible();
    });
  });

  test.describe('Integration', () => {
    test('New Chat button works', async ({ page }) => {
      await page.getByTestId('new-chat-button').click();

      // Should show welcome screen (no active conversation)
      await expect(page.getByText('Welcome to AI Buddy')).toBeVisible();
    });
  });
});
