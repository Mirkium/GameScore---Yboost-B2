import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { GamePlatform } from "./game-platform.entity";

@Entity({ name: "platforms" })
export class Platform {
  @PrimaryColumn({ type: "int", unsigned: true })
  id!: number;

  @Column({ type: "varchar", length: 100, unique: true })
  slug!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @OneToMany(() => GamePlatform, (gamePlatform) => gamePlatform.platform)
  game_platforms!: GamePlatform[];
}
