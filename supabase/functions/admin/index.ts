import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Admin control-center backend. One function, `{ action, payload }` dispatch.
// Service-role client bypasses RLS; the caller's JWT is verified to map to an
// is_admin profile before ANY action runs. Mirrors supabase/functions/admin-stats.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const DAY = 86400000;

// ── Pure helpers (kept in sync with src/lib/proDuration.js) ──────────────────
function durationToEndsAt(duration: string, now: Date, customEndsAt: string | null): string | null {
  if (!duration || duration === "permanent") return null;
  if (duration === "custom") return customEndsAt ? new Date(customEndsAt).toISOString() : null;
  const d = new Date(now.getTime());
  switch (duration) {
    case "1w": return new Date(now.getTime() + 7 * DAY).toISOString();
    case "1m": d.setMonth(d.getMonth() + 1); return d.toISOString();
    case "3m": d.setMonth(d.getMonth() + 3); return d.toISOString();
    case "1y": d.setFullYear(d.getFullYear() + 1); return d.toISOString();
    default: return null;
  }
}

function banDurationToGoString(duration: string): string {
  switch (duration) {
    case "none": return "none";
    case "1d": return "24h";
    case "1w": return "168h";
    case "1m": return "720h";
    default: return "876000h"; // permanent / unknown ≈ 100 years
  }
}

// Mirror value for user_profiles.banned_until (display/filter only).
function banMirrorUntil(duration: string, now: Date): string {
  switch (duration) {
    case "1d": return new Date(now.getTime() + DAY).toISOString();
    case "1w": return new Date(now.getTime() + 7 * DAY).toISOString();
    case "1m": return new Date(now.getTime() + 30 * DAY).toISOString();
    default: return "2999-01-01T00:00:00.000Z";
  }
}

const POSITIONS = [
  "Goalkeeper", "Center-Back", "Full-Back", "Wing-Back", "Defensive Midfielder",
  "Central Midfielder", "Attacking Midfielder", "Winger", "Striker", "Center-Forward",
];

const PROFILE_COLS = [
  "player_name", "position", "preferred_foot", "jersey_number", "height_cm", "weight_kg",
  "date_of_birth", "nationality", "club_team", "bio", "is_public", "enable_heatmap_tracking",
  "default_match_logger_view", "early_access", "accent_color", "secondary_color",
];

