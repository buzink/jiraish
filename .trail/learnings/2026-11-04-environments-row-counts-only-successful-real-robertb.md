---
title: "Environments row counts only successful real environments, not YAML stages"
author: RobertB
date: 2026-11-04
branch: main
cost: { minutes: 1, tokens: 1061 }
id: l-e2608b3a
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/index.html
---

## Decided
The Environments property in the work-item Details lists environments the item reached, derived from the already-loaded deployments rather than a new API call, because those already include cumulative later builds and stay in sync with the Deployments tab. An environment counts when its status is succeeded, succeededWithIssues or partiallySucceeded, because failed, canceled or not-started deployments mean the code is not actually there. Names are de-duplicated case-insensitively (otherwise "Production" and "production" from different pipelines show twice) and ordered Development, Test, Acceptance, Staging, Preview, Production, then alphabetically.

## Watch out
YAML pipeline stages (e.g. a stage called "Deploy Production") deliberately do not count, because stage names are free text and do not prove a deployment to an environment; only `deployment.environments` does, matching the existing "deployed runs" filter in the Deployments tab.

In the code: deployedEnvironmentNames / renderWorkItemEnvironments in public/app.js, rendered from renderWorkItemDeployments; #workItemEnvironments in public/index.html.
