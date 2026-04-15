import { Router } from "express";
import authRoutes from "./auth.routes";
import gameRoutes from "./game.routes";
import profileRoutes from "./profile.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/games", gameRoutes);
router.use("/profiles", profileRoutes);

export default router;
