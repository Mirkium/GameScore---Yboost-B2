import { GameReview } from "../../entities/game-review.entity";
import { Profile } from "../../entities/profile.entity";
import { ProfileLikedGame } from "../../entities/profile-liked-game.entity";

export type PublicProfilePresenter = {
  readonly username: string | null;
  readonly profilePicture: string | null;
  readonly isVerified: boolean;
  readonly score: number;
};

export type LikedGamePresenter = {
  readonly gameId: number;
  readonly gameSlug: string;
  readonly gameName: string;
  readonly backgroundImage: string | null;
  readonly isFavorite: boolean;
  readonly likedAt: Date;
};

export type GameReviewPresenter = {
  readonly id: number;
  readonly gameId: number;
  readonly gameSlug: string;
  readonly gameName: string;
  readonly title: string | null;
  readonly rating: number | null;
  readonly comment: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export const toPublicProfilePresenter = (
  profile: Profile
): PublicProfilePresenter => ({
  username: profile.username ?? null,
  profilePicture: profile.avatarUrl ?? null,
  isVerified: profile.isVerified,
  score: profile.score,
});

export const toLikedGamePresenter = (
  likedGame: ProfileLikedGame
): LikedGamePresenter => ({
  gameId: likedGame.game.id,
  gameSlug: likedGame.game.slug,
  gameName: likedGame.game.name,
  backgroundImage: likedGame.game.background_image ?? null,
  isFavorite: likedGame.isFavorite,
  likedAt: likedGame.likedAt,
});

export const toGameReviewPresenter = (
  gameReview: GameReview
): GameReviewPresenter => ({
  id: gameReview.id,
  gameId: gameReview.game.id,
  gameSlug: gameReview.game.slug,
  gameName: gameReview.game.name,
  title: gameReview.title ?? null,
  rating: gameReview.rating ?? null,
  comment: gameReview.comment,
  createdAt: gameReview.createdAt,
  updatedAt: gameReview.updatedAt,
});


