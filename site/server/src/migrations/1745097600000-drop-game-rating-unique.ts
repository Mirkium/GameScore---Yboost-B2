import { MigrationInterface, QueryRunner } from "typeorm";

export class DropGameRatingUnique1745097600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("game_ratings");
    const hasIndex = table?.indices.find(
      (i) => i.name === "IDX_game_ratings_profile_game"
    );
    const hasUnique = table?.indices.find(
      (i) => i.name === "UQ_profile_game_rating"
    );

    if (hasUnique) {
      if (!hasIndex) {
        await queryRunner.query(
          "CREATE INDEX `IDX_game_ratings_profile_game` ON `game_ratings` (`profile_id`, `game_id`)"
        );
      }
      await queryRunner.query(
        "ALTER TABLE `game_ratings` DROP INDEX `UQ_profile_game_rating`"
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("game_ratings");
    const hasUnique = table?.indices.find(
      (i) => i.name === "UQ_profile_game_rating"
    );

    if (!hasUnique) {
      await queryRunner.query(
        "ALTER TABLE `game_ratings` DROP INDEX `IDX_game_ratings_profile_game`"
      );
      await queryRunner.query(
        "ALTER TABLE `game_ratings` ADD UNIQUE INDEX `UQ_profile_game_rating` (`profile_id`, `game_id`)"
      );
    }
  }
}
