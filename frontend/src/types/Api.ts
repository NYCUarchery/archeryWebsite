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

export interface EndpointLoginInfo {
  password?: string;
  user_name?: string;
}

export interface EndpointModifyAccountPasswordInfo {
  new_password?: string;
  original_password?: string;
}

export interface EndpointNewInstitutionInfo {
  name?: string;
}

export interface EndpointNewParticipantInfo {
  competition_id?: number;
  role?: string;
  user_id?: number;
}

export interface EndpointPutPlayerAllEndScoresByEndIdEndScores {
  scores?: number[];
}

export interface ResponseResponse {
  /** @example "result description" */
  result?: string;
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
 * @baseUrl //localhost:8080/api
 * @contact NYCUArchery (https://github.com/NYCUarchery)
 *
 * Gin swagger
 */
export class Api<
  SecurityDataType extends unknown
> extends HttpClient<SecurityDataType> {
  competition = {
    /**
     * @description get information of all the competitions
     *
     * @tags Competition
     * @name CompetitionList
     * @summary get information of all the competitions
     * @request GET:/competition
     */
    competitionList: (params: RequestParams = {}) =>
      this.request<DatabaseCompetition[], string>({
        path: `/competition`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Post one new Competition data with new id, create UnassignedGroup, create Lanes and UnassignedLane which link to UnassignedGroup, add host as admin of competition, and return the new Competition data zeroTime 0001-01-01T00:00:00+00:01
     *
     * @tags Competition
     * @name CompetitionCreate
     * @summary Create one Competition and related data
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
     * @description update one Competition currentPhase --
     *
     * @tags Competition
     * @name CurrentPhasePlusUpdate
     * @summary update one Competition currentPhase --
     * @request PUT:/competition/current-phase/plus/{id}
     */
    currentPhasePlusUpdate: (id: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/competition/current-phase/plus/${id}`,
        method: "PUT",
        ...params,
      }),

    /**
     * @description Get current Competitions, head and tail are the range of most recent competitions For example, head = 0, tail = 10, then return the most recent 10 competitions head >= 0, tail >= 0, head <= tail
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
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description update one Competition Elimination Active to be true
     *
     * @tags Competition
     * @name EliminationIsactiveUpdate
     * @summary update one Competition Elimination Active to be true
     * @request PUT:/competition/elimination-isactive/{id}
     */
    eliminationIsactiveUpdate: (id: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/competition/elimination-isactive/${id}`,
        method: "PUT",
        ...params,
      }),

    /**
     * @description update competition recount player total score
     *
     * @tags Competition
     * @name GroupsPlayersPlayertotalUpdate
     * @summary update competition recount player total score
     * @request PUT:/competition/groups/players/playertotal/{id}
     */
    groupsPlayersPlayertotalUpdate: (id: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/competition/groups/players/playertotal/${id}`,
        method: "PUT",
        format: "json",
        ...params,
      }),

    /**
     * @description Update update all  player ranking of different groups in one Competition
     *
     * @tags Competition
     * @name GroupsPlayersRankUpdate
     * @summary update one Competition Ranking
     * @request PUT:/competition/groups/players/rank/{id}
     */
    groupsPlayersRankUpdate: (id: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/competition/groups/players/rank/${id}`,
        method: "PUT",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Competition by id with GroupInfos and Players
     *
     * @tags Competition
     * @name GroupsPlayersDetail
     * @summary Show one Competition with GroupInfos and Players
     * @request GET:/competition/groups/players/{id}
     */
    groupsPlayersDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/competition/groups/players/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Competition by id with related Groups which have related one Qualification id and many Elimination ids
     *
     * @tags Competition
     * @name GroupsQualieliDetail
     * @summary Show one Competition with Groups Qualification Elimination
     * @request GET:/competition/groups/qualieli/{id}
     */
    groupsQualieliDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/competition/groups/qualieli/${id}`,
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
      this.request<any, string>({
        path: `/competition/groups/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description update one Competition Mixed Elimination Active to be true and create all mixed elimination for groups
     *
     * @tags Competition
     * @name MixedEliminationIsactiveUpdate
     * @summary update one Competition Mixed Elimination Active to be true and create all mixed elimination for groups
     * @request PUT:/competition/mixed-elimination-isactive/{id}
     */
    mixedEliminationIsactiveUpdate: (id: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/competition/mixed-elimination-isactive/${id}`,
        method: "PUT",
        ...params,
      }),

    /**
     * @description Get one Competition by id with Participants
     *
     * @tags Competition
     * @name ParticipantsDetail
     * @summary Show one Competition with Participants
     * @request GET:/competition/participants/{id}
     */
    participantsDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/competition/participants/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description update one Competition Qualification currentEnd --
     *
     * @tags Competition
     * @name QualificationCurrentEndMinusUpdate
     * @summary update one Competition Qualification currentEnd --
     * @request PUT:/competition/qualification-current-end/minus/{id}
     */
    qualificationCurrentEndMinusUpdate: (
      id: string,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/competition/qualification-current-end/minus/${id}`,
        method: "PUT",
        ...params,
      }),

    /**
     * @description update one Competition Qualification currentEnd ++
     *
     * @tags Competition
     * @name QualificationCurrentEndPlusUpdate
     * @summary update one Competition Qualification currentEnd ++
     * @request PUT:/competition/qualification-current-end/plus/{id}
     */
    qualificationCurrentEndPlusUpdate: (
      id: string,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/competition/qualification-current-end/plus/${id}`,
        method: "PUT",
        ...params,
      }),

    /**
     * @description update one Competition Qualification Active to be true
     *
     * @tags Competition
     * @name QualificationIsactiveUpdate
     * @summary update one Competition Qualification Active to be true
     * @request PUT:/competition/qualification-isactive/{id}
     */
    qualificationIsactiveUpdate: (id: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/competition/qualification-isactive/${id}`,
        method: "PUT",
        ...params,
      }),

    /**
     * @description Get recent Competitions by User id, head and tail are the range of most recent competitions For example, head = 0, tail = 10, then return the most recent 10 competitions head >= 0, tail >= 0, head <= tail
     *
     * @tags Competition
     * @name RecentDetail
     * @summary Show recent Competitions dealing with User
     * @request GET:/competition/recent/{userid}/{head}/{tail}
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
     * @description update one Competition Team Elimination Active to be true and create all team elimination for groups
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
        body: Qualification,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Qualification by id
     *
     * @tags Qualification
     * @name QualificationDetail
     * @summary Show one Qualification
     * @request GET:/qualification/{id}
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
     * @name CurrentendMinusUpdate
     * @summary Update one Elimination current end minus one
     * @request PUT:/elimination/currentend/minus/{id}
     */
    currentendMinusUpdate: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/elimination/currentend/minus/${id}`,
        method: "PUT",
        ...params,
      }),

    /**
     * @description Update one Elimination current end plus one by id
     *
     * @tags Elimination
     * @name CurrentendPlusUpdate
     * @summary Update one Elimination current end plus one
     * @request PUT:/elimination/currentend/plus/{id}
     */
    currentendPlusUpdate: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/elimination/currentend/plus/${id}`,
        method: "PUT",
        ...params,
      }),

    /**
     * @description Update one Elimination current stage minus one by id
     *
     * @tags Elimination
     * @name CurrentstageMinusUpdate
     * @summary Update one Elimination current stage minus one
     * @request PUT:/elimination/currentstage/minus/{id}
     */
    currentstageMinusUpdate: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/elimination/currentstage/minus/${id}`,
        method: "PUT",
        ...params,
      }),

    /**
     * @description Update one Elimination current stage plus one by id
     *
     * @tags Elimination
     * @name CurrentstagePlusUpdate
     * @summary Update one Elimination current stage plus one
     * @request PUT:/elimination/currentstage/plus/{id}
     */
    currentstagePlusUpdate: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/elimination/currentstage/plus/${id}`,
        method: "PUT",
        ...params,
      }),

    /**
     * @description Post one new Match data with 2 matchResults Each matchResults with 4 or 5 matchEnds Each matchEnds with 3, 4, 6 matchScores
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
      this.request<any, string>({
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
      this.request<any, string>({
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
     * @description Get one Elimination with stages, matches, matchResults, matchEnds, scores, playerSets, players, medals by id
     *
     * @tags Elimination
     * @name StagesScoresMedalsDetail
     * @summary Show one Elimination with all related data
     * @request GET:/elimination/stages/scores/medals/{id}
     */
    stagesScoresMedalsDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/elimination/stages/scores/medals/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Elimination with stages, matches by id
     *
     * @tags Elimination
     * @name StagesDetail
     * @summary Show one Elimination with stages, matches
     * @request GET:/elimination/stages/{id}
     */
    stagesDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/elimination/stages/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Elimination by id
     *
     * @tags Elimination
     * @name EliminationDetail
     * @summary Show one Elimination
     * @request GET:/elimination/{id}
     */
    eliminationDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
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
     * @description Post one new GroupInfo data with new id, create qualification with same id, auto write GroupIndex, and auto create elimination
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
     * @description Put competition_id and group_ids to update GroupInfos Indexes under the same Competition
     *
     * @tags GroupInfo
     * @name OrderingUpdate
     * @summary update GroupInfos Indexes under the same Competition
     * @request PUT:/groupinfo/ordering
     */
    orderingUpdate: (groupIdsForReorder: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/groupinfo/ordering`,
        method: "PUT",
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
      this.request<any, string>({
        path: `/groupinfo/players/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Put whole new GroupInfo and overwrite with the id, cannot overwrite CompetitionId
     *
     * @tags GroupInfo
     * @name WholeUpdate
     * @summary update one GroupInfo
     * @request PUT:/groupinfo/whole/{id}
     */
    wholeUpdate: (id: string, GroupInfo: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/groupinfo/whole/${id}`,
        method: "PUT",
        body: GroupInfo,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one GroupInfo by id
     *
     * @tags GroupInfo
     * @name GroupinfoDetail
     * @summary Show one GroupInfo
     * @request GET:/groupinfo/{id}
     */
    groupinfoDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/groupinfo/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description delete one GroupInfo by id, delete qualification, and change player to UnassignedGroup and UnassignedLane
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
     * @description get all institution info from db
     *
     * @tags Institution
     * @name InstitutionList
     * @summary get all institution info
     * @request GET:/institution
     */
    institutionList: (params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: DatabaseInstitution[];
        },
        ResponseResponse
      >({
        path: `/institution`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description add an institution to db cannot repeat institution name
     *
     * @tags Institution
     * @name InstitutionCreate
     * @summary create an institution
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
     * @description get institution info from db by id
     *
     * @tags Institution
     * @name InstitutionDetail
     * @summary get institution info by id
     * @request GET:/institution/{id}
     */
    institutionDetail: (id: string, params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: DatabaseInstitution;
        },
        ResponseResponse
      >({
        path: `/institution/${id}`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description delete an institution from db
     *
     * @tags Institution
     * @name InstitutionDelete
     * @summary delete an institution
     * @request DELETE:/institution/{id}
     */
    institutionDelete: (id: string, params: RequestParams = {}) =>
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
     * @description Get all Lane by competition id
     *
     * @tags Lane
     * @name GetLane
     * @summary Show all Lane of a competition
     * @request GET:/lane/all/{id}
     */
    getLane: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/lane/all/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Lane with players, rounds, roundends, roundscores by id
     *
     * @tags Lane
     * @name ScoresDetail
     * @summary Show one Lane with players, rounds, roundends, roundscores
     * @request GET:/lane/scores/{id}
     */
    scoresDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/lane/scores/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Lane by id
     *
     * @tags Lane
     * @name LaneDetail
     * @summary Show one Lane
     * @request GET:/lane/{id}
     */
    laneDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/lane/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  matchEnd = {
    /**
     * @description Update one MatchEnd isConfirmed by id
     *
     * @tags MatchEnd
     * @name IsconfirmedUpdate
     * @summary Update one MatchEnd isConfirmed
     * @request PUT:/matchend/isconfirmed/{id}
     */
    isconfirmedUpdate: (
      id: number,
      MatchEnd: string,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/matchend/isconfirmed/${id}`,
        method: "PUT",
        body: MatchEnd,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Update one MatchEnd totalScores by id and all related MatchScores by MatchScore ids MatchScore ids and scores must be the same length
     *
     * @tags MatchEnd
     * @name ScoresUpdate
     * @summary Update one MatchEnd scores
     * @request PUT:/matchend/scores/{id}
     */
    scoresUpdate: (
      id: number,
      matchEndScoresData: string,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/matchend/scores/${id}`,
        method: "PUT",
        body: matchEndScoresData,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Update one MatchEnd totalScores by id
     *
     * @tags MatchEnd
     * @name TotalscoresUpdate
     * @summary Update one MatchEnd totalScores
     * @request PUT:/matchend/totalscores/{id}
     */
    totalscoresUpdate: (
      id: number,
      MatchEnd: string,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/matchend/totalscores/${id}`,
        method: "PUT",
        body: MatchEnd,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Post one new MatchEnd data, and auto write totalScores IsConfirmed, and auto create matchScores by teamSize
     *
     * @tags MatchEnd
     * @name MatchendCreate
     * @summary Create one MatchEnd
     * @request POST:/matchresult/matchend
     */
    matchendCreate: (matchEndData: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/matchresult/matchend`,
        method: "POST",
        body: matchEndData,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  matchResult = {
    /**
     * @description Update one MatchResult isWinner by id
     *
     * @tags MatchResult
     * @name IswinnerUpdate
     * @summary Update one MatchResult isWinner
     * @request PUT:/matchresult/iswinner/{id}
     */
    iswinnerUpdate: (
      id: number,
      MatchResult: string,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/matchresult/iswinner/${id}`,
        method: "PUT",
        body: MatchResult,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Update one MatchResult laneNumber by id
     *
     * @tags MatchResult
     * @name LanenumberUpdate
     * @summary Update one MatchResult laneNumber
     * @request PUT:/matchresult/lanenumber/{id}
     */
    lanenumberUpdate: (
      id: number,
      MatchResult: string,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/matchresult/lanenumber/${id}`,
        method: "PUT",
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
      this.request<any, string>({
        path: `/matchresult/scores/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Update one MatchResult shootOffScore by id
     *
     * @tags MatchResult
     * @name ShootoffscoreUpdate
     * @summary Update one MatchResult shootOffScore
     * @request PUT:/matchresult/shootoffscore/{id}
     */
    shootoffscoreUpdate: (
      id: number,
      MatchResult: string,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/matchresult/shootoffscore/${id}`,
        method: "PUT",
        body: MatchResult,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Update one MatchResult totalPoints by id
     *
     * @tags MatchResult
     * @name TotalpointsUpdate
     * @summary Update one MatchResult totalPoints
     * @request PUT:/matchresult/totalpoints/{id}
     */
    totalpointsUpdate: (
      id: number,
      MatchResult: string,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/matchresult/totalpoints/${id}`,
        method: "PUT",
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
      this.request<any, string>({
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
  matchScore = {
    /**
     * @description Update one MatchScore score by id
     *
     * @tags MatchScore
     * @name ScoreUpdate
     * @summary Update one MatchScore score
     * @request PUT:/matchscore/score/{id}
     */
    scoreUpdate: (id: number, MatchScore: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/matchscore/score/${id}`,
        method: "PUT",
        body: MatchScore,
        type: ContentType.Json,
        ...params,
      }),
  };
  medal = {
    /**
     * @description get medals of elimination by elimination id
     *
     * @tags Medal
     * @name EliminationDetail
     * @summary Show medals of elimination by elimination id
     * @request GET:/medal/elimination/{id}
     */
    eliminationDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/medal/elimination/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description update medal's player set id by id
     *
     * @tags Medal
     * @name PlayersetidUpdate
     * @summary Update medal's player set id by id
     * @request PUT:/medal/playersetid/{id}
     */
    playersetidUpdate: (
      id: number,
      PlayerSetId: string,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/medal/playersetid/${id}`,
        method: "PUT",
        body: PlayerSetId,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description get one medal by id
     *
     * @tags Medal
     * @name MedalDetail
     * @summary Show one medal by id
     * @request GET:/medal/{id}
     */
    medalDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/medal/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  oldLaneInfo = {
    /**
     * @description Post one new OldLaneInfo data with new id, and return the new OldLaneInfo data
     *
     * @tags OldLaneInfo
     * @name OldlaneinfoCreate
     * @summary Create one OldLaneInfo
     * @request POST:/oldlaneinfo
     */
    oldlaneinfoCreate: (LaneData: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/oldlaneinfo`,
        method: "POST",
        body: LaneData,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Put one OldLaneInfo confirm by index and id
     *
     * @tags OldLaneInfo
     * @name ConfirmUpdate
     * @summary update one OldLaneInfo confirmation
     * @request PUT:/oldlaneinfo/confirm/{id}/{stageindex}/{userindex}/{confirm}
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
        format: "json",
        ...params,
      }),

    /**
     * @description Put one OldLaneInfo score by index and id
     *
     * @tags OldLaneInfo
     * @name ScoreUpdate
     * @summary update one OldLaneInfo Score
     * @request PUT:/oldlaneinfo/score/{id}/{stageindex}/{userindex}/{arrowindex}/{score}
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
        format: "json",
        ...params,
      }),

    /**
     * @description Put whole new OldLaneInfo and overwrite with the id
     *
     * @tags OldLaneInfo
     * @name WholeUpdate
     * @summary update one OldLaneInfo
     * @request PUT:/oldlaneinfo/whole/{id}
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
     * @description Get one OldLaneInfo by id
     *
     * @tags OldLaneInfo
     * @name OldlaneinfoDetail
     * @summary Show one OldLaneInfo
     * @request GET:/oldlaneinfo/{id}
     */
    oldlaneinfoDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/oldlaneinfo/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description delete one OldLaneInfo by id
     *
     * @tags OldLaneInfo
     * @name OldlaneinfoDelete
     * @summary delete one OldLaneInfo
     * @request DELETE:/oldlaneinfo/{id}
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
     * @description post a particpant to the competition cannot repeat participant role cannot be empty status is always "pending"
     *
     * @tags Participant
     * @name ParticipantCreate
     * @summary post a particpant to the competition
     * @request POST:/participant/
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
     * @description Get Participants By competition ID, including realname
     *
     * @tags Participant
     * @name CompetitionList
     * @summary Show Participants By competition ID
     * @request GET:/participant/competition
     */
    competitionList: (competition_id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/participant/competition`,
        method: "GET",
        body: competition_id,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get Participants By competition ID and user ID
     *
     * @tags Participant
     * @name CompetitionUserList
     * @summary Show Participants By competition ID and user ID
     * @request GET:/participant/competition/user
     */
    competitionUserList: (
      user_id: number,
      competition_id: number,
      params: RequestParams = {}
    ) =>
      this.request<string, string>({
        path: `/participant/competition/user/${competition_id}/${user_id}`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get Participants By user ID
     *
     * @tags Participant
     * @name UserList
     * @summary Show Participants By user ID
     * @request GET:/participant/user
     */
    userList: (user_id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/participant/user`,
        method: "GET",
        body: user_id,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Put whole new Participant and overwrite with the id
     *
     * @tags Participant
     * @name WholeUpdate
     * @summary update one Participant
     * @request PUT:/participant/whole/{id}
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
     * @description Get One Participant By ID
     *
     * @tags Participant
     * @name ParticipantDetail
     * @summary Show One Participant By ID
     * @request GET:/participant/{id}
     */
    participantDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/participant/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description delete one Participant by id
     *
     * @tags Participant
     * @name ParticipantDelete
     * @summary delete one Participant
     * @request DELETE:/participant/{id}
     */
    participantDelete: (id: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/participant/${id}`,
        method: "DELETE",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  player = {
    /**
     * @description Update all scores of one end by end id Will auto update player total score Should have a 6 element array scores array
     *
     * @tags Player
     * @name AllEndscoresUpdate
     * @summary Update all scores of one end by end id
     * @request PUT:/player/all-endscores/{id}
     */
    allEndscoresUpdate: (
      id: number,
      scores: EndpointPutPlayerAllEndScoresByEndIdEndScores,
      params: RequestParams = {}
    ) =>
      this.request<EndpointPutPlayerAllEndScoresByEndIdEndScores, string>({
        path: `/player/all-endscores/${id}`,
        method: "PUT",
        body: scores,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Get dummy players by participant id
     *
     * @tags Player
     * @name DummyDetail
     * @summary Show dummy players
     * @request GET:/player/dummy/{participantid}
     */
    dummyDetail: (participantid: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/player/dummy/${participantid}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Create dummy player by player id
     *
     * @tags Player
     * @name DummyCreate
     * @summary Create dummy player
     * @request POST:/player/dummy/{playerid}
     */
    dummyCreate: (playerid: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/player/dummy/${playerid}`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Player groupId by id, and change player laneid to Unassigned lane
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
      this.request<any, string>({
        path: `/player/groupid/${playerid}/${groupid}`,
        method: "PUT",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Player isConfirmed by id
     *
     * @tags Player
     * @name IsconfirmedUpdate
     * @summary Update one Player isConfirmed by id
     * @request PUT:/player/isconfirmed/{roundendid}
     */
    isconfirmedUpdate: (
      roundendid: number,
      body: any,
      params: RequestParams = {}
    ) =>
      this.request<any, string>({
        path: `/player/isconfirmed/${roundendid}`,
        body: body,
        method: "PUT",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Player laneId by id, update lane playernum
     *
     * @tags Player
     * @name LaneidUpdate
     * @summary Update one Player laneId by id
     * @request PUT:/player/laneid/{playerid}
     */
    laneidUpdate: (playerid: number, body: any, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/player/laneid/${playerid}`,
        method: "PUT",
        body: body,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Player order by id
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
        body: body,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Player with player sets by id and elimination id
     *
     * @tags Player
     * @name PlayersetsDetail
     * @summary Show one Player with player sets
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
     * @description Create one RoundEnd by round id, IsComfirmed is false
     *
     * @tags Player
     * @name RoundendCreate
     * @summary Create one RoundEnd by Round ID
     * @request POST:/player/roundend
     */
    roundendCreate: (params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/player/roundend`,
        method: "POST",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Create one RoundScore by roundend id
     *
     * @tags Player
     * @name RoundscoreCreate
     * @summary Create one RoundScore by RoundEnd ID
     * @request POST:/player/roundscore
     */
    roundscoreCreate: (params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/player/roundscore`,
        method: "POST",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Player score by id
     *
     * @tags Player
     * @name ScoreUpdate
     * @summary Update one Player score by id
     * @request PUT:/player/score/{roundscoreid}
     */
    scoreUpdate: (roundscoreid: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/player/score/${roundscoreid}`,
        method: "PUT",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Player with rounds, roundends, roundscores by id
     *
     * @tags Player
     * @name ScoresDetail
     * @summary Show one Player with scores
     * @request GET:/player/scores/{id}
     */
    scoresDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/player/scores/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Player shootoffScore by id
     *
     * @tags Player
     * @name ShootoffscoreUpdate
     * @summary Update one Player shootoffScore by id
     * @request PUT:/player/shootoffscore/{id}
     */
    shootoffscoreUpdate: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/player/shootoffscore/${id}`,
        method: "PUT",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update one Player total score by id
     *
     * @tags Player
     * @name TotalscoreUpdate
     * @summary Update one Player total score by id
     * @request PUT:/player/totalscore/{id}
     */
    totalscoreUpdate: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/player/totalscore/${id}`,
        method: "PUT",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get one Player without other data by id
     *
     * @tags Player
     * @name PlayerDetail
     * @summary Show one Player without other data
     * @request GET:/player/{id}
     */
    playerDetail: (id: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/player/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Delete one Player by id, delete related round, roundend, roundscore data, and playerNum minus one in lane
     *
     * @tags Player
     * @name PlayerDelete
     * @summary Delete one Player by id
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
     * @description Create one Player by participant id, create realeted rounds by laneNum of competition, create 6 roundscores for each 6 roundends, UnassignedLane playerNum ++
     *
     * @tags Player
     * @name PlayerCreate
     * @summary Create one Player by Participant ID
     * @request POST:/player/{participantid}
     */
    playerCreate: (participantid: number, params: RequestParams = {}) =>
      this.request<any, string>({
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
     * @name NameUpdate
     * @summary Put player set name
     * @request PUT:/playerset/name/{id}
     */
    nameUpdate: (id: number, data: string, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/playerset/name/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Put player set rank by elimination id
     *
     * @tags PlayerSet
     * @name PrerankingUpdate
     * @summary Put player set rank
     * @request PUT:/playerset/preranking/{eliminationid}
     */
    prerankingUpdate: (eliminationid: number, params: RequestParams = {}) =>
      this.request<any, string>({
        path: `/playerset/preranking/${eliminationid}`,
        method: "PUT",
        format: "json",
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
      this.request<any, string>({
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
     * @description get a session
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
     * @description delete the session
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
      this.request<any, any>({
        path: `/swagger/doc.json`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  user = {
    /**
     * @description add a user to db no need to post id username cannot be empty, repeated password cannot be empty email cannot be empty, repeated
     *
     * @tags User
     * @name UserCreate
     * @summary register a user
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
     * @description get my uid in the session
     *
     * @tags User
     * @name GetUser
     * @summary get my uid
     * @request GET:/user/me
     */
    getUser: (params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          id?: number;
        },
        any
      >({
        path: `/user/me`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description modify user's password cannot change other's password original password cannot be empty new password cannot be empty original password must be correct new password cannot be the same as original password
     *
     * @tags User
     * @name PasswordUpdate
     * @summary modify user's password
     * @request PUT:/user/password/{id}
     */
    passwordUpdate: (
      id: string,
      ModifyInfo: EndpointModifyAccountPasswordInfo,
      params: RequestParams = {}
    ) =>
      this.request<ResponseResponse, ResponseResponse>({
        path: `/user/password/${id}`,
        method: "PUT",
        body: ModifyInfo,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description get a user's username, overview, and institution id
     *
     * @tags User
     * @name UserDetail
     * @summary get a user's information
     * @request GET:/user/{id}
     */
    userDetail: (id: string, params: RequestParams = {}) =>
      this.request<
        ResponseResponse & {
          data?: DatabaseUser;
        },
        ResponseResponse
      >({
        path: `/user/${id}`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description modify username, realname, email, overview, and institution_id cannot change other's info cannot change password username cannot be empty, repeated email cannot be empty, repeated
     *
     * @tags User
     * @name UserUpdate
     * @summary modify user's information
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
