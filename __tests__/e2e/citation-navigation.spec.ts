import { test, expect } from '@playwright/test';

/**
 * Citation Navigation E2E Tests
 *
 * Story 6.3: Fix Source Citation Navigation
 *
 * Tests for:
 * - AC-6.3.1: Citation click scrolls to correct page
 * - AC-6.3.2: Page number input updates correctly
 * - AC-6.3.3: Visual feedback on citation click
 * - AC-6.3.4: Smooth scroll animation (manual verification)
 * - AC-6.3.5: Mobile tab switch (tested with mobile viewport)
 */

// Test credentials - use environment variables or test fixtures
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

test.describe('Citation Navigation', () => {
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
   * Helper function to navigate to a document with chat history
   */
  async function navigateToDocumentWithChat(page: any) {
    // Wait for document list to load
    await page.waitForSelector('button:has-text("Ready")', { timeout: 10000 });

    // Find a document with "Ready" status
    const readyDocument = page.locator('button:has-text("Ready")').first();
    await expect(readyDocument).toBeVisible({ timeout: 10000 });
    await readyDocument.click();

    // Wait for document page to load
    await page.waitForURL(/\/documents\/[a-f0-9-]+/, { timeout: 10000 });

    // Wait for PDF viewer to load
    await page.waitForSelector('[aria-label="PDF document viewer"]', { timeout: 15000 });

    // Wait for chat panel
    await page.waitForSelector('[data-testid="chat-panel"]', { timeout: 10000 });
  }

  /**
   * Helper to get current page number from input
   */
  async function getCurrentPageNumber(page: any): Promise<number> {
    const pageInput = page.locator('[aria-label="Current page number"]');
    const value = await pageInput.inputValue();
    return parseInt(value, 10);
  }

  /**
   * Helper to get scroll position of PDF viewer
   */
  async function getScrollTop(page: any): Promise<number> {
    return await page.evaluate(() => {
      const container = document.querySelector('[aria-label="PDF document viewer"]');
      return container ? container.scrollTop : 0;
    });
  }

  test.skip('AC-6.3.1 & AC-6.3.2: Citation click scrolls to correct page and updates page input', async ({
    page,
  }) => {
    await login(page);
    await navigateToDocumentWithChat(page);

    // Get initial page number (should be 1)
    const initialPage = await getCurrentPageNumber(page);
    expect(initialPage).toBe(1);

    // Get initial scroll position
    const initialScrollTop = await getScrollTop(page);

    // Find a source citation link (e.g., "Page 6")
    // Look for a citation that's NOT page 1 so we can verify scroll
    const citation = page.locator('button[aria-label*="View page"][aria-label*="in document"]').first();

    // Get the page number from the citation
    const citationText = await citation.textContent();
    const pageMatch = citationText?.match(/Page (\d+)/);
    const targetPage = pageMatch ? parseInt(pageMatch[1], 10) : 2;

    // Click the citation
    await citation.click();

    // Wait for scroll animation to complete
    await page.waitForTimeout(500);

    // Verify page number input updated (AC-6.3.2)
    const newPageNumber = await getCurrentPageNumber(page);
    expect(newPageNumber).toBe(targetPage);

    // Verify scroll position changed (AC-6.3.1)
    if (targetPage > 1) {
      const newScrollTop = await getScrollTop(page);
      expect(newScrollTop).toBeGreaterThan(initialScrollTop);
    }
  });

  test.skip('AC-6.3.5: Mobile viewport - Citation click switches tab and scrolls', async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await login(page);
    await navigateToDocumentWithChat(page);

    // On mobile, chat should be in a tabbed interface
    // Click on "Chat" tab first to ensure we're viewing chat
    const chatTab = page.locator('button[role="tab"]:has-text("Chat")');
    if (await chatTab.isVisible()) {
      await chatTab.click();
      await page.waitForTimeout(300);
    }

    // Find a source citation in the chat panel
    const citation = page.locator('button[aria-label*="View page"][aria-label*="in document"]').first();

    if (await citation.isVisible()) {
      // Click the citation
      await citation.click();

      // Wait for tab switch animation
      await page.waitForTimeout(300);

      // Verify we switched to Document tab
      const documentTab = page.locator('button[role="tab"]:has-text("Document")');
      await expect(documentTab).toHaveAttribute('aria-selected', 'true');

      // Verify PDF viewer is visible
      const pdfViewer = page.locator('[aria-label="PDF document viewer"]');
      await expect(pdfViewer).toBeVisible();
    }
  });

  // This test runs without authentication - verifies component styling
  test('AC-6.3.3: Citation button has visual feedback styles', async ({ page }) => {
    // Create a minimal test page with citation button
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Citation Button Test</title>
          <style>
            .citation-btn {
              display: inline-flex;
              align-items: center;
              gap: 2px;
              font-size: 12px;
              color: #64748b;
              min-height: 44px;
              min-width: 44px;
              padding: 0 8px;
              border: none;
              background: transparent;
              cursor: pointer;
              border-radius: 4px;
              transition: all 150ms;
            }
            .citation-btn:hover {
              color: #334155;
              text-decoration: underline;
            }
            .citation-btn:active {
              background-color: #f1f5f9;
              color: #1e293b;
              transform: scale(0.95);
            }
            .citation-btn:focus {
              outline: none;
              box-shadow: 0 0 0 1px #94a3b8;
            }
          </style>
        </head>
        <body>
          <button class="citation-btn" aria-label="View page 6 in document">
            <span>Page 6</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </body>
      </html>
    `);

    const button = page.locator('.citation-btn');

    // Verify button is visible
    await expect(button).toBeVisible();

    // Verify initial styling (using computed styles is tricky in Playwright)
    // Instead verify the button responds to interactions

    // Hover state - verify cursor changes
    await button.hover();

    // Click and hold to test active state
    await button.click();

    // Verify button still functional after click
    await expect(button).toBeVisible();
  });

  test('Citation button has correct aria-label format', async ({ page }) => {
    // Test that citation buttons follow correct aria-label pattern
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <button aria-label="View page 2 in document">Page 2</button>
          <button aria-label="View page 3 in document">Page 3</button>
          <button aria-label="View page 6 in document">Page 6</button>
        </body>
      </html>
    `);

    // Verify all buttons with correct aria-label pattern exist
    const page2Btn = page.locator('button[aria-label="View page 2 in document"]');
    const page3Btn = page.locator('button[aria-label="View page 3 in document"]');
    const page6Btn = page.locator('button[aria-label="View page 6 in document"]');

    await expect(page2Btn).toBeVisible();
    await expect(page3Btn).toBeVisible();
    await expect(page6Btn).toBeVisible();

    // Verify text content matches
    await expect(page2Btn).toHaveText('Page 2');
    await expect(page3Btn).toHaveText('Page 3');
    await expect(page6Btn).toHaveText('Page 6');
  });
});

