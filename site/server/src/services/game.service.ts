import { Game } from "../entities/game.entity";
import { gameRepository } from "../repositories/game.repository";
import { profileInteractionRepository } from "../repositories/profile-interaction.repository";
import { profileRepository } from "../repositories/profile.repository";
import {
  ExternalGameSearchQueryDto,
  PopularGamesQueryDto,
} from "../types/dtos/game.dto";
import {
  CreateGameReviewDto,
  LikeGameDto,
} from "../types/dtos/game-interaction.dto";
import {
  toGameReviewPresenter,
  toGamePresenter,
  toLikedGamePresenter,
} from "../types/presenters";
import { AppError } from "../utils/app-error";
import { LruCache } from "../utils/lru-cache";
import { gameSyncService } from "./game-sync.service";
import { rawgService } from "./rawg.service";

type CommunityStats = {
  likesCount: number;
  favoritesCount: number;
  reviewsCount: number;
  ratingsCount: number;
  averageRating: number | null;
};

type CachedSearchPayload = {
  count: number;
  results: ReadonlyArray<Record<string, unknown>>;
};

export class GameService {
  private readonly rawgSearchCache = new LruCache<string, CachedSearchPayload>(50);

  private normalizeSearchRatings(
    results: ReadonlyArray<Record<string, unknown>>
  ) {
    return results.map((item) => {
      const rating = item.rating;
      const ratingTop = item.rating_top;
      const community = (item as Record<string, unknown>).community as
        | { averageRating: number | null }
        | undefined;

      const next = { ...item } as Record<string, unknown>;

      if (typeof rating === "number") {
        next.rating = Math.round(rating * 20);
      }
      if (typeof ratingTop === "number") {
        next.rating_top = ratingTop * 20;
      }
      if (community && typeof community.averageRating === "number") {
        next.community = {
          ...community,
          averageRating: Math.round(community.averageRating),
        };
      }

      return next;
    });
  }

  private enrichResultsWithCommunity(
    results: ReadonlyArray<Record<string, unknown>>,
    communityStatsByGameId: Map<number, CommunityStats>
  ) {
    const defaultCommunity = {
      likesCount: 0,
      favoritesCount: 0,
      reviewsCount: 0,
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

    const games = this.normalizeSearchRatings(
      this.enrichResultsWithCommunity(filteredByRating, communityStatsByGameId)
    );

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    return {
      count: result.count,
      games,
      page,
      hasMore: result.count > pageSize * page,
    };
  }

  public async getGameById(gameId: number, profileId?: string) {
    const game = await gameSyncService.resolveGame(gameId);
    const stats = await profileInteractionRepository.findCommunityStatsByGameIds([game.id]);
    const community = stats.get(game.id);
    let userLike = undefined;
    if (profileId) {
      const like = await profileInteractionRepository.findLikeByProfileAndGame(profileId, game.id);
      if (like) {
        userLike = { liked: true, favorited: like.isFavorite };
      }
    }
    return toGamePresenter(game, community, userLike);
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

  public async getRecentlyReviewedGames(limit: number) {
    const rows = await profileInteractionRepository.findRecentlyReviewedGameIds(limit);
    const gameIds = rows.map(r => r.gameId);

    if (gameIds.length === 0) {
      return { games: [] };
    }

    const localGames = await gameRepository.findByIds(gameIds);
    const localMap = new Map(localGames.map(g => [g.id, g]));

    const resolved: Game[] = [];
    for (const id of gameIds) {
      const local = localMap.get(id);
      if (local) {
        resolved.push(local);
      } else {
        const synced = await gameSyncService.resolveGame(id);
        resolved.push(synced);
      }
    }

    const communityStatsByGameId =
      await profileInteractionRepository.findCommunityStatsByGameIds(gameIds);

    const games = resolved.map(game => {
      const stats = communityStatsByGameId.get(game.id);
      const community = stats
        ? {
            averageRating: stats.averageRating !== null ? Math.round(stats.averageRating) : null,
            ratingsCount: stats.ratingsCount,
            likesCount: stats.likesCount,
            favoritesCount: stats.favoritesCount,
            reviewsCount: stats.reviewsCount,
          }
        : { averageRating: null, ratingsCount: 0, likesCount: 0, favoritesCount: 0, reviewsCount: 0 };

      return {
        id: game.id,
        slug: game.slug,
        name: game.name,
        released: game.released,
        tba: game.tba,
        background_image: game.background_image,
        rating: Math.round(game.rating * 20),
        rating_top: game.rating_top * 20,
        ratingsCount: game.ratings_count,
        added: game.added,
        metacritic: game.metacritic,
        playtime: game.playtime,
        platforms: game.platforms.map(gp => ({
          platform: { id: gp.platform.id, slug: gp.platform.slug, name: gp.platform.name },
        })),
        community,
      };
    });

    return { games };
  }

  private static readonly statsCache = new LruCache<string, {
    gamesTracked: number;
    totalReviews: number;
    topScore: number | null;
    rawgGamesCount: number;
  }>(1);

  public async getStats() {
    return GameService.statsCache.getOrSet("key", async () => {
      const [gamesTracked, totalReviews, topScore, rawgResponse] = await Promise.all([
        gameRepository.countAll(),
        profileInteractionRepository.countTotalReviews(),
        profileInteractionRepository.findTopCommunityScore(),
        rawgService.searchGames({ pageSize: 1 }).catch(() => ({ count: 0 })),
      ]);

      return {
        gamesTracked,
        totalReviews,
        topScore,
        rawgGamesCount: rawgResponse.count,
      };
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

  public async getGameReviews(gameId: number) {
    const reviews = await profileInteractionRepository.findReviewsByGameId(gameId);

    const result: Array<{
      profileId: string;
      username: string | null;
      title: string | null;
      comment: string | null;
      rating: number | null;
      createdAt: Date;
    }> = [];

    for (const c of reviews) {
      result.push({
        profileId: c.author.id,
        username: c.author.username ?? null,
        title: c.title,
        comment: c.comment,
        rating: c.rating ?? null,
        createdAt: c.createdAt,
      });
    }

    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return result;
  }

  public async createGameReview(
    profileId: string,
    gameId: number,
    payload: CreateGameReviewDto
  ) {
    const profile = await profileRepository.findById(profileId);
    if (!profile) {
      throw new AppError(404, "Profile not found");
    }

    if (!payload.comment && payload.rating === undefined) {
      throw new AppError(400, "Provide at least a comment or a rating");
    }

    const game = await gameSyncService.resolveGame(gameId);

    const review = await profileInteractionRepository.createReview(
      profileId,
      game.id,
      payload.comment,
      payload.title,
      payload.rating
    );

    return { review: toGameReviewPresenter(review) };
  }
}

export const gameService = new GameService();