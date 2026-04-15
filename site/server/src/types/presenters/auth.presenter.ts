export interface AuthResponsePresenter {
  readonly id: string;
  readonly email: string;
  readonly username: string | null;
  readonly accessToken: string;
}

export const toAuthResponsePresenter = (
  input: {
    readonly id: string;
    readonly email: string;
    readonly username?: string | null;
    readonly accessToken: string;
  }
): AuthResponsePresenter => ({
  id: input.id,
  email: input.email,
  username: input.username ?? null,
  accessToken: input.accessToken,
});

