# Epic YOLO Workflow

**Purpose:** Rapid epic execution - run all stories continuously without review pauses.

**Use when:**
- Epic has a complete tech-spec with all stories defined
- Stories are well-defined with clear acceptance criteria
- You want fast iteration without intermediate pauses

---

## How It Works

1. **Load Epic** - Read sprint-status.yaml, identify all stories for the epic
2. **Execute Stories** - For each story in sequence:
   - Mark in-progress
   - Implement all tasks
   - Run tests (unit + build)
   - Commit on completion
   - Mark done
3. **Epic Complete** - Summary of all commits and changes

---

## Invocation

Tell the agent:
```
"Run Epic 8 in YOLO mode"
"Execute all remaining stories for Epic 8"
"Continue with YOLO pipeline"
```

---

## Key Behaviors

| Aspect | Standard dev-story | Epic YOLO |
|--------|-------------------|-----------|
| Scope | Single story | All stories in epic |
| Pauses | After each story for review | None unless HALT |
| Commits | After code review approval | After each story completion |
| Status updates | Manual transitions | Automatic TODO → done |
| Review | Full code review workflow | Self-review at story level |

---

## HALT Conditions

The workflow stops automatically when:
- 3 consecutive implementation failures on same task
- Test suite fails and cannot be fixed in 3 attempts
- Build fails with unfixable error
- User explicitly requests stop
- Dependency missing that requires user approval

---

## When NOT to Use

- New/unfamiliar codebase
- Complex architectural changes
- Stories with ambiguous requirements
- When external review is required
- Security-sensitive changes

---

## Example Session (Epic 8)

```
User: Let's complete Epic 8 - run all remaining stories YOLO style

Agent: 📋 **Epic YOLO Pipeline Loaded**
       Epic: 8 - Tech Debt & Production Hardening
       Stories: 7 total (2 done, 5 remaining)

       Execution Plan:
       - 8.3: Database Index Optimization [TODO]
       - 8.4: Processing Jobs RLS Consolidation [TODO]
       - 8.5: API Rate Limiting [TODO]
       - 8.6: Test Fixes [TODO]
       - 8.7: Code Quality Cleanup [TODO]

       Mode: Continuous execution until complete or HALT

       🚀 Starting Story 8.3: Database Index Optimization...
       ...
       ✅ Story 8.3 Complete (commit: 916ae3e)

       🚀 Starting Story 8.4: Processing Jobs RLS...
       ...
       ✅ Story 8.4 Complete (commit: 4ee3362)

       [continues through all stories]

       🎉 **Epic 8 Complete!**
       - Stories: 5 completed
       - Commits: 5 made
       - All tests passing
```

---

## Commit Message Format

Each story commit follows:
```
feat(story-X.Y): [story title] - reviewed & approved

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Change Log

| Date | Change |
|------|--------|
| 2025-12-04 | Initial documentation based on Epic 8 execution |
