# Sprint Artifacts Naming Conventions

**Created:** 2025-12-05
**Purpose:** Establish consistent naming for story folders, files, and references

---

## Story Naming Standard

### Folder Names

Use **hyphenated format** with story number prefix:

```
{epic#}-{story#}-{kebab-case-description}/
```

**Examples:**
- `5-1-document-upload-basic/`
- `10-7-automated-gap-analysis/`
- `12-2-document-ai-parsing-service/`

### File Names

Match the folder name with `.md` extension:

```
{epic#}-{story#}-{kebab-case-description}.md
```

**Examples:**
- `5-1-document-upload-basic.md`
- `10-7-automated-gap-analysis.md`

### Context Files

Use `.context.xml` extension with the same base name:

```
{epic#}-{story#}-{kebab-case-description}.context.xml
```

**Examples:**
- `5-1-document-upload-basic.context.xml`
- `10-7-automated-gap-analysis.context.xml`

---

## Special Cases

### Sub-Stories (Bug Fixes, Phases)

For sub-stories, append the sub-number with a hyphen:

```
{epic#}-{story#}-{sub#}-{description}/
```

**Example:**
- `5-8-1-large-document-processing/` (sub-story of 5.8)

### Future Epics (F-Series)

For future/feature epics, use `f{#}` prefix:

```
f{epic#}-{story#}-{description}/
```

**Examples:**
- `f2-1-document-library-page/`
- `f3-2-text-selection-highlighting/`

---

## Legacy Patterns (Consolidated 2025-12-05)

The following patterns have been **consolidated** into the standard hyphenated format:

| Old Pattern | Migrated To | Status |
|-------------|-------------|--------|
| `story-{epic}.{story}-{description}/` | `{epic}-{story}-{description}/` | ✅ Migrated |
| `f{epic}.{story}-{description}/` | `f{epic}-{story}-{description}/` | ✅ Migrated |

**Migration completed:** All story folders now use the hyphenated format.

---

## Sprint Status YAML

In `sprint-status.yaml`, reference stories with hyphenated keys:

```yaml
5-1-document-upload-basic: done
5-2-natural-language-query-input: done
10-7-automated-gap-analysis: done
```

---

## Directory Structure

```
docs/sprint-artifacts/epics/
├── epic-5/
│   ├── tech-spec/
│   │   └── index.md
│   └── stories/
│       ├── 5-1-document-upload-basic/
│       │   ├── 5-1-document-upload-basic.md
│       │   └── 5-1-document-upload-basic.context.xml
│       └── 5-2-natural-language-query-input/
│           ├── 5-2-natural-language-query-input.md
│           └── 5-2-natural-language-query-input.context.xml
└── epic-10/
    ├── tech-spec/
    │   └── index.md
    └── stories/
        └── 10-7-automated-gap-analysis/
            ├── 10-7-automated-gap-analysis.md
            └── 10-7-automated-gap-analysis.context.xml
```

---

## Rationale

- **Hyphenated format** is the majority (51.7% of existing stories)
- **Consistent with earlier epics** (1-9)
- **No redundant prefixes** (`story-` is unnecessary when in a `stories/` folder)
- **Clear epic association** (story 5-1 is clearly Epic 5, Story 1)
- **Alphabetically sortable** (numbers sort correctly in file explorers)
