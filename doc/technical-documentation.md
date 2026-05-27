# GameScore — Technical Documentation

> Full-stack game-centric social web platform
> Yboost B2 — Development Project

---

## 1. Project Overview

GameScore is a web application that allows users to discover video games and interact socially around them. It connects to the RAWG Video Games Database API to provide access to over 850,000 games, and lets authenticated users rate, review, like, and favorite games.

### Core features

- User registration and JWT-based authentication
- Game search with filters (date, rating, platform, genre, metacritic score)
- Popular games listing (configurable time period)
- Game detail page with full metadata, platforms, ESRB rating
- Social interactions: like/favorite, review (comment + rating)
- Public user profiles showing activity (liked games, reviews)
- Homepage with recently reviewed games and community stats
- Dark/light theme support
- Responsive design

### Target audience

Gamers who want a single social hub to discover and discuss games across all platforms (PC, PlayStation, Xbox, Nintendo) without needing accounts on each platform.

---

## 2. System Architecture

### 2.1 High-level architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend                          │
│        (Vanilla HTML / CSS / JavaScript)            │
│                                                     │
│  home.html  connect.html  game.html  search.html    │
│  user.html  contact.html  error.html                │
└──────────────┬──────────────────────────────────────┘
               │ HTTP (API calls)
               ▼
┌──────────────────────────────────────────────────────┐
│                    Backend                           │
│          Express 5 + TypeScript                      │
│                                                      │
│  Routes → Validation → Controller → Service          │
│                                          │           │
│                              Repository ─┴─ RAWG API │
│                                    │                 │
│                                    ▼                 │
│                               MySQL 8                │
└──────────────────────────────────────────────────────┘
```

### 2.2 Layered architecture

The backend follows a strict layered architecture:

```
HTTP Request
  │
  ▼
┌──────────┐
│  Route   │  Defines URL, HTTP method, middleware stack
├──────────┤
│Validator │  class-validator DTO validation
├──────────┤
│ Handler  │  asyncHandler catches errors → errorMiddleware
├──────────┤
│Controller│  Handles req/res only — no business logic
├──────────┤
│ Service  │  Business logic, orchestration, caching
├──────────┤
│Repository│  TypeORM queries isolated from business code
├──────────┤
│Presenter │  Shapes internal entities into API contracts
└──────────┘
  │
  ▼
