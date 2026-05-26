import { GameComment } from "../../entities/game-comment.entity";
import { GameRating } from "../../entities/game-rating.entity";
import { Profile } from "../../entities/profile.entity";
import { ProfileLikedGame } from "../../entities/profile-liked-game.entity";

export type PublicProfilePresenter = {
  readonly username: string | null;
  readonly email: string | null;
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

export type GameCommentPresenter = {
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

export type GameRatingPresenter = {
  readonly id: number;
  readonly gameId: number;
  readonly gameSlug: string;
  readonly gameName: string;
  readonly rating: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export const toPublicProfilePresenter = (
  profile: Profile
): PublicProfilePresenter => ({
  username: profile.username ?? null,
  email: profile.credentials?.email ?? null,
  profilePicture: profile.avatarUrl ?? null,
  isVerified: profile.isVerified,
  score: profile.score,
});

export const toGameRatingPresenter = (
  gameRating: GameRating
): GameRatingPresenter => ({
  id: gameRating.id,
  gameId: gameRating.game.id,
  gameSlug: gameRating.game.slug,
  gameName: gameRating.game.name,
  rating: gameRating.stars,
  createdAt: gameRating.createdAt,
  updatedAt: gameRating.updatedAt,
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

export const toGameCommentPresenter = (
  gameComment: GameComment
): GameCommentPresenter => ({
  id: gameComment.id,
  gameId: gameComment.game.id,
  gameSlug: gameComment.game.slug,
  gameName: gameComment.game.name,
  title: gameComment.title ?? null,
  rating: gameComment.rating ?? null,
  comment: gameComment.comment,
  createdAt: gameComment.createdAt,
  updatedAt: gameComment.updatedAt,
});


