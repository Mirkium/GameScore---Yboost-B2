import { AppDataSource } from "../config/database";
import { UserCredentials } from "../entities/user-credentials.entity";

export interface CreateLocalCredentialsInput {
  readonly email: string;
  readonly passwordHash: string;
  readonly profileId: string;
}

export class UserCredentialsRepository {
  private readonly repository = AppDataSource.getRepository(UserCredentials);

  public async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repository.count({ where: { email } });
    return count > 0;
  }

  public async findByEmail(email: string): Promise<UserCredentials | null> {
    return this.repository.findOne({
      where: { email },
      relations: ["profile"],
    });
  }

  public async findByProfileId(profileId: string): Promise<UserCredentials | null> {
    return this.repository.findOne({
      where: { profile: { id: profileId } },
      relations: ["profile"],
    });
  }

  public async createLocalCredentials(
    input: CreateLocalCredentialsInput
  ): Promise<UserCredentials> {
    const credentials = this.repository.create({
      email: input.email,
      passwordHash: input.passwordHash,
      provider: "password",
      profile: { id: input.profileId },
    });

    return this.repository.save(credentials);
  }
}

export const userCredentialsRepository = new UserCredentialsRepository();