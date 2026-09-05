/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface DatabaseCompetition {
  current_phase?: number;
  elimination_is_active?: boolean;
  end_time?: string;
  groups?: DatabaseGroup[];
  groups_num?: number;
  host_id?: number;
  id?: number;
  lanes_num?: number;
  mixed_elimination_is_active?: boolean;
  participants?: DatabaseParticipant[];
  qualification_current_end?: number;
  qualification_is_active?: boolean;
  rounds_num?: number;
  script?: string;
  start_time?: string;
  sub_title?: string;
  team_elimination_is_active?: boolean;
  title?: string;
  unassigned_group_id?: number;
  unassigned_lane_id?: number;
}

export interface DatabaseElimination {
  bracket_roster_locked?: boolean;
  bracket_seed_count?: number;
  current_end?: number;
  current_stage?: number;
  group_id?: number;
  id?: number;
  medals?: DatabaseMedal[];
  player_sets?: DatabasePlayerSet[];
  stages?: DatabaseStage[];
  team_size?: number;
}

export interface DatabaseGroup {
  bow_type?: string;
  competition_id?: number;
  group_index?: number;
  group_name?: string;
  group_range?: string;
  id?: number;
  players?: DatabasePlayer[];
}

export interface DatabaseGroupRankingPlayer {
  id?: number;
  name?: string;
  rank?: number;
  ten_count?: number;
  total_score?: number;
  x_count?: number;
}

export interface DatabaseInstitution {
  id?: number;
  name?: string;
}

export interface DatabaseLane {
  competition_id?: number;
  id?: number;
  lane_number?: number;
  players?: DatabasePlayer[];
  qualification_id?: number;
}

export interface DatabaseMatch {
  id?: number;
  match_results?: DatabaseMatchResult[];
  outcome_status?: "incomplete" | "winner" | "shoot_off" | "locked_conflict" | "unsupported_bow_type";
  stage_id?: number;
}

export interface DatabaseMatchEnd {
  cumulative_points?: number;
  id?: number;
  is_confirmed?: boolean;
  match_result_id?: number;
  match_scores?: DatabaseMatchScore[];
  points?: number | null;
  total_scores?: number;
}

export enum DatabaseMatchOutcomeStatus {
  MatchOutcomeIncomplete = "incomplete",
  MatchOutcomeWinner = "winner",
  MatchOutcomeShootOff = "shoot_off",
  MatchOutcomeLockedConflict = "locked_conflict",
  MatchOutcomeUnsupportedBowType = "unsupported_bow_type",
}

export interface DatabaseMatchResult {
  id?: number;
  is_winner?: boolean;
  lane_number?: number;
  match_ends?: DatabaseMatchEnd[];
  match_id?: number;
  player_set?: DatabasePlayerSet;
  /**
   * PlayerSetId is nil for an as-yet unknown bracket slot.  Zero cannot
   * represent that state because it is also a valid Go uint default and used
   * by older rows without a foreign-key constraint.
   */
  player_set_id?: number;
  shoot_off_score?: number;
  /**
   * Target is the physical target side used for this result.  It is nil
   * until an administrator assigns a placement, otherwise it is "A" or "B".
   */
  target?: "A" | "B" | null;
  total_points?: number;
}

export interface DatabaseMatchScore {
  id?: number;
  match_end_id?: number;
  score?: number;
}

export interface DatabaseMedal {
  elimination_id?: number;
  id?: number;
  player_set_id?: number;
  type?: number;
}

export interface DatabaseParticipant {
  competitionID?: number;
  id?: number;
  role?: string;
  status?: string;
  userID?: number;
}

export interface DatabasePlayer {
  group_id?: number;
  id?: number;
  lane_id?: number;
  name?: string;
  order?: number;
  participant_id?: number;
  player_sets?: DatabasePlayerSet[];
  rank?: number;
  rounds?: DatabaseRound[];
  shoot_off_score?: number;
  total_score?: number;
}

export interface DatabasePlayerSet {
  elimination_id?: number;
  id?: number;
  players?: DatabasePlayer[];
  rank?: number;
  set_name?: string;
  total_score?: number;
}

export interface DatabasePlayerSetRanking {
  id?: number;
  rank?: number;
  set_name?: string;
  ten_count?: number;
  total_score?: number;
  x_count?: number;
}

export interface DatabaseQualification {
  advancing_num?: number;
  end_lane?: number;
  id?: number;
  lanes?: DatabaseLane[];
  start_lane?: number;
}

export interface DatabaseRound {
  id?: number;
  player_id?: number;
  round_ends?: DatabaseRoundEnd[];
  total_score?: number;
}

export interface DatabaseRoundEnd {
  id?: number;
  is_confirmed?: boolean;
  round_id?: number;
  round_scores?: DatabaseRoundScore[];
}

export interface DatabaseRoundScore {
  id?: number;
  round_end_id?: number;
  score?: number;
}

export interface DatabaseStage {
  elimination_id?: number;
  id?: number;
  matchs?: DatabaseMatch[];
}

export interface DatabaseUser {
  email?: string;
  id?: number;
  institution_id?: number;
  overview?: string;
  real_name?: string;
  role?: string;
  user_name?: string;
}

export interface EndpointAccountInfo {
  email?: string;
  institution_id?: number;
  overview?: string;
  password?: string;
  real_name?: string;
  user_name?: string;
}

export interface EndpointAutoCreatePlayerSetsRequest {
  count?: number;
}

export interface EndpointAutoCreatePlayerSetsResponse {
  created_count?: number;
  elimination_id?: number;
  player_sets?: DatabasePlayerSet[];
  requested_count?: number;
  reused_count?: number;
}

export interface EndpointBracketAdvanceResponse {
  changed?: boolean;
  elimination_id?: number;
  finalized?: boolean;
  source_stage_id?: number;
  target_stage_id?: number;
}

export interface EndpointBracketFirstRoundSyncResponse {
  changed?: boolean;
  elimination_id?: number;
}

export interface EndpointBracketInitRequest {
  /**
   * @min 4
   * @max 128
   */
  advancing_count: number;
}

export interface EndpointBracketInitResponse {
  advancing_count?: number;
  bracket_size?: number;
  created?: boolean;
  elimination_id?: number;
  entrant_count?: number;
  stage_count?: number;
}

export interface EndpointCompetitionWGroupsQuaEliData {
  competition_id?: number;
  group_data?: EndpointGroupData[];
}

export interface EndpointEliminationData {
  elimination_id?: number;
  team_size?: number;
}

export interface EndpointGetPlayerSetsByMedalByEliminationIdPlayerSetData {
  id?: number;
  set_name?: string;
  type?: number;
}

export interface EndpointGetUserIDID {
  id?: number;
}

export interface EndpointGroupData {
  bow_type?: string;
  elimination_data?: EndpointEliminationData[];
  group_id?: number;
  group_name?: string;
  group_range?: string;
}

export interface EndpointGroupRankingResponse {
  group_id?: number;
  group_name?: string;
  players?: DatabaseGroupRankingPlayer[];
}

export interface EndpointLoginInfo {
  password?: string;
  user_name?: string;
}

export interface EndpointMatchPlacementRequest {
  /** @minItems 1 */
  placements: EndpointMatchResultPlacement[];
}

export interface EndpointMatchResultPlacement {
  /** @min 0 */
  lane_number: number;
  match_result_id: number;
  target?: "A" | "B" | null;
}

export interface EndpointMatchSettingsRequest {
  /**
   * @maxItems 2
   * @minItems 2
   */
  placements: EndpointMatchResultPlacement[];
  player_set_ids?: number[];
  winner_match_result_id: number | null;
}

export interface EndpointMatchSettingsResponse {
  changed?: boolean;
  elimination_id?: number;
  match_id?: number;
}

export interface EndpointMatchWinnerRequest {
  winner_match_result_id: number | null;
}

export interface EndpointMatchWinnerResponse {
  changed?: boolean;
  elimination_id?: number;
  match_id?: number;
}

export interface EndpointModifyAccountPasswordInfo {
  new_password?: string;
  original_password?: string;
}

export interface EndpointModifyInfoModifyUser {
  email?: string;
  institution_id?: number;
  overview?: string;
  real_name?: string;
  user_name?: string;
}

export interface EndpointNewInstitutionInfo {
  name?: string;
}

export interface EndpointNewParticipantInfo {
  competition_id?: number;
  role?: string;
  user_id?: number;
}

export interface EndpointParticipantWName {
  competition_id?: number;
  id?: number;
  name?: string;
  role?: string;
  status?: string;
  user_id?: number;
}

export interface EndpointPatchPlayerLaneOrderUpdateLaneIdOrderData {
  lane_id?: number;
  order?: number;
}

export interface EndpointPlacementResponse {
  changed?: boolean;
  elimination_id?: number;
  match_count?: number;
  match_id?: number;
  required_target_count?: number;
  stage_id?: number;
  used_end_lane_number?: number;
}

export interface EndpointPlayerSetRankingResponse {
  elimination_id?: number;
  player_sets?: DatabasePlayerSetRanking[];
}

export interface EndpointPostCompetitionCompetitionPostData {
  end_time?: string;
  host_id?: number;
  lanes_num?: number;
  rounds_num?: number;
  script?: string;
  start_time?: string;
  sub_title?: string;
  title?: string;
}

export interface EndpointPostEliminationPostEliminationData {
  group_id?: number;
  team_size?: number;
}

export interface EndpointPostGroupInfoGroupData {
  bow_type?: string;
  competition_id?: number;
  group_index?: number;
  group_name?: string;
  group_range?: string;
}

export interface EndpointPostMatchMatchData {
  lane_numbers?: number[];
  player_set_ids?: number[];
  stage_id?: number;
}

export interface EndpointPostMatchEndMatchEndData {
  match_result_id?: number;
  team_size?: number;
}

export interface EndpointPostPlayerSetPlayerSetData {
  elimination_id?: number;
  player_ids?: number[];
  set_name?: string;
}

