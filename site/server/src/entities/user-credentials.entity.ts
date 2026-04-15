import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { Profile } from "./profile.entity";

@Unique("UQ_user_credentials_provider_account", ["provider", "providerAccountId"])
@Entity({ name: "user_credentials" })
export class UserCredentials {
  @PrimaryGeneratedColumn({ unsigned: true })
  id!: number;

  @Column({ type: "enum", enum: ['password'], default: "password" })
  provider!: 'password' | string;

  @Column({ type: "varchar", length: 255, nullable: true })
  providerAccountId?: string;

  @Column({ type: "varchar", length: 255, unique: true, nullable: true })
  email?: string;

  @Column({ type: "boolean", default: false })
  emailVerified!: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  passwordHash?: string;

  @Column({ type: "text", nullable: true })
  accessToken?: string;

  @Column({ type: "datetime", nullable: true })
  tokenExpiresAt?: Date;

  @OneToOne(() => Profile, (profile) => profile.credentials, {
    nullable: false,
    onDelete: "CASCADE",
    cascade: ["insert", "update"],
  })
  @JoinColumn({ name: "profile_id" })
  profile!: Profile;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
