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
  stage_id?: number;
}

export interface DatabaseMatchEnd {
  id?: number;
  is_confirmed?: boolean;
  match_result_id?: number;
  match_scores?: DatabaseMatchScore[];
  total_scores?: number;
}

export interface DatabaseMatchResult {
  id?: number;
  is_winner?: boolean;
  lane_number?: number;
  match_ends?: DatabaseMatchEnd[];
  match_id?: number;
  player_set?: DatabasePlayerSet;
  player_set_id?: number;
  shoot_off_score?: number;
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

export interface EndpointLoginInfo {
  password?: string;
  user_name?: string;
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

export interface EndpointPutMatchResultIsWinnerByIdMatchResultIsWinnerData {
  is_winner?: boolean;
}

export interface EndpointPutMatchResultLaneNumberByIdMatchResultLaneNumberData {
  lane_number?: number;
}

export interface EndpointPutMatchResultShootOffScoreByIdMatchResultShootOffScoreData {
  shoot_off_score?: number;
}

export interface EndpointPutMatchResultTotalPointsByIdMatchResultTotalPointsData {
  total_points?: number;
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

export type ResponseNill = object;

export interface ResponseResponse {
  /** @example "result description" */
  message?: string;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
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

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null
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

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "//localhost:8080/api",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
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
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem)
        );
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

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
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
 * @baseUrl //localhost:80/api
 * @contact NYCUArchery (https://github.com/NYCUarchery)
 *
 * Gin swagger
 */
export class Api<
  SecurityDataType extends unknown
> extends HttpClient<SecurityDataType> {
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
    competitionCreate: (Competition: string, params: RequestParams = {}) =>
      this.request<any, string>({
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
    currentPhasePlusUpdate: (id: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/competition/current-phase/plus/${id}`,
        method: "PATCH",
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
    currentDetail: (
      head: string,
      tail: string,
      query: {
        /** head */
        head: number;
        /** tail */
        tail: number;
      },
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
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
    eliminationIsactiveUpdate: (id: string, params: RequestParams = {}) =>
      this.request<any, string>({
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
    groupsPlayersPlayertotalUpdate: (id: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/competition/groups/players/playertotal/${id}`,
        method: "PUT",
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
    mixedEliminationIsactiveUpdate: (id: string, params: RequestParams = {}) =>
      this.request<any, string>({
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
    qualificationCurrentEndMinusUpdate: (
      id: string,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
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
    qualificationCurrentEndPlusUpdate: (
      id: string,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
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
    qualificationIsactiveUpdate: (id: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/competition/qualification-isactive/${id}`,
        method: "PATCH",
        ...params,
      }),

    /**
     * @description Refresh competition player total score by competition id.
     *
     * @tags Competition
     * @name RefreshGroupsPlayersPlayertotalscorePartialUpdate
     * @summary Refresh competition player total score by competition id.
     * @request PATCH:/competition/refresh/groups/players/playertotalscore/{id}
     */
    recentDetail: (
      userid: string,
      head: string,
      tail: string,
      query: {
        /** User ID */
        userid: number;
        /** head */
        head: number;
        /** tail */
        tail: number;
      },
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/competition/recent/${userid}/${head}/${tail}`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Refresh all player ranking of different groups in one Competition.
     *
     * @tags Competition
     * @name TeamEliminationIsactiveUpdate
     * @summary update one Competition Team Elimination Active to be true and create all team elimination for groups
     * @request PUT:/competition/team-elimination-isactive/{id}
     */
    teamEliminationIsactiveUpdate: (id: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/competition/team-elimination-isactive/${id}`,
        method: "PUT",
        ...params,
      }),

    /**
     * @description Put whole new Competition and overwrite with the id but without GroupInfo, cannot replace RoundNum, GroupNum, LaneNum, unassignedLaneId, unassignedGroupId zeroTime 0001-01-01T00:00:00+00:01
     *
     * @tags Competition
     * @name WholeUpdate
     * @summary update one Competition without GroupInfo
     * @request PUT:/competition/whole/{id}
     */
    wholeUpdate: (
      id: string,
      Competition: string,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/competition/whole/${id}`,
        method: "PUT",
        body: Competition,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Competition by id without GroupInfo zeroTime 0001-01-01T00:00:00+00:01
     *
     * @tags Competition
     * @name CompetitionDetail
     * @summary Show one Competition without GroupInfo
     * @request GET:/competition/{id}
     */
    competitionDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/competition/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description delete one Competition by id, delete all related groups, lanes, players
     *
     * @tags Competition
     * @name CompetitionDelete
     * @summary delete one Competition
     * @request DELETE:/competition/{id}
     */
    competitionDelete: (id: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/competition/${id}`,
        method: "DELETE",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  qualification = {
    /**
     * @description Get one Qualification with Unassigned Lanes by id
     *
     * @tags Qualification
     * @name QualificationLanesUnassignedDetail
     * @summary Show one Qualification
     * @request GET:qualification/lanes/Unassigned/{id}
     */
    qualificationLanesUnassignedDetail: (
      id: number,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `qualification/lanes/Unassigned/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Qualification with Lanes and Players by id
     *
     * @tags Qualification
     * @name QualificationLanesPlayersDetail
     * @summary Show one Qualification
     * @request GET:qualification/lanes/players/{id}
     */
    qualificationLanesPlayersDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `qualification/lanes/players/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Qualification with Lanes by id
     *
     * @tags Qualification
     * @name LanesDetail
     * @summary Show one Qualification
     * @request GET:/qualification/lanes/{id}
     */
    lanesDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/qualification/lanes/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Put whole new Qualification and overwrite with the id, and update lanes below it ,but cannot replace groupid
     *
     * @tags Qualification
     * @name WholeUpdate
     * @summary update one Qualification
     * @request PUT:/qualification/whole/{id}
     */
    wholeUpdate: (id: string, Qualification: any, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/qualification/whole/${id}`,
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
    qualificationDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/qualification/${id}`,
        method: "GET",
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
    eliminationCreate: (Elimination: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/elimination`,
        method: "POST",
        body: Elimination,
        type: ContentType.Json,
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
    currentendMinusUpdate: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
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
    currentendPlusUpdate: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
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
    currentstageMinusUpdate: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
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
    currentstagePlusUpdate: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
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
    matchCreate: (Match: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/elimination/match`,
        method: "POST",
        body: Match,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Match with matchResults, matchEnds, scores, playerSets, players by id
     *
     * @tags Elimination
     * @name MatchScoresDetail
     * @summary Show one Match with all related data
     * @request GET:/elimination/match/scores/{matchid}
     */
    matchScoresDetail: (matchid: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/elimination/match/scores/${matchid}`,
        method: "GET",
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
    stageCreate: (Stage: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/elimination/stage`,
        method: "POST",
        body: Stage,
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
    stagesDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/elimination/stages/${id}`,
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
      this.request<any, string>({
        path: `/elimination/${id}`,
        method: "DELETE",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  groupInfo = {
    /**
     * @description Post one new GroupInfo data with new id Create qualification with same id Auto write GroupIndex Auto create elimination
     *
     * @tags GroupInfo
     * @name GroupinfoCreate
     * @summary Create one GroupInfo
     * @request POST:/groupinfo
     */
    groupinfoCreate: (GroupInfo: string, params: RequestParams = {}) =>
      this.request<any, string>({
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
    orderingUpdate: (groupIdsForReorder: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/groupinfo/ordering`,
        method: "PATCH",
        body: groupIdsForReorder,
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
    groupinfoDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
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
    groupinfoDelete: (id: string, params: RequestParams = {}) =>
      this.request<any, string>({
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
    institutionCreate: (
      NewInstitutionInfo: EndpointNewInstitutionInfo,
      params: RequestParams = {}
    ) =>
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
  matchResult = {
    /**
     * @description Update one MatchResult isWinner by id
     *
     * @tags MatchResult
     * @name IswinnerPartialUpdate
     * @summary Update one MatchResult isWinner
     * @request PATCH:/matchresult/iswinner/{id}
     */
    iswinnerPartialUpdate: (
      id: number,
      MatchResult: string,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/matchresult/iswinner/${id}`,
        method: "PATCH",
        body: MatchResult,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Update one MatchResult laneNumber by id
     *
     * @tags MatchResult
     * @name LanenumberPartialUpdate
     * @summary Update one MatchResult laneNumber
     * @request PATCH:/matchresult/lanenumber/{id}
     */
    lanenumberPartialUpdate: (
      id: number,
      MatchResult: string,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/matchresult/lanenumber/${id}`,
        method: "PATCH",
        body: MatchResult,
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
     * @description Update one MatchResult shootOffScore by id
     *
     * @tags MatchResult
     * @name ShootoffscorePartialUpdate
     * @summary Update one MatchResult shootOffScore
     * @request PATCH:/matchresult/shootoffscore/{id}
     */
    shootoffscorePartialUpdate: (
      id: number,
      MatchResult: string,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/matchresult/shootoffscore/${id}`,
        method: "PATCH",
        body: MatchResult,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Update one MatchResult totalPoints by id
     *
     * @tags MatchResult
     * @name TotalpointsPartialUpdate
     * @summary Update one MatchResult totalPoints
     * @request PATCH:/matchresult/totalpoints/{id}
     */
    totalpointsPartialUpdate: (
      id: number,
      MatchResult: string,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/matchresult/totalpoints/${id}`,
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
      this.request<any, string>({
        path: `/matchresult/${id}`,
        method: "DELETE",
        ...params,
      }),
  };
  matchEnd = {
    /**
     * @description Post one new MatchEnd data, Auto write totalScores IsConfirmed, and auto create matchScores by teamSize teamSize: 1, 2, 3
     *
     * @tags MatchEnd
     * @name MatchendCreate
     * @summary Create one MatchEnd
     * @request POST:/matchresult/matchend
     */
    scoreUpdate: (id: number, MatchScore: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/matchscore/score/${id}`,
        method: "PUT",
        body: MatchScore,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update one MatchEnd isConfirmed by id
     *
     * @tags MatchEnd
     * @name MatchendIsconfirmedPartialUpdate
     * @summary Update one MatchEnd isConfirmed
     * @request PATCH:/matchresult/matchend/isconfirmed/{id}
     */
    matchendIsconfirmedPartialUpdate: (
      id: number,
      PlayerSetId: string,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/medal/playersetid/${id}`,
        method: "PUT",
        body: PlayerSetId,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Update one MatchEnd totalScores by id and all related MatchScores by MatchScore ids MatchScore ids and scores must be the same length
     *
     * @tags MatchEnd
     * @name MatchendScoresPartialUpdate
     * @summary Update one MatchEnd scores
     * @request PATCH:/matchresult/matchend/scores/{id}
     */
    oldlaneinfoCreate: (LaneData: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/oldlaneinfo`,
        method: "POST",
        body: LaneData,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Update one MatchEnd totalScores by id
     *
     * @tags MatchEnd
     * @name MatchendTotalscorePartialUpdate
     * @summary Update one MatchEnd totalScores
     * @request PATCH:/matchresult/matchend/totalscore/{id}
     */
    confirmUpdate: (
      id: string,
      stageindex: string,
      userindex: string,
      confirm: string,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/oldlaneinfo/confirm/${id}/${stageindex}/${userindex}/${confirm}`,
        method: "PUT",
        type: ContentType.Json,
        ...params,
      }),
  };
  matchScore = {
    /**
     * @description Update one MatchScore score by id Also update related MatchEnd totalScores
     *
     * @tags MatchScore
     * @name MatchscoreScorePartialUpdate
     * @summary Update one MatchScore score
     * @request PATCH:/matchresult/matchscore/score/{id}
     */
    scoreUpdate: (
      id: string,
      stageindex: string,
      userindex: string,
      arrowindex: string,
      score: string,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/oldlaneinfo/score/${id}/${stageindex}/${userindex}/${arrowindex}/${score}`,
        method: "PUT",
        type: ContentType.Json,
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
    wholeUpdate: (id: string, LaneData: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/oldlaneinfo/whole/${id}`,
        method: "PUT",
        body: LaneData,
        type: ContentType.Json,
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
    oldlaneinfoDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/oldlaneinfo/${id}`,
        method: "GET",
        format: "json",
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
    oldlaneinfoDelete: (id: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/oldlaneinfo/${id}`,
        method: "DELETE",
        type: ContentType.Json,
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
    participantCreate: (
      NewParticipantInfo: EndpointNewParticipantInfo,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/participant/`,
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
    competitionUserDetail: (
      competitionid: number,
      userid: number,
      params: RequestParams = {}
    ) =>
      this.request<
        DatabaseParticipant[],
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
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
    competitionUserList: (
      user_id: number,
      competition_id: number,
      params: RequestParams = {}
    ) =>
      this.request<string, string>({
        path: `/participant/competition/user/${competition_id}/${user_id}`,
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
    userList: (user_id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/participant/user`,
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
    wholeUpdate: (id: string, Participant: any, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/participant/whole/${id}`,
        method: "PUT",
        body: Participant,
        type: ContentType.Json,
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
    participantDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/participant/${id}`,
        method: "PUT",
        body: Participant,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete one Participant by id. This api is intentionally designed not to delete related data, because a user may drop out of competition, but competition still need the record.
     *
     * @tags Participant
     * @name ParticipantDelete
     * @summary Delete one Participant.
     * @request DELETE:/participant/{id}
     */
    participantDelete: (id: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/participant/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  player = {
    /**
     * @description Update all scores of one end by end id Will auto update player total score Should have a 6 element array scores array
     *
     * @tags Player
     * @name AllEndscoresPartialUpdate
     * @summary Update all scores of one end by end id
     * @request PUT:/player/all-endscores/{id}
     */
    allEndscoresUpdate: (
      id: number,
      scores: EndpointPutPlayerAllEndScoresByEndIdEndScores,
      params: RequestParams = {}
    ) =>
      this.request<
        ResponseNill,
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
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
     * @description Update one Player groupId by id, and change player laneid to Unassigned lane.
     *
     * @tags Player
     * @name GroupidUpdate
     * @summary Update one Player groupId by id
     * @request PUT:/player/groupid/{playerid}/{groupid}
     */
    groupidUpdate: (
      playerid: number,
      groupid: string,
      params: RequestParams = {}
    ) =>
      this.request<
        DatabasePlayer & {
          player_sets?: ResponseNill;
          rounds?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/player/group/${id}`,
        method: "PATCH",
        body: groupid,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Player isConfirmed by id.
     *
     * @tags Player
     * @name IsconfirmedUpdate
     * @summary Update one Player isConfirmed by id
     * @request PUT:/player/isconfirmed/{roundendid}
     */
    isconfirmedPartialUpdate: (
      roundendid: number,
      body: any,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/player/isconfirmed/${roundendid}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Player laneId by id, update lane playernum.
     *
     * @tags Player
     * @name LaneidUpdate
     * @summary Update one Player laneId by id
     * @request PUT:/player/laneid/{playerid}
     */
    laneUpdate: (
      id: number,
      data: EndpointPutPlayerLaneIdUpdateLaneIdData,
      params: RequestParams = {}
    ) =>
      this.request<
        DatabasePlayer & {
          player_sets?: ResponseNill;
          rounds?: ResponseNill;
        },
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/player/lane/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Player order by id.
     *
     * @tags Player
     * @name OrderUpdate
     * @summary Update one Player order by id
     * @request PUT:/player/order/{id}
     */
    orderUpdate: (id: number, body: any, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/player/order/${id}`,
        method: "PUT",
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
    playersetsDetail: (
      id: number,
      eliminationid: number,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/player/playersets/${id}/${eliminationid}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Just in case api. Create one RoundEnd by round id, IsComfirmed is false. Should not be used, just in case function, PostPlayer is used to create player, rounds, roundends, roundscores.
     *
     * @tags Player
     * @name RoundendCreate
     * @summary Create one RoundEnd by Round ID.
     * @request POST:/player/roundend
     */
    roundendCreate: (params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/player/roundend`,
        method: "POST",
        body: RoundEnd,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Just in case api. Need to modify to refresh total scores. Create one RoundScore by roundend id. Update total score in player, round, roundend for one arrow score. Should not be used, just in case function, PostPlayer is used to create player, rounds, roundends, roundscores.
     *
     * @tags Player
     * @name RoundscoreCreate
     * @summary Create one RoundScore by RoundEnd ID.
     * @request POST:/player/roundscore
     */
    roundscoreCreate: (params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/player/roundscore`,
        method: "POST",
        body: RoundScore,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Player score by id. Update doesn't change total score in player, round, roundend.
     *
     * @tags Player
     * @name ScoreUpdate
     * @summary Update one Player score by id
     * @request PUT:/player/score/{roundscoreid}
     */
    roundscoreUpdate: (
      roundscoreid: number,
      data: EndpointUpdateTotalScoreData,
      params: RequestParams = {}
    ) =>
      this.request<
        ResponseNill,
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
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
     * @description Update one Player shootoffScore by id.
     *
     * @tags Player
     * @name ShootoffscoreUpdate
     * @summary Update one Player shootoffScore by id
     * @request PUT:/player/shootoffscore/{id}
     */
    shootoffscoreUpdate: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/player/shootoffscore/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Player total score by id.
     *
     * @tags Player
     * @name TotalscoreUpdate
     * @summary Update one Player total score by id
     * @request PUT:/player/totalscore/{id}
     */
    totalscoreUpdate: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
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
     * @description Delete one Player by id, delete related round, roundend, roundscore data, and playerNum minus one in lane.
     *
     * @tags Player
     * @name PlayerDelete
     * @summary Delete one Player by id.
     * @request DELETE:/player/{id}
     */
    playerDelete: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/player/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * @description Create one Player by participant id. Create related rounds by laneNum of competition, create 6 roundscores for each 6 roundends, UnassignedLane playerNum ++. Order is 0, TotalScore is 0, ShootOffScore is -1, Rank is 0. Group is unassigned group, Lane is unassigned lane. Will copy data from participant, user, competition.
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
        ResponseErrorIdResponse | ResponseErrorInternalErrorResponse
      >({
        path: `/player/${participantid}`,
        method: "POST",
        format: "json",
        ...params,
      }),
  };
  playerSet = {
    /**
     * @description Post player set, and build player set match table If team size is 1, set name will be player name
     *
     * @tags PlayerSet
     * @name PlayersetCreate
     * @summary Post player set
     * @request POST:/playerset
     */
    playersetCreate: (data: string, params: RequestParams = {}) =>
      this.request<any, string>({
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
    eliminationMedalDetail: (
      eliminationid: number,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
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
      this.request<any, string>({
        path: `/playerset/elimination/${eliminationid}`,
        method: "GET",
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
    nameUpdate: (id: number, data: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/playerset/name/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Put player set rank by elimination id
     *
     * @tags PlayerSet
     * @name PrerankingPartialUpdate
     * @summary Put player set rank
     * @request PATCH:/playerset/preranking/{eliminationid}
     */
    prerankingUpdate: (eliminationid: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/playerset/preranking/${eliminationid}`,
        method: "PUT",
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
      this.request<any, string>({
        path: `/playerset/${id}`,
        method: "DELETE",
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
      this.request<any, string>({
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
  docs = {
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
     * @description Add a user to db. Username cannot be empty or repeated. Password cannot be empty. Email cannot be empty or repeated.
     *
     * @tags User
     * @name UserCreate
     * @summary Register a user.
     * @request POST:/user
     */
    userCreate: (
      AccountInfo: EndpointAccountInfo,
      params: RequestParams = {}
    ) =>
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
    passwordUpdate: (
      id: string,
      ModifyInfo: EndpointModifyAccountPasswordInfo,
      params: RequestParams = {}
    ) =>
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
    userUpdate: (
      id: string,
      ModifyInfo: DatabaseUser,
      params: RequestParams = {}
    ) =>
      this.request<ResponseResponse, ResponseResponse>({
        path: `/user/${id}`,
        method: "PUT",
        body: ModifyInfo,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
