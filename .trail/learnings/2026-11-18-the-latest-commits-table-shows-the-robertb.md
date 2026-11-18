---
title: "The latest commits table shows the Azure DevOps build of each commit, preferring the main pipeline's branch build"
author: RobertB
date: 2026-11-18
branch: main
cost: { minutes: 3, tokens: 31958 }
id: l-9d8255bc
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/styles.css
---

## Decided
The user wanted a Build column after Commit, showing the build number (e.g. #20261117.3) linked to the build results page. Builds are fetched once per repository from Azure DevOps (builds filtered on the GitHub repository, queued since one day before the oldest loaded commit) and matched on sourceVersion. A commit often has several builds; a branch build wins over a pull-request merge build, then the pipeline named after the repository (uva.WISH-core for uva/wish-core) over side pipelines like Storybook or Cypress, then the newest. The link uses the project name (dev.azure.com/<org>/<project>/_build/results?buildId=…&view=results), as the user asked, not Azure's _links.web.href, which carries the project GUID.

## Tried and ruled out
minTime without queryOrder: Azure then filters on finish time, so builds still running (e.g. awaiting a deployment approval) were missing and 36a5ba66 in uva/wish-ask-your-question showed no build.

## Watch out
Some commits have no build (e.g. older direct commits); they show "—". "Show more" refetches the builds for the wider date range.

In the code: loadLatestCommitBuilds and refreshLatestCommitBuilds, build cell in createLatestCommitRow, header in createLatestCommitsRepository (public/app.js); .latest-commits-build in public/styles.css.
