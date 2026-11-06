# Mise

Spin up a recipe from random ingredients and whatever's in your kitchen, snap your fridge and get dinner out of it, or open the app to a recipe of the day picked for your tastes. Mise is a cooking game that ends in a meal you want to eat.

iOS and Android. Built by Foti Ventures LLC.

## What It Does

- **Today**: one recipe a day, picked from your favorite cuisines, proteins, gear, and usual cook time. Same pick all day, new one tomorrow.
- **Spin**: 2 to 8 wheels (protein, produce, equipment, style, cuisine, wildcard, format, flavor). Lock what you like, reroll the rest, then cook it in Free Play or as a timed challenge.
- **Snap**: photograph your fridge, confirm what Mise found, and get a recipe built around it.
- **Arena**: Quickfire, Standard, Master Chef, Mystery Basket, Kitchen Chaos, and Head-to-Head. Timed cooking, AI judging with evidence labels, friends, groups, and leaderboards.
- **Kitchen**: saved recipes, history, Rematch and Reinvent, pantry, and your equipment.

## Stack

| Layer    | Choice                                                         |
| -------- | -------------------------------------------------------------- |
| Monorepo | pnpm workspaces + Turborepo                                    |
| Mobile   | Expo (React Native, TypeScript), Expo Router, Reanimated, Skia |
| API      | Fastify 5, Zod, Prisma 7, Postgres                             |
| AI       | Flint, behind the `ChefModel` interface in `@mise/ai`          |
| Storage  | S3-compatible bucket (R2 or Railway) for photos                |
| Hosting  | Railway (API + Postgres), EAS (mobile builds)                  |

## Layout

```
apps/
  mobile/        Expo app (tabs: Today, Spin, Snap, Arena, Kitchen)
  api/           Fastify API, Prisma schema, AI routes
packages/
  engine/        Seeded randomizer, ingredient library, food-safety table (pure TS, no I/O)
  schema/        Zod schemas shared by app and API
  ai/            ChefModel interface; Flint adapter lives here
  tsconfig/      Shared TS config
docs/            Roadmap and design notes
```

## Getting Started

Requires Node 22+, pnpm 10+, and Docker.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env        # bootstrap already did this
cp apps/mobile/.env.example apps/mobile/.env
pnpm db:up                                     # Postgres on :5432
pnpm db:migrate                                # first migration
pnpm dev:api                                   # http://localhost:4000/health
pnpm dev:mobile                                # press i (iOS sim) or a (Android), or scan with Expo Go
```

On a physical phone, set `EXPO_PUBLIC_API_URL` to your Mac's LAN IP, not `localhost`.

## Scripts

| Command           | Does                                |
| ----------------- | ----------------------------------- |
| `pnpm dev:api`    | API with hot reload                 |
| `pnpm dev:mobile` | Expo dev server                     |
| `pnpm typecheck`  | TypeScript across the repo          |
| `pnpm test`       | Vitest                              |
| `pnpm lint`       | ESLint                              |
| `pnpm format`     | Prettier                            |
| `pnpm db:migrate` | Create and apply a Prisma migration |

## Environment

API (`apps/api/.env`):

| Var                               | Purpose                                      |
| --------------------------------- | -------------------------------------------- |
| `DATABASE_URL`                    | Postgres connection string                   |
| `JWT_SECRET`                      | 48+ random bytes (`openssl rand -base64 48`) |
| `CORS_ORIGINS`                    | Comma-separated allowed origins              |
| `FLINT_BASE_URL`, `FLINT_API_KEY` | AI access. Server only.                      |
| `FLINT_MODEL`                     | Chat model name on the Flint endpoint        |
| `S3_*`                            | Photo bucket                                 |
| `MAX_UPLOAD_MB`                   | Upload cap (default 8)                       |

Mobile (`apps/mobile/.env`): only `EXPO_PUBLIC_API_URL`. Anything prefixed `EXPO_PUBLIC_` ships in the app bundle, so no secrets go here.

## Rules The Code Follows

- **Model keys never leave the server.** The app calls the API; the API calls Flint.
- **Recipes say where they came from.** Every recipe carries `source: ai | rules | demo`, and the UI labels it. Demo content never looks like a live model answer.
- **Safety temperatures come from `@mise/engine/safety`**, not from the model. The validator rejects any recipe missing the right temperature for its protein.
- **Allergens and dislikes are hard filters** applied before a wheel spins and again when validating the recipe.
- **Fridge Snap results are suggestions** until the user confirms them.
- **Judging is an estimate.** Every score line has an evidence label: seen in photo, reported by you, inferred from recipe, or not verifiable.
- **Challenges replay exactly.** Each wheel draws from `hash(seed, category, rerolls)`, so a challenge ID plus seed reproduces the same spin.
- **Timers use timestamps** (`endsAt - now`), so backgrounding or locking the phone never drifts the clock.

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md).

## License

Proprietary. Copyright Foti Ventures LLC.
