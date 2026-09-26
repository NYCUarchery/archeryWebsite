# Graph Report - archeryWebsite  (2026-09-26)

## Corpus Check
- 323 files · ~275,047 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 31 file(s) not represented in the graph (top: .scss 14, (none) 10, .example 2)

## Summary
- 2704 nodes · 8624 edges · 111 communities (88 shown, 23 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 463 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `52c04f9f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- MatchResult.go
- Competition.ts
- Api.ts
- test-env.mjs
- gorm.io/gorm.DB
- ApiClient.ts
- testing.T
- @elimination/[teamSize]/page.tsx
- @mui/material
- [phase]/@qualification/page.tsx
- ErrorInternalErrorTest
- AcceptPrint
- github.com/gin-gonic/gin.Context
- net/http.Cookie
- elimination/[teamSize]/page.tsx
- EliminationBracketIntegrationTestSuite
- competitionLifecycle.spec.ts
- RoleToString
- ComputeMatchOutcome
- recordingBoard.spec.ts
- teamLifecycle.ts
- react
- formalApi.ts
- migration.go
- ResetTestDatabase
- resultSnapshot.ts
- scoring/@qualification/page.tsx
- compilerOptions
- Load
- package.json
- Elimination
- ErrorReceiveDataTest
- prunePath
- dependencies
- RankingDialog.tsx
- store.ts
- DatabaseInitial
- TestDatabaseInitialPreservesExistingDictator
- MatchResult
- judgeCorrections.ts
- PlayerSet
- SwagRouter.go
- setupMatchEndWithScores
- PlayerTestSuite
- eliminationScoringSlice.ts
- 000001_prod_baseline.up.sql
- v1_show_create.sql
- elimination.ts
- preview.js
- JudgeEliminationBoard.tsx
- verification.ts
- app/layout.tsx
- eliminationPlayerSetRanking.spec.ts
- Requester
- devDependencies
- 首頁與比賽列表視覺提案 v3
- CompetitionPostFields.tsx
- eliminationFixtures.ts
- database/sql.DB
- Sidebar.tsx
- DatabaseMatchOutcomeStatus
- ReorderPlayerSets
- AddApiRouter
- scripts
- ContentType
- RBACMiddleware
- qualificationRankingDialog.spec.ts
- scopeNavigation.ts
- ComputeMatchPoints
- vitest
- Qualification
- qualificationScoreSummary.spec.ts
- Production deployment and HTTPS guide
- @elimination/page.tsx
- eliminationScoring.spec.ts
- browser/fixtures.ts
- ErrorIdTest
- HttpClient
- eliminationBracket.spec.ts
- compilerOptions
- Archery OpenAPI contract
- Lane
- go_pkg_io_fs
- theme.d.ts
- Development Compose stack
- Archery Target Mark
- Deployment configuration validation
- Continuous integration test matrix
- Second 25th Fengcheng Cup newcomer qualification results
- Array
- Reverse Proxy Kubernetes Service
- LaneBoard/LaneNumber.tsx
- MySQL Kubernetes deployment
- internal/scripts/test.sh
- next.config.mjs
- next-env.d.ts
- User.ts
- Backend Kubernetes deployment
- Profile frontend Kubernetes deployment
- Scoring frontend Kubernetes deployment
- match_results
- Development seeder scenarios
- scripts/test.sh
- eliminations
- Reverse proxy Kubernetes deployment
- backend

## God Nodes (most connected - your core abstractions)
1. `ErrorInternalErrorTest()` - 120 edges
2. `Convert2uint()` - 104 edges
3. `@mui/material` - 84 edges
4. `ErrorIdTest()` - 83 edges
5. `EliminationBracketIntegrationTestSuite` - 65 edges
6. `AcceptPrint()` - 56 edges
7. `react-query` - 48 edges
8. `react` - 47 edges
9. `apiClient` - 46 edges
10. `Elimination` - 40 edges

## Surprising Connections (you probably didn't know these)
- `Isolated E2E Compose stack` --semantically_similar_to--> `E2E runner lifecycle`  [INFERRED] [semantically similar]
  docker-compose-e2e.yml → docs/testing.md
- `Production Compose stack` --semantically_similar_to--> `Production deployment and HTTPS guide`  [INFERRED] [semantically similar]
  docker-compose.yml → docs/deployment.md
- `TestDatabaseInitialPreservesExistingDictator()` --calls--> `DatabaseInitial()`  [INFERRED]
  backend/internal/database/dictator_startup_integration_test.go → backend/internal/database/DB.go
- `TestDatabaseInitialRejectsNonDictatorUsernameCollision()` --calls--> `DatabaseInitial()`  [INFERRED]
  backend/internal/database/dictator_startup_integration_test.go → backend/internal/database/DB.go
- `TestNonProductionInitializersRejectNonCurrentMigrationStateWithoutSchemaRepair()` --calls--> `DatabaseInitial()`  [INFERRED]
  backend/internal/database/startup_migration_integration_test.go → backend/internal/database/DB.go

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Server-authoritative scoring lifecycle** — docs_scoring_qualification_authorization, docs_scoring_elimination_authorization, docs_scoring_outcome_resolution, docs_scoring_bracket_progression [EXTRACTED 1.00]
- **Runner-controlled isolated E2E execution** — docker_compose_e2e_tmpfs_mysql, docker_compose_e2e_runner_owned_backend, docker_compose_e2e_loopback_proxy, docs_testing_e2e_runner_lifecycle [INFERRED 0.85]

## Communities (111 total, 23 thin omitted)

### Community 0 - "MatchResult.go"
Cohesion: 0.07
Nodes (101): DropCompetition(), DropTables(), DropElimination(), DropGroupInfo(), AllInstitutionInfo(), DeleteInstitutionByID(), DropInstitution(), GetInstitutionIsExist() (+93 more)

### Community 1 - "Competition.ts"
Cohesion: 0.08
Nodes (27): DeleteGroupButton(), Props, columns, GroupGrid(), Props, AccordionSummaryStyle, GroupMenu(), Props (+19 more)

### Community 2 - "Api.ts"
Cohesion: 0.02
Nodes (91): EliminationProgressControl(), Props, stageLabel(), standardStageDenominators(), Header(), HeaderProps, navigation, RootLayout() (+83 more)

### Community 3 - "test-env.mjs"
Cohesion: 0.06
Nodes (55): ref_node_assert, ref_node_child_process, ref_node_crypto, ref_node_fs, ref_node_os, ref_node_path, ref_node_test, ref_node_url (+47 more)

### Community 4 - "gorm.io/gorm.DB"
Cohesion: 0.06
Nodes (86): main(), requestedScenarios(), GetAllCompetition(), GetCompetitionsOfUser(), GetCompetitionWGroups(), GetCompetitionWGroupsPlayersScores(), GetCompetitionWParticipants(), GetCurrentCompetitions() (+78 more)

### Community 5 - "ApiClient.ts"
Cohesion: 0.06
Nodes (30): bowTypes, GroupCreator(), postGroup(), Props, Page(), RankingRow, toRankingRows(), MyCompetitionPage() (+22 more)

### Community 6 - "testing.T"
Cohesion: 0.04
Nodes (52): TestValidateSeederForbidsProductionButDoesNotRequireSession(), TestValidateServerProductionSessionKeyLength(), TestValidateServerRequiredFieldsAndEnvironment(), validApp(), TestMatchResultOmitsUnknownPlayerSetID(), TestEliminationProgressTestSuite(), TestPlayerTestSuite(), TestTestDatabaseConfigValidate() (+44 more)

### Community 7 - "@elimination/[teamSize]/page.tsx"
Cohesion: 0.07
Nodes (45): DetailTeamHeader(), laneLabel(), MobileStages(), MobileTeamRow(), Page(), playerSetFor(), stageLabel(), teamMembers() (+37 more)

### Community 8 - "@mui/material"
Cohesion: 0.07
Nodes (33): Props, ScoreBar(), CustomSnackbarProps, cloneEnd(), endTotal(), QualificationScoreEditor(), Props, ScoreBlock() (+25 more)

### Community 9 - "[phase]/@qualification/page.tsx"
Cohesion: 0.09
Nodes (26): LaneBlock(), Props, Page(), LaneBoard(), Props, NameBar(), Props, PlayerInfo() (+18 more)

### Community 10 - "ErrorInternalErrorTest"
Cohesion: 0.06
Nodes (69): AddOneCompetitionGroupNum(), GetCompetitionGroupIds(), GetCompetitionGroupNum(), GetCompetitionUnassignedGroupId(), GetOnlyCompetition(), MinusOneCompetitionGroupNum(), UpdateCompetitionEliminationActive(), UpdateCompetitionGroupNum() (+61 more)

### Community 11 - "AcceptPrint"
Cohesion: 0.08
Nodes (62): GetOnlyEliminationById(), GetStageById(), GetStageIsExist(), GetMatchResultIsExist(), GetPlayerSetIsExist(), UpdatePlayerSetName(), TestBracketSizesAndStageShapes(), TestExpectedBracketMatchCounts() (+54 more)

### Community 12 - "github.com/gin-gonic/gin.Context"
Cohesion: 0.07
Nodes (58): GetCompetitionIsExist(), UpdateCompetitionCurrentPhaseMinus(), UpdateCompetitionCurrentPhasePlus(), DeleteElimination(), GetEliminationIsExist(), GetMedalById(), GetMedalIsExist(), Medal (+50 more)

### Community 13 - "net/http.Cookie"
Cohesion: 0.07
Nodes (10): AutoPlayerSetIntegrationTestSuite, BracketAdvanceResponse, BracketFirstRoundSyncResponse, BracketInitResponse, MatchWinnerResponse, PlayerSetRankingIntegrationTestSuite, PlayerSetRankingResponse, UpdatePlayerSetRankingRequest (+2 more)

### Community 14 - "elimination/[teamSize]/page.tsx"
Cohesion: 0.15
Nodes (20): getOutcomeStatus(), MatchOutcomeStatus, Page(), PlayerSetOption, MatchHeader(), Props, LaneNumber(), LaneNumberProps (+12 more)

### Community 15 - "EliminationBracketIntegrationTestSuite"
Cohesion: 0.05
Nodes (7): UpdateMatchResultIsWinnerById(), GetMedalInfoByEliminationId(), EliminationBracketIntegrationTestSuite, TestMatchEndsAndArrowsByTeamSize(), createBracketMatch(), matchEndsAndArrows(), bracketMatch

### Community 16 - "competitionLifecycle.spec.ts"
Cohesion: 0.09
Nodes (32): admin, applyToCompetition(), approveAllApplicants(), archers, createCompetition(), createGroup(), judge, password (+24 more)

### Community 17 - "RoleToString"
Cohesion: 0.09
Nodes (30): PostCompetition(), UpdateCompetitionUnassignedGroupId(), UpdateCompetitionUnassignedLaneId(), CreateElimination(), CreateGroupInfo(), PostLane(), GetMatchEndById(), CreateMedal() (+22 more)

### Community 18 - "ComputeMatchOutcome"
Cohesion: 0.09
Nodes (45): comparableEndScores(), Match, MatchEnd, MatchOutcomeStatus, MatchResult, matchScoreValue(), completeOutcomeEnd(), computeCompoundMatchOutcome() (+37 more)

### Community 19 - "recordingBoard.spec.ts"
Cohesion: 0.09
Nodes (31): User, environmentCommand(), exec, frontend_tests_e2e_fixtures_expect, Fixtures, test, applyToLegacyCompetition(), Competition (+23 more)

### Community 20 - "teamLifecycle.ts"
Cohesion: 0.11
Nodes (38): selectGroup(), assertPlayerReadsConfirmedCurrentMatch(), advanceStage(), chooseJudgeTeam(), activateTeamPhase(), assertJudgeScopeSwitching(), assertTeamDetail(), assertTeamMemberScoringView() (+30 more)

### Community 21 - "react"
Cohesion: 0.10
Nodes (22): GroupMenu(), Props, frontend_src_app_competition_id_admin_progress_progressslice_setgroupindex, AutocompletePlayerValue, Page(), GroupMenu(), Props, Page() (+14 more)

### Community 22 - "formalApi.ts"
Cohesion: 0.05
Nodes (74): assertHybridApiWriteAllowed(), eliminationWriteActor(), eventMatchCounts(), eventWaves(), HybridEliminationSample, hybridEliminationSamples, hybridEliminationWritePlan, HybridGroup (+66 more)

### Community 23 - "migration.go"
Cohesion: 0.13
Nodes (31): main(), usage(), Baseline(), hasUserTables(), newMigrator(), normalizeCreate(), ReadVersion(), readVersion() (+23 more)

### Community 24 - "ResetTestDatabase"
Cohesion: 0.04
Nodes (34): main(), usage(), GetGroupPlayerIdRankOrderById(), getGroupPlayerIdRankOrderById(), RefreshCompetitionRanks(), GetMatchScoreById(), TestResetTestDatabaseCreatesPlayerSchema(), loadLegacyFixture() (+26 more)

### Community 25 - "resultSnapshot.ts"
Cohesion: 0.12
Nodes (31): assertEquivalentLifecycleSnapshots(), bracket(), count(), integer(), LifecycleSnapshot, name(), normalizeLifecycleSnapshot(), qualification() (+23 more)

### Community 26 - "scoring/@qualification/page.tsx"
Cohesion: 0.10
Nodes (28): columns, JudgeLayout(), Layout(), Page(), frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_addscore, frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_confirm, frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_deletescore, frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_initends (+20 more)

### Community 27 - "compilerOptions"
Cohesion: 0.06
Nodes (35): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx (+27 more)

### Community 28 - "Load"
Cohesion: 0.25
Nodes (11): Load(), clearConfigEnvironment(), TestLoadDoesNotDiscoverDotenv(), TestLoadExplicitFileUsesProcessEnvironmentPrecedence(), TestLoadParsesQuotedSpecialCharactersLiterally(), TestLoadRejectsExplicitMissingEnvFile(), TestLoadRejectsInvalidPort(), getIpByMode() (+3 more)

### Community 29 - "package.json"
Cohesion: 0.06
Nodes (33): name, private, type, version, axios, bootstrap, @emotion/react, @emotion/styled (+25 more)

### Community 30 - "Elimination"
Cohesion: 0.09
Nodes (32): computeEliminationMatchPoints(), GetEliminationById(), GetEliminationWPlayerSetsById(), GetEliminationWScoresById(), GetEliminationWStagesMatchesById(), GetMatchIsExist(), GetMatchWScoresById(), Elimination (+24 more)

### Community 31 - "ErrorReceiveDataTest"
Cohesion: 0.11
Nodes (44): UpdateCompetitionCurrentPhase(), GetMatchEndIsExist(), GetMatchScoreIsExist(), GetMatchScoreWMEndIdIsExist(), GetRoundEndIsExist(), PutCompetitionCurrentPhase(), applyAutomaticOutcomeForMatchResult(), matchIDForMatchResult() (+36 more)

### Community 32 - "prunePath"
Cohesion: 0.16
Nodes (9): Layout(), LinkTabProps, Layout(), LinkTabProps, Layout(), LinkTabProps, Layout(), LinkTabProps (+1 more)

### Community 33 - "dependencies"
Cohesion: 0.06
Nodes (31): dependencies, axios, bootstrap, d3, dayjs, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (+23 more)

### Community 34 - "RankingDialog.tsx"
Cohesion: 0.11
Nodes (21): EndPanel(), Props, Page(), Props, RankingDialog(), RankingPlayer, Page(), Page() (+13 more)

### Community 35 - "store.ts"
Cohesion: 0.15
Nodes (12): initialState, progressSlice, initialState, qualificationScheduleSlice, initialState, scheduleSlice, initialState, qualificationScoringSlice (+4 more)

### Community 36 - "DatabaseInitial"
Cohesion: 0.14
Nodes (18): buildDSN(), openDB(), TestBuildDSNEscapesSpecialPasswordAndKeepsTransportSettings(), TestValidateDatabaseNeedsOnlyDatabaseSettings(), validateDatabase(), App, Database, connectDB() (+10 more)

### Community 37 - "TestDatabaseInitialPreservesExistingDictator"
Cohesion: 0.15
Nodes (20): Dictator, ensureDictatorForSeeder(), setDictator(), TestDatabaseInitialPreservesExistingDictator(), TestDatabaseInitialRejectsNonDictatorUsernameCollision(), seedLifecycleAccounts(), seedTestAdmin(), CreateUser() (+12 more)

### Community 38 - "MatchResult"
Cohesion: 0.11
Nodes (29): getComputedMatchResultByID(), GetMatchResultById(), GetMatchResultWScoresById(), MatchResult, MatchEnd, PlayerSet, UpdateMatchResultById(), TestFinalStageMatchOnlyRecognizesTerminalMatches() (+21 more)

### Community 39 - "judgeCorrections.ts"
Cohesion: 0.17
Nodes (24): Arrow, assertEliminationReadback(), assertQualificationReadback(), correctConfirmedEliminationEnd(), correctConfirmedQualificationEnd(), editorDeleteButton(), EliminationCorrection, EliminationDetail (+16 more)

### Community 40 - "PlayerSet"
Cohesion: 0.11
Nodes (9): CreatePlayerSet(), CreatePlayerSetMatchTable(), GetPlayerSetsByEliminationId(), GetPlayerWPlayerSetsByIDCompeitionID(), PlayerSet, Player, EliminationBracketIntegrationTestSuite, PlayerSetMatchTable (+1 more)

### Community 41 - "SwagRouter.go"
Cohesion: 0.33
Nodes (3): go_pkg_github_com_swaggo_files, go_pkg_github_com_swaggo_gin_swagger, go_pkg_github_com_swaggo_swag

### Community 42 - "setupMatchEndWithScores"
Cohesion: 0.16
Nodes (13): CreateMatch(), CreateStage(), Stage, Match, UpdateEliminationProgress(), CreateMatchEnd(), CreateMatchResult(), CreateMatchScore() (+5 more)

### Community 43 - "PlayerTestSuite"
Cohesion: 0.10
Nodes (7): GetPlayerRoundTotalScoreByRoundId(), GetPlayerScoreByRoundScoreId(), GetPlayerTotalScoreByPlayerId(), GetRoundIdByRoundScoreId(), GetRoundScoreIsExist(), UpdatePlayerScore(), PlayerTestSuite

### Community 44 - "eliminationScoringSlice.ts"
Cohesion: 0.31
Nodes (9): eliminationScoringSlice, EliminationScoringState, expectedArrows(), findSelected(), initialState, LocalMatchScore, scorefmt(), sortScoresDesc() (+1 more)

### Community 45 - "000001_prod_baseline.up.sql"
Cohesion: 0.18
Nodes (20): `competitions`, `eliminations`, `groups`, `institutions`, `lanes`, `match_ends`, `match_results`, `match_scores` (+12 more)

### Community 46 - "v1_show_create.sql"
Cohesion: 0.18
Nodes (20): `competitions`, `eliminations`, `groups`, `institutions`, `lanes`, `match_ends`, `match_results`, `match_scores` (+12 more)

### Community 47 - "elimination.ts"
Cohesion: 0.16
Nodes (20): Bow, chooseJudgeEvent(), chooseJudgeIndividual(), chooseJudgeOption(), confirmSide(), eliminationId(), JudgeMatchScope, Score (+12 more)

### Community 48 - "preview.js"
Cohesion: 0.25
Nodes (5): loginDialog, sampleCopy, sampleDialog, sampleExtra, sampleTitle

### Community 49 - "JudgeEliminationBoard.tsx"
Cohesion: 0.14
Nodes (14): activeTeamSizes(), cloneEnd(), endStatus(), EVENT_NAMES, JudgeEliminationBoard(), POSSIBLE_SCORES, ScoreEditor, scoreTotal() (+6 more)

### Community 50 - "verification.ts"
Cohesion: 0.17
Nodes (18): assertCompletedIndividualBracket(), assertIndividualProgressIsolation(), assertStage(), finalPairs, IndividualEliminationDetail, IndividualEventSnapshot, IndividualSeedIdentities, individualSeedOrder (+10 more)

### Community 51 - "app/layout.tsx"
Cohesion: 0.29
Nodes (5): queryClient, store, frontend_src_styles_app, scoringTheme, react-redux

### Community 52 - "eliminationPlayerSetRanking.spec.ts"
Cohesion: 0.16
Nodes (15): AUTO_ROWS, clone(), dragHandle(), INITIAL_ROWS, moveRowDownWithKeyboard(), RankingRouteHandles, RankingRow, rankingTable() (+7 more)

### Community 53 - "Requester"
Cohesion: 0.21
Nodes (5): the csv file be like real_name, password, target, read_user_csv(), Requester, csv, requests

### Community 54 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, @playwright/test, @types/d3, @types/node, @types/react (+9 more)

### Community 55 - "首頁與比賽列表視覺提案 v3"
Cohesion: 0.40
Nodes (4): 設計方向, 開啟, 預覽圖片, 首頁與比賽列表視覺提案 v3

### Community 56 - "CompetitionPostFields.tsx"
Cohesion: 0.19
Nodes (12): CompetitionPostFields(), dayjsToISO(), endTime, Props, startTime, CreateButton(), Props, postBody (+4 more)

### Community 57 - "eliminationFixtures.ts"
Cohesion: 0.15
Nodes (18): DatabaseMatchScore, EndpointPutMatchEndsIsConfirmedByIdMatchEndIsConfirmedData, EndpointPutMatchEndsScoresByIdMatchEndScoresData, prepareIndividualAutoCreate(), buildEliminationFixture(), buildMatchScores(), buildPlayers(), findMatchEndById() (+10 more)

### Community 58 - "database/sql.DB"
Cohesion: 0.15
Nodes (20): assertMigrationVersion(), assertNoStartupRows(), currentSQLDB(), showCreates(), sqlTableExists(), TestNonProductionInitializersRejectNonCurrentMigrationStateWithoutSchemaRepair(), envOrDefault(), LoadTestDatabaseConfig() (+12 more)

### Community 59 - "Sidebar.tsx"
Cohesion: 0.29
Nodes (4): AssociativeArray, sidebarItemProps, SidebarProps, ref_mui_base

### Community 60 - "DatabaseMatchOutcomeStatus"
Cohesion: 0.33
Nodes (6): DatabaseMatchOutcomeStatus, MatchOutcomeIncomplete, MatchOutcomeLockedConflict, MatchOutcomeShootOff, MatchOutcomeUnsupportedBowType, MatchOutcomeWinner

### Community 61 - "ReorderPlayerSets"
Cohesion: 0.22
Nodes (13): GetGroupRankingPlayers(), getGroupRankingPlayers(), GroupRankingPlayer, samePlayerIDOrder(), samePlayerIDs(), UpdateGroupPlayerRanking(), AutoRankPlayerSets(), GetPlayerSetRankings() (+5 more)

### Community 62 - "AddApiRouter"
Cohesion: 0.25
Nodes (14): AddApiRouter(), competitionRouter(), eliminationRouter(), groupInfoRouter(), laneRouter(), matchResultRouter(), medalRouter(), playerRouter() (+6 more)

### Community 63 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, dev, lint, start, test:browser, test:browser:firefox, test:browser:webkit (+6 more)

### Community 64 - "ContentType"
Cohesion: 0.40
Nodes (5): ContentType, FormData, Json, Text, UrlEncoded

### Community 65 - "RBACMiddleware"
Cohesion: 0.10
Nodes (22): UpdateParticipantRole(), UpdateUserRole(), Logout(), EnsureRoleInGameRoleSet(), EnsureRoleInSystemRoleSet(), RBACMiddleware(), ClearAuthSession(), IsAuthenticated() (+14 more)

### Community 66 - "qualificationRankingDialog.spec.ts"
Cohesion: 0.21
Nodes (9): clone(), dragHandle(), initialRankings, moveFirstPlayerDownWithKeyboard(), orderNames(), RankingPlayer, RankingResponse, RankingRouteHandles (+1 more)

### Community 67 - "scopeNavigation.ts"
Cohesion: 0.26
Nodes (11): assertDivergedEliminationScopes(), assertJudgeEventAvailability(), assertOfficialProgress(), assertQualificationRankingDialogScopes(), assertQualificationScheduleScopes(), DivergedEliminationScope, escaped(), eventName() (+3 more)

### Community 68 - "ComputeMatchPoints"
Cohesion: 0.36
Nodes (11): ComputeMatchPoints(), assertEndPoints(), assertIncompleteEnd(), MatchEnd, matchEnd(), TestComputeMatchPointsAwardsWinsAndTiesByEndIndex(), TestComputeMatchPointsCountsXAsTen(), TestComputeMatchPointsIgnoresConfirmation() (+3 more)

### Community 70 - "Qualification"
Cohesion: 0.23
Nodes (13): GetQualificationIsExist(), GetQualificationWLanesByID(), GetQualificationWLanesPlayersByID(), GetQualificationWUnassignedLanesByID(), Qualification, UpdateQualification(), GetQualificationWLanesByID(), GetQualificationWLanesPlayersByID() (+5 more)

### Community 72 - "qualificationScoreSummary.spec.ts"
Cohesion: 0.27
Nodes (7): buildDetailedPlayer(), clone(), QualificationRoutes, refreshTotals(), registerQualificationRoutes(), ScoreRequest, scoreValue()

### Community 73 - "Production deployment and HTTPS guide"
Cohesion: 0.07
Nodes (31): Isolated E2E Compose stack, Loopback-only E2E proxy, Runner-owned backend configuration, Disposable tmpfs MySQL, Build-time public API path, Production persistent MySQL, Production Compose stack, TLS-enabled reverse proxy (+23 more)

### Community 74 - "@elimination/page.tsx"
Cohesion: 0.10
Nodes (27): EliminationScoringBoard(), POSSIBLE_SCORES, Props, frontend_src_app_competition_id_scoring_elimination_eliminationscoringslice_addscore, frontend_src_app_competition_id_scoring_elimination_eliminationscoringslice_deletescore, frontend_src_app_competition_id_scoring_elimination_eliminationscoringslice_initializematchresults, LocalMatchResult, frontend_src_app_competition_id_scoring_elimination_eliminationscoringslice_markconfirmed (+19 more)

### Community 75 - "eliminationScoring.spec.ts"
Cohesion: 0.29
Nodes (6): ALL_SCORE_LABELS, selectorGroup(), sideButton(), sideScoreLabels(), sideTotal(), waitReady()

### Community 77 - "browser/fixtures.ts"
Cohesion: 0.21
Nodes (4): frontend_tests_browser_fixtures_expect, test, competition(), mockPagedCompetitions()

### Community 78 - "ErrorIdTest"
Cohesion: 0.07
Nodes (52): DeleteCompetition(), GetCompetitionUnassignedLaneId(), GetCompetitionWGroupsPlayers(), DeleteLaneByCompetitionId(), GetLaneIsExist(), CompetitionParticipants(), DeleteParticipant(), GetParticipant() (+44 more)

### Community 81 - "eliminationBracket.spec.ts"
Cohesion: 0.32
Nodes (4): cloneScoreboardMatch(), completeScoreboardStages(), populateScoreboardMatch(), EliminationVariant

### Community 82 - "compilerOptions"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 84 - "Archery OpenAPI contract"
Cohesion: 0.29
Nodes (7): Competition-admin authorization boundary, Competition API domain, Elimination API domain, Session and user API domains, Archery OpenAPI contract, Participant and player API domains, Qualification and match scoring API domains

### Community 85 - "Lane"
Cohesion: 0.25
Nodes (8): GetAllLanesByCompetitionId(), GetLaneById(), GetLaneWScoresById(), Lane, Player, UpdateLane(), lockedCompetitionUnassignedLane(), lockedControlLane()

### Community 87 - "theme.d.ts"
Cohesion: 0.33
Nodes (5): ButtonPropsColorOverrides, @mui/material/Button, @mui/material/styles, Palette, PaletteOptions

### Community 90 - "Development Compose stack"
Cohesion: 0.40
Nodes (5): Development backend environment boundary, Development Compose stack, Frontend hot reload watch, Local Caddy reverse proxy, Development MySQL persistent volume

### Community 91 - "Archery Target Mark"
Cohesion: 0.40
Nodes (5): Black Radial Outer Shape, Cyan Outer Target Ring, Red Middle Target Ring, Archery Target Mark, Yellow Target Center

### Community 97 - "Deployment configuration validation"
Cohesion: 0.50
Nodes (4): Caddy HTTP and HTTPS validation, Compose V1 and modern compatibility, Deployment configuration validation, Container build workflow

### Community 98 - "Continuous integration test matrix"
Cohesion: 0.50
Nodes (4): Continuous integration test matrix, E2E browser and lifecycle modes, Frontend quality gates, Go unit and integration gates

### Community 99 - "Second 25th Fengcheng Cup newcomer qualification results"
Cohesion: 0.50
Nodes (4): Archer club affiliations, Qualification lane assignments, Second 25th Fengcheng Cup newcomer qualification results, Ranked newcomer archers

### Community 101 - "Reverse Proxy Kubernetes Service"
Cohesion: 0.50
Nodes (4): HTTP Service Port 80, HTTPS Service Port 443, Reverse Proxy Kubernetes Service, Reverse Proxy Service Selector

### Community 117 - "MySQL Kubernetes deployment"
Cohesion: 0.67
Nodes (3): MySQL data persistent volume claim, MySQL Kubernetes deployment, MySQL Kubernetes service

## Knowledge Gaps
- **496 isolated node(s):** `backend`, `BracketInitRequest`, `StagePlacementRequest`, `PlacementResponse`, `groupIdsForReorder` (+491 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 774 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@playwright/test` connect `competitionLifecycle.spec.ts` to `qualificationRankingDialog.spec.ts`, `test-env.mjs`, `scopeNavigation.ts`, `judgeCorrections.ts`, `qualificationScoreSummary.spec.ts`, `eliminationScoring.spec.ts`, `browser/fixtures.ts`, `elimination.ts`, `verification.ts`, `recordingBoard.spec.ts`, `eliminationPlayerSetRanking.spec.ts`, `teamLifecycle.ts`, `formalApi.ts`, `eliminationFixtures.ts`, `package.json`, `resultSnapshot.ts`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `@mui/material` connect `@mui/material` to `prunePath`, `Competition.ts`, `Api.ts`, `RankingDialog.tsx`, `ApiClient.ts`, `@elimination/[teamSize]/page.tsx`, `[phase]/@qualification/page.tsx`, `@elimination/page.tsx`, `elimination/[teamSize]/page.tsx`, `JudgeEliminationBoard.tsx`, `app/layout.tsx`, `react`, `CompetitionPostFields.tsx`, `scoring/@qualification/page.tsx`, `Sidebar.tsx`, `package.json`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `prunePath`, `Competition.ts`, `RankingDialog.tsx`, `ApiClient.ts`, `@elimination/[teamSize]/page.tsx`, `@mui/material`, `[phase]/@qualification/page.tsx`, `@elimination/page.tsx`, `elimination/[teamSize]/page.tsx`, `JudgeEliminationBoard.tsx`, `app/layout.tsx`, `CompetitionPostFields.tsx`, `scoring/@qualification/page.tsx`, `Sidebar.tsx`, `package.json`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 102 inferred relationships involving `Convert2uint()` (e.g. with `DeleteCompetition()` and `GetCompetitionsOfUser()`) actually correct?**
  _`Convert2uint()` has 102 INFERRED edges - model-reasoned connections that need verification._
- **What connects `backend`, `BracketInitRequest`, `StagePlacementRequest` to the rest of the system?**
  _496 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MatchResult.go` be split into smaller, more focused modules?**
  _Cohesion score 0.07087301587301588 - nodes in this community are weakly interconnected._
- **Should `Competition.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08232118758434548 - nodes in this community are weakly interconnected._