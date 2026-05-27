// ─── Utilities ──────────────────────────────────────────────

function getPageName() {
  const p = (window.location.pathname.split("/").pop() || "");
  if (p === "" || p === "home.html" || p === "index.html") return "home";
  if (p === "connect.html") return "connect";
  if (p === "game.html") return "game";
  if (p === "user.html") return "user";
  if (p === "contact.html") return "contact";
  if (p === "search.html") return "search";
  if (p === "error.html") return "error";
  return "home";
}
function getQueryParam(name) { return new URLSearchParams(window.location.search).get(name); }
function clearEl(el) { if (el) el.innerHTML = ""; }
function getInitials(name) {
  if (!name) return "GS";
  const p = name.trim().split(/[\s_]+/);
  return p.length > 1 ? (p[0][0] + p[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
}

// ─── Score colouring (mirrors score-color.js logic) ────────

function interpolateColor(v) {
  v = Math.max(0, Math.min(100, v));
  let r, g, b;
  if (v >= 50) { const t = (v - 50) / 50; r = Math.round(255 + (0 - 255) * t); g = Math.round(153 + (229 - 153) * t); b = Math.round(0 + (255 - 0) * t); }
  else { const t = v / 50; r = 255; g = Math.round(26 + (153 - 26) * t); b = Math.round(26 + (0 - 26) * t); }
  return `rgb(${r},${g},${b})`;
}
function applyScoreColors(root) {
  (root || document).querySelectorAll(".NoteCommu,.recentGameNote,.gameScore,.smallScore").forEach(el => {
    const v = parseInt(el.textContent, 10);
    if (isNaN(v)) return;
    const c = interpolateColor(v);
    el.style.color = c;
    el.style.borderColor = c;
    el.style.textShadow = `0 0 5px ${c}, 0 0 10px ${c}, 0 0 20px ${c}`;
  });
}

// ─── Header ─────────────────────────────────────────────────

function updateHeader() {
  const nav = document.querySelector(".auth-nav");
  if (!nav) return;

  const render = (loggedIn, user) => {
    if (loggedIn && user) {
      nav.innerHTML = `
      <a href="./home.html" class="link signup">Home</a>
      <a href="./user.html" class="btn login">Profile</a>
      <button type="button" class="brightnessControl" aria-label="Toggle theme"></button>
      <button type="button" class="btn logout" id="logoutBtn">Logout</button>`;
    } else {
      nav.innerHTML = `
      <a href="./connect.html" class="link signup">Sign Up</a>
      <a href="./connect.html" class="btn login">Login</a>
      <button type="button" class="brightnessControl" aria-label="Toggle theme"></button>`;
    }

    const saved = localStorage.getItem(LS_THEME) || "dark";
    applyTheme(saved);

    document.querySelectorAll(".brightnessControl").forEach(b => {
      b.addEventListener("click", () => {
        const cur = localStorage.getItem(LS_THEME) || "dark";
        applyTheme(cur === "light" ? "dark" : "light");
      });
    });

    document.getElementById("logoutBtn")?.addEventListener("click", async () => {
      try { await logoutUser(); } catch { /* ignore */ }
      clearToken(); clearStoredUser(); window.location.href = "./home.html";
    });
  };

  const loggedIn = isLoggedIn();
  const user = getStoredUser();

  render(loggedIn, user);

  if (loggedIn) {
    fetchMe().catch(() => {
      clearToken();
      clearStoredUser();
      render(false, null);
    });
  }

  setupSearch();
}

function setupSearch() {
  const form = document.querySelector(".search-bar");
  if (!form) return;
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = newForm.querySelector(".search-input");
    const q = input ? input.value.trim() : "";
    if (!q) return;
    window.location.href = `./search.html?q=${encodeURIComponent(q)}`;
  });
}

// ─── HOME PAGE ──────────────────────────────────────────────

async function initHomePage() {
  try {
    const [popular, recent] = await Promise.all([
      fetchPopularGames(1, 12),
      fetchRecentlyReviewedGames(6),
    ]);

    const popularGames = popular.games || [];
    const recentGames = recent.games || [];

    if (popularGames.length > 0) {
      renderFeatured(popularGames[0]);
      renderTopGames(popularGames.slice(0, 8));
    }

    if (recentGames.length > 0) {
      renderRecentReviews(recentGames);
    }
  } catch (err) {
    console.error("Home page error:", err);
    const main = document.querySelector("main");
    if (main) main.prepend(createErrorBanner("Could not load games. Make sure the server is running."));
  }
  applyScoreColors();
}

