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
  "default_match_logger_view", "early_access", "accent_color", "secondary_color", "is_test_account",
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

        // Source of truth is auth.users — EVERY account that can log in, even one
        // that never created a user_profiles row (rows are only written on profile
        // setup, so sourcing from user_profiles silently hides fresh sign-ups).
        // We enumerate all auth users, then left-join profile data. Fine for the
        // current user volume; revisit with server-side paging if this grows into
        // the tens of thousands.
        const authUsers: any[] = [];
        for (let pg = 1; pg <= 50; pg++) {
          const { data: lu, error } = await admin.auth.admin.listUsers({ page: pg, perPage: 1000 });
          if (error) return json({ error: error.message }, 400);
          const batch = lu?.users || [];
          authUsers.push(...batch);
          if (batch.length < 1000) break;
        }

        // Pull every profile once and key by user_id for the join.
        const { data: profiles } = await admin.from("user_profiles").select(
          "user_id, player_name, club_team, position, subscription_tier, subscription_ends_at, is_admin, is_public, banned_until, early_access, is_test_account, created_at",
        );
        const pmap: Record<string, any> = {};
        (profiles || []).forEach((p: any) => { pmap[p.user_id] = p; });

        // Merge into display rows. Profile fields fall back to sensible defaults so
        // a profile-less account still renders (Unnamed / free / no club) and is
        // flagged with has_profile:false for the UI.
        let rows = authUsers.map((u: any) => {
          const p = pmap[u.id] || {};
          return {
            user_id: u.id,
            email: u.email || null,
            last_sign_in_at: u.last_sign_in_at || null,
            created_at: u.created_at || p.created_at || null,
            player_name: p.player_name || null,
            club_team: p.club_team || null,
            position: p.position || null,
            subscription_tier: p.subscription_tier || "free",
            subscription_ends_at: p.subscription_ends_at || null,
            is_admin: !!p.is_admin,
            is_public: !!p.is_public,
            early_access: !!p.early_access,
            is_test_account: !!p.is_test_account,
            banned_until: p.banned_until || null,
            banned: !!u.banned_until || !!p.banned_until,
            has_profile: !!pmap[u.id],
          };
        });

        // Filters applied in-memory over the merged set.
        if (filter === "pro") rows = rows.filter((r) => r.subscription_tier === "pro");
        else if (filter === "admin") rows = rows.filter((r) => r.is_admin);
        else if (filter === "banned") rows = rows.filter((r) => r.banned);
        else if (filter === "no_profile") rows = rows.filter((r) => !r.has_profile);

        // Search across name, club, and email.
        if (search) {
          const s = search.toLowerCase();
          rows = rows.filter((r) =>
            (r.player_name || "").toLowerCase().includes(s) ||
            (r.club_team || "").toLowerCase().includes(s) ||
            (r.email || "").toLowerCase().includes(s)
          );
        }

        // Newest sign-ups first.
        rows.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

        const total = rows.length;
        const from = page * pageSize;
        const paged = rows.slice(from, from + pageSize);
        return json({ data: { rows: paged, total, page, pageSize } });
      }

      case "getUser": {
        const { id } = payload;
        // maybeSingle: a profile-less account (signed up, never set up a profile)
        // must still open in the detail view rather than 500-ing.
        const { data: profile } = await admin.from("user_profiles").select("*").eq("user_id", id).maybeSingle();
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
            // Stub a minimal profile so a profile-less account still opens in the
            // detail view (saving it upserts the real row — see updateProfile).
            profile: profile || { user_id: id, subscription_tier: "free", is_admin: false },
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
        const { page = 0, pageSize = 25, userId = null, search = "", position = "all", onlyPosts = false, includeTest = false } = payload;
        const from = page * pageSize, to = from + pageSize - 1;
        let q = admin.from("matches").select(
          "id, user_id, opponent, match_date, score_for, score_against, position_played, assists, created_at",
          { count: "exact" },
        );
        if (userId) q = q.eq("user_id", userId);
        if (position && position !== "all") q = q.eq("position_played", position);

        // Hide flagged test/seed accounts (e.g. "Admin 1") from the global browse
        // list by default — they swamp the real player data. The toggle
        // (includeTest) brings them back, and a user-scoped view (userId) always
        // shows everything for that one account. Real admins are NOT test accounts,
        // so their data shows normally.
        if (!includeTest && !userId) {
          const { data: tests } = await admin.from("user_profiles").select("user_id").eq("is_test_account", true);
          const testIds = (tests || []).map((a: any) => a.user_id);
          if (testIds.length) q = q.not("user_id", "in", `(${testIds.join(",")})`);
        }

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

      case "listDrills": {
        // Drills-first view for the Training admin: one row per drill with its
        // owner, how many sessions it has, and when it was last logged. Clicking
        // a drill then loads its sessions via listPractice({ drillId }).
        const { page = 0, pageSize = 25, search = "", includeTest = false } = payload;
        const from = page * pageSize, to = from + pageSize - 1;

        let dq = admin.from("practice_drills").select(
          "id, user_id, name, metric_type, unit, lower_is_better, target_value, archived, created_at",
          { count: "exact" },
        );

        if (!includeTest) {
          const { data: tests } = await admin.from("user_profiles").select("user_id").eq("is_test_account", true);
          const testIds = (tests || []).map((a: any) => a.user_id);
          if (testIds.length) dq = dq.not("user_id", "in", `(${testIds.join(",")})`);
        }

        // Search matches either the drill name or the owner's player name.
        if (search) {
          const { data: matchedProfs } = await admin.from("user_profiles").select("user_id").ilike("player_name", `%${search}%`);
          const matchedUserIds = (matchedProfs || []).map((p: any) => p.user_id);
          if (matchedUserIds.length > 0) {
            dq = dq.or(`name.ilike.%${search}%,user_id.in.(${matchedUserIds.join(",")})`);
          } else {
            dq = dq.ilike("name", `%${search}%`);
          }
        }

        const { data: drills, count } = await dq.order("created_at", { ascending: false }).range(from, to);

        // Session count + last-session date per drill (one read, folded in memory).
        const drillIds = (drills || []).map((d: any) => d.id);
        const sessCount: Record<string, number> = {};
        const lastDate: Record<string, string> = {};
        if (drillIds.length) {
          const { data: sess } = await admin.from("practice_sessions").select("drill_id, session_date").in("drill_id", drillIds);
          for (const s of sess || []) {
            sessCount[s.drill_id] = (sessCount[s.drill_id] || 0) + 1;
            if (!lastDate[s.drill_id] || s.session_date > lastDate[s.drill_id]) lastDate[s.drill_id] = s.session_date;
          }
        }

        // Owner names.
        const ownerIds = [...new Set((drills || []).map((d: any) => d.user_id))];
        const { data: profs } = await admin.from("user_profiles").select("user_id, player_name, is_public")
          .in("user_id", ownerIds.length ? ownerIds : ["00000000-0000-0000-0000-000000000000"]);
        const pmap: Record<string, any> = {};
        (profs || []).forEach((p: any) => { pmap[p.user_id] = p; });

        const rows = (drills || []).map((d: any) => ({
          ...d,
          player_name: pmap[d.user_id]?.player_name || null,
          owner_public: !!pmap[d.user_id]?.is_public,
          session_count: sessCount[d.id] || 0,
          last_session_date: lastDate[d.id] || null,
        }));
        return json({ data: { rows, total: count || 0, page, pageSize } });
      }

      case "listPractice": {
        const { userId = null, page = 0, pageSize = 25, search = "", drillId = "all", includeTest = false } = payload;
        const from = page * pageSize, to = from + pageSize - 1;

        let sq = admin.from("practice_sessions").select(
          "id, user_id, drill_id, session_date, primary_value, secondary_value, notes, created_at",
          { count: "exact" },
        );
        if (userId) sq = sq.eq("user_id", userId);
        if (drillId && drillId !== "all") sq = sq.eq("drill_id", drillId);

        // Same as listMatches: drop flagged test/seed sessions from the global
        // list unless explicitly included or scoped to one user's detail view.
        if (!includeTest && !userId) {
          const { data: tests } = await admin.from("user_profiles").select("user_id").eq("is_test_account", true);
          const testIds = (tests || []).map((a: any) => a.user_id);
          if (testIds.length) sq = sq.not("user_id", "in", `(${testIds.join(",")})`);
        }

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
        const list = data || [];

        // Enrich each sign-up with the player's name and whether they've since
        // become Pro (so the admin can see who's still actually waiting).
        const ids = [...new Set(list.map((r: any) => r.user_id).filter(Boolean))];
        const pmap: Record<string, any> = {};
        if (ids.length) {
          const { data: profs } = await admin.from("user_profiles")
            .select("user_id, player_name, subscription_tier").in("user_id", ids);
          (profs || []).forEach((p: any) => { pmap[p.user_id] = p; });
        }

        // Collapse duplicate sign-ups (same user clicked "Notify me" more than
        // once) to the earliest entry so the list is one row per person.
        const seen = new Set<string>();
        const rows = list
          .slice()
          .reverse() // oldest first so the kept row is the earliest sign-up
          .filter((r: any) => {
            const key = r.user_id || r.email;
            if (!key) return true;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .reverse()
          .map((r: any) => ({
            ...r,
            player_name: pmap[r.user_id]?.player_name || null,
            is_pro: pmap[r.user_id]?.subscription_tier === "pro",
          }));
        return json({ data: rows });
      }

      case "deleteWaitlist": {
        const { id } = payload;
        const { error } = await admin.from("waitlist").delete().eq("id", id);
        if (error) return json({ error: error.message }, 400);
        await logAction("deleteWaitlist", null, String(id), {});
        return json({ data: { ok: true } });
      }

      case "getAuditLog": {
        const { page = 0, pageSize = 50 } = payload;
        const from = page * pageSize, to = from + pageSize - 1;
        const { data, count } = await admin.from("admin_audit_log")
          .select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);
        const logRows = data || [];

        // Resolve both the acting admin and the target to display names so the log
        // is readable ("Alex banned Jordan") instead of bare UUIDs. Name first,
        // email as fallback, truncated id as last resort.
        const ids = [...new Set(logRows.flatMap((r: any) => [r.admin_user_id, r.target_user_id]).filter(Boolean))];
        const nameById: Record<string, string> = {};
        if (ids.length) {
          const { data: profs } = await admin.from("user_profiles").select("user_id, player_name").in("user_id", ids);
          (profs || []).forEach((p: any) => { if (p.player_name) nameById[p.user_id] = p.player_name; });
          for (const id of ids) {
            if (!nameById[id]) {
              const { data: au } = await admin.auth.admin.getUserById(id);
              nameById[id] = au?.user?.email || (String(id).slice(0, 8) + "…");
            }
          }
        }
        const rows = logRows.map((r: any) => ({
          ...r,
          admin_name: r.admin_user_id ? (nameById[r.admin_user_id] || null) : null,
          target_name: r.target_user_id ? (nameById[r.target_user_id] || null) : null,
        }));
        return json({ data: { rows, total: count || 0, page, pageSize } });
      }

      // ── Mutations ──────────────────────────────────────────────────────────
      case "updateProfile": {
        const { id, patch = {} } = payload;
        const clean: Record<string, any> = {};
        for (const k of PROFILE_COLS) if (k in patch) clean[k] = patch[k];
        // Cleared fields arrive as "" from the form. Postgres rejects "" for date
        // and enum/CHECK columns (date_of_birth, position, preferred_foot, …), and
        // null is the real "unset" everywhere here — so coerce every "" to null.
        for (const k of Object.keys(clean)) if (clean[k] === "") clean[k] = null;
        if (clean.position && !POSITIONS.includes(clean.position)) return json({ error: "Invalid position" }, 400);
        // Snapshot the prior values of the columns we're about to change so the
        // audit log can show before→after, not just which keys changed.
        const changedKeys = Object.keys(clean);
        let prevP: Record<string, any> = {};
        if (changedKeys.length) {
          const { data } = await admin.from("user_profiles").select(changedKeys.join(",")).eq("user_id", id).maybeSingle();
          prevP = data || {};
        }
        // upsert (not update) so editing a profile-less account creates its row
        // rather than silently no-op'ing. onConflict merges onto the existing row.
        const { error } = await admin.from("user_profiles").upsert({ user_id: id, ...clean }, { onConflict: "user_id" });
        if (error) return json({ error: error.message }, 400);
        const profChanges: Record<string, any> = {};
        for (const k of changedKeys) if (prevP[k] !== clean[k]) profChanges[k] = { from: prevP[k] ?? null, to: clean[k] ?? null };
        await logAction("updateProfile", id, id, { changes: profChanges });
        return json({ data: { ok: true } });
      }

      case "updateMatchStats": {
        const { id, patch = {} } = payload;
        const clean: Record<string, any> = {};
        for (const k of MATCH_COLS) if (k in patch) clean[k] = patch[k];
        const changedKeys = Object.keys(clean);
        // Fetch owner + prior values of the changed columns in one read.
        const { data: m } = await admin.from("matches").select(["user_id", ...changedKeys].join(",")).eq("id", id).single();
        const { error } = await admin.from("matches").update(clean).eq("id", id);
        if (error) return json({ error: error.message }, 400);
        const matchChanges: Record<string, any> = {};
        for (const k of changedKeys) if (m && m[k] !== clean[k]) matchChanges[k] = { from: m[k] ?? null, to: clean[k] ?? null };
        await logAction("updateMatchStats", m?.user_id || null, String(id), { changes: matchChanges });
        return json({ data: { ok: true } });
      }

      case "updateGoal": {
        const { id, patch = {} } = payload;
        const clean: Record<string, any> = {};
        for (const k of ["goal_type", "quadrant"]) if (k in patch) clean[k] = patch[k] === "" ? null : patch[k];
        const { data: g } = await admin.from("goals").select("user_id, match_id").eq("id", id).maybeSingle();
        const { error } = await admin.from("goals").update(clean).eq("id", id);
        if (error) return json({ error: error.message }, 400);
        await logAction("updateGoal", g?.user_id || null, String(id), { match_id: g?.match_id ?? null, changes: clean });
        return json({ data: { ok: true } });
      }

      case "deleteGoal": {
        const { id } = payload;
        const { data: g } = await admin.from("goals").select("user_id, match_id").eq("id", id).maybeSingle();
        const { error } = await admin.from("goals").delete().eq("id", id);
        if (error) return json({ error: error.message }, 400);
        await logAction("deleteGoal", g?.user_id || null, String(id), { match_id: g?.match_id ?? null });
        return json({ data: { ok: true } });
      }

      case "updateShot": {
        const { id, patch = {} } = payload;
        const clean: Record<string, any> = {};
        for (const k of ["on_target", "quadrant"]) if (k in patch) clean[k] = patch[k] === "" ? null : patch[k];
        const { data: s } = await admin.from("shots").select("user_id, match_id").eq("id", id).maybeSingle();
        const { error } = await admin.from("shots").update(clean).eq("id", id);
        if (error) return json({ error: error.message }, 400);
        await logAction("updateShot", s?.user_id || null, String(id), { match_id: s?.match_id ?? null, changes: clean });
        return json({ data: { ok: true } });
      }

      case "deleteShot": {
        const { id } = payload;
        const { data: s } = await admin.from("shots").select("user_id, match_id").eq("id", id).maybeSingle();
        const { error } = await admin.from("shots").delete().eq("id", id);
        if (error) return json({ error: error.message }, 400);
        await logAction("deleteShot", s?.user_id || null, String(id), { match_id: s?.match_id ?? null });
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

      case "deleteSession": {
        const { id } = payload;
        const { data: s } = await admin.from("practice_sessions").select("user_id, drill_id").eq("id", id).maybeSingle();
        const { error } = await admin.from("practice_sessions").delete().eq("id", id);
        if (error) return json({ error: error.message }, 400);
        await logAction("deleteSession", s?.user_id || null, String(id), { drill_id: s?.drill_id ?? null });
        return json({ data: { ok: true } });
      }

      case "deleteDrill": {
        const { id, confirm } = payload;
        if (!confirm) return json({ error: "Confirmation required" }, 400);
        const { data: d } = await admin.from("practice_drills").select("user_id, name").eq("id", id).maybeSingle();
        // practice_sessions has ON DELETE CASCADE on drill_id, so its rows go too.
        const { error } = await admin.from("practice_drills").delete().eq("id", id);
        if (error) return json({ error: error.message }, 400);
        await logAction("deleteDrill", d?.user_id || null, String(id), { name: d?.name ?? null });
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
