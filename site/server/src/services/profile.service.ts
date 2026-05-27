import { profileInteractionRepository } from "../repositories/profile-interaction.repository";
import { profileRepository } from "../repositories/profile.repository";
import {
  toGameReviewPresenter,
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

  public async getReviewsByUsername(username: string) {
    const reviews = await profileInteractionRepository.findReviewsByUsername(username);

    return reviews.map(toGameReviewPresenter);
  }
}

export const profileService = new ProfileService();
