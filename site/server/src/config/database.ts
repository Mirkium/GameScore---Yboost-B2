import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { join } from "path";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "gamescore",
  synchronize: process.env.TYPEORM_SYNCHRONIZE === "true",
  logging: process.env.NODE_ENV !== "production",
  entities: [join(__dirname, "../entities/**/*.{js,ts}")],
  migrations: [join(__dirname, "../migrations/**/*.{js,ts}")],
});