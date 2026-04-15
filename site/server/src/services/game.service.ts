import { profileInteractionRepository } from "../repositories/profile-interaction.repository";
import { profileRepository } from "../repositories/profile.repository";
import {
  ExternalGameSearchQueryDto,
  PopularGamesQueryDto,
} from "../types/dtos/game.dto";
import {
  CreateGameCommentDto,
  LikeGameDto,
  RateGameDto,
} from "../types/dtos/game-interaction.dto";
import {
  toGameCommentPresenter,
  toGamePresenter,
  toGameRatingPresenter,
  toLikedGamePresenter,
} from "../types/presenters";
import { AppError } from "../utils/app-error";
import { LruCache } from "../utils/lru-cache";
import { gameSyncService } from "./game-sync.service";
import { rawgService } from "./rawg.service";

type CommunityStats = {
  likesCount: number;
  favoritesCount: number;
  commentsCount: number;
  ratingsCount: number;
  averageRating: number | null;
};

type CachedSearchPayload = {
  count: number;
  results: ReadonlyArray<Record<string, unknown>>;
};

export class GameService {
  private readonly rawgSearchCache = new LruCache<string, CachedSearchPayload>(50);

  private enrichResultsWithCommunity(
    results: ReadonlyArray<Record<string, unknown>>,
    communityStatsByGameId: Map<number, CommunityStats>
  ) {
    const defaultCommunity = {
      likesCount: 0,
      favoritesCount: 0,
      commentsCount: 0,
      ratingsCount: 0,
      averageRating: null,
    };

    return results.map((item) => {
      const gameId = item.id;
      if (typeof gameId !== "number" || !Number.isFinite(gameId)) {
        return {
          ...item,
          community: defaultCommunity,
        };
      }

      return {
        ...item,
        community: communityStatsByGameId.get(gameId) ?? defaultCommunity,
      };
    });
  }

  private buildSearchCacheKey(query: {
    readonly search?: string;
    readonly page?: number;
    readonly pageSize?: number;
    readonly dates?: string;
    readonly metacritic?: string;
    readonly platforms?: string;
    readonly genres?: string;
    readonly tags?: string;
    readonly ordering?: string;
  }): string {
    return JSON.stringify({
      search: query.search ?? "",
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      dates: query.dates ?? "",
      metacritic: query.metacritic ?? "",
      platforms: query.platforms ?? "",
      genres: query.genres ?? "",
      tags: query.tags ?? "",
      ordering: query.ordering ?? "",
    });
  }

  private async fetchRawgSearch(query: {
    readonly search?: string;
    readonly page?: number;
    readonly pageSize?: number;
    readonly dates?: string;
    readonly metacritic?: string;
    readonly platforms?: string;
    readonly genres?: string;
    readonly tags?: string;
    readonly ordering?: string;
  }) {
    const cacheKey = this.buildSearchCacheKey(query);

    return this.rawgSearchCache.getOrSet(cacheKey, async () => {
      const result = await rawgService.searchGames(query);
      return {
        count: result.count,
        results: result.results,
      };
    });
  }

  private async fetchSearchWithCommunity(query: {
    readonly search?: string;
    readonly page?: number;
    readonly pageSize?: number;
    readonly dates?: string;
    readonly metacritic?: string;
    readonly platforms?: string;
    readonly genres?: string;
    readonly tags?: string;
    readonly ordering?: string;
    readonly ratingMin?: number;
    readonly ratingMax?: number;
  }) {
    const result = await this.fetchRawgSearch(query);

    const filteredByRating = result.results.filter((item) => {
      const rating = item.rating;
      if (typeof rating !== "number") {
        return true;
      }

      if (query.ratingMin !== undefined && rating < query.ratingMin) {
        return false;
      }

      if (query.ratingMax !== undefined && rating > query.ratingMax) {
        return false;
      }

      return true;
    });

    const gameIds = filteredByRating
      .map((item) => item.id)
      .filter((id): id is number => typeof id === "number" && Number.isFinite(id));

    const communityStatsByGameId =
      await profileInteractionRepository.findCommunityStatsByGameIds(gameIds);

    const games = this.enrichResultsWithCommunity(filteredByRating, communityStatsByGameId);

    return {
      count: result.count,
      games,
      hasMore: result.count > (query.pageSize ?? 20) * (query.page ?? 1),
    };
  }

  public async getGameById(gameId: number) {
    const game = await gameSyncService.resolveGame(gameId);
    return toGamePresenter(game);
  }

  public async searchGames(query: ExternalGameSearchQueryDto) {
    const dates =
      query.releasedFrom || query.releasedTo
        ? `${query.releasedFrom ?? "1900-01-01"},${query.releasedTo ?? "2100-12-31"}`
        : undefined;

    const metacritic =
      query.metacriticMin !== undefined || query.metacriticMax !== undefined
        ? `${query.metacriticMin ?? 0},${query.metacriticMax ?? 100}`
        : undefined;

    return this.fetchSearchWithCommunity({
      search: query.search,
      page: query.page,
      pageSize: query.pageSize,
      dates,
      metacritic,
      platforms: query.platforms,
      genres: query.genres,
      tags: query.tags,
      ordering: query.ordering,
      ratingMin: query.ratingMin,
      ratingMax: query.ratingMax,
    });
  }

  public async getPopularGames(query: PopularGamesQueryDto) {
    const now = new Date();
    const periodDays = query.periodDays ?? 30;
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const formatDate = (date: Date): string => date.toISOString().split("T")[0] ?? "";

    return this.fetchSearchWithCommunity({
      page: query.page,
      pageSize: query.pageSize,
      dates: `${formatDate(startDate)},${formatDate(now)}`,
      ordering: "-added",
    });
  }

  public async likeGame(profileId: string, gameId: number, payload: LikeGameDto) {
    const profile = await profileRepository.findById(profileId);
    if (!profile) {
      throw new AppError(404, "Profile not found");
    }

    const game = await gameSyncService.resolveGame(gameId);
    const like = await profileInteractionRepository.upsertLike(
      profileId,
      game.id,
      payload.isFavorite ?? true
    );

    return toLikedGamePresenter(like);
  }

  public async commentGame(profileId: string, gameId: number, payload: CreateGameCommentDto) {
    const profile = await profileRepository.findById(profileId);
    if (!profile) {
      throw new AppError(404, "Profile not found");
    }

    const game = await gameSyncService.resolveGame(gameId);
    const comment = await profileInteractionRepository.createComment(
      profileId,
      game.id,
      payload.comment
    );

    return toGameCommentPresenter(comment);
  }

  public async rateGame(profileId: string, gameId: number, payload: RateGameDto) {
    const profile = await profileRepository.findById(profileId);
    if (!profile) {
      throw new AppError(404, "Profile not found");
    }

    if (payload.stars < 1 || payload.stars > 5) {
      throw new AppError(400, "stars must be between 1 and 5");
    }

    const game = await gameSyncService.resolveGame(gameId);
    const rating = await profileInteractionRepository.upsertRating(
      profileId,
      game.id,
      payload.stars
    );

    return toGameRatingPresenter(rating);
  }
}

export const gameService = new GameService();