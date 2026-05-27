import { Request, Response } from "express";
import { gameService } from "../services/game.service";
import {
  ExternalGameParamsDto,
  ExternalGameSearchQueryDto,
  PopularGamesQueryDto,
} from "../types/dtos/game.dto";
import {
  CreateGameReviewDto,
  LikeGameDto,
} from "../types/dtos/game-interaction.dto";

export class GameController {
  private buildPaginatedResponse(
    req: Request,
    query: { page?: number; pageSize?: number },
    payload: {
      count: number;
      games: ReadonlyArray<Record<string, unknown>>;
      page: number;
      hasMore: boolean;
    }
  ) {
    const currentPage = query.page ?? 1;
    const result = {
      count: payload.count,
      games: payload.games,
      page: payload.page,
      hasMore: payload.hasMore,
      next: "",
      previous: "",
    };

    if (payload.hasMore) {
      const nextUrl = new URL(req.originalUrl, `${req.protocol}://${req.get("host")}`);
      nextUrl.searchParams.set("page", String(currentPage + 1));
      result.next = nextUrl.href;
    }

    if (currentPage > 1) {
      const prevUrl = new URL(req.originalUrl, `${req.protocol}://${req.get("host")}`);
      prevUrl.searchParams.set("page", String(currentPage - 1));
      result.previous = prevUrl.href;
    }

    return result;
  }

  public readonly searchGames = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as ExternalGameSearchQueryDto;
    const games = await gameService.searchGames(query);
    const result = this.buildPaginatedResponse(req, query, games);

    res.status(200).json(result);
  };

  public readonly getPopularGames = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PopularGamesQueryDto;
    const games = await gameService.getPopularGames(query);
    const result = this.buildPaginatedResponse(req, query, games);

    res.status(200).json(result);
  };

  public readonly getStats = async (_req: Request, res: Response): Promise<void> => {
    const stats = await gameService.getStats();
    res.status(200).json(stats);
  };

  public readonly getRecentlyReviewedGames = async (req: Request, res: Response): Promise<void> => {
    const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 12, 1), 50);
    const result = await gameService.getRecentlyReviewedGames(limit);
    res.status(200).json(result);
  };

  public readonly getGame = async (req: Request, res: Response): Promise<void> => {
    const params = req.params as unknown as ExternalGameParamsDto;
    const userId = req.user?.id;
    const game = await gameService.getGameById(params.gameId, userId);
    res.status(200).json(game);
  };

  public readonly likeGame = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const params = req.params as unknown as ExternalGameParamsDto;
    const payload = req.body as LikeGameDto;
    const result = await gameService.likeGame(userId, params.gameId, payload);
    res.status(201).json(result);
  };

  public readonly getGameReviews = async (req: Request, res: Response): Promise<void> => {
    const params = req.params as unknown as ExternalGameParamsDto;
    const reviews = await gameService.getGameReviews(params.gameId);
    res.status(200).json(reviews);
  };

  public readonly createGameReview = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const params = req.params as unknown as ExternalGameParamsDto;
    const payload = req.body as CreateGameReviewDto;
    const result = await gameService.createGameReview(userId, params.gameId, payload);
    res.status(201).json(result);
  };
}

export const gameController = new GameController();