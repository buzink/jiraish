---
title: "Roadmap dialogs separate adding an existing Epic or Feature from creating a new one, and new items get their roadmap tag at creation"
author: RobertB
date: 2026-11-04
branch: main
cost: { minutes: 1, tokens: 7479 }
id: l-475add5e
scope: repo
status: active
replaces: l-04b3d398
src: agent
touches:
  - public/app.js
  - public/index.html
  - public/styles.css
---

## Decided
The "Add Forecasted Feature" and "Add Epic to quarter" dialogs have two sections split by an "or" divider: "Add an existing …" (filter field and list, no visible "Find …" label) and a dashed "Create a new …" box with a short explanation and a "New feature" / "New epic" button. RobertB asked for this split because a small link under the list didn't make the difference between adding and creating clear enough.

A new item opens the normal create dialog (Feature under the cell's Epic, or a parentless Epic) and gets the forecast tag at creation: `forecast:<sprint>:<lane>` for a Feature, `forecast:<year>:Q<n>` for an Epic. The new item then opens; closing it reloads the roadmap.

## Watch out
The roadmap only shows Features and Epics from the team's portfolio backlog, which is cached. A new item is pushed into that cache (and refetched on close), so it shows even if its area path keeps it off the team backlog, until the next full reload. Opening another item from the new one cancels the roadmap refresh.

In the code: the search labels are kept as `sr-only` for screen readers. `openCreateWorkItemDialog` takes `tags` and `roadmap` options; `createWorkItemFromDraft` merges the tags with "To be refined" and sets `state.childWorkItemReturn` with `roadmap`; the `workItemDialog` close handler calls `refreshRoadmapAfterCreate`. Buttons: `#roadmapForecastAddFeature` → `createRoadmapForecastFeature`, `#roadmapEpicAddEpic` → `createRoadmapEpic`.
