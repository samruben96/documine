# docuMINE Product Suite - Brainstorming Session

**Date:** 2025-12-07
**Participants:** Full BMAD Agent Team (PM, Analyst, Architect, UX Designer, Developer, Test Architect, Scrum Master, Tech Writer)
**Facilitator:** BMad Master

---

## Executive Summary

This document captures the strategic brainstorming session for expanding docuMINE from a document comparison tool into a **full product suite for independent insurance agents**.

### Vision Statement

> "docuMINE is the AI-powered command center for independent insurance agents."

### Core Insight

Insurance agents drown in repetitive, time-consuming tasks that pull them away from selling. The suite addresses three major pain points:
1. **Cognitive load** - needing quick answers and context
2. **Spreadsheet hell** - hours wasted on commission reconciliation
3. **Portal hopping** - 45-60 minutes per quote request across multiple carriers

---

## Product Suite Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    docuMINE PRODUCT SUITE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐   │
│   │  AI BUDDY   │ ──── │   REPORTS   │ ──── │   QUOTING   │   │
│   │  (Chat +    │      │  (Data →    │      │  (Multi-    │   │
│   │   Learn)    │      │   Insights) │      │   Carrier)  │   │
│   └─────────────┘      └─────────────┘      └─────────────┘   │
│          │                    │                    │           │
│          └────────────────────┼────────────────────┘           │
│                               ▼                                 │
│                    ┌─────────────────┐                         │
│                    │  DOCUMENT       │  ← (Existing Product)   │
│                    │  COMPARISON     │                         │
│                    └─────────────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: AI Buddy

### Overview
A personalized AI assistant that learns about each user over time, with agency-level guardrails for compliance and control.

### UI Design
- **ChatGPT-style interface** with sidebar for conversation history
- **Projects/Workspaces** organized by client accounts
- Documents can be attached to projects
- Quick action buttons based on user patterns

```
┌──────────────────────────────────────────────────────────────────┐
│  docuMINE AI Buddy                                 User ▼  ⚙️   │
├────────────────┬─────────────────────────────────────────────────┤
│                │                                                 │
│  📁 PROJECTS   │   💬 [Active Conversation]                      │
│  ┌───────────┐ │                                                 │
│  │ Client    │ │   Chat interface with context-aware responses  │
│  │ Account 1 │ │                                                 │
│  ├───────────┤ │   Attached documents visible                    │
│  │ Client    │ │                                                 │
│  │ Account 2 │ │                                                 │
│  └───────────┘ │                                                 │
│                │                                                 │
│  💬 RECENT     │                                                 │
│  └─ Past chats │                                                 │
│                │                                                 │
│  ➕ New Chat   │                                                 │
│  ➕ New Project│                                                 │
└────────────────┴─────────────────────────────────────────────────┘
```

### Learning Tiers

| Tier | Type | Examples |
|------|------|----------|
| **Tier 1** | Explicit (User Sets) | Preferred carriers, lines of business, agency info, state compliance |
| **Tier 2** | Behavioral (Inferred) | Common question patterns, document types uploaded, activity patterns |
| **Tier 3** | Deep Learning | Communication voice/style, binding patterns, seasonal trends, red flags they care about |

### Two-Persona Model

#### Agent View (Daily User)
- Conversational, friendly interface
- Minimal settings (name, favorite carriers, communication style)
- Feels like personal assistant
- Never sees guardrails directly

#### Admin View (Agency Principal)
- Full control panel
- Compliance rules configuration
- Restricted topics management
- Per-producer permissions
- Audit trail of all AI conversations
- Usage analytics

### Guardrails as a Feature

Agency principals (the buyers with credit cards) want:
- Producers only discussing appointed carriers
- E&O protection built in
- Brand consistency
- Compliance across state lines

**Key Insight:** Guardrails are the SELLING POINT for agency owners, not a limitation.

### Success Metrics

| Metric | Target |
|--------|--------|
| Daily Active Users | 40% of accounts |
| Avg. conversations/user/week | 5+ |
| Project creation | 80% of users create ≥1 project |
| Admin guardrail setup | 60% of agencies configure rules |
| NPS | 50+ |

### Onboarding Flow
1. Quick personalization (2 min): name, lines of business, top carriers
2. Immediate value demonstration with personalized suggestions
3. Guided first conversation

---

## Phase 2: Custom Reporting

