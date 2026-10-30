const STORAGE = {
  pat: "wish-board.azure-pat",
  url: "wish-board.azure-url",
  team: "wish-board.team-id",
  project: "wish-board.project-name",
  mapping: "wish-board.state-mapping",
  mappingVersion: "wish-board.state-mapping-version",
  iteration: "wish-board.iteration-id",
  theme: "wish-board.theme",
  githubToken: "wish-board.github-token",
  githubOwners: "wish-board.github-owners",
  githubAllOwners: "wish-board.github-all-owners",
  githubRepos: "wish-board.github-repositories",
  githubAllRepos: "wish-board.github-all-repositories",
  githubPrFilters: "wish-board.github-pr-filters",
  boardGroupBy: "wish-board.board-group-by",
  wiki: "wish-board.wiki-id",
  wikiExpandedItems: "wish-board.wiki-expanded-items",
  forYouCustom: "wish-board.for-you-custom-table"
};

const DEFAULT_URL = "";
const DEFAULT_MAPPING_VERSION = 1;
const ACTIVE_DEFAULT_STATES = [
  "PR under review",
  "Ready for release to accept",
  "Rework ACC",
  "Test on acc",
  "Test on dev"
];
const DEFAULT_MAPPING = {
  New: "todo",
  Proposed: "hidden",
  "To Do": "hidden",
  Open: "hidden",
  Approved: "hidden",
  Active: "active",
  Committed: "hidden",
  "In Progress": "hidden",
  Doing: "hidden",
  "PR under review": "active",
  "Ready for release to accept": "active",
  "Rework ACC": "active",
  "Test on acc": "active",
  "Test on dev": "active",
  Resolved: "done",
  Closed: "done",
  Done: "done",
  Completed: "hidden",
  Removed: "hidden"
};

const STATE_TONES = {
  "active": "blue",
  "pr under review": "sky",
  "test on dev": "magenta",
  "rework dev": "yellow",
  "ready for release to accept": "red",
  "ready to release to accept": "red",
  "test on acc": "purple",
  "rework acc": "orange",
  "resolved": "blue",
  "closed": "green"
};

const state = {
  orgUrl: localStorage.getItem(STORAGE.url) || DEFAULT_URL,
  pat: localStorage.getItem(STORAGE.pat) || "",
  githubToken: localStorage.getItem(STORAGE.githubToken) || "",
  githubOwners: readJson(STORAGE.githubOwners, []),
  githubAllOwners: localStorage.getItem(STORAGE.githubAllOwners) !== "false",
  githubRepos: readJson(STORAGE.githubRepos, []),
  githubAllRepos: localStorage.getItem(STORAGE.githubAllRepos) !== "false",
  githubAccessibleRepositories: [],
  githubAccessibleRepositoriesToken: "",
  githubOwnerChoices: [],
  githubOwnerRepositoriesCache: new Map(),
  githubSettingsRepositories: [],
  githubSettingsRepositoryRequestToken: 0,
  githubRepositoryDraft: new Set(),
  githubRepositoryDraftInitialized: false,
  teams: [],
  teamId: localStorage.getItem(STORAGE.team) || "",
  projectName: localStorage.getItem(STORAGE.project) || "",
  teamName: "",
  authenticatedUser: null,
  teamMembers: [],
  iterations: [],
  currentIterationId: "",
  iteration: null,
  stories: [],
  knownStates: new Set(Object.keys(DEFAULT_MAPPING)),
  mapping: readMapping(),
  search: "",
  backlogSearch: "",
  forYouSearch: "",
  boardGroupBy: ["none", "state", "assignee", "priority"].includes(localStorage.getItem(STORAGE.boardGroupBy))
    ? localStorage.getItem(STORAGE.boardGroupBy) : "none",
  filters: {
    type: new Set(),
    assignee: new Set(),
    priority: new Set(),
    sprint: new Set(),
    itemState: new Set(),
    area: new Set(),
    tag: new Set(),
    feature: new Set()
  },
  detailsCache: new Map(),
  iterationStoriesCache: new Map(),
  backlogItems: [],
  backlogEpics: [],
  backlogFeatures: [],
  backlogTeamId: "",
  backlogCollapsedEpics: new Set(),
  backlogCollapsedFeatures: new Set(),
  backlogSelectedIds: new Set(),
  backlogSelectionAnchorId: null,
  backlogDeleting: false,
  backlogUpdating: false,
  backlogPositionItemIds: [],
  backlogPositionGroupKey: "",
  wikis: [],
  wikiId: localStorage.getItem(STORAGE.wiki) || "",
  wikiProjectName: "",
  wikiRoot: null,
  wikiPage: null,
  wikiQuery: "",
  wikiExpandedItems: readStringSet(STORAGE.wikiExpandedItems),
  wikiLoadToken: 0,
  wikiRequestToken: 0,
  forYouProjectName: "",
  forYouCustomItems: [],
  forYouCustomTagChoices: [],
  forYouCustomConfig: readJson(STORAGE.forYouCustom, { assignee: "anyone", state: "all", type: "all" }),
  forYouCustomError: "",
  forYouCustomRequestToken: 0,
  forYouWorkItems: [],
  forYouMentions: [],
  forYouActivity: [],
  forYouCreated: [],
  forYouUpdated: [],
  forYouCompleted: [],
  githubPullRequests: [],
  githubPullRequestsKey: "",
  githubPullRequestsError: "",
  githubPullRequestFilters: readJson(STORAGE.githubPrFilters, { repositories: [], authors: [] }),
  forYouErrors: {},
  forYouExpanded: { custom: false, github: false, work: false, mentions: false, activity: false, created: false, updated: false, completed: false },
  forYouSelectedUser: null,
  forYouUserKey: "",
  forYouRequestToken: 0,
  globalSearchQuery: "",
  globalSearchResults: [],
  globalSearchError: "",
  globalSearchLoading: false,
  globalSearchRequestToken: 0,
  currentView: "board",
  routeReady: false,
  routeApplying: false,
  routeRequestToken: 0,
  routeWikiPath: "",
  routeSprint: "",
  routeQueryTimer: null,
  routeNavigationTimer: null,
  releaseDebug: {
    classic: [],
    yamlRuns: [],
    yamlDeployments: [],
    errors: {},
    loaded: false,
    requestToken: 0,
    environmentsPromise: null,
    classicReleaseDetailsPromise: null
  },
  releaseReadiness: {
    development: [],
    acceptance: [],
    warnings: [],
    error: "",
    loaded: false,
    requestToken: 0,
    githubComparisons: new Map(),
    githubRepositoryMatches: new Map()
  },
  detailsRequestTokens: new Map(),
  commentsCache: new Map(),
  commentsRequestTokens: new Map(),
  historyCache: new Map(),
  githubWorkItemPullRequestsCache: new Map(),
  githubWorkItemPullRequestsErrors: new Map(),
  githubWorkItemPullRequestsRequestTokens: new Map(),
  githubCommitBuildIdsCache: new Map(),
  azureGithubPullRequestBuildIdsCache: new Map(),
  workItemDeploymentsCache: new Map(),
  workItemDeploymentsErrors: new Map(),
  workItemDeploymentsRequestTokens: new Map(),
  workItemDeploymentSourceKeys: new Map(),
  workItemYamlReferencesCache: new Map(),
  workItemYamlDiscoveryErrors: new Map(),
  workItemYamlDiscoveryRequestTokens: new Map(),
  yamlBuildWorkItemsCache: new Map(),
  recentYamlBuildsProject: "",
  recentYamlBuilds: [],
  recentYamlBuildsLoaded: false,
  recentYamlBuildsPromise: null,
  richImageCache: new Map(),
  workItemTypeStatesCache: new Map(),
  workItemTypeFieldsCache: new Map(),
  workItemTypes: [],
  workItemTypesProject: "",
  createWorkItemType: "",
  createWorkItemParent: null,
  areaPathsCache: null,
  teamIterationsCache: null,
  commentsErrors: new Map(),
  historyErrors: new Map(),
  selectedItemId: null,
  selectedItem: null,
  pendingWorkItemWrites: 0,
  loading: false
};

const FILTER_DEFINITIONS = [
  { key: "type", label: "Types", value: item => item.type },
  { key: "assignee", label: "Assigned to", value: item => item.assignee || "Unassigned" },
  { key: "priority", label: "Priority", value: item => item.priority != null ? String(item.priority) : "No priority" },
  { key: "sprint", label: "Sprint", value: item => item.iterationName },
  { key: "itemState", label: "States", value: item => item.state },
  { key: "area", label: "Area", value: item => item.area || "No area" },
  { key: "tag", label: "Tags", values: item => item.tags },
  { key: "feature", label: "Feature", value: item => item.featureLabel || "No parent" }
];

const HISTORY_FIELDS = {
  "System.Title": "Title",
  "System.State": "State",
  "System.Reason": "Reason",
  "System.AssignedTo": "Assigned to",
  "System.WorkItemType": "Type",
  "System.AreaPath": "Area",
  "System.IterationPath": "Sprint",
  "System.Tags": "Tags",
  "System.Description": "Description",
  "Microsoft.VSTS.Common.AcceptanceCriteria": "Acceptance criteria",
  "Microsoft.VSTS.TCM.ReproSteps": "Repro steps",
  "Microsoft.VSTS.TCM.SystemInfo": "System info",
  "System.Parent": "Parent",
  "Microsoft.VSTS.Common.Priority": "Priority",
  "Microsoft.VSTS.Scheduling.StoryPoints": "Story points",
  "Microsoft.VSTS.Scheduling.Effort": "Effort"
};

const RICH_TEXT_TAGS = new Set([
  "a", "b", "blockquote", "br", "code", "del", "div", "em", "h1", "h2", "h3", "h4", "h5", "h6",
  "hr", "i", "img", "input", "li", "ol", "p", "pre", "s", "span", "strike", "strong", "table", "tbody",
  "td", "th", "thead", "tr", "u", "ul"
]);
const RICH_TEXT_STYLES = new Set([
  "background-color", "color", "font-style", "font-weight", "height", "margin-left", "max-width",
  "text-align", "text-decoration", "vertical-align", "width"
]);

const els = {
  appBrand: document.querySelector("#appBrand"),
  brandName: document.querySelector("#brandName"),
  headerAvatar: document.querySelector("#headerAvatar"),
  projectTeamLabels: [...document.querySelectorAll("[data-project-team]")],
  forYouNav: document.querySelector("#forYouNav"),
  sprintBoardNav: document.querySelector("#sprintBoardNav"),
  backlogNav: document.querySelector("#backlogNav"),
  wikiNav: document.querySelector("#wikiNav"),
  releasesNav: document.querySelector("#releasesNav"),
  createWorkItemControl: document.querySelector("#createWorkItemControl"),
  createWorkItemButton: document.querySelector("#createWorkItemButton"),
  createWorkItemMenu: document.querySelector("#createWorkItemMenu"),
  createWorkItemTypes: document.querySelector("#createWorkItemTypes"),
  listViews: [...document.querySelectorAll("[data-list-view]")],
  boardViews: [...document.querySelectorAll("[data-board-view]")],
  backlogViews: [...document.querySelectorAll("[data-backlog-view]")],
  forYouViews: [...document.querySelectorAll("[data-for-you-view]")],
  wikiViews: [...document.querySelectorAll("[data-wiki-view]")],
  releasesViews: [...document.querySelectorAll("[data-releases-view]")],
  searchViews: [...document.querySelectorAll("[data-search-view]")],
  releasesRefresh: document.querySelector("#releasesRefresh"),
  releaseReadinessStatus: document.querySelector("#releaseReadinessStatus"),
  releaseReadinessNotice: document.querySelector("#releaseReadinessNotice"),
  developmentReadinessCount: document.querySelector("#developmentReadinessCount"),
  developmentReadinessSummary: document.querySelector("#developmentReadinessSummary"),
  developmentReadinessList: document.querySelector("#developmentReadinessList"),
  acceptanceReadinessCount: document.querySelector("#acceptanceReadinessCount"),
  acceptanceReadinessSummary: document.querySelector("#acceptanceReadinessSummary"),
  acceptanceReadinessList: document.querySelector("#acceptanceReadinessList"),
  classicReleasesCount: document.querySelector("#classicReleasesCount"),
  classicReleasesStatus: document.querySelector("#classicReleasesStatus"),
  classicReleasesList: document.querySelector("#classicReleasesList"),
  yamlRunsCount: document.querySelector("#yamlRunsCount"),
  yamlRunsStatus: document.querySelector("#yamlRunsStatus"),
  yamlRunsList: document.querySelector("#yamlRunsList"),
  yamlDeploymentsCount: document.querySelector("#yamlDeploymentsCount"),
  yamlDeploymentsStatus: document.querySelector("#yamlDeploymentsStatus"),
  yamlDeploymentsList: document.querySelector("#yamlDeploymentsList"),
  globalSearchForm: document.querySelector("#globalSearchForm"),
  globalSearchInput: document.querySelector("#globalSearchInput"),
  globalSearchPageForm: document.querySelector("#globalSearchPageForm"),
  globalSearchPageInput: document.querySelector("#globalSearchPageInput"),
  globalSearchMeta: document.querySelector("#globalSearchMeta"),
  globalSearchStatus: document.querySelector("#globalSearchStatus"),
  globalSearchPanel: document.querySelector("#globalSearchPanel"),
  globalSearchRows: document.querySelector("#globalSearchRows"),
  globalSearchActions: document.querySelector("#globalSearchActions"),
  globalSearchExternal: document.querySelector("#globalSearchExternal"),
  forYouTitle: document.querySelector("#forYouTitle"),
  forYouMeta: document.querySelector("#forYouMeta"),
  forYouPersonControl: document.querySelector("#forYouPersonControl"),
  forYouPerson: document.querySelector("#forYouPerson"),
  forYouPersonName: document.querySelector("#forYouPersonName"),
  forYouPersonMenu: document.querySelector("#forYouPersonMenu"),
  forYouPersonSearch: document.querySelector("#forYouPersonSearch"),
  forYouPersonOptions: document.querySelector("#forYouPersonOptions"),
  forYouTeamName: document.querySelector("#forYouTeamName"),
  forYouWorkCount: document.querySelector("#forYouWorkCount"),
  forYouWorkDescription: document.querySelector("#forYouWorkDescription"),
  forYouWorkStatus: document.querySelector("#forYouWorkStatus"),
  forYouWorkList: document.querySelector("#forYouWorkList"),
  forYouWorkShowAll: document.querySelector("#forYouWorkShowAll"),
  forYouMentionsCount: document.querySelector("#forYouMentionsCount"),
  forYouMentionsDescription: document.querySelector("#forYouMentionsDescription"),
  forYouMentionsStatus: document.querySelector("#forYouMentionsStatus"),
  forYouMentionsList: document.querySelector("#forYouMentionsList"),
  forYouMentionsShowAll: document.querySelector("#forYouMentionsShowAll"),
  forYouActivityCount: document.querySelector("#forYouActivityCount"),
  forYouActivityDescription: document.querySelector("#forYouActivityDescription"),
  forYouActivityStatus: document.querySelector("#forYouActivityStatus"),
  forYouActivityList: document.querySelector("#forYouActivityList"),
  forYouActivityShowAll: document.querySelector("#forYouActivityShowAll"),
  forYouCreatedCount: document.querySelector("#forYouCreatedCount"),
  forYouCreatedStatus: document.querySelector("#forYouCreatedStatus"),
  forYouCreatedList: document.querySelector("#forYouCreatedList"),
  forYouCreatedShowAll: document.querySelector("#forYouCreatedShowAll"),
  forYouUpdatedCount: document.querySelector("#forYouUpdatedCount"),
  forYouUpdatedStatus: document.querySelector("#forYouUpdatedStatus"),
  forYouUpdatedList: document.querySelector("#forYouUpdatedList"),
  forYouUpdatedShowAll: document.querySelector("#forYouUpdatedShowAll"),
  forYouCompletedCount: document.querySelector("#forYouCompletedCount"),
  forYouCompletedStatus: document.querySelector("#forYouCompletedStatus"),
  forYouCompletedList: document.querySelector("#forYouCompletedList"),
  forYouCompletedShowAll: document.querySelector("#forYouCompletedShowAll"),
  githubPrPanel: document.querySelector("#githubPrPanel"),
  githubPrTitle: document.querySelector("#githubPrTitle"),
  githubPrCount: document.querySelector("#githubPrCount"),
  githubPrStatus: document.querySelector("#githubPrStatus"),
  githubPrFiltersToggle: document.querySelector("#githubPrFiltersToggle"),
  githubPrFiltersBody: document.querySelector("#githubPrFiltersBody"),
  githubPrRepositories: document.querySelector("#githubPrRepositories"),
  githubPrRepositoriesSummary: document.querySelector("#githubPrRepositoriesSummary"),
  githubPrRepositoryOptions: document.querySelector("#githubPrRepositoryOptions"),
  githubPrAuthors: document.querySelector("#githubPrAuthors"),
  githubPrAuthorsSummary: document.querySelector("#githubPrAuthorsSummary"),
  githubPrAuthorOptions: document.querySelector("#githubPrAuthorOptions"),
  githubPrTableWrap: document.querySelector("#githubPrTableWrap"),
  githubPrRows: document.querySelector("#githubPrRows"),
  githubPrShowAll: document.querySelector("#githubPrShowAll"),
  forYouCustomTitle: document.querySelector("#forYouCustomTitle"),
  forYouCustomFiltersToggle: document.querySelector("#forYouCustomFiltersToggle"),
  forYouCustomFiltersBody: document.querySelector("#forYouCustomFiltersBody"),
  forYouCustomAssignee: document.querySelector("#forYouCustomAssignee"),
  forYouCustomState: document.querySelector("#forYouCustomState"),
  forYouCustomType: document.querySelector("#forYouCustomType"),
  forYouCustomTags: document.querySelector("#forYouCustomTags"),
  forYouCustomTagsSummary: document.querySelector("#forYouCustomTagsSummary"),
  forYouCustomTagOptions: document.querySelector("#forYouCustomTagOptions"),
  forYouCustomTagMode: document.querySelector("#forYouCustomTagMode"),
  forYouCustomStatus: document.querySelector("#forYouCustomStatus"),
  forYouCustomCount: document.querySelector("#forYouCustomCount"),
  forYouCustomRows: document.querySelector("#forYouCustomRows"),
  forYouCustomShowAll: document.querySelector("#forYouCustomShowAll"),
  forYouSearch: document.querySelector("#forYouSearchInput"),
  backlogView: document.querySelector("#backlogView"),
  backlogHierarchyToggle: document.querySelector("#backlogHierarchyToggle"),
  backlogSidebar: document.querySelector("#backlogSidebar"),
  backlogSidebarStatus: document.querySelector("#backlogSidebarStatus"),
  backlogHierarchy: document.querySelector("#backlogHierarchy"),
  backlogShowAllFeatures: document.querySelector("#backlogShowAllFeatures"),
  backlogSearch: document.querySelector("#backlogSearchInput"),
  backlogMeta: document.querySelector("#backlogMeta"),
  backlogContent: document.querySelector("#backlogContent"),
  wikiSelect: document.querySelector("#wikiSelect"),
  wikiNavigationToggle: document.querySelector("#wikiNavigationToggle"),
  wikiSidebar: document.querySelector("#wikiSidebar"),
  wikiSearch: document.querySelector("#wikiSearch"),
  wikiTreeStatus: document.querySelector("#wikiTreeStatus"),
  wikiTree: document.querySelector("#wikiTree"),
  wikiBreadcrumbs: document.querySelector("#wikiBreadcrumbs"),
  wikiPageTitle: document.querySelector("#wikiPageTitle"),
  wikiPageStatus: document.querySelector("#wikiPageStatus"),
  wikiPageContent: document.querySelector("#wikiPageContent"),
  wikiOpenAzure: document.querySelector("#wikiOpenAzure"),
  board: document.querySelector("#board"),
  status: document.querySelector("#statusRegion"),
  theme: document.querySelector("#themeButton"),
  refresh: document.querySelector("#refreshButton"),
  search: document.querySelector("#searchInput"),
  boardGroupControl: document.querySelector("#boardGroupControl"),
  boardGroupLabel: document.querySelector("#boardGroupLabel"),
  boardGroupOptions: [...document.querySelectorAll("[data-board-group]")],
  filterPanelToggle: document.querySelector("#filterPanelToggle"),
  filterPanelBody: document.querySelector("#filterPanelBody"),
  filterControls: document.querySelector("#filterControls"),
  activeFilters: document.querySelector("#activeFilters"),
  clearFilters: document.querySelector("#clearFilters"),
  filterResultCount: document.querySelector("#filterResultCount"),
  sprintBadge: document.querySelector("#sprintBadge"),
  sprintTitle: document.querySelector("#sprintTitle"),
  sprintTitleControl: document.querySelector("#sprintTitleControl"),
  sprintMenu: document.querySelector("#sprintMenu"),
  sprintMenuSearch: document.querySelector("#sprintMenuSearch"),
  sprintMenuOptions: document.querySelector("#sprintMenuOptions"),
  sprintMeta: document.querySelector("#sprintMeta"),
  connectionDialog: document.querySelector("#connectionDialog"),
  connectionForm: document.querySelector("#connectionForm"),
  orgUrl: document.querySelector("#orgUrlInput"),
  pat: document.querySelector("#patInput"),
  githubToken: document.querySelector("#githubTokenInput"),
  connectionError: document.querySelector("#connectionError"),
  cancelConnection: document.querySelector("#cancelConnection"),
  settingsDialog: document.querySelector("#settingsDialog"),
  settingsForm: document.querySelector("#settingsForm"),
  teamSelect: document.querySelector("#teamSelect"),
  stateMappings: document.querySelector("#stateMappings"),
  githubRepoSettings: document.querySelector("#githubRepoSettings"),
  githubAllOwners: document.querySelector("#githubAllOwners"),
  githubOwnerOptions: document.querySelector("#githubOwnerOptions"),
  githubOwnerStatus: document.querySelector("#githubOwnerStatus"),
  githubAllRepos: document.querySelector("#githubAllRepos"),
  githubRepoOptions: document.querySelector("#githubRepoOptions"),
  githubRepoStatus: document.querySelector("#githubRepoStatus"),
  changeConnection: document.querySelector("#changeConnection"),
  createWorkItemDialog: document.querySelector("#createWorkItemDialog"),
  createWorkItemForm: document.querySelector("#createWorkItemForm"),
  createWorkItemTypeLabel: document.querySelector("#createWorkItemTypeLabel"),
  createWorkItemHeadingType: document.querySelector("#createWorkItemHeadingType"),
  createWorkItemTitle: document.querySelector("#createWorkItemTitle"),
  createWorkItemParent: document.querySelector("#createWorkItemParent"),
  createWorkItemParentLabel: document.querySelector("#createWorkItemParentLabel"),
  createWorkItemError: document.querySelector("#createWorkItemError"),
  createWorkItemSubmit: document.querySelector("#createWorkItemSubmit"),
  backlogPositionDialog: document.querySelector("#backlogPositionDialog"),
  backlogPositionForm: document.querySelector("#backlogPositionForm"),
  backlogPositionKey: document.querySelector("#backlogPositionKey"),
  backlogPositionScope: document.querySelector("#backlogPositionScope"),
  backlogPositionTitle: document.querySelector("#backlogPositionTitle"),
  backlogPositionInput: document.querySelector("#backlogPositionInput"),
  backlogPositionLowest: document.querySelector("#backlogPositionLowest"),
  backlogPositionHighest: document.querySelector("#backlogPositionHighest"),
  backlogPositionError: document.querySelector("#backlogPositionError"),
  backlogPositionSubmit: document.querySelector("#backlogPositionSubmit"),
  workItemDialog: document.querySelector("#workItemDialog"),
  workItemActions: document.querySelector("#workItemActions"),
  deleteWorkItem: document.querySelector("#deleteWorkItem"),
  workItemLoading: document.querySelector("#workItemLoading"),
  workItemType: document.querySelector("#workItemType"),
  workItemKey: document.querySelector("#workItemKey"),
  workItemTitle: document.querySelector("#workItemTitle"),
  workItemTitleForm: document.querySelector("#workItemTitleForm"),
  workItemTitleInput: document.querySelector("#workItemTitleInput"),
  workItemTitleCancel: document.querySelector("#workItemTitleCancel"),
  workItemTitleSubmit: document.querySelector("#workItemTitleSubmit"),
  workItemTitleStatus: document.querySelector("#workItemTitleStatus"),
  workItemStateControl: document.querySelector("#workItemStateControl"),
  workItemState: document.querySelector("#workItemState"),
  workItemStateMenu: document.querySelector("#workItemStateMenu"),
  workItemStateOptions: document.querySelector("#workItemStateOptions"),
  workItemReason: document.querySelector("#workItemReason"),
  descriptionHeading: document.querySelector("#descriptionHeading"),
  workItemDescription: document.querySelector("#workItemDescription"),
  descriptionEditButton: document.querySelector("#descriptionEditButton"),
  descriptionEditorForm: document.querySelector("#descriptionEditorForm"),
  descriptionViewTabs: [...document.querySelectorAll("[data-description-view]")],
  descriptionToolbar: document.querySelector("#descriptionToolbar"),
  descriptionEditorWrap: document.querySelector("#descriptionEditorWrap"),
  descriptionEditor: document.querySelector("#descriptionEditor"),
  descriptionSourceEditor: document.querySelector("#descriptionSourceEditor"),
  descriptionMentionMenu: document.querySelector("#descriptionMentionMenu"),
  descriptionMentionLabel: document.querySelector("#descriptionMentionLabel"),
  descriptionMentionOptions: document.querySelector("#descriptionMentionOptions"),
  descriptionEditorCancel: document.querySelector("#descriptionEditorCancel"),
  descriptionEditorSubmit: document.querySelector("#descriptionEditorSubmit"),
  descriptionEditorHint: document.querySelector("#descriptionEditorHint"),
  descriptionEditorStatus: document.querySelector("#descriptionEditorStatus"),
  workItemAcceptanceCriteriaSection: document.querySelector("#workItemAcceptanceCriteriaSection"),
  workItemAcceptanceCriteria: document.querySelector("#workItemAcceptanceCriteria"),
  acceptanceCriteriaEditButton: document.querySelector("#acceptanceCriteriaEditButton"),
  workItemSystemInfoSection: document.querySelector("#workItemSystemInfoSection"),
  workItemSystemInfo: document.querySelector("#workItemSystemInfo"),
  systemInfoEditButton: document.querySelector("#systemInfoEditButton"),
  workItemAssignee: document.querySelector("#workItemAssignee"),
  workItemAssigneeControl: document.querySelector("#workItemAssigneeControl"),
  workItemAssigneeMenu: document.querySelector("#workItemAssigneeMenu"),
  workItemAssigneeSearch: document.querySelector("#workItemAssigneeSearch"),
  workItemAssigneeSource: document.querySelector("#workItemAssigneeSource"),
  workItemAssigneeOptions: document.querySelector("#workItemAssigneeOptions"),
  workItemReporter: document.querySelector("#workItemReporter"),
  workItemPriority: document.querySelector("#workItemPriority"),
  workItemPriorityControl: document.querySelector("#workItemPriorityControl"),
  workItemPriorityMenu: document.querySelector("#workItemPriorityMenu"),
  workItemPriorityOptions: document.querySelector("#workItemPriorityOptions"),
  workItemPoints: document.querySelector("#workItemPoints"),
  workItemPointsControl: document.querySelector("#workItemPointsControl"),
  workItemPointsMenu: document.querySelector("#workItemPointsMenu"),
  workItemPointsQuick: document.querySelector("#workItemPointsQuick"),
  workItemPointsForm: document.querySelector("#workItemPointsForm"),
  workItemPointsInput: document.querySelector("#workItemPointsInput"),
  workItemArea: document.querySelector("#workItemArea"),
  workItemAreaControl: document.querySelector("#workItemAreaControl"),
  workItemAreaMenu: document.querySelector("#workItemAreaMenu"),
  workItemAreaSearch: document.querySelector("#workItemAreaSearch"),
  workItemAreaOptions: document.querySelector("#workItemAreaOptions"),
  workItemIteration: document.querySelector("#workItemIteration"),
  workItemIterationControl: document.querySelector("#workItemIterationControl"),
  workItemIterationMenu: document.querySelector("#workItemIterationMenu"),
  workItemIterationSearch: document.querySelector("#workItemIterationSearch"),
  workItemIterationOptions: document.querySelector("#workItemIterationOptions"),
  workItemParent: document.querySelector("#workItemParent"),
  workItemTags: document.querySelector("#workItemTags"),
  workItemTagsControl: document.querySelector("#workItemTagsControl"),
  workItemTagsMenu: document.querySelector("#workItemTagsMenu"),
  workItemTagsSelected: document.querySelector("#workItemTagsSelected"),
  workItemTagsInput: document.querySelector("#workItemTagsInput"),
  workItemTagsHint: document.querySelector("#workItemTagsHint"),
  workItemTagsOptions: document.querySelector("#workItemTagsOptions"),
  workItemChanged: document.querySelector("#workItemChanged"),
  workItemCommentCount: document.querySelector("#workItemCommentCount"),
  workItemHistoryCount: document.querySelector("#workItemHistoryCount"),
  workItemPullRequestCount: document.querySelector("#workItemPullRequestCount"),
  workItemReleaseCount: document.querySelector("#workItemReleaseCount"),
  workItemAttachmentsSection: document.querySelector("#workItemAttachmentsSection"),
  workItemAttachmentCount: document.querySelector("#workItemAttachmentCount"),
  workItemAttachments: document.querySelector("#workItemAttachments"),
  workItemSubtasksSection: document.querySelector("#workItemSubtasksSection"),
  workItemSubtasksProgress: document.querySelector("#workItemSubtasksProgress"),
  workItemSubtasksProgressLabel: document.querySelector("#workItemSubtasksProgressLabel"),
  workItemSubtasksStatus: document.querySelector("#workItemSubtasksStatus"),
  workItemSubtasks: document.querySelector("#workItemSubtasks"),
  workItemAllPanel: document.querySelector("#workItemAllPanel"),
  workItemCommentsPanel: document.querySelector("#workItemCommentsPanel"),
  workItemHistoryPanel: document.querySelector("#workItemHistoryPanel"),
  workItemPullRequestsPanel: document.querySelector("#workItemPullRequestsPanel"),
  workItemReleasesPanel: document.querySelector("#workItemReleasesPanel"),
  workItemActivityStatus: document.querySelector("#workItemActivityStatus"),
  workItemActivity: document.querySelector("#workItemActivity"),
  workItemCommentsStatus: document.querySelector("#workItemCommentsStatus"),
  workItemComments: document.querySelector("#workItemComments"),
  commentComposerPrompt: document.querySelector("#commentComposerPrompt"),
  commentComposerForm: document.querySelector("#commentComposerForm"),
  commentComposerInput: document.querySelector("#commentComposerInput"),
  commentMentionMenu: document.querySelector("#commentMentionMenu"),
  commentMentionLabel: document.querySelector("#commentMentionLabel"),
  commentMentionOptions: document.querySelector("#commentMentionOptions"),
  commentComposerCancel: document.querySelector("#commentComposerCancel"),
  commentComposerSubmit: document.querySelector("#commentComposerSubmit"),
  commentComposerStatus: document.querySelector("#commentComposerStatus"),
  workItemHistoryStatus: document.querySelector("#workItemHistoryStatus"),
  workItemHistory: document.querySelector("#workItemHistory"),
  workItemPullRequestsStatus: document.querySelector("#workItemPullRequestsStatus"),
  workItemPullRequests: document.querySelector("#workItemPullRequests"),
  workItemReleasesStatus: document.querySelector("#workItemReleasesStatus"),
  workItemReleases: document.querySelector("#workItemReleases"),
  workItemLoadStatus: document.querySelector("#workItemLoadStatus"),
  openInAzure: document.querySelector("#openInAzure")
};

const mentionState = {
  description: { mode: "mention", query: "", range: null, activeIndex: 0, choices: [], loading: false, requestToken: 0, timer: null },
  comment: { mode: "mention", query: "", range: null, activeIndex: 0, choices: [], loading: false, requestToken: 0, timer: null }
};

const mobileLayoutQuery = matchMedia("(max-width: 560px)");

function setMobileDisclosure(button, content, expanded) {
  button.setAttribute("aria-expanded", String(expanded));
  const chevron = button.querySelector(".mobile-disclosure-chevron");
  if (chevron) chevron.textContent = expanded ? "⌃" : "⌄";
  content.hidden = !expanded;
}

function toggleMobileDisclosure(button, content) {
  setMobileDisclosure(button, content, button.getAttribute("aria-expanded") !== "true");
}

function applyMobileDisclosures(mobile) {
  const expanded = !mobile;
  for (const [button, content] of [
    [els.filterPanelToggle, els.filterPanelBody],
    [els.forYouCustomFiltersToggle, els.forYouCustomFiltersBody],
    [els.githubPrFiltersToggle, els.githubPrFiltersBody],
    [els.backlogHierarchyToggle, els.backlogSidebar],
    [els.wikiNavigationToggle, els.wikiSidebar]
  ]) setMobileDisclosure(button, content, expanded);
  if (mobile) {
    els.forYouCustomTags.open = false;
    els.githubPrRepositories.open = false;
    els.githubPrAuthors.open = false;
  }
}

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}

function readStringSet(key) {
  const values = readJson(key, []);
  return new Set(Array.isArray(values) ? values.filter(value => typeof value === "string") : []);
}

function readMapping() {
  const mapping = { ...DEFAULT_MAPPING, ...readJson(STORAGE.mapping, {}) };
  const storedVersion = Number(localStorage.getItem(STORAGE.mappingVersion) || 0);
  if (storedVersion < DEFAULT_MAPPING_VERSION) {
    ACTIVE_DEFAULT_STATES.forEach(itemState => { mapping[itemState] = "active"; });
    localStorage.setItem(STORAGE.mapping, JSON.stringify(mapping));
    localStorage.setItem(STORAGE.mappingVersion, String(DEFAULT_MAPPING_VERSION));
  }
  return mapping;
}

function applyTheme(theme, persist = false) {
  document.documentElement.dataset.theme = theme;
  if (persist) localStorage.setItem(STORAGE.theme, theme);
  const isDark = theme === "dark";
  els.theme.setAttribute("aria-pressed", String(isDark));
  els.theme.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  els.theme.title = isDark ? "Light mode" : "Dark mode";
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#0c1524" : "#0747a6";
}

function parseAzureUrl(input) {
  const url = new URL(input.trim());
  const parts = url.pathname.split("/").filter(Boolean).map(part => decodeURIComponent(part));
  const isModernUrl = url.hostname === "dev.azure.com";
  const organization = isModernUrl ? parts[0] : url.hostname.split(".")[0];
  const rawProject = isModernUrl ? parts[1] : parts[0];
  const project = rawProject && !rawProject.startsWith("_") ? rawProject : "";
  const projectTail = isModernUrl ? parts.slice(2) : parts.slice(1);
  let pathTeam = projectTail[0] && !projectTail[0].startsWith("_") ? projectTail[0] : "";
  if (projectTail[0] === "_boards") {
    const teamMarker = projectTail.indexOf("t");
    pathTeam = teamMarker >= 0 ? projectTail[teamMarker + 1] || "" : "";
  } else if (["_backlogs", "_sprints"].includes(projectTail[0])) {
    pathTeam = projectTail[2] || "";
  }
  const team = url.searchParams.get("team") || url.searchParams.get("teamId") || pathTeam;
  if (!organization) throw new Error("Enter at least a valid Azure DevOps organization URL.");
  const orgBase = `https://dev.azure.com/${encodeURIComponent(organization)}`;
  const projectBase = project ? `${orgBase}/${encodeURIComponent(project)}` : orgBase;
  return {
    organization,
    project: project || "",
    team,
    orgBase,
    base: projectBase,
    webBase: projectBase
  };
}

function activeAzureContext() {
  const parsed = parseAzureUrl(state.orgUrl);
  const project = parsed.project || state.projectName;
  const projectBase = project ? `${parsed.orgBase}/${encodeURIComponent(project)}` : parsed.orgBase;
  return { ...parsed, project, base: projectBase, webBase: projectBase };
}

function updateBranding(team = null) {
  let configuredProject = "";
  try { configuredProject = parseAzureUrl(state.orgUrl).project; } catch {}
  if (configuredProject) state.projectName = configuredProject;
  const project = state.projectName;
  state.teamName = team?.name || "";
  const displayName = state.teamName || "Jiraish";
  const profileName = state.authenticatedUser?.displayName || state.teamName || displayName;
  els.brandName.textContent = displayName;
  els.appBrand.setAttribute("aria-label", `${displayName} · Jiraish`);
  els.headerAvatar.textContent = initialsFor(profileName);
  els.headerAvatar.setAttribute("aria-label", `Open settings for ${profileName}`);
  els.headerAvatar.title = `${profileName} · Settings`;
  const contextLabel = project
    ? `PROJECT / ${project}${state.teamName && state.teamName.toLocaleLowerCase("en") !== project.toLocaleLowerCase("en") ? ` · TEAM / ${state.teamName}` : ""}`
    : "PROJECT";
  els.projectTeamLabels.forEach(label => { label.textContent = contextLabel; });
  document.title = state.teamName ? `${state.teamName} · Jiraish` : "Jiraish";
}

async function loadAuthenticatedUser() {
  try {
    const connection = await azure("/_apis/connectionData?connectOptions=0&lastChangeId=-1&lastChangeId64=-1", {}, "organization");
    const identity = connection.authenticatedUser || connection.authorizedUser;
    if (!identity) return null;
    const properties = identity.properties || {};
    const displayName = identity.customDisplayName
      || identity.providerDisplayName
      || identity.displayName
      || properties.DisplayName?.$value
      || properties.Account?.$value
      || identity.uniqueName
      || "";
    return displayName ? {
      id: identity.id || "",
      displayName,
      uniqueName: identity.uniqueName || identity.mailAddress || identity.properties?.Account?.$value || ""
    } : null;
  } catch (error) {
    console.warn("The user associated with the PAT could not be determined; team initials will be used.", error);
    return null;
  }
}

function workItemKey(itemId) {
  const prefix = String(state.projectName || "")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLocaleUpperCase("en")
    .slice(0, 24);
  return prefix ? `${prefix}-${itemId}` : `#${itemId}`;
}

function workItemWebUrl(itemId) {
  const { webBase } = activeAzureContext();
  return `${webBase}/_workitems/edit/${Number(itemId)}`;
}

async function azure(path, options = {}, scope = "project") {
  const parsed = activeAzureContext();
  if (scope === "project" && !parsed.project) throw new Error("No Azure DevOps project has been selected yet.");
  const apiBase = scope === "organization" ? parsed.orgBase : parsed.base;
  const method = String(options.method || "GET").toUpperCase();
  const protectsWork = ["POST", "PATCH", "DELETE"].includes(method)
    && /\/_apis\/wit\/(?:workitems|attachments)/i.test(path);
  if (protectsWork) state.pendingWorkItemWrites++;
  try {
    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${btoa(`:${state.pat}`)}`,
        ...options.headers
      }
    });
    if (response.status === 401 || response.status === 403) {
      const error = new Error("The PAT is invalid, expired, or does not have the required read permissions.");
      error.auth = true;
      error.status = response.status;
      throw error;
    }
    if (!response.ok) {
      let detail = "";
      try { detail = (await response.json())?.message || ""; } catch {}
      const error = new Error(detail || `Azure DevOps returned error ${response.status}.`);
      error.status = response.status;
      throw error;
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } finally {
    if (protectsWork) state.pendingWorkItemWrites = Math.max(0, state.pendingWorkItemWrites - 1);
  }
}

async function azurePage(path, scope = "project") {
  const parsed = activeAzureContext();
  if (scope === "project" && !parsed.project) throw new Error("No Azure DevOps project has been selected yet.");
  const apiBase = scope === "organization" ? parsed.orgBase : parsed.base;
  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${btoa(`:${state.pat}`)}`
    }
  });
  let result = null;
  try { result = await response.json(); } catch {}
  if (response.status === 401 || response.status === 403) {
    const error = new Error("The PAT is invalid, expired, or does not have the required read permissions.");
    error.auth = true;
    error.status = response.status;
    throw error;
  }
  if (!response.ok) {
    const error = new Error(result?.message || `Azure DevOps returned error ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  return {
    result,
    continuationToken: response.headers.get("x-ms-continuationtoken")
      || response.headers.get("x-ms-continuation-token")
      || ""
  };
}

async function azureRelease(path, project = "") {
  const parsed = activeAzureContext();
  const releaseProject = project || parsed.project;
  if (!releaseProject) throw new Error("No Azure DevOps project has been selected yet.");
  const apiBase = `https://vsrm.dev.azure.com/${encodeURIComponent(parsed.organization)}/${encodeURIComponent(releaseProject)}`;
  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${btoa(`:${state.pat}`)}`
    }
  });
  let result = null;
  try { result = await response.json(); } catch {}
  if (response.status === 401 || response.status === 403) {
    const error = new Error("The PAT requires ‘Release: Read’ to load Classic releases.");
    error.auth = true;
    throw error;
  }
  if (!response.ok) {
    const error = new Error(result?.message || `Azure DevOps Release returned error ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  return result;
}

const WORK_ITEM_TYPE_ORDER = ["Epic", "Feature", "User Story", "Product Backlog Item", "Bug", "Task", "Issue"];

function closeCreateWorkItemMenu() {
  els.createWorkItemMenu.hidden = true;
  els.createWorkItemButton.setAttribute("aria-expanded", "false");
}

function workItemTypeOrder(type) {
  const index = WORK_ITEM_TYPE_ORDER.findIndex(name => name.toLocaleLowerCase("en") === type.name.toLocaleLowerCase("en"));
  return index < 0 ? WORK_ITEM_TYPE_ORDER.length : index;
}

function renderCreateWorkItemTypes(types) {
  if (!types.length) {
    const status = document.createElement("div");
    status.className = "create-work-item-menu-status";
    status.textContent = "No work item types are available in this project.";
    els.createWorkItemTypes.replaceChildren(status);
    return;
  }
  els.createWorkItemTypes.replaceChildren(...types.map(type => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "create-work-item-type";
    button.setAttribute("role", "menuitem");
    const icon = document.createElement("span");
    icon.className = "create-work-item-type-icon";
    icon.textContent = "+";
    if (/^[0-9a-f]{6}$/i.test(type.color || "")) icon.style.backgroundColor = `#${type.color}`;
    const label = document.createElement("span");
    label.textContent = type.name;
    button.append(icon, label);
    button.addEventListener("click", () => openCreateWorkItemDialog(type.name));
    return button;
  }));
}

async function loadCreateWorkItemTypes() {
  if (state.workItemTypesProject === state.projectName && state.workItemTypes.length) {
    renderCreateWorkItemTypes(state.workItemTypes);
    return;
  }
  const loading = document.createElement("div");
  loading.className = "create-work-item-menu-status";
  loading.textContent = "Loading work item types…";
  els.createWorkItemTypes.replaceChildren(loading);
  try {
    const result = await azure("/_apis/wit/workitemtypes?api-version=7.1");
    state.workItemTypes = (result.value || [])
      .filter(type => type?.name && type.isDisabled !== true)
      .map(type => ({ name: type.name, color: type.color || "" }))
      .sort((left, right) => workItemTypeOrder(left) - workItemTypeOrder(right)
        || left.name.localeCompare(right.name, "en", { sensitivity: "base" }));
    state.workItemTypesProject = state.projectName;
    renderCreateWorkItemTypes(state.workItemTypes);
  } catch (error) {
    console.error(error);
    const status = document.createElement("div");
    status.className = "create-work-item-menu-status is-error";
    status.textContent = error.message || "Work item types could not be loaded.";
    els.createWorkItemTypes.replaceChildren(status);
  }
}

async function toggleCreateWorkItemMenu() {
  if (!els.createWorkItemMenu.hidden) return closeCreateWorkItemMenu();
  if (!state.pat) return showConnection();
  closeSprintMenu();
  closeForYouPersonMenu();
  els.boardGroupControl.open = false;
  els.createWorkItemMenu.hidden = false;
  els.createWorkItemButton.setAttribute("aria-expanded", "true");
  await loadCreateWorkItemTypes();
}

function openCreateWorkItemDialog(type, parent = null) {
  state.createWorkItemType = type;
  state.createWorkItemParent = parent;
  closeCreateWorkItemMenu();
  els.createWorkItemTypeLabel.textContent = type;
  els.createWorkItemHeadingType.textContent = type.toLocaleLowerCase("en");
  els.createWorkItemParent.hidden = !parent;
  els.createWorkItemParentLabel.textContent = parent ? `${workItemKey(parent.id)} · ${parent.title}` : "";
  els.createWorkItemTitle.value = "";
  els.createWorkItemError.textContent = "";
  els.createWorkItemSubmit.disabled = false;
  els.createWorkItemSubmit.textContent = "Create";
  if (!els.createWorkItemDialog.open) els.createWorkItemDialog.showModal();
  requestAnimationFrame(() => els.createWorkItemTitle.focus());
}

async function submitCreateWorkItem(event) {
  event.preventDefault();
  const type = state.createWorkItemType;
  const parent = state.createWorkItemParent;
  const title = els.createWorkItemTitle.value.trim();
  if (!type) return;
  if (!title) {
    els.createWorkItemError.textContent = "Enter a title.";
    els.createWorkItemTitle.focus();
    return;
  }
  els.createWorkItemError.textContent = "";
  els.createWorkItemSubmit.disabled = true;
  els.createWorkItemSubmit.textContent = "Creating…";
  try {
    const operations = [{ op: "add", path: "/fields/System.Title", value: title }];
    if (parent) {
      operations.push({
        op: "add",
        path: "/relations/-",
        value: {
          rel: "System.LinkTypes.Hierarchy-Reverse",
          url: `${activeAzureContext().base}/_apis/wit/workItems/${Number(parent.id)}`
        }
      });
    }
    const created = await azure(`/_apis/wit/workitems/$${encodeURIComponent(type)}?api-version=7.1`, {
      method: "POST",
      headers: { "Content-Type": "application/json-patch+json" },
      body: JSON.stringify(operations)
    });
    const item = normalizeWorkItem(created);
    if (parent) {
      item.parentId = parent.id;
      item.featureLabel = backlogFeatureLabel(parent);
      state.backlogItems = [...state.backlogItems.filter(existing => Number(existing.id) !== Number(item.id)), item];
    }
    state.detailsCache.delete(item.id);
    state.commentsCache.delete(item.id);
    state.historyCache.delete(item.id);
    state.forYouProjectName = "";
    if (!parent) state.backlogTeamId = "";
    els.createWorkItemDialog.close();
    await showWorkItem(item);
  } catch (error) {
    console.error(error);
    els.createWorkItemError.textContent = error.message || "The work item could not be created.";
  } finally {
    els.createWorkItemSubmit.disabled = false;
    els.createWorkItemSubmit.textContent = "Create";
  }
}

async function loadBoard({ openSettings = false } = {}) {
  if (!state.pat) {
    showConnection();
    renderEmptyBoard();
    return;
  }
  state.forYouProjectName = "";
  setLoading(true);
  clearNotice();
  try {
    const configured = parseAzureUrl(state.orgUrl);
    let project = configured.project;
    if (!project) {
      const projectsResult = await azure("/_apis/projects?$top=1000&api-version=7.1", {}, "organization");
      const projects = projectsResult.value || [];
      if (!projects.length) throw new Error("No Azure DevOps projects were found in this organization.");
      project = projects.find(value => value.name === state.projectName)?.name || projects[0].name;
    }
    state.projectName = project;
    localStorage.setItem(STORAGE.project, project);
    const teamsResult = await azure(`/_apis/projects/${encodeURIComponent(project)}/teams?api-version=7.1`, {}, "organization");
    state.teams = teamsResult.value || [];
    if (!state.teams.length) throw new Error("No Azure DevOps teams were found in this project.");
    const configuredTeam = configured.team.toLocaleLowerCase("en");
    const selectedTeam = state.teams.find(team => team.id === state.teamId)
      || state.teams.find(team => configuredTeam && (team.id.toLocaleLowerCase("en") === configuredTeam || team.name.toLocaleLowerCase("en") === configuredTeam))
      || state.teams[0];
    state.teamId = selectedTeam.id;
    updateBranding(selectedTeam);
    localStorage.setItem(STORAGE.team, state.teamId);
    [state.teamMembers, state.authenticatedUser] = await Promise.all([
      loadTeamMembers(project, selectedTeam),
      loadAuthenticatedUser()
    ]);
    updateBranding(selectedTeam);

    const teamSegment = encodeURIComponent(selectedTeam.name);
    const [iterationsResult, currentIterationResult] = await Promise.all([
      azure(`/${teamSegment}/_apis/work/teamsettings/iterations?api-version=7.1`),
      azure(`/${teamSegment}/_apis/work/teamsettings/iterations?$timeframe=current&api-version=7.1`)
    ]);
    state.iterations = iterationsResult.value || [];
    state.iterationStoriesCache.clear();
    state.currentIterationId = currentIterationResult.value?.[0]?.id || "";
    const storedIterationId = localStorage.getItem(STORAGE.iteration) || "";
    state.iteration = iterationForRoute(state.routeSprint)
      || state.iterations.find(iteration => iteration.id === storedIterationId)
      || state.iterations.find(iteration => iteration.id === state.currentIterationId)
      || nearestIteration(state.iterations);
    if (!state.iteration) {
      state.stories = [];
      render();
      showNotice(`No sprints are configured for team “${selectedTeam.name}”.`, "error");
      if (state.currentView === "backlog") await loadBacklog(true);
      if (state.currentView === "for-you") await loadForYou(true);
      if (state.currentView === "releases") await loadReleaseDebugPage(true);
      await restoreRoutedViewAfterBoardLoad();
      if (openSettings) showSettings();
      return;
    }
    localStorage.setItem(STORAGE.iteration, state.iteration.id);
    state.teamIterationsCache = Promise.resolve(newestIterations().map(iteration => iteration.path || iteration.name).filter(Boolean));
    await loadIterationStories(selectedTeam, state.iteration);
    if (state.filters.sprint.size) await applySprintFilter();
    render();
    if (state.currentView === "backlog") await loadBacklog(true);
    if (state.currentView === "for-you") await loadForYou(true);
    if (state.currentView === "releases") await loadReleaseDebugPage(true);
    await restoreRoutedViewAfterBoardLoad();
    if (openSettings) showSettings();
  } catch (error) {
    console.error(error);
    showNotice(error.message, "error", error.auth ? "Enter PAT again" : "Try again", error.auth ? showConnection : loadBoard);
    if (error.auth) showConnection(error.message);
    renderEmptyBoard();
  } finally {
    setLoading(false);
  }
}

async function loadIterationStories(team, iteration) {
  const stories = await fetchIterationStories(team, iteration);
  applyBoardStories(stories);
}

async function fetchIterationStories(team, iteration) {
    const cached = state.iterationStoriesCache.get(iteration.id);
    if (cached) return cached;
    const teamSegment = encodeURIComponent(team.name);
    const workResult = await azure(`/${teamSegment}/_apis/work/teamsettings/iterations/${encodeURIComponent(iteration.id)}/workitems?api-version=7.1`);
    const ids = [...new Set((workResult.workItemRelations || []).map(item => item.target?.id).filter(Boolean))];
    const items = [];
    for (let index = 0; index < ids.length; index += 200) {
      const chunk = ids.slice(index, index + 200);
      const fields = [
        "System.Id", "System.Title", "System.State", "System.WorkItemType",
        "System.AssignedTo", "Microsoft.VSTS.Scheduling.StoryPoints",
        "Microsoft.VSTS.Scheduling.Effort", "Microsoft.VSTS.Common.Priority",
        "System.Tags", "System.AreaPath", "System.IterationPath", "System.Parent"
      ].join(",");
      const result = await azure(`/_apis/wit/workitems?ids=${chunk.join(",")}&fields=${encodeURIComponent(fields)}&api-version=7.1`);
      items.push(...(result.value || []));
    }
    const stories = items.map(normalizeWorkItem).map(story => ({
      ...story,
      iterationId: iteration.id,
      iterationName: iteration.name
    }));
    await loadParentDetails(stories);
    state.iterationStoriesCache.set(iteration.id, stories);
    return stories;
}

function applyBoardStories(stories) {
    state.stories = stories;
    state.detailsCache.clear();
    state.detailsRequestTokens.clear();
    state.commentsCache.clear();
    state.commentsRequestTokens.clear();
    state.historyCache.clear();
    state.githubWorkItemPullRequestsCache.clear();
    state.githubWorkItemPullRequestsErrors.clear();
    state.githubWorkItemPullRequestsRequestTokens.clear();
    state.workItemDeploymentsCache.clear();
    state.workItemDeploymentsErrors.clear();
    state.workItemDeploymentsRequestTokens.clear();
    state.workItemDeploymentSourceKeys.clear();
    state.workItemTypeStatesCache.clear();
    state.workItemTypeFieldsCache.clear();
    state.areaPathsCache = null;
    state.commentsErrors.clear();
    state.historyErrors.clear();
    state.stories.forEach(item => state.knownStates.add(item.state));
    addSmartMappings();
    if (state.currentView !== "backlog") pruneFilters(state.stories);
}

function nearestIteration(iterations) {
  const now = Date.now();
  return [...iterations].sort((a, b) => {
    const aStart = new Date(a.attributes?.startDate || 0).getTime();
    const bStart = new Date(b.attributes?.startDate || 0).getTime();
    return Math.abs(aStart - now) - Math.abs(bStart - now);
  })[0] || null;
}

async function loadTeamMembers(project, team) {
  try {
    const result = await azure(`/_apis/projects/${encodeURIComponent(project)}/teams/${encodeURIComponent(team.id)}/members?api-version=7.1`, {}, "organization");
    return (result.value || []).map(member => member.identity || member).map(identity => ({
      id: identity.id || "",
      name: identity.displayName || identity.uniqueName || "Unknown user",
      uniqueName: identity.uniqueName || identity.displayName || ""
    })).filter(member => member.uniqueName);
  } catch (error) {
    console.warn("Team members could not be loaded; assignees from the sprint will be used.", error);
    return [];
  }
}

function normalizeWorkItem(item) {
  const fields = item.fields || {};
  const assigned = fields["System.AssignedTo"];
  const changedBy = fields["System.ChangedBy"];
  const createdBy = fields["System.CreatedBy"];
  const storyPoints = fields["Microsoft.VSTS.Scheduling.StoryPoints"];
  const effort = fields["Microsoft.VSTS.Scheduling.Effort"];
  const iterationPath = fields["System.IterationPath"] || "";
  return {
    id: item.id,
    title: fields["System.Title"] || "Untitled",
    state: fields["System.State"] || "Unknown",
    type: fields["System.WorkItemType"] || "Work item",
    assignee: assigned?.displayName || assigned?.uniqueName || "",
    assigneeUniqueName: assigned?.uniqueName || assigned?.displayName || "",
    assigneeId: assigned?.id || "",
    priority: fields["Microsoft.VSTS.Common.Priority"] ?? null,
    iterationPath,
    iterationName: iterationPath.split("\\").filter(Boolean).pop() || "No sprint",
    area: fields["System.AreaPath"] || "",
    tags: String(fields["System.Tags"] || "").split(";").map(tag => tag.trim()).filter(Boolean),
    parentId: fields["System.Parent"] || null,
    featureLabel: "",
    points: storyPoints ?? effort ?? null,
    changedDate: fields["System.ChangedDate"] || "",
    changedBy: changedBy?.displayName || changedBy?.uniqueName || "",
    changedById: changedBy?.id || "",
    changedByUniqueName: changedBy?.uniqueName || changedBy?.displayName || "",
    createdDate: fields["System.CreatedDate"] || "",
    createdBy: createdBy?.displayName || createdBy?.uniqueName || "",
    descriptionHtml: fields["System.Description"] || "",
    acceptanceCriteriaHtml: fields["Microsoft.VSTS.Common.AcceptanceCriteria"] || "",
    reproStepsHtml: fields["Microsoft.VSTS.TCM.ReproSteps"] || "",
    systemInfoHtml: fields["Microsoft.VSTS.TCM.SystemInfo"] || "",
    pointsField: storyPoints !== undefined ? "Microsoft.VSTS.Scheduling.StoryPoints"
      : effort !== undefined ? "Microsoft.VSTS.Scheduling.Effort" : ""
  };
}

async function fetchWorkItems(ids, { includeDescription = false } = {}) {
  const uniqueIds = [...new Set(ids.map(Number).filter(Boolean))];
  const items = [];
  const fields = [
    "System.Id", "System.Title", "System.State", "System.WorkItemType", "System.AssignedTo",
    "System.IterationPath", "System.AreaPath", "System.Tags", "System.Parent", "System.ChangedDate",
    "System.ChangedBy", "System.CreatedDate", "System.CreatedBy", "Microsoft.VSTS.Common.Priority", "Microsoft.VSTS.Scheduling.StoryPoints",
    "Microsoft.VSTS.Scheduling.Effort"
  ];
  if (includeDescription) fields.push("System.Description", "Microsoft.VSTS.Common.AcceptanceCriteria", "Microsoft.VSTS.TCM.ReproSteps", "Microsoft.VSTS.TCM.SystemInfo");
  for (let index = 0; index < uniqueIds.length; index += 200) {
    const chunk = uniqueIds.slice(index, index + 200);
    const result = await azure(`/_apis/wit/workitems?ids=${chunk.join(",")}&fields=${encodeURIComponent(fields.join(","))}&errorPolicy=Omit&api-version=7.1`);
    items.push(...(result.value || []).map(normalizeWorkItem));
  }
  return items;
}

async function loadParentDetails(items) {
  const parentIds = [...new Set(items.map(item => item.parentId).filter(Boolean))];
  if (!parentIds.length) return;
  const parents = new Map();
  for (let index = 0; index < parentIds.length; index += 200) {
    const chunk = parentIds.slice(index, index + 200);
    const fields = "System.Id,System.Title,System.WorkItemType";
    const result = await azure(`/_apis/wit/workitems?ids=${chunk.join(",")}&fields=${encodeURIComponent(fields)}&errorPolicy=Omit&api-version=7.1`);
    for (const parent of result.value || []) {
      const parentFields = parent.fields || {};
      parents.set(parent.id, {
        title: parentFields["System.Title"] || `Work item ${parent.id}`,
        type: parentFields["System.WorkItemType"] || "Work item"
      });
    }
  }
  for (const item of items) {
    const parent = parents.get(item.parentId);
    if (parent) item.featureLabel = `${parent.title} (#${item.parentId})`;
  }
}

function addSmartMappings() {
  for (const itemState of state.knownStates) {
    if (state.mapping[itemState]) continue;
    const normalized = itemState.toLowerCase();
    if (/closed|done|complete|resolved/.test(normalized)) state.mapping[itemState] = "done";
    else if (/active|progress|committed|doing/.test(normalized)) state.mapping[itemState] = "active";
    else state.mapping[itemState] = "todo";
  }
  localStorage.setItem(STORAGE.mapping, JSON.stringify(state.mapping));
}

function boardGroupLabel(value = state.boardGroupBy) {
  return { none: "None", state: "State", assignee: "Assigned to", priority: "Priority" }[value] || "None";
}

function renderBoardGroupControl() {
  els.boardGroupLabel.textContent = boardGroupLabel();
  els.boardGroupOptions.forEach(option => {
    const selected = option.dataset.boardGroup === state.boardGroupBy;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-selected", String(selected));
  });
}

function boardGroupValue(item) {
  if (state.boardGroupBy === "state") return item.state || "Unknown state";
  if (state.boardGroupBy === "assignee") return item.assignee || "Unassigned";
  if (state.boardGroupBy === "priority") return item.priority == null || item.priority === "" ? "No priority" : `Priority ${item.priority}`;
  return "";
}

function createBoardGroup(title, stories) {
  const section = document.createElement("section");
  section.className = "board-item-group";
  const header = document.createElement("header");
  const heading = document.createElement("h3");
  heading.textContent = title;
  const count = document.createElement("span");
  count.className = "count";
  count.textContent = String(stories.length);
  header.append(heading, count);
  const cards = document.createElement("div");
  cards.className = "board-group-cards";
  cards.replaceChildren(...stories.map(createCard));
  section.append(header, cards);
  return section;
}

function compareBoardGroups([left], [right]) {
  if (state.boardGroupBy === "assignee") {
    if (left === "Unassigned") return right === "Unassigned" ? 0 : 1;
    if (right === "Unassigned") return -1;
  }
  if (state.boardGroupBy === "priority") {
    if (left === "No priority") return right === "No priority" ? 0 : 1;
    if (right === "No priority") return -1;
    const leftPriority = Number(left.replace(/^Priority\s+/i, ""));
    const rightPriority = Number(right.replace(/^Priority\s+/i, ""));
    if (Number.isFinite(leftPriority) && Number.isFinite(rightPriority)) return leftPriority - rightPriority;
  }
  return left.localeCompare(right, "en", { numeric: true, sensitivity: "base" });
}

function renderBoardColumn(list, stories) {
  const grouped = state.boardGroupBy !== "none" && stories.length;
  list.classList.toggle("is-grouped", Boolean(grouped));
  if (!stories.length) {
    list.replaceChildren(emptyNode());
    return;
  }
  if (!grouped) {
    list.replaceChildren(...stories.map(createCard));
    return;
  }
  const groups = new Map();
  stories.forEach(story => {
    const value = boardGroupValue(story);
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(story);
  });
  const orderedGroups = [...groups].sort(compareBoardGroups);
  list.replaceChildren(...orderedGroups.map(([title, groupStories]) => createBoardGroup(title, groupStories)));
}

function render() {
  const team = state.teams.find(item => item.id === state.teamId);
  const filteredIterations = selectedSprintIterations();
  if (filteredIterations.length) {
    els.sprintTitle.textContent = filteredIterations.map(iteration => iteration.name).join(", ");
    els.sprintTitle.setAttribute("aria-label", `Filtered sprints: ${els.sprintTitle.textContent}. Click to choose another sprint.`);
    els.sprintBadge.textContent = "Filtered view";
    els.sprintBadge.dataset.sprintKind = "filtered-view";
    els.sprintMeta.textContent = `${team?.name || "Team"} · ${filteredIterations.length} ${filteredIterations.length === 1 ? "sprint" : "sprints"}`;
  } else if (state.iteration) {
    els.sprintTitle.textContent = state.iteration.name;
    els.sprintTitle.setAttribute("aria-label", `Sprint ${state.iteration.name}. Click to choose another sprint.`);
    const label = iterationLabel(state.iteration);
    els.sprintBadge.textContent = label;
    els.sprintBadge.dataset.sprintKind = label.toLowerCase().replace(/\s+/g, "-");
    const start = formatDate(state.iteration.attributes?.startDate);
    const end = formatDate(state.iteration.attributes?.finishDate);
    els.sprintMeta.textContent = `${team?.name || "Team"}${start && end ? ` · ${start} – ${end}` : ""}`;
  } else {
    els.sprintTitle.textContent = "No sprint";
    els.sprintBadge.textContent = "Current sprint";
    els.sprintBadge.dataset.sprintKind = "current-sprint";
    els.sprintMeta.textContent = team ? `Team ${team.name}` : "Azure DevOps is not connected";
  }

  const query = state.search.trim().toLowerCase();
  const visibleStories = state.stories.filter(item => matchesFilters(item, query));
  renderBoardGroupControl();
  renderFilters();
  for (const column of ["todo", "active", "done"]) {
    const list = document.querySelector(`[data-list="${column}"]`);
    const stories = visibleStories.filter(item => state.mapping[item.state] === column);
    document.querySelector(`[data-count="${column}"]`).textContent = stories.length;
    const mappedStates = [...state.knownStates].filter(itemState => state.mapping[itemState] === column);
    document.querySelector(`[data-states="${column}"]`).textContent = mappedStates.join(", ") || "No states configured";
    renderBoardColumn(list, stories);
  }
}

function selectedSprintIterations() {
  if (!state.filters.sprint.size) return [];
  return newestIterations().filter(iteration => state.filters.sprint.has(iteration.name));
}

function chronologicalIterations() {
  return [...state.iterations].sort((a, b) => {
    const aDate = new Date(a.attributes?.startDate || a.attributes?.finishDate || 0).getTime();
    const bDate = new Date(b.attributes?.startDate || b.attributes?.finishDate || 0).getTime();
    return aDate - bDate || a.name.localeCompare(b.name, "en", { numeric: true });
  });
}

function newestIterations() {
  return chronologicalIterations().reverse();
}

function iterationLabel(iteration) {
  if (iteration.id === state.currentIterationId) return "Current sprint";
  const ordered = chronologicalIterations();
  const currentIndex = ordered.findIndex(value => value.id === state.currentIterationId);
  if (currentIndex > 0 && ordered[currentIndex - 1]?.id === iteration.id) return "Previous sprint";
  if (currentIndex >= 0 && ordered[currentIndex + 1]?.id === iteration.id) return "Next sprint";
  const now = Date.now();
  const finish = new Date(iteration.attributes?.finishDate || 0).getTime();
  const start = new Date(iteration.attributes?.startDate || 0).getTime();
  if (finish && finish < now) return "Closed sprint";
  if (start && start > now) return "Future sprint";
  const iterationIndex = ordered.findIndex(value => value.id === iteration.id);
  return currentIndex >= 0 && iterationIndex < currentIndex ? "Closed sprint" : "Future sprint";
}

function toggleSprintMenu() {
  if (!els.sprintMenu.hidden) return closeSprintMenu();
  if (!state.iterations.length || state.loading) return;
  els.sprintMenu.hidden = false;
  els.sprintTitle.setAttribute("aria-expanded", "true");
  els.sprintMenuSearch.value = "";
  renderSprintMenuOptions();
  requestAnimationFrame(() => els.sprintMenuSearch.focus());
}

function closeSprintMenu() {
  els.sprintMenu.hidden = true;
  els.sprintTitle.setAttribute("aria-expanded", "false");
}

function renderSprintMenuOptions() {
  const query = els.sprintMenuSearch.value.trim().toLocaleLowerCase("en");
  const iterations = newestIterations().filter(iteration => !query
    || iteration.name.toLocaleLowerCase("en").includes(query)
    || String(iteration.path || "").toLocaleLowerCase("en").includes(query)
    || iterationLabel(iteration).toLocaleLowerCase("en").includes(query));
  if (!iterations.length) {
    const empty = document.createElement("div");
    empty.className = "sprint-menu-empty";
    empty.textContent = "No sprints found.";
    els.sprintMenuOptions.replaceChildren(empty);
    return;
  }
  els.sprintMenuOptions.replaceChildren(...iterations.map(iteration => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sprint-menu-option";
    button.setAttribute("role", "option");
    const selected = iteration.id === state.iteration?.id;
    button.setAttribute("aria-selected", String(selected));
    button.disabled = selected;
    const content = document.createElement("span");
    content.className = "sprint-menu-option-content";
    const name = document.createElement("strong");
    name.textContent = iteration.name;
    const dates = document.createElement("small");
    const start = formatDate(iteration.attributes?.startDate);
    const end = formatDate(iteration.attributes?.finishDate);
    dates.textContent = start && end ? `${start} – ${end}` : iteration.path || "";
    content.append(name, dates);
    const label = document.createElement("span");
    label.className = `sprint-menu-label ${iterationLabel(iteration).toLowerCase().replace(/\s+/g, "-")}`;
    label.textContent = iterationLabel(iteration);
    const check = document.createElement("span");
    check.className = "sprint-menu-check";
    check.textContent = selected ? "✓" : "";
    button.append(content, label, check);
    if (!selected) button.addEventListener("click", () => selectOverviewIteration(iteration));
    return button;
  }));
}

async function selectOverviewIteration(iteration) {
  const previous = state.iteration;
  const previousSprintFilter = new Set(state.filters.sprint);
  const team = state.teams.find(value => value.id === state.teamId);
  if (!team || iteration.id === previous?.id) return closeSprintMenu();
  closeSprintMenu();
  setLoading(true);
  clearNotice();
  state.filters.sprint.clear();
  state.iteration = iteration;
  try {
    await loadIterationStories(team, iteration);
    localStorage.setItem(STORAGE.iteration, iteration.id);
    state.routeSprint = sprintRouteValue(iteration);
    if (!state.routeApplying) writeAppRoute(currentAppRoute({ sprint: state.routeSprint, itemId: null }));
    render();
  } catch (error) {
    console.error(error);
    state.iteration = previous;
    state.filters.sprint = previousSprintFilter;
    render();
    showNotice(error.message || "The sprint could not be loaded.", "error", "Try again", () => selectOverviewIteration(iteration));
  } finally {
    setLoading(false);
  }
}

async function applySprintFilter() {
  const team = state.teams.find(value => value.id === state.teamId);
  if (!team) return;
  const iterations = selectedSprintIterations();
  if (!iterations.length) {
    if (state.iteration) await loadIterationStories(team, state.iteration);
    return;
  }
  const groups = await Promise.all(iterations.map(iteration => fetchIterationStories(team, iteration)));
  const uniqueStories = new Map();
  groups.flat().forEach(story => uniqueStories.set(story.id, story));
  applyBoardStories([...uniqueStories.values()]);
}

const APP_ROUTE_PATHS = {
  board: "sprint-board",
  backlog: "backlog",
  "for-you": "for-you",
  wiki: "wiki",
  releases: "releases",
  search: "search"
};

const APP_ROUTE_VIEWS = Object.fromEntries(Object.entries(APP_ROUTE_PATHS).map(([view, path]) => [path, view]));

function parseAppRoute(hash = window.location.hash) {
  const raw = String(hash || "").replace(/^#\/?/, "");
  const separator = raw.indexOf("?");
  const path = (separator >= 0 ? raw.slice(0, separator) : raw).replace(/^\/+|\/+$/g, "").toLocaleLowerCase("en");
  const params = new URLSearchParams(separator >= 0 ? raw.slice(separator + 1) : "");
  const view = APP_ROUTE_VIEWS[path] || "board";
  const itemId = Number(params.get("item"));
  return {
    view,
    query: params.get("q") || "",
    itemId: Number.isInteger(itemId) && itemId > 0 ? itemId : null,
    sprint: params.get("sprint") || "",
    wikiId: params.get("wiki") || "",
    wikiPath: params.get("path") || ""
  };
}

function sprintRouteValue(iteration = state.iteration) {
  if (!iteration) return "";
  const label = String(iteration.name || iteration.path || "");
  const number = label.match(/(?:^|\b)sprint\s*[-#]?\s*(\d+)\s*$/i)?.[1]
    || label.match(/(?:^|[^\d])(\d+)\s*$/)?.[1];
  return number || String(iteration.id || "");
}

function iterationForRoute(value) {
  const routeValue = String(value || "").toLocaleLowerCase("en");
  if (!routeValue) return null;
  return state.iterations.find(iteration => sprintRouteValue(iteration).toLocaleLowerCase("en") === routeValue
    || String(iteration.id || "").toLocaleLowerCase("en") === routeValue) || null;
}

function appQueryForView(view) {
  if (view === "board") return state.search;
  if (view === "backlog") return state.backlogSearch;
  if (view === "for-you") return state.forYouSearch;
  if (view === "wiki") return state.wikiQuery;
  if (view === "search") return state.globalSearchQuery;
  return "";
}

function currentAppRoute(overrides = {}) {
  const view = overrides.view || state.currentView || "board";
  return {
    view,
    query: overrides.query !== undefined ? overrides.query : appQueryForView(view),
    itemId: overrides.itemId !== undefined ? overrides.itemId : state.selectedItemId,
    sprint: overrides.sprint !== undefined ? overrides.sprint : (view === "board" ? sprintRouteValue() : ""),
    wikiId: overrides.wikiId !== undefined ? overrides.wikiId : (view === "wiki" ? state.wikiId : ""),
    wikiPath: overrides.wikiPath !== undefined
      ? overrides.wikiPath
      : (view === "wiki" ? state.wikiPage?.path || state.routeWikiPath : "")
  };
}

function appRouteHash(route) {
  const view = APP_ROUTE_PATHS[route.view] ? route.view : "board";
  const params = new URLSearchParams();
  if (view === "board" && route.sprint) params.set("sprint", route.sprint);
  if (route.query) params.set("q", route.query);
  if (view === "wiki" && route.wikiId) params.set("wiki", route.wikiId);
  if (view === "wiki" && route.wikiPath) params.set("path", route.wikiPath);
  if (Number(route.itemId) > 0) params.set("item", String(Number(route.itemId)));
  const query = params.toString();
  return `#/${APP_ROUTE_PATHS[view]}${query ? `?${query}` : ""}`;
}

function writeAppRoute(route, { replace = false } = {}) {
  const hash = appRouteHash(route);
  if (window.location.hash === hash) return;
  window.history[replace ? "replaceState" : "pushState"]({ jiraishRoute: true }, "", hash);
}

function primeAppRouteState(route) {
  state.currentView = route.view;
  if (route.view === "board") state.search = route.query;
  if (route.view === "board") state.routeSprint = route.sprint;
  if (route.view === "backlog") state.backlogSearch = route.query;
  if (route.view === "for-you") state.forYouSearch = route.query;
  if (route.view === "wiki") {
    state.wikiQuery = route.query;
    state.routeWikiPath = route.wikiPath;
    if (route.wikiId) state.wikiId = route.wikiId;
  }
  if (route.view === "search") state.globalSearchQuery = route.query;
  els.search.value = state.search;
  els.backlogSearch.value = state.backlogSearch;
  els.forYouSearch.value = state.forYouSearch;
  els.wikiSearch.value = state.wikiQuery;
  els.globalSearchInput.value = state.globalSearchQuery;
  els.globalSearchPageInput.value = state.globalSearchQuery;
}

function scheduleRouteQueryUpdate() {
  window.clearTimeout(state.routeQueryTimer);
  state.routeQueryTimer = window.setTimeout(() => {
    if (!state.routeApplying) writeAppRoute(currentAppRoute(), { replace: true });
  }, 250);
}

async function applyRouteSprint(route) {
  if (route.view !== "board" || !route.sprint || !state.iterations.length) return;
  const iteration = iterationForRoute(route.sprint);
  if (!iteration || iteration.id === state.iteration?.id) return;
  const team = state.teams.find(value => value.id === state.teamId);
  if (!team) return;
  state.filters.sprint.clear();
  state.iteration = iteration;
  state.routeSprint = sprintRouteValue(iteration);
  localStorage.setItem(STORAGE.iteration, iteration.id);
  await loadIterationStories(team, iteration);
}

async function applyAppRoute(route) {
  const routeToken = ++state.routeRequestToken;
  const itemChanges = Number(route.itemId || 0) !== Number(state.selectedItemId || 0);
  if (itemChanges && workItemHasUnsavedChanges() && !confirmDiscardChanges()) {
    writeAppRoute(currentAppRoute(), { replace: true });
    return;
  }
  state.routeApplying = true;
  try {
    if (els.workItemDialog.open && itemChanges) els.workItemDialog.close();
    primeAppRouteState(route);
    await applyRouteSprint(route);
    if (route.view === "search" && route.query) await runGlobalSearch(route.query);
    else await showMainView(route.view);
    if (routeToken !== state.routeRequestToken) return;
    if (route.itemId && (!els.workItemDialog.open || Number(state.selectedItemId) !== Number(route.itemId))) {
      const opened = await showLinkedWorkItem(route.itemId);
      if (!opened && routeToken === state.routeRequestToken) {
        writeAppRoute(currentAppRoute({ itemId: null }), { replace: true });
      }
    }
    if (routeToken === state.routeRequestToken) writeAppRoute(currentAppRoute(), { replace: true });
  } finally {
    if (routeToken === state.routeRequestToken) state.routeApplying = false;
  }
}

async function applyInitialAppRoute() {
  if (state.routeReady) return;
  state.routeReady = true;
  await applyAppRoute(parseAppRoute());
}

async function restoreRoutedViewAfterBoardLoad() {
  if (!state.routeReady) return applyInitialAppRoute();
  if (state.currentView === "wiki") return showMainView("wiki");
  if (state.currentView === "search" && state.globalSearchQuery) return runGlobalSearch(state.globalSearchQuery);
  if (state.currentView === "search") return showMainView("search");
}

async function showMainView(view) {
  if (!state.routeApplying) writeAppRoute(currentAppRoute({ view, itemId: null }));
  const enteringForYou = view === "for-you" && state.currentView !== "for-you";
  state.currentView = view;
  const showForYou = view === "for-you";
  const showBacklog = view === "backlog";
  const showBoard = view === "board";
  const showWiki = view === "wiki";
  const showReleases = view === "releases";
  const showSearch = view === "search";
  els.listViews.forEach(element => { element.hidden = showForYou || showWiki || showReleases || showSearch; });
  els.boardViews.forEach(element => { element.hidden = !showBoard; });
  els.backlogViews.forEach(element => { element.hidden = !showBacklog; });
  els.forYouViews.forEach(element => { element.hidden = !showForYou; });
  els.wikiViews.forEach(element => { element.hidden = !showWiki; });
  els.releasesViews.forEach(element => { element.hidden = !showReleases; });
  els.searchViews.forEach(element => { element.hidden = !showSearch; });
  els.forYouNav.classList.toggle("is-active", showForYou);
  els.sprintBoardNav.classList.toggle("is-active", showBoard);
  els.backlogNav.classList.toggle("is-active", showBacklog);
  els.wikiNav.classList.toggle("is-active", showWiki);
  els.releasesNav.classList.toggle("is-active", showReleases);
  els.forYouNav.toggleAttribute("aria-current", showForYou);
  els.sprintBoardNav.toggleAttribute("aria-current", showBoard);
  els.backlogNav.toggleAttribute("aria-current", showBacklog);
  els.wikiNav.toggleAttribute("aria-current", showWiki);
  els.releasesNav.toggleAttribute("aria-current", showReleases);
  if (!showForYou) closeForYouPersonMenu();
  if (showForYou) {
    if (enteringForYou) {
      state.forYouSelectedUser = null;
      state.forYouUserKey = "";
      state.forYouExpanded = { custom: false, github: false, work: false, mentions: false, activity: false, created: false, updated: false, completed: false };
    }
    await loadForYou();
    return;
  }
  if (showBacklog) {
    await loadBacklog();
    return;
  }
  if (showWiki) {
    await loadWiki();
    return;
  }
  if (showReleases) {
    await loadReleaseDebugPage();
    return;
  }
  if (showSearch) {
    renderGlobalSearch();
    return;
  }
  if (state.filters.sprint.size) {
    setLoading(true);
    try { await applySprintFilter(); }
    catch (error) { console.error(error); showNotice(error.message || "The sprints could not be loaded.", "error"); }
    finally { setLoading(false); }
  }
  render();
}

async function queryWorkItemIds(query, top = 100) {
  const result = await azure(`/_apis/wit/wiql?$top=${top}&api-version=7.1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });
  return (result.workItems || []).map(item => item.id).filter(Boolean);
}

function createGlobalSearchRow(item) {
  const row = document.createElement("tr");
  row.tabIndex = 0;
  row.setAttribute("role", "button");
  row.setAttribute("aria-label", `Open ${item.type} ${workItemKey(item.id)}: ${item.title}`);
  const type = document.createElement("td");
  const typeBadge = document.createElement("span");
  typeBadge.className = `backlog-type ${item.type.toLocaleLowerCase("en") === "bug" ? "is-bug" : ""}`;
  typeBadge.textContent = item.type;
  type.append(typeBadge);
  const key = document.createElement("td");
  key.className = "backlog-key";
  key.textContent = workItemKey(item.id);
  const summary = document.createElement("td");
  summary.className = "backlog-summary";
  summary.textContent = item.title;
  const itemState = document.createElement("td");
  const stateBadge = document.createElement("span");
  stateBadge.className = "card-state";
  stateBadge.dataset.stateTone = stateTone(item.state);
  stateBadge.textContent = item.state;
  itemState.append(stateBadge);
  const priority = document.createElement("td");
  priority.textContent = item.priority ?? "—";
  const assignee = document.createElement("td");
  assignee.textContent = item.assignee || "Unassigned";
  const updated = document.createElement("td");
  updated.textContent = formatDateTime(item.changedDate);
  row.append(type, key, summary, itemState, priority, assignee, updated);
  row.addEventListener("click", () => showWorkItem(item));
  row.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    showWorkItem(item);
  });
  return row;
}

function renderGlobalSearch() {
  const query = state.globalSearchQuery;
  const resultCount = state.globalSearchResults.length;
  if (els.globalSearchPageInput.value !== query) els.globalSearchPageInput.value = query;
  els.globalSearchMeta.textContent = state.globalSearchLoading
    ? `Searching for “${query}”…`
    : query ? `${resultCount} ${resultCount === 1 ? "result" : "results"} for “${query}”`
    : "Search Azure DevOps work items by title or ID.";
  els.globalSearchStatus.classList.toggle("is-error", Boolean(state.globalSearchError));
  els.globalSearchStatus.classList.toggle("is-loading", state.globalSearchLoading);
  els.globalSearchStatus.textContent = state.globalSearchLoading
    ? "Searching work items…"
    : state.globalSearchError || (query && !resultCount ? "No work items match this title or ID." : "");
  els.globalSearchPanel.hidden = state.globalSearchLoading || Boolean(state.globalSearchError) || !resultCount;
  els.globalSearchRows.replaceChildren(...state.globalSearchResults.map(createGlobalSearchRow));
  try {
    const { webBase } = activeAzureContext();
    const url = new URL(`${webBase}/_search`);
    url.searchParams.set("text", `${query}*`);
    url.searchParams.set("type", "workitem");
    els.globalSearchExternal.href = url.href;
    els.globalSearchActions.hidden = !query || state.globalSearchLoading;
  } catch {
    els.globalSearchExternal.href = "#";
    els.globalSearchActions.hidden = true;
  }
}

async function runGlobalSearch(rawQuery) {
  const query = String(rawQuery || "").trim();
  if (!query) {
    els.globalSearchInput.focus();
    return;
  }
  state.globalSearchQuery = query;
  state.globalSearchResults = [];
  state.globalSearchError = "";
  state.globalSearchLoading = true;
  els.globalSearchInput.value = query;
  await showMainView("search");
  const requestToken = ++state.globalSearchRequestToken;
  if (!state.pat) {
    state.globalSearchLoading = false;
    state.globalSearchError = "Connect Azure DevOps to search work items.";
    renderGlobalSearch();
    return;
  }
  try {
    const idMatch = query.match(/^(?:#|[a-z][a-z0-9_.]*-)?(\d+)$/i);
    const condition = idMatch
      ? `[System.Id] = ${Number(idMatch[1])}`
      : `[System.Title] CONTAINS '${wiqlText(query)}'`;
    const ids = await queryWorkItemIds(`
      SELECT [System.Id]
      FROM WorkItems
      WHERE [System.TeamProject] = @project
        AND ${condition}
      ORDER BY [System.ChangedDate] DESC
    `, 100);
    const results = await fetchWorkItems(ids);
    if (requestToken !== state.globalSearchRequestToken) return;
    const resultsById = new Map(results.map(item => [Number(item.id), item]));
    state.globalSearchResults = ids.map(id => resultsById.get(Number(id))).filter(Boolean)
      .sort((a, b) => new Date(b.changedDate) - new Date(a.changedDate));
  } catch (error) {
    if (requestToken !== state.globalSearchRequestToken) return;
    console.error(error);
    state.globalSearchError = error.message || "Work items could not be searched.";
  }
  state.globalSearchLoading = false;
  renderGlobalSearch();
}

function wiqlText(value) {
  return String(value || "").replace(/'/g, "''");
}

function isFinishedWorkItem(item) {
  if (state.mapping[item.state] === "done") return true;
  return /^(closed|done|completed|removed|resolved)$/i.test(item.state.trim());
}

async function mapWithConcurrency(values, limit, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      results[index] = await mapper(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker));
  return results;
}

function forYouTargetUser() {
  return state.forYouSelectedUser || state.authenticatedUser;
}

function forYouTargetKey(user = forYouTargetUser()) {
  return String(user?.id || user?.uniqueName || user?.displayName || "@me").toLocaleLowerCase("en");
}

function forYouIdentityQuery(user, isSelf) {
  if (isSelf) return "@Me";
  return `'${wiqlText(user?.uniqueName || user?.displayName)}'`;
}

function githubPullRequestsCacheKey() {
  if (!state.githubToken) return "";
  const owners = state.githubAllOwners ? "*" : state.githubOwners.map(owner => owner.toLocaleLowerCase("en")).sort().join(",");
  const repositories = state.githubAllRepos ? "*" : state.githubRepos.map(repo => repo.toLocaleLowerCase("en")).sort().join(",");
  return `${owners}|${repositories}`;
}

function normalizedForYouCustomConfig() {
  const config = state.forYouCustomConfig || {};
  const tags = Array.isArray(config.tags)
    ? [...new Set(config.tags.map(tag => String(tag || "").trim()).filter(Boolean))]
    : [];
  return {
    assignee: String(config.assignee || "anyone"),
    state: String(config.state || "all"),
    type: String(config.type || "all"),
    tags,
    tagMode: config.tagMode === "and" ? "and" : "or"
  };
}

function forYouCustomAssigneeChoices() {
  const choices = [
    { value: "anyone", label: "Anyone" },
    { value: "me", label: "Me" }
  ];
  const seen = new Set(choices.map(choice => choice.value));
  state.teamMembers.forEach(member => {
    const identity = member.uniqueName || member.name;
    if (!identity) return;
    const value = `user:${identity}`;
    if (seen.has(value)) return;
    seen.add(value);
    choices.push({ value, label: member.name || identity });
  });
  return choices;
}

function forYouCustomStateChoices() {
  return ["all", ...[...state.knownStates].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }))];
}

function forYouCustomTypeChoices() {
  const types = new Set(["Bug", "User Story", "Task", "Feature", "Epic"]);
  knownWorkItems().forEach(item => { if (item.type) types.add(item.type); });
  return ["all", ...[...types].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }))];
}

function availableForYouCustomTags() {
  const tags = new Set(state.forYouCustomTagChoices);
  knownWorkItems().forEach(item => (item.tags || []).forEach(tag => tags.add(tag)));
  normalizedForYouCustomConfig().tags.forEach(tag => tags.add(tag));
  return [...tags].filter(Boolean).sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

function forYouCustomTitle() {
  const config = normalizedForYouCustomConfig();
  const stateLabel = config.state === "all" ? "Any" : config.state;
  const typeLabel = config.type === "all" ? "issues" : ({
    Bug: "bugs", "User Story": "user stories", Task: "tasks", Feature: "features", Epic: "epics"
  }[config.type] || `${config.type.toLocaleLowerCase("en")} items`);
  const assigneeChoice = forYouCustomAssigneeChoices().find(choice => choice.value === config.assignee);
  const assigneeLabel = config.assignee === "anyone" ? "anyone"
    : config.assignee === "me" ? "me"
      : assigneeChoice?.label || config.assignee.replace(/^user:/, "");
  const tagJoiner = config.tagMode === "and" ? " and " : " or ";
  const tagLabel = config.tags.length
    ? config.tags.map(tag => `“${tag}”`).join(tagJoiner)
    : "anything";
  return `${stateLabel} ${typeLabel} by ${assigneeLabel} tagged with ${tagLabel}`;
}

async function loadForYouCustomTagChoices() {
  const result = await azure("/_apis/wit/tags?api-version=7.1");
  return [...new Set((result.value || []).map(tag => String(tag.name || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

async function loadForYouCustomItems() {
  const config = normalizedForYouCustomConfig();
  const conditions = ["[System.TeamProject] = @project"];
  if (config.assignee === "me") conditions.push("[System.AssignedTo] = @Me");
  else if (config.assignee.startsWith("user:")) conditions.push(`[System.AssignedTo] = '${wiqlText(config.assignee.slice(5))}'`);
  if (config.state !== "all") conditions.push(`[System.State] = '${wiqlText(config.state)}'`);
  if (config.type !== "all") conditions.push(`[System.WorkItemType] = '${wiqlText(config.type)}'`);
  if (config.tags.length) {
    const tagConditions = config.tags.map(tag => `[System.Tags] CONTAINS '${wiqlText(tag)}'`);
    conditions.push(`(${tagConditions.join(config.tagMode === "and" ? " AND " : " OR ")})`);
  }
  const ids = await queryWorkItemIds(`
    SELECT [System.Id]
    FROM WorkItems
    WHERE ${conditions.join("\n      AND ")}
    ORDER BY [System.ChangedDate] DESC
  `, 100);
  return fetchWorkItems(ids);
}

async function github(path) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${state.githubToken}`,
      "X-GitHub-Api-Version": "2026-03-10"
    }
  });
  let result = null;
  try { result = await response.json(); } catch {}
  if (!response.ok) {
    const message = response.status === 401
      ? "GitHub rejected the API key. Update it under Change connection."
      : result?.message || `GitHub request failed (${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return result;
}

async function githubPages(path) {
  const values = [];
  for (let page = 1; ; page++) {
    const separator = path.includes("?") ? "&" : "?";
    const result = await github(`${path}${separator}per_page=100&page=${page}`);
    if (!Array.isArray(result)) throw new Error("GitHub returned an unexpected response.");
    values.push(...result);
    if (result.length < 100) break;
  }
  return values;
}

async function githubIssueSearch(query) {
  const values = [];
  for (let page = 1; page <= 10; page++) {
    const result = await github(`/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=100&page=${page}`);
    if (!Array.isArray(result?.items)) throw new Error("GitHub returned an unexpected search response.");
    values.push(...result.items);
    if (result.items.length < 100 || values.length >= Math.min(Number(result.total_count) || 0, 1000)) break;
  }
  return values;
}

async function githubIssueSearchForRepositories(query, repositories) {
  const accessibleRepositories = await loadGithubAccessibleRepositories();
  const owners = new Map();
  repositories.forEach(repository => {
    const ownerLogin = String(repository || "").split("/")[0];
    if (!ownerLogin) return;
    const owner = githubOwnerDetails(ownerLogin, accessibleRepositories);
    owners.set(ownerLogin.toLocaleLowerCase("en"), owner);
  });
  const resultGroups = await mapWithConcurrency([...owners.values()], 3, owner => {
    const ownerQualifier = owner.type === "Organization" ? "org" : "user";
    return githubIssueSearch(`${query} ${ownerQualifier}:${owner.login}`);
  });
  const results = new Map();
  resultGroups.flat().forEach(pullRequest => {
    const key = `${pullRequest.repository_url}:${pullRequest.number}`;
    if (!results.has(key)) results.set(key, pullRequest);
  });
  return [...results.values()].sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
}

async function configuredGithubRepositories() {
  let repositories = state.githubRepos;
  if (state.githubAllRepos) {
    const accessible = await loadGithubAccessibleRepositories();
    const ownerLogins = state.githubAllOwners
      ? [...new Set(accessible.map(repository => repository.owner?.login).filter(Boolean))]
      : state.githubOwners;
    repositories = (await loadGithubRepositoriesForOwners(ownerLogins, accessible))
      .map(repository => repository.full_name);
  }
  const selectedOwners = new Set(state.githubOwners.map(owner => owner.toLocaleLowerCase("en")));
  return [...new Set(repositories.filter(repository => repository && (
    state.githubAllOwners || selectedOwners.has(String(repository).split("/")[0].toLocaleLowerCase("en"))
  )).map(repository => String(repository).toLocaleLowerCase("en")))];
}

function azureBuildIdFromGithubTarget(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const context = activeAzureContext();
    const hostname = url.hostname.toLocaleLowerCase("en");
    const segments = url.pathname.split("/").filter(Boolean).map(segment => decodeURIComponent(segment));
    let organization = "";
    let project = "";
    if (hostname === "dev.azure.com") {
      [organization = "", project = ""] = segments;
    } else if (hostname.endsWith(".visualstudio.com")) {
      organization = hostname.slice(0, -".visualstudio.com".length);
      [project = ""] = segments;
    } else return null;
    if (organization.toLocaleLowerCase("en") !== context.organization.toLocaleLowerCase("en")) return null;
    if (project && project.toLocaleLowerCase("en") !== context.project.toLocaleLowerCase("en")) return null;
    const buildId = Number(url.searchParams.get("buildId"));
    return Number.isInteger(buildId) && buildId > 0 ? buildId : null;
  } catch {
    return null;
  }
}

async function githubCommitAzureBuildIds(repository, sha) {
  const normalizedSha = String(sha || "").trim();
  if (!repository || !normalizedSha) return [];
  const cacheKey = `${repository.toLocaleLowerCase("en")}:${normalizedSha.toLocaleLowerCase("en")}`;
  if (state.githubCommitBuildIdsCache.has(cacheKey)) {
    return state.githubCommitBuildIdsCache.get(cacheKey);
  }
  const [owner, name] = repository.split("/");
  const commitPath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commits/${encodeURIComponent(normalizedSha)}`;
  const request = Promise.allSettled([
    github(`${commitPath}/status`),
    github(`${commitPath}/check-runs?per_page=100`)
  ]).then(results => {
    const urls = [];
    if (results[0].status === "fulfilled") {
      (results[0].value?.statuses || []).forEach(status => urls.push(status.target_url));
    }
    if (results[1].status === "fulfilled") {
      (results[1].value?.check_runs || []).forEach(checkRun => {
        urls.push(checkRun.details_url, checkRun.html_url);
      });
    }
    return [...new Set(urls.map(azureBuildIdFromGithubTarget).filter(Boolean))];
  }).catch(error => {
    state.githubCommitBuildIdsCache.delete(cacheKey);
    throw error;
  });
  state.githubCommitBuildIdsCache.set(cacheKey, request);
  return request;
}

function githubRepositoryFromRemoteUrl(value) {
  const text = String(value || "").trim();
  const apiMatch = text.match(/github\.com\/repos\/([^/]+)\/([^/?#]+)(?:[/?#]|$)/i);
  if (apiMatch) return `${decodeURIComponent(apiMatch[1])}/${decodeURIComponent(apiMatch[2]).replace(/\.git$/i, "")}`;
  const remoteMatch = text.match(/github\.com[/:]([^/\s:]+)\/([^/\s?#]+)(?:[/?#]|$)/i);
  return remoteMatch ? `${decodeURIComponent(remoteMatch[1])}/${decodeURIComponent(remoteMatch[2]).replace(/\.git$/i, "")}` : "";
}

function azureBuildRepositoryName(build) {
  const repository = build?.repository || {};
  const candidates = [
    githubRepositoryFromRemoteUrl(repository.url),
    githubRepositoryFromRemoteUrl(repository.remoteUrl),
    repository.fullName,
    repository.name,
    ...Object.values(repository.properties || {})
  ];
  return candidates.map(value => String(value || "").replace(/^github:/i, "").toLocaleLowerCase("en"))
    .find(value => value.includes("/")) || "";
}

function azureBuildMatchesGithubPullRequest(build, pullRequest) {
  const expectedRepository = pullRequest.repository.toLocaleLowerCase("en");
  const buildRepository = azureBuildRepositoryName(build);
  if (buildRepository && buildRepository !== expectedRepository) return false;
  const commitShas = new Set((pullRequest.commitShas || []).map(sha => sha.toLocaleLowerCase("en")));
  if (commitShas.has(String(build.sourceVersion || "").toLocaleLowerCase("en"))) return true;
  const sourceBranch = String(build.sourceBranch || "").toLocaleLowerCase("en");
  const pullNumber = Number(pullRequest.number);
  if (sourceBranch === `refs/pull/${pullNumber}/merge` || sourceBranch === `refs/pull/${pullNumber}/head`) return true;
  return Object.entries(build.triggerInfo || {}).some(([key, value]) =>
    /(?:pr|pull.?request).*number/i.test(key) && Number(value) === pullNumber);
}

async function azureBuildIdsForGithubPullRequest(pullRequest) {
  const cacheKey = [
    pullRequest.repository.toLocaleLowerCase("en"),
    pullRequest.number,
    ...(pullRequest.commitShas || []).map(sha => sha.toLocaleLowerCase("en"))
  ].join(":");
  if (state.azureGithubPullRequestBuildIdsCache.has(cacheKey)) {
    return state.azureGithubPullRequestBuildIdsCache.get(cacheKey);
  }
  const created = new Date(pullRequest.createdAt || pullRequest.updatedAt || 0).getTime();
  const completed = new Date(pullRequest.mergedAt || pullRequest.updatedAt || pullRequest.createdAt || 0).getTime();
  const startTime = new Date(Math.max(0, Math.min(created || completed, completed || created) - 6 * 60 * 60 * 1000));
  const endTime = new Date(Math.max(created, completed) + 24 * 60 * 60 * 1000);
  const timeQuery = Number.isFinite(startTime.getTime()) && Number.isFinite(endTime.getTime())
    ? `&minTime=${encodeURIComponent(startTime.toISOString())}&maxTime=${encodeURIComponent(endTime.toISOString())}`
    : "";
  const request = azure(`/_apis/build/builds?$top=1000&queryOrder=queueTimeDescending${timeQuery}&api-version=7.1`)
    .then(result => (result?.value || [])
      .filter(build => azureBuildMatchesGithubPullRequest(build, pullRequest))
      .map(build => Number(build.id))
      .filter(buildId => Number.isInteger(buildId) && buildId > 0))
    .then(buildIds => [...new Set(buildIds)])
    .catch(error => {
      state.azureGithubPullRequestBuildIdsCache.delete(cacheKey);
      throw error;
    });
  state.azureGithubPullRequestBuildIdsCache.set(cacheKey, request);
  return request;
}

function githubRepositoryFromApiUrl(value) {
  const match = String(value || "").match(/\/repos\/([^/]+\/[^/]+)$/i);
  return match ? decodeURIComponent(match[1]) : "";
}

async function loadGithubPullRequestsForWorkItem(item) {
  if (!state.githubToken) return [];
  const marker = `AB#${item.id}`;
  const exactMarker = new RegExp(`\\bAB#${item.id}\\b`, "i");
  const repositoryNames = await configuredGithubRepositories();
  const configuredRepositories = new Set(repositoryNames);
  const matches = (await githubIssueSearchForRepositories(`is:pr in:title "${marker}"`, repositoryNames))
    .filter(pullRequest => {
      const repository = githubRepositoryFromApiUrl(pullRequest.repository_url).toLocaleLowerCase("en");
      return configuredRepositories.has(repository) && exactMarker.test(pullRequest.title || "");
    });
  const details = await mapWithConcurrency(matches, 6, async pullRequest => {
    const repository = githubRepositoryFromApiUrl(pullRequest.repository_url);
    if (!repository) return null;
    const [owner, name] = repository.split("/");
    try {
      const detail = await github(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/pulls/${pullRequest.number}`);
      const commitShas = [...new Set([detail.head?.sha, detail.merge_commit_sha].filter(Boolean))];
      const buildIdGroups = await mapWithConcurrency(commitShas, 2, sha =>
        githubCommitAzureBuildIds(repository, sha));
      return {
        id: detail.id,
        repository: detail.base?.repo?.full_name || repository,
        number: detail.number,
        title: detail.title || pullRequest.title,
        url: detail.html_url || pullRequest.html_url,
        author: detail.user?.login || pullRequest.user?.login || "Unknown",
        createdAt: detail.created_at || pullRequest.created_at || "",
        updatedAt: detail.updated_at || pullRequest.updated_at || "",
        state: detail.state || pullRequest.state || "open",
        draft: Boolean(detail.draft),
        mergedAt: detail.merged_at || pullRequest.pull_request?.merged_at || "",
        headSha: detail.head?.sha || "",
        commitShas,
        azureBuildIds: [...new Set(buildIdGroups.flat())]
      };
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  });
  const pullRequests = details.filter(Boolean);
  await mapWithConcurrency(pullRequests, 4, async pullRequest => {
    try {
      const discoveredBuildIds = await azureBuildIdsForGithubPullRequest(pullRequest);
      pullRequest.azureBuildIds = [...new Set([
        ...(pullRequest.azureBuildIds || []),
        ...discoveredBuildIds
      ])];
    } catch (error) {
      console.warn(`Azure builds for GitHub pull request ${pullRequest.repository}#${pullRequest.number} could not be discovered.`, error);
    }
  });
  return pullRequests.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

async function loadGithubAccessibleRepositories() {
  if (state.githubAccessibleRepositoriesToken === state.githubToken) {
    return state.githubAccessibleRepositories;
  }
  const repositories = await githubPages("/user/repos?sort=full_name&direction=asc");
  const repositoriesByName = new Map();
  repositories.forEach(repository => {
    const key = String(repository.full_name || "").toLocaleLowerCase("en");
    if (key) repositoriesByName.set(key, repository);
  });
  state.githubAccessibleRepositories = [...repositoriesByName.values()]
    .sort((a, b) => String(a.full_name).localeCompare(String(b.full_name), "en", { sensitivity: "base", numeric: true }));
  state.githubAccessibleRepositoriesToken = state.githubToken;
  return state.githubAccessibleRepositories;
}

function githubOwnerDetails(login, repositories = state.githubAccessibleRepositories) {
  const normalized = String(login || "").toLocaleLowerCase("en");
  const configured = state.githubOwnerChoices.find(owner => owner.login.toLocaleLowerCase("en") === normalized);
  if (configured) return configured;
  const repository = repositories.find(candidate => String(candidate.owner?.login || "").toLocaleLowerCase("en") === normalized);
  return { login: repository?.owner?.login || login, type: repository?.owner?.type || "User" };
}

async function loadGithubRepositoriesForOwners(ownerLogins, accessibleRepositories = null) {
  const accessible = accessibleRepositories || await loadGithubAccessibleRepositories();
  const owners = [...new Set(ownerLogins.map(owner => String(owner || "").trim()).filter(Boolean))];
  const groups = await mapWithConcurrency(owners, 3, async ownerLogin => {
    const owner = githubOwnerDetails(ownerLogin, accessible);
    if (owner.type !== "Organization") {
      return accessible.filter(repository => String(repository.owner?.login || "").toLocaleLowerCase("en") === owner.login.toLocaleLowerCase("en"));
    }
    const cacheKey = owner.login.toLocaleLowerCase("en");
    if (!state.githubOwnerRepositoriesCache.has(cacheKey)) {
      const pending = githubPages(`/orgs/${encodeURIComponent(owner.login)}/repos?type=all&sort=full_name&direction=asc`)
        .then(repositories => [
          ...repositories,
          ...accessible.filter(repository => String(repository.owner?.login || "").toLocaleLowerCase("en") === cacheKey)
        ]);
      state.githubOwnerRepositoriesCache.set(cacheKey, pending);
      pending.catch(() => state.githubOwnerRepositoriesCache.delete(cacheKey));
    }
    return state.githubOwnerRepositoriesCache.get(cacheKey);
  });
  const repositories = new Map();
  groups.flat().forEach(repository => {
    const key = String(repository.full_name || "").toLocaleLowerCase("en");
    if (key && !repositories.has(key)) repositories.set(key, repository);
  });
  return [...repositories.values()]
    .sort((a, b) => String(a.full_name).localeCompare(String(b.full_name), "en", { sensitivity: "base", numeric: true }));
}

async function loadGithubPullRequests() {
  if (!state.githubToken) return [];
  const repositories = await configuredGithubRepositories();
  const pullRequestGroups = await mapWithConcurrency(repositories, 6, async repository => {
    const [owner, name, ...rest] = repository.split("/");
    if (!owner || !name || rest.length) throw new Error(`“${repository}” is not a valid owner/repository name.`);
    try {
      const pulls = await githubPages(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/pulls?state=open&sort=updated&direction=desc`);
      return pulls.map(pullRequest => ({ ...pullRequest, repository: `${owner}/${name}` }));
    } catch (error) {
      if (error.status !== 404) throw error;
      console.warn(`GitHub repository ${owner}/${name} is not accessible with the configured token.`);
      return [];
    }
  });
  return pullRequestGroups.flat()
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
}

async function loadForYou(force = false) {
  if (!state.projectName) {
    state.forYouProjectName = "";
    state.forYouCustomItems = [];
    state.forYouCustomTagChoices = [];
    state.forYouCustomError = "";
    state.forYouWorkItems = [];
    state.forYouMentions = [];
    state.forYouActivity = [];
    state.forYouCreated = [];
    state.forYouUpdated = [];
    state.forYouCompleted = [];
    state.forYouErrors = {};
    renderForYou();
    return;
  }
  const user = forYouTargetUser();
  const isSelf = !state.forYouSelectedUser;
  const userKey = forYouTargetKey(user);
  const githubKey = githubPullRequestsCacheKey();
  if (!force && state.forYouProjectName === state.projectName && state.forYouUserKey === userKey
      && (!state.githubToken || state.githubPullRequestsKey === githubKey)) {
    renderForYou();
    return;
  }

  const requestToken = ++state.forYouRequestToken;
  state.forYouErrors = {};
  renderForYouLoading();
  els.refresh.disabled = true;
  els.refresh.classList.add("is-spinning");
  const sections = await Promise.allSettled([
    loadForYouCustomItems(),
    loadForYouCustomTagChoices(),
    loadForYouWorkItems(user, isSelf),
    loadForYouMentions(user),
    loadForYouActivity(user, isSelf),
    loadForYouCreated(),
    loadForYouUpdated(),
    loadForYouCompleted(),
    state.githubToken ? loadGithubPullRequests() : Promise.resolve([])
  ]);
  if (requestToken !== state.forYouRequestToken) return;
  const [custom, customTags, work, mentions, activity, created, updated, completed, pullRequests] = sections;
  if (custom.status === "fulfilled") {
    state.forYouCustomItems = custom.value;
    state.forYouCustomError = "";
  } else {
    console.error(custom.reason);
    state.forYouCustomItems = [];
    state.forYouCustomError = custom.reason?.message || "The custom issue table could not be loaded.";
  }
  if (customTags.status === "fulfilled") state.forYouCustomTagChoices = customTags.value;
  else {
    console.warn("Azure DevOps tags could not be loaded; using tags from loaded work items instead.", customTags.reason);
    state.forYouCustomTagChoices = [];
  }
  if (work.status === "fulfilled") state.forYouWorkItems = work.value;
  else {
    console.error(work.reason);
    state.forYouWorkItems = [];
    state.forYouErrors.work = work.reason?.message || "Work in progress could not be loaded.";
  }
  if (mentions.status === "fulfilled") state.forYouMentions = mentions.value;
  else {
    console.error(mentions.reason);
    state.forYouMentions = [];
    state.forYouErrors.mentions = mentions.reason?.message || "Mentions could not be loaded.";
  }
  if (activity.status === "fulfilled") state.forYouActivity = activity.value;
  else {
    console.error(activity.reason);
    state.forYouActivity = [];
    state.forYouErrors.activity = activity.reason?.message || "Activity could not be loaded.";
  }
  if (created.status === "fulfilled") state.forYouCreated = created.value;
  else {
    console.error(created.reason);
    state.forYouCreated = [];
    state.forYouErrors.created = created.reason?.message || "Recently created work items could not be loaded.";
  }
  if (updated.status === "fulfilled") state.forYouUpdated = updated.value;
  else {
    console.error(updated.reason);
    state.forYouUpdated = [];
    state.forYouErrors.updated = updated.reason?.message || "Recently updated work items could not be loaded.";
  }
  if (completed.status === "fulfilled") state.forYouCompleted = completed.value;
  else {
    console.error(completed.reason);
    state.forYouCompleted = [];
    state.forYouErrors.completed = completed.reason?.message || "Recently completed work items could not be loaded.";
  }
  if (pullRequests.status === "fulfilled") {
    state.githubPullRequests = pullRequests.value;
    state.githubPullRequestsError = "";
  } else {
    console.error(pullRequests.reason);
    state.githubPullRequests = [];
    state.githubPullRequestsError = pullRequests.reason?.message || "GitHub pull requests could not be loaded.";
  }
  state.githubPullRequestsKey = githubKey;
  state.forYouProjectName = state.projectName;
  state.forYouUserKey = userKey;
  renderForYou();
  els.refresh.disabled = false;
  els.refresh.classList.remove("is-spinning");
}

async function loadForYouWorkItems(user, isSelf) {
  const identity = forYouIdentityQuery(user, isSelf);
  const ids = await queryWorkItemIds(`
    SELECT [System.Id]
    FROM WorkItems
    WHERE [System.TeamProject] = @project
      AND [System.AssignedTo] = ${identity}
    ORDER BY [System.ChangedDate] DESC
  `, 100);
  const items = await fetchWorkItems(ids);
  return items.filter(item => !isFinishedWorkItem(item))
    .sort((a, b) => new Date(b.changedDate) - new Date(a.changedDate));
}

async function loadForYouMentions(user) {
  if (!user?.displayName) throw new Error("The selected user could not be identified for mentions.");
  const recentIdsPromise = queryWorkItemIds(`
    SELECT [System.Id]
    FROM WorkItems
    WHERE [System.TeamProject] = @project
    ORDER BY [System.ChangedDate] DESC
  `, 100);
  const historyIdsPromise = queryWorkItemIds(`
    SELECT [System.Id]
    FROM WorkItems
    WHERE [System.TeamProject] = @project
      AND [System.History] CONTAINS WORDS '${wiqlText(user.displayName)}'
    ORDER BY [System.ChangedDate] DESC
  `, 50).catch(error => {
    console.warn("Azure's history index could not be used to supplement mention candidates.", error);
    return [];
  });
  const [recentIds, historyIds] = await Promise.all([recentIdsPromise, historyIdsPromise]);
  const ids = [...new Set([...recentIds, ...historyIds])];
  const items = await fetchWorkItems(ids, { includeDescription: true });
  const mentionGroups = await mapWithConcurrency(items, 6, async item => {
    const mentions = [];
    for (const [html, kind] of [
      [item.descriptionHtml, "Description"],
      [item.acceptanceCriteriaHtml, "Acceptance criteria"],
      [item.reproStepsHtml, "Repro steps"],
      [item.systemInfoHtml, "System info"]
    ]) {
      if (!htmlMentionsUser(html, user)) continue;
      mentions.push({
        item,
        mention: {
          author: item.changedBy || "Unknown user",
          authorId: item.changedById,
          authorUniqueName: item.changedByUniqueName,
          html,
          createdDate: item.changedDate,
          kind
        }
      });
    }
    try {
      const result = await azure(`/_apis/wit/workItems/${item.id}/comments?$top=100&order=desc&$expand=renderedText&api-version=7.1-preview.4`);
      const comments = normalizeComments(result);
      state.commentsCache.set(item.id, comments);
      mentions.push(...comments
        .filter(comment => commentMentionsUser(comment, user))
        .map(comment => ({ item, mention: { ...comment, kind: "Comment" } })));
    } catch (error) {
      console.warn(`Comments for work item ${item.id} could not be checked for mentions.`, error);
    }
    return mentions;
  });
  return mentionGroups.flat()
    .sort((a, b) => new Date(b.mention.createdDate) - new Date(a.mention.createdDate));
}

async function loadForYouActivity(user, isSelf) {
  if (!user) {
    const ids = await queryWorkItemIds(`
      SELECT [System.Id]
      FROM WorkItems
      WHERE [System.TeamProject] = @project
        AND [System.ChangedBy] = @Me
      ORDER BY [System.ChangedDate] DESC
    `, 20);
    const items = await fetchWorkItems(ids);
    return items.map(item => ({
      item,
      entry: {
        id: `latest-${item.id}`,
        revision: "",
        author: item.changedBy || "You",
        date: item.changedDate,
        created: false,
        changes: []
      }
    })).sort((a, b) => new Date(b.entry.date) - new Date(a.entry.date));
  }
  const identity = forYouIdentityQuery(user, isSelf);
  let ids;
  try {
    ids = await queryWorkItemIds(`
      SELECT [System.Id]
      FROM WorkItems
      WHERE [System.TeamProject] = @project
        AND [System.ChangedBy] EVER ${identity}
      ORDER BY [System.ChangedDate] DESC
    `, 25);
  } catch (error) {
    console.warn("The historical Changed By query was not supported; using the latest changes instead.", error);
    ids = await queryWorkItemIds(`
      SELECT [System.Id]
      FROM WorkItems
      WHERE [System.TeamProject] = @project
        AND [System.ChangedBy] = ${identity}
      ORDER BY [System.ChangedDate] DESC
    `, 25);
  }
  const items = await fetchWorkItems(ids);
  const activityGroups = await mapWithConcurrency(items, 5, async item => {
    const result = await azure(`/_apis/wit/workItems/${item.id}/updates?api-version=7.1`);
    const history = normalizeHistory(result);
    state.historyCache.set(item.id, history);
    return (result.value || []).filter(update => identityMatches(update.revisedBy, user))
      .map(update => ({ item, entry: normalizeHistoryUpdate(update) }));
  });
  return activityGroups.flat()
    .sort((a, b) => new Date(b.entry.date) - new Date(a.entry.date))
    .slice(0, 20);
}

async function loadForYouCreated() {
  const ids = await queryWorkItemIds(`
    SELECT [System.Id]
    FROM WorkItems
    WHERE [System.TeamProject] = @project
    ORDER BY [System.CreatedDate] DESC
  `, 20);
  const items = await fetchWorkItems(ids);
  return items.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate)).slice(0, 20);
}

async function loadForYouUpdated() {
  const ids = await queryWorkItemIds(`
    SELECT [System.Id]
    FROM WorkItems
    WHERE [System.TeamProject] = @project
    ORDER BY [System.ChangedDate] DESC
  `, 20);
  const items = await fetchWorkItems(ids);
  return items.sort((a, b) => new Date(b.changedDate) - new Date(a.changedDate)).slice(0, 20);
}

async function loadForYouCompleted() {
  const doneStates = Object.entries(state.mapping)
    .filter(([, column]) => column === "done")
    .map(([itemState]) => itemState);
  if (!doneStates.length) return [];
  const stateList = doneStates.map(itemState => `'${wiqlText(itemState)}'`).join(", ");
  const ids = await queryWorkItemIds(`
    SELECT [System.Id]
    FROM WorkItems
    WHERE [System.TeamProject] = @project
      AND [System.State] IN (${stateList})
    ORDER BY [System.ChangedDate] DESC
  `, 20);
  const items = await fetchWorkItems(ids);
  return items.filter(item => state.mapping[item.state] === "done")
    .sort((a, b) => new Date(b.changedDate) - new Date(a.changedDate))
    .slice(0, 20);
}

function identityMatches(identity, user) {
  if (!identity || !user) return false;
  const normalized = value => String(value || "").trim().toLocaleLowerCase("en");
  if (identity.id && user.id && normalized(identity.id) === normalized(user.id)) return true;
  const identityNames = [identity.uniqueName, identity.displayName].map(normalized).filter(Boolean);
  const userNames = [user.uniqueName, user.displayName].map(normalized).filter(Boolean);
  return identityNames.some(name => userNames.includes(name));
}

function commentMentionsUser(comment, user) {
  return htmlMentionsUser(comment.html, user);
}

function htmlMentionsUser(html, user) {
  const source = String(html || "");
  const sourceKey = source.toLocaleLowerCase("en");
  const textKey = htmlToText(source).toLocaleLowerCase("en");
  const idKeys = [user.id, user.uniqueName].map(value => String(value || "").toLocaleLowerCase("en")).filter(Boolean);
  if (sourceKey.includes("data-vss-mention") && idKeys.some(value => sourceKey.includes(value))) return true;
  const displayName = String(user.displayName || "").trim().toLocaleLowerCase("en");
  return Boolean(displayName && (textKey.includes(`@${displayName}`)
    || (sourceKey.includes("data-vss-mention") && sourceKey.includes(displayName))));
}

function forYouUserChoices() {
  const choices = [];
  choices.push(state.authenticatedUser
    ? { ...state.authenticatedUser, isSelf: true }
    : { id: "", displayName: "You", uniqueName: "", isSelf: true });
  const members = state.teamMembers.length
    ? state.teamMembers
    : [...state.stories, ...state.backlogItems].filter(item => item.assignee).map(item => ({
      id: "",
      name: item.assignee,
      uniqueName: item.assigneeUniqueName || item.assignee
    }));
  members.forEach(member => choices.push({
    id: member.id,
    displayName: member.name,
    uniqueName: member.uniqueName,
    isSelf: identityMatches(member, state.authenticatedUser)
  }));
  const unique = new Map();
  choices.forEach(choice => {
    const key = forYouTargetKey(choice);
    if (!unique.has(key) || choice.isSelf) unique.set(key, choice);
  });
  return [...unique.values()].sort((a, b) => {
    if (a.isSelf !== b.isSelf) return a.isSelf ? -1 : 1;
    return a.displayName.localeCompare(b.displayName, "en", { sensitivity: "base" });
  });
}

function renderForYouIdentity() {
  const team = state.teams.find(value => value.id === state.teamId);
  const user = forYouTargetUser();
  const isSelf = !state.forYouSelectedUser;
  const displayName = user?.displayName || "You";
  els.forYouTitle.textContent = isSelf ? "For you" : `For ${displayName}`;
  els.forYouPersonName.textContent = displayName;
  els.forYouPerson.setAttribute("aria-label", `Choose a team member. Currently ${displayName}.`);
  els.forYouTeamName.textContent = team?.name || state.projectName || "Team";
  els.forYouWorkDescription.textContent = isSelf
    ? "Open work items assigned to you."
    : `Open work items assigned to ${displayName}.`;
  els.forYouMentionsDescription.textContent = isSelf
    ? "Recent mentions of you in comments and descriptions."
    : `Recent mentions of ${displayName} in comments and descriptions.`;
  els.forYouActivityDescription.textContent = isSelf
    ? "Your latest changes across work items."
    : `${displayName}'s latest changes across work items.`;
}

function renderForYouPersonOptions() {
  const query = els.forYouPersonSearch.value.trim().toLocaleLowerCase("en");
  const selected = forYouTargetUser();
  const choices = forYouUserChoices().filter(choice => !query
    || choice.displayName.toLocaleLowerCase("en").includes(query)
    || choice.uniqueName.toLocaleLowerCase("en").includes(query));
  if (!choices.length) {
    const empty = document.createElement("div");
    empty.className = "for-you-person-empty";
    empty.textContent = "No team members found.";
    els.forYouPersonOptions.replaceChildren(empty);
    return;
  }
  els.forYouPersonOptions.replaceChildren(...choices.map(choice => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "for-you-person-option";
    option.setAttribute("role", "option");
    const selectedChoice = choice.isSelf
      ? !state.forYouSelectedUser
      : Boolean(state.forYouSelectedUser && identityMatches(choice, selected));
    option.setAttribute("aria-selected", String(selectedChoice));
    option.disabled = selectedChoice;
    const avatar = document.createElement("span");
    avatar.className = "for-you-person-avatar";
    avatar.textContent = initialsFor(choice.displayName);
    const label = document.createElement("span");
    label.className = "for-you-person-label";
    const name = document.createElement("strong");
    name.textContent = choice.displayName;
    const detail = document.createElement("small");
    detail.textContent = choice.isSelf ? "You" : choice.uniqueName;
    label.append(name, detail);
    const check = document.createElement("span");
    check.className = "for-you-person-check";
    check.textContent = selectedChoice ? "✓" : "";
    option.append(avatar, label, check);
    option.addEventListener("click", () => selectForYouUser(choice));
    return option;
  }));
}

function toggleForYouPersonMenu(force) {
  const open = force ?? els.forYouPersonMenu.hidden;
  els.forYouPersonMenu.hidden = !open;
  els.forYouPerson.setAttribute("aria-expanded", String(open));
  if (!open) {
    els.forYouPersonSearch.value = "";
    return;
  }
  renderForYouPersonOptions();
  requestAnimationFrame(() => els.forYouPersonSearch.focus());
}

function closeForYouPersonMenu() {
  toggleForYouPersonMenu(false);
}

async function selectForYouUser(choice) {
  state.forYouSelectedUser = choice.isSelf ? null : {
    id: choice.id || "",
    displayName: choice.displayName,
    uniqueName: choice.uniqueName || choice.displayName
  };
  state.forYouUserKey = "";
  state.forYouExpanded = { custom: false, github: false, work: false, mentions: false, activity: false, created: false, updated: false, completed: false };
  closeForYouPersonMenu();
  renderForYouIdentity();
  await loadForYou(true);
}

function replaceSelectOptions(select, choices, selectedValue) {
  const normalizedChoices = choices.map(choice => typeof choice === "string"
    ? { value: choice, label: choice === "all" ? "All" : choice }
    : choice);
  if (!normalizedChoices.some(choice => choice.value === selectedValue)) {
    normalizedChoices.push({ value: selectedValue, label: selectedValue.replace(/^user:/, "") });
  }
  select.replaceChildren(...normalizedChoices.map(choice => {
    const option = document.createElement("option");
    option.value = choice.value;
    option.textContent = choice.label;
    option.selected = choice.value === selectedValue;
    return option;
  }));
}

function renderForYouCustomControls() {
  const config = normalizedForYouCustomConfig();
  const tagsOpen = els.forYouCustomTags.open;
  replaceSelectOptions(els.forYouCustomAssignee, forYouCustomAssigneeChoices(), config.assignee);
  replaceSelectOptions(els.forYouCustomState, forYouCustomStateChoices(), config.state);
  replaceSelectOptions(els.forYouCustomType, forYouCustomTypeChoices(), config.type);
  els.forYouCustomTagMode.value = config.tagMode;
  els.forYouCustomTagsSummary.textContent = !config.tags.length
    ? "Anything"
    : config.tags.length === 1 ? config.tags[0] : `${config.tags.length} tags selected`;
  const tagOptions = availableForYouCustomTags().map(tag => {
    const label = document.createElement("label");
    label.className = "for-you-custom-tag-option";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = tag;
    checkbox.checked = config.tags.includes(tag);
    const name = document.createElement("span");
    name.textContent = tag;
    label.append(checkbox, name);
    return label;
  });
  if (tagOptions.length) els.forYouCustomTagOptions.replaceChildren(...tagOptions);
  else {
    const empty = document.createElement("p");
    empty.className = "for-you-custom-tags-empty";
    empty.textContent = "No project tags found.";
    els.forYouCustomTagOptions.replaceChildren(empty);
  }
  els.forYouCustomTags.open = tagsOpen;
  els.forYouCustomTitle.textContent = forYouCustomTitle();
}

function createForYouCustomRow(item) {
  const row = document.createElement("tr");
  row.tabIndex = 0;
  row.setAttribute("role", "button");
  row.setAttribute("aria-label", `Open ${item.type} ${workItemKey(item.id)}: ${item.title}`);
  const type = document.createElement("td");
  const typeBadge = document.createElement("span");
  typeBadge.className = `backlog-type ${item.type.toLocaleLowerCase("en") === "bug" ? "is-bug" : ""}`;
  typeBadge.textContent = item.type;
  type.append(typeBadge);
  const key = document.createElement("td");
  key.className = "backlog-key";
  key.textContent = workItemKey(item.id);
  const summary = document.createElement("td");
  summary.className = "backlog-summary";
  summary.textContent = item.title;
  const itemState = document.createElement("td");
  const stateBadge = document.createElement("span");
  stateBadge.className = "card-state";
  stateBadge.dataset.stateTone = stateTone(item.state);
  stateBadge.textContent = item.state;
  itemState.append(stateBadge);
  const assignee = document.createElement("td");
  assignee.textContent = item.assignee || "Unassigned";
  const updated = document.createElement("td");
  updated.textContent = formatDateTime(item.changedDate);
  row.append(type, key, summary, itemState, assignee, updated);
  row.addEventListener("click", () => showWorkItem(item));
  row.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    showWorkItem(item);
  });
  return row;
}

function renderForYouCustomTable() {
  renderForYouCustomControls();
  const error = state.forYouCustomError;
  const expanded = state.forYouExpanded.custom;
  const query = state.forYouSearch.trim().toLocaleLowerCase("en");
  const matchingItems = state.forYouCustomItems.filter(item => matchesWorkItemQuery(item, query));
  const visibleItems = expanded ? matchingItems : matchingItems.slice(0, 5);
  els.forYouCustomCount.textContent = String(matchingItems.length);
  els.forYouCustomStatus.classList.toggle("is-error", Boolean(error));
  els.forYouCustomStatus.textContent = error || (!matchingItems.length
    ? query && state.forYouCustomItems.length ? "No work items match this title or ID." : "No work items match these filters."
    : "");
  els.forYouCustomRows.replaceChildren(...visibleItems.map(createForYouCustomRow));
  els.forYouCustomShowAll.hidden = matchingItems.length <= 5;
  els.forYouCustomShowAll.textContent = expanded ? "Show less" : "Show all";
  els.forYouCustomShowAll.setAttribute("aria-expanded", String(expanded));
}

async function refreshForYouCustomTable() {
  const requestToken = ++state.forYouCustomRequestToken;
  state.forYouCustomConfig = {
    assignee: els.forYouCustomAssignee.value,
    state: els.forYouCustomState.value,
    type: els.forYouCustomType.value,
    tags: [...els.forYouCustomTagOptions.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.value),
    tagMode: els.forYouCustomTagMode.value
  };
  state.forYouExpanded.custom = false;
  localStorage.setItem(STORAGE.forYouCustom, JSON.stringify(state.forYouCustomConfig));
  renderForYouCustomControls();
  els.forYouCustomCount.textContent = "—";
  els.forYouCustomStatus.textContent = "Loading matching work items…";
  els.forYouCustomStatus.classList.remove("is-error");
  els.forYouCustomRows.replaceChildren();
  els.forYouCustomShowAll.hidden = true;
  try {
    const items = await loadForYouCustomItems();
    if (requestToken !== state.forYouCustomRequestToken) return;
    state.forYouCustomItems = items;
    state.forYouCustomError = "";
  } catch (error) {
    if (requestToken !== state.forYouCustomRequestToken) return;
    console.error(error);
    state.forYouCustomItems = [];
    state.forYouCustomError = error.message || "The custom issue table could not be loaded.";
  }
  renderForYouCustomTable();
}

function renderForYouLoading() {
  renderForYouIdentity();
  renderForYouCustomControls();
  els.forYouCustomCount.textContent = "—";
  els.forYouCustomStatus.textContent = "Loading matching work items…";
  els.forYouCustomStatus.classList.remove("is-error");
  els.forYouCustomRows.replaceChildren();
  els.forYouCustomShowAll.hidden = true;
  els.githubPrPanel.hidden = !state.githubToken;
  if (state.githubToken) {
    els.githubPrCount.textContent = "—";
    els.githubPrStatus.textContent = "Loading GitHub pull requests…";
    els.githubPrStatus.classList.remove("is-error");
    els.githubPrTableWrap.hidden = true;
    els.githubPrRows.replaceChildren();
    els.githubPrShowAll.hidden = true;
  }
  for (const [count, status, list, showAll] of [
    [els.forYouWorkCount, els.forYouWorkStatus, els.forYouWorkList, els.forYouWorkShowAll],
    [els.forYouMentionsCount, els.forYouMentionsStatus, els.forYouMentionsList, els.forYouMentionsShowAll],
    [els.forYouActivityCount, els.forYouActivityStatus, els.forYouActivityList, els.forYouActivityShowAll],
    [els.forYouCreatedCount, els.forYouCreatedStatus, els.forYouCreatedList, els.forYouCreatedShowAll],
    [els.forYouUpdatedCount, els.forYouUpdatedStatus, els.forYouUpdatedList, els.forYouUpdatedShowAll],
    [els.forYouCompletedCount, els.forYouCompletedStatus, els.forYouCompletedList, els.forYouCompletedShowAll]
  ]) {
    count.textContent = "—";
    status.textContent = "";
    status.classList.remove("is-error");
    showAll.hidden = true;
    list.replaceChildren(...Array.from({ length: 3 }, () => {
      const skeleton = document.createElement("div");
      skeleton.className = "for-you-skeleton";
      return skeleton;
    }));
  }
}

function renderForYou() {
  const user = forYouTargetUser();
  const isSelf = !state.forYouSelectedUser;
  const displayName = user?.displayName || "the selected user";
  renderForYouIdentity();
  renderForYouCustomTable();
  renderGithubPullRequests();
  renderForYouSection("work", state.forYouWorkItems, createForYouWorkItem,
    isSelf ? "No open work items are assigned to you." : `No open work items are assigned to ${displayName}.`);
  renderForYouSection("mentions", state.forYouMentions, createForYouMention,
    isSelf ? "No recent mentions need a reply." : `No recent mentions of ${displayName} were found.`);
  renderForYouSection("activity", state.forYouActivity, createForYouActivity,
    isSelf ? "No recent activity was found." : `No recent activity by ${displayName} was found.`);
  renderForYouSection("created", state.forYouCreated, item => createForYouProjectActivity(item, "Created"),
    "No recently created work items were found.");
  renderForYouSection("updated", state.forYouUpdated, item => createForYouProjectActivity(item, "Updated"),
    "No recently updated work items were found.");
  renderForYouSection("completed", state.forYouCompleted, item => createForYouProjectActivity(item, "Completed"),
    "No recently completed work items were found.");
}

function normalizedGithubPullRequestFilters() {
  const config = state.githubPullRequestFilters && typeof state.githubPullRequestFilters === "object"
    ? state.githubPullRequestFilters
    : {};
  return {
    repositories: [...new Set((Array.isArray(config.repositories) ? config.repositories : []).map(String).filter(Boolean))],
    authors: [...new Set((Array.isArray(config.authors) ? config.authors : []).map(String).filter(Boolean))]
  };
}

function githubPullRequestFilterChoices(property, selected) {
  const values = property === "repository"
    ? state.githubPullRequests.map(pullRequest => pullRequest.repository)
    : state.githubPullRequests.map(pullRequest => pullRequest.user?.login);
  return [...new Set([...values, ...selected].filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base", numeric: true }));
}

function renderGithubPullRequestFilterOptions(container, choices, selected, emptyMessage) {
  const options = choices.map(choice => {
    const label = document.createElement("label");
    label.className = "for-you-custom-tag-option";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = choice;
    checkbox.checked = selected.includes(choice);
    const name = document.createElement("span");
    name.textContent = choice;
    label.append(checkbox, name);
    return label;
  });
  if (options.length) container.replaceChildren(...options);
  else {
    const empty = document.createElement("p");
    empty.className = "for-you-custom-tags-empty";
    empty.textContent = emptyMessage;
    container.replaceChildren(empty);
  }
}

function githubPullRequestFilterSummary(values, singular, emptyLabel = "Anything") {
  if (!values.length) return emptyLabel;
  if (values.length === 1) return values[0];
  return `${values.length} ${singular}s selected`;
}

function githubPullRequestTitle() {
  const filters = normalizedGithubPullRequestFilters();
  const repositories = filters.repositories.length
    ? filters.repositories.join(" or ")
    : "everything";
  const authors = filters.authors.length
    ? filters.authors.join(" or ")
    : "anyone";
  return `Open GitHub pull requests for ${repositories} by ${authors}`;
}

function renderGithubPullRequestFilters() {
  const config = normalizedGithubPullRequestFilters();
  state.githubPullRequestFilters = config;
  const repositoriesOpen = els.githubPrRepositories.open;
  const authorsOpen = els.githubPrAuthors.open;
  els.githubPrTitle.textContent = githubPullRequestTitle();
  els.githubPrRepositoriesSummary.textContent = githubPullRequestFilterSummary(config.repositories, "repository");
  els.githubPrAuthorsSummary.textContent = githubPullRequestFilterSummary(config.authors, "author", "Anyone");
  renderGithubPullRequestFilterOptions(
    els.githubPrRepositoryOptions,
    githubPullRequestFilterChoices("repository", config.repositories),
    config.repositories,
    "No repositories found."
  );
  renderGithubPullRequestFilterOptions(
    els.githubPrAuthorOptions,
    githubPullRequestFilterChoices("author", config.authors),
    config.authors,
    "No authors found."
  );
  els.githubPrRepositories.open = repositoriesOpen;
  els.githubPrAuthors.open = authorsOpen;
}

function updateGithubPullRequestFilters() {
  state.githubPullRequestFilters = {
    repositories: [...els.githubPrRepositoryOptions.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.value),
    authors: [...els.githubPrAuthorOptions.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.value)
  };
  state.forYouExpanded.github = false;
  localStorage.setItem(STORAGE.githubPrFilters, JSON.stringify(state.githubPullRequestFilters));
  renderGithubPullRequests();
}

function renderGithubPullRequests() {
  els.githubPrPanel.hidden = !state.githubToken;
  if (!state.githubToken) {
    els.githubPrRows.replaceChildren();
    els.githubPrShowAll.hidden = true;
    return;
  }
  renderGithubPullRequestFilters();
  const error = state.githubPullRequestsError;
  const filters = normalizedGithubPullRequestFilters();
  const matchingPullRequests = state.githubPullRequests.filter(pullRequest => (
    (!filters.repositories.length || filters.repositories.includes(pullRequest.repository))
    && (!filters.authors.length || filters.authors.includes(pullRequest.user?.login || ""))
  ));
  const expanded = state.forYouExpanded.github;
  const visiblePullRequests = expanded ? matchingPullRequests : matchingPullRequests.slice(0, 5);
  els.githubPrCount.textContent = String(matchingPullRequests.length);
  els.githubPrStatus.classList.toggle("is-error", Boolean(error));
  els.githubPrStatus.textContent = error || (!matchingPullRequests.length
    ? state.githubPullRequests.length ? "No open pull requests match these filters." : "No matching open pull requests were found."
    : "");
  els.githubPrTableWrap.hidden = Boolean(error) || !matchingPullRequests.length;
  els.githubPrRows.replaceChildren(...visiblePullRequests.map(pullRequest => {
    const row = document.createElement("tr");
    const repository = document.createElement("td");
    repository.textContent = pullRequest.repository;
    const titleCell = document.createElement("td");
    const link = document.createElement("a");
    link.href = pullRequest.html_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = `#${pullRequest.number} ${pullRequest.title}`;
    const role = document.createElement("span");
    role.className = "github-pr-role";
    role.textContent = pullRequest.draft ? "Draft" : "Open";
    titleCell.append(link, role);
    const author = document.createElement("td");
    author.textContent = pullRequest.user?.login || "Unknown";
    const updated = document.createElement("td");
    updated.textContent = formatDateTime(pullRequest.updated_at);
    row.append(repository, titleCell, author, updated);
    return row;
  }));
  els.githubPrShowAll.hidden = Boolean(error) || matchingPullRequests.length <= 5;
  els.githubPrShowAll.textContent = expanded ? "Show less" : "Show all";
  els.githubPrShowAll.setAttribute("aria-expanded", String(expanded));
}

function renderForYouSection(kind, items, renderer, emptyMessage) {
  const title = kind[0].toUpperCase() + kind.slice(1);
  const count = els[`forYou${title}Count`];
  const status = els[`forYou${title}Status`];
  const list = els[`forYou${title}List`];
  const showAll = els[`forYou${title}ShowAll`];
  const error = state.forYouErrors[kind] || "";
  const expanded = state.forYouExpanded[kind];
  const query = state.forYouSearch.trim().toLocaleLowerCase("en");
  const matchingItems = items.filter(entry => matchesWorkItemQuery(
    kind === "mentions" || kind === "activity" ? entry.item : entry,
    query
  ));
  const visibleItems = expanded ? matchingItems : matchingItems.slice(0, 5);
  count.textContent = String(matchingItems.length);
  status.classList.toggle("is-error", Boolean(error));
  status.textContent = error || (!matchingItems.length
    ? query && items.length ? "No work items match this title or ID." : emptyMessage
    : "");
  list.replaceChildren(...visibleItems.map(renderer));
  showAll.hidden = matchingItems.length <= 5;
  showAll.textContent = expanded ? "Show less" : "Show all";
  showAll.setAttribute("aria-expanded", String(expanded));
  showAll.setAttribute("aria-controls", list.id);
}

function toggleForYouSection(kind) {
  state.forYouExpanded[kind] = !state.forYouExpanded[kind];
  renderForYou();
  if (!state.forYouExpanded[kind]) {
    const title = kind[0].toUpperCase() + kind.slice(1);
    els[`forYou${title}ShowAll`].scrollIntoView({ block: "nearest" });
  }
}

function forYouLeadingIcon(item) {
  const icon = document.createElement("span");
  icon.className = `for-you-type-icon ${item.type.toLocaleLowerCase("en") === "bug" ? "is-bug" : ""}`;
  icon.textContent = item.type.toLocaleLowerCase("en") === "bug" ? "!" : "◆";
  return icon;
}

function createForYouItem(item, leading, ariaLabel) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "for-you-item";
  button.setAttribute("aria-label", ariaLabel);
  const body = document.createElement("span");
  body.className = "for-you-item-body";
  const title = document.createElement("span");
  title.className = "for-you-item-title";
  title.textContent = item.title;
  body.append(title);
  button.append(leading, body);
  button.addEventListener("click", () => showWorkItem(item));
  return { button, body };
}

function createForYouWorkItem(item) {
  const { button, body } = createForYouItem(item, forYouLeadingIcon(item), `${item.type} ${workItemKey(item.id)}: ${item.title}`);
  const meta = document.createElement("span");
  meta.className = "for-you-item-meta";
  meta.textContent = `${workItemKey(item.id)} · ${item.iterationName}`;
  body.append(meta);
  const itemState = document.createElement("span");
  itemState.className = "card-state";
  itemState.dataset.stateTone = stateTone(item.state);
  itemState.textContent = item.state;
  button.append(itemState);
  return button;
}

function createForYouMention(mention) {
  const avatar = document.createElement("span");
  avatar.className = "for-you-avatar";
  avatar.textContent = initialsFor(mention.mention.author);
  const { button, body } = createForYouItem(mention.item, avatar, `Mention by ${mention.mention.author} on ${workItemKey(mention.item.id)}: ${mention.item.title}`);
  const excerpt = document.createElement("span");
  excerpt.className = "for-you-item-excerpt";
  excerpt.textContent = htmlToText(mention.mention.html) || `Mentioned you in the ${mention.mention.kind.toLocaleLowerCase("en")}.`;
  const meta = document.createElement("span");
  meta.className = "for-you-item-meta";
  meta.textContent = `${mention.mention.author} · ${mention.mention.kind} · ${workItemKey(mention.item.id)} · ${formatDateTime(mention.mention.createdDate)}`;
  body.append(excerpt, meta);
  return button;
}

function createForYouActivity(activity) {
  const symbol = document.createElement("span");
  symbol.className = "for-you-activity-symbol";
  symbol.textContent = "↺";
  const { button, body } = createForYouItem(activity.item, symbol, `Your activity on ${workItemKey(activity.item.id)}: ${activity.item.title}`);
  const excerpt = document.createElement("span");
  excerpt.className = "for-you-item-excerpt";
  excerpt.textContent = activitySummary(activity.entry);
  const meta = document.createElement("span");
  meta.className = "for-you-item-meta";
  meta.textContent = `${workItemKey(activity.item.id)} · ${formatDateTime(activity.entry.date)}`;
  body.append(excerpt, meta);
  return button;
}

function createForYouProjectActivity(item, action) {
  const symbol = document.createElement("span");
  symbol.className = `for-you-activity-symbol is-${action.toLocaleLowerCase("en")}`;
  symbol.textContent = action === "Created" ? "+" : action === "Completed" ? "✓" : "↻";
  const actor = action === "Created" ? item.createdBy : item.changedBy;
  const date = action === "Created" ? item.createdDate : item.changedDate;
  const { button, body } = createForYouItem(item, symbol, `${action} work item ${workItemKey(item.id)}: ${item.title}`);
  const meta = document.createElement("span");
  meta.className = "for-you-item-meta";
  meta.textContent = `${actor || "Unknown user"} · ${workItemKey(item.id)} · ${formatDateTime(date)}`;
  body.append(meta);
  const itemState = document.createElement("span");
  itemState.className = "card-state";
  itemState.dataset.stateTone = stateTone(item.state);
  itemState.textContent = item.state;
  button.append(itemState);
  return button;
}

function activitySummary(entry) {
  if (entry.created) return "Created this work item.";
  const fields = [...new Set(entry.changes.map(change => change.label))];
  if (!fields.length) return "Updated this work item.";
  return `Updated ${fields.slice(0, 3).join(", ")}${fields.length > 3 ? ` and ${fields.length - 3} more` : ""}.`;
}

async function loadBacklog(force = false) {
  const team = state.teams.find(value => value.id === state.teamId);
  if (!team) {
    els.backlogMeta.textContent = "Connect Azure DevOps to load the backlog.";
    els.backlogContent.replaceChildren();
    return;
  }
  if (!force && state.backlogTeamId === team.id) return renderBacklog();
  els.backlogMeta.textContent = `${team.name} · Loading backlog…`;
  renderBacklogLoading();
  els.refresh.disabled = true;
  els.refresh.classList.add("is-spinning");
  try {
    const teamSegment = encodeURIComponent(team.name);
    const levels = await azure(`/${teamSegment}/_apis/work/backlogs?api-version=7.1`);
    const backlog = (levels.value || []).find(level => level.type === "requirement" && !level.isHidden)
      || (levels.value || []).find(level => /requirement/i.test(level.id || ""))
      || (levels.value || []).find(level => !level.isHidden && level.type !== "task");
    if (!backlog) throw new Error("No requirement backlog was found for this team.");
    const portfolioBacklogs = (levels.value || []).filter(level => String(level.type).toLocaleLowerCase("en") === "portfolio");
    const [result, ...portfolioResults] = await Promise.all([
      azure(`/${teamSegment}/_apis/work/backlogs/${encodeURIComponent(backlog.id)}/workItems?api-version=7.1`),
      ...portfolioBacklogs.map(level => azure(`/${teamSegment}/_apis/work/backlogs/${encodeURIComponent(level.id)}/workItems?api-version=7.1`))
    ]);
    const ids = (result.workItems || []).map(link => link.target?.id).filter(Boolean);
    const itemsById = new Map();
    for (let index = 0; index < ids.length; index += 200) {
      const chunk = ids.slice(index, index + 200);
      const fields = [
        "System.Id", "System.Title", "System.State", "System.WorkItemType", "System.AssignedTo",
        "System.IterationPath", "System.AreaPath", "System.Tags", "System.Parent",
        "Microsoft.VSTS.Common.Priority", "Microsoft.VSTS.Scheduling.StoryPoints", "Microsoft.VSTS.Scheduling.Effort"
      ].join(",");
      const batch = await azure(`/_apis/wit/workitems?ids=${chunk.join(",")}&fields=${encodeURIComponent(fields)}&errorPolicy=Omit&api-version=7.1`);
      (batch.value || []).forEach(workItem => itemsById.set(workItem.id, normalizeWorkItem(workItem)));
    }
    state.backlogItems = ids.map(id => itemsById.get(id)).filter(Boolean);
    const backlogIds = new Set(state.backlogItems.map(item => Number(item.id)));
    state.backlogSelectedIds = new Set([...state.backlogSelectedIds].filter(itemId => backlogIds.has(itemId)));
    if (!backlogIds.has(Number(state.backlogSelectionAnchorId))) state.backlogSelectionAnchorId = null;
    const portfolioIds = [...new Set(portfolioResults.flatMap(value => (value.workItems || []).map(link => link.target?.id).filter(Boolean)))];
    const portfolioItems = await fetchWorkItems(portfolioIds);
    const portfolioItemsById = new Map(portfolioItems.map(item => [Number(item.id), item]));
    const orderedPortfolioItems = portfolioIds.map(id => portfolioItemsById.get(Number(id))).filter(Boolean);
    state.backlogEpics = orderedPortfolioItems.filter(item => item.type.trim().toLocaleLowerCase("en") === "epic");
    state.backlogFeatures = orderedPortfolioItems.filter(item => item.type.trim().toLocaleLowerCase("en") === "feature");
    await loadParentDetails([...state.backlogItems, ...orderedPortfolioItems]);
    pruneFilters(state.backlogItems);
    state.backlogTeamId = team.id;
    renderBacklog();
  } catch (error) {
    console.error(error);
    els.backlogMeta.textContent = `${team.name} · The backlog could not be loaded`;
    const message = document.createElement("div");
    message.className = "backlog-error";
    message.textContent = error.message || "The backlog could not be loaded.";
    els.backlogContent.replaceChildren(message);
    els.backlogSidebarStatus.textContent = "Epic and feature hierarchy could not be loaded.";
    els.backlogSidebarStatus.classList.add("is-error");
    els.backlogHierarchy.replaceChildren();
  } finally {
    els.refresh.disabled = false;
    els.refresh.classList.remove("is-spinning");
  }
}

function renderBacklogLoading() {
  els.backlogSidebarStatus.textContent = "Loading epics and features…";
  els.backlogSidebarStatus.classList.remove("is-error");
  els.backlogHierarchy.replaceChildren(...Array.from({ length: 3 }, () => {
    const skeleton = document.createElement("div");
    skeleton.className = "backlog-sidebar-skeleton";
    return skeleton;
  }));
  els.backlogContent.replaceChildren(...Array.from({ length: 3 }, () => {
    const section = document.createElement("div");
    section.className = "backlog-skeleton";
    return section;
  }));
}

function backlogFeatureLabel(feature) {
  return `${feature.title} (#${feature.id})`;
}

function backlogFeatureMetrics(feature) {
  const issues = state.backlogItems.filter(item => {
    if (Number(item.parentId) !== Number(feature.id)) return false;
    const type = item.type.trim().toLocaleLowerCase("en");
    return type === "bug" || type === "story" || type === "user story" || type === "product backlog item";
  });
  const completed = issues.filter(isFinishedWorkItem).length;
  return {
    issues: issues.length,
    completed,
    unestimated: issues.filter(item => item.points === null || item.points === undefined).length,
    estimate: issues.reduce((total, item) => total + (Number(item.points) || 0), 0),
    progress: issues.length ? Math.round((completed / issues.length) * 100) : 0
  };
}

function backlogStoryType() {
  const preferredTypes = ["User Story", "Product Backlog Item", "Story", "Issue"];
  const availableTypes = new Map(state.backlogItems.map(item => [item.type.trim().toLocaleLowerCase("en"), item.type.trim()]));
  for (const preferred of preferredTypes) {
    const available = availableTypes.get(preferred.toLocaleLowerCase("en"));
    if (available) return available;
  }
  return "User Story";
}

function formatEstimate(value) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(value);
}

function selectBacklogFeature(feature) {
  const label = backlogFeatureLabel(feature);
  const alreadySelected = state.filters.feature.size === 1 && state.filters.feature.has(label);
  state.filters.feature.clear();
  if (!alreadySelected) state.filters.feature.add(label);
  if (mobileLayoutQuery.matches) setMobileDisclosure(els.backlogHierarchyToggle, els.backlogSidebar, false);
  renderBacklog();
}

function createBacklogCardMenu(item, type) {
  const menu = document.createElement("details");
  menu.className = "backlog-card-menu";
  const trigger = document.createElement("summary");
  trigger.setAttribute("aria-label", `More actions for ${item.title}`);
  trigger.textContent = "⋮";
  const options = document.createElement("div");
  options.className = "backlog-card-menu-options";
  const view = document.createElement("button");
  view.type = "button";
  view.textContent = `View ${type}`;
  view.addEventListener("click", event => {
    event.stopPropagation();
    menu.open = false;
    showWorkItem(item);
  });
  options.append(view);
  menu.append(trigger, options);
  return menu;
}

function createBacklogFeatureCard(feature) {
  const metrics = backlogFeatureMetrics(feature);
  const label = backlogFeatureLabel(feature);
  const selected = state.filters.feature.has(label);
  const collapsed = state.backlogCollapsedFeatures.has(Number(feature.id));
  const card = document.createElement("article");
  card.className = `backlog-feature${selected ? " is-active" : ""}${collapsed ? " is-collapsed" : ""}`;

  const heading = document.createElement("div");
  heading.className = "backlog-feature-heading";
  const headerButton = document.createElement("button");
  headerButton.type = "button";
  headerButton.className = "backlog-feature-toggle";
  headerButton.setAttribute("aria-expanded", String(!collapsed));
  headerButton.setAttribute("aria-label", `${collapsed ? "Expand" : "Collapse"} feature ${feature.title}`);
  const title = document.createElement("span");
  title.className = "backlog-feature-title";
  title.textContent = feature.title;
  const chevron = document.createElement("span");
  chevron.className = "backlog-chevron";
  chevron.textContent = collapsed ? "⌄" : "⌃";
  headerButton.append(title, chevron);
  headerButton.addEventListener("click", () => {
    if (collapsed) state.backlogCollapsedFeatures.delete(Number(feature.id));
    else state.backlogCollapsedFeatures.add(Number(feature.id));
    renderBacklogSidebar();
  });
  const menu = createBacklogCardMenu(feature, "feature");
  heading.append(headerButton, menu);

  const body = document.createElement("div");
  body.className = "backlog-feature-body";
  body.hidden = collapsed;
  const reference = document.createElement("div");
  reference.className = "backlog-feature-reference";
  const key = document.createElement("span");
  key.textContent = workItemKey(feature.id);
  reference.append(key);
  const stats = document.createElement("div");
  stats.className = "backlog-feature-stats";
  for (const [name, value] of [
    ["Issues", metrics.issues],
    ["Completed", metrics.completed],
    ["Unestimated", metrics.unestimated],
    ["Estimate", formatEstimate(metrics.estimate)]
  ]) {
    const stat = document.createElement("div");
    stat.className = "backlog-feature-stat";
    const statLabel = document.createElement("small");
    statLabel.textContent = name;
    const statValue = document.createElement("b");
    statValue.textContent = String(value);
    stat.append(statLabel, statValue);
    stats.append(stat);
  }
  const progress = document.createElement("div");
  progress.className = "backlog-feature-progress";
  progress.setAttribute("role", "progressbar");
  progress.setAttribute("aria-label", `${metrics.completed} of ${metrics.issues} stories and bugs completed`);
  progress.setAttribute("aria-valuemin", "0");
  progress.setAttribute("aria-valuemax", "100");
  progress.setAttribute("aria-valuenow", String(metrics.progress));
  const progressValue = document.createElement("span");
  progressValue.style.width = `${metrics.progress}%`;
  progress.append(progressValue);
  const createStory = document.createElement("button");
  createStory.type = "button";
  createStory.className = "backlog-create-story";
  createStory.textContent = "Create story in feature";
  createStory.addEventListener("click", event => {
    event.stopPropagation();
    openCreateWorkItemDialog(backlogStoryType(), feature);
  });
  body.append(reference, stats, createStory, progress);
  card.append(heading, body);
  card.addEventListener("click", event => {
    if (event.target.closest("button, summary, details")) return;
    selectBacklogFeature(feature);
  });
  return card;
}

function createBacklogEpicGroup(epic, features) {
  const epicKey = epic ? String(epic.id) : "without-epic";
  const collapsed = state.backlogCollapsedEpics.has(epicKey);
  const group = document.createElement("section");
  group.className = `backlog-epic${collapsed ? " is-collapsed" : ""}`;
  const header = document.createElement("div");
  header.className = "backlog-epic-heading";
  const headerButton = document.createElement("button");
  headerButton.type = "button";
  headerButton.className = "backlog-epic-toggle";
  headerButton.setAttribute("aria-expanded", String(!collapsed));
  headerButton.setAttribute("aria-label", `${collapsed ? "Expand" : "Collapse"} epic ${epic?.title || "Features without epic"}`);
  const chevron = document.createElement("span");
  chevron.className = "backlog-chevron";
  chevron.textContent = collapsed ? "⌄" : "⌃";
  const icon = document.createElement("span");
  icon.className = "backlog-epic-icon";
  icon.textContent = "⚡";
  const label = document.createElement("span");
  const title = document.createElement("strong");
  title.textContent = epic?.title || "Features without epic";
  label.append(title);
  if (epic) {
    const key = document.createElement("small");
    key.textContent = workItemKey(epic.id);
    label.append(key);
  }
  const count = document.createElement("span");
  count.className = "count";
  count.textContent = String(features.length);
  headerButton.append(icon, label, count, chevron);
  headerButton.addEventListener("click", () => {
    if (collapsed) state.backlogCollapsedEpics.delete(epicKey);
    else state.backlogCollapsedEpics.add(epicKey);
    renderBacklogSidebar();
  });
  header.append(headerButton);
  if (epic) header.append(createBacklogCardMenu(epic, "epic"));
  const featureList = document.createElement("div");
  featureList.className = "backlog-epic-features";
  featureList.hidden = collapsed;
  if (features.length) featureList.replaceChildren(...features.map(createBacklogFeatureCard));
  else {
    const empty = document.createElement("p");
    empty.className = "backlog-epic-empty";
    empty.textContent = "No features.";
    featureList.append(empty);
  }
  group.append(header, featureList);
  return group;
}

function renderBacklogSidebar() {
  els.backlogSidebarStatus.classList.remove("is-error");
  els.backlogShowAllFeatures.classList.toggle("is-active", !state.filters.feature.size);
  els.backlogShowAllFeatures.setAttribute("aria-pressed", String(!state.filters.feature.size));
  if (!state.backlogEpics.length && !state.backlogFeatures.length) {
    els.backlogSidebarStatus.textContent = "No epics or features were found for this team.";
    els.backlogHierarchy.replaceChildren();
    return;
  }
  els.backlogSidebarStatus.textContent = "";
  const featuresByEpic = new Map();
  state.backlogFeatures.forEach(feature => {
    const parentId = Number(feature.parentId) || 0;
    if (!featuresByEpic.has(parentId)) featuresByEpic.set(parentId, []);
    featuresByEpic.get(parentId).push(feature);
  });
  const epicIds = new Set(state.backlogEpics.map(epic => Number(epic.id)));
  const groups = state.backlogEpics.map(epic => createBacklogEpicGroup(epic, featuresByEpic.get(Number(epic.id)) || []));
  const ungrouped = state.backlogFeatures.filter(feature => !epicIds.has(Number(feature.parentId)));
  if (ungrouped.length) groups.push(createBacklogEpicGroup(null, ungrouped));
  els.backlogHierarchy.replaceChildren(...groups);
}

function renderBacklog() {
  const team = state.teams.find(value => value.id === state.teamId);
  const query = state.backlogSearch.trim().toLocaleLowerCase("en");
  const visibleItems = state.backlogItems.filter(item => matchesFilters(item, query));
  els.backlogMeta.textContent = `${team?.name || "Team"} · ${visibleItems.length}${visibleItems.length !== state.backlogItems.length ? ` of ${state.backlogItems.length}` : ""} items`;
  renderBacklogSidebar();
  renderFilters();
  const assignedIds = new Set();
  const sections = [];
  chronologicalIterations().forEach(iteration => {
    const path = String(iteration.path || "").toLocaleLowerCase("en");
    const items = visibleItems.filter(item => path && item.iterationPath.toLocaleLowerCase("en") === path);
    if (!items.length) return;
    items.forEach(item => assignedIds.add(item.id));
    sections.push(createBacklogSection(iteration.name, items, iterationLabel(iteration)));
  });
  const remaining = visibleItems.filter(item => !assignedIds.has(item.id));
  sections.push(createBacklogSection("Other", remaining, "Backlog"));
  els.backlogContent.replaceChildren(...sections);
}

function createBacklogSection(title, items, label) {
  const section = document.createElement("section");
  section.className = "backlog-group";
  const header = document.createElement("header");
  const heading = document.createElement("h2");
  heading.textContent = title;
  const badge = document.createElement("span");
  badge.className = "backlog-group-label";
  badge.textContent = label;
  const count = document.createElement("span");
  count.className = "count";
  count.textContent = String(items.length);
  header.append(heading, badge, count);
  const wrapper = document.createElement("div");
  wrapper.className = "backlog-table-wrap";
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "backlog-empty";
    empty.textContent = "No items.";
    wrapper.append(empty);
  } else {
    const table = document.createElement("table");
    table.className = "backlog-table";
    table.innerHTML = "<thead><tr><th>Type</th><th>Key</th><th>Summary</th><th>State</th><th>Priority</th><th>Points</th><th>Assigned to</th><th><span class=\"sr-only\">Actions</span></th></tr></thead>";
    const body = document.createElement("tbody");
    items.forEach(item => body.append(createBacklogRow(item)));
    table.append(body);
    wrapper.append(table);
  }
  section.append(header, wrapper);
  return section;
}

function createBacklogRow(item) {
  const selected = state.backlogSelectedIds.has(Number(item.id));
  const row = document.createElement("tr");
  row.tabIndex = 0;
  row.dataset.workItemId = String(item.id);
  row.dataset.baseLabel = `${item.type} ${workItemKey(item.id)}: ${item.title}`;
  row.classList.toggle("is-selected", selected);
  row.setAttribute("aria-selected", String(selected));
  row.setAttribute("aria-label", `${selected ? "Selected " : ""}${row.dataset.baseLabel}`);
  const type = document.createElement("td");
  const typeBadge = document.createElement("span");
  typeBadge.className = `backlog-type ${item.type.toLowerCase() === "bug" ? "is-bug" : ""}`;
  typeBadge.textContent = item.type;
  type.append(typeBadge);
  const key = document.createElement("td");
  key.className = "backlog-key";
  key.textContent = workItemKey(item.id);
  const summary = document.createElement("td");
  summary.className = "backlog-summary";
  const title = document.createElement("button");
  title.type = "button";
  title.className = "backlog-summary-button";
  title.textContent = item.title;
  title.setAttribute("aria-label", `Open ${workItemKey(item.id)}: ${item.title}`);
  title.addEventListener("click", event => {
    event.stopPropagation();
    showWorkItem(item);
  });
  summary.append(title);
  const itemState = document.createElement("td");
  const stateBadge = document.createElement("span");
  stateBadge.className = "card-state";
  stateBadge.dataset.stateTone = stateTone(item.state);
  stateBadge.textContent = item.state;
  itemState.append(stateBadge);
  const priority = document.createElement("td");
  priority.textContent = item.priority ?? "—";
  const points = document.createElement("td");
  points.textContent = item.points ?? "—";
  const assignee = document.createElement("td");
  assignee.textContent = item.assignee || "Unassigned";
  const actions = document.createElement("td");
  actions.className = "backlog-row-actions";
  const menu = document.createElement("details");
  menu.className = "backlog-row-menu";
  const trigger = document.createElement("summary");
  trigger.textContent = "⋮";
  trigger.setAttribute("aria-label", `More actions for ${workItemKey(item.id)}`);
  const options = document.createElement("div");
  options.className = "backlog-row-menu-options";
  options.setAttribute("role", "menu");
  const assignMenu = createBacklogRowSubmenu(
    "Assign to",
    () => [
      { label: "Unassigned", selected: !item.assignee, value: null },
      ...assigneeChoices(item).map(choice => ({
        label: choice.name,
        detail: choice.uniqueName !== choice.name ? choice.uniqueName : "",
        selected: choice.uniqueName === item.assigneeUniqueName || choice.name === item.assignee,
        value: choice
      }))
    ],
    choice => updateBacklogItemField(item, "System.AssignedTo", choice?.uniqueName || "", `Assigning ${workItemKey(item.id)}…`, "Assignee")
  );
  const sprintMenu = createBacklogRowSubmenu(
    "Move to sprint",
    () => newestIterations().map(iteration => ({
      label: iteration.name,
      detail: iterationLabel(iteration),
      selected: String(iteration.path || iteration.name).toLocaleLowerCase("en") === String(item.iterationPath).toLocaleLowerCase("en"),
      value: iteration
    })),
    iteration => updateBacklogItemField(item, "System.IterationPath", iteration.path || iteration.name, `Moving ${workItemKey(item.id)}…`, "Sprint")
  );
  const moveToPosition = document.createElement("button");
  moveToPosition.type = "button";
  moveToPosition.className = "backlog-row-position";
  moveToPosition.setAttribute("role", "menuitem");
  moveToPosition.textContent = "Move to position";
  moveToPosition.disabled = state.backlogUpdating || state.backlogDeleting;
  moveToPosition.addEventListener("click", event => {
    event.stopPropagation();
    closeBacklogRowMenus();
    showBacklogPositionDialog(item);
  });
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "backlog-row-delete";
  remove.setAttribute("role", "menuitem");
  remove.textContent = "Delete";
  remove.disabled = state.backlogDeleting || state.backlogUpdating;
  remove.addEventListener("click", event => {
    event.stopPropagation();
    menu.open = false;
    deleteBacklogItems(item);
  });
  options.append(assignMenu, sprintMenu, moveToPosition, remove);
  menu.append(trigger, options);
  actions.append(menu);
  row.append(type, key, summary, itemState, priority, points, assignee, actions);
  row.addEventListener("click", event => {
    if (event.target.closest("button, summary, details, a")) return;
    selectBacklogRow(item, event);
  });
  row.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.target !== row) return;
    event.preventDefault();
    selectBacklogRow(item, event);
  });
  return row;
}

function createBacklogRowSubmenu(label, getChoices, onSelect) {
  const container = document.createElement("div");
  container.className = "backlog-row-submenu-container";
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "backlog-row-submenu-trigger";
  trigger.setAttribute("role", "menuitem");
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-expanded", "false");
  const text = document.createElement("span");
  text.textContent = label;
  const arrow = document.createElement("span");
  arrow.className = "backlog-row-submenu-arrow";
  arrow.textContent = "‹";
  trigger.append(text, arrow);
  const pane = document.createElement("div");
  pane.className = "backlog-row-submenu";
  pane.setAttribute("role", "menu");
  pane.setAttribute("aria-label", label);
  let rendered = false;
  const renderChoices = () => {
    if (rendered) return;
    rendered = true;
    const choices = getChoices();
    if (!choices.length) {
      const empty = document.createElement("div");
      empty.className = "backlog-row-submenu-empty";
      empty.textContent = label === "Assign to" ? "No people available" : "No sprints available";
      pane.append(empty);
      return;
    }
    choices.forEach(choice => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "backlog-row-submenu-option";
      button.setAttribute("role", "menuitemradio");
      button.setAttribute("aria-checked", String(Boolean(choice.selected)));
      button.disabled = Boolean(choice.selected) || state.backlogUpdating;
      const content = document.createElement("span");
      content.className = "backlog-row-submenu-option-text";
      const primary = document.createElement("span");
      primary.textContent = choice.label;
      content.append(primary);
      if (choice.detail) {
        const secondary = document.createElement("small");
        secondary.textContent = choice.detail;
        content.append(secondary);
      }
      const check = document.createElement("span");
      check.className = "backlog-row-submenu-check";
      check.textContent = choice.selected ? "✓" : "";
      button.append(content, check);
      if (!choice.selected) button.addEventListener("click", event => {
        event.stopPropagation();
        closeBacklogRowMenus();
        onSelect(choice.value);
      });
      pane.append(button);
    });
  };
  const setOpen = open => {
    if (open) renderChoices();
    container.classList.toggle("is-open", open);
    trigger.setAttribute("aria-expanded", String(open));
  };
  trigger.addEventListener("click", event => {
    event.stopPropagation();
    const open = !container.classList.contains("is-open");
    container.parentElement?.querySelectorAll(".backlog-row-submenu-container.is-open").forEach(other => {
      if (other === container) return;
      other.classList.remove("is-open");
      other.querySelector(".backlog-row-submenu-trigger")?.setAttribute("aria-expanded", "false");
    });
    setOpen(open);
  });
  container.addEventListener("mouseenter", () => setOpen(true));
  container.addEventListener("mouseleave", () => {
    if (!container.contains(document.activeElement)) setOpen(false);
  });
  container.addEventListener("focusout", event => {
    if (!container.contains(event.relatedTarget)) setOpen(false);
  });
  container.append(trigger, pane);
  return container;
}

function closeBacklogRowMenus() {
  document.querySelectorAll(".backlog-row-menu[open]").forEach(menu => { menu.open = false; });
  document.querySelectorAll(".backlog-row-submenu-container.is-open").forEach(menu => {
    menu.classList.remove("is-open");
    menu.querySelector(".backlog-row-submenu-trigger")?.setAttribute("aria-expanded", "false");
  });
}

function syncBacklogWorkItem(itemId, result) {
  const normalized = normalizeWorkItem(result);
  const collections = [state.backlogItems, state.stories, state.backlogEpics, state.backlogFeatures];
  collections.forEach(collection => collection.forEach(candidate => {
    if (Number(candidate.id) !== Number(itemId)) return;
    candidate.assignee = normalized.assignee;
    candidate.assigneeUniqueName = normalized.assigneeUniqueName;
    candidate.assigneeId = normalized.assigneeId;
    candidate.iterationPath = normalized.iterationPath;
    candidate.iterationName = normalized.iterationName;
    candidate.changedDate = normalized.changedDate;
  }));
  state.detailsCache.delete(Number(itemId));
  state.historyCache.delete(Number(itemId));
  state.historyErrors.delete(Number(itemId));
  state.iterationStoriesCache.clear();
}

async function updateBacklogItemField(item, field, value, progress, label) {
  if (state.backlogUpdating || state.backlogDeleting) return;
  state.backlogUpdating = true;
  renderBacklog();
  els.backlogMeta.textContent = progress;
  try {
    const result = await azure(`/_apis/wit/workitems/${item.id}?api-version=7.1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json-patch+json" },
      body: JSON.stringify([{ op: "add", path: `/fields/${field}`, value }])
    });
    syncBacklogWorkItem(item.id, result);
    showNotice(`${label} for ${workItemKey(item.id)} updated.`, "info");
  } catch (error) {
    console.error(error);
    showNotice(error.auth
      ? `${label} could not be updated. The PAT requires ‘Work Items: Read & write’.`
      : error.message || `${label} could not be updated.`, "error");
  } finally {
    state.backlogUpdating = false;
    renderBacklog();
  }
}

function backlogPositionGroup(item) {
  const path = String(item.iterationPath || "").toLocaleLowerCase("en");
  const iteration = chronologicalIterations().find(candidate => {
    const candidatePath = String(candidate.path || "").toLocaleLowerCase("en");
    return candidatePath && candidatePath === path;
  });
  return iteration
    ? { key: `iteration:${iteration.id || path}`, label: iteration.name }
    : { key: "other", label: "Other" };
}

function backlogItemsInPositionGroup(groupKey) {
  return state.backlogItems.filter(candidate => backlogPositionGroup(candidate).key === groupKey);
}

function showBacklogPositionDialog(item) {
  const targets = backlogActionTargets(item);
  if (!targets.length || !state.backlogItems.length) return;
  const groups = [...new Map(targets.map(target => {
    const group = backlogPositionGroup(target);
    return [group.key, group];
  })).values()];
  if (groups.length !== 1) {
    showNotice("Select work items from the same backlog section to move them to one position.", "error");
    return;
  }
  const group = groups[0];
  const groupItems = backlogItemsInPositionGroup(group.key);
  const targetIds = targets.map(target => Number(target.id));
  const currentIndex = groupItems.findIndex(candidate => Number(candidate.id) === targetIds[0]);
  state.backlogPositionItemIds = targetIds;
  state.backlogPositionGroupKey = group.key;
  const lowest = 1;
  const highest = groupItems.length - targets.length + 1;
  els.backlogPositionKey.textContent = targets.length === 1 ? workItemKey(targets[0].id) : `${targets.length} selected issues`;
  els.backlogPositionScope.textContent = group.label;
  els.backlogPositionTitle.textContent = targets.length === 1
    ? targets[0].title
    : "The selected issues will keep their current relative order.";
  els.backlogPositionInput.min = String(lowest);
  els.backlogPositionInput.max = String(highest);
  els.backlogPositionInput.value = String(currentIndex + 1);
  els.backlogPositionLowest.textContent = String(lowest);
  els.backlogPositionHighest.textContent = String(highest);
  els.backlogPositionError.textContent = "";
  els.backlogPositionSubmit.disabled = false;
  els.backlogPositionSubmit.textContent = "Move";
  if (!els.backlogPositionDialog.open) els.backlogPositionDialog.showModal();
  requestAnimationFrame(() => {
    els.backlogPositionInput.focus();
    els.backlogPositionInput.select();
  });
}

function closeBacklogPositionDialog(force = false) {
  if (state.backlogUpdating && !force) return;
  state.backlogPositionItemIds = [];
  state.backlogPositionGroupKey = "";
  if (els.backlogPositionDialog.open) els.backlogPositionDialog.close();
}

async function moveBacklogItemToPosition(event) {
  event.preventDefault();
  if (state.backlogUpdating || state.backlogDeleting) return;
  const targetIds = new Set(state.backlogPositionItemIds.map(Number));
  const targets = state.backlogItems.filter(candidate => targetIds.has(Number(candidate.id)));
  const groupItems = backlogItemsInPositionGroup(state.backlogPositionGroupKey);
  const positionGroup = targets.length ? backlogPositionGroup(targets[0]) : null;
  const team = state.teams.find(candidate => candidate.id === state.teamId);
  if (!targets.length || targets.length !== targetIds.size || !groupItems.length || !team
    || targets.some(target => backlogPositionGroup(target).key !== state.backlogPositionGroupKey)) {
    els.backlogPositionError.textContent = "One or more selected work items are no longer available on the backlog.";
    return;
  }
  const highest = groupItems.length - targets.length + 1;
  const position = Number(els.backlogPositionInput.value);
  if (!Number.isInteger(position) || position < 1 || position > highest) {
    els.backlogPositionError.textContent = `Enter a whole number from 1 through ${highest}.`;
    els.backlogPositionInput.focus();
    return;
  }
  const reordered = groupItems.filter(candidate => !targetIds.has(Number(candidate.id)));
  const insertIndex = position - 1;
  reordered.splice(insertIndex, 0, ...targets);
  const unchanged = reordered.every((candidate, index) => Number(candidate.id) === Number(groupItems[index]?.id));
  if (unchanged) {
    closeBacklogPositionDialog();
    return;
  }
  const previousId = insertIndex > 0 ? Number(reordered[insertIndex - 1].id) : 0;
  const nextIndex = insertIndex + targets.length;
  const nextId = nextIndex < reordered.length ? Number(reordered[nextIndex].id) : 0;
  state.backlogUpdating = true;
  els.backlogPositionError.textContent = "";
  els.backlogPositionSubmit.disabled = true;
  els.backlogPositionSubmit.textContent = "Moving…";
  try {
    await azure(`/${encodeURIComponent(team.name)}/_apis/work/workitemsorder?api-version=7.1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: targets.map(target => Number(target.id)),
        previousId,
        nextId
      })
    });
    let groupIndex = 0;
    state.backlogItems = state.backlogItems.map(candidate => (
      backlogPositionGroup(candidate).key === state.backlogPositionGroupKey ? reordered[groupIndex++] : candidate
    ));
    closeBacklogPositionDialog(true);
    const endPosition = position + targets.length - 1;
    showNotice(targets.length === 1
      ? `${workItemKey(targets[0].id)} moved to ${positionGroup.label} position ${position}.`
      : `${targets.length} work items moved to ${positionGroup.label} positions ${position}–${endPosition}.`, "info");
  } catch (error) {
    console.error(error);
    els.backlogPositionError.textContent = error.auth
      ? "The selected work items could not be moved. The PAT requires ‘Work Items: Read & write’."
      : error.message || "The selected work items could not be moved.";
  } finally {
    state.backlogUpdating = false;
    els.backlogPositionSubmit.disabled = false;
    els.backlogPositionSubmit.textContent = "Move";
    if (state.currentView === "backlog") renderBacklog();
  }
}

function selectBacklogRow(item, event = {}) {
  const itemId = Number(item.id);
  const toggleSpecific = Boolean(event.metaKey || event.ctrlKey);
  if (event.shiftKey) {
    const visibleIds = [...document.querySelectorAll(".backlog-table tbody tr[data-work-item-id]")]
      .map(row => Number(row.dataset.workItemId));
    const anchorId = visibleIds.includes(Number(state.backlogSelectionAnchorId))
      ? Number(state.backlogSelectionAnchorId)
      : itemId;
    const anchorIndex = visibleIds.indexOf(anchorId);
    const itemIndex = visibleIds.indexOf(itemId);
    if (!toggleSpecific) state.backlogSelectedIds.clear();
    if (anchorIndex >= 0 && itemIndex >= 0) {
      const start = Math.min(anchorIndex, itemIndex);
      const end = Math.max(anchorIndex, itemIndex);
      visibleIds.slice(start, end + 1).forEach(id => state.backlogSelectedIds.add(id));
    } else {
      state.backlogSelectedIds.add(itemId);
    }
    if (state.backlogSelectionAnchorId === null) state.backlogSelectionAnchorId = itemId;
  } else if (toggleSpecific) {
    if (state.backlogSelectedIds.has(itemId)) state.backlogSelectedIds.delete(itemId);
    else state.backlogSelectedIds.add(itemId);
    state.backlogSelectionAnchorId = itemId;
  } else {
    state.backlogSelectedIds.clear();
    state.backlogSelectedIds.add(itemId);
    state.backlogSelectionAnchorId = itemId;
  }
  renderBacklogSelection();
}

function renderBacklogSelection() {
  document.querySelectorAll(".backlog-table tbody tr[data-work-item-id]").forEach(row => {
    const selected = state.backlogSelectedIds.has(Number(row.dataset.workItemId));
    row.classList.toggle("is-selected", selected);
    row.setAttribute("aria-selected", String(selected));
    row.setAttribute("aria-label", `${selected ? "Selected " : ""}${row.dataset.baseLabel}`);
  });
}

function backlogActionTargets(item) {
  const itemId = Number(item.id);
  const selectedIds = state.backlogSelectedIds.has(itemId) ? state.backlogSelectedIds : new Set([itemId]);
  return state.backlogItems.filter(candidate => selectedIds.has(Number(candidate.id)));
}

async function deleteBacklogItems(item) {
  if (state.backlogDeleting) return;
  const targets = backlogActionTargets(item);
  if (!targets.length) return;
  const description = targets.length === 1
    ? `${workItemKey(targets[0].id)} “${targets[0].title}”`
    : `${targets.length} selected work items`;
  if (!window.confirm(`Delete ${description}?\n\n${targets.length === 1 ? "The work item" : "These work items"} will be moved to the Azure DevOps recycle bin.`)) return;
  state.backlogDeleting = true;
  els.backlogMeta.textContent = `Deleting ${targets.length === 1 ? workItemKey(targets[0].id) : `${targets.length} work items`}…`;
  document.querySelectorAll(".backlog-row-delete").forEach(button => { button.disabled = true; });
  const results = await Promise.allSettled(targets.map(target => azure(
    `/_apis/wit/workitems/${target.id}?api-version=7.1`,
    { method: "DELETE" }
  )));
  const deleted = [];
  const failed = [];
  results.forEach((result, index) => {
    const target = targets[index];
    if (result.status === "fulfilled") {
      deleted.push(target);
      removeDeletedWorkItem(target.id);
      state.backlogSelectedIds.delete(Number(target.id));
    } else {
      console.error(result.reason);
      failed.push(target);
    }
  });
  state.backlogDeleting = false;
  renderBacklog();
  if (failed.length) {
    showNotice(`${deleted.length ? `${deleted.length} deleted. ` : ""}${failed.length} ${failed.length === 1 ? "work item" : "work items"} could not be deleted.`, "error");
  } else {
    showNotice(`${deleted.length} ${deleted.length === 1 ? "work item" : "work items"} deleted.`, "info");
  }
}

function wikiPageTitle(pageOrPath) {
  const path = typeof pageOrPath === "string" ? pageOrPath : pageOrPath?.path || "";
  const segment = path.split("/").filter(Boolean).pop() || "Home";
  try { return decodeURIComponent(segment).replace(/-/g, " "); }
  catch { return segment.replace(/-/g, " "); }
}

function orderedWikiPages(pages = []) {
  return [...pages].sort((left, right) => (Number(left.order) || 0) - (Number(right.order) || 0)
    || wikiPageTitle(left).localeCompare(wikiPageTitle(right), "en", { numeric: true, sensitivity: "base" }));
}

function flattenWikiPages(page, result = []) {
  if (!page) return result;
  if (page.path && page.path !== "/") result.push(page);
  orderedWikiPages(page.subPages).forEach(child => flattenWikiPages(child, result));
  return result;
}

function wikiTreeItemKey(page) {
  const context = parseAzureUrl(state.orgUrl);
  return [context.organization, state.projectName, state.wikiId, page.path]
    .map(value => encodeURIComponent(String(value || "").toLocaleLowerCase("en")))
    .join("|");
}

function wikiTreeItemExpanded(page) {
  return state.wikiExpandedItems.has(wikiTreeItemKey(page));
}

function setWikiTreeItemExpanded(page, expanded) {
  const key = wikiTreeItemKey(page);
  if (expanded) state.wikiExpandedItems.add(key);
  else state.wikiExpandedItems.delete(key);
  localStorage.setItem(STORAGE.wikiExpandedItems, JSON.stringify([...state.wikiExpandedItems]));
}

function renderWikiTreeBranch(page, depth = 0) {
  const wrapper = document.createElement("div");
  wrapper.className = "wiki-tree-branch";
  const children = orderedWikiPages(page.subPages);
  const row = document.createElement("div");
  row.className = "wiki-tree-row";
  row.style.setProperty("--wiki-depth", String(depth));
  if (children.length) {
    const expanded = wikiTreeItemExpanded(page);
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "wiki-tree-toggle";
    toggle.textContent = expanded ? "⌃" : "⌄";
    toggle.setAttribute("aria-label", `${expanded ? "Collapse" : "Expand"} ${wikiPageTitle(page)}`);
    toggle.setAttribute("aria-expanded", String(expanded));
    const childList = document.createElement("div");
    childList.className = "wiki-tree-children";
    childList.hidden = !expanded;
    childList.replaceChildren(...children.map(child => renderWikiTreeBranch(child, depth + 1)));
    toggle.addEventListener("click", () => {
      const nextExpanded = toggle.getAttribute("aria-expanded") !== "true";
      setWikiTreeItemExpanded(page, nextExpanded);
      toggle.setAttribute("aria-expanded", String(nextExpanded));
      toggle.setAttribute("aria-label", `${nextExpanded ? "Collapse" : "Expand"} ${wikiPageTitle(page)}`);
      toggle.textContent = nextExpanded ? "⌃" : "⌄";
      childList.hidden = !nextExpanded;
    });
    const button = createWikiPageButton(page);
    row.append(button, toggle);
    wrapper.append(row, childList);
    return wrapper;
  }
  const spacer = document.createElement("span");
  spacer.className = "wiki-tree-spacer";
  row.append(createWikiPageButton(page), spacer);
  wrapper.append(row);
  return wrapper;
}

function createWikiPageButton(page) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "wiki-tree-page";
  button.classList.toggle("is-active", page.path === state.wikiPage?.path);
  button.textContent = wikiPageTitle(page);
  button.title = page.path;
  button.addEventListener("click", () => loadWikiPage(page));
  return button;
}

function renderWikiTree() {
  const pages = flattenWikiPages(state.wikiRoot);
  const query = state.wikiQuery.trim().toLocaleLowerCase("en");
  if (!pages.length) {
    els.wikiTree.replaceChildren();
    els.wikiTreeStatus.textContent = state.wikiRoot ? "This wiki has no pages." : "";
    return;
  }
  els.wikiTreeStatus.textContent = query ? `${pages.filter(page => `${wikiPageTitle(page)} ${page.path}`.toLocaleLowerCase("en").includes(query)).length} results` : "";
  if (query) {
    const matches = pages.filter(page => `${wikiPageTitle(page)} ${page.path}`.toLocaleLowerCase("en").includes(query));
    els.wikiTree.replaceChildren(...matches.map(page => {
      const button = createWikiPageButton(page);
      button.classList.add("wiki-search-result");
      const path = document.createElement("small");
      path.textContent = page.path;
      button.append(path);
      return button;
    }));
    return;
  }
  els.wikiTree.replaceChildren(...orderedWikiPages(state.wikiRoot?.subPages).map(page => renderWikiTreeBranch(page)));
}

function renderWikiBreadcrumbs(page) {
  const segments = String(page?.path || "").split("/").filter(Boolean);
  const pages = new Map(flattenWikiPages(state.wikiRoot).map(value => [value.path, value]));
  const crumbs = [];
  segments.forEach((segment, index) => {
    if (index) {
      const separator = document.createElement("span");
      separator.textContent = "/";
      crumbs.push(separator);
    }
    const path = `/${segments.slice(0, index + 1).join("/")}`;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = wikiPageTitle(path);
    button.disabled = index === segments.length - 1;
    const target = pages.get(path);
    if (target) button.addEventListener("click", () => loadWikiPage(target));
    crumbs.push(button);
  });
  els.wikiBreadcrumbs.replaceChildren(...crumbs);
}

function normalizedWikiPath(href, currentPath) {
  const clean = String(href || "").split("#")[0].split("?")[0];
  if (!clean || /^(https?:|mailto:|#)/i.test(href) || clean.includes(".attachments/")) return "";
  const base = clean.startsWith("/") ? [] : String(currentPath || "/").split("/").filter(Boolean).slice(0, -1);
  for (const segment of clean.split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") base.pop();
    else base.push(segment.replace(/\.md$/i, ""));
  }
  return `/${base.join("/")}`;
}

function appendWikiInline(parent, text, page) {
  const pattern = /(!?\[([^\]]*)\]\(([^)]+)\)|\[\[([^\]]+)\]\]|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > cursor) parent.append(document.createTextNode(text.slice(cursor, match.index)));
    if (match[0].startsWith("![")) {
      const src = match[3].trim().split(/\s+/)[0];
      if (/^https?:\/\//i.test(src)) {
        const image = document.createElement("img");
        image.src = src;
        image.alt = match[2] || "";
        image.loading = "lazy";
        parent.append(image);
      } else {
        const fallback = document.createElement("span");
        fallback.className = "wiki-image-placeholder";
        fallback.textContent = match[2] || "Attached image";
        parent.append(fallback);
      }
    } else if (match[3] !== undefined || match[4] !== undefined) {
      const label = match[2] || match[4];
      const href = match[3]?.trim().split(/\s+/)[0] || match[4];
      const wikiPath = normalizedWikiPath(href, page?.path);
      const linkedPage = wikiPath && flattenWikiPages(state.wikiRoot).find(value => value.path.toLocaleLowerCase("en") === wikiPath.toLocaleLowerCase("en"));
      if (linkedPage) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "wiki-inline-link";
        button.textContent = label;
        button.addEventListener("click", () => loadWikiPage(linkedPage));
        parent.append(button);
      } else {
        const link = document.createElement("a");
        link.textContent = label;
        try {
          const url = new URL(href, page?.remoteUrl || activeAzureContext().webBase);
          if (["https:", "http:", "mailto:"].includes(url.protocol)) {
            link.href = url.href;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
          }
        } catch {}
        parent.append(link);
      }
    } else if (match[5] !== undefined) {
      const code = document.createElement("code");
      code.textContent = match[5];
      parent.append(code);
    } else {
      const emphasis = document.createElement(match[6] !== undefined ? "strong" : "em");
      emphasis.textContent = match[6] ?? match[7];
      parent.append(emphasis);
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parent.append(document.createTextNode(text.slice(cursor)));
}

function renderWikiMarkdown(markdown, page) {
  const fragment = document.createDocumentFragment();
  const lines = String(markdown || "").replace(/\r\n?/g, "\n").split("\n");
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim() || /^\[\[_TOC_\]\]$/i.test(line.trim())) { index += 1; continue; }
    if (/^```/.test(line.trim())) {
      const language = line.trim().slice(3).trim();
      const content = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index].trim())) content.push(lines[index++]);
      index += 1;
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      if (language) code.dataset.language = language;
      code.textContent = content.join("\n");
      pre.append(code);
      fragment.append(pre);
      continue;
    }
    if (line.includes("|") && /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1] || "")) {
      const cells = value => value.trim().replace(/^\||\|$/g, "").split("|").map(cell => cell.trim());
      const table = document.createElement("table");
      const head = document.createElement("thead");
      const headRow = document.createElement("tr");
      cells(line).forEach(value => {
        const cell = document.createElement("th");
        appendWikiInline(cell, value, page);
        headRow.append(cell);
      });
      head.append(headRow);
      const body = document.createElement("tbody");
      index += 2;
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        const row = document.createElement("tr");
        cells(lines[index++]).forEach(value => {
          const cell = document.createElement("td");
          appendWikiInline(cell, value, page);
          row.append(cell);
        });
        body.append(row);
      }
      table.append(head, body);
      fragment.append(table);
      continue;
    }
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const heading = document.createElement(`h${headingMatch[1].length}`);
      appendWikiInline(heading, headingMatch[2], page);
      fragment.append(heading);
      index += 1;
      continue;
    }
    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      fragment.append(document.createElement("hr"));
      index += 1;
      continue;
    }
    const listMatch = line.match(/^\s*(?:([-+*])|(\d+)\.)\s+(.+)$/);
    if (listMatch) {
      const ordered = Boolean(listMatch[2]);
      const list = document.createElement(ordered ? "ol" : "ul");
      while (index < lines.length) {
        const match = lines[index].match(/^\s*(?:([-+*])|(\d+)\.)\s+(.+)$/);
        if (!match || Boolean(match[2]) !== ordered) break;
        const item = document.createElement("li");
        appendWikiInline(item, match[3], page);
        list.append(item);
        index += 1;
      }
      fragment.append(list);
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote = document.createElement("blockquote");
      const content = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) content.push(lines[index++].replace(/^>\s?/, ""));
      appendWikiInline(quote, content.join(" "), page);
      fragment.append(quote);
      continue;
    }
    const paragraphLines = [];
    while (index < lines.length && lines[index].trim()
      && !/^(#{1,6})\s+/.test(lines[index]) && !/^```/.test(lines[index].trim())
      && !/^\s*(?:[-+*]|\d+\.)\s+/.test(lines[index]) && !/^>\s?/.test(lines[index])) {
      paragraphLines.push(lines[index++].trim());
    }
    const paragraph = document.createElement("p");
    appendWikiInline(paragraph, paragraphLines.join(" "), page);
    fragment.append(paragraph);
  }
  els.wikiPageContent.replaceChildren(fragment);
}

async function loadWikiPage(page) {
  const wiki = state.wikis.find(value => value.id === state.wikiId);
  if (!wiki || !page) return;
  if (mobileLayoutQuery.matches) setMobileDisclosure(els.wikiNavigationToggle, els.wikiSidebar, false);
  const requestToken = ++state.wikiRequestToken;
  state.wikiPage = page;
  state.routeWikiPath = page.path;
  if (!state.routeApplying) writeAppRoute(currentAppRoute({ wikiPath: page.path }));
  renderWikiTree();
  renderWikiBreadcrumbs(page);
  els.wikiPageTitle.textContent = wikiPageTitle(page);
  els.wikiPageStatus.textContent = "Loading page…";
  els.wikiPageStatus.classList.remove("is-error");
  els.wikiPageContent.replaceChildren();
  els.wikiOpenAzure.hidden = true;
  try {
    const loaded = await azure(`/_apis/wiki/wikis/${encodeURIComponent(wiki.id)}/pages?path=${encodeURIComponent(page.path)}&includeContent=true&api-version=7.1`);
    if (requestToken !== state.wikiRequestToken) return;
    state.wikiPage = { ...page, ...loaded };
    els.wikiPageStatus.textContent = loaded.content ? "" : "This page is empty.";
    els.wikiOpenAzure.href = loaded.remoteUrl || page.remoteUrl || "#";
    els.wikiOpenAzure.hidden = !loaded.remoteUrl && !page.remoteUrl;
    renderWikiMarkdown(loaded.content, state.wikiPage);
    renderWikiBreadcrumbs(state.wikiPage);
    renderWikiTree();
  } catch (error) {
    if (requestToken !== state.wikiRequestToken) return;
    console.error(error);
    els.wikiPageStatus.textContent = error.message || "The wiki page could not be loaded.";
    els.wikiPageStatus.classList.add("is-error");
  }
}

async function loadWiki(force = false) {
  if (!state.pat) {
    els.wikiTreeStatus.textContent = "Connect Azure DevOps to load the wiki.";
    return;
  }
  if (!force && state.wikiProjectName === state.projectName && state.wikiRoot) {
    renderWikiTree();
    const target = state.routeWikiPath && flattenWikiPages(state.wikiRoot)
      .find(page => page.path.toLocaleLowerCase("en") === state.routeWikiPath.toLocaleLowerCase("en"));
    if (target && target.path !== state.wikiPage?.path) await loadWikiPage(target);
    return;
  }
  const loadToken = ++state.wikiLoadToken;
  els.wikiTreeStatus.textContent = "Loading wikis…";
  els.wikiTreeStatus.classList.remove("is-error");
  els.wikiTree.replaceChildren();
  els.wikiPageStatus.textContent = "Loading wiki…";
  els.wikiPageContent.replaceChildren();
  try {
    const result = await azure("/_apis/wiki/wikis?api-version=7.1");
    if (loadToken !== state.wikiLoadToken) return;
    state.wikis = result.value || [];
    state.wikiProjectName = state.projectName;
    if (!state.wikis.length) {
      state.wikiRoot = null;
      state.wikiPage = null;
      els.wikiSelect.replaceChildren();
      els.wikiTreeStatus.textContent = "No Azure DevOps wikis were found in this project.";
      els.wikiPageStatus.textContent = "Create a wiki in Azure DevOps to see it here.";
      return;
    }
    if (!state.wikis.some(wiki => wiki.id === state.wikiId)) state.wikiId = state.wikis[0].id;
    els.wikiSelect.replaceChildren(...state.wikis.map(wiki => {
      const option = document.createElement("option");
      option.value = wiki.id;
      option.textContent = wiki.name;
      option.selected = wiki.id === state.wikiId;
      return option;
    }));
    localStorage.setItem(STORAGE.wiki, state.wikiId);
    const root = await azure(`/_apis/wiki/wikis/${encodeURIComponent(state.wikiId)}/pages?path=%2F&recursionLevel=full&api-version=7.1`);
    if (loadToken !== state.wikiLoadToken) return;
    state.wikiRoot = root;
    els.wikiTreeStatus.textContent = "";
    renderWikiTree();
    const pages = flattenWikiPages(root);
    const selected = pages.find(page => state.routeWikiPath
      && page.path.toLocaleLowerCase("en") === state.routeWikiPath.toLocaleLowerCase("en"))
      || pages.find(page => page.path === state.wikiPage?.path)
      || pages[0];
    if (selected) await loadWikiPage(selected);
    else els.wikiPageStatus.textContent = "This wiki has no pages.";
  } catch (error) {
    console.error(error);
    els.wikiTreeStatus.textContent = error.message || "The Azure DevOps wiki could not be loaded.";
    els.wikiTreeStatus.classList.add("is-error");
    els.wikiPageStatus.textContent = "Wiki unavailable.";
  }
}

function matchesWorkItemQuery(item, query = "") {
  if (!query) return true;
  return item.title.toLocaleLowerCase("en").includes(query)
    || String(item.id).includes(query)
    || workItemKey(item.id).toLocaleLowerCase("en").includes(query);
}

function matchesFilters(item, query = "") {
  if (!matchesWorkItemQuery(item, query)) return false;
  return FILTER_DEFINITIONS.every(definition => {
    const selected = state.filters[definition.key];
    if (!selected.size) return true;
    const values = definition.values
      ? definition.values(item)
      : [definition.value(item)];
    return values.some(value => selected.has(value));
  });
}

function activeFilterItems() {
  return state.currentView === "backlog" ? state.backlogItems : state.stories;
}

function getFilterOptions(definition, items = activeFilterItems()) {
  if (definition.key === "sprint") return [...new Set(newestIterations().map(iteration => iteration.name))];
  const values = new Set();
  for (const item of items) {
    if (state.currentView !== "backlog" && state.mapping[item.state] === "hidden") continue;
    const itemValues = definition.values ? definition.values(item) : [definition.value(item)];
    itemValues.forEach(value => { if (value) values.add(value); });
  }
  if (definition.key === "tag" && state.filters.tag.size && !values.size) return [...state.filters.tag];
  return [...values].sort((a, b) => a.localeCompare(b, "en", { numeric: true, sensitivity: "base" }));
}

function renderFilters() {
  els.filterControls.replaceChildren(...FILTER_DEFINITIONS.map(createFilterMenu));
  const chips = [];
  for (const definition of FILTER_DEFINITIONS) {
    for (const value of state.filters[definition.key]) chips.push(createFilterChip(definition, value));
  }
  els.activeFilters.replaceChildren(...chips);
  els.activeFilters.hidden = !chips.length;
  els.clearFilters.hidden = !chips.length;
  const items = activeFilterItems();
  const availableItems = state.currentView === "backlog" ? items : items.filter(item => state.mapping[item.state] !== "hidden");
  const query = state.currentView === "backlog"
    ? state.backlogSearch.trim().toLocaleLowerCase("en")
    : state.search.trim().toLocaleLowerCase("en");
  const visibleItems = availableItems.filter(item => matchesFilters(item, query));
  els.filterResultCount.textContent = chips.length || query ? `${visibleItems.length} of ${availableItems.length}` : `${availableItems.length} items`;
}

function createFilterMenu(definition) {
  const details = document.createElement("details");
  details.className = "filter-menu";
  const summary = document.createElement("summary");
  const selectedCount = state.filters[definition.key].size;
  summary.innerHTML = `<span>${escapeHtml(definition.label)}</span>${selectedCount ? `<b>${selectedCount}</b>` : ""}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>`;
  const dropdown = document.createElement("div");
  dropdown.className = "filter-dropdown";
  dropdown.addEventListener("click", event => event.stopPropagation());
  const options = getFilterOptions(definition);
  if (!options.length) {
    const empty = document.createElement("p");
    empty.className = "filter-empty";
    empty.textContent = "No options available";
    dropdown.append(empty);
  } else {
    for (const option of options) {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = state.filters[definition.key].has(option);
      input.addEventListener("change", async () => {
        const previousValues = new Set(state.filters[definition.key]);
        if (input.checked) state.filters[definition.key].add(option);
        else state.filters[definition.key].delete(option);
        if (definition.key === "sprint" && state.currentView !== "backlog") {
          setLoading(true);
          clearNotice();
          try {
            await applySprintFilter();
          } catch (error) {
            console.error(error);
            state.filters.sprint = previousValues;
            showNotice(error.message || "The sprints could not be loaded.", "error");
          } finally {
            setLoading(false);
          }
        }
        renderCurrentView();
        const reopened = [...els.filterControls.querySelectorAll(".filter-menu")][FILTER_DEFINITIONS.indexOf(definition)];
        if (reopened) reopened.open = true;
      });
      const text = document.createElement("span");
      text.textContent = option;
      label.append(input, text);
      dropdown.append(label);
    }
  }
  details.append(summary, dropdown);
  return details;
}

function createFilterChip(definition, value) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "filter-chip";
  chip.setAttribute("aria-label", `Remove filter ${definition.label}: ${value}`);
  chip.innerHTML = `<span>${escapeHtml(definition.label)}:</span> ${escapeHtml(value)} <b aria-hidden="true">×</b>`;
  chip.addEventListener("click", async () => {
    state.filters[definition.key].delete(value);
    if (definition.key === "sprint" && state.currentView !== "backlog") {
      setLoading(true);
      clearNotice();
      try { await applySprintFilter(); }
      catch (error) {
        console.error(error);
        state.filters.sprint.add(value);
        showNotice(error.message || "The sprints could not be loaded.", "error");
      } finally { setLoading(false); }
    }
    renderCurrentView();
  });
  return chip;
}

function pruneFilters(items = activeFilterItems()) {
  for (const definition of FILTER_DEFINITIONS) {
    const available = new Set(getFilterOptions(definition, items));
    for (const value of state.filters[definition.key]) if (!available.has(value)) state.filters[definition.key].delete(value);
  }
}

function renderCurrentView() {
  if (state.currentView === "for-you") renderForYou();
  else if (state.currentView === "backlog") renderBacklog();
  else if (state.currentView === "search") renderGlobalSearch();
  else render();
}

function createCard(item) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "story-card";
  card.setAttribute("aria-label", `${item.type} ${item.id}: ${item.title}. View details`);
  card.addEventListener("click", () => showWorkItem(item));
  const initials = item.assignee ? item.assignee.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase() : "?";
  const isBug = item.type.toLowerCase() === "bug";
  card.innerHTML = `
    <div class="card-topline">
      <span class="work-type"><span class="type-icon ${isBug ? "bug" : ""}">${isBug ? "!" : "◆"}</span>${escapeHtml(item.type)}</span>
      <span class="card-state" data-state-tone="${stateTone(item.state)}">${escapeHtml(item.state)}</span>
    </div>
    <h3>${escapeHtml(item.title)}</h3>
    <div class="card-footer">
      <span class="story-id">${escapeHtml(workItemKey(item.id))}</span>
      ${item.points !== null ? `<span class="points" title="Story points">${escapeHtml(String(item.points))}</span>` : ""}
      <span class="assignee ${item.assignee ? "" : "unassigned"}" title="${escapeHtml(item.assignee || "Unassigned")}">${initials}</span>
    </div>`;
  return card;
}

function workItemTitleHasUnsavedChanges() {
  const item = selectedWorkItem();
  return Boolean(item && !els.workItemTitleForm.hidden && els.workItemTitleInput.value.trim() !== item.title);
}

function descriptionHasUnsavedChanges() {
  if (els.descriptionEditorForm.hidden) return false;
  return descriptionEditorRevision > 0
    || sanitizedRichHtmlString(currentDescriptionEditorHtml()) !== descriptionEditorInitialHtml;
}

function commentHasUnsavedChanges() {
  if (els.commentComposerForm.hidden) return false;
  const html = richEditorHtml(els.commentComposerInput);
  return Boolean(htmlToText(html).trim() || /<img\b/i.test(html));
}

function pointsHaveUnsavedChanges() {
  const item = selectedWorkItem();
  if (!item || els.workItemPointsMenu.hidden) return false;
  const current = state.detailsCache.get(item.id)?.points ?? item.points ?? "";
  return String(els.workItemPointsInput.value).trim() !== String(current);
}

function workItemHasUnsavedChanges() {
  return els.workItemDialog.open && (
    workItemTitleHasUnsavedChanges()
    || descriptionHasUnsavedChanges()
    || commentHasUnsavedChanges()
    || pointsHaveUnsavedChanges()
    || state.pendingWorkItemWrites > 0
  );
}

function createWorkItemHasUnsavedChanges() {
  return els.createWorkItemDialog.open && Boolean(els.createWorkItemTitle.value.trim());
}

function hasUnsavedChanges() {
  return workItemHasUnsavedChanges()
    || state.pendingWorkItemWrites > 0
    || createWorkItemHasUnsavedChanges();
}

function confirmDiscardChanges(message = "You have unsaved changes. Discard them?") {
  return window.confirm(message);
}

function requestCloseWorkItemDialog() {
  if (!els.workItemDialog.open) return true;
  if (workItemHasUnsavedChanges() && !confirmDiscardChanges()) return false;
  els.workItemDialog.close();
  return true;
}

function requestCloseCreateWorkItemDialog() {
  if (!els.createWorkItemDialog.open) return true;
  if (createWorkItemHasUnsavedChanges() && !confirmDiscardChanges("Discard this unsaved work item?")) return false;
  els.createWorkItemDialog.close();
  return true;
}

function discardWorkItemTitleEditor() {
  if (workItemTitleHasUnsavedChanges() && !confirmDiscardChanges("Discard the unsaved title changes?")) return false;
  resetWorkItemTitleEditor();
  return true;
}

function discardDescriptionEditor() {
  if (descriptionHasUnsavedChanges() && !confirmDiscardChanges("Discard the unsaved content changes?")) return false;
  resetDescriptionEditor();
  return true;
}

function discardCommentComposer() {
  if (commentHasUnsavedChanges() && !confirmDiscardChanges("Discard this unsaved comment?")) return false;
  resetCommentComposer();
  return true;
}

async function showWorkItem(item) {
  if (els.workItemDialog.open && workItemHasUnsavedChanges() && !confirmDiscardChanges(
    `Discard your unsaved changes and open ${workItemKey(item.id)}?`
  )) return;
  if (!state.routeApplying) writeAppRoute(currentAppRoute({ itemId: item.id }));
  state.selectedItemId = item.id;
  state.selectedItem = item;
  els.workItemActions.open = false;
  closeWorkItemStateMenu();
  closeWorkItemAssigneeMenu();
  closeWorkItemTagsMenu();
  closeWorkItemDetailFieldMenus();
  resetDescriptionEditor();
  resetWorkItemTitleEditor();
  resetCommentComposer();
  const hasCachedDetail = state.detailsCache.has(item.id);
  const hasCachedComments = state.commentsCache.has(item.id);
  const hasCachedHistory = state.historyCache.has(item.id);
  const hasCachedPullRequests = state.githubWorkItemPullRequestsCache.has(item.id);
  const hasCachedDeployments = state.workItemDeploymentsCache.has(item.id);
  const cachedDetail = state.detailsCache.get(item.id) || null;
  const cachedComments = state.commentsCache.get(item.id) || [];
  const cachedHistory = state.historyCache.get(item.id) || [];
  const cachedPullRequests = state.githubWorkItemPullRequestsCache.get(item.id) || [];
  const cachedDeployments = state.workItemDeploymentsCache.get(item.id) || [];
  const cachedDeploymentError = state.workItemDeploymentsErrors.get(item.id) || "";
  if (!hasCachedComments) state.commentsErrors.delete(item.id);
  if (!hasCachedHistory) state.historyErrors.delete(item.id);
  if (!hasCachedPullRequests) state.githubWorkItemPullRequestsErrors.delete(item.id);
  if (!hasCachedDeployments) state.workItemDeploymentsErrors.delete(item.id);
  renderWorkItemDetail(item, cachedDetail, !hasCachedDetail);
  renderComments(cachedComments, !hasCachedComments);
  renderHistory(cachedHistory, !hasCachedHistory);
  renderWorkItemPullRequests(cachedPullRequests, Boolean(state.githubToken) && !hasCachedPullRequests);
  renderWorkItemDeployments(cachedDeployments, !hasCachedDeployments, cachedDeploymentError);
  renderCombinedActivity();
  setActivityTab("comments");
  if (!els.workItemDialog.open) {
    els.workItemDialog.showModal();
    els.workItemDialog.focus({ preventScroll: true });
  }

  if (!hasCachedDetail) {
    loadWorkItemDetail(item);
  }
  if (!hasCachedComments) {
    loadWorkItemComments(item);
  }
  if (!hasCachedHistory) {
    loadWorkItemHistory(item);
  }
  if (state.githubToken && !hasCachedPullRequests) {
    loadWorkItemPullRequests(item);
  }
  if (hasCachedDetail) {
    syncWorkItemDeployments(item, cachedDetail.deploymentReferences || []);
  }
}

async function showLinkedWorkItem(itemId) {
  const localItem = knownWorkItems().find(item => Number(item.id) === Number(itemId));
  if (localItem) {
    await showWorkItem(localItem);
    return true;
  }
  try {
    const [item] = await fetchWorkItems([itemId]);
    if (!item) throw new Error(`Work item ${itemId} was not found.`);
    await showWorkItem(item);
    return true;
  } catch (error) {
    console.error(error);
    els.workItemLoadStatus.textContent = error.message || "The linked work item could not be opened.";
    els.workItemLoadStatus.classList.add("is-error");
    showNotice(error.message || `Work item ${itemId} could not be opened.`, "error");
    return false;
  }
}

function removeDeletedWorkItem(itemId) {
  const keep = item => Number(item.id) !== Number(itemId);
  state.backlogSelectedIds.delete(Number(itemId));
  if (Number(state.backlogSelectionAnchorId) === Number(itemId)) state.backlogSelectionAnchorId = null;
  state.stories = state.stories.filter(keep);
  state.backlogItems = state.backlogItems.filter(keep);
  state.backlogEpics = state.backlogEpics.filter(keep);
  state.backlogFeatures = state.backlogFeatures.filter(keep);
  state.forYouCustomItems = state.forYouCustomItems.filter(keep);
  state.forYouWorkItems = state.forYouWorkItems.filter(keep);
  state.forYouCreated = state.forYouCreated.filter(keep);
  state.forYouUpdated = state.forYouUpdated.filter(keep);
  state.forYouCompleted = state.forYouCompleted.filter(keep);
  state.forYouMentions = state.forYouMentions.filter(entry => keep(entry.item));
  state.forYouActivity = state.forYouActivity.filter(entry => keep(entry.item));
  state.globalSearchResults = state.globalSearchResults.filter(keep);
  state.iterationStoriesCache.clear();
  state.detailsCache.delete(Number(itemId));
  state.detailsRequestTokens.delete(Number(itemId));
  state.commentsCache.delete(Number(itemId));
  state.commentsRequestTokens.delete(Number(itemId));
  state.commentsErrors.delete(Number(itemId));
  state.historyCache.delete(Number(itemId));
  state.historyErrors.delete(Number(itemId));
  state.githubWorkItemPullRequestsCache.delete(Number(itemId));
  state.githubWorkItemPullRequestsErrors.delete(Number(itemId));
  state.githubWorkItemPullRequestsRequestTokens.delete(Number(itemId));
  state.workItemDeploymentsCache.delete(Number(itemId));
  state.workItemDeploymentsErrors.delete(Number(itemId));
  state.workItemDeploymentsRequestTokens.delete(Number(itemId));
  state.workItemDeploymentSourceKeys.delete(Number(itemId));
  state.workItemYamlReferencesCache.delete(Number(itemId));
  state.workItemYamlDiscoveryErrors.delete(Number(itemId));
  state.workItemYamlDiscoveryRequestTokens.delete(Number(itemId));
}

async function deleteSelectedWorkItem() {
  const item = selectedWorkItem();
  if (!item) return;
  els.workItemActions.open = false;
  const unsavedWarning = workItemHasUnsavedChanges() ? " Any unsaved changes will also be lost." : "";
  if (!window.confirm(`Delete ${workItemKey(item.id)} “${item.title}”?${unsavedWarning}\n\nThe work item will be moved to the Azure DevOps recycle bin.`)) return;
  els.deleteWorkItem.disabled = true;
  els.workItemLoading.classList.add("is-active");
  els.workItemLoadStatus.textContent = "Deleting work item…";
  els.workItemLoadStatus.classList.remove("is-error");
  try {
    await azure(`/_apis/wit/workitems/${item.id}?api-version=7.1`, { method: "DELETE" });
    removeDeletedWorkItem(item.id);
    els.workItemDialog.close();
    renderCurrentView();
  } catch (error) {
    console.error(error);
    els.workItemLoadStatus.textContent = error.auth
      ? "The work item could not be deleted. The PAT requires ‘Work Items: Read & write’."
      : error.message || "The work item could not be deleted.";
    els.workItemLoadStatus.classList.add("is-error");
  } finally {
    els.deleteWorkItem.disabled = false;
    els.workItemLoading.classList.remove("is-active");
  }
}

async function loadWorkItemDetail(item) {
  const requestToken = (state.detailsRequestTokens.get(item.id) || 0) + 1;
  state.detailsRequestTokens.set(item.id, requestToken);
  try {
    const result = await azure(`/_apis/wit/workitems/${item.id}?$expand=relations&api-version=7.1`);
    const detail = normalizeWorkItemDetail(result);
    detail.parentId ||= item.parentId || null;
    if (detail.parentId) {
      try {
        const [parent] = await fetchWorkItems([detail.parentId]);
        detail.parent = parent || null;
        if (parent) {
          item.parentId = parent.id;
          item.featureLabel = `${parent.title} (#${parent.id})`;
        }
      } catch (error) {
        console.error("Parent work item could not be loaded.", error);
        detail.parent = null;
        detail.parentError = "Parent details could not be loaded.";
      }
    }
    if (detail.childIds.length) {
      try {
        const children = await fetchWorkItems(detail.childIds);
        const childrenById = new Map(children.map(child => [Number(child.id), child]));
        const type = item.type.trim().toLocaleLowerCase("en");
        const showAllChildren = type === "epic" || type === "feature";
        detail.subtasks = detail.childIds.map(id => childrenById.get(Number(id)))
          .filter(child => child && (showAllChildren || child.type.trim().toLocaleLowerCase("en") === "task"));
      } catch (error) {
        console.error("Child work items could not be loaded.", error);
        detail.subtasks = [];
        detail.subtasksError = "Child work items could not be loaded.";
      }
    }
    if (state.detailsRequestTokens.get(item.id) !== requestToken) return;
    state.detailsCache.set(item.id, detail);
    if (isSelectedWorkItem(item.id)) renderWorkItemDetail(item, detail, false);
    syncWorkItemDeployments(item, detail.deploymentReferences);
  } catch (error) {
    if (state.detailsRequestTokens.get(item.id) !== requestToken) return;
    console.error(error);
    if (isSelectedWorkItem(item.id)) renderWorkItemDetail(item, null, false, "Additional details could not be loaded.");
    if (!state.workItemDeploymentsCache.has(item.id)) {
      state.workItemDeploymentsErrors.set(item.id, "Releases could not be discovered because the work-item links could not be loaded.");
      if (isSelectedWorkItem(item.id)) {
        renderWorkItemDeployments([], false, state.workItemDeploymentsErrors.get(item.id));
        renderCombinedActivity();
      }
    }
  }
}

async function loadWorkItemComments(item) {
  const requestToken = (state.commentsRequestTokens.get(item.id) || 0) + 1;
  state.commentsRequestTokens.set(item.id, requestToken);
  try {
    const result = await azure(`/_apis/wit/workItems/${item.id}/comments?$top=100&order=desc&$expand=renderedText&api-version=7.1-preview.4`);
    if (state.commentsRequestTokens.get(item.id) !== requestToken) return;
    const comments = normalizeComments(result);
    state.commentsCache.set(item.id, comments);
    state.commentsErrors.delete(item.id);
    if (isSelectedWorkItem(item.id)) {
      renderComments(comments, false);
      renderCombinedActivity();
    }
  } catch (error) {
    if (state.commentsRequestTokens.get(item.id) !== requestToken) return;
    console.error(error);
    state.commentsErrors.set(item.id, "Comments could not be loaded.");
    if (isSelectedWorkItem(item.id)) {
      renderComments([], false, state.commentsErrors.get(item.id));
      renderCombinedActivity();
    }
  }
}

async function loadWorkItemHistory(item) {
  try {
    const result = await azure(`/_apis/wit/workItems/${item.id}/updates?api-version=7.1`);
    const history = normalizeHistory(result);
    state.historyCache.set(item.id, history);
    state.historyErrors.delete(item.id);
    if (isSelectedWorkItem(item.id)) {
      renderHistory(history, false);
      renderCombinedActivity();
    }
  } catch (error) {
    console.error(error);
    state.historyErrors.set(item.id, "History could not be loaded.");
    if (isSelectedWorkItem(item.id)) {
      renderHistory([], false, state.historyErrors.get(item.id));
      renderCombinedActivity();
    }
  }
}

async function loadWorkItemPullRequests(item) {
  const requestToken = (state.githubWorkItemPullRequestsRequestTokens.get(item.id) || 0) + 1;
  state.githubWorkItemPullRequestsRequestTokens.set(item.id, requestToken);
  try {
    const pullRequests = await loadGithubPullRequestsForWorkItem(item);
    if (state.githubWorkItemPullRequestsRequestTokens.get(item.id) !== requestToken) return;
    state.githubWorkItemPullRequestsCache.set(item.id, pullRequests);
    state.githubWorkItemPullRequestsErrors.delete(item.id);
    const detail = state.detailsCache.get(item.id);
    if (detail) syncWorkItemDeployments(item, detail.deploymentReferences || []);
    if (isSelectedWorkItem(item.id)) {
      renderWorkItemPullRequests(pullRequests);
      renderCombinedActivity();
    }
  } catch (error) {
    if (state.githubWorkItemPullRequestsRequestTokens.get(item.id) !== requestToken) return;
    console.error(error);
    state.githubWorkItemPullRequestsErrors.set(item.id, error.message || "Pull requests could not be loaded.");
    if (isSelectedWorkItem(item.id)) {
      renderWorkItemPullRequests([], false, state.githubWorkItemPullRequestsErrors.get(item.id));
      renderCombinedActivity();
    }
  }
}

function deploymentReferencesKey(references) {
  return references.map(reference => reference.sourceType === "yaml"
    ? [reference.sourceType, reference.projectId, reference.buildId].join(":")
    : [reference.sourceType, reference.projectId, reference.releaseId, reference.environmentId].join(":"))
    .sort()
    .join("|");
}

function mergeDeploymentReferences(...groups) {
  const references = new Map();
  groups.flat().forEach(reference => {
    const key = reference.sourceType === "yaml"
      ? `${reference.sourceType}:${reference.projectId}:${reference.buildId}`
      : `${reference.sourceType}:${reference.projectId}:${reference.releaseId}:${reference.environmentId}`;
    references.set(key, reference);
  });
  return [...references.values()];
}

function githubPullRequestDeploymentReferences(itemId) {
  const projectId = activeAzureContext().project;
  const buildIds = (state.githubWorkItemPullRequestsCache.get(Number(itemId)) || [])
    .flatMap(pullRequest => pullRequest.azureBuildIds || []);
  return [...new Set(buildIds.map(Number).filter(buildId => Number.isInteger(buildId) && buildId > 0))]
    .map(buildId => ({ sourceType: "yaml", projectId, buildId }));
}

async function recentYamlBuildsForWorkItemDiscovery() {
  const project = activeAzureContext().project;
  if (state.recentYamlBuildsProject === project && state.recentYamlBuildsLoaded) {
    return state.recentYamlBuilds;
  }
  if (state.recentYamlBuildsProject === project && state.recentYamlBuildsPromise) {
    return state.recentYamlBuildsPromise;
  }
  state.recentYamlBuildsProject = project;
  state.recentYamlBuilds = [];
  state.recentYamlBuildsLoaded = false;
  state.recentYamlBuildsPromise = loadRecentYamlBuilds(150).then(builds => {
    if (state.recentYamlBuildsProject === project) {
      state.recentYamlBuilds = builds;
      state.recentYamlBuildsLoaded = true;
    }
    return builds;
  }).finally(() => {
    if (state.recentYamlBuildsProject === project) state.recentYamlBuildsPromise = null;
  });
  return state.recentYamlBuildsPromise;
}

async function yamlBuildWorkItemIds(buildId) {
  const numericBuildId = Number(buildId);
  if (state.yamlBuildWorkItemsCache.has(numericBuildId)) {
    return state.yamlBuildWorkItemsCache.get(numericBuildId);
  }
  const request = azure(`/_apis/build/builds/${numericBuildId}/workitems?$top=500&api-version=7.1`)
    .then(result => new Set((result?.value || []).map(reference => Number(reference.id)).filter(Boolean)))
    .catch(error => {
      if (error.status === 404) return new Set();
      state.yamlBuildWorkItemsCache.delete(numericBuildId);
      throw error;
    });
  state.yamlBuildWorkItemsCache.set(numericBuildId, request);
  return request;
}

async function discoverYamlDeploymentReferences(item) {
  const builds = await recentYamlBuildsForWorkItemDiscovery();
  const matches = await mapWithConcurrency(builds, 8, async build => {
    const workItemIds = await yamlBuildWorkItemIds(build.id);
    return workItemIds.has(Number(item.id)) ? build : null;
  });
  return matches.filter(Boolean).map(build => ({
    sourceType: "yaml",
    projectId: activeAzureContext().project,
    buildId: Number(build.id)
  }));
}

function syncResolvedWorkItemDeployments(item, references) {
  const sourceKey = deploymentReferencesKey(references);
  const previousKey = state.workItemDeploymentSourceKeys.get(item.id);
  const hasResult = state.workItemDeploymentsCache.has(item.id)
    || state.workItemDeploymentsErrors.has(item.id)
    || state.workItemDeploymentsRequestTokens.has(item.id);
  if (previousKey === sourceKey && hasResult) return;
  state.workItemDeploymentSourceKeys.set(item.id, sourceKey);
  state.workItemDeploymentsCache.delete(item.id);
  state.workItemDeploymentsErrors.delete(item.id);
  if (!references.length) {
    state.workItemDeploymentsCache.set(item.id, []);
    const discoveryError = state.workItemYamlDiscoveryErrors.get(item.id) || "";
    if (discoveryError) state.workItemDeploymentsErrors.set(item.id, discoveryError);
    if (isSelectedWorkItem(item.id)) {
      renderWorkItemDeployments([], false, discoveryError);
      renderCombinedActivity();
    }
    return;
  }
  if (isSelectedWorkItem(item.id)) {
    renderWorkItemDeployments([], true);
    renderCombinedActivity();
  }
  loadWorkItemDeployments(item, references, sourceKey);
}

function syncWorkItemDeployments(item, directReferences) {
  const githubReferences = githubPullRequestDeploymentReferences(item.id);
  if (state.workItemYamlReferencesCache.has(item.id)) {
    const references = mergeDeploymentReferences(
      directReferences,
      githubReferences,
      state.workItemYamlReferencesCache.get(item.id)
    );
    syncResolvedWorkItemDeployments(item, references);
    return;
  }
  if (state.workItemYamlDiscoveryRequestTokens.has(item.id)) {
    if (githubReferences.length) {
      syncResolvedWorkItemDeployments(item, mergeDeploymentReferences(directReferences, githubReferences));
    }
    return;
  }
  const requestToken = Symbol(`yaml-discovery-${item.id}`);
  state.workItemYamlDiscoveryRequestTokens.set(item.id, requestToken);
  if (isSelectedWorkItem(item.id)) {
    renderWorkItemDeployments([], true);
    renderCombinedActivity();
  }
  discoverYamlDeploymentReferences(item).then(references => {
    if (state.workItemYamlDiscoveryRequestTokens.get(item.id) !== requestToken) return;
    state.workItemYamlReferencesCache.set(item.id, references);
    state.workItemYamlDiscoveryErrors.delete(item.id);
    syncResolvedWorkItemDeployments(item, mergeDeploymentReferences(
      directReferences,
      githubPullRequestDeploymentReferences(item.id),
      references
    ));
  }).catch(error => {
    if (state.workItemYamlDiscoveryRequestTokens.get(item.id) !== requestToken) return;
    console.error("Related YAML pipeline runs could not be discovered.", error);
    state.workItemYamlReferencesCache.set(item.id, []);
    state.workItemYamlDiscoveryErrors.set(item.id, error.auth
      ? "Related YAML pipeline runs could not be discovered. The PAT requires ‘Build: Read’."
      : error.message || "Related YAML pipeline runs could not be discovered.");
    syncResolvedWorkItemDeployments(item, mergeDeploymentReferences(
      directReferences,
      githubPullRequestDeploymentReferences(item.id)
    ));
  }).finally(() => {
    if (state.workItemYamlDiscoveryRequestTokens.get(item.id) === requestToken) {
      state.workItemYamlDiscoveryRequestTokens.delete(item.id);
    }
  });
}

function latestDateValue(values) {
  return values.reduce((latest, value) => {
    const timestamp = new Date(value || 0).getTime();
    return Number.isFinite(timestamp) && timestamp > latest ? timestamp : latest;
  }, 0);
}

function classicEnvironmentDate(environment) {
  const deployStepDates = (environment.deploySteps || []).flatMap(step => [
    step.lastModifiedOn,
    step.completedOn,
    step.queuedOn,
    step.startedOn
  ]);
  const timestamp = latestDateValue([
    environment.modifiedOn,
    ...deployStepDates
  ]);
  return timestamp ? new Date(timestamp).toISOString() : "";
}

function deploymentSummaryStatus(environments, fallback = "") {
  const statuses = environments.map(environment => String(environment.status || "").toLocaleLowerCase("en"));
  if (statuses.some(status => ["failed", "rejected"].includes(status))) return "failed";
  if (statuses.some(status => ["inprogress", "queued", "scheduled"].includes(status))) return "inProgress";
  if (statuses.length && statuses.every(status => status === "succeeded")) return "succeeded";
  if (statuses.some(status => ["partiallysucceeded", "succeededwithissues", "succeeded"].includes(status))) return "partiallySucceeded";
  if (statuses.length && statuses.every(status => ["canceled", "abandoned", "skipped"].includes(status))) return "canceled";
  if (statuses.length && statuses.every(status => status === "unavailable")) return "unavailable";
  if (statuses.some(status => ["notstarted", "notdeployed", "undefined"].includes(status))) return "notStarted";
  return fallback || "unknown";
}

function releaseEnvironmentWebUrl(releaseUrl, environmentId) {
  if (!releaseUrl) return "";
  try {
    const url = new URL(releaseUrl);
    url.searchParams.set("environmentId", String(environmentId));
    return url.href;
  } catch {
    return releaseUrl;
  }
}

function normalizeClassicDeployment(release, group) {
  const activeContext = activeAzureContext();
  const releaseId = Number(release.id || group.releaseId);
  const releaseUrl = release._links?.web?.href
    || `${activeContext.orgBase}/${encodeURIComponent(group.projectId)}/_releaseProgress?releaseId=${releaseId}`;
  const environmentsById = new Map((release.environments || []).map(environment => [Number(environment.id), environment]));
  const environments = [...group.environmentIds].map(environmentId => {
    const environment = environmentsById.get(Number(environmentId));
    if (!environment) {
      return {
        id: Number(environmentId),
        name: `Environment ${environmentId}`,
        status: "unavailable",
        rank: Number.MAX_SAFE_INTEGER,
        date: "",
        url: releaseEnvironmentWebUrl(releaseUrl, environmentId)
      };
    }
    return {
      id: Number(environment.id),
      name: environment.name || `Environment ${environment.id}`,
      status: environment.status || "unknown",
      rank: Number(environment.rank) || Number.MAX_SAFE_INTEGER,
      date: classicEnvironmentDate(environment),
      url: environment._links?.web?.href || releaseEnvironmentWebUrl(releaseUrl, environment.id)
    };
  }).sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  const activityTimestamp = latestDateValue([
    ...environments.map(environment => environment.date),
    release.modifiedOn,
    release.createdOn
  ]);
  return {
    key: `classic:${group.projectId}:${releaseId}`,
    sourceType: "classic",
    sourceLabel: "Classic release",
    id: releaseId,
    name: release.name || `Release ${releaseId}`,
    pipelineName: release.releaseDefinition?.name || release.definition?.name || "Classic release pipeline",
    status: deploymentSummaryStatus(environments, release.status),
    date: activityTimestamp ? new Date(activityTimestamp).toISOString() : release.modifiedOn || release.createdOn || "",
    url: releaseUrl,
    environments,
    unavailable: false
  };
}

async function loadClassicWorkItemDeployments(references) {
  const groups = new Map();
  references.forEach(reference => {
    const key = `${reference.projectId}:${reference.releaseId}`;
    if (!groups.has(key)) groups.set(key, {
      projectId: reference.projectId,
      releaseId: reference.releaseId,
      environmentIds: new Set()
    });
    groups.get(key).environmentIds.add(reference.environmentId);
  });
  const deployments = await mapWithConcurrency([...groups.values()], 4, async group => {
    try {
      const release = await azureRelease(`/_apis/release/releases/${group.releaseId}?api-version=7.1`, group.projectId);
      return normalizeClassicDeployment(release, group);
    } catch (error) {
      if (error.status !== 404) throw error;
      return {
        key: `classic:${group.projectId}:${group.releaseId}`,
        sourceType: "classic",
        sourceLabel: "Classic release",
        id: group.releaseId,
        name: `Release ${group.releaseId}`,
        pipelineName: "Classic release pipeline",
        status: "unavailable",
        date: "",
        url: "",
        environments: [...group.environmentIds].map(environmentId => ({
          id: environmentId,
          name: `Environment ${environmentId}`,
          status: "unavailable",
          rank: Number.MAX_SAFE_INTEGER,
          date: "",
          url: ""
        })),
        unavailable: true
      };
    }
  });
  return deployments;
}

function yamlStageRecords(timeline) {
  const stages = new Map();
  (timeline.records || []).forEach(record => {
    if (String(record.type || "").toLocaleLowerCase("en") !== "stage") return;
    const key = String(record.identifier || record.refName || record.name || record.id);
    const existing = stages.get(key);
    const attempt = Number(record.attempt) || 1;
    const existingAttempt = Number(existing?.attempt) || 0;
    const recordChanged = new Date(record.lastModified || record.finishTime || record.startTime || 0).getTime() || 0;
    const existingChanged = new Date(existing?.lastModified || existing?.finishTime || existing?.startTime || 0).getTime() || 0;
    if (!existing || attempt > existingAttempt || (attempt === existingAttempt && recordChanged > existingChanged)) {
      stages.set(key, record);
    }
  });
  return [...stages.values()].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
}

function yamlStageStatus(stage) {
  if (stage.result) return stage.result;
  const stateValue = String(stage.state || "").toLocaleLowerCase("en");
  if (stateValue === "inprogress") return "inProgress";
  if (stateValue === "pending") return "notStarted";
  return stateValue || "unknown";
}

function normalizeYamlDeployment(build, timeline, reference, environmentDeployments = [], environmentError = "") {
  const activeContext = activeAzureContext();
  const buildId = Number(build.id || reference.buildId);
  const buildUrl = build._links?.web?.href
    || `${activeContext.webBase}/_build/results?buildId=${buildId}&view=results`;
  const stages = yamlStageRecords(timeline).map(stage => ({
    id: stage.id || stage.identifier || stage.name,
    name: stage.name || stage.identifier || "Stage",
    status: yamlStageStatus(stage),
    rank: Number(stage.order) || Number.MAX_SAFE_INTEGER,
    date: stage.finishTime || stage.lastModified || stage.startTime || "",
    url: buildUrl
  }));
  if (!stages.length) return null;
  const activityTimestamp = latestDateValue([
    ...stages.map(stage => stage.date),
    build.finishTime,
    build.lastChangedDate,
    build.startTime,
    build.queueTime
  ]);
  const buildStatus = String(build.status || "").toLocaleLowerCase("en");
  const runStatus = build.result
    || (buildStatus && buildStatus !== "completed" ? build.status : "")
    || deploymentSummaryStatus(stages, "unknown");
  return {
    key: `yaml:${reference.projectId}:${buildId}`,
    sourceType: "yaml",
    sourceLabel: "YAML pipeline",
    id: buildId,
    name: build.buildNumber || `Run ${buildId}`,
    pipelineName: build.definition?.name || "YAML pipeline",
    status: runStatus,
    date: activityTimestamp ? new Date(activityTimestamp).toISOString() : "",
    url: buildUrl,
    stages,
    environments: environmentDeployments,
    environmentError,
    unavailable: false
  };
}

function environmentRecordDate(record) {
  return record.finishTime || record.startTime || record.queueTime || "";
}

function latestEnvironmentDeploymentRecords(records) {
  const latest = new Map();
  records.forEach(record => {
    const key = [record.stageName, record.jobName, record.resourceId].join(":");
    const existing = latest.get(key);
    const attempt = (Number(record.stageAttempt) || 1) * 10000 + (Number(record.jobAttempt) || 1);
    const existingAttempt = existing
      ? (Number(existing.stageAttempt) || 1) * 10000 + (Number(existing.jobAttempt) || 1)
      : 0;
    const changed = new Date(environmentRecordDate(record) || 0).getTime() || 0;
    const existingChanged = new Date(environmentRecordDate(existing || {}) || 0).getTime() || 0;
    if (!existing || attempt > existingAttempt || (attempt === existingAttempt && changed > existingChanged)) {
      latest.set(key, record);
    }
  });
  return [...latest.values()];
}

function yamlEnvironmentWebUrl(environment) {
  const activeContext = activeAzureContext();
  return environment._links?.web?.href
    || `${activeContext.webBase}/_environments/${Number(environment.id)}?view=history`;
}

function normalizeYamlEnvironmentDeployment(environment, records) {
  const latestRecords = latestEnvironmentDeploymentRecords(records);
  const activityTimestamp = latestDateValue(latestRecords.map(environmentRecordDate));
  const details = [...new Set(latestRecords.map(record => [record.stageName, record.jobName]
    .filter(Boolean).join(" · ")).filter(Boolean))].join(", ");
  return {
    id: Number(environment.id),
    name: environment.name || `Environment ${environment.id}`,
    status: deploymentSummaryStatus(latestRecords.map(record => ({ status: record.result })), "unknown"),
    rank: Number.MAX_SAFE_INTEGER,
    date: activityTimestamp ? new Date(activityTimestamp).toISOString() : "",
    details,
    url: yamlEnvironmentWebUrl(environment)
  };
}

async function loadAzureEnvironments() {
  if (state.releaseDebug.environmentsPromise) return state.releaseDebug.environmentsPromise;
  state.releaseDebug.environmentsPromise = (async () => {
    const environments = [];
    let continuationToken = "";
    do {
      const continuation = continuationToken
        ? `&continuationToken=${encodeURIComponent(continuationToken)}`
        : "";
      const page = await azurePage(`/_apis/pipelines/environments?$top=100${continuation}&api-version=7.2-preview.1`);
      environments.push(...(Array.isArray(page.result) ? page.result : page.result?.value || []));
      continuationToken = page.continuationToken;
    } while (continuationToken);
    return environments;
  })().catch(error => {
    state.releaseDebug.environmentsPromise = null;
    throw error;
  });
  return state.releaseDebug.environmentsPromise;
}

async function loadEnvironmentRecordsForBuilds(environment, buildsById) {
  const matchingRecords = [];
  const buildTimes = [...buildsById.values()].map(build => new Date(
    build.queueTime || build.startTime || build.finishTime || 0
  ).getTime() || 0).filter(Boolean);
  const earliestBuildTime = buildTimes.length ? Math.min(...buildTimes) : 0;
  let continuationToken = "";
  let pageCount = 0;
  do {
    const continuation = continuationToken
      ? `&continuationToken=${encodeURIComponent(continuationToken)}`
      : "";
    const page = await azurePage(`/_apis/pipelines/environments/${Number(environment.id)}/environmentdeploymentrecords?top=100${continuation}&api-version=7.2-preview.1`);
    const records = Array.isArray(page.result) ? page.result : page.result?.value || [];
    matchingRecords.push(...records.filter(record => buildsById.has(Number(record.owner?.id))));
    continuationToken = page.continuationToken;
    pageCount++;
    const recordTimes = records.map(record => new Date(environmentRecordDate(record) || 0).getTime() || 0).filter(Boolean);
    const oldestRecordTime = recordTimes.length ? Math.min(...recordTimes) : 0;
    if (!records.length || (earliestBuildTime && oldestRecordTime && oldestRecordTime < earliestBuildTime)) break;
  } while (continuationToken && pageCount < 50);
  return matchingRecords;
}

async function loadYamlEnvironmentDeployments(builds) {
  const buildsById = new Map(builds.map(build => [Number(build.id), build]));
  const deploymentsByBuildId = new Map([...buildsById.keys()].map(buildId => [buildId, []]));
  if (!buildsById.size) return deploymentsByBuildId;
  const environments = await loadAzureEnvironments();
  await mapWithConcurrency(environments, 4, async environment => {
    const records = await loadEnvironmentRecordsForBuilds(environment, buildsById);
    const recordsByBuildId = new Map();
    records.forEach(record => {
      const buildId = Number(record.owner?.id);
      if (!recordsByBuildId.has(buildId)) recordsByBuildId.set(buildId, []);
      recordsByBuildId.get(buildId).push(record);
    });
    recordsByBuildId.forEach((buildRecords, buildId) => {
      deploymentsByBuildId.get(buildId)?.push(normalizeYamlEnvironmentDeployment(environment, buildRecords));
    });
  });
  deploymentsByBuildId.forEach(deployments => deployments.sort((a, b) =>
    new Date(b.date || 0) - new Date(a.date || 0) || a.name.localeCompare(b.name, "en", { sensitivity: "base" })));
  return deploymentsByBuildId;
}

async function loadRecentClassicReleaseDetails() {
  if (state.releaseDebug.classicReleaseDetailsPromise) return state.releaseDebug.classicReleaseDetailsPromise;
  state.releaseDebug.classicReleaseDetailsPromise = (async () => {
    const result = await azureRelease("/_apis/release/releases?$top=30&queryOrder=descending&api-version=7.1");
    return (await mapWithConcurrency(result?.value || [], 5, async summary => {
      try {
        return await azureRelease(`/_apis/release/releases/${Number(summary.id)}?api-version=7.1`);
      } catch (error) {
        if (error.status === 404) return null;
        throw error;
      }
    })).filter(Boolean);
  })().catch(error => {
    state.releaseDebug.classicReleaseDetailsPromise = null;
    throw error;
  });
  return state.releaseDebug.classicReleaseDetailsPromise;
}

async function loadLatestClassicReleases() {
  const releases = await loadRecentClassicReleaseDetails();
  const deployments = releases.map(release => {
    return normalizeClassicDeployment(release, {
      projectId: activeAzureContext().project,
      releaseId: Number(release.id),
      environmentIds: new Set((release.environments || []).map(environment => Number(environment.id)))
    });
  });
  return deployments.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5);
}

async function loadRecentYamlBuilds(top = 100) {
  const definitionsResult = await azure("/_apis/build/definitions?$top=1000&processType=2&api-version=7.1");
  const definitionIds = (definitionsResult?.value || []).map(definition => Number(definition.id)).filter(Boolean);
  if (!definitionIds.length) return [];
  const buildGroups = await mapWithConcurrency(Array.from({ length: Math.ceil(definitionIds.length / 100) }, (_, index) =>
    definitionIds.slice(index * 100, index * 100 + 100)), 4, async ids => {
    const result = await azure(`/_apis/build/builds?definitions=${ids.join(",")}&$top=${top}&queryOrder=queueTimeDescending&api-version=7.1`);
    return result?.value || [];
  });
  return [...new Map(buildGroups.flat().map(build => [Number(build.id), build])).values()]
    .sort((a, b) => new Date(b.queueTime || 0) - new Date(a.queueTime || 0))
    .slice(0, top);
}

async function loadLatestYamlRuns() {
  const builds = await loadRecentYamlBuilds(30);
  const runs = await mapWithConcurrency(builds, 4, async build => {
    try {
      const timeline = await azure(`/_apis/build/builds/${Number(build.id)}/timeline?api-version=7.1`);
      const deployment = normalizeYamlDeployment(build, timeline, {
        projectId: activeAzureContext().project,
        buildId: Number(build.id)
      });
      if (deployment) deployment.displayMode = "stages";
      return deployment;
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  });
  return runs.filter(Boolean)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 5);
}

function normalizeLatestYamlEnvironmentDeployments(environmentRecords) {
  const groups = new Map();
  environmentRecords.forEach(({ environment, record }) => {
    const ownerKey = String(record.owner?.id || record.planId || record.requestIdentifier || record.id);
    if (!groups.has(ownerKey)) groups.set(ownerKey, {
      owner: record.owner || {},
      definition: record.definition || {},
      recordsByEnvironment: new Map()
    });
    const group = groups.get(ownerKey);
    const environmentId = Number(environment.id);
    if (!group.recordsByEnvironment.has(environmentId)) {
      group.recordsByEnvironment.set(environmentId, { environment, records: [] });
    }
    group.recordsByEnvironment.get(environmentId).records.push(record);
  });
  return [...groups.entries()].map(([ownerKey, group]) => {
    const environments = [...group.recordsByEnvironment.values()].map(value =>
      normalizeYamlEnvironmentDeployment(value.environment, value.records));
    const activityTimestamp = latestDateValue(environments.map(environment => environment.date));
    const numericOwnerId = Number(group.owner.id);
    const runUrl = group.owner._links?.web?.href
      || (Number.isFinite(numericOwnerId) && numericOwnerId > 0
        ? `${activeAzureContext().webBase}/_build/results?buildId=${numericOwnerId}&view=results`
        : "");
    return {
      key: `yaml-environment:${ownerKey}`,
      sourceType: "yaml",
      sourceLabel: "YAML environment deployment",
      id: group.owner.id || ownerKey,
      name: group.owner.name || `Run ${ownerKey}`,
      pipelineName: group.definition.name || "YAML pipeline",
      status: deploymentSummaryStatus(environments, "unknown"),
      date: activityTimestamp ? new Date(activityTimestamp).toISOString() : "",
      url: runUrl,
      stages: [],
      environments,
      environmentError: "",
      displayMode: "environments",
      unavailable: false
    };
  }).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5);
}

async function loadLatestYamlEnvironmentDeployments() {
  const environments = await loadAzureEnvironments();
  const environmentRecords = [];
  await mapWithConcurrency(environments, 4, async environment => {
    const page = await azurePage(`/_apis/pipelines/environments/${Number(environment.id)}/environmentdeploymentrecords?top=10&api-version=7.2-preview.1`);
    const records = Array.isArray(page.result) ? page.result : page.result?.value || [];
    records.forEach(record => environmentRecords.push({ environment, record }));
  });
  environmentRecords.sort((a, b) => new Date(environmentRecordDate(b.record) || 0) - new Date(environmentRecordDate(a.record) || 0));
  return normalizeLatestYamlEnvironmentDeployments(environmentRecords);
}

function releaseEnvironmentTier(name) {
  const words = String(name || "").toLocaleLowerCase("en").split(/[^a-z0-9]+/).filter(Boolean);
  if (words.some(word => ["production", "prod"].includes(word))) return "production";
  if (words.some(word => ["acceptance", "accept", "acc", "staging", "stage"].includes(word))) return "acceptance";
  if (words.some(word => ["development", "develop", "dev", "preview"].includes(word))) return "development";
  return "";
}

function successfulDeployment(value) {
  return ["succeeded", "partiallysucceeded", "succeededwithissues"].includes(String(value || "").toLocaleLowerCase("en"));
}

function latestSnapshot(snapshots, candidate) {
  const key = `${candidate.tier}:${candidate.pipelineKey}`;
  const existing = snapshots.get(key);
  if (!existing || new Date(candidate.date || 0) > new Date(existing.date || 0)) snapshots.set(key, candidate);
}

async function loadBuildsById(ids) {
  const builds = new Map();
  await mapWithConcurrency([...new Set(ids.map(Number).filter(Boolean))], 6, async buildId => {
    try {
      const build = await azure(`/_apis/build/builds/${buildId}?api-version=7.1`);
      builds.set(buildId, build);
    } catch (error) {
      if (error.status !== 404) throw error;
    }
  });
  return builds;
}

function buildRepositoryLabel(build) {
  return build?.repository?.name || build?.repository?.id || "Unknown repository";
}

function yamlReadinessPipelineKey(build, record) {
  const definitionId = Number(build?.definition?.id || record?.definition?.id) || String(build?.definition?.name || record?.definition?.name || record?.owner?.name || "pipeline");
  return `yaml:${definitionId}:${String(buildRepositoryLabel(build)).toLocaleLowerCase("en")}`;
}

async function loadYamlReadinessSnapshots() {
  const environments = (await loadAzureEnvironments()).filter(environment => releaseEnvironmentTier(environment.name));
  const candidates = [];
  await mapWithConcurrency(environments, 4, async environment => {
    const page = await azurePage(`/_apis/pipelines/environments/${Number(environment.id)}/environmentdeploymentrecords?top=100&api-version=7.2-preview.1`);
    const records = Array.isArray(page.result) ? page.result : page.result?.value || [];
    const latestByPipeline = new Map();
    records.filter(record => successfulDeployment(record.result)).forEach(record => {
      const pipeline = String(record.definition?.id || record.definition?.name || record.owner?.name || record.owner?.id || "pipeline");
      const existing = latestByPipeline.get(pipeline);
      if (!existing || new Date(environmentRecordDate(record) || 0) > new Date(environmentRecordDate(existing) || 0)) {
        latestByPipeline.set(pipeline, record);
      }
    });
    latestByPipeline.forEach(record => candidates.push({ environment, record }));
  });
  const builds = await loadBuildsById(candidates.map(candidate => candidate.record.owner?.id));
  const snapshots = new Map();
  candidates.forEach(({ environment, record }) => {
    const build = builds.get(Number(record.owner?.id));
    if (!build) return;
    latestSnapshot(snapshots, {
      tier: releaseEnvironmentTier(environment.name),
      pipelineKey: yamlReadinessPipelineKey(build, record),
      pipelineName: build.definition?.name || record.definition?.name || record.owner?.name || "YAML pipeline",
      sourceType: "YAML",
      environmentName: environment.name,
      build,
      buildId: Number(build.id),
      repository: buildRepositoryLabel(build),
      commit: build.sourceVersion || "",
      date: environmentRecordDate(record),
      url: build._links?.web?.href || ""
    });
  });
  return snapshots;
}

function classicArtifactBuildId(artifact) {
  return Number(artifact?.definitionReference?.version?.id || artifact?.definitionReference?.build?.id || artifact?.buildId) || 0;
}

async function loadClassicReadinessSnapshots() {
  const releases = await loadRecentClassicReleaseDetails();
  const candidates = [];
  releases.forEach(release => {
    const buildArtifacts = (release.artifacts || []).filter(artifact => String(artifact.type || "").toLocaleLowerCase("en") === "build" && classicArtifactBuildId(artifact));
    (release.environments || []).forEach(environment => {
      const tier = releaseEnvironmentTier(environment.name);
      if (!tier || !successfulDeployment(environment.status)) return;
      buildArtifacts.forEach(artifact => candidates.push({ release, environment, artifact, tier }));
    });
  });
  const builds = await loadBuildsById(candidates.map(candidate => classicArtifactBuildId(candidate.artifact)));
  const snapshots = new Map();
  candidates.forEach(({ release, environment, artifact, tier }) => {
    const build = builds.get(classicArtifactBuildId(artifact));
    if (!build) return;
    const definition = artifact.definitionReference?.definition || {};
    const artifactKey = definition.id || definition.name || artifact.alias || build.definition?.id || build.definition?.name;
    const pipelineKey = `classic:${release.releaseDefinition?.id || release.definition?.id || "release"}:${artifactKey}:${String(buildRepositoryLabel(build)).toLocaleLowerCase("en")}`;
    latestSnapshot(snapshots, {
      tier,
      pipelineKey,
      pipelineName: `${release.releaseDefinition?.name || release.definition?.name || "Classic release"} · ${artifact.alias || build.definition?.name || "Build"}`,
      sourceType: "Classic",
      environmentName: environment.name,
      build,
      buildId: Number(build.id),
      repository: buildRepositoryLabel(build),
      commit: build.sourceVersion || "",
      date: classicEnvironmentDate(environment) || release.modifiedOn || release.createdOn || "",
      url: release._links?.web?.href || build._links?.web?.href || ""
    });
  });
  return snapshots;
}

function mergeReadinessSnapshots(...snapshotMaps) {
  const merged = new Map();
  snapshotMaps.forEach(snapshots => snapshots.forEach(snapshot => latestSnapshot(merged, snapshot)));
  return merged;
}

async function configuredRepositoryForBuild(build, configuredRepositories) {
  const repositoryName = String(build?.repository?.name || "").toLocaleLowerCase("en");
  const metadataName = azureBuildRepositoryName(build);
  const dottedName = repositoryName.includes(".") ? repositoryName.replace(".", "/") : "";
  const directMatch = configuredRepositories.find(repository =>
    repository === metadataName
    || repository === repositoryName
    || repository === dottedName
    || repository.endsWith(`/${repositoryName}`));
  if (directMatch) return directMatch;
  const commit = String(build?.sourceVersion || "").trim();
  if (!commit || !configuredRepositories.length) return "";
  const cacheKey = `${commit.toLocaleLowerCase("en")}:${[...configuredRepositories].sort().join(",")}`;
  if (state.releaseReadiness.githubRepositoryMatches.has(cacheKey)) {
    return state.releaseReadiness.githubRepositoryMatches.get(cacheKey);
  }
  const request = mapWithConcurrency(configuredRepositories, 4, async repository => {
    const [owner, name] = repository.split("/");
    try {
      await github(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commits/${encodeURIComponent(commit)}`);
      return repository;
    } catch {
      return "";
    }
  }).then(matches => matches.find(Boolean) || "");
  state.releaseReadiness.githubRepositoryMatches.set(cacheKey, request);
  return request;
}

function azureWorkItemIds(result) {
  return (result?.value || []).map(reference => Number(reference.id || String(reference.url || "").split("/").pop())).filter(Boolean);
}

async function workItemsBetweenBuilds(fromSnapshot, targetSnapshot) {
  if (targetSnapshot?.buildId === fromSnapshot.buildId) return new Set();
  try {
    if (targetSnapshot?.buildId) {
      const result = await azure(`/_apis/build/workitems?fromBuildId=${targetSnapshot.buildId}&toBuildId=${fromSnapshot.buildId}&$top=1000&api-version=7.1`);
      return new Set(azureWorkItemIds(result));
    }
    return new Set(await yamlBuildWorkItemIds(fromSnapshot.buildId));
  } catch (error) {
    const ids = await yamlBuildWorkItemIds(fromSnapshot.buildId);
    return new Set(ids);
  }
}

function azureBoardIdsFromText(value) {
  return [...String(value || "").matchAll(/\bAB#(\d+)\b/gi)].map(match => Number(match[1])).filter(Boolean);
}

async function githubWorkItemsBetweenBuilds(fromSnapshot, targetSnapshot, configuredRepositories) {
  if (!state.githubToken || !targetSnapshot?.commit || !fromSnapshot.commit || targetSnapshot.commit === fromSnapshot.commit) {
    return { ids: new Set(), unresolved: 0, warning: "" };
  }
  const repository = await configuredRepositoryForBuild(fromSnapshot.build, configuredRepositories);
  if (!repository) return { ids: new Set(), unresolved: 0, warning: "The deployed commit could not be matched to one of the selected GitHub repositories." };
  const cacheKey = `${repository}:${targetSnapshot.commit}:${fromSnapshot.commit}`.toLocaleLowerCase("en");
  if (state.releaseReadiness.githubComparisons.has(cacheKey)) return state.releaseReadiness.githubComparisons.get(cacheKey);
  const request = (async () => {
    const [owner, name] = repository.split("/");
    try {
      const comparison = await github(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/compare/${encodeURIComponent(targetSnapshot.commit)}...${encodeURIComponent(fromSnapshot.commit)}?per_page=100`);
      const commits = comparison.commits || [];
      const ids = new Set(commits.flatMap(commit => azureBoardIdsFromText(commit.commit?.message)));
      let unresolved = 0;
      await mapWithConcurrency(commits.filter(commit => !azureBoardIdsFromText(commit.commit?.message).length), 4, async commit => {
        try {
          const pulls = await github(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commits/${encodeURIComponent(commit.sha)}/pulls?per_page=20`);
          const pullIds = (pulls || []).flatMap(pull => azureBoardIdsFromText(pull.title));
          pullIds.forEach(id => ids.add(id));
          if (!pullIds.length) unresolved++;
        } catch (error) {
          unresolved++;
        }
      });
      return { ids, unresolved, warning: comparison.status === "diverged" ? "The Git branches have diverged; verify this comparison." : "" };
    } catch (error) {
      return { ids: new Set(), unresolved: 0, warning: `GitHub comparison failed: ${error.message}` };
    }
  })();
  state.releaseReadiness.githubComparisons.set(cacheKey, request);
  return request;
}

function readinessState(item, lane) {
  const value = String(item.state || "").toLocaleLowerCase("en");
  if (isFinishedWorkItem(item)) return { ready: true, label: "Ready" };
  const ready = lane === "development"
    ? /ready.*accept|accept.*ready|test(?:ed)?(?:\s+on)?\s+(?:dev|development)|development.*test(?:ed)?/.test(value)
    : /ready.*prod|prod.*ready|test(?:ed)?(?:\s+on)?\s+(?:acc|acceptance)|acceptance.*test(?:ed)?/.test(value);
  return { ready, label: ready ? "Ready" : "Needs attention" };
}

async function compareReadinessLane(snapshots, fromTier, targetTier, configuredRepositories) {
  const fromSnapshots = [...snapshots.values()].filter(snapshot => snapshot.tier === fromTier);
  const groups = await mapWithConcurrency(fromSnapshots, 4, async fromSnapshot => {
    const targetSnapshot = snapshots.get(`${targetTier}:${fromSnapshot.pipelineKey}`) || null;
    const [azureIds, githubResult] = await Promise.all([
      workItemsBetweenBuilds(fromSnapshot, targetSnapshot),
      githubWorkItemsBetweenBuilds(fromSnapshot, targetSnapshot, configuredRepositories)
    ]);
    const ids = new Set([...azureIds, ...githubResult.ids]);
    const fetchedItems = ids.size ? await fetchWorkItems([...ids]) : [];
    const items = fetchedItems.filter(item => /^(user story|bug|product backlog item)$/i.test(item.type));
    return {
      pipelineKey: fromSnapshot.pipelineKey,
      pipelineName: fromSnapshot.pipelineName,
      sourceType: fromSnapshot.sourceType,
      repository: fromSnapshot.repository,
      fromSnapshot,
      targetSnapshot,
      items,
      unresolved: githubResult.unresolved,
      warning: githubResult.warning || (!targetSnapshot ? `No successful ${targetTier} deployment was found for this pipeline.` : "")
    };
  });
  return groups.filter(group => group.items.length || group.unresolved || group.warning)
    .sort((a, b) => a.pipelineName.localeCompare(b.pipelineName, "en", { sensitivity: "base" }));
}

async function loadReleaseReadiness() {
  const sourceResults = await Promise.allSettled([loadYamlReadinessSnapshots(), loadClassicReadinessSnapshots()]);
  const warnings = [];
  const snapshotMaps = [];
  sourceResults.forEach((result, index) => {
    if (result.status === "fulfilled") snapshotMaps.push(result.value);
    else warnings.push(`${index ? "Classic" : "YAML"} deployments could not be loaded: ${result.reason?.message || "Unknown error"}`);
  });
  if (!snapshotMaps.length) throw new Error(warnings.join(" ") || "Deployment snapshots could not be loaded.");
  if (!state.githubToken) warnings.push("Add a GitHub API key to also resolve AB# references from GitHub commits and pull requests.");
  const configuredRepositories = state.githubToken ? await configuredGithubRepositories().catch(() => []) : [];
  const snapshots = mergeReadinessSnapshots(...snapshotMaps);
  const [development, acceptance] = await Promise.all([
    compareReadinessLane(snapshots, "development", "acceptance", configuredRepositories),
    compareReadinessLane(snapshots, "acceptance", "production", configuredRepositories)
  ]);
  return { development, acceptance, warnings };
}

function createReadinessWorkItem(item, lane) {
  const status = readinessState(item, lane);
  const link = document.createElement("a");
  link.className = "release-readiness-item";
  link.href = workItemWebUrl(item.id);
  link.dataset.itemType = String(item.type || "").toLocaleLowerCase("en");
  link.innerHTML = `
    <span class="release-readiness-type" aria-hidden="true">${item.type === "Bug" ? "B" : "S"}</span>
    <span class="release-readiness-item-body"><strong>${escapeHtml(workItemKey(item.id))} ${escapeHtml(item.title)}</strong><small>${escapeHtml(item.state)} · ${escapeHtml(item.type)}</small></span>
    <span class="release-readiness-badge" data-tone="${status.ready ? "ready" : "attention"}">${status.label}</span>`;
  link.addEventListener("click", event => {
    event.preventDefault();
    showWorkItem(item);
  });
  return link;
}

function createReadinessPipeline(group, lane) {
  const section = document.createElement("section");
  section.className = "release-readiness-pipeline";
  const heading = document.createElement("div");
  heading.className = "release-readiness-pipeline-heading";
  const buildRange = group.targetSnapshot
    ? `${group.targetSnapshot.build?.buildNumber || `#${group.targetSnapshot.buildId}`} → ${group.fromSnapshot.build?.buildNumber || `#${group.fromSnapshot.buildId}`}`
    : `up to ${group.fromSnapshot.build?.buildNumber || `#${group.fromSnapshot.buildId}`}`;
  heading.innerHTML = `<strong>${escapeHtml(group.pipelineName)}</strong><small>${escapeHtml(group.sourceType)} · ${escapeHtml(group.repository)} · ${escapeHtml(buildRange)}</small>`;
  section.append(heading, ...group.items.map(item => createReadinessWorkItem(item, lane)));
  if (group.unresolved || group.warning) {
    const unresolved = document.createElement("div");
    unresolved.className = "release-readiness-unresolved";
    unresolved.textContent = [
      group.unresolved ? `${group.unresolved} commit${group.unresolved === 1 ? "" : "s"} could not be linked to an AB# work item.` : "",
      group.warning
    ].filter(Boolean).join(" ");
    section.append(unresolved);
  }
  return section;
}

function renderReadinessLane(lane, groups, loading = false) {
  const count = lane === "development" ? els.developmentReadinessCount : els.acceptanceReadinessCount;
  const summary = lane === "development" ? els.developmentReadinessSummary : els.acceptanceReadinessSummary;
  const list = lane === "development" ? els.developmentReadinessList : els.acceptanceReadinessList;
  const uniqueItems = new Map(groups.flatMap(group => group.items).map(item => [Number(item.id), item]));
  count.textContent = String(uniqueItems.size);
  if (loading) {
    summary.textContent = "Comparing successful deployments…";
    list.replaceChildren(...Array.from({ length: 2 }, () => {
      const skeleton = document.createElement("div");
      skeleton.className = "comment-skeleton release-debug-skeleton";
      return skeleton;
    }));
    return;
  }
  const statuses = [...uniqueItems.values()].map(item => readinessState(item, lane));
  const ready = statuses.filter(status => status.ready).length;
  const attention = statuses.length - ready;
  summary.innerHTML = uniqueItems.size
    ? `<strong>${ready} ready</strong><span>·</span><strong>${attention} need attention</strong><span>Based on the current Azure DevOps state</span>`
    : "No linked stories or bugs found between these environments.";
  if (!groups.length) {
    const empty = document.createElement("div");
    empty.className = "release-readiness-empty";
    empty.textContent = "No releasable difference was found. Pipelines without recognizable environment names are not included.";
    list.replaceChildren(empty);
    return;
  }
  list.replaceChildren(...groups.map(group => createReadinessPipeline(group, lane)));
}

function renderReleaseReadiness(loading = false) {
  const readiness = state.releaseReadiness;
  els.releaseReadinessStatus.classList.toggle("is-error", Boolean(readiness.error));
  els.releaseReadinessStatus.textContent = loading ? "Loading…" : readiness.error || (readiness.loaded ? `Checked ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date())}` : "");
  const notices = [...readiness.warnings];
  if (readiness.error) notices.unshift(readiness.error);
  els.releaseReadinessNotice.hidden = !notices.length;
  els.releaseReadinessNotice.textContent = notices.join(" ");
  renderReadinessLane("development", readiness.development, loading);
  renderReadinessLane("acceptance", readiness.acceptance, loading);
}

function releaseDebugElements(key) {
  const values = {
    classic: [els.classicReleasesCount, els.classicReleasesStatus, els.classicReleasesList],
    yamlRuns: [els.yamlRunsCount, els.yamlRunsStatus, els.yamlRunsList],
    yamlDeployments: [els.yamlDeploymentsCount, els.yamlDeploymentsStatus, els.yamlDeploymentsList]
  };
  return values[key];
}

function renderReleaseDebugSection(key, loading = false) {
  const [count, status, list] = releaseDebugElements(key);
  const deployments = state.releaseDebug[key];
  const error = state.releaseDebug.errors[key] || "";
  count.textContent = String(deployments.length);
  status.classList.toggle("is-error", Boolean(error));
  if (loading) {
    status.textContent = "Loading…";
    list.replaceChildren(...Array.from({ length: 2 }, () => {
      const skeleton = document.createElement("div");
      skeleton.className = "comment-skeleton release-debug-skeleton";
      return skeleton;
    }));
    return;
  }
  status.textContent = error || (!deployments.length ? "No results returned by this source." : "");
  list.replaceChildren(...deployments.map(createWorkItemDeploymentEntry));
}

function renderReleaseDebugPage() {
  ["classic", "yamlRuns", "yamlDeployments"].forEach(key => renderReleaseDebugSection(key));
  renderReleaseReadiness();
}

async function loadReleaseDebugPage(force = false) {
  if (!state.pat) {
    showConnection();
    return;
  }
  if (state.releaseDebug.loaded && state.releaseReadiness.loaded && !force) {
    renderReleaseDebugPage();
    return;
  }
  const requestToken = ++state.releaseDebug.requestToken;
  state.releaseDebug.environmentsPromise = null;
  state.releaseDebug.classicReleaseDetailsPromise = null;
  if (force) {
    state.releaseReadiness.githubComparisons.clear();
    state.releaseReadiness.githubRepositoryMatches.clear();
  }
  const sources = [
    { key: "classic", load: loadLatestClassicReleases },
    { key: "yamlRuns", load: loadLatestYamlRuns },
    { key: "yamlDeployments", load: loadLatestYamlEnvironmentDeployments }
  ];
  sources.forEach(source => {
    state.releaseDebug[source.key] = [];
    delete state.releaseDebug.errors[source.key];
    renderReleaseDebugSection(source.key, true);
  });
  state.releaseReadiness.development = [];
  state.releaseReadiness.acceptance = [];
  state.releaseReadiness.warnings = [];
  state.releaseReadiness.error = "";
  state.releaseReadiness.loaded = false;
  renderReleaseReadiness(true);
  els.releasesRefresh.disabled = true;
  const readinessPromise = (async () => {
    try {
      const readiness = await loadReleaseReadiness();
      if (requestToken !== state.releaseDebug.requestToken) return;
      state.releaseReadiness.development = readiness.development;
      state.releaseReadiness.acceptance = readiness.acceptance;
      state.releaseReadiness.warnings = readiness.warnings;
      state.releaseReadiness.error = "";
    } catch (error) {
      if (requestToken !== state.releaseDebug.requestToken) return;
      console.error(error);
      state.releaseReadiness.development = [];
      state.releaseReadiness.acceptance = [];
      state.releaseReadiness.error = error.message || "Release readiness could not be loaded.";
    }
    if (requestToken === state.releaseDebug.requestToken) {
      state.releaseReadiness.loaded = true;
      renderReleaseReadiness();
    }
  })();
  await Promise.all([...sources.map(async source => {
    try {
      const deployments = await source.load();
      if (requestToken !== state.releaseDebug.requestToken) return;
      state.releaseDebug[source.key] = deployments;
      delete state.releaseDebug.errors[source.key];
    } catch (error) {
      if (requestToken !== state.releaseDebug.requestToken) return;
      console.error(error);
      state.releaseDebug[source.key] = [];
      state.releaseDebug.errors[source.key] = error.message || "This release source could not be loaded.";
    }
    if (requestToken === state.releaseDebug.requestToken) renderReleaseDebugSection(source.key);
  }), readinessPromise]);
  if (requestToken !== state.releaseDebug.requestToken) return;
  state.releaseDebug.loaded = true;
  els.releasesRefresh.disabled = false;
}

async function loadYamlWorkItemDeployments(references) {
  const uniqueReferences = new Map(references.map(reference => [
    `${reference.projectId}:${reference.buildId}`,
    reference
  ]));
  const loadedRuns = await mapWithConcurrency([...uniqueReferences.values()], 4, async reference => {
    try {
      const build = await azure(`/_apis/build/builds/${reference.buildId}?api-version=7.1`);
      const timeline = await azure(`/_apis/build/builds/${reference.buildId}/timeline?api-version=7.1`);
      return { build, timeline, reference };
    } catch (error) {
      if (error.status === 404) return null;
      if (error.auth) {
        const buildError = new Error("The PAT requires ‘Build: Read’ to load YAML pipeline stages.");
        buildError.auth = true;
        throw buildError;
      }
      throw error;
    }
  });
  const runs = loadedRuns.filter(run => run && yamlStageRecords(run.timeline).length);
  if (!runs.length) return [];
  let environmentsByBuildId = new Map();
  let environmentError = "";
  try {
    environmentsByBuildId = await loadYamlEnvironmentDeployments(runs.map(run => run.build));
  } catch (error) {
    console.warn("Azure DevOps environments could not be loaded.", error);
    environmentError = error.auth
      ? "Real Azure DevOps environments could not be loaded. The PAT requires ‘Build: Read’."
      : error.message || "Real Azure DevOps environments could not be loaded.";
  }
  return runs.map(run => normalizeYamlDeployment(
    run.build,
    run.timeline,
    run.reference,
    environmentsByBuildId.get(Number(run.build.id)) || [],
    environmentError
  )).filter(Boolean);
}

async function loadDeploymentsForWorkItem(references) {
  const classicReferences = references.filter(reference => reference.sourceType === "classic");
  const yamlReferences = references.filter(reference => reference.sourceType === "yaml");
  const sources = [
    { type: "classic", references: classicReferences, load: loadClassicWorkItemDeployments },
    { type: "yaml", references: yamlReferences, load: loadYamlWorkItemDeployments }
  ].filter(source => source.references.length);
  const results = await Promise.allSettled(sources.map(source => source.load(source.references)));
  const deployments = [];
  const errors = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") deployments.push(...result.value);
    else {
      const source = sources[index];
      const fallback = source.type === "yaml"
        ? "YAML pipeline stages could not be loaded."
        : "Classic releases could not be loaded.";
      errors.push(result.reason?.message || fallback);
    }
  });
  deployments.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  return { deployments, errors };
}

async function loadWorkItemDeployments(item, references, sourceKey) {
  const requestToken = (state.workItemDeploymentsRequestTokens.get(item.id) || 0) + 1;
  state.workItemDeploymentsRequestTokens.set(item.id, requestToken);
  try {
    const result = await loadDeploymentsForWorkItem(references);
    if (state.workItemDeploymentsRequestTokens.get(item.id) !== requestToken
        || state.workItemDeploymentSourceKeys.get(item.id) !== sourceKey) return;
    const errors = [
      ...result.errors,
      state.workItemYamlDiscoveryErrors.get(item.id)
    ].filter(Boolean);
    state.workItemDeploymentsCache.set(item.id, result.deployments);
    if (errors.length) state.workItemDeploymentsErrors.set(item.id, errors.join(" "));
    else state.workItemDeploymentsErrors.delete(item.id);
    if (isSelectedWorkItem(item.id)) {
      renderWorkItemDeployments(result.deployments, false, errors.join(" "));
      renderCombinedActivity();
    }
  } catch (error) {
    if (state.workItemDeploymentsRequestTokens.get(item.id) !== requestToken
        || state.workItemDeploymentSourceKeys.get(item.id) !== sourceKey) return;
    console.error(error);
    state.workItemDeploymentsErrors.set(item.id, error.auth
      ? "Releases could not be loaded. The PAT requires ‘Release: Read’."
      : error.message || "Releases could not be loaded.");
    if (isSelectedWorkItem(item.id)) {
      renderWorkItemDeployments([], false, state.workItemDeploymentsErrors.get(item.id));
      renderCombinedActivity();
    }
  }
}

function isSelectedWorkItem(itemId) {
  return state.selectedItemId === itemId && els.workItemDialog.open;
}

function normalizeWorkItemAttachments(item) {
  if (!Array.isArray(item.relations)) return state.detailsCache.get(item.id)?.attachments || [];
  return item.relations.filter(relation => relation.rel === "AttachedFile").map(relation => {
    const attributes = relation.attributes || {};
    let url = "";
    let fallbackName = "";
    try {
      const attachmentUrl = new URL(relation.url);
      fallbackName = attachmentUrl.searchParams.get("fileName") || "";
      if (!attachmentUrl.searchParams.has("api-version")) attachmentUrl.searchParams.set("api-version", "7.1");
      if (!attachmentUrl.searchParams.has("fileName") && attributes.name) attachmentUrl.searchParams.set("fileName", attributes.name);
      attachmentUrl.searchParams.set("download", "true");
      url = isConfiguredAzureUrl(attachmentUrl.href) ? attachmentUrl.href : "";
    } catch {}
    const name = String(attributes.name || fallbackName || "Attachment");
    return {
      id: String(attributes.id || relation.url || name),
      name,
      url,
      size: Number(attributes.resourceSize) || 0,
      createdDate: attributes.resourceCreatedDate || attributes.authorizedDate || "",
      comment: String(attributes.comment || "")
    };
  }).filter(attachment => attachment.url);
}

function normalizeWorkItemChildIds(item) {
  if (!Array.isArray(item.relations)) return state.detailsCache.get(item.id)?.childIds || [];
  return item.relations.filter(relation => relation.rel === "System.LinkTypes.Hierarchy-Forward").map(relation => {
    const match = String(relation.url || "").match(/\/workitems\/(\d+)(?:[/?]|$)/i);
    return match ? Number(match[1]) : null;
  }).filter(Boolean);
}

function normalizeWorkItemDeploymentReferences(item) {
  if (!Array.isArray(item.relations)) return state.detailsCache.get(item.id)?.deploymentReferences || [];
  const references = new Map();
  item.relations.forEach(relation => {
    if (relation.rel !== "ArtifactLink") return;
    let relationUrl = String(relation.url || "");
    try { relationUrl = decodeURIComponent(relationUrl); } catch {}
    const classicMatch = relationUrl.match(/^vstfs:\/\/\/ReleaseManagement\/ReleaseEnvironment\/([^:]+):(\d+):(\d+)$/i);
    if (classicMatch) {
      const reference = {
        sourceType: "classic",
        projectId: classicMatch[1],
        releaseId: Number(classicMatch[2]),
        environmentId: Number(classicMatch[3])
      };
      references.set(`${reference.sourceType}:${reference.projectId}:${reference.releaseId}:${reference.environmentId}`, reference);
      return;
    }
    const buildMatch = relationUrl.match(/^vstfs:\/\/\/Build\/Build\/(\d+)$/i);
    if (!buildMatch) return;
    const reference = {
      sourceType: "yaml",
      projectId: activeAzureContext().project,
      buildId: Number(buildMatch[1])
    };
    references.set(`${reference.sourceType}:${reference.projectId}:${reference.buildId}`, reference);
  });
  return [...references.values()];
}

function normalizeWorkItemDetail(item) {
  const fields = item.fields || {};
  const assigned = fields["System.AssignedTo"];
  const reporter = fields["System.CreatedBy"];
  const storyPoints = fields["Microsoft.VSTS.Scheduling.StoryPoints"];
  const effort = fields["Microsoft.VSTS.Scheduling.Effort"];
  return {
    descriptionHtml: fields["System.Description"] || "",
    acceptanceCriteriaHtml: fields["Microsoft.VSTS.Common.AcceptanceCriteria"] || "",
    reproStepsHtml: fields["Microsoft.VSTS.TCM.ReproSteps"] || "",
    systemInfoHtml: fields["Microsoft.VSTS.TCM.SystemInfo"] || "",
    assignee: assigned?.displayName || assigned?.uniqueName || "",
    assigneeUniqueName: assigned?.uniqueName || assigned?.displayName || "",
    assigneeId: assigned?.id || "",
    reporter: reporter?.displayName || reporter?.uniqueName || "",
    priority: fields["Microsoft.VSTS.Common.Priority"] ?? null,
    points: storyPoints ?? effort ?? null,
    pointsField: storyPoints !== undefined ? "Microsoft.VSTS.Scheduling.StoryPoints"
      : effort !== undefined ? "Microsoft.VSTS.Scheduling.Effort" : "",
    area: fields["System.AreaPath"] || "",
    iteration: fields["System.IterationPath"] || "",
    reason: fields["System.Reason"] || "",
    tags: String(fields["System.Tags"] || "").split(";").map(tag => tag.trim()).filter(Boolean),
    changedDate: fields["System.ChangedDate"] || "",
    parentId: fields["System.Parent"] || null,
    parent: state.detailsCache.get(item.id)?.parent || null,
    parentError: "",
    attachments: normalizeWorkItemAttachments(item),
    childIds: normalizeWorkItemChildIds(item),
    deploymentReferences: normalizeWorkItemDeploymentReferences(item),
    subtasks: state.detailsCache.get(item.id)?.subtasks || [],
    subtasksError: ""
  };
}

function normalizeComments(result) {
  const comments = result.comments || result.value || [];
  return comments.filter(comment => !comment.isDeleted).map(normalizeComment);
}

function normalizeComment(comment) {
  return {
    id: comment.commentId ?? comment.id,
    author: comment.createdBy?.displayName || comment.createdBy?.uniqueName || "Unknown user",
    authorId: comment.createdBy?.id || "",
    authorUniqueName: comment.createdBy?.uniqueName || "",
    html: comment.renderedText || comment.text || "",
    createdDate: comment.createdDate || "",
    modifiedDate: comment.modifiedDate || ""
  };
}

function normalizeHistory(result) {
  return (result.value || []).map(normalizeHistoryUpdate)
    .filter(entry => entry.created || entry.changes.length)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function normalizeHistoryUpdate(update) {
  const changes = Object.entries(update.fields || {}).flatMap(([field, change]) => {
    const label = HISTORY_FIELDS[field] || (field.startsWith("Custom.") ? humanizeField(field.slice(7)) : "");
    if (!label) return [];
    return [{
      label,
      compact: ["System.Description", "Microsoft.VSTS.Common.AcceptanceCriteria", "Microsoft.VSTS.TCM.ReproSteps", "Microsoft.VSTS.TCM.SystemInfo"].includes(field),
      oldValue: formatHistoryValue(change.oldValue),
      newValue: formatHistoryValue(change.newValue)
    }];
  });
  return {
    id: update.id,
    revision: update.rev,
    author: update.revisedBy?.displayName || update.revisedBy?.uniqueName || "Unknown user",
    authorId: update.revisedBy?.id || "",
    authorUniqueName: update.revisedBy?.uniqueName || "",
    date: historyDateFor(update),
    created: update.rev === 1,
    changes
  };
}

function historyDateFor(update) {
  const changedDate = update.fields?.["System.ChangedDate"]?.newValue;
  for (const value of [changedDate, update.revisedDate]) {
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime()) && date.getUTCFullYear() < 9000) return value;
  }
  return "";
}

function formatHistoryValue(value) {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "object") return value.displayName || value.uniqueName || "Updated";
  const rawText = String(value).trim();
  const text = /<[a-z][\s\S]*>/i.test(rawText) ? htmlToText(rawText) : rawText;
  return text.length > 90 ? `${text.slice(0, 87)}…` : text;
}

function humanizeField(value) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[._-]+/g, " ");
}

function formatAttachmentSize(bytes) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = unit && value < 10 ? 1 : 0;
  return `${value.toFixed(digits)} ${units[unit]}`;
}

function attachmentType(name) {
  const extension = String(name).split(".").pop()?.toLocaleUpperCase("en") || "";
  return extension && extension !== String(name).toLocaleUpperCase("en") && extension.length <= 5 ? extension : "FILE";
}

function isBugWorkItem(item) {
  return String(item?.type || "").trim().toLocaleLowerCase("en") === "bug";
}

function isUserStoryWorkItem(item) {
  return String(item?.type || "").trim().toLocaleLowerCase("en") === "user story";
}

function renderWorkItemAttachments(attachments = []) {
  els.workItemAttachmentsSection.hidden = !attachments.length;
  els.workItemAttachmentCount.textContent = String(attachments.length);
  if (!attachments.length) return els.workItemAttachments.replaceChildren();
  els.workItemAttachments.replaceChildren(...attachments.map(attachment => {
    const link = document.createElement("a");
    link.className = "work-item-attachment";
    link.href = attachment.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `${attachment.name}. Open attachment in Azure DevOps.`);
    const icon = document.createElement("span");
    icon.className = "work-item-attachment-icon";
    icon.textContent = attachmentType(attachment.name);
    const body = document.createElement("span");
    body.className = "work-item-attachment-body";
    const name = document.createElement("strong");
    name.textContent = attachment.name;
    const metadata = document.createElement("small");
    metadata.textContent = [formatAttachmentSize(attachment.size), formatDateTime(attachment.createdDate)].filter(Boolean).join(" · ") || "Stored in Azure DevOps";
    body.append(name, metadata);
    if (attachment.comment) {
      const comment = document.createElement("span");
      comment.className = "work-item-attachment-comment";
      comment.textContent = attachment.comment;
      body.append(comment);
    }
    const external = document.createElement("span");
    external.className = "work-item-attachment-external";
    external.textContent = "↗";
    external.setAttribute("aria-hidden", "true");
    link.append(icon, body, external);
    return link;
  }));
}

function subtaskPriority(priority) {
  if (priority === 1) return { symbol: "↑↑", label: "Priority 1", tone: "highest" };
  if (priority === 2) return { symbol: "↑", label: "Priority 2", tone: "high" };
  if (priority === 3) return { symbol: "→", label: "Priority 3", tone: "medium" };
  if (priority === 4) return { symbol: "↓", label: "Priority 4", tone: "low" };
  return { symbol: "—", label: "No priority", tone: "none" };
}

function renderWorkItemSubtasks(subtasks = [], error = "") {
  const visible = Boolean(subtasks.length || error);
  els.workItemSubtasksSection.hidden = !visible;
  if (!visible) {
    els.workItemSubtasks.replaceChildren();
    els.workItemSubtasksStatus.textContent = "";
    return;
  }
  const done = subtasks.filter(isFinishedWorkItem).length;
  const percentage = subtasks.length ? Math.round((done / subtasks.length) * 100) : 0;
  els.workItemSubtasksProgress.style.width = `${percentage}%`;
  els.workItemSubtasksProgressLabel.textContent = `${percentage}% Done`;
  els.workItemSubtasksStatus.classList.toggle("is-error", Boolean(error));
  els.workItemSubtasksStatus.textContent = error;
  els.workItemSubtasks.replaceChildren(...subtasks.map(task => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "work-item-subtask";
    row.setAttribute("aria-label", `Open child work item ${workItemKey(task.id)}: ${task.title}`);
    const icon = document.createElement("span");
    icon.className = "work-item-subtask-icon";
    icon.textContent = "▣";
    const key = document.createElement("span");
    key.className = "work-item-subtask-key";
    key.textContent = workItemKey(task.id);
    const title = document.createElement("span");
    title.className = "work-item-subtask-title";
    title.textContent = task.title;
    const priorityValue = subtaskPriority(task.priority);
    const priority = document.createElement("span");
    priority.className = "work-item-subtask-priority";
    priority.dataset.priorityTone = priorityValue.tone;
    priority.textContent = priorityValue.symbol;
    priority.title = priorityValue.label;
    const taskState = document.createElement("span");
    taskState.className = "card-state work-item-subtask-state";
    taskState.dataset.stateTone = stateTone(task.state);
    taskState.textContent = task.state;
    row.append(icon, key, title, priority, taskState);
    row.addEventListener("click", () => showWorkItem(task));
    return row;
  }));
}

function renderWorkItemParent(item, detail) {
  const parent = detail?.parent || null;
  const parentId = detail?.parentId || item.parentId;
  if (!parentId) {
    els.workItemParent.textContent = "No parent";
    return;
  }
  const button = document.createElement("button");
  button.type = "button";
  button.className = "work-item-parent-link";
  button.textContent = parent
    ? `${parent.type} ${workItemKey(parent.id)} · ${parent.title}`
    : item.featureLabel || workItemKey(parentId);
  button.setAttribute("aria-label", `Open parent work item ${workItemKey(parentId)}${parent ? `: ${parent.title}` : ""}`);
  button.title = detail?.parentError || "Open parent work item";
  button.addEventListener("click", () => parent ? showWorkItem(parent) : showLinkedWorkItem(parentId));
  els.workItemParent.replaceChildren(button);
}

function renderWorkItemDetail(item, detail, loading = false, error = "") {
  const { webBase } = activeAzureContext();
  const bug = isBugWorkItem(item);
  const userStory = isUserStoryWorkItem(item);
  els.workItemType.textContent = item.type;
  els.workItemKey.textContent = workItemKey(item.id);
  els.workItemTitle.textContent = item.title;
  els.workItemState.textContent = item.state;
  els.workItemState.dataset.stateTone = stateTone(item.state);
  els.workItemState.setAttribute("aria-label", `State ${item.state}. Click to change.`);
  els.workItemReason.textContent = detail?.reason || "";
  els.workItemReason.hidden = !detail?.reason;
  els.descriptionHeading.textContent = bug ? "Repro steps" : "Description";
  els.descriptionEditButton.title = bug ? "Edit repro steps" : "Edit description";
  els.descriptionEditButton.setAttribute("aria-label", bug ? "Edit repro steps" : "Edit description");
  setRichContent(
    els.workItemDescription,
    bug ? detail?.reproStepsHtml : detail?.descriptionHtml,
    loading ? `Loading ${bug ? "repro steps" : "description"}…` : bug ? "No repro steps added." : "No description added."
  );
  els.workItemAcceptanceCriteriaSection.hidden = !userStory;
  if (userStory) {
    setRichContent(
      els.workItemAcceptanceCriteria,
      detail?.acceptanceCriteriaHtml,
      loading ? "Loading acceptance criteria…" : "No acceptance criteria added."
    );
  }
  els.workItemSystemInfoSection.hidden = !bug;
  if (bug) setRichContent(els.workItemSystemInfo, detail?.systemInfoHtml, loading ? "Loading system information…" : "No system information added.");
  renderWorkItemAttachments(detail?.attachments || []);
  renderWorkItemSubtasks(detail?.subtasks || [], detail?.subtasksError || "");
  els.descriptionEditButton.disabled = loading;
  els.acceptanceCriteriaEditButton.disabled = loading;
  els.systemInfoEditButton.disabled = loading;
  els.workItemAssignee.textContent = detail?.assignee || item.assignee || "Unassigned";
  els.workItemAssignee.setAttribute("aria-label", `Assigned to ${detail?.assignee || item.assignee || "Unassigned"}. Click to change.`);
  els.workItemReporter.textContent = detail?.reporter || "—";
  els.workItemPriority.textContent = detail?.priority ?? "—";
  els.workItemPoints.textContent = detail?.points ?? item.points ?? "—";
  els.workItemArea.textContent = detail?.area || item.area || "—";
  els.workItemIteration.textContent = detail?.iteration || state.iteration?.name || "—";
  els.workItemPriority.setAttribute("aria-label", `Priority ${detail?.priority ?? "not set"}. Click to change.`);
  els.workItemPoints.setAttribute("aria-label", `Story points ${detail?.points ?? item.points ?? "not set"}. Click to change.`);
  els.workItemArea.setAttribute("aria-label", `Area ${detail?.area || item.area || "not set"}. Click to change.`);
  els.workItemIteration.setAttribute("aria-label", `Sprint ${detail?.iteration || state.iteration?.name || "not set"}. Click to change.`);
  renderWorkItemParent(item, detail);
  renderDetailTags(detail?.tags || item.tags);
  els.workItemTags.setAttribute("aria-label", `Tags: ${(detail?.tags || item.tags || []).join(", ") || "none"}. Click to change.`);
  els.workItemChanged.textContent = detail?.changedDate ? formatDateTime(detail.changedDate) : "—";
  els.workItemLoading.classList.toggle("is-active", loading);
  els.workItemLoadStatus.textContent = error || (loading ? "Loading additional details…" : "");
  els.workItemLoadStatus.classList.toggle("is-error", Boolean(error));
  els.openInAzure.href = `${webBase}/_workitems/edit/${item.id}`;
}

function assigneeChoices(item) {
  const choices = state.teamMembers.length
    ? [...state.teamMembers]
    : [...state.stories, ...state.backlogItems]
      .filter(story => story.assignee)
      .map(story => ({ name: story.assignee, uniqueName: story.assigneeUniqueName || story.assignee }));
  const detail = state.detailsCache.get(item.id);
  const currentName = detail?.assignee || item.assignee || "";
  if (currentName && !choices.some(choice => choice.name === currentName || choice.uniqueName === currentName)) {
    choices.push({ name: currentName, uniqueName: detail?.assigneeUniqueName || item.assigneeUniqueName || currentName });
  }
  const seen = new Set();
  return choices.filter(choice => {
    const key = String(choice.uniqueName || choice.name).trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base", numeric: true }));
}

function toggleWorkItemAssigneeMenu() {
  if (!els.workItemAssigneeMenu.hidden) return closeWorkItemAssigneeMenu();
  const item = selectedWorkItem();
  if (!item) return;
  closeWorkItemStateMenu();
  closeWorkItemTagsMenu();
  closeWorkItemDetailFieldMenus();
  els.workItemAssigneeMenu.hidden = false;
  els.workItemAssignee.setAttribute("aria-expanded", "true");
  els.workItemAssigneeSearch.value = "";
  els.workItemAssigneeSource.textContent = state.teamMembers.length ? "Team members" : "Users in this sprint";
  renderWorkItemAssigneeOptions(item);
  requestAnimationFrame(() => els.workItemAssigneeSearch.focus());
}

function renderWorkItemAssigneeOptions(item) {
  const detail = state.detailsCache.get(item.id);
  const currentName = detail?.assignee || item.assignee || "";
  const query = els.workItemAssigneeSearch.value.trim().toLocaleLowerCase("en");
  const choices = assigneeChoices(item).filter(choice => !query
    || choice.name.toLocaleLowerCase("en").includes(query)
    || choice.uniqueName.toLocaleLowerCase("en").includes(query));
  const options = [];
  if (!query || "unassigned".includes(query)) {
    options.push(createAssigneeOption(item, null, currentName === ""));
  }
  options.push(...choices.map(choice => createAssigneeOption(item, choice, choice.name === currentName || choice.uniqueName === currentName)));
  if (!options.length) {
    const empty = document.createElement("div");
    empty.className = "issue-assignee-empty";
    empty.textContent = "No users found.";
    options.push(empty);
  }
  els.workItemAssigneeOptions.replaceChildren(...options);
}

function createAssigneeOption(item, choice, selected) {
  const name = choice?.name || "Unassigned";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "issue-assignee-option";
  button.setAttribute("role", "option");
  button.setAttribute("aria-selected", String(selected));
  button.disabled = selected;
  const avatar = document.createElement("span");
  avatar.className = `issue-assignee-avatar${choice ? "" : " is-unassigned"}`;
  avatar.textContent = choice ? initialsFor(name) : "×";
  const label = document.createElement("span");
  label.className = "issue-assignee-label";
  const primary = document.createElement("strong");
  primary.textContent = name;
  label.append(primary);
  if (choice?.uniqueName && choice.uniqueName !== choice.name) {
    const secondary = document.createElement("small");
    secondary.textContent = choice.uniqueName;
    label.append(secondary);
  }
  const check = document.createElement("span");
  check.className = "issue-assignee-check";
  check.textContent = selected ? "✓" : "";
  button.append(avatar, label, check);
  if (!selected) button.addEventListener("click", () => changeWorkItemAssignee(item, choice));
  return button;
}

function initialsFor(name) {
  return String(name || "?").split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
}

function closeWorkItemAssigneeMenu() {
  els.workItemAssigneeMenu.hidden = true;
  els.workItemAssignee.setAttribute("aria-expanded", "false");
}

async function changeWorkItemAssignee(item, choice) {
  closeWorkItemAssigneeMenu();
  const nextName = choice?.name || "Unassigned";
  els.workItemAssignee.disabled = true;
  els.workItemAssignee.classList.add("is-saving");
  els.workItemLoadStatus.textContent = `Changing assignee to ${nextName}…`;
  els.workItemLoadStatus.classList.remove("is-error");
  try {
    const operation = choice
      ? { op: "add", path: "/fields/System.AssignedTo", value: choice.uniqueName }
      : { op: "add", path: "/fields/System.AssignedTo", value: "" };
    const result = await azure(`/_apis/wit/workitems/${item.id}?api-version=7.1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json-patch+json" },
      body: JSON.stringify([operation])
    });
    state.detailsRequestTokens.set(item.id, (state.detailsRequestTokens.get(item.id) || 0) + 1);
    const assigned = result.fields?.["System.AssignedTo"];
    item.assignee = assigned?.displayName || assigned?.uniqueName || "";
    item.assigneeUniqueName = assigned?.uniqueName || assigned?.displayName || "";
    item.assigneeId = assigned?.id || "";
    let detail = state.detailsCache.get(item.id);
    if (!detail) {
      detail = normalizeWorkItemDetail(result);
      state.detailsCache.set(item.id, detail);
    }
    if (detail) {
      detail.assignee = item.assignee;
      detail.assigneeUniqueName = item.assigneeUniqueName;
      detail.assigneeId = item.assigneeId;
      detail.changedDate = result.fields?.["System.ChangedDate"] || detail.changedDate;
    }
    state.historyCache.delete(item.id);
    state.historyErrors.delete(item.id);
    pruneFilters();
    render();
    if (isSelectedWorkItem(item.id)) {
      renderWorkItemDetail(item, detail || null, false);
      els.workItemLoadStatus.textContent = `Assignee changed to ${item.assignee || "Unassigned"}.`;
      renderHistory([], true);
      renderCombinedActivity();
      loadWorkItemHistory(item);
    }
  } catch (error) {
    console.error(error);
    els.workItemLoadStatus.textContent = error.auth
      ? "The assignee could not be changed. The PAT requires ‘Work Items: Read & write’."
      : error.message || "The assignee could not be changed.";
    els.workItemLoadStatus.classList.add("is-error");
  } finally {
    els.workItemAssignee.disabled = false;
    els.workItemAssignee.classList.remove("is-saving");
  }
}

function stateTone(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  return STATE_TONES[normalized] || "neutral";
}

async function toggleWorkItemStateMenu() {
  if (!els.workItemStateMenu.hidden) {
    closeWorkItemStateMenu();
    return;
  }
  const item = selectedWorkItem();
  if (!item) return;
  closeWorkItemAssigneeMenu();
  closeWorkItemTagsMenu();
  closeWorkItemDetailFieldMenus();
  els.workItemStateMenu.hidden = false;
  els.workItemState.setAttribute("aria-expanded", "true");
  const loading = document.createElement("div");
  loading.className = "issue-state-menu-message";
  loading.textContent = "Loading states…";
  els.workItemStateOptions.replaceChildren(loading);
  try {
    let pending = state.workItemTypeStatesCache.get(item.type);
    if (!pending) {
      pending = azure(`/_apis/wit/workitemtypes/${encodeURIComponent(item.type)}/states?api-version=7.1`)
        .then(result => result.value || []);
      state.workItemTypeStatesCache.set(item.type, pending);
      pending.catch(() => state.workItemTypeStatesCache.delete(item.type));
    }
    const options = await pending;
    if (state.selectedItemId === item.id && !els.workItemStateMenu.hidden) renderWorkItemStateOptions(item, options);
  } catch (error) {
    console.error(error);
    const message = document.createElement("div");
    message.className = "issue-state-menu-message is-error";
    message.textContent = "States could not be loaded.";
    els.workItemStateOptions.replaceChildren(message);
  }
}

function renderWorkItemStateOptions(item, options) {
  const states = options.length ? options : [{ name: item.state, color: "0052cc" }];
  els.workItemStateOptions.replaceChildren(...states.map(option => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "issue-state-option";
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", String(option.name === item.state));
    button.disabled = option.name === item.state;
    const dot = document.createElement("span");
    dot.className = "issue-state-dot";
    dot.style.backgroundColor = /^[0-9a-f]{6}$/i.test(option.color || "") ? `#${option.color}` : "#6b778c";
    const label = document.createElement("span");
    label.textContent = option.name;
    const check = document.createElement("span");
    check.className = "issue-state-check";
    check.textContent = option.name === item.state ? "✓" : "";
    button.append(dot, label, check);
    if (!button.disabled) button.addEventListener("click", () => changeWorkItemState(item, option.name));
    return button;
  }));
}

function closeWorkItemStateMenu() {
  els.workItemStateMenu.hidden = true;
  els.workItemState.setAttribute("aria-expanded", "false");
}

async function changeWorkItemState(item, nextState) {
  if (!nextState || nextState === item.state) return closeWorkItemStateMenu();
  closeWorkItemStateMenu();
  els.workItemState.disabled = true;
  els.workItemState.classList.add("is-saving");
  els.workItemLoadStatus.textContent = `Changing state to ${nextState}…`;
  els.workItemLoadStatus.classList.remove("is-error");
  try {
    const result = await azure(`/_apis/wit/workitems/${item.id}?api-version=7.1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json-patch+json" },
      body: JSON.stringify([{ op: "add", path: "/fields/System.State", value: nextState }])
    });
    const fields = result.fields || {};
    item.state = fields["System.State"] || nextState;
    state.knownStates.add(item.state);
    if (!state.mapping[item.state]) addSmartMappings();
    const detail = state.detailsCache.get(item.id);
    if (detail) {
      detail.reason = fields["System.Reason"] || detail.reason;
      detail.changedDate = fields["System.ChangedDate"] || detail.changedDate;
    }
    state.historyCache.delete(item.id);
    state.historyErrors.delete(item.id);
    pruneFilters();
    render();
    if (isSelectedWorkItem(item.id)) {
      renderWorkItemDetail(item, detail || null, false);
      els.workItemLoadStatus.textContent = `State changed to ${item.state}.`;
      renderHistory([], true);
      renderCombinedActivity();
      loadWorkItemHistory(item);
    }
  } catch (error) {
    console.error(error);
    els.workItemLoadStatus.textContent = error.auth
      ? "The state could not be changed. The PAT requires ‘Work Items: Read & write’."
      : error.message || "The state could not be changed.";
    els.workItemLoadStatus.classList.add("is-error");
  } finally {
    els.workItemState.disabled = false;
    els.workItemState.classList.remove("is-saving");
  }
}

function renderDetailTags(tags) {
  if (!tags?.length) {
    els.workItemTags.textContent = "—";
    return;
  }
  els.workItemTags.replaceChildren(...tags.map(tag => {
    const chip = document.createElement("span");
    chip.textContent = tag;
    return chip;
  }));
}

function workItemTagsFor(item) {
  return [...(state.detailsCache.get(item.id)?.tags || item.tags || [])];
}

function sprintTagChoices() {
  const tags = state.stories.flatMap(story => story.tags || []);
  return [...new Set(tags.map(tag => tag.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "en"));
}

function toggleWorkItemTagsMenu() {
  if (!els.workItemTagsMenu.hidden) return closeWorkItemTagsMenu();
  const item = selectedWorkItem();
  if (!item) return;
  closeWorkItemStateMenu();
  closeWorkItemAssigneeMenu();
  closeWorkItemDetailFieldMenus();
  els.workItemTagsMenu.hidden = false;
  els.workItemTags.setAttribute("aria-expanded", "true");
  els.workItemTagsInput.value = "";
  renderWorkItemTagsEditor(item);
  requestAnimationFrame(() => els.workItemTagsInput.focus());
}

function renderWorkItemTagsEditor(item) {
  const selectedTags = workItemTagsFor(item);
  els.workItemTagsSelected.replaceChildren(...selectedTags.map(tag => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "issue-tags-selected-chip";
    button.title = `Remove tag ${tag}`;
    const label = document.createElement("span");
    label.textContent = tag;
    const remove = document.createElement("span");
    remove.className = "issue-tags-remove";
    remove.setAttribute("aria-hidden", "true");
    remove.textContent = "×";
    button.append(label, remove);
    button.addEventListener("click", () => updateWorkItemTags(item, selectedTags.filter(value => value !== tag)));
    return button;
  }));
  if (!selectedTags.length) {
    const empty = document.createElement("span");
    empty.className = "issue-tags-selected-empty";
    empty.textContent = "No tags yet";
    els.workItemTagsSelected.append(empty);
  }
  renderWorkItemTagOptions(item);
}

function renderWorkItemTagOptions(item) {
  const selectedTags = workItemTagsFor(item);
  const selectedKeys = new Set(selectedTags.map(tag => tag.toLocaleLowerCase("en")));
  const query = els.workItemTagsInput.value.trim();
  const queryKey = query.toLocaleLowerCase("en");
  const suggestions = sprintTagChoices().filter(tag => !selectedKeys.has(tag.toLocaleLowerCase("en"))
    && (!queryKey || tag.toLocaleLowerCase("en").includes(queryKey)));
  const options = suggestions.map(tag => createWorkItemTagOption(item, tag));
  if (query && !selectedKeys.has(queryKey) && !suggestions.some(tag => tag.toLocaleLowerCase("en") === queryKey)) {
    const add = createWorkItemTagOption(item, query);
    add.classList.add("is-create");
    add.querySelector("span:last-child").textContent = "Add new tag";
    options.unshift(add);
  }
  if (!options.length) {
    const empty = document.createElement("div");
    empty.className = "issue-tags-options-empty";
    empty.textContent = query ? "No other tags found." : "No other sprint tags.";
    options.push(empty);
  }
  els.workItemTagsOptions.replaceChildren(...options);
}

function createWorkItemTagOption(item, tag) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "issue-tags-option";
  const label = document.createElement("strong");
  label.textContent = tag;
  const meta = document.createElement("span");
  meta.textContent = "Add sprint tag";
  button.append(label, meta);
  button.addEventListener("click", () => addWorkItemTag(item, tag));
  return button;
}

function addWorkItemTag(item, rawTag) {
  const tag = String(rawTag || "").trim().replace(/;/g, "");
  if (!tag) return;
  const tags = workItemTagsFor(item);
  if (tags.some(value => value.toLocaleLowerCase("en") === tag.toLocaleLowerCase("en"))) return;
  updateWorkItemTags(item, [...tags, tag]);
}

function closeWorkItemTagsMenu() {
  els.workItemTagsMenu.hidden = true;
  els.workItemTags.setAttribute("aria-expanded", "false");
}

async function updateWorkItemTags(item, nextTags) {
  const currentTags = workItemTagsFor(item);
  const savedTags = [...new Map(nextTags.map(tag => {
    const value = String(tag || "").trim();
    return [value.toLocaleLowerCase("en"), value];
  }).filter(([, value]) => value)).values()];
  els.workItemTagsInput.disabled = true;
  els.workItemTagsMenu.classList.add("is-saving");
  els.workItemLoadStatus.textContent = "Saving tags…";
  els.workItemLoadStatus.classList.remove("is-error");
  try {
    await azure(`/_apis/wit/workitems/${item.id}?api-version=7.1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json-patch+json" },
      body: JSON.stringify([{
        op: currentTags.length ? "replace" : "add",
        path: "/fields/System.Tags",
        value: savedTags.join("; ")
      }])
    });
    state.detailsRequestTokens.set(item.id, (state.detailsRequestTokens.get(item.id) || 0) + 1);
    const verifiedItem = await azure(`/_apis/wit/workitems/${item.id}?api-version=7.1`);
    const detail = normalizeWorkItemDetail(verifiedItem);
    const verifiedTags = detail.tags;
    item.tags = verifiedTags;
    state.detailsCache.set(item.id, detail);
    state.historyCache.delete(item.id);
    state.historyErrors.delete(item.id);
    pruneFilters();
    render();
    if (isSelectedWorkItem(item.id)) {
      renderWorkItemDetail(item, detail || null, false);
      els.workItemLoadStatus.textContent = "Tags saved.";
      els.workItemTagsInput.value = "";
      renderWorkItemTagsEditor(item);
      renderHistory([], true);
      renderCombinedActivity();
      loadWorkItemHistory(item);
    }
    if (tagSetKey(verifiedTags) !== tagSetKey(savedTags)) {
      throw new Error("Azure DevOps did not apply the tag change. The current tags have been reloaded.");
    }
  } catch (error) {
    console.error(error);
    els.workItemLoadStatus.textContent = error.auth
      ? "Tags could not be saved. The PAT requires ‘Work Items: Read & write’."
      : error.message || "Tags could not be saved.";
    els.workItemLoadStatus.classList.add("is-error");
  } finally {
    els.workItemTagsInput.disabled = false;
    els.workItemTagsMenu.classList.remove("is-saving");
    if (!els.workItemTagsMenu.hidden) els.workItemTagsInput.focus();
  }
}

function tagSetKey(tags) {
  return tags.map(tag => tag.trim().toLocaleLowerCase("en")).filter(Boolean).sort().join("\n");
}

const PRIORITY_OPTIONS = [
  { value: 1, label: "Highest" },
  { value: 2, label: "High" },
  { value: 3, label: "Medium" },
  { value: 4, label: "Low" }
];

function selectedWorkItem() {
  return state.selectedItem;
}

function closeWorkItemDetailFieldMenus(except = null) {
  [
    [els.workItemPriority, els.workItemPriorityMenu],
    [els.workItemPoints, els.workItemPointsMenu],
    [els.workItemArea, els.workItemAreaMenu],
    [els.workItemIteration, els.workItemIterationMenu]
  ].forEach(([trigger, menu]) => {
    if (menu === except) return;
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  });
}

function openDetailFieldMenu(trigger, menu) {
  const wasOpen = !menu.hidden;
  closeWorkItemStateMenu();
  closeWorkItemAssigneeMenu();
  closeWorkItemTagsMenu();
  closeWorkItemDetailFieldMenus(menu);
  menu.hidden = wasOpen;
  trigger.setAttribute("aria-expanded", String(!wasOpen));
  return !wasOpen;
}

function toggleWorkItemPriorityMenu() {
  const item = selectedWorkItem();
  if (!item || !openDetailFieldMenu(els.workItemPriority, els.workItemPriorityMenu)) return;
  const current = state.detailsCache.get(item.id)?.priority;
  els.workItemPriorityOptions.replaceChildren(...PRIORITY_OPTIONS.map(option => {
    const button = createDetailFieldOption(`${option.value} · ${option.label}`, Number(current) === option.value);
    if (!button.disabled) button.addEventListener("click", () => updateWorkItemField(item, "Microsoft.VSTS.Common.Priority", option.value, "Priority"));
    return button;
  }));
}

function toggleWorkItemPointsMenu() {
  const item = selectedWorkItem();
  if (!item || !openDetailFieldMenu(els.workItemPoints, els.workItemPointsMenu)) return;
  const current = state.detailsCache.get(item.id)?.points ?? item.points;
  els.workItemPointsInput.value = current ?? "";
  els.workItemPointsQuick.replaceChildren(...[1, 2, 3, 5, 8, 13].map(value => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(value);
    button.className = Number(current) === value ? "is-selected" : "";
    button.addEventListener("click", () => {
      els.workItemPointsInput.value = String(value);
      els.workItemPointsForm.requestSubmit();
    });
    return button;
  }));
  requestAnimationFrame(() => els.workItemPointsInput.select());
}

async function toggleWorkItemAreaMenu() {
  const item = selectedWorkItem();
  if (!item || !openDetailFieldMenu(els.workItemArea, els.workItemAreaMenu)) return;
  els.workItemAreaSearch.value = "";
  renderDetailFieldLoading(els.workItemAreaOptions, "Loading areas…");
  requestAnimationFrame(() => els.workItemAreaSearch.focus());
  try {
    const paths = await loadAreaPaths();
    if (!els.workItemAreaMenu.hidden && state.selectedItemId === item.id) renderAreaOptions(item, paths);
  } catch (error) {
    console.error(error);
    renderDetailFieldError(els.workItemAreaOptions, "Areas could not be loaded.");
  }
}

async function toggleWorkItemIterationMenu() {
  const item = selectedWorkItem();
  if (!item || !openDetailFieldMenu(els.workItemIteration, els.workItemIterationMenu)) return;
  els.workItemIterationSearch.value = "";
  renderDetailFieldLoading(els.workItemIterationOptions, "Loading sprints…");
  requestAnimationFrame(() => els.workItemIterationSearch.focus());
  try {
    const paths = await loadTeamIterations();
    if (!els.workItemIterationMenu.hidden && state.selectedItemId === item.id) renderIterationOptions(item, paths);
  } catch (error) {
    console.error(error);
    renderDetailFieldError(els.workItemIterationOptions, "Sprints could not be loaded.");
  }
}

async function loadAreaPaths() {
  if (!state.areaPathsCache) {
    state.areaPathsCache = azure(`/_apis/wit/classificationnodes/areas?$depth=10&api-version=7.1`)
      .then(root => flattenClassificationPaths(root));
    state.areaPathsCache.catch(() => { state.areaPathsCache = null; });
  }
  return state.areaPathsCache;
}

function flattenClassificationPaths(root) {
  const cleanPath = value => String(value || "").replace(/^\\+/, "");
  const technicalRootPath = cleanPath(root?.path);
  const technicalRootName = String(root?.structureType || root?.name || "");
  const technicalSuffix = `\\${technicalRootName}`;
  const hasTechnicalContainer = /^(area|iteration)$/i.test(technicalRootName)
    && technicalRootPath.toLocaleLowerCase("en").endsWith(technicalSuffix.toLocaleLowerCase("en"));
  const logicalRootPath = hasTechnicalContainer
    ? technicalRootPath.slice(0, -technicalSuffix.length)
    : technicalRootPath;
  const technicalChildPrefix = `${technicalRootPath}\\`;
  const normalizePath = value => {
    const path = cleanPath(value);
    if (!hasTechnicalContainer) return path;
    if (path.toLocaleLowerCase("en") === technicalRootPath.toLocaleLowerCase("en")) return logicalRootPath;
    if (path.toLocaleLowerCase("en").startsWith(technicalChildPrefix.toLocaleLowerCase("en"))) {
      return `${logicalRootPath}\\${path.slice(technicalChildPrefix.length)}`;
    }
    return path;
  };
  const paths = [];
  const visit = node => {
    if (node?.path) paths.push(normalizePath(node.path));
    (node?.children || []).forEach(visit);
  };
  visit(root);
  return [...new Set(paths.filter(Boolean))].sort((a, b) => a.localeCompare(b, "en"));
}

async function loadTeamIterations() {
  if (!state.teamIterationsCache) {
    const team = state.teams.find(value => value.id === state.teamId);
    if (!team) return [];
    state.teamIterationsCache = azure(`/${encodeURIComponent(team.name)}/_apis/work/teamsettings/iterations?api-version=7.1`)
      .then(result => [...(result.value || [])]
        .sort((a, b) => {
          const aDate = new Date(a.attributes?.startDate || a.attributes?.finishDate || 0).getTime();
          const bDate = new Date(b.attributes?.startDate || b.attributes?.finishDate || 0).getTime();
          return bDate - aDate || b.name.localeCompare(a.name, "en", { numeric: true });
        })
        .map(iteration => iteration.path || iteration.name)
        .filter((path, index, paths) => path && paths.indexOf(path) === index));
    state.teamIterationsCache.catch(() => { state.teamIterationsCache = null; });
  }
  return state.teamIterationsCache;
}

function renderAreaOptions(item, paths) {
  renderSearchableDetailOptions({
    item,
    paths,
    query: els.workItemAreaSearch.value,
    current: state.detailsCache.get(item.id)?.area || item.area,
    container: els.workItemAreaOptions,
    field: "System.AreaPath",
    label: "Area"
  });
}

function renderIterationOptions(item, paths) {
  renderSearchableDetailOptions({
    item,
    paths,
    query: els.workItemIterationSearch.value,
    current: state.detailsCache.get(item.id)?.iteration || state.iteration?.path || state.iteration?.name,
    container: els.workItemIterationOptions,
    field: "System.IterationPath",
    label: "Sprint"
  });
}

function renderSearchableDetailOptions({ item, paths, query, current, container, field, label }) {
  const queryKey = query.trim().toLocaleLowerCase("en");
  const filtered = paths.filter(path => !queryKey || path.toLocaleLowerCase("en").includes(queryKey));
  if (!filtered.length) return renderDetailFieldError(container, `No ${label.toLocaleLowerCase("en")} found.`);
  container.replaceChildren(...filtered.map(path => {
    const button = createDetailFieldOption(path, path === current);
    if (!button.disabled) button.addEventListener("click", () => updateWorkItemField(item, field, path, label));
    return button;
  }));
}

function createDetailFieldOption(label, selected = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "issue-detail-field-option";
  button.disabled = selected;
  button.setAttribute("aria-selected", String(selected));
  const text = document.createElement("span");
  text.textContent = label;
  const check = document.createElement("span");
  check.className = "issue-detail-field-check";
  check.textContent = selected ? "✓" : "";
  button.append(text, check);
  return button;
}

function renderDetailFieldLoading(container, message) {
  const node = document.createElement("div");
  node.className = "issue-detail-field-message";
  node.textContent = message;
  container.replaceChildren(node);
}

function renderDetailFieldError(container, message) {
  const node = document.createElement("div");
  node.className = "issue-detail-field-message";
  node.textContent = message;
  container.replaceChildren(node);
}

async function resolvePointsField(item) {
  const known = state.detailsCache.get(item.id)?.pointsField || item.pointsField;
  if (known) return known;
  let pending = state.workItemTypeFieldsCache.get(item.type);
  if (!pending) {
    pending = azure(`/_apis/wit/workitemtypes/${encodeURIComponent(item.type)}/fields?api-version=7.1`)
      .then(result => result.value || []);
    state.workItemTypeFieldsCache.set(item.type, pending);
    pending.catch(() => state.workItemTypeFieldsCache.delete(item.type));
  }
  const fields = await pending;
  const references = new Set(fields.map(field => field.referenceName));
  const preferred = /task/i.test(item.type)
    ? ["Microsoft.VSTS.Scheduling.Effort", "Microsoft.VSTS.Scheduling.StoryPoints"]
    : ["Microsoft.VSTS.Scheduling.StoryPoints", "Microsoft.VSTS.Scheduling.Effort"];
  return preferred.find(reference => references.has(reference)) || "";
}

async function updateWorkItemField(item, field, value, label) {
  closeWorkItemDetailFieldMenus();
  els.workItemLoadStatus.textContent = `Saving ${label.toLocaleLowerCase("en")}…`;
  els.workItemLoadStatus.classList.remove("is-error");
  try {
    await azure(`/_apis/wit/workitems/${item.id}?api-version=7.1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json-patch+json" },
      body: JSON.stringify([{ op: "add", path: `/fields/${field}`, value }])
    });
    state.detailsRequestTokens.set(item.id, (state.detailsRequestTokens.get(item.id) || 0) + 1);
    const verifiedItem = await azure(`/_apis/wit/workitems/${item.id}?api-version=7.1`);
    const normalized = normalizeWorkItem(verifiedItem);
    const detail = normalizeWorkItemDetail(verifiedItem);
    item.points = normalized.points;
    item.pointsField = normalized.pointsField;
    item.priority = normalized.priority;
    item.area = normalized.area;
    item.tags = normalized.tags;
    item.iterationPath = normalized.iterationPath;
    state.detailsCache.set(item.id, detail);
    state.historyCache.delete(item.id);
    state.historyErrors.delete(item.id);
    pruneFilters();
    render();
    if (isSelectedWorkItem(item.id)) {
      renderWorkItemDetail(item, detail, false);
    }
    if (!workItemFieldValueMatches(field, verifiedItem.fields?.[field], value)) {
      throw new Error(`Azure DevOps did not apply the ${label.toLocaleLowerCase("en")} change. The current value has been reloaded.`);
    }
    if (isSelectedWorkItem(item.id)) {
      els.workItemLoadStatus.textContent = `${label} saved.`;
      renderHistory([], true);
      renderCombinedActivity();
      loadWorkItemHistory(item);
    }
  } catch (error) {
    console.error(error);
    els.workItemLoadStatus.textContent = error.auth
      ? `${label} could not be saved. The PAT requires ‘Work Items: Read & write’.`
      : error.message || `${label} could not be saved.`;
    els.workItemLoadStatus.classList.add("is-error");
  }
}

function workItemFieldValueMatches(field, actual, expected) {
  if (["Microsoft.VSTS.Common.Priority", "Microsoft.VSTS.Scheduling.StoryPoints", "Microsoft.VSTS.Scheduling.Effort"].includes(field)) {
    return Number(actual) === Number(expected);
  }
  return String(actual || "").toLocaleLowerCase("en") === String(expected || "").toLocaleLowerCase("en");
}

function openWorkItemTitleEditor() {
  const item = selectedWorkItem();
  if (!item || !els.workItemTitleForm.hidden) return;
  closeWorkItemStateMenu();
  closeWorkItemAssigneeMenu();
  closeWorkItemTagsMenu();
  closeWorkItemDetailFieldMenus();
  els.workItemTitleInput.value = item.title;
  els.workItemTitle.hidden = true;
  els.workItemTitleForm.hidden = false;
  els.workItemTitleStatus.textContent = "";
  els.workItemTitleStatus.classList.remove("is-error");
  requestAnimationFrame(() => els.workItemTitleInput.select());
}

function resetWorkItemTitleEditor() {
  els.workItemTitleForm.hidden = true;
  els.workItemTitle.hidden = false;
  els.workItemTitleInput.value = "";
  els.workItemTitleStatus.textContent = "";
  els.workItemTitleStatus.classList.remove("is-error");
  setWorkItemTitleEditorBusy(false);
}

function setWorkItemTitleEditorBusy(busy) {
  els.workItemTitleInput.disabled = busy;
  els.workItemTitleCancel.disabled = busy;
  els.workItemTitleSubmit.disabled = busy;
  els.workItemTitleSubmit.textContent = busy ? "Saving…" : "Save";
}

async function submitWorkItemTitle(event) {
  event.preventDefault();
  const item = selectedWorkItem();
  const nextTitle = els.workItemTitleInput.value.trim();
  if (!item || !nextTitle) return;
  if (nextTitle === item.title) return resetWorkItemTitleEditor();
  setWorkItemTitleEditorBusy(true);
  els.workItemTitleStatus.textContent = "Saving title…";
  els.workItemTitleStatus.classList.remove("is-error");
  try {
    await azure(`/_apis/wit/workitems/${item.id}?api-version=7.1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json-patch+json" },
      body: JSON.stringify([{ op: "add", path: "/fields/System.Title", value: nextTitle }])
    });
    state.detailsRequestTokens.set(item.id, (state.detailsRequestTokens.get(item.id) || 0) + 1);
    const verifiedItem = await azure(`/_apis/wit/workitems/${item.id}?api-version=7.1`);
    const normalized = normalizeWorkItem(verifiedItem);
    const detail = normalizeWorkItemDetail(verifiedItem);
    item.title = normalized.title;
    state.detailsCache.set(item.id, detail);
    state.historyCache.delete(item.id);
    state.historyErrors.delete(item.id);
    render();
    if (isSelectedWorkItem(item.id)) renderWorkItemDetail(item, detail, false);
    if (item.title !== nextTitle) {
      throw new Error("Azure DevOps did not apply the title change. The current title has been reloaded.");
    }
    resetWorkItemTitleEditor();
    if (isSelectedWorkItem(item.id)) {
      renderWorkItemDetail(item, detail, false);
      els.workItemLoadStatus.textContent = "Title saved.";
      renderHistory([], true);
      renderCombinedActivity();
      loadWorkItemHistory(item);
    }
  } catch (error) {
    console.error(error);
    els.workItemTitleStatus.textContent = error.auth
      ? "The title could not be saved. The PAT requires ‘Work Items: Read & write’."
      : error.message || "The title could not be saved.";
    els.workItemTitleStatus.classList.add("is-error");
    setWorkItemTitleEditorBusy(false);
    els.workItemTitleInput.focus();
  }
}

function mentionChoices() {
  const choices = [];
  if (state.authenticatedUser?.id) choices.push({
    id: state.authenticatedUser.id,
    name: state.authenticatedUser.displayName,
    uniqueName: state.authenticatedUser.uniqueName || ""
  });
  state.teamMembers.forEach(member => choices.push(member));
  [...state.stories, ...state.backlogItems].forEach(item => {
    if (item.assigneeId && item.assignee) choices.push({
      id: item.assigneeId,
      name: item.assignee,
      uniqueName: item.assigneeUniqueName || ""
    });
  });
  const unique = new Map();
  choices.forEach(choice => {
    const id = String(choice.id || "").trim();
    const name = String(choice.name || choice.displayName || "").trim();
    if (id && name && !unique.has(id.toLocaleLowerCase("en"))) {
      unique.set(id.toLocaleLowerCase("en"), { id, name, uniqueName: choice.uniqueName || "" });
    }
  });
  return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

function mentionElements(kind) {
  return kind === "description"
    ? { editor: els.descriptionEditor, menu: els.descriptionMentionMenu, label: els.descriptionMentionLabel, options: els.descriptionMentionOptions }
    : { editor: els.commentComposerInput, menu: els.commentMentionMenu, label: els.commentMentionLabel, options: els.commentMentionOptions };
}

function editorTriggerAtCaret(editor) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !selection.isCollapsed) return null;
  const caret = selection.getRangeAt(0);
  if (!editor.contains(caret.endContainer)) return null;
  let node = caret.endContainer;
  let offset = caret.endOffset;
  if (node.nodeType !== Node.TEXT_NODE) {
    const child = node.childNodes[Math.max(0, offset - 1)];
    node = child;
    while (node?.lastChild) node = node.lastChild;
    if (node?.nodeType !== Node.TEXT_NODE) return null;
    offset = node.textContent.length;
  }
  const prefix = node.textContent.slice(0, offset);
  const mentionMatch = prefix.match(/(?:^|\s)@([^@\s]*)$/u);
  const workItemMatch = prefix.match(/(?:^|\s)#([^#\n]*)$/u);
  const match = mentionMatch || workItemMatch;
  if (!match) return null;
  const tokenLength = match[1].length + 1;
  const range = document.createRange();
  range.setStart(node, offset - tokenLength);
  range.setEnd(node, offset);
  return { mode: mentionMatch ? "mention" : "work-item", query: match[1], range };
}

function updateMentionSuggestions(kind) {
  const { editor, menu, label } = mentionElements(kind);
  const trigger = editorTriggerAtCaret(editor);
  if (!trigger) return closeMentionMenu(kind);
  const previous = mentionState[kind];
  if (previous.timer) clearTimeout(previous.timer);
  const query = trigger.query.trim().toLocaleLowerCase("en");
  const choices = trigger.mode === "mention"
    ? mentionChoices().filter(choice => !query
      || choice.name.toLocaleLowerCase("en").includes(query)
      || choice.uniqueName.toLocaleLowerCase("en").includes(query)).slice(0, 8)
    : localWorkItemLinkChoices(query);
  const requestToken = previous.requestToken + 1;
  mentionState[kind] = {
    mode: trigger.mode,
    query: trigger.query,
    range: trigger.range.cloneRange(),
    activeIndex: 0,
    choices,
    loading: trigger.mode === "work-item" && Boolean(query),
    requestToken,
    timer: null
  };
  label.textContent = trigger.mode === "mention" ? "Mention someone" : "Link a work item";
  menu.setAttribute("aria-label", trigger.mode === "mention" ? "Mention a team member" : "Link a work item");
  menu.hidden = false;
  editor.setAttribute("aria-expanded", "true");
  editor.setAttribute("aria-controls", menu.id);
  renderMentionOptions(kind);
  if (trigger.mode === "work-item" && query) {
    mentionState[kind].timer = setTimeout(() => loadWorkItemLinkSuggestions(kind, trigger.query, requestToken), 180);
  }
}

function knownWorkItems() {
  const items = [
    ...state.stories,
    ...state.backlogItems,
    ...state.forYouCustomItems,
    ...state.forYouWorkItems,
    ...state.forYouCreated,
    ...state.forYouUpdated,
    ...state.forYouCompleted,
    ...state.forYouMentions.map(value => value.item),
    ...state.forYouActivity.map(value => value.item)
  ];
  if (state.selectedItem) items.push(state.selectedItem);
  const unique = new Map();
  items.filter(Boolean).forEach(item => unique.set(Number(item.id), item));
  return [...unique.values()];
}

function localWorkItemLinkChoices(query) {
  const items = knownWorkItems();
  const numeric = /^\d+$/.test(query);
  return items.filter(item => !query
    || (numeric ? String(item.id).startsWith(query) : item.title.toLocaleLowerCase("en").includes(query)))
    .sort((a, b) => numeric
      ? String(a.id).localeCompare(String(b.id), "en", { numeric: true })
      : new Date(b.changedDate || 0) - new Date(a.changedDate || 0))
    .slice(0, 8);
}

async function loadWorkItemLinkSuggestions(kind, rawQuery, requestToken) {
  const query = rawQuery.trim();
  try {
    const ids = /^\d+$/.test(query)
      ? [Number(query)]
      : await queryWorkItemIds(`
          SELECT [System.Id]
          FROM WorkItems
          WHERE [System.TeamProject] = @project
            AND [System.Title] CONTAINS '${wiqlText(query)}'
          ORDER BY [System.ChangedDate] DESC
        `, 20);
    const remoteChoices = await fetchWorkItems(ids);
    const current = mentionState[kind];
    if (current.requestToken !== requestToken || current.mode !== "work-item" || current.query !== rawQuery) return;
    const merged = new Map(current.choices.map(choice => [Number(choice.id), choice]));
    remoteChoices.forEach(choice => merged.set(Number(choice.id), choice));
    current.choices = [...merged.values()].slice(0, 8);
    current.loading = false;
    current.timer = null;
    current.activeIndex = Math.min(current.activeIndex, Math.max(0, current.choices.length - 1));
    renderMentionOptions(kind);
  } catch (error) {
    console.warn("Work item link suggestions could not be loaded.", error);
    const current = mentionState[kind];
    if (current.requestToken !== requestToken) return;
    current.loading = false;
    current.timer = null;
    renderMentionOptions(kind);
  }
}

function renderMentionOptions(kind) {
  const { editor, options } = mentionElements(kind);
  const current = mentionState[kind];
  if (!current.choices.length) {
    const empty = document.createElement("div");
    empty.className = "mention-empty";
    empty.textContent = current.loading
      ? "Searching work items…"
      : current.mode === "work-item"
        ? "No matching work items."
        : state.teamMembers.length ? "No matching team members." : "No team members available.";
    options.replaceChildren(empty);
    editor.removeAttribute("aria-activedescendant");
    return;
  }
  options.replaceChildren(...current.choices.map((choice, index) => {
    const option = document.createElement("button");
    option.type = "button";
    option.id = `${kind}MentionOption${index}`;
    option.className = `mention-option${index === current.activeIndex ? " is-active" : ""}`;
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", String(index === current.activeIndex));
    const avatar = document.createElement("span");
    avatar.className = current.mode === "work-item" ? "mention-work-item-icon" : "mention-avatar";
    avatar.textContent = current.mode === "work-item" ? (choice.type?.toLocaleLowerCase("en") === "bug" ? "!" : "◆") : initialsFor(choice.name);
    const label = document.createElement("span");
    label.className = "mention-label";
    const name = document.createElement("strong");
    name.textContent = current.mode === "work-item" ? choice.title : choice.name;
    label.append(name);
    if (current.mode === "work-item") {
      const detail = document.createElement("small");
      detail.textContent = `${workItemKey(choice.id)} · ${choice.type || "Work item"} · ${choice.state || "Unknown"}`;
      label.append(detail);
    } else if (choice.uniqueName && choice.uniqueName !== choice.name) {
      const detail = document.createElement("small");
      detail.textContent = choice.uniqueName;
      label.append(detail);
    }
    option.append(avatar, label);
    option.addEventListener("mousedown", event => event.preventDefault());
    option.addEventListener("click", () => insertMention(kind, choice));
    return option;
  }));
  editor.setAttribute("aria-activedescendant", `${kind}MentionOption${current.activeIndex}`);
}

function insertMention(kind, choice) {
  const { editor } = mentionElements(kind);
  const current = mentionState[kind];
  const range = current.range;
  if (!range) return;
  range.deleteContents();
  const mention = document.createElement("a");
  if (current.mode === "work-item") {
    mention.href = workItemWebUrl(choice.id);
    mention.className = "internal-work-item-link";
    mention.dataset.workItemId = String(choice.id);
    mention.textContent = `${choice.title} (${workItemKey(choice.id)})`;
  } else {
    mention.href = "#";
    mention.className = "user-mention";
    mention.setAttribute("data-vss-mention", `version:2.0,${choice.id}`);
    mention.textContent = `@${choice.name}`;
  }
  mention.contentEditable = "false";
  const space = document.createTextNode(" ");
  range.insertNode(mention);
  mention.after(space);
  const caret = document.createRange();
  caret.setStartAfter(space);
  caret.collapse(true);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(caret);
  closeMentionMenu(kind);
  editor.focus();
  editor.dispatchEvent(new Event("input", { bubbles: true }));
}

function moveMentionSelection(kind, direction) {
  const current = mentionState[kind];
  if (!current.choices.length) return;
  current.activeIndex = (current.activeIndex + direction + current.choices.length) % current.choices.length;
  renderMentionOptions(kind);
  mentionElements(kind).options.querySelector(".is-active")?.scrollIntoView({ block: "nearest" });
}

function closeMentionMenu(kind) {
  const { editor, menu, options } = mentionElements(kind);
  const current = mentionState[kind];
  if (current.timer) clearTimeout(current.timer);
  menu.hidden = true;
  options.replaceChildren();
  editor.setAttribute("aria-expanded", "false");
  editor.removeAttribute("aria-controls");
  editor.removeAttribute("aria-activedescendant");
  mentionState[kind] = { mode: "mention", query: "", range: null, activeIndex: 0, choices: [], loading: false, requestToken: current.requestToken + 1, timer: null };
}

function handleMentionKeydown(kind, event) {
  const { menu } = mentionElements(kind);
  if (menu.hidden) return false;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    moveMentionSelection(kind, event.key === "ArrowDown" ? 1 : -1);
    return true;
  }
  if ((event.key === "Enter" || event.key === "Tab") && mentionState[kind].choices.length) {
    event.preventDefault();
    insertMention(kind, mentionState[kind].choices[mentionState[kind].activeIndex]);
    return true;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    closeMentionMenu(kind);
    return true;
  }
  return false;
}

function workItemContentField(item, editorMode = "content") {
  if (editorMode === "system-info") return "Microsoft.VSTS.TCM.SystemInfo";
  if (editorMode === "acceptance-criteria") return "Microsoft.VSTS.Common.AcceptanceCriteria";
  return isBugWorkItem(item) ? "Microsoft.VSTS.TCM.ReproSteps" : "System.Description";
}

function workItemContentLabel(item, editorMode = "content") {
  if (editorMode === "system-info") return "system info";
  if (editorMode === "acceptance-criteria") return "acceptance criteria";
  return isBugWorkItem(item) ? "repro steps" : "description";
}

let descriptionEditorMode = "content";
let descriptionEditorInitialHtml = "";

function openDescriptionEditor(editorMode = "content") {
  const item = selectedWorkItem();
  const systemInfo = editorMode === "system-info";
  const acceptanceCriteria = editorMode === "acceptance-criteria";
  const editButton = systemInfo
    ? els.systemInfoEditButton
    : acceptanceCriteria ? els.acceptanceCriteriaEditButton : els.descriptionEditButton;
  if (!item || editButton.disabled) return;
  closeWorkItemStateMenu();
  closeWorkItemAssigneeMenu();
  closeWorkItemTagsMenu();
  closeWorkItemDetailFieldMenus();
  closeMentionMenu("comment");
  const detail = state.detailsCache.get(item.id);
  const bug = isBugWorkItem(item);
  const html = (systemInfo
    ? detail?.systemInfoHtml
    : acceptanceCriteria ? detail?.acceptanceCriteriaHtml : bug ? detail?.reproStepsHtml : detail?.descriptionHtml) || "";
  descriptionEditorInitialHtml = sanitizedRichHtmlString(html);
  descriptionEditorMode = editorMode;
  descriptionEditorView = "preview";
  descriptionEditorRevision = 0;
  descriptionMarkdownDraft = null;
  descriptionMarkdownRevision = -1;
  els.descriptionSourceEditor.value = "";
  els.descriptionEditor.replaceChildren(sanitizeRichHtml(html));
  els.descriptionEditor.setAttribute("aria-label", systemInfo ? "System info" : acceptanceCriteria ? "Acceptance criteria" : bug ? "Repro steps" : "Description");
  els.descriptionEditor.dataset.placeholder = systemInfo
    ? "Add system information…"
    : acceptanceCriteria ? "Add acceptance criteria…" : bug ? "Add repro steps…" : "Add a description…";
  els.descriptionEditor.querySelectorAll("a.user-mention, a.internal-work-item-link").forEach(link => { link.contentEditable = "false"; });
  hydrateRichTextImages(els.descriptionEditor);
  highlightCodeBlocks(els.descriptionEditor);
  activateEditorCheckboxes(els.descriptionEditor);
  if (systemInfo) {
    els.workItemSystemInfo.hidden = true;
    els.workItemSystemInfo.after(els.descriptionEditorForm);
  } else if (acceptanceCriteria) {
    els.workItemAcceptanceCriteria.hidden = true;
    els.workItemAcceptanceCriteria.after(els.descriptionEditorForm);
  } else {
    els.workItemDescription.hidden = true;
    els.workItemDescription.after(els.descriptionEditorForm);
  }
  els.descriptionEditButton.hidden = true;
  els.acceptanceCriteriaEditButton.hidden = true;
  els.systemInfoEditButton.hidden = true;
  els.descriptionEditorForm.hidden = false;
  els.descriptionEditorStatus.textContent = "";
  els.descriptionEditorStatus.classList.remove("is-error");
  renderDescriptionEditorView(true);
}

function resetDescriptionEditor() {
  closeMentionMenu("description");
  els.descriptionEditorForm.hidden = true;
  els.workItemDescription.hidden = false;
  els.workItemAcceptanceCriteria.hidden = false;
  els.workItemSystemInfo.hidden = false;
  els.descriptionEditButton.hidden = false;
  els.acceptanceCriteriaEditButton.hidden = false;
  els.systemInfoEditButton.hidden = false;
  els.workItemDescription.after(els.descriptionEditorForm);
  els.descriptionEditor.replaceChildren();
  els.descriptionSourceEditor.value = "";
  els.descriptionEditorStatus.textContent = "";
  els.descriptionEditorStatus.classList.remove("is-error");
  setDescriptionEditorBusy(false);
  descriptionEditorMode = "content";
  descriptionEditorInitialHtml = "";
  descriptionEditorView = "preview";
  descriptionEditorRevision = 0;
  descriptionMarkdownDraft = null;
  descriptionMarkdownRevision = -1;
  renderDescriptionEditorView();
}

function setDescriptionEditorBusy(busy) {
  els.descriptionEditor.contentEditable = String(!busy);
  els.descriptionSourceEditor.readOnly = busy;
  els.descriptionViewTabs.forEach(tab => { tab.disabled = busy; });
  els.descriptionEditorCancel.disabled = busy;
  els.descriptionEditorSubmit.disabled = busy;
  els.descriptionEditorSubmit.textContent = busy ? "Saving…" : "Save";
}

function applyDescriptionCommand(command) {
  els.descriptionEditor.focus();
  document.execCommand(command, false);
}

function descriptionEditorHtml() {
  return richEditorHtml(els.descriptionEditor);
}

function sanitizedRichHtmlString(html) {
  const safe = document.createElement("div");
  safe.append(sanitizeRichHtml(String(html || "")));
  restoreAuthenticatedImageSources(safe);
  return safe.innerHTML.trim();
}

function formatRichHtml(html) {
  const container = document.createElement("div");
  container.append(sanitizeRichHtml(String(html || "")));
  restoreAuthenticatedImageSources(container);
  const blockTags = new Set([
    "blockquote", "div", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "li", "ol", "p", "pre",
    "table", "tbody", "td", "th", "thead", "tr", "ul"
  ]);
  const voidTags = new Set(["br", "hr", "img", "input"]);
  const inlineHtml = node => node.nodeType === Node.TEXT_NODE ? escapeHtml(node.textContent || "") : node.outerHTML;
  const formatNode = (node, depth = 0) => {
    const indent = "  ".repeat(depth);
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || "").trim();
      return text ? `${indent}${escapeHtml(text)}` : "";
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const tag = node.tagName.toLocaleLowerCase("en");
    if (voidTags.has(tag) || tag === "pre") return `${indent}${node.outerHTML}`;
    const closing = `</${tag}>`;
    const shell = node.cloneNode(false).outerHTML;
    const opening = shell.endsWith(closing) ? shell.slice(0, -closing.length) : `<${tag}>`;
    const hasBlockChildren = [...node.children].some(child => blockTags.has(child.tagName.toLocaleLowerCase("en")));
    const hasInlineContent = [...node.childNodes].some(child => child.nodeType === Node.TEXT_NODE
      ? Boolean(child.textContent?.trim())
      : child.nodeType === Node.ELEMENT_NODE && !blockTags.has(child.tagName.toLocaleLowerCase("en")));
    if (!hasBlockChildren || hasInlineContent) return `${indent}${opening}${node.innerHTML.trim()}${closing}`;
    const lines = [`${indent}${opening}`];
    let inlineBuffer = [];
    const flushInline = () => {
      const content = inlineBuffer.map(inlineHtml).join("").trim();
      if (content) lines.push(`${"  ".repeat(depth + 1)}${content}`);
      inlineBuffer = [];
    };
    [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE && blockTags.has(child.tagName.toLocaleLowerCase("en"))) {
        flushInline();
        const formatted = formatNode(child, depth + 1);
        if (formatted) lines.push(formatted);
      } else {
        inlineBuffer.push(child);
      }
    });
    flushInline();
    lines.push(`${indent}${closing}`);
    return lines.join("\n");
  };
  return [...container.childNodes].map(node => formatNode(node)).filter(Boolean).join("\n");
}

function markdownEscapeText(value) {
  return String(value || "").replace(/([\\`*_[\]~])/g, "\\$1");
}

function htmlToMarkdown(html) {
  const container = document.createElement("div");
  container.append(sanitizeRichHtml(String(html || "")));

  const renderChildren = node => [...node.childNodes].map(renderNode).join("");
  const renderList = (list, depth = 0) => {
    const ordered = list.tagName.toLocaleLowerCase("en") === "ol";
    const items = [...list.children].filter(child => child.tagName?.toLocaleLowerCase("en") === "li");
    return items.map((item, index) => {
      const nestedLists = [...item.children].filter(child => ["ul", "ol"].includes(child.tagName.toLocaleLowerCase("en")));
      const checkbox = [...item.children].find(child => child.tagName.toLocaleLowerCase("en") === "input" && child.type === "checkbox");
      const content = [...item.childNodes]
        .filter(child => !(child.nodeType === Node.ELEMENT_NODE
          && (["ul", "ol"].includes(child.tagName.toLocaleLowerCase("en")) || child === checkbox)))
        .map(renderNode).join("").trim().replace(/\n{2,}/g, " ");
      const marker = checkbox ? `- [${checkbox.checked ? "x" : " "}]` : ordered ? `${index + 1}.` : "-";
      const nested = nestedLists.map(child => `\n${renderList(child, depth + 1).trimEnd()}`).join("");
      return `${"  ".repeat(depth)}${marker} ${content}${nested}`;
    }).join("\n") + "\n\n";
  };
  const renderTable = table => {
    const rows = [...table.querySelectorAll("tr")].map(row => [...row.children]
      .filter(cell => ["td", "th"].includes(cell.tagName.toLocaleLowerCase("en")))
      .map(cell => renderChildren(cell).trim().replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ")));
    if (!rows.length) return "";
    const width = Math.max(...rows.map(row => row.length));
    const pad = row => [...row, ...Array(Math.max(0, width - row.length)).fill("")];
    const lines = [pad(rows[0]), Array(width).fill("---"), ...rows.slice(1).map(pad)];
    return `${lines.map(row => `| ${row.join(" | ")} |`).join("\n")}\n\n`;
  };
  const renderNode = node => {
    if (node.nodeType === Node.TEXT_NODE) return markdownEscapeText(node.nodeValue.replace(/\s+/g, " "));
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const tag = node.tagName.toLocaleLowerCase("en");
    const content = () => renderChildren(node);
    if (tag === "br") return "  \n";
    if (["p", "div"].includes(tag)) return `${content().trim()}\n\n`;
    if (/^h[1-6]$/.test(tag)) return `${"#".repeat(Number(tag[1]))} ${content().trim()}\n\n`;
    if (["strong", "b"].includes(tag)) return `**${content()}**`;
    if (["em", "i"].includes(tag)) return `*${content()}*`;
    if (["del", "s", "strike"].includes(tag)) return `~~${content()}~~`;
    if (tag === "code" && node.parentElement?.tagName.toLocaleLowerCase("en") !== "pre") {
      const fence = node.textContent.includes("`") ? "``" : "`";
      return `${fence}${node.textContent}${fence}`;
    }
    if (tag === "pre") {
      const code = node.firstElementChild?.tagName.toLocaleLowerCase("en") === "code" ? node.firstElementChild : node;
      const language = String(code.className || "").match(/(?:^|\s)language-([a-z0-9_+#.-]+)/i)?.[1] || "";
      const content = code.textContent.replace(/\n$/, "");
      const fence = content.includes("```") ? "~~~" : "```";
      return `${fence}${language}\n${content}\n${fence}\n\n`;
    }
    if (["ul", "ol"].includes(tag)) return renderList(node);
    if (tag === "blockquote") return `${content().trim().split("\n").map(line => `> ${line}`).join("\n")}\n\n`;
    if (tag === "hr") return "---\n\n";
    if (tag === "table") return renderTable(node);
    if (tag === "a") {
      const label = content() || markdownEscapeText(node.textContent || node.href || "link");
      if (node.classList.contains("user-mention")) {
        const identity = String(node.getAttribute("data-vss-mention") || "").split(",").pop();
        if (identity) return `[${label}](mention:${identity})`;
      }
      if (node.classList.contains("internal-work-item-link") && node.dataset.workItemId) return `[${label}](workitem:${node.dataset.workItemId})`;
      return `[${label}](${node.getAttribute("href") || "#"})`;
    }
    if (tag === "img") return `![${markdownEscapeText(node.getAttribute("alt") || "image")}](${node.dataset.authSrc || node.getAttribute("src") || ""})`;
    return content();
  };

  return [...container.childNodes].map(renderNode).join("").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function markdownAttribute(value) {
  return escapeHtml(String(value || "")).replace(/"/g, "&quot;");
}

function markdownInline(value) {
  const tokens = [];
  const stash = html => `\uE000${tokens.push(html) - 1}\uE001`;
  let text = String(value || "");
  text = text.replace(/`([^`\n]+)`/g, (_, code) => stash(`<code>${escapeHtml(code)}</code>`));
  text = text.replace(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g, (_, alt, source) =>
    stash(`<img src="${markdownAttribute(source)}" alt="${markdownAttribute(alt)}">`));
  text = text.replace(/\[([^\]]+)\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g, (_, label, target) => {
    if (/^mention:/i.test(target)) {
      const identity = target.slice(target.indexOf(":") + 1);
      return stash(`<a href="#" class="user-mention" data-vss-mention="version:2.0,${markdownAttribute(identity)}">${escapeHtml(label)}</a>`);
    }
    if (/^workitem:\d+$/i.test(target)) {
      const itemId = Number(target.split(":")[1]);
      return stash(`<a href="${markdownAttribute(workItemWebUrl(itemId))}" class="internal-work-item-link" data-work-item-id="${itemId}">${escapeHtml(label)}</a>`);
    }
    return stash(`<a href="${markdownAttribute(target)}">${escapeHtml(label)}</a>`);
  });
  text = escapeHtml(text);
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  text = text.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  text = text.replace(/(^|[^_])_([^_\n]+)_/g, "$1<em>$2</em>");
  return text.replace(/\uE000(\d+)\uE001/g, (_, index) => tokens[Number(index)] || "");
}

function markdownToHtml(markdown) {
  const lines = String(markdown || "").replace(/\r\n?/g, "\n").split("\n");
  const output = [];
  const isTableDivider = line => /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  const isBlockStart = (line, next = "") => /^(?: {4}|\t)/.test(line)
    || /^\s*(?:#{1,6}\s+|```|~~~|>|[-+*]\s+|\d+\.\s+|(?:---+|___+|\*\*\*+)\s*$)/.test(line)
    || (line.includes("|") && isTableDivider(next));
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index++; continue; }
    const fence = line.match(/^\s*(```|~~~)\s*([a-z0-9_+#.-]*)\s*$/i);
    if (fence) {
      const content = [];
      index++;
      while (index < lines.length && !new RegExp(`^\\s*${fence[1]}\\s*$`).test(lines[index])) content.push(lines[index++]);
      if (index < lines.length) index++;
      const language = fence[2] ? ` class="language-${markdownAttribute(fence[2])}"` : "";
      output.push(`<pre><code${language}>${escapeHtml(content.join("\n"))}</code></pre>`);
      continue;
    }
    if (/^(?: {4}|\t)/.test(line)) {
      const content = [];
      while (index < lines.length) {
        if (/^(?: {4}|\t)/.test(lines[index])) {
          content.push(lines[index].replace(/^(?: {4}|\t)/, ""));
          index++;
        } else if (!lines[index].trim() && /^(?: {4}|\t)/.test(lines[index + 1] || "")) {
          content.push("");
          index++;
        } else break;
      }
      output.push(`<pre><code>${escapeHtml(content.join("\n"))}</code></pre>`);
      continue;
    }
    const heading = line.match(/^\s*(#{1,6})\s+(.+)$/);
    if (heading) { output.push(`<h${heading[1].length}>${markdownInline(heading[2])}</h${heading[1].length}>`); index++; continue; }
    if (/^\s*(?:---+|___+|\*\*\*+)\s*$/.test(line)) { output.push("<hr>"); index++; continue; }
    if (line.includes("|") && isTableDivider(lines[index + 1] || "")) {
      const escapedPipe = "\uE100";
      const splitRow = row => row.trim().replace(/^\||\|$/g, "").replace(/\\\|/g, escapedPipe)
        .split("|").map(cell => cell.trim().replaceAll(escapedPipe, "|"));
      const header = splitRow(line);
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) rows.push(splitRow(lines[index++]));
      output.push(`<table><thead><tr>${header.map(cell => `<th>${markdownInline(cell)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${markdownInline(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }
    if (/^\s*>/.test(line)) {
      const quote = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) quote.push(lines[index++].replace(/^\s*>\s?/, ""));
      output.push(`<blockquote>${markdownToHtml(quote.join("\n"))}</blockquote>`);
      continue;
    }
    const listMatch = line.match(/^\s*([-+*]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const ordered = /\d+\./.test(listMatch[1]);
      const items = [];
      while (index < lines.length) {
        const match = lines[index].match(/^\s*([-+*]|\d+\.)\s+(.+)$/);
        if (!match || /\d+\./.test(match[1]) !== ordered) break;
        const task = match[2].match(/^\[([ xX])\]\s+(.*)$/);
        items.push({ text: task ? task[2] : match[2], task: Boolean(task), checked: Boolean(task && /x/i.test(task[1])) });
        index++;
      }
      const tag = ordered ? "ol" : "ul";
      output.push(`<${tag}>${items.map(item => `<li>${item.task ? `<input type="checkbox"${item.checked ? " checked" : ""}> ` : ""}${markdownInline(item.text)}</li>`).join("")}</${tag}>`);
      continue;
    }
    const paragraph = [line.trim()];
    index++;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index], lines[index + 1] || "")) paragraph.push(lines[index++].trim());
    output.push(`<p>${markdownInline(paragraph.join(" "))}</p>`);
  }
  return sanitizedRichHtmlString(output.join(""));
}

let descriptionEditorView = "preview";
let descriptionEditorRevision = 0;
let descriptionMarkdownDraft = null;
let descriptionMarkdownRevision = -1;

function renderDescriptionEditorView(focus = false) {
  const preview = descriptionEditorView === "preview";
  els.descriptionToolbar.hidden = !preview;
  els.descriptionEditorWrap.hidden = !preview;
  els.descriptionSourceEditor.hidden = preview;
  els.descriptionSourceEditor.setAttribute("aria-label", descriptionEditorView === "markdown" ? "Markdown source" : "HTML source");
  els.descriptionEditorHint.textContent = preview
    ? "@ mention · # link · Ctrl + Enter to save"
    : `${descriptionEditorView === "markdown" ? "Markdown" : "HTML source"} · Ctrl + Enter to save`;
  els.descriptionViewTabs.forEach(tab => {
    const selected = tab.dataset.descriptionView === descriptionEditorView;
    tab.classList.toggle("is-active", selected);
    tab.setAttribute("aria-selected", String(selected));
  });
  if (focus) requestAnimationFrame(() => {
    const target = preview ? els.descriptionEditor : els.descriptionSourceEditor;
    target.focus();
    if (!preview) {
      target.setSelectionRange(0, 0);
      target.scrollTop = 0;
      target.scrollLeft = 0;
    }
  });
}

function currentDescriptionEditorHtml() {
  if (descriptionEditorView === "preview") return descriptionEditorHtml();
  if (descriptionEditorView === "markdown") return markdownToHtml(els.descriptionSourceEditor.value);
  return sanitizedRichHtmlString(els.descriptionSourceEditor.value);
}

function setDescriptionEditorView(nextView) {
  if (!["preview", "html", "markdown"].includes(nextView) || nextView === descriptionEditorView) return;
  const previousView = descriptionEditorView;
  const html = currentDescriptionEditorHtml();
  if (previousView === "markdown") {
    descriptionMarkdownDraft = els.descriptionSourceEditor.value;
    descriptionMarkdownRevision = descriptionEditorRevision;
  }
  descriptionEditorView = nextView;
  closeMentionMenu("description");
  if (nextView === "preview") {
    els.descriptionEditor.replaceChildren(sanitizeRichHtml(html));
    els.descriptionEditor.querySelectorAll("a.user-mention, a.internal-work-item-link").forEach(link => { link.contentEditable = "false"; });
    hydrateRichTextImages(els.descriptionEditor);
    highlightCodeBlocks(els.descriptionEditor);
    activateEditorCheckboxes(els.descriptionEditor);
  } else {
    if (nextView === "markdown") {
      const reuseDraft = descriptionMarkdownDraft !== null && descriptionMarkdownRevision === descriptionEditorRevision;
      els.descriptionSourceEditor.value = reuseDraft ? descriptionMarkdownDraft : htmlToMarkdown(html);
      descriptionMarkdownDraft = els.descriptionSourceEditor.value;
      descriptionMarkdownRevision = descriptionEditorRevision;
    } else {
      els.descriptionSourceEditor.value = formatRichHtml(html);
    }
  }
  renderDescriptionEditorView(true);
}

async function preparedDescriptionEditorHtml() {
  const html = currentDescriptionEditorHtml();
  els.descriptionEditor.replaceChildren(sanitizeRichHtml(html));
  els.descriptionEditor.querySelectorAll("a.user-mention, a.internal-work-item-link").forEach(link => { link.contentEditable = "false"; });
  hydrateRichTextImages(els.descriptionEditor);
  await persistEmbeddedRichTextImages(els.descriptionEditor);
  const prepared = descriptionEditorHtml();
  if (descriptionEditorView === "html") els.descriptionSourceEditor.value = formatRichHtml(prepared);
  if (descriptionEditorView === "markdown") {
    els.descriptionSourceEditor.value = htmlToMarkdown(prepared);
    descriptionMarkdownDraft = els.descriptionSourceEditor.value;
    descriptionMarkdownRevision = descriptionEditorRevision;
  }
  return prepared;
}

function richEditorHtml(editor) {
  const source = editor.cloneNode(true);
  stripSyntaxHighlighting(source);
  restoreAuthenticatedImageSources(source);
  const safe = document.createElement("div");
  safe.append(sanitizeRichHtml(source.innerHTML));
  restoreAuthenticatedImageSources(safe);
  const html = safe.innerHTML.trim();
  return html === "<br>" ? "" : html;
}

function embeddedRichTextImages(editor) {
  return [...editor.querySelectorAll("img:not([data-auth-src])")].filter(image => {
    const source = image.getAttribute("src") || "";
    return /^data:image\/(png|gif|jpe?g|webp);base64,/i.test(source) || /^blob:/i.test(source);
  });
}

async function persistEmbeddedRichTextImages(editor) {
  const images = embeddedRichTextImages(editor);
  for (const [index, image] of images.entries()) {
    const response = await fetch(image.getAttribute("src"));
    if (!response.ok) throw new Error(`The pasted image could not be read (${response.status}).`);
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) throw new Error("The pasted content is not an image.");
    const fileName = richTextImageFileName(image, blob, index);
    const attachment = await azure(`/_apis/wit/attachments?fileName=${encodeURIComponent(fileName)}&api-version=7.1`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: blob
    });
    if (!attachment?.url) throw new Error("Azure DevOps did not return a URL for the pasted image.");
    image.dataset.authSrc = attachment.url;
    if (!image.alt) image.alt = fileName;
  }
}

function richTextImageFileName(image, blob, index) {
  const extensions = {
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
  };
  const extension = extensions[blob.type.toLocaleLowerCase("en")] || "png";
  const label = (image.alt || "pasted-image")
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "pasted-image";
  return `${label}-${Date.now()}-${index + 1}.${extension}`;
}

function restoreAuthenticatedImageSources(container) {
  container.querySelectorAll("img[data-auth-src]").forEach(image => {
    image.src = image.dataset.authSrc;
    image.removeAttribute("data-auth-src");
    image.removeAttribute("aria-busy");
    image.classList.remove("is-loading");
    if (!image.className) image.removeAttribute("class");
  });
}

async function submitDescriptionEditor(event) {
  event.preventDefault();
  const item = selectedWorkItem();
  if (!item) return;
  const editorMode = descriptionEditorMode;
  const contentField = workItemContentField(item, editorMode);
  const contentLabel = workItemContentLabel(item, editorMode);
  setDescriptionEditorBusy(true);
  els.descriptionEditorStatus.classList.remove("is-error");
  try {
    const embeddedImageCount = descriptionEditorView === "preview" ? embeddedRichTextImages(els.descriptionEditor).length : 0;
    els.descriptionEditorStatus.textContent = embeddedImageCount
      ? `Uploading ${embeddedImageCount === 1 ? "image" : `${embeddedImageCount} images`}…`
      : `Saving ${contentLabel}…`;
    const descriptionHtml = await preparedDescriptionEditorHtml();
    els.descriptionEditorStatus.textContent = `Saving ${contentLabel}…`;
    await azure(`/_apis/wit/workitems/${item.id}?api-version=7.1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json-patch+json" },
      body: JSON.stringify([{ op: "add", path: `/fields/${contentField}`, value: descriptionHtml }])
    });
    state.detailsRequestTokens.set(item.id, (state.detailsRequestTokens.get(item.id) || 0) + 1);
    const verifiedItem = await azure(`/_apis/wit/workitems/${item.id}?api-version=7.1`);
    const detail = normalizeWorkItemDetail(verifiedItem);
    state.detailsCache.set(item.id, detail);
    state.historyCache.delete(item.id);
    state.historyErrors.delete(item.id);
    resetDescriptionEditor();
    if (isSelectedWorkItem(item.id)) {
      renderWorkItemDetail(item, detail, false);
      els.workItemLoadStatus.textContent = `${contentLabel[0].toLocaleUpperCase("en")}${contentLabel.slice(1)} saved.`;
      renderHistory([], true);
      renderCombinedActivity();
      loadWorkItemHistory(item);
    }
  } catch (error) {
    console.error(error);
    els.descriptionEditorStatus.textContent = error.auth
      ? `The ${contentLabel} could not be saved. The PAT requires ‘Work Items: Read & write’.`
      : error.message || `The ${contentLabel} could not be saved.`;
    els.descriptionEditorStatus.classList.add("is-error");
    setDescriptionEditorBusy(false);
    els.descriptionEditor.focus();
  }
}

function renderComments(comments, loading = false, error = "") {
  els.workItemCommentCount.textContent = String(comments.length);
  els.workItemCommentsStatus.classList.toggle("is-error", Boolean(error));
  if (loading) {
    els.workItemCommentsStatus.textContent = "Loading comments…";
    els.workItemComments.replaceChildren(...Array.from({ length: 2 }, () => {
      const skeleton = document.createElement("div");
      skeleton.className = "comment-skeleton";
      return skeleton;
    }));
    return;
  }
  els.workItemCommentsStatus.textContent = error || (!comments.length ? "No comments yet." : "");
  els.workItemComments.replaceChildren(...comments.map(createComment));
}

function setCommentComposerExpanded(expanded) {
  if (expanded) closeMentionMenu("description");
  els.commentComposerPrompt.hidden = expanded;
  els.commentComposerForm.hidden = !expanded;
  if (!expanded) closeMentionMenu("comment");
  if (expanded) requestAnimationFrame(() => els.commentComposerInput.focus());
}

function resetCommentComposer() {
  els.commentComposerInput.replaceChildren();
  els.commentComposerStatus.textContent = "";
  els.commentComposerStatus.classList.remove("is-error");
  els.commentComposerInput.contentEditable = "true";
  els.commentComposerCancel.disabled = false;
  els.commentComposerSubmit.disabled = false;
  els.commentComposerSubmit.textContent = "Save";
  setCommentComposerExpanded(false);
}

function setCommentComposerBusy(busy) {
  els.commentComposerInput.contentEditable = String(!busy);
  els.commentComposerCancel.disabled = busy;
  els.commentComposerSubmit.disabled = busy;
  els.commentComposerSubmit.textContent = busy ? "Saving…" : "Save";
}

async function submitWorkItemComment(event) {
  event.preventDefault();
  const item = selectedWorkItem();
  let text = richEditorHtml(els.commentComposerInput);
  if (!item || (!htmlToText(text).trim() && !/<img\b/i.test(text))) return;
  setCommentComposerBusy(true);
  els.commentComposerStatus.classList.remove("is-error");
  try {
    const embeddedImageCount = embeddedRichTextImages(els.commentComposerInput).length;
    els.commentComposerStatus.textContent = embeddedImageCount
      ? `Uploading ${embeddedImageCount === 1 ? "image" : `${embeddedImageCount} images`}…`
      : "Posting comment…";
    await persistEmbeddedRichTextImages(els.commentComposerInput);
    text = richEditorHtml(els.commentComposerInput);
    els.commentComposerStatus.textContent = "Posting comment…";
    const result = await azure(`/_apis/wit/workItems/${item.id}/comments?api-version=7.1-preview.4`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const comment = normalizeComment(result);
    const existing = state.commentsCache.get(item.id) || [];
    const comments = [comment, ...existing.filter(entry => entry.id !== comment.id)]
      .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    state.commentsCache.set(item.id, comments);
    state.commentsErrors.delete(item.id);
    if (isSelectedWorkItem(item.id)) {
      renderComments(comments, false);
      renderCombinedActivity();
      resetCommentComposer();
      els.workItemLoadStatus.textContent = "Comment posted.";
      els.workItemLoadStatus.classList.remove("is-error");
    }
    loadWorkItemComments(item);
  } catch (error) {
    console.error(error);
    if (isSelectedWorkItem(item.id)) {
      els.commentComposerStatus.textContent = error.auth
        ? "The comment could not be posted. The PAT requires ‘Work Items: Read & write’."
        : error.message || "The comment could not be posted.";
      els.commentComposerStatus.classList.add("is-error");
    }
  } finally {
    if (isSelectedWorkItem(item.id) && !els.commentComposerForm.hidden) setCommentComposerBusy(false);
  }
}

function createComment(comment) {
  const article = document.createElement("article");
  article.className = "comment";
  const avatar = document.createElement("span");
  avatar.className = "comment-avatar";
  avatar.textContent = initialsFor(comment.author);
  const body = document.createElement("div");
  body.className = "comment-body";
  const header = document.createElement("header");
  const author = document.createElement("strong");
  author.textContent = comment.author;
  const time = document.createElement("time");
  time.dateTime = comment.createdDate;
  time.textContent = comment.createdDate ? formatDateTime(comment.createdDate) : "";
  header.append(author, time);
  const content = document.createElement("div");
  content.className = "comment-content rich-content";
  setRichContent(content, comment.html, "Empty comment");
  body.append(header, content);
  article.append(avatar, body);
  return article;
}

function renderHistory(history, loading = false, error = "") {
  els.workItemHistoryCount.textContent = String(history.length);
  els.workItemHistoryStatus.classList.toggle("is-error", Boolean(error));
  if (loading) {
    els.workItemHistoryStatus.textContent = "Loading history…";
    els.workItemHistory.replaceChildren(...Array.from({ length: 2 }, () => {
      const skeleton = document.createElement("div");
      skeleton.className = "comment-skeleton";
      return skeleton;
    }));
    return;
  }
  els.workItemHistoryStatus.textContent = error || (!history.length ? "No history yet." : "");
  els.workItemHistory.replaceChildren(...history.map(createHistoryEntry));
}

function createHistoryEntry(entry) {
  const article = document.createElement("article");
  article.className = "history-entry";
  const marker = document.createElement("span");
  marker.className = "history-marker";
  marker.textContent = initialsFor(entry.author);
  const body = document.createElement("div");
  body.className = "history-body";
  const header = document.createElement("header");
  const author = document.createElement("strong");
  author.textContent = entry.author;
  const time = document.createElement("time");
  time.dateTime = entry.date;
  time.textContent = entry.date ? formatDateTime(entry.date) : "";
  const revision = document.createElement("span");
  revision.className = "revision-label";
  revision.textContent = `rev ${entry.revision}`;
  header.append(author, time, revision);
  body.append(header);

  if (entry.created) {
    const created = document.createElement("p");
    created.className = "history-summary";
    created.textContent = "created this item.";
    body.append(created);
  } else if (entry.changes.length) {
    const list = document.createElement("ul");
    entry.changes.forEach(change => list.append(createHistoryChange(change)));
    body.append(list);
  } else {
    const updated = document.createElement("p");
    updated.className = "history-summary";
    updated.textContent = "updated this item.";
    body.append(updated);
  }
  article.append(marker, body);
  return article;
}

function createHistoryChange(change) {
  const row = document.createElement("li");
  const label = document.createElement("strong");
  label.textContent = change.label;
  row.append(label);
  if (change.compact) {
    row.append(document.createTextNode(" updated"));
    return row;
  }
  const oldValue = document.createElement("span");
  oldValue.className = "history-old";
  oldValue.textContent = change.oldValue;
  const newValue = document.createElement("span");
  newValue.className = "history-new";
  newValue.textContent = change.newValue;
  row.append(document.createTextNode(" "), oldValue, document.createTextNode(" → "), newValue);
  return row;
}

function workItemPullRequestStatus(pullRequest) {
  if (pullRequest.mergedAt) return { label: "Merged", tone: "merged" };
  if (String(pullRequest.state).toLocaleLowerCase("en") === "closed") return { label: "Closed", tone: "closed" };
  if (pullRequest.draft) return { label: "Draft", tone: "draft" };
  return { label: "Open", tone: "open" };
}

function renderWorkItemPullRequests(pullRequests, loading = false, error = "") {
  els.workItemPullRequestCount.textContent = String(pullRequests.length);
  els.workItemPullRequestsStatus.classList.toggle("is-error", Boolean(error));
  if (!state.githubToken) {
    els.workItemPullRequestsStatus.textContent = "Add a GitHub API key under Change connection to load pull requests.";
    els.workItemPullRequests.replaceChildren();
    return;
  }
  if (loading) {
    els.workItemPullRequestsStatus.textContent = "Loading pull requests…";
    els.workItemPullRequests.replaceChildren(...Array.from({ length: 2 }, () => {
      const skeleton = document.createElement("div");
      skeleton.className = "comment-skeleton";
      return skeleton;
    }));
    return;
  }
  const marker = state.selectedItemId === null ? "this work item" : `AB#${state.selectedItemId}`;
  els.workItemPullRequestsStatus.textContent = error || (!pullRequests.length
    ? `No pull requests reference ${marker} in the title.`
    : "");
  els.workItemPullRequests.replaceChildren(...pullRequests.map(createWorkItemPullRequestEntry));
}

function createWorkItemPullRequestEntry(pullRequest) {
  const link = document.createElement("a");
  link.className = "work-item-pull-request";
  link.href = pullRequest.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", `Open pull request ${pullRequest.repository} number ${pullRequest.number}: ${pullRequest.title}`);
  const icon = document.createElement("span");
  icon.className = "work-item-pull-request-icon";
  icon.textContent = "PR";
  const body = document.createElement("span");
  body.className = "work-item-pull-request-body";
  const title = document.createElement("strong");
  title.textContent = pullRequest.title;
  const metadata = document.createElement("small");
  metadata.textContent = `${pullRequest.repository} #${pullRequest.number} · ${pullRequest.author} · ${formatDateTime(pullRequest.updatedAt)}`;
  body.append(title, metadata);
  const statusValue = workItemPullRequestStatus(pullRequest);
  const status = document.createElement("span");
  status.className = "work-item-pull-request-status";
  status.dataset.statusTone = statusValue.tone;
  status.textContent = statusValue.label;
  link.append(icon, body, status);
  return link;
}

function deploymentStatusDisplay(value) {
  const status = String(value || "unknown").replace(/[^a-z]/gi, "").toLocaleLowerCase("en");
  const values = {
    succeeded: { label: "Succeeded", tone: "success" },
    succeededwithissues: { label: "Succeeded with issues", tone: "warning" },
    partiallysucceeded: { label: "Partially succeeded", tone: "warning" },
    failed: { label: "Failed", tone: "danger" },
    rejected: { label: "Rejected", tone: "danger" },
    inprogress: { label: "In progress", tone: "progress" },
    queued: { label: "Queued", tone: "progress" },
    scheduled: { label: "Scheduled", tone: "progress" },
    cancelling: { label: "Cancelling", tone: "progress" },
    pending: { label: "Pending", tone: "neutral" },
    completed: { label: "Completed", tone: "neutral" },
    notstarted: { label: "Not deployed", tone: "neutral" },
    notdeployed: { label: "Not deployed", tone: "neutral" },
    canceled: { label: "Canceled", tone: "neutral" },
    abandoned: { label: "Abandoned", tone: "neutral" },
    skipped: { label: "Skipped", tone: "neutral" },
    active: { label: "Active", tone: "progress" },
    draft: { label: "Draft", tone: "neutral" },
    unavailable: { label: "Unavailable", tone: "neutral" },
    unknown: { label: "Unknown", tone: "neutral" }
  };
  return values[status] || { label: String(value || "Unknown"), tone: "neutral" };
}

function renderWorkItemDeployments(deployments, loading = false, error = "") {
  els.workItemReleaseCount.textContent = String(deployments.length);
  els.workItemReleasesStatus.classList.toggle("is-error", Boolean(error));
  if (loading) {
    els.workItemReleasesStatus.textContent = "Loading releases…";
    els.workItemReleases.replaceChildren(...Array.from({ length: 2 }, () => {
      const skeleton = document.createElement("div");
      skeleton.className = "comment-skeleton";
      return skeleton;
    }));
    return;
  }
  els.workItemReleasesStatus.textContent = error || (!deployments.length ? "No related releases." : "");
  els.workItemReleases.replaceChildren(...deployments.map(createWorkItemDeploymentEntry));
}

function createWorkItemDeploymentEntry(deployment) {
  const article = document.createElement("article");
  article.className = "work-item-release";
  article.dataset.deploymentSource = deployment.sourceType;
  const header = document.createElement("header");
  const icon = document.createElement("span");
  icon.className = "work-item-release-icon";
  icon.textContent = deployment.sourceType === "yaml" ? "Y" : "R";
  const body = document.createElement("span");
  body.className = "work-item-release-body";
  const title = deployment.url ? document.createElement("a") : document.createElement("strong");
  title.className = "work-item-release-title";
  title.textContent = deployment.pipelineName;
  if (deployment.url) {
    title.href = deployment.url;
    title.target = "_blank";
    title.rel = "noopener noreferrer";
  }
  const metadata = document.createElement("small");
  metadata.textContent = [
    deployment.name,
    deployment.sourceLabel,
    deployment.date ? formatDateTime(deployment.date) : ""
  ].filter(Boolean).join(" · ");
  body.append(title, metadata);
  const statusValue = deploymentStatusDisplay(deployment.status);
  const status = document.createElement("span");
  status.className = "work-item-release-status";
  status.dataset.statusTone = statusValue.tone;
  status.textContent = statusValue.label;
  header.append(icon, body, status);

  const details = document.createElement("div");
  details.className = "work-item-release-environments";
  const appendDeploymentGroup = (label, items, emptyText = "") => {
    if (deployment.sourceType === "yaml") {
      const heading = document.createElement("strong");
      heading.className = "work-item-release-group-heading";
      heading.textContent = label;
      details.append(heading);
    }
    if (!items.length && emptyText) {
      const empty = document.createElement("div");
      empty.className = "work-item-release-group-empty";
      empty.textContent = emptyText;
      details.append(empty);
      return;
    }
    items.forEach(environment => {
      const row = environment.url ? document.createElement("a") : document.createElement("div");
      row.className = "work-item-release-environment";
      if (environment.url) {
        row.href = environment.url;
        row.target = "_blank";
        row.rel = "noopener noreferrer";
      }
      const environmentStatus = deploymentStatusDisplay(environment.status);
      const indicator = document.createElement("span");
      indicator.className = "work-item-release-environment-indicator";
      indicator.dataset.statusTone = environmentStatus.tone;
      indicator.setAttribute("aria-hidden", "true");
      const environmentBody = document.createElement("span");
      environmentBody.className = "work-item-release-environment-body";
      const environmentName = document.createElement("strong");
      environmentName.textContent = environment.name;
      const environmentDate = document.createElement("small");
      environmentDate.textContent = [
        environment.details,
        environment.date ? formatDateTime(environment.date) : ""
      ].filter(Boolean).join(" · ") || "Deployment details unavailable";
      environmentBody.append(environmentName, environmentDate);
      const environmentLabel = document.createElement("span");
      environmentLabel.className = "work-item-release-environment-status";
      environmentLabel.textContent = environmentStatus.label;
      row.append(indicator, environmentBody, environmentLabel);
      details.append(row);
    });
  };
  if (deployment.sourceType === "yaml") {
    if (deployment.displayMode !== "environments") {
      appendDeploymentGroup("Stages", deployment.stages || []);
    }
    if (deployment.displayMode !== "stages") {
      appendDeploymentGroup(
        "Azure DevOps environments",
        deployment.environments || [],
        deployment.environmentError || "This run did not deploy to an Azure DevOps environment."
      );
    }
  } else {
    appendDeploymentGroup("Environments", deployment.environments || []);
  }
  article.append(header, details);
  return article;
}

function renderCombinedActivity() {
  const itemId = state.selectedItemId;
  if (itemId === null) return;
  const comments = state.commentsCache.get(itemId) || [];
  const history = state.historyCache.get(itemId) || [];
  const pullRequests = state.githubWorkItemPullRequestsCache.get(itemId) || [];
  const deployments = state.workItemDeploymentsCache.get(itemId) || [];
  const loading = (!state.commentsCache.has(itemId) && !state.commentsErrors.has(itemId))
    || (!state.historyCache.has(itemId) && !state.historyErrors.has(itemId))
    || (Boolean(state.githubToken)
      && !state.githubWorkItemPullRequestsCache.has(itemId)
      && !state.githubWorkItemPullRequestsErrors.has(itemId))
    || (!state.workItemDeploymentsCache.has(itemId) && !state.workItemDeploymentsErrors.has(itemId));
  const errors = [
    state.commentsErrors.get(itemId),
    state.historyErrors.get(itemId),
    state.githubToken ? state.githubWorkItemPullRequestsErrors.get(itemId) : "",
    state.workItemDeploymentsErrors.get(itemId)
  ].filter(Boolean);
  const activity = [
    ...comments.map(comment => ({ kind: "comment", date: comment.createdDate, value: comment })),
    ...history.map(entry => ({ kind: "history", date: entry.date, value: entry })),
    ...pullRequests.map(pullRequest => ({ kind: "pull-request", date: pullRequest.updatedAt, value: pullRequest })),
    ...deployments.map(deployment => ({ kind: "deployment", date: deployment.date, value: deployment }))
  ].sort((a, b) => (new Date(b.date || 0).getTime() || 0) - (new Date(a.date || 0).getTime() || 0));

  els.workItemActivityStatus.classList.toggle("is-error", Boolean(errors.length));
  els.workItemActivityStatus.textContent = errors.length
    ? errors.join(" ")
    : loading
      ? "Loading activity…"
      : !activity.length ? "No activity yet." : "";
  els.workItemActivity.replaceChildren(...activity.map(item => {
    if (item.kind === "comment") return createComment(item.value);
    if (item.kind === "pull-request") return createWorkItemPullRequestEntry(item.value);
    if (item.kind === "deployment") return createWorkItemDeploymentEntry(item.value);
    return createHistoryEntry(item.value);
  }));
}

function initialsFor(name) {
  return name.split(/\s+/).filter(Boolean).map(part => part[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function setActivityTab(tab) {
  document.querySelectorAll("[data-activity-tab]").forEach(button => {
    const active = button.dataset.activityTab === tab;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  els.workItemAllPanel.hidden = tab !== "all";
  els.workItemCommentsPanel.hidden = tab !== "comments";
  els.workItemHistoryPanel.hidden = tab !== "history";
  els.workItemPullRequestsPanel.hidden = tab !== "pull-requests";
  els.workItemReleasesPanel.hidden = tab !== "releases";
}

function htmlToText(value) {
  const parsed = new DOMParser().parseFromString(value, "text/html");
  return (parsed.body.innerText || parsed.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
}

function stripSyntaxHighlighting(container) {
  container.querySelectorAll("[data-syntax-token]").forEach(token => token.replaceWith(document.createTextNode(token.textContent || "")));
}

function activateEditorCheckboxes(container) {
  container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.disabled = false;
    checkbox.addEventListener("change", () => {
      checkbox.toggleAttribute("checked", checkbox.checked);
      descriptionEditorRevision++;
    });
  });
}

function highlightCodeBlocks(container) {
  stripSyntaxHighlighting(container);
  const supportedLanguages = /^(?:js|javascript|jsx|ts|typescript|tsx)$/i;
  const keywords = new Set([
    "async", "await", "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete",
    "do", "else", "export", "extends", "finally", "for", "from", "function", "get", "if", "import", "in",
    "instanceof", "let", "new", "of", "return", "set", "static", "super", "switch", "throw", "try", "typeof",
    "var", "void", "while", "with", "yield"
  ]);
  const literals = new Set(["false", "null", "true", "undefined"]);
  const pattern = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|from|function|get|if|import|in|instanceof|let|new|of|return|set|static|super|switch|throw|try|typeof|var|void|while|with|yield|false|null|true|undefined)\b|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*(?=\s*\())/g;
  container.querySelectorAll("pre > code").forEach(code => {
    const language = String(code.className || "").match(/(?:^|\s)language-([a-z0-9_+#.-]+)/i)?.[1] || "";
    if (!supportedLanguages.test(language)) return;
    const source = code.textContent || "";
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    for (const match of source.matchAll(pattern)) {
      if (match.index > cursor) fragment.append(document.createTextNode(source.slice(cursor, match.index)));
      const value = match[0];
      const token = document.createElement("span");
      token.dataset.syntaxToken = "";
      token.className = value.startsWith("//") || value.startsWith("/*")
        ? "syntax-comment"
        : /^["'`]/.test(value) ? "syntax-string"
          : keywords.has(value) ? "syntax-keyword"
            : literals.has(value) ? "syntax-literal"
              : /^\d/.test(value) ? "syntax-number" : "syntax-function";
      token.textContent = value;
      fragment.append(token);
      cursor = match.index + value.length;
    }
    if (cursor < source.length) fragment.append(document.createTextNode(source.slice(cursor)));
    code.replaceChildren(fragment);
  });
}

function setRichContent(element, value, fallback) {
  if (!value) {
    element.textContent = fallback;
    return;
  }
  if (!/<[a-z][\s\S]*>/i.test(value)) {
    const plain = document.createElement("span");
    plain.className = "plain-rich-text";
    plain.textContent = value;
    element.replaceChildren(plain);
    return;
  }
  element.replaceChildren(sanitizeRichHtml(value));
  element.querySelectorAll("a.internal-work-item-link[data-work-item-id]").forEach(link => {
    const itemId = Number(link.dataset.workItemId);
    if (itemId > 0) link.setAttribute("href", appRouteHash(currentAppRoute({ itemId })));
  });
  hydrateRichTextImages(element);
  highlightCodeBlocks(element);
  element.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { checkbox.disabled = true; });
}

function sanitizeRichHtml(value) {
  const parsed = new DOMParser().parseFromString(value, "text/html");
  const fragment = document.createDocumentFragment();
  parsed.body.childNodes.forEach(node => appendSafeNode(fragment, node));
  return fragment;
}

function appendSafeNode(parent, source) {
  if (source.nodeType === Node.TEXT_NODE) {
    parent.append(document.createTextNode(source.textContent || ""));
    return;
  }
  if (source.nodeType !== Node.ELEMENT_NODE) return;
  const tag = source.tagName.toLowerCase();
  if (!RICH_TEXT_TAGS.has(tag)) {
    source.childNodes.forEach(child => appendSafeNode(parent, child));
    return;
  }
  if (tag === "input" && source.type !== "checkbox") return;

  const target = document.createElement(tag);
  copySafeRichTextAttributes(source, target, tag);
  source.childNodes.forEach(child => appendSafeNode(target, child));
  parent.append(target);
}

function copySafeRichTextAttributes(source, target, tag) {
  if (tag === "a") {
    const mention = source.getAttribute("data-vss-mention") || "";
    if (/^version:2\.0,[a-z0-9._:@-]{1,200}$/i.test(mention)) {
      target.setAttribute("href", "#");
      target.setAttribute("data-vss-mention", mention);
      target.classList.add("user-mention");
    } else {
      const href = safeRichTextUrl(source.getAttribute("href"), false);
      if (href) {
        target.href = href;
        const workItemId = workItemIdFromUrl(href);
        if (workItemId) {
          target.classList.add("internal-work-item-link");
          target.dataset.workItemId = String(workItemId);
        } else {
          target.target = "_blank";
          target.rel = "noopener noreferrer";
        }
      }
    }
  }
  if (tag === "img") {
    const src = safeRichTextUrl(source.getAttribute("src"), true);
    if (src && isConfiguredAzureUrl(src)) {
      target.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
      target.dataset.authSrc = src;
      target.classList.add("is-loading");
      target.setAttribute("aria-busy", "true");
    } else if (src) {
      target.src = src;
    }
    target.alt = source.getAttribute("alt") || "";
    target.loading = "lazy";
  }
  if (tag === "input" && source.type === "checkbox") {
    target.type = "checkbox";
    target.checked = source.checked || source.hasAttribute("checked");
    target.toggleAttribute("checked", target.checked);
  }
  if (tag === "code") {
    const language = String(source.className || "").match(/(?:^|\s)language-([a-z0-9_+#.-]+)/i)?.[1];
    if (language) target.className = `language-${language}`;
  }
  if (source.hasAttribute("title")) target.title = source.getAttribute("title").slice(0, 300);
  for (const attribute of ["colspan", "rowspan"]) {
    const value = Number(source.getAttribute(attribute));
    if (Number.isInteger(value) && value > 0 && value <= 20) target.setAttribute(attribute, String(value));
  }
  for (const property of RICH_TEXT_STYLES) {
    const value = source.style.getPropertyValue(property);
    if (value && !/url\s*\(|expression\s*\(/i.test(value)) target.style.setProperty(property, value);
  }
}

function workItemIdFromUrl(value) {
  if (!value || !isConfiguredAzureUrl(value)) return null;
  try {
    const url = new URL(value);
    const activeProject = new URL(activeAzureContext().webBase);
    const projectPath = decodeURIComponent(activeProject.pathname).replace(/\/$/, "").toLocaleLowerCase("en");
    const linkPath = decodeURIComponent(url.pathname).toLocaleLowerCase("en");
    if (url.origin !== activeProject.origin || !linkPath.startsWith(`${projectPath}/_workitems/edit/`)) return null;
    const match = decodeURIComponent(url.pathname).match(/\/_workitems\/edit\/(\d+)(?:\/|$)/i);
    return match ? Number(match[1]) : null;
  } catch { return null; }
}

function safeRichTextUrl(value, image) {
  if (!value) return "";
  if (image && /^data:image\/(png|gif|jpe?g|webp);base64,/i.test(value)) return value;
  try {
    const { webBase } = activeAzureContext();
    let url = new URL(value, `${webBase}/`);
    if (image) url = normalizeAzureImageUrl(url);
    const protocols = image ? ["https:", "http:"] : ["https:", "http:", "mailto:"];
    return protocols.includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

function normalizeAzureImageUrl(url) {
  if (url.hostname !== "dev.azure.com") return url;
  const segments = url.pathname.split("/").filter(Boolean);
  const attachmentId = segments.length === 1 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segments[0])
    ? segments[0]
    : "";
  if (attachmentId) {
    const { base } = activeAzureContext();
    const attachmentUrl = new URL(`${base}/_apis/wit/attachments/${attachmentId}`);
    url.searchParams.forEach((value, key) => attachmentUrl.searchParams.append(key, value));
    if (!attachmentUrl.searchParams.has("api-version")) attachmentUrl.searchParams.set("api-version", "7.1");
    return attachmentUrl;
  }
  if (url.pathname.toLowerCase().includes("/_apis/wit/attachments/") && !url.searchParams.has("api-version")) {
    url.searchParams.set("api-version", "7.1");
  }
  return url;
}

function isConfiguredAzureUrl(value) {
  try {
    const url = new URL(value);
    const { organization } = parseAzureUrl(state.orgUrl);
    const expectedOrganization = organization.toLowerCase();
    if (url.hostname === "dev.azure.com") {
      const pathOrganization = decodeURIComponent(url.pathname.split("/").filter(Boolean)[0] || "").toLowerCase();
      return pathOrganization === expectedOrganization;
    }
    return url.hostname.toLowerCase() === `${expectedOrganization}.visualstudio.com`;
  } catch { return false; }
}

function hydrateRichTextImages(element) {
  element.querySelectorAll("img[data-auth-src]").forEach(async image => {
    const source = image.dataset.authSrc;
    try {
      let pending = state.richImageCache.get(source);
      if (!pending) {
        pending = fetchAzureImage(source);
        state.richImageCache.set(source, pending);
        pending.catch(() => state.richImageCache.delete(source));
      }
      image.src = await pending;
      image.classList.remove("is-loading");
      image.removeAttribute("aria-busy");
    } catch {
      image.classList.remove("is-loading");
      image.classList.add("is-broken");
      image.removeAttribute("aria-busy");
      image.title = "The image could not be loaded.";
    }
  });
}

async function fetchAzureImage(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "image/*",
      Authorization: `Basic ${btoa(`:${state.pat}`)}`
    }
  });
  if (!response.ok) throw new Error(`Failed to load image (${response.status}).`);
  const blob = await response.blob();
  if (!blob.type.startsWith("image/") && blob.type !== "application/octet-stream") {
    throw new Error("The attachment is not an image.");
  }
  return URL.createObjectURL(blob);
}

function emptyNode() {
  return document.querySelector("#emptyTemplate").content.firstElementChild.cloneNode(true);
}

function renderEmptyBoard() {
  state.stories = [];
  state.iterationStoriesCache.clear();
  state.backlogItems = [];
  state.backlogEpics = [];
  state.backlogFeatures = [];
  state.backlogTeamId = "";
  state.backlogCollapsedEpics.clear();
  state.backlogCollapsedFeatures.clear();
  state.wikis = [];
  state.wikiProjectName = "";
  state.wikiRoot = null;
  state.wikiPage = null;
  state.forYouProjectName = "";
  state.forYouCustomItems = [];
  state.forYouCustomError = "";
  state.forYouWorkItems = [];
  state.forYouMentions = [];
  state.forYouActivity = [];
  state.forYouCreated = [];
  state.forYouUpdated = [];
  state.forYouCompleted = [];
  state.forYouErrors = {};
  state.forYouSelectedUser = null;
  state.forYouUserKey = "";
  state.releaseDebug.classic = [];
  state.releaseDebug.yamlRuns = [];
  state.releaseDebug.yamlDeployments = [];
  state.releaseDebug.errors = {};
  state.releaseDebug.loaded = false;
  state.releaseDebug.requestToken++;
  state.releaseDebug.environmentsPromise = null;
  state.releaseDebug.classicReleaseDetailsPromise = null;
  state.releaseReadiness.development = [];
  state.releaseReadiness.acceptance = [];
  state.releaseReadiness.warnings = [];
  state.releaseReadiness.error = "";
  state.releaseReadiness.loaded = false;
  state.releaseReadiness.requestToken++;
  state.releaseReadiness.githubComparisons.clear();
  state.releaseReadiness.githubRepositoryMatches.clear();
  state.workItemYamlReferencesCache.clear();
  state.workItemYamlDiscoveryErrors.clear();
  state.workItemYamlDiscoveryRequestTokens.clear();
  state.yamlBuildWorkItemsCache.clear();
  state.recentYamlBuildsProject = "";
  state.recentYamlBuilds = [];
  state.recentYamlBuildsLoaded = false;
  state.recentYamlBuildsPromise = null;
  state.iteration = null;
  state.iterations = [];
  state.currentIterationId = "";
  state.filters.sprint.clear();
  closeSprintMenu();
  render();
  if (state.currentView === "backlog") {
    els.backlogMeta.textContent = "Connect Azure DevOps to load the backlog.";
    els.backlogContent.replaceChildren();
    els.backlogSidebarStatus.textContent = "Connect Azure DevOps to load epics and features.";
    els.backlogHierarchy.replaceChildren();
  }
  if (state.currentView === "for-you") renderForYou();
  if (state.currentView === "wiki") {
    els.wikiTreeStatus.textContent = "Connect Azure DevOps to load the wiki.";
    els.wikiTree.replaceChildren();
    els.wikiPageStatus.textContent = "Wiki unavailable.";
    els.wikiPageContent.replaceChildren();
  }
}

function showSettings() {
  if (!state.pat) return showConnection();
  els.teamSelect.replaceChildren(...state.teams.map(team => {
    const option = document.createElement("option");
    option.value = team.id;
    option.textContent = team.name;
    option.selected = team.id === state.teamId;
    return option;
  }));
  els.stateMappings.replaceChildren(...[...state.knownStates].sort((a, b) => a.localeCompare(b, "en")).map(itemState => {
    const row = document.createElement("div");
    row.className = "mapping-row";
    const label = document.createElement("strong");
    label.textContent = itemState;
    const select = document.createElement("select");
    select.name = `state-${itemState}`;
    select.dataset.state = itemState;
    [["todo", "To do"], ["active", "Doing"], ["done", "Done"], ["hidden", "Hide"]].forEach(([value, text]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      option.selected = state.mapping[itemState] === value;
      select.append(option);
    });
    row.append(label, select);
    return row;
  }));
  els.githubRepoSettings.hidden = !state.githubToken;
  els.githubAllOwners.checked = state.githubAllOwners;
  els.githubOwnerOptions.replaceChildren();
  els.githubOwnerStatus.textContent = "";
  els.githubOwnerStatus.classList.remove("is-error");
  els.githubAllRepos.checked = state.githubAllRepos;
  state.githubRepositoryDraft = new Set(state.githubRepos);
  state.githubRepositoryDraftInitialized = state.githubRepos.length > 0;
  els.githubRepoOptions.replaceChildren();
  els.githubRepoStatus.textContent = "";
  els.githubRepoStatus.classList.remove("is-error");
  updateGithubOwnerSettings();
  updateGithubRepositorySettings();
  els.settingsDialog.showModal();
  if (state.githubToken) loadGithubOwnerChoices();
}

function showConnection(error = "") {
  els.orgUrl.value = state.orgUrl;
  els.pat.value = state.pat;
  els.githubToken.value = state.githubToken;
  els.connectionError.textContent = error;
  if (els.settingsDialog.open) els.settingsDialog.close();
  if (!els.connectionDialog.open) els.connectionDialog.showModal();
}

function setLoading(value) {
  state.loading = value;
  els.refresh.disabled = value;
  els.sprintTitle.disabled = value || !state.iterations.length;
  els.refresh.classList.toggle("is-spinning", value);
  if (value) {
    closeSprintMenu();
    document.querySelectorAll(".card-list").forEach(list => {
      list.classList.remove("is-grouped");
      list.replaceChildren(...Array.from({ length: 3 }, () => {
        const node = document.createElement("div");
        node.className = "skeleton";
        return node;
      }));
    });
  }
}

function showNotice(message, type = "info", actionLabel = "", action = null) {
  const notice = document.createElement("div");
  notice.className = `notice ${type === "error" ? "error" : ""}`;
  const text = document.createElement("span");
  text.textContent = message;
  notice.append(text);
  if (actionLabel && action) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = actionLabel;
    button.addEventListener("click", action);
    notice.append(button);
  }
  els.status.replaceChildren(notice);
}

function clearNotice() { els.status.replaceChildren(); }
function formatDate(value) { return value ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(value)) : ""; }
function formatDateTime(value) { return value ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : ""; }
function escapeHtml(value) { const node = document.createElement("span"); node.textContent = value; return node.innerHTML; }

function renderGithubOwnerChoices() {
  const selectedOwners = new Set(state.githubOwners.map(owner => owner.toLocaleLowerCase("en")));
  const useStoredSelection = selectedOwners.size > 0;
  els.githubOwnerOptions.replaceChildren(...state.githubOwnerChoices.map(owner => {
    const label = document.createElement("label");
    label.className = "github-owner-option";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = owner.login;
    checkbox.checked = !useStoredSelection || selectedOwners.has(owner.login.toLocaleLowerCase("en"));
    const name = document.createElement("span");
    name.textContent = owner.login;
    const type = document.createElement("small");
    type.textContent = owner.type === "Organization" ? "Organization" : "Personal";
    label.append(checkbox, name, type);
    return label;
  }));
  updateGithubOwnerSettings();
}

async function loadGithubOwnerChoices() {
  if (!state.githubToken) return;
  const token = state.githubToken;
  els.githubOwnerStatus.textContent = "Loading accessible users and organizations…";
  els.githubOwnerStatus.classList.remove("is-error");
  try {
    const repositories = await loadGithubAccessibleRepositories();
    if (token !== state.githubToken) return;
    const owners = new Map();
    repositories.forEach(repository => {
      const login = String(repository.owner?.login || repository.full_name?.split("/")[0] || "").trim();
      if (!login) return;
      const key = login.toLocaleLowerCase("en");
      if (!owners.has(key)) owners.set(key, { login, type: repository.owner?.type || "User" });
    });
    state.githubOwnerChoices = [...owners.values()]
      .sort((a, b) => a.login.localeCompare(b.login, "en", { sensitivity: "base", numeric: true }));
    renderGithubOwnerChoices();
    els.githubOwnerStatus.textContent = state.githubOwnerChoices.length
      ? ""
      : "No accessible repository owners were found for this token.";
  } catch (error) {
    console.error(error);
    state.githubOwnerChoices = [];
    els.githubOwnerOptions.replaceChildren();
    els.githubOwnerStatus.textContent = error.message || "GitHub owners could not be loaded.";
    els.githubOwnerStatus.classList.add("is-error");
  }
}

function updateGithubOwnerSettings() {
  els.githubOwnerOptions.hidden = els.githubAllOwners.checked;
  if (els.githubAllOwners.checked) {
    els.githubOwnerStatus.textContent = "";
    els.githubOwnerStatus.classList.remove("is-error");
  }
  if (!els.githubAllRepos.checked) refreshGithubRepositoryChoices();
}

function updateGithubRepositorySettings() {
  const showRepositories = !els.githubAllRepos.checked;
  els.githubRepoOptions.hidden = !showRepositories;
  if (showRepositories) refreshGithubRepositoryChoices();
  else {
    els.githubRepoStatus.textContent = "";
    els.githubRepoStatus.classList.remove("is-error");
  }
}

function selectedGithubOwnersInSettings() {
  if (els.githubAllOwners.checked) return state.githubOwnerChoices.map(owner => owner.login);
  return [...els.githubOwnerOptions.querySelectorAll("input[type=checkbox]:checked")].map(input => input.value);
}

async function refreshGithubRepositoryChoices() {
  const requestToken = ++state.githubSettingsRepositoryRequestToken;
  const ownerLogins = selectedGithubOwnersInSettings();
  if (!ownerLogins.length) {
    state.githubSettingsRepositories = [];
    renderGithubRepositoryChoices();
    return;
  }
  els.githubRepoStatus.textContent = "Loading repositories…";
  els.githubRepoStatus.classList.remove("is-error");
  try {
    const repositories = await loadGithubRepositoriesForOwners(ownerLogins);
    if (requestToken !== state.githubSettingsRepositoryRequestToken || !els.settingsDialog.open) return;
    state.githubSettingsRepositories = repositories;
    renderGithubRepositoryChoices();
  } catch (error) {
    console.error(error);
    if (requestToken !== state.githubSettingsRepositoryRequestToken || !els.settingsDialog.open) return;
    state.githubSettingsRepositories = [];
    els.githubRepoOptions.replaceChildren();
    els.githubRepoStatus.textContent = error.message || "GitHub repositories could not be loaded.";
    els.githubRepoStatus.classList.add("is-error");
  }
}

function renderGithubRepositoryChoices() {
  const repositories = state.githubSettingsRepositories;
  if (!state.githubRepositoryDraftInitialized && repositories.length) {
    repositories.forEach(repository => state.githubRepositoryDraft.add(repository.full_name));
    state.githubRepositoryDraftInitialized = true;
  }
  els.githubRepoOptions.replaceChildren(...repositories.map(repository => {
    const label = document.createElement("label");
    label.className = "github-repository-option";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = repository.full_name;
    checkbox.checked = state.githubRepositoryDraft.has(repository.full_name);
    const name = document.createElement("span");
    name.textContent = repository.full_name;
    const visibility = document.createElement("small");
    visibility.textContent = repository.private ? "Private" : "Public";
    label.append(checkbox, name, visibility);
    return label;
  }));
  els.githubRepoStatus.classList.remove("is-error");
  if (!els.githubAllRepos.checked) {
    els.githubRepoStatus.textContent = repositories.length
      ? ""
      : "No accessible repositories were found for the selected owners.";
  }
}

els.connectionForm.addEventListener("submit", event => {
  event.preventDefault();
  try {
    const previousAzureConnection = `${state.orgUrl}\n${state.pat}`;
    parseAzureUrl(els.orgUrl.value);
    state.orgUrl = els.orgUrl.value.trim();
    state.workItemTypes = [];
    state.workItemTypesProject = "";
    state.authenticatedUser = null;
    state.forYouProjectName = "";
    state.forYouSelectedUser = null;
    state.forYouUserKey = "";
    updateBranding();
    state.pat = els.pat.value.trim();
    if (!state.pat) throw new Error("Enter a PAT.");
    if (`${state.orgUrl}\n${state.pat}` !== previousAzureConnection) {
      state.workItemDeploymentsCache.clear();
      state.workItemDeploymentsErrors.clear();
      state.workItemDeploymentsRequestTokens.clear();
      state.workItemDeploymentSourceKeys.clear();
      state.workItemYamlReferencesCache.clear();
      state.workItemYamlDiscoveryErrors.clear();
      state.workItemYamlDiscoveryRequestTokens.clear();
      state.yamlBuildWorkItemsCache.clear();
      state.githubCommitBuildIdsCache.clear();
      state.azureGithubPullRequestBuildIdsCache.clear();
      state.recentYamlBuildsProject = "";
      state.recentYamlBuilds = [];
      state.recentYamlBuildsLoaded = false;
      state.recentYamlBuildsPromise = null;
      state.releaseDebug.classic = [];
      state.releaseDebug.yamlRuns = [];
      state.releaseDebug.yamlDeployments = [];
      state.releaseDebug.errors = {};
      state.releaseDebug.loaded = false;
      state.releaseDebug.requestToken++;
      state.releaseDebug.environmentsPromise = null;
      state.releaseDebug.classicReleaseDetailsPromise = null;
      state.releaseReadiness.development = [];
      state.releaseReadiness.acceptance = [];
      state.releaseReadiness.warnings = [];
      state.releaseReadiness.error = "";
      state.releaseReadiness.loaded = false;
      state.releaseReadiness.requestToken++;
      state.releaseReadiness.githubComparisons.clear();
      state.releaseReadiness.githubRepositoryMatches.clear();
    }
    const githubToken = els.githubToken.value.trim();
    if (githubToken !== state.githubToken) {
      state.githubPullRequests = [];
      state.githubPullRequestsKey = "";
      state.githubPullRequestsError = "";
      state.githubAccessibleRepositories = [];
      state.githubAccessibleRepositoriesToken = "";
      state.githubOwnerChoices = [];
      state.githubOwnerRepositoriesCache.clear();
      state.githubSettingsRepositories = [];
      state.githubWorkItemPullRequestsCache.clear();
      state.githubWorkItemPullRequestsErrors.clear();
      state.githubWorkItemPullRequestsRequestTokens.clear();
      state.releaseReadiness.loaded = false;
      state.releaseReadiness.githubComparisons.clear();
      state.releaseReadiness.githubRepositoryMatches.clear();
      state.githubCommitBuildIdsCache.clear();
      state.azureGithubPullRequestBuildIdsCache.clear();
      state.workItemDeploymentsCache.clear();
      state.workItemDeploymentsErrors.clear();
      state.workItemDeploymentsRequestTokens.clear();
      state.workItemDeploymentSourceKeys.clear();
      state.githubPullRequestFilters = { repositories: [], authors: [] };
      localStorage.removeItem(STORAGE.githubPrFilters);
    }
    state.githubToken = githubToken;
    localStorage.setItem(STORAGE.url, state.orgUrl);
    localStorage.setItem(STORAGE.pat, state.pat);
    if (state.githubToken) localStorage.setItem(STORAGE.githubToken, state.githubToken);
    else localStorage.removeItem(STORAGE.githubToken);
    els.connectionDialog.close();
    loadBoard({ openSettings: !state.teamId });
  } catch (error) { els.connectionError.textContent = error.message; }
});

els.settingsForm.addEventListener("submit", async event => {
  event.preventDefault();
  const previousTeam = state.teamId;
  const previousGithubKey = githubPullRequestsCacheKey();
  const githubAllOwners = els.githubAllOwners.checked;
  const githubOwners = [...els.githubOwnerOptions.querySelectorAll("input[type=checkbox]:checked")].map(input => input.value);
  if (state.githubToken && !githubAllOwners && !githubOwners.length) {
    els.githubOwnerStatus.textContent = "Select at least one GitHub user or organization.";
    els.githubOwnerStatus.classList.add("is-error");
    return;
  }
  const githubAllRepos = els.githubAllRepos.checked;
  const githubRepos = [...els.githubRepoOptions.querySelectorAll("input[type=checkbox]:checked")].map(input => input.value);
  if (state.githubToken && !githubAllRepos && !githubRepos.length) {
    els.githubRepoStatus.textContent = "Select at least one GitHub repository.";
    els.githubRepoStatus.classList.add("is-error");
    return;
  }
  state.teamId = els.teamSelect.value;
  state.githubAllOwners = githubAllOwners;
  state.githubOwners = githubOwners;
  state.githubAllRepos = githubAllRepos;
  state.githubRepos = githubRepos;
  els.stateMappings.querySelectorAll("select[data-state]").forEach(select => { state.mapping[select.dataset.state] = select.value; });
  localStorage.setItem(STORAGE.team, state.teamId);
  localStorage.setItem(STORAGE.mapping, JSON.stringify(state.mapping));
  localStorage.setItem(STORAGE.githubAllOwners, String(state.githubAllOwners));
  localStorage.setItem(STORAGE.githubOwners, JSON.stringify(state.githubOwners));
  localStorage.setItem(STORAGE.githubAllRepos, String(state.githubAllRepos));
  localStorage.setItem(STORAGE.githubRepos, JSON.stringify(state.githubRepos));
  const githubConfigChanged = previousGithubKey !== githubPullRequestsCacheKey();
  if (githubConfigChanged) {
    state.githubWorkItemPullRequestsCache.clear();
    state.githubWorkItemPullRequestsErrors.clear();
    state.githubWorkItemPullRequestsRequestTokens.clear();
    state.githubCommitBuildIdsCache.clear();
    state.azureGithubPullRequestBuildIdsCache.clear();
    state.workItemDeploymentsCache.clear();
    state.workItemDeploymentsErrors.clear();
    state.workItemDeploymentsRequestTokens.clear();
    state.workItemDeploymentSourceKeys.clear();
    state.releaseReadiness.loaded = false;
    state.releaseReadiness.githubComparisons.clear();
    state.releaseReadiness.githubRepositoryMatches.clear();
  }
  els.settingsDialog.close();
  if (previousTeam !== state.teamId) {
    state.filters.sprint.clear();
    state.backlogItems = [];
    state.backlogEpics = [];
    state.backlogFeatures = [];
    state.backlogTeamId = "";
    state.backlogCollapsedEpics.clear();
    state.backlogCollapsedFeatures.clear();
    state.backlogSelectedIds.clear();
    state.backlogSelectionAnchorId = null;
    loadBoard();
  } else if (githubConfigChanged && state.currentView === "for-you") {
    state.githubPullRequestsKey = "";
    await loadForYou(true);
  } else if (githubConfigChanged && state.currentView === "releases") {
    await loadReleaseDebugPage(true);
  } else render();
});

document.querySelectorAll("[data-close-settings]").forEach(button => button.addEventListener("click", () => els.settingsDialog.close()));
document.querySelectorAll("[data-close-create-work-item]").forEach(button => button.addEventListener("click", requestCloseCreateWorkItemDialog));
document.querySelectorAll("[data-close-work-item]").forEach(button => button.addEventListener("click", requestCloseWorkItemDialog));
els.deleteWorkItem.addEventListener("click", deleteSelectedWorkItem);
document.querySelectorAll("[data-activity-tab]").forEach(button => button.addEventListener("click", () => setActivityTab(button.dataset.activityTab)));
els.workItemState.addEventListener("click", event => { event.stopPropagation(); toggleWorkItemStateMenu(); });
els.workItemStateMenu.addEventListener("click", event => event.stopPropagation());
els.workItemAssignee.addEventListener("click", event => { event.stopPropagation(); toggleWorkItemAssigneeMenu(); });
els.workItemAssigneeMenu.addEventListener("click", event => event.stopPropagation());
els.workItemAssigneeSearch.addEventListener("input", () => {
  const item = selectedWorkItem();
  if (item) renderWorkItemAssigneeOptions(item);
});
els.workItemAssigneeSearch.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    closeWorkItemAssigneeMenu();
    els.workItemAssignee.focus();
  }
});
els.workItemTags.addEventListener("click", event => { event.stopPropagation(); toggleWorkItemTagsMenu(); });
els.workItemTagsMenu.addEventListener("click", event => event.stopPropagation());
els.workItemTagsInput.addEventListener("input", () => {
  const item = selectedWorkItem();
  if (item) renderWorkItemTagOptions(item);
});
els.workItemTagsInput.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    closeWorkItemTagsMenu();
    els.workItemTags.focus();
  } else if (event.key === "Enter") {
    event.preventDefault();
    const item = selectedWorkItem();
    if (item) addWorkItemTag(item, els.workItemTagsInput.value);
  }
});
els.workItemPriority.addEventListener("click", event => { event.stopPropagation(); toggleWorkItemPriorityMenu(); });
els.workItemPoints.addEventListener("click", event => { event.stopPropagation(); toggleWorkItemPointsMenu(); });
els.workItemArea.addEventListener("click", event => { event.stopPropagation(); toggleWorkItemAreaMenu(); });
els.workItemIteration.addEventListener("click", event => { event.stopPropagation(); toggleWorkItemIterationMenu(); });
[els.workItemPriorityMenu, els.workItemPointsMenu, els.workItemAreaMenu, els.workItemIterationMenu]
  .forEach(menu => menu.addEventListener("click", event => event.stopPropagation()));
els.workItemPointsForm.addEventListener("submit", async event => {
  event.preventDefault();
  const item = selectedWorkItem();
  if (!item) return;
  const value = Number(els.workItemPointsInput.value);
  if (!Number.isFinite(value) || value < 0) return;
  els.workItemPointsInput.disabled = true;
  try {
    const field = await resolvePointsField(item);
    if (!field) throw new Error(`No Story Points or Effort field was found for work item type “${item.type}”.`);
    await updateWorkItemField(item, field, value, "Story points");
  } catch (error) {
    console.error(error);
    els.workItemLoadStatus.textContent = error.message || "Story points could not be saved.";
    els.workItemLoadStatus.classList.add("is-error");
  } finally {
    els.workItemPointsInput.disabled = false;
  }
});
els.workItemAreaSearch.addEventListener("input", async () => {
  const item = selectedWorkItem();
  if (!item) return;
  try { renderAreaOptions(item, await loadAreaPaths()); } catch {}
});
els.workItemIterationSearch.addEventListener("input", async () => {
  const item = selectedWorkItem();
  if (!item) return;
  try { renderIterationOptions(item, await loadTeamIterations()); } catch {}
});
[els.workItemAreaSearch, els.workItemIterationSearch, els.workItemPointsInput].forEach(input => input.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  event.preventDefault();
  event.stopPropagation();
  closeWorkItemDetailFieldMenus();
}));
els.descriptionEditButton.addEventListener("click", () => openDescriptionEditor());
els.acceptanceCriteriaEditButton.addEventListener("click", () => openDescriptionEditor("acceptance-criteria"));
els.systemInfoEditButton.addEventListener("click", () => openDescriptionEditor("system-info"));
els.descriptionEditorCancel.addEventListener("click", discardDescriptionEditor);
els.descriptionEditorForm.addEventListener("submit", submitDescriptionEditor);
els.descriptionViewTabs.forEach(tab => tab.addEventListener("click", () => setDescriptionEditorView(tab.dataset.descriptionView)));
document.querySelectorAll("[data-description-command]").forEach(button => {
  button.addEventListener("mousedown", event => event.preventDefault());
  button.addEventListener("click", () => applyDescriptionCommand(button.dataset.descriptionCommand));
});
els.descriptionEditor.addEventListener("keydown", event => {
  if (handleMentionKeydown("description", event)) return;
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    const editButton = descriptionEditorMode === "system-info"
      ? els.systemInfoEditButton
      : descriptionEditorMode === "acceptance-criteria" ? els.acceptanceCriteriaEditButton : els.descriptionEditButton;
    if (discardDescriptionEditor()) editButton.focus();
  } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    els.descriptionEditorForm.requestSubmit();
  }
});
els.descriptionEditor.addEventListener("input", () => {
  descriptionEditorRevision++;
  updateMentionSuggestions("description");
});
els.descriptionEditor.addEventListener("change", () => { descriptionEditorRevision++; });
els.descriptionSourceEditor.addEventListener("input", () => { descriptionEditorRevision++; });
els.descriptionSourceEditor.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    const editButton = descriptionEditorMode === "system-info"
      ? els.systemInfoEditButton
      : descriptionEditorMode === "acceptance-criteria" ? els.acceptanceCriteriaEditButton : els.descriptionEditButton;
    if (discardDescriptionEditor()) editButton.focus();
  } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    els.descriptionEditorForm.requestSubmit();
  }
});
els.workItemTitle.addEventListener("click", openWorkItemTitleEditor);
els.workItemTitle.addEventListener("keydown", event => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  openWorkItemTitleEditor();
});
els.workItemTitleCancel.addEventListener("click", discardWorkItemTitleEditor);
els.workItemTitleForm.addEventListener("submit", submitWorkItemTitle);
els.workItemTitleInput.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  event.preventDefault();
  event.stopPropagation();
  if (discardWorkItemTitleEditor()) els.workItemTitle.focus();
});
els.sprintTitle.addEventListener("click", event => { event.stopPropagation(); toggleSprintMenu(); });
els.sprintMenu.addEventListener("click", event => event.stopPropagation());
els.sprintMenuSearch.addEventListener("input", renderSprintMenuOptions);
els.sprintMenuSearch.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  event.preventDefault();
  event.stopPropagation();
  closeSprintMenu();
  els.sprintTitle.focus();
});
els.commentComposerPrompt.addEventListener("click", () => setCommentComposerExpanded(true));
els.commentComposerCancel.addEventListener("click", discardCommentComposer);
els.commentComposerForm.addEventListener("submit", submitWorkItemComment);
els.commentComposerInput.addEventListener("keydown", event => {
  if (handleMentionKeydown("comment", event)) return;
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    discardCommentComposer();
  } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    els.commentComposerForm.requestSubmit();
  }
});
els.commentComposerInput.addEventListener("input", () => updateMentionSuggestions("comment"));
els.workItemDialog.addEventListener("cancel", event => {
  if (!els.workItemTitleForm.hidden) {
    event.preventDefault();
    discardWorkItemTitleEditor();
    return;
  }
  if (!els.descriptionEditorForm.hidden) {
    event.preventDefault();
    discardDescriptionEditor();
    return;
  }
  if (!els.commentComposerForm.hidden) {
    event.preventDefault();
    discardCommentComposer();
    return;
  }
  if ([els.workItemPriorityMenu, els.workItemPointsMenu, els.workItemAreaMenu, els.workItemIterationMenu].some(menu => !menu.hidden)) {
    event.preventDefault();
    closeWorkItemDetailFieldMenus();
    return;
  }
  if (!els.workItemTagsMenu.hidden) {
    event.preventDefault();
    closeWorkItemTagsMenu();
    return;
  }
  if (!els.workItemAssigneeMenu.hidden) {
    event.preventDefault();
    closeWorkItemAssigneeMenu();
    return;
  }
  if (!els.workItemStateMenu.hidden) {
    event.preventDefault();
    closeWorkItemStateMenu();
    return;
  }
  event.preventDefault();
  requestCloseWorkItemDialog();
});
els.workItemDialog.addEventListener("close", () => {
  els.workItemActions.open = false;
  closeWorkItemStateMenu();
  closeWorkItemAssigneeMenu();
  closeWorkItemTagsMenu();
  closeWorkItemDetailFieldMenus();
  resetWorkItemTitleEditor();
  resetDescriptionEditor();
  resetCommentComposer();
  if (state.currentView === "backlog") renderBacklog();
  if (state.currentView === "for-you") renderForYou();
  state.selectedItemId = null;
  state.selectedItem = null;
  if (!state.routeApplying) writeAppRoute(currentAppRoute({ itemId: null }));
});
els.workItemDialog.addEventListener("click", event => { if (event.target === els.workItemDialog) requestCloseWorkItemDialog(); });
window.addEventListener("beforeunload", event => {
  if (!hasUnsavedChanges()) return;
  event.preventDefault();
  event.returnValue = "";
});
els.cancelConnection.addEventListener("click", () => els.connectionDialog.close());
els.githubAllOwners.addEventListener("change", updateGithubOwnerSettings);
els.githubOwnerOptions.addEventListener("change", event => {
  if (!event.target.matches("input[type=checkbox]")) return;
  els.githubOwnerStatus.textContent = "";
  els.githubOwnerStatus.classList.remove("is-error");
  if (!els.githubAllRepos.checked) refreshGithubRepositoryChoices();
});
els.githubAllRepos.addEventListener("change", updateGithubRepositorySettings);
els.githubRepoOptions.addEventListener("change", event => {
  if (!event.target.matches("input[type=checkbox]")) return;
  if (event.target.checked) state.githubRepositoryDraft.add(event.target.value);
  else state.githubRepositoryDraft.delete(event.target.value);
  els.githubRepoStatus.textContent = "";
  els.githubRepoStatus.classList.remove("is-error");
});
els.changeConnection.addEventListener("click", () => showConnection());
els.theme.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true);
});
els.headerAvatar.addEventListener("click", showSettings);
els.createWorkItemButton.addEventListener("click", event => {
  event.stopPropagation();
  toggleCreateWorkItemMenu();
});
els.createWorkItemMenu.addEventListener("click", event => event.stopPropagation());
els.createWorkItemMenu.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  event.preventDefault();
  closeCreateWorkItemMenu();
  els.createWorkItemButton.focus();
});
els.createWorkItemForm.addEventListener("submit", submitCreateWorkItem);
els.createWorkItemDialog.addEventListener("cancel", event => {
  event.preventDefault();
  requestCloseCreateWorkItemDialog();
});
els.createWorkItemDialog.addEventListener("close", () => {
  els.createWorkItemTitle.value = "";
  els.createWorkItemError.textContent = "";
  els.createWorkItemParent.hidden = true;
  els.createWorkItemParentLabel.textContent = "";
  state.createWorkItemParent = null;
});
els.createWorkItemDialog.addEventListener("click", event => {
  if (event.target === els.createWorkItemDialog) requestCloseCreateWorkItemDialog();
});
els.backlogPositionForm.addEventListener("submit", moveBacklogItemToPosition);
document.querySelectorAll("[data-close-backlog-position]").forEach(button => {
  button.addEventListener("click", () => closeBacklogPositionDialog());
});
els.backlogPositionDialog.addEventListener("cancel", event => {
  event.preventDefault();
  closeBacklogPositionDialog();
});
els.backlogPositionDialog.addEventListener("click", event => {
  if (event.target === els.backlogPositionDialog) closeBacklogPositionDialog();
});
els.backlogPositionDialog.addEventListener("close", () => {
  state.backlogPositionItemIds = [];
  state.backlogPositionGroupKey = "";
  els.backlogPositionError.textContent = "";
});
for (const [button, content] of [
  [els.filterPanelToggle, els.filterPanelBody],
  [els.forYouCustomFiltersToggle, els.forYouCustomFiltersBody],
  [els.githubPrFiltersToggle, els.githubPrFiltersBody],
  [els.backlogHierarchyToggle, els.backlogSidebar],
  [els.wikiNavigationToggle, els.wikiSidebar]
]) {
  button.addEventListener("click", () => {
    toggleMobileDisclosure(button, content);
    if (content === els.forYouCustomFiltersBody && content.hidden) els.forYouCustomTags.open = false;
    if (content === els.githubPrFiltersBody && content.hidden) {
      els.githubPrRepositories.open = false;
      els.githubPrAuthors.open = false;
    }
  });
}
els.forYouNav.addEventListener("click", () => showMainView("for-you"));
els.forYouPerson.addEventListener("click", event => {
  event.stopPropagation();
  toggleForYouPersonMenu();
});
els.forYouPersonMenu.addEventListener("click", event => event.stopPropagation());
els.forYouPersonSearch.addEventListener("input", renderForYouPersonOptions);
els.forYouPersonSearch.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  event.preventDefault();
  event.stopPropagation();
  closeForYouPersonMenu();
  els.forYouPerson.focus();
});
[els.forYouCustomAssignee, els.forYouCustomState, els.forYouCustomType, els.forYouCustomTagMode]
  .forEach(select => select.addEventListener("change", refreshForYouCustomTable));
els.forYouCustomTagOptions.addEventListener("change", event => {
  if (event.target.matches('input[type="checkbox"]')) refreshForYouCustomTable();
});
els.forYouCustomShowAll.addEventListener("click", () => {
  state.forYouExpanded.custom = !state.forYouExpanded.custom;
  renderForYouCustomTable();
  if (!state.forYouExpanded.custom) els.forYouCustomShowAll.scrollIntoView({ block: "nearest" });
});
els.githubPrRepositoryOptions.addEventListener("change", event => {
  if (event.target.matches('input[type="checkbox"]')) updateGithubPullRequestFilters();
});
els.githubPrAuthorOptions.addEventListener("change", event => {
  if (event.target.matches('input[type="checkbox"]')) updateGithubPullRequestFilters();
});
els.githubPrShowAll.addEventListener("click", () => {
  state.forYouExpanded.github = !state.forYouExpanded.github;
  renderGithubPullRequests();
  if (!state.forYouExpanded.github) els.githubPrShowAll.scrollIntoView({ block: "nearest" });
});
els.forYouWorkShowAll.addEventListener("click", () => toggleForYouSection("work"));
els.forYouMentionsShowAll.addEventListener("click", () => toggleForYouSection("mentions"));
els.forYouActivityShowAll.addEventListener("click", () => toggleForYouSection("activity"));
els.forYouCreatedShowAll.addEventListener("click", () => toggleForYouSection("created"));
els.forYouUpdatedShowAll.addEventListener("click", () => toggleForYouSection("updated"));
els.forYouCompletedShowAll.addEventListener("click", () => toggleForYouSection("completed"));
els.globalSearchForm.addEventListener("submit", event => {
  event.preventDefault();
  runGlobalSearch(els.globalSearchInput.value);
});
els.globalSearchPageForm.addEventListener("submit", event => {
  event.preventDefault();
  runGlobalSearch(els.globalSearchPageInput.value);
});
els.sprintBoardNav.addEventListener("click", () => showMainView("board"));
els.backlogNav.addEventListener("click", () => showMainView("backlog"));
els.wikiNav.addEventListener("click", () => showMainView("wiki"));
els.releasesNav.addEventListener("click", () => showMainView("releases"));
els.releasesRefresh.addEventListener("click", () => loadReleaseDebugPage(true));
els.wikiSelect.addEventListener("change", async () => {
  state.wikiId = els.wikiSelect.value;
  state.routeWikiPath = "";
  localStorage.setItem(STORAGE.wiki, state.wikiId);
  state.wikiRoot = null;
  state.wikiPage = null;
  state.wikiProjectName = "";
  await loadWiki(true);
});
els.wikiSearch.addEventListener("input", event => {
  state.wikiQuery = event.target.value;
  renderWikiTree();
  scheduleRouteQueryUpdate();
});
els.backlogShowAllFeatures.addEventListener("click", () => {
  state.filters.feature.clear();
  if (mobileLayoutQuery.matches) setMobileDisclosure(els.backlogHierarchyToggle, els.backlogSidebar, false);
  renderBacklog();
});
els.refresh.addEventListener("click", () => {
  if (state.currentView === "wiki") return loadWiki(true);
  if (state.currentView === "releases") return loadReleaseDebugPage(true);
  if (state.currentView === "search") return runGlobalSearch(state.globalSearchQuery);
  return loadBoard();
});
els.search.addEventListener("input", event => {
  state.search = event.target.value;
  render();
  scheduleRouteQueryUpdate();
});
els.backlogSearch.addEventListener("input", event => {
  state.backlogSearch = event.target.value;
  renderBacklog();
  scheduleRouteQueryUpdate();
});
els.forYouSearch.addEventListener("input", event => {
  state.forYouSearch = event.target.value;
  renderForYou();
  scheduleRouteQueryUpdate();
});
els.boardGroupOptions.forEach(option => option.addEventListener("click", () => {
  state.boardGroupBy = option.dataset.boardGroup;
  localStorage.setItem(STORAGE.boardGroupBy, state.boardGroupBy);
  els.boardGroupControl.open = false;
  render();
}));
els.clearFilters.addEventListener("click", async () => {
  const hadSprintFilter = Boolean(state.filters.sprint.size);
  Object.values(state.filters).forEach(values => values.clear());
  if (hadSprintFilter && state.currentView !== "backlog") {
    setLoading(true);
    try { await applySprintFilter(); }
    catch (error) { console.error(error); showNotice(error.message || "The current sprint could not be loaded.", "error"); }
    finally { setLoading(false); }
  }
  renderCurrentView();
});

document.addEventListener("click", event => {
  if (!els.workItemActions.contains(event.target)) els.workItemActions.open = false;
  document.querySelectorAll(".backlog-row-menu[open]").forEach(menu => {
    if (!menu.contains(event.target)) menu.open = false;
  });
  if (event.target.closest?.("a.user-mention")) event.preventDefault();
  const workItemLink = event.target.closest?.("a.internal-work-item-link");
  if (workItemLink) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (!workItemLink.closest('[contenteditable="true"]')) showLinkedWorkItem(Number(workItemLink.dataset.workItemId));
  }
  if (!els.descriptionMentionMenu.contains(event.target) && !els.descriptionEditor.contains(event.target)) closeMentionMenu("description");
  if (!els.commentMentionMenu.contains(event.target) && !els.commentComposerInput.contains(event.target)) closeMentionMenu("comment");
  if (!els.forYouPersonControl.contains(event.target)) closeForYouPersonMenu();
  if (!els.forYouCustomTags.contains(event.target)) els.forYouCustomTags.open = false;
  if (!els.githubPrRepositories.contains(event.target)) els.githubPrRepositories.open = false;
  if (!els.githubPrAuthors.contains(event.target)) els.githubPrAuthors.open = false;
  if (!els.createWorkItemControl.contains(event.target)) closeCreateWorkItemMenu();
  if (!els.sprintTitleControl.contains(event.target)) closeSprintMenu();
  if (!els.boardGroupControl.contains(event.target)) els.boardGroupControl.open = false;
  if (!els.workItemStateControl.contains(event.target)) closeWorkItemStateMenu();
  if (!els.workItemAssigneeControl.contains(event.target)) closeWorkItemAssigneeMenu();
  if (!els.workItemTagsControl.contains(event.target)) closeWorkItemTagsMenu();
  if (![els.workItemPriorityControl, els.workItemPointsControl, els.workItemAreaControl, els.workItemIterationControl].some(control => control.contains(event.target))) closeWorkItemDetailFieldMenus();
  document.querySelectorAll(".filter-menu[open]").forEach(menu => {
    if (!menu.contains(event.target)) menu.removeAttribute("open");
  });
});

const systemTheme = matchMedia("(prefers-color-scheme: dark)");
systemTheme.addEventListener?.("change", event => {
  if (!localStorage.getItem(STORAGE.theme)) applyTheme(event.matches ? "dark" : "light");
});
mobileLayoutQuery.addEventListener?.("change", event => applyMobileDisclosures(event.matches));
function scheduleAppHistoryNavigation() {
  window.clearTimeout(state.routeNavigationTimer);
  state.routeNavigationTimer = window.setTimeout(() => {
    const route = parseAppRoute();
    if (!state.routeReady) {
      primeAppRouteState(route);
      return;
    }
    applyAppRoute(route).catch(error => {
      console.error(error);
      showNotice(error.message || "The requested page could not be opened.", "error");
    });
  }, 0);
}

window.addEventListener("popstate", scheduleAppHistoryNavigation);
window.addEventListener("hashchange", scheduleAppHistoryNavigation);

applyTheme(document.documentElement.dataset.theme || "light");
applyMobileDisclosures(mobileLayoutQuery.matches);
const initialAppRoute = parseAppRoute();
primeAppRouteState(initialAppRoute);
writeAppRoute(initialAppRoute, { replace: true });
if (state.pat) loadBoard(); else { renderEmptyBoard(); showConnection(); }
