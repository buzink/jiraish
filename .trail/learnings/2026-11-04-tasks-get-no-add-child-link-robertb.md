---
title: Tasks get no add-child link in the work-item view
author: RobertB
date: 2026-11-04
branch: main
cost: { minutes: 12, tokens: 73517 }
id: l-ad9e7a22
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/index.html
  - public/styles.css
---

## Decided
The work-item view offers a link to create a child below its children: Epics get "Add feature", Features get "Add story", and every other type gets "Add subtask", which creates a Task. Tasks themselves get no link, because a task under a task isn't how this team plans work. RobertB confirmed this.

The children heading follows the parent type too: "Features" in Epics, "Issues" in Features, "Subtasks" everywhere else.

## Watch out
After a child is created from that link, closing the child reopens and reloads the parent. Opening any other item from the child cancels that return.

In the code: `workItemChildCreateType` returns "" for Tasks, which hides `#workItemAddChild`. `renderWorkItemSubtasks` sets the heading and the link label. The return is tracked in `state.childWorkItemReturn`; it is set in `createWorkItemFromDraft`, cleared in `showWorkItem`, and used in the `close` handler of `workItemDialog`.