### The Problem
- Agents receive commission statements from 15+ carriers
- Each in different formats (PDF, Excel, CSV, paper)
- Different column names, pay schedules, ID formats
- Hours spent monthly on manual reconciliation

### The Solution
AI-powered data normalization and natural language querying.

### Report Types Needed

| Report Type | Question It Answers |
|-------------|---------------------|
| Commission Summary | "How much did I make this month, by carrier?" |
| Production Trends | "Is my book growing or shrinking?" |
| Carrier Mix | "Am I too dependent on one carrier?" |
| Policy Retention | "Which policies are up for renewal? Which churned?" |
| Producer Performance | "Which of my agents is producing?" |
| Forecast | "Based on renewals, what should I expect next quarter?" |

### User Flow

1. **Upload**: Drag-and-drop Excel/CSV/PDF
2. **AI Normalizes**: Automatically maps columns with user confirmation
3. **Store**: Data accumulates in user's account over time
4. **Query**: Natural language questions through AI Buddy
5. **Generate**: Charts and exports on demand

### Upload UX

```
┌─────────────────────────────────────────────────────────────────┐
│  ✅ Got it! Here's what I found in "progressive_march.xlsx"    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 47 transactions detected                                    │
│                                                                 │
│  I mapped your columns:                                         │
│  ┌─────────────────────┬─────────────────────┐                 │
│  │ Your Column         │ I Think This Is     │                 │
│  ├─────────────────────┼─────────────────────┤                 │
│  │ "Prem Amt"          │ Premium         ✅  │                 │
│  │ "Comm Pct"          │ Commission Rate ✅  │                 │
│  │ "Agt Comm"          │ Your Commission ✅  │                 │
│  │ "XYZ123"            │ 🤔 Not sure...      │ [Tell me ▼]    │
│  └─────────────────────┴─────────────────────┘                 │
│                                                                 │
│  [Looks Good - Import] [Let Me Fix Something]                   │
└─────────────────────────────────────────────────────────────────┘
```

### Integration with AI Buddy
- Reporting is a CAPABILITY of AI Buddy, not separate module
- "What were my commissions last quarter?" → Query → Response with chart
- Seamless experience, not tab-switching

---

## Phase 3: Quoting Helper (No Extension)

### Purpose
Low-friction entry to quoting workflow. Proves value before asking users to install anything.

### Features
- Structured client data capture (enter once)
- "Copy to clipboard" formatted for each carrier
- Direct links to carrier portals
- Manual quote result entry for comparison doc generation

### UX

