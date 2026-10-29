# Jiraish

Jiraish is a compact, Jira-style sprint and backlog interface for Azure DevOps. The app runs entirely as a static website and communicates directly with the Azure DevOps REST API from the browser.

## Features

- Sprint board with To do, Doing, and Done columns
- Backlog tables grouped by sprint while preserving the Azure DevOps backlog order
- Jira-style Epic and Feature sidebar with issue, completion, and estimate metrics plus feature filtering
- Confluence-style reader for Azure DevOps wikis with page navigation, search, and Markdown rendering
- For you page with assigned work, mentions, personal activity, project-wide work item activity, and relevant open GitHub pull requests
- Filters for type, assignee, priority, sprint, state, area, tags, and feature
- View and edit work items directly
- Create an empty work item of any type configured in the Azure DevOps project
- Show and edit Repro Steps and display System Info for Azure DevOps bugs instead of an unused Description field
- View work-item attachments as links to the files stored in Azure DevOps
- Show child Task work items as Jira-style subtasks with completion progress
- Edit titles, descriptions, states, assignees, priorities, story points, areas, sprints, and tags
- Mention team members in descriptions and comments with Jira-style `@` suggestions
- Link work items in descriptions and comments with Jira-style `#` suggestions by ID or title
- Light and dark themes
- Responsive layout for desktop and mobile
- Dynamic branding based on the selected Azure DevOps team

## Run locally

No build step is required. Serve the `dist` directory with a simple web server:

```bash
python3 -m http.server 8080 --directory dist
```

Then open `http://localhost:8080`.

## Configure Azure DevOps

Open Jiraish and enter an Azure DevOps URL and a Personal Access Token. Jiraish accepts organization, project, and team URLs:

```text
https://dev.azure.com/organization/
https://dev.azure.com/organization/project/
https://dev.azure.com/organization/project/team/
```

When a team URL is used, that team is selected by default on first launch. Without a team in the URL, Jiraish uses the previously selected team or the first available team. With an organization-only URL, Jiraish uses the previously selected project or the first available project.

The PAT needs at least read access to projects, teams, iterations, and work items. Editing work items also requires write access to Work Items.

The URL and PAT are stored only in the browser's local storage. Never publish or commit a PAT.

## Configure GitHub

Change the connection and optionally add a GitHub API token to show all open pull requests from repositories available to that token on the For you page. The pull request table stays hidden when no GitHub token is configured. Settings can show pull requests from all available repositories (the default) or limit the table to an exact list of `owner/repository` names.

The GitHub token is also stored only in the browser's local storage and sent directly to the GitHub API. Use a fine-grained token with read-only access to the repositories you want Jiraish to include.

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` publishes the contents of `dist` on every push to `main`. For a repository named `jiraish`, the default project site is:

```text
https://<github-user>.github.io/jiraish/
```

GitHub Pages must use **GitHub Actions** as its publishing source in the repository settings.

## Project structure

```text
dist/
  index.html
  app.js
  styles.css
.github/workflows/deploy-pages.yml
```

## Security

Jiraish is a client-side application. Anyone with access to the browser profile may be able to read the locally stored Azure DevOps and GitHub tokens. Use tokens with the minimum required permissions and a short lifetime.
