# Story 16.3: Project Management - Rename & Archive

**Epic:** 16 - AI Buddy Projects
**Status:** done
**Points:** 3
**Created:** 2025-12-07
**Context:** [16-3-project-management.context.xml](./16-3-project-management.context.xml)

---

## User Story

**As a** user of AI Buddy,
**I want** to rename and archive my projects,
**So that** I can keep my project list organized and relevant to my current work.

---

## Background

This story adds project management capabilities beyond creation. Users need to rename projects when client names change or when they want better organization. They also need to archive completed projects to declutter their sidebar without losing historical data.

**Key Value Proposition:** Agents can maintain a clean, organized project list that reflects their current workload while preserving historical client data for compliance and reference.

**Dependencies:**
- Story 16.1 (Project Creation & Sidebar) - DONE - provides project list and card components
- Story 16.2 (Project Context Switching) - Can run in parallel (no dependency)

---

## Acceptance Criteria

### Context Menu (FR12)

- [ ] **AC-16.3.1:** Right-click on project card shows context menu with "Rename" and "Archive" options
- [ ] **AC-16.3.2:** Selecting "Rename" enables inline editing of project name

### Rename Functionality

- [ ] **AC-16.3.3:** Enter saves renamed project, Escape cancels edit
- [ ] **AC-16.3.4:** Renamed project updates immediately (optimistic update)

### Archive Functionality

- [ ] **AC-16.3.5:** Archive shows confirmation dialog "Archive [Project Name]?"
- [ ] **AC-16.3.6:** Confirming archive sets `archived_at` and removes project from main list

### View Archived

- [ ] **AC-16.3.7:** "View Archived" link shows archived projects with restore option
- [ ] **AC-16.3.8:** Restoring project clears `archived_at` and returns to main list

---

## Technical Requirements

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/ai-buddy/project-context-menu.tsx` | Right-click context menu with Rename/Archive options |
| `src/components/ai-buddy/archive-confirmation-dialog.tsx` | Confirmation dialog for archive action |
| `src/components/ai-buddy/archived-projects-sheet.tsx` | Sheet/drawer showing archived projects with restore |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/ai-buddy/project-card.tsx` | Add context menu trigger, inline edit mode for rename |
| `src/components/ai-buddy/project-sidebar.tsx` | Add "View Archived" link at bottom of projects section |
| `src/app/api/ai-buddy/projects/[id]/route.ts` | Add PATCH (rename) and DELETE (archive) handlers |
| `src/hooks/ai-buddy/use-projects.ts` | Add `updateProject`, `archiveProject`, `restoreProject` mutations |

### Component Design: ProjectContextMenu

```typescript
// src/components/ai-buddy/project-context-menu.tsx

interface ProjectContextMenuProps {
  project: Project;
  onRename: () => void;
  onArchive: () => void;
  children: React.ReactNode;  // Trigger element (ProjectCard)
}

// Uses @radix-ui/react-context-menu via shadcn
export function ProjectContextMenu({ project, onRename, onArchive, children }: ProjectContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onRename}>
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem onClick={onArchive}>
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
```

### Component Design: ProjectCard (Inline Edit)

```typescript
// Inline edit mode for project name

interface ProjectCardProps {
  project: Project;
  isActive: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onRename: (newName: string) => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onArchive: () => void;
}

// When isEditing=true:
// - Name replaced with <Input> prefilled with current name
// - Enter saves (calls onRename)
// - Escape cancels (calls onCancelEdit)
// - Focus trap on input
```

### API Contracts

**PATCH /api/ai-buddy/projects/[id]**
```typescript
// Request
interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

// Response
interface UpdateProjectResponse {
  data: Project;
  error: null;
}

// Errors
// AIB_104: Project not found
// AIB_105: Not authorized to modify this project
// AIB_102: Name exceeds 100 characters
```

**DELETE /api/ai-buddy/projects/[id]**
```typescript
// Soft delete - sets archived_at
// Response
interface ArchiveProjectResponse {
  data: { success: true; archivedAt: string };
  error: null;
}

// Errors
// AIB_104: Project not found
// AIB_105: Not authorized to delete this project
```

**PATCH /api/ai-buddy/projects/[id]/restore**
```typescript
// Clears archived_at
// Response
interface RestoreProjectResponse {
  data: Project;
  error: null;
}
```

---

## Sub-Tasks

