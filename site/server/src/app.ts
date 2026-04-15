import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import routes from "./routes";
import { errorMiddleware } from "./middlewares/error.middleware";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", routes);
app.use(errorMiddleware);

export default app;
