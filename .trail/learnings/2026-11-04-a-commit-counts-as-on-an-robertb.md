---
title: "A commit counts as on an environment when that environment's current deployment contains it"
author: RobertB
date: 2026-11-04
branch: main
cost: { minutes: 15, tokens: 97848 }
id: l-637517c9
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/index.html
  - public/styles.css
---

## Decided
The Environments column in Latest commits shows, for each commit, the environments whose latest successful deployment contains that commit. For every environment the repository is deployed to, GitHub compares the deployed commit with the newest commit in the table. The commits GitHub lists are not on that environment; every other loaded commit is. This uses git ancestry, so commits merged from older branches are placed correctly, which comparing dates or table positions would get wrong.

Environment names are shown as Production, Acceptance, Preview or Development, in that order, because real names include pipeline-prefixed ones like "fusion-compose-acceptance". Preview is kept apart from Development even though they share a readiness tier.

## Watch out
Release readiness keeps only the latest deployment per tier and pipeline, which would drop Preview whenever Development deployed later. So the deployment snapshots are now kept twice: per tier (for readiness) and per environment (for this column), loaded once per Releases page load and shared by both sections.

When a comparison is cut off (more commits ahead than GitHub returned) or fails, only the exact deployed commit is marked for that environment, rather than guessing.

In the code: public/app.js mergeReadinessSnapshots, loadReadinessSnapshots, loadLatestCommitEnvironments, latestCommitEnvironments, latestCommitEnvironmentLabel. Checked live: uva/WISH-core 3–4 Nov commits on Development only; aab0a7b and older on all four.
