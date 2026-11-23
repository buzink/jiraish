---
title: "The roadmap Epic column always lists its Features; with Forecast on they drag onto sprint lanes, and Alt, Ctrl or Cmd copies"
author: RobertB
date: 2026-11-23
branch: main
cost: { minutes: 1, tokens: 7508 }
id: l-46cca659
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/styles.css
---

## Decided
- The Epic column lists the Epic's Features below the Epic in both modes, one 24px line each, title cut off with "…", no divider line (the user asked to remove the dashed one). Click opens the Feature.
- Forecast on only: list items drag onto a Frontend/Backend lane of the same row to add that forecast; the Feature stays in the list. Forecasted (not committed) cards drag between sprints and lanes; a plain drop moves (swaps the forecast:<sprint>:<lane> tag in one PATCH), Alt/Option, Ctrl or Cmd copies (green "+ Copy" lane). The user chose the keys over a "Copy to…" menu.
- Drops: same Epic row only (another Epic would change the parent), never "Lane not tagged", not where the Feature is committed, no copy/list-drop onto a cell that already has that forecast. A move onto it merges.
- No dragging on phones and touch screens (backlogDragQuery, as on the backlog).

## Watch out
- The Epic column is a table cell and the list a grid: without max-width on .roadmap-epic-label and grid-template-columns: minmax(0, 1fr) a long title widens the column instead of getting "…".
- Test at desktop width: the browser pane is often under 560px, which turns dragging off. No Q4 2026 Feature had a forecast tag, so drops were verified with in-memory tags and an intercepted PATCH, not against Azure.

In the code: public/app.js — createRoadmapEpicFeatureList, createRoadmapFeatureCard (epic param), startRoadmapDrag, roadmapDragCopies, roadmapDropAllowed, bindRoadmapLaneDrop, moveRoadmapForecast; public/styles.css — .roadmap-epic-features, .roadmap-epic-feature*, .roadmap-lane.is-drop-target/.is-drop-copy.
