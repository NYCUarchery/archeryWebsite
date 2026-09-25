# Graph Report - archeryWebsite  (2026-09-25)

## Corpus Check
- 358 files · ~273,237 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 29 file(s) not represented in the graph (top: .scss 13, (none) 9, .example 2)

## Summary
- 2769 nodes · 8598 edges · 140 communities (115 shown, 25 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 462 edges (avg confidence: 0.85)
- Token cost: unknown input / unknown output for host semantic agents (tool exposes no usage); AST extraction uses 0 LLM tokens. Zero extraction counters are placeholders, not measured usage.

## Community Hubs (Navigation)
- Competition Data Access
- Public Pages Navigation
- API Domain Types
- Test Environment Orchestration
- Competition Scenario Seeding
- API Query Hooks
- Backend Test Fixtures
- Elimination Bracket Display
- Judge Score Editors
- Qualification Lane Scoring
- Competition Administration Permissions
- Elimination Administration Endpoints
- Session Resource Access
- Bracket Integration Helpers
- Hybrid Lifecycle Actors
- Bracket Progression Regression Tests
- Competition Lifecycle Tests
- Player Control Fixtures
- Automatic Match Outcomes
- Scoreboard Browser Tests
- Team Competition Lifecycle
- Schedule Progress State
- Lifecycle Formal API
- Database Migration Runner
- Database Test Initialization
- Lifecycle Result Snapshots
- Competition Role Navigation
- Frontend TypeScript Configuration
- Resource Validation Responses
- Frontend Package Metadata
- Elimination Progress Access
- Player Control Authorization
- Qualification Resource Creation
- Frontend Runtime Dependencies
- Qualification Progress Controls
- Elimination Bracket Construction
- Elimination Target Placement
- User Startup Initialization
- Bracket Winner Projection
- Judge Correction Scenarios
- Player Set Creation
- HTTP Application Routing
- Match End Persistence
- Player Score Totals
- Transactional Match State
- Production Baseline Schema
- Legacy Schema Snapshot
- Elimination Judge Automation
- Qualification Ranking Persistence
- Match Score Write Locks
- Bracket Completion Verification
- Application Database Configuration
- Player Set Ranking Tests
- Python API Requester
- Frontend Development Dependencies
- Redux Scoring Stores
- Competition Creation Form
- Elimination Browser Fixtures
- Migration Integration Tests
- Qualification Score Statistics
- Scoring Authorization Policy
- Player Set Ranking
- API Route Registration
- Frontend Package Scripts
- Participant Resource Control
- Role Based Access
- Qualification Ranking Tests
- Event Scope Navigation
- Match Points Calculation
- Medal Result Access
- Atomic Match Placement
- API Outcome Enumerations
- Qualification Summary Tests
- Production Deployment Contract
- Elimination Score State
- Elimination Scoring Tests
- Isolated E2E Environment
- Browser Test Infrastructure
- Competition Phase Routing
- Frontend Root Providers
- Generated HTTP Client
- Bracket Display Tests
- Node TypeScript Configuration
- Interactive Mockup Scripts
- OpenAPI Domain Contract
- Qualification Lane Assignment
- Scoring Domain Contract
- Material Theme Types
- Elimination Fixture Controls
- Test Database Guard
- Development Compose Stack
- Archery Brand Symbol
- Desktop Login Mockup
- Mockup Brand Symbol
- Mobile Competition Homepage
- Mobile Login Mockup
- Homepage Proposal Documents
- Container Build Validation
- Continuous Integration Gates
- Newcomer Qualification Results
- Database Array Serialization
- Kubernetes Proxy Service
- Desktop Competition List
- Mobile Competition List
- Narrow Competition List
- Desktop Homepage Mockup
- Mobile Homepage Mockup
- Narrow Homepage Mockup
- Homepage HTML Preview
- Desktop Joined Competitions
- Joined Competitions Preview
- Mobile Joined Competitions
- Narrow Joined Competitions
- Compact Competition Homepage
- Tall Desktop Homepage
- Versioned Migration Contract
- Qualification Lane Number
- Kubernetes MySQL Storage
- Joined Competitions Empty State
- Competition List Preview
- Backend Test Script
- Next Build Configuration
- Next Environment Types
- Legacy User Type
- Kubernetes Backend Service
- Kubernetes Profile Frontend
- Kubernetes Scoring Frontend
- Match Player Tables
- Project Environment Overview
- Development Test Scenarios
- Repository Test Script
- Elimination Table Reference
- Kubernetes Proxy Deployment
- Blank Desktop Screenshot
- Backend Go Module

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
- `Isolated E2E Compose stack` --semantically_similar_to--> `E2E runner lifecycle`  [INFERRED] [semantically similar]
  docker-compose-e2e.yml → docs/testing.md
- `Production Compose stack` --semantically_similar_to--> `Production deployment and HTTPS guide`  [INFERRED] [semantically similar]
  docker-compose.yml → docs/deployment.md
- `TestDatabaseInitialCollisionHelper()` --calls--> `DatabaseInitial()`  [INFERRED]
  backend/internal/database/dictator_startup_integration_test.go → backend/internal/database/DB.go
- `TestInitializersRejectNonCurrentMigrationStateWithoutSchemaRepair()` --calls--> `DatabaseInitial()`  [INFERRED]
  backend/internal/database/startup_migration_integration_test.go → backend/internal/database/DB.go
- `TestDatabaseInitialPreservesExistingCompetition()` --calls--> `DatabaseInitial()`  [INFERRED]
  backend/internal/database/startup_persistence_integration_test.go → backend/internal/database/DB.go

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Server-authoritative scoring lifecycle** — docs_scoring_qualification_authorization, docs_scoring_elimination_authorization, docs_scoring_outcome_resolution, docs_scoring_bracket_progression [EXTRACTED 1.00]
- **Runner-controlled isolated E2E execution** — docker_compose_e2e_tmpfs_mysql, docker_compose_e2e_runner_owned_backend, docker_compose_e2e_loopback_proxy, docs_testing_e2e_runner_lifecycle [INFERRED 0.85]

## Communities (140 total, 25 thin omitted)

### Community 0 - "Competition Data Access"
Cohesion: 0.07
Nodes (98): main(), usage(), DropCompetition(), DropTables(), DropElimination(), DropGroupInfo(), AddInstitution(), AllInstitutionInfo() (+90 more)

### Community 1 - "Public Pages Navigation"
Cohesion: 0.04
Nodes (47): Props, Layout(), LinkTabProps, Layout(), LinkTabProps, Layout(), LinkTabProps, Layout() (+39 more)

### Community 2 - "API Domain Types"
Cohesion: 0.03
Nodes (86): EliminationProgressControl(), Props, stageLabel(), standardStageDenominators(), Props, RankingInfoBar(), ApiConfig, DatabaseElimination (+78 more)

### Community 3 - "Test Environment Orchestration"
Cohesion: 0.06
Nodes (55): ref_node_assert, ref_node_child_process, ref_node_crypto, ref_node_fs, ref_node_os, ref_node_path, ref_node_test, ref_node_url (+47 more)

### Community 4 - "Competition Scenario Seeding"
Cohesion: 0.05
Nodes (67): requestedScenarios(), GetAllCompetition(), GetCompetitionsOfUser(), GetCompetitionWGroups(), GetCompetitionWGroupsPlayersScores(), GetCompetitionWParticipants(), GetCurrentCompetitions(), Competition (+59 more)

### Community 5 - "API Query Hooks"
Cohesion: 0.08
Nodes (31): DeleteGroupButton(), columns, GroupGrid(), Props, bowTypes, GroupCreator(), postGroup(), Props (+23 more)

### Community 6 - "Backend Test Fixtures"
Cohesion: 0.04
Nodes (62): TestValidateSeederForbidsProductionButDoesNotRequireSession(), TestValidateServerProductionSessionKeyLength(), TestValidateServerRequiredFieldsAndEnvironment(), validApp(), integrationApp(), TestDatabaseInitialCollisionHelper(), TestMatchResultOmitsUnknownPlayerSetID(), TestDatabaseInitialPreservesExistingCompetition() (+54 more)

### Community 7 - "Elimination Bracket Display"
Cohesion: 0.07
Nodes (48): DetailTeamHeader(), laneLabel(), MobileStages(), MobileTeamRow(), Page(), playerSetFor(), stageLabel(), teamMembers() (+40 more)

### Community 8 - "Judge Score Editors"
Cohesion: 0.06
Nodes (39): activeTeamSizes(), cloneEnd(), endStatus(), EVENT_NAMES, JudgeEliminationBoard(), POSSIBLE_SCORES, ScoreEditor, scoreTotal() (+31 more)

### Community 9 - "Qualification Lane Scoring"
Cohesion: 0.09
Nodes (28): LaneBlock(), Props, Page(), LaneBoard(), Props, NameBar(), Props, PlayerInfo() (+20 more)

### Community 10 - "Competition Administration Permissions"
Cohesion: 0.09
Nodes (46): GetCompetitionGroupIds(), GetCompetitionUnassignedGroupId(), GetCompetitionUnassignedLaneId(), UpdateCompetitionCurrentPhase(), UpdateCompetitionCurrentPhaseMinus(), UpdateCompetitionCurrentPhasePlus(), UpdateCompetitionEliminationActive(), UpdateCompetitionMixedEliminationActive() (+38 more)

### Community 11 - "Elimination Administration Endpoints"
Cohesion: 0.11
Nodes (45): GetEliminationWStagesMatchesById(), GetOnlyEliminationById(), GetStageById(), GetStageIsExist(), Elimination, PlayerSet, GetMatchResultIsExist(), UpdatePlayerSetName() (+37 more)

### Community 12 - "Session Resource Access"
Cohesion: 0.08
Nodes (44): DeleteCompetition(), DeleteElimination(), DeleteLaneByCompetitionId(), DeleteParticipant(), GetParticipantIsExist(), DeletePlayer(), GetAlbums(), DeleteCompetition() (+36 more)

### Community 13 - "Bracket Integration Helpers"
Cohesion: 0.08
Nodes (10): AutoPlayerSetIntegrationTestSuite, BracketAdvanceResponse, BracketFirstRoundSyncResponse, BracketInitResponse, MatchWinnerResponse, PlayerSetRankingIntegrationTestSuite, PlayerSetRankingResponse, UpdatePlayerSetRankingRequest (+2 more)

### Community 14 - "Hybrid Lifecycle Actors"
Cohesion: 0.08
Nodes (40): assertHybridApiWriteAllowed(), eliminationWriteActor(), eventMatchCounts(), eventWaves(), HybridEliminationSample, hybridEliminationSamples, hybridEliminationWritePlan, HybridGroup (+32 more)

### Community 15 - "Bracket Progression Regression Tests"
Cohesion: 0.06
Nodes (3): UpdateMatchResultIsWinnerById(), GetMedalInfoByEliminationId(), EliminationBracketIntegrationTestSuite

### Community 16 - "Competition Lifecycle Tests"
Cohesion: 0.09
Nodes (31): admin, applyToCompetition(), approveAllApplicants(), archers, createCompetition(), createGroup(), judge, password (+23 more)

### Community 17 - "Player Control Fixtures"
Cohesion: 0.14
Nodes (16): PostCompetition(), UpdateCompetitionUnassignedGroupId(), UpdateCompetitionUnassignedLaneId(), CreateElimination(), CreateGroupInfo(), GetGroupInfoById(), PostLane(), CreateMedal() (+8 more)

### Community 18 - "Automatic Match Outcomes"
Cohesion: 0.11
Nodes (41): comparableEndScores(), Match, MatchEnd, MatchOutcomeStatus, MatchResult, matchScoreValue(), completeOutcomeEnd(), computeCompoundMatchOutcome() (+33 more)

### Community 19 - "Scoreboard Browser Tests"
Cohesion: 0.09
Nodes (31): User, environmentCommand(), exec, frontend_tests_e2e_fixtures_expect, Fixtures, test, applyToLegacyCompetition(), Competition (+23 more)

### Community 20 - "Team Competition Lifecycle"
Cohesion: 0.11
Nodes (39): selectGroup(), signedInPage(), assertPlayerReadsConfirmedCurrentMatch(), advanceStage(), chooseJudgeTeam(), activateTeamPhase(), assertJudgeScopeSwitching(), assertTeamDetail() (+31 more)

### Community 21 - "Schedule Progress State"
Cohesion: 0.09
Nodes (31): GroupMenu(), Props, frontend_src_app_competition_id_admin_progress_progressslice_setgroupindex, GroupMenu(), Props, Page(), frontend_src_app_competition_id_admin_schedule_qualification_qualificationscheduleslice_setadvancingnum, frontend_src_app_competition_id_admin_schedule_qualification_qualificationscheduleslice_setendlane (+23 more)

### Community 22 - "Lifecycle Formal API"
Cohesion: 0.10
Nodes (35): ApiRequestOptions, arithmeticQualificationTotals(), assertApprovedScopedActor(), Competition, Elimination, EliminationLookup, Group, groupAndActorPlayer() (+27 more)

### Community 23 - "Database Migration Runner"
Cohesion: 0.11
Nodes (34): main(), usage(), Baseline(), hasUserTables(), MigrationFS(), newMigrator(), normalizeCreate(), ReadVersion() (+26 more)

### Community 24 - "Database Test Initialization"
Cohesion: 0.07
Nodes (14): TestResetTestDatabaseCreatesPlayerSchema(), loadLegacyFixture(), resetSchema(), ResetTestDatabase(), TestResetRejectsUnknownFixtureBeforeConnecting(), PlayerTestSuite, EnableCookieSessionMiddleware(), sessionOptions() (+6 more)

### Community 25 - "Lifecycle Result Snapshots"
Cohesion: 0.12
Nodes (31): assertEquivalentLifecycleSnapshots(), bracket(), count(), integer(), LifecycleSnapshot, name(), normalizeLifecycleSnapshot(), qualification() (+23 more)

### Community 26 - "Competition Role Navigation"
Cohesion: 0.11
Nodes (28): JudgeLayout(), Layout(), Page(), frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_addscore, frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_confirm, frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_deletescore, frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_initends, frontend_src_app_competition_id_scoring_qualification_qualificationscoringslice_setselectedorder (+20 more)

### Community 27 - "Frontend TypeScript Configuration"
Cohesion: 0.06
Nodes (35): compilerOptions, allowImportingTsExtensions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx (+27 more)

### Community 28 - "Resource Validation Responses"
Cohesion: 0.11
Nodes (34): GetCompetitionIsExist(), GetCompetitionWGroupsPlayers(), GetOnlyCompetition(), GetGroupIsExist(), UpdateGroupInfoIndex(), GetParticipantByCompetitionIdUserId(), CheckEmailExistExclude(), FindByUserID() (+26 more)

### Community 29 - "Frontend Package Metadata"
Cohesion: 0.06
Nodes (33): name, private, type, version, axios, bootstrap, @emotion/react, @emotion/styled (+25 more)

### Community 30 - "Elimination Progress Access"
Cohesion: 0.08
Nodes (32): computeEliminationMatchPoints(), GetEliminationById(), GetEliminationWPlayerSetsById(), GetEliminationWScoresById(), GetMatchIsExist(), GetMatchWScoresById(), UpdateEliminationCurrentEndMinus(), UpdateEliminationCurrentEndPlus() (+24 more)

### Community 31 - "Player Control Authorization"
Cohesion: 0.12
Nodes (33): GetLaneIsExist(), GetPlayerIsExist(), GetPlayerWScores(), GetRoundEndIsExist(), GetRoundIsExist(), UpdatePlayerOrder(), UpdatePlayerRoundTotalScore(), UpdatePlayerTotalScore() (+25 more)

### Community 32 - "Qualification Resource Creation"
Cohesion: 0.10
Nodes (31): AddOneCompetitionGroupNum(), GetCompetitionGroupNum(), MinusOneCompetitionGroupNum(), UpdateCompetitionGroupNum(), GetUnassignedLaneId(), AddParticipant(), GetQualificationIsExist(), GetQualificationWLanesByID() (+23 more)

### Community 33 - "Frontend Runtime Dependencies"
Cohesion: 0.06
Nodes (31): dependencies, axios, bootstrap, d3, dayjs, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (+23 more)

### Community 34 - "Qualification Progress Controls"
Cohesion: 0.11
Nodes (22): EndPanel(), Props, Page(), Props, RankingDialog(), RankingPlayer, Page(), Page() (+14 more)

### Community 35 - "Elimination Bracket Construction"
Cohesion: 0.16
Nodes (26): TestBitReversedSeedOrderPairsOddLeftAndEvenRight(), TestBracketSizesAndStageShapes(), TestExpectedFirstRoundSlotsHasOneByePerMissingEntrant(), TestExpectedFirstRoundSlotsPreservesRankGaps(), bitReversedSeedOrder(), bracketShapeIsCompatible(), bracketSlotHasStarted(), bracketSlotIsBlank() (+18 more)

### Community 36 - "Elimination Target Placement"
Cohesion: 0.15
Nodes (20): getOutcomeStatus(), MatchOutcomeStatus, Page(), PlayerSetOption, MatchHeader(), Props, LaneNumber(), LaneNumberProps (+12 more)

### Community 37 - "User Startup Initialization"
Cohesion: 0.13
Nodes (27): Dictator, connectDB(), DatabaseInitial(), DatabaseInitialForSeeder(), ensureDictatorForSeeder(), requireCurrentSchema(), setDictator(), TestDatabaseInitialPreservesExistingDictator() (+19 more)

### Community 38 - "Bracket Winner Projection"
Cohesion: 0.14
Nodes (25): getComputedMatchResultByID(), GetMatchResultById(), GetMatchResultWScoresById(), MatchResult, MatchEnd, PlayerSet, UpdateMatchResultById(), advanceSourceMatch() (+17 more)

### Community 39 - "Judge Correction Scenarios"
Cohesion: 0.17
Nodes (24): Arrow, assertEliminationReadback(), assertQualificationReadback(), correctConfirmedEliminationEnd(), correctConfirmedQualificationEnd(), editorDeleteButton(), EliminationCorrection, EliminationDetail (+16 more)

### Community 40 - "Player Set Creation"
Cohesion: 0.10
Nodes (10): CreatePlayerSet(), CreatePlayerSetMatchTable(), GetPlayerSetIsExist(), GetPlayerSetsByEliminationId(), GetPlayerWPlayerSetsByIDCompeitionID(), PlayerSet, Player, EliminationBracketIntegrationTestSuite (+2 more)

### Community 41 - "HTTP Application Routing"
Cohesion: 0.10
Nodes (17): assertRoundScore(), authenticatedScoreRequest(), intString(), newScoreTestRouter(), uintString(), SetUpRouter(), SwagSetUp(), SetUpRouter() (+9 more)

### Community 42 - "Match End Persistence"
Cohesion: 0.13
Nodes (15): CreateMatch(), CreateStage(), Stage, Match, UpdateEliminationProgress(), CreateMatchEnd(), CreateMatchResult(), CreateMatchScore() (+7 more)

### Community 43 - "Player Score Totals"
Cohesion: 0.10
Nodes (7): GetPlayerRoundTotalScoreByRoundId(), GetPlayerScoreByRoundScoreId(), GetPlayerTotalScoreByPlayerId(), GetRoundIdByRoundScoreId(), GetRoundScoreIsExist(), UpdatePlayerScore(), PlayerTestSuite

### Community 44 - "Transactional Match State"
Cohesion: 0.15
Nodes (21): lockedCompetitionUnassignedLane(), lockedControlGroup(), lockedControlLane(), bracketWinnerMutationIsLocked(), manualFinalMatchHasAwardedMedals(), overwriteMedalPlayerSet(), reprojectManualFinalMatchMedals(), setMedalPlayerSet() (+13 more)

### Community 45 - "Production Baseline Schema"
Cohesion: 0.18
Nodes (20): `competitions`, `eliminations`, `groups`, `institutions`, `lanes`, `match_ends`, `match_results`, `match_scores` (+12 more)

### Community 46 - "Legacy Schema Snapshot"
Cohesion: 0.18
Nodes (20): `competitions`, `eliminations`, `groups`, `institutions`, `lanes`, `match_ends`, `match_results`, `match_scores` (+12 more)

### Community 47 - "Elimination Judge Automation"
Cohesion: 0.17
Nodes (19): Bow, chooseJudgeEvent(), chooseJudgeIndividual(), chooseJudgeOption(), confirmSide(), eliminationId(), JudgeMatchScope, Score (+11 more)

### Community 48 - "Qualification Ranking Persistence"
Cohesion: 0.12
Nodes (13): GetGroupPlayerIdRankOrderById(), getGroupPlayerIdRankOrderById(), RefreshCompetitionRanks(), CreateRound(), CreateRoundEnd(), CreateRoundScore(), Round, RoundEnd (+5 more)

### Community 49 - "Match Score Write Locks"
Cohesion: 0.20
Nodes (19): GetMatchEndIsExist(), GetMatchScoreIsExist(), GetMatchScoreWMEndIdIsExist(), applyAutomaticOutcomeForMatchResult(), matchIDForMatchResult(), lockEliminationForScoring(), matchForMatchEnd(), matchForMatchScore() (+11 more)

### Community 50 - "Bracket Completion Verification"
Cohesion: 0.17
Nodes (18): assertCompletedIndividualBracket(), assertIndividualProgressIsolation(), assertStage(), finalPairs, IndividualEliminationDetail, IndividualEventSnapshot, IndividualSeedIdentities, individualSeedOrder (+10 more)

### Community 51 - "Application Database Configuration"
Cohesion: 0.16
Nodes (15): buildDSN(), openDB(), TestBuildDSNEscapesSpecialPasswordAndKeepsTransportSettings(), TestValidateDatabaseNeedsOnlyDatabaseSettings(), validateDatabase(), main(), App, Database (+7 more)

### Community 52 - "Player Set Ranking Tests"
Cohesion: 0.16
Nodes (15): AUTO_ROWS, clone(), dragHandle(), INITIAL_ROWS, moveRowDownWithKeyboard(), RankingRouteHandles, RankingRow, rankingTable() (+7 more)

### Community 53 - "Python API Requester"
Cohesion: 0.21
Nodes (5): the csv file be like real_name, password, target, read_user_csv(), Requester, csv, requests

### Community 54 - "Frontend Development Dependencies"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, @playwright/test, @types/d3, @types/node, @types/react (+9 more)

### Community 55 - "Redux Scoring Stores"
Cohesion: 0.15
Nodes (12): initialState, progressSlice, initialState, qualificationScheduleSlice, initialState, scheduleSlice, initialState, qualificationScoringSlice (+4 more)

### Community 56 - "Competition Creation Form"
Cohesion: 0.17
Nodes (13): CompetitionPostFields(), dayjsToISO(), endTime, Props, startTime, CreateButton(), postBody, PostCompetitionBody (+5 more)

### Community 57 - "Elimination Browser Fixtures"
Cohesion: 0.16
Nodes (16): DatabaseMatchScore, EndpointPutMatchEndsIsConfirmedByIdMatchEndIsConfirmedData, EndpointPutMatchEndsScoresByIdMatchEndScoresData, prepareIndividualAutoCreate(), buildEliminationFixture(), buildMatchScores(), buildPlayers(), findMatchEndById() (+8 more)

### Community 58 - "Migration Integration Tests"
Cohesion: 0.21
Nodes (16): assertMigrationVersion(), assertNoStartupRows(), currentSQLDB(), showCreates(), sqlTableExists(), TestInitializersRejectNonCurrentMigrationStateWithoutSchemaRepair(), assertColumnAbsent(), assertColumnPresent() (+8 more)

### Community 59 - "Qualification Score Statistics"
Cohesion: 0.23
Nodes (11): EndBar(), Props, Props, RoundBlock(), Props, ScoreDetail(), Props, StatisticRow() (+3 more)

### Community 60 - "Scoring Authorization Policy"
Cohesion: 0.19
Nodes (15): approvedScoreActor(), authorizeEliminationScore(), authorizeQualificationRescue(), authorizeQualificationScore(), eliminationScoreTargetForMatch(), playerParticipatesInMatch(), qualificationCompetitionForPlayer(), qualificationEndIndex() (+7 more)

### Community 61 - "Player Set Ranking"
Cohesion: 0.22
Nodes (13): GetGroupRankingPlayers(), getGroupRankingPlayers(), GroupRankingPlayer, samePlayerIDOrder(), samePlayerIDs(), UpdateGroupPlayerRanking(), AutoRankPlayerSets(), GetPlayerSetRankings() (+5 more)

### Community 62 - "API Route Registration"
Cohesion: 0.25
Nodes (14): AddApiRouter(), competitionRouter(), eliminationRouter(), groupInfoRouter(), laneRouter(), matchResultRouter(), medalRouter(), playerRouter() (+6 more)

### Community 63 - "Frontend Package Scripts"
Cohesion: 0.14
Nodes (14): scripts, build, dev, lint, start, test:browser, test:browser:firefox, test:browser:webkit (+6 more)

### Community 64 - "Participant Resource Control"
Cohesion: 0.20
Nodes (12): CompetitionParticipants(), GetParticipant(), GetParticipantByCompetitionId(), GetParticipantByUserId(), Participant, UpdateParticipant(), lockedPlayerControlTarget(), GetParticipantById() (+4 more)

### Community 65 - "Role Based Access"
Cohesion: 0.21
Nodes (12): UpdateParticipantRole(), UpdateUserRole(), EnsureRoleInGameRoleSet(), EnsureRoleInSystemRoleSet(), RBACMiddleware(), TestEnsureRoleInGameRoleSet(), TestEnsureRoleInSystemRoleSet(), TestRBACMiddleware() (+4 more)

### Community 66 - "Qualification Ranking Tests"
Cohesion: 0.21
Nodes (9): clone(), dragHandle(), initialRankings, moveFirstPlayerDownWithKeyboard(), orderNames(), RankingPlayer, RankingResponse, RankingRouteHandles (+1 more)

### Community 67 - "Event Scope Navigation"
Cohesion: 0.26
Nodes (11): assertDivergedEliminationScopes(), assertJudgeEventAvailability(), assertOfficialProgress(), assertQualificationRankingDialogScopes(), assertQualificationScheduleScopes(), DivergedEliminationScope, escaped(), eventName() (+3 more)

### Community 68 - "Match Points Calculation"
Cohesion: 0.36
Nodes (11): ComputeMatchPoints(), assertEndPoints(), assertIncompleteEnd(), MatchEnd, matchEnd(), TestComputeMatchPointsAwardsWinsAndTiesByEndIndex(), TestComputeMatchPointsCountsXAsTen(), TestComputeMatchPointsIgnoresConfirmation() (+3 more)

### Community 69 - "Medal Result Access"
Cohesion: 0.20
Nodes (11): GetEliminationIsExist(), GetMedalById(), GetMedalIsExist(), Medal, GetPlayerSetById(), GetMedalById(), GetMedalInfoByEliminationId(), IsGetMedalById() (+3 more)

### Community 70 - "Atomic Match Placement"
Cohesion: 0.20
Nodes (9): TestPlacementPairValidation(), applyMatchPlacement(), normalizeTarget(), sameOptionalString(), validatePlacementPair(), MatchPlacementRequest, MatchResultPlacement, MatchSettingsRequest (+1 more)

### Community 71 - "API Outcome Enumerations"
Cohesion: 0.16
Nodes (11): ContentType, FormData, Json, Text, UrlEncoded, DatabaseMatchOutcomeStatus, MatchOutcomeIncomplete, MatchOutcomeLockedConflict (+3 more)

### Community 72 - "Qualification Summary Tests"
Cohesion: 0.27
Nodes (7): buildDetailedPlayer(), clone(), QualificationRoutes, refreshTotals(), registerQualificationRoutes(), ScoreRequest, scoreValue()

### Community 73 - "Production Deployment Contract"
Cohesion: 0.20
Nodes (10): Build-time public API path, Production persistent MySQL, Production Compose stack, TLS-enabled reverse proxy, HTTPS and session-cookie acceptance, Manual migration deployment gate, Existing production volume preservation, Production deployment and HTTPS guide (+2 more)

### Community 74 - "Elimination Score State"
Cohesion: 0.31
Nodes (9): eliminationScoringSlice, EliminationScoringState, expectedArrows(), findSelected(), initialState, LocalMatchScore, scorefmt(), sortScoresDesc() (+1 more)

### Community 75 - "Elimination Scoring Tests"
Cohesion: 0.29
Nodes (6): ALL_SCORE_LABELS, selectorGroup(), sideButton(), sideScoreLabels(), sideTotal(), waitReady()

### Community 76 - "Isolated E2E Environment"
Cohesion: 0.22
Nodes (9): Isolated E2E Compose stack, Loopback-only E2E proxy, Runner-owned backend configuration, Disposable tmpfs MySQL, CI artifacts and failure diagnosis, E2E runner lifecycle, Hybrid and full-UI lifecycle equivalence, Integration test isolation guard (+1 more)

### Community 77 - "Browser Test Infrastructure"
Cohesion: 0.36
Nodes (4): FixtureOutcomeStatus, outcomeCases, frontend_tests_browser_fixtures_expect, test

### Community 78 - "Competition Phase Routing"
Cohesion: 0.29
Nodes (5): PhaseEnums, Elimination, MixedElimination, Qualification, TeamElimination

### Community 79 - "Frontend Root Providers"
Cohesion: 0.29
Nodes (5): queryClient, store, frontend_src_styles_app, scoringTheme, react-redux

### Community 81 - "Bracket Display Tests"
Cohesion: 0.32
Nodes (4): cloneScoreboardMatch(), completeScoreboardStages(), populateScoreboardMatch(), EliminationVariant

### Community 82 - "Node TypeScript Configuration"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 83 - "Interactive Mockup Scripts"
Cohesion: 0.25
Nodes (5): loginDialog, sampleCopy, sampleDialog, sampleExtra, sampleTitle

### Community 84 - "OpenAPI Domain Contract"
Cohesion: 0.29
Nodes (7): Competition-admin authorization boundary, Competition API domain, Elimination API domain, Session and user API domains, Archery OpenAPI contract, Participant and player API domains, Qualification and match scoring API domains

### Community 86 - "Scoring Domain Contract"
Cohesion: 0.29
Nodes (7): Explicit bracket progression and seeding, Elimination scoring authorization, Automatic elimination outcome resolution, Qualification scoring authorization, Score normalization and computed totals, Scoring domain contract, Elimination first-round synchronization

### Community 87 - "Material Theme Types"
Cohesion: 0.33
Nodes (5): ButtonPropsColorOverrides, @mui/material/Button, @mui/material/styles, Palette, PaletteOptions

### Community 89 - "Test Database Guard"
Cohesion: 0.50
Nodes (4): envOrDefault(), LoadTestDatabaseConfig(), TestLoadTestDatabaseConfigRequiresRunner(), TestDatabaseConfig

### Community 90 - "Development Compose Stack"
Cohesion: 0.40
Nodes (5): Development backend environment boundary, Development Compose stack, Frontend hot reload watch, Local Caddy reverse proxy, Development MySQL persistent volume

### Community 91 - "Archery Brand Symbol"
Cohesion: 0.40
Nodes (5): Black Radial Outer Shape, Cyan Outer Target Ring, Red Middle Target Ring, Archery Target Mark, Yellow Target Center

### Community 92 - "Desktop Login Mockup"
Cohesion: 0.40
Nodes (5): Create Account Link, Account Field, Dimmed Page Backdrop, Desktop Login Overlay, Password Field

### Community 93 - "Mockup Brand Symbol"
Cohesion: 0.40
Nodes (5): Archery Target Gear Mark, Black Gear Outline, Cyan Outer Target Ring, Red Inner Target Ring, Yellow Bullseye

### Community 94 - "Mobile Competition Homepage"
Cohesion: 0.40
Nodes (5): Announcement Panel, Scoreboard and Join Actions, Recent Competition Cards, Mobile Main Navigation, Mobile Recent Competitions Page

### Community 95 - "Mobile Login Mockup"
Cohesion: 0.40
Nodes (5): Account Field, Demo Sign In Action, Mobile Login Dialog on Recent Competitions Page, Password Field, Registration Link

### Community 96 - "Homepage Proposal Documents"
Cohesion: 0.40
Nodes (5): Home and Competition List Proposal v3, Home Preview Page, My Competitions Preview Page, Recent Competitions Preview Page, Shared Preview Styles Scripts and Logo

### Community 97 - "Container Build Validation"
Cohesion: 0.50
Nodes (4): Caddy HTTP and HTTPS validation, Compose V1 and modern compatibility, Deployment configuration validation, Container build workflow

### Community 98 - "Continuous Integration Gates"
Cohesion: 0.50
Nodes (4): Continuous integration test matrix, E2E browser and lifecycle modes, Frontend quality gates, Go unit and integration gates

### Community 99 - "Newcomer Qualification Results"
Cohesion: 0.50
Nodes (4): Archer club affiliations, Qualification lane assignments, Second 25th Fengcheng Cup newcomer qualification results, Ranked newcomer archers

### Community 101 - "Kubernetes Proxy Service"
Cohesion: 0.50
Nodes (4): HTTP Service Port 80, HTTPS Service Port 443, Reverse Proxy Kubernetes Service, Reverse Proxy Service Selector

### Community 102 - "Desktop Competition List"
Cohesion: 0.50
Nodes (4): Scoreboard and Join Actions, Stacked Competition Cards, Desktop Competition List Screen, Two Page Pagination

### Community 103 - "Mobile Competition List"
Cohesion: 0.50
Nodes (4): Mobile Competition List Screen, Side by Side Card Actions, Two Page Controls, Stacked Competition Cards

### Community 104 - "Narrow Competition List"
Cohesion: 0.50
Nodes (4): Compact Brand Header, Narrow Mobile Competition List Screen, Two Page Controls, Vertical Card Actions

### Community 105 - "Desktop Homepage Mockup"
Cohesion: 0.50
Nodes (4): Announcement Panel, Desktop Home Page Screen, Primary Navigation, Three Column Competition Cards

### Community 106 - "Mobile Homepage Mockup"
Cohesion: 0.50
Nodes (4): Announcement Panel, Mobile Home Page Screen, Stacked Competition Cards, Wrapped Primary Navigation

### Community 107 - "Narrow Homepage Mockup"
Cohesion: 0.50
Nodes (4): Announcement Panel, Compact Brand Header, Narrow Mobile Home Page Screen, Stacked Competition Cards

### Community 108 - "Homepage HTML Preview"
Cohesion: 0.50
Nodes (4): Announcement Panel, Home Page Preview, Login Dialog Preview, Recent Competition Cards

### Community 109 - "Desktop Joined Competitions"
Cohesion: 0.50
Nodes (4): Scoreboard and Apply Actions, Competition Status Filter, Joined Competition List, Desktop My Competitions Page

### Community 110 - "Joined Competitions Preview"
Cohesion: 0.50
Nodes (4): No Competitions Empty State, Joined Competition List, My Competitions Page Preview, Competition Presence Preview Switch

### Community 111 - "Mobile Joined Competitions"
Cohesion: 0.50
Nodes (4): Competition Status Filter, Joined Competition Cards with Actions, Mobile Main Navigation, Mobile My Competitions Page

### Community 112 - "Narrow Joined Competitions"
Cohesion: 0.50
Nodes (4): Compact Header and Navigation, Small Mobile My Competitions Page, Stacked Scoreboard and Apply Actions, Competition Status Filter

### Community 113 - "Compact Competition Homepage"
Cohesion: 0.50
Nodes (4): Announcement Panel, Recent Competition Cards, Mobile Main Navigation, Small Mobile Recent Competitions Page

### Community 114 - "Tall Desktop Homepage"
Cohesion: 0.50
Nodes (4): Announcement Panel, Desktop Header Navigation, Recent Competition Cards, Tall Desktop Recent Competitions Page

### Community 115 - "Versioned Migration Contract"
Cohesion: 0.67
Nodes (3): Baseline schema validation, Dirty migration state protection, Versioned SQL migration contract

### Community 117 - "Kubernetes MySQL Storage"
Cohesion: 0.67
Nodes (3): MySQL data persistent volume claim, MySQL Kubernetes deployment, MySQL Kubernetes service

### Community 118 - "Joined Competitions Empty State"
Cohesion: 0.67
Nodes (3): Browse Competitions Action, Competition Status Filter, No Joined Competitions Empty State

### Community 119 - "Competition List Preview"
Cohesion: 0.67
Nodes (3): Recent Competitions Page Preview, Two Page Competition List, Scoreboard Actions

## Knowledge Gaps
- **555 isolated node(s):** `backend`, `BracketInitRequest`, `StagePlacementRequest`, `PlacementResponse`, `groupIdsForReorder` (+550 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 824 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@playwright/test` connect `Competition Lifecycle Tests` to `Qualification Ranking Tests`, `Event Scope Navigation`, `Judge Correction Scenarios`, `Qualification Summary Tests`, `Elimination Scoring Tests`, `Browser Test Infrastructure`, `Hybrid Lifecycle Actors`, `Elimination Judge Automation`, `Bracket Completion Verification`, `Scoreboard Browser Tests`, `Player Set Ranking Tests`, `Team Competition Lifecycle`, `Elimination Browser Fixtures`, `Frontend Package Metadata`, `Lifecycle Result Snapshots`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `@mui/material` connect `Public Pages Navigation` to `API Domain Types`, `Qualification Progress Controls`, `Elimination Target Placement`, `API Query Hooks`, `Elimination Bracket Display`, `Judge Score Editors`, `Qualification Lane Scoring`, `Frontend Root Providers`, `Schedule Progress State`, `Competition Creation Form`, `Competition Role Navigation`, `Qualification Score Statistics`, `Frontend Package Metadata`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `react` connect `Public Pages Navigation` to `Qualification Progress Controls`, `Elimination Target Placement`, `API Query Hooks`, `Elimination Bracket Display`, `Judge Score Editors`, `Qualification Lane Scoring`, `Frontend Root Providers`, `Schedule Progress State`, `Competition Role Navigation`, `Frontend Package Metadata`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 102 inferred relationships involving `Convert2uint()` (e.g. with `DeleteCompetition()` and `GetCompetitionsOfUser()`) actually correct?**
  _`Convert2uint()` has 102 INFERRED edges - model-reasoned connections that need verification._
- **What connects `backend`, `BracketInitRequest`, `StagePlacementRequest` to the rest of the system?**
  _555 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Competition Data Access` be split into smaller, more focused modules?**
  _Cohesion score 0.07339449541284404 - nodes in this community are weakly interconnected._
- **Should `Public Pages Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.03616161616161616 - nodes in this community are weakly interconnected._
## Graph Integrity

[graphify] MultiDiGraph edge-collapse diagnostic
input: <in-memory>
input_stage: provided JSON (normal graph.json is post-build)
effective_directed: <direct-call>
nodes: 2689
unverified_code_nodes: 0
raw_edges: 8897
valid_candidate_edges: 8320
missing_endpoint_edges: 0
dangling_endpoint_edges: 528
external_reference_edges: 49
self_loop_edges: 3
exact_duplicate_edges: 18
directed_unique_endpoint_pairs: 8084
directed_same_endpoint_collapsed_edges: 236
undirected_unique_endpoint_pairs: 8081
undirected_same_endpoint_collapsed_edges: 239
same_endpoint_group_count: 165
relation_variant_groups: 73
source_file_variant_groups: 0
source_location_variant_groups: 52
context_variant_groups: 28
post_build_graph_type: Graph
post_build_edges: 8598
producer_suppression_sites: 12
producer_suppression_examples:
  - L1646 seen_ids arity=unknown
  - L2179 seen_ids arity=unknown
  - L2181 seen_doc_refs arity=unknown
  - L2551 seen_ids arity=unknown
  - L2698 seen_ids arity=unknown
  - L3424 seen_keys arity=unknown
  - L3593 seen_keys arity=unknown
  - L5669 seen_ids arity=unknown
examples:
  - frontend_src_app_home_header -> ref_mui_material edges=14 relations=['imports_from'] locations=['L10', 'L12', 'L13', 'L15', 'L16', 'L17', 'L18', 'L20', 'L3', 'L4', 'L5', 'L6', 'L7', 'L9'] contexts=['import']
  - frontend_src_components_eliminationmatchscorecomparison -> ref_mui_icons_material edges=13 relations=['imports_from'] locations=['L13', 'L14', 'L15', 'L16', 'L17', 'L18', 'L19', 'L20', 'L21', 'L22', 'L23', 'L24', 'L25'] contexts=['import']
  - frontend_src_app_home_page -> ref_mui_material edges=11 relations=['imports_from'] locations=['L10', 'L11', 'L12', 'L14', 'L15', 'L2', 'L4', 'L5', 'L7', 'L8', 'L9'] contexts=['import']
  - frontend_src_app_home_login_page -> ref_mui_material edges=9 relations=['imports_from'] locations=['L12', 'L13', 'L14', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9'] contexts=['import']
  - frontend_src_app_home_register_page -> ref_mui_material edges=9 relations=['imports_from'] locations=['L10', 'L13', 'L14', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9'] contexts=['import']
note: normal graph.json is post-build; raw producer loss must be measured earlier.

Snapshot includes current working-tree changes. Structural and semantic relationships are navigational evidence, not proof of runtime behavior.
