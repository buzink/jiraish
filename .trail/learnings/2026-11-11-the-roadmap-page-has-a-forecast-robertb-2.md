---
title: "The roadmap page has a Forecast toggle, off by default and not in the URL; off shows each Feature as one block across consecutive sprints"
author: RobertB
date: 2026-11-11
branch: main
cost: { minutes: 5, tokens: 27089 }
id: l-217cadb5
scope: repo
status: active
replaces: l-212ec98f
src: agent
touches:
  - public/app.js
  - public/index.html
  - public/styles.css
---

## Decided
The roadmap page has a "Forecast" switch at the top right, next to "Current quarter". It is off by default and is not written to the URL, because the user wanted a plain overview first and planning only on demand.
- Off: no "+ Add Epic", no per-lane "+" buttons, no × on forecast cards, no Frontend / Backend / Lane not tagged lanes. Each Epic row is one cell spanning all sprints. A Feature shows once per run of consecutive sprints, as one block across those sprint columns, whatever its lane tags. Stories are merged by story id so counts aren't doubled. A gap of a sprint gives two blocks.
- On: the page is exactly as before (per-sprint cells, lanes, add buttons).

## Watch out
- The forecast × is hidden when off because removing a forecast needs a lane and sprint, and a spanning block has neither.
- The roadmap scrolls to the current sprint on load, so a block that started earlier would have its title behind the sticky Epic column. The title inside a spanning block is position: sticky to stay visible; it needs no overflow clipping between the card and .roadmap-shell.
- Blocks are placed with CSS grid (explicit grid-column, auto row, grid-auto-flow: row dense) so they pack into free rows; "No features" placeholders are pinned to row 1 of empty sprint columns.

In the code: state.roadmapForecastMode, createRoadmapSpanCell in public/app.js; #roadmapForecastToggle in public/index.html; .roadmap-forecast-toggle, .roadmap-span-* and .roadmap-feature-sticky in public/styles.css.
