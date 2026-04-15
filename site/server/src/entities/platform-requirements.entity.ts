import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { GamePlatform } from "./game-platform.entity";

@Entity({ name: "platform_requirements" })
export class PlatformRequirements {
  @PrimaryGeneratedColumn({ unsigned: true })
  id!: number;

  @Column({ type: "text", nullable: true })
  minimum?: string;

  @Column({ type: "text", nullable: true })
  recommended?: string;

  @OneToOne(() => GamePlatform, (gamePlatform) => gamePlatform.requirements)
  game_platform!: GamePlatform;
}
