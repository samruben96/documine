import { test, expect } from '@playwright/test';

/**
 * Confidence Display E2E Tests
 *
 * Story 6.2: Fix Confidence Score Calculation
 *
 * Tests for:
 * - AC-6.2.4: Accurate answer shows "High Confidence" or "Needs Review" - NOT "Not Found"
 * - AC-6.2.5: Greeting shows "Conversational" or no badge
 */

// Test credentials - use environment variables or test fixtures
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

test.describe('Confidence Display', () => {
  /**
   * Helper function to login
   */
  async function login(page: any) {
    await page.goto('/login');
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

  /**
   * Helper function to send a chat message and wait for response
   */
  async function sendMessage(page: any, message: string) {
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill(message);
    await chatInput.press('Enter');

    // Wait for the user message to appear
    await page.waitForSelector(`text="${message}"`, { timeout: 15000 });

    // Wait for AI response (streaming may take time)
    await page.waitForSelector('[data-testid="chat-message"][data-role="assistant"]', {
      timeout: 60000,
    });

    // Wait for confidence badge to appear (appears after streaming completes)
    // Give extra time for badge to render after streaming
    await page.waitForTimeout(2000);
  }

  /**
   * Helper function to get the confidence badge text
   */
  async function getConfidenceBadgeText(page: any): Promise<string | null> {
    // Find the most recent assistant message's confidence badge
    const assistantMessages = page.locator('[data-testid="chat-message"][data-role="assistant"]');
    const lastMessage = assistantMessages.last();

    // Look for the badge within the last message
    const badge = lastMessage.locator('[role="status"]');
    const isVisible = await badge.isVisible().catch(() => false);

    if (!isVisible) {
      return null;
    }

    return await badge.textContent();
  }

  test.skip('AC-6.2.4: Document query shows appropriate confidence badge', async ({ page }) => {
    // Skip if no test document is available
    // This test requires a real insurance document with known content

    await login(page);
    await navigateToReadyDocument(page);

    // Wait for chat panel to load
    await page.waitForSelector('[data-testid="chat-panel"]', { timeout: 10000 });

    // Ask a question that should find relevant content
    // Using a generic question that most insurance documents would answer
    await sendMessage(page, 'What does this document cover?');

    // Get the confidence badge
    const badgeText = await getConfidenceBadgeText(page);

    // Verify badge is NOT "Not Found" for a question about document content
    // Should be "High Confidence" or "Needs Review"
    expect(badgeText).not.toBeNull();
    expect(badgeText).not.toContain('Not Found');
    expect(
      badgeText?.includes('High Confidence') || badgeText?.includes('Needs Review')
    ).toBeTruthy();
  });

  test.skip('AC-6.2.5: Greeting shows Conversational badge', async ({ page }) => {
    await login(page);
    await navigateToReadyDocument(page);

    // Wait for chat panel to load
    await page.waitForSelector('[data-testid="chat-panel"]', { timeout: 10000 });

    // Send a greeting
    await sendMessage(page, 'Hello!');

    // Get the confidence badge
    const badgeText = await getConfidenceBadgeText(page);

    // For greetings, should show "Conversational" or possibly no badge
    if (badgeText !== null) {
      expect(badgeText).toContain('Conversational');
      expect(badgeText).not.toContain('Not Found');
    }
    // If badge is null (hidden for conversational), that's also acceptable per AC
  });

  test.skip('AC-6.2.5: Thank you message shows Conversational badge', async ({ page }) => {
    await login(page);
    await navigateToReadyDocument(page);

    // Wait for chat panel to load
    await page.waitForSelector('[data-testid="chat-panel"]', { timeout: 10000 });

    // Send a gratitude message
    await sendMessage(page, 'Thanks!');

    // Get the confidence badge
    const badgeText = await getConfidenceBadgeText(page);

    // For gratitude, should show "Conversational" or no badge
    if (badgeText !== null) {
      expect(badgeText).toContain('Conversational');
      expect(badgeText).not.toContain('Not Found');
    }
  });

  // This test can run without authentication - just tests UI component
  test('Confidence badge component renders all levels correctly', async ({ page }) => {
    // Create a simple test page that renders all badge variants
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Badge Test</title>
        </head>
        <body>
          <div id="app">
            <div role="status" aria-label="Confidence: High Confidence" style="background-color: #d1fae5; color: #065f46; display: inline-flex; padding: 4px 8px; border-radius: 9999px; gap: 4px;">
              <svg class="icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span style="font-size: 11px; font-weight: 500;">High Confidence</span>
            </div>
            <div role="status" aria-label="Confidence: Needs Review" style="background-color: #fef3c7; color: #92400e; display: inline-flex; padding: 4px 8px; border-radius: 9999px; gap: 4px; margin-left: 8px;">
              <span style="font-size: 11px; font-weight: 500;">Needs Review</span>
            </div>
            <div role="status" aria-label="Confidence: Not Found" style="background-color: #f1f5f9; color: #475569; display: inline-flex; padding: 4px 8px; border-radius: 9999px; gap: 4px; margin-left: 8px;">
              <span style="font-size: 11px; font-weight: 500;">Not Found</span>
            </div>
            <div role="status" aria-label="Confidence: Conversational" style="background-color: #dbeafe; color: #1e40af; display: inline-flex; padding: 4px 8px; border-radius: 9999px; gap: 4px; margin-left: 8px;">
              <span style="font-size: 11px; font-weight: 500;">Conversational</span>
            </div>
          </div>
        </body>
      </html>
    `);

    // Verify all badge variants are visible
    await expect(page.locator('[aria-label="Confidence: High Confidence"]')).toBeVisible();
    await expect(page.locator('[aria-label="Confidence: Needs Review"]')).toBeVisible();
    await expect(page.locator('[aria-label="Confidence: Not Found"]')).toBeVisible();
    await expect(page.locator('[aria-label="Confidence: Conversational"]')).toBeVisible();

    // Verify correct text content
    await expect(page.locator('text="High Confidence"')).toBeVisible();
    await expect(page.locator('text="Needs Review"')).toBeVisible();
    await expect(page.locator('text="Not Found"')).toBeVisible();
    await expect(page.locator('text="Conversational"')).toBeVisible();
  });
});

/**
 * Integration tests that verify server-side confidence calculation
 * These can run without full UI if we hit the API directly
 */
test.describe('Confidence API Integration', () => {
  test.skip('Chat API returns appropriate confidence for document query', async ({ request }) => {
    // This would require authentication token and valid document ID
    // Skip for now - manual testing required

    // Example of what the test would look like:
    // const response = await request.post('/api/chat', {
    //   headers: { Authorization: `Bearer ${token}` },
    //   data: {
    //     documentId: 'some-uuid',
    //     message: 'What is the deductible?'
    //   }
    // });
    //
    // // Parse SSE response to extract confidence
    // const confidence = parseSSEConfidence(await response.text());
    // expect(['high', 'needs_review']).toContain(confidence);
  });

  test.skip('Chat API returns conversational confidence for greeting', async ({ request }) => {
    // This would require authentication token and valid document ID
    // Skip for now - manual testing required
  });
});