function renderFeatured(game) {
  const sec = document.querySelector(".gamePresent");
  if (!sec) return;
  const bg = game.background_image || game.backgroundImage;
  if (bg) {
    const isLight = document.body.classList.contains("lightMode");
    const gradient = isLight
      ? "linear-gradient(90deg, rgba(244, 247, 251, 0.92) 40%, rgba(244, 247, 251, 0.36))"
      : "linear-gradient(90deg, rgba(5, 8, 22, 0.9) 40%, rgba(5, 8, 22, 0.3))";
    sec.style.backgroundImage = `${gradient}, url(${bg})`;
  }
  const titleEl = qs(sec, ".titleGamePresent");
  titleEl.textContent = game.name || "Unknown";
  titleEl.classList.remove("sk");
  const descEl = qs(sec, ".gameDesc");
  descEl.textContent = game.description_raw || `Score: ${game.rating || "—"}/100 on RAWG`;
  descEl.classList.remove("sk");
  const linkEl = qs(sec, ".readReview");
  linkEl.href = `./game.html?id=${game.id}`;
  linkEl.textContent = "Read Review";
  linkEl.classList.remove("sk");
  const s = qs(sec, ".NoteCommu");
  s.textContent = game.community?.averageRating ?? game.rating ?? "—";
  s.classList.remove("sk");
}

function renderTopGames(games) {
  const c = document.querySelector(".carrousel");
  if (!c) return;
  clearEl(c);
  games.forEach(g => {
    const a = document.createElement("a");
    a.href = `./game.html?id=${g.id}`;
    a.className = "gameSlide";
    a.innerHTML = `<img src="${g.background_image || "./assets/img/Image-not-found.png"}" alt="${g.name}" class="gameImg" loading="lazy"><p class="gameTitle">${g.name}</p><p class="NoteCommu">${Math.round(g.rating)}</p>`;
    c.appendChild(a);
  });
}

function renderRecentReviews(games) {
  const sec = document.querySelector(".recentReview");
  if (!sec) return;
  const title = sec.querySelector(".sectionTitle");
  clearEl(sec);
  if (title) sec.appendChild(title);
  games.forEach(g => {
    const d = document.createElement("div");
    d.className = "recentGameReview";
    d.style.cursor = "pointer";
    d.innerHTML = `<img src="${g.background_image || "./assets/img/Image-not-found.png"}" alt="${g.name}" class="recentGameIMG" loading="lazy"><div class="recentGameTXT"><h3 class="recentGameTitle">${g.name}</h3><p class="recentGameDesc">${g.description_raw ? g.description_raw.substring(0, 100) : `Rating: ${g.rating}/5`}</p></div><h2 class="recentGameNote">${Math.round(g.rating)}</h2>`;
    d.addEventListener("click", () => { window.location.href = `./game.html?id=${g.id}`; });
    sec.appendChild(d);
  });
}

function qs(parent, sel) { return parent.querySelector(sel) || parent; }

function createErrorBanner(msg) {
  const p = document.createElement("p");
  p.style.cssText = "background:#ff4444;color:#fff;padding:16px;text-align:center;border-radius:8px;margin:16px";
  p.textContent = msg;
  return p;
}

// ─── CONNECT PAGE ───────────────────────────────────────────

function initConnectPage() {
  setupAuthSlider();
  bindLoginForm();
  bindRegisterForm();
  setAuthBackground();
}

async function setAuthBackground() {
  const side = document.querySelector(".authSide");
  if (!side) return;
  try {
    const [stats, popular] = await Promise.all([
      fetchGameStats().catch(() => null),
      fetchPopularGames(1, 1),
    ]);

    const game = popular.games?.[0];
    const bg = game?.background_image;
    if (bg) {
      const isLight = document.body.classList.contains("lightMode");
      const overlay = isLight
        ? "linear-gradient(145deg, rgba(244, 247, 251, 0.88), rgba(232, 237, 246, 0.78))"
        : "linear-gradient(145deg, rgba(5, 8, 22, 0.86), rgba(15, 23, 51, 0.78))";
      side.style.backgroundImage = `${overlay}, url(${bg})`;
    }

    const statsEl = document.querySelector(".authStats");
    if (statsEl && stats) {
      const fmt = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n;
      statsEl.innerHTML = `
        <div class="authStat"><strong>${fmt(stats.totalReviews) ?? "—"}</strong><span>reviews</span></div>
        <div class="authStat"><strong>${fmt(stats.gamesTracked) ?? "—"}</strong><span>tracked</span></div>
        <div class="authStat"><strong>${fmt(stats.rawgGamesCount) ?? "—"}</strong><span>available</span></div>
      `;
    }
  } catch {}
}

