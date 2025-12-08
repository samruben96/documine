# AI Buddy - Product Requirements Document

**Author:** Sam
**Date:** 2025-12-07
**Version:** 1.0
**Parent Application:** docuMINE (Feature Module)

---

## Executive Summary

AI Buddy is the **engagement foundation** of docuMINE's expanded capabilities - a personalized AI assistant that transforms how independent insurance agents work by providing instant, context-aware answers while learning their preferences, clients, and workflows over time.

Unlike generic AI chatbots, AI Buddy is purpose-built for insurance with **agency-level guardrails** that protect producers from E&O exposure while giving principals the compliance controls they need. It's the daily companion that makes agents more productive without threatening their client relationships.

**Position:** An add-on feature accessible from the docuMINE dashboard, AI Buddy extends the platform from document analysis into conversational intelligence - the first step toward docuMINE becoming the AI-powered command center for independent insurance agents.

### What Makes This Special

**Guardrails are the selling point, not a limitation.**

Agency principals (the buyers with credit cards) don't just tolerate compliance controls - they *demand* them:
- Producers only discussing appointed carriers
- E&O protection built into every conversation
- Brand consistency across all AI interactions
- State-by-state compliance awareness
- Complete audit trail of all AI conversations

The two-persona model (Agent vs Admin) creates a product that **both** the daily user and the buyer love:
- **Agents** get a personal assistant that feels helpful, not restrictive
- **Principals** get peace of mind, compliance, and visibility

Combined with **three-tier learning** (explicit preferences, behavioral patterns, deep context), AI Buddy becomes more valuable over time - creating switching costs and a genuine competitive moat.

---

## Project Classification

**Technical Type:** SaaS B2B
**Domain:** Insuretech
**Complexity:** High

AI Buddy is a feature module within the docuMINE application, serving independent insurance agencies. Each agency is a tenant with its own:
- Admin configuration and guardrails
- User (producer) accounts with individual learning profiles
- Project/workspace organization by client accounts
- Conversation history and audit logs

The insuretech domain brings high regulatory complexity with state-by-state AI disclosure requirements, E&O liability considerations, and emerging NAIC model bulletins governing AI use in insurance.

### Domain Context

**Regulatory Landscape (2025):**
- **24 states** have adopted the NAIC Model Bulletin on AI use by insurers
- **6 states** have specific AI chatbot disclosure laws (California, Utah, New York, Nevada, Texas, Maine)
- **Colorado AI Act** (effective Feb 2026) requires consumer disclosure and bias prevention for "high-risk" AI
- **E&O implications:** Insurers increasingly require documentation of AI guardrails, human oversight, and explainability to provide coverage

**Key Compliance Considerations for AI Buddy:**
1. **Chatbot disclosure** - Must inform users they're interacting with AI (Maine, Utah laws)
2. **Audit trail** - Archive all AI conversations for regulatory review
3. **Human oversight documentation** - Show that agents retain decision-making authority
4. **Guardrails as E&O protection** - Demonstrable controls reduce liability exposure
5. **State-aware responses** - AI must understand multi-state compliance differences

**Strategic Insight:** These regulations are an *opportunity*, not a burden. Agencies that can demonstrate compliant AI usage gain competitive advantage. AI Buddy's guardrail architecture directly addresses what principals need to protect their agencies.

---

## Success Criteria

Success for AI Buddy means **daily engagement that drives retention** - it becomes the first thing agents open in the morning and the tool they reach for throughout the day.

**User Success:**
- Agents feel AI Buddy saves them time on tasks they used to dread
- Agents trust AI Buddy enough to use its outputs in client communications
- Agents organize their work around Projects (client accounts) naturally
- Agency principals feel confident their compliance needs are covered

**Product-Market Fit Indicators:**
- Users return daily without prompting or campaigns
- Users create multiple Projects and maintain them over time
- Admin users actively configure guardrails (not just defaults)
- Word-of-mouth referrals from satisfied agencies

**NOT Success:**
- High signup, low engagement (tire-kickers)
- Agents only using it for novelty, not real work
- Principals disabling it due to compliance concerns

### Business Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Daily Active Users | 40% of accounts | Indicates habit formation |
| Conversations/user/week | 5+ | Shows integration into workflow |
| Project creation | 80% of users create ≥1 | Validates organizational model |
| Admin guardrail setup | 60% of agencies configure | Proves value to buyers |
| Retention (30-day) | 70%+ | Feature stickiness |
| NPS | 50+ | Advocacy potential |

