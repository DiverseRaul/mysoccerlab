// Editable site content for every screen. Backed by the `site_content` table
// (one row per screen key: 'home' | 'premium' | 'coach' | 'faq'): public-read,
// admin-write (RLS from migration 0020). DEFAULTS are baked in so screens always
// render even before a row exists; loaded rows are deep-merged over the defaults.

import { ref } from 'vue'
import { supabase } from './supabase'

export const DEFAULTS = {
  home: {
    hero: {
      eyebrow: 'My Soccer Lab',
      title: 'Your game,',
      titleAccent: 'measured.',
      sub: 'Track your matches and your training in one place — honest ratings, shot maps and xG on game day, drills, streaks and personal bests in between, with AI coaching across both.',
      ctaPrimary: 'Start for free',
      scrollHint: 'Scroll to see how it works ↓'
    },
    showcase: { eyebrow: 'How it works', title: 'Two ways to get better.' },
    features: [
      { key: 'heatmap', tag: 'Heatmap', title: 'Every touch, mapped.', text: 'Tap the pitch to log where it happened. Over a season it builds a heatmap of exactly where you played, scored, and defended.' },
      { key: 'training', tag: 'Training', title: 'Train, even without a match.', text: 'Track any drill — juggles, sprints, shooting accuracy — and watch streaks, personal bests and trends climb. No match needed to get value.' },
      { key: 'rating', tag: 'Match rating', title: 'An honest 1–10 rating.', text: 'A position-aware engine weighs your goals, passing, defending and mistakes.' },
      { key: 'xg', tag: 'Expected goals', title: 'xG on every shot.', text: 'See how likely each chance was to score, and whether you’re finishing clinically or leaving goals out.' },
      { key: 'ai', tag: 'AI coach', title: 'Coaching that reads your game.', text: 'The AI coach studies your real numbers — matches, training, or both — and your position, then builds plans around what you actually need.' },
      { key: 'feed', tag: 'The Pitch', title: 'Share it on The Pitch.', text: 'Follow other players and see their matches and training milestones roll into your feed.' }
    ],
    ctaBand: { title: 'Built for game day and the days between.', sub: 'Log a match or track a drill — your ratings, progress, and AI coach are one tap away.' }
  },

  premium: {
    hero: {
      badge: 'LAB PRO',
      title: 'Train like you',
      titleAccent: 'mean it.',
      sub: "Everything in My Soccer Lab stays free, forever. Lab Pro adds the deep stuff — an analyst-grade AI coach, clip breakdowns, and a few things that just make it yours."
    },
    features: [
      { id: 'coach', title: 'Advanced AI Coach', text: 'Deep, multi-angle tactical breakdowns and full multi-week periodized training plans — not just quick tips.' },
      { id: 'clip', title: 'Clip & photo analysis', text: 'Upload match clips or screenshots and your coach breaks down your positioning, movement and decisions.' },
      { id: 'badge', title: 'Pro badge', text: 'A PRO badge on your profile and your match cards in The Pitch — show you mean business.' },
      { id: 'accent', title: 'Make it yours', text: 'Pick any accent colour and recolour the whole app to your taste.' },
      { id: 'early', title: 'Early access', text: 'Get new features and experiments first, before anyone else.' }
    ],
    examples: {
      free: 'Solid game — 2 goals and your pass accuracy held up. Keep linking play.',
      pro: [
        'Two goals, +0.9 xG overperformance — you’re finishing above your chances.',
        'From your clip: you drift offside on the blind-side run. Delay the bend by half a second and you stay on.',
        'This week: Mon — finishing under fatigue · Wed — timing runs vs a high line · Fri — weak-foot reps.'
      ]
    },
    pricing: { currency: '$', base: 3.99, year: 39.99, floor: 2.99, note: 'The longer you go, the cheaper each month gets.' },
    cta: { label: 'Notify me at launch', fineprint: 'Lab Pro is launching soon — the free plan keeps every core feature, always.' }
  },

  coach: {
    greeting: 'How can I help',
    suggestions: [
      'Analyze my last match',
      'How can I improve my passing?',
      'Build me a one-week training plan',
      'What should I work on for my position?'
    ]
  },

  faq: {
    items: [
      { q: 'What is My Soccer Lab?', a: 'A personal analytics app for individual players. You log your matches and shots, and it turns them into a position-aware rating, heatmaps, xG, and AI coaching — plus a social feed called The Pitch.' },
      { q: 'How is my match rating calculated?', a: 'Every match gets a 1.0–10.0 rating from a position-aware engine that weighs goals, assists, passing, defending, and mistakes differently by your position. It is deliberately hard to max out — a 10 needs sustained quality, not one hot stat.' },
      { q: 'What is xG?', a: 'Expected goals — an estimate of how likely each shot was to score based on where it was taken. It helps you see whether you are finishing clinically or wasting good chances.' },
      { q: 'How do I log where things happened on the pitch?', a: 'In a match, use the map logger: tap the pitch to drop an event. Goals and shots also record where in the goal they went, and passes can record their direction.' },
      { q: 'Who can see my matches?', a: 'Only you, unless you make your profile public or someone follows you — then your matches appear in their feed. You can go private again anytime from your Profile.' },
      { q: 'Do I need to log every single action?', a: 'No. Log as much or as little as you like. The more you log, the richer your heatmaps and stats — but even a quick scoreline and a couple of shots give you a rating.' },
      { q: 'Is my data safe and can I delete it?', a: 'Your data is private by default and protected by row-level security. You can edit or delete matches anytime, and delete your whole account from the Profile page.' },
      { q: 'Does the AI Coach really use my stats?', a: 'Yes — it reads your actual match history and position, so its advice and training plans are about your game, not generic tips.' }
    ]
  },

  intro: {
    // New-player welcome intro. `enabled` is the master switch; when
    // `forceShowForAdmins` is on, admins re-see the intro on every dashboard
    // load (for testing) while normal users still see it once. Icons live in
    // WelcomeIntro.vue (keyed by path + index) so only copy is admin-editable.
    enabled: true,
    forceShowForAdmins: false,
    choices: [
      { key: 'matches',  title: 'Track my matches',        desc: 'Log games, map shots, get rated.' },
      { key: 'training', title: 'Improve through training', desc: 'Track drills and level up over time.' },
      { key: 'both',     title: 'Both',                     desc: 'Matches and training together.' }
    ],
    steps: {
      matches: [
        { title: 'Welcome to the Lab', body: 'My Soccer Lab measures your game like a pro’s. First stop — set your position in your Profile, because everything here is rated position-by-position.' },
        { title: 'Log your matches', body: 'After every game, open Dashboard → Matches and add it: score, position, minutes, key stats. It takes about thirty seconds while the result is still fresh.' },
        { title: 'Map every shot', body: 'Drop your goals and shots on the pitch exactly where they happened. Over a season it builds your personal heatmap: where you score from, where you waste chances.' },
        { title: 'Your rating, computed', body: 'Every match gets a 1.0–10.0 rating from a position-aware engine — goals, passing, defending, mistakes, all of it. No mercy, no favours.' },
        { title: 'AI Coach & The Pitch', body: 'The AI Coach reads your actual numbers — matches, training, or both — and builds plans around your game. And on The Pitch you can follow other players and see their progress in your feed.' }
      ],
      training: [
        { title: 'Welcome to the Lab', body: 'You don’t need a single match to start. The Training pillar lets you track any drill and watch yourself get better, session by session.' },
        { title: 'Pick a drill', body: 'Open Dashboard → Training → Drills and choose what you work on — juggles, sprint times, shooting accuracy, passing. Start from a preset or build your own.' },
        { title: 'Log a session', body: 'Each time you practice, log the result — a count, a time, or shots placed on the goal. Thirty seconds and you’re done.' },
        { title: 'Watch yourself improve', body: 'Your Training overview tracks streaks, personal bests, and trend lines for every drill — proof you’re getting better, not just busy.' },
        { title: 'AI Coach & The Pitch', body: 'The AI Coach reads your actual numbers — matches, training, or both — and builds plans around your game. And on The Pitch you can follow other players and see their progress in your feed.' }
      ],
      both: [
        { title: 'Welcome to the Lab', body: 'Two ways to grow, in one place. Set your position in your Profile first — everything here is rated position-by-position.' },
        { title: 'Track your matches', body: 'Log games, map every shot, and get an honest 1.0–10.0 rating from a position-aware engine. Dashboard → Matches.' },
        { title: 'Train between games', body: 'Track drills — juggles, sprints, shooting — and watch streaks, personal bests and trends climb. Dashboard → Training.' },
        { title: 'AI Coach & The Pitch', body: 'The AI Coach reads your actual numbers — matches, training, or both — and builds plans around your game. And on The Pitch you can follow other players and see their progress in your feed.' }
      ]
    }
  },

  dashboard: {
    // `group` drives the section headers in the advanced view. The simple set
    // uses '' (no header). Peer Percentiles & Profile Analytics intentionally
    // live on the Profile page (Lab Pro section), not here.
    tiles: [
      { id: 'header-stats', label: 'Header Stats', mode: 'simple', group: '' },
      { id: 'player-card', label: 'Player Card', mode: 'simple', group: '' },
      { id: 'shot-map', label: 'Shot Map', mode: 'simple', group: '' },
      { id: 'pitch-insights', label: 'Pitch Insights', mode: 'simple', group: '' },
      { id: 'match-ratings', label: 'Match Ratings Chart', mode: 'simple', group: '' },
      { id: 'season-goals', label: 'Season Goals', mode: 'simple', group: '' },
      { id: 'trend-alerts', label: 'Trend Alerts', mode: 'advanced', group: 'Form' },
      { id: 'goals-assists', label: 'Goals & Assists', mode: 'advanced', group: 'Attack' },
      { id: 'goals-assists-chart', label: 'Goals & Assists Chart', mode: 'advanced', group: 'Attack' },
      { id: 'playmaking', label: 'Playmaking', mode: 'advanced', group: 'Attack' },
      { id: 'defensive-actions', label: 'Defensive Actions', mode: 'advanced', group: 'Defense' },
      { id: 'season-totals', label: 'Season Totals', mode: 'advanced', group: 'Season' },
      { id: 'season-insights', label: 'Season Insights', mode: 'advanced', group: 'Season' },
      { id: 'practice-recent', label: 'Recent Practice', mode: 'advanced', group: 'Training & load' },
      { id: 'load-management', label: 'Load Management', mode: 'advanced', group: 'Training & load' }
    ]
  }
}