function setupAuthSlider() {
  const panel = document.querySelector(".authPanel");
  if (!panel) return;
  document.querySelectorAll("[data-auth-mode]").forEach(b => {
    b.addEventListener("click", () => {
      panel.classList.toggle("registerMode", b.getAttribute("data-auth-mode") === "register");
    });
  });
}

function bindLoginForm() {
  const form = document.querySelector(".authSlide:first-child .authForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.querySelector("#email").value.trim();
    const password = form.querySelector("#password").value;
    const btn = form.querySelector('button[type="submit"]');
    if (!email || !password) { showFormMsg(form, "Please fill in all fields.", "error"); return; }
    btn.disabled = true; btn.textContent = "Logging in…";
    try {
      const r = await loginUser(email, password);
      setToken(r.accessToken);
      setStoredUser({ id: r.id, email: r.email, username: r.username });
      window.location.href = "./home.html";
    } catch (err) {
      showFormMsg(form, err.message || "Login failed.", "error");
      btn.disabled = false; btn.textContent = "Login";
    }
  });
}

function bindRegisterForm() {
  const form = document.querySelector(".authSlide:last-child .authForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = form.querySelector("#username").value.trim();
    const email = form.querySelector("#register-email").value.trim();
    const password = form.querySelector("#register-password").value;
    const btn = form.querySelector('button[type="submit"]');
    if (!email || !password) { showFormMsg(form, "Email and password are required.", "error"); return; }
    btn.disabled = true; btn.textContent = "Creating account…";
    try {
      const r = await registerUser(email, password, username || undefined);
      setToken(r.accessToken);
      setStoredUser({ id: r.id, email: r.email, username: r.username });
      window.location.href = "./home.html";
    } catch (err) {
      showFormMsg(form, err.message || "Registration failed.", "error");
      btn.disabled = false; btn.textContent = "Create Account";
    }
  });
}

function showFormMsg(form, msg, type) {
  const old = form.querySelector(".form-msg");
  if (old) old.remove();
  const p = document.createElement("p");
  p.className = "form-msg";
  p.style.cssText = `margin-top:8px;font-size:14px;color:${type === "error" ? "#ff6b6b" : "#69db7c"}`;
  p.textContent = msg;
  form.appendChild(p);
}

// ─── GAME PAGE ──────────────────────────────────────────────

async function initGamePage() {
  const gameId = getQueryParam("id");
  if (!gameId) return;
  try {
    const gid = parseInt(gameId, 10);
    const [game, reviews] = await Promise.all([
      fetchGameById(gid),
      fetchGameReviews(gid),
    ]);
    renderGameDetails(game);
    renderGameReviews(reviews);
    bindFavoriteBtn(gid);
  } catch (err) {
    window.location.href = `./error.html?code=404&message=${encodeURIComponent("Game not found")}`;
  }
  applyScoreColors();
  bindReviewForm();
}

