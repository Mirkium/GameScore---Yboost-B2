import app from "./app";
import { AppDataSource } from "./config/database";

const PORT = Number(process.env.PORT ?? 3000);

const bootstrap = async (): Promise<void> => {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

void bootstrap().catch((error: unknown) => {
  console.error("Error during bootstrap", error);
  process.exit(1);
});