---
title: "The sprint review is exported as one self-contained HTML file, not as PowerPoint or PDF"
author: RobertB
date: 2026-11-07
branch: main
cost: { minutes: 25, tokens: 449232 }
id: l-526e0c1a
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/index.html
  - public/styles.css
---

## Decided
The Export button on the sprint review downloads Sprint-<n>-review.html: every slide, the app's stylesheet inlined, and a small script for slide navigation, feature filters, the Views/Active users switch and paging the top 50 pages. Issues link to Azure DevOps there, since the file has no work-item view.

## Tried and ruled out
PPTX or PDF built from slide images: the user rejected it because long tables scroll on the slides, so an image cuts off the rows that are out of view. Editable PPTX was far more work for the same problem.

## Watch out
The file's script is sprintReviewExportRuntime, embedded with toString(), so it must not use any app code or data. Slide renderers check state.reviewExport to emit the extra markup (all top-page rows, a chart per metric, data-feature on rows, a hidden reset button). The Analytics slide is left out with a notice when Google data is not loaded.

In the code: public/app.js exportSprintReview, sprintReviewExportRuntime, SPRINT_REVIEW_EXPORT_CSS, analyticsExportChartsHtml; button #sprintReviewExport in public/index.html.
