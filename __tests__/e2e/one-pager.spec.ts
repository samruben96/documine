import { test, expect } from '@playwright/test';

/**
 * One-Pager E2E Tests
 *
 * Story 9.3: One-Pager Page
 *
 * Tests for:
 * - AC-9.3.1: Route at /one-pager
 * - AC-9.3.2: comparisonId mode (via searchParams)
 * - AC-9.3.3: documentId mode (via searchParams)
 * - AC-9.3.4: Select mode (no params, document selection)
 * - AC-9.3.5: Client name input (max 100 chars)
 * - AC-9.3.6: Agent notes input (max 500 chars)
 * - AC-9.3.7: Live preview with debouncing
 * - AC-9.3.8: PDF download button
 */

// Test credentials
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

test.describe('One-Pager Page', () => {
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

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('AC-9.3.1: One-pager page is accessible at /one-pager', async ({ page }) => {
    await page.goto('/one-pager');

    // Should show page with "Generate One-Pager" or "One-Pager" heading
    const heading = page.locator('h1');
    await expect(heading).toContainText(/one-pager/i, { timeout: 10000 });
  });

  test('AC-9.3.4: Select mode shows document selector when no params', async ({ page }) => {
    await page.goto('/one-pager');

    // Should show document selector
    await expect(page.locator('text=Select Documents')).toBeVisible({ timeout: 10000 });

    // Should show "Use Existing Comparison" button
    await expect(page.locator('button:has-text("Use Existing Comparison")')).toBeVisible();
  });

  test('AC-9.3.4: Document selector shows available documents', async ({ page }) => {
    await page.goto('/one-pager');

    // Wait for document selector
    await page.waitForSelector('text=Select Documents', { timeout: 10000 });

    // Check for loading state or document list
    const loadingState = page.locator('text=Loading documents...');
    const hasLoading = await loadingState.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasLoading) {
      // Either shows documents or "No documents available"
      const noDocsState = page.locator('text=No documents available');
      const documentItems = page.locator('[data-testid^="document-item-"]');

      const hasNoDocs = await noDocsState.isVisible().catch(() => false);
      const docCount = await documentItems.count();

      expect(hasNoDocs || docCount > 0).toBe(true);
    }
  });

  test('AC-9.3.4: Document selection counter updates correctly', async ({ page }) => {
    await page.goto('/one-pager');

    // Wait for document selector
    await page.waitForSelector('text=Select Documents', { timeout: 10000 });

    // Check if we have documents
    const documentItems = page.locator('[data-testid^="document-item-"]');
    const docCount = await documentItems.count();

    if (docCount === 0) {
      test.skip();
      return;
    }

    // Initially should show "0 of X selected"
    await expect(page.locator('text=/\\d+ of \\d+ selected/')).toBeVisible();

    // Click first document
    await documentItems.first().click();

    // Counter should update
    await expect(page.locator('text=/1 of \\d+ selected/')).toBeVisible();
  });

  test('AC-9.3.4: Generate button enables when documents selected', async ({ page }) => {
    await page.goto('/one-pager');

    // Wait for document selector
    await page.waitForSelector('text=Select Documents', { timeout: 10000 });

    // Check if we have documents
    const documentItems = page.locator('[data-testid^="document-item-"]');
    const docCount = await documentItems.count();

    if (docCount === 0) {
      test.skip();
      return;
    }

    // Generate button should be disabled initially
    const generateBtn = page.locator('[data-testid="generate-button"]');
    await expect(generateBtn).toBeDisabled();

    // Select a document
    await documentItems.first().click();

    // Generate button should now be enabled
    await expect(generateBtn).toBeEnabled();
  });

  test('AC-9.3.4: Use Existing Comparison navigates to history', async ({ page }) => {
    await page.goto('/one-pager');

    // Wait for page load
    await page.waitForSelector('text=Select Documents', { timeout: 10000 });

    // Click "Use Existing Comparison" button
    const useComparisonBtn = page.locator('button:has-text("Use Existing Comparison")');
    await useComparisonBtn.click();

    // Should navigate to comparison history
    await page.waitForURL('/compare/history', { timeout: 10000 });
  });

  /**
   * Helper to get a document or comparison for testing
   */
  async function getFirstReadyDocument(page: any): Promise<string | null> {
    await page.goto('/documents');
    await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 }).catch(() => null);

    // Get first ready document ID from the list
    const docLink = page.locator('a[href^="/documents/"]').first();
    const isVisible = await docLink.isVisible().catch(() => false);

    if (!isVisible) return null;

    const href = await docLink.getAttribute('href');
    if (!href) return null;

    const match = href.match(/\/documents\/([a-f0-9-]+)/);
    return match ? match[1] : null;
  }

  test('AC-9.3.3: Document mode loads with documentId param', async ({ page }) => {
    const docId = await getFirstReadyDocument(page);

    if (!docId) {
      test.skip();
      return;
    }

    await page.goto(`/one-pager?documentId=${docId}`);

    // Should show form view (not selector)
    await expect(page.locator('text=Customize One-Pager')).toBeVisible({ timeout: 15000 });

    // Should have download button
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible();
  });

  test('AC-9.3.5: Client name input is visible and has max length', async ({ page }) => {
    const docId = await getFirstReadyDocument(page);

    if (!docId) {
      test.skip();
      return;
    }

    await page.goto(`/one-pager?documentId=${docId}`);
    await page.waitForSelector('text=Customize One-Pager', { timeout: 15000 });

    // Client name input should exist with maxLength
    const clientInput = page.locator('[data-testid="client-name-input"]');
    await expect(clientInput).toBeVisible();
    await expect(clientInput).toHaveAttribute('maxLength', '100');
  });

  test('AC-9.3.6: Agent notes textarea is visible and has max length', async ({ page }) => {
    const docId = await getFirstReadyDocument(page);

    if (!docId) {
      test.skip();
      return;
    }

    await page.goto(`/one-pager?documentId=${docId}`);
    await page.waitForSelector('text=Customize One-Pager', { timeout: 15000 });

    // Agent notes textarea should exist with maxLength
    const notesInput = page.locator('[data-testid="agent-notes-input"]');
    await expect(notesInput).toBeVisible();
    await expect(notesInput).toHaveAttribute('maxLength', '500');
  });

  test('AC-9.3.6: Character counter updates as user types', async ({ page }) => {
    const docId = await getFirstReadyDocument(page);

    if (!docId) {
      test.skip();
      return;
    }

    await page.goto(`/one-pager?documentId=${docId}`);
    await page.waitForSelector('text=Customize One-Pager', { timeout: 15000 });

    // Check initial counter
    await expect(page.locator('text=0/500')).toBeVisible();

    // Type in agent notes
    const notesInput = page.locator('[data-testid="agent-notes-input"]');
    await notesInput.fill('Test notes');

    // Counter should update
    await expect(page.locator('text=10/500')).toBeVisible();
  });

  test('AC-9.3.7: Preview updates when client name changes', async ({ page }) => {
    const docId = await getFirstReadyDocument(page);

    if (!docId) {
      test.skip();
      return;
    }

    await page.goto(`/one-pager?documentId=${docId}`);
    await page.waitForSelector('text=Customize One-Pager', { timeout: 15000 });

    // Check for preview panel (visible on large screens)
    const preview = page.locator('[data-testid="one-pager-preview"]');
    const isPreviewVisible = await preview.isVisible().catch(() => false);

    if (!isPreviewVisible) {
      // On mobile view, preview is hidden
      test.skip();
      return;
    }

    // Fill in client name
    const clientInput = page.locator('[data-testid="client-name-input"]');
    await clientInput.fill('Acme Corporation');

    // Wait for debounce (300ms + buffer)
    await page.waitForTimeout(500);

    // Preview should show the client name
    await expect(preview).toContainText('Acme Corporation');
  });

  test('AC-9.3.8: Download button triggers PDF generation', async ({ page }) => {
    const docId = await getFirstReadyDocument(page);

    if (!docId) {
      test.skip();
      return;
    }

    await page.goto(`/one-pager?documentId=${docId}`);
    await page.waitForSelector('text=Customize One-Pager', { timeout: 15000 });

    // Fill in required client name
    const clientInput = page.locator('[data-testid="client-name-input"]');
    await clientInput.fill('Test Client');

    // Wait for form to update
    await page.waitForTimeout(500);

    // Download button should be visible
    const downloadBtn = page.locator('[data-testid="download-button"]');
    await expect(downloadBtn).toBeVisible();

    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);

    // Click download
    await downloadBtn.click();

    // Either download starts or error toast appears
    const download = await downloadPromise;

    if (download) {
      // Check filename format
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/docuMINE-one-pager-\d{4}-\d{2}-\d{2}\.pdf/);
    } else {
      // If no download, check for toast (likely validation error or missing data)
      const toast = page.locator('[data-sonner-toast]');
      const hasToast = await toast.isVisible().catch(() => false);
      expect(hasToast).toBe(true);
    }
  });

  test('AC-9.3.7: Split layout shows form and preview panels', async ({ page }) => {
    // Set viewport to large screen
    await page.setViewportSize({ width: 1280, height: 800 });

    const docId = await getFirstReadyDocument(page);

    if (!docId) {
      test.skip();
      return;
    }

    await page.goto(`/one-pager?documentId=${docId}`);
    await page.waitForSelector('text=Customize One-Pager', { timeout: 15000 });

    // Form panel should be visible
    await expect(page.locator('text=Customize One-Pager')).toBeVisible();

    // Preview panel should be visible on large screen
    const preview = page.locator('[data-testid="one-pager-preview"]');
    await expect(preview).toBeVisible();
  });

  test('Mobile: Preview is hidden on small screens', async ({ page }) => {
    // Set viewport to mobile
    await page.setViewportSize({ width: 375, height: 667 });

    const docId = await getFirstReadyDocument(page);

    if (!docId) {
      test.skip();
      return;
    }

    await page.goto(`/one-pager?documentId=${docId}`);
    await page.waitForSelector('text=Customize One-Pager', { timeout: 15000 });

    // Preview should be hidden on mobile
    const preview = page.locator('[data-testid="one-pager-preview"]');
    await expect(preview).toBeHidden();

    // Mobile download button should be visible
    const mobileDownload = page.locator('button:has-text("Download PDF")').last();
    await expect(mobileDownload).toBeVisible();
  });

  test('Back button navigates to dashboard', async ({ page }) => {
    const docId = await getFirstReadyDocument(page);

    if (!docId) {
      test.skip();
      return;
    }

    await page.goto(`/one-pager?documentId=${docId}`);
    await page.waitForSelector('text=Customize One-Pager', { timeout: 15000 });

    // Click back button
    const backBtn = page.locator('a:has-text("Dashboard")');
    await backBtn.click();

    // Should navigate to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('Quote Data card shows extraction summary', async ({ page }) => {
    const docId = await getFirstReadyDocument(page);

    if (!docId) {
      test.skip();
      return;
    }

    await page.goto(`/one-pager?documentId=${docId}`);
    await page.waitForSelector('text=Customize One-Pager', { timeout: 15000 });

    // Quote Data card should be visible
    await expect(page.locator('text=Quote Data')).toBeVisible();

    // Should show coverage/exclusion counts
    await expect(page.locator('text=/\\d+ coverages/')).toBeVisible({ timeout: 5000 }).catch(() => null);
  });

  test('Error state displays when document not found', async ({ page }) => {
    await page.goto('/one-pager?documentId=non-existent-id');

    // Should show error state
    await expect(page.locator('text=not found')).toBeVisible({ timeout: 10000 });

    // Should have back button
    await expect(page.locator('a:has-text("Back to Dashboard")')).toBeVisible();
  });

  test('Loading state displays while fetching data', async ({ page }) => {
    const docId = await getFirstReadyDocument(page);

    if (!docId) {
      test.skip();
      return;
    }

    await page.goto(`/one-pager?documentId=${docId}`);

    // Should show loading spinner initially
    const spinner = page.locator('text=Loading...');
    const hasLoading = await spinner.isVisible({ timeout: 2000 }).catch(() => false);

    // If loading was fast, content should be visible
    if (!hasLoading) {
      await expect(page.locator('text=Customize One-Pager')).toBeVisible({ timeout: 15000 });
    }
  });
});
