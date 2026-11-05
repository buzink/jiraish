---
title: "Parent, related-issue and child links are added and removed from the work-item view, and removing only unlinks"
author: RobertB
date: 2026-11-04
branch: main
cost: { minutes: 4, tokens: 120885 }
id: l-f15956a1
scope: repo
status: active
src: agent
touches:
  - public/app.js
---

## Decided
The Details pane shows an "Add parent" link where the parent would be, and the "Linked issues" section (renamed from "Linked work items") always shows, with an "Add related issue" link under it. Parent, linked-issue and subtask rows get a small × that only appears on hover or focus (it stays faintly visible on touch screens). Removing asks for confirmation and only removes the link. Neither work item is deleted.

The parent picker only offers the type one level up: Epic for a Feature, Feature for a story or bug, and any backlog item (not Task, Feature or Epic) for a Task. Epics get no "Add parent" link. "Add related issue" creates a System.LinkTypes.Related link.

## Watch out
Azure removes a relation by its index in the relations array. The code fetches the item again with relations right before removing and sends a `test /rev` so a concurrent change fails instead of removing the wrong link. After any change the details cache of both items is dropped, because normalizeWorkItemDetail falls back to cached subtasks/parent when relations are empty.

`trail check` flags the relation-URL regex and the `test /rev` op as matching older release-readiness learnings. Those matches are lexical only.

In the code: `changeWorkItemRelations` wraps every add/remove (lock in `state.workItemRelationUpdating`, cache invalidation, reload). `openWorkItemLinkDialog` / `searchWorkItemLinkChoices` drive `#workItemLinkDialog`. `workItemParentTypeFilter` holds the parent type rules. The dialog's close handler checks `.open` because the close event fires asynchronously and could wipe a picker that was just reopened.