**Leading Indicators:**
- Time-to-first-conversation < 5 minutes from signup
- Return visit within 48 hours of first use
- Document attachment to conversation (shows real work)

---

## Product Scope

### MVP - Minimum Viable Product

The MVP delivers the core conversational experience with projects and basic guardrails - enough to prove the value proposition and establish daily usage patterns.

**Core Chat Infrastructure:**
- ChatGPT-style conversational interface with streaming responses
- Conversation history with search and organization
- Document attachment to conversations (PDFs, images)
- Context-aware responses using attached documents
- Source citations linking answers to document locations

**Projects & Workspaces:**
- Create, rename, archive Projects (organized by client account)
- Attach documents to Projects for persistent context
- Scoped conversation history per Project
- Quick-switch between Projects

**Basic Personalization (Tier 1 - Explicit):**
- User profile: name, role, preferred lines of business
- Favorite carriers list
- Agency information (name, states licensed, appointments)
- Communication style preference (formal/casual)

**Agency Admin Panel (Basic):**
- User management (invite, remove, view users)
- Basic guardrails: restricted topics, approved carriers only
- Conversation audit log (read-only view)
- Usage dashboard (conversations, users, documents)

**Onboarding:**
- Quick personalization flow (2 min): name, lines, top carriers
- Guided first conversation demonstrating value
- Immediate personalized suggestions

### Growth Features (Post-MVP)

**Enhanced Learning (Tier 2 - Behavioral):**
- Infer common question patterns from usage
- Learn document types user uploads frequently
- Detect activity patterns (time of day, workflow stages)
- Suggest relevant past conversations

**Advanced Guardrails:**
- Per-producer permission levels
- Topic restrictions with custom rules
- Carrier-specific guidance rules
- State compliance rule engine
- Scheduled audit reports (email to principal)

**Integration with docuMINE Features:**
- Seamless handoff to Document Comparison
- "Compare these quotes" action from chat
- Pull insights from previously analyzed documents
- One-click create comparison from conversation

**Collaboration Features:**
- Share conversation snippets with team members
- @mention colleagues in conversations
- Team-visible Projects (optional)

### Vision (Future)

**Deep Learning (Tier 3):**
- Learn communication voice/style for drafting
- Understand binding patterns and preferences
- Detect seasonal trends in agent's business
- Identify red flags the agent cares about
- Proactive suggestions based on patterns

**Proactive Intelligence:**
- "Heads up: 3 renewals coming up this week"
- "You usually quote Progressive for this type - want me to prep?"
- Surface relevant past conversations automatically

**Feature Integration:**
- Natural language queries against commission data (Reporting)
- "Start a quote for this client" (Quoting Helper)
- Cross-product context sharing

**Advanced Admin:**
- Custom AI personality/tone per agency
- White-label branding options
- API access for custom integrations
- SSO/SAML for enterprise agencies

---

## Domain-Specific Requirements

### Regulatory Compliance

**NAIC Model Bulletin Alignment:**
- Maintain written program for responsible AI use (documented in admin panel)
- Vendor diligence documentation (AI model providers)
- Bias testing and fairness monitoring
- Transparent disclosure of AI capabilities and limitations

**State Chatbot Disclosure Laws:**
- Clear indication that users are interacting with AI (not hiding it)
- Disclosure when asked directly (Utah SB 332)
- Proactive disclosure in states requiring it (Maine Chatbot Disclosure Act)
- Configurable disclosure messaging per agency's state requirements

**E&O Protection Architecture:**
- Complete audit trail of all AI conversations
- Human oversight documentation (agent makes final decisions)
- Source citations showing basis for AI responses
- Confidence indicators preventing over-reliance
- Guardrail enforcement logging (blocked topics, carrier restrictions)

### Insurance-Specific Requirements

**Domain Knowledge:**
- Understanding of ISO forms, endorsements, policy language
- Carrier-specific terminology awareness
- Multi-state regulation differences
- Lines of business specialization (P&C, Commercial, Personal, Life)

**Accuracy Imperative:**
- Source citations on every factual claim
- Confidence scoring: [High Confidence], [Needs Review], [Not Found]
- "I don't know" responses when appropriate (no hallucination)
- Clear distinction between policy facts and general guidance

**Agent Workflow Alignment:**
- Organized by client accounts (how agents think)
- Quick answers for common questions ("Is X covered?")
- Document-attached context for policy-specific queries
- Respects agent expertise - assists, doesn't replace

### Fraud Prevention

- Rate limiting on API usage
- Anomaly detection for unusual query patterns
- Admin alerts for suspicious activity
- No exposure of sensitive carrier/agency data through prompts

