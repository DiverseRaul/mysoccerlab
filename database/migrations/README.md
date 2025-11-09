# Database Migrations

This folder contains SQL migration scripts for the My Soccer Lab database.

## Applying Migrations

To apply these migrations to your Supabase database:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the migration SQL
4. Run the query

## Migration History

### 0001_add_position_played_to_matches.sql

Adds the `position_played` field to the matches table to track which position the player played in each match.

### 0002_add_stats_to_goalkeeper_stats.sql

Adds additional statistics to the goalkeeper_match_stats table.

### 0003_add_field_position_to_shots_and_goals.sql

**NEW** - Adds `field_position` column to both `shots` and `goals` tables to track precise coordinates where on the field shots and goals were taken from.

#### Field Position System

The field position is stored as a TEXT field containing X,Y coordinates as percentages:

- Format: `"x,y"` (e.g., `"45.50,67.25"`)
- X: Horizontal position (0-100%, left to right)
- Y: Vertical position (0-100%, top to bottom)
- Top of field = Opponent's goal (0%)
- Bottom of field = Midfield line (100%)

Users can click anywhere on the attacking half field visualization to record the exact position where a shot or goal originated.

## How to Apply Migration 0003

Run this SQL in your Supabase SQL Editor:

```sql
-- Add field_position to shots table (stores x,y coordinates as text)
ALTER TABLE public.shots
ADD COLUMN field_position TEXT;

-- Add field_position to goals table (stores x,y coordinates as text)
ALTER TABLE public.goals
ADD COLUMN field_position TEXT;
```

After applying this migration, the app will be able to track and visualize exact shot positions with precision on the field heat map.
