# Mise Roadmap

Each phase ships something playable on a phone before the next starts.

## Phase 0: Bootstrap (done)

Monorepo, Expo shell with five tabs, Fastify API with health route, Prisma schema, shared schemas, seeded RNG, safety table, CI.

## Phase 1: Engine and Library

- 40 to 60 hand-tagged entries per category (~400 total): roles, allergens, diets, safety class, equipment capabilities, skill, centrality.
- `spin(config, seed)` with lock, reroll, exclusions, pantry priority, and a playability score gated by the Easy / Medium / Hard level. Resample up to 20 times, then relax.
- Equipment capability checks (a pop-up toaster can only toast, so it never carries a dish alone).
- Property tests: allergens never appear across thousands of seeds; locked wheels never change.

## Phase 2: Spin

- Wheels drawn in Skia as prep bowls seen from above; ingredients drop in on reveal. Haptics on each stop, sound off by default, reduced-motion path shows the result card directly.
- Reveal screen, Free Play recipe via `POST /recipes` (Flint), validator, one retry with errors fed back, then rule-based fallback labeled "Basic Plan (No AI)".
- Ships with the sample challenge: ground beef, celery, buttery, toaster, 30 minutes → Brown Butter Beef Melts with Crispy Celery Slaw, labeled as sample content.
- Local history in SQLite. Challenge links (`mise://c/<id>?s=<seed>`).

## Phase 3: Snap

- Camera or photo picker, downscale on device, `POST /snap` → detected ingredients with confidence.
- Confirm screen: chips to remove or add. Confirmed list feeds Pantry Mode wheels or goes straight to a recipe.
- Photos are not stored unless the user saves the recipe.

## Phase 4: Today

- Onboarding taste profile in under a minute (cuisines, proteins, dislikes, allergens, gear, time, servings).
- Daily pick seeded by `userId + date`, generated once and cached in `DailyPick`. Push notification at the user's chosen time.
- "Not Feeling It" swaps once per day.

## Phase 5: Cook Mode

- Presets on Spin: Mystery Basket, Kitchen Chaos. No timers, no judging.
- Cook Mode: 72pt targets, keep-awake, one titled step at a time with its minutes, ingredient list one tap away.
- Done saves the cook to Kitchen. Cook Again from any saved recipe.

## Phase 6: Accounts and Sync

- Sign in with Apple and Google, short-lived JWTs, refresh tokens in SecureStore.
- Sync history, presets, and profile to Postgres. Photos to the bucket via presigned upload.

## Phase 7: Social

- Head-to-Head (same seed, blind judging), friends, private groups, weekly featured challenge.
- Leaderboards split by verified competitions vs casual results; no points for volume.
- Public gallery and voting only after reporting, blocking, image moderation, and rate limits are in.
- Achievements and personal stats.

## Phase 8: Later

Live remote competitions, AI commentary, voice-guided cooking, tournaments, community challenge packs, shopping lists, recipe scaling, nutrition estimates, lessons.

## What Has To Be True

- Under 40% of spins need a reroll.
- 60%+ of started challenges get finished.
- 35%+ of users start a second recipe within a week.
- Validator passes 85%+ first try, 97%+ after one retry, zero unsafe recipes reach users.
