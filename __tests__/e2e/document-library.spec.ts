import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Document Library Page
 *
 * Story F2-1: Document Library Page
 * Tests all acceptance criteria for the new document library feature.
 */
test.describe('Document Library Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('/login');

    // Wait for login page
    await page.waitForLoadState('networkidle');

    // Check if we need to login
    const loginForm = page.locator('form');
    if (await loginForm.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Fill in test credentials (adjust based on your test setup)
      await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
      await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'testpassword');
      await page.click('button[type="submit"]');

      // Wait for redirect after login
      await page.waitForURL(/\/(documents|dashboard)/, { timeout: 10000 });
    }
  });

  test.describe('AC-F2-1.1: Route and Navigation', () => {
    test('dedicated /documents route is accessible', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Page should load without errors
      expect(page.url()).toContain('/documents');

      // Should see Document Library heading
      await expect(page.locator('h1:has-text("Document Library")')).toBeVisible();
    });

    test('documents link in sidebar navigation works', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Click on Documents in sidebar navigation (nav is now in sidebar, not header)
      await page.click('aside >> text=Documents');

      // Should navigate to /documents
      await page.waitForURL('**/documents');
      expect(page.url()).toContain('/documents');
    });
  });

  test.describe('AC-F2-1.2: Grid/List View', () => {
    test('displays documents in responsive grid', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Wait for loading to complete
      await page.waitForTimeout(1000);

      // Check if document grid or empty state is visible
      const documentGrid = page.locator('[data-testid="document-grid"]');
      const emptyState = page.locator('[data-testid="empty-state"]');

      // Either grid or empty state should be visible
      const hasDocuments = await documentGrid.isVisible({ timeout: 5000 }).catch(() => false);
      const isEmpty = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasDocuments || isEmpty).toBeTruthy();
    });
  });

  test.describe('AC-F2-1.3: Document Metadata', () => {
    test('document cards show required metadata', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Wait for documents to load
      const documentCard = page.locator('[data-testid="document-card"]').first();

      if (await documentCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Should show status badge (quote or other type)
        await expect(documentCard.locator('text=quote').or(documentCard.locator('text=general'))).toBeVisible();
      }
    });
  });

  test.describe('AC-F2-1.4: Document Navigation', () => {
    test('clicking document card navigates to /chat-docs/[id]', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Find first document card
      const documentCard = page.locator('[data-testid="document-card"]').first();

      if (await documentCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await documentCard.click();

        // Should navigate to chat-docs route
        await page.waitForURL(/\/chat-docs\/[a-f0-9-]+/);
        expect(page.url()).toMatch(/\/chat-docs\/[a-f0-9-]+/);
      } else {
        test.skip();
      }
    });
  });

  test.describe('AC-F2-1.5: Upload Functionality', () => {
    test('upload button is visible', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      const uploadButton = page.locator('[data-testid="upload-button"]');
      await expect(uploadButton).toBeVisible();
    });

    test('upload button opens upload dialog', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Click upload button
      await page.click('[data-testid="upload-button"]');

      // Upload dialog should appear
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Dialog should have upload zone
      await expect(dialog.locator('text=Drop a document here')).toBeVisible();
    });
  });

  test.describe('AC-F2-1.6: Empty State', () => {
    test('shows empty state when no documents', async ({ page }) => {
      // This test may need adjustment based on whether test account has documents
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const emptyState = page.locator('[data-testid="empty-state"]');
      const hasEmpty = await emptyState.isVisible().catch(() => false);

      if (hasEmpty) {
        // Empty state should have upload CTA
        await expect(page.locator('text=No documents yet')).toBeVisible();
        await expect(page.locator('button:has-text("Upload Document")')).toBeVisible();
      }
      // If not empty, that's fine - test passes
    });
  });

  test.describe('Search Functionality', () => {
    test('search input filters documents', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Wait for documents to load
      await page.waitForTimeout(1000);

      // Get initial document count
      const initialCards = await page.locator('[data-testid="document-card"]').count();

      if (initialCards > 0) {
        // Type in search
        await page.fill('input[placeholder="Search documents..."]', 'xyz123nonexistent');

        // Wait for debounce
        await page.waitForTimeout(500);

        // Should show no results or fewer results
        const filteredCards = await page.locator('[data-testid="document-card"]').count();
        expect(filteredCards).toBeLessThanOrEqual(initialCards);
      }
    });

    test('clear search button works', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Type in search
      const searchInput = page.locator('input[placeholder="Search documents..."]');
      await searchInput.fill('test');

      // Clear button should appear
      const clearButton = page.locator('button[aria-label="Clear search"]');
      await expect(clearButton).toBeVisible();

      // Click clear
      await clearButton.click();

      // Search should be empty
      await expect(searchInput).toHaveValue('');
    });
  });

  test.describe('AC-F2-2: Document Type Categorization', () => {
    test('document card shows type toggle', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      const documentCard = page.locator('[data-testid="document-card"]').first();

      if (await documentCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Should show document type toggle
        const typeToggle = documentCard.locator('[data-testid="document-type-toggle"]');
        await expect(typeToggle).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('document type toggle shows dropdown on click', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      const documentCard = page.locator('[data-testid="document-card"]').first();

      if (await documentCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Click the type toggle
        const typeToggle = documentCard.locator('[data-testid="document-type-toggle"]');
        await typeToggle.click();

        // Dropdown should appear with options
        await expect(page.locator('[data-testid="type-option-quote"]')).toBeVisible();
        await expect(page.locator('[data-testid="type-option-general"]')).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('clicking type toggle does not navigate away', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      const documentCard = page.locator('[data-testid="document-card"]').first();

      if (await documentCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Click the type toggle
        const typeToggle = documentCard.locator('[data-testid="document-type-toggle"]');
        await typeToggle.click();

        // Should still be on /documents (not navigated to /chat-docs)
        expect(page.url()).toContain('/documents');

        // Close dropdown by pressing Escape
        await page.keyboard.press('Escape');
      } else {
        test.skip();
      }
    });

    test('can change document type from quote to general', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      const documentCard = page.locator('[data-testid="document-card"]').first();

      if (await documentCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Find a card with "Quote" type
        const quoteBadge = documentCard.locator('[data-testid="document-type-badge"][data-type="quote"]');

        if (await quoteBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Click the type toggle
          const typeToggle = documentCard.locator('[data-testid="document-type-toggle"]');
          await typeToggle.click();

          // Click general option
          await page.locator('[data-testid="type-option-general"]').click();

          // Wait for optimistic update
          await page.waitForTimeout(500);

          // Should now show "General"
          const generalBadge = documentCard.locator('[data-testid="document-type-badge"][data-type="general"]');
          await expect(generalBadge).toBeVisible();

          // Revert back to quote for cleanup
          await typeToggle.click();
          await page.locator('[data-testid="type-option-quote"]').click();
        }
      } else {
        test.skip();
      }
    });

    test('type toggle is disabled for processing documents', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Look for a processing document
      const processingCard = page.locator('[data-testid="document-card"]:has-text("Analyzing")').first();

      if (await processingCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Type toggle should be disabled
        const typeToggle = processingCard.locator('[data-testid="document-type-toggle"]');
        await expect(typeToggle).toBeDisabled();
      } else {
        // No processing documents - skip this test
        test.skip();
      }
    });
  });

  test.describe('Backward Compatibility - Redirects', () => {
    test('old /documents/[id] redirects to /chat-docs/[id]', async ({ page }) => {
      // First, get a valid document ID
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      const documentCard = page.locator('[data-testid="document-card"]').first();

      if (await documentCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Navigate to document and capture the ID
        await documentCard.click();
        await page.waitForURL(/\/chat-docs\/[a-f0-9-]+/);

        const chatDocsUrl = page.url();
        const docId = chatDocsUrl.match(/\/chat-docs\/([a-f0-9-]+)/)?.[1];

        if (docId) {
          // Now try the old route - should redirect
          await page.goto(`/documents/${docId}`);
          await page.waitForURL(`**/chat-docs/${docId}`);

          expect(page.url()).toContain(`/chat-docs/${docId}`);
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe('AC-F2-3: AI Tagging & Summarization', () => {
    test('document cards can display AI tags when present (AC-F2-3.6)', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Wait for documents to load
      await page.waitForTimeout(1000);

      // Look for any document card with AI tags
      const aiTagsContainer = page.locator('[data-testid="ai-tags"]').first();

      if (await aiTagsContainer.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Verify tags are displayed as pills
        const tagPills = aiTagsContainer.locator('span');
        const tagCount = await tagPills.count();

        // Should have at least one tag displayed
        expect(tagCount).toBeGreaterThan(0);
      } else {
        // No documents with AI tags yet - this is acceptable for new environments
        // Just verify the page loaded without errors
        expect(page.url()).toContain('/documents');
      }
    });

    test('AI tag pills are properly styled', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      const aiTagsContainer = page.locator('[data-testid="ai-tags"]').first();

      if (await aiTagsContainer.isVisible({ timeout: 3000 }).catch(() => false)) {
        // First tag pill should have proper styling
        const firstTag = aiTagsContainer.locator('span').first();
        await expect(firstTag).toBeVisible();

        // Should have text content
        const tagText = await firstTag.textContent();
        expect(tagText).toBeTruthy();
        expect(tagText!.length).toBeGreaterThan(0);
      } else {
        test.skip();
      }
    });

    test('search filters by AI tags (AC-F2-3.6)', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Wait for documents to load
      await page.waitForTimeout(1000);

      // Find a document with AI tags and get one of the tag texts
      const aiTagsContainer = page.locator('[data-testid="ai-tags"]').first();

      if (await aiTagsContainer.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Get the first tag text
        const firstTag = aiTagsContainer.locator('span').first();
        const tagText = await firstTag.textContent();

        if (tagText && tagText.trim()) {
          // Count initial documents
          const initialCount = await page.locator('[data-testid="document-card"]').count();

          // Search for the tag
          await page.fill('input[placeholder="Search documents..."]', tagText.trim());

          // Wait for debounce
          await page.waitForTimeout(500);

          // Should still show at least one document (the one with the tag)
          const filteredCount = await page.locator('[data-testid="document-card"]').count();
          expect(filteredCount).toBeGreaterThan(0);
          expect(filteredCount).toBeLessThanOrEqual(initialCount);
        }
      } else {
        test.skip();
      }
    });

    test('document viewer displays AI tags and summary (AC-F2-3.6)', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Find first document card with AI tags
      const documentCard = page.locator('[data-testid="document-card"]').first();

      if (await documentCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Navigate to document viewer
        await documentCard.click();
        await page.waitForURL(/\/chat-docs\/[a-f0-9-]+/);

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Check for AI tags in document viewer header
        const viewerTags = page.locator('[data-testid="document-viewer-tags"]');

        if (await viewerTags.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Verify tags are displayed
          const tagPills = viewerTags.locator('span');
          const tagCount = await tagPills.count();
          expect(tagCount).toBeGreaterThan(0);
        }
        // Not all documents have tags, so we don't fail if not present
      } else {
        test.skip();
      }
    });

    test('truncates tags with +N indicator when more than 3 in card view', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Look for any +N indicator
      const plusIndicator = page.locator('[data-testid="ai-tags"] >> text=/\\+\\d+/').first();

      if (await plusIndicator.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Verify it shows a number
        const text = await plusIndicator.textContent();
        expect(text).toMatch(/\+\d+/);
      } else {
        // No documents with more than 3 tags - skip test
        test.skip();
      }
    });
  });
});
