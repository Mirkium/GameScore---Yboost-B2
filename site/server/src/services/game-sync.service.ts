import { gameRepository } from "../repositories/game.repository";
import { rawgService } from "./rawg.service";

interface ResolveGameOptions {
  readonly forceRefresh?: boolean;
  readonly staleAfterHours?: number;
}

const isStale = (lastSyncedAt: Date | undefined, staleAfterHours: number): boolean => {
  if (!lastSyncedAt) {
    return true;
  }

  const staleThreshold = Date.now() - staleAfterHours * 60 * 60 * 1000;
  return lastSyncedAt.getTime() < staleThreshold;
};

const asNumber = (value: unknown, fallback: number): number => {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

const asString = (value: unknown, fallback: string): string => {
  return typeof value === "string" && value.length > 0 ? value : fallback;
};

export class GameSyncService {
  public async resolveGame(rawgId: number, options?: ResolveGameOptions) {
    const staleAfterHours = options?.staleAfterHours ?? 168;
    const localGame = await gameRepository.findById(rawgId);

    if (localGame && !options?.forceRefresh && !isStale(localGame.lastSyncedAt, staleAfterHours)) {
      return localGame;
    }

    const rawgGame = await rawgService.getGameById(rawgId);

    return gameRepository.upsertFromRawg({
      id: rawgGame.id,
      slug: asString(rawgGame.slug, `rawg-${rawgGame.id}`),
      name: asString(rawgGame.name, `RAWG #${rawgGame.id}`),
      released: rawgGame.released ? new Date(rawgGame.released) : undefined,
      tba: Boolean(rawgGame.tba),
      backgroundImage: rawgGame.background_image,
      rating: asNumber(rawgGame.rating, 0),
      ratingTop: asNumber(rawgGame.rating_top, 0),
      ratings: rawgGame.ratings,
      ratingsCount: asNumber(rawgGame.ratings_count, 0),
      reviewsTextCount: rawgGame.reviews_text_count,
      added: asNumber(rawgGame.added, 0),
      addedByStatus: rawgGame.added_by_status,
      metacritic: asNumber(rawgGame.metacritic, 0),
      playtime: asNumber(rawgGame.playtime, 0),
      updated: rawgGame.updated ? new Date(rawgGame.updated) : new Date(),
      esrb: rawgGame.esrb_rating,
      platforms: (rawgGame.platforms ?? []).map((platformEntry) => ({
        id: platformEntry.platform.id,
        slug: platformEntry.platform.slug,
        name: platformEntry.platform.name,
        releasedAt: platformEntry.released_at,
        requirements: platformEntry.requirements_en
          ? {
              minimum: platformEntry.requirements_en.minimum,
              recommended: platformEntry.requirements_en.recommended,
            }
          : undefined,
      })),
    });
  }
}

export const gameSyncService = new GameSyncService();