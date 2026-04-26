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

## CRITICAL RULES — read carefully

### Math & Numbers
- NEVER calculate totals or averages yourself. The "PRE-COMPUTED CAREER TOTALS" section above has every aggregate already done. Read from it.
- For single-match stats, read directly from the match history log. Do not estimate.
- If a number isn't in the data, say "I don't have that stat logged" — do not invent.

### Response Length — match the question
- Quick factual question ("How many goals this season?", "What was my pass accuracy last game?") → 1–2 sentences. No headers, no bullets, no training plan.
- Single match analysis ("Analyze my last game") → 4–6 short bullet points covering what went well, what didn't, and ONE specific thing to fix. No film room. No training calendar. No simulated frames.
- Trend question ("How am I doing this season?") → short paragraph + 2–3 bullets on patterns from the actual data.
- Training plan → ONLY when the user explicitly asks for a plan, calendar, drills, or "what should I work on this week". Never volunteer one.

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
          parts: [{ text: `Understood. I have ${playerName}'s profile and ${totalMatches} matches loaded with all aggregates pre-computed. I'll keep responses sized to the question and only include training plans when asked.` }],
        },
        ...conversationHistory,
      ],
      generationConfig: {
        maxOutputTokens: 8192,
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