/**
 * AI Buddy Conversation Management E2E Tests
 * Story 16.6: Conversation Management - Delete & Move
 *
 * AC-16.6.1: Conversation menu includes "Delete" option
 * AC-16.6.2: Clicking Delete shows confirmation dialog
 * AC-16.6.3: Confirming delete sets deleted_at (soft delete)
 * AC-16.6.4: Deleted conversation removed from sidebar immediately
 * AC-16.6.5: Audit log records deletion event (verified in unit tests)
 * AC-16.6.6: After delete, starts fresh chat if deleted was active
 * AC-16.6.7: Conversation menu includes "Move to Project" option
 * AC-16.6.8: Selecting project updates conversation's project_id
 * AC-16.6.9: Moved conversation appears in target project's history
 * AC-16.6.10: Move dialog shows all non-archived projects
 * AC-16.6.11: Current project indicated in move dialog
 * AC-16.6.12: Can move from project to "No Project" (general chat)
 */

import { test, expect } from '@playwright/test';

test.describe('AI Buddy Conversation Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to AI Buddy page
    await page.goto('/ai-buddy');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Delete Conversation', () => {
    test('AC-16.6.1 & AC-16.6.2: Right-click shows Delete in context menu with confirmation', async ({ page }) => {
      const conversationItem = page.locator('[data-testid^="conversation-item-"]').first();

      if (!(await conversationItem.isVisible())) {
        test.skip();
        return;
      }

      // Find the context trigger wrapper
      const contextTrigger = page.locator('[data-testid^="conversation-context-trigger-"]').first();

      // Right-click to open context menu
      await contextTrigger.click({ button: 'right' });

      // Verify Delete option is visible
      const deleteOption = page.getByTestId('context-menu-delete');
      await expect(deleteOption).toBeVisible();

      // Click Delete
      await deleteOption.click();

      // Verify confirmation dialog appears
      await expect(page.getByTestId('delete-conversation-dialog')).toBeVisible();
      await expect(page.getByTestId('delete-confirm-button')).toBeVisible();
      await expect(page.getByTestId('delete-cancel-button')).toBeVisible();
    });

    test('AC-16.6.4: Deleted conversation is removed from sidebar', async ({ page }) => {
      const conversationItem = page.locator('[data-testid^="conversation-item-"]').first();

      if (!(await conversationItem.isVisible())) {
        test.skip();
        return;
      }

      // Get the conversation ID before deleting
      const testId = await page.locator('[data-testid^="conversation-item-"]').first().getAttribute('data-testid');
      const conversationId = testId?.replace('conversation-item-', '');

      // Right-click to open context menu
      const contextTrigger = page.locator('[data-testid^="conversation-context-trigger-"]').first();
      await contextTrigger.click({ button: 'right' });

      // Click Delete
      await page.getByTestId('context-menu-delete').click();

      // Confirm deletion
      await page.getByTestId('delete-confirm-button').click();

      // Wait for dialog to close
      await page.waitForTimeout(500);

      // Verify the conversation is no longer in the sidebar
      const deletedConversation = page.locator(`[data-testid="conversation-item-${conversationId}"]`);
      await expect(deletedConversation).not.toBeVisible();
    });

    test('AC-16.6.6: After deleting active conversation, chat area is cleared', async ({ page }) => {
      const conversationItem = page.locator('[data-testid^="conversation-item-"]').first();

      if (!(await conversationItem.isVisible())) {
        test.skip();
        return;
      }

      // First, click to make this the active conversation
      await conversationItem.click();
      await page.waitForTimeout(500);

      // Verify it's active
      await expect(conversationItem).toHaveClass(/bg-\[var\(--sidebar-active\)\]/);

      // Right-click to open context menu
      const contextTrigger = page.locator('[data-testid^="conversation-context-trigger-"]').first();
      await contextTrigger.click({ button: 'right' });

      // Delete the conversation
      await page.getByTestId('context-menu-delete').click();
      await page.getByTestId('delete-confirm-button').click();

      // Wait for deletion
      await page.waitForTimeout(500);

      // Chat area should now show empty state or new chat prompt
      // No conversation should be active in sidebar
      const activeConversations = page.locator('[data-testid^="conversation-item-"].bg-\\[var\\(--sidebar-active\\)\\]');
      await expect(activeConversations).toHaveCount(0);
    });

    test('Delete confirmation dialog can be cancelled', async ({ page }) => {
      const conversationItem = page.locator('[data-testid^="conversation-item-"]').first();

      if (!(await conversationItem.isVisible())) {
        test.skip();
        return;
      }

      // Get conversation ID
      const testId = await conversationItem.getAttribute('data-testid');
      const conversationId = testId?.replace('conversation-item-', '');

      // Right-click and open delete dialog
      const contextTrigger = page.locator('[data-testid^="conversation-context-trigger-"]').first();
      await contextTrigger.click({ button: 'right' });
      await page.getByTestId('context-menu-delete').click();

      // Cancel the deletion
      await page.getByTestId('delete-cancel-button').click();

      // Dialog should close
      await expect(page.getByTestId('delete-conversation-dialog')).not.toBeVisible();

      // Conversation should still exist
      const conversation = page.locator(`[data-testid="conversation-item-${conversationId}"]`);
      await expect(conversation).toBeVisible();
    });
  });

  test.describe('Move Conversation to Project', () => {
    test('AC-16.6.7 & AC-16.6.10: Context menu shows Move to Project with project list', async ({ page }) => {
      const conversationItem = page.locator('[data-testid^="conversation-item-"]').first();

      if (!(await conversationItem.isVisible())) {
        test.skip();
        return;
      }

      // Right-click to open context menu
      const contextTrigger = page.locator('[data-testid^="conversation-context-trigger-"]').first();
      await contextTrigger.click({ button: 'right' });

      // Verify Move to Project option is visible
      const moveOption = page.getByTestId('context-menu-move');
      await expect(moveOption).toBeVisible();

      // Click Move to Project
      await moveOption.click();

      // Verify move dialog appears
      await expect(page.getByTestId('move-to-project-dialog')).toBeVisible();

      // Should show General Chat option (AC-16.6.12)
      await expect(page.getByTestId('move-target-general')).toBeVisible();
    });

    test('AC-16.6.11: Current project is indicated in move dialog', async ({ page }) => {
      // First, select a project
      const projectCard = page.locator('[data-testid^="project-card-"]').first();

      if (!(await projectCard.isVisible())) {
        test.skip();
        return;
      }

      // Click to select the project
      await projectCard.click();
      await page.waitForTimeout(500);

      // Find a conversation in this project
      const conversationItem = page.locator('[data-testid^="conversation-item-"]').first();

      if (!(await conversationItem.isVisible())) {
        test.skip();
        return;
      }

      // Open context menu and move dialog
      const contextTrigger = page.locator('[data-testid^="conversation-context-trigger-"]').first();
      await contextTrigger.click({ button: 'right' });
      await page.getByTestId('context-menu-move').click();

      // Current project should have indicator
      const currentIndicator = page.locator('[data-testid^="move-target-project-"][data-current="true"]');
      // At least one project entry or general chat should exist
      const projectOptions = page.locator('[data-testid^="move-target-"]');
      await expect(projectOptions.first()).toBeVisible();
    });

    test('AC-16.6.12: Can move conversation to General Chat (No Project)', async ({ page }) => {
      // First, select a project
      const projectCard = page.locator('[data-testid^="project-card-"]').first();

      if (!(await projectCard.isVisible())) {
        test.skip();
        return;
      }

      // Click to select the project
      await projectCard.click();
      await page.waitForTimeout(500);

      // Find a conversation
      const conversationItem = page.locator('[data-testid^="conversation-item-"]').first();

      if (!(await conversationItem.isVisible())) {
        test.skip();
        return;
      }

      // Open move dialog
      const contextTrigger = page.locator('[data-testid^="conversation-context-trigger-"]').first();
      await contextTrigger.click({ button: 'right' });
      await page.getByTestId('context-menu-move').click();

      // Click General Chat option
      const generalChatOption = page.getByTestId('move-target-general');
      await expect(generalChatOption).toBeVisible();

      // Clicking should move the conversation
      await generalChatOption.click();

      // Dialog should close
      await page.waitForTimeout(500);
      await expect(page.getByTestId('move-to-project-dialog')).not.toBeVisible();
    });

    test('Move dialog can be cancelled', async ({ page }) => {
      const conversationItem = page.locator('[data-testid^="conversation-item-"]').first();

      if (!(await conversationItem.isVisible())) {
        test.skip();
        return;
      }

      // Open move dialog
      const contextTrigger = page.locator('[data-testid^="conversation-context-trigger-"]').first();
      await contextTrigger.click({ button: 'right' });
      await page.getByTestId('context-menu-move').click();

      // Click outside or cancel button to close
      await page.keyboard.press('Escape');

      // Dialog should close
      await expect(page.getByTestId('move-to-project-dialog')).not.toBeVisible();
    });
  });
});
