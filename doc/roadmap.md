# GameScore — Project Roadmap

> Development timeline organized by sprints
> Yboost B2 — 2025-2026
> PETITFRERE Alexandre - MATA Loan

---

## Overview

The project was developed over **7 sprints** from December 2025 to May 2026. Each sprint delivered specific features following an iterative approach: frontend foundation → backend core → API integration → social features → refactoring → deployment & optimization.

---

## Sprint 1 — Project Initialization

**Period:** December 2025 – February 2026

### Goals
- Initialize the project repository
- Set up the development environment
- Define the project scope and concept

### Deliverables
- Git repository initialized
- Basic project scaffolding
- Design document (`doc/Doc.odt`)
- Source images (`idee_source.png`, `idee_sourceJeu.png`)

### Technical decisions
- Stack selection: Node.js + TypeScript + Express + MySQL
- RAWG API chosen as game data provider
- Static HTML/CSS frontend (no framework)

---

## Sprint 2 — Frontend Foundation

**Period:** March – May 2026

### Goals
- Build the frontend HTML pages
- Create the CSS architecture with theming
- Implement responsive design and dark/light mode

### Deliverables
- 7 HTML pages: home, connect, game, search, user, contact, error
- 13 modular CSS files with component-based organization
- CSS custom properties for dark/light theme
- Header, footer, and navigation
- Hero banners and game cards
- Responsive layout for all pages

### Technical details
- CSS variables in `variables/variables.css` for theming
- Separate CSS per component (header, footer, auth, game, search, user, etc.)
- Dark/light mode via `.lightMode` class on `<body>`, persisted in localStorage
- Roboto + Orbitron + Cinzel fonts
- Gradient overlays on hero sections

---

## Sprint 3 — Backend Core

**Date:** May 26-27, 2026

### Goals
- Set up Express server with TypeScript
- Configure TypeORM with MySQL
- Define all entities and relationships
- Implement database migrations
- Create repository layer for data access

### Deliverables
- Express 5 application with TypeScript
- TypeORM DataSource configuration
- 9 entity classes with decorators and relationships
- Database migration system
- Repository classes for data access isolation
- CORS and static file serving

### Technical details
- `server.ts` bootstraps: initialize DataSource → run migrations → start listening
- `app.ts` sets up CORS, JSON parsing, static file serving, API routes, error handler
- Entities: Profile, UserCredentials, Game, EsrbRating, Platform, PlatformRequirements, GamePlatform, ProfileLikedGame, GameReview
- Repositories: game, profile, profile-interaction, user-credentials
- Single-origin serving: Express serves both API and frontend

---

## Sprint 4 — RAWG API Integration

**Date:** May 27, 2026

### Goals
- Implement RAWG API client
- Add game search and popular games endpoints
- Implement lazy hydration strategy
- Create game sync service

### Deliverables
- `RawgService` — HTTP client for RAWG API
- `GET /api/games/search` — search with 12+ filters
- `GET /api/games/popular` — popular games by time period
- `GET /api/games/:gameId` — game detail
- `GameSyncService.resolveGame()` — lazy hydration with staleness check
- `GameRepository.upsertFromRawg()` — complex upsert with platforms, ESRB, requirements
- Validation DTOs for all search/query parameters

### Technical details
- RAWG API key via `RAWG_API_KEY` env var
- Lazy hydration: check local DB → if stale (7 days) → fetch from RAWG → upsert
- `buildRawgUrl()` utility constructs API URLs with key and parameters
- `parseJsonResponse()` handles errors from RAWG
- Search filters: search, date range, metacritic range, rating range, platforms, genres, tags, ordering

---

## Sprint 5 — Social Features

**Date:** May 27, 2026

### Goals
- Implement JWT authentication
- Add social interactions (likes, reviews)
- Create profile system
- Build auth middleware

### Deliverables
- `POST /api/auth/register` — account creation with bcrypt hashing
- `POST /api/auth/login` — JWT token generation
- `POST /api/auth/logout` — session termination
- `GET /api/auth/me` — current user info
- `POST /api/games/:gameId/likes` — like/favorite with upsert
- `GET /api/games/:gameId/reviews` — reviews listing
- `POST /api/games/:gameId/review` — create review (comment + rating)
- `GET /api/profiles/:username` — public profile
- `GET /api/profiles/:username/liked-games` — user's liked games
- `GET /api/profiles/:username/reviews` — user's reviews
- Middleware: `verifyToken` (required auth), `optionalAuth` (soft auth)
- Validation DTOs for all endpoints

