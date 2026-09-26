# Graph Report - archeryWebsite  (2026-09-26)

## Corpus Check
- 330 files · ~280,925 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 31 file(s) not represented in the graph (top: .scss 14, (none) 10, .example 2)

## Summary
- 2751 nodes · 8884 edges · 114 communities (89 shown, 25 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 473 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3602ef81`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- MatchResult.go
- scoring/@qualification/page.tsx
- Api.ts
- test-env.mjs
- Competition
- LaneBoard.tsx
- testing.T
- elimination/[teamSize]/page.tsx
- @mui/material
- Competition.ts
- ErrorInternalErrorTest
- prunePath
- RankingDialog.tsx
- net/http.Cookie
- hybridExecution.spec.ts
- EliminationBracketIntegrationTestSuite
- competitionLifecycle.spec.ts
- Player
- ComputeMatchOutcome
- recordingBoard.spec.ts
- teamLifecycle.ts
- react
- formalApi.ts
- migration.go
- ResetTestDatabase
- resultSnapshot.ts
- ApiClient.ts
- compilerOptions
- setMatchWinner
- package.json
- Convert2uint
- ErrorReceiveDataTest
- JudgeEliminationBoard.tsx
- dependencies
- MatchResult
- gorm.io/gorm.DB
- App
- RoleToString
- loadBracket
- judgeCorrections.ts
- AutoPlayerSetIntegrationTestSuite
- SwagRouter.go
- setupMatchEndWithScores
- PlayerTestSuite
- github.com/gin-gonic/gin.Context
- 000001_prod_baseline.up.sql
- v1_show_create.sql
- elimination.ts
- preview.js
- GetPlayerIsExist
- verification.ts
- parseBulkRegisterCSV
- eliminationPlayerSetRanking.spec.ts
- Requester
- devDependencies
- 首頁與比賽列表視覺提案 v3
- CompetitionPostFields.tsx
- eliminationFixtures.ts
- LoadTestDatabaseConfig
- Match
- DatabaseMatchOutcomeStatus
- ReorderPlayerSets
- AddApiRouter
- scripts
- PlayerSet
- SaveAuthSession
- qualificationRankingDialog.spec.ts
- EliminationRouteHandles
- ComputeMatchPoints
- ContentType
- ErrorIdTest
- EliminationBracket.go
- qualificationScoreSummary.spec.ts
- Production deployment and HTTPS guide
- @elimination/page.tsx
- eliminationScoring.spec.ts
- Load
- browser/fixtures.ts
- getGroupPlayerIdRankOrderById
- HttpClient
- eliminationBracket.spec.ts
- compilerOptions
- Archery OpenAPI contract
- go_pkg_io_fs
- theme.d.ts
- users
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
3. `@mui/material` - 85 edges
4. `ErrorIdTest()` - 83 edges
5. `EliminationBracketIntegrationTestSuite` - 65 edges
6. `AcceptPrint()` - 56 edges
7. `react-query` - 49 edges
8. `react` - 48 edges
9. `apiClient` - 47 edges
10. `Elimination` - 40 edges

## Surprising Connections (you probably didn't know these)
- `Isolated E2E Compose stack` --semantically_similar_to--> `E2E runner lifecycle`  [INFERRED] [semantically similar]
  docker-compose-e2e.yml → docs/testing.md
- `Production Compose stack` --semantically_similar_to--> `Production deployment and HTTPS guide`  [INFERRED] [semantically similar]
  docker-compose.yml → docs/deployment.md
- `DatabaseInitial()` --calls--> `CreateNoInstitution()`  [INFERRED]
  backend/internal/database/DB.go → backend/internal/database/NoInstitution.go
- `TestDatabaseInitialCollisionHelper()` --calls--> `DatabaseInitial()`  [INFERRED]
  backend/internal/database/dictator_startup_integration_test.go → backend/internal/database/DB.go
- `TestNonProductionInitializersRejectNonCurrentMigrationStateWithoutSchemaRepair()` --calls--> `DatabaseInitial()`  [INFERRED]
  backend/internal/database/startup_migration_integration_test.go → backend/internal/database/DB.go

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Server-authoritative scoring lifecycle** — docs_scoring_qualification_authorization, docs_scoring_elimination_authorization, docs_scoring_outcome_resolution, docs_scoring_bracket_progression [EXTRACTED 1.00]
- **Runner-controlled isolated E2E execution** — docker_compose_e2e_tmpfs_mysql, docker_compose_e2e_runner_owned_backend, docker_compose_e2e_loopback_proxy, docs_testing_e2e_runner_lifecycle [INFERRED 0.85]

## Communities (114 total, 25 thin omitted)

### Community 0 - "MatchResult.go"
Cohesion: 0.07
Nodes (103): DropCompetition(), DropTables(), DropElimination(), DropGroupInfo(), AddInstitution(), AllInstitutionInfo(), DeleteInstitutionByID(), DropInstitution() (+95 more)

### Community 1 - "scoring/@qualification/page.tsx"
Cohesion: 0.10
Nodes (27): columns, JudgeLayout(), Layout(), Page(), frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_addscore, frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_confirm, frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_deletescore, frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_initends (+19 more)

### Community 2 - "Api.ts"
Cohesion: 0.02
Nodes (96): EliminationProgressControl(), Props, stageLabel(), standardStageDenominators(), Header(), HeaderProps, navigation, RootLayout() (+88 more)

### Community 3 - "test-env.mjs"
Cohesion: 0.05
Nodes (55): ref_node_assert, ref_node_child_process, ref_node_crypto, ref_node_fs, ref_node_os, ref_node_path, ref_node_test, ref_node_url (+47 more)

### Community 4 - "Competition"
Cohesion: 0.07
Nodes (40): GetAllCompetition(), GetCompetitionsOfUser(), GetCompetitionWGroups(), GetCompetitionWGroupsPlayersScores(), GetCompetitionWParticipants(), GetCurrentCompetitions(), Competition, UpdateCompetition() (+32 more)

### Community 5 - "LaneBoard.tsx"
Cohesion: 0.14
Nodes (18): LaneBoard(), Props, NameBar(), Props, PlayerInfo(), Props, charAddInt(), Props (+10 more)

### Community 6 - "testing.T"
Cohesion: 0.04
Nodes (61): TestValidateSeederForbidsProductionButDoesNotRequireSession(), TestValidateServerProductionSessionKeyLength(), TestValidateServerRequiredFieldsAndEnvironment(), validApp(), integrationApp(), TestDatabaseInitialCollisionHelper(), TestMatchResultOmitsUnknownPlayerSetID(), assertMigrationVersion() (+53 more)

### Community 7 - "elimination/[teamSize]/page.tsx"
Cohesion: 0.05
Nodes (68): getOutcomeStatus(), MatchOutcomeStatus, Page(), PlayerSetOption, DetailTeamHeader(), laneLabel(), MobileStages(), MobileTeamRow() (+60 more)

### Community 8 - "@mui/material"
Cohesion: 0.04
Nodes (46): Page(), EliminationScoringBoard(), POSSIBLE_SCORES, Props, LocalMatchResult, MatchResultSelector(), Props, Props (+38 more)

### Community 9 - "Competition.ts"
Cohesion: 0.07
Nodes (30): DeleteGroupButton(), Props, columns, GroupGrid(), Props, bowTypes, GroupCreator(), postGroup() (+22 more)

### Community 10 - "ErrorInternalErrorTest"
Cohesion: 0.05
Nodes (73): AddOneCompetitionGroupNum(), DeleteCompetition(), GetCompetitionGroupIds(), GetCompetitionGroupNum(), GetCompetitionIsExist(), GetCompetitionUnassignedGroupId(), GetCompetitionWGroupsPlayers(), GetOnlyCompetition() (+65 more)

### Community 11 - "prunePath"
Cohesion: 0.16
Nodes (9): Layout(), LinkTabProps, Layout(), LinkTabProps, Layout(), LinkTabProps, Layout(), LinkTabProps (+1 more)

### Community 12 - "RankingDialog.tsx"
Cohesion: 0.09
Nodes (27): EndPanel(), Props, Page(), Props, RankingDialog(), RankingPlayer, LaneBlock(), Props (+19 more)

### Community 13 - "net/http.Cookie"
Cohesion: 0.08
Nodes (14): rankingByID(), bulkTestLogin(), bulkTestRequest(), TestBulkRegisterIntegration(), AutoCreatePlayerSetsResponse, BracketAdvanceResponse, BracketFirstRoundSyncResponse, BracketInitResponse (+6 more)

### Community 14 - "hybridExecution.spec.ts"
Cohesion: 0.08
Nodes (40): eliminationWriteActor(), eventMatchCounts(), eventWaves(), HybridEliminationSample, hybridEliminationSamples, hybridEliminationWritePlan, HybridGroup, HybridQualificationSample (+32 more)

### Community 15 - "EliminationBracketIntegrationTestSuite"
Cohesion: 0.06
Nodes (3): UpdateMatchResultIsWinnerById(), GetMedalInfoByEliminationId(), EliminationBracketIntegrationTestSuite

### Community 16 - "competitionLifecycle.spec.ts"
Cohesion: 0.07
Nodes (43): admin, applyToCompetition(), approveAllApplicants(), archers, createCompetition(), createGroup(), judge, password (+35 more)

### Community 17 - "Player"
Cohesion: 0.09
Nodes (28): PostCompetition(), UpdateCompetitionUnassignedGroupId(), UpdateCompetitionUnassignedLaneId(), CreateElimination(), CreateGroupInfo(), PostLane(), CreateMedal(), CreateParticipant() (+20 more)

### Community 18 - "ComputeMatchOutcome"
Cohesion: 0.22
Nodes (23): ComputeMatchOutcome(), Match, isCompoundOutcomeBowType(), isRecurveOutcomeBowType(), isSupportedOutcomeBowType(), matchEndsAndArrowsForOutcome(), assertOutcome(), fillOutcomeMatch() (+15 more)

### Community 19 - "recordingBoard.spec.ts"
Cohesion: 0.09
Nodes (31): User, environmentCommand(), exec, frontend_tests_e2e_fixtures_expect, Fixtures, test, applyToLegacyCompetition(), Competition (+23 more)

### Community 20 - "teamLifecycle.ts"
Cohesion: 0.11
Nodes (38): selectGroup(), assertPlayerReadsConfirmedCurrentMatch(), advanceStage(), chooseJudgeTeam(), activateTeamPhase(), assertJudgeScopeSwitching(), assertTeamDetail(), assertTeamMemberScoringView() (+30 more)

### Community 21 - "react"
Cohesion: 0.05
Nodes (48): GroupMenu(), Props, initialState, progressSlice, frontend_src_app_competition_id_admin_progress_progressslice_setgroupindex, AutocompletePlayerValue, Page(), Page() (+40 more)

### Community 22 - "formalApi.ts"
Cohesion: 0.10
Nodes (34): assertHybridApiWriteAllowed(), ApiRequestOptions, arithmeticQualificationTotals(), assertApprovedScopedActor(), Competition, Elimination, EliminationLookup, Group (+26 more)

### Community 23 - "migration.go"
Cohesion: 0.11
Nodes (41): main(), usage(), Baseline(), hasUserTables(), assertColumnAbsent(), assertColumnPresent(), hasTable(), migrationTestDB() (+33 more)

### Community 24 - "ResetTestDatabase"
Cohesion: 0.05
Nodes (22): main(), usage(), TestResetTestDatabaseCreatesPlayerSchema(), loadLegacyFixture(), resetSchema(), ResetTestDatabase(), TestResetRejectsUnknownFixtureBeforeConnecting(), PlayerTestSuite (+14 more)

### Community 25 - "resultSnapshot.ts"
Cohesion: 0.12
Nodes (31): assertEquivalentLifecycleSnapshots(), bracket(), count(), integer(), LifecycleSnapshot, name(), normalizeLifecycleSnapshot(), qualification() (+23 more)

### Community 26 - "ApiClient.ts"
Cohesion: 0.08
Nodes (22): BulkRegisterPage(), errorMessage(), Props, MyCompetitionPage(), ToCreateButton(), Homepage(), RecentCompetitionPage(), PostUserBody (+14 more)

### Community 27 - "compilerOptions"
Cohesion: 0.06
Nodes (35): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx (+27 more)

### Community 28 - "setMatchWinner"
Cohesion: 0.15
Nodes (15): TestPlacementPairValidation(), applyMatchPlacement(), loadPlacementMatchResults(), normalizeTarget(), sameOptionalString(), validatePlacementPair(), applyManualMatchPlayerSets(), cascadeManualMatchCorrection() (+7 more)

### Community 29 - "package.json"
Cohesion: 0.06
Nodes (33): name, private, type, version, axios, bootstrap, @emotion/react, @emotion/styled (+25 more)

### Community 30 - "Convert2uint"
Cohesion: 0.06
Nodes (80): computeEliminationMatchPoints(), GetEliminationById(), GetEliminationIsExist(), GetEliminationWPlayerSetsById(), GetEliminationWScoresById(), GetMatchIsExist(), GetMatchWScoresById(), GetOnlyEliminationById() (+72 more)

### Community 31 - "ErrorReceiveDataTest"
Cohesion: 0.16
Nodes (34): GetMatchEndIsExist(), GetMatchScoreIsExist(), GetMatchScoreWMEndIdIsExist(), GetRoundEndIsExist(), matchForMatchEnd(), matchResultForMatchEnd(), PutMatchEndsIsConfirmedById(), PutMatchEndsScoresById() (+26 more)

### Community 32 - "JudgeEliminationBoard.tsx"
Cohesion: 0.23
Nodes (12): activeTeamSizes(), cloneEnd(), endStatus(), EVENT_NAMES, JudgeEliminationBoard(), POSSIBLE_SCORES, ScoreEditor, scoreTotal() (+4 more)

### Community 33 - "dependencies"
Cohesion: 0.06
Nodes (31): dependencies, axios, bootstrap, d3, dayjs, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (+23 more)

### Community 34 - "MatchResult"
Cohesion: 0.21
Nodes (12): getComputedMatchResultByID(), GetMatchResultById(), GetMatchResultWScoresById(), MatchResult, MatchEnd, PlayerSet, UpdateMatchResultById(), bracketSlotHasStarted() (+4 more)

### Community 35 - "gorm.io/gorm.DB"
Cohesion: 0.10
Nodes (29): bracketWinnerMutationIsLocked(), setMedalPlayerSet(), applyAutomaticMatchOutcome(), applyAutomaticOutcomeForMatchResult(), loadMatchForAutomaticOutcome(), matchIDForMatchResult(), outcomeBowTypeForElimination(), matchForMatchResult() (+21 more)

### Community 36 - "App"
Cohesion: 0.19
Nodes (11): buildDSN(), openDB(), TestBuildDSNEscapesSpecialPasswordAndKeepsTransportSettings(), TestValidateDatabaseNeedsOnlyDatabaseSettings(), validateDatabase(), main(), App, Database (+3 more)

### Community 37 - "RoleToString"
Cohesion: 0.09
Nodes (52): requestedScenarios(), Dictator, DatabaseInitial(), ensureDictatorForSeeder(), setDictator(), TestDatabaseInitialPreservesExistingDictator(), TestDatabaseInitialRejectsNonDictatorUsernameCollision(), seedLifecycleAccounts() (+44 more)

### Community 38 - "loadBracket"
Cohesion: 0.31
Nodes (13): TestBracketSizesAndStageShapes(), bracketShapeIsCompatible(), bracketStageMatchShapeIsComplete(), createBracket(), ensureManualBracketMutationAllowed(), expectedBracketMatchCounts(), loadBracket(), nextPowerOfTwo() (+5 more)

### Community 39 - "judgeCorrections.ts"
Cohesion: 0.17
Nodes (24): Arrow, assertEliminationReadback(), assertQualificationReadback(), correctConfirmedEliminationEnd(), correctConfirmedQualificationEnd(), editorDeleteButton(), EliminationCorrection, EliminationDetail (+16 more)

### Community 40 - "AutoPlayerSetIntegrationTestSuite"
Cohesion: 0.09
Nodes (6): CreatePlayerSet(), CreatePlayerSetMatchTable(), GetPlayerSetIsExist(), EliminationBracketIntegrationTestSuite, PlayerSetMatchTable, AutoPlayerSetIntegrationTestSuite

### Community 41 - "SwagRouter.go"
Cohesion: 0.33
Nodes (3): go_pkg_github_com_swaggo_files, go_pkg_github_com_swaggo_gin_swagger, go_pkg_github_com_swaggo_swag

### Community 42 - "setupMatchEndWithScores"
Cohesion: 0.09
Nodes (22): CreateMatch(), CreateStage(), GetEliminationWStagesMatchesById(), Stage, Match, UpdateEliminationProgress(), CreateMatchEnd(), CreateMatchResult() (+14 more)

### Community 43 - "PlayerTestSuite"
Cohesion: 0.10
Nodes (7): GetPlayerRoundTotalScoreByRoundId(), GetPlayerScoreByRoundScoreId(), GetPlayerTotalScoreByPlayerId(), GetRoundIdByRoundScoreId(), GetRoundScoreIsExist(), UpdatePlayerScore(), PlayerTestSuite

### Community 44 - "github.com/gin-gonic/gin.Context"
Cohesion: 0.08
Nodes (51): DeleteElimination(), GetLaneIsExist(), CompetitionParticipants(), GetParticipantByCompetitionIdUserId(), GetParticipantByUserId(), Participant, UpdateParticipant(), CheckEmailExistExclude() (+43 more)

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

### Community 49 - "GetPlayerIsExist"
Cohesion: 0.24
Nodes (11): GetPlayerIsExist(), GetPlayerWScores(), GetRoundIsExist(), UpdatePlayerOrder(), UpdatePlayerRoundTotalScore(), UpdatePlayerTotalScore(), GetPlayerWScoresByID(), IsGetPlayerWScores() (+3 more)

### Community 50 - "verification.ts"
Cohesion: 0.17
Nodes (18): assertCompletedIndividualBracket(), assertIndividualProgressIsolation(), assertStage(), finalPairs, IndividualEliminationDetail, IndividualEventSnapshot, IndividualSeedIdentities, individualSeedOrder (+10 more)

### Community 51 - "parseBulkRegisterCSV"
Cohesion: 0.17
Nodes (15): bindBulkRequest(), bulkMatchesPrior(), hasColumn(), parseBulkRegisterCSV(), PreviewBulkRegister(), TestParseBulkRegisterCSV(), TestParseBulkRegisterCSVLimit(), TestParseBulkRegisterCSVRejectsInvalidBatch() (+7 more)

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
Cohesion: 0.14
Nodes (19): DatabaseMatchScore, DatabaseParticipant, EndpointPutMatchEndsIsConfirmedByIdMatchEndIsConfirmedData, EndpointPutMatchEndsScoresByIdMatchEndScoresData, prepareIndividualAutoCreate(), buildEliminationFixture(), buildMatchScores(), buildPlayers() (+11 more)

### Community 58 - "LoadTestDatabaseConfig"
Cohesion: 0.50
Nodes (4): envOrDefault(), LoadTestDatabaseConfig(), TestLoadTestDatabaseConfigRequiresRunner(), TestDatabaseConfig

### Community 59 - "Match"
Cohesion: 0.15
Nodes (20): Match, MatchOutcomeStatus, MatchResult, completeOutcomeEnd(), computeCompoundMatchOutcome(), computeRecurveMatchOutcome(), MatchOutcome, MatchEnd (+12 more)

### Community 60 - "DatabaseMatchOutcomeStatus"
Cohesion: 0.33
Nodes (6): DatabaseMatchOutcomeStatus, MatchOutcomeIncomplete, MatchOutcomeLockedConflict, MatchOutcomeShootOff, MatchOutcomeUnsupportedBowType, MatchOutcomeWinner

### Community 61 - "ReorderPlayerSets"
Cohesion: 0.27
Nodes (12): GetGroupRankingPlayers(), getGroupRankingPlayers(), GroupRankingPlayer, samePlayerIDOrder(), samePlayerIDs(), UpdateGroupPlayerRanking(), AutoRankPlayerSets(), GetPlayerSetRankings() (+4 more)

### Community 62 - "AddApiRouter"
Cohesion: 0.13
Nodes (24): UpdateParticipantRole(), UpdateUserRole(), EnsureRoleInGameRoleSet(), EnsureRoleInSystemRoleSet(), RBACMiddleware(), TestEnsureRoleInGameRoleSet(), TestEnsureRoleInSystemRoleSet(), TestRBACMiddleware() (+16 more)

### Community 63 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, dev, lint, start, test:browser, test:browser:firefox, test:browser:webkit (+6 more)

### Community 64 - "PlayerSet"
Cohesion: 0.15
Nodes (12): GetPlayerSetsByEliminationId(), GetPlayerWPlayerSetsByIDCompeitionID(), PlayerSet, Player, TestBitReversedSeedOrderPairsOddLeftAndEvenRight(), TestExpectedFirstRoundSlotsHasOneByePerMissingEntrant(), TestExpectedFirstRoundSlotsPreservesRankGaps(), TestValidateRosterForSetup() (+4 more)

### Community 65 - "SaveAuthSession"
Cohesion: 0.29
Nodes (7): Logout(), ClearAuthSession(), SaveAuthSession(), sessionOptions(), TestSessionCookieOptionsOnLoginUpdateAndLogout(), github.com/gin-contrib/sessions.Options, SessionContents

### Community 66 - "qualificationRankingDialog.spec.ts"
Cohesion: 0.21
Nodes (9): clone(), dragHandle(), initialRankings, moveFirstPlayerDownWithKeyboard(), orderNames(), RankingPlayer, RankingResponse, RankingRouteHandles (+1 more)

### Community 68 - "ComputeMatchPoints"
Cohesion: 0.25
Nodes (14): comparableEndScores(), ComputeMatchPoints(), MatchEnd, matchScoreValue(), assertEndPoints(), assertIncompleteEnd(), MatchEnd, matchEnd() (+6 more)

### Community 69 - "ContentType"
Cohesion: 0.40
Nodes (5): ContentType, FormData, Json, Text, UrlEncoded

### Community 70 - "ErrorIdTest"
Cohesion: 0.07
Nodes (53): GetCompetitionUnassignedLaneId(), GetGroupIsExist(), GetLaneQualificationId(), UpdateLaneQualificationId(), DeleteParticipant(), GetParticipant(), GetParticipantIsExist(), GetPlayerIdsByCompetitionIdGroupId() (+45 more)

### Community 71 - "EliminationBracket.go"
Cohesion: 0.20
Nodes (21): advanceSourceMatch(), autoAdvanceByes(), createBracketMatch(), explicitWinnerAndLoser(), finalizeBracket(), finalStageMatch(), manualFinalMatchHasAwardedMedals(), matchEndsAndArrows() (+13 more)

### Community 72 - "qualificationScoreSummary.spec.ts"
Cohesion: 0.27
Nodes (7): buildDetailedPlayer(), clone(), QualificationRoutes, refreshTotals(), registerQualificationRoutes(), ScoreRequest, scoreValue()

### Community 73 - "Production deployment and HTTPS guide"
Cohesion: 0.07
Nodes (31): Isolated E2E Compose stack, Loopback-only E2E proxy, Runner-owned backend configuration, Disposable tmpfs MySQL, Build-time public API path, Production persistent MySQL, Production Compose stack, TLS-enabled reverse proxy (+23 more)

### Community 74 - "@elimination/page.tsx"
Cohesion: 0.10
Nodes (29): frontend_src_app_competition_id_scoring_elimination_eliminationscoringslice_addscore, frontend_src_app_competition_id_scoring_elimination_eliminationscoringslice_deletescore, eliminationScoringSlice, EliminationScoringState, expectedArrows(), findSelected(), frontend_src_app_competition_id_scoring_elimination_eliminationscoringslice_initializematchresults, initialState (+21 more)

### Community 75 - "eliminationScoring.spec.ts"
Cohesion: 0.29
Nodes (6): ALL_SCORE_LABELS, selectorGroup(), sideButton(), sideScoreLabels(), sideTotal(), waitReady()

### Community 76 - "Load"
Cohesion: 0.25
Nodes (11): Load(), clearConfigEnvironment(), TestLoadDoesNotDiscoverDotenv(), TestLoadExplicitFileUsesProcessEnvironmentPrecedence(), TestLoadParsesQuotedSpecialCharactersLiterally(), TestLoadRejectsExplicitMissingEnvFile(), TestLoadRejectsInvalidPort(), getIpByMode() (+3 more)

### Community 77 - "browser/fixtures.ts"
Cohesion: 0.22
Nodes (6): mockDictator(), mockUser(), frontend_tests_browser_fixtures_expect, test, competition(), mockPagedCompetitions()

### Community 79 - "getGroupPlayerIdRankOrderById"
Cohesion: 0.50
Nodes (4): GetGroupPlayerIdRankOrderById(), getGroupPlayerIdRankOrderById(), RefreshCompetitionRanks(), GroupPlayer

### Community 81 - "eliminationBracket.spec.ts"
Cohesion: 0.18
Nodes (4): cloneScoreboardMatch(), completeScoreboardStages(), populateScoreboardMatch(), EliminationVariant

### Community 82 - "compilerOptions"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 84 - "Archery OpenAPI contract"
Cohesion: 0.29
Nodes (7): Competition-admin authorization boundary, Competition API domain, Elimination API domain, Session and user API domains, Archery OpenAPI contract, Participant and player API domains, Qualification and match scoring API domains

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
- **502 isolated node(s):** `backend`, `BracketInitRequest`, `StagePlacementRequest`, `PlacementResponse`, `groupIdsForReorder` (+497 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 783 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@playwright/test` connect `competitionLifecycle.spec.ts` to `qualificationRankingDialog.spec.ts`, `test-env.mjs`, `judgeCorrections.ts`, `qualificationScoreSummary.spec.ts`, `eliminationScoring.spec.ts`, `browser/fixtures.ts`, `hybridExecution.spec.ts`, `elimination.ts`, `verification.ts`, `recordingBoard.spec.ts`, `eliminationPlayerSetRanking.spec.ts`, `teamLifecycle.ts`, `eliminationFixtures.ts`, `package.json`, `resultSnapshot.ts`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `@mui/material` connect `@mui/material` to `JudgeEliminationBoard.tsx`, `scoring/@qualification/page.tsx`, `Api.ts`, `LaneBoard.tsx`, `elimination/[teamSize]/page.tsx`, `Competition.ts`, `@elimination/page.tsx`, `prunePath`, `RankingDialog.tsx`, `react`, `CompetitionPostFields.tsx`, `ApiClient.ts`, `package.json`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `JudgeEliminationBoard.tsx`, `scoring/@qualification/page.tsx`, `elimination/[teamSize]/page.tsx`, `@mui/material`, `Competition.ts`, `@elimination/page.tsx`, `prunePath`, `RankingDialog.tsx`, `ApiClient.ts`, `package.json`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 102 inferred relationships involving `Convert2uint()` (e.g. with `DeleteCompetition()` and `GetCompetitionsOfUser()`) actually correct?**
  _`Convert2uint()` has 102 INFERRED edges - model-reasoned connections that need verification._
- **What connects `backend`, `BracketInitRequest`, `StagePlacementRequest` to the rest of the system?**
  _502 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MatchResult.go` be split into smaller, more focused modules?**
  _Cohesion score 0.07403220147362675 - nodes in this community are weakly interconnected._
- **Should `scoring/@qualification/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0953058321479374 - nodes in this community are weakly interconnected._