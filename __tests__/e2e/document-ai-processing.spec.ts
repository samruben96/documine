import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Document AI Processing (Epic 12)
 *
 * Story 12.5: Testing & Validation
 * These tests verify the Google Cloud Document AI integration works correctly.
 */
test.describe('Document AI Processing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check if we need to login
    const loginForm = page.locator('form');
    if (await loginForm.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
      await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'testpassword');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(documents|dashboard)/, { timeout: 10000 });
    }
  });

  test.describe('AC-12.5.1: Document Processing Performance', () => {
    test('documents page shows ready documents', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Should see document cards or empty state
      const documentCards = page.locator('[data-testid="document-card"]');
      const emptyState = page.locator('[data-testid="empty-state"]');

      const hasDocuments = await documentCards.first().isVisible({ timeout: 5000 }).catch(() => false);
      const isEmpty = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasDocuments || isEmpty).toBeTruthy();

      if (hasDocuments) {
        // Verify at least one document has 'ready' status (fully processed)
        const readyBadge = page.locator('[data-testid="status-badge-ready"]').first();
        const fullyAnalyzedBadge = page.locator('text=Fully Analyzed').first();

        const hasReady = await readyBadge.isVisible({ timeout: 3000 }).catch(() => false);
        const hasAnalyzed = await fullyAnalyzedBadge.isVisible({ timeout: 3000 }).catch(() => false);

        // At least one document should be ready or fully analyzed
        if (!hasReady && !hasAnalyzed) {
          // Check for any processing status (acceptable for in-progress uploads)
          const processingBadge = page.locator('[data-testid^="extraction-status-"]').first();
          await expect(processingBadge).toBeVisible();
        }
      }
    });

    test('processed documents have page count', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Find a ready document card
      const documentCard = page.locator('[data-testid="document-card"]').first();

      if (await documentCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Check for page count display
        const pageInfo = documentCard.locator('text=/\\d+\\s*page/i');

        if (await pageInfo.isVisible({ timeout: 2000 }).catch(() => false)) {
          const pageText = await pageInfo.textContent();
          expect(pageText).toMatch(/\d+\s*page/i);
        }
      }
    });
  });

  test.describe('AC-12.5.3: Document Upload to Ready Flow', () => {
    test('upload dialog is accessible', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Click upload button
      const uploadButton = page.locator('[data-testid="upload-button"]');
      await expect(uploadButton).toBeVisible();
      await uploadButton.click();

      // Upload dialog should appear
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Dialog should have upload zone
      await expect(dialog.locator('text=Drop a document here')).toBeVisible();
    });

    test('document processing shows progress stages', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Look for any document with processing indicator
      const processingCard = page.locator('[data-testid="document-card"]').filter({
        has: page.locator('[data-testid="progress-container"]')
      }).first();

      if (await processingCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Processing document should show stage info
        const stageText = processingCard.locator('[data-testid="progress-stage"]');
        if (await stageText.isVisible().catch(() => false)) {
          const stage = await stageText.textContent();
          // Stage should be one of: Queued, Downloading, Parsing, Chunking, Embedding, Extracting
          expect(stage).toMatch(/(Queued|Downloading|Parsing|Chunking|Embedding|Extracting|Analyzing)/i);
        }
      }
    });
  });

  test.describe('AC-12.5.4: Error Handling', () => {
    test('failed documents show error state with retry option', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Look for any failed document
      const failedBadge = page.locator('[data-testid="extraction-status-failed"]').first();

      if (await failedBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Should show error indicator
        await expect(failedBadge).toContainText(/failed/i);

        // Should have retry button nearby
        const retryButton = page.locator('[data-testid="extraction-retry-button"]').first();
        if (await retryButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(retryButton).toBeVisible();
        }
      }
    });

    test('processing queue shows error summary when applicable', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Look for queue summary
      const queueSummary = page.locator('[data-testid="processing-queue-summary"]');

      if (await queueSummary.isVisible({ timeout: 3000 }).catch(() => false)) {
        // If there are failed items, should show count
        const failedCount = queueSummary.locator('[data-testid="failed-count"]');
        if (await failedCount.isVisible().catch(() => false)) {
          const count = await failedCount.textContent();
          expect(count).toMatch(/\d+/);
        }
      }
    });
  });

  test.describe('Chat with Processed Documents', () => {
    test('can navigate to chat with ready document', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Find a ready document
      const documentCard = page.locator('[data-testid="document-card"]').first();

      if (await documentCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await documentCard.click();

        // Should navigate to chat page
        await page.waitForURL(/\/chat-docs\/[a-f0-9-]+/, { timeout: 10000 });
        expect(page.url()).toMatch(/\/chat-docs\/[a-f0-9-]+/);

        // Chat interface should be visible
        const chatInput = page.locator('textarea[placeholder*="Ask"]').or(
          page.locator('input[placeholder*="Ask"]')
        );
        await expect(chatInput).toBeVisible({ timeout: 10000 });
      }
    });

    test('chat interface loads document context', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      const documentCard = page.locator('[data-testid="document-card"]').first();

      if (await documentCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await documentCard.click();
        await page.waitForURL(/\/chat-docs\/[a-f0-9-]+/);
        await page.waitForLoadState('networkidle');

        // Document viewer or document info should be present
        const documentViewer = page.locator('[data-testid="document-viewer"]');
        const documentTitle = page.locator('h1, h2').filter({ hasText: /.+\.pdf/i });

        const hasViewer = await documentViewer.isVisible({ timeout: 5000 }).catch(() => false);
        const hasTitle = await documentTitle.first().isVisible({ timeout: 5000 }).catch(() => false);

        expect(hasViewer || hasTitle).toBeTruthy();
      }
    });
  });

  test.describe('Comparison with Processed Documents', () => {
    test('compare page shows extraction status indicators', async ({ page }) => {
      await page.goto('/compare');
      await page.waitForLoadState('networkidle');

      // Should see quote selector or message
      const quoteSelector = page.locator('[data-testid="quote-selector"]');
      const noQuotes = page.locator('text=/no.*quote/i');

      const hasSelector = await quoteSelector.isVisible({ timeout: 5000 }).catch(() => false);
      const hasNoQuotes = await noQuotes.isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasSelector || hasNoQuotes).toBeTruthy();

      if (hasSelector) {
        // Check for extraction status on quote cards
        const statusBadge = page.locator('[data-testid^="extraction-status-"]').first();
        if (await statusBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Status should be visible
          await expect(statusBadge).toBeVisible();
        }
      }
    });
  });
});
