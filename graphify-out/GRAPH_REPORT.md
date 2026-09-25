# Graph Report - archeryWebsite  (2026-09-25)

## Corpus Check
- 317 files · ~237,122 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 29 file(s) not represented in the graph (top: .scss 13, (none) 10, .example 2)

## Summary
- 2677 nodes · 8531 edges · 117 communities (94 shown, 23 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 462 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ef161af4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- MatchResult.go
- next
- Api.ts
- test-env.mjs
- seeder.go
- react-query
- testing.T
- elimination/[teamSize]/page.tsx
- @mui/material
- LaneBoard.tsx
- ErrorInternalErrorTest
- requireEliminationCompetitionAdmin
- github.com/gin-gonic/gin.Context
- net/http.Cookie
- hybridExecution.spec.ts
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
- SubGamesBar.tsx
- package.json
- Elimination
- Convert2uint
- AcceptPrint
- dependencies
- Competition.ts
- expectedFirstRoundSlots
- DatabaseInitial
- User
- MatchResult
- judgeCorrections.ts
- AutoPlayerSetIntegrationTestSuite
- github.com/gin-gonic/gin.Engine
- setupMatchEndWithScores
- PlayerTestSuite
- PlayerSetRankingIntegrationTestSuite
- 000001_prod_baseline.up.sql
- v1_show_create.sql
- elimination.ts
- .qualificationJudgeFixture
- JudgeEliminationBoard.tsx
- verification.ts
- Database
- eliminationPlayerSetRanking.spec.ts
- Requester
- devDependencies
- store.ts
- CompetitionPostFields.tsx
- eliminationFixtures.ts
- database/sql.DB
- QualificationScoreEditor.tsx
- gorm.io/gorm.DB
- Group
- AddApiRouter
- scripts
- Player
- RBACMiddleware
- qualificationRankingDialog.spec.ts
- scopeNavigation.ts
- ComputeMatchPoints
- IsGetMedalById
- Qualification
- DatabaseMatchOutcomeStatus
- qualificationScoreSummary.spec.ts
- Production deployment and HTTPS guide
- eliminationScoringSlice.ts
- eliminationScoring.spec.ts
- Competition
- buildEliminationFixture
- PostRoundEnd
- app/layout.tsx
- HttpClient
- eliminationBracket.spec.ts
- compilerOptions
- assertScenarioCounts
- Archery OpenAPI contract
- Lane
- go_pkg_io_fs
- theme.d.ts
- EliminationRouteHandles
- LoadTestDatabaseConfig
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
7. `react` - 49 edges
8. `react-query` - 47 edges
9. `apiClient` - 44 edges
10. `Elimination` - 40 edges

## Surprising Connections (you probably didn't know these)
- `Production Compose stack` --semantically_similar_to--> `Production deployment and HTTPS guide`  [INFERRED] [semantically similar]
  docker-compose.yml → docs/deployment.md
- `Isolated E2E Compose stack` --semantically_similar_to--> `E2E runner lifecycle`  [INFERRED] [semantically similar]
  docker-compose-e2e.yml → docs/testing.md
- `TestInitializersRejectNonCurrentMigrationStateWithoutSchemaRepair()` --calls--> `DatabaseInitial()`  [INFERRED]
  backend/internal/database/startup_migration_integration_test.go → backend/internal/database/DB.go
- `TestInitializersRejectNonCurrentMigrationStateWithoutSchemaRepair()` --calls--> `DatabaseInitialForSeeder()`  [INFERRED]
  backend/internal/database/startup_migration_integration_test.go → backend/internal/database/DB.go
- `DropTables()` --calls--> `DropCompetition()`  [INFERRED]
  backend/internal/database/DB.go → backend/internal/database/competition.go

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Server-authoritative scoring lifecycle** — docs_scoring_qualification_authorization, docs_scoring_elimination_authorization, docs_scoring_outcome_resolution, docs_scoring_bracket_progression [EXTRACTED 1.00]
- **Runner-controlled isolated E2E execution** — docker_compose_e2e_tmpfs_mysql, docker_compose_e2e_runner_owned_backend, docker_compose_e2e_loopback_proxy, docs_testing_e2e_runner_lifecycle [INFERRED 0.85]

## Communities (117 total, 23 thin omitted)

### Community 0 - "MatchResult.go"
Cohesion: 0.07
Nodes (103): main(), usage(), DropCompetition(), DropTables(), DropElimination(), DropGroupInfo(), AllInstitutionInfo(), DeleteInstitutionByID() (+95 more)

### Community 1 - "next"
Cohesion: 0.05
Nodes (22): Layout(), LinkTabProps, Layout(), LinkTabProps, Layout(), LinkTabProps, Layout(), LinkTabProps (+14 more)

### Community 2 - "Api.ts"
Cohesion: 0.03
Nodes (80): EliminationProgressControl(), Props, stageLabel(), standardStageDenominators(), ApiConfig, DatabaseElimination, DatabaseLane, DatabaseMedal (+72 more)

### Community 3 - "test-env.mjs"
Cohesion: 0.06
Nodes (55): ref_node_assert, ref_node_child_process, ref_node_crypto, ref_node_fs, ref_node_os, ref_node_path, ref_node_test, ref_node_url (+47 more)

### Community 4 - "seeder.go"
Cohesion: 0.13
Nodes (40): main(), requestedScenarios(), addHostAdmin(), addItemPlayers(), addJudge(), AllScenarios(), assertCompetitionShape(), AssertInvariants() (+32 more)

### Community 5 - "react-query"
Cohesion: 0.09
Nodes (29): AutocompletePlayerValue, Page(), Page(), RankingRow, toRankingRows(), mapPhaseToTeamSize(), useCurrentEliminationMatch(), Props (+21 more)

### Community 6 - "testing.T"
Cohesion: 0.05
Nodes (55): Load(), clearConfigEnvironment(), TestLoadDoesNotDiscoverDotenv(), TestLoadExplicitFileUsesProcessEnvironmentPrecedence(), TestLoadParsesQuotedSpecialCharactersLiterally(), TestLoadRejectsExplicitMissingEnvFile(), TestLoadRejectsInvalidPort(), TestValidateSeederForbidsProductionButDoesNotRequireSession() (+47 more)

### Community 7 - "elimination/[teamSize]/page.tsx"
Cohesion: 0.05
Nodes (70): getOutcomeStatus(), MatchOutcomeStatus, Page(), PlayerSetOption, DetailTeamHeader(), laneLabel(), MobileStages(), MobileTeamRow() (+62 more)

### Community 8 - "@mui/material"
Cohesion: 0.05
Nodes (34): EliminationScoringBoard(), POSSIBLE_SCORES, Props, LocalMatchResult, MatchResultSelector(), Props, Props, ScoreBar() (+26 more)

### Community 9 - "LaneBoard.tsx"
Cohesion: 0.14
Nodes (18): LaneBoard(), Props, NameBar(), Props, PlayerInfo(), Props, charAddInt(), Props (+10 more)

### Community 10 - "ErrorInternalErrorTest"
Cohesion: 0.07
Nodes (59): GetCompetitionGroupIds(), GetCompetitionUnassignedGroupId(), GetOnlyCompetition(), UpdateCompetitionCurrentPhase(), UpdateCompetitionCurrentPhaseMinus(), UpdateCompetitionCurrentPhasePlus(), UpdateCompetitionEliminationActive(), UpdateCompetitionMixedEliminationActive() (+51 more)

### Community 11 - "requireEliminationCompetitionAdmin"
Cohesion: 0.09
Nodes (56): GetEliminationIsExist(), GetOnlyEliminationById(), GetStageById(), GetStageIsExist(), GetMatchResultIsExist(), UpdatePlayerSetName(), TestBracketSizesAndStageShapes(), TestExpectedBracketMatchCounts() (+48 more)

### Community 12 - "github.com/gin-gonic/gin.Context"
Cohesion: 0.05
Nodes (83): DeleteCompetition(), GetCompetitionIsExist(), GetCompetitionWGroupsPlayers(), DeleteElimination(), AddParticipant(), CompetitionParticipants(), DeleteParticipant(), GetParticipantByCompetitionId() (+75 more)

### Community 13 - "net/http.Cookie"
Cohesion: 0.13
Nodes (9): AutoCreatePlayerSetsResponse, BracketAdvanceResponse, BracketFirstRoundSyncResponse, BracketInitResponse, MatchWinnerResponse, PlayerSetRankingResponse, UpdatePlayerSetRankingRequest, net/http.Cookie (+1 more)

### Community 14 - "hybridExecution.spec.ts"
Cohesion: 0.11
Nodes (30): assertHybridApiWriteAllowed(), eliminationWriteActor(), eventMatchCounts(), eventWaves(), HybridEliminationSample, hybridEliminationSamples, hybridEliminationWritePlan, HybridGroup (+22 more)

### Community 15 - "EliminationBracketIntegrationTestSuite"
Cohesion: 0.06
Nodes (4): UpdateMatchResultIsWinnerById(), GetMedalInfoByEliminationId(), EliminationBracketIntegrationTestSuite, createBracketMatch()

### Community 16 - "competitionLifecycle.spec.ts"
Cohesion: 0.08
Nodes (32): admin, applyToCompetition(), approveAllApplicants(), archers, createCompetition(), createGroup(), judge, password (+24 more)

### Community 17 - "RoleToString"
Cohesion: 0.16
Nodes (14): PostCompetition(), UpdateCompetitionUnassignedGroupId(), UpdateCompetitionUnassignedLaneId(), CreateElimination(), CreateGroupInfo(), PostLane(), CreateMedal(), CreateParticipant() (+6 more)

### Community 18 - "ComputeMatchOutcome"
Cohesion: 0.10
Nodes (45): Match, MatchOutcomeStatus, MatchResult, completeOutcomeEnd(), computeCompoundMatchOutcome(), ComputeMatchOutcome(), computeRecurveMatchOutcome(), MatchOutcome (+37 more)

### Community 19 - "recordingBoard.spec.ts"
Cohesion: 0.09
Nodes (31): User, environmentCommand(), exec, frontend_tests_e2e_fixtures_expect, Fixtures, test, applyToLegacyCompetition(), Competition (+23 more)

### Community 20 - "teamLifecycle.ts"
Cohesion: 0.11
Nodes (38): selectGroup(), assertPlayerReadsConfirmedCurrentMatch(), advanceStage(), chooseJudgeTeam(), activateTeamPhase(), assertJudgeScopeSwitching(), assertTeamDetail(), assertTeamMemberScoringView() (+30 more)

### Community 21 - "react"
Cohesion: 0.09
Nodes (32): GroupMenu(), Props, frontend_src_app_competition_id_admin_progress_progressslice_setgroupindex, GroupMenu(), Props, Page(), frontend_src_app_competition_id_admin_schedule_qualification_qualificationscheduleslice_setadvancingnum, frontend_src_app_competition_id_admin_schedule_qualification_qualificationscheduleslice_setendlane (+24 more)

### Community 22 - "formalApi.ts"
Cohesion: 0.08
Nodes (44): ApiRequestOptions, arithmeticQualificationTotals(), assertApprovedScopedActor(), Competition, Elimination, EliminationLookup, Group, groupAndActorPlayer() (+36 more)

### Community 23 - "migration.go"
Cohesion: 0.13
Nodes (31): main(), usage(), Baseline(), hasUserTables(), newMigrator(), normalizeCreate(), ReadVersion(), readVersion() (+23 more)

### Community 24 - "ResetTestDatabase"
Cohesion: 0.06
Nodes (16): TestResetTestDatabaseCreatesPlayerSchema(), loadLegacyFixture(), resetSchema(), ResetTestDatabase(), TestResetRejectsUnknownFixtureBeforeConnecting(), PlayerTestSuite, EnableCookieSessionMiddleware(), sessionOptions() (+8 more)

### Community 25 - "resultSnapshot.ts"
Cohesion: 0.12
Nodes (31): assertEquivalentLifecycleSnapshots(), bracket(), count(), integer(), LifecycleSnapshot, name(), normalizeLifecycleSnapshot(), qualification() (+23 more)

### Community 26 - "scoring/@qualification/page.tsx"
Cohesion: 0.09
Nodes (28): columns, JudgeLayout(), Layout(), Page(), frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_addscore, frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_confirm, frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_deletescore, frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_initends (+20 more)

### Community 27 - "compilerOptions"
Cohesion: 0.06
Nodes (35): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx (+27 more)

### Community 28 - "SubGamesBar.tsx"
Cohesion: 0.11
Nodes (19): DeleteGroupButton(), Props, columns, GroupGrid(), Props, bowTypes, GroupCreator(), postGroup() (+11 more)

### Community 29 - "package.json"
Cohesion: 0.06
Nodes (32): name, private, type, version, bootstrap, @emotion/react, @emotion/styled, eslint (+24 more)

### Community 30 - "Elimination"
Cohesion: 0.09
Nodes (31): computeEliminationMatchPoints(), GetEliminationById(), GetEliminationWPlayerSetsById(), GetEliminationWScoresById(), GetEliminationWStagesMatchesById(), Elimination, PlayerSet, UpdateEliminationCurrentEndMinus() (+23 more)

### Community 31 - "Convert2uint"
Cohesion: 0.13
Nodes (43): GetLaneIsExist(), GetMatchEndIsExist(), GetMatchScoreIsExist(), GetMatchScoreWMEndIdIsExist(), GetPlayerIsExist(), GetRoundEndIsExist(), authorizePlayerControl(), lockedCompetitionUnassignedLane() (+35 more)

### Community 32 - "AcceptPrint"
Cohesion: 0.12
Nodes (24): AddOneCompetitionGroupNum(), GetCompetitionGroupNum(), GetCompetitionUnassignedLaneId(), MinusOneCompetitionGroupNum(), UpdateCompetitionGroupNum(), GetMatchIsExist(), GetMatchWScoresById(), DeleteLaneByCompetitionId() (+16 more)

### Community 33 - "dependencies"
Cohesion: 0.06
Nodes (31): dependencies, axios, bootstrap, d3, dayjs, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (+23 more)

### Community 34 - "Competition.ts"
Cohesion: 0.08
Nodes (29): EndPanel(), Props, Page(), Props, RankingDialog(), RankingPlayer, LaneBlock(), Props (+21 more)

### Community 35 - "expectedFirstRoundSlots"
Cohesion: 0.33
Nodes (6): TestBitReversedSeedOrderPairsOddLeftAndEvenRight(), TestExpectedFirstRoundSlotsHasOneByePerMissingEntrant(), TestExpectedFirstRoundSlotsPreservesRankGaps(), bitReversedSeedOrder(), expectedFirstRoundSlots(), sameOptionalID()

### Community 36 - "DatabaseInitial"
Cohesion: 0.13
Nodes (20): App, connectDB(), DatabaseInitial(), DatabaseInitialForSeeder(), requireCurrentSchema(), integrationApp(), TestDatabaseInitialCollisionHelper(), TestDatabaseInitialPreservesExistingDictator() (+12 more)

### Community 37 - "User"
Cohesion: 0.20
Nodes (17): Dictator, ensureDictatorForSeeder(), setDictator(), seedLifecycleAccounts(), seedTestAdmin(), CreateUser(), FindByUsername(), GetEmailIsExist() (+9 more)

### Community 38 - "MatchResult"
Cohesion: 0.11
Nodes (30): Stage, Match, getComputedMatchResultByID(), GetMatchResultWScoresById(), MatchResult, MatchEnd, PlayerSet, UpdateMatchResultById() (+22 more)

### Community 39 - "judgeCorrections.ts"
Cohesion: 0.17
Nodes (24): Arrow, assertEliminationReadback(), assertQualificationReadback(), correctConfirmedEliminationEnd(), correctConfirmedQualificationEnd(), editorDeleteButton(), EliminationCorrection, EliminationDetail (+16 more)

### Community 40 - "AutoPlayerSetIntegrationTestSuite"
Cohesion: 0.09
Nodes (6): CreatePlayerSet(), CreatePlayerSetMatchTable(), GetPlayerSetIsExist(), EliminationBracketIntegrationTestSuite, PlayerSetMatchTable, AutoPlayerSetIntegrationTestSuite

### Community 41 - "github.com/gin-gonic/gin.Engine"
Cohesion: 0.13
Nodes (13): assertRoundScore(), authenticatedScoreRequest(), intString(), newScoreTestRouter(), uintString(), SetUpRouter(), SwagSetUp(), SetUpRouter() (+5 more)

### Community 42 - "setupMatchEndWithScores"
Cohesion: 0.21
Nodes (12): CreateMatchEnd(), CreateMatchResult(), CreateMatchScore(), GetMatchEndById(), GetMatchResultById(), GetMatchScoreById(), MatchEnd, MatchScore (+4 more)

### Community 43 - "PlayerTestSuite"
Cohesion: 0.10
Nodes (7): GetPlayerRoundTotalScoreByRoundId(), GetPlayerScoreByRoundScoreId(), GetPlayerTotalScoreByPlayerId(), GetRoundIdByRoundScoreId(), GetRoundScoreIsExist(), UpdatePlayerScore(), PlayerTestSuite

### Community 44 - "PlayerSetRankingIntegrationTestSuite"
Cohesion: 0.12
Nodes (4): CreateMatch(), CreateStage(), UpdateEliminationProgress(), PlayerSetRankingIntegrationTestSuite

### Community 45 - "000001_prod_baseline.up.sql"
Cohesion: 0.18
Nodes (20): `competitions`, `eliminations`, `groups`, `institutions`, `lanes`, `match_ends`, `match_results`, `match_scores` (+12 more)

### Community 46 - "v1_show_create.sql"
Cohesion: 0.18
Nodes (20): `competitions`, `eliminations`, `groups`, `institutions`, `lanes`, `match_ends`, `match_results`, `match_scores` (+12 more)

### Community 47 - "elimination.ts"
Cohesion: 0.16
Nodes (20): Bow, chooseJudgeEvent(), chooseJudgeIndividual(), chooseJudgeOption(), confirmSide(), eliminationId(), JudgeMatchScope, Score (+12 more)

### Community 48 - ".qualificationJudgeFixture"
Cohesion: 0.21
Nodes (9): CreateRound(), CreateRoundEnd(), CreateRoundScore(), Round, RoundEnd, EliminationBracketIntegrationTestSuite, RoundScore, RoundEnd (+1 more)

### Community 49 - "JudgeEliminationBoard.tsx"
Cohesion: 0.23
Nodes (12): activeTeamSizes(), cloneEnd(), endStatus(), EVENT_NAMES, JudgeEliminationBoard(), POSSIBLE_SCORES, ScoreEditor, scoreTotal() (+4 more)

### Community 50 - "verification.ts"
Cohesion: 0.17
Nodes (18): assertCompletedIndividualBracket(), assertIndividualProgressIsolation(), assertStage(), finalPairs, IndividualEliminationDetail, IndividualEventSnapshot, IndividualSeedIdentities, individualSeedOrder (+10 more)

### Community 51 - "Database"
Cohesion: 0.40
Nodes (6): buildDSN(), openDB(), TestBuildDSNEscapesSpecialPasswordAndKeepsTransportSettings(), TestValidateDatabaseNeedsOnlyDatabaseSettings(), validateDatabase(), Database

### Community 52 - "eliminationPlayerSetRanking.spec.ts"
Cohesion: 0.16
Nodes (15): AUTO_ROWS, clone(), dragHandle(), INITIAL_ROWS, moveRowDownWithKeyboard(), RankingRouteHandles, RankingRow, rankingTable() (+7 more)

### Community 53 - "Requester"
Cohesion: 0.21
Nodes (5): the csv file be like real_name, password, target, read_user_csv(), Requester, csv, requests

### Community 54 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, @playwright/test, @types/d3, @types/node, @types/react (+9 more)

### Community 55 - "store.ts"
Cohesion: 0.15
Nodes (12): initialState, progressSlice, initialState, qualificationScheduleSlice, initialState, scheduleSlice, initialState, qualificationScoringSlice (+4 more)

### Community 56 - "CompetitionPostFields.tsx"
Cohesion: 0.19
Nodes (11): CompetitionPostFields(), dayjsToISO(), endTime, Props, startTime, CreateButton(), postBody, PostCompetitionBody (+3 more)

### Community 57 - "eliminationFixtures.ts"
Cohesion: 0.15
Nodes (16): HeaderProps, DatabaseMatchScore, DatabaseParticipant, DatabaseUser, EndpointCompetitionWGroupsQuaEliData, EndpointPutMatchEndsIsConfirmedByIdMatchEndIsConfirmedData, EndpointPutMatchEndsScoresByIdMatchEndScoresData, EliminationFixture (+8 more)

### Community 58 - "database/sql.DB"
Cohesion: 0.21
Nodes (16): assertMigrationVersion(), assertNoStartupRows(), currentSQLDB(), showCreates(), sqlTableExists(), TestInitializersRejectNonCurrentMigrationStateWithoutSchemaRepair(), assertColumnAbsent(), assertColumnPresent() (+8 more)

### Community 59 - "QualificationScoreEditor.tsx"
Cohesion: 0.12
Nodes (21): Page(), cloneEnd(), endTotal(), QualificationScoreEditor(), Props, RankingInfoBar(), EndBar(), Props (+13 more)

### Community 60 - "gorm.io/gorm.DB"
Cohesion: 0.13
Nodes (27): setMedalPlayerSet(), matchIDForMatchResult(), matchForMatchResult(), matchForMatchScore(), matchResultForMatchScore(), requireOccupiedMatchResult(), rosterEliminationForMatchResult(), rosterEliminationForMatchScore() (+19 more)

### Community 61 - "Group"
Cohesion: 0.11
Nodes (22): GetGroupInfoWPlayersById(), GetGroupPlayerIdRankOrderById(), getGroupPlayerIdRankOrderById(), GetGroupRankingPlayers(), getGroupRankingPlayers(), Group, GroupRankingPlayer, Player (+14 more)

### Community 62 - "AddApiRouter"
Cohesion: 0.25
Nodes (14): AddApiRouter(), competitionRouter(), eliminationRouter(), groupInfoRouter(), laneRouter(), matchResultRouter(), medalRouter(), playerRouter() (+6 more)

### Community 63 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, dev, lint, start, test:browser, test:browser:firefox, test:browser:webkit (+6 more)

### Community 64 - "Player"
Cohesion: 0.14
Nodes (16): GetDummyPlayersByParticipantId(), Player, PlayerSet, GetPlayerSetsByEliminationId(), GetPlayerWPlayerSetsByIDCompeitionID(), PlayerSet, Player, lockedPlayerControlTarget() (+8 more)

### Community 65 - "RBACMiddleware"
Cohesion: 0.21
Nodes (12): UpdateParticipantRole(), UpdateUserRole(), EnsureRoleInGameRoleSet(), EnsureRoleInSystemRoleSet(), RBACMiddleware(), TestEnsureRoleInGameRoleSet(), TestEnsureRoleInSystemRoleSet(), TestRBACMiddleware() (+4 more)

### Community 66 - "qualificationRankingDialog.spec.ts"
Cohesion: 0.21
Nodes (9): clone(), dragHandle(), initialRankings, moveFirstPlayerDownWithKeyboard(), orderNames(), RankingPlayer, RankingResponse, RankingRouteHandles (+1 more)

### Community 67 - "scopeNavigation.ts"
Cohesion: 0.26
Nodes (11): assertDivergedEliminationScopes(), assertJudgeEventAvailability(), assertOfficialProgress(), assertQualificationRankingDialogScopes(), assertQualificationScheduleScopes(), DivergedEliminationScope, escaped(), eventName() (+3 more)

### Community 68 - "ComputeMatchPoints"
Cohesion: 0.25
Nodes (14): comparableEndScores(), ComputeMatchPoints(), MatchEnd, matchScoreValue(), assertEndPoints(), assertIncompleteEnd(), MatchEnd, matchEnd() (+6 more)

### Community 69 - "IsGetMedalById"
Cohesion: 0.25
Nodes (9): GetMedalById(), GetMedalIsExist(), Medal, GetPlayerSetById(), GetMedalById(), GetMedalInfoByEliminationId(), IsGetMedalById(), IsGetMedalsByEliminationId() (+1 more)

### Community 70 - "Qualification"
Cohesion: 0.23
Nodes (13): GetQualificationIsExist(), GetQualificationWLanesByID(), GetQualificationWLanesPlayersByID(), GetQualificationWUnassignedLanesByID(), Qualification, UpdateQualification(), GetQualificationWLanesByID(), GetQualificationWLanesPlayersByID() (+5 more)

### Community 71 - "DatabaseMatchOutcomeStatus"
Cohesion: 0.16
Nodes (11): ContentType, FormData, Json, Text, UrlEncoded, DatabaseMatchOutcomeStatus, MatchOutcomeIncomplete, MatchOutcomeLockedConflict (+3 more)

### Community 72 - "qualificationScoreSummary.spec.ts"
Cohesion: 0.27
Nodes (7): buildDetailedPlayer(), clone(), QualificationRoutes, refreshTotals(), registerQualificationRoutes(), ScoreRequest, scoreValue()

### Community 73 - "Production deployment and HTTPS guide"
Cohesion: 0.07
Nodes (31): Isolated E2E Compose stack, Loopback-only E2E proxy, Runner-owned backend configuration, Disposable tmpfs MySQL, Build-time public API path, Production persistent MySQL, Production Compose stack, TLS-enabled reverse proxy (+23 more)

### Community 74 - "eliminationScoringSlice.ts"
Cohesion: 0.31
Nodes (9): eliminationScoringSlice, EliminationScoringState, expectedArrows(), findSelected(), initialState, LocalMatchScore, scorefmt(), sortScoresDesc() (+1 more)

### Community 75 - "eliminationScoring.spec.ts"
Cohesion: 0.29
Nodes (6): ALL_SCORE_LABELS, selectorGroup(), sideButton(), sideScoreLabels(), sideTotal(), waitReady()

### Community 76 - "Competition"
Cohesion: 0.18
Nodes (11): GetAllCompetition(), GetCompetitionsOfUser(), GetCompetitionWGroups(), GetCompetitionWGroupsPlayersScores(), GetCompetitionWParticipants(), GetCurrentCompetitions(), Competition, UpdateCompetition() (+3 more)

### Community 77 - "buildEliminationFixture"
Cohesion: 0.25
Nodes (9): prepareIndividualAutoCreate(), buildEliminationFixture(), buildMatchScores(), buildPlayers(), findMatchEndById(), registerEliminationRoutes(), outcomeCases, frontend_tests_browser_fixtures_expect (+1 more)

### Community 78 - "PostRoundEnd"
Cohesion: 0.25
Nodes (9): GetPlayerWScores(), GetRoundIsExist(), UpdatePlayerRoundTotalScore(), UpdatePlayerTotalScore(), GetPlayerWScoresByID(), IsGetPlayerWScores(), PostRoundEnd(), RefreshPlayerTotalScore() (+1 more)

### Community 79 - "app/layout.tsx"
Cohesion: 0.29
Nodes (5): queryClient, store, frontend_src_styles_app, scoringTheme, react-redux

### Community 81 - "eliminationBracket.spec.ts"
Cohesion: 0.32
Nodes (4): cloneScoreboardMatch(), completeScoreboardStages(), populateScoreboardMatch(), EliminationVariant

### Community 82 - "compilerOptions"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 83 - "assertScenarioCounts"
Cohesion: 0.29
Nodes (7): assertScenarioCounts(), assertScenariosDoNotShareRows(), countIs(), itemGroupIDs(), pluck(), roundScoresOfGroup(), unscoredArrows()

### Community 84 - "Archery OpenAPI contract"
Cohesion: 0.29
Nodes (7): Competition-admin authorization boundary, Competition API domain, Elimination API domain, Session and user API domains, Archery OpenAPI contract, Participant and player API domains, Qualification and match scoring API domains

### Community 85 - "Lane"
Cohesion: 0.29
Nodes (6): GetAllLanesByCompetitionId(), GetLaneById(), GetLaneWScoresById(), Lane, Player, UpdateLane()

### Community 87 - "theme.d.ts"
Cohesion: 0.33
Nodes (5): ButtonPropsColorOverrides, @mui/material/Button, @mui/material/styles, Palette, PaletteOptions

### Community 89 - "LoadTestDatabaseConfig"
Cohesion: 0.50
Nodes (4): envOrDefault(), LoadTestDatabaseConfig(), TestLoadTestDatabaseConfigRequiresRunner(), TestDatabaseConfig

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
- **487 isolated node(s):** `backend`, `BracketInitRequest`, `StagePlacementRequest`, `PlacementResponse`, `groupIdsForReorder` (+482 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 755 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@playwright/test` connect `competitionLifecycle.spec.ts` to `qualificationRankingDialog.spec.ts`, `scopeNavigation.ts`, `judgeCorrections.ts`, `qualificationScoreSummary.spec.ts`, `eliminationScoring.spec.ts`, `buildEliminationFixture`, `hybridExecution.spec.ts`, `elimination.ts`, `verification.ts`, `recordingBoard.spec.ts`, `eliminationPlayerSetRanking.spec.ts`, `teamLifecycle.ts`, `formalApi.ts`, `eliminationFixtures.ts`, `package.json`, `resultSnapshot.ts`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `@mui/material` connect `@mui/material` to `next`, `Api.ts`, `Competition.ts`, `react-query`, `elimination/[teamSize]/page.tsx`, `LaneBoard.tsx`, `app/layout.tsx`, `JudgeEliminationBoard.tsx`, `react`, `CompetitionPostFields.tsx`, `scoring/@qualification/page.tsx`, `QualificationScoreEditor.tsx`, `SubGamesBar.tsx`, `package.json`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `next`, `Competition.ts`, `react-query`, `elimination/[teamSize]/page.tsx`, `@mui/material`, `app/layout.tsx`, `JudgeEliminationBoard.tsx`, `scoring/@qualification/page.tsx`, `QualificationScoreEditor.tsx`, `SubGamesBar.tsx`, `package.json`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 102 inferred relationships involving `Convert2uint()` (e.g. with `DeleteCompetition()` and `GetCompetitionsOfUser()`) actually correct?**
  _`Convert2uint()` has 102 INFERRED edges - model-reasoned connections that need verification._
- **What connects `backend`, `BracketInitRequest`, `StagePlacementRequest` to the rest of the system?**
  _487 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MatchResult.go` be split into smaller, more focused modules?**
  _Cohesion score 0.06867256637168141 - nodes in this community are weakly interconnected._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.05411764705882353 - nodes in this community are weakly interconnected._