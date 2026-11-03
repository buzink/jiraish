---
title: Azure project GUID links hide valid GitHub-connected builds
author: RobertB
date: 2026-11-03
branch: main
id: l-85b4340c
scope: repo
status: active
src: agent
touches:
  - public/app.js
---

## Decided
Azure build links discovered through GitHub checks must treat an Azure project GUID and its configured project name as equivalent. A literal project-segment comparison drops valid build IDs.

## Tried and ruled out
The PR itself is not missing and the pipeline did run. GitHub shows PR #181 head build 33855 and merge build 33907; build 33907 is tied to merge commit 85fc018b and its aggregate check completed successfully.

## Watch out
The secondary Azure build search catches errors only in the console, and work-item discovery is limited to recent builds, so neither is a reliable substitute for parsing a valid GitHub check-run build URL. The API tokens named PAT_AD and PAT_GH were not exported in the diagnostic shell; GitHub evidence came from the existing gh login.

In the code:
- public/app.js:3461-3483 rejects a check-run URL when its project segment differs textually from activeAzureContext().project.
- public/app.js:3485-3514 extracts Azure build IDs from GitHub status and check-run URLs.
- public/app.js:3550-3578 performs the best-effort Azure fallback and public/app.js:3627-3636 suppresses its error to a console warning.
- PR uva/WISH-ask-your-question#181 exposes build IDs 33855 and 33907 under Azure project c0615ac4-cc9e-4369-8c83-70366053387f.