HTTP Response (JSON)
```

Each layer has a single responsibility, making the codebase testable, maintainable, and easy to evolve.

## 3. Technology Stack

### 3.1 Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 22 | JavaScript runtime |
| Express | 5.2.1 | HTTP framework |
| TypeScript | 5.9.3 | Static typing, strict mode |
| TypeORM | 0.3.28 | ORM with MySQL support |
| mysql2 | 3.20 | MySQL driver |
| class-validator | 0.15 | Decorator-based validation |
| class-transformer | 0.5 | JSON → class instance conversion |
| jsonwebtoken | 9.0 | JWT signing and verification |
| bcryptjs | 3.0 | Password hashing |
| cors | 2.8 | Cross-origin resource sharing |
| dotenv | 17.3 | Environment configuration |
| tsx | 4.19 | TypeScript execution engine (dev) |

**Why Node.js + Express 5:**
- Non-blocking I/O is ideal for an API making external HTTP calls (RAWG) and database queries concurrently
- Express 5 is the latest version of the most mature Node.js framework — minimal, flexible, perfect for REST
- TypeScript strict mode catches type errors at compile time

**Why MySQL + TypeORM:**
- Game data has structured relationships (platforms, ESRB ratings) that map naturally to SQL tables
- ACID compliance ensures data integrity for social interactions
- TypeORM provides decorators, migrations, repository pattern — schema lives in the code

**Why class-validator:**
- Declarative validation with decorators keeps rules close to data definitions
- Whitelist mode strips unknown fields automatically
- Consistent error responses for all validation failures

**Why JWT + bcryptjs:**
- Stateless authentication — no server-side sessions needed
- Scales horizontally without shared session state
- bcryptjs provides salted, adaptive-cost password hashing

### 3.2 Frontend

| Technology | Purpose |
|---|---|
| HTML5 | 7 static pages |
| CSS3 | 13 modular CSS files with CSS custom properties for theming |
| Vanilla JavaScript | 3 JS files (api.js, app-ui.js, score-color.js) |

**Why no framework:**
- 7 pages with moderate interactivity — a framework adds build complexity without proportional benefit
- No bundler needed (no Webpack, Vite, etc.)
- CSS custom properties provide dark/light mode theming

### 3.3 External API

| API | Purpose | Endpoints used |
|---|---|---|
| RAWG Video Games Database | Game catalog (850+ games) | `GET /games`, `GET /games/{id}` |

Access requires a free API key configured via `RAWG_API_KEY` environment variable.

---

## 4. Data Model

### 4.1 Entity list

| Entity | Table | PK | Description |
|---|---|---|---|
| Profile | `profiles` | UUID (varchar 36) | User public profile |
| UserCredentials | `user_credentials` | auto-increment | Login credentials |
| Game | `games` | int (RAWG ID) | Game cached locally |
| EsrbRating | `esrb_ratings` | int (RAWG ID) | ESRB/PEGI classification |
| Platform | `platforms` | int (RAWG ID) | Gaming platform |
| PlatformRequirements | `platform_requirements` | auto-increment | System requirements |
| GamePlatform | `game_platforms` | auto-increment | Game ⇄ Platform link |
| ProfileLikedGame | `profile_liked_games` | auto-increment | Like/favorite |
| GameReview | `game_reviews` | auto-increment | Review (comment + rating) |

---

## 5. API Endpoints

### 5.1 Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Create account (email, password, optional username) |
| `POST` | `/api/auth/login` | No | Log in, returns JWT |
| `POST` | `/api/auth/logout` | Yes | Log out |
| `GET` | `/api/auth/me` | Yes | Current authenticated user |

### 5.2 Games

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/games/search` | No | Search games with filters |
| `GET` | `/api/games/popular` | No | Popular games listing |
| `GET` | `/api/games/stats` | No | Community statistics |
| `GET` | `/api/games/recent-reviews` | No | Recently reviewed games |
| `GET` | `/api/games/:gameId` | Optional | Game details (enriched with user state if auth) |
| `POST` | `/api/games/:gameId/likes` | Yes | Like/favorite a game |
| `GET` | `/api/games/:gameId/reviews` | No | Reviews for a game |
| `POST` | `/api/games/:gameId/review` | Yes | Submit a review (comment + rating) |

### 5.3 Profiles

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/profiles/:username` | No | Public profile |
| `GET` | `/api/profiles/:username/liked-games` | No | User's liked games |
| `GET` | `/api/profiles/:username/reviews` | No | User's reviews |

### 5.4 Search filters

The search endpoint accepts:
- `search` — text query
- `page`, `pageSize` — pagination
- `releasedFrom`, `releasedTo` — date range
- `ratingMin`, `ratingMax` — RAWG rating (0–5)
- `metacriticMin`, `metacriticMax` — Metacritic score (0–100)
- `platforms` — platform IDs (comma-separated)
- `genres` — genre slugs (comma-separated)
- `tags` — tag slugs (comma-separated)
- `ordering` — sort field with direction prefix (`-` for descending)

---

## 6. Caching Strategy

### 6.1 LRU Cache (in-memory)

A generic LRU cache is implemented in `src/utils/lru-cache.ts` using JavaScript's `Map`:

**Features:**
- Configurable `maxSize` — oldest entries evicted when full
- Configurable `ttlMs` — entries expire after a timeout
- Background refresh — when `getOrSet` finds an entry more than halfway to expiry, it triggers an async refresh without blocking the caller
- Error-safe factory — if the factory function throws, the key is cleaned up

**Instances:**

| Cache | Size | TTL | Purpose |
|---|---|---|---|
| `rawgSearchCache` | 50 | 1 hour | RAWG search results |
| `rawgCountCache` | 1 | 1 hour | RAWG total games count |

**Usage in search flow:**
```
1. Build cache key from all query params (JSON.stringify)
2. rawgSearchCache.getOrSet(key, fetchFromRawg)
3. If cached + not expired → return cached RAWG data
4. If stale → remove from cache → fetch fresh from RAWG
5. Enrich cached RAWG results with live community stats from DB
```

**Why only search/popular/stats:**
- Search results are read-heavy and repetitive (users search same terms)
- Community stats are always fetched fresh from DB to ensure accuracy
- Individual game pages involve user-specific state (isLikedByCurrentUser) — caching would require per-user keys

### 6.2 Lazy Hydration (database)

`GameSyncService.resolveGame()` implements a two-tier caching strategy:

```
resolveGame(gameId):
  1. Check local MySQL for game by RAWG ID
  2. If found AND lastSyncedAt < 168 hours ago → return local copy
  3. If missing or stale → fetch full data from RAWG API
  4. Upsert into MySQL (game + platforms + ESRB + requirements)
  5. Return fresh game with all relations loaded