function bindReviewForm() {
  const form = document.querySelector("#review-form");
  if (!form) return;

  if (!isLoggedIn()) {
    form.innerHTML = `
      <h2>Your Review</h2>
      <div class="authForm" style="text-align:center;padding:24px 0;">
        <p style="margin-bottom:16px;color:var(--text-secondary)">Log in to write a review.</p>
        <a href="./connect.html" class="neonBtn pinkBtn" style="display:inline-block;text-decoration:none;">Login</a>
      </div>
    `;
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const gameId = getQueryParam("id");
    if (!gameId) { showFormMsg(form, "No game selected.", "error"); return; }

    const titleInput = form.querySelector("#review-title");
    const scoreInput = form.querySelector("#review-score");
    const textInput = form.querySelector("#review-text");
    const btn = form.querySelector('button[type="submit"]');

    const title = titleInput ? titleInput.value.trim() : "";
    const score = scoreInput ? parseInt(scoreInput.value, 10) : NaN;
    const comment = textInput ? textInput.value.trim() : "";

    if (!comment) { showFormMsg(form, "Please write a review.", "error"); return; }

    const body = { comment };
    if (title) body.title = title;
    if (!isNaN(score) && score >= 0 && score <= 100) {
      body.rating = score;
    }

    btn.disabled = true; btn.textContent = "Publishing…";
    try {
      await createGameReview(parseInt(gameId, 10), body);
      showFormMsg(form, "Review published! 🎮", "success");
      if (titleInput) titleInput.value = "";
      if (textInput) textInput.value = "";
      if (scoreInput) scoreInput.value = "";
      const reviews = await fetchGameReviews(parseInt(gameId, 10));
      renderGameReviews(reviews);
      applyScoreColors();
    } catch (err) {
      showFormMsg(form, err.message || "Failed to publish.", "error");
    } finally {
      btn.disabled = false; btn.textContent = "Publish";
    }
  });
}

function renderGameDetails(game) {
  const hero = document.querySelector(".gameHero");
  if (!hero) return;

  const bg = game.backgroundImage || game.background_image;
  if (bg) {
    const isLight = document.body.classList.contains("lightMode");
    const gradient = isLight
      ? "linear-gradient(90deg, rgba(244, 247, 251, 0.95), rgba(232, 237, 246, 0.76))"
      : "linear-gradient(90deg, rgba(5, 8, 22, 0.98), rgba(15, 23, 51, 0.78))";
    hero.style.backgroundImage = `${gradient}, url(${bg})`;
  }

  const cover = hero.querySelector(".gameCover");
  if (cover) { cover.src = game.backgroundImage || "./assets/img/Image-not-found.png"; cover.alt = game.name || "Game"; }

  const title = hero.querySelector(".pageTitle");
  if (title) { title.textContent = game.name || "Unknown Game"; title.classList.remove("sk"); }

  const desc = hero.querySelector(".pageText");
  if (desc) { desc.textContent = `Released: ${game.released || "TBA"}  |  Metacritic: ${game.metacritic ?? "N/A"}  |  Playtime: ${game.playtime ?? 0}h`; desc.classList.remove("sk"); }

  const meta = hero.querySelector(".gameMeta");
  if (meta) {
    clearEl(meta);
    if (game.esrbRating) { addMetaTag(meta, game.esrbRating.name); }
    if (game.platforms) {
      [...new Set(game.platforms.map(p => p.platformName))].slice(0, 4).forEach(n => addMetaTag(meta, n));
    }
    if (game.released) { addMetaTag(meta, String(new Date(game.released).getFullYear())); }
  }

  const rawgScore = hero.querySelector("#rawgScore");
  if (rawgScore) {
    rawgScore.textContent = game.rating ?? "—";
    rawgScore.classList.remove("sk");
  }

  const communityScore = hero.querySelector("#communityScore");
  if (communityScore) {
    const cr = game.community?.averageRating;
    communityScore.textContent = cr ?? "—";
    communityScore.classList.remove("sk");
  }

  const favBtn = hero.querySelector("#favoriteBtn");
  if (favBtn) {
    const isFav = game.isFavoriteByCurrentUser;
    favBtn.textContent = isFav ? "♥ Favorited" : "♡ Favorite";
    favBtn.classList.toggle("active", isFav);
  }

  const writeBtn = hero.querySelector(".neonBtn");
  if (writeBtn) writeBtn.href = "#review-form";
}

function bindFavoriteBtn(gameId) {
  const btn = document.querySelector("#favoriteBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (!isLoggedIn()) {
      alert("Please log in to favorite a game.");
      return;
    }
    const currentlyFav = btn.classList.contains("active");
    btn.disabled = true;
    try {
      const result = await likeGame(gameId, !currentlyFav);
      btn.classList.toggle("active", result.isFavorite);
      btn.textContent = result.isFavorite ? "♥ Favorited" : "♡ Favorite";
    } catch (err) {
      alert(err.message || "Failed to update favorite.");
    } finally {
      btn.disabled = false;
    }
  });
}

function addMetaTag(parent, text) {
  const s = document.createElement("span"); s.className = "metaTag"; s.textContent = text; parent.appendChild(s);
}

