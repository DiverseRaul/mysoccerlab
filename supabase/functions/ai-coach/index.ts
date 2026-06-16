import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.24.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      messageParts,
      matchesData = [],
      practiceData = [],
      playerName = "Player",
      playerProfile = {},
      conversationHistory = [],
    } = await req.json();

    const apiKey = Deno.env.get("VITE_GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY secret is not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

    // --- Pre-compute ALL aggregates in code (don't trust the LLM with math) ---
    let totalGoals = 0, totalAssists = 0, totalChances = 0;
    let totalPasses = 0, totalSuccessfulPasses = 0;
    let totalDribbles = 0, totalTackles = 0, totalFouls = 0;
    let teamGoalsFor = 0, teamGoalsAgainst = 0;
    let wins = 0, draws = 0, losses = 0;
    let cleanSheets = 0;

    let matchHistoryLog = "No matches recorded yet.";

    if (matchesData && matchesData.length > 0) {
      matchHistoryLog = matchesData.map((match: any) => {
        totalGoals += match.my_goals || 0;
        totalAssists += match.assists || 0;
        totalChances += match.created_chances || 0;
        totalPasses += (match.successful_passes || 0) + (match.unsuccessful_passes || 0);
        totalSuccessfulPasses += match.successful_passes || 0;
        totalDribbles += match.dribbles || 0;
        totalTackles += match.tackles || 0;
        totalFouls += match.fouls || 0;
        teamGoalsFor += match.score_for || 0;
        teamGoalsAgainst += match.score_against || 0;
        if ((match.score_against || 0) === 0) cleanSheets++;
        if (match.score_for > match.score_against) wins++;
        else if (match.score_for < match.score_against) losses++;
        else draws++;

        const passTotal = (match.successful_passes || 0) + (match.unsuccessful_passes || 0);
        const passAcc = passTotal > 0 ? Math.round(((match.successful_passes || 0) / passTotal) * 100) : 0;
        const dateStr = match.match_date ? new Date(match.match_date).toLocaleDateString() : "Unknown Date";
        return `[${dateStr}] vs ${match.opponent} | ${match.score_for}-${match.score_against} | Goals: ${match.my_goals || 0} | Assists: ${match.assists || 0} | Chances: ${match.created_chances || 0} | Pass Acc: ${passAcc}% | Dribbles: ${match.dribbles || 0} | Tackles: ${match.tackles || 0} | Fouls: ${match.fouls || 0}`;
      }).join("\n");
    }

    // --- Practice / Training log (independent of matches) ---
    let practiceLog = "No practice drills tracked yet.";
    if (practiceData && practiceData.length > 0) {
      practiceLog = practiceData.map((d: any) => {
        const bits = [`${d.name} [${d.metricType}]`];
        if (d.latest) bits.push(`latest ${d.latest}${d.latestDate ? ` on ${d.latestDate}` : ""}`);
        if (d.best) bits.push(`PB ${d.best}`);
        if (d.target != null) bits.push(`target ${d.target}`);
        if (d.accuracy != null) bits.push(`accuracy ${d.accuracy}%`);
        bits.push(`${d.sessions} session${d.sessions === 1 ? "" : "s"}`);
        if (d.trend && d.trend !== "none") bits.push(`trend ${d.trend}`);
        return `- ${bits.join(" | ")}`;
      }).join("\n");
    }
    const totalDrills = practiceData.length;

    const avgPassAcc = totalPasses > 0 ? Math.round((totalSuccessfulPasses / totalPasses) * 100) : 0;
    const totalMatches = matchesData.length;
    const avgGoalsPerMatch = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2) : "0";
    const avgAssistsPerMatch = totalMatches > 0 ? (totalAssists / totalMatches).toFixed(2) : "0";
    const teamAvgGoalsFor = totalMatches > 0 ? (teamGoalsFor / totalMatches).toFixed(2) : "0";
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
    const position = playerProfile.position || "";

    const positionGuide: Record<string, string> = {
      "Winger": "Wingers are judged on dribbles, chances created, key passes, and 1v1 success rate.",
      "Striker": "Strikers are judged on goals per game, shots on target, and conversion rate.",
      "Central Midfielder": "CMs are judged on pass accuracy, chances created, and ball retention under pressure.",
      "Attacking Midfielder": "AMs are judged on chances created, assists, and goal threat.",
      "Defensive Midfielder": "DMs are judged on tackles, interceptions, and pass accuracy.",
      "Centre-Back": "CBs are judged on clearances, tackles, interceptions, and goals conceded.",
      "Full Back": "Full Backs balance tackles with attacking output (assists, chances).",
      "Goalkeeper": "Goalkeepers are judged on saves, clean sheets, and goals conceded.",
    };
    const positionContext = positionGuide[position] || (position ? `Position: ${position}.` : "");

    const systemPrompt = `You are Coach AI, a global football tactical coach for ${playerName}. You blend coaching philosophies from across the world — Spanish positional play, German gegenpressing, Italian tactical discipline, Brazilian flair, Dutch total football, English intensity. You pick the right idea for the right moment, not one rigid school.

## Player Profile
- Name: ${playerName}
- Position: ${position || "Not set"}
- Preferred Foot: ${playerProfile.preferredFoot || "Not set"}
- Club: ${playerProfile.clubTeam || "Not set"}
${positionContext ? `- Position Note: ${positionContext}` : ""}

## PRE-COMPUTED CAREER TOTALS (these numbers are authoritative — use these, do not recalculate)
- Total Matches: ${totalMatches}
- Record: ${wins}W / ${draws}D / ${losses}L (Win rate: ${winRate}%)
- Player Total Goals: ${totalGoals}
- Player Total Assists: ${totalAssists}
- Player Total Chances Created: ${totalChances}
- Player Total Dribbles: ${totalDribbles}
- Player Total Tackles: ${totalTackles}
- Player Total Fouls: ${totalFouls}
- Player Avg Goals/Match: ${avgGoalsPerMatch}
- Player Avg Assists/Match: ${avgAssistsPerMatch}
- Player Avg Pass Accuracy: ${avgPassAcc}%
- Team Total Goals Scored: ${teamGoalsFor}
- Team Total Goals Conceded: ${teamGoalsAgainst}
- Team Avg Goals Scored/Match: ${teamAvgGoalsFor}
- Team Clean Sheets: ${cleanSheets}

## Match History (Newest → Oldest, all ${totalMatches} matches)
${matchHistoryLog}

## Training / Practice Log (${totalDrills} drill${totalDrills === 1 ? "" : "s"} tracked)
${practiceLog}

## DATA FOCUS — adapt to what this player actually tracks
- This player has **${totalMatches} matches** and **${totalDrills} practice drills** logged.
- If they have matches but no practice: coach from the match data as usual.
- If they have practice but **no matches** (${totalMatches === 0 ? "THIS IS THE CASE" : "not the case"}): do NOT say "I have no data." Coach entirely from the Training/Practice Log above — talk about their drills, personal bests, accuracy, trends, and how to improve them and structure training. Never tell them to log a match to get value.
- If they have both: connect training to match performance (e.g. shooting-accuracy drills → finishing in games).

## CRITICAL RULES — read carefully

### Math & Numbers
- NEVER calculate totals or averages yourself. The "PRE-COMPUTED CAREER TOTALS" and the Training/Practice Log above have the numbers already. Read from them.
- For single-match or single-drill stats, read directly from the logs. Do not estimate.
- If a number isn't in the data, say "I don't have that stat logged" — do not invent.

### Response Length — BE BRIEF. Default to short.
- Keep almost every reply under ~120 words. Lead with the answer; cut all preamble and sign-offs.
- Quick factual question ("How many goals this season?") → 1 sentence. No headers, no bullets, no plan.
- Single match analysis ("Analyze my last game") → 3–4 short bullets max: what worked, what didn't, ONE fix. Nothing else.
- Trend question ("How am I doing this season?") → 2–3 sentences or 3 bullets on real patterns.
- Training plan → ONLY when the user explicitly asks for a plan/calendar/drills. Never volunteer one.
- Never repeat the question back, never explain what you're about to do — just do it.

### What NOT to do
- Do NOT invent "film room frames" or describe video footage unless the user actually uploaded an image or video in this message. If no media is attached, you have no footage to analyze.
- Do NOT add a training calendar to every response. Only when asked.
- Do NOT pad responses with persona-flavoured filler ("As a UEFA Pro analyst..."). Get to the point.
- Do NOT close every response with a tactical tip. Only when it genuinely fits.

### Style
- Direct, calm, knowledgeable. You're a coach, not a hype man.
- Use **bold** sparingly for the key stat or word in a point.
- Use bullets only when listing 3+ distinct items.
- Reference real numbers from the data above when making a point.

### Training plan format (only when asked)
When the user explicitly requests a training plan, output one day per line:
Monday – [Theme]
- Drill 1
- Drill 2
Tuesday – [Theme]
- Drill 1
(etc.)`;

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        {
          role: "model",
          parts: [{ text: `Understood. I have ${playerName}'s profile, ${totalMatches} matches, and ${totalDrills} practice drills loaded with all aggregates pre-computed. I'll coach from whichever data exists — training, matches, or both — keep responses sized to the question, and only include training plans when asked.` }],
        },
        ...conversationHistory,
      ],
      generationConfig: {
        maxOutputTokens: 1500,
        temperature: 0.4,
      },
    });

    const result = await chat.sendMessage(messageParts);
    const response = await result.response;
    const text = response.text();

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});