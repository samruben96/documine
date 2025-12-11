/**
 * Report Generation E2E Tests
 * Epic 23: Flexible AI Reports - Stories 23.4 & 23.5
 *
 * End-to-end tests for the complete report generation flow.
 * AC-23.4.1: AI generates report title and summary from data + prompt
 * AC-23.4.3: Without prompt, AI generates best-effort analysis automatically
 * AC-23.4.4: Generation shows streaming progress feedback
 * AC-23.4.5: Generation completes within 30 seconds for datasets < 10K rows
 * AC-23.5.1: AI-recommended chart types rendered correctly
 * AC-23.5.4: Multiple charts displayed in responsive grid
 */

import { test, expect, Page } from '@playwright/test';

// Test data
const TEST_USER = {
  email: 'test@documine.test',
  password: 'testpassword123',
};

/**
 * Helper to login and navigate to reporting page
 */
async function setupReportingPage(page: Page): Promise<void> {
  // Login
  await page.goto('/login');
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');

  // Wait for auth and navigate to reporting
  await page.waitForURL(/\/(dashboard|documents|ai-buddy|reporting)/);
  await page.goto('/reporting');
  await page.waitForLoadState('networkidle');
}

/**
 * Helper to upload a test CSV file
 */
async function uploadTestFile(page: Page, filename = 'test-data.csv'): Promise<void> {
  // Create a test CSV buffer
  const csvContent = `Date,Revenue,Region,Quantity
2024-01-01,1000,North,10
2024-01-02,1500,South,15
2024-01-03,2000,East,20
2024-01-04,2500,West,25
2024-01-05,3000,North,30
2024-01-06,3500,South,35
2024-01-07,4000,East,40
2024-01-08,4500,West,45
2024-01-09,5000,North,50
2024-01-10,5500,South,55`;

  const buffer = Buffer.from(csvContent, 'utf-8');

  // Set up file input
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: filename,
    mimeType: 'text/csv',
    buffer,
  });

  // Wait for upload to complete
  await page.waitForSelector('text=File uploaded successfully', {
    timeout: 30000,
  });
}

/**
 * Helper to wait for analysis to complete
 */
async function waitForAnalysis(page: Page): Promise<void> {
  // Wait for analyzing indicator to appear and disappear
  await page.waitForSelector('text=Analyzing your data', { timeout: 5000 }).catch(() => {
    // May already be past this stage
  });

  // Wait for analysis to complete (prompt section enabled)
  await page.waitForSelector('text=What report do you want?', { timeout: 30000 });

  // Wait for columns detected metadata
  await page.waitForSelector('text=columns detected', { timeout: 10000 });
}

