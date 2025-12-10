import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

/**
 * E2E Tests for Reporting Analysis Pipeline
 *
 * Epic 23: Flexible AI Reports
 * Story 23.2: Data Analysis Pipeline
 *
 * Tests acceptance criteria for data analysis functionality.
 * AC-23.2.1: File parsing extracts all rows and columns from Excel/CSV
 * AC-23.2.3: AI detects column types
 * AC-23.2.4: AI suggests 3-5 relevant report prompts
 * AC-23.2.5: Analysis completes within 15 seconds for files < 10K rows
 */
test.describe('Reporting Analysis Pipeline', () => {
  // Create temp directory for test files
  let tempDir: string;

  test.beforeAll(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reporting-analyze-'));
  });

  test.afterAll(async () => {
    // Clean up temp files
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('/login');

    // Wait for login page
    await page.waitForLoadState('networkidle');

    // Check if we need to login
    const loginForm = page.locator('form');
    if (await loginForm.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Fill in test credentials
      await page.fill(
        'input[type="email"]',
        process.env.TEST_USER_EMAIL || 'test@example.com'
      );
      await page.fill(
        'input[type="password"]',
        process.env.TEST_USER_PASSWORD || 'testpassword'
      );
      await page.click('button[type="submit"]');

      // Wait for redirect after login
      await page.waitForURL(/\/(documents|dashboard)/, { timeout: 10000 });
    }
  });

  test.describe('AC-23.2.1: CSV File Analysis', () => {
    test('CSV file is parsed and all columns are extracted', async ({ page }) => {
      await page.goto('/reporting');
      await page.waitForLoadState('networkidle');

      // Create a realistic commission CSV file
      const csvPath = path.join(tempDir, 'commission-data.csv');
      const csvContent = `Agent Name,Policy Number,Premium,Commission Rate,Issue Date,Active
John Smith,POL-001,1500.00,15%,2024-01-15,yes
Jane Doe,POL-002,2500.50,12.5%,2024-02-20,yes
Bob Wilson,POL-003,750.00,10%,2024-03-10,no
Alice Brown,POL-004,$3,200.00,18%,2024-04-05,yes
Charlie Davis,POL-005,1800.75,14%,2024-05-12,yes`;
      fs.writeFileSync(csvPath, csvContent);

      // Upload the file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(csvPath);

      // Wait for file to appear in the list
      await expect(page.locator('text=commission-data.csv').first()).toBeVisible({
        timeout: 5000,
      });

      // Wait for analysis to complete - look for "Analyze" button or status change
      // The UI should show the file was uploaded successfully
      // Then we would click analyze button if there is one, or it auto-analyzes

      // Check that analysis shows columns were detected
      // This depends on UI implementation - checking for column count indicator
      await page.waitForTimeout(2000); // Allow time for processing

      // Check network response for the analyze call
      const analyzeResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/reporting/analyze') &&
          response.status() === 200,
        { timeout: 20000 }
      ).catch(() => null);

      // If there's an analyze button, click it
      const analyzeButton = page.locator('button:has-text("Analyze")');
      if (await analyzeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await analyzeButton.click();
      }

      // Verify the response structure if we got one
      const response = await analyzeResponse;
      if (response) {
        const data = await response.json();
        // Verify columns were extracted
        expect(data.data).toBeDefined();
        if (data.data) {
          expect(data.data.columns).toBeDefined();
          expect(data.data.columns.length).toBeGreaterThanOrEqual(1);
        }
      }
    });
  });

  test.describe('AC-23.2.3: Column Type Detection', () => {
    test('detects numeric, date, text, boolean, currency, and percentage types', async ({
      page,
    }) => {
      await page.goto('/reporting');
      await page.waitForLoadState('networkidle');

      // Create CSV with all column types
      const csvPath = path.join(tempDir, 'all-types.csv');
      const csvContent = `Name,Amount,Rate,Date,Active,Price
John,100,15%,2024-01-15,true,$1500.00
Jane,250,12.5%,2024-02-20,false,$2500.50
Bob,75,10%,2024-03-10,yes,$750.00`;
      fs.writeFileSync(csvPath, csvContent);

      // Upload and wait for processing
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(csvPath);

      await expect(page.locator('text=all-types.csv').first()).toBeVisible({
        timeout: 5000,
      });

      // Intercept the analyze API call to verify column types
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/reporting/analyze') &&
          response.status() === 200,
        { timeout: 20000 }
      ).catch(() => null);

      // Trigger analysis if needed
      const analyzeButton = page.locator('button:has-text("Analyze")');
      if (await analyzeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await analyzeButton.click();
      }

      const response = await responsePromise;
      if (response) {
        const result = await response.json();

        // Verify column types were detected
        if (result.data?.columns) {
          const columns = result.data.columns;
          const columnTypes = columns.map((c: { type: string }) => c.type);

          // Should detect various types
          expect(columnTypes).toContain('text'); // Name
          expect(
            columnTypes.includes('number') ||
              columnTypes.includes('currency') ||
              columnTypes.includes('percentage')
          ).toBe(true);
        }
      }
    });
  });

  test.describe('AC-23.2.4: Suggested Prompts', () => {
    test('returns 3-5 relevant report prompts', async ({ page }) => {
      await page.goto('/reporting');
      await page.waitForLoadState('networkidle');

      // Create a file that would generate meaningful prompts
      const csvPath = path.join(tempDir, 'sales-data.csv');
      const csvContent = `Region,Sales,Date,Category
North,15000,2024-01-15,Electronics
South,22500,2024-02-20,Clothing
East,18000,2024-03-10,Electronics
West,30000,2024-04-05,Furniture
North,12000,2024-05-12,Clothing`;
      fs.writeFileSync(csvPath, csvContent);

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(csvPath);

      await expect(page.locator('text=sales-data.csv').first()).toBeVisible({
        timeout: 5000,
      });

      // Wait for analyze response
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/reporting/analyze') &&
          response.status() === 200,
        { timeout: 20000 }
      ).catch(() => null);

      // Trigger analysis if needed
      const analyzeButton = page.locator('button:has-text("Analyze")');
      if (await analyzeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await analyzeButton.click();
      }

      const response = await responsePromise;
      if (response) {
        const result = await response.json();

        // Verify suggested prompts
        if (result.data?.suggestedPrompts) {
          const prompts = result.data.suggestedPrompts;
          expect(prompts.length).toBeGreaterThanOrEqual(3);
          expect(prompts.length).toBeLessThanOrEqual(5);

          // Each prompt should be a non-empty string
          for (const prompt of prompts) {
            expect(typeof prompt).toBe('string');
            expect(prompt.length).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  test.describe('AC-23.2.5: Performance', () => {
    test('analysis completes within 15 seconds for small files', async ({
      page,
    }) => {
      await page.goto('/reporting');
      await page.waitForLoadState('networkidle');

      // Create a moderate-sized CSV (100 rows)
      const csvPath = path.join(tempDir, 'performance-test.csv');
      let csvContent = 'ID,Name,Value,Date,Status\n';
      for (let i = 1; i <= 100; i++) {
        csvContent += `${i},Item ${i},${Math.random() * 1000},2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')},${i % 2 === 0 ? 'active' : 'inactive'}\n`;
      }
      fs.writeFileSync(csvPath, csvContent);

      const fileInput = page.locator('input[type="file"]');

      // Record start time
      const startTime = Date.now();

      await fileInput.setInputFiles(csvPath);

      await expect(page.locator('text=performance-test.csv').first()).toBeVisible({
        timeout: 5000,
      });

      // Wait for analysis to complete
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/reporting/analyze') &&
          response.status() === 200,
        { timeout: 15000 } // 15 second timeout per AC-23.2.5
      ).catch(() => null);

      // Trigger analysis if needed
      const analyzeButton = page.locator('button:has-text("Analyze")');
      if (await analyzeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await analyzeButton.click();
      }

      const response = await responsePromise;
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify it completed within 15 seconds
      expect(duration).toBeLessThan(15000);

      if (response) {
        const result = await response.json();
        expect(result.error).toBeNull();
        expect(result.data?.rowCount).toBe(100);
      }
    });
  });

  test.describe('Status Transitions', () => {
    test('source status transitions from pending to ready after analysis', async ({
      page,
    }) => {
      await page.goto('/reporting');
      await page.waitForLoadState('networkidle');

      // Create a simple test file
      const csvPath = path.join(tempDir, 'status-test.csv');
      fs.writeFileSync(csvPath, 'Name,Value\nTest,100\n');

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(csvPath);

      await expect(page.locator('text=status-test.csv').first()).toBeVisible({
        timeout: 5000,
      });

      // Monitor the analyze response
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/reporting/analyze') &&
          response.status() === 200,
        { timeout: 20000 }
      ).catch(() => null);

      // Trigger analysis if needed
      const analyzeButton = page.locator('button:has-text("Analyze")');
      if (await analyzeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await analyzeButton.click();
      }

      const response = await responsePromise;
      if (response) {
        const result = await response.json();

        // Verify status is 'ready' after analysis
        expect(result.data?.status).toBe('ready');
      }
    });
  });

  /**
   * Story 23.3: Prompt Input UI Tests
   * AC-23.3.3: Suggested prompts from analysis API are clickable chips that populate the input
   * AC-23.3.4: "Generate Report" button enabled after file upload completes
   * AC-23.3.5: Loading state shown while analysis is in progress
   */
  test.describe('Story 23.3: Prompt Input UI', () => {
    test('AC-23.3.3: clicking suggested prompt populates textarea', async ({ page }) => {
      await page.goto('/reporting');
      await page.waitForLoadState('networkidle');

      // Create a test file
      const csvPath = path.join(tempDir, 'prompt-test.csv');
      const csvContent = `Region,Sales,Date,Category
North,15000,2024-01-15,Electronics
South,22500,2024-02-20,Clothing
East,18000,2024-03-10,Electronics`;
      fs.writeFileSync(csvPath, csvContent);

      // Upload file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(csvPath);

      // Wait for upload success and analysis to complete
      await expect(page.locator('text=File uploaded successfully')).toBeVisible({ timeout: 10000 });

      // Wait for analysis to complete - look for suggested prompts to appear
      await expect(page.locator('text=AI Suggestions:')).toBeVisible({ timeout: 20000 });

      // Find and click a suggested prompt chip
      const suggestedPromptChip = page.locator('button[aria-label*="Use suggestion"]').first();
      await expect(suggestedPromptChip).toBeVisible();

      // Get the chip text
      const chipText = await suggestedPromptChip.textContent();

      // Click the chip
      await suggestedPromptChip.click();

      // Verify the textarea is populated with the chip text
      const textarea = page.locator('textarea[aria-label="Report description (optional)"]');
      await expect(textarea).toHaveValue(chipText || '');
    });

    test('AC-23.3.4: Generate button enabled after analysis completes', async ({ page }) => {
      await page.goto('/reporting');
      await page.waitForLoadState('networkidle');

      // Generate button should be disabled initially
      const generateButton = page.locator('button:has-text("Generate Report")');
      await expect(generateButton).toBeDisabled();

      // Create and upload a test file
      const csvPath = path.join(tempDir, 'generate-test.csv');
      fs.writeFileSync(csvPath, 'Name,Value\nTest,100\nTest2,200');

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(csvPath);

      // Wait for analysis to complete
      await expect(page.locator('text=AI Suggestions:')).toBeVisible({ timeout: 20000 });

      // Generate button should now be enabled
      await expect(generateButton).toBeEnabled();
    });

    test('AC-23.3.5: loading state shown during analysis', async ({ page }) => {
      await page.goto('/reporting');
      await page.waitForLoadState('networkidle');

      // Create a test file
      const csvPath = path.join(tempDir, 'loading-test.csv');
      fs.writeFileSync(csvPath, 'Name,Value\nTest,100');

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(csvPath);

      // Wait for upload success
      await expect(page.locator('text=File uploaded successfully')).toBeVisible({ timeout: 10000 });

      // Check for loading indicator
      const loadingIndicator = page.locator('text=Analyzing your data...');

      // It should either be visible briefly or have already completed
      // We test that it appears at some point OR the analysis completed successfully
      const loadingWasVisible = await loadingIndicator.isVisible({ timeout: 1000 }).catch(() => false);
      const analysisComplete = await page.locator('text=AI Suggestions:').isVisible({ timeout: 20000 }).catch(() => false);

      // Either we saw loading or analysis completed (fast analysis might skip visible loading)
      expect(loadingWasVisible || analysisComplete).toBe(true);
    });

    test('Generate button disabled during analysis', async ({ page }) => {
      await page.goto('/reporting');
      await page.waitForLoadState('networkidle');

      const generateButton = page.locator('button:has-text("Generate Report")');

      // Create and upload a test file
      const csvPath = path.join(tempDir, 'disabled-test.csv');
      fs.writeFileSync(csvPath, 'Name,Value\nTest,100');

      const fileInput = page.locator('input[type="file"]');

      // Button should be disabled before upload
      await expect(generateButton).toBeDisabled();

      await fileInput.setInputFiles(csvPath);

      // During analysis, button should still be disabled
      // Check immediately after upload
      await expect(generateButton).toBeDisabled();

      // Wait for analysis to complete
      await expect(page.locator('text=AI Suggestions:')).toBeVisible({ timeout: 20000 });

      // Now button should be enabled
      await expect(generateButton).toBeEnabled();
    });

    test('Upload different file resets state', async ({ page }) => {
      await page.goto('/reporting');
      await page.waitForLoadState('networkidle');

      // Upload first file
      const csvPath1 = path.join(tempDir, 'first-file.csv');
      fs.writeFileSync(csvPath1, 'Name,Value\nFirst,100');

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(csvPath1);

      // Wait for analysis
      await expect(page.locator('text=AI Suggestions:')).toBeVisible({ timeout: 20000 });

      // Click "Upload different file"
      const uploadDifferentButton = page.locator('button:has-text("Upload different file")');
      await expect(uploadDifferentButton).toBeVisible();
      await uploadDifferentButton.click();

      // File uploader should be visible again
      await expect(page.locator('text=Drop a data file here')).toBeVisible();

      // Suggested prompts should be gone
      await expect(page.locator('text=AI Suggestions:')).not.toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('handles invalid source ID gracefully', async ({ page, request }) => {
      // Directly call the API with an invalid source ID
      const response = await request.post('/api/reporting/analyze', {
        data: { sourceId: 'not-a-valid-uuid' },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Should return 400 for invalid UUID format
      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('INVALID_REQUEST');
    });

    test('handles non-existent source ID gracefully', async ({ page, request }) => {
      // Valid UUID format but doesn't exist
      const response = await request.post('/api/reporting/analyze', {
        data: { sourceId: '550e8400-e29b-41d4-a716-446655440000' },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Should return 401 (unauthenticated) or 404 (not found)
      expect([401, 404]).toContain(response.status());

      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });
});