```
┌─────────────────────────────────────────────────────────────────┐
│  🚀 Ready to Quote - Johnson Home + Auto                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Progressive:  [Open Portal ↗]  [Copy Client Data 📋]          │
│  Travelers:    [Open Portal ↗]  [Copy Client Data 📋]          │
│                                                                 │
│  💡 Pro tip: Install our browser extension for auto-fill!      │
│     [Get Extension - Chrome] [Get Extension - Edge]             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Value Delivered
- Zero download friction
- Teaches docuMINE the carrier data formats
- Comparison doc generation ties back to existing strength
- Builds user trust before asking for extension

### Initial Carriers
- Progressive
- Travelers

---

## Phase 4: AI-Powered Background Quoting

### Vision
User enters client info, selects carriers, clicks "Get Quotes" - system handles everything in the background and returns results.

### Key Decision: AI-Powered RPA (Not Traditional RPA)

**Why AI-Powered:**
- Build once, works across ANY carrier
- Self-healing when carrier sites change
- Users can add their own carriers
- Lower maintenance burden
- Improving over time through learning

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 AI QUOTING AGENT ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Request                                                   │
│       │                                                         │
│       ▼                                                         │
│  ┌────────────────────────┐                                    │
│  │   AGENT ORCHESTRATOR   │                                    │
│  │   1. Get quote request │                                    │
│  │   2. Check recipe cache│                                    │
│  │   3. Spawn browser     │                                    │
│  │   4. Run AI agent      │                                    │
│  │   5. Return results    │                                    │
│  └───────────┬────────────┘                                    │
│              │                                                  │
│              ▼                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    AI BROWSER AGENT                       │  │
│  │  Vision → Reasoning → Action → Recipe Cache               │  │
│  │  (Claude Computer Use / GPT-4 Vision)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│              │                                                  │
│              ▼                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 SELF-HEALING LAYER                        │  │
│  │  Cached recipe fails → AI re-learns → Updates recipe      │  │
│  │  No engineering intervention needed                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Hybrid Approach: Recipe Caching

1. **First quote with new carrier:** AI reasons through the flow (~2 min)
2. **Success:** Cache the "recipe" (sequence of actions)
3. **Subsequent quotes:** Use cached recipe (fast, ~1 min)
4. **Recipe fails:** Fall back to AI reasoning, update recipe

### User-Added Carriers (Major Differentiator)

```
┌─────────────────────────────────────────────────────────────────┐
│  ➕ Add New Carrier                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Carrier Portal URL:                                            │
│  [https://agents.safeco.com________________]                   │
│                                                                 │
│  Your Login Credentials:                                        │
│  Username: [______________]                                     │
│  Password: [______________]  🔒 Encrypted & secure              │
│                                                                 │
│  [Add Carrier]                                                  │
│                                                                 │
│  💡 Our AI will learn this carrier's quote flow automatically. │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Reliability Expectations

| Metric | Target |
|--------|--------|
| Automation success rate | 85-90% |
| Time per carrier | 1-2 minutes |
| Fallback handling | Graceful - user notified if intervention needed |

### Graceful Fallback UX

```
┌─────────────────────────────────────────────────────────────────┐
│  🚀 Quoting Johnson Family...                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Progressive     ████████████████ ✅ $1,847/yr                  │
│  Travelers       ████████████████ ✅ $2,103/yr                  │
│  Safeco          ████░░░░░░░░░░░░ ⚠️ Needs attention            │
│                                                                 │
│  ⚠️ Safeco needs you for a moment:                              │
│     CAPTCHA verification required                               │
│     [Complete Verification →]                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Technical Requirements
- Secure credential vault (encrypted at rest)
- Headless browser infrastructure (Playwright)
- Claude Vision API or GPT-4V for AI agent
- Job queue system (Redis)
- SOC 2 compliance considerations

### Cost Considerations

| Model | Description |
|-------|-------------|
| Tiered plans | Include X quotes per plan tier |
| Soft limits | Heavy users upgrade or enterprise deals |
| Cost per quote | ~$0.10-0.30 (AI API calls) |

---

## Complete Roadmap

```
═══════════════════════════════════════════════════════════════════
                    docuMINE PRODUCT ROADMAP
═══════════════════════════════════════════════════════════════════

  EXISTING        PHASE 1         PHASE 2         PHASE 3         PHASE 4
  ────────        ───────         ───────         ───────         ───────
  Document    →   AI Buddy    →   Custom      →   Quote       →   AI-Powered
  Compare         + Projects      Reporting       Helper          Background
  (LIVE)          + Guardrails    + Data          (clipboard)     Quoting
                                  Normalization

  Foundation      Engagement      Data Moat       Learn           Full
                  + Revenue       + Stickiness    Portals         Automation
                                                  Zero Friction   Any Carrier

═══════════════════════════════════════════════════════════════════
```

### Phase 1 Epics (AI Buddy)
1. Core Chat Infrastructure (UI, persistence, streaming)
2. Projects & Workspaces (CRUD, document attachment, scoped history)
3. Memory & Personalization (preferences, behavioral learning, context)
4. Agency Admin Panel (guardrails, user management, audit logging)
5. Onboarding Flow (personalization, guided first conversation)

---

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Integration vs Build (quoting) | Build | $50k+ integration fees off the table |
| Traditional RPA vs AI-powered | AI-powered | Build once works everywhere, self-healing |
| Entry point feature | AI Buddy | Daily engagement, foundation for suite |
| Guardrails ownership | Admin only | Agency principals are the buyers |
| UI paradigm | ChatGPT-style | Normalized pattern, users know it |
| Projects concept | Client accounts | Agents think in accounts, not conversations |

---

## Competitive Moat

**Traditional approach moat:** "We've built integrations with 15 carriers" (replicable)

**docuMINE moat:** "We've built an AI that works with ANY carrier and learns over time" (hard to replicate)

### Flywheel Effect
```
More users → More carriers quoted → AI gets smarter → Better success rates → More users
```

---

## Next Steps

1. Create PRD for Phase 1 (AI Buddy)
2. Technical architecture for AI Buddy
3. Design UX mockups for core flows
4. Prioritize Phase 1 epics into stories
5. Research Claude Computer Use / GPT-4V capabilities for Phase 4 planning

---

*Document generated from Party Mode brainstorming session - 2025-12-07*
