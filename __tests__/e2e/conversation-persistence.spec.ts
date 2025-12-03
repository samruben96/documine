import { test, expect } from '@playwright/test';

/**
 * Conversation Persistence E2E Tests
 *
 * Story 6.1: Fix Conversation Loading (406 Error)
 *
 * Tests for:
 * - AC-6.1.2: Conversation history loads on document page
 * - AC-6.1.3: No 406 errors in console
 * - AC-6.1.4: Conversation persists across page refresh
 */

// Test credentials - use environment variables or test fixtures
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

test.describe('Conversation Persistence', () => {
  // Collect console errors during tests
  const consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Clear console errors for each test
    consoleErrors.length = 0;

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for network response errors (406 specifically)
    page.on('response', (response) => {
      if (response.status() === 406) {
        consoleErrors.push(`HTTP 406 error: ${response.url()}`);
      }
    });
  });

  /**
   * Helper function to login
   */
  async function login(page: any) {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    // Wait for redirect to documents page
    await page.waitForURL(/\/documents/, { timeout: 10000 });
  }

  /**
   * Helper function to find and click a ready document
   */
  async function navigateToReadyDocument(page: any) {
    // Wait for document list to load
    await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });

    // Find a document with "Ready" status
    const readyDocument = page.locator('button:has-text("Ready")').first();
    await expect(readyDocument).toBeVisible({ timeout: 10000 });
    await readyDocument.click();

    // Wait for document page to load (URL should include document ID)
    await page.waitForURL(/\/documents\/[a-f0-9-]+/, { timeout: 10000 });
  }

  test('AC-6.1.3: No 406 errors when loading document page', async ({ page }) => {
    // Login
    await login(page);

    // Navigate to a ready document
    await navigateToReadyDocument(page);

    // Wait for chat panel to be visible
    await page.waitForSelector('[data-testid="chat-panel"]', { timeout: 10000 });

    // Give time for any async operations to complete
    await page.waitForTimeout(2000);

    // Check for 406 errors
    const has406Error = consoleErrors.some(
      (err) => err.includes('406') || err.includes('Failed to load resource: 406')
    );
    expect(has406Error).toBe(false);
  });

  test('AC-6.1.2: Conversation history loads on document page', async ({ page }) => {
    // Login
    await login(page);

    // Navigate to a ready document
    await navigateToReadyDocument(page);

    // Wait for chat panel to load
    await page.waitForSelector('[data-testid="chat-panel"]', { timeout: 10000 });

    // The hook should attempt to load conversation without errors
    // If there's no existing conversation, we should see the empty state (suggested questions)
    // If there is an existing conversation, we should see message history

    // Wait for loading to complete (either messages or empty state)
    await page.waitForFunction(
      () => {
        const chatPanel = document.querySelector('[data-testid="chat-panel"]');
        if (!chatPanel) return false;
        // Check if either messages exist OR suggested questions (empty state) are shown
        const hasMessages = chatPanel.querySelector('[data-testid="chat-message"]');
        const hasSuggestedQuestions = chatPanel.querySelector(
          '[data-testid="suggested-questions"]'
        );
        return hasMessages || hasSuggestedQuestions;
      },
      { timeout: 10000 }
    );

    // Verify no 406 errors occurred
    const has406Error = consoleErrors.some((err) => err.includes('406'));
    expect(has406Error).toBe(false);
  });

  test('AC-6.1.4: Conversation persists across page refresh', async ({ page }) => {
    // Login
    await login(page);

    // Navigate to a ready document
    await navigateToReadyDocument(page);

    // Wait for chat panel to load
    await page.waitForSelector('[data-testid="chat-panel"]', { timeout: 10000 });

    // Send a test message
    const testMessage = `Test message ${Date.now()}`; // Unique message
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill(testMessage);
    await chatInput.press('Enter');

    // Wait for the user message to appear in the chat
    await page.waitForSelector(`text="${testMessage}"`, { timeout: 30000 });

    // Wait for AI response (may take time for streaming)
    await page.waitForSelector('[data-testid="chat-message"][data-role="assistant"]', {
      timeout: 60000,
    });

    // Refresh the page
    await page.reload();

    // Wait for chat panel to load again
    await page.waitForSelector('[data-testid="chat-panel"]', { timeout: 10000 });

    // Verify the test message is still visible
    await expect(page.locator(`text="${testMessage}"`)).toBeVisible({ timeout: 10000 });

    // Verify no 406 errors during reload
    const has406Error = consoleErrors.some((err) => err.includes('406'));
    expect(has406Error).toBe(false);
  });

  test('Conversation loading gracefully handles empty state', async ({ page }) => {
    // This tests the maybeSingle() fix - when no conversation exists,
    // the hook should return null without throwing a 406 error

    // Login
    await login(page);

    // Navigate to documents page
    await page.goto('/documents');

    // Wait for documents list
    await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });

    // Wait a moment for any async operations
    await page.waitForTimeout(1000);

    // There should be no 406 errors even if no conversation exists
    const has406Error = consoleErrors.some((err) => err.includes('406'));
    expect(has406Error).toBe(false);
  });
});