function renderGameReviews(reviews) {
  const container = document.querySelector(".reviewList");
  if (!container) return;
  clearEl(container);

  if (!reviews || reviews.length === 0) {
    container.innerHTML = '<p class="empty-state" style="padding:16px;color:#888">No reviews yet. Be the first!</p>';
    return;
  }

  reviews.forEach((r) => {
    const art = document.createElement("article");
    art.className = "reviewItem";
    art.innerHTML = `
      <div>
        <h3>${r.username || "Anonymous"}</h3>
        ${r.title ? `<h4 style="margin:2px 0;color:#a0a0ff">${escapeHtml(r.title)}</h4>` : ""}
        ${r.comment ? `<p>${escapeHtml(r.comment)}</p>` : ""}
      </div>
      ${r.rating !== null && r.rating !== undefined ? `<p class="smallScore">${r.rating}</p>` : ""}
    `;
    container.appendChild(art);
  });
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// ─── USER PAGE ──────────────────────────────────────────────

async function initUserPage() {
  if (!isLoggedIn()) { window.location.href = "./connect.html"; return; }

  const user = getStoredUser();
  let username = user?.username || getQueryParam("username");

  if (!username) {
    try {
      const me = await fetchMe();
      if (me.username) {
        username = me.username;
        setStoredUser({ ...user, id: me.id, email: me.email, username: me.username });
      } else {
        window.location.href = "./connect.html"; return;
      }
    } catch {
      window.location.href = "./connect.html"; return;
    }
  }

  try {
    const [profile, liked, reviews] = await Promise.all([
      fetchProfile(username),
      fetchProfileLikedGames(username),
      fetchProfileReviews(username),
    ]);
    renderProfileHero(profile, reviews, liked);
    renderActivity(reviews);
    renderFavorites(liked);
  } catch (err) {
    console.error("Profile error:", err);
    const main = document.querySelector("main");
    if (main) main.prepend(createErrorBanner("Could not load profile."));
  }
  applyScoreColors();
}

function renderProfileHero(profile, reviews, liked) {
  const hero = document.querySelector(".profileHero");
  if (!hero) return;

  const avatar = hero.querySelector(".avatar");
  if (avatar) { avatar.textContent = getInitials(profile.username); avatar.classList.remove("sk"); }

  const nameEl = hero.querySelector(".profileName");
  if (nameEl) { nameEl.textContent = profile.username || "Player"; nameEl.classList.remove("sk"); }

  const tagEl = hero.querySelector(".profileTag");
  if (tagEl) { tagEl.textContent = profile.isVerified ? "✓ Verified Member" : "Member"; tagEl.classList.remove("sk"); }

  const stats = hero.querySelector(".profileStats");
  if (stats) {
    const rated = reviews.filter(r => r.rating !== null);
    const avg = rated.length > 0 ? Math.round(rated.reduce((s, r) => s + r.rating, 0) / rated.length) : 0;
    const favs = liked ? liked.filter(g => g.isFavorite).length : 0;
    stats.innerHTML = `<div class="profileStat"><strong>${reviews.length}</strong><span>reviews</span></div><div class="profileStat"><strong>${avg}</strong><span>avg score</span></div><div class="profileStat"><strong>${favs}</strong><span>favorites</span></div>`;
  }
}

function renderActivity(reviews) {
  const c = document.querySelector(".activityList");
  if (!c) return;
  clearEl(c);

  const items = reviews.map(r => ({
    gameName: r.gameName,
    gameId: r.gameId,
    score: r.rating,
    date: new Date(r.createdAt),
    desc: r.rating !== null ? `Reviewed — rated ${r.rating}/100` : "Wrote a review.",
  }));

  items.sort((a, b) => b.date - a.date);
  const recent = items.slice(0, 10);

  if (recent.length === 0) { c.innerHTML = '<p class="empty-state">No activity yet.</p>'; return; }

  recent.forEach(item => {
    const art = document.createElement("article");
    art.className = "activityItem";
    art.innerHTML = `<p class="smallScore">${item.score !== null ? item.score : "--"}</p><div><h3><a href="./game.html?id=${item.gameId}">${item.gameName}</a></h3><p>${item.desc}</p></div>`;
    c.appendChild(art);
  });
}

function renderFavorites(liked) {
  const c = document.querySelector(".favoriteList");
  if (!c) return;
  clearEl(c);

  const favs = liked.filter(g => g.isFavorite);
  if (favs.length === 0) { c.innerHTML = '<p class="empty-state">No favorites yet.</p>'; return; }

  favs.slice(0, 6).forEach(g => {
    const a = document.createElement("a");
    a.href = `./game.html?id=${g.gameId}`; a.className = "favoriteItem";
    a.innerHTML = `<img src="${g.backgroundImage || "./assets/img/Image-not-found.png"}" alt="${g.gameName}" loading="lazy"><div><h3>${g.gameName}</h3><p>♥ Favorite</p></div>`;
    c.appendChild(a);
  });
}

// ─── CONTACT PAGE ───────────────────────────────────────────

function initContactPage() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = form.querySelector("[data-contact-message]");
    if (msg) {
      msg.textContent = "Thank you! We'll get back to you soon.";
      msg.style.color = "#69db7c";
    }
    form.querySelectorAll("input, textarea").forEach(el => el.value = "");
  });
}

