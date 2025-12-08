# Epic 16: AI Buddy Projects

**Status:** Backlog
**Created:** 2025-12-07
**Planning Docs:** `docs/features/ai-buddy/`
**Additional Architecture:** `documine/docs/architecture`


## Overview

Enable users to organize their work by client accounts using Projects with persistent document context.

## Goal

Users can organize conversations by client account, matching how insurance agents naturally work.

## Functional Requirements

- **FR3:** Users can view conversation history organized by date and Project
- **FR4:** Users can search across all their conversations by keyword
- **FR6:** Users can delete individual conversations from their history
- **FR11:** Users can create new Projects with a name and optional description
- **FR12:** Users can rename and archive Projects
- **FR13:** Users can attach documents (PDF, images) to Projects for persistent context
- **FR14:** Users can remove documents from Projects
- **FR15:** Users can view all documents attached to a Project
- **FR16:** Conversations started within a Project automatically have access to all attached document context
- **FR17:** Users can switch between Projects via sidebar navigation
- **FR18:** Users can start a conversation outside any Project (general chat)
- **FR19:** Users can move a conversation into a Project after the fact

## Stories

| Story | Name | Description |
|-------|------|-------------|
| 16.1 | Create Project | Dialog to create project with name/description |
| 16.2 | Project Sidebar | List projects with doc count, selection state |
| 16.3 | Project Context | Conversations use project document context |
| 16.4 | Rename/Archive Projects | Context menu for project management |
| 16.5 | Conversation History | Recent conversations grouped by date |
| 16.6 | Search Conversations | Full-text search across messages |
| 16.7 | Delete Conversations | Soft delete with audit log |
| 16.8 | General Chat | Conversations without project context |
| 16.9 | Move to Project | Move existing conversation into a project |

## Dependencies

- Epic 15: AI Buddy Core Chat

## Technical Notes

- PostgreSQL full-text search for conversation search
- Soft delete pattern for conversations (audit compliance)
- Project context switch should be < 200ms

## References

- PRD: `docs/features/ai-buddy/prd.md`
- Architecture: `docs/features/ai-buddy/architecture.md`
- Epic Breakdown: `docs/features/ai-buddy/epics.md` (Epic 3)
