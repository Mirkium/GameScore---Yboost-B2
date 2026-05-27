import { In } from "typeorm";
import { AppDataSource } from "../config/database";
import { EsrbRating } from "../entities/esrb-rating.entity";
import { Game } from "../entities/game.entity";
import { GamePlatform } from "../entities/game-platform.entity";
import { Platform } from "../entities/platform.entity";
import { PlatformRequirements } from "../entities/platform-requirements.entity";

export interface UpsertRawgGamePayload {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
  readonly released?: Date;
  readonly tba: boolean;
  readonly backgroundImage?: string;
  readonly rating: number;
  readonly ratingTop: number;
  readonly ratings?: Record<string, unknown>;
  readonly ratingsCount: number;
  readonly reviewsTextCount?: string;
  readonly added: number;
  readonly addedByStatus?: Record<string, unknown>;
  readonly metacritic: number;
  readonly playtime: number;
  readonly updated: Date;
  readonly esrb?: {
    readonly id: number;
    readonly slug: string;
    readonly name: string;
  };
  readonly platforms: ReadonlyArray<{
    readonly id: number;
    readonly slug: string;
    readonly name: string;
    readonly releasedAt?: string;
    readonly requirements?: {
      readonly minimum?: string;
      readonly recommended?: string;
    };
  }>;
}

export class GameRepository {
  private readonly gameRepository = AppDataSource.getRepository(Game);

  private readonly esrbRepository = AppDataSource.getRepository(EsrbRating);

  private readonly platformRepository = AppDataSource.getRepository(Platform);

  private readonly gamePlatformRepository = AppDataSource.getRepository(GamePlatform);

  private readonly platformRequirementsRepository =
    AppDataSource.getRepository(PlatformRequirements);

  public async findById(id: number): Promise<Game | null> {
    return this.gameRepository.findOne({
      where: { id },
      relations: [
        "esrb_rating",
        "platforms",
        "platforms.platform",
        "platforms.requirements",
      ],
    });
  }

  public async countAll(): Promise<number> {
    return this.gameRepository.count();
  }

  public async findByIds(ids: number[]): Promise<Game[]> {
    if (ids.length === 0) return [];
    return this.gameRepository.find({
      where: { id: In(ids) },
      relations: [
        "esrb_rating",
        "platforms",
        "platforms.platform",
        "platforms.requirements",
      ],
    });
  }

  public async upsertFromRawg(payload: UpsertRawgGamePayload): Promise<Game> {
    const esrb = payload.esrb
      ? await this.esrbRepository.save(
          this.esrbRepository.create({
            id: payload.esrb.id,
            slug: payload.esrb.slug,
            name: payload.esrb.name,
          })
        )
      : undefined;

    const existing = await this.gameRepository.findOne({ where: { id: payload.id } });

    const game = this.gameRepository.create({
      id: payload.id,
      slug: payload.slug,
      name: payload.name,
      released: payload.released,
      tba: payload.tba,
      background_image: payload.backgroundImage,
      rating: payload.rating,
      rating_top: payload.ratingTop,
      ratings: payload.ratings,
      ratings_count: payload.ratingsCount,
      reviews_text_count: payload.reviewsTextCount,
      added: payload.added,
      added_by_status: payload.addedByStatus,
      metacritic: payload.metacritic,
      playtime: payload.playtime,
      updated: payload.updated,
      lastSyncedAt: new Date(),
      esrb_rating: esrb,
    });

    await this.gameRepository.save(game);

    if (existing) {
      await this.gamePlatformRepository
        .createQueryBuilder()
        .delete()
        .from(GamePlatform)
        .where("game_id = :gameId", { gameId: payload.id })
        .execute();
    }

    for (const platformPayload of payload.platforms) {
      const platform = await this.platformRepository.save(
        this.platformRepository.create({
          id: platformPayload.id,
          slug: platformPayload.slug,
          name: platformPayload.name,
        })
      );

      const requirements = platformPayload.requirements
        ? await this.platformRequirementsRepository.save(
            this.platformRequirementsRepository.create({
              minimum: platformPayload.requirements.minimum,
              recommended: platformPayload.requirements.recommended,
            })
          )
        : undefined;

      const gamePlatform = this.gamePlatformRepository.create({
        game: { id: payload.id },
        platform,
        released_at: platformPayload.releasedAt,
        requirements,
      });

      await this.gamePlatformRepository.save(gamePlatform);
    }

    const syncedGame = await this.findById(payload.id);
    if (!syncedGame) {
      throw new Error("Failed to persist synced game");
    }

    return syncedGame;
  }
}

export const gameRepository = new GameRepository();