import { profileInteractionRepository } from "../repositories/profile-interaction.repository";
import { profileRepository } from "../repositories/profile.repository";
import {
  toGameCommentPresenter,
  toGameRatingPresenter,
  toLikedGamePresenter,
  toPublicProfilePresenter,
} from "../types/presenters/profile.presenter";
import { AppError } from "../utils/app-error";

export class ProfileService {
  public async getPublicProfileByUsername(username: string) {
    const profile = await profileRepository.findByUsernameWithCredentials(username);

    if (!profile) {
      throw new AppError(404, "Profile not found");
    }

    return toPublicProfilePresenter(profile);
  }

  public async getLikedGamesByUsername(username: string) {
    const likedGames = await profileInteractionRepository.findLikedGamesByUsername(username);

    return likedGames.map(toLikedGamePresenter);
  }

  public async getCommentsByUsername(username: string) {
    const [comments, ratings] = await Promise.all([
      profileInteractionRepository.findCommentsByUsername(username),
      profileInteractionRepository.findRatingsByUsername(username),
    ]);

    const ratingByGameId = new Map(ratings.map(r => [r.game.id, r.stars]));

    return comments.map((c) => {
      const p = toGameCommentPresenter(c);
      return {
        ...p,
        rating: p.rating ?? ratingByGameId.get(c.game.id) ?? null,
      };
    });
  }

  public async getRatingsByUsername(username: string) {
    const ratings = await profileInteractionRepository.findRatingsByUsername(username);

    return ratings.map(toGameRatingPresenter);
  }
}

export const profileService = new ProfileService();
