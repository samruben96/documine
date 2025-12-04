# Epic YOLO Workflow v2.0

**Purpose:** Rapid epic execution with smart status handling - run all stories continuously through their full lifecycle.

**Commands:**
- Slash: `/bmad:bmm:workflows:epic-yolo [epic-id]`
- Asterisk: `*epic-yolo [epic-id]`

**Use when:**
- Epic has a complete tech-spec with all stories defined
- Stories are well-defined with clear acceptance criteria
- You want fast iteration without intermediate pauses

---

## How It Works (v2.0 - Smart Status Handling)

The workflow automatically determines what action to take based on each story's current status:

```
backlog ──create-story──▶ drafted ──story-context──▶ ready-for-dev
                                                          │
                                                     dev-story
                                                          │
                                                          ▼
done ◀──code-review── review ◀─────────────────── in-progress
  │
  └──▶ /compact ──▶ (next story)
```

| Current Status | Action | Next Status |
|----------------|--------|-------------|
| `backlog` | `/bmad:bmm:workflows:create-story` | `drafted` |
| `drafted` | `/bmad:bmm:workflows:story-context` | `ready-for-dev` |
| `ready-for-dev` | `/bmad:bmm:workflows:dev-story` | `review` |
| `in-progress` | `/bmad:bmm:workflows:dev-story` | `review` |
| `review` | `/bmad:bmm:workflows:code-review` | `done` |
| `done` | `/compact` → next story | - |

---

## Invocation

### Slash Command (Claude Code)
```
/bmad:bmm:workflows:epic-yolo F2
/bmad:bmm:workflows:epic-yolo 10
```

### Asterisk Command (BMad Master)
```
*epic-yolo F2
*epic-yolo 10
```

### Natural Language
```
"Run Epic F2 in YOLO mode"
"Execute all remaining stories for Epic 8"
"Continue with YOLO pipeline"
```

---

## Key Behaviors

| Aspect | Standard Workflow | Epic YOLO v2.0 |
|--------|-------------------|----------------|
| Scope | Single story | All stories in epic |
| Status Handling | Manual transitions | Smart auto-detection |
| Story Drafting | Separate step | Automatic if backlog |
| Context Generation | Separate step | Automatic if drafted |
| Commits | After code review | After each story completion |
| Pushes | Manual | Automatic after each story |
| Review | Full code review workflow | Integrated in pipeline |
| Context Cleanup | Manual | `/compact` after each story push |

---

## HALT Conditions

The workflow stops automatically when:
- 3 consecutive implementation failures on same task
- Test suite fails and cannot be fixed in 3 attempts
- Build fails with unfixable error
- User explicitly requests stop
- Dependency missing that requires user approval
- Database migration fails

---

## When NOT to Use

- New/unfamiliar codebase
- Complex architectural changes
- Stories with ambiguous requirements
- When external review is required
- Security-sensitive changes

---

## Example Session (Epic F2)

```
User: *epic-yolo F2

Agent: 📋 **Epic YOLO Pipeline v2.0 Loaded**

       Epic: F2 - Document Library & Intelligence
       Stories: 5 total

       | # | Story | Current Status | Next Action |
       |---|-------|----------------|-------------|
       | 1 | F2-1 | backlog | create-story |
       | 2 | F2-2 | backlog | create-story |
       | 3 | F2-3 | backlog | create-story |
       | 4 | F2-4 | backlog | create-story |
       | 5 | F2-5 | backlog | create-story |

       Mode: Smart status handling - each story advances through full lifecycle

       🚀 Starting Story F2-1: Document Library Page...
       Status: backlog → Running create-story workflow...
       ✓ Story file created

       📝 Status: drafted → Running story-context workflow...
       ✓ Context XML generated

       ⚙️ Status: ready-for-dev → Running dev-story workflow...
       [Implementation...]
       ✓ All ACs implemented, tests passing

       🔍 Status: review → Running code-review workflow...
       ✓ Code review passed

       ✅ Story F2-1 Complete (commit: abc1234, pushed)

       🧹 Running /compact to free context...
       ✓ Conversation compacted

       📋 Continuing to F2-2...
       [continues through all stories]

       🎉 **Epic F2 Complete!**
       - Stories: 5 completed
       - Commits: 5 made
       - All pushed to remote
```

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2025-12-04 | v2.1 | Added `/compact` after each story push to free context |
| 2025-12-04 | v2.0 | Added smart status handling, auto-push, slash/asterisk commands |
| 2025-12-03 | v1.0 | Initial documentation based on Epic 8 execution |