This section shapes all functional and non-functional requirements below.

---

## SaaS B2B Specific Requirements

AI Buddy operates within docuMINE's existing multi-tenant architecture, extending it with AI-specific capabilities for agency-level control and per-user personalization.

**Key SaaS Considerations:**
- Leverages existing docuMINE subscription tiers (seat-based pricing)
- AI Buddy may be a premium add-on or included in higher tiers
- Per-agency data isolation (conversations, guardrails, learning data)
- Shared infrastructure with agency-specific configuration

### Multi-Tenancy Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    docuMINE Platform                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Agency A       │  │   Agency B       │  │  Agency C   │ │
│  │  (Tenant)        │  │  (Tenant)        │  │  (Tenant)   │ │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────┤ │
│  │ • Guardrails    │  │ • Guardrails    │  │ • Guardrails│ │
│  │ • Users (seats) │  │ • Users (seats) │  │ • Users     │ │
│  │ • Projects      │  │ • Projects      │  │ • Projects  │ │
│  │ • Conversations │  │ • Conversations │  │ • Convos    │ │
│  │ • Learning Data │  │ • Learning Data │  │ • Learning  │ │
│  │ • Audit Logs    │  │ • Audit Logs    │  │ • Audit     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Tenant Isolation:**
- Conversations never cross tenant boundaries
- Learning data is per-user within tenant (not shared across agencies)
- Guardrails are tenant-specific (each agency configures their own)
- Audit logs scoped to tenant with admin-only access

**Shared Resources:**
- AI model infrastructure (API calls)
- Base insurance knowledge (ISO forms, general guidance)
- Platform features (chat UI, project management)

### Permissions & Roles

| Role | Capabilities | Target User |
|------|--------------|-------------|
| **Producer** | Chat, Projects, personal settings, view own history | Daily user (agent/CSR) |
| **Admin** | All Producer + guardrails, user management, audit logs, usage analytics | Agency principal/manager |
| **Owner** | All Admin + billing, subscription, agency settings | Account owner |

**Producer Permissions:**
- Create and manage own Projects
- Start and continue conversations
- Attach documents to conversations
- Set personal preferences (Tier 1 learning)
- View own conversation history
- Cannot see other producers' conversations
- Cannot modify guardrails

**Admin Permissions:**
- All Producer permissions
- Invite/remove users
- Configure guardrails (topics, carriers, compliance rules)
- View audit log of all conversations (read-only)
- View usage analytics dashboard
- Export audit reports
- Cannot delete audit logs

**Owner Permissions:**
- All Admin permissions
- Manage billing and subscription
- Delete agency account
- Transfer ownership
- Access billing history

---

## User Experience Principles

**Design Philosophy:** AI Buddy should feel like a knowledgeable colleague, not a chatbot. It's conversational, remembers context, and respects the agent's expertise.

**Visual Personality:**
- Clean, professional, uncluttered
- ChatGPT-familiar patterns (users know how to use it immediately)
- Insurance-appropriate (trustworthy, not playful)
- Calming colors - agents are often stressed, don't add to it

**Core UX Principles:**

1. **Invisible Guardrails** - Producers never feel restricted; they just get helpful responses within bounds
2. **Context Persistence** - AI remembers the conversation, the project, the user's preferences
3. **Speed First** - Streaming responses, instant project switching, no loading states
4. **Trust Through Transparency** - Source citations visible, confidence clear, "I don't know" when appropriate
5. **Minimal Learning Curve** - If they've used ChatGPT, they can use AI Buddy

**Two-Persona Experience:**

| Aspect | Agent Experience | Admin Experience |
|--------|------------------|------------------|
| Primary feeling | "This helps me" | "This protects us" |
| Interface | Chat-first, simple | Dashboard, controls |
| Complexity | Minimal settings | Full configuration |
| Visibility | Own work only | Agency-wide view |

### Key Interactions

**Starting a Conversation:**
1. User clicks "New Chat" or opens existing Project
2. Optional: Attach document for context
3. Type question in natural language
4. Receive streaming response with source citations

**Working with Projects:**
1. Create Project (name = client account typically)
2. Attach relevant documents (policies, quotes, applications)
3. All conversations within Project have document context
4. Switch between Projects with sidebar navigation

**Admin Configuring Guardrails:**
1. Navigate to Admin Panel > Guardrails
2. Set approved carriers (dropdown, multi-select)
3. Add restricted topics (free text with suggestions)
4. Enable/disable compliance rules (toggles)
5. Save - immediately applies to all producers

