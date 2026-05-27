import { AppDataSource } from "../config/database";
import { GameReview } from "../entities/game-review.entity";
import { ProfileLikedGame } from "../entities/profile-liked-game.entity";

export interface GameCommunityStats {
  readonly likesCount: number;
  readonly favoritesCount: number;
  readonly reviewsCount: number;
  readonly ratingsCount: number;
  readonly averageRating: number | null;
}

export class ProfileInteractionRepository {
  private readonly likedGameRepository = AppDataSource.getRepository(ProfileLikedGame);

  private readonly reviewRepository = AppDataSource.getRepository(GameReview);

  public async findRecentlyReviewedGameIds(limit: number): Promise<Array<{ gameId: number }>> {
    return this.reviewRepository
      .createQueryBuilder("review")
      .select("review.game_id", "gameId")
      .groupBy("review.game_id")
      .orderBy("MAX(review.createdAt)", "DESC")
      .limit(limit)
      .getRawMany();
  }

  public async findCommunityStatsByGameIds(
    gameIds: readonly number[]
  ): Promise<Map<number, GameCommunityStats>> {
    const statsByGameId = new Map<number, GameCommunityStats>();

    if (gameIds.length === 0) {
      return statsByGameId;
    }

    const likes = await this.likedGameRepository
      .createQueryBuilder("liked")
      .select("liked.game_id", "gameId")
      .addSelect("COUNT(liked.id)", "likesCount")
      .addSelect("SUM(CASE WHEN liked.isFavorite = 1 THEN 1 ELSE 0 END)", "favoritesCount")
      .where("liked.game_id IN (:...gameIds)", { gameIds })
      .groupBy("liked.game_id")
      .getRawMany<{ gameId: string; likesCount: string; favoritesCount: string | null }>();

    const [rated, all] = await Promise.all([
      this.reviewRepository
        .createQueryBuilder("review")
        .select("review.game_id", "gameId")
        .addSelect("COUNT(review.id)", "count")
        .addSelect("AVG(review.rating)", "averageRating")
        .where("review.game_id IN (:...gameIds)", { gameIds })
        .andWhere("review.rating IS NOT NULL")
        .groupBy("review.game_id")
        .getRawMany<{ gameId: string; count: string; averageRating: string | null }>(),
      this.reviewRepository
        .createQueryBuilder("review")
        .select("review.game_id", "gameId")
        .addSelect("COUNT(review.id)", "count")
        .where("review.game_id IN (:...gameIds)", { gameIds })
        .groupBy("review.game_id")
        .getRawMany<{ gameId: string; count: string }>(),
    ]);

    const defaultStats: GameCommunityStats = {
      likesCount: 0,
      favoritesCount: 0,
      reviewsCount: 0,
      ratingsCount: 0,
      averageRating: null,
    };

    for (const gameId of gameIds) {
      statsByGameId.set(gameId, defaultStats);
    }

    for (const row of likes) {
      const gameId = Number(row.gameId);
      const current = statsByGameId.get(gameId) ?? defaultStats;

      statsByGameId.set(gameId, {
        ...current,
        likesCount: Number(row.likesCount),
        favoritesCount: Number(row.favoritesCount ?? 0),
      });
    }

    for (const row of rated) {
      const gameId = Number(row.gameId);
      const current = statsByGameId.get(gameId) ?? defaultStats;

      statsByGameId.set(gameId, {
        ...current,
        ratingsCount: Number(row.count),
        averageRating: row.averageRating === null ? null : Number(row.averageRating),
      });
    }

    for (const row of all) {
      const gameId = Number(row.gameId);
      const current = statsByGameId.get(gameId) ?? defaultStats;

      statsByGameId.set(gameId, {
        ...current,
        reviewsCount: Number(row.count),
      });
    }

    return statsByGameId;
  }

  public async countTotalReviews(): Promise<number> {
    return this.reviewRepository.count();
  }

  public async findTopCommunityScore(): Promise<number | null> {
    const row = await this.reviewRepository
      .createQueryBuilder("review")
      .select("AVG(review.rating)", "avg")
      .where("review.rating IS NOT NULL")
      .groupBy("review.game_id")
      .orderBy("avg", "DESC")
      .limit(1)
      .getRawOne<{ avg: string | null }>();
    if (!row) return null;
    return row.avg !== null ? Math.round(Number(row.avg)) : null;
  }

  public async findReviewsByGameId(gameId: number): Promise<GameReview[]> {
    return this.reviewRepository.find({
      where: { game: { id: gameId } },
      relations: ["author", "game"],
      order: { createdAt: "DESC" },
    });
  }

  public async findLikedGamesByUsername(username: string): Promise<ProfileLikedGame[]> {
    return this.likedGameRepository.find({
      where: { profile: { username } },
      relations: ["game"],
      order: { likedAt: "DESC" },
    });
  }

  public async findReviewsByUsername(username: string): Promise<GameReview[]> {
    return this.reviewRepository.find({
      where: { author: { username } },
      relations: ["game"],
      order: { createdAt: "DESC" },
    });
  }

  public async upsertLike(
    profileId: string,
    gameId: number,
    isFavorite: boolean
  ): Promise<ProfileLikedGame> {
    const existing = await this.likedGameRepository.findOne({
      where: { profile: { id: profileId }, game: { id: gameId } },
      relations: ["game"],
    });

    const like = this.likedGameRepository.create({
      id: existing?.id,
      profile: { id: profileId },
      game: { id: gameId },
      isFavorite,
    });

    await this.likedGameRepository.save(like);

    const saved = await this.likedGameRepository.findOne({
      where: { profile: { id: profileId }, game: { id: gameId } },
      relations: ["game"],
    });

    if (!saved) {
      throw new Error("Failed to persist game like");
    }

    return saved;
  }

  public async findLikeByProfileAndGame(profileId: string, gameId: number): Promise<ProfileLikedGame | null> {
    return this.likedGameRepository.findOne({
      where: { profile: { id: profileId }, game: { id: gameId } },
    });
  }

  public async createReview(profileId: string, gameId: number, comment: string, title: string | null = null, rating: number | null = null): Promise<GameReview> {
    const entity = this.reviewRepository.create({
      author: { id: profileId },
      game: { id: gameId },
      title,
      rating,
      comment,
    });

    const saved = await this.reviewRepository.save(entity);
    const reloaded = await this.reviewRepository.findOne({
      where: { id: saved.id },
      relations: ["game"],
    });

    if (!reloaded) {
      throw new Error("Failed to persist game review");
    }

    return reloaded;
  }

}

export const profileInteractionRepository = new ProfileInteractionRepository();