import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { GameReview } from "./game-review.entity";
import { ProfileLikedGame } from "./profile-liked-game.entity";
import { UserCredentials } from "./user-credentials.entity";

@Entity({ name: "profiles" })
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: "varchar", nullable: true })
  avatarUrl?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  firstName?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  lastName?: string;

  @Column({ type: "varchar", length: 50, nullable: true, unique: true })
  username?: string;

  @Column({ type: "varchar", length: 55, nullable: true, unique: true })
  slug?: string;

  @Column({ type: "boolean", default: false })
  isVerified!: boolean;

  @Column({ type: "int", unsigned: true, default: 0 })
  score!: number;

  @OneToOne(() => UserCredentials, (credentials) => credentials.profile)
  credentials?: UserCredentials;

  @OneToMany(() => ProfileLikedGame, (likedGame) => likedGame.profile)
  likedGames!: ProfileLikedGame[];

  @OneToMany(() => GameReview, (review) => review.author)
  gameReviews!: GameReview[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
