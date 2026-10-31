# Jiraish

Jiraish is a compact, Jira-style sprint and backlog interface for Azure DevOps. The app runs entirely as a static website and communicates directly with the Azure DevOps REST API from the browser.

## Features

- Sprint board with To do, Doing, and Done columns, filtering, and grouping by state, assignee, or priority
- Backlog grouped by sprint while preserving the Azure DevOps order, with Jira-style Epic and Feature navigation
- Multi-select backlog actions to assign, move to a sprint or backlog position, and delete work items
- For you dashboard with configurable work-item and GitHub pull-request widgets
- Global work-item search plus title/ID filters on the Sprint board, Backlog, and For you pages
- Confluence-style Azure DevOps wiki reader with persistent navigation, title/path filtering, and Markdown rendering
- Work-item creation from the header and story creation directly inside a Feature
- AI-assisted work-item creation from a pasted chat, email, or description through a configurable LiteLLM model
- Work-item editing for titles, states, descriptions, Acceptance Criteria, Repro Steps, System Info, assignees, priorities, estimates, areas, sprints, and tags
- Rich-text editing in Preview, formatted HTML, or Markdown mode, including code blocks, syntax highlighting, and checkboxes
- Jira-style `@` mentions and `#` work-item links in descriptions and comments
- Attachments, child work items, pull requests, Classic releases, and YAML deployments in the work-item view
- Safeguards for unsaved work and confirmation before deleting one or multiple work items
- Release diagnostics and readiness comparisons for Development → Acceptance and Acceptance → Production
- Persistent deep links for pages, searches, wiki pages, sprint numbers, and open work items
- Light and dark themes
- Responsive layout for desktop and mobile
- Dynamic branding based on the selected Azure DevOps team

## Backlog actions

Click a work-item title to open it. Click elsewhere on a row to select it, use Shift-click to select a range, and use Command-click on macOS or Ctrl-click on Windows and Linux to add or remove individual items. Actions from a selected row apply to the complete selection.

The row menu can assign the selected items, move them to another sprint, move them to an exact position within their current backlog group, or delete them. Jiraish preserves the relative order of a multi-item selection and asks for confirmation before deletion.

The Epic and Feature sidebar shows child counts, completion, unestimated work, and estimates. Selecting a Feature filters the backlog to its children, and **Create story in feature** opens the creation flow with that Feature as parent.

## Work-item editing

Jiraish uses the fields appropriate to each Azure DevOps work-item type. User Stories include editable Description and Acceptance Criteria fields. Bugs use editable Repro Steps and System Info instead of showing an empty Description field.

Rich-text fields open in Preview mode, which retains the original visual editor. Switch to HTML for formatted source or Markdown for Markdown source; Jiraish converts the content when switching modes. Preview supports fenced and indented code blocks, inline code, basic syntax highlighting, and task-list checkboxes.

Closing a work item or refreshing the page while an editor contains unsaved changes triggers a warning. The work-item menu also supports confirmed deletion.

## Search and filtering

The header search opens a Jira-style results page for work-item titles and IDs, sorted by most recently updated. **Search in Azure DevOps** opens the same query in Azure DevOps in a new tab. The Sprint board, Backlog, and For you pages have local title/ID filters, while the Wiki filter matches both page titles and paths. Search terms are included in deep links.

## Run locally

No build step is required. Serve the `dist` directory with a simple web server:

```bash
python3 -m http.server 8080 --directory dist
```

Then open `http://localhost:8080`.

## Configure Azure DevOps

Open Jiraish and enter an Azure DevOps URL and a Personal Access Token; both fields are required. Jiraish accepts organization, project, and team URLs:

```text
https://dev.azure.com/organization/
https://dev.azure.com/organization/project/
https://dev.azure.com/organization/project/team/
```

When a team URL is used, that team is selected by default on first launch. Without a team in the URL, Jiraish uses the previously selected team or the first available team. With an organization-only URL, Jiraish uses the previously selected project or the first available project.

The PAT needs at least read access to projects, teams, iterations, and work items. The Releases page additionally needs read access to Builds, Releases, and Environments. Editing work items also requires write access to Work Items.

The URL and PAT are stored only in the browser's local storage. Never publish or commit a PAT.