```

**Benefits:**
- No massive one-time import — database grows with actual usage
- Reduces RAWG API calls (rate limit of ~20,000 requests/month on free tier)
- Pluggable staleness threshold (default 7 days, configurable via `staleAfterHours`)

---

## 7. Authentication & Security

### 7.1 JWT Authentication

- Tokens are signed with a configurable secret (`JWT_SECRET`)
- Token TTL is configurable (`JWT_ACCESS_TTL`, default 4h)
- Two middleware variants:
  - `verifyToken` — required auth, returns 401 if missing/invalid
  - `optionalAuth` — attaches user info if token present, continues as anonymous otherwise
- Tokens can be sent via `Authorization: Bearer <token>` header or `x-access-token` header

### 7.2 Password Security

- Passwords hashed with bcryptjs (salt rounds: 10)
- Only the hash is stored in the database
- No plaintext passwords are ever logged or returned

### 7.3 Input Validation

- Every endpoint validates input via class-validator DTOs
- `whitelist: true` — strips unknown properties
- `forbidNonWhitelisted: true` — rejects requests with unexpected fields
- Validation errors return 400 with field-level details

### 7.4 Error Handling

- `AppError` class with `statusCode` and optional `details`
- Global `errorMiddleware` catches all errors
- Known errors return typed JSON responses
- Unknown errors return 500 with no stack trace in production

---

## 8. Deployment

### 8.1 Docker architecture

Three services defined in `Docker/docker-compose.yml`:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ nginx:alpine │───▶│node:22-alpine│───▶│  mysql:8.0   │
│ (Frontend)   │     │  (Backend)   │     │ (Database)   │
│ Port 8081    │     │  Port 3000   │     │  Port 3306   │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Frontend (Dockerfile.frontend):**
- Base: `nginx:alpine` (~5 MB)
- Copies static HTML/CSS/JS files
- Replaces `{{ENDPOINT}}` placeholder with `/api` at build time
- Nginx proxies `/api/` requests to backend container

**Backend (Dockerfile.backend):**
- Multi-stage build (deps → build → runner)
- Base: `node:22-alpine`
- Stage 1: installs all dependencies
- Stage 2: compiles TypeScript
- Stage 3: production only (npm ci --omit=dev, compiled JS)
- Exposes port 3000

**Database:**
- `mysql:8.0` with named volume for persistence
- Health check ensures backend waits for DB readiness

### 8.2 Nginx configuration

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index home.html;

    location /api/ {
        proxy_pass http://backend:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /home.html;
    }
}
```

### 8.3 Kubernetes readiness

The Docker architecture is compatible with Kubernetes:
- Stateless backend (JWT auth, no server sessions)
- MySQL runs as a StatefulSet with PersistentVolume
- Frontend and backend are stateless Deployments with ConfigMap for nginx
- Horizontal Pod Autoscaler can scale backend replicas based on CPU/memory

Not deployed on K8s currently — Docker Compose is sufficient for a single VPS with moderate traffic.

---

## 9. Frontend Architecture

### 9.1 Pages

| Page | Route | Purpose |
|---|---|---|
| `home.html` | `/` | Landing page with popular games, recently reviewed games, community stats |
| `connect.html` | `/connect` | Login/Register form |
| `search.html` | `/search` | Game search with filters and paginated results |
| `game.html` | `/game?id={id}` | Game detail with metadata, reviews, like/review form |
| `user.html` | `/user?username={name}` | Public user profile |
| `contact.html` | `/contact` | Contact form |
| `error.html` | `*` | Error page |

