import { Request, Response } from "express";
import { RegisterDto, LoginDto } from "../types/dtos/auth.dto";
import { authService } from "../services/auth.service";

export class AuthController {
  public readonly register = async (req: Request, res: Response): Promise<void> => {
    const payload = req.body as RegisterDto;
    const result = await authService.register(payload);
    res.status(201).json(result);
  };

  public readonly login = async (req: Request, res: Response): Promise<void> => {
    const payload = req.body as LoginDto;
    const result = await authService.login(payload);
    res.status(200).json(result);
  };

  public readonly logout = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const result = await authService.logout(userId);
    res.status(200).json(result);
  };

  public readonly getMe = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const result = await authService.getMe(userId);
    res.status(200).json(result);
  };
}

export const authController = new AuthController();