## Configure GitHub

Change the connection and optionally add a GitHub API token to show open pull requests on the For you page. The pull-request widget stays hidden when no GitHub token is configured. Settings can include every accessible owner and repository or an exact selection of users, organizations, and repositories. The widget itself supports multi-select filters for repository and author and initially shows the five most recently updated results.

The GitHub token is also stored only in the browser's local storage and sent directly to the GitHub API. Use a fine-grained token with read-only access to the repositories you want Jiraish to include.

## Configure LiteLLM

Open **Settings**, enter the LiteLLM base URL and API key under **AI-assisted work items**, and load the available models. Choose a model from the native dropdown, or select **Enter a model manually…** for a model that is not returned by the server. Jiraish uses the OpenAI-compatible `/v1/models` and `/v1/chat/completions` endpoints. The LiteLLM server must allow browser requests from the Jiraish origin.

When creating a work item, enter a title and optionally a description for the regular **Create** action. Alternatively, paste a description, chat, or email conversation and choose **Create with AI**. The configured model generates the title and content, after which Jiraish creates the item immediately and opens it for review. Descriptions for Bugs are stored as Repro Steps; other work-item types use the Description field.

For AI-created User Stories and Product Backlog Items, generated acceptance criteria are stored as a numbered list in the dedicated Azure DevOps Acceptance Criteria field rather than included in the Description.

New User Stories, Product Backlog Items, and Bugs are always created with the `To be refined` tag, whether they are created manually or with AI.

The LiteLLM URL, API key, and selected model are stored in the browser's local storage. Pasted source text is sent to the configured LiteLLM server only when **Create with AI** is selected. Use a limited API key and review the LiteLLM server's prompt-logging policy before sending sensitive conversations.

Pull-request titles containing an exact marker such as `AB#8374` are shown in that work item's Activity view. Jiraish only searches the repositories selected in the GitHub settings. Build statuses and commit SHAs are also used to correlate GitHub pull requests with Azure DevOps YAML runs.

## Releases

The Releases page shows recent Classic releases, YAML pipeline runs and stages, and deployments to real Azure DevOps Environments. A release tab in each work item shows related Classic and YAML deployments discovered through Azure DevOps links, build work-item associations, and configured GitHub pull requests.

Above the diagnostic lists, **Release readiness** compares the latest successful deployments for:

- Development → Acceptance
- Acceptance → Production

Environment names containing `Development`, `Develop`, `Dev`, or `Preview` are treated as Development; `Acceptance`, `Accept`, `Acc`, `Staging`, or `Stage` as Acceptance; and `Production` or `Prod` as Production. For each pipeline Jiraish asks Azure DevOps for the work items between the two builds. When Azure DevOps does not provide those links, Jiraish can inspect commits and pull requests in the selected GitHub repositories for exact `AB#<id>` markers.

Readiness labels are based on the current Azure DevOps work-item state. `Closed`, `Done`, and `Resolved` are treated as ready, as are recognizable tested/ready states for the target environment. They indicate workflow state, not independent proof that testing was performed. Missing deployment baselines and commits that cannot be linked to a work item remain visible as warnings.

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` publishes the contents of `dist` on every push to `main`. For a repository named `jiraish`, the default project site is:

```text
https://<github-user>.github.io/jiraish/
```

GitHub Pages must use **GitHub Actions** as its publishing source in the repository settings.

## Deep links

Jiraish stores the active page, text query, wiki page, and open work item in the URL hash. This keeps links compatible with static GitHub Pages hosting. Examples:

```text
#/sprint-board?sprint=133&q=login
#/backlog?item=8374
#/search?q=AB%238374
#/wiki?wiki=WISH.wiki&path=%2FDevelopment%2FAPI&q=performance
```

Refreshing or opening one of these links in a new tab restores the referenced page and work item after the Azure DevOps connection has loaded.

## Project structure

```text
dist/
  index.html
  app.js
  styles.css
.github/workflows/deploy-pages.yml
```

## Security

Jiraish is a client-side application. Anyone with access to the browser profile may be able to read the locally stored Azure DevOps, GitHub, and LiteLLM tokens. Use tokens with the minimum required permissions and a short lifetime.
