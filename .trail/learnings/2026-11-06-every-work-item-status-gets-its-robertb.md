---
title: "Every work item status gets its own color, never shared with another status"
author: RobertB
date: 2026-11-06
branch: main
cost: { minutes: 1, tokens: 973 }
id: l-78186ee4
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/styles.css
---

## Decided
Each status has a distinct color, because the user could not tell statuses apart when Resolved shared Active's blue and Ready for release to accept shared On hold's red. Resolved is now lime green, so it still reads as finished but differs from Closed's green. Ready for release to accept is now dark navy, so it still reads as in progress but differs from Active's light blue.

## Watch out
Adding a status means picking an unused tone, otherwise two statuses collide again. A new tone needs a light rule, a dark-mode rule and a progress-legend dot color. Statuses missing from the map all fall back to the same neutral gray. They are hidden by default, but they collide if they are made visible.

In the code: STATE_TONES in public/app.js; tones "navy" and "lime" plus --progress-state-* variables in public/styles.css (light, [data-theme="dark"], and .sprint-progress-state > i rules).
