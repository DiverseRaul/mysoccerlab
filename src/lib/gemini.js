const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Helper to encode file attachments (still done client-side before sending)
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
  if (!SUPABASE_URL) {
    return "Error: VITE_SUPABASE_URL is not configured in your .env file.";
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-coach`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Supabase anon key lets the edge function verify the request origin
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        messageParts: MessageParts,
        matchesData: MatchesData,
        playerName: PlayerName,
        playerProfile: PlayerProfile,
        conversationHistory: ConversationHistory,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.text;

  } catch (Error) {
    console.error("Error calling AI Coach function:", Error);
    return "I'm sorry, I'm having trouble analyzing your data right now. Please try again later. Error: " + Error.message;
  }
};