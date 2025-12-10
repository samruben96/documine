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

  test('shows data table placeholder in report', async ({ page }) => {
    await setupReportingPage(page);
    await uploadTestFile(page);
    await waitForAnalysis(page);

    await page.click('button:has-text("Generate Report")');

    await expect(page.locator('[data-testid="report-view"]')).toBeVisible({
      timeout: 35000,
    });

    // Check for data table section
    await expect(page.locator('[data-testid="data-table-placeholder"]')).toBeVisible();
    await expect(page.locator('text=Data Table')).toBeVisible();
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
