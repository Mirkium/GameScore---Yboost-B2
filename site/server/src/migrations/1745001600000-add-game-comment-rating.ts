import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddGameCommentRating1745001600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("game_comments");
    const hasColumn = table?.findColumnByName("rating");

    if (!hasColumn) {
      await queryRunner.addColumn(
        "game_comments",
        new TableColumn({
          name: "rating",
          type: "tinyint",
          unsigned: true,
          isNullable: true,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("game_comments");
    const hasColumn = table?.findColumnByName("rating");

    if (hasColumn) {
      await queryRunner.dropColumn("game_comments", "rating");
    }
  }
}
