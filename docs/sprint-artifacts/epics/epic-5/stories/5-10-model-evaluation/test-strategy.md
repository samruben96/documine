# Test Strategy

## Unit Tests

```typescript
// config.test.ts
describe('Model Configuration', () => {
  it('returns default config when no env vars set', () => {
    const config = getModelConfig();
    expect(config.chatModel).toBe('gpt-4o');
  });

  it('respects environment variables', () => {
    process.env.OPENAI_CHAT_MODEL = 'gpt-5-mini';
    const config = getModelConfig();
    expect(config.chatModel).toBe('gpt-5-mini');
  });

  it('A/B test assigns users consistently', () => {
    const config1 = getModelConfigForUser('user-123');
    const config2 = getModelConfigForUser('user-123');
    expect(config1.chatModel).toBe(config2.chatModel);
  });
});
```

## Manual Evaluation

For each model, manually review a sample of responses for:
- Factual accuracy (does answer match document?)
- Citation quality (are sources correct?)
- Tone appropriateness (professional, helpful)
- Handling of edge cases (ambiguous questions)

## E2E Test Checklist

- [ ] Run full evaluation with GPT-4o
- [ ] Run full evaluation with GPT-5-mini
- [ ] Compare metrics side-by-side
- [ ] Spot-check response quality
- [ ] Calculate cost projections

---