### 9.2 JavaScript modules

**api.js** — API client module:
- Token management (localStorage)
- All API call functions (auth, games, profiles)
- Theme persistence
- Base URL configured via `{{ENDPOINT}}` placeholder (replaced at Docker build)

**app-ui.js** — UI controller:
- Header rendering with auth state
- Page-specific logic for all 7 pages
- DOM manipulation, event handlers
- Search pagination
- Review submission
- Theme toggle (dark/light + brightness)

**score-color.js** — Utility:
- Interpolates color gradient (red → orange → cyan → green) based on score (0–100)

### 9.3 CSS architecture

13 modular CSS files organized by component:

```
assets/css/
├── variables/variables.css    — CSS custom properties (theme colors, typography)
├── components/
│   ├── header.css              — Navigation bar
│   ├── footer.css              — Page footer
│   ├── authPage.css            — Login/Register page
│   ├── gamePresent.css         — Game hero banner
│   ├── topGame.css             — Popular games carousel
│   ├── recentReview.css        — Recent reviews list
│   ├── gamePage.css            — Game detail page
│   ├── searchPage.css          — Search page
│   ├── userPage.css            — User profile page
│   ├── contactPage.css         — Contact page
│   └── errorPage.css           — Error page
├── home.main.css               — Entry point (imports all + global styles)
```

Dark/light mode is toggled by adding/removing `.lightMode` class on `<body>`.

---

## 10. Project Structure

```
GameScore---Yboost-B2/
├── Docker/
│   ├── docker-compose.yml        — Full-stack deployment
│   ├── Dockerfile.frontend       — Nginx static server
│   ├── Dockerfile.backend        — Node.js production image
│   └── nginx.conf                — Reverse proxy config
├── doc/
│   ├── technical-documentation.md — This document
│   └── Doc.odt                   — Design document
├── site/
│   ├── FrontEnd/
│   │   └── Public/
│   │       ├── *.html            — 7 static pages
│   │       └── assets/
│   │           ├── css/          — 13 CSS files
│   │           ├── js/           — 3 JS files
│   │           ├── img/          — Images
│   │           └── Font/         — Roboto, Orbitron, Cinzel
│   └── server/
│       ├── package.json
│       ├── tsconfig.json
│       ├── docker-compose.yml    — MySQL-only (dev)
│       └── src/
│           ├── server.ts         — Bootstrap
│           ├── app.ts            — Express app setup
│           ├── config/           — DB, auth, RAWG config
│           ├── controllers/      — Request handlers
│           ├── entities/         — TypeORM entity classes
│           ├── middlewares/      — Auth, validation, error
│           ├── migrations/       — Database migrations
│           ├── repositories/     — Data access layer
│           ├── routes/           — Route definitions
│           ├── services/         — Business logic
│           ├── types/            — DTOs, presenters, types
│           └── utils/            — LRU cache, error, helpers
└── README.md
```

---


## 11. Performance & Optimization

### Current optimizations

| Optimization | Location | Impact |
|---|---|---|
| LRU cache for search results | `game.service.ts` | Reduces RAWG API calls for repeated queries |
| LRU cache for RAWG game count | `game.service.ts` | 1-hour TTL, avoids counting on every page load |
| Lazy hydration of games | `game-sync.service.ts` | No DB import — grows with usage, 7-day staleness |
| Background cache refresh | `lru-cache.ts` | Refreshes data when >50% TTL elapsed without blocking |
| Community stats always fresh | `game.service.ts` | Cache invalidated stats not served — accuracy > speed |
| Multi-stage Docker build | `Dockerfile.backend` | Minimal production image (~30 MB) |

### Future improvements

| Issue | Solution |
|---|---|
| Cache size hardcoded (50) | Make `maxSize` configurable via env var |
| No cache warming on restart | Pre-cache popular queries during bootstrap |
| Cache is process-local | Add Redis for multi-instance deployments |
| Single VPS bottleneck | Kubernetes with HPA for auto-scaling |
| No monitoring | Add health check endpoint + Prometheus metrics |
| No automated tests | Add Jest/ts-jest for unit + integration tests |