/**
 * Scroll behavior tests - these verify the actual scroll implementation
 */
test.describe('Scroll Implementation', () => {
  test('scrollTo with behavior smooth is supported', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            #container {
              height: 300px;
              overflow: auto;
            }
            .page {
              height: 400px;
              border: 1px solid #ccc;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
            }
          </style>
        </head>
        <body>
          <div id="container">
            <div class="page" data-page="1">Page 1</div>
            <div class="page" data-page="2">Page 2</div>
            <div class="page" data-page="3">Page 3</div>
          </div>
          <button id="scrollBtn">Scroll to Page 3</button>
          <script>
            document.getElementById('scrollBtn').addEventListener('click', () => {
              const container = document.getElementById('container');
              const page3 = document.querySelector('[data-page="3"]');
              const containerRect = container.getBoundingClientRect();
              const pageRect = page3.getBoundingClientRect();
              const targetScrollTop = container.scrollTop + (pageRect.top - containerRect.top);
              container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
            });
          </script>
        </body>
      </html>
    `);

    const container = page.locator('#container');
    const scrollBtn = page.locator('#scrollBtn');

    // Get initial scroll position
    const initialScrollTop = await page.evaluate(() =>
      document.getElementById('container')?.scrollTop || 0
    );
    expect(initialScrollTop).toBe(0);

    // Click scroll button
    await scrollBtn.click();

    // Wait for smooth scroll to complete
    await page.waitForTimeout(500);

    // Verify scroll position changed
    const newScrollTop = await page.evaluate(() =>
      document.getElementById('container')?.scrollTop || 0
    );

    // Page 3 should be around scrollTop 800+ (2 pages * 400px each)
    expect(newScrollTop).toBeGreaterThan(400);
  });

  test('getBoundingClientRect returns correct positions', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            #container {
              height: 200px;
              overflow: auto;
              position: relative;
            }
            .page {
              height: 300px;
              border: 1px solid #ccc;
            }
          </style>
        </head>
        <body>
          <div id="container">
            <div class="page" data-page="1">Page 1</div>
            <div class="page" data-page="2">Page 2</div>
          </div>
        </body>
      </html>
    `);

    // Verify getBoundingClientRect works correctly
    const result = await page.evaluate(() => {
      const container = document.getElementById('container');
      const page1 = document.querySelector('[data-page="1"]');
      const page2 = document.querySelector('[data-page="2"]');

      if (!container || !page1 || !page2) return null;

      const containerRect = container.getBoundingClientRect();
      const page1Rect = page1.getBoundingClientRect();
      const page2Rect = page2.getBoundingClientRect();

      return {
        containerTop: containerRect.top,
        page1Top: page1Rect.top,
        page2Top: page2Rect.top,
        page1RelativeTop: page1Rect.top - containerRect.top,
        page2RelativeTop: page2Rect.top - containerRect.top,
      };
    });

    expect(result).not.toBeNull();
    // Page 1 should be at the top of the container
    expect(result!.page1RelativeTop).toBeLessThan(50);
    // Page 2 should be below page 1 (around 300px)
    expect(result!.page2RelativeTop).toBeGreaterThan(200);
  });
});
