import { GoogleGenerativeAI } from "@google/generative-ai";

const ApiKey = import.meta.env.VITE_GEMINI_API_KEY;

let GenAi = null;

if (ApiKey) {
  GenAi = new GoogleGenerativeAI(ApiKey);
}

export const fileToGenerativePart = (Base64Data, MimeType) => {
  return {
    inlineData: {
      data: Base64Data.split(',')[1],
      mimeType: MimeType
    },
  };
};

export const generateCoachResponse = async (
  MessageParts,
  MatchesData = [],
  PlayerName = 'Player',
  PlayerProfile = {},
  ConversationHistory = []
) => {
  if (!GenAi) {
    return "Error: Gemini API Key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.";
  }

  try {
    const Model = GenAi.getGenerativeModel({ model: "gemini-flash-latest" });

    let MatchHistoryLog = "No matches recorded yet.";
    let TotalGoals = 0;
    let TotalAssists = 0;
    let TotalChances = 0;
    let TotalPasses = 0;
    let TotalSuccessfulPasses = 0;
    let Wins = 0, Draws = 0, Losses = 0;

    // Send ALL matches, not just 10
    if (MatchesData && MatchesData.length > 0) {
      MatchHistoryLog = MatchesData.map((Match) => {
        TotalGoals += (Match.my_goals || 0);
        TotalAssists += (Match.assists || 0);
        TotalChances += (Match.created_chances || 0);
        TotalPasses += (Match.successful_passes || 0) + (Match.unsuccessful_passes || 0);
        TotalSuccessfulPasses += (Match.successful_passes || 0);
        if (Match.score_for > Match.score_against) Wins++;
        else if (Match.score_for < Match.score_against) Losses++;
        else Draws++;

        const PassTotal = (Match.successful_passes || 0) + (Match.unsuccessful_passes || 0);
        const PassAcc = PassTotal > 0 ? Math.round(((Match.successful_passes || 0) / PassTotal) * 100) : 0;
        const DateStr = Match.match_date ? new Date(Match.match_date).toLocaleDateString() : 'Unknown Date';
        return `[${DateStr}] vs ${Match.opponent} | ${Match.score_for}-${Match.score_against} | Goals: ${Match.my_goals || 0} | Assists: ${Match.assists || 0} | Chances: ${Match.created_chances || 0} | Pass Acc: ${PassAcc}% | Dribbles: ${Match.dribbles || 0} | Tackles: ${Match.tackles || 0} | Fouls: ${Match.fouls || 0}`;
      }).join('\n');
    }

    const AvgPassAcc = TotalPasses > 0 ? Math.round((TotalSuccessfulPasses / TotalPasses) * 100) : 0;
    const TotalMatches = MatchesData.length;

    // Position-specific coaching notes
    const Position = PlayerProfile.position || '';
    let PositionContext = '';
    if (Position) {
      const PositionGuide = {
        'Winger': 'As a Winger, focus on dribbles, chances created, and key passes. Speed of play on the flank and decision-making (cut in vs. cross) are critical.',
        'Striker': 'As a Striker, goals per game and shots on target are the primary metrics. Movement off the ball and finishing quality are the priority.',
        'Central Midfielder': 'As a CM, pass accuracy and chances created are your north star. Ball retention under pressure and vertical penetration define your impact.',
        'Attacking Midfielder': 'As an AM, you are judged by chances created, assists, and goal threat. Vision, creativity, and final-third execution are everything.',
        'Defensive Midfielder': 'As a DM, tackles, interceptions, and pass accuracy define your performance. You are the shield in front of the defence.',
        'Centre-Back': 'As a Centre-Back, clearances, tackles, interceptions and preventing goals scored define your rating.',
        'Full Back': 'As a Full Back, balance defensive solidity (tackles) with attacking contribution (assists, chances). Width in attack, discipline in defence.',
        'Goalkeeper': 'As a Goalkeeper, saves, clean sheets, and goals conceded are your headline stats.',
      };
      PositionContext = PositionGuide[Position] || `Position: ${Position}.`;
    }

    const SystemPrompt = `You are Coach AI, an elite UEFA Pro License tactical manager and lead data analyst for the MySoccerLab academy. You are conducting a 1-on-1 performance debrief with ${PlayerName}.

## Player Profile
- **Name:** ${PlayerName}
- **Position:** ${Position || 'Not set'}
- **Preferred Foot:** ${PlayerProfile.preferredFoot || 'Not set'}
- **Club:** ${PlayerProfile.clubTeam || 'Not set'}
${PositionContext ? `\n**Position Coaching Note:** ${PositionContext}` : ''}

## Full Match History (Newest → Oldest — ALL ${TotalMatches} matches)
${MatchHistoryLog}

## Career Stats Summary
| Metric | Value |
|---|---|
| Matches | ${TotalMatches} |
| Record | ${Wins}W / ${Draws}D / ${Losses}L |
| Goals | ${TotalGoals} |
| Assists | ${TotalAssists} |
| Chances Created | ${TotalChances} |
| Avg Pass Accuracy | ${AvgPassAcc}% |

## Your Coaching Persona
- Analytical & Direct: You speak like a top-tier European manager. Demand excellence, provide the blueprint.
- Data-Driven: Every piece of feedback is anchored in the actual stats above. NEVER invent or guess numbers.
- Position-Aware: Tailor all advice specifically to ${PlayerName}'s position (${Position || 'unknown'}).
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
6. **Closing Action:** End EVERY response with one specific, named drill or tactical tip for ${PlayerName} to do in their next session.`;

    const Chat = Model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: SystemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: `Understood. I am Coach AI, fully briefed on ${PlayerName}'s profile as a ${Position || 'player'} with ${TotalMatches} matches logged. Ready to analyze.` }],
        },
        // Inject prior conversation turns so the AI remembers the thread
        ...ConversationHistory,
      ],
      generationConfig: {
        maxOutputTokens: 8192,
      },
    });

    const PartsToSend = Array.isArray(MessageParts) ? MessageParts : [{ text: MessageParts }];

    const Result = await Chat.sendMessage(PartsToSend);
    const Response = await Result.response;

    return Response.text();
  } catch (Error) {
    console.error("Error generating Gemini response:", Error);
    return "I'm sorry, I'm having trouble analyzing your data right now. Please try again later. Error: " + Error.message;
  }
};