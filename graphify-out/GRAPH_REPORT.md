# Graph Report - archeryWebsite  (2026-09-28)

## Corpus Check
- 344 files · ~331,526 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 31 file(s) not represented in the graph (top: .scss 14, (none) 10, .example 2)

## Summary
- 2867 nodes · 9195 edges · 129 communities (103 shown, 26 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 482 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3d64beb9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- competition.go
- @mui/material
- Api.ts
- test-env.mjs
- seeder.go
- [phase]/@qualification/page.tsx
- testing.T
- elimination/[teamSize]/page.tsx
- QualificationScoreEditor.tsx
- SubGamesBar.tsx
- ErrorInternalErrorTest
- Elimination
- react-query
- net/http.Cookie
- react
- EliminationBracketIntegrationTestSuite
- competitionLifecycle.spec.ts
- RoleToString
- ComputeMatchOutcome
- recordingBoard.spec.ts
- teamLifecycle.ts
- prunePath
- formalApi.ts
- migration.go
- ResetTestDatabase
- resultSnapshot.ts
- scoring/@qualification/page.tsx
- compilerOptions
- store.ts
- package.json
- requireEliminationCompetitionAdmin
- ErrorIdTest
- JudgeEliminationBoard.tsx
- dependencies
- EliminationBracket.go
- gorm.io/gorm.DB
- DatabaseInitial
- EmailPointer
- parseQualificationAssignmentCSV
- judgeCorrections.ts
- AutoPlayerSetIntegrationTestSuite
- github.com/gin-gonic/gin.Engine
- setupMatchEndWithScores
- PlayerTestSuite
- Participant
- 000001_prod_baseline.up.sql
- v1_show_create.sql
- elimination.ts
- preview.js
- github.com/gin-gonic/gin.Context
- verification.ts
- parseBulkRegisterCSV
- eliminationPlayerSetRanking.spec.ts
- Requester
- devDependencies
- 首頁與比賽列表視覺提案 v3
- CompetitionPostFields.tsx
- eliminationFixtures.ts
- LoadTestDatabaseConfig
- .fixture
- DatabaseMatchOutcomeStatus
- 對抗賽記分與更正
- AddApiRouter
- scripts
- AcceptPrint
- setMatchWinner
- qualificationRankingDialog.spec.ts
- DatabaseMatchEnd
- ComputeMatchPoints
- MatchResult
- DeleteCompetition
- bracketStage
- qualificationScoreSummary.spec.ts
- Production deployment and HTTPS guide
- @elimination/page.tsx
- eliminationScoring.spec.ts
- Load
- browser/fixtures.ts
- scopeNavigation.ts
- Group
- HttpClient
- 設定資格賽
- compilerOptions
- 選手使用者手冊
- Archery OpenAPI contract
- SwagRouter.go
- go_pkg_io_fs
- theme.d.ts
- users
- Development Compose stack
- Archery Target Mark
- Convert2uint
- GroupCreator.tsx
- eliminationScoringSlice.ts
- app/layout.tsx
- Scoring domain contract
- Deployment configuration validation
- Continuous integration test matrix
- Second 25th Fengcheng Cup newcomer qualification results
- Array
- Reverse Proxy Kubernetes Service
- homeRedesign.spec.ts
- user-manual.md
- Isolated E2E Compose stack
- 建立與推進對抗賽
- ContentType
- 查看成績
- 資格賽記分
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
2. `Convert2uint()` - 106 edges
3. `@mui/material` - 86 edges
4. `ErrorIdTest()` - 83 edges
5. `EliminationBracketIntegrationTestSuite` - 65 edges
6. `AcceptPrint()` - 56 edges
7. `react-query` - 50 edges
8. `react` - 49 edges
9. `apiClient` - 47 edges
10. `RoleToString()` - 41 edges

## Surprising Connections (you probably didn't know these)
- `Isolated E2E Compose stack` --semantically_similar_to--> `E2E runner lifecycle`  [INFERRED] [semantically similar]
  docker-compose-e2e.yml → docs/testing.md
- `Production Compose stack` --semantically_similar_to--> `Production deployment and HTTPS guide`  [INFERRED] [semantically similar]
  docker-compose.yml → docs/deployment.md
- `NYCU Archery scoring system` --references--> `Production deployment and HTTPS guide`  [EXTRACTED]
  README.md → docs/deployment.md
- `NYCU Archery scoring system` --references--> `Versioned SQL migration contract`  [EXTRACTED]
  README.md → docs/migrations.md
- `NYCU Archery scoring system` --references--> `Scoring domain contract`  [EXTRACTED]
  README.md → docs/scoring.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Server-authoritative scoring lifecycle** — docs_scoring_qualification_authorization, docs_scoring_elimination_authorization, docs_scoring_outcome_resolution, docs_scoring_bracket_progression [EXTRACTED 1.00]
- **Runner-controlled isolated E2E execution** — docker_compose_e2e_tmpfs_mysql, docker_compose_e2e_runner_owned_backend, docker_compose_e2e_loopback_proxy, docs_testing_e2e_runner_lifecycle [INFERRED 0.85]

## Communities (129 total, 26 thin omitted)

### Community 0 - "competition.go"
Cohesion: 0.08
Nodes (102): main(), usage(), DropCompetition(), DropTables(), DropElimination(), DropGroupInfo(), AllInstitutionInfo(), DeleteInstitutionByID() (+94 more)

### Community 1 - "@mui/material"
Cohesion: 0.05
Nodes (37): JudgeLayout(), BulkRegisterPage(), errorMessage(), Header(), HeaderProps, navigation, RootLayout(), MyCompetitionPage() (+29 more)

### Community 2 - "Api.ts"
Cohesion: 0.02
Nodes (91): EliminationProgressControl(), Props, stageLabel(), standardStageDenominators(), Props, RankingInfoBar(), ApiConfig, DatabaseElimination (+83 more)

### Community 3 - "test-env.mjs"
Cohesion: 0.05
Nodes (56): ref_node_assert, ref_node_child_process, ref_node_crypto, ref_node_fs, ref_node_os, ref_node_path, ref_node_test, ref_node_url (+48 more)

### Community 4 - "seeder.go"
Cohesion: 0.07
Nodes (67): main(), requestedScenarios(), GetAllCompetition(), GetCompetitionsOfUser(), GetCompetitionWGroups(), GetCompetitionWGroupsPlayersScores(), GetCompetitionWParticipants(), GetCurrentCompetitions() (+59 more)

### Community 5 - "[phase]/@qualification/page.tsx"
Cohesion: 0.09
Nodes (27): LaneBlock(), Props, Page(), LaneBoard(), Props, NameBar(), Props, PlayerInfo() (+19 more)

### Community 6 - "testing.T"
Cohesion: 0.04
Nodes (56): TestValidateSeederForbidsProductionButDoesNotRequireSession(), TestValidateServerProductionSessionKeyLength(), TestValidateServerRequiredFieldsAndEnvironment(), validApp(), TestMatchResultOmitsUnknownPlayerSetID(), assertMigrationVersion(), assertNoStartupRows(), currentSQLDB() (+48 more)

### Community 7 - "elimination/[teamSize]/page.tsx"
Cohesion: 0.05
Nodes (68): getOutcomeStatus(), MatchOutcomeStatus, Page(), PlayerSetOption, Page(), DetailTeamHeader(), laneLabel(), MobileStages() (+60 more)

### Community 8 - "QualificationScoreEditor.tsx"
Cohesion: 0.10
Nodes (25): Props, ScoreBar(), cloneEnd(), endTotal(), QualificationScoreEditor(), Props, ScoreBlock(), EndBar() (+17 more)

### Community 9 - "SubGamesBar.tsx"
Cohesion: 0.24
Nodes (10): Props, AccordionSummaryStyle, GroupMenu(), Props, GroupPhaseTag(), phases, Props, Props (+2 more)

### Community 10 - "ErrorInternalErrorTest"
Cohesion: 0.07
Nodes (60): AddOneCompetitionGroupNum(), GetCompetitionGroupIds(), GetCompetitionGroupNum(), GetCompetitionUnassignedGroupId(), GetOnlyCompetition(), MinusOneCompetitionGroupNum(), UpdateCompetitionCurrentPhase(), UpdateCompetitionCurrentPhaseMinus() (+52 more)

### Community 11 - "Elimination"
Cohesion: 0.09
Nodes (28): computeEliminationMatchPoints(), GetEliminationByGroupId(), GetEliminationById(), GetEliminationWPlayerSetsById(), GetEliminationWScoresById(), Elimination, Match, MatchOutcomeStatus (+20 more)

### Community 12 - "react-query"
Cohesion: 0.06
Nodes (41): DeleteGroupButton(), columns, GroupGrid(), Props, columns, EndPanel(), Props, Page() (+33 more)

### Community 13 - "net/http.Cookie"
Cohesion: 0.08
Nodes (11): rankingByID(), AutoCreatePlayerSetsResponse, BracketAdvanceResponse, BracketFirstRoundSyncResponse, BracketInitResponse, MatchWinnerResponse, PlayerSetRankingIntegrationTestSuite, PlayerSetRankingResponse (+3 more)

### Community 14 - "react"
Cohesion: 0.10
Nodes (20): GroupMenu(), Props, frontend_src_app_competition_id_admin_progress_progressslice_setgroupindex, AutocompletePlayerValue, GroupMenu(), Props, Page(), frontend_src_app_competition_id_admin_schedule_qualification_qualificationscheduleslice_setadvancingnum (+12 more)

### Community 15 - "EliminationBracketIntegrationTestSuite"
Cohesion: 0.06
Nodes (3): UpdateMatchResultIsWinnerById(), GetMedalInfoByEliminationId(), EliminationBracketIntegrationTestSuite

### Community 16 - "competitionLifecycle.spec.ts"
Cohesion: 0.08
Nodes (32): admin, applyToCompetition(), approveAllApplicants(), archers, createCompetition(), createGroup(), judge, password (+24 more)

### Community 17 - "RoleToString"
Cohesion: 0.09
Nodes (31): PostCompetition(), UpdateCompetitionUnassignedGroupId(), UpdateCompetitionUnassignedLaneId(), CreateElimination(), CreateGroupInfo(), PostLane(), GetMatchEndById(), CreateMedal() (+23 more)

### Community 18 - "ComputeMatchOutcome"
Cohesion: 0.15
Nodes (33): completeOutcomeEnd(), computeCompoundMatchOutcome(), ComputeMatchOutcome(), computeRecurveMatchOutcome(), MatchOutcome, Match, MatchEnd, MatchResult (+25 more)

### Community 19 - "recordingBoard.spec.ts"
Cohesion: 0.09
Nodes (31): User, environmentCommand(), exec, frontend_tests_e2e_fixtures_expect, Fixtures, test, applyToLegacyCompetition(), Competition (+23 more)

### Community 20 - "teamLifecycle.ts"
Cohesion: 0.11
Nodes (38): selectGroup(), assertPlayerReadsConfirmedCurrentMatch(), advanceStage(), chooseJudgeIndividual(), chooseJudgeTeam(), activateTeamPhase(), assertJudgeScopeSwitching(), assertTeamDetail() (+30 more)

### Community 21 - "prunePath"
Cohesion: 0.16
Nodes (9): Layout(), LinkTabProps, Layout(), LinkTabProps, Layout(), LinkTabProps, Layout(), LinkTabProps (+1 more)

### Community 22 - "formalApi.ts"
Cohesion: 0.05
Nodes (74): assertHybridApiWriteAllowed(), eliminationWriteActor(), eventMatchCounts(), eventWaves(), HybridEliminationSample, hybridEliminationSamples, hybridEliminationWritePlan, HybridGroup (+66 more)

### Community 23 - "migration.go"
Cohesion: 0.11
Nodes (41): main(), usage(), Baseline(), hasUserTables(), assertColumnAbsent(), assertColumnPresent(), hasTable(), migrationTestDB() (+33 more)

### Community 24 - "ResetTestDatabase"
Cohesion: 0.07
Nodes (24): TestResetTestDatabaseCreatesPlayerSchema(), loadLegacyFixture(), resetSchema(), ResetTestDatabase(), TestResetRejectsUnknownFixtureBeforeConnecting(), assertRoundScore(), PlayerTestSuite, authenticatedScoreRequest() (+16 more)

### Community 25 - "resultSnapshot.ts"
Cohesion: 0.12
Nodes (31): assertEquivalentLifecycleSnapshots(), bracket(), count(), integer(), LifecycleSnapshot, name(), normalizeLifecycleSnapshot(), qualification() (+23 more)

### Community 26 - "scoring/@qualification/page.tsx"
Cohesion: 0.11
Nodes (25): Layout(), Page(), frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_addscore, frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_confirm, frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_deletescore, frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_initends, frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_setselectedorder, GameTitleBar() (+17 more)

### Community 27 - "compilerOptions"
Cohesion: 0.06
Nodes (35): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx (+27 more)

### Community 28 - "store.ts"
Cohesion: 0.15
Nodes (12): initialState, progressSlice, initialState, qualificationScheduleSlice, initialState, scheduleSlice, initialState, qualificationScoringSlice (+4 more)

### Community 29 - "package.json"
Cohesion: 0.06
Nodes (32): name, private, type, version, bootstrap, @emotion/react, @emotion/styled, eslint (+24 more)

### Community 30 - "requireEliminationCompetitionAdmin"
Cohesion: 0.14
Nodes (34): GetEliminationIsExist(), GetOnlyEliminationById(), GetStageById(), GetStageIsExist(), GetMatchResultIsExist(), UpdatePlayerSetName(), PostMatch(), PostStage() (+26 more)

### Community 31 - "ErrorIdTest"
Cohesion: 0.15
Nodes (38): GetMatchEndIsExist(), GetMatchScoreIsExist(), GetMatchScoreWMEndIdIsExist(), GetRoundEndIsExist(), PostElimination(), matchForMatchEnd(), matchResultForMatchEnd(), PostMatchEndByMatchResultId() (+30 more)

### Community 32 - "JudgeEliminationBoard.tsx"
Cohesion: 0.23
Nodes (12): activeTeamSizes(), cloneEnd(), endStatus(), EVENT_NAMES, JudgeEliminationBoard(), POSSIBLE_SCORES, ScoreEditor, scoreTotal() (+4 more)

### Community 33 - "dependencies"
Cohesion: 0.06
Nodes (31): dependencies, axios, bootstrap, d3, dayjs, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (+23 more)

### Community 34 - "EliminationBracket.go"
Cohesion: 0.14
Nodes (30): GetPlayerSetsByEliminationId(), GetPlayerWPlayerSetsByIDCompeitionID(), PlayerSet, Player, TestBracketSizesAndStageShapes(), TestExpectedFirstRoundSlotsHasOneByePerMissingEntrant(), TestExpectedFirstRoundSlotsPreservesRankGaps(), bitReversedSeedOrder() (+22 more)

### Community 35 - "gorm.io/gorm.DB"
Cohesion: 0.08
Nodes (34): GetGroupRankingPlayers(), getGroupRankingPlayers(), GroupRankingPlayer, samePlayerIDOrder(), samePlayerIDs(), UpdateGroupPlayerRanking(), AutoRankPlayerSets(), GetPlayerSetRankings() (+26 more)

### Community 36 - "DatabaseInitial"
Cohesion: 0.11
Nodes (24): buildDSN(), openDB(), TestBuildDSNEscapesSpecialPasswordAndKeepsTransportSettings(), TestValidateDatabaseNeedsOnlyDatabaseSettings(), validateDatabase(), App, Database, connectDB() (+16 more)

### Community 37 - "EmailPointer"
Cohesion: 0.25
Nodes (14): Dictator, ensureDictatorForSeeder(), setDictator(), seedLifecycleAccounts(), seedTestAdmin(), CreateUser(), EmailPointer(), FindByUsername() (+6 more)

### Community 38 - "parseQualificationAssignmentCSV"
Cohesion: 0.22
Nodes (10): parseQualificationAssignmentCSV(), parseQualificationPosition(), TestParseQualificationAssignmentCSV(), TestParseQualificationAssignmentCSVRejectsDuplicatePlayerAndSlot(), TestParseQualificationAssignmentCSVRequiresExactColumnsAndPosition(), QualificationAssignmentErrorResponse, QualificationAssignmentIssue, QualificationAssignmentPreviewResponse (+2 more)

### Community 39 - "judgeCorrections.ts"
Cohesion: 0.17
Nodes (24): Arrow, assertEliminationReadback(), assertQualificationReadback(), correctConfirmedEliminationEnd(), correctConfirmedQualificationEnd(), editorDeleteButton(), EliminationCorrection, EliminationDetail (+16 more)

### Community 40 - "AutoPlayerSetIntegrationTestSuite"
Cohesion: 0.09
Nodes (6): CreatePlayerSet(), CreatePlayerSetMatchTable(), GetPlayerSetIsExist(), EliminationBracketIntegrationTestSuite, PlayerSetMatchTable, AutoPlayerSetIntegrationTestSuite

### Community 41 - "github.com/gin-gonic/gin.Engine"
Cohesion: 0.11
Nodes (10): GetAllLanesByCompetitionId(), bulkTestLogin(), bulkTestRequest(), TestBulkRegisterIntegration(), SetUpRouter(), SwagSetUp(), SetUpRouter(), PlayerSetNameIntegrationTestSuite (+2 more)

### Community 42 - "setupMatchEndWithScores"
Cohesion: 0.10
Nodes (18): CreateMatch(), CreateStage(), GetEliminationWStagesMatchesById(), Stage, Match, UpdateEliminationProgress(), CreateMatchEnd(), CreateMatchResult() (+10 more)

### Community 43 - "PlayerTestSuite"
Cohesion: 0.10
Nodes (7): GetPlayerRoundTotalScoreByRoundId(), GetPlayerScoreByRoundScoreId(), GetPlayerTotalScoreByPlayerId(), GetRoundIdByRoundScoreId(), GetRoundScoreIsExist(), UpdatePlayerScore(), PlayerTestSuite

### Community 44 - "Participant"
Cohesion: 0.08
Nodes (34): GetCompetitionIsExist(), GetCompetitionUnassignedLaneId(), CompetitionParticipants(), GetParticipant(), GetParticipantByCompetitionId(), GetParticipantByCompetitionIdUserId(), GetParticipantByUserId(), Participant (+26 more)

### Community 45 - "000001_prod_baseline.up.sql"
Cohesion: 0.18
Nodes (20): `competitions`, `eliminations`, `groups`, `institutions`, `lanes`, `match_ends`, `match_results`, `match_scores` (+12 more)

### Community 46 - "v1_show_create.sql"
Cohesion: 0.18
Nodes (20): `competitions`, `eliminations`, `groups`, `institutions`, `lanes`, `match_ends`, `match_results`, `match_scores` (+12 more)

### Community 47 - "elimination.ts"
Cohesion: 0.17
Nodes (19): Bow, chooseJudgeEvent(), chooseJudgeOption(), confirmSide(), eliminationId(), JudgeMatchScope, Score, scoreJudgeEliminationMatch() (+11 more)

### Community 48 - "preview.js"
Cohesion: 0.25
Nodes (5): loginDialog, sampleCopy, sampleDialog, sampleExtra, sampleTitle

### Community 49 - "github.com/gin-gonic/gin.Context"
Cohesion: 0.07
Nodes (58): DeleteElimination(), GetLaneIsExist(), DeleteParticipant(), GetParticipantIsExist(), GetPlayerIsExist(), GetPlayerWScores(), GetRoundIsExist(), UpdatePlayerOrder() (+50 more)

### Community 50 - "verification.ts"
Cohesion: 0.17
Nodes (19): assertCompletedIndividualBracket(), assertIndividualProgressIsolation(), assertStage(), finalPairs, IndividualEliminationDetail, IndividualEventSnapshot, IndividualSeedIdentities, individualSeedOrder (+11 more)

### Community 51 - "parseBulkRegisterCSV"
Cohesion: 0.24
Nodes (10): hasColumn(), parseBulkRegisterCSV(), TestParseBulkRegisterCSV(), TestParseBulkRegisterCSVLimit(), TestParseBulkRegisterCSVRejectsInvalidBatch(), BulkRegisterErrorResponse, BulkRegisterIssue, BulkRegisterPreviewResponse (+2 more)

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
Nodes (11): CompetitionPostFields(), dayjsToISO(), endTime, Props, startTime, CreateButton(), postBody, PostCompetitionBody (+3 more)

### Community 57 - "eliminationFixtures.ts"
Cohesion: 0.10
Nodes (24): DatabaseMatch, DatabaseMatchScore, DatabasePlayerSet, EndpointPutMatchEndsIsConfirmedByIdMatchEndIsConfirmedData, EndpointPutMatchEndsScoresByIdMatchEndScoresData, cloneScoreboardMatch(), completeScoreboardStages(), populateScoreboardMatch() (+16 more)

### Community 58 - "LoadTestDatabaseConfig"
Cohesion: 0.50
Nodes (4): envOrDefault(), LoadTestDatabaseConfig(), TestLoadTestDatabaseConfigRequiresRunner(), TestDatabaseConfig

### Community 59 - ".fixture"
Cohesion: 0.21
Nodes (8): GetLaneById(), GetLaneWScoresById(), Lane, Player, UpdateLane(), lockedCompetitionUnassignedLane(), lockedControlLane(), QualificationAssignmentsIntegrationSuite

### Community 60 - "DatabaseMatchOutcomeStatus"
Cohesion: 0.33
Nodes (6): DatabaseMatchOutcomeStatus, MatchOutcomeIncomplete, MatchOutcomeLockedConflict, MatchOutcomeShootOff, MatchOutcomeUnsupportedBowType, MatchOutcomeWinner

### Community 61 - "對抗賽記分與更正"
Cohesion: 0.14
Nodes (13): 1. 找到要當裁判的賽事, 1. 找到選手並核對波次, 1. 開啟 Match 比分明細, 2. 切換到裁判頁, 2. 編輯一方該波分數, 2. 編輯該波分數, 3. 依目前階段找到要處理的對象, 3. 核對儲存結果 (+5 more)

### Community 62 - "AddApiRouter"
Cohesion: 0.13
Nodes (25): UpdateParticipantRole(), UpdateUserRole(), EnsureRoleInGameRoleSet(), EnsureRoleInSystemRoleSet(), RBACMiddleware(), TestEnsureRoleInGameRoleSet(), TestEnsureRoleInSystemRoleSet(), TestRBACMiddleware() (+17 more)

### Community 63 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, dev, lint, manual:screenshots, start, test:browser, test:browser:firefox (+7 more)

### Community 64 - "AcceptPrint"
Cohesion: 0.11
Nodes (29): GetGroupInfoById(), GetLaneQualificationId(), UpdateLaneQualificationId(), DeleteQualification(), GetOnlyQualification(), GetQualificationIsExist(), GetQualificationWLanesByID(), GetQualificationWLanesPlayersByID() (+21 more)

### Community 65 - "setMatchWinner"
Cohesion: 0.13
Nodes (17): TestPlacementPairValidation(), finalStageMatch(), manualFinalMatchHasAwardedMedals(), applyMatchPlacement(), loadPlacementMatchResults(), normalizeTarget(), sameOptionalString(), validatePlacementPair() (+9 more)

### Community 66 - "qualificationRankingDialog.spec.ts"
Cohesion: 0.21
Nodes (9): clone(), dragHandle(), initialRankings, moveFirstPlayerDownWithKeyboard(), orderNames(), RankingPlayer, RankingResponse, RankingRouteHandles (+1 more)

### Community 68 - "ComputeMatchPoints"
Cohesion: 0.25
Nodes (14): comparableEndScores(), ComputeMatchPoints(), MatchEnd, matchScoreValue(), assertEndPoints(), assertIncompleteEnd(), MatchEnd, matchEnd() (+6 more)

### Community 69 - "MatchResult"
Cohesion: 0.21
Nodes (12): getComputedMatchResultByID(), GetMatchResultWScoresById(), MatchResult, MatchEnd, PlayerSet, UpdateMatchResultById(), bracketSlotHasStarted(), bracketSlotIsBlank() (+4 more)

### Community 70 - "DeleteCompetition"
Cohesion: 0.18
Nodes (11): DeleteCompetition(), GetCompetitionWGroupsPlayers(), DeleteLaneByCompetitionId(), DeletePlayer(), DeleteCompetition(), GetCompetitionWGroupsPlayersByID(), GetCompetitionWParticipantsByID(), IsGetCompetitionWGroupsPlayers() (+3 more)

### Community 71 - "bracketStage"
Cohesion: 0.26
Nodes (12): advanceSourceMatch(), autoAdvanceByes(), explicitWinnerAndLoser(), finalizeBracket(), overwriteBracketSlot(), overwriteBracketSlots(), overwriteMedalPlayerSet(), projectDecidedStages() (+4 more)

### Community 72 - "qualificationScoreSummary.spec.ts"
Cohesion: 0.27
Nodes (7): buildDetailedPlayer(), clone(), QualificationRoutes, refreshTotals(), registerQualificationRoutes(), ScoreRequest, scoreValue()

### Community 73 - "Production deployment and HTTPS guide"
Cohesion: 0.15
Nodes (13): Build-time public API path, Production persistent MySQL, Production Compose stack, TLS-enabled reverse proxy, HTTPS and session-cookie acceptance, Manual migration deployment gate, Existing production volume preservation, Production deployment and HTTPS guide (+5 more)

### Community 74 - "@elimination/page.tsx"
Cohesion: 0.07
Nodes (34): EliminationScoringBoard(), POSSIBLE_SCORES, Props, frontend_src_app_competition_id_scoring_elimination_eliminationscoringslice_addscore, frontend_src_app_competition_id_scoring_elimination_eliminationscoringslice_deletescore, frontend_src_app_competition_id_scoring_elimination_eliminationscoringslice_initializematchresults, LocalMatchResult, frontend_src_app_competition_id_scoring_elimination_eliminationscoringslice_markconfirmed (+26 more)

### Community 75 - "eliminationScoring.spec.ts"
Cohesion: 0.29
Nodes (6): ALL_SCORE_LABELS, selectorGroup(), sideButton(), sideScoreLabels(), sideTotal(), waitReady()

### Community 76 - "Load"
Cohesion: 0.25
Nodes (11): Load(), clearConfigEnvironment(), TestLoadDoesNotDiscoverDotenv(), TestLoadExplicitFileUsesProcessEnvironmentPrecedence(), TestLoadParsesQuotedSpecialCharactersLiterally(), TestLoadRejectsExplicitMissingEnvFile(), TestLoadRejectsInvalidPort(), getIpByMode() (+3 more)

### Community 77 - "browser/fixtures.ts"
Cohesion: 0.11
Nodes (9): mockDictator(), mockUser(), frontend_tests_browser_fixtures_expect, test, competition(), currentCompetitions(), progressCompetition, waves (+1 more)

### Community 78 - "scopeNavigation.ts"
Cohesion: 0.26
Nodes (11): assertDivergedEliminationScopes(), assertJudgeEventAvailability(), assertOfficialProgress(), assertQualificationRankingDialogScopes(), assertQualificationScheduleScopes(), DivergedEliminationScope, escaped(), eventName() (+3 more)

### Community 79 - "Group"
Cohesion: 0.14
Nodes (10): GetGroupInfoWPlayersById(), GetGroupPlayerIdRankOrderById(), getGroupPlayerIdRankOrderById(), Group, Player, RefreshCompetitionRanks(), UpdateGroupInfo(), lockedControlGroup() (+2 more)

### Community 81 - "設定資格賽"
Cohesion: 0.15
Nodes (12): 1. 建立正式組別, 1. 開啟建賽入口, 2. 填寫賽事資料, 2. 設定靶道與晉級名額, 3. 啟用資格賽並設定選手端階段, 3. 審核參賽申請, 4. 推進資格賽波次, 5. 更新資格賽排名 (+4 more)

### Community 82 - "compilerOptions"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 83 - "選手使用者手冊"
Cohesion: 0.15
Nodes (12): 1. 從列表開啟賽事, 1. 核對對局, 1. 登入或建立帳號, 2. 找到比賽並申請選手身分, 2. 確認賽事頁, 2. 輸入並送出本波箭值, 3. 切換到記分頁或返回分數榜, 3. 確認該波 (+4 more)

### Community 84 - "Archery OpenAPI contract"
Cohesion: 0.29
Nodes (7): Competition-admin authorization boundary, Competition API domain, Elimination API domain, Session and user API domains, Archery OpenAPI contract, Participant and player API domains, Qualification and match scoring API domains

### Community 85 - "SwagRouter.go"
Cohesion: 0.33
Nodes (3): go_pkg_github_com_swaggo_files, go_pkg_github_com_swaggo_gin_swagger, go_pkg_github_com_swaggo_swag

### Community 87 - "theme.d.ts"
Cohesion: 0.33
Nodes (5): ButtonPropsColorOverrides, @mui/material/Button, @mui/material/styles, Palette, PaletteOptions

### Community 90 - "Development Compose stack"
Cohesion: 0.40
Nodes (5): Development backend environment boundary, Development Compose stack, Frontend hot reload watch, Local Caddy reverse proxy, Development MySQL persistent volume

### Community 91 - "Archery Target Mark"
Cohesion: 0.40
Nodes (5): Black Radial Outer Shape, Cyan Outer Target Ring, Red Middle Target Ring, Archery Target Mark, Yellow Target Center

### Community 92 - "Convert2uint"
Cohesion: 0.09
Nodes (32): GetMatchIsExist(), GetMatchWScoresById(), UpdateEliminationCurrentEndMinus(), UpdateEliminationCurrentEndPlus(), UpdateEliminationCurrentStageMinus(), UpdateEliminationCurrentStagePlus(), GetMedalById(), GetMedalIsExist() (+24 more)

### Community 93 - "GroupCreator.tsx"
Cohesion: 0.21
Nodes (11): bowTypes, GroupCreator(), postGroup(), Props, errorMessage(), Preview, PreviewError, PreviewRow (+3 more)

### Community 94 - "eliminationScoringSlice.ts"
Cohesion: 0.31
Nodes (9): eliminationScoringSlice, EliminationScoringState, expectedArrows(), findSelected(), initialState, LocalMatchScore, scorefmt(), sortScoresDesc() (+1 more)

### Community 95 - "app/layout.tsx"
Cohesion: 0.29
Nodes (5): queryClient, store, frontend_src_styles_app, scoringTheme, react-redux

### Community 96 - "Scoring domain contract"
Cohesion: 0.29
Nodes (7): Explicit bracket progression and seeding, Elimination scoring authorization, Automatic elimination outcome resolution, Qualification scoring authorization, Score normalization and computed totals, Scoring domain contract, Elimination first-round synchronization

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

### Community 103 - "user-manual.md"
Cohesion: 0.33
Nodes (6): CI artifacts and failure diagnosis, Integration test isolation guard, Layered test strategy, 使用者操作手冊, NYCU Archery scoring system, Root environment configuration

### Community 104 - "Isolated E2E Compose stack"
Cohesion: 0.33
Nodes (6): Isolated E2E Compose stack, Loopback-only E2E proxy, Runner-owned backend configuration, Disposable tmpfs MySQL, E2E runner lifecycle, Hybrid and full-UI lifecycle equivalence

### Community 105 - "建立與推進對抗賽"
Cohesion: 0.33
Nodes (6): 1. 建立隊伍並整理排名, 2. 建立完整對抗樹, 3. 安排首輪與靶道, 4. 啟用並切換選手端賽程, 5. 晉級或結算獎牌, 建立與推進對抗賽

### Community 106 - "ContentType"
Cohesion: 0.40
Nodes (5): ContentType, FormData, Json, Text, UrlEncoded

### Community 107 - "查看成績"
Cohesion: 0.50
Nodes (4): 1. 開啟公開記分板, 2. 查看資格賽成績, 3. 查看對抗賽對抗表與單場明細, 查看成績

### Community 108 - "資格賽記分"
Cohesion: 0.50
Nodes (4): 1. 開啟記分頁並核對靶道, 2. 逐箭輸入本波分數, 3. 送出並確認, 資格賽記分

### Community 117 - "MySQL Kubernetes deployment"
Cohesion: 0.67
Nodes (3): MySQL data persistent volume claim, MySQL Kubernetes deployment, MySQL Kubernetes service

## Knowledge Gaps
- **548 isolated node(s):** `backend`, `BracketInitRequest`, `StagePlacementRequest`, `PlacementResponse`, `groupIdsForReorder` (+543 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 839 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@playwright/test` connect `competitionLifecycle.spec.ts` to `qualificationRankingDialog.spec.ts`, `homeRedesign.spec.ts`, `judgeCorrections.ts`, `qualificationScoreSummary.spec.ts`, `eliminationScoring.spec.ts`, `browser/fixtures.ts`, `scopeNavigation.ts`, `elimination.ts`, `verification.ts`, `recordingBoard.spec.ts`, `eliminationPlayerSetRanking.spec.ts`, `teamLifecycle.ts`, `formalApi.ts`, `eliminationFixtures.ts`, `package.json`, `resultSnapshot.ts`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `@mui/material` connect `@mui/material` to `JudgeEliminationBoard.tsx`, `Api.ts`, `[phase]/@qualification/page.tsx`, `elimination/[teamSize]/page.tsx`, `QualificationScoreEditor.tsx`, `SubGamesBar.tsx`, `@elimination/page.tsx`, `react-query`, `react`, `package.json`, `prunePath`, `CompetitionPostFields.tsx`, `scoring/@qualification/page.tsx`, `GroupCreator.tsx`, `app/layout.tsx`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 104 inferred relationships involving `Convert2uint()` (e.g. with `DeleteCompetition()` and `GetCompetitionsOfUser()`) actually correct?**
  _`Convert2uint()` has 104 INFERRED edges - model-reasoned connections that need verification._
- **What connects `backend`, `BracketInitRequest`, `StagePlacementRequest` to the rest of the system?**
  _548 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `competition.go` be split into smaller, more focused modules?**
  _Cohesion score 0.07535358219336888 - nodes in this community are weakly interconnected._
- **Should `@mui/material` be split into smaller, more focused modules?**
  _Cohesion score 0.04998148833765272 - nodes in this community are weakly interconnected._