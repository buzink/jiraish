---
title: "Work item status colors run from gray through blue and teal to green, with rework in indigo and On hold in solid red"
author: RobertB
date: 2026-11-06
branch: main
cost: { minutes: 12, tokens: 52565 }
id: l-7e686ff1
scope: repo
status: active
replaces: l-78186ee4
src: agent
touches:
  - public/app.js
  - public/styles.css
---

## Decided
Each status has its own color, because the user could not tell statuses apart when two shared a color. The colors follow the workflow so progress reads at a glance. New and Ready for sprint are gray. Active is blue and PR under review a slightly cyan blue. Test on dev is cyan, Ready for release to accept is solid teal, and Test on acc is mint. Resolved is light green and Closed is solid green. Ready for release to accept and Closed are solid because they are the handoff to acceptance and the true end.
Rework dev and Rework acc are indigo and violet, because the user wanted them close to Active: rework means going back to building. They sit on the other side of Active's blue than the forward flow, so they never look like a step forward. On hold is the only solid red badge, so it stands out away from the flow.

## Tried and ruled out
Warm yellow and orange for rework: rejected by the user, because rework belongs with Active.

## Watch out
Adding a status means picking an unused tone, otherwise two statuses collide again. A tone needs a light rule, a dark-mode rule and a progress-legend dot color. Statuses missing from the map all fall back to the same neutral gray. The only accepted spelling is "Ready for release to accept"; "Ready to release to accept" was a typo and was removed.

In the code: STATE_TONES in public/app.js; tone rules and --progress-state-* variables in public/styles.css (light, [data-theme="dark"], and .sprint-progress-state > i rules). Tone names: gray-light, gray, blue, sky, cyan, teal, mint, lime, green, indigo, violet, red.
