const API_BASE = "{{ENDPOINT}}";
const LS_TOKEN = "gamescore-token";
const LS_USER = "gamescore-user";
const LS_THEME = "gamescore-theme";

function getToken() { return localStorage.getItem(LS_TOKEN); }
function setToken(t) { localStorage.setItem(LS_TOKEN, t); }
function clearToken() { localStorage.removeItem(LS_TOKEN); }

function getStoredUser() {
  try { const r = localStorage.getItem(LS_USER); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function setStoredUser(u) { localStorage.setItem(LS_USER, JSON.stringify(u)); }
function clearStoredUser() { localStorage.removeItem(LS_USER); }

function isLoggedIn() { return !!getToken(); }

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  };
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, config);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || `API error (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function loginUser(email, password) {
  return apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}
function registerUser(email, password, username) {
  return apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ email, password, username }) });
}
function fetchMe() { return apiFetch("/auth/me"); }
function logoutUser() { return apiFetch("/auth/logout", { method: "POST" }); }

function fetchPopularGames(page, pageSize) {
  return apiFetch(`/games/popular?page=${page}&pageSize=${pageSize}`);
}
function fetchGameStats() {
  return apiFetch("/games/stats");
}
function fetchRecentlyReviewedGames(limit) {
  return apiFetch(`/games/recent-reviews?limit=${limit}`);
}
function fetchGameById(id) { return apiFetch(`/games/${id}`); }
function searchGames(q) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) { if (v != null && v !== "") p.set(k, String(v)); }
  return apiFetch(`/games/search?${p}`);
}
function likeGame(id, isFavorite) {
  return apiFetch(`/games/${id}/likes`, { method: "POST", body: JSON.stringify({ isFavorite: isFavorite ?? true }) });
}
function fetchGameReviews(id) {
  return apiFetch(`/games/${id}/reviews`);
}
function createGameReview(id, data) {
  return apiFetch(`/games/${id}/review`, { method: "POST", body: JSON.stringify(data) });
}

function fetchProfile(username) { return apiFetch(`/profiles/${encodeURIComponent(username)}`); }
function fetchProfileLikedGames(username) { return apiFetch(`/profiles/${encodeURIComponent(username)}/liked-games`); }
function fetchProfileReviews(username) { return apiFetch(`/profiles/${encodeURIComponent(username)}/reviews`); }


function applyTheme(theme) {
  const next = theme === "light" ? "light" : "dark";
  document.body.classList.toggle("lightMode", next === "light");
  localStorage.setItem(LS_THEME, next);
  document.querySelectorAll(".brightnessControl").forEach(b => {
    b.textContent = next === "light" ? "Dark mode" : "Light mode";
    b.setAttribute("aria-pressed", String(next === "light"));
  });
}
