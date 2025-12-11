# Epic YOLO - Workflow Instructions (v2.0)

```xml
<critical>The workflow execution engine is governed by: {project-root}/.bmad/core/tasks/workflow.xml</critical>
<critical>This is an ACCELERATED workflow for rapid epic completion with SMART STATUS HANDLING</critical>
<critical>Automatically runs the right workflow based on each story's current status</critical>
<critical>Execute ALL stories in sequence, advancing each through its full lifecycle</critical>

<commands>
  <slash>/bmad:bmm:workflows:epic-yolo [epic-id]</slash>
  <asterisk>*epic-yolo [epic-id]</asterisk>
  <examples>
    <example>/bmad:bmm:workflows:epic-yolo F2</example>
    <example>*epic-yolo 8</example>
    <example>Run Epic F2 in YOLO mode</example>
  </examples>
</commands>

<status_handlers>
  <handler status="backlog">
    <description>Story only exists in tech-spec, no story file yet</description>
    <action>Run /bmad:bmm:workflows:create-story to draft the story file</action>
    <next_status>drafted</next_status>
  </handler>
  <handler status="drafted">
    <description>Story file exists but no context XML</description>
    <action>Run /bmad:bmm:workflows:story-context to generate context</action>
    <next_status>ready-for-dev</next_status>
  </handler>
  <handler status="ready-for-dev">
    <description>Story has context and is ready for implementation</description>
    <action>Run /bmad:bmm:workflows:dev-story to implement</action>
    <next_status>review</next_status>
  </handler>
  <handler status="in-progress">
    <description>Story implementation was started but not completed</description>
    <action>Run /bmad:bmm:workflows:dev-story to continue/complete</action>
    <next_status>review</next_status>
  </handler>
  <handler status="review">
    <description>Implementation complete, needs code review</description>
    <action>Run /bmad:bmm:workflows:code-review</action>
    <next_status>done</next_status>
  </handler>
  <handler status="done">
    <description>Story is complete</description>
    <action>Skip - move to next story</action>
  </handler>
</status_handlers>

<workflow>

  <step n="1" goal="Load epic and analyze all story statuses">
    <action>Load sprint-status.yaml from {{sprint_artifacts}}</action>
    <action>Identify the target epic from user request (epic_id parameter)</action>
    <action>List ALL stories for this epic with their CURRENT STATUS</action>
    <action>For each story, determine which workflow step it needs</action>

    <output>
📋 **Epic YOLO Pipeline v2.0 Loaded**

**Epic:** {{epic_id}} - {{epic_name}}
**Stories:** {{story_count}} total

| # | Story | Current Status | Next Action |
|---|-------|----------------|-------------|
{{story_table}}

**Mode:** Smart status handling - each story advances through its full lifecycle
    </output>

    <check if="no stories found">
      <output>❌ No stories found for Epic {{epic_id}}. Check sprint-status.yaml.</output>
      <action>HALT</action>
    </check>

    <check if="all stories done">
      <output>✅ Epic {{epic_id}} is already complete!</output>
      <action>HALT</action>
    </check>
  </step>

  <step n="2" goal="Process next incomplete story based on its status">
    <action>Find first story that is NOT status=done</action>
    <action>Determine required action based on current status:</action>

    <substeps>
      <substep status="backlog">
        <output>
🚀 **Story {{story_key}}: {{story_title}}**
Status: backlog → Running create-story workflow...
        </output>
        <action>Execute /bmad:bmm:workflows:create-story {{story_key}}</action>
        <action>Update sprint-status.yaml: status → drafted</action>
        <action>Continue to next substep (story-context)</action>
      </substep>

      <substep status="drafted">
        <output>
📝 **Story {{story_key}}: {{story_title}}**
Status: drafted → Running story-context workflow...
        </output>
        <action>Execute /bmad:bmm:workflows:story-context {{story_key}}</action>
        <action>Update sprint-status.yaml: status → ready-for-dev</action>
        <action>Continue to next substep (dev-story)</action>
      </substep>

      <substep status="ready-for-dev OR in-progress">
        <output>
⚙️ **Story {{story_key}}: {{story_title}}**
Status: {{current_status}} → Running dev-story workflow...
        </output>
        <action>Execute /bmad:bmm:workflows:dev-story {{story_key}}</action>
        <action>Implement all acceptance criteria</action>
        <action>Run tests: npm run test</action>
        <action>Run build: npm run build</action>

        <check if="tests or build fail">
          <action>Attempt to fix (up to 3 iterations)</action>
          <action if="still failing after 3 attempts">HALT with error details</action>
        </check>

        <action>Update sprint-status.yaml: status → review</action>
        <action>Continue to next substep (code-review)</action>
      </substep>

      <substep status="review">
        <output>
🔍 **Story {{story_key}}: {{story_title}}**
Status: review → Running code-review workflow...
        </output>
        <action>Execute /bmad:bmm:workflows:code-review {{story_key}}</action>
        <action>Verify all ACs are met</action>
        <action>Update sprint-status.yaml: status → done</action>
      </substep>
    </substeps>
  </step>

  <step n="3" goal="Story completion - commit and push">
    <action>Update story file with:
      - All tasks marked [x]
      - Files list updated
      - Dev notes added
      - Change log updated
    </action>

    <action>Run git status to see changes</action>
    <action>Stage relevant files for this story</action>
    <action>Create commit with message format:
      "feat(story-X.Y): [story title]"
    </action>
    <action>Push to remote: git push</action>

    <output>
✅ **Story {{story_key}} Complete**
Commit: {{commit_hash}}
Files: {{file_count}} changed
Pushed: ✓
    </output>

    <action>Update sprint-status.yaml: set story status to done</action>

    <check if="more stories remain in epic">
      <output>
📋 **Story Complete - Continuing...**
Remaining stories: {{remaining_count}}
Next up: {{next_story_key}} - {{next_story_title}} (status: {{next_status}})
      </output>
      <goto step="2">Process next story</goto>
    </check>

    <check if="all stories complete">
      <goto step="4">Epic completion</goto>
    </check>
  </step>

  <step n="4" goal="Epic completion summary">
    <action>Calculate total metrics:
      - Stories completed
      - Commits made
      - Files changed
      - Tests added/modified
    </action>

    <output>
🎉 **Epic {{epic_id}} Complete!**

**Summary:**
- Stories: {{story_count}} completed
- Commits: {{commit_count}} made
- Files: {{total_files}} changed

**Commits:**
{{commit_list}}

**Next Steps:**
1. ✅ All commits pushed to remote
2. Run retrospective workflow: /bmad:bmm:workflows:retrospective {{epic_id}}
3. Continue to next epic
    </output>
  </step>

</workflow>

<halt_conditions>
  <condition>3 consecutive implementation failures on same task</condition>
  <condition>Test suite fails and cannot be fixed in 3 attempts</condition>
  <condition>Build fails with unfixable error</condition>
  <condition>User explicitly requests stop</condition>
  <condition>Dependency missing that requires user approval</condition>
  <condition>Database migration fails</condition>
</halt_conditions>

<output_artifacts>
  <artifact>Story files created/updated for each story</artifact>
  <artifact>Context XML files for each story</artifact>
  <artifact>Git commits for each story (pushed)</artifact>
  <artifact>Updated sprint-status.yaml</artifact>
  <artifact>Console output with progress for each story</artifact>
</output_artifacts>
```

## Usage

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
"Execute all stories for Epic 8"
"Continue YOLO pipeline for Epic F2"
```

## Smart Status Flow

```
backlog ──create-story──▶ drafted ──story-context──▶ ready-for-dev
                                                          │
                                                     dev-story
                                                          │
                                                          ▼
done ◀──code-review── review ◀─────────────────── in-progress
  │
  └──▶ (next story)
```

## Key Features (v2.0)

| Feature | Description |
|---------|-------------|
| **Smart Status** | Automatically determines which workflow to run based on story status |
| **Full Lifecycle** | Each story goes through create → context → dev → review → done |
| **Auto-Push** | Commits are pushed after each story completion |
| **Continuous** | Moves to next story automatically after completion |
| **Resume-able** | Can resume from any status if interrupted |

## When to Use

- Epic has a complete tech-spec with all stories defined
- Stories have clear acceptance criteria
- You want fast iteration through the full story lifecycle
- You trust the automated workflow sequence

## When NOT to Use

- New/unfamiliar codebase
- Complex architectural changes requiring discussion
- Stories with ambiguous requirements
- When external stakeholder review is required
- Security-sensitive changes needing detailed review
