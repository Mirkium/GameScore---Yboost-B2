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

  public readonly getProfileComments = async (req: Request, res: Response): Promise<void> => {
    const username = String(req.params.username);
    const comments = await profileService.getCommentsByUsername(username);
    res.status(200).json(comments);
  };

  public readonly getProfileRatings = async (req: Request, res: Response): Promise<void> => {
    const username = String(req.params.username);
    const ratings = await profileService.getRatingsByUsername(username);
    res.status(200).json(ratings);
  };
}

export const profileController = new ProfileController();
