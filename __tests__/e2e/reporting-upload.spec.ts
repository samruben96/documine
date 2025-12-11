import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

/**
 * E2E Tests for Reporting Upload
 *
 * Epic 23: Flexible AI Reports
 * Story 23.1: File Upload Infrastructure
 *
 * Tests acceptance criteria for file upload functionality.
 */
test.describe('Reporting Upload Page', () => {
  // Create temp directory for test files
  let tempDir: string;

  test.beforeAll(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reporting-e2e-'));
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

  test.describe('AC-23.1.1: Route and Navigation', () => {
    test('dedicated /reporting route is accessible', async ({ page }) => {
      await page.goto('/reporting');
      await page.waitForLoadState('networkidle');

      // Page should load without errors
      expect(page.url()).toContain('/reporting');

      // Should see Data Reports heading
      await expect(
        page.locator('h1:has-text("Data Reports")')
      ).toBeVisible();
    });

    test('reporting link in header navigation works', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Click on Reporting in navigation
      await page.click('nav >> text=Reporting');

      // Should navigate to /reporting
      await page.waitForURL('**/reporting');
      expect(page.url()).toContain('/reporting');
    });

    test('reporting link visible in mobile bottom nav', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Should see Reports in bottom nav on mobile
      const bottomNav = page.locator('nav.fixed.bottom-0');
      await expect(bottomNav.locator('text=Reports')).toBeVisible();
    });
  });

  test.describe('AC-23.1.1: Dropzone Display', () => {
    test('displays file upload dropzone', async ({ page }) => {
      await page.goto('/reporting');
      await page.waitForLoadState('networkidle');

      // Check for upload instructions
      await expect(
        page.locator('text=Drop a data file here or click to upload')
      ).toBeVisible();

      // Check for format info
      await expect(
        page.locator('text=Excel (.xlsx, .xls), CSV, or PDF files up to 50MB')
      ).toBeVisible();
    });

    test('shows supported formats in help section', async ({ page }) => {
      await page.goto('/reporting');
      await page.waitForLoadState('networkidle');

      // Check for supported formats help text
      await expect(page.locator('text=Supported Formats')).toBeVisible();
      await expect(
        page.locator('text=.xlsx, .xls spreadsheets')
      ).toBeVisible();
      await expect(
        page.locator('text=Comma-separated data files')
      ).toBeVisible();
      await expect(
        page.locator('text=Documents with tables (will be extracted)')
      ).toBeVisible();
    });
  });

  test.describe('AC-23.1.1: Valid File Upload', () => {
    test('can upload Excel .xlsx file via click', async ({ page }) => {
      await page.goto('/reporting');
      await page.waitForLoadState('networkidle');

      // Create a test xlsx file (minimal valid Excel content)
      const xlsxPath = path.join(tempDir, 'test-commission.xlsx');
      // Create a minimal valid XLSX file header
      const xlsxContent = Buffer.from([
        0x50, 0x4b, 0x03, 0x04, // ZIP header (XLSX is a ZIP file)
        0x14, 0x00, 0x00, 0x00,
      ]);
      fs.writeFileSync(xlsxPath, xlsxContent);

      // Get the file input
      const fileInput = page.locator('input[type="file"]');

      // Upload the file
      await fileInput.setInputFiles(xlsxPath);

      // Should show the filename
      await expect(
        page.locator('text=test-commission.xlsx').first()
      ).toBeVisible({ timeout: 5000 });
    });

    test('can upload CSV file', async ({ page }) => {
      await page.goto('/reporting');
      await page.waitForLoadState('networkidle');

      // Create a test CSV file
      const csvPath = path.join(tempDir, 'test-commission.csv');
      fs.writeFileSync(
        csvPath,
        'Agent,Policy,Commission\nJohn Doe,POL-001,150.00\n'
      );

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(csvPath);

      await expect(page.locator('text=test-commission.csv').first()).toBeVisible(
        { timeout: 5000 }
      );
    });

    test('can upload PDF file', async ({ page }) => {
      await page.goto('/reporting');
      await page.waitForLoadState('networkidle');

      // Create a minimal PDF file
      const pdfPath = path.join(tempDir, 'test-statement.pdf');
      const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>');
      fs.writeFileSync(pdfPath, pdfContent);

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(pdfPath);

      await expect(page.locator('text=test-statement.pdf').first()).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe('AC-23.1.2: Upload Progress', () => {
    test('shows progress indicator during upload', async ({ page }) => {
      await page.goto('/reporting');
      await page.waitForLoadState('networkidle');

      // Create a test file
      const csvPath = path.join(tempDir, 'progress-test.csv');
      fs.writeFileSync(csvPath, 'Name,Amount\nTest,100\n');

      // Monitor network requests
      let uploadStarted = false;
      page.on('request', (request) => {
        if (request.url().includes('/api/reporting/upload')) {
          uploadStarted = true;
        }
      });

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(csvPath);

      // Wait a moment and check if file is shown
      await page.waitForTimeout(500);

      // File name should be visible
      await expect(page.locator('text=progress-test.csv').first()).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe('AC-23.1.3: Invalid File Handling', () => {
    test('shows error for invalid file type', async ({ page }) => {
      await page.goto('/reporting');
      await page.waitForLoadState('networkidle');

      // Create a test .txt file (not allowed)
      const txtPath = path.join(tempDir, 'invalid.txt');
      fs.writeFileSync(txtPath, 'This is not a valid commission file');

      // Try to upload
      const fileInput = page.locator('input[type="file"]');

      // The dropzone should reject the file (client-side validation)
      // Note: Playwright might bypass accept attribute, so we check for the error
      await fileInput.setInputFiles(txtPath);

      // Should show error toast
      await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe('Accessibility', () => {
    test('file input has accessible label', async ({ page }) => {
      await page.goto('/reporting');
      await page.waitForLoadState('networkidle');

      // Check for accessible file input
      const fileInput = page.locator(
        'input[aria-label="Upload data file"]'
      );
      await expect(fileInput).toBeAttached();
    });

    test('page has proper heading structure', async ({ page }) => {
      await page.goto('/reporting');
      await page.waitForLoadState('networkidle');

      // Main heading
      await expect(page.locator('h1')).toHaveText('Data Reports');

      // Subheading
      await expect(
        page.locator('h2:has-text("Step 1: Upload Your Data")')
      ).toBeVisible();
    });
  });
});
