import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { Game } from "./game.entity";

@Entity({ name: "esrb_ratings" })
export class EsrbRating {
  @PrimaryColumn({ type: "int", unsigned: true })
  id!: number;

  @Column({ type: "varchar", length: 100, unique: true })
  slug!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @OneToMany(() => Game, (game) => game.esrb_rating)
  games!: Game[];
}
