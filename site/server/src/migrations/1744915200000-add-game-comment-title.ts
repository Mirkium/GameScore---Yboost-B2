import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddGameCommentTitle1744915200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("game_comments");
    const hasColumn = table?.findColumnByName("title");

    if (!hasColumn) {
      await queryRunner.addColumn(
        "game_comments",
        new TableColumn({
          name: "title",
          type: "varchar",
          length: "255",
          isNullable: true,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("game_comments");
    const hasColumn = table?.findColumnByName("title");

    if (hasColumn) {
      await queryRunner.dropColumn("game_comments", "title");
    }
  }
}
