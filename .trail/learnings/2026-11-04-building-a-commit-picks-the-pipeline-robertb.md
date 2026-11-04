---
title: Building a commit picks the pipeline named after the repository and queues it on the default branch at that exact commit
author: RobertB
date: 2026-11-04
branch: main
cost: { minutes: 12, tokens: 45458 }
id: l-b88556d2
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/index.html
  - public/styles.css
---

## Decided
"Build commit" in the latest-commits table first asks for confirmation, because it starts a real Azure DevOps run. A GitHub repository can have several pipelines (uva/WISH-core has uva.WISH-core, Cypress, Storybook and coordiate), so the dialog lets the user choose and preselects the one named "<owner>.<repo>", otherwise one whose name ends with the repo name. The run is queued through the Build API with the pipeline's default branch (refs/heads/main) and the full commit SHA as sourceVersion, which matches "Run pipeline" with branch + commit in Azure DevOps and keeps the pipeline's default parameters.

## Watch out
Queuing needs a PAT with Build: Read & execute; a read-only PAT only gets an error in the dialog. The row menu is one fixed-position element outside the table, because the table scrolls horizontally and would clip an absolutely positioned menu.

In the code: azureBuildDefinitionsForRepository (definitions?repositoryId=<owner/repo>&repositoryType=GitHub), preferredBuildDefinition, submitBuildCommit (POST _apis/build/builds) and openLatestCommitMenu in public/app.js.
