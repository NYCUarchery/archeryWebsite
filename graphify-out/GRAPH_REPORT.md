# Graph Report - archeryWebsite  (2026-09-26)

## Corpus Check
- 335 files · ~285,346 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 31 file(s) not represented in the graph (top: .scss 14, (none) 10, .example 2)

## Summary
- 2791 nodes · 9085 edges · 120 communities (94 shown, 26 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 481 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3fadb803`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- competition.go
- scoring/@qualification/page.tsx
- Api.ts
- test-env.mjs
- seeder.go
- LaneBoard.tsx
- testing.T
- @elimination/[teamSize]/page.tsx
- QualificationScoreEditor.tsx
- Competition.ts
- ErrorInternalErrorTest
- AcceptPrint
- react-query
- net/http.Cookie
- hybridExecution.spec.ts
- EliminationBracketIntegrationTestSuite
- competitionLifecycle.spec.ts
- RoleToString
- ComputeMatchOutcome
- recordingBoard.spec.ts
- teamLifecycle.ts
- @mui/material
- formalApi.ts
- migration.go
- ResetTestDatabase
- resultSnapshot.ts
- PhaseMenu.tsx
- compilerOptions
- store.ts
- package.json
- Convert2uint
- ErrorReceiveDataTest
- JudgeEliminationBoard.tsx
- dependencies
- PlayerSet
- gorm.io/gorm.DB
- DatabaseInitial
- EmailPointer
- parseQualificationAssignmentCSV
- judgeCorrections.ts
- AutoPlayerSetIntegrationTestSuite
- github.com/gin-gonic/gin.Engine
- setupMatchEndWithScores
- PlayerTestSuite
- ErrorIdTest
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
- database/sql.DB
- MatchOutcome
- DatabaseMatchOutcomeStatus
- ReorderPlayerSets
- AddApiRouter
- scripts
- Qualification
- applyMatchPlacement
- qualificationRankingDialog.spec.ts
- EliminationRouteHandles
- ComputeMatchPoints
- MatchResult
- github.com/gin-gonic/gin.Context
- EliminationBracket.go
- qualificationScoreSummary.spec.ts
- Production deployment and HTTPS guide
- @elimination/page.tsx
- eliminationScoring.spec.ts
- Load
- browser/fixtures.ts
- scopeNavigation.ts
- getGroupPlayerIdRankOrderById
- HttpClient
- eliminationBracket.spec.ts
- compilerOptions
- syncFirstRoundRoster
- Archery OpenAPI contract
- SwagRouter.go
- go_pkg_io_fs
- theme.d.ts
- users
- Development Compose stack
- Archery Target Mark
- IsGetMedalById
- Match
- Deployment configuration validation
- Continuous integration test matrix
- Second 25th Fengcheng Cup newcomer qualification results
- Array
- Reverse Proxy Kubernetes Service
- homeRedesign.spec.ts
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

## Communities (120 total, 26 thin omitted)

### Community 0 - "competition.go"
Cohesion: 0.07
Nodes (103): DropCompetition(), DropTables(), DropElimination(), DropGroupInfo(), AddInstitution(), AllInstitutionInfo(), DeleteInstitutionByID(), DropInstitution() (+95 more)

### Community 1 - "scoring/@qualification/page.tsx"
Cohesion: 0.05
Nodes (48): JudgeLayout(), Layout(), Page(), frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_addscore, frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_confirm, frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_deletescore, frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_initends, frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_setselectedorder (+40 more)

### Community 2 - "Api.ts"
Cohesion: 0.02
Nodes (90): EliminationProgressControl(), Props, stageLabel(), standardStageDenominators(), PostUserBody, ApiConfig, DatabaseElimination, DatabaseInstitution (+82 more)

### Community 3 - "test-env.mjs"
Cohesion: 0.06
Nodes (55): ref_node_assert, ref_node_child_process, ref_node_crypto, ref_node_fs, ref_node_os, ref_node_path, ref_node_test, ref_node_url (+47 more)

### Community 4 - "seeder.go"
Cohesion: 0.07
Nodes (66): main(), requestedScenarios(), GetAllCompetition(), GetCompetitionsOfUser(), GetCompetitionWGroups(), GetCompetitionWGroupsPlayersScores(), GetCompetitionWParticipants(), GetCurrentCompetitions() (+58 more)

### Community 5 - "LaneBoard.tsx"
Cohesion: 0.10
Nodes (25): LaneBlock(), Props, LaneBoard(), Props, NameBar(), Props, PlayerInfo(), Props (+17 more)

### Community 6 - "testing.T"
Cohesion: 0.04
Nodes (56): TestValidateSeederForbidsProductionButDoesNotRequireSession(), TestValidateServerProductionSessionKeyLength(), TestValidateServerRequiredFieldsAndEnvironment(), validApp(), TestMatchResultOmitsUnknownPlayerSetID(), TestEliminationProgressTestSuite(), TestPlayerTestSuite(), TestTestDatabaseConfigValidate() (+48 more)

### Community 7 - "@elimination/[teamSize]/page.tsx"
Cohesion: 0.06
Nodes (54): DetailTeamHeader(), laneLabel(), MobileStages(), MobileTeamRow(), Page(), playerSetFor(), stageLabel(), teamMembers() (+46 more)

### Community 8 - "QualificationScoreEditor.tsx"
Cohesion: 0.08
Nodes (33): Page(), Props, ScoreBar(), cloneEnd(), endTotal(), QualificationScoreEditor(), Props, RankingInfoBar() (+25 more)

### Community 9 - "Competition.ts"
Cohesion: 0.09
Nodes (29): Props, Props, EndPanel(), Props, Page(), Props, RankingDialog(), RankingPlayer (+21 more)

### Community 10 - "ErrorInternalErrorTest"
Cohesion: 0.07
Nodes (65): AddOneCompetitionGroupNum(), GetCompetitionGroupIds(), GetCompetitionGroupNum(), GetCompetitionUnassignedGroupId(), GetCompetitionUnassignedLaneId(), GetOnlyCompetition(), MinusOneCompetitionGroupNum(), UpdateCompetitionCurrentPhaseMinus() (+57 more)

### Community 11 - "AcceptPrint"
Cohesion: 0.10
Nodes (30): computeEliminationMatchPoints(), GetEliminationByGroupId(), GetEliminationById(), GetEliminationWPlayerSetsById(), GetEliminationWScoresById(), GetMatchIsExist(), GetMatchWScoresById(), Elimination (+22 more)

### Community 12 - "react-query"
Cohesion: 0.07
Nodes (48): getOutcomeStatus(), MatchOutcomeStatus, Page(), PlayerSetOption, GroupMenu(), Props, frontend_src_app_competition_id_admin_progress_progressslice_setgroupindex, AutocompletePlayerValue (+40 more)

### Community 13 - "net/http.Cookie"
Cohesion: 0.07
Nodes (12): rankingByID(), AutoCreatePlayerSetsResponse, BracketAdvanceResponse, BracketFirstRoundSyncResponse, BracketInitResponse, MatchWinnerResponse, PlayerSetRankingIntegrationTestSuite, PlayerSetRankingResponse (+4 more)

### Community 14 - "hybridExecution.spec.ts"
Cohesion: 0.11
Nodes (30): assertHybridApiWriteAllowed(), eliminationWriteActor(), eventMatchCounts(), eventWaves(), HybridEliminationSample, hybridEliminationSamples, hybridEliminationWritePlan, HybridGroup (+22 more)

### Community 15 - "EliminationBracketIntegrationTestSuite"
Cohesion: 0.06
Nodes (3): UpdateMatchResultIsWinnerById(), GetMedalInfoByEliminationId(), EliminationBracketIntegrationTestSuite

### Community 16 - "competitionLifecycle.spec.ts"
Cohesion: 0.08
Nodes (32): admin, applyToCompetition(), approveAllApplicants(), archers, createCompetition(), createGroup(), judge, password (+24 more)

### Community 17 - "RoleToString"
Cohesion: 0.09
Nodes (34): PostCompetition(), UpdateCompetitionUnassignedGroupId(), UpdateCompetitionUnassignedLaneId(), CreateElimination(), CreateGroupInfo(), GetGroupInfoById(), GetGroupInfoWPlayersById(), Group (+26 more)

### Community 18 - "ComputeMatchOutcome"
Cohesion: 0.22
Nodes (23): ComputeMatchOutcome(), Match, isCompoundOutcomeBowType(), isRecurveOutcomeBowType(), isSupportedOutcomeBowType(), matchEndsAndArrowsForOutcome(), assertOutcome(), fillOutcomeMatch() (+15 more)

### Community 19 - "recordingBoard.spec.ts"
Cohesion: 0.09
Nodes (31): User, environmentCommand(), exec, frontend_tests_e2e_fixtures_expect, Fixtures, test, applyToLegacyCompetition(), Competition (+23 more)

### Community 20 - "teamLifecycle.ts"
Cohesion: 0.11
Nodes (38): selectGroup(), signedInPage(), advanceStage(), chooseJudgeTeam(), activateTeamPhase(), assertJudgeScopeSwitching(), assertTeamDetail(), assertTeamMemberScoringView() (+30 more)

### Community 21 - "@mui/material"
Cohesion: 0.04
Nodes (36): DeleteGroupButton(), columns, GroupGrid(), bowTypes, GroupCreator(), postGroup(), Props, errorMessage() (+28 more)

### Community 22 - "formalApi.ts"
Cohesion: 0.08
Nodes (44): ApiRequestOptions, arithmeticQualificationTotals(), assertApprovedScopedActor(), Competition, Elimination, EliminationLookup, Group, groupAndActorPlayer() (+36 more)

### Community 23 - "migration.go"
Cohesion: 0.13
Nodes (31): main(), usage(), Baseline(), hasUserTables(), newMigrator(), normalizeCreate(), ReadVersion(), readVersion() (+23 more)

### Community 24 - "ResetTestDatabase"
Cohesion: 0.05
Nodes (22): main(), usage(), GetAllLanesByCompetitionId(), GetOnlyQualification(), TestResetTestDatabaseCreatesPlayerSchema(), loadLegacyFixture(), resetSchema(), ResetTestDatabase() (+14 more)

### Community 25 - "resultSnapshot.ts"
Cohesion: 0.12
Nodes (31): assertEquivalentLifecycleSnapshots(), bracket(), count(), integer(), LifecycleSnapshot, name(), normalizeLifecycleSnapshot(), qualification() (+23 more)

### Community 26 - "PhaseMenu.tsx"
Cohesion: 0.21
Nodes (9): AccordionSummaryStyle, PhaseMenu(), Props, getChinesePhaseName(), PhaseEnums, Elimination, MixedElimination, Qualification (+1 more)

### Community 27 - "compilerOptions"
Cohesion: 0.06
Nodes (35): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx (+27 more)

### Community 28 - "store.ts"
Cohesion: 0.10
Nodes (17): initialState, progressSlice, initialState, qualificationScheduleSlice, initialState, scheduleSlice, initialState, qualificationScoringSlice (+9 more)

### Community 29 - "package.json"
Cohesion: 0.06
Nodes (32): name, private, type, version, bootstrap, @emotion/react, @emotion/styled, eslint (+24 more)

### Community 30 - "Convert2uint"
Cohesion: 0.10
Nodes (51): GetEliminationIsExist(), GetOnlyEliminationById(), GetStageById(), GetStageIsExist(), UpdateEliminationCurrentEndMinus(), UpdateEliminationCurrentEndPlus(), UpdateEliminationCurrentStageMinus(), UpdateEliminationCurrentStagePlus() (+43 more)

### Community 31 - "ErrorReceiveDataTest"
Cohesion: 0.15
Nodes (36): UpdateCompetitionCurrentPhase(), GetMatchEndIsExist(), GetMatchScoreIsExist(), GetMatchScoreWMEndIdIsExist(), GetRoundEndIsExist(), PutCompetitionCurrentPhase(), lockEliminationForScoring(), matchForMatchEnd() (+28 more)

### Community 32 - "JudgeEliminationBoard.tsx"
Cohesion: 0.13
Nodes (19): activeTeamSizes(), cloneEnd(), endStatus(), EVENT_NAMES, JudgeEliminationBoard(), POSSIBLE_SCORES, ScoreEditor, scoreTotal() (+11 more)

### Community 33 - "dependencies"
Cohesion: 0.06
Nodes (31): dependencies, axios, bootstrap, d3, dayjs, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (+23 more)

### Community 34 - "PlayerSet"
Cohesion: 0.12
Nodes (17): GetPlayerSetsByEliminationId(), GetPlayerWPlayerSetsByIDCompeitionID(), PlayerSet, Player, TestExpectedBracketMatchCounts(), TestMatchEndsAndArrowsByTeamSize(), TestValidateRosterForFirstRound(), TestValidateRosterForSetup() (+9 more)

### Community 35 - "gorm.io/gorm.DB"
Cohesion: 0.11
Nodes (27): lockedControlGroup(), bracketWinnerMutationIsLocked(), loadBracket(), setMedalPlayerSet(), applyAutomaticMatchOutcome(), applyAutomaticOutcomeForMatchResult(), matchIDForMatchResult(), outcomeBowTypeForElimination() (+19 more)

### Community 36 - "DatabaseInitial"
Cohesion: 0.17
Nodes (15): buildDSN(), openDB(), TestBuildDSNEscapesSpecialPasswordAndKeepsTransportSettings(), TestValidateDatabaseNeedsOnlyDatabaseSettings(), validateDatabase(), App, Database, connectDB() (+7 more)

### Community 37 - "EmailPointer"
Cohesion: 0.16
Nodes (26): Dictator, ensureDictatorForSeeder(), setDictator(), TestDatabaseInitialPreservesExistingDictator(), TestDatabaseInitialRejectsNonDictatorUsernameCollision(), seedLifecycleAccounts(), seedTestAdmin(), CreateUser() (+18 more)

### Community 38 - "parseQualificationAssignmentCSV"
Cohesion: 0.17
Nodes (16): bindQualificationAssignmentRequest(), ImportQualificationAssignments(), parseQualificationAssignmentCSV(), parseQualificationPosition(), PreviewQualificationAssignments(), qualificationSlot(), TestParseQualificationAssignmentCSV(), TestParseQualificationAssignmentCSVRejectsDuplicatePlayerAndSlot() (+8 more)

### Community 39 - "judgeCorrections.ts"
Cohesion: 0.17
Nodes (24): Arrow, assertEliminationReadback(), assertQualificationReadback(), correctConfirmedEliminationEnd(), correctConfirmedQualificationEnd(), editorDeleteButton(), EliminationCorrection, EliminationDetail (+16 more)

### Community 40 - "AutoPlayerSetIntegrationTestSuite"
Cohesion: 0.09
Nodes (6): CreatePlayerSet(), CreatePlayerSetMatchTable(), GetPlayerSetIsExist(), EliminationBracketIntegrationTestSuite, PlayerSetMatchTable, AutoPlayerSetIntegrationTestSuite

### Community 41 - "github.com/gin-gonic/gin.Engine"
Cohesion: 0.18
Nodes (13): assertRoundScore(), authenticatedScoreRequest(), intString(), newScoreTestRouter(), uintString(), bulkTestLogin(), bulkTestRequest(), TestBulkRegisterIntegration() (+5 more)

### Community 42 - "setupMatchEndWithScores"
Cohesion: 0.12
Nodes (17): CreateMatch(), CreateStage(), GetEliminationWStagesMatchesById(), Stage, Match, UpdateEliminationProgress(), CreateMatchEnd(), CreateMatchResult() (+9 more)

### Community 43 - "PlayerTestSuite"
Cohesion: 0.10
Nodes (7): GetPlayerRoundTotalScoreByRoundId(), GetPlayerScoreByRoundScoreId(), GetPlayerTotalScoreByPlayerId(), GetRoundIdByRoundScoreId(), GetRoundScoreIsExist(), UpdatePlayerScore(), PlayerTestSuite

### Community 44 - "ErrorIdTest"
Cohesion: 0.08
Nodes (47): GetCompetitionIsExist(), GetCompetitionWGroupsPlayers(), UpdateGroupInfoIndex(), CompetitionParticipants(), DeleteParticipant(), GetParticipant(), GetParticipantByCompetitionId(), GetParticipantByCompetitionIdUserId() (+39 more)

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
Cohesion: 0.14
Nodes (23): GetLaneIsExist(), GetPlayerIsExist(), GetPlayerWScores(), GetRoundIsExist(), UpdatePlayerOrder(), UpdatePlayerRoundTotalScore(), UpdatePlayerTotalScore(), authorizePlayerControl() (+15 more)

### Community 50 - "verification.ts"
Cohesion: 0.17
Nodes (18): assertCompletedIndividualBracket(), assertIndividualProgressIsolation(), assertStage(), finalPairs, IndividualEliminationDetail, IndividualEventSnapshot, IndividualSeedIdentities, individualSeedOrder (+10 more)

### Community 51 - "parseBulkRegisterCSV"
Cohesion: 0.17
Nodes (16): bindBulkRequest(), bulkMatchesPrior(), BulkRegister(), hasColumn(), parseBulkRegisterCSV(), PreviewBulkRegister(), TestParseBulkRegisterCSV(), TestParseBulkRegisterCSVLimit() (+8 more)

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
Cohesion: 0.14
Nodes (19): DatabaseMatchScore, DatabaseParticipant, EndpointPutMatchEndsIsConfirmedByIdMatchEndIsConfirmedData, EndpointPutMatchEndsScoresByIdMatchEndScoresData, prepareIndividualAutoCreate(), buildEliminationFixture(), buildMatchScores(), buildPlayers() (+11 more)

### Community 58 - "database/sql.DB"
Cohesion: 0.15
Nodes (20): assertMigrationVersion(), assertNoStartupRows(), currentSQLDB(), showCreates(), sqlTableExists(), TestNonProductionInitializersRejectNonCurrentMigrationStateWithoutSchemaRepair(), envOrDefault(), LoadTestDatabaseConfig() (+12 more)

### Community 59 - "MatchOutcome"
Cohesion: 0.26
Nodes (13): comparableEndScores(), MatchEnd, matchScoreValue(), completeOutcomeEnd(), computeCompoundMatchOutcome(), computeRecurveMatchOutcome(), MatchOutcome, MatchEnd (+5 more)

### Community 60 - "DatabaseMatchOutcomeStatus"
Cohesion: 0.16
Nodes (11): ContentType, FormData, Json, Text, UrlEncoded, DatabaseMatchOutcomeStatus, MatchOutcomeIncomplete, MatchOutcomeLockedConflict (+3 more)

### Community 61 - "ReorderPlayerSets"
Cohesion: 0.27
Nodes (12): GetGroupRankingPlayers(), getGroupRankingPlayers(), GroupRankingPlayer, samePlayerIDOrder(), samePlayerIDs(), UpdateGroupPlayerRanking(), AutoRankPlayerSets(), GetPlayerSetRankings() (+4 more)

### Community 62 - "AddApiRouter"
Cohesion: 0.13
Nodes (25): UpdateParticipantRole(), UpdateUserRole(), EnsureRoleInGameRoleSet(), EnsureRoleInSystemRoleSet(), RBACMiddleware(), TestEnsureRoleInGameRoleSet(), TestEnsureRoleInSystemRoleSet(), TestRBACMiddleware() (+17 more)

### Community 63 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, dev, lint, start, test:browser, test:browser:firefox, test:browser:webkit (+6 more)

### Community 64 - "Qualification"
Cohesion: 0.23
Nodes (13): GetQualificationIsExist(), GetQualificationWLanesByID(), GetQualificationWLanesPlayersByID(), GetQualificationWUnassignedLanesByID(), Qualification, UpdateQualification(), GetQualificationWLanesByID(), GetQualificationWLanesPlayersByID() (+5 more)

### Community 65 - "applyMatchPlacement"
Cohesion: 0.18
Nodes (10): TestPlacementPairValidation(), applyMatchPlacement(), loadPlacementMatchResults(), normalizeTarget(), sameOptionalString(), validatePlacementPair(), MatchPlacementRequest, MatchResultPlacement (+2 more)

### Community 66 - "qualificationRankingDialog.spec.ts"
Cohesion: 0.21
Nodes (9): clone(), dragHandle(), initialRankings, moveFirstPlayerDownWithKeyboard(), orderNames(), RankingPlayer, RankingResponse, RankingRouteHandles (+1 more)

### Community 68 - "ComputeMatchPoints"
Cohesion: 0.36
Nodes (11): ComputeMatchPoints(), assertEndPoints(), assertIncompleteEnd(), MatchEnd, matchEnd(), TestComputeMatchPointsAwardsWinsAndTiesByEndIndex(), TestComputeMatchPointsCountsXAsTen(), TestComputeMatchPointsIgnoresConfirmation() (+3 more)

### Community 69 - "MatchResult"
Cohesion: 0.24
Nodes (11): getComputedMatchResultByID(), GetMatchResultWScoresById(), MatchResult, MatchEnd, PlayerSet, UpdateMatchResultById(), bracketSlotHasStarted(), bracketSlotIsBlank() (+3 more)

### Community 70 - "github.com/gin-gonic/gin.Context"
Cohesion: 0.08
Nodes (37): DeleteCompetition(), DeleteElimination(), DeleteLaneByCompetitionId(), DeletePlayer(), GetAlbums(), DeleteCompetition(), GetAllCompetition(), GetCompetitionWGroupsByID() (+29 more)

### Community 71 - "EliminationBracket.go"
Cohesion: 0.26
Nodes (16): advanceSourceMatch(), autoAdvanceByes(), explicitWinnerAndLoser(), finalizeBracket(), finalStageMatch(), manualFinalMatchHasAwardedMedals(), overwriteBracketSlot(), overwriteBracketSlots() (+8 more)

### Community 72 - "qualificationScoreSummary.spec.ts"
Cohesion: 0.27
Nodes (7): buildDetailedPlayer(), clone(), QualificationRoutes, refreshTotals(), registerQualificationRoutes(), ScoreRequest, scoreValue()

### Community 73 - "Production deployment and HTTPS guide"
Cohesion: 0.07
Nodes (31): Isolated E2E Compose stack, Loopback-only E2E proxy, Runner-owned backend configuration, Disposable tmpfs MySQL, Build-time public API path, Production persistent MySQL, Production Compose stack, TLS-enabled reverse proxy (+23 more)

### Community 74 - "@elimination/page.tsx"
Cohesion: 0.09
Nodes (30): EliminationScoringBoard(), POSSIBLE_SCORES, Props, frontend_src_app_competition_id_scoring_elimination_eliminationscoringslice_addscore, frontend_src_app_competition_id_scoring_elimination_eliminationscoringslice_deletescore, eliminationScoringSlice, EliminationScoringState, expectedArrows() (+22 more)

### Community 75 - "eliminationScoring.spec.ts"
Cohesion: 0.29
Nodes (6): ALL_SCORE_LABELS, selectorGroup(), sideButton(), sideScoreLabels(), sideTotal(), waitReady()

### Community 76 - "Load"
Cohesion: 0.25
Nodes (11): Load(), clearConfigEnvironment(), TestLoadDoesNotDiscoverDotenv(), TestLoadExplicitFileUsesProcessEnvironmentPrecedence(), TestLoadParsesQuotedSpecialCharactersLiterally(), TestLoadRejectsExplicitMissingEnvFile(), TestLoadRejectsInvalidPort(), getIpByMode() (+3 more)

### Community 77 - "browser/fixtures.ts"
Cohesion: 0.20
Nodes (4): mockDictator(), mockUser(), frontend_tests_browser_fixtures_expect, test

### Community 78 - "scopeNavigation.ts"
Cohesion: 0.26
Nodes (11): assertDivergedEliminationScopes(), assertJudgeEventAvailability(), assertOfficialProgress(), assertQualificationRankingDialogScopes(), assertQualificationScheduleScopes(), DivergedEliminationScope, escaped(), eventName() (+3 more)

### Community 79 - "getGroupPlayerIdRankOrderById"
Cohesion: 0.50
Nodes (4): GetGroupPlayerIdRankOrderById(), getGroupPlayerIdRankOrderById(), RefreshCompetitionRanks(), GroupPlayer

### Community 81 - "eliminationBracket.spec.ts"
Cohesion: 0.32
Nodes (4): cloneScoreboardMatch(), completeScoreboardStages(), populateScoreboardMatch(), EliminationVariant

### Community 82 - "compilerOptions"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 83 - "syncFirstRoundRoster"
Cohesion: 0.27
Nodes (11): TestBracketSizesAndStageShapes(), TestExpectedFirstRoundSlotsHasOneByePerMissingEntrant(), TestExpectedFirstRoundSlotsPreservesRankGaps(), bitReversedSeedOrder(), bracketStageMatchShapeIsComplete(), ensureManualBracketMutationAllowed(), expectedFirstRoundSlots(), nextPowerOfTwo() (+3 more)

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

### Community 92 - "IsGetMedalById"
Cohesion: 0.50
Nodes (5): GetMedalById(), GetMedalIsExist(), Medal, GetMedalById(), IsGetMedalById()

### Community 94 - "Match"
Cohesion: 0.33
Nodes (7): Match, MatchOutcomeStatus, MatchResult, existingWinnerMatchesOutcome(), loadMatchForAutomaticOutcome(), outcomeWouldChangeWinner(), bracketMatch

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
- **507 isolated node(s):** `backend`, `BracketInitRequest`, `StagePlacementRequest`, `PlacementResponse`, `groupIdsForReorder` (+502 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 789 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@playwright/test` connect `competitionLifecycle.spec.ts` to `qualificationRankingDialog.spec.ts`, `homeRedesign.spec.ts`, `judgeCorrections.ts`, `qualificationScoreSummary.spec.ts`, `eliminationScoring.spec.ts`, `browser/fixtures.ts`, `hybridExecution.spec.ts`, `elimination.ts`, `scopeNavigation.ts`, `verification.ts`, `recordingBoard.spec.ts`, `eliminationPlayerSetRanking.spec.ts`, `teamLifecycle.ts`, `formalApi.ts`, `eliminationFixtures.ts`, `package.json`, `resultSnapshot.ts`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `@mui/material` connect `@mui/material` to `JudgeEliminationBoard.tsx`, `scoring/@qualification/page.tsx`, `Api.ts`, `LaneBoard.tsx`, `@elimination/[teamSize]/page.tsx`, `QualificationScoreEditor.tsx`, `Competition.ts`, `@elimination/page.tsx`, `react-query`, `CompetitionPostFields.tsx`, `PhaseMenu.tsx`, `store.ts`, `package.json`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `vitest` connect `@elimination/[teamSize]/page.tsx` to `test-env.mjs`, `react-query`, `hybridExecution.spec.ts`, `competitionLifecycle.spec.ts`, `resultSnapshot.ts`, `package.json`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 104 inferred relationships involving `Convert2uint()` (e.g. with `DeleteCompetition()` and `GetCompetitionsOfUser()`) actually correct?**
  _`Convert2uint()` has 104 INFERRED edges - model-reasoned connections that need verification._
- **What connects `backend`, `BracketInitRequest`, `StagePlacementRequest` to the rest of the system?**
  _507 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `competition.go` be split into smaller, more focused modules?**
  _Cohesion score 0.07481038841645599 - nodes in this community are weakly interconnected._
- **Should `scoring/@qualification/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05225576111652061 - nodes in this community are weakly interconnected._