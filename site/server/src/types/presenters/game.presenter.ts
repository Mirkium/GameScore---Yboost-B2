import { Game } from "../../entities/game.entity";

export interface GamePlatformPresenter {
  readonly platformId: number;
  readonly platformSlug: string;
  readonly platformName: string;
  readonly releasedAt: string | null;
  readonly minimumRequirements: string | null;
  readonly recommendedRequirements: string | null;
}

export interface GamePresenter {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
  readonly released: Date | null;
  readonly tba: boolean;
  readonly backgroundImage: string | null;
  readonly rating: number;
  readonly ratingTop: number;
  readonly ratingsCount: number;
  readonly reviewsTextCount: string | null;
  readonly added: number;
  readonly metacritic: number;
  readonly playtime: number;
  readonly updated: Date;
  readonly lastSyncedAt: Date | null;
  readonly esrbRating: {
    readonly id: number;
    readonly slug: string;
    readonly name: string;
  } | null;
  readonly platforms: GamePlatformPresenter[];
}

export const toGamePlatformPresenter = (
  gamePlatform: Game["platforms"][number]
): GamePlatformPresenter => ({
  platformId: gamePlatform.platform.id,
  platformSlug: gamePlatform.platform.slug,
  platformName: gamePlatform.platform.name,
  releasedAt: gamePlatform.released_at ?? null,
  minimumRequirements: gamePlatform.requirements?.minimum ?? null,
  recommendedRequirements: gamePlatform.requirements?.recommended ?? null,
});

export const toGamePresenter = (game: Game): GamePresenter => ({
  id: game.id,
  slug: game.slug,
  name: game.name,
  released: game.released ?? null,
  tba: game.tba,
  backgroundImage: game.background_image ?? null,
  rating: game.rating,
  ratingTop: game.rating_top,
  ratingsCount: game.ratings_count,
  reviewsTextCount: game.reviews_text_count ?? null,
  added: game.added,
  metacritic: game.metacritic,
  playtime: game.playtime,
  updated: game.updated,
  lastSyncedAt: game.lastSyncedAt ?? null,
  esrbRating: game.esrb_rating
    ? {
        id: game.esrb_rating.id,
        slug: game.esrb_rating.slug,
        name: game.esrb_rating.name,
      }
    : null,
  platforms: game.platforms.map(toGamePlatformPresenter),
});