// ─── ERROR PAGE ─────────────────────────────────────────────

function initErrorPage() {
  const code = getQueryParam("code") || "404";
  const msg = getQueryParam("message") || "Page not found";
  const el = document.querySelector(".errorCode");
  if (el) el.textContent = code;
  const title = document.querySelector(".errorPage .pageTitle");
  if (title) title.textContent = msg.replace(/-/g, " ");
  const text = document.querySelector(".errorPage .pageText");
  if (text) text.textContent = `Error ${code}: ${msg.replace(/-/g, " ")}`;
}

// ─── SEARCH PAGE ────────────────────────────────────────────

async function initSearchPage() {
  const query = getQueryParam("q");
  if (!query) {
    const qEl = document.querySelector(".searchQuery");
    if (qEl) { qEl.textContent = ""; qEl.classList.remove("sk"); }
    const cEl = document.querySelector(".searchCount");
    if (cEl) { cEl.textContent = "No search query provided."; cEl.classList.remove("sk"); }
    return;
  }

  populateFilters();
  await runSearch();
  bindSearchFilters();
  bindSearchPagination();

  window.addEventListener("popstate", () => {
    populateFilters();
    runSearch();
  });
}

function populateFilters() {
  const p = new URLSearchParams(window.location.search);
  const map = { sort: "sort", yearFrom: "yearFrom", yearTo: "yearTo", ratingMin: "ratingMin", ratingMax: "ratingMax", platform: "platform", genre: "genre" };
  for (const [id, name] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) el.value = p.get(name) || "";
  }
}

async function runSearch() {
  const query = getQueryParam("q");
  if (!query) return;

  const queryEl = document.querySelector(".searchQuery");
  if (queryEl) { queryEl.textContent = query; queryEl.classList.remove("sk"); }

  const countEl = document.querySelector(".searchCount");
  const grid = document.querySelector(".searchGrid");

  const p = new URLSearchParams(window.location.search);
  const apiParams = { search: query, pageSize: 20 };

  const page = parseInt(p.get("page"), 10) || 1;
  apiParams.page = page;

  const sort = p.get("sort");
  if (sort) apiParams.ordering = sort;

  const yearFrom = p.get("yearFrom");
  const yearTo = p.get("yearTo");
  if (yearFrom || yearTo) {
    if (yearFrom) apiParams.releasedFrom = `${yearFrom}-01-01`;
    if (yearTo) apiParams.releasedTo = `${yearTo}-12-31`;
  }

  const ratingMin = p.get("ratingMin");
  const ratingMax = p.get("ratingMax");
  if (ratingMin) apiParams.ratingMin = Math.round(parseInt(ratingMin, 10) / 20);
  if (ratingMax) apiParams.ratingMax = Math.round(parseInt(ratingMax, 10) / 20);

  const platform = p.get("platform");
  if (platform) apiParams.platforms = platform;

  const genre = p.get("genre");
  if (genre) apiParams.genres = genre;

  // Show skeleton while loading
  if (grid) {
    clearEl(grid);
    for (let i = 0; i < 6; i++) {
      const sk = document.createElement("a");
      sk.className = "searchCard sk-card";
      sk.innerHTML = '<div class="searchCardImg sk"></div><div class="searchCardBody"><h3 class="sk">&nbsp;</h3><p class="sk">&nbsp;</p></div><p class="NoteCommu sk"></p>';
      grid.appendChild(sk);
    }
  }

  try {
    const result = await searchGames(apiParams);
    const games = result.games || [];

    if (countEl) {
      countEl.textContent = `${result.count || games.length} game${games.length !== 1 ? "s" : ""} found`;
      countEl.classList.remove("sk");
    }

    renderSearchResults(games);
    updatePagination(result);
  } catch (err) {
    console.error("Search error:", err);
    if (countEl) { countEl.textContent = "Search failed. Try again later."; countEl.classList.remove("sk"); }
    if (grid) {
      clearEl(grid);
      grid.innerHTML = '<p class="empty-state" style="padding:24px;color:#888;text-align:center;grid-column:1/-1">Could not load search results.</p>';
    }
    document.querySelector(".searchPagination")?.setAttribute("hidden", "");
  }
  applyScoreColors();
}

