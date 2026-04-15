import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { validateDto } from "../middlewares/validation.middleware";
import { asyncHandler } from "../utils/async-handler";
import { LoginDto, RegisterDto } from "../types/dtos/auth.dto";

const router = Router();

router.get("/me", verifyToken, asyncHandler(authController.getMe));
router.post(
  "/register",
  validateDto(RegisterDto),
  asyncHandler(authController.register)
);
router.post(
  "/login",
  validateDto(LoginDto),
  asyncHandler(authController.login)
);
router.post("/logout", verifyToken, asyncHandler(authController.logout));

export default router;