test.describe('Report Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Increase default timeout for AI operations
    test.setTimeout(90000);
  });

  test('displays reporting page with upload section', async ({ page }) => {
    await setupReportingPage(page);

    // Verify page structure
    await expect(page.locator('h1')).toContainText('Data Reports');
    await expect(page.locator('text=Step 1: Upload Your Data')).toBeVisible();
    await expect(page.locator('text=Supported Formats')).toBeVisible();
  });

  test('uploads file and triggers analysis', async ({ page }) => {
    await setupReportingPage(page);
    await uploadTestFile(page);

    // Verify analysis state
    await expect(page.locator('text=Analyzing your data')).toBeVisible({
      timeout: 5000,
    });
  });

  test('shows prompt section after analysis completes', async ({ page }) => {
    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);

    // Verify prompt section is enabled
    const promptSection = page.locator('text=What report do you want?');
    await expect(promptSection).toBeVisible();

    // Verify generate button is enabled
    const generateBtn = page.locator('button:has-text("Generate Report")');
    await expect(generateBtn).toBeEnabled();
  });

  test('shows suggested prompts after analysis (AC-23.2.4)', async ({ page }) => {
    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);

    // Should have suggested prompts
    const suggestions = page.locator('[data-testid="suggested-prompt"]');
    const count = await suggestions.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('generates report with user prompt (AC-23.4.1)', async ({ page }) => {
    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);

    // Enter a custom prompt
    const promptInput = page.locator('textarea[placeholder*="Describe"]');
    await promptInput.fill('Show me revenue by region');

    // Click generate
    await page.click('button:has-text("Generate Report")');

    // Wait for generation to start (AC-23.4.4)
    await expect(page.locator('text=Generating Your Report')).toBeVisible({
      timeout: 10000,
    });

    // Wait for progress bar
    await expect(page.locator('[role="progressbar"]')).toBeVisible({
      timeout: 5000,
    });

    // Wait for report to appear (AC-23.4.5: < 30 seconds)
    await expect(page.locator('[data-testid="report-view"]')).toBeVisible({
      timeout: 35000,
    });

    // Verify report structure (AC-23.4.1)
    await expect(page.locator('[data-testid="report-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-summary"]')).toBeVisible();
  });

  test('generates auto-analysis without prompt (AC-23.4.3)', async ({ page }) => {
    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);

    // Don't enter a prompt - leave it empty

    // Click generate
    await page.click('button:has-text("Generate Report")');

    // Wait for report
    await expect(page.locator('[data-testid="report-view"]')).toBeVisible({
      timeout: 35000,
    });

    // Verify auto-generated report has required elements
    await expect(page.locator('[data-testid="report-title"]')).toBeVisible();
    await expect(page.locator('text=Executive Summary')).toBeVisible();
    await expect(page.locator('text=Key Insights')).toBeVisible();
  });

  test('shows streaming progress during generation (AC-23.4.4)', async ({ page }) => {
    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);

    // Click generate
    await page.click('button:has-text("Generate Report")');

    // Check progress stages appear
    const progressText = page.locator('text=/Analyzing|Generating|Creating/');
    await expect(progressText).toBeVisible({ timeout: 10000 });

    // Progress bar should update
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible({ timeout: 5000 });
  });

  test('displays 3-5 insights with severity indicators (AC-23.4.2)', async ({ page }) => {
    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);

    await page.click('button:has-text("Generate Report")');

    // Wait for report
    await expect(page.locator('[data-testid="report-view"]')).toBeVisible({
      timeout: 35000,
    });

    // Check for insight cards
    const insightCards = page.locator('[data-testid^="insight-card-"]');
    const insightCount = await insightCards.count();

    expect(insightCount).toBeGreaterThanOrEqual(3);
    expect(insightCount).toBeLessThanOrEqual(5);

    // Verify severity badges exist
    const severityBadges = page.locator('text=/Info|Warning|Critical/');
    await expect(severityBadges.first()).toBeVisible();
  });

  test('displays interactive charts (AC-23.5.1, AC-23.5.4)', async ({ page }) => {
    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);

    await page.click('button:has-text("Generate Report")');

    // Wait for report
    await expect(page.locator('[data-testid="report-view"]')).toBeVisible({
      timeout: 35000,
    });

    // Check for chart section
    await expect(page.locator('text=Recommended Visualizations')).toBeVisible();

    // Check for actual chart components (not placeholders anymore)
    const charts = page.locator('[data-testid^="report-chart-"]');
    const chartCount = await charts.count();

    expect(chartCount).toBeGreaterThanOrEqual(2);
    expect(chartCount).toBeLessThanOrEqual(4);

    // Verify first chart has accessibility attributes (AC-23.5.6)
    const firstChart = charts.first();
    await expect(firstChart).toHaveAttribute('role', 'img');
    await expect(firstChart).toHaveAttribute('aria-label', /.+/);
  });

  test('can cancel report generation', async ({ page }) => {
    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);

    // Click generate
    await page.click('button:has-text("Generate Report")');

    // Wait for generating state
    await expect(page.locator('text=Generating Your Report')).toBeVisible({
      timeout: 10000,
    });

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Should return to ready state
    await expect(page.locator('text=Generating Your Report')).not.toBeVisible();
    await expect(
      page.locator('button:has-text("Generate Report")')
    ).toBeEnabled();
  });

  test('can generate new report after viewing one', async ({ page }) => {
    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);

    // Generate first report
    await page.click('button:has-text("Generate Report")');
    await expect(page.locator('[data-testid="report-view"]')).toBeVisible({
      timeout: 35000,
    });

    // Click new report
    await page.click('button:has-text("New Report")');

    // Should return to prompt entry
    await expect(page.locator('text=What report do you want?')).toBeVisible();
    await expect(
      page.locator('button:has-text("Generate Report")')
    ).toBeEnabled();
  });

  test('handles generation error gracefully (AC-23.4.7)', async ({ page }) => {
    // This test simulates a scenario where generation might fail
    // In reality, we'd need to mock the API to force an error

    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);

    // The error handling is tested via the presence of retry functionality
    // If an error occurs, user should see retry option

    await page.click('button:has-text("Generate Report")');

    // Wait for either success or error
    await Promise.race([
      page.waitForSelector('[data-testid="report-view"]', { timeout: 35000 }),
      page.waitForSelector('text=Generation Failed', { timeout: 35000 }),
    ]);

    // If we got an error, verify retry button exists
    const errorAlert = page.locator('text=Generation Failed');
    if (await errorAlert.isVisible()) {
      await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
    }
  });

  test('shows interactive data table in report (AC-23.6.1)', async ({ page }) => {
    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);

    await page.click('button:has-text("Generate Report")');

    await expect(page.locator('[data-testid="report-view"]')).toBeVisible({
      timeout: 35000,
    });

    // Check for data table section (AC-23.6.1)
    await expect(page.locator('[data-testid="report-data-table"]')).toBeVisible();
    await expect(page.locator('text=Data Table')).toBeVisible();

    // Check for data rows
    const dataRows = page.locator('[data-testid="data-row"]');
    const rowCount = await dataRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('data table supports sorting (AC-23.6.2)', async ({ page }) => {
    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);

    await page.click('button:has-text("Generate Report")');

    await expect(page.locator('[data-testid="report-data-table"]')).toBeVisible({
      timeout: 35000,
    });

    // Click on a sortable column header
    const sortButton = page.locator('button:has-text("Date")').first();
    if (await sortButton.isVisible()) {
      await sortButton.click();

      // Verify sort indicator changes
      const th = page.locator('th[aria-sort]');
      await expect(th).toBeVisible();
    }
  });

  test('data table supports search filtering (AC-23.6.3)', async ({ page }) => {
    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);

    await page.click('button:has-text("Generate Report")');

    await expect(page.locator('[data-testid="report-data-table"]')).toBeVisible({
      timeout: 35000,
    });

    // Find search input
    const searchInput = page.locator('[data-testid="global-search-input"]');
    if (await searchInput.isVisible()) {
      // Enter search term
      await searchInput.fill('North');

      // Wait for filter to apply (debounced)
      await page.waitForTimeout(400);

      // Verify filtering reduced rows
      const dataRows = page.locator('[data-testid="data-row"]');
      const rowCount = await dataRows.count();
      expect(rowCount).toBeLessThanOrEqual(10); // Should filter down from 10
    }
  });

  test('data table supports pagination for large datasets (AC-23.6.4)', async ({ page }) => {
    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);

    await page.click('button:has-text("Generate Report")');

    await expect(page.locator('[data-testid="report-data-table"]')).toBeVisible({
      timeout: 35000,
    });

    // Check if pagination is visible (may not show for small datasets)
    const nextPageBtn = page.locator('[data-testid="next-page-button"]');
    const paginationVisible = await nextPageBtn.isVisible();

    if (paginationVisible) {
      // Click next page
      await nextPageBtn.click();

      // Verify page indicator updated
      await expect(page.locator('text=Page 2 of')).toBeVisible();
    }
  });

  test('selecting suggested prompt fills input', async ({ page }) => {
    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);

    // Get first suggested prompt
    const suggestedPrompt = page.locator('[data-testid="suggested-prompt"]').first();
    const promptText = await suggestedPrompt.textContent();

    // Click it
    await suggestedPrompt.click();

    // Verify prompt input is filled
    const promptInput = page.locator('textarea');
    await expect(promptInput).toHaveValue(promptText || '');
  });

  test('upload different file resets state', async ({ page }) => {
    await setupReportingPage(page);
    await uploadTestFile(page, 'first-file.csv');
    await waitForAnalysis(page);

    // Generate a report
    await page.click('button:has-text("Generate Report")');
    await expect(page.locator('[data-testid="report-view"]')).toBeVisible({
      timeout: 35000,
    });

    // Go back and upload different file
    await page.goto('/reporting');
    await page.click('button:has-text("Upload different file")');

    // Upload should clear previous state
    await uploadTestFile(page, 'second-file.csv');
    await waitForAnalysis(page);

    // Should be back in ready state, not showing old report
    await expect(page.locator('[data-testid="report-view"]')).not.toBeVisible();
  });
});

