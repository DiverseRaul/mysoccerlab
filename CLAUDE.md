# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product

My Soccer Lab is a Vue 3 + Supabase soccer analytics and management platform for individual players: log matches and per-event shots/goals, see auto-computed performance ratings, get AI coaching, and follow other players in a feed.

## Commands

```bash
npm install         # install deps
npm run dev         # Vite dev server
npm run build       # production build → dist/
npm run preview     # preview the built bundle
npm run deploy      # build + push dist/ to gh-pages branch (manual fallback; CI does this on push to main)
```

There is no linter or formatter configured. **Playwright + Chromium is installed and configured** for E2E tests (`tests/` directory, `playwright.config.js`). The full testing policy is in `testing-policy.md` at the repo root and is **binding** — read it before making any code change.

**E2E tests are required for every task that creates or modifies a screen, route, tile, form, or any user-facing UI behavior.** Both `chromium-desktop` and `chromium-mobile` (iPhone 13 viewport, forced onto Chromium) projects run automatically — mobile coverage is not optional, it's the primary product target.

```bash
npm run test:e2e          # headless suite (desktop + mobile)
npm run test:e2e:ui       # interactive — best for writing/debugging
npm run test:e2e:headed   # watch the browser
npm run test:e2e:report   # open the last HTML report
```

Add new specs to `tests/e2e/`. Authenticated tests need a Supabase test user wired through `tests/global-setup.js` (see `tests/README.md` for the one-time setup). Auth-free smoke tests in `tests/e2e/smoke.spec.js` are the floor — they must always pass.

Pure-function changes in `src/lib/` (rating engine, formatters, aggregators) get **Vitest** unit tests instead of E2E — see the testing policy for the decision table. Vitest is not yet installed; the first PR that adds a unit test installs it per the policy's setup section.

A change is not "done" until its E2E coverage is in place and `npm run test:e2e` passes. Do not mark a UI task complete with the disclaimer "tests deferred" — the testing policy explicitly forbids that.

`.env` (copied from `.env.example`) must contain `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the dev server to work. Without them `src/lib/supabase.js` falls back to placeholder URLs and every Supabase call silently fails.

## Architecture

Vue 3 + Vite SPA, all client-side. The "backend" is Supabase (Postgres + Auth + Edge Functions). There is no Node server in this repo.

### Routing & deployment quirks

- `src/main.js` registers six routes with `createWebHistory()` (no hash mode).
- The site is deployed to GitHub Pages via `.github/workflows/deploy.yml` on push to `main`. The repo's GitHub Pages source must be set to **GitHub Actions** (not "Deploy from a branch") for the workflow to publish. `npm run deploy` is a manual `gh-pages -d dist` fallback that bypasses the workflow.
- Pages doesn't understand SPA routes, so `404.html` runs the [rafgraph/spa-github-pages](https://github.com/rafgraph/spa-github-pages) redirect trick and `index.html` decodes it back. `vite.config.js` declares `404.html` as a second rollup input so the redirect file ends up in `dist/` — keep both entries in sync if you add routes or change the SPA shell.
- `vite.config.js` sets `base: '/'`. The site is served at the apex (custom-domain or user-page), not under `/repo-name/`. If you ever move it under a subpath, both `base` and the `pathSegmentsToKeep` constant in `404.html` must change together.

### Auth & session

`src/App.vue` is the only place that subscribes to `supabase.auth.onAuthStateChange` and toggles the navbar. Individual pages re-fetch `supabase.auth.getUser()` in `onMounted` and redirect to `/login` if absent (see `Dashboard.vue`). There's no shared user store / Pinia — every page that needs the user reads it from Supabase directly.

Two providers are wired up: email/password and Google OAuth (`Login.vue#signInWithGoogle`). The Google flow uses `redirectTo: window.location.origin + '/dashboard'`, so the Supabase project's allowed redirect URLs must include both the dev origin (e.g. `http://localhost:5173/dashboard`) and the production Pages origin.

### Data model

Stats live in five tables — schemas are documented in `database/matches_schema.sql` and `database/profiles_table.sql`, with incremental changes in `database/migrations/`:

