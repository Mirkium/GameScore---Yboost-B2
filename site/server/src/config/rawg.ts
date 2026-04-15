export interface RawgConfig {
  readonly baseUrl: string;
  readonly apiKey: string;
}

export const rawgConfig: RawgConfig = {
  baseUrl: process.env.RAWG_API_BASE_URL ?? "https://api.rawg.io/api",
  apiKey: process.env.RAWG_API_KEY ?? "",
};

export const buildRawgUrl = (
  path: string,
  query?: Record<string, string | number | undefined>
): string => {
  const baseUrl = rawgConfig.baseUrl.endsWith("/")
    ? rawgConfig.baseUrl
    : `${rawgConfig.baseUrl}/`;
  const url = new URL(path, baseUrl);

  if (rawgConfig.apiKey) {
    url.searchParams.set("key", rawgConfig.apiKey);
  }

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
};