const MATCH_COLS = [
  "opponent", "match_date", "score_for", "score_against", "position_played", "assists",
  "tackles", "interceptions", "clearances", "dribbles", "successful_passes",
  "unsuccessful_passes", "fouls", "own_goals", "penalties_conceded",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return json({ error: "Service role not configured." }, 500);

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // ── Verify the caller is an admin ──────────────────────────────────────
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: { user }, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);
    const { data: me } = await admin.from("user_profiles").select("is_admin").eq("user_id", user.id).single();
    if (!me?.is_admin) return json({ error: "Forbidden" }, 403);

    const { action, payload = {} } = await req.json();
    const now = new Date();

    const logAction = async (a: string, targetUserId: string | null, targetId: string | null, detail: unknown) => {
      await admin.from("admin_audit_log").insert({
        admin_user_id: user.id, action: a, target_user_id: targetUserId,
        target_id: targetId != null ? String(targetId) : null, detail: detail || {},
      });
    };

    switch (action) {
      // ── Reads ────────────────────────────────────────────────────────────
      case "listUsers": {
        const { page = 0, pageSize = 25, search = "", filter = "all" } = payload;
        const from = page * pageSize, to = from + pageSize - 1;
        let q = admin.from("user_profiles").select(
          "user_id, player_name, club_team, position, subscription_tier, subscription_ends_at, is_admin, is_public, banned_until, early_access, created_at",
          { count: "exact" },
        );
        if (filter === "pro") q = q.eq("subscription_tier", "pro");
        else if (filter === "admin") q = q.eq("is_admin", true);
        else if (filter === "banned") q = q.not("banned_until", "is", null);

        // Email search needs the auth table: scan (capped) and constrain by id.
        if (search && search.includes("@")) {
          const ids: string[] = [];
          for (let pg = 1; pg <= 10; pg++) {
            const { data: lu } = await admin.auth.admin.listUsers({ page: pg, perPage: 1000 });
            const users = lu?.users || [];
            for (const u of users) if ((u.email || "").toLowerCase().includes(search.toLowerCase())) ids.push(u.id);
            if (users.length < 1000) break;
          }
          q = q.in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
        } else if (search) {
          q = q.or(`player_name.ilike.%${search}%,club_team.ilike.%${search}%`);
        }

        const { data: profiles, count } = await q.order("created_at", { ascending: false }).range(from, to);
        const rows = [];
        for (const p of profiles || []) {
          const { data: au } = await admin.auth.admin.getUserById(p.user_id);
          rows.push({
            ...p,
            email: au?.user?.email || null,
            last_sign_in_at: au?.user?.last_sign_in_at || null,
            banned: !!au?.user?.banned_until || !!p.banned_until,
          });
        }
        return json({ data: { rows, total: count || 0, page, pageSize } });
      }

      case "getUser": {
        const { id } = payload;
        const { data: profile } = await admin.from("user_profiles").select("*").eq("user_id", id).single();
        const { data: au } = await admin.auth.admin.getUserById(id);
        const countOf = async (t: string) => {
          const { count } = await admin.from(t).select("*", { count: "exact", head: true }).eq("user_id", id);
          return count || 0;
        };
        const [matches, practice, convos] = await Promise.all([
          countOf("matches"), countOf("practice_sessions"), countOf("ai_conversations"),
        ]);
        return json({
          data: {
            profile,
            auth: {
              email: au?.user?.email || null,
              last_sign_in_at: au?.user?.last_sign_in_at || null,
              banned_until: au?.user?.banned_until || null,
              created_at: au?.user?.created_at || null,
            },
            counts: { matches, practice, convos },
          },
        });
      }

      case "listMatches": {
        const { page = 0, pageSize = 25, userId = null, search = "", position = "all", onlyPosts = false } = payload;
        const from = page * pageSize, to = from + pageSize - 1;
        let q = admin.from("matches").select(
          "id, user_id, opponent, match_date, score_for, score_against, position_played, assists, created_at",
          { count: "exact" },
        );
        if (userId) q = q.eq("user_id", userId);
        if (position && position !== "all") q = q.eq("position_played", position);
        
        let matchedUserIds: string[] = [];
        if (search) {
          const { data: matchedProfs } = await admin.from("user_profiles").select("user_id").ilike("player_name", `%${search}%`);
          matchedUserIds = (matchedProfs || []).map((p: any) => p.user_id);
          if (matchedUserIds.length > 0) {
            q = q.or(`opponent.ilike.%${search}%,user_id.in.(${matchedUserIds.join(",")})`);
          } else {
            q = q.ilike("opponent", `%${search}%`);
          }
        }

        if (onlyPosts) {
          const { data: pub } = await admin.from("user_profiles").select("user_id").eq("is_public", true);
          const pubIds = (pub || []).map((p: any) => p.user_id);
          q = q.in("user_id", pubIds.length ? pubIds : ["00000000-0000-0000-0000-000000000000"]);
        }
        const { data: matches, count } = await q.order("match_date", { ascending: false }).range(from, to);
        const ids = [...new Set((matches || []).map((m: any) => m.user_id))];
        const { data: profs } = await admin.from("user_profiles").select("user_id, player_name, is_public")
          .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
        const pmap: Record<string, any> = {};
        (profs || []).forEach((p: any) => { pmap[p.user_id] = p; });
        const rows = (matches || []).map((m: any) => ({
          ...m,
          player_name: pmap[m.user_id]?.player_name || null,
          owner_public: !!pmap[m.user_id]?.is_public,
        }));
        return json({ data: { rows, total: count || 0, page, pageSize } });
      }

      case "getMatch": {
        const { id } = payload;
        const { data: match } = await admin.from("matches").select("*").eq("id", id).single();
        const [goals, shots, gk, heat] = await Promise.all([
          admin.from("goals").select("*").eq("match_id", id),
          admin.from("shots").select("*").eq("match_id", id),
          admin.from("goalkeeper_match_stats").select("*").eq("match_id", id),
          admin.from("match_heatmap_points").select("*").eq("match_id", id),
        ]);
        return json({
          data: {
            match,
            goals: goals.data || [],
            shots: shots.data || [],
            goalkeeper: gk.data?.[0] || null,
            heatmap: heat.data || [],
          },
        });
      }

      case "listPractice": {
        const { userId = null, page = 0, pageSize = 25, search = "", drillId = "all" } = payload;
        const from = page * pageSize, to = from + pageSize - 1;

        let sq = admin.from("practice_sessions").select(
          "id, user_id, drill_id, session_date, primary_value, secondary_value, notes, created_at",
          { count: "exact" },
        );
        if (userId) sq = sq.eq("user_id", userId);
        if (drillId && drillId !== "all") sq = sq.eq("drill_id", drillId);

        if (search) {
          const { data: matchedProfs } = await admin.from("user_profiles").select("user_id").ilike("player_name", `%${search}%`);
          const matchedUserIds = (matchedProfs || []).map((p: any) => p.user_id);
          if (matchedUserIds.length > 0) {
            sq = sq.or(`notes.ilike.%${search}%,user_id.in.(${matchedUserIds.join(",")})`);
          } else {
            sq = sq.ilike("notes", `%${search}%`);
          }
        }

        const { data: sessions, count } = await sq.order("session_date", { ascending: false }).range(from, to);

        // Fetch player names
        const userIds = [...new Set((sessions || []).map((s: any) => s.user_id))];
        const { data: profs } = await admin.from("user_profiles").select("user_id, player_name, is_public")
          .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
        const pmap: Record<string, any> = {};
        (profs || []).forEach((p: any) => { pmap[p.user_id] = p; });

        const sessionsWithPlayer = (sessions || []).map((s: any) => ({
          ...s,
          player_name: pmap[s.user_id]?.player_name || null,
          owner_public: !!pmap[s.user_id]?.is_public,
        }));

        // Fetch drills
        const drillIds = [...new Set((sessions || []).map((s: any) => s.drill_id))];
        let dq = admin.from("practice_drills").select("*");
        if (userId) {
          dq = dq.eq("user_id", userId);
        } else if (drillIds.length > 0) {
          dq = dq.in("id", drillIds);
        }
        const { data: drills } = await dq;

        return json({ data: { drills: drills || [], sessions: sessionsWithPlayer, total: count || 0, page, pageSize } });
      }

      case "getWaitlist": {
        const { data } = await admin.from("waitlist").select("*").order("created_at", { ascending: false });
        return json({ data: data || [] });
      }

      case "getAuditLog": {
        const { page = 0, pageSize = 50 } = payload;
        const from = page * pageSize, to = from + pageSize - 1;
        const { data, count } = await admin.from("admin_audit_log")
          .select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);
        return json({ data: { rows: data || [], total: count || 0, page, pageSize } });
      }

      // ── Mutations ──────────────────────────────────────────────────────────
      case "updateProfile": {
        const { id, patch = {} } = payload;
        const clean: Record<string, any> = {};
        for (const k of PROFILE_COLS) if (k in patch) clean[k] = patch[k];
        if ("position" in clean) {
          if (clean.position === "") clean.position = null;
          else if (clean.position && !POSITIONS.includes(clean.position)) return json({ error: "Invalid position" }, 400);
        }
        if (clean.preferred_foot === "") clean.preferred_foot = null;
        const { error } = await admin.from("user_profiles").update(clean).eq("user_id", id);
        if (error) return json({ error: error.message }, 400);
        await logAction("updateProfile", id, id, { keys: Object.keys(clean) });
        return json({ data: { ok: true } });
      }

      case "updateMatchStats": {
        const { id, patch = {} } = payload;
        const clean: Record<string, any> = {};
        for (const k of MATCH_COLS) if (k in patch) clean[k] = patch[k];
        const { data: m } = await admin.from("matches").select("user_id").eq("id", id).single();
        const { error } = await admin.from("matches").update(clean).eq("id", id);
        if (error) return json({ error: error.message }, 400);
        await logAction("updateMatchStats", m?.user_id || null, String(id), { keys: Object.keys(clean) });
        return json({ data: { ok: true } });
      }

      case "deleteMatch": {
        const { id, confirm } = payload;
        if (!confirm) return json({ error: "Confirmation required" }, 400);
        const { data: m } = await admin.from("matches").select("user_id").eq("id", id).single();
        await admin.from("goals").delete().eq("match_id", id);
        await admin.from("shots").delete().eq("match_id", id);
        await admin.from("goalkeeper_match_stats").delete().eq("match_id", id);
        await admin.from("match_heatmap_points").delete().eq("match_id", id);
        const { error } = await admin.from("matches").delete().eq("id", id);
        if (error) return json({ error: error.message }, 400);
        await logAction("deleteMatch", m?.user_id || null, String(id), {});
        return json({ data: { ok: true } });
      }

      case "setTier": {
        const { id, tier, duration = "permanent", customEndsAt = null } = payload;
        const goPro = tier === "pro";
        const patch: Record<string, any> = { subscription_tier: goPro ? "pro" : "free" };
        if (goPro) {
          patch.subscription_started_at = now.toISOString();
          patch.subscription_ends_at = durationToEndsAt(duration, now, customEndsAt);
        } else {
          patch.subscription_ends_at = now.toISOString();
        }
        const { error } = await admin.from("user_profiles").update(patch).eq("user_id", id);
        if (error) return json({ error: error.message }, 400);
        await logAction("setTier", id, id, { tier: patch.subscription_tier, duration, endsAt: patch.subscription_ends_at });
        return json({ data: { ok: true, endsAt: patch.subscription_ends_at } });
      }

      case "banUser": {
        const { id, duration = "permanent" } = payload;
        if (id === user.id) return json({ error: "You can't ban yourself." }, 400);
        const { error } = await admin.auth.admin.updateUserById(id, { ban_duration: banDurationToGoString(duration) });
        if (error) return json({ error: error.message }, 400);
        await admin.from("user_profiles").update({ banned_until: banMirrorUntil(duration, now) }).eq("user_id", id);
        await logAction("banUser", id, id, { duration });
        return json({ data: { ok: true } });
      }

      case "unbanUser": {
        const { id } = payload;
        const { error } = await admin.auth.admin.updateUserById(id, { ban_duration: "none" });
        if (error) return json({ error: error.message }, 400);
        await admin.from("user_profiles").update({ banned_until: null }).eq("user_id", id);
        await logAction("unbanUser", id, id, {});
        return json({ data: { ok: true } });
      }

      case "toggleAdmin": {
        const { id, value } = payload;
        if (id === user.id && !value) return json({ error: "You can't remove your own admin access." }, 400);
        if (!value) {
          const { count } = await admin.from("user_profiles").select("*", { count: "exact", head: true }).eq("is_admin", true);
          if ((count || 0) <= 1) return json({ error: "At least one admin must remain." }, 400);
        }
        const { error } = await admin.from("user_profiles").update({ is_admin: !!value }).eq("user_id", id);
        if (error) return json({ error: error.message }, 400);
        await logAction("toggleAdmin", id, id, { value: !!value });
        return json({ data: { ok: true } });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error: any) {
    console.error("admin error:", error);
    return json({ error: error.message || "Unknown error" }, 500);
  }
});
