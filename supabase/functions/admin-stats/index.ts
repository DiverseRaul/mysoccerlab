import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    if (!supabaseUrl || !serviceKey) {
      return json({ error: "Service role not configured." }, 500);
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // ── Verify the caller is an admin ──────────────────────────────────────
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const { data: profile } = await admin
      .from("user_profiles").select("is_admin").eq("user_id", user.id).single();
    if (!profile?.is_admin) return json({ error: "Forbidden" }, 403);

    // ── Counts ─────────────────────────────────────────────────────────────
    const now = Date.now();
    const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
    const d1 = iso(1 * 864e5);
    const d7 = iso(7 * 864e5);
    const d30 = iso(30 * 864e5);

    // Test/seed accounts (e.g. "Admin 1") are excluded from every metric so the
    // numbers reflect real players. We filter user_profiles by the flag directly
    // and owned tables (matches, goals, …) by the test owners' user_ids.
    const { data: testRows } = await admin.from("user_profiles").select("user_id").eq("is_test_account", true);
    const testIds = (testRows || []).map((r: any) => r.user_id);
    const excludeTestOwned = (q: any) => (testIds.length ? q.not("user_id", "in", `(${testIds.join(",")})`) : q);

    // Count of a table owned by users (excludes test owners by user_id).
    const countOwned = async (table: string, build?: (q: any) => any) => {
      let q = excludeTestOwned(admin.from(table).select("*", { count: "exact", head: true }));
      if (build) q = build(q);
      const { count } = await q;
      return count || 0;
    };
    // Count of user_profiles (excludes test accounts by the flag).
    const countUsers = async (build?: (q: any) => any) => {
      let q = admin.from("user_profiles").select("*", { count: "exact", head: true }).eq("is_test_account", false);
      if (build) q = build(q);
      const { count } = await q;
      return count || 0;
    };
    // Plain count (no owner concept), e.g. waitlist.
    const countAll = async (table: string, build?: (q: any) => any) => {
      let q = admin.from(table).select("*", { count: "exact", head: true });
      if (build) q = build(q);
      const { count } = await q;
      return count || 0;
    };

    const [
      totalUsers, newUsersToday, newUsers7, newUsers30,
      proUsers, publicUsers, adminUsers,
      totalMatches, matches7, matches30,
      totalGoals, totalShots,
      totalDrills, totalSessions, sessions7,
      aiConversations, aiMessages,
      relationships, waitlist,
    ] = await Promise.all([
      countUsers(),
      countUsers((q) => q.gte("created_at", d1)),
      countUsers((q) => q.gte("created_at", d7)),
      countUsers((q) => q.gte("created_at", d30)),
      countUsers((q) => q.eq("subscription_tier", "pro")),
      countUsers((q) => q.eq("is_public", true)),
      countUsers((q) => q.eq("is_admin", true)),
      countOwned("matches"),
      countOwned("matches", (q) => q.gte("created_at", d7)),
      countOwned("matches", (q) => q.gte("created_at", d30)),
      countOwned("goals"),
      countOwned("shots"),
      countOwned("practice_drills"),
      countOwned("practice_sessions"),
      countOwned("practice_sessions", (q) => q.gte("created_at", d7)),
      countOwned("ai_conversations"),
      countOwned("ai_chat_messages"),
      countAll("user_relationships"),
      countAll("waitlist"),
    ]);

    const freeUsers = Math.max(0, totalUsers - proUsers);
    const conversionPct = totalUsers ? Math.round((proUsers / totalUsers) * 1000) / 10 : 0;
    const avgMatchesPerUser = totalUsers ? Math.round((totalMatches / totalUsers) * 10) / 10 : 0;

    // ── 14-day signup series (excludes test accounts) ──────────────────────
    const since = iso(14 * 864e5);
    const { data: recent } = await admin
      .from("user_profiles").select("created_at").eq("is_test_account", false).gte("created_at", since);
    const series: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = new Date(now - i * 864e5).toISOString().slice(0, 10);
      series.push({ date: day, count: 0 });
    }
    const idx: Record<string, number> = {};
    series.forEach((s, i) => { idx[s.date] = i; });
    (recent || []).forEach((r: any) => {
      const day = (r.created_at || "").slice(0, 10);
      if (day in idx) series[idx[day]].count++;
    });

    return json({
      totals: {
        totalUsers, newUsersToday, newUsers7, newUsers30,
        proUsers, freeUsers, conversionPct, publicUsers, adminUsers,
        totalMatches, matches7, matches30, avgMatchesPerUser,
        totalGoals, totalShots,
        totalDrills, totalSessions, sessions7,
        aiConversations, aiMessages,
        relationships, waitlist,
      },
      signupSeries: series,
    });
  } catch (error: any) {
    console.error("admin-stats error:", error);
    return json({ error: error.message || "Unknown error" }, 500);
  }
});
