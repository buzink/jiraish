---
title: Commits without a work item can be released through the PR labels safeToDeploy and storyOverride
author: RobertB
date: 2026-11-18
branch: main
cost: { minutes: 2, tokens: 130338 }
id: l-c0bd403f
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/index.html
---

## Decided
The user set the rule for the "Which commit is safe to release?" table. Only for a commit without a matching work item, the labels on its pull request(s) count:
- safeToDeploy: safe for the next environment only: to ACC from Development, to PRD only once the commit is on Acceptance.
- storyOverride: the AB#1234 IDs in the PR's conversation comments become the commit's work items, and the normal state rules apply to them.
Label names are matched case-insensitively. A commit that already has a work item ignores both labels. The table has a PR column after Build with the PR number linking to GitHub.

## Watch out
Only conversation comments (GitHub issue comments) are searched, not the PR description or inline review comments. Comment IDs are cached per PR in state.releaseReadiness.githubPullCommentIds and cleared with the other GitHub caches. On 18 Nov 2026 no PR in the uva repos had either label yet, so the rule was tested with simulated PRs.

In the code: githubPullHasLabel, githubPullCommentWorkItemIds, latestCommitPullOverrides, loadLatestCommitsPage, latestSafeCommitSha (safeByLabel), createLatestCommitRow (pullCell) in public/app.js; intro text in public/index.html.
