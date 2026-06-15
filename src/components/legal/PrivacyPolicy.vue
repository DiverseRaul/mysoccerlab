<template>
  <StaticPage title="Privacy Policy" subtitle="Last updated June 2026">
    <p>My Soccer Lab ("we", "us") helps individual players log matches and track their performance. This policy explains what we collect and how we use it. We keep it short and plain.</p>

    <h2>What we collect</h2>
    <ul>
      <li><strong>Account details</strong> — your email and, if you sign in with Google, your Google account identifier.</li>
      <li><strong>Profile</strong> — the name, position, club, jersey number, and avatar you choose to add.</li>
      <li><strong>Match data</strong> — the matches, events, shots, and practice sessions you log.</li>
    </ul>

    <h2>How we use it</h2>
    <p>Your data is used to provide the app: to compute your ratings, heatmaps, and analytics, to power AI coaching, and to show your matches in the social feed when your profile is public or to people who follow you. We do not sell your data.</p>

    <h2>Who can see your data</h2>
    <p>By default your data is private to you. If you set your profile to public, or another player follows you, your matches and stats become visible to them in the feed. You can switch your profile back to private at any time from your Profile page.</p>

    <h2>AI coaching</h2>
    <p>When you use the AI Coach, your match history and the messages you send are processed by a third-party AI provider to generate a response. Don't share anything you wouldn't want processed that way.</p>

    <h2>Storage &amp; security</h2>
    <p>Data is stored with our hosting provider (Supabase) and protected by row-level security so other users can only read what you've made visible to them.</p>

    <h2>Your choices</h2>
    <p>You can edit or delete your profile and matches at any time, and you can delete your account from the Profile page, which removes your data. For any questions, contact us at <a href="mailto:support@mysoccerlab.app">support@mysoccerlab.app</a>.</p>
  </StaticPage>
</template>

<script setup>
import StaticPage from './StaticPage.vue'
</script>
