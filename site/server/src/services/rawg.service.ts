import { buildRawgUrl, rawgConfig } from "../config/rawg";
import { AppError } from "../utils/app-error";

export interface RawgGameDetails {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
  readonly released?: string;
  readonly tba: boolean;
  readonly background_image?: string;
  readonly rating: number;
  readonly rating_top: number;
  readonly ratings?: Record<string, unknown>;
  readonly ratings_count: number;
  readonly reviews_text_count?: string;
  readonly added: number;
  readonly added_by_status?: Record<string, unknown>;
  readonly metacritic: number;
  readonly playtime: number;
  readonly updated: string;
  readonly esrb_rating?: {
    readonly id: number;
    readonly slug: string;
    readonly name: string;
  };
  readonly platforms: ReadonlyArray<{
    readonly platform: {
      readonly id: number;
      readonly slug: string;
      readonly name: string;
    };
    readonly released_at?: string;
    readonly requirements_en?: {
      readonly minimum?: string;
      readonly recommended?: string;
    };
  }>;
}

export interface RawgSearchResponse {
  readonly count: number;
  readonly next: string | null;
  readonly previous: string | null;
  readonly results: ReadonlyArray<Record<string, unknown>>;
}

const ensureRawgApiKey = (): void => {
  if (!rawgConfig.apiKey) {
    throw new AppError(503, "RAWG API key is not configured");
  }
};

const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new AppError(response.status, `RAWG API returned ${response.status}`);
  }

  const payload: unknown = await response.json();
  return payload as T;
};

export class RawgService {
  public async getGameById(rawgId: number): Promise<RawgGameDetails> {
    ensureRawgApiKey();
    const url = buildRawgUrl(`games/${rawgId}`);
    const response = await fetch(url);
    return parseJsonResponse<RawgGameDetails>(response);
  }

  public async searchGames(query: {
    readonly search?: string;
    readonly page?: number;
    readonly pageSize?: number;
    readonly dates?: string;
    readonly metacritic?: string;
    readonly platforms?: string;
    readonly genres?: string;
    readonly tags?: string;
    readonly ordering?: string;
  }): Promise<RawgSearchResponse> {
    ensureRawgApiKey();

    const url = buildRawgUrl("games", {
      search: query.search,
      page: query.page,
      page_size: query.pageSize,
      dates: query.dates,
      metacritic: query.metacritic,
      platforms: query.platforms,
      genres: query.genres,
      tags: query.tags,
      ordering: query.ordering,
    });

    const response = await fetch(url);
    return parseJsonResponse<RawgSearchResponse>(response);
  }
}

export const rawgService = new RawgService();