function clone(o) { return JSON.parse(JSON.stringify(o)) }

// Deep-merge `source` over a clone of `base` (objects merge; arrays/scalars replace).
function deepMerge(base, source) {
  if (Array.isArray(base) || source === null || typeof source !== 'object') {
    return source === undefined ? base : source
  }
  const out = { ...base }
  for (const key of Object.keys(source)) {
    const sv = source[key]
    if (sv && typeof sv === 'object' && !Array.isArray(sv) && base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
      out[key] = deepMerge(base[key], sv)
    } else if (sv !== undefined) {
      out[key] = sv
    }
  }
  return out
}

export const content = ref(clone(DEFAULTS))

export async function loadAll() {
  try {
    const { data, error } = await supabase.from('site_content').select('id, content')
    if (error) return content.value
    const next = clone(DEFAULTS)
    for (const row of data || []) {
      if (next[row.id] && row.content) next[row.id] = deepMerge(DEFAULTS[row.id], row.content)
    }
    content.value = next
  } catch { /* keep defaults */ }
  return content.value
}

export async function loadKey(key) {
  try {
    const { data } = await supabase.from('site_content').select('content').eq('id', key).single()
    if (data?.content) content.value = { ...content.value, [key]: deepMerge(DEFAULTS[key], data.content) }
  } catch { /* keep defaults */ }
  return content.value[key]
}

export async function saveContent(key, data) {
  content.value = { ...content.value, [key]: data }
  const { error } = await supabase
    .from('site_content')
    .upsert({ id: key, content: data, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (error) { console.error('saveContent:', error); return false }
  return true
}