**Reviewing Audit Log:**
1. Admin navigates to Audit Log
2. Filter by user, date range, or keyword
3. View conversation transcript (read-only)
4. Export selected conversations as PDF/CSV

---

## Functional Requirements

### Chat & Conversation

- **FR1:** Users can start new conversations from the dashboard or within a Project
- **FR2:** Users can send messages and receive streaming AI responses in real-time
- **FR3:** Users can view conversation history organized by date and Project
- **FR4:** Users can search across all their conversations by keyword
- **FR5:** Users can continue previous conversations with full context retained
- **FR6:** Users can delete individual conversations from their history
- **FR7:** AI responses include source citations linking to specific document locations when referencing attached documents
- **FR8:** AI responses include confidence indicators ([High Confidence], [Needs Review], [Not Found])
- **FR9:** AI responds with "I don't know" when information is not available rather than hallucinating
- **FR10:** AI respects guardrails invisibly - responses stay within configured bounds without explicit restriction messages

### Projects & Workspaces

- **FR11:** Users can create new Projects with a name and optional description
- **FR12:** Users can rename and archive Projects
- **FR13:** Users can attach documents (PDF, images) to Projects for persistent context
- **FR14:** Users can remove documents from Projects
- **FR15:** Users can view all documents attached to a Project
- **FR16:** Conversations started within a Project automatically have access to all attached document context
- **FR17:** Users can switch between Projects via sidebar navigation
- **FR18:** Users can start a conversation outside any Project (general chat)
- **FR19:** Users can move a conversation into a Project after the fact

### Document Management

- **FR20:** Users can upload documents directly into a conversation for immediate context
- **FR21:** Users can upload documents to a Project for persistent availability
- **FR22:** System processes uploaded documents and makes content available for AI queries
- **FR23:** Users can preview attached documents within the interface
- **FR24:** System displays document processing status (uploading, processing, ready)
- **FR25:** AI can reference multiple documents within a single conversation

### Personalization & Learning (Tier 1 - Explicit)

- **FR26:** Users can set their display name and role
- **FR27:** Users can specify preferred lines of business (P&C, Commercial, Personal, Life)
- **FR28:** Users can maintain a list of favorite/preferred carriers
- **FR29:** Users can set agency information (name, states licensed)
- **FR30:** Users can choose communication style preference (formal/professional, casual/friendly)
- **FR31:** AI incorporates user preferences into response style and suggestions
- **FR32:** Users can reset their personalization settings to defaults

### Guardrails & Compliance

- **FR33:** Admins can configure a list of approved carriers for the agency
- **FR34:** AI only discusses approved carriers when guardrail is enabled
- **FR35:** Admins can define restricted topics that AI will not discuss
- **FR36:** Admins can enable/disable individual guardrail rules
- **FR37:** Guardrail changes take effect immediately for all agency users
- **FR38:** System logs all guardrail enforcement events (what was blocked, when, for whom)
- **FR39:** AI provides helpful redirection when a guardrail prevents a direct answer
- **FR40:** System displays AI disclosure message in compliance with state chatbot laws
- **FR41:** Admins can customize the AI disclosure message

### Admin Panel & User Management

- **FR42:** Admins can view a list of all users in their agency
- **FR43:** Admins can invite new users via email
- **FR44:** Admins can remove users from the agency
- **FR45:** Admins can change user roles (Producer ↔ Admin)
- **FR46:** Admins can view usage analytics (conversations per user, documents uploaded, active users)
- **FR47:** Admins can view a usage dashboard with trends over time
- **FR48:** Owners can manage billing and subscription settings
- **FR49:** Owners can transfer ownership to another Admin

### Audit & Reporting

- **FR50:** System maintains complete audit log of all AI conversations
- **FR51:** Admins can view audit log filtered by user, date range, or keyword
- **FR52:** Admins can view full conversation transcripts in audit log (read-only)
- **FR53:** Admins can export audit log entries as PDF or CSV
- **FR54:** Audit logs cannot be deleted or modified by any user
- **FR55:** Audit log entries include timestamp, user, conversation ID, and guardrail events
- **FR56:** System retains audit logs for minimum required compliance period

### Onboarding

- **FR57:** New users complete a quick personalization flow (< 2 minutes)
- **FR58:** Onboarding collects: name, lines of business, top carriers
- **FR59:** System provides guided first conversation demonstrating AI capabilities
- **FR60:** System offers personalized suggestions based on onboarding answers
- **FR61:** Users can skip onboarding and complete personalization later
- **FR62:** Admins see onboarding completion status for their users

