# Background & Context

## Problem Statement

The current implementation uses:
- **Chat Model**: GPT-4o ($2.50/1M input, $10/1M output)
- **Embedding Model**: text-embedding-3-small (1536 dims, $0.02/1M)

Newer models are available that may offer:
- Better accuracy for insurance document Q&A
- Lower cost per query
- Improved reasoning for complex questions
- Better handling of domain-specific terminology

## Research Findings

Based on technical research (2025-12-01) and Party Mode deep-dive (2025-12-02):

### Original OpenAI Models Considered:
| Model | Input Cost | Output Cost | Context | Notes |
|-------|-----------|-------------|---------|-------|
| GPT-4o (current) | $2.50/1M | $10.00/1M | 128K | Good baseline |
| GPT-5-mini | $0.25/1M | $2.00/1M | 196K | 90% cheaper input |
| GPT-5.1 | ~$1.25/1M | ~$10.00/1M | 196K | Adaptive reasoning |

### 🎯 UPDATED: Party Mode Research (2025-12-02)

**Decision: Use OpenRouter for multi-model access + Claude Sonnet 4.5 as primary**

The BMAD team conducted extensive research on the best LLM for insurance document Q&A. Key findings:

**Why Claude for Insurance Documents:**

1. **Superior structured document handling** - [Vellum analysis](https://www.vellum.ai/blog/claude-3-5-sonnet-vs-gpt4o) confirms: "Claude Sonnet 4 outperforms GPT-4o in text processing, formatting, and structure-preserving tasks"

2. **Better instruction following** - [Zapier comparison](https://zapier.com/blog/claude-vs-chatgpt/): "Claude shows more consistent behavior when handling tasks that require a blend of reasoning and formatting, stronger alignment to 'do not alter' instructions, and less tendency to hallucinate"

3. **Larger context window** - Claude: 200K tokens vs GPT-4o: 128K tokens. Critical for ingesting entire insurance policies.

4. **Table comprehension** - Insurance docs are 60%+ tables. Claude excels at preserving table structure and extracting accurate data.

**OpenRouter Benefits:**
- Single API, multiple providers (Anthropic, OpenAI, Google, Mistral)
- Automatic failover if one provider is down
- Easy A/B testing across different model architectures
- No vendor lock-in
- [OpenRouter Models](https://openrouter.ai/models) shows all available options

**Recommended Model Hierarchy:**

| Rank | Model | OpenRouter ID | Use Case |
|------|-------|---------------|----------|
| 🥇 Primary | **Claude Sonnet 4.5** | `anthropic/claude-sonnet-4.5` | Complex queries, tables, citations |
| 🥈 Cost-Opt | **Gemini 2.5 Flash** | `google/gemini-2.5-flash` | High-volume, 1M context |
| 🥉 Fast | **Claude Haiku 4.5** | `anthropic/claude-haiku-4.5` | Simple lookups, low latency |
| 🔄 Fallback | **GPT-4o** | `openai/gpt-4o` | Backup if others unavailable |

**Research Sources:**
- [OpenRouter Models](https://openrouter.ai/models)
- [OpenRouter Programming Rankings](https://openrouter.ai/rankings/programming) - Claude Sonnet 4.5 ranked #1
- [Claude vs GPT-4o Comparison](https://www.vellum.ai/blog/claude-3-5-sonnet-vs-gpt4o)
- [Best LLMs for Document Processing 2025](https://algodocs.com/best-llm-models-for-document-processing-in-2025/)
- [Claude Sonnet 4 vs GPT-4o for Text Processing](https://medium.com/@branimir.ilic93/claude-sonnet-4-vs-gpt-4o-the-best-ai-for-text-processing-in-2025-8b6c3a11b7f9)

**Embedding Models (unchanged):**
| Model | Dimensions | Cost | MTEB Score |
|-------|------------|------|------------|
| text-embedding-3-small (current) | 1536 | $0.02/1M | ~61% |
| text-embedding-3-large | 3072 | $0.13/1M | 64.6% |
| text-embedding-3-large (1536) | 1536 | $0.13/1M | ~62% |

---
