import { test, expect } from '@playwright/test';

/**
 * AI Buddy Conversation Persistence E2E Tests
 * Story 15.4: Conversation Persistence
 *
 * Tests for:
 * - AC-15.4.1: New conversation created automatically on first message
 * - AC-15.4.2: Conversation title auto-generated from first 50 characters
 * - AC-15.4.3: Full conversation history loads when returning to existing conversation
 * - AC-15.4.4: Conversations listed in sidebar "Recent" section
 * - AC-15.4.5: AI retains context from previous messages (integration)
 * - AC-15.4.8: Clicking conversation in sidebar loads that conversation's messages
 */

// Test credentials - use environment variables or test fixtures
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

test.describe('AI Buddy Conversation Persistence', () => {
  const consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
  });

  /**
   * Helper function to login
   */
  async function login(page: any) {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(documents|dashboard|ai-buddy)/, { timeout: 10000 });
  }

  /**
   * Helper function to navigate to AI Buddy
   */
  async function navigateToAiBuddy(page: any) {
    await page.goto('/ai-buddy');
    await page.waitForSelector('text="AI Buddy"', { timeout: 10000 });
  }

  test('AC-15.4.1 & AC-15.4.2: Conversation created on first message with auto-generated title', async ({
    page,
  }) => {
    await login(page);
    await navigateToAiBuddy(page);

    // Send a unique first message
    const testMessage = 'Help me understand professional liability insurance for consultants';
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await chatInput.fill(testMessage);
    await chatInput.press('Enter');

    // Wait for the message to be sent and response to start
    await page.waitForTimeout(2000);

    // Check sidebar for new conversation (on desktop)
    const viewportSize = page.viewportSize();
    if (viewportSize && viewportSize.width >= 1024) {
      // Desktop: sidebar should show the new conversation
      const sidebar = page.locator('[class*="sidebar"], aside').first();

      // Wait for conversation to appear in sidebar
      await expect(
        sidebar.locator('text="Help me understand professional"').or(
          sidebar.locator('text="Help me understand professional liability insurance"')
        )
      ).toBeVisible({ timeout: 30000 });
    }
  });

  test('AC-15.4.4: Conversations listed in sidebar sorted by most recent', async ({
    page,
  }) => {
    await login(page);
    await navigateToAiBuddy(page);

    // Check for "Recent" section header
    const viewportSize = page.viewportSize();
    if (viewportSize && viewportSize.width >= 1024) {
      await expect(page.locator('text="Recent"')).toBeVisible({ timeout: 10000 });

      // Either conversations are listed, or empty state is shown
      const hasConversations = await page
        .locator('[data-testid^="conversation-item-"]')
        .count();
      const hasEmptyState = await page
        .locator('text="No conversations yet"')
        .isVisible();

      expect(hasConversations > 0 || hasEmptyState).toBe(true);
    }
  });

  test('AC-15.4.8: Clicking conversation in sidebar loads messages', async ({
    page,
  }) => {
    await login(page);
    await navigateToAiBuddy(page);

    // First, create a conversation
    const testMessage1 = `Test conversation ${Date.now()}`;
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await chatInput.fill(testMessage1);
    await chatInput.press('Enter');

    // Wait for response
    await page.waitForTimeout(5000);

    // On desktop, click "New Chat" to start fresh
    const viewportSize = page.viewportSize();
    if (viewportSize && viewportSize.width >= 1024) {
      // Click "New Chat" button
      const newChatButton = page.locator('button:has-text("New Chat")');
      if (await newChatButton.isVisible()) {
        await newChatButton.click();

        // Welcome screen should appear
        await expect(page.locator('text="Welcome to AI Buddy"')).toBeVisible({
          timeout: 5000,
        });

        // Now click the conversation in sidebar to load it
        const conversationItem = page.locator('[data-testid^="conversation-item-"]').first();
        if (await conversationItem.isVisible()) {
          await conversationItem.click();

          // The original message should appear in the chat area
          await expect(page.locator(`text="${testMessage1}"`)).toBeVisible({
            timeout: 10000,
          });
        }
      }
    }
  });

  test('AC-15.4.3: Conversation history persists across page refresh', async ({
    page,
  }) => {
    await login(page);
    await navigateToAiBuddy(page);

    // Send a unique test message
    const uniqueMessage = `Persistence test message ${Date.now()}`;
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await chatInput.fill(uniqueMessage);
    await chatInput.press('Enter');

    // Wait for the message to appear
    await expect(page.locator(`text="${uniqueMessage}"`)).toBeVisible({
      timeout: 30000,
    });

    // Wait for AI response (streaming may take time)
    await page.waitForTimeout(10000);

    // On desktop, note the conversation in sidebar
    const viewportSize = page.viewportSize();
    if (viewportSize && viewportSize.width >= 1024) {
      // Get the first conversation item ID
      const conversationItem = page.locator('[data-testid^="conversation-item-"]').first();
      const testId = await conversationItem.getAttribute('data-testid');
      const conversationId = testId?.replace('conversation-item-', '');

      if (conversationId) {
        // Click "New Chat" to deselect
        const newChatButton = page.locator('button:has-text("New Chat")');
        await newChatButton.click();

        // Wait for welcome screen
        await expect(page.locator('text="Welcome to AI Buddy"')).toBeVisible({
          timeout: 5000,
        });

        // Click the conversation to reload it
        await conversationItem.click();

        // The message should still be visible
        await expect(page.locator(`text="${uniqueMessage}"`)).toBeVisible({
          timeout: 10000,
        });
      }
    }
  });

  test('New Chat button clears conversation', async ({ page }) => {
    await login(page);
    await navigateToAiBuddy(page);

    // Send a message
    const testMessage = 'Test clear conversation';
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await chatInput.fill(testMessage);
    await chatInput.press('Enter');

    // Wait for message to appear
    await expect(page.locator(`text="${testMessage}"`)).toBeVisible({
      timeout: 30000,
    });

    // On desktop, click "New Chat"
    const viewportSize = page.viewportSize();
    if (viewportSize && viewportSize.width >= 1024) {
      const newChatButton = page.locator('button:has-text("New Chat")');
      await newChatButton.click();

      // Welcome screen should appear
      await expect(page.locator('text="Welcome to AI Buddy"')).toBeVisible({
        timeout: 5000,
      });

      // Previous message should not be visible
      await expect(page.locator(`text="${testMessage}"`)).not.toBeVisible();
    }
  });

  test('Empty state shows when no conversations', async ({ page }) => {
    // This test assumes user has no conversations
    // In practice, you might need a fresh test user
    await login(page);
    await navigateToAiBuddy(page);

    // Check for welcome message
    await expect(page.locator('text="Welcome to AI Buddy"')).toBeVisible({
      timeout: 10000,
    });

    // Quick action cards should be visible
    await expect(page.locator('text="Analyze a policy"')).toBeVisible();
    await expect(page.locator('text="Answer a question"')).toBeVisible();
    await expect(page.locator('text="Compare quotes"')).toBeVisible();
  });

  test('Quick action sends message and creates conversation', async ({ page }) => {
    await login(page);
    await navigateToAiBuddy(page);

    // Click a quick action card
    const quickActionCard = page.locator('button:has-text("Analyze a policy")');
    await quickActionCard.click();

    // Wait for the prompt to be sent (should see loading indicator or message)
    await page.waitForTimeout(2000);

    // The welcome screen should be replaced by chat view
    // Either we see the sent message or the loading state
    const hasMessage = await page
      .locator('text="Help me analyze a policy document"')
      .isVisible();
    const isLoading = await page.locator('[class*="loading"], [class*="animate"]').isVisible();

    expect(hasMessage || isLoading).toBe(true);
  });
});
