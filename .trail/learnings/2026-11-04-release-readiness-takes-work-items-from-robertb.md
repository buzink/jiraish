---
title: "Release readiness takes work items from the pull request, not from IDs mentioned in commit messages"
author: RobertB
date: 2026-11-04
branch: main
cost: { minutes: 40, tokens: 147665 }
id: l-cddfc229
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/index.html
  - public/styles.css
---

## Decided
Release readiness compares the commits deployed on one environment but not the next (GitHub compare). For each commit that belongs to a pull request, the work items come only from the PR title and head branch name; only commits outside any PR fall back to AB# IDs in their own message. Otherwise commits that merely mention IDs make finished items look undeployed: on WISH-core, commit 90c414994 ("Update git-log-overwrites to include new entries for AB#8358 and AB#8329", part of the AB#8128 PRs #2192/#2197) put WISH-8329 and WISH-8358 under Development → Acceptance although both reached Acceptance with Release-2345 on 21 Oct.

## Tried and ruled out
Blaming Azure's build-range lookup (_apis/build/workitems?fromBuildId&toBuildId) and skipping it when the GitHub compare succeeds: wrong, because for builds 34075 → 34155 that range returned no work items at all. Verify against live API data before fixing.

## Watch out
Development often runs feature-branch builds (e.g. AB#8128-next-update-major) while Acceptance runs main, so the compared range contains branch history that includes such bookkeeping commits. The AB#0000 PR title (#2196) is not a work item and is reported as one unlinked commit.

In the code: githubWorkItemsBetweenBuilds in public/app.js (now looks up /commits/{sha}/pulls for every commit in the comparison).
