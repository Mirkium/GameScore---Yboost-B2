import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Game } from "./game.entity";
import { Profile } from "./profile.entity";

@Entity({ name: "game_comments" })
export class GameComment {
  @PrimaryGeneratedColumn({ unsigned: true })
  id!: number;

  @ManyToOne(() => Profile, (profile) => profile.gameComments, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "author_profile_id" })
  author!: Profile;

  @ManyToOne(() => Game, (game) => game.comments, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "game_id" })
  game!: Game;

  @Column({ type: "text" })
  comment!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
