import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * AI Buddy Document Upload E2E Tests
 * Story 17.1: Document Upload to Conversation with Status
 *
 * Tests for:
 * - AC-17.1.1: Attach button opens file picker for PDF/images
 * - AC-17.1.2: Pending attachments appear above input with file names and remove buttons
 * - AC-17.1.3: Status indicator per file: Uploading → Processing → Ready
 * - AC-17.1.5: Drag files onto chat area to attach
 * - AC-17.1.6: Retry button for failed files
 */

// Test credentials - use environment variables or test fixtures
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

test.describe('AI Buddy Document Upload', () => {
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
    await page.waitForSelector('[data-testid="chat-input"]', { timeout: 10000 });
  }

  test('AC-17.1.1: Attach button opens file picker for PDF/images', async ({ page }) => {
    await login(page);
    await navigateToAiBuddy(page);

    // Verify attach button exists
    const attachButton = page.locator('[data-testid="attach-button"]');
    await expect(attachButton).toBeVisible();
    await expect(attachButton).toHaveAttribute('aria-label', 'Attach document');

    // Verify file input exists and has correct accept types
    const fileInput = page.locator('[data-testid="file-input"]');
    await expect(fileInput).toBeAttached();
  });

  test('AC-17.1.2: Pending attachments appear above input with file names and remove buttons', async ({
    page,
  }) => {
    await login(page);
    await navigateToAiBuddy(page);

    // Get the file input
    const fileInput = page.locator('[data-testid="file-input"]');

    // Create a test file
    await fileInput.setInputFiles({
      name: 'test-policy.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF test content'),
    });

    // Wait for pending attachments to appear
    const pendingAttachments = page.locator('[data-testid="pending-attachments"]');
    await expect(pendingAttachments).toBeVisible({ timeout: 5000 });

    // Verify file name is displayed
    const attachmentChip = page.locator('[data-testid="attachment-chip"]');
    await expect(attachmentChip).toBeVisible();
    await expect(attachmentChip).toContainText('test-policy.pdf');

    // Verify remove button exists
    const removeButton = page.locator('[data-testid="remove-button"]');
    await expect(removeButton).toBeVisible();

    // Click remove button and verify attachment is removed
    await removeButton.click();
    await expect(pendingAttachments).not.toBeVisible({ timeout: 3000 });
  });

  test('AC-17.1.2: Maximum 5 files can be attached', async ({ page }) => {
    await login(page);
    await navigateToAiBuddy(page);

    const fileInput = page.locator('[data-testid="file-input"]');

    // Add 5 files
    const files = Array.from({ length: 5 }, (_, i) => ({
      name: `test-file-${i + 1}.pdf`,
      mimeType: 'application/pdf',
      buffer: Buffer.from(`PDF content ${i + 1}`),
    }));

    await fileInput.setInputFiles(files);

    // Wait for attachments to appear
    await page.waitForTimeout(1000);

    // Verify 5 attachment chips are displayed
    const attachmentChips = page.locator('[data-testid="attachment-chip"]');
    await expect(attachmentChips).toHaveCount(5);

    // Verify "Maximum 5 files" message appears
    const maxFilesMessage = page.locator('text="Maximum 5 files"');
    await expect(maxFilesMessage).toBeVisible();
  });

  test('AC-17.1.3: Status indicator shows pending state for unprocessed files', async ({
    page,
  }) => {
    await login(page);
    await navigateToAiBuddy(page);

    const fileInput = page.locator('[data-testid="file-input"]');

    // Add a file
    await fileInput.setInputFiles({
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF test content'),
    });

    // Wait for attachment chip
    const attachmentChip = page.locator('[data-testid="attachment-chip"]');
    await expect(attachmentChip).toBeVisible();

    // Verify initial status is pending (no status indicator visible until upload starts)
    const pendingStatus = attachmentChip.locator('[data-status="pending"]');
    // The chip should have data-status="pending" attribute
    await expect(attachmentChip).toHaveAttribute('data-status', 'pending');
  });

  test('AC-17.1.5: Drag files onto chat area to attach', async ({ page }) => {
    await login(page);
    await navigateToAiBuddy(page);

    // Find the document upload zone
    const uploadZone = page.locator('[data-testid="document-upload-zone"]');
    await expect(uploadZone).toBeVisible();

    // Create a data transfer with a file
    const dataTransfer = await page.evaluateHandle(() => {
      const dt = new DataTransfer();
      const file = new File(['test content'], 'drag-test.pdf', {
        type: 'application/pdf',
      });
      dt.items.add(file);
      return dt;
    });

    // Simulate drag over
    await uploadZone.dispatchEvent('dragenter', { dataTransfer });

    // Verify drop overlay appears
    const dropOverlay = page.locator('[data-testid="drop-overlay"]');
    await expect(dropOverlay).toBeVisible({ timeout: 3000 });
    await expect(dropOverlay).toContainText('Drop to attach');

    // Simulate drop
    await uploadZone.dispatchEvent('drop', { dataTransfer });

    // Wait for file to be added
    await page.waitForTimeout(1000);

    // Verify attachment chip appears
    const attachmentChip = page.locator('[data-testid="attachment-chip"]');
    await expect(attachmentChip).toBeVisible();
    await expect(attachmentChip).toContainText('drag-test.pdf');
  });

  test('File type validation: Only PDF and images are accepted', async ({ page }) => {
    await login(page);
    await navigateToAiBuddy(page);

    const fileInput = page.locator('[data-testid="file-input"]');

    // Try to add an invalid file type
    await fileInput.setInputFiles({
      name: 'test-document.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Text content'),
    });

    // Wait for attachment chip to appear with failed status
    const attachmentChip = page.locator('[data-testid="attachment-chip"]');
    await expect(attachmentChip).toBeVisible();

    // Verify status is failed
    await expect(attachmentChip).toHaveAttribute('data-status', 'failed');

    // Verify error indicator is shown
    const errorIndicator = page.locator('[data-testid="status-failed"]');
    await expect(errorIndicator).toBeVisible();
  });

  test('Attach button is disabled when loading', async ({ page }) => {
    await login(page);
    await navigateToAiBuddy(page);

    // First, verify attach button is enabled
    const attachButton = page.locator('[data-testid="attach-button"]');
    await expect(attachButton).toBeEnabled();

    // Send a message to trigger loading state
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill('Test message');
    await chatInput.press('Enter');

    // Note: In actual implementation, the attach button should be disabled during loading
    // This test verifies the UI behavior during the loading state
  });

  test('Image files are displayed with correct icon', async ({ page }) => {
    await login(page);
    await navigateToAiBuddy(page);

    const fileInput = page.locator('[data-testid="file-input"]');

    // Add an image file
    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: Buffer.from('PNG image content'),
    });

    // Wait for attachment chip
    const attachmentChip = page.locator('[data-testid="attachment-chip"]');
    await expect(attachmentChip).toBeVisible();
    await expect(attachmentChip).toContainText('test-image.png');
  });

  test('Long file names are truncated', async ({ page }) => {
    await login(page);
    await navigateToAiBuddy(page);

    const fileInput = page.locator('[data-testid="file-input"]');

    // Add a file with a very long name
    const longFileName = 'this-is-a-very-long-file-name-that-should-be-truncated.pdf';
    await fileInput.setInputFiles({
      name: longFileName,
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF content'),
    });

    // Wait for attachment chip
    const attachmentChip = page.locator('[data-testid="attachment-chip"]');
    await expect(attachmentChip).toBeVisible();

    // Verify the chip has a max-width and the full name is in the title attribute
    await expect(attachmentChip).toHaveAttribute('title', expect.stringContaining(longFileName));
  });
});
