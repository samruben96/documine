# Sprint Artifacts

Organized documentation for all project epics, stories, and related artifacts.

## Directory Structure

```
sprint-artifacts/
├── epics/
│   ├── epic-{N}/
│   │   ├── tech-spec/          # Technical specifications for the epic
│   │   │   ├── index.md        # Main tech spec (may be sharded)
│   │   │   └── *.md            # Sharded sections
│   │   └── stories/
│   │       └── {story-name}/   # One folder per story
│   │           ├── *.md        # Story document
│   │           └── *.context.xml  # Story context file
├── retrospectives/             # Epic retrospectives
├── incident-reports/           # Post-incident reports
├── validation-reports/         # Validation and audit reports
└── sprint-status.yaml          # Current sprint tracking
```

## Quick Navigation

| Epic | Description |
|------|-------------|
| [epic-0](epics/epic-0/) | Test Framework Setup |
| [epic-1](epics/epic-1/) | Project Initialization & Core Setup |
| [epic-2](epics/epic-2/) | User Authentication |
| [epic-3](epics/epic-3/) | Agency Management |
| [epic-4](epics/epic-4/) | Document Management |
| [epic-5](epics/epic-5/) | Chat Interface & AI |
| [epic-6](epics/epic-6/) | Bug Fixes & Polish |
| [epic-7](epics/epic-7/) | Quote Comparison |
| [epic-8](epics/epic-8/) | Security & Performance |
| [epic-9](epics/epic-9/) | Agency Branding & Dashboard |
| [epic-10](epics/epic-10/) | Enhanced Data Extraction |
| [epic-11](epics/epic-11/) | Async Processing |
| [epic-12](epics/epic-12/) | GCP Document AI Integration |
| [epic-f2](epics/epic-f2/) | Document Library Feature |

## Finding Artifacts

### Stories
Navigate to: `epics/epic-{N}/stories/{story-name}/`

Each story folder contains:
- `{story-name}.md` - Story document with requirements and implementation details
- `{story-name}.context.xml` - Context file for AI-assisted development

### Tech Specs
Navigate to: `epics/epic-{N}/tech-spec/`

### Retrospectives
Navigate to: `retrospectives/`

## File Naming Conventions

- **Stories**: `{epic#}-{story#}-{description}` (e.g., `5-1-chat-interface-layout`)
- **Tech Specs**: `index.md` or sharded into sections
- **Retrospectives**: `epic-{N}-retrospective.md`