### Integration with docuMINE

- **FR63:** AI Buddy is accessible from the main docuMINE dashboard
- **FR64:** Users can navigate between AI Buddy and Document Comparison seamlessly
- **FR65:** Documents uploaded to docuMINE are available in AI Buddy Projects
- **FR66:** AI can reference previously analyzed documents from Document Comparison

---

## Non-Functional Requirements

### Security

**Data Protection:**
- All data encrypted at rest (AES-256) and in transit (TLS 1.3)
- Conversation data isolated by tenant - no cross-agency data leakage
- Document uploads scanned for malware before processing
- PII handling compliant with privacy regulations

**Authentication & Authorization:**
- Leverages existing docuMINE authentication (Supabase Auth)
- Role-based access control enforced at API level
- Session management with secure token handling
- Admin actions require re-authentication for sensitive operations

**AI-Specific Security:**
- Prompt injection protection - sanitize user inputs
- No exposure of system prompts or guardrail configuration to users
- Rate limiting on AI API calls per user/agency
- Monitoring for unusual query patterns (potential abuse)

**Audit & Compliance:**
- Immutable audit logs (append-only, no deletion)
- Audit log retention minimum 7 years (insurance industry standard)
- All admin actions logged with timestamp and actor
- Exportable compliance reports for regulatory review

### Scalability

**Performance Targets:**
- Chat response streaming begins < 500ms from send
- Project switching < 200ms
- Search results returned < 1 second
- Document processing < 30 seconds for typical policy PDFs

**Capacity:**
- Support concurrent users across all agency tenants
- Handle document attachments up to 50MB
- Conversation history retention unlimited (within storage tier)
- No degradation during peak usage hours

**Infrastructure:**
- Leverage existing docuMINE infrastructure (Supabase, Vercel)
- AI API calls via managed service (OpenAI/Anthropic)
- Horizontal scaling for document processing queue
- CDN for static assets and document previews

### Integration

**docuMINE Platform:**
- Shared authentication and user management
- Unified navigation and dashboard
- Common document storage and processing pipeline
- Consistent design system and UI patterns

**AI Provider:**
- Primary: OpenAI GPT-4 or Anthropic Claude (configurable)
- Fallback handling if primary provider unavailable
- Token usage tracking per agency for cost allocation
- Model version management for consistent behavior

**Future Integration Points:**
- Webhook support for external system notifications
- API access for enterprise customers (post-MVP)
- AMS integration preparation (data model compatibility)

### Performance

**Responsiveness:**
- First meaningful response within 2 seconds
- Streaming updates every 100-200ms during generation
- Optimistic UI updates for user actions
- Graceful degradation if AI service is slow

**Reliability:**
- 99.5% uptime target for chat functionality
- Graceful error handling with user-friendly messages
- Automatic retry for transient AI API failures
- Offline indicator when connectivity issues detected

---

## PRD Summary

**Product:** AI Buddy
**Type:** SaaS B2B Feature (docuMINE feature module)
**Domain:** Insuretech (High Complexity)

**Functional Requirements:** 66 FRs across 8 capability areas
- Chat & Conversation (10 FRs)
- Projects & Workspaces (9 FRs)
- Document Management (6 FRs)
- Personalization & Learning (7 FRs)
- Guardrails & Compliance (9 FRs)
- Admin Panel & User Management (8 FRs)
- Audit & Reporting (7 FRs)
- Onboarding (6 FRs)
- Integration (4 FRs)

**Non-Functional Requirements:** Security, Scalability, Integration, Performance

**Key Differentiators:**
1. Guardrails as a selling point (not a limitation)
2. Two-persona model serving both agents and principals
3. Three-tier learning that increases value over time
4. Insurance-specific accuracy with source citations
5. Compliance-ready architecture (NAIC, state laws, E&O)

---

_This PRD captures the essence of AI Buddy - the personalized AI assistant that transforms how independent insurance agents work, with agency-level guardrails that protect producers while giving principals the compliance controls they need._

_Created through collaborative discovery between Sam and AI facilitator._

---

## Next Steps

1. **Architecture** - `/bmad:bmm:workflows:architecture` - Technical design for AI Buddy
2. **UX Design** - `/bmad:bmm:workflows:create-ux-design` - Detailed user flows and wireframes
3. **Epic Breakdown** - `/bmad:bmm:workflows:create-epics-and-stories` - Implementation planning

**Recommendation:** Start with UX Design to visualize the two-persona experience, then Architecture to define the AI integration patterns.
