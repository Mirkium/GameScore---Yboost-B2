import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Game } from "./game.entity";
import { Profile } from "./profile.entity";

@Unique("UQ_profile_game_like", ["profile", "game"])
@Entity({ name: "profile_liked_games" })
export class ProfileLikedGame {
  @PrimaryGeneratedColumn({ unsigned: true })
  id!: number;

  @ManyToOne(() => Profile, (profile) => profile.likedGames, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "profile_id" })
  profile!: Profile;

  @ManyToOne(() => Game, (game) => game.likedByProfiles, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "game_id" })
  game!: Game;

  @Column({ type: "boolean", default: false })
  isFavorite!: boolean;

  @CreateDateColumn()
  likedAt!: Date;
}
