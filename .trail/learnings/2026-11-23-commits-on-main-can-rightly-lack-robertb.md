---
title: Commits on main can rightly lack Development in the latest commits table when Development runs a feature branch
author: RobertB
date: 2026-11-23
branch: main
cost: { minutes: 3, tokens: 133479 }
id: l-27b81263
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/styles.css
---

## Decided
A user reported that the two newest main commits of WISH-ask-your-question (f63ab9bb, e366bca8) showed only "Acceptance" under Environments, while their stories carried the tag "development". Not a bug: on 20 Nov Development was deployed from the feature branch feat/AB#8122-add-system-notifications (build 20261120.3, commit d728c049). That branch forked from main at 5ce025b5, before those two commits, so GitHub's compare (deployed...head) lists them as missing and the table correctly leaves Development out. The story tag only records that the work was once tested on Development.
The user wanted to see per repository, between the title and the table, which branch each environment runs, so it is clear why a main commit can lack Development (e.g. Development running a feature branch). Order Development → Preview → Acceptance → Production. main/master is plain grey; any other branch (feature branch, PR build) gets an orange-tinted chip, also in dark mode. The tooltip gives environment name, branch, build number and deployed commit.

## Watch out
- A story's "development" tag is not proof the commit is on Development now: a later deploy of another branch replaces it.
- To check, look at the Development snapshot's build sourceBranch and compare it with main head (`gh api repos/<repo>/compare/<deployed>...<head>`): status "diverged" means Development runs a branch that lacks some main commits.

In the code: public/app.js loadLatestCommitEnvironments / latestCommitEnvironments.
- The branch comes from the deployment snapshot's build.sourceBranch; the line only appears once deployments have loaded.
- trail check flags this change against the "Latest safe ACC environment rule" and "sprint heading label order" learnings; those are word overlaps, not real conflicts.

In the code: public/app.js createLatestCommitEnvironmentBranches, loadLatestCommitEnvironments (branch, buildNumber); public/styles.css .latest-commits-branches.