### Technical details
- Passwords: bcryptjs with 10 salt rounds
- JWT: signed with configurable secret and TTL (default 4h)
- `@IsEmail()`, `@MinLength(8)` for registration validation
- `@Matches(/^[a-zA-Z0-9_]+$/)` for username validation
- Username uniqueness enforced with incrementing suffix
- Community stats computed via 3 parallel queries (likes, ratings, reviews)

---

## Sprint 6 — Frontend Refactor & Feature Completion

**Date:** May 27, 2026

### Goals
- Refactor frontend JavaScript into clean modules
- Add search page with real RAWG integration
- Implement pagination across all list views
- Add recently reviewed games and community stats on home page
- Improve auth UI and error handling

### Deliverables
- `api.js` — dedicated API client module (all fetch calls, auth, theme)
- `app-ui.js` — refactored UI controller (844 lines, modular functions)
- `score-color.js` — score color interpolation utility
- Search pagination (prev/next, page info, disabled button styles)
- Session verification on header load (detect expired tokens)
- Recently reviewed games section on home page
- Live community stats on auth page (`GET /games/stats`)
- Replace static placeholder images with real API data
- Center auth page layout, responsive grid
- Block review forms when not logged in (show login prompt)
- Brightness control toggle

### Technical details
- JavaScript modules loaded via `<script>` tags (no bundler)
- API base URL via `{{ENDPOINT}}` placeholder (replaced at Docker build)
- Theme persisted in localStorage (`gamescore-theme`)
- Token stored in localStorage (`gamescore-token`)
- All 7 pages include `api.js` + `app-ui.js`

---

## Sprint 7 — Docker, Caching & Optimization

**Date:** May 27, 2026

### Goals
- Containerize the full application with Docker
- Implement LRU cache with TTL and background refresh
- Add recently reviewed games and stats endpoints
- Fix performance issues and bugs
- Prepare for production deployment

### Deliverables

#### Docker deployment
- `Dockerfile.frontend` — nginx:alpine multi-stage
- `Dockerfile.backend` — node:22-alpine multi-stage (deps → build → runner)
- `Docker/docker-compose.yml` — full stack (nginx + Node + MySQL with health checks)
- `Docker/nginx.conf` — reverse proxy configuration
- `site/server/docker-compose.yml` — MySQL-only for local development

#### Caching
- `LruCache` with TTL support and background half-life refresh
- `rawgSearchCache` (size 50, TTL 1h) — RAWG search results
- `rawgCountCache` (size 1, TTL 1h) — RAWG total games count
- Stats endpoint with cached RAWG count

#### New endpoints
- `GET /api/games/stats` — gamesTracked, totalReviews, topScore, rawgGamesCount
- `GET /api/games/recent-reviews` — recently reviewed games (ordered by latest review)

#### Bug fixes & refactoring
- Remove old migration files causing errors in fresh environments
- Simplify `getGameReviews` — use `gameId` directly, handle missing games
- Transform GameStats cache into RAWG count cache only (keep community stats dynamic)
- Implement LRU TTL with background auto-refresh at 50% TTL
- Remove ratings system, consolidate into reviews

### Technical details
- LRU cache: `Map`-based, O(1) operations, configurable `maxSize` + `ttlMs`
- Background refresh: when `getOrSet` finds entry >50% expired, starts async refresh (fire-and-forget)
- Nginx config: serves static files, proxies `/api/` to backend
- Frontend Docker: `sed` replaces `{{ENDPOINT}}` with `/api` in `api.js`
- Backend Docker: 3-stage build (deps → compile → production, only compiled JS)

---

## Summary

| Sprint | Period | Focus | Key technologies |
|---|---|---|---|
| 1 | Dec 2025 – Feb 2026 | Project initialization | Git, documentation |
| 2 | Mar – May 2026 | Frontend foundation | HTML, CSS, responsive design |
| 3 | May 26-27, 2026 | Backend core | Express, TypeORM, MySQL, entities |
| 4 | May 27, 2026 | RAWG API integration | HTTP client, lazy hydration, game sync |
| 5 | May 27, 2026 | Social features | JWT, bcrypt, likes, reviews, profiles |
| 6 | May 27, 2026 | Frontend refactor | JS modules, pagination, stats, auth UI |
| 7 | May 27, 2026 | Docker & optimization | Docker, LRU cache TTL, production deployment |

The final sprint (7) was executed as a dedicated optimization and production-readiness phase, consolidating all prior features into a deployable, cached, and containerized application.
