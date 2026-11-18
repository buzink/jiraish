---
title: The latest commits menu no longer offers Build commit; only Copy commit id is left
author: RobertB
date: 2026-11-18
branch: main
cost: { minutes: 2, tokens: 24484 }
id: l-d4edf8e2
scope: repo
status: active
replaces: l-b88556d2
src: agent
touches:
  - public/app.js
  - public/index.html
  - public/styles.css
---

## Decided
The user asked to remove "Build commit" from the ⋮ menu of the latest commits table. The dialog that queued an Azure DevOps pipeline at that exact commit was only reachable from that item, so it was removed entirely (dialog, pipeline lookup, submit code and styles). The menu keeps only "Copy commit id". Builds are now shown, not started: the Build column links each commit to its existing Azure DevOps build.

## Watch out
Don't bring back starting pipelines from Jiraish without the user asking; the earlier learning about picking the pipeline named after the repository still describes how the Build column chooses among a commit's builds.

In the code: the menu is #latestCommitMenu in public/index.html with only data-latest-commit-action="copy"; openBuildCommitDialog, submitBuildCommit, azureBuildDefinitionsForRepository and preferredBuildDefinition were removed from public/app.js.