export interface EndpointPostRoundEndRoundEndData {
  round_id?: number;
}

export interface EndpointPostStagePostStageData {
  elimination_id?: number;
}

export interface EndpointPutCompetitionCompetitionPutData {
  current_phase?: number;
  end_time?: string;
  qualification_current_end?: number;
  script?: string;
  start_time?: string;
  sub_title?: string;
  title?: string;
}

export interface EndpointPutCompetitionCurrentPhaseCurrentPhaseData {
  current_phase?: number;
}

export interface EndpointPutEliminationProgressProgressData {
  current_end?: number;
  current_stage?: number;
}

export interface EndpointPutGroupInfoGroupData {
  bow_type?: string;
  group_index?: number;
  group_name?: string;
  group_range?: string;
}

export interface EndpointPutMatchEndsIsConfirmedByIdMatchEndIsConfirmedData {
  is_confirmed?: boolean;
}

export interface EndpointPutMatchEndsScoresByIdMatchEndScoresData {
  match_score_ids?: number[];
  scores?: number[];
  total_scores?: number;
}

export interface EndpointPutMatchEndsTotalScoresByIdMatchEndTotalScoresData {
  total_scores?: number;
}

export interface EndpointPutMatchPlayerSetByMatchIdPutMatchPlayerSetIdData {
  player_set_ids?: number[];
}

export interface EndpointPutMatchResultIsWinnerByIdMatchResultIsWinnerData {
  is_winner?: boolean;
}

export interface EndpointPutMatchResultLaneNumberByIdMatchResultLaneNumberData {
  lane_number?: number;
}

export interface EndpointPutMatchResultShootOffScoreByIdMatchResultShootOffScoreData {
  shoot_off_score?: number;
}

export interface EndpointPutMatchScoreScoreByIdMatchScoreData {
  score?: number;
}

export interface EndpointPutMedalPlayerSetIdByIdRequestBody {
  player_set_id?: number;
}

export interface EndpointPutParticipantPutParticipantData {
  role?: string;
  status?: string;
}

export interface EndpointPutPlayerAllEndScoresByEndIdEndScores {
  scores?: number[];
}

export interface EndpointPutPlayerGroupIdUpdateGroupIdData {
  group_id?: number;
}

export interface EndpointPutPlayerIsConfirmedUpdateIsConfirmedData {
  is_confirmed?: boolean;
}

export interface EndpointPutPlayerLaneIdUpdateLaneIdData {
  lane_id?: number;
}

export interface EndpointPutPlayerOrderUpdateOrderData {
  order?: number;
}

export interface EndpointPutPlayerSetNamePlayerSetData {
  set_name?: string;
}

export interface EndpointPutPlayerShootoffScoreUpdateShootoffScoreData {
  shoot_off_score?: number;
}

export interface EndpointPutPlayerTotalScoreByplayerIdUpdateTotalScoreData {
  new_score?: number;
}

export interface EndpointPutQualificationByIDQualificationPutData {
  advancing_num?: number;
  end_lane?: number;
  start_lane?: number;
}

export interface EndpointStagePlacementRequest {
  end_lane_number: number;
  mode: "one_player_set_per_target" | "two_player_sets_per_target";
  start_lane_number: number;
}

export interface EndpointUpdateGroupRankingRequest {
  expected_player_ids: number[];
  player_ids: number[];
}

export interface EndpointUpdatePlayerSetRankingRequest {
  /** @minItems 1 */
  expected_player_set_ids: number[];
  /** @minItems 1 */
  player_set_ids: number[];
}

export interface EndpointUpdateTotalScoreData {
  player_id?: number;
  round_end_id?: number;
  round_id?: number;
  score?: number;
}

export interface EndpointGroupIdsForReorder {
  competition_id?: number;
  group_ids?: number[];
}

export interface ResponseDeleteSuccessResponse {
  /** @example "Delete ID(1) : sth delete success" */
  message?: string;
}

export interface ResponseErrorIdResponse {
  /** @example "invalid ID(1) : sth error" */
  error?: string;
}

export interface ResponseErrorInternalErrorResponse {
  /** @example "sth need fix ID(1) : sth error" */
  error?: string;
}

export interface ResponseErrorReceiveDataFormatResponse {
  /** @example "bad request data: sth error" */
  error?: string;
}

export interface ResponseErrorReceiveDataResponse {
  /** @example "bad request data ID(1): sth error" */
  error?: string;
}

export interface ResponseErrorResponse {
  /** @example "error description" */
  error?: string;
}

export interface ResponseErrorUnauthorizedResponse {
  /** @example "unauthorized" */
  error?: string;
}

export type ResponseNill = object;

export interface ResponseResponse {
  /** @example "result description" */
  message?: string;
}

