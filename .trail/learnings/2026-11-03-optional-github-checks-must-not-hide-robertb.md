---
title: Optional GitHub checks must not hide Azure builds
author: RobertB
date: 2026-11-03
branch: main
id: l-607b7d4c
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/index.html
---

## Decided
GitHub check-runs are optional metadata and must never gate work-item build discovery. Azure build metadata is the primary source; a failure while expanding deployment ancestry must preserve already matched direct builds.

## Tried and ruled out
Silently wrapping check-runs in Promise.allSettled still produced browser HTTP 403 noise and did not explain why the UI stayed empty. With the real PATs, check-runs returned 403 while Azure discovery independently returned builds 33907, 33972 and 34028.

## Watch out
Keep optional discovery stages independently fault-tolerant. Do not wrap direct Azure matching and later ancestry expansion in one all-or-nothing promise. Fine-grained GitHub PATs may read pull requests and repository comparisons while lacking Checks: Read.

In the code:
- public/app.js:githubCommitAzureBuildIds no longer requests /check-runs.
- public/app.js:azureBuildIdsForGithubPullRequest returns directBuildIds if environment or ancestry expansion fails.
- public/index.html cache-busts app.js when this behavior changes.
