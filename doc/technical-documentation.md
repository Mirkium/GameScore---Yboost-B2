# GameScore Technical Documentation

## 1. Overview

GameScore is a TypeScript backend for a game-centric social experience.

It combines three main ideas:

1. **Authentication** — users can register, log in, and maintain a session.
2. **Profiles and interactions** — users can like, favorite, comment on, and rate games.
3. **RAWG game data** — the app fetches game metadata from the RAWG Video Games API on demand and stores only what it needs locally.

The backend is built with:

- `Express` for HTTP routing
- `TypeScript` in `strict` mode
- `TypeORM` for database access
- `class-validator` and `class-transformer` for request validation
- `MySQL` for persistence

## 2. High-level architecture

The project follows a clean layered design:

```text
HTTP request
  -> route
  -> validation middleware
  -> async handler
  -> controller
  -> service
  -> repository / external API
  -> presenter
  -> HTTP response
```

### Responsibilities by layer

- **Routes**: define URLs and middleware order.
- **Controllers**: handle request/response objects only.
- **Services**: contain business logic and orchestration.
- **Repositories**: isolate database queries and TypeORM details.
- **DTOs**: validate and normalize input.
- **Presenters**: shape output for API responses.
- **middlewares**: handle security, async wrapping, and validation.
- **Utils**: Implement some utils method that is not in business logic (lru, etc)
   
## 3. Project structure

### Server folder

The backend lives in `site/server`.

```text
src/
├── app.ts
├── server.ts
├── config/
├── controllers/
├── entities/
├── middlewares/
├── migrations/
├── repositories/
├── routes/
├── services/
├── types/
└── utils/
```

### Frontend folder

The `site/FrontEnd` folder contains static views and assets.

## 4. Runtime flow

### Boot sequence

1. `server.ts` loads the TypeORM `DataSource`.
2. Migrations run automatically.
3. The Express app starts listening on the configured port.

### Request flow

1. A route receives the request.
2. `validateDto(...)` checks the input.
3. `asyncHandler(...)` forwards async errors to the global handler.
4. The controller passes validated data to a service.
5. The service coordinates database access and RAWG requests.
6. The service returns a presenter-friendly object.
7. The controller sends JSON back to the client.

## 5. Core modules

### Authentication

Files:

- `src/controllers/auth.controller.ts`
- `src/services/auth.service.ts`
- `src/routes/auth.routes.ts`
- `src/types/dtos/auth.dto.ts`

Capabilities:

- Register a new account.
- Log in with email and password.
- Log out the current authenticated session.
- Read the current authenticated user with `GET /api/auth/me`.

Behavior:

- Passwords are hashed with `bcryptjs`.
- A JWT access token is generated through the auth middleware.
- Unique usernames are created automatically when needed.

### Profiles

Files:

- `src/controllers/profile.controller.ts`
- `src/services/profile.service.ts`
- `src/routes/profile.routes.ts`
- `src/types/dtos/profile.dto.ts`

Capabilities:

- Read a public profile by username.
- List liked games.
- List comments.
- List ratings.

### Games

Files:

- `src/controllers/game.controller.ts`
- `src/services/game.service.ts`
- `src/services/rawg.service.ts`
- `src/services/game-sync.service.ts`
- `src/routes/game.routes.ts`
- `src/types/dtos/game.dto.ts`

Capabilities:

- Search RAWG games.
- Get popular games.
- Fetch a single game by `gameId`.
- Like, comment, and rate games.

### Database access

Files:

- `src/repositories/profile.repository.ts`
- `src/repositories/profile-interaction.repository.ts`
- `src/repositories/user-credentials.repository.ts`
- `src/repositories/game.repository.ts`

Responsibilities:

- Keep SQL and TypeORM logic out of controllers and services.
- Encapsulate joins, lookups, and write operations.
- Aggregate community statistics for games.

## 6. Data model

### Main entities

