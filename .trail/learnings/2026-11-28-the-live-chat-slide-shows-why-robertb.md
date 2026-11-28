---
title: "The Live chat slide shows why scores were low from a second sndata file, with services stacked above assignment groups"
author: RobertB
date: 2026-11-28
branch: main
id: l-a934a5e2
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/index.html
  - public/styles.css
---

## Decided
Next to <base>/sprint-<N>.json the sprint review loads <base>/sprint-<N>-low-scores.json (made by the livechat-low-scores skill in agent-skills: chats with 😖 🙁 😐 counted per main reason, English label in labelEn, reportUrl). When it exists the Live chat slide gets the layout the user asked for: top business services above top assignment groups in the left column, customer satisfaction in the middle, "Why scores were low" bars on the right, and "Full report on low scores ↗" at the right end of the footer. Without the file the old three-column layout stays. Trends compare with the previous sprint's analysis and are neutral, like the other rankings.

## Watch out
The stacked rankings only fit at 1280x720 with the compact rows (group name inline, smaller gaps) and the smaller panel font of .extra-panels.has-reasons; check scrollHeight vs clientHeight of each .extra-panel after layout changes. Azure DevOps blocks requests from localhost (CORS), so to check the slide locally render sprintReviewExtraSlideHtml with the published sndata JSON into els.sprintReviewStage.
