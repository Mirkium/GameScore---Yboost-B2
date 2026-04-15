import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { Game } from "./game.entity";
import { Profile } from "./profile.entity";

@Unique("UQ_profile_game_rating", ["profile", "game"])
@Entity({ name: "game_ratings" })
export class GameRating {
  @PrimaryGeneratedColumn({ unsigned: true })
  id!: number;

  @ManyToOne(() => Profile, (profile) => profile.gameRatings, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "profile_id" })
  profile!: Profile;

  @ManyToOne(() => Game, (game) => game.ratingsByProfiles, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "game_id" })
  game!: Game;

  @Column({ type: "tinyint", unsigned: true })
  stars!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