- **`profiles`** — user-facing profile records.
- **`user_credentials`** — login credentials and provider metadata.
- **`games`** — locally stored RAWG game records.
- **`game_comments`** — comments written by users on games.
- **`game_ratings`** — star ratings per profile and game.
- **`profile_liked_games`** — likes and favorites per profile and game.

### Relationships

- A profile has one set of credentials.
- A profile can like many games.
- A profile can comment on many games.
- A profile can rate many games.
- A game can be liked, commented on, and rated by many profiles.

### Important `games` fields

- `id`: RAWG game ID and local primary key.
- `slug`, `name`, `released`, `tba`.
- `rating`, `rating_top`, `ratings`, `ratings_count`.
- `metacritic`, `playtime`, `updated`.
- `lastSyncedAt`: used to track when the local row was last refreshed.

## 7. RAWG integration

### Strategy

The project does not pre-seed every RAWG game.

Instead it uses lazy hydration:

1. Search and popular endpoints fetch list data from RAWG.
2. A game is stored locally when the app needs it.
3. `GameSyncService.resolveGame(gameId)` checks the local database first.
4. If the game is missing or stale, the app refreshes it from RAWG.

### Why this approach

- It avoids a huge one-time import.
- It keeps the local database smaller.
- It lets the app grow around real usage instead of a full catalogue dump.

### Caching

An in-memory LRU cache is applied only to:

- `GET /api/games/search`
- `GET /api/games/popular`

This speeds up repeated list requests without affecting writes or single-game hydration.

## 8. API documentation

### Auth endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Profile endpoints

- `GET /api/profiles/:username`
- `GET /api/profiles/:username/liked-games`
- `GET /api/profiles/:username/comments`
- `GET /api/profiles/:username/ratings`

### Game endpoints

- `GET /api/games/search`
- `GET /api/games/popular`
- `GET /api/games/:gameId`
- `POST /api/games/:gameId/likes`
- `POST /api/games/:gameId/comments`
- `POST /api/games/:gameId/ratings`

### Search query options

The search endpoint accepts these filters:

- `search`
- `page`
- `pageSize`
- `releasedFrom`
- `releasedTo`
- `ratingMin`
- `ratingMax`
- `metacriticMin`
- `metacriticMax`
- `platforms`
- `genres`
- `tags`
- `ordering`

### Popular query options

- `page`
- `pageSize`
- `periodDays`

## 9. Validation and error handling

### Validation

Request input is validated with DTO classes and decorators.

Examples:

- Email must be valid.
- Password must be at least 8 characters.
- Game comments are limited to 2000 characters.
- Ratings must be whole numbers between 1 and 5.

### Error handling

The app uses:

- `AppError` for typed application errors.
- `asyncHandler(...)` to catch async route errors.
- `errorMiddleware` as a global error handler.

This keeps error responses predictable and avoids repeating `try/catch` blocks in controllers.

## 10. Configuration

### Important environment variables

- `PORT` — HTTP port.
- `NODE_ENV` — runtime mode.
- `JWT_SECRET` — token signing secret.
- `JWT_ACCESS_TTL` — access token lifetime.
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — MySQL connection.
- `TYPEORM_SYNCHRONIZE` — development-only schema sync toggle.
- `RAWG_API_BASE_URL` — RAWG base URL. Fallback to `https://api.rawg.io/api`
- `RAWG_API_KEY` — RAWG API key.

### Database startup

The server runs TypeORM migrations at startup.

This means schema changes are applied automatically before the app starts listening.

## 11. Development and build commands

From `site/server`:

```bash
npm install
npm run dev
npm run build
npm run start
```

## 12. Troubleshooting

### The server does not start

Check:

- MySQL is running.
- `.env` values are correct.
- The RAWG API key is set.

### Login fails

Check that the account exists and the password is correct.

### Search works but game details fail

This usually means RAWG access is missing or the game ID is invalid.

### Database errors appear after a code change

Re-run the server so migrations can apply again, and confirm the schema matches the entities.