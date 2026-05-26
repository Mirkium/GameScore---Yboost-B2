import { AppDataSource } from "../config/database";
import { GameComment } from "../entities/game-comment.entity";
import { GameRating } from "../entities/game-rating.entity";
import { ProfileLikedGame } from "../entities/profile-liked-game.entity";

export interface GameCommunityStats {
  readonly likesCount: number;
  readonly favoritesCount: number;
  readonly commentsCount: number;
  readonly ratingsCount: number;
  readonly averageRating: number | null;
}

export class ProfileInteractionRepository {
  private readonly likedGameRepository = AppDataSource.getRepository(ProfileLikedGame);

  private readonly commentRepository = AppDataSource.getRepository(GameComment);

  private readonly ratingRepository = AppDataSource.getRepository(GameRating);

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

    const comments = await this.commentRepository
      .createQueryBuilder("comment")
      .select("comment.game_id", "gameId")
      .addSelect("COUNT(comment.id)", "commentsCount")
      .where("comment.game_id IN (:...gameIds)", { gameIds })
      .groupBy("comment.game_id")
      .getRawMany<{ gameId: string; commentsCount: string }>();

    const ratings = await this.ratingRepository
      .createQueryBuilder("rating")
      .select("rating.game_id", "gameId")
      .addSelect("COUNT(rating.id)", "ratingsCount")
      .addSelect("AVG(rating.stars)", "averageRating")
      .where("rating.game_id IN (:...gameIds)", { gameIds })
      .groupBy("rating.game_id")
      .getRawMany<{ gameId: string; ratingsCount: string; averageRating: string | null }>();

    const defaultStats: GameCommunityStats = {
      likesCount: 0,
      favoritesCount: 0,
      commentsCount: 0,
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

    for (const row of comments) {
      const gameId = Number(row.gameId);
      const current = statsByGameId.get(gameId) ?? defaultStats;

      statsByGameId.set(gameId, {
        ...current,
        commentsCount: Number(row.commentsCount),
      });
    }

    for (const row of ratings) {
      const gameId = Number(row.gameId);
      const current = statsByGameId.get(gameId) ?? defaultStats;

      statsByGameId.set(gameId, {
        ...current,
        ratingsCount: Number(row.ratingsCount),
        averageRating: row.averageRating === null ? null : Number(row.averageRating),
      });
    }

    return statsByGameId;
  }

  public async findCommentsByGameId(gameId: number): Promise<GameComment[]> {
    return this.commentRepository.find({
      where: { game: { id: gameId } },
      relations: ["author", "game"],
      order: { createdAt: "DESC" },
    });
  }

  public async findRatingsByGameId(gameId: number): Promise<GameRating[]> {
    return this.ratingRepository.find({
      where: { game: { id: gameId } },
      relations: ["profile", "game"],
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

  public async findCommentsByUsername(username: string): Promise<GameComment[]> {
    return this.commentRepository.find({
      where: { author: { username } },
      relations: ["game"],
      order: { createdAt: "DESC" },
    });
  }

  public async findRatingsByUsername(username: string): Promise<GameRating[]> {
    return this.ratingRepository.find({
      where: { profile: { username } },
      relations: ["game"],
      order: { updatedAt: "DESC" },
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

  public async createComment(profileId: string, gameId: number, comment: string, title: string | null = null, rating: number | null = null): Promise<GameComment> {
    const entity = this.commentRepository.create({
      author: { id: profileId },
      game: { id: gameId },
      title,
      rating,
      comment,
    });

    const saved = await this.commentRepository.save(entity);
    const reloaded = await this.commentRepository.findOne({
      where: { id: saved.id },
      relations: ["game"],
    });

    if (!reloaded) {
      throw new Error("Failed to persist game comment");
    }

    return reloaded;
  }

  public async upsertRating(profileId: string, gameId: number, stars: number): Promise<GameRating> {
    const existing = await this.ratingRepository.findOne({
      where: { profile: { id: profileId }, game: { id: gameId } },
      relations: ["game"],
    });

    const rating = this.ratingRepository.create({
      id: existing?.id,
      profile: { id: profileId },
      game: { id: gameId },
      stars,
    });

    await this.ratingRepository.save(rating);

    const saved = await this.ratingRepository.findOne({
      where: { profile: { id: profileId }, game: { id: gameId } },
      relations: ["game"],
    });

    if (!saved) {
      throw new Error("Failed to persist game rating");
    }

    return saved;
  }

  public async createRating(profileId: string, gameId: number, stars: number): Promise<GameRating> {
    const entity = this.ratingRepository.create({
      profile: { id: profileId },
      game: { id: gameId },
      stars,
    });

    const saved = await this.ratingRepository.save(entity);
    const reloaded = await this.ratingRepository.findOne({
      where: { id: saved.id },
      relations: ["game"],
    });

    if (!reloaded) {
      throw new Error("Failed to persist game rating");
    }

    return reloaded;
  }
}

export const profileInteractionRepository = new ProfileInteractionRepository();