---
title: Later cumulative deployments require commit ancestry
author: RobertB
date: 2026-11-03
branch: main
id: l-29be3fb4
scope: repo
status: active
src: agent
touches:
  - public/app.js
---

## Decided
A work item can reach Acceptance and Production through later cumulative main builds. Discovery must follow Git commit ancestry (or compare deployed snapshots), not only exact PR head/merge SHAs or Azure work-item links.

## Tried and ruled out
For AB#8205 / uva/WISH-ask-your-question#181, the direct merge build 33907 only deployed Development; Acceptance and Production were skipped. Acceptance later succeeded in build 33972 at commit 0ed6935, three commits ahead of the PR merge. Production succeeded in build 34028 at commit 7c549a7, five commits ahead. Both descend from merge commit 85fc018b.

The existing Azure fallback did return build 33907, so absence was not caused by the time query itself. It was rejected because Azure returned repository.url as https://github.com:443/uva/WISH-ask-your-question and githubRepositoryFromRemoteUrl parsed the explicit port as owner 443 and repository uva.

## Watch out
There are three independent misses in this example: project GUID versus name rejects GitHub check URLs; explicit :443 corrupts Azure repository parsing; and later cumulative deployments use different SHAs outside the current 24-hour post-merge window. Fixing only one still leaves incomplete deployment history.

In the code:
- public/app.js:3461-3483 compares the check URL project segment literally.
- public/app.js:3516-3522 parses GitHub remote URLs without accounting for ports.
- public/app.js:3537-3548 requires exact commit, PR ref, or trigger PR number.
- public/app.js:3559-3566 limits PR build discovery to 24 hours after merge.
- public/app.js:7540-7569 relies on Azure build work-item links; build 33907 returned zero linked work items.
