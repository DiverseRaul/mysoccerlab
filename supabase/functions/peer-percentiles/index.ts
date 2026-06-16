import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Peer percentiles (Pro). Verifies the caller is signed in AND an active Pro,
// then computes their percentile vs all players of the SAME position for a few
// per-match metrics. Service role bypasses RLS to read the cohort's matches.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// kept in sync with src/lib/proDuration.js
function isProActive(tier: string, endsAt: string | null): boolean {
  if (tier !== "pro") return false;
  if (!endsAt) return true;
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(end)) return true;
  return end > Date.now();
}

// kept in sync with src/lib/percentiles.js
function percentileRank(values: number[], value: number): number | null {
  const arr = values.filter((v) => Number.isFinite(v));
  if (!arr.length || !Number.isFinite(value)) return null;
  const countLE = arr.filter((v) => v <= value).length;
  return Math.round((countLE / arr.length) * 100);
}

function metricsFor(rows: any[], goals: number) {
  const games = rows.length;
  if (!games) return null;
  const sum = (k: string) => rows.reduce((s, m) => s + (Number(m[k]) || 0), 0);
  const passOk = sum("successful_passes");
  const passTotal = passOk + sum("unsuccessful_passes");
  return {
    passAccuracy: passTotal ? (passOk / passTotal) * 100 : 0,
    goalsPerMatch: goals / games,
    assistsPerMatch: sum("assists") / games,
    defActionsPerMatch: (sum("tackles") + sum("interceptions") + sum("clearances")) / games,
  };
}

const METRICS = [
  { key: "passAccuracy", label: "Pass accuracy", unit: "%", digits: 1 },
  { key: "goalsPerMatch", label: "Goals / match", unit: "", digits: 2 },
  { key: "assistsPerMatch", label: "Assists / match", unit: "", digits: 2 },
  { key: "defActionsPerMatch", label: "Defensive actions / match", unit: "", digits: 1 },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return json({ error: "Service role not configured." }, 500);

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: { user }, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const { data: me } = await admin
      .from("user_profiles")
      .select("position, subscription_tier, subscription_ends_at")
      .eq("user_id", user.id)
      .single();

    if (!isProActive(me?.subscription_tier, me?.subscription_ends_at)) {
      return json({ error: "Pro required" }, 403);
    }
    if (!me?.position) return json({ data: { position: null, cohortSize: 0, metrics: [] } });

    // Cohort = everyone with the same position.
    const { data: peers } = await admin
      .from("user_profiles").select("user_id").eq("position", me.position);
    const ids = (peers || []).map((p: any) => p.user_id);
    if (!ids.length) return json({ data: { position: me.position, cohortSize: 0, metrics: [] } });

    const [matchesRes, goalsRes] = await Promise.all([
      admin.from("matches")
        .select("user_id, successful_passes, unsuccessful_passes, assists, tackles, interceptions, clearances")
        .in("user_id", ids),
      admin.from("goals").select("user_id").in("user_id", ids),
    ]);

    const byUser: Record<string, any[]> = {};
    for (const m of matchesRes.data || []) (byUser[m.user_id] ||= []).push(m);
    const goalsByUser: Record<string, number> = {};
    for (const g of goalsRes.data || []) goalsByUser[g.user_id] = (goalsByUser[g.user_id] || 0) + 1;

    // Per-user metrics for everyone who has at least one match.
    const cohort: Record<string, number[]> = { passAccuracy: [], goalsPerMatch: [], assistsPerMatch: [], defActionsPerMatch: [] };
    for (const uid of Object.keys(byUser)) {
      const mm = metricsFor(byUser[uid], goalsByUser[uid] || 0);
      if (!mm) continue;
      for (const k of Object.keys(cohort)) cohort[k].push((mm as any)[k]);
    }

    const mine = metricsFor(byUser[user.id] || [], goalsByUser[user.id] || 0);
    const cohortSize = cohort.passAccuracy.length;

    const metrics = METRICS.map((def) => ({
      ...def,
      value: mine ? (mine as any)[def.key] : null,
      percentile: mine ? percentileRank(cohort[def.key], (mine as any)[def.key]) : null,
    }));

    return json({ data: { position: me.position, cohortSize, hasData: !!mine, metrics } });
  } catch (error: any) {
    console.error("peer-percentiles error:", error);
    return json({ error: error.message || "Unknown error" }, 500);
  }
});
