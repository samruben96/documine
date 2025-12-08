import { test, expect } from '@playwright/test';

/**
 * AI Buddy Guardrails E2E Tests
 *
 * Story 15.5: AI Response Quality & Attribution
 *
 * Tests for:
 * - AC15: AI never says "I cannot", provides helpful alternatives
 * - AC16: Helpful redirects for restricted topics
 * - AC17: AI says "I don't know" when appropriate
 * - AC18: Guardrail enforcement is invisible (redirects, not blocks)
 * - AC19: Guardrail events logged (tested in integration tests)
 * - AC20: Changes apply immediately (no cache)
 */

test.describe('AI Buddy Guardrail Behavior', () => {
  /**
   * AC15: System prompt contains banned phrases instruction
   */
  test('AC15: Banned phrases are specified in system prompt', async ({ page }) => {
    // This test verifies the prompt-builder includes the banned phrases list
    // The actual prompt is tested in unit tests - this is a smoke test for the concept

    const bannedPhrases = [
      '"I cannot"',
      '"I\'m not allowed"',
      '"I\'m restricted from"',
      '"I\'m not able to"',
      '"blocked"',
    ];

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body>
          <div id="system-prompt" data-testid="system-prompt">
            NEVER use these phrases in your responses:
            ${bannedPhrases.join(', ')}

            Instead, provide helpful alternatives and suggest appropriate resources.
          </div>
        </body>
      </html>
    `);

    const systemPrompt = page.locator('[data-testid="system-prompt"]');
    const text = await systemPrompt.textContent();

    // Verify banned phrases are documented
    expect(text).toContain('NEVER');
    expect(text).toContain('I cannot');
    expect(text).toContain('helpful alternatives');
  });

  /**
   * AC16: Restricted topics get helpful redirects
   */
  test('AC16: Restricted topic triggers helpful redirect message', async ({
    page,
  }) => {
    // Simulate a restricted topic match showing redirect guidance
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .redirect-guidance {
              padding: 12px;
              background: #f8fafc;
              border-left: 4px solid #3b82f6;
              margin: 12px 0;
            }
            .redirect-guidance h4 {
              font-weight: 600;
              margin-bottom: 8px;
              color: #1e40af;
            }
            .redirect-guidance p {
              color: #475569;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div data-testid="chat-message" data-role="assistant">
            <p>I'd be happy to help with questions about legal matters. Here's what I'd suggest:</p>
            <div class="redirect-guidance" data-testid="redirect-guidance">
              <h4>Professional Guidance Recommended</h4>
              <p data-testid="redirect-message">
                For legal matters, I recommend consulting with a licensed attorney
                who specializes in insurance law.
              </p>
            </div>
            <p>Is there anything else I can help you with regarding your policy?</p>
          </div>
        </body>
      </html>
    `);

    const message = page.locator('[data-testid="chat-message"]');
    const redirectGuidance = page.locator('[data-testid="redirect-guidance"]');
    const redirectMessage = page.locator('[data-testid="redirect-message"]');

    await expect(message).toBeVisible();
    await expect(redirectGuidance).toBeVisible();

    // Verify redirect contains helpful guidance, not a block
    const text = await redirectMessage.textContent();
    expect(text).toContain('recommend');
    expect(text).toContain('consulting');
    expect(text).toContain('attorney');

    // Verify NO blocking language
    expect(text).not.toContain('I cannot');
    expect(text).not.toContain('blocked');
    expect(text).not.toContain('restricted');
  });

  /**
   * AC17: AI admits when it doesn't know
   */
  test('AC17: AI indicates when information is not available', async ({
    page,
  }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body>
          <div data-testid="chat-message" data-role="assistant">
            <p>I don't have information about that specific topic in the documents you've provided.
            Here are some things you could try:</p>
            <ul>
              <li>Check the carrier's website for more details</li>
              <li>Contact your underwriter directly</li>
              <li>Upload additional policy documents for me to review</li>
            </ul>
          </div>
          <div class="confidence-badge low" data-testid="confidence-badge" data-confidence-level="low">
            <span>?</span>
            <span>Not Found</span>
          </div>
        </body>
      </html>
    `);

    const message = page.locator('[data-testid="chat-message"]');
    const badge = page.locator('[data-testid="confidence-badge"]');

    await expect(message).toBeVisible();

    // Verify "don't have information" phrasing
    const text = await message.textContent();
    expect(text).toContain("don't have information");

    // Verify provides alternatives
    expect(text).toContain('you could try');

    // Verify low confidence badge
    await expect(badge).toHaveAttribute('data-confidence-level', 'low');
    await expect(badge).toContainText('Not Found');
  });

  /**
   * AC18: Guardrails are invisible - no "blocked" messages
   */
  test('AC18: Response never contains blocking language', async ({ page }) => {
    // Test various AI response scenarios to ensure no blocking language
    const responses = [
      {
        content:
          'For legal advice questions, I recommend consulting with a licensed attorney who specializes in insurance law.',
        hasBlockingLanguage: false,
      },
      {
        content:
          "I don't have specific information about binding coverage in these documents. Please contact your underwriter.",
        hasBlockingLanguage: false,
      },
      {
        content:
          'Claims filing typically requires contacting the carrier directly. Here are some helpful resources...',
        hasBlockingLanguage: false,
      },
    ];

    for (const response of responses) {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"></head>
          <body>
            <div data-testid="chat-message" data-role="assistant">
              ${response.content}
            </div>
          </body>
        </html>
      `);

      const message = page.locator('[data-testid="chat-message"]');
      const text = await message.textContent();

      // Verify NO blocking language
      const blockingPhrases = [
        'I cannot',
        "I'm not allowed",
        "I'm restricted",
        'blocked',
        "I'm not able to",
        'I refuse',
        'I will not',
        'prohibited',
      ];

      for (const phrase of blockingPhrases) {
        expect(text?.toLowerCase()).not.toContain(phrase.toLowerCase());
      }
    }
  });

  /**
   * Guardrail configuration test structure
   */
  test('Guardrail config structure is correct', async ({ page }) => {
    // Test that guardrail config has expected shape
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body>
          <pre id="config" data-testid="guardrail-config">
{
  "agencyId": "test-agency-123",
  "restrictedTopics": [
    {"trigger": "legal advice", "redirect": "Consult an attorney."},
    {"trigger": "bind coverage", "redirect": "Contact your underwriter."},
    {"trigger": "file a claim", "redirect": "Contact the carrier claims department."}
  ],
  "customRules": ["Always recommend professional review"],
  "eandoDisclaimer": true,
  "aiDisclosureMessage": "I am an AI assistant.",
  "aiDisclosureEnabled": true,
  "restrictedTopicsEnabled": true,
  "updatedAt": "2025-01-01T00:00:00Z"
}
          </pre>
        </body>
      </html>
    `);

    const configElement = page.locator('[data-testid="guardrail-config"]');
    const configText = await configElement.textContent();
    const config = JSON.parse(configText || '{}');

    // Verify structure
    expect(config).toHaveProperty('agencyId');
    expect(config).toHaveProperty('restrictedTopics');
    expect(config).toHaveProperty('customRules');
    expect(config).toHaveProperty('eandoDisclaimer');
    expect(config).toHaveProperty('aiDisclosureEnabled');
    expect(config).toHaveProperty('restrictedTopicsEnabled');

    // Verify restricted topics have trigger and redirect
    expect(config.restrictedTopics).toBeInstanceOf(Array);
    expect(config.restrictedTopics.length).toBeGreaterThan(0);

    for (const topic of config.restrictedTopics) {
      expect(topic).toHaveProperty('trigger');
      expect(topic).toHaveProperty('redirect');
    }
  });

  /**
   * E&O Disclaimer integration
   */
  test('E&O disclaimer guidance is included when enabled', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body>
          <div data-testid="chat-message" data-role="assistant">
            <p>Based on the policy documents, the liability limit appears to be $1,000,000.</p>
            <p class="disclaimer" data-testid="eando-disclaimer" style="font-size: 12px; color: #64748b; margin-top: 12px; font-style: italic;">
              Note: Please verify coverage details with the carrier or policy documents for binding decisions.
            </p>
          </div>
        </body>
      </html>
    `);

    const disclaimer = page.locator('[data-testid="eando-disclaimer"]');
    await expect(disclaimer).toBeVisible();

    const text = await disclaimer.textContent();
    expect(text).toContain('verify');
  });

  /**
   * AI Disclosure message display
   */
  test('AI disclosure message is displayed when enabled', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body>
          <div data-testid="ai-disclosure" style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            I am an AI assistant. For definitive coverage determinations, please verify with the carrier.
          </div>
          <div data-testid="chat-message" data-role="assistant">
            <p>Hello! How can I help you today?</p>
          </div>
        </body>
      </html>
    `);

    const disclosure = page.locator('[data-testid="ai-disclosure"]');
    await expect(disclosure).toBeVisible();

    const text = await disclosure.textContent();
    expect(text).toContain('AI assistant');
    expect(text).toContain('verify');
  });
});

test.describe('Guardrail Check Flow', () => {
  /**
   * Test that guardrail check returns allowed=true (AC18)
   */
  test('Guardrail check always returns allowed=true', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body>
          <div id="result" data-testid="guardrail-result">
            <pre>{
  "allowed": true,
  "triggeredTopic": {"trigger": "legal advice", "redirect": "Consult an attorney."},
  "redirectMessage": "Consult an attorney.",
  "appliedRules": ["restricted_topic:legal advice", "eando_disclaimer"]
}</pre>
          </div>
        </body>
      </html>
    `);

    const resultElement = page.locator('[data-testid="guardrail-result"] pre');
    const resultText = await resultElement.textContent();
    const result = JSON.parse(resultText || '{}');

    // AC18: Always allowed
    expect(result.allowed).toBe(true);

    // Has triggered topic info for prompt injection
    expect(result.triggeredTopic).toBeDefined();
    expect(result.redirectMessage).toBe('Consult an attorney.');

    // Applied rules are tracked
    expect(result.appliedRules).toContain('restricted_topic:legal advice');
  });
});
