---
title: Release readiness lists pull requests without a work item and always marks them as needing attention
author: RobertB
date: 2026-11-04
branch: main
cost: { minutes: 7, tokens: 28299 }
id: l-a52a2dda
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/index.html
---

## Decided
Pull requests (and direct commits outside any PR) in the compared deployment range that carry no AB# work item are shown as their own rows under "Changes without a work item", linking to GitHub, instead of a count like "1 commit could not be linked". They always get "Needs attention", because without a work item there is no state that says they were tested. They are styled apart from stories and bugs (PR/C icon, dashed border) so nobody mistakes them for work items, and they count toward the lane's attention total.

## Watch out
A PR titled "AB#0000 …" counts as unlinked because ID 0 is not a work item. A PR whose title and branch both lack AB# is unlinked even if individual commits mention IDs, because the PR owns the work item.

In the code: githubWorkItemsBetweenBuilds returns `unlinked` (kind pull/commit) in public/app.js; createReadinessUnlinkedChange renders the rows; renderReadinessLane counts them.
