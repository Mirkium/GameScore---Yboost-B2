import { Request, Response } from "express";
import { gameService } from "../services/game.service";
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

export class GameController {
  private buildPaginatedResponse(
    req: Request,
    query: { page?: number; pageSize?: number },
    payload: {
      count: number;
      games: ReadonlyArray<Record<string, unknown>>;
      hasMore: boolean;
    }
  ) {
    const currentPage = query.page ?? 1;
    const result = {
      count: payload.count,
      games: payload.games,
      hasMore: payload.hasMore,
      next: "",
    };

    if (payload.hasMore) {
      const nextUrl = new URL(req.originalUrl, `${req.protocol}://${req.get("host")}`);
      nextUrl.searchParams.set("page", String(currentPage + 1));
      result.next = nextUrl.href;
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

  public readonly getGame = async (req: Request, res: Response): Promise<void> => {
    const params = req.params as unknown as ExternalGameParamsDto;
    const game = await gameService.getGameById(params.gameId);
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

  public readonly commentGame = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const params = req.params as unknown as ExternalGameParamsDto;
    const payload = req.body as CreateGameCommentDto;
    const result = await gameService.commentGame(userId, params.gameId, payload);
    res.status(201).json(result);
  };

  public readonly rateGame = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const params = req.params as unknown as ExternalGameParamsDto;
    const payload = req.body as RateGameDto;
    const result = await gameService.rateGame(userId, params.gameId, payload);
    res.status(201).json(result);
  };
}

export const gameController = new GameController();