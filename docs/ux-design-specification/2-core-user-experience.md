# 2. Core User Experience

## 2.1 Core Experience Definition

**Two Equal Pillars:**
1. **Document Q&A** - Upload → Ask → Get answer with source citation
2. **Quote Comparison** - Upload multiple quotes → See side-by-side differences

Both are equally weighted - agents need both capabilities daily.

**What Must Be Effortless:** Query speed. The moment between asking a question and getting an answer must feel instant. No waiting, no spinning, no "processing..." messages that make them doubt.

**Critical Interaction to Nail:** The AI response experience. It must feel like talking to a knowledgeable coworker - natural, conversational, helpful. If it feels "weird" or robotic or overly formal, agents will abandon it.

**Platform:** Web application (browser-based)
- No installation required
- Works on any device
- No IT involvement needed
- Chosen specifically for non-tech-savvy audience

## 2.3 Desired Emotional Response

**The docuMINE Feeling:** Professional Empowerment

Users should feel:
1. **Empowered and in control** - "I've got this" - The tool amplifies their expertise, doesn't replace it
2. **Confident and capable** - "I can trust this" - They know the answers are right because they can verify them
3. **Efficient and productive** - "I'm getting so much done" - Real time savings they can feel

**What this means for design:**
- Clean, professional aesthetic (not playful or flashy)
- Speed is a feature - every interaction should feel instant
- Transparency builds trust - always show sources, never hide the "how"
- Respect their expertise - collaborative language, not authoritative
- No friction, no cleverness - just competent assistance

**The Analogy:** Like having a really sharp junior associate who always has the right document pulled up and speaks plainly.

## 2.4 Inspiration Analysis

**Reference Apps:** ChatGPT, Microsoft Copilot, Microsoft 365 Suite

These choices reveal users are comfortable with:

**ChatGPT:**
- Zero learning curve - open it, type, get answer
- Clean, focused interface - just the conversation
- Conversational flow - feels natural, like texting a smart friend
- Minimal UI chrome - content takes center stage

**Microsoft Copilot:**
- AI embedded in familiar tools, not a separate app
- Conversational UX as core interaction model
- Collapsible/minimal navigation - reduces cognitive load
- Trust signals built in - citations, sources, transparency
- "Nearly invisible" design - AI runs seamlessly in background

**Microsoft 365 / Fluent UI:**
- Familiar patterns users live in all day
- Clean, natural, consistent design
- Professional, not flashy - subtle, approachable
- Things stay where users expect them

**UX Patterns to Apply:**

| Pattern | Application |
|---------|-------------|
| Conversation-first | Chat interface as primary interaction |
| Familiarity | Microsoft-like feel and patterns |
| Minimal chrome | Strip away everything non-essential |
| Speed perception | Responses stream/build visibly |
| Trust through transparency | Always show sources |
| Professional tone | Clean, natural, not trendy |

**Design Direction:** Microsoft Fluent-inspired aesthetic - clean, professional, immediately comfortable for this audience.

## 2.5 Defining Experience

**The One-Liner:** "AI that actually works for insurance. Fast, reliable, accurate. Super easy to use."

This captures the three trust barriers docuMINE breaks through:
1. **"Actually works"** - Unlike generic AI tools that burned them before
2. **"Fast, reliable, accurate"** - The trifecta they've been told is impossible
3. **"Super easy to use"** - No learning curve, no complexity

**Standard Patterns Apply:**
The core interactions (document upload, chat Q&A, comparison tables) follow established UX patterns:
- Document upload: Drag-drop or click (standard file upload)
- Chat interface: ChatGPT-style conversation (proven pattern)
- Comparison: Side-by-side table with highlighting (standard comparison UX)
- Authentication: Standard login/signup flows

**No Novel Interaction Mechanics Needed:**
Unlike apps that invented new interactions (Tinder's swipe, Snapchat's disappearing content), docuMINE uses familiar patterns. The innovation is in the *output* (verified, cited answers) not the *interaction*.

**UX Focus:** Make the familiar patterns feel exceptionally fast, trustworthy, and effortless.

## 2.6 Core Experience Principles

| Principle | Definition | Example |
|-----------|------------|---------|
| **Speed** | Every interaction should feel instant. If something takes time, show progress immediately. | Response text streams in (like ChatGPT), not spinner → full answer |
| **Guidance** | Minimal - users are experts. Get out of their way. No tutorials, tooltips, or hand-holding. | Empty state just says "Upload a document or ask a question" |
| **Flexibility** | Low - constrained to prevent errors. Clear paths, not open canvases. | One way to upload, one way to ask, one way to compare |
| **Feedback** | Subtle but trustworthy. Confidence indicators, source links. Never celebratory. | Small badge for [High Confidence], not confetti or animations |

**The Speed Principle in Detail:**
- Text streams in character-by-character (perceived speed)
- Source citation appears as soon as found (not after full response)
- No loading spinners longer than 200ms - use skeleton/shimmer instead
- Document upload shows progress immediately (not "processing...")
- Comparison extraction shows each field as it's found

**The Trust Principle in Detail:**
- Conversational language: "I found..." not "The answer is..."
- Honest uncertainty: "I'm not seeing that in this document" not silence
- Always cite: Every claim links to source, no exceptions
- Understated confidence: High confidence is the default, only call out when uncertain

## 2.7 Project Understanding Summary

| Aspect | Summary |
|--------|---------|
| **Vision** | AI-powered document analysis that solves the trust problem - speed AND accuracy |
| **Users** | Old-school insurance agents who need tools that "just work" - skeptical of tech, experts in their field |
| **Core Experience** | Two equal pillars: Document Q&A and Quote Comparison |
| **Desired Feeling** | Professional empowerment: Empowered + Confident + Efficient |
| **Platform** | Web application, browser-based |
| **Inspiration** | ChatGPT (conversation flow), Copilot (trust signals), Microsoft 365 (familiar comfort) |
| **Design Direction** | Microsoft Fluent-inspired - clean, professional, minimal, familiar |
| **Critical to Nail** | AI responses must feel like talking to a coworker - natural, not weird |

**UX Complexity:** Moderate
- Standard patterns for: authentication, document management, comparison tables
- Novel pattern needed: conversational AI with inline source citations and confidence scoring

## 2.6 Novel UX Patterns

**Pattern: Conversational AI with Verifiable Responses**

This is docuMINE's defining UX challenge - making AI responses feel like a coworker conversation while maintaining trust through transparency.

**Standard AI Chat Patterns (from ChatGPT/Copilot):**
- Streaming text responses (builds trust through perceived speed)
- Conversational history in thread format
- Simple text input at bottom of screen
- Follow-up questions in natural flow

**Novel Pattern Required: Trust-Transparent Responses**

Each AI response must include:
1. **Natural Language Answer** - conversational, helpful, like a coworker
2. **Source Citation** - clickable link to exact document location
3. **Confidence Indicator** - [High Confidence] / [Needs Review] / [Not Found]

The challenge: integrate these trust elements WITHOUT making responses feel robotic or cluttered.

**Design Approach:**
- Answer text is primary - reads naturally
- Source citation is subtle but always present (small link/badge)
- Confidence indicator is understated for high confidence, more prominent for "Needs Review"
- Clicking source opens document viewer with highlighted passage

---
