import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Public read-only dashboard for a coach/scout share link. NO auth required —
// access is gated entirely by an unguessable share_token whose owner has
// share_enabled = true. Returns a snapshot mirroring Dashboard.vue#loadData.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return json({ error: "Service role not configured." }, 500);

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { token } = await req.json().catch(() => ({ token: null }));
    if (!token || typeof token !== "string") return json({ error: "Missing token" }, 400);

    // Look up the owner by token — only if sharing is currently enabled.
    const { data: profile } = await admin
      .from("user_profiles")
      .select("user_id, player_name, position, preferred_foot, club_team, avatar_url, share_enabled")
      .eq("share_token", token)
      .eq("share_enabled", true)
      .maybeSingle();

    if (!profile) return json({ error: "This share link is invalid or has been turned off." }, 404);

    const uid = profile.user_id;
    const { data: matchesData } = await admin
      .from("matches").select("*").eq("user_id", uid)
      .order("match_date", { ascending: false }).order("created_at", { ascending: false });

    const matches = matchesData || [];
    const matchIds = matches.map((m: any) => m.id);

    if (matchIds.length === 0) {
      return json({
        data: {
          profile: { player_name: profile.player_name, position: profile.position, preferred_foot: profile.preferred_foot, club_team: profile.club_team, avatar_url: profile.avatar_url },
          matches: [], shots: [], goals: [], heatmap: [],
        },
      });
    }

    const [goalsRes, shotsRes, heatRes] = await Promise.all([
      admin.from("goals").select("match_id, quadrant, field_position").in("match_id", matchIds),
      admin.from("shots").select("match_id, on_target, quadrant, field_position").in("match_id", matchIds),
      admin.from("match_heatmap_points").select("match_id, x_pct, y_pct, event_type, x2_pct, y2_pct").in("match_id", matchIds),
    ]);

    const goalsData = goalsRes.data || [];
    const shotsData = shotsRes.data || [];

    // Goalkeeper stats only for GK matches.
    const gkIds = matches.filter((m: any) => (m.position_played || "").toLowerCase().includes("goalkeeper")).map((m: any) => m.id);
    let gkByMatch: Record<string, any> = {};
    if (gkIds.length) {
      const { data: gkData } = await admin.from("goalkeeper_match_stats").select("*").in("match_id", gkIds);
      gkByMatch = (gkData || []).reduce((acc: any, s: any) => { acc[s.match_id] = s; return acc; }, {});
    }

    const statsByMatch = shotsData.reduce((acc: any, s: any) => {
      if (!acc[s.match_id]) acc[s.match_id] = { on: 0, off: 0 };
      if (s.on_target) acc[s.match_id].on++; else acc[s.match_id].off++;
      return acc;
    }, {});
    const goalsByMatch = goalsData.reduce((acc: any, g: any) => { acc[g.match_id] = (acc[g.match_id] || 0) + 1; return acc; }, {});

    const folded = matches.map((m: any) => ({
      ...m,
      my_goals: goalsByMatch[m.id] || 0,
      shots_on_target: statsByMatch[m.id]?.on || 0,
      shots_off_target: statsByMatch[m.id]?.off || 0,
      goalkeeper_stats: gkByMatch[m.id] || null,
    }));

    return json({
      data: {
        profile: { player_name: profile.player_name, position: profile.position, preferred_foot: profile.preferred_foot, club_team: profile.club_team, avatar_url: profile.avatar_url },
        matches: folded,
        shots: shotsData,
        goals: goalsData,
        heatmap: heatRes.data || [],
      },
    });
  } catch (error: any) {
    console.error("shared-dashboard error:", error);
    return json({ error: error.message || "Unknown error" }, 500);
  }
});
