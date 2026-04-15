import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Game } from "./game.entity";
import { Platform } from "./platform.entity";
import { PlatformRequirements } from "./platform-requirements.entity";

@Entity({ name: "game_platforms" })
export class GamePlatform {
  @PrimaryGeneratedColumn({ unsigned: true })
  id!: number;

  @ManyToOne(() => Game, (game) => game.platforms, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "game_id" })
  game!: Game;

  @ManyToOne(() => Platform, (platform) => platform.game_platforms, {
    nullable: false,
    cascade: ["insert", "update"],
  })
  @JoinColumn({ name: "platform_id" })
  platform!: Platform;

  @Column({ type: "varchar", length: 100, nullable: true })
  released_at?: string;

  @OneToOne(() => PlatformRequirements, (requirements) => requirements.game_platform, {
    nullable: true,
    cascade: true,
  })
  @JoinColumn({ name: "requirements_id" })
  requirements?: PlatformRequirements;
}
