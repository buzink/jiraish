---
title: "Duplicating a work item copies its editable fields and parent, links back to the original, and starts in the initial state"
author: RobertB
date: 2026-11-06
branch: main
cost: { minutes: 2, tokens: 63254 }
id: l-5ec30331
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/index.html
---

## Decided
The work-item ••• menu has a Duplicate item above Delete. It creates a new item of the same type titled "Copy of <title>", copies a fixed list of editable fields (description, repro steps, acceptance criteria, area, sprint, tags, assignee, priority, severity, points/effort, estimates), keeps the parent link and adds a Related link back to the original, then opens the copy. State, comments, attachments, children and other links are not copied; the copy starts in the type's initial state.

## Watch out
Fields are copied from an explicit whitelist because Azure rejects read-only system fields on create; add a field there if it should be duplicated. Duplicate is refused while the open item has unsaved changes, rather than prompting, because showWorkItem would otherwise ask a second time.

In the code: DUPLICATE_WORK_ITEM_FIELDS and duplicateSelectedWorkItem in public/app.js; #duplicateWorkItem in public/index.html.