function bindSearchFilters() {
  const form = document.getElementById("searchFilters");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    p.set("q", getQueryParam("q") || "");

    const fields = [
      ["sort","sort"], ["yearFrom","yearFrom"], ["yearTo","yearTo"],
      ["ratingMin","ratingMin"], ["ratingMax","ratingMax"],
      ["platform","platform"], ["genre","genre"],
    ];
    for (const [id, name] of fields) {
      const el = document.getElementById(id);
      if (el && el.value) p.set(name, el.value);
    }

    window.history.pushState({}, "", `./search.html?${p.toString()}`);
    runSearch();
  });

  form.addEventListener("reset", () => {
    setTimeout(() => {
      const p = new URLSearchParams();
      p.set("q", getQueryParam("q") || "");
      window.history.pushState({}, "", `./search.html?${p.toString()}`);
      runSearch();
    }, 0);
  });
}

function renderSearchResults(games) {
  const grid = document.querySelector(".searchGrid");
  if (!grid) return;
  clearEl(grid);

  if (!games || games.length === 0) {
    grid.innerHTML = '<p class="empty-state" style="padding:24px;color:#888;text-align:center;grid-column:1/-1">No games found for this query.</p>';
    return;
  }

  games.forEach(g => {
    const a = document.createElement("a");
    a.href = `./game.html?id=${g.id}`;
    a.className = "searchCard";

    const platforms = g.platforms
      ? [...new Set(g.platforms.map(p => p.platform?.name).filter(Boolean))].slice(0, 3).join(", ")
      : "";

    a.innerHTML = `
      <img src="${g.background_image || "./assets/img/Image-not-found.png"}" alt="${escapeHtml(g.name)}" class="searchCardImg" loading="lazy">
      <div class="searchCardBody">
        <h3>${escapeHtml(g.name)}</h3>
        ${platforms ? `<p>${escapeHtml(platforms)}</p>` : ""}
      </div>
      <p class="NoteCommu">${Math.round(g.rating)}</p>`;

    grid.appendChild(a);
  });
}

// ─── Search pagination ─────────────────────────────────────

function updatePagination(result) {
  const el = document.querySelector(".searchPagination");
  if (!el) return;

  const currentPage = result.page || parseInt(getQueryParam("page"), 10) || 1;
  const total = result.count || 0;
  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize) || 1;

  el.removeAttribute("hidden");
  document.getElementById("pageInfo").textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById("prevPage").disabled = currentPage <= 1;
  document.getElementById("nextPage").disabled = !result.hasMore;
}

function bindSearchPagination() {
  document.getElementById("prevPage")?.addEventListener("click", () => {
    const p = new URLSearchParams(window.location.search);
    const page = parseInt(p.get("page"), 10) || 1;
    if (page <= 1) return;
    p.set("page", String(page - 1));
    window.history.pushState({}, "", `./search.html?${p.toString()}`);
    runSearch();
  });

  document.getElementById("nextPage")?.addEventListener("click", () => {
    const p = new URLSearchParams(window.location.search);
    const page = parseInt(p.get("page"), 10) || 1;
    p.set("page", String(page + 1));
    window.history.pushState({}, "", `./search.html?${p.toString()}`);
    runSearch();
  });
}

// ─── INIT ───────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  updateHeader();
  switch (getPageName()) {
    case "home": initHomePage(); break;
    case "connect": initConnectPage(); break;
    case "game": initGamePage(); break;
    case "user": initUserPage(); break;
    case "contact": initContactPage(); break;
    case "search": initSearchPage(); break;
    case "error": initErrorPage(); break;
  }
});
