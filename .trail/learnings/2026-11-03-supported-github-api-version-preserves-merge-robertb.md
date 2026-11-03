---
title: Supported GitHub API version preserves merge commit SHA
author: RobertB
date: 2026-11-03
branch: main
id: l-22a6e1cf
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/index.html
---

## Decided
Use GitHub API version 2022-11-28 for pull-request metadata. The previously configured 2026-03-10 version returns merge_commit_sha as null for merged PRs in this repository.

Build discovery must also derive a missing merge SHA from a matched Azure main-branch build whose trigger message identifies the pull request, so ancestry does not depend on one GitHub response field.

## Tried and ruled out
Project alias normalization, repository URL parsing and environment ancestry were all working against the real APIs, but browser state still showed mergeSha empty and no build references. Calling PR #181 with the real PAT proved that 2022-11-28 returns 85fc018b while 2026-03-10 returns null.

## Watch out
When direct PR-head builds have expired under Azure retention, a missing merge SHA makes every later association disappear. Keep the Azure trigger-message fallback and regression-test an empty mergeSha.

In the code:
- public/app.js:github uses X-GitHub-Api-Version 2022-11-28.
- public/app.js:azureBuildMatchesGithubPullRequest recognizes GitHub merge messages such as (#181).
- public/app.js:azureBuildIdsForGithubPullRequest derives mergeSha from the matched main build when needed.
