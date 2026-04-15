import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { EsrbRating } from "./esrb-rating.entity";
import { GameComment } from "./game-comment.entity";
import { GamePlatform } from "./game-platform.entity";
import { GameRating } from "./game-rating.entity";
import { ProfileLikedGame } from "./profile-liked-game.entity";

@Entity({ name: "games" })
export class Game {
  @PrimaryColumn({ type: "int", unsigned: true, unique: true })
  id!: number;

  @Column({ type: "varchar", length: 255, unique: true })
  slug!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "date", nullable: true })
  released?: Date;

  @Column({ type: "boolean", default: false })
  tba!: boolean;

  @Column({ type: "text", nullable: true })
  background_image?: string;

  @Column({ type: "float", default: 0 })
  rating!: number;

  @Column({ type: "int", default: 0 })
  rating_top!: number;

  @Column({ type: "json", nullable: true })
  ratings?: Record<string, unknown>;

  @Column({ type: "int", default: 0 })
  ratings_count!: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  reviews_text_count?: string;

  @Column({ type: "int", default: 0 })
  added!: number;

  @Column({ type: "json", nullable: true })
  added_by_status?: Record<string, unknown>;

  @Column({ type: "int", default: 0 })
  metacritic!: number;

  @Column({ type: "int", default: 0 })
  playtime!: number;

  @Column({ type: "datetime" })
  updated!: Date;

  @Column({ type: "datetime", nullable: true })
  lastSyncedAt?: Date;

  @ManyToOne(() => EsrbRating, (esrbRating) => esrbRating.games, {
    nullable: true,
    cascade: ["insert", "update"],
  })
  @JoinColumn({ name: "esrb_rating_id" })
  esrb_rating?: EsrbRating;

  @OneToMany(() => GamePlatform, (gamePlatform) => gamePlatform.game, {
    cascade: true,
  })
  platforms!: GamePlatform[];

  @OneToMany(() => ProfileLikedGame, (likedGame) => likedGame.game)
  likedByProfiles!: ProfileLikedGame[];

  @OneToMany(() => GameComment, (comment) => comment.game)
  comments!: GameComment[];

  @OneToMany(() => GameRating, (rating) => rating.game)
  ratingsByProfiles!: GameRating[];
}