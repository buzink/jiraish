---
title: "Backlog issues are dragged by a grip at the start of each row, between places, sprints and the backlog; not on phones or touch screens"
author: RobertB
date: 2026-11-19
branch: main
cost: { minutes: 8, tokens: 172093 }
id: l-2feffb7b
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/styles.css
---

## Decided
- The user wanted issues on the backlog page draggable with a handle at the front of each row, also between sprints and between a sprint and the backlog, clear and robust, and not on mobile.
- A drop sets the sprint of the section it lands in ("Other" = no sprint, the project root path) and the backlog order between the visible rows just above and below (workitemsorder with previousId/nextId).
- Dragging a selected row drags the whole selection, like the row menu. A single story that needs a split still gets the remaining-points question; bulk drops never split (same rule as Move to sprint).
- The current and next sprint are always shown, even when empty, so there is something to drop into. Other empty sprints are reached via "Move to sprint".
- The grip and the drag are off below 560px and on touch screens ((hover: none) and (pointer: coarse)); JS checks the same query.

## Watch out
- Within a section only the visible order counts for "no change": rows of other sections sit between these in Azure's global order, so dropping a row back in its place would otherwise still send a reorder.
- The backlog table got an extra first column, so the nth-child column widths in styles.css shifted by one.
- Mouse moves don't fire during a native drag; one after it (400 ms after the last dragover) clears a drag whose dragend never came, e.g. after a re-render.

In the code: public/app.js — startBacklogDrag, moveBacklogDrag, finishBacklogDrop, backlogDropTarget, showBacklogDropIndicator, dropBacklogItems, backlogOrderAfterDrop, requestBacklogSprintSplits and patchBacklogItemsSprint (shared with updateBacklogItemsToSprint), backlogDragQuery; createBacklogSection sets data-group-key/label/iteration-path; renderBacklog adds empty current/next sprint sections. public/styles.css — .backlog-drag-handle, .backlog-drop-indicator, .backlog-drag-ghost.
