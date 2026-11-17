---
title: Sprint review feature pills end with a grey Other pill for stories and bugs without a Feature parent
author: RobertB
date: 2026-11-17
branch: main
cost: { minutes: 1, tokens: 76947 }
id: l-2ee2c80a
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/styles.css
---

## Decided
The user wanted the feature pills on the sprint and next-sprint review slides to include a grey "Other" pill for every story or bug without a Feature parent (no parent, or a parent of another type). It is always the last pill and stays visible when the list collapses to "+N more". It only shows when there is at least one real feature.

## Watch out
"Other" uses the string id "other", while real features use numeric ids. The click handler only converts to a Number when the id is not "other", and activeId uses ?? instead of ||. The rows' data-feature carries the same key, so filtering in the exported HTML matches on strings.

In the code: public/app.js SPRINT_REVIEW_OTHER_FEATURE, sprintReviewFeatureKey, sprintReviewFeatures, sprintReviewFeaturesHtml; public/styles.css .sprint-review-features li.is-other