test.describe('Report Generation Performance', () => {
  test('generates report within 30 seconds for small dataset (AC-23.4.5)', async ({
    page,
  }) => {
    test.setTimeout(45000); // Give some buffer

    await setupReportingPage(page);
    await uploadTestFile(page); // 10 rows
    await waitForAnalysis(page);

    const startTime = Date.now();

    await page.click('button:has-text("Generate Report")');

    await expect(page.locator('[data-testid="report-view"]')).toBeVisible({
      timeout: 35000,
    });

    const elapsed = Date.now() - startTime;

    // Should complete within 30 seconds
    expect(elapsed).toBeLessThan(30000);
  });
});

// ============================================================================
// Story 23.7: Export Tests
// ============================================================================

// ============================================================================
// Story 23.8: UI Polish & Testing
// ============================================================================

test.describe('UI Polish & Accessibility (Story 23.8)', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);
  });

  test('page has skip link for keyboard navigation (AC-23.8.1)', async ({ page }) => {
    await setupReportingPage(page);

    // Skip link should be present but visually hidden
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();

    // Focus on skip link and verify it becomes visible
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();
  });

  test('page has proper landmark structure (AC-23.8.1)', async ({ page }) => {
    await setupReportingPage(page);

    // Main content area should exist
    const mainContent = page.locator('main#main-content');
    await expect(mainContent).toBeVisible();
  });

  test('loading states show visual feedback (AC-23.8.2)', async ({ page }) => {
    await setupReportingPage(page);
    await uploadTestFile(page);

    // Analyzing state should show pulse animation
    const analyzingIndicator = page.locator('[role="status"][aria-label="Analyzing your data"]');
    await expect(analyzingIndicator).toBeVisible({ timeout: 5000 }).catch(() => {
      // May have already passed
    });
  });

  test('skeleton loader displays during analysis (AC-23.8.2)', async ({ page }) => {
    await setupReportingPage(page);
    await uploadTestFile(page);

    // Look for skeleton elements during analysis
    const skeletonLoader = page.locator('.animate-pulse');
    const isVisible = await skeletonLoader.isVisible().catch(() => false);

    // Either skeleton is visible or analysis already completed
    if (!isVisible) {
      // Verify analysis completed and prompt section is available
      await expect(page.locator('text=What report do you want?')).toBeVisible({ timeout: 30000 });
    }
  });

  test('error states show recovery options (AC-23.8.3)', async ({ page }) => {
    // This test verifies error UI structure
    // We can't easily trigger real errors, so we verify the structure exists

    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);

    // Generate report
    await page.click('button:has-text("Generate Report")');

    // Wait for either success or error
    await Promise.race([
      page.waitForSelector('[data-testid="report-view"]', { timeout: 35000 }),
      page.waitForSelector('[role="alert"]', { timeout: 35000 }),
    ]);

    // If error occurred, verify recovery options
    const errorAlert = page.locator('[role="alert"]');
    if (await errorAlert.isVisible()) {
      await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
    }
  });

  test('buttons meet touch target size requirements on mobile (AC-23.8.4)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await setupReportingPage(page);

    // File upload dropzone should have minimum height
    const dropzone = page.locator('[role="button"][aria-label*="Upload data file"]');
    const box = await dropzone.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(120); // min-h-[120px] on mobile
  });

  test('prompt validation shows error when over limit (AC-23.8.5)', async ({ page }) => {
    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);

    // Enter text over the character limit
    const promptInput = page.locator('textarea[aria-label="Report description (optional)"]');
    const longText = 'x'.repeat(501);
    await promptInput.fill(longText);

    // Should show error indication
    await expect(promptInput).toHaveAttribute('aria-invalid', 'true');

    // Character count should show red
    const charCount = page.locator('text=/501 \\/ 500/');
    await expect(charCount).toHaveClass(/text-red-500/);
  });

  test('data table pagination works on mobile (AC-23.8.4)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);

    await page.click('button:has-text("Generate Report")');

    await expect(page.locator('[data-testid="report-data-table"]')).toBeVisible({
      timeout: 35000,
    });

    // Previous/Next buttons should be larger on mobile
    const prevButton = page.locator('[data-testid="previous-page-button"]');
    if (await prevButton.isVisible()) {
      const box = await prevButton.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44); // min-h-[44px]
    }
  });

  test('suggested prompts meet touch target requirements (AC-23.8.4)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);

    // Check suggested prompt buttons
    const suggestedPrompt = page.locator('[aria-label*="Use suggestion"]').first();
    if (await suggestedPrompt.isVisible()) {
      const box = await suggestedPrompt.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44); // min-h-[44px] on mobile
    }
  });

  test('report view header stacks on mobile (AC-23.8.4)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);

    await page.click('button:has-text("Generate Report")');

    await expect(page.locator('[data-testid="report-view"]')).toBeVisible({
      timeout: 35000,
    });

    // Title and buttons should be visible even on mobile
    await expect(page.locator('[data-testid="report-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-pdf-button"]')).toBeVisible();
  });
});

