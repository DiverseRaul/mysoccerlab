# My Soccer Lab — Complete Feature Guide

My Soccer Lab is a personal soccer analytics platform for individual players. You log your matches and practice sessions, map every shot and action on a pitch, and the app turns it into honest numbers: a position-aware match rating, heatmaps, trends, training load tracking, and AI coaching that reads your real stats. There's also a social side — follow other players and see their matches in a feed called The Pitch.

This document explains every feature in the app, how it works, and where to find it.

---

## The Website at a Glance

| Page | URL | Who sees it | What it's for |
|------|-----|-------------|---------------|
| Home | `/` | Everyone | Playable pitch demo, pitch of the product, sign-up CTAs |
| Login | `/login` | Signed-out | Email/password or Google sign-in |
| Sign Up | `/signup` | Signed-out | Account creation (email or Google) |
| Dashboard | `/dashboard` | Signed-in | The main workspace: Overview, Matches, Practice tabs + AI Coach |
| The Pitch | `/feed` | Signed-in | Social feed — follow players, browse public matches |
| Profile | `/profile` | Signed-in | Player identity, position, privacy and app preferences |

**Navigation:** a floating pill navbar sits at the top of every page. Signed out it shows Home / Login / Sign Up; signed in it shows Home / Dashboard / The Pitch / Profile / Logout. On phones it collapses into a hamburger menu. Visiting a protected page while signed out redirects to Login.

**A typical journey:** a visitor plays with the home-page demo → signs up (30 seconds, or one tap with Google) → the new-player intro walks them through the app → they set their position in Profile → log their first match in Dashboard → Matches → map their shots on the pitch → get a rating → ask the AI Coach what to improve → make their profile public and follow friends on The Pitch.

---

## 1. Home Page — the Playable Demo

The landing page doesn't describe the product; it *is* the product. Visitors get a live demo before signing up:

- **The scenario:** you're a striker, 0–1 down against "Rivals FC". Your live rating starts at 5.85 ("Below Average") because you're losing.
- **Tap to play:** pick an event chip — **Goal**, **Shot on target**, or **Shot off target** — then tap anywhere on the pitch. A marker drops where you tapped.
- **The rating reacts:** every tap is fed through the *actual* rating engine used for real matches. Your first goal jumps you to 7.80 "Good". A brace gets you 9.63 "World Class". Spraying shots wide drags your rating down.
- A live scoreline, GOAL! flash, stat strip (Shots / Goals / Rating), and Undo/Reset complete the toy. Nothing is saved — it's a playground.
- Below the demo: a 3-step "How it works" and sign-up calls to action.

## 2. Accounts & Sign-in

- **Email + password** sign-up and sign-in, with a show/hide password toggle and clear error messages.
- **Continue with Google** (OAuth) on both pages. After Google redirects back, the app waits for the session handshake to finish before deciding you're logged in (so you land on the Dashboard, not back at Login).
- Protected pages (Dashboard, Profile, The Pitch) redirect to Login when signed out.

## 3. New-Player Intro

The first time a player with no logged matches opens the Dashboard, a 5-step welcome tour appears:

1. **Welcome to the Lab** — what the app is; set your position in Profile first, because everything is rated position-by-position.
2. **Log your matches** — where and how (about 30 seconds per match).
3. **Map every shot** — drop goals/shots on the pitch where they happened.
4. **Your rating, computed** — the 1.0–10.0 engine, explained honestly.
5. **AI Coach & The Pitch** — the sparkle button and the social feed.

It has Next/Back/Skip and progress dots, turns into a bottom sheet on phones, and once dismissed it never shows again.

## 4. Dashboard — Overview Tab

Your season at a glance:

- **Header tiles:** total matches, W-D-L record with win rate, average rating, and last match (rating + result + opponent).
- **Stat tiles:** goals & assists, playmaking (passes, pass accuracy, chances created), defensive actions (tackles, interceptions, clearances), and season insights.
- **Shot Map:** two linked views — *Origin* (where on the field your shots came from) and *Placement* (a 3×3 goal grid showing where they ended up). Click any goal/shot to see its trajectory line from field position to goal placement.
- **Match Ratings chart:** your rating trend over the last 10 matches.
- **Goals & Assists chart:** output over the last 10 matches.
- **Practice tile:** recent practice sessions.
- **Load Management widget** — see §9.

Everything on this tab respects the selected season filter.

## 5. Dashboard — Matches Tab

The heart of the app. Log a match, then capture what happened in it.

### Adding & managing matches
- **Add Match:** opponent, date, score, position played, optional season assignment, optional "track tactical heatmap for this match" toggle.
- **Match list:** newest first, each row showing opponent, date, score, position, and a season pill (tap it to assign the match to a season).
- **Edit** (opponent/date), **Delete** (with a warning — it removes the match's logged events too).

### Two ways to log events
You choose your preferred default in Profile; you can switch per match.

**Map logger (tap the pitch):**
- Tap anywhere on the interactive pitch → a radial menu pops up with actions: Goal, Assist, Shot, Pass, Dribble, Chance, Tackle, Interception, Clearance, Foul.
- Pins are color-coded (green = positive, blue = defensive, red = negative, gray = neutral). Tap a pin to delete it.
- A summary panel tallies everything live, and quick +/- controls sit below for stats you don't want to place on the map.

**Counters (+/- cards):**
- Simple increment/decrement cards for every stat: goals, assists, shots, tackles, interceptions, clearances, dribbles, chances created, possessions lost, good/bad passes, fouls, errors that led to a goal, yellow/red cards, plus team score events (our goal / their goal / own goal).

### Goalkeeper mode
Toggle it on for matches you played in goal. It swaps in GK stats: **saves, catches, punches, penalties saved, goals conceded, errors led to goal** — and the rating engine switches to its goalkeeper formula.

### Shot visualization
Each goal/shot you logged is listed with a badge (Goal / On target / Off target). Click one to see it drawn on the pitch: its origin point, its goal placement (1–9 grid), and a trajectory line between them.

### Sharing a match
The Share button builds a graphic of your match you can export as an image:
- Three layouts: **Stats** (6 stat boxes), **Score** (huge scoreline + rating), **Story** (9:16 portrait for social stories).
- Background presets (dark/light) or your own image, plus a caption (240 characters).

## 6. Dashboard — Practice Tab

Track training, not just matches.

- **Drills:** create your own (name, metric type, unit, optional target, notes) or start from preset templates. Metric types:
  - **Count** — one number per session (e.g., juggles).
  - **Ratio** — made/attempted with an accuracy percentage (e.g., 7/10 free kicks).
  - **Shot map** — place each shot on a goal graphic with foot (left/right) and outcome (goal, saved, off target, post); goals/shots are derived automatically.
- **Sessions:** log a session per drill with date, value(s), and notes.
- **Progress:** each drill gets a timeline of sessions, a chart of your values over time, personal bests highlighted, and trend direction.
- "Lower is better" toggle for drills where smaller numbers win (e.g., sprint times).

## 7. AI Coach

Open it with the floating sparkle button on the Dashboard.

- **It knows your game.** Every conversation includes your full match log, career totals, position, preferred foot, and club — the advice is about *your* numbers, not generic tips.
- **Chat** about anything: "Analyze my last game", "How can I improve my passing?", "Create a training plan", "Review my stats".
- **Match cards:** ask about your last game and it attaches a rich card (score, result, rating with tier color, key stats).
- **Training calendars:** when the coach proposes a weekly plan, it renders as a structured day-by-day calendar card, not a wall of text.
- **Attachments:** send images or video clips (e.g., your shooting form) for the coach to analyze.
- Chat history persists between sessions; "New chat" starts fresh.

Technically: the AI runs on Google Gemini through a Supabase Edge Function, so the API key never ships in the app.

## 8. The Pitch (Social Feed)

- **Following tab:** recent matches from players you follow.
- **Explore tab:** matches from public profiles across the app.
- **Search:** find players by name, see their avatar/position, and follow/unfollow with one tap.
- **Feed cards** show the player, opponent, date, scoreline, W/D/L badge, and their goals/assists/rating for that match.
- Privacy is enforced at the database level: only matches from **public** profiles (or players you follow) ever appear.

## 9. Load Management

A lightweight injury-prevention tool on the Overview tab:

- Log training load: date, minutes (0–600), and a fatigue rating (1–10 slider).
- The widget computes your **7-day rolling load** and places you in a zone:
  - **Optimal** — ≤ 360 weekly minutes and fatigue ≤ 5
  - **Caution** — 360–540 minutes or fatigue 5–7
  - **High Risk** — > 540 minutes or fatigue ≥ 7
- The gauge plus weekly minutes and average fatigue tell you when to push and when to back off.

## 10. Profile

Your player identity and app preferences:

- **Player details:** name, avatar upload, birthday, jersey number (1–99), club team, preferred foot (right/left/both).
- **Position picker:** an interactive pitch graphic with clickable position dots (GK, CB, FB, WB, DM, CM, AM, Winger, Striker, CF). This drives the rating engine — pick honestly.
- **Privacy:** Public/Private profile toggle. Private means your matches never appear in anyone's feed.
- **Preferences:** enable/disable tactical heatmap tracking, and choose your default match logger view (Map or Counters).

## 11. Seasons

- Create seasons with a name and optional start/end dates; rename or delete them anytime (deleting a season unassigns its matches, it doesn't delete them).
- Assign matches to seasons from the Matches tab (tap the season pill on a match row).
- The **season selector** in the Dashboard header filters everything — stats, charts, shot maps, match list — to the chosen season, or "All Time".

## 12. The Rating Engine

Every match gets a **1.0–10.0 rating** computed from your logged stats. It is position-aware and deliberately hard to max out — a 10.0 requires sustained quality, not one hot stat.

**How it thinks (all positions):**
- You start at 6.0. Winning adds a little (+0.3), losing costs a little (−0.15).
- Cards and disasters hurt: yellow −0.85, red −3.5, own goal −2.5, error leading to a goal −1.6.

**Outfield players:**
- **Goals** are worth most for strikers, then wingers, attacking mids, then everyone else — with diminishing returns (2nd goal 85% value, 3rd+ 70%) so a hat-trick is brilliant but not an automatic 10. Values are deliberately modest: one goal lifts an otherwise-average striker into the low 7s ("Good"), a brace reaches the mid 8s ("Excellent"), and a hat-trick the high 8s/9s ("Outstanding") — a single goal never carries a whole match on its own.
- **Assists and chances created** are valued extra for creators (AMs, wingers), and always rank below a goal (goal > assist > chance).
- **Passing** is volume-weighted against a position-specific expectation (center-backs are expected ~85% accuracy, midfielders ~80%, attackers ~75%). Completing 60 passes above expectation moves your rating far more than completing 20.
- **Shots on target** earn a small bonus; firing 3+ shots with nothing on target and no goals earns a wastefulness penalty that grows with volume.
- **Defending** (tackles, interceptions, clearances) counts more for DMs, CBs and FBs; defenders also earn clean-sheet bonuses and share blame for goals conceded.
- **Losing possession** is judged by role: a winger losing it dribbling is nearly free; a holding midfielder or full-back giving it away is expensive.

**Goalkeepers** (separate formula):
- Progressive save bonuses — your 7th save is worth double your 1st.
- Clean sheets scale with how busy you were: a 7-save shutout is "heroic" (+1.2); an untested clean sheet is +0.2.
- Penalty saves are huge (+1.8 each). Conceding is penalized goal by goal, hardest for the first.
- Modern distribution matters: your passing is measured against a ~65% expectation (long balls forgiven).

**Tiers:** 9.5+ World Class · 9.0 Outstanding · 8.0 Excellent · 7.0 Good · 6.5 Solid · 6.0 Average · 5.5 Below Average · 4.0 Poor · below that, Very Poor. Each tier has its own color used everywhere ratings appear.

---

## Under the Hood (quick technical summary)

- **Frontend:** Vue 3 + Vite single-page app. Routes: `/` (home), `/login`, `/signup`, `/dashboard`, `/profile`, `/feed`.
- **Backend:** Supabase — Postgres (with row-level security on every user-owned table), Auth (email/password + Google OAuth), and an Edge Function for the AI coach (Gemini key stays server-side).
- **Data model:** `matches` (one row per match with aggregate counters), `goals` and `shots` (one row per event, each carrying field position and goal quadrant), `goalkeeper_match_stats`, `user_profiles`, `seasons`, `user_relationships` (the follow graph), plus practice and load-tracking tables. Schemas live in `database/` with incremental migrations in `database/migrations/` (applied manually in the Supabase SQL editor).
- **Deployment:** GitHub Pages via GitHub Actions on push to `main`, with an SPA redirect trick (`404.html`) so deep links work.
- **Testing:** Playwright end-to-end tests run on desktop *and* an iPhone-13-sized mobile viewport (mobile is the primary target — see `testing-policy.md`), plus Vitest unit tests for the pure logic in `src/lib/` (rating engine, event catalog, load math). `npm run test:e2e` / `npm run test:unit`.
- **Config:** `.env` needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Google sign-in additionally requires enabling the Google provider in the Supabase dashboard and allow-listing the app's `/dashboard` redirect URLs.