- `matches` — one row per match, with aggregate counters (`assists`, `tackles`, `successful_passes`, etc.) and `position_played`.
- `goals` and `shots` — one row per event, each linked to `match_id`. Both carry `quadrant` (1–4 grid) and `field_position` (a TEXT `"x,y"` percentage string, e.g. `"45.50,67.25"`).
- `goalkeeper_match_stats` — separate row keyed by `(match_id, user_id)`; only loaded for matches whose `position_played` contains "goalkeeper".
- `user_profiles` — singleton per user. The `position` column is a `CHECK`-constrained enum (Goalkeeper, Center-Back, Full-Back, Wing-Back, Defensive Midfielder, Central Midfielder, Attacking Midfielder, Winger, Striker, Center-Forward); the rating engine in `src/lib/rating.js` matches on substrings of these — be aware of casing/punctuation when adding new options.
- `seasons` and `user_relationships` — for season filtering and the Feed's follow graph.

`Dashboard.vue#loadData` is the canonical example of how to assemble per-match stats: fetch matches → fetch all `goals`, `shots`, and (conditionally) `goalkeeper_match_stats` keyed by `match_id IN (...)` → fold them onto each match (`my_goals`, `shots_on_target`, `shots_off_target`, `goalkeeper_stats`). Replicate this shape if you add a new view that consumes match stats; the rating engine and AI coach both expect those derived fields.

RLS is on for every user-owned table. The Feed's cross-user reads work because of `database/migrations/0006_match_visibility_policies.sql`, which adds two extra `SELECT` policies on `matches`: visible if the owner's profile `is_public = true`, or if the current user follows the owner via `user_relationships`. New tables that surface in the Feed need analogous policies — RLS denials silently return empty arrays, not errors.

### Migrations

`database/migrations/` is a flat `0001_…` → `0006_…` sequence applied **manually** via the Supabase SQL editor — there is no Supabase CLI / migration runner wired up. Two files share the prefix `0005_` (`0005_add_avatar_url.sql` and `0005_add_public_profile.sql`); they're independent, so order between them doesn't matter, but don't assume the prefix is unique.

### Match rating engine (`src/lib/rating.js`)

Pure-function rating calculator on a 1.0–10.0 scale, branching on `position_played` (substring match → `POSITION_FLAGS`). Goalkeepers and outfield players use entirely different formulas. Outfield weights (`goalVal`, `assistVal`, `defWeight`, `lostPossWeight`, etc.) vary by position role (striker / winger / AM / CM / DM / FB / CB).

Pass `liveData` to override stats during in-progress entry: `{ goals, shotsOn, shotsOff, gkStats }`. When changing the formula, prefer adjusting the existing per-position weights to introducing new tiers — the engine deliberately uses continuous, volume-weighted scoring (see the comments around `_goalBonus`, `_saveBonus`, `_concededPenalty`, and the pass-accuracy section) so that a 10.0 requires sustained quality, not a single hot stat.

### AI Coach

The `DashboardAICoach` and `AIChatbot` components don't call Gemini directly. They call `generateCoachResponse` in `src/lib/gemini.js`, which `POST`s to the Supabase Edge Function at `${VITE_SUPABASE_URL}/functions/v1/ai-coach`. The function (`supabase/functions/ai-coach/index.ts`, Deno) reads `VITE_GEMINI_API_KEY` from Supabase Function secrets — that key lives only on Supabase, never in the client bundle. The function builds a position-aware system prompt that embeds the player's full match log and career totals, then runs a Gemini chat with `conversationHistory` prepended. The "Training Calendar" output format documented in the system prompt (`Monday – Title\n- bullet`) is parsed by the UI; preserve it if you tweak that prompt.

Image/video attachments are converted to base64 inline parts on the client (`fileToGenerativePart`) and shipped through as `messageParts`.

### Legacy file

`src/components/Dashboard_OLD.vue` (~130 KB) is the pre-refactor monolith. The current dashboard is split into `Dashboard.vue` (shell) → `DashboardOverview.vue` / `MatchManager.vue` / `DashboardAICoach.vue`. Don't import from `Dashboard_OLD.vue`; treat it as reference only.
