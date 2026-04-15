import bcrypt from "bcryptjs";
import { generateAccessToken } from "../middlewares/auth.middleware";
import { profileRepository } from "../repositories/profile.repository";
import { userCredentialsRepository } from "../repositories/user-credentials.repository";
import { RegisterDto, LoginDto } from "../types/dtos/auth.dto";
import { toAuthResponsePresenter } from "../types/presenters";
import { AppError } from "../utils/app-error";
import { buildUsernameCandidate } from "../utils/profile-identity";

export class AuthService {
  private async resolveUniqueUsername(email: string, requestedUsername?: string): Promise<string> {
    const baseCandidate = buildUsernameCandidate(email, requestedUsername);
    let candidate = baseCandidate;
    let index = 1;

    while (await profileRepository.existsByUsername(candidate)) {
      candidate = `${baseCandidate}${index}`;
      index += 1;
    }

    return candidate;
  }

  public async register(dto: RegisterDto) {
    const existingCredentials = await userCredentialsRepository.existsByEmail(dto.email);
    if (existingCredentials) {
      throw new AppError(409, "Email already registered");
    }

    const username = await this.resolveUniqueUsername(dto.email, dto.username);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const profile = await profileRepository.create({
      username,
      firstName: dto.firstName?.trim(),
      lastName: dto.lastName?.trim(),
    });

    await userCredentialsRepository.createLocalCredentials({
      email: dto.email.toLowerCase(),
      passwordHash,
      profileId: profile.id,
    });

    const accessToken = generateAccessToken({
      id: profile.id,
      email: dto.email,
      username,
    });

    return toAuthResponsePresenter({
      id: profile.id,
      email: dto.email,
      username,
      accessToken,
    });
  }

  public async login(dto: LoginDto) {
    const credentials = await userCredentialsRepository.findByEmail(dto.email.toLowerCase());
    if (!credentials) {
      throw new AppError(401, "Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      credentials.passwordHash || ""
    );
    if (!isPasswordValid) {
      throw new AppError(401, "Invalid email or password");
    }

    const accessToken = generateAccessToken({
      id: credentials.profile.id,
      email: credentials.email || "",
      username: credentials.profile.username,
    });

    return toAuthResponsePresenter({
      id: credentials.profile.id,
      email: credentials.email ?? "",
      username: credentials.profile.username,
      accessToken,
    });
  }

  public async logout(userId: string): Promise<{ message: string }> {
    await userCredentialsRepository.findByProfileId(userId);
    return { message: "Logged out successfully" };
  }

  public async getMe(userId: string): Promise<{ id: string; email: string; username: string | null }> {
    const credentials = await userCredentialsRepository.findByProfileId(userId);
    if (!credentials) {
      throw new AppError(404, "User not found");
    }

    return {
      id: credentials.profile.id,
      email: credentials.email ?? "",
      username: credentials.profile.username ?? null,
    };
  }
}

export const authService = new AuthService();
