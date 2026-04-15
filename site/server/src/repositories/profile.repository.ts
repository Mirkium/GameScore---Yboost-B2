import { AppDataSource } from "../config/database";
import { Profile } from "../entities/profile.entity";

export interface CreateProfileInput {
  readonly username: string;
  readonly firstName?: string;
  readonly lastName?: string;
}

export class ProfileRepository {
  private readonly repository = AppDataSource.getRepository(Profile);

  public async create(input: CreateProfileInput): Promise<Profile> {
    const profile = this.repository.create({
      username: input.username,
      slug: input.username.toLowerCase(),
      firstName: input.firstName,
      lastName: input.lastName,
    });

    return this.repository.save(profile);
  }

  public async existsByUsername(username: string): Promise<boolean> {
    const count = await this.repository.count({ where: { username } });
    return count > 0;
  }

  public async findById(profileId: string): Promise<Profile | null> {
    return this.repository.findOne({ where: { id: profileId } });
  }

  public async findByUsernameWithCredentials(username: string): Promise<Profile | null> {
    return this.repository.findOne({
      where: { username },
      relations: ["credentials"],
    });
  }
}

export const profileRepository = new ProfileRepository();