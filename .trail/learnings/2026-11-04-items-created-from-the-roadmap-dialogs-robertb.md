---
title: Items created from the roadmap dialogs get their roadmap tag at creation and the roadmap reloads when the new item closes
author: RobertB
date: 2026-11-04
branch: main
cost: { minutes: 2, tokens: 77525 }
id: l-04b3d398
scope: repo
status: active
src: agent
---

## Decided
The "Add Forecasted Feature" dialog has an "Add feature" link and the "Add Epic to quarter" dialog an "Add epic" link. They open the normal create dialog (Feature under the cell's Epic, or a parentless Epic) and the new item gets the forecast tag at creation: `forecast:<sprint>:<lane>` for the Feature, `forecast:<year>:Q<n>` for the Epic. After creating, the new item opens; closing it reloads the roadmap so the item shows up.

## Watch out
The roadmap only shows Features/Epics from the team's portfolio backlog, which is cached. A new item is pushed into that cache (and refetched on close), so it shows even if its area path keeps it off the team backlog until the next full reload. Opening another item from the new one cancels the roadmap refresh, like the add-child return.

In the code: `openCreateWorkItemDialog` takes `tags` and `roadmap` options; `createWorkItemFromDraft` merges the tags with "To be refined" and sets `state.childWorkItemReturn` with `roadmap`; the `workItemDialog` close handler calls `refreshRoadmapAfterCreate`. Links: `createRoadmapForecastFeature`, `createRoadmapEpic`.
