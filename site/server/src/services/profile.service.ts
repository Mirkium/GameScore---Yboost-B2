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
    const comments = await profileInteractionRepository.findCommentsByUsername(username);

    return comments.map(toGameCommentPresenter);
  }

  public async getRatingsByUsername(username: string) {
    const ratings = await profileInteractionRepository.findRatingsByUsername(username);

    return ratings.map(toGameRatingPresenter);
  }
}

export const profileService = new ProfileService();
