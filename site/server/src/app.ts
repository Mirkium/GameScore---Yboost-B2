import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import path from "path";
import cors from "cors";
import express from "express";
import routes from "./routes";
import { errorMiddleware } from "./middlewares/error.middleware";

const app = express();

// CORS — allow frontend from any origin during development
app.use(cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the frontend static files so the API and UI share the same origin
const frontendPath = path.join(__dirname, "../../FrontEnd/Public");
app.use(express.static(frontendPath));

// API routes
app.use("/api", routes);

// Fallback: serve home.html for the root
app.get("/", (_req, res) => {
  res.sendFile(path.join(frontendPath, "home.html"));
});

// Error handler
app.use(errorMiddleware);

export default app;