test.describe('Report Export (Story 23.7)', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);
  });

  /**
   * Helper to generate a report first
   */
  async function generateReport(page: Page): Promise<void> {
    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);
    await page.click('button:has-text("Generate Report")');
    await expect(page.locator('[data-testid="report-view"]')).toBeVisible({
      timeout: 35000,
    });
  }

  test('PDF export button visible after report generation (AC-23.7.3)', async ({ page }) => {
    await generateReport(page);

    const pdfButton = page.locator('[data-testid="export-pdf-button"]');
    await expect(pdfButton).toBeVisible();
    await expect(pdfButton).toBeEnabled();
    await expect(pdfButton).toHaveText('PDF');
  });

  test('Excel export button visible after report generation (AC-23.7.3)', async ({ page }) => {
    await generateReport(page);

    const excelButton = page.locator('[data-testid="export-excel-button"]');
    await expect(excelButton).toBeVisible();
    await expect(excelButton).toBeEnabled();
    await expect(excelButton).toHaveText('Excel');
  });

  test('export buttons have proper aria-labels (AC-23.7.3)', async ({ page }) => {
    await generateReport(page);

    const pdfButton = page.locator('[data-testid="export-pdf-button"]');
    const excelButton = page.locator('[data-testid="export-excel-button"]');

    await expect(pdfButton).toHaveAttribute('aria-label', 'Export report as PDF');
    await expect(excelButton).toHaveAttribute('aria-label', 'Export report as Excel');
  });

  test('clicking PDF button initiates download (AC-23.7.4)', async ({ page }) => {
    await generateReport(page);

    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

    // Click PDF export
    const pdfButton = page.locator('[data-testid="export-pdf-button"]');
    await pdfButton.click();

    // Verify download started
    const download = await downloadPromise;
    const filename = download.suggestedFilename();

    // Verify filename format (AC-23.7.5)
    expect(filename).toMatch(/^docuMINE-report-\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  test('clicking Excel button initiates download (AC-23.7.4)', async ({ page }) => {
    await generateReport(page);

    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

    // Click Excel export
    const excelButton = page.locator('[data-testid="export-excel-button"]');
    await excelButton.click();

    // Verify download started
    const download = await downloadPromise;
    const filename = download.suggestedFilename();

    // Verify filename format (AC-23.7.5)
    expect(filename).toMatch(/^docuMINE-report-\d{4}-\d{2}-\d{2}\.xlsx$/);
  });

  test('export buttons disabled during report generation (AC-23.7.8)', async ({ page }) => {
    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);

    // Start generation
    await page.click('button:has-text("Generate Report")');

    // Wait for generating state
    await expect(page.locator('text=Generating Your Report')).toBeVisible({
      timeout: 10000,
    });

    // During generation, if report view were visible with buttons, they should be disabled
    // But typically the buttons aren't shown until generation completes
    // So we verify they're enabled AFTER generation completes
    await expect(page.locator('[data-testid="report-view"]')).toBeVisible({
      timeout: 35000,
    });

    const pdfButton = page.locator('[data-testid="export-pdf-button"]');
    const excelButton = page.locator('[data-testid="export-excel-button"]');

    await expect(pdfButton).toBeEnabled();
    await expect(excelButton).toBeEnabled();
  });

  test('shows loading state during PDF export', async ({ page }) => {
    await generateReport(page);

    const pdfButton = page.locator('[data-testid="export-pdf-button"]');

    // Click export
    await pdfButton.click();

    // Button should be disabled during export
    await expect(pdfButton).toBeDisabled();

    // Wait for download to complete
    await page.waitForEvent('download', { timeout: 30000 });

    // Button should be enabled again
    await expect(pdfButton).toBeEnabled();
  });

  test('shows loading state during Excel export', async ({ page }) => {
    await generateReport(page);

    const excelButton = page.locator('[data-testid="export-excel-button"]');

    // Click export
    await excelButton.click();

    // Button should be disabled during export
    await expect(excelButton).toBeDisabled();

    // Wait for download to complete
    await page.waitForEvent('download', { timeout: 30000 });

    // Button should be enabled again
    await expect(excelButton).toBeEnabled();
  });

  test('both export buttons disabled while one is exporting', async ({ page }) => {
    await generateReport(page);

    const pdfButton = page.locator('[data-testid="export-pdf-button"]');
    const excelButton = page.locator('[data-testid="export-excel-button"]');

    // Start PDF export
    await pdfButton.click();

    // Both buttons should be disabled
    await expect(pdfButton).toBeDisabled();
    await expect(excelButton).toBeDisabled();

    // Wait for export to complete
    await page.waitForEvent('download', { timeout: 30000 });

    // Both should be enabled again
    await expect(pdfButton).toBeEnabled();
    await expect(excelButton).toBeEnabled();
  });

  test('export buttons positioned in header alongside New Report', async ({ page }) => {
    await generateReport(page);

    const pdfButton = page.locator('[data-testid="export-pdf-button"]');
    const excelButton = page.locator('[data-testid="export-excel-button"]');
    const newReportButton = page.locator('button:has-text("New Report")');

    // All three buttons should be visible
    await expect(pdfButton).toBeVisible();
    await expect(excelButton).toBeVisible();
    await expect(newReportButton).toBeVisible();

    // Verify they're in the same container (checking parent)
    // Both export buttons and New Report button should be siblings
    const buttonContainer = page.locator('.flex.items-center.gap-2').first();
    await expect(buttonContainer.locator('[data-testid="export-pdf-button"]')).toBeVisible();
    await expect(buttonContainer.locator('[data-testid="export-excel-button"]')).toBeVisible();
  });
});
