import { Router } from "express";
import { profileController } from "../controllers/profile.controller";
import { validateDto } from "../middlewares/validation.middleware";
import { asyncHandler } from "../utils/async-handler";
import { ProfileUsernameParamsDto } from "../types/dtos/profile.dto";

const router = Router();

router.get(
  "/:username",
  validateDto(ProfileUsernameParamsDto, "params"),
  asyncHandler(profileController.getPublicProfile)
);
router.get(
  "/:username/liked-games",
  validateDto(ProfileUsernameParamsDto, "params"),
  asyncHandler(profileController.getProfileLikedGames)
);
router.get(
  "/:username/reviews",
  validateDto(ProfileUsernameParamsDto, "params"),
  asyncHandler(profileController.getProfileReviews)
);
export default router;