### Phase A: Context Menu & Inline Edit

- [ ] **T1:** Install shadcn context-menu component if not present (`npx shadcn@latest add context-menu`)
- [ ] **T2:** Create `src/components/ai-buddy/project-context-menu.tsx` with Rename/Archive options
- [ ] **T3:** Update `project-card.tsx` to wrap with context menu trigger
- [ ] **T4:** Add inline edit mode to `project-card.tsx`:
  - `isEditing` state
  - Input field with current name
  - Enter to save, Escape to cancel
  - Focus trap on input
- [ ] **T5:** Unit tests for ProjectContextMenu
- [ ] **T6:** Unit tests for ProjectCard inline edit mode

### Phase B: API Endpoints

- [ ] **T7:** Update `src/app/api/ai-buddy/projects/[id]/route.ts`:
  - PATCH handler for rename (update name/description)
  - DELETE handler for archive (set archived_at)
- [ ] **T8:** Create restore endpoint logic (PATCH with `restore: true` or separate route)
- [ ] **T9:** Integration tests for PATCH/DELETE endpoints

### Phase C: Hook Updates

- [ ] **T10:** Add `updateProject` mutation to `use-projects.ts`:
  - Optimistic update
  - Rollback on error
  - Toast on success/error
- [ ] **T11:** Add `archiveProject` mutation to `use-projects.ts`:
  - Optimistic remove from list
  - Rollback on error
  - If archived project was active, clear selection
- [ ] **T12:** Add `restoreProject` mutation to `use-projects.ts`
- [ ] **T13:** Unit tests for hook mutations

### Phase D: Archive UI & View Archived

- [ ] **T14:** Create `archive-confirmation-dialog.tsx` with project name
- [ ] **T15:** Create `archived-projects-sheet.tsx`:
  - Sheet/drawer showing archived projects
  - Each project has "Restore" button
  - Empty state: "No archived projects"
- [ ] **T16:** Add "View Archived" link to `project-sidebar.tsx`
- [ ] **T17:** Wire up archive confirmation dialog in project-card
- [ ] **T18:** Component tests for archive dialog and archived sheet

### Phase E: E2E Testing

- [ ] **T19:** E2E test: Right-click context menu shows options
- [ ] **T20:** E2E test: Rename project via inline edit
- [ ] **T21:** E2E test: Archive project and verify removal from list
- [ ] **T22:** E2E test: View archived projects and restore

---

## Test Scenarios

### Unit Tests

| Scenario | Expected |
|----------|----------|
| Right-click project card | Context menu appears with Rename/Archive |
| Click Rename in menu | Inline edit mode activates, input focused |
| Enter in inline edit | Save triggered with new name value |
| Escape in inline edit | Edit cancelled, original name restored |
| Click Archive in menu | Confirmation dialog appears |
| Confirm archive | archiveProject called with project ID |

### Integration Tests

| Scenario | Expected |
|----------|----------|
| PATCH /projects/[id] with new name | Project updated, returns updated project |
| PATCH /projects/[id] unauthorized | 403 with AIB_105 |
| DELETE /projects/[id] | archived_at set, returns success |
| Restore archived project | archived_at cleared, project returned |

### E2E Tests

