# Acceptance Criteria

## AC-5.10.1: Chat Model Configuration (Updated for OpenRouter)
**Given** the system needs model flexibility across providers
**When** model config is updated
**Then**:
- Config supports multiple providers via OpenRouter: Claude Sonnet 4.5, Claude Haiku 4.5, Gemini 2.5 Flash, GPT-4o
- Model selection configurable via environment variable (`LLM_CHAT_MODEL`)
- Provider configurable via environment variable (`LLM_PROVIDER=openrouter`)
- No code changes required to switch models
- OpenRouter API key stored as `OPENROUTER_API_KEY`

## AC-5.10.2: Embedding Model Configuration
**Given** embedding upgrades may be beneficial
**When** embedding config is updated
**Then**:
- Config supports: text-embedding-3-small, text-embedding-3-large
- Dimension configuration: 1536 or 3072
- Backward compatible with existing embeddings (1536)

## AC-5.10.3: Per-User Model Selection
**Given** A/B testing is needed
**When** a user makes a query
**Then**:
- Feature flag can assign users to model variants
- Same user gets consistent model within session
- Assignment logged for analysis

## AC-5.10.4: Evaluation Script
**Given** the 50-query test set exists
**When** evaluation script runs
**Then**:
- All queries run against specified model
- Results captured: accuracy, latency, tokens used
- Output in structured JSON format

## AC-5.10.5: Metrics Collection
**Given** evaluation runs
**When** analyzing results
**Then** metrics include:
- Response accuracy (manual review capability)
- Time to first token (ms)
- Total response time (ms)
- Input/output token count
- Estimated cost per query

## AC-5.10.6: Documentation
**Given** evaluation is complete
**When** reviewing findings
**Then**:
- Comparison document created
- Clear recommendation with rationale
- Trade-offs documented (cost vs accuracy vs latency)

## AC-5.10.7: Cost Analysis
**Given** models have different pricing
**When** analyzing cost impact
**Then**:
- Cost per 1000 queries calculated per model
- Monthly projection based on expected usage
- ROI of improvements quantified

## AC-5.10.8: No Regression Requirement
**Given** a new model is recommended
**When** compared to current GPT-4o
**Then**:
- Response quality equal or better
- OR explicit trade-off documented and accepted

---
