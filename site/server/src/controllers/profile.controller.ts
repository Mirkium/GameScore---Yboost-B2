import { Request, Response } from "express";
import { profileService } from "../services/profile.service";

export class ProfileController {
  public readonly getPublicProfile = async (req: Request, res: Response): Promise<void> => {
    const username = String(req.params.username);
    const profile = await profileService.getPublicProfileByUsername(username);
    res.status(200).json(profile);
  };

  public readonly getProfileLikedGames = async (req: Request, res: Response): Promise<void> => {
    const username = String(req.params.username);
    const likedGames = await profileService.getLikedGamesByUsername(username);
    res.status(200).json(likedGames);
  };

  public readonly getProfileReviews = async (req: Request, res: Response): Promise<void> => {
    const username = String(req.params.username);
    const reviews = await profileService.getReviewsByUsername(username);
    res.status(200).json(reviews);
  };

}

export const profileController = new ProfileController();