| Scenario | Expected |
|----------|----------|
| Full rename flow | Right-click → Rename → Type new name → Enter → Name updated |
| Full archive flow | Right-click → Archive → Confirm → Project removed from sidebar |
| View archived | Click "View Archived" → Sheet opens → Archived projects shown |
| Restore project | Click Restore → Project returns to main list |

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Story 16.1: Project Creation & Sidebar | Hard | Done | project-card.tsx, use-projects.ts |
| /api/ai-buddy/projects/[id]/route.ts | Soft | Exists | Need to add PATCH/DELETE handlers |
| AiBuddyContext | Soft | Done | For archiveProject clearing active selection |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@radix-ui/react-context-menu` | via shadcn | Right-click context menu |
| `@radix-ui/react-alert-dialog` | via shadcn | Archive confirmation |
| `lucide-react` | ^0.554.0 | Pencil, Archive icons |

---

## Out of Scope

- Permanent deletion of archived projects
- Bulk archive/restore
- Project color/icon customization
- Project export/backup
- Undo archive (no toast with undo action)

---

## Definition of Done

- [ ] All acceptance criteria (AC-16.3.1 through AC-16.3.8) verified
- [ ] All sub-tasks (T1 through T22) completed
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Build passes (`npm run build`)
- [ ] Code reviewed and approved
- [ ] Merged to main

---

## Dev Notes

### Architecture Patterns

- **Verify-Then-Service Pattern:** For PATCH/DELETE, verify ownership via RLS SELECT, then use service client for mutation
- **Optimistic Updates:** React Query `onMutate` for immediate UI feedback
- **Soft Delete:** Archive sets `archived_at`, never hard deletes for compliance

### Existing Code to Reference

- `src/components/ai-buddy/project-card.tsx` - Base component to extend
- `src/hooks/ai-buddy/use-projects.ts` - Add mutations here
- `src/app/api/ai-buddy/projects/[id]/route.ts` - Existing route to extend
- `src/lib/ai-buddy/project-service.ts` - Service layer pattern

### Project Structure Notes

```
src/
├── components/ai-buddy/
│   ├── project-context-menu.tsx       # NEW
│   ├── archive-confirmation-dialog.tsx # NEW
│   ├── archived-projects-sheet.tsx    # NEW
│   ├── project-card.tsx               # MODIFY - add inline edit, context menu
│   └── project-sidebar.tsx            # MODIFY - add View Archived link
├── app/api/ai-buddy/projects/[id]/
│   └── route.ts                       # MODIFY - add PATCH/DELETE handlers
└── hooks/ai-buddy/
    └── use-projects.ts                # MODIFY - add mutations
```

### References

- [Source: docs/sprint-artifacts/epics/epic-16/tech-spec.md#Story-16.3]
- [Source: docs/features/ai-buddy/architecture.md#Projects-CRUD]
- [Source: docs/features/ai-buddy/ux-design/ux-design-specification.md]

---

## Learnings from Previous Story

**From Story 16.1 (Status: Done)**

- **Verify-Then-Service Pattern:** For RLS bypass after ownership verification, use service client
- **Optimistic Updates:** Use React Query `useMutation` with `onMutate` for immediate feedback
- **Error Codes:** Follow `AIB_XXX` pattern (AIB_104 for not found, AIB_105 for unauthorized)
- **Project Card Pattern:** Existing card shows name truncation and document count - extend for edit mode
- **Test Organization:** Component tests in `__tests__/components/ai-buddy/`

**Files Created in 16.1 (Available for Extension):**
- `src/components/ai-buddy/project-card.tsx` - EXTEND with inline edit and context menu
- `src/hooks/ai-buddy/use-projects.ts` - EXTEND with update/archive/restore mutations
- `src/app/api/ai-buddy/projects/[id]/route.ts` - EXTEND with PATCH/DELETE handlers

[Source: docs/sprint-artifacts/epics/epic-16/stories/16-1-project-creation-sidebar/16-1-project-creation-sidebar.md]

---

## Dev Agent Record

### Context Reference

- [16-3-project-management.context.xml](./16-3-project-management.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- **2025-12-08**: Code review APPROVED
  - All 8 ACs verified ✅
  - Unit tests: 2009 passing
  - Build: ✅ Passes
  - Security: No Supabase advisory issues
  - Minor note: onBlur saves inline edits (acceptable UX)

### File List

**Created:**
- `src/components/ai-buddy/project-context-menu.tsx`
- `src/components/ai-buddy/archive-confirmation-dialog.tsx`
- `src/components/ai-buddy/archived-projects-sheet.tsx`
- `__tests__/components/ai-buddy/project-context-menu.test.tsx`
- `__tests__/components/ai-buddy/archive-confirmation-dialog.test.tsx`
- `__tests__/components/ai-buddy/archived-projects-sheet.test.tsx`
- `__tests__/e2e/ai-buddy-project-management.spec.ts`

**Modified:**
- `src/components/ai-buddy/project-card.tsx` - Added inline edit, context menu
- `src/components/ai-buddy/project-sidebar.tsx` - Added View Archived link
- `src/app/api/ai-buddy/projects/[id]/route.ts` - Added PATCH/DELETE handlers
- `src/hooks/ai-buddy/use-projects.ts` - Added updateProject, restoreProject, fetchArchivedProjects
- `src/lib/ai-buddy/errors.ts` - Added AIB_104, AIB_105 error codes
- `src/contexts/ai-buddy-context.tsx` - Added archive state management
- `src/app/(dashboard)/ai-buddy/layout.tsx` - Wired up dialogs