import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, HeadersDefaults, ResponseType } from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown> extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({ securityWorker, secure, format, ...axiosConfig }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({ ...axiosConfig, baseURL: axiosConfig.baseURL || "//127.0.0.1:80/api" });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(params1: AxiosRequestConfig, params2?: AxiosRequestConfig): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method && this.instance.defaults.headers[method.toLowerCase() as keyof HeadersDefaults]) || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] = property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(key, isFileType ? formItem : this.stringifyFormItem(formItem));
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (type === ContentType.FormData && body && body !== null && typeof body === "object") {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (type === ContentType.Text && body && body !== null && typeof body !== "string") {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title Gin swagger
 * @version 1.0
 * @license no license yet
 * @baseUrl //127.0.0.1:80/api
 * @contact NYCUArchery (https://github.com/NYCUarchery)
 *
 * Gin swagger
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  competition = {
    /**
     * @description Get the information of all competitions.
     *
     * @tags Competition
     * @name CompetitionList
     * @summary Get the information of all competitions.
     * @request GET:/competition
     */
    competitionList: (params: RequestParams = {}) =>
      this.request<
        (DatabaseCompetition & {
          groups?: ResponseNill;
          participants?: ResponseNill;
        })[],
        ResponseErrorInternalErrorResponse
      >({
        path: `/competition`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Post one new Competition data with new id. Create UnassignedGroup, create Lanes and UnassignedLane which link to UnassignedGroup. Add host as admin of competition, and return the new Competition data. RoundsNum and LanesNum will influence player post data, so cannot be changed. ZeroTime 0001-01-01T00:00:00+00:01
     *
     * @tags Competition
     * @name CompetitionCreate
     * @summary Create one Competition and related data.
     * @request POST:/competition
     */
    competitionCreate: (Competition: EndpointPostCompetitionCompetitionPostData, params: RequestParams = {}) =>
      this.request<
        DatabaseCompetition & {
          groups?: ResponseNill;
          participants?: ResponseNill;
        },
        ResponseErrorReceiveDataFormatResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/competition`,
        method: "POST",
        body: Competition,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Competition currentPhase -- by id.
     *
     * @tags Competition
     * @name CurrentPhaseMinusPartialUpdate
     * @summary Update one Competition currentPhase -- by id.
     * @request PATCH:/competition/current-phase/minus/{id}
     */
    currentPhaseMinusPartialUpdate: (id: number, params: RequestParams = {}) =>
      this.request<
        ResponseResponse,
        ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/competition/current-phase/minus/${id}`,
        method: "PATCH",
        ...params,
      }),

    /**
     * @description Update one Competition currentPhase ++ by id.
     *
     * @tags Competition
     * @name CurrentPhasePlusPartialUpdate
     * @summary Update one Competition currentPhase ++ by id.
     * @request PATCH:/competition/current-phase/plus/{id}
     */
    currentPhasePlusPartialUpdate: (id: number, params: RequestParams = {}) =>
      this.request<
        ResponseResponse,
        ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/competition/current-phase/plus/${id}`,
        method: "PATCH",
        ...params,
      }),

    /**
     * @description Set current phase to qualification (0), individual elimination (1), team elimination (2), or mixed elimination (3). The selected phase must be active.
     *
     * @tags Competition
     * @name CurrentPhasePartialUpdate
     * @summary Set one Competition player-facing current phase.
     * @request PATCH:/competition/current-phase/{id}
     */
    currentPhasePartialUpdate: (
      id: number,
      CurrentPhase: EndpointPutCompetitionCurrentPhaseCurrentPhaseData,
      params: RequestParams = {},
    ) =>
      this.request<
        DatabaseCompetition & {
          groups?: ResponseNill;
          participants?: ResponseNill;
        },
        ResponseErrorReceiveDataResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/competition/current-phase/${id}`,
        method: "PATCH",
        body: CurrentPhase,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get current Competitions, head and tail are the range of most recent competitions. For example, head = 0, tail = 10, then return the most recent 10 competitions. head >= 0, tail >= 0, head <= tail
     *
     * @tags Competition
     * @name CurrentDetail
     * @summary Show current Competitions
     * @request GET:/competition/current/{head}/{tail}
     */
    currentDetail: (head: number, tail: number, params: RequestParams = {}) =>
      this.request<
        (DatabaseCompetition & {
          groups?: ResponseNill;
          participants?: ResponseNill;
        })[],
        ResponseErrorReceiveDataFormatResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/competition/current/${head}/${tail}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Competition Elimination Active to be true by id. Cannot change to false, only can change to true.
     *
     * @tags Competition
     * @name EliminationIsactivePartialUpdate
     * @summary Update one Competition Elimination Active to be true by id.
     * @request PATCH:/competition/elimination-isactive/{id}
     */
    eliminationIsactivePartialUpdate: (id: number, params: RequestParams = {}) =>
      this.request<ResponseResponse, ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/competition/elimination-isactive/${id}`,
        method: "PATCH",
        ...params,
      }),

    /**
     * @description Get one Competition by id with related Groups which have related one Qualification id and many Elimination ids.
     *
     * @tags Competition
     * @name GroupsEliminationsDetail
     * @summary Show Groups and Eliminations of one Competition.
     * @request GET:/competition/groups/eliminations/{id}
     */
    groupsEliminationsDetail: (id: number, params: RequestParams = {}) =>
      this.request<EndpointCompetitionWGroupsQuaEliData, ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/competition/groups/eliminations/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Competition by id with GroupInfos and Players.
     *
     * @tags Competition
     * @name GroupsPlayersDetail
     * @summary Show one Competition with GroupInfos and Players.
     * @request GET:/competition/groups/players/{id}
     */
    groupsPlayersDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        DatabaseCompetition & {
          groups?: (DatabaseGroup & {
            players?: (DatabasePlayer & {
              player_sets?: ResponseNill;
              rounds?: ResponseNill;
            })[];
          })[];
          participants?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/competition/groups/players/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Competition by id with GroupInfos
     *
     * @tags Competition
     * @name GroupsDetail
     * @summary Show one Competition with GroupInfos
     * @request GET:/competition/groups/{id}
     */
    groupsDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        DatabaseCompetition & {
          groups?: (DatabaseGroup & {
            players?: ResponseNill;
          })[];
          participants?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/competition/groups/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Competition Mixed Elimination Active to be true by id. Cannot change to false, only can change to true. create all mixed elimination for groups
     *
     * @tags Competition
     * @name MixedEliminationIsactivePartialUpdate
     * @summary Update one Competition Mixed Elimination Active to be true and create mixed elimination.
     * @request PATCH:/competition/mixed-elimination-isactive/{id}
     */
    mixedEliminationIsactivePartialUpdate: (id: number, params: RequestParams = {}) =>
      this.request<ResponseResponse, ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/competition/mixed-elimination-isactive/${id}`,
        method: "PATCH",
        ...params,
      }),

    /**
     * @description Get one Competition by id with Participants.
     *
     * @tags Competition
     * @name ParticipantsDetail
     * @summary Show one Competition with Participants.
     * @request GET:/competition/participants/{id}
     */
    participantsDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        DatabaseCompetition & {
          groups?: ResponseNill;
          participants?: DatabaseParticipant;
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/competition/participants/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Competition Qualification currentEnd -- by id.
     *
     * @tags Competition
     * @name QualificationCurrentEndMinusPartialUpdate
     * @summary Update one Competition Qualification currentEnd -- by id.
     * @request PATCH:/competition/qualification-current-end/minus/{id}
     */
    qualificationCurrentEndMinusPartialUpdate: (id: number, params: RequestParams = {}) =>
      this.request<ResponseResponse, ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/competition/qualification-current-end/minus/${id}`,
        method: "PATCH",
        ...params,
      }),

    /**
     * @description Update one Competition Qualification currentEnd ++ by id.
     *
     * @tags Competition
     * @name QualificationCurrentEndPlusPartialUpdate
     * @summary Update one Competition Qualification currentEnd ++ by id.
     * @request PATCH:/competition/qualification-current-end/plus/{id}
     */
    qualificationCurrentEndPlusPartialUpdate: (id: number, params: RequestParams = {}) =>
      this.request<ResponseResponse, ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/competition/qualification-current-end/plus/${id}`,
        method: "PATCH",
        ...params,
      }),

    /**
     * @description Update one Competition Qualification Active to be true by id. Cannot change to false, only can change to true.
     *
     * @tags Competition
     * @name QualificationIsactivePartialUpdate
     * @summary Update one Competition Qualification Active to be true by id.
     * @request PATCH:/competition/qualification-isactive/{id}
     */
    qualificationIsactivePartialUpdate: (id: number, params: RequestParams = {}) =>
      this.request<ResponseResponse, ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/competition/qualification-isactive/${id}`,
        method: "PATCH",
        ...params,
      }),

    /**
     * @description Refresh all player ranking of different groups in one Competition.
     *
     * @tags Competition
     * @name RefreshGroupsPlayersRankPartialUpdate
     * @summary Refresh one Competition Ranking.
     * @request PATCH:/competition/refresh/groups/players/rank/{id}
     */
    refreshGroupsPlayersRankPartialUpdate: (id: number, params: RequestParams = {}) =>
      this.request<
        ResponseResponse,
        ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/competition/refresh/groups/players/rank/${id}`,
        method: "PATCH",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Competition Team Elimination Active to be true by id. Cannot change to false, only can change to true. Create all team elimination for groups.
     *
     * @tags Competition
     * @name TeamEliminationIsactivePartialUpdate
     * @summary Update one Competition Team Elimination Active to be true and create team elimination.
     * @request PATCH:/competition/team-elimination-isactive/{id}
     */
    teamEliminationIsactivePartialUpdate: (id: number, params: RequestParams = {}) =>
      this.request<ResponseResponse, ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/competition/team-elimination-isactive/${id}`,
        method: "PATCH",
        ...params,
      }),

    /**
     * @description Get recent Competitions by User id, head and tail are the range of most recent competitions. For example, head = 0, tail = 10, then return the most recent 10 competitions. head >= 0, tail >= 0, head <= tail
     *
     * @tags Competition
     * @name UserDetail
     * @summary Show recent Competitions dealing with User.
     * @request GET:/competition/user/{userid}/{head}/{tail}
     */
    userDetail: (userid: number, head: number, tail: number, params: RequestParams = {}) =>
      this.request<
        (DatabaseCompetition & {
          groups?: ResponseNill;
          participants?: ResponseNill;
        })[],
        ResponseErrorReceiveDataFormatResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/competition/user/${userid}/${head}/${tail}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Competition by id without groups and participants. zeroTime 0001-01-01T00:00:00+00:01
     *
     * @tags Competition
     * @name CompetitionDetail
     * @summary Show one Competition without groups and participants.
     * @request GET:/competition/{id}
     */
    competitionDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        DatabaseCompetition & {
          groups?: ResponseNill;
          participants?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/competition/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Put whole new Competition and overwrite by the id. Allow to change title, subtitle, startTime, endTime, script, currentPhase, qualificationCurrentEnd. Cannot replace RoundNum, GroupNum, LaneNum, unassignedLaneId, unassignedGroupId, hostId, currentPhase, qualificationCurrentEnd. zeroTime 0001-01-01T00:00:00+00:01
     *
     * @tags Competition
     * @name CompetitionUpdate
     * @summary update one Competition
     * @request PUT:/competition/{id}
     */
    competitionUpdate: (
      id: number,
      Competition: EndpointPutCompetitionCompetitionPutData,
      params: RequestParams = {},
    ) =>
      this.request<
        DatabaseCompetition & {
          groups?: ResponseNill;
          participants?: ResponseNill;
        },
        ResponseErrorReceiveDataResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/competition/${id}`,
        method: "PUT",
        body: Competition,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete one Competition by id. Delete all related groups, lanes, players, participants.
     *
     * @tags Competition
     * @name CompetitionDelete
     * @summary Delete one Competition.
     * @request DELETE:/competition/{id}
     */
    competitionDelete: (id: number, params: RequestParams = {}) =>
      this.request<ResponseDeleteSuccessResponse, ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/competition/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  elimination = {
    /**
     * @description Post one new Elimination data, and three medals
     *
     * @tags Elimination
     * @name EliminationCreate
     * @summary Create one Elimination
     * @request POST:/elimination
     */
    eliminationCreate: (Elimination: EndpointPostEliminationPostEliminationData, params: RequestParams = {}) =>
      this.request<
        DatabaseElimination & {
          medals?: ResponseNill;
          player_sets?: ResponseNill;
          stages?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/elimination`,
        method: "POST",
        body: Elimination,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Creates a standard seeded bracket, including stages, gold and bronze finals, match results, ends, and scores. Requires a competition Admin.
     *
     * @tags Elimination
     * @name BracketCreate
     * @summary Initialize an elimination bracket
     * @request POST:/elimination/bracket/{id}
     */
    bracketCreate: (id: number, request: EndpointBracketInitRequest, params: RequestParams = {}) =>
      this.request<EndpointBracketInitResponse, ResponseErrorResponse>({
        path: `/elimination/bracket/${id}`,
        method: "POST",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Locks the elimination and PlayerSet rows, validates the complete bracket shape and current setup ranks, then fills or clears only unstarted first-round seed slots. Requires a competition Admin. It is idempotent and does not lock the roster or advance matches.
     *
     * @tags Elimination
     * @name BracketSyncFirstRoundCreate
     * @summary Synchronize an open elimination bracket's first round
     * @request POST:/elimination/bracket/{id}/sync-first-round
     */
    bracketSyncFirstRoundCreate: (id: number, params: RequestParams = {}) =>
      this.request<EndpointBracketFirstRoundSyncResponse, ResponseErrorResponse>({
        path: `/elimination/bracket/${id}/sync-first-round`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Elimination current end minus one by id
     *
     * @tags Elimination
     * @name CurrentendMinusPartialUpdate
     * @summary Update one Elimination current end minus one
     * @request PATCH:/elimination/currentend/minus/{id}
     */
    currentendMinusPartialUpdate: (id: number, params: RequestParams = {}) =>
      this.request<ResponseNill, ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse>({
        path: `/elimination/currentend/minus/${id}`,
        method: "PATCH",
        ...params,
      }),

    /**
     * @description Update one Elimination current end plus one by id
     *
     * @tags Elimination
     * @name CurrentendPlusPartialUpdate
     * @summary Update one Elimination current end plus one
     * @request PATCH:/elimination/currentend/plus/{id}
     */
    currentendPlusPartialUpdate: (id: number, params: RequestParams = {}) =>
      this.request<ResponseNill, ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse>({
        path: `/elimination/currentend/plus/${id}`,
        method: "PATCH",
        ...params,
      }),

    /**
     * @description Update one Elimination current stage minus one by id
     *
     * @tags Elimination
     * @name CurrentstageMinusPartialUpdate
     * @summary Update one Elimination current stage minus one
     * @request PATCH:/elimination/currentstage/minus/{id}
     */
    currentstageMinusPartialUpdate: (id: number, params: RequestParams = {}) =>
      this.request<ResponseNill, ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse>({
        path: `/elimination/currentstage/minus/${id}`,
        method: "PATCH",
        ...params,
      }),

    /**
     * @description Update one Elimination current stage plus one by id
     *
     * @tags Elimination
     * @name CurrentstagePlusPartialUpdate
     * @summary Update one Elimination current stage plus one
     * @request PATCH:/elimination/currentstage/plus/{id}
     */
    currentstagePlusPartialUpdate: (id: number, params: RequestParams = {}) =>
      this.request<ResponseNill, ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse>({
        path: `/elimination/currentstage/plus/${id}`,
        method: "PATCH",
        ...params,
      }),

    /**
     * @description Post one new Match data with 2 matchResults Each matchResults with 4 or 5 matchEnds with different teamSize Each matchEnds with 3, 4, 6 matchScores with different teamSize input PlayerSetIds should have 2 playerSets in the same elimination input LaneNumbers should have 2 laneNumbers for each playerset
     *
     * @tags Elimination
     * @name MatchCreate
     * @summary Create one Match
     * @request POST:/elimination/match
     */
    matchCreate: (Match: EndpointPostMatchMatchData, params: RequestParams = {}) =>
      this.request<DatabaseMatch, ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse>(
        {
          path: `/elimination/match`,
          method: "POST",
          body: Match,
          type: ContentType.Json,
          format: "json",
          ...params,
        },
      ),

    /**
     * @description Requires a competition Admin. The request must name exactly both MatchResults. Each side may independently use any non-negative lane_number and target A, B, or null. No lanes-table lookup is made.
     *
     * @tags Elimination
     * @name MatchPlacementUpdate
     * @summary Place the two sides of an elimination match
     * @request PUT:/elimination/match/placement/{matchid}
     */
    matchPlacementUpdate: (matchid: number, Placement: EndpointMatchPlacementRequest, params: RequestParams = {}) =>
      this.request<EndpointPlacementResponse, ResponseErrorResponse>({
        path: `/elimination/match/placement/${matchid}`,
        method: "PUT",
        body: Placement,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Force-corrects both PlayerSet identities of any elimination Match while retaining each slot's score, confirmation, winner, and placement. Selected winners are reprojected downstream. Requires a competition Admin.
     *
     * @tags Elimination
     * @name MatchPlayersetPartialUpdate
     * @summary Update two MatchResult with two PlayerSetId in one Match
     * @request PATCH:/elimination/match/playerset/{matchid}
     */
    matchPlayersetPartialUpdate: (
      matchid: number,
      PlayerSetId: EndpointPutMatchPlayerSetByMatchIdPutMatchPlayerSetIdData,
      params: RequestParams = {},
    ) =>
      this.request<DatabaseMatch, ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse>(
        {
          path: `/elimination/match/playerset/${matchid}`,
          method: "PATCH",
          body: PlayerSetId,
          type: ContentType.Json,
          format: "json",
          ...params,
        },
      ),

    /**
     * @description Get one Match with matchResults, matchEnds, scores, playerSets, players by id
     *
     * @tags Elimination
     * @name MatchScoresDetail
     * @summary Show one Match with all related data
     * @request GET:/elimination/match/scores/{matchid}
     */
    matchScoresDetail: (matchid: number, params: RequestParams = {}) =>
      this.request<DatabaseMatch, ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/elimination/match/scores/${matchid}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Requires a competition Admin. winner_match_result_id is required and may be null. Validates exactly two placements, may force-correct player_set_ids for any match while retaining slot state and reprojecting selected winners, and selects an occupied winner result. Any conflict rolls back every field.
     *
     * @tags Elimination
     * @name MatchSettingsUpdate
     * @summary Update elimination match placement and winner atomically
     * @request PUT:/elimination/match/settings/{matchid}
     */
    matchSettingsUpdate: (matchid: number, request: EndpointMatchSettingsRequest, params: RequestParams = {}) =>
      this.request<EndpointMatchSettingsResponse, ResponseErrorResponse>({
        path: `/elimination/match/settings/${matchid}`,
        method: "PUT",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Locks the elimination, match, and both match results. winner_match_result_id is required and must identify an occupied result of this match, or be null to clear both winner flags. Requires a competition Admin. Generated brackets validate and lock their roster, and cannot change a source after it has advanced.
     *
     * @tags Elimination
     * @name MatchWinnerUpdate
     * @summary Select an elimination match winner
     * @request PUT:/elimination/match/winner/{matchid}
     */
    matchWinnerUpdate: (matchid: number, request: EndpointMatchWinnerRequest, params: RequestParams = {}) =>
      this.request<EndpointMatchWinnerResponse, ResponseErrorResponse>({
        path: `/elimination/match/winner/${matchid}`,
        method: "PUT",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Elimination with player sets by id
     *
     * @tags Elimination
     * @name PlayersetsDetail
     * @summary Show one Elimination with player sets
     * @request GET:/elimination/playersets/{id}
     */
    playersetsDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        DatabaseElimination & {
          medals?: ResponseNill;
          player_sets?: DatabasePlayerSet & {
            players?: ResponseNill;
          };
          stages?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/elimination/playersets/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Set stage and end atomically. Stages are zero-based in creation order and must contain a match. Individual eliminations allow ends 0 through 4; team and mixed eliminations allow ends 0 through 3. Moving to another stage resets current_end to 0.
     *
     * @tags Elimination
     * @name ProgressPartialUpdate
     * @summary Set one Elimination current stage and end.
     * @request PATCH:/elimination/progress/{id}
     */
    progressPartialUpdate: (
      id: number,
      Progress: EndpointPutEliminationProgressProgressData,
      params: RequestParams = {},
    ) =>
      this.request<
        DatabaseElimination & {
          medals?: ResponseNill;
          player_sets?: ResponseNill;
          stages?: ResponseNill;
        },
        ResponseErrorReceiveDataResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/elimination/progress/${id}`,
        method: "PATCH",
        body: Progress,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Elimination with stages, matches, matchResults, matchEnds, scores by id
     *
     * @tags Elimination
     * @name ScoresDetail
     * @summary Show one Elimination with all scores
     * @request GET:/elimination/scores/{id}
     */
    scoresDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        DatabaseElimination & {
          medals?: ResponseNill;
          player_sets?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/elimination/scores/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Post one new Stage data with new id
     *
     * @tags Elimination
     * @name StageCreate
     * @summary Create one Stage
     * @request POST:/elimination/stage
     */
    stageCreate: (Stage: EndpointPostStagePostStageData, params: RequestParams = {}) =>
      this.request<
        DatabaseStage & {
          matchs?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/elimination/stage`,
        method: "POST",
        body: Stage,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Propagates completed winners to the following stage, routes semi-final losers to bronze, or assigns final medals. Requires a competition Admin.
     *
     * @tags Elimination
     * @name StageAdvanceCreate
     * @summary Advance an elimination stage
     * @request POST:/elimination/stage/advance/{stageid}
     */
    stageAdvanceCreate: (stageid: number, params: RequestParams = {}) =>
      this.request<EndpointBracketAdvanceResponse, ResponseErrorResponse>({
        path: `/elimination/stage/advance/${stageid}`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * @description Requires a competition Admin. mode is one_player_set_per_target or two_player_sets_per_target; no lane records are required.
     *
     * @tags Elimination
     * @name StagePlacementUpdate
     * @summary Place every match in an elimination stage
     * @request PUT:/elimination/stage/placement/{stageid}
     */
    stagePlacementUpdate: (stageid: number, Placement: EndpointStagePlacementRequest, params: RequestParams = {}) =>
      this.request<EndpointPlacementResponse, ResponseErrorResponse>({
        path: `/elimination/stage/placement/${stageid}`,
        method: "PUT",
        body: Placement,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Elimination with stages, matches by id
     *
     * @tags Elimination
     * @name StagesMatchesDetail
     * @summary Show one Elimination with stages, matches
     * @request GET:/elimination/stages/matches/{id}
     */
    stagesMatchesDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        DatabaseElimination & {
          medals?: ResponseNill;
          player_sets?: ResponseNill;
          stages?: DatabaseStage & {
            matches?: DatabaseMatch & {
              MatchResult?: ResponseNill;
            };
          };
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/elimination/stages/matches/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Elimination with stages, matches, matchResults, matchEnds, scores, playerSets, players, medals by id
     *
     * @tags Elimination
     * @name StagesScoresMedalsDetail
     * @summary Show one Elimination with all related data
     * @request GET:/elimination/stages/scores/medals/{id}
     */
    stagesScoresMedalsDetail: (id: number, params: RequestParams = {}) =>
      this.request<DatabaseElimination, ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/elimination/stages/scores/medals/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get only one Elimination by id
     *
     * @tags Elimination
     * @name EliminationDetail
     * @summary Show only one Elimination
     * @request GET:/elimination/{id}
     */
    eliminationDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        DatabaseElimination & {
          medals?: ResponseNill;
          player_sets?: ResponseNill;
          stages?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/elimination/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Delete one Elimination by id, and related stages and matches
     *
     * @tags Elimination
     * @name EliminationDelete
     * @summary Delete one Elimination, and related stages and matches
     * @request DELETE:/elimination/{id}
     */
    eliminationDelete: (id: number, params: RequestParams = {}) =>
      this.request<ResponseDeleteSuccessResponse, ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/elimination/${id}`,
        method: "DELETE",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  groupinfo = {
    /**
     * @description Post one new GroupInfo data with new id Create qualification with same id Auto write GroupIndex Auto create elimination
     *
     * @tags GroupInfo
     * @name GroupinfoCreate
     * @summary Create one GroupInfo
     * @request POST:/groupinfo
     */
    groupinfoCreate: (GroupInfo: EndpointPostGroupInfoGroupData, params: RequestParams = {}) =>
      this.request<
        DatabaseGroup & {
          players?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/groupinfo`,
        method: "POST",
        body: GroupInfo,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Put competition_id and group_ids to update GroupInfos Indices under the same Competition GroupIds cannot include UnassignedGroupId GroupIds length must be equal to Competition group_num
     *
     * @tags GroupInfo
     * @name OrderingPartialUpdate
     * @summary update all GroupInfos Indices under the same Competition
     * @request PATCH:/groupinfo/ordering
     */
    orderingPartialUpdate: (groupIdsForReorder: EndpointGroupIdsForReorder, params: RequestParams = {}) =>
      this.request<
        DatabaseCompetition & {
          groups?: DatabaseGroup & {
            players?: ResponseNill;
          };
          participants?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/groupinfo/ordering`,
        method: "PATCH",
        body: groupIdsForReorder,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns rankable players in their current manual or automatic order, with total score, X count, and pure ten count.
     *
     * @tags GroupInfo
     * @name PlayersRankingDetail
     * @summary Show a formal group's qualification ranking
     * @request GET:/groupinfo/players/ranking/{groupId}
     */
    playersRankingDetail: (groupId: number, params: RequestParams = {}) =>
      this.request<EndpointGroupRankingResponse, ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/groupinfo/players/ranking/${groupId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Updates all rankable players as one transaction. expected_player_ids must equal the ranking order loaded by the caller; a changed order returns 409.
     *
     * @tags GroupInfo
     * @name PlayersRankingPartialUpdate
     * @summary Manually reorder a formal group's qualification ranking
     * @request PATCH:/groupinfo/players/ranking/{groupId}
     */
    playersRankingPartialUpdate: (
      groupId: number,
      Ranking: EndpointUpdateGroupRankingRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        EndpointGroupRankingResponse,
        ResponseErrorReceiveDataResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/groupinfo/players/ranking/${groupId}`,
        method: "PATCH",
        body: Ranking,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one GroupInfo with players by id, usually ordered by rank
     *
     * @tags GroupInfo
     * @name PlayersDetail
     * @summary Show one GroupInfo with players
     * @request GET:/groupinfo/players/{id}
     */
    playersDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        DatabaseGroup & {
          players?: DatabasePlayer & {
            player_sets?: ResponseNill;
            rounds?: ResponseNill;
          };
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/groupinfo/players/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get only one GroupInfo by id
     *
     * @tags GroupInfo
     * @name GroupinfoDetail
     * @summary Show only one GroupInfo
     * @request GET:/groupinfo/{id}
     */
    groupinfoDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        DatabaseGroup & {
          players?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/groupinfo/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Put whole new GroupInfo and overwrite with the id Cannot overwrite CompetitionId Cannot overwrite UnassignedGroup
     *
     * @tags GroupInfo
     * @name GroupinfoUpdate
     * @summary update one GroupInfo
     * @request PUT:/groupinfo/{id}
     */
    groupinfoUpdate: (id: number, GroupInfo: EndpointPutGroupInfoGroupData, params: RequestParams = {}) =>
      this.request<
        DatabaseGroup & {
          players?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/groupinfo/${id}`,
        method: "PUT",
        body: GroupInfo,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete one GroupInfo by id, delete qualification, Change player to UnassignedGroup and UnassignedLane Update competition group_num Cannot delete UnassignedGroup
     *
     * @tags GroupInfo
     * @name GroupinfoDelete
     * @summary delete one GroupInfo
     * @request DELETE:/groupinfo/{id}
     */
    groupinfoDelete: (id: number, params: RequestParams = {}) =>
      this.request<ResponseDeleteSuccessResponse, ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/groupinfo/${id}`,
        method: "DELETE",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  institution = {
    /**
     * @description Get all institution info from db.
     *
     * @tags Institution
     * @name InstitutionList
     * @summary Get all institution info.
     * @request GET:/institution
     */
    institutionList: (params: RequestParams = {}) =>
      this.request<DatabaseInstitution[], ResponseResponse>({
        path: `/institution`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Add an institution to db. Cannot repeat institution name. Institution name cannot be empty.
     *
     * @tags Institution
     * @name InstitutionCreate
     * @summary Create an institution.
     * @request POST:/institution
     */
    institutionCreate: (NewInstitutionInfo: EndpointNewInstitutionInfo, params: RequestParams = {}) =>
      this.request<ResponseResponse, ResponseResponse>({
        path: `/institution`,
        method: "POST",
        body: NewInstitutionInfo,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get institution info from db by id.
     *
     * @tags Institution
     * @name InstitutionDetail
     * @summary Get institution info by id.
     * @request GET:/institution/{id}
     */
    institutionDetail: (id: number, params: RequestParams = {}) =>
      this.request<DatabaseInstitution, ResponseResponse>({
        path: `/institution/${id}`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete an institution from db.
     *
     * @tags Institution
     * @name InstitutionDelete
     * @summary Delete an institution.
     * @request DELETE:/institution/{id}
     */
    institutionDelete: (id: number, params: RequestParams = {}) =>
      this.request<ResponseResponse, ResponseResponse>({
        path: `/institution/${id}`,
        method: "DELETE",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  lane = {
    /**
     * @description Get all Lanes and related data by competition id.
     *
     * @tags Lane
     * @name GetLane
     * @summary Show all Lanes and related data of a competition.
     * @request GET:/lane/all/{competitionid}
     */
    getLane: (competitionid: number, params: RequestParams = {}) =>
      this.request<
        (DatabaseLane & {
          players?: ResponseNill;
        })[],
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/lane/all/${competitionid}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Lane with players, rounds, roundends, roundscores by id.
     *
     * @tags Lane
     * @name ScoresDetail
     * @summary Show one Lane with players, rounds, roundends, roundscores.
     * @request GET:/lane/scores/{id}
     */
    scoresDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        DatabaseLane & {
          players?: DatabasePlayer & {
            player_sets?: ResponseNill;
          };
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/lane/scores/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Lane by id.
     *
     * @tags Lane
     * @name LaneDetail
     * @summary Show one Lane.
     * @request GET:/lane/{id}
     */
    laneDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        DatabaseLane & {
          players?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/lane/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  matchresult = {
    /**
     * @description When is_winner is true, atomically selects this occupied result and clears the other result in its match. When false, clears both winner flags. Prefer PUT /elimination/match/winner/{matchid}. Requires a competition Admin.
     *
     * @tags MatchResult
     * @name IswinnerPartialUpdate
     * @summary Set or clear one match winner (legacy result endpoint)
     * @request PATCH:/matchresult/iswinner/{id}
     * @deprecated
     */
    iswinnerPartialUpdate: (
      id: number,
      MatchResult: EndpointPutMatchResultIsWinnerByIdMatchResultIsWinnerData,
      params: RequestParams = {},
    ) =>
      this.request<ResponseNill, ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse>({
        path: `/matchresult/iswinner/${id}`,
        method: "PATCH",
        body: MatchResult,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Deprecated: use PUT /elimination/match/placement/{matchid}. Requires a competition Admin and preserves the complete-match placement invariant.
     *
     * @tags MatchResult
     * @name LanenumberPartialUpdate
     * @summary Deprecated: update one MatchResult laneNumber
     * @request PATCH:/matchresult/lanenumber/{id}
     * @deprecated
     */
    lanenumberPartialUpdate: (
      id: number,
      MatchResult: EndpointPutMatchResultLaneNumberByIdMatchResultLaneNumberData,
      params: RequestParams = {},
    ) =>
      this.request<ResponseNill, ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/matchresult/lanenumber/${id}`,
        method: "PATCH",
        body: MatchResult,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Post one new MatchEnd data, Auto write totalScores IsConfirmed, and auto create matchScores by teamSize teamSize: 1, 2, 3
     *
     * @tags MatchEnd
     * @name MatchendCreate
     * @summary Create one MatchEnd
     * @request POST:/matchresult/matchend
     */
    matchendCreate: (matchEndData: EndpointPostMatchEndMatchEndData, params: RequestParams = {}) =>
      this.request<
        ResponseResponse,
        ResponseErrorReceiveDataResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/matchresult/matchend`,
        method: "POST",
        body: matchEndData,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Confirm an eligible MatchEnd as Player, Judge, or Admin. Only the owning competition Admin may change a confirmed MatchEnd back to unconfirmed.
     *
     * @tags MatchEnd
     * @name MatchendIsconfirmedPartialUpdate
     * @summary Update one MatchEnd isConfirmed
     * @request PATCH:/matchresult/matchend/isconfirmed/{id}
     */
    matchendIsconfirmedPartialUpdate: (
      id: number,
      MatchEnd: EndpointPutMatchEndsIsConfirmedByIdMatchEndIsConfirmedData,
      params: RequestParams = {},
    ) =>
      this.request<ResponseNill, ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse>({
        path: `/matchresult/matchend/isconfirmed/${id}`,
        method: "PATCH",
        body: MatchEnd,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Update one MatchEnd totalScores by id and all related MatchScores by MatchScore ids Approved Judges may update the active current stage, Players their own current match's unconfirmed end, and Admins may perform rescue updates. A confirmed MatchEnd requires Judge or Admin and every MatchScore exactly once; confirmation remains set and total/outcome are recomputed atomically.
     *
     * @tags MatchEnd
     * @name MatchendScoresPartialUpdate
     * @summary Update one MatchEnd scores
     * @request PATCH:/matchresult/matchend/scores/{id}
     */
    matchendScoresPartialUpdate: (
      id: number,
      matchEndScoresData: EndpointPutMatchEndsScoresByIdMatchEndScoresData,
      params: RequestParams = {},
    ) =>
      this.request<ResponseNill, ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse>({
        path: `/matchresult/matchend/scores/${id}`,
        method: "PATCH",
        body: matchEndScoresData,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Recompute one MatchEnd total score from its arrows. Approved Judges may update the active current stage, Players their own current match's unconfirmed end, and Admins may perform rescue updates. Confirmed ends must use the aggregate scores endpoint.
     *
     * @tags MatchEnd
     * @name MatchendTotalscorePartialUpdate
     * @summary Update one MatchEnd totalScores
     * @request PATCH:/matchresult/matchend/totalscore/{id}
     */
    matchendTotalscorePartialUpdate: (
      id: number,
      MatchEnd: EndpointPutMatchEndsTotalScoresByIdMatchEndTotalScoresData,
      params: RequestParams = {},
    ) =>
      this.request<ResponseNill, ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse>({
        path: `/matchresult/matchend/totalscore/${id}`,
        method: "PATCH",
        body: MatchEnd,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Update one MatchScore score and recompute its MatchEnd total. Approved Judges may update the active current stage, Players their own current match's unconfirmed end, and Admins may perform rescue updates. Confirmed ends require the aggregate endpoint.
     *
     * @tags MatchScore
     * @name MatchscoreScorePartialUpdate
     * @summary Update one MatchScore score
     * @request PATCH:/matchresult/matchscore/score/{id}
     */
    matchscoreScorePartialUpdate: (
      id: number,
      MatchScore: EndpointPutMatchScoreScoreByIdMatchScoreData,
      params: RequestParams = {},
    ) =>
      this.request<ResponseNill, ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse>({
        path: `/matchresult/matchscore/score/${id}`,
        method: "PATCH",
        body: MatchScore,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Get one MatchResult with match_ends, match_scores, player set by id
     *
     * @tags MatchResult
     * @name ScoresDetail
     * @summary Show one MatchResult with match_ends, match_scores, player set
     * @request GET:/matchresult/scores/{id}
     */
    scoresDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        DatabaseMatchResult & {
          player_set?: DatabasePlayerSet & {
            players?: ResponseNill;
          };
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/matchresult/scores/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Update one MatchResult shootOffScore by id. An approved Judge may update an active elimination's current stage; an approved Admin may perform rescue updates.
     *
     * @tags MatchResult
     * @name ShootoffscorePartialUpdate
     * @summary Update one MatchResult shootOffScore
     * @request PATCH:/matchresult/shootoffscore/{id}
     */
    shootoffscorePartialUpdate: (
      id: number,
      MatchResult: EndpointPutMatchResultShootOffScoreByIdMatchResultShootOffScoreData,
      params: RequestParams = {},
    ) =>
      this.request<ResponseNill, ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse>({
        path: `/matchresult/shootoffscore/${id}`,
        method: "PATCH",
        body: MatchResult,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Get one MatchResult with player set by id
     *
     * @tags MatchResult
     * @name MatchresultDetail
     * @summary Show one MatchResult with player set
     * @request GET:/matchresult/{id}
     */
    matchresultDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        DatabaseMatchResult & {
          match_ends?: ResponseNill;
          player_set?: DatabasePlayerSet & {
            players?: ResponseNill;
          };
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/matchresult/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Delete one MatchResult with matchEnds and matchScores by id
     *
     * @tags MatchResult
     * @name MatchresultDelete
     * @summary Delete one MatchResult
     * @request DELETE:/matchresult/{id}
     */
    matchresultDelete: (id: number, params: RequestParams = {}) =>
      this.request<ResponseNill, ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse>({
        path: `/matchresult/${id}`,
        method: "DELETE",
        ...params,
      }),
  };
  medal = {
    /**
     * @description Get medals of elimination by elimination id.
     *
     * @tags Medal
     * @name EliminationDetail
     * @summary Show medals of elimination by elimination id.
     * @request GET:/medal/elimination/{eliminationid}
     */
    eliminationDetail: (eliminationid: number, params: RequestParams = {}) =>
      this.request<DatabaseMedal[], ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/medal/elimination/${eliminationid}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Update medal's player set id by id.
     *
     * @tags Medal
     * @name PlayersetidPartialUpdate
     * @summary Update medal's player set id by id.
     * @request PATCH:/medal/playersetid/{id}
     */
    playersetidPartialUpdate: (
      id: number,
      PlayerSetId: EndpointPutMedalPlayerSetIdByIdRequestBody,
      params: RequestParams = {},
    ) =>
      this.request<void, ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse>({
        path: `/medal/playersetid/${id}`,
        method: "PATCH",
        body: PlayerSetId,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Get one medal by id.
     *
     * @tags Medal
     * @name MedalDetail
     * @summary Show one medal by id.
     * @request GET:/medal/{id}
     */
    medalDetail: (id: number, params: RequestParams = {}) =>
      this.request<DatabaseMedal, ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/medal/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  participant = {
    /**
     * @description Post a particpant to the competition from the user. Cannot repeat participant. Role cannot be empty. Status is always initialized as "pending".
     *
     * @tags Participant
     * @name ParticipantCreate
     * @summary Post a particpant to the competition.
     * @request POST:/participant
     */
    participantCreate: (NewParticipantInfo: EndpointNewParticipantInfo, params: RequestParams = {}) =>
      this.request<
        DatabaseParticipant,
        ResponseErrorReceiveDataFormatResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/participant`,
        method: "POST",
        body: NewParticipantInfo,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get Participants By competition ID and user ID
     *
     * @tags Participant
     * @name CompetitionUserDetail
     * @summary Show Participants By competition ID and user ID
     * @request GET:/participant/competition/user/{competitionid}/{userid}
     */
    competitionUserDetail: (competitionid: number, userid: number, params: RequestParams = {}) =>
      this.request<DatabaseParticipant[], ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/participant/competition/user/${competitionid}/${userid}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get Participants by competition ID, including realname.
     *
     * @tags Participant
     * @name CompetitionDetail
     * @summary Show Participants by competition ID.
     * @request GET:/participant/competition/{competitionid}
     */
    competitionDetail: (competitionid: number, params: RequestParams = {}) =>
      this.request<EndpointParticipantWName[], ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/participant/competition/${competitionid}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get Participants By user id and competition id. And update session gamerole. Warnings: Something need to be modified in the future. Warnings: Only take the first one temporarily, for player and dummy player assumption in one competition of a user.
     *
     * @tags Participant
     * @name GetParticipant
     * @summary Get Participants By user id and competition id, and update session gamerole.
     * @request GET:/participant/me/{competitionid}
     */
    getParticipant: (competitionid: number, params: RequestParams = {}) =>
      this.request<
        DatabaseParticipant,
        ResponseErrorIdResponse | ResponseErrorUnauthorizedResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/participant/me/${competitionid}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get Participants By user ID.
     *
     * @tags Participant
     * @name UserDetail
     * @summary Show Participants By user ID.
     * @request GET:/participant/user/{userid}
     */
    userDetail: (userid: number, params: RequestParams = {}) =>
      this.request<DatabaseParticipant[], ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/participant/user/${userid}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get One Participant By ID.
     *
     * @tags Participant
     * @name ParticipantDetail
     * @summary Show One Participant By ID.
     * @request GET:/participant/{id}
     */
    participantDetail: (id: number, params: RequestParams = {}) =>
      this.request<DatabaseParticipant, ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/participant/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Put whole new Participant.
     *
     * @tags Participant
     * @name ParticipantUpdate
     * @summary Update one Participant.
     * @request PUT:/participant/{id}
     */
    participantUpdate: (
      id: number,
      Participant: EndpointPutParticipantPutParticipantData,
      params: RequestParams = {},
    ) =>
      this.request<
        DatabaseParticipant,
        ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/participant/${id}`,
        method: "PUT",
        body: Participant,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete one Participant by id. Requires an approved Admin of the target competition; the last approved Admin cannot be deleted. This api is intentionally designed not to delete related data, because a user may drop out of competition, but competition still need the record.
     *
     * @tags Participant
     * @name ParticipantDelete
     * @summary Delete one Participant.
     * @request DELETE:/participant/{id}
     */
    participantDelete: (id: number, params: RequestParams = {}) =>
      this.request<
        ResponseDeleteSuccessResponse,
        ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/participant/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  player = {
    /**
     * @description Atomically update every arrow in one qualification end and recompute round/player totals. Approved Judge/Admin may edit confirmed ends; a Player is limited to an unconfirmed current end on their own lane. The score count must exactly match the stored RoundScore collection.
     *
     * @tags Player
     * @name AllEndscoresPartialUpdate
     * @summary Update all scores of one end by end id
     * @request PATCH:/player/all-endscores/{endid}
     */
    allEndscoresPartialUpdate: (
      endid: number,
      scores: EndpointPutPlayerAllEndScoresByEndIdEndScores,
      params: RequestParams = {},
    ) =>
      this.request<ResponseNill, ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse>({
        path: `/player/all-endscores/${endid}`,
        method: "PATCH",
        body: scores,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get dummy players by participant id.
     *
     * @tags Player
     * @name DummyDetail
     * @summary Show dummy players.
     * @request GET:/player/dummy/{participantid}
     */
    dummyDetail: (participantid: number, params: RequestParams = {}) =>
      this.request<
        (DatabasePlayer & {
          player_sets?: ResponseNill;
          rounds?: ResponseNill;
        })[],
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/player/dummy/${participantid}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Create dummy player by player id.
     *
     * @tags Player
     * @name DummyCreate
     * @summary Create dummy player.
     * @request POST:/player/dummy/{playerid}
     */
    dummyCreate: (playerid: number, params: RequestParams = {}) =>
      this.request<
        DatabasePlayer & {
          player_sets?: ResponseNill;
          rounds?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/player/dummy/${playerid}`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Player groupId by id, and change player laneid to Unassigned lane. Requires an approved Admin of the Player's competition; the target group must belong to that competition.
     *
     * @tags Player
     * @name GroupPartialUpdate
     * @summary Update one Player groupId by id.
     * @request PATCH:/player/group/{id}
     */
    groupPartialUpdate: (id: number, groupid: EndpointPutPlayerGroupIdUpdateGroupIdData, params: RequestParams = {}) =>
      this.request<
        DatabasePlayer & {
          player_sets?: ResponseNill;
          rounds?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/player/group/${id}`,
        method: "PATCH",
        body: groupid,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Confirm a qualification end as an approved Judge/Admin, or as a Player scoring the current end on their own lane. Only an Admin may unconfirm an already confirmed end.
     *
     * @tags Player
     * @name IsconfirmedPartialUpdate
     * @summary Update one Player isConfirmed by id.
     * @request PATCH:/player/isconfirmed/{roundendid}
     */
    isconfirmedPartialUpdate: (
      roundendid: number,
      data: EndpointPutPlayerIsConfirmedUpdateIsConfirmedData,
      params: RequestParams = {},
    ) =>
      this.request<ResponseNill, ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse>({
        path: `/player/isconfirmed/${roundendid}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Player order and landID By by id. Requires an approved Admin of the Player's competition; the target lane must belong to that competition.
     *
     * @tags Player
     * @name LaneOrderPartialUpdate
     * @summary Update one Player order and landID By by id.
     * @request PATCH:/player/lane-order/{id}
     */
    laneOrderPartialUpdate: (
      id: number,
      data: EndpointPatchPlayerLaneOrderUpdateLaneIdOrderData,
      params: RequestParams = {},
    ) =>
      this.request<
        DatabasePlayer & {
          player_sets?: ResponseNill;
          rounds?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/player/lane-order/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Player laneId by id, update lane playernum. Requires an approved Admin of the Player's competition; the target lane must belong to that competition.
     *
     * @tags Player
     * @name LanePartialUpdate
     * @summary Update one Player laneId by id.
     * @request PATCH:/player/lane/{id}
     */
    lanePartialUpdate: (id: number, data: EndpointPutPlayerLaneIdUpdateLaneIdData, params: RequestParams = {}) =>
      this.request<
        DatabasePlayer & {
          player_sets?: ResponseNill;
          rounds?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/player/lane/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Player order by id. Requires an approved Admin of the Player's competition.
     *
     * @tags Player
     * @name OrderPartialUpdate
     * @summary Update one Player order by id.
     * @request PATCH:/player/order/{id}
     */
    orderPartialUpdate: (id: number, data: EndpointPutPlayerOrderUpdateOrderData, params: RequestParams = {}) =>
      this.request<
        DatabasePlayer & {
          player_sets?: ResponseNill;
          rounds?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/player/order/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Player with player sets by id and elimination id.
     *
     * @tags Player
     * @name PlayersetsDetail
     * @summary Show one Player with player sets.
     * @request GET:/player/playersets/{id}/{eliminationid}
     */
    playersetsDetail: (id: number, eliminationid: number, params: RequestParams = {}) =>
      this.request<
        DatabasePlayer & {
          player_sets?: (DatabasePlayerSet & {
            players?: ResponseNill;
          })[];
          rounds?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/player/playersets/${id}/${eliminationid}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Refresh all player qualification total scores in a compeition by competition id.
     *
     * @tags Player
     * @name RefreshTotalscoresPartialUpdate
     * @summary Refresh all player qualification total scores in a compeition by competition id.
     * @request PATCH:/player/refresh/totalscores/{competitionid}
     */
    refreshTotalscoresPartialUpdate: (competitionid: number, params: RequestParams = {}) =>
      this.request<ResponseNill, ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/player/refresh/totalscores/${competitionid}`,
        method: "PATCH",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Just in case api. Create one RoundEnd by round id, IsComfirmed is false. Should not be used, just in case function, PostPlayer is used to create player, rounds, roundends, roundscores. Structural rescue operation restricted to an approved Admin of the target competition; cannot exceed six ends per round.
     *
     * @tags Player
     * @name RoundendCreate
     * @summary Create one RoundEnd by Round ID.
     * @request POST:/player/roundend
     */
    roundendCreate: (
      RoundEnd: EndpointPostRoundEndRoundEndData & {
        round_scores?: ResponseNill;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        DatabaseRoundEnd,
        ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/player/roundend`,
        method: "POST",
        body: RoundEnd,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Just in case api. Need to modify to refresh total scores. Create one RoundScore by roundend id. Update total score in player, round, roundend for one arrow score. Should not be used, just in case function, PostPlayer is used to create player, rounds, roundends, roundscores. Structural rescue operation restricted to an approved Admin of the target competition; cannot append to a confirmed end or exceed six arrows.
     *
     * @tags Player
     * @name RoundscoreCreate
     * @summary Create one RoundScore by RoundEnd ID.
     * @request POST:/player/roundscore
     */
    roundscoreCreate: (RoundScore: EndpointUpdateTotalScoreData, params: RequestParams = {}) =>
      this.request<
        DatabaseRoundScore,
        ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/player/roundscore`,
        method: "POST",
        body: RoundScore,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update one qualification arrow and atomically recompute round/player totals. Approved Judge/Admin may edit confirmed ends; a Player is limited to an unconfirmed current end on their own lane.
     *
     * @tags Player
     * @name RoundscorePartialUpdate
     * @summary Update one Player score by id.
     * @request PATCH:/player/roundscore/{roundscoreid}
     */
    roundscorePartialUpdate: (roundscoreid: number, data: EndpointUpdateTotalScoreData, params: RequestParams = {}) =>
      this.request<ResponseNill, ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse>({
        path: `/player/roundscore/${roundscoreid}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Player with rounds, roundends, roundscores by id.
     *
     * @tags Player
     * @name ScoresDetail
     * @summary Show one Player with scores.
     * @request GET:/player/scores/{id}
     */
    scoresDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        DatabasePlayer & {
          player_sets?: ResponseNill;
          rounds?: DatabaseRound & {
            round_ends?: DatabaseRoundEnd & {
              round_scores?: DatabaseRoundScore;
            };
          };
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/player/scores/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Player shootoffScore by id. Rescue operation restricted to an approved Judge or Admin of the target competition.
     *
     * @tags Player
     * @name ShootoffscorePartialUpdate
     * @summary Update one Player shootoffScore by id.
     * @request PATCH:/player/shootoffscore/{id}
     */
    shootoffscorePartialUpdate: (
      id: number,
      data: EndpointPutPlayerShootoffScoreUpdateShootoffScoreData,
      params: RequestParams = {},
    ) =>
      this.request<
        DatabasePlayer & {
          player_sets?: ResponseNill;
          rounds?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/player/shootoffscore/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Just in case api. Recompute one Player total score from persisted arrows. Rescue operation restricted to an approved Judge or Admin of the target competition; the submitted aggregate is ignored.
     *
     * @tags Player
     * @name TotalscorePartialUpdate
     * @summary Update one Player total score by id.
     * @request PATCH:/player/totalscore/{id}
     */
    totalscorePartialUpdate: (
      id: number,
      data: EndpointPutPlayerTotalScoreByplayerIdUpdateTotalScoreData,
      params: RequestParams = {},
    ) =>
      this.request<ResponseNill, ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse>({
        path: `/player/totalscore/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Player without other data by id.
     *
     * @tags Player
     * @name PlayerDetail
     * @summary Show one Player info without other data.
     * @request GET:/player/{id}
     */
    playerDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        DatabasePlayer & {
          player_sets?: ResponseNill;
          rounds?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/player/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Delete one Player by id, delete related round, roundend, roundscore data, and playerNum minus one in lane. Requires an approved Admin of the Player's competition.
     *
     * @tags Player
     * @name PlayerDelete
     * @summary Delete one Player by id.
     * @request DELETE:/player/{id}
     */
    playerDelete: (id: number, params: RequestParams = {}) =>
      this.request<
        ResponseDeleteSuccessResponse,
        ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/player/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * @description Create one Player by participant id. Create related rounds by laneNum of competition, create 6 roundscores for each 6 roundends, UnassignedLane playerNum ++. Order is 0, TotalScore is 0, ShootOffScore is -1, Rank is 0. Group is unassigned group, Lane is unassigned lane. Will copy data from participant, user, competition. Requires an approved target-competition Admin and an approved Player Participant. Judge Participants can never create a Player. Creation of Player, rounds, ends, and arrows is atomic.
     *
     * @tags Player
     * @name PlayerCreate
     * @summary Create one Player by Participant ID.
     * @request POST:/player/{participantid}
     */
    playerCreate: (participantid: number, params: RequestParams = {}) =>
      this.request<
        DatabasePlayer & {
          player_sets?: ResponseNill;
          rounds?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/player/${participantid}`,
        method: "POST",
        format: "json",
        ...params,
      }),
  };
  playerset = {
    /**
     * @description Post player set, and build player set match table If team size is 1, set name will be player name
     *
     * @tags PlayerSet
     * @name PlayersetCreate
     * @summary Post player set
     * @request POST:/playerset
     */
    playersetCreate: (data: EndpointPostPlayerSetPlayerSetData, params: RequestParams = {}) =>
      this.request<
        DatabasePlayerSet & {
          players?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/playerset`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get player sets which have medals by elimination id
     *
     * @tags PlayerSet
     * @name EliminationMedalDetail
     * @summary Get player sets which have medals by elimination id
     * @request GET:/playerset/elimination/medal/{eliminationid}
     */
    eliminationMedalDetail: (eliminationid: number, params: RequestParams = {}) =>
      this.request<
        EndpointGetPlayerSetsByMedalByEliminationIdPlayerSetData[],
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/playerset/elimination/medal/${eliminationid}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get all player sets by elimination id
     *
     * @tags PlayerSet
     * @name EliminationDetail
     * @summary Get all player sets by elimination id
     * @request GET:/playerset/elimination/{eliminationid}
     */
    eliminationDetail: (eliminationid: number, params: RequestParams = {}) =>
      this.request<DatabasePlayerSet[], ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/playerset/elimination/${eliminationid}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Creates one PlayerSet per saved qualification rank. Count defaults to the qualification advancing_num. Requires a competition Admin.
     *
     * @tags PlayerSet
     * @name EliminationAutoCreate
     * @summary Auto-create individual elimination player sets
     * @request POST:/playerset/elimination/{eliminationid}/auto
     */
    eliminationAutoCreate: (
      eliminationid: number,
      data: EndpointAutoCreatePlayerSetsRequest,
      params: RequestParams = {},
    ) =>
      this.request<EndpointAutoCreatePlayerSetsResponse, ResponseErrorResponse>({
        path: `/playerset/elimination/${eliminationid}/auto`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns every player set in its current manual or automatic order, with team total score, X count, and pure ten count. Requires a competition Admin.
     *
     * @tags PlayerSet
     * @name EliminationRankingDetail
     * @summary Show an elimination's player set ranking
     * @request GET:/playerset/elimination/{eliminationid}/ranking
     */
    eliminationRankingDetail: (eliminationid: number, params: RequestParams = {}) =>
      this.request<EndpointPlayerSetRankingResponse, ResponseErrorResponse | ResponseErrorInternalErrorResponse>({
        path: `/playerset/elimination/${eliminationid}/ranking`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Updates every player set of the elimination as one transaction. expected_player_set_ids must equal the ranking order loaded by the caller. A player set ID that belongs to a different elimination returns 400; a stale snapshot (order changed, or a set added/removed concurrently) returns 409. Requires a competition Admin. It remains available while a new bracket roster is open.
     *
     * @tags PlayerSet
     * @name EliminationRankingPartialUpdate
     * @summary Manually reorder an elimination's player set ranking
     * @request PATCH:/playerset/elimination/{eliminationid}/ranking
     */
    eliminationRankingPartialUpdate: (
      eliminationid: number,
      Ranking: EndpointUpdatePlayerSetRankingRequest,
      params: RequestParams = {},
    ) =>
      this.request<EndpointPlayerSetRankingResponse, ResponseErrorResponse | ResponseErrorInternalErrorResponse>({
        path: `/playerset/elimination/${eliminationid}/ranking`,
        method: "PATCH",
        body: Ranking,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Recomputes and writes a contiguous rank for every player set of the elimination, ordered by team total score, X count, then pure ten count. Requires a competition Admin. It remains available while a new bracket roster is open.
     *
     * @tags PlayerSet
     * @name EliminationRankingAutoPartialUpdate
     * @summary Auto-rank an elimination's player sets by score
     * @request PATCH:/playerset/elimination/{eliminationid}/ranking/auto
     */
    eliminationRankingAutoPartialUpdate: (eliminationid: number, params: RequestParams = {}) =>
      this.request<EndpointPlayerSetRankingResponse, ResponseErrorResponse | ResponseErrorInternalErrorResponse>({
        path: `/playerset/elimination/${eliminationid}/ranking/auto`,
        method: "PATCH",
        format: "json",
        ...params,
      }),

    /**
     * @description Put player set name
     *
     * @tags PlayerSet
     * @name NamePartialUpdate
     * @summary Put player set name
     * @request PATCH:/playerset/name/{id}
     */
    namePartialUpdate: (id: number, data: EndpointPutPlayerSetNamePlayerSetData, params: RequestParams = {}) =>
      this.request<void, ResponseErrorReceiveDataFormatResponse | ResponseErrorInternalErrorResponse>({
        path: `/playerset/name/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Deprecated: use PATCH /playerset/elimination/{eliminationid}/ranking/auto. Recomputes and writes a contiguous rank for every player set of the elimination by score.
     *
     * @tags PlayerSet
     * @name PrerankingPartialUpdate
     * @summary Put player set rank
     * @request PATCH:/playerset/preranking/{eliminationid}
     * @deprecated
     */
    prerankingPartialUpdate: (eliminationid: number, params: RequestParams = {}) =>
      this.request<void, ResponseErrorResponse | ResponseErrorInternalErrorResponse>({
        path: `/playerset/preranking/${eliminationid}`,
        method: "PATCH",
        ...params,
      }),

    /**
     * @description Get player set with players by id
     *
     * @tags PlayerSet
     * @name PlayersetDetail
     * @summary Get player set with players by id
     * @request GET:/playerset/{id}
     */
    playersetDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        DatabasePlayerSet & {
          players?: DatabasePlayer & {
            player_sets?: ResponseNill;
            rounds?: ResponseNill;
          };
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/playerset/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Delete player set, and delete player set match table
     *
     * @tags PlayerSet
     * @name PlayersetDelete
     * @summary Delete player set
     * @request DELETE:/playerset/{id}
     */
    playersetDelete: (id: number, params: RequestParams = {}) =>
      this.request<
        ResponseDeleteSuccessResponse,
        ResponseErrorIdResponse | ResponseErrorResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/playerset/${id}`,
        method: "DELETE",
        ...params,
      }),
  };
  qualification = {
    /**
     * @description Get one Qualification with Lanes and Players by id
     *
     * @tags Qualification
     * @name LanesPlayersDetail
     * @summary Show one Qualification
     * @request GET:/qualification/lanes/players/{id}
     */
    lanesPlayersDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        DatabaseQualification & {
          lanes?: DatabaseLane & {
            players?: DatabasePlayer & {
              player_sets?: ResponseNill;
              rounds?: ResponseNill;
            };
          };
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/qualification/lanes/players/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Qualification with Unassigned Lanes by id.
     *
     * @tags Qualification
     * @name LanesUnassignedDetail
     * @summary Show one Qualification with Unassigned Lanes.
     * @request GET:/qualification/lanes/unassigned/{id}
     */
    lanesUnassignedDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        (DatabaseQualification & {
          lanes?: DatabaseLane & {
            players?: DatabasePlayer & {
              player_sets?: ResponseNill;
              rounds?: ResponseNill;
            };
          };
        })[],
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/qualification/lanes/unassigned/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Qualification with Lanes by id.
     *
     * @tags Qualification
     * @name LanesDetail
     * @summary Show one Qualification with Lanes.
     * @request GET:/qualification/lanes/{id}
     */
    lanesDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        DatabaseQualification & {
          lanes?: DatabaseLane & {
            players?: ResponseNill;
          };
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/qualification/lanes/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Qualification without Lanes by id.
     *
     * @tags Qualification
     * @name QualificationDetail
     * @summary Show one Qualification without Lanes.
     * @request GET:/qualification/{id}
     */
    qualificationDetail: (id: number, params: RequestParams = {}) =>
      this.request<
        DatabaseQualification & {
          lanes?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/qualification/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Put whole new Qualification and overwrite with the id, and update lanes below it ,but cannot replace groupid.
     *
     * @tags Qualification
     * @name QualificationUpdate
     * @summary Update one Qualification.
     * @request PUT:/qualification/{id}
     */
    qualificationUpdate: (
      id: number,
      Qualification: EndpointPutQualificationByIDQualificationPutData,
      params: RequestParams = {},
    ) =>
      this.request<DatabaseQualification, ResponseErrorIdResponse | ResponseErrorInternalErrorResponse>({
        path: `/qualification/${id}`,
        method: "PUT",
        body: Qualification,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  session = {
    /**
     * @description Get a session.
     *
     * @tags Session
     * @name SessionCreate
     * @summary login
     * @request POST:/session
     */
    sessionCreate: (LoginInfo: EndpointLoginInfo, params: RequestParams = {}) =>
      this.request<ResponseResponse, ResponseErrorReceiveDataFormatResponse | ResponseErrorResponse>({
        path: `/session`,
        method: "POST",
        body: LoginInfo,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete the session.
     *
     * @tags Session
     * @name SessionDelete
     * @summary logout
     * @request DELETE:/session
     */
    sessionDelete: (params: RequestParams = {}) =>
      this.request<ResponseResponse, any>({
        path: `/session`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  swagger = {
    /**
     * @description get Api docs in json
     *
     * @tags docs
     * @name DocJsonList
     * @summary Show Api Docs in json
     * @request GET:/swagger/doc.json
     */
    docJsonList: (params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/swagger/doc.json`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  user = {
    /**
     * @description Add a user to db. Username cannot be empty or repeated. Password cannot be empty. Email cannot be empty or repeated. Institution id must exist. Realname and overview are optional. Role is set to User.
     *
     * @tags User
     * @name UserCreate
     * @summary Register a user.
     * @request POST:/user
     */
    userCreate: (AccountInfo: EndpointAccountInfo, params: RequestParams = {}) =>
      this.request<DatabaseUser, ResponseResponse>({
        path: `/user`,
        method: "POST",
        body: AccountInfo,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get my uid in the session.
     *
     * @tags User
     * @name GetUser
     * @summary Get my uid.
     * @request GET:/user/me
     */
    getUser: (params: RequestParams = {}) =>
      this.request<EndpointGetUserIDID, ResponseResponse>({
        path: `/user/me`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Modify user's password. Original/New password cannot be empty. Original password must be correct. New password cannot be the same as original password.
     *
     * @tags User
     * @name PasswordPartialUpdate
     * @summary Modify user's password.
     * @request PATCH:/user/password/{id}
     */
    passwordPartialUpdate: (id: number, ModifyInfo: EndpointModifyAccountPasswordInfo, params: RequestParams = {}) =>
      this.request<ResponseResponse, ResponseResponse>({
        path: `/user/password/${id}`,
        method: "PATCH",
        body: ModifyInfo,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get a user's username, overview, and institution id.
     *
     * @tags User
     * @name UserDetail
     * @summary Get a user's information.
     * @request GET:/user/{id}
     */
    userDetail: (id: number, params: RequestParams = {}) =>
      this.request<DatabaseUser, ResponseResponse>({
        path: `/user/${id}`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Modify username, realname, email, overview, and institution_id. Cannot change password. Username cannot be empty, repeated. Email cannot be empty, repeated.
     *
     * @tags User
     * @name UserUpdate
     * @summary Modify user's information.
     * @request PUT:/user/{id}
     */
    userUpdate: (id: number, ModifyInfo: EndpointModifyInfoModifyUser, params: RequestParams = {}) =>
      this.request<ResponseResponse, ResponseResponse>({
        path: `/user/${id}`,
        method: "PUT",
        body: ModifyInfo,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };

  // Backward-compatible aliases used throughout the existing frontend.
  groupInfo = this.groupinfo;
  matchResult = this.matchresult;
  matchEnd = this.matchresult;
  playerSet = this.playerset;
}
