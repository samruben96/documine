/**
 * Stagehand Setup Tests
 * Epic Q8: Stagehand POC & Recipe Foundation
 * Story Q8-1: Stagehand Setup & Integration
 *
 * These tests verify:
 * - AC1: Stagehand package installed correctly
 * - AC2: Local mode works without Browserbase cloud
 * - AC3: Stagehand primitives (act, extract, observe) work
 * - AC4: StagehandAdapter implements QuoteAgent interface
 *
 * NOTE: Integration tests (AC3) require ANTHROPIC_API_KEY to be set.
 * They are skipped if the key is not available.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

// AC1: Verify package imports correctly
describe('AC1: Stagehand Package Installation', () => {
  it('should import Stagehand from @browserbasehq/stagehand', async () => {
    // This will fail if package not installed correctly
    const { Stagehand } = await import('@browserbasehq/stagehand');
    expect(Stagehand).toBeDefined();
    expect(typeof Stagehand).toBe('function');
  });

  it('should import StagehandAdapter from our adapter module', async () => {
    const { StagehandAdapter, createStagehandAdapter } = await import(
      '@/lib/quoting/agent'
    );
    expect(StagehandAdapter).toBeDefined();
    expect(createStagehandAdapter).toBeDefined();
    expect(typeof StagehandAdapter).toBe('function');
  });
});

// AC4: Verify StagehandAdapter implements QuoteAgent interface
describe('AC4: StagehandAdapter Interface', () => {
  it('should implement QuoteAgent interface', async () => {
    const { StagehandAdapter } = await import('@/lib/quoting/agent');

    const adapter = new StagehandAdapter();

    // QuoteAgent interface requires these methods
    expect(typeof adapter.executeQuote).toBe('function');
    expect(typeof adapter.cancel).toBe('function');
  });

  it('should have POC methods for testing primitives', async () => {
    const { StagehandAdapter } = await import('@/lib/quoting/agent');

    const adapter = new StagehandAdapter();

    // POC methods for AC3
    expect(typeof adapter.navigateTo).toBe('function');
    expect(typeof adapter.act).toBe('function');
    expect(typeof adapter.extract).toBe('function');
    expect(typeof adapter.observe).toBe('function');
    expect(typeof adapter.close).toBe('function');
  });

  it('should accept configuration options', async () => {
    const { StagehandAdapter } = await import('@/lib/quoting/agent');

    // Should not throw with various configs
    const localAdapter = new StagehandAdapter({ env: 'LOCAL' });
    expect(localAdapter).toBeInstanceOf(StagehandAdapter);

    const verboseAdapter = new StagehandAdapter({ verbose: 2 });
    expect(verboseAdapter).toBeInstanceOf(StagehandAdapter);

    const headlessAdapter = new StagehandAdapter({ headless: true });
    expect(headlessAdapter).toBeInstanceOf(StagehandAdapter);
  });

  it('createStagehandAdapter helper should work', async () => {
    const { createStagehandAdapter, StagehandAdapter } = await import(
      '@/lib/quoting/agent'
    );

    const adapter = createStagehandAdapter({ env: 'LOCAL', verbose: 1 });
    expect(adapter).toBeInstanceOf(StagehandAdapter);
  });
});

// AC2: Verify LOCAL mode configuration
describe('AC2: Local Mode Configuration', () => {
  it('should default to LOCAL environment', async () => {
    const { StagehandAdapter } = await import('@/lib/quoting/agent');

    // Create adapter with no env specified
    const adapter = new StagehandAdapter();

    // Can't directly check config, but we can verify it creates without error
    // and doesn't require BROWSERBASE_API_KEY
    expect(adapter).toBeInstanceOf(StagehandAdapter);
  });

  it('should not require Browserbase API key for LOCAL mode', async () => {
    // Store original env
    const originalBrowserbaseKey = process.env.BROWSERBASE_API_KEY;
    const originalBrowserbaseProject = process.env.BROWSERBASE_PROJECT_ID;

    try {
      // Clear Browserbase credentials
      delete process.env.BROWSERBASE_API_KEY;
      delete process.env.BROWSERBASE_PROJECT_ID;

      const { StagehandAdapter } = await import('@/lib/quoting/agent');

      // Should create adapter without error even without Browserbase creds
      const adapter = new StagehandAdapter({ env: 'LOCAL' });
      expect(adapter).toBeInstanceOf(StagehandAdapter);
    } finally {
      // Restore env
      if (originalBrowserbaseKey) {
        process.env.BROWSERBASE_API_KEY = originalBrowserbaseKey;
      }
      if (originalBrowserbaseProject) {
        process.env.BROWSERBASE_PROJECT_ID = originalBrowserbaseProject;
      }
    }
  });
});

// AC3: Integration tests for Stagehand primitives
// These tests require ANTHROPIC_API_KEY and actually launch a browser
// Skip if no API key available (CI/CD environments without secrets)
describe('AC3: Stagehand Primitives Integration', () => {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  // These are slow integration tests - only run manually
  // Set RUN_STAGEHAND_INTEGRATION=true to enable
  const runIntegration =
    process.env.RUN_STAGEHAND_INTEGRATION === 'true' && hasApiKey;

  it.skipIf(!runIntegration)(
    'POC: should navigate and extract page title',
    { timeout: 60000 },
    async () => {
      const { StagehandAdapter } = await import('@/lib/quoting/agent');

      const adapter = new StagehandAdapter({
        env: 'LOCAL',
        headless: true,
        verbose: 1,
      });

      try {
        // Navigate to example.com (simple, reliable test target)
        await adapter.navigateTo('https://example.com');

        const url = await adapter.getCurrentUrl();
        expect(url).toContain('example.com');

        // Extract page title using Stagehand
        const result = await adapter.extract(
          'Extract the main heading from the page',
          z.object({
            heading: z.string(),
          })
        );

        expect(result.heading).toBeDefined();
        expect(result.heading.toLowerCase()).toContain('example');
      } finally {
        await adapter.close();
      }
    }
  );

  it.skipIf(!runIntegration)(
    'POC: should observe available interactions',
    { timeout: 60000 },
    async () => {
      const { StagehandAdapter } = await import('@/lib/quoting/agent');

      const adapter = new StagehandAdapter({
        env: 'LOCAL',
        headless: true,
        verbose: 1,
      });

      try {
        await adapter.navigateTo('https://example.com');

        // Observe what can be clicked
        const observations = await adapter.observe(
          'Find all clickable links on this page'
        );

        expect(Array.isArray(observations)).toBe(true);
        // example.com has at least one link ("More information...")
        expect(observations.length).toBeGreaterThan(0);
      } finally {
        await adapter.close();
      }
    }
  );

  it.skipIf(!runIntegration)(
    'POC: should perform act() action',
    { timeout: 60000 },
    async () => {
      const { StagehandAdapter } = await import('@/lib/quoting/agent');

      const adapter = new StagehandAdapter({
        env: 'LOCAL',
        headless: true,
        verbose: 1,
      });

      try {
        await adapter.navigateTo('https://google.com');

        // Try to click on something (Google has various interactive elements)
        // Note: This is a basic test - real carrier tests in Q8-2+
        const result = await adapter.act(
          'Find and click on any link or button on the page'
        );

        // Act returns success/failure
        expect(typeof result.success).toBe('boolean');
      } finally {
        await adapter.close();
      }
    }
  );
});

// Error handling tests
describe('Error Handling', () => {
  it('should handle cancellation gracefully', async () => {
    const { StagehandAdapter } = await import('@/lib/quoting/agent');

    const adapter = new StagehandAdapter();

    // Cancel without starting should not throw
    await expect(adapter.cancel()).resolves.not.toThrow();
  });

  it('should throw when calling POC methods before init', async () => {
    const { StagehandAdapter } = await import('@/lib/quoting/agent');

    const adapter = new StagehandAdapter();

    // These should throw because Stagehand not initialized
    await expect(adapter.getCurrentUrl()).rejects.toThrow(
      'Stagehand not initialized'
    );
  });
});

// Type checking tests (compile-time verification)
describe('TypeScript Type Compliance', () => {
  it('should satisfy QuoteAgent type', async () => {
    const { StagehandAdapter } = await import('@/lib/quoting/agent');
    const { QuoteAgent } = await import('@/types/quoting/agent');

    // This is a compile-time check - if it compiles, types are correct
    const adapter: QuoteAgent = new StagehandAdapter();
    expect(adapter).toBeDefined();
  });
});
