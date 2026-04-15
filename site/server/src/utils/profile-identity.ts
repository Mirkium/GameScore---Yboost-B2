const normalizeUsername = (value: string): string => value.toLowerCase().replace(/[^a-z0-9_]/g, "");

export const buildUsernameCandidate = (email: string, requestedUsername?: string): string => {
  const fromRequest = requestedUsername?.trim();
  if (fromRequest && fromRequest.length > 0) {
    return normalizeUsername(fromRequest);
  }

  const emailPrefix = email.split("@")[0] ?? "player";
  const normalized = normalizeUsername(emailPrefix);
  return normalized.length > 0 ? normalized : "player";
};