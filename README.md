# GameScore

GameScore is a web project about videogames. It includes a TypeScript/Express backend, a MySQL database, and game data fetched from the RAWG Video Games API.

## What this project does

- Lets people create an account and log in.
- Shows public profiles for users.
- Lets authenticated users like, favorite, comment on, and rate games.
- Searches RAWG games and shows popularity results.
- Saves games locally when they are needed, instead of downloading everything up front.

## Where the code lives

- `site/server` — the API server.
- `site/FrontEnd` — static views used by the frontend.
- `doc/technical-documentation.md` — full technical documentation.

## What you need first

Before running the project, make sure you have:

- **Node.js** and `npm`
- **MySQL 8**
- **RAWG API key**
- Optional: **Docker** if you want to start MySQL with one command

## Quick start

### 1) Open the server folder

```bash
cd GameScore---Yboost-B2/site/server
```

### 2) Create the environment file

Create a file named `.env` in `site/server` and fill it with values like these:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=change-me
JWT_ACCESS_TTL=4h

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=pass
DB_NAME=gamescore
TYPEORM_SYNCHRONIZE=true

RAWG_API_BASE_URL=https://api.rawg.io/api
RAWG_API_KEY=your_rawg_api_key
```

### 3) Start MySQL

If you use Docker, run this inside `site/server`:

```bash
docker compose up -d
```

If you already have MySQL installed locally, make sure it is running and that the database settings in `.env` match your setup.

### 4) Install dependencies

```bash
npm install
```

### 5) Start the server

For development:

```bash
npm run dev
```

For a production-style build:

```bash
npm run build
npm run start
```

## How to use the API

Once the server is running, the API is available at:

```text
http://localhost:3000/api
```

### Common actions

- **Create an account**: `POST /api/auth/register`
- **Log in**: `POST /api/auth/login`
- **See your account**: `GET /api/auth/me`
- **Search games**: `GET /api/games/search`
- **See popular games**: `GET /api/games/popular`
- **Open one game**: `GET /api/games/:gameId`
- **Like a game**: `POST /api/games/:gameId/likes`
- **Comment on a game**: `POST /api/games/:gameId/comments`
- **Rate a game**: `POST /api/games/:gameId/ratings`
- **See a profile**: `GET /api/profiles/:username`

### Example search

```text
GET /api/games/search?search=zelda&page=1&pageSize=20
```

### Example popular games

```text
GET /api/games/popular?page=1&pageSize=20&periodDays=30
```

### Example using curl

```bash
curl "http://localhost:3000/api/games/search?search=mario"
```

## Simple workflow for a new user

1. Create an account.
2. Log in.
3. Copy the access token returned by the API.
4. Search for a game.
5. Open a game to see the full details.
6. Like, favorite, comment, or rate the game.
7. Visit a public profile using the username.

## If something does not work

- **The server does not start**: check that MySQL is running and `.env` is correct.
- **Login fails**: make sure the account was created first.
- **RAWG requests fail**: verify `RAWG_API_KEY`.
- **Database errors appear**: run the server after MySQL is ready, because migrations run on startup.

## Learn more

- Read `doc/technical-documentation.md` for the full architecture and API design.
- Read `site/server/README.md` for server-focused notes.
