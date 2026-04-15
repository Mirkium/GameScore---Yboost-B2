export interface AuthConfig {
  readonly jwtSecret: string;
  readonly accessTokenExpiresIn: string;
}

export const authConfig: AuthConfig = {
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  accessTokenExpiresIn: process.env.JWT_ACCESS_TTL ?? "4h",
};