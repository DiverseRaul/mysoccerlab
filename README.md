# My Soccer Lab ⚽

A modern Vue.js soccer analytics and management platform with Supabase backend integration.

## Features

- 🔐 Authentication (Email/Password + Google OAuth)
- 👤 Player profile with position, preferred foot, club, and achievements
- ⚽ Match tracking with per-event goals and shots (incl. on-field x/y position)
- 🥅 Goalkeeper-specific stats (saves, catches, punches, penalties saved, …)
- 📊 Analytics dashboard with shot maps and season filtering
- 🏆 Dynamic 1.0–10.0 performance rating, position-aware
- 🤖 AI Coach (Gemini) with image/video film-room analysis
- 📰 Feed: follow other players and view their public matches
- 📱 Responsive design

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Create Database Tables

The schema lives in the `database/` folder. Apply it via the Supabase SQL editor in this order:

1. `database/profiles_table.sql` — `user_profiles` and `user_achievements`
2. `database/matches_schema.sql` — `matches`, `goals`, `shots`, `goalkeeper_match_stats`
3. Each file in `database/migrations/` in numeric order (`0001_…` through `0006_…`) — adds `position_played`, expanded GK stats, on-field shot/goal coordinates, follow graph, public profiles, avatars, and Feed visibility policies

RLS is enabled on every user-owned table; policies restrict reads/writes to the owning user, plus extra `SELECT` policies that let users see matches of public profiles or accounts they follow (for the Feed).

### 4. (Optional) Set Up the AI Coach

The AI Coach calls a Supabase Edge Function (`supabase/functions/ai-coach`) that proxies Google Gemini, so the API key never ships in the client bundle.

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add it as a Supabase Function secret: `supabase secrets set VITE_GEMINI_API_KEY=…`
3. Deploy the function: `supabase functions deploy ai-coach`

Without this, every other feature still works — only the "AI Coach" tab will return errors.

### 5. Development

```bash
npm run dev
```

### 6. Build for Production

```bash
npm run build
```

### 7. Deploy to GitHub Pages

1. Push your code to a GitHub repository
2. Go to Settings > Pages and set source to **GitHub Actions**
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Settings > Secrets and variables > Actions (the workflow reads them at build time)
4. The workflow in `.github/workflows/deploy.yml` runs on every push to `main` and publishes `dist/`

`npm run deploy` is a manual `gh-pages -d dist` fallback that bypasses the workflow.

## Technology Stack

- **Frontend**: Vue 3, Vue Router
- **Backend**: Supabase (PostgreSQL + Row Level Security, Auth)
- **AI**: Google Gemini (`gemini-2.0-flash`) via a Supabase Edge Function (Deno)
- **Styling**: Custom CSS
- **Build Tool**: Vite
- **Deployment**: GitHub Pages (via GitHub Actions)

## Project Structure

```
src/
├── components/
│   ├── Home.vue                # Landing page
│   ├── Login.vue / SignUp.vue  # Authentication
│   ├── Dashboard.vue           # Dashboard shell (Overview / Matches / AI Coach tabs)
│   ├── DashboardOverview.vue   # Stats summary + shot map
│   ├── MatchManager.vue        # Match CRUD + per-event goal/shot entry
│   ├── DashboardAICoach.vue    # AI Coach tab
│   ├── AIChatbot.vue           # Reusable chatbot UI
│   ├── ShotMapSection.vue      # On-field shot/goal heatmap
│   ├── SeasonSelector.vue      # Season filter + create/delete
│   ├── CreateSeasonModal.vue
│   ├── TrainingPlanCard.vue    # Renders AI-generated training calendars
│   ├── Profile.vue             # User profile + achievements
│   ├── Feed.vue                # Follow graph + public matches
│   └── Footer.vue
├── lib/
│   ├── supabase.js             # Supabase client
│   ├── gemini.js               # Calls the ai-coach edge function
│   └── rating.js               # Position-aware 1.0–10.0 match rating engine
├── App.vue
└── main.js                     # Vue Router setup

database/
├── matches_schema.sql          # matches / goals / shots / goalkeeper_match_stats
├── profiles_table.sql          # user_profiles + user_achievements
├── fix_rls_goals_shots.sql
└── migrations/                 # numbered, applied manually via Supabase SQL editor

supabase/
└── functions/ai-coach/         # Deno edge function — proxies Gemini
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for your own soccer team management needs!
