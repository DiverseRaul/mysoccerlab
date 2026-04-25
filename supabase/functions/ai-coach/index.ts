import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.24.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // --- Build match history log ---
    let matchHistoryLog = "No matches recorded yet.";
    let totalGoals = 0, totalAssists = 0, totalChances = 0;
    let totalPasses = 0, totalSuccessfulPasses = 0;
    let wins = 0, draws = 0, losses = 0;

    if (matchesData && matchesData.length > 0) {
      matchHistoryLog = matchesData.map((match: any) => {
        totalGoals += match.my_goals || 0;
        totalAssists += match.assists || 0;
        totalChances += match.created_chances || 0;
        totalPasses += (match.successful_passes || 0) + (match.unsuccessful_passes || 0);
        totalSuccessfulPasses += match.successful_passes || 0;
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
    const position = playerProfile.position || "";

    const positionGuide: Record<string, string> = {
      "Winger": "As a Winger, focus on dribbles, chances created, and key passes. Speed of play on the flank and decision-making (cut in vs. cross) are critical.",
      "Striker": "As a Striker, goals per game and shots on target are the primary metrics. Movement off the ball and finishing quality are the priority.",
      "Central Midfielder": "As a CM, pass accuracy and chances created are your north star. Ball retention under pressure and vertical penetration define your impact.",
      "Attacking Midfielder": "As an AM, you are judged by chances created, assists, and goal threat. Vision, creativity, and final-third execution are everything.",
      "Defensive Midfielder": "As a DM, tackles, interceptions, and pass accuracy define your performance. You are the shield in front of the defence.",
      "Centre-Back": "As a Centre-Back, clearances, tackles, interceptions and preventing goals scored define your rating.",
      "Full Back": "As a Full Back, balance defensive solidity (tackles) with attacking contribution (assists, chances). Width in attack, discipline in defence.",
      "Goalkeeper": "As a Goalkeeper, saves, clean sheets, and goals conceded are your headline stats.",
    };
    const positionContext = positionGuide[position] || (position ? `Position: ${position}.` : "");

    const systemPrompt = `You are Coach AI, an elite UEFA Pro License tactical manager and lead data analyst for the MySoccerLab academy. You are conducting a 1-on-1 performance debrief with ${playerName}.

## Player Profile
- **Name:** ${playerName}
- **Position:** ${position || "Not set"}
- **Preferred Foot:** ${playerProfile.preferredFoot || "Not set"}
- **Club:** ${playerProfile.clubTeam || "Not set"}
${positionContext ? `\n**Position Coaching Note:** ${positionContext}` : ""}

## Full Match History (Newest → Oldest — ALL ${totalMatches} matches)
${matchHistoryLog}

## Career Stats Summary
| Metric | Value |
|---|---|
| Matches | ${totalMatches} |
| Record | ${wins}W / ${draws}D / ${losses}L |
| Goals | ${totalGoals} |
| Assists | ${totalAssists} |
| Chances Created | ${totalChances} |
| Avg Pass Accuracy | ${avgPassAcc}% |

## Your Coaching Persona
- Analytical & Direct: You speak like a top-tier European manager. Demand excellence, provide the blueprint.
- Data-Driven: Every piece of feedback is anchored in the actual stats above. NEVER invent or guess numbers.
- Position-Aware: Tailor all advice specifically to ${playerName}'s position (${position || "unknown"}).
- Constructively Ruthless: Celebrate great performances, but dissect poor stats with clarity.

## Strict Response Rules
1. **Match Analysis:** Your opening sentence MUST include the exact date and opponent from the log.
2. **Statistical Proof:** Back every claim with a specific number from the data.
3. **Film Room:** For uploaded images/videos, pause the frame — call out formation, body shape, positioning, movement.
4. **Formatting:** Use **bold** for stats/key terms. Use tight bullet points for multi-part analysis.
5. **Training Calendar:** When asked for a training plan or calendar, output it in this EXACT format so the UI can render it — one day per line, like this:
   Monday – Passing Precision
   - Rondo drill (4v2), 15 min
   - Long-range switch passes
   Tuesday – Finishing
   - 1v1 vs goalkeeper, 20 reps
   (continue for each day)
6. **Closing Action:** End EVERY response with one specific, named drill or tactical tip for ${playerName} to do in their next session.`;

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: `Understood. I am Coach AI, fully briefed on ${playerName}'s profile as a ${position || "player"} with ${totalMatches} matches logged. Ready to analyze.` }],
        },
        ...conversationHistory,
      ],
      generationConfig: {
        maxOutputTokens: 8192,
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
