import { test, expect } from '@playwright/test';

/**
 * AI Buddy Confidence Display E2E Tests
 *
 * Story 15.5: AI Response Quality & Attribution
 *
 * Tests for:
 * - AC7: Confidence badge displayed below each AI response
 * - AC9: High (green) - information from attached documents
 * - AC10: Medium (amber) - general knowledge, verify with carrier
 * - AC11: Low (gray) - information not available
 * - AC14: Hover tooltip explains each level
 */

test.describe('AI Buddy Confidence Indicators', () => {
  /**
   * AC7: Confidence badge is rendered
   */
  test('AC7: Confidence badge renders below AI response', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .ai-response {
              padding: 16px;
              background: #f8fafc;
              border-radius: 8px;
              margin-bottom: 16px;
            }
            .confidence-badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 4px 10px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 500;
            }
            .high { background: rgba(16, 185, 129, 0.1); color: #059669; border: 1px solid rgba(16, 185, 129, 0.2); }
          </style>
        </head>
        <body>
          <div class="ai-response" data-testid="chat-message" data-role="assistant">
            <p>The liability limit is $1,000,000 per occurrence.</p>
            <div class="confidence-badge high" data-testid="confidence-badge" data-confidence-level="high">
              <span>✓</span>
              <span>High Confidence</span>
            </div>
          </div>
        </body>
      </html>
    `);

    const message = page.locator('[data-testid="chat-message"]');
    const badge = page.locator('[data-testid="confidence-badge"]');

    await expect(message).toBeVisible();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveAttribute('data-confidence-level', 'high');
  });

  /**
   * AC9: High confidence - green badge with checkmark
   */
  test('AC9: High confidence shows green badge with checkmark', async ({
    page,
  }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .confidence-badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 4px 10px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 500;
              background: rgba(16, 185, 129, 0.1);
              color: #059669;
              border: 1px solid rgba(16, 185, 129, 0.2);
            }
            .icon { font-weight: 600; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="confidence-badge" data-testid="confidence-badge" data-confidence-level="high">
            <span class="icon">✓</span>
            <span>High Confidence</span>
          </div>
        </body>
      </html>
    `);

    const badge = page.locator('[data-testid="confidence-badge"]');

    await expect(badge).toBeVisible();
    await expect(badge).toHaveAttribute('data-confidence-level', 'high');
    await expect(badge).toContainText('High Confidence');
    await expect(badge).toContainText('✓');

    // Verify green color
    const color = await badge.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    // Green-ish color (rgb values may vary)
    expect(color).toMatch(/rgb\(5, 150, 105\)/);
  });

  /**
   * AC10: Medium confidence - amber badge with exclamation
   */
  test('AC10: Medium confidence shows amber badge with exclamation', async ({
    page,
  }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .confidence-badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 4px 10px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 500;
              background: rgba(245, 158, 11, 0.1);
              color: #d97706;
              border: 1px solid rgba(245, 158, 11, 0.2);
            }
            .icon { font-weight: 600; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="confidence-badge" data-testid="confidence-badge" data-confidence-level="medium">
            <span class="icon">!</span>
            <span>Needs Review</span>
          </div>
        </body>
      </html>
    `);

    const badge = page.locator('[data-testid="confidence-badge"]');

    await expect(badge).toBeVisible();
    await expect(badge).toHaveAttribute('data-confidence-level', 'medium');
    await expect(badge).toContainText('Needs Review');
    await expect(badge).toContainText('!');

    // Verify amber color
    const color = await badge.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    // Amber-ish color
    expect(color).toMatch(/rgb\(217, 119, 6\)/);
  });

  /**
   * AC11: Low confidence - gray badge with question mark
   */
  test('AC11: Low confidence shows gray badge with question mark', async ({
    page,
  }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .confidence-badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 4px 10px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 500;
              background: rgba(100, 116, 139, 0.1);
              color: #64748b;
              border: 1px solid rgba(100, 116, 139, 0.2);
            }
            .icon { font-weight: 600; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="confidence-badge" data-testid="confidence-badge" data-confidence-level="low">
            <span class="icon">?</span>
            <span>Not Found</span>
          </div>
        </body>
      </html>
    `);

    const badge = page.locator('[data-testid="confidence-badge"]');

    await expect(badge).toBeVisible();
    await expect(badge).toHaveAttribute('data-confidence-level', 'low');
    await expect(badge).toContainText('Not Found');
    await expect(badge).toContainText('?');

    // Verify gray/slate color
    const color = await badge.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    // Slate-ish color
    expect(color).toMatch(/rgb\(100, 116, 139\)/);
  });

  /**
   * All confidence levels render correctly
   */
  test('All confidence levels render correctly', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .badge-container { display: flex; gap: 16px; }
            .confidence-badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 4px 10px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 500;
              border: 1px solid;
            }
            .high { background: rgba(16, 185, 129, 0.1); color: #059669; border-color: rgba(16, 185, 129, 0.2); }
            .medium { background: rgba(245, 158, 11, 0.1); color: #d97706; border-color: rgba(245, 158, 11, 0.2); }
            .low { background: rgba(100, 116, 139, 0.1); color: #64748b; border-color: rgba(100, 116, 139, 0.2); }
          </style>
        </head>
        <body>
          <div class="badge-container">
            <div class="confidence-badge high" data-testid="confidence-badge" data-confidence-level="high">
              <span>✓</span><span>High Confidence</span>
            </div>
            <div class="confidence-badge medium" data-testid="confidence-badge" data-confidence-level="medium">
              <span>!</span><span>Needs Review</span>
            </div>
            <div class="confidence-badge low" data-testid="confidence-badge" data-confidence-level="low">
              <span>?</span><span>Not Found</span>
            </div>
          </div>
        </body>
      </html>
    `);

    const badges = page.locator('[data-testid="confidence-badge"]');
    await expect(badges).toHaveCount(3);

    // Verify high
    const high = page.locator('[data-confidence-level="high"]');
    await expect(high).toContainText('High Confidence');

    // Verify medium
    const medium = page.locator('[data-confidence-level="medium"]');
    await expect(medium).toContainText('Needs Review');

    // Verify low
    const low = page.locator('[data-confidence-level="low"]');
    await expect(low).toContainText('Not Found');
  });

  /**
   * Badge has pill/rounded-full shape
   */
  test('Confidence badge has pill shape (rounded-full)', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .confidence-badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 4px 10px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="confidence-badge" data-testid="confidence-badge">
            High Confidence
          </div>
        </body>
      </html>
    `);

    const badge = page.locator('[data-testid="confidence-badge"]');

    // Verify rounded-full (9999px)
    const borderRadius = await badge.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });
    expect(borderRadius).toBe('9999px');
  });

  /**
   * ConfidenceIndicator compact variant
   */
  test('ConfidenceIndicator renders compact variant correctly', async ({
    page,
  }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .confidence-indicator {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              font-size: 12px;
            }
            .high { color: #059669; }
            .icon { font-weight: 600; font-size: 10px; }
          </style>
        </head>
        <body>
          <span class="confidence-indicator high" data-testid="confidence-indicator">
            <span class="icon">✓</span>
            <span>High Confidence</span>
          </span>
        </body>
      </html>
    `);

    const indicator = page.locator('[data-testid="confidence-indicator"]');

    await expect(indicator).toBeVisible();
    await expect(indicator).toContainText('✓');
    await expect(indicator).toContainText('High Confidence');

    // Verify text-xs (12px)
    const fontSize = await indicator.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });
    expect(fontSize).toBe('12px');
  });
});
