import { Router } from "express";
import { gameController } from "../controllers/game.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { validateDto } from "../middlewares/validation.middleware";
import { asyncHandler } from "../utils/async-handler";
import {
  ExternalGameParamsDto,
  ExternalGameSearchQueryDto,
  PopularGamesQueryDto,
} from "../types/dtos/game.dto";
import {
  CreateGameCommentDto,
  LikeGameDto,
  RateGameDto,
} from "../types/dtos/game-interaction.dto";

const router = Router();

router.get(
  "/search",
  validateDto(ExternalGameSearchQueryDto, "query"),
  asyncHandler(gameController.searchGames)
);
router.get(
  "/popular",
  validateDto(PopularGamesQueryDto, "query"),
  asyncHandler(gameController.getPopularGames)
);
router.get(
  "/:gameId",
  validateDto(ExternalGameParamsDto, "params"),
  asyncHandler(gameController.getGame)
);
router.post(
  "/:gameId/likes",
  verifyToken,
  validateDto(ExternalGameParamsDto, "params"),
  validateDto(LikeGameDto),
  asyncHandler(gameController.likeGame)
);
router.post(
  "/:gameId/comments",
  verifyToken,
  validateDto(ExternalGameParamsDto, "params"),
  validateDto(CreateGameCommentDto),
  asyncHandler(gameController.commentGame)
);
router.post(
  "/:gameId/ratings",
  verifyToken,
  validateDto(ExternalGameParamsDto, "params"),
  validateDto(RateGameDto),
  asyncHandler(gameController.rateGame)
);

export default router;