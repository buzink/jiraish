---
title: The Add related issue dialog can also create a new story or bug that is linked as related
author: RobertB
date: 2026-11-07
branch: main
cost: { minutes: 2, tokens: 65890 }
id: l-ee4f2c8e
scope: repo
status: active
src: agent
touches:
  - public/index.html
---

## Decided
The "Add related issue" dialog in the work-item view now has the same split as the roadmap dialogs: "Add an existing issue" (search + list), an "or" divider, and a dashed "Create a new issue" box with "New story" and "New bug" buttons. RobertB asked for this, with UX matching the roadmap Epic/Feature dialogs. The "Add parent" dialog (same markup) hides the heading, divider and create box, because creating a parent from there was not asked for.

A new item opens the normal create dialog without a parent; it gets a System.LinkTypes.Related link to the original item in the same create request. The create dialog shows "Related to <key · title>" in the box that otherwise says "Parent". After creating, the new item opens, and closing it reopens the original item (reusing the childWorkItemReturn mechanism).

## Watch out
The story type comes from backlogStoryType() (User Story or Product Backlog Item, depending on the process).

In the code: `createRelatedWorkItem(type)` closes `#workItemLinkDialog` and calls `openCreateWorkItemDialog(type, null, { related: item })`; `state.createWorkItemRelated` is ignored when a parent is given and reset in the create dialog's close handler. `#createWorkItemParentKind` holds the "Parent" / "Related to" label.
