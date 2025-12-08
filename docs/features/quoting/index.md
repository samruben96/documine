# Quoting (Phase 3 & 4)

> From clipboard helper to fully automated AI-powered background quoting.

## Status: Planned (After Reporting)

## Overview

Quoting addresses the #1 time sink for insurance agents: portal hopping across 15+ carrier websites to get quotes for a single prospect.

## Two-Phase Approach

### Phase 3: Quoting Helper (No Extension)

Low-friction entry to prove value without requiring downloads.

**Features:**
- Structured client data capture (enter once)
- "Copy to clipboard" formatted for each carrier
- Direct links to carrier portals
- Manual quote result entry for comparison docs

**Value:** Zero download friction, teaches us carrier data formats

### Phase 4: AI-Powered Background Quoting

Full automation using AI-powered RPA.

**Features:**
- User enters client info, clicks "Get Quotes"
- System handles everything in background
- Returns aggregated results
- Works with ANY carrier (user can add their own)

**Architecture:** AI Vision Agent (Claude Computer Use / GPT-4V) + Recipe Caching + Self-Healing

## Key Decision: AI-Powered RPA

Instead of traditional RPA (custom scripts per carrier), we're building an AI-powered system that:

- **Generalizes** across any carrier portal
- **Self-heals** when carrier sites change
- **Learns** and improves over time
- **Scales** without engineering work per carrier

## Initial Carriers
- Progressive
- Travelers

## Reliability Targets

| Metric | Phase 3 | Phase 4 |
|--------|---------|---------|
| Automation | Manual (clipboard) | 85-90% |
| Time per carrier | User-dependent | 1-2 min |
| Carriers supported | Progressive, Travelers | Any |

## Documents

| Document | Status | Description |
|----------|--------|-------------|
| PRD | Not Started | Product requirements |
| Architecture | Not Started | AI agent architecture |
| Research | Not Started | Claude Computer Use, browser automation |

## Reference

- [Full Brainstorm](../documine-suite-brainstorm-2025-12-07.md#phase-3-quoting-helper-no-extension)
- [AI-Powered Quoting Details](../documine-suite-brainstorm-2025-12-07.md#phase-4-ai-powered-background-quoting)

---

*Last updated: 2025-12-07*
