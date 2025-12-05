# OpenAI SDK Usage (Story 7.2, 2025-12-03)

## Structured Outputs with zodResponseFormat

For extracting structured data from documents, use OpenAI SDK's `zodResponseFormat` instead of function calling:

```typescript
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const mySchema = z.object({
  field1: z.string().nullable().default(null),
  field2: z.number().nullable().default(null),
  items: z.array(z.object({
    name: z.string(),
    value: z.number(),
  })),
});

const response = await openai.chat.completions.parse({
  model: 'gpt-5.1',
  messages: [...],
  response_format: zodResponseFormat(mySchema, 'my_extraction'),
  temperature: 0.1,  // Low for consistent extraction
});

const parsed = response.choices[0].message.parsed;  // Already typed!
```

**Key Points:**
- Use `.nullable().default(null)` for optional fields (not `.optional()`) to ensure consistent null handling
- `message.parsed` is automatically typed and validated against the Zod schema
- No manual JSON parsing or validation needed
- Model: `gpt-5.1` (400K context window)

**Files using this pattern:**
- `src/lib/compare/extraction.ts` - Quote data extraction
- `src/types/compare.ts` - Zod schemas with `quoteExtractionSchema`

## Future Consideration: @openai/agents SDK

For future multi-agent workflows, consider the [OpenAI Agents SDK](https://openai.github.io/openai-agents-js/):

```bash
npm install @openai/agents zod@3
```

**When to use:**
- Multi-agent coordination with handoffs
- Complex agentic workflows with guardrails
- Built-in tracing and debugging

**Current decision:** Not needed for single-extraction use case; zodResponseFormat is sufficient.
