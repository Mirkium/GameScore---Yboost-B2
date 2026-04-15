import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddGameLastSyncedAt1744736400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("games");
    const hasColumn = table?.findColumnByName("lastSyncedAt");

    if (!hasColumn) {
      await queryRunner.addColumn(
        "games",
        new TableColumn({
          name: "lastSyncedAt",
          type: "datetime",
          isNullable: true,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("games");
    const hasColumn = table?.findColumnByName("lastSyncedAt");

    if (hasColumn) {
      await queryRunner.dropColumn("games", "lastSyncedAt");
    }
  }
}