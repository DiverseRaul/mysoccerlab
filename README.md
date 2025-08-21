# My Soccer Lab ⚽

A modern Vue.js soccer analytics and management platform with Supabase backend integration.

## Features

- 🔐 Authentication (Email/Password + Google OAuth)
- 👥 Player Management
- ⚽ Match Tracking
- 📊 Analytics Dashboard
- 🏆 Performance Statistics
- 📱 Responsive Design

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

Run these SQL commands in your Supabase SQL editor:

```sql
-- Create players table
CREATE TABLE players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    goals INTEGER DEFAULT 0,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create matches table
CREATE TABLE matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    opponent TEXT NOT NULL,
    date DATE NOT NULL,
    score_for INTEGER NOT NULL,
    score_against INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own players" ON players FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own players" ON players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own players" ON players FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own players" ON players FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own matches" ON matches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own matches" ON matches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own matches" ON matches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own matches" ON matches FOR DELETE USING (auth.uid() = user_id);
```

### 4. Development

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
```

### 6. Deploy to GitHub Pages

1. Push your code to a GitHub repository
2. Enable GitHub Actions in your repository
3. The included workflow will automatically deploy to GitHub Pages on every push to main
4. Go to Settings > Pages and set source to "GitHub Actions"

## Technology Stack

- **Frontend**: Vue 3, Vue Router
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Styling**: Custom CSS with modern design
- **Build Tool**: Vite
- **Deployment**: GitHub Pages

## Project Structure

```
src/
├── components/
│   ├── Home.vue          # Landing page
│   ├── Login.vue         # Authentication
│   └── Dashboard.vue     # Main app dashboard
├── lib/
│   └── supabase.js       # Supabase configuration
├── App.vue               # Root component
└── main.js               # App entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for your own soccer team management needs!
