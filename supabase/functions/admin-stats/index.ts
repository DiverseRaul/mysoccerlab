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
    const d7 = iso(7 * 864e5);
    const d30 = iso(30 * 864e5);

    const countOf = async (table: string, build?: (q: any) => any) => {
      let q = admin.from(table).select("*", { count: "exact", head: true });
      if (build) q = build(q);
      const { count } = await q;
      return count || 0;
    };

    const [
      totalUsers, newUsers7, newUsers30,
      totalMatches, matches7, matches30,
      totalGoals, aiConversations, aiMessages,
      relationships, proUsers, waitlist,
    ] = await Promise.all([
      countOf("user_profiles"),
      countOf("user_profiles", (q) => q.gte("created_at", d7)),
      countOf("user_profiles", (q) => q.gte("created_at", d30)),
      countOf("matches"),
      countOf("matches", (q) => q.gte("created_at", d7)),
      countOf("matches", (q) => q.gte("created_at", d30)),
      countOf("goals"),
      countOf("ai_conversations"),
      countOf("ai_chat_messages"),
      countOf("user_relationships"),
      countOf("user_profiles", (q) => q.eq("subscription_tier", "pro")),
      countOf("waitlist"),
    ]);

    // ── 14-day signup series ───────────────────────────────────────────────
    const since = iso(14 * 864e5);
    const { data: recent } = await admin
      .from("user_profiles").select("created_at").gte("created_at", since);
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
        totalUsers, newUsers7, newUsers30,
        totalMatches, matches7, matches30,
        totalGoals, aiConversations, aiMessages,
        relationships, proUsers, waitlist,
      },
      signupSeries: series,
    });
  } catch (error: any) {
    console.error("admin-stats error:", error);
    return json({ error: error.message || "Unknown error" }, 500);
  }
});
