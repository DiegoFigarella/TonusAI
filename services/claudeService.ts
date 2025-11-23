import { Emotion } from "../types";

// ============================================================================
// SETUP INSTRUCTION:
// Set your Anthropic API Key in .env.local as ANTHROPIC_API_KEY=sk-ant-...
// Note: For Hackathons/Demos only. In production, never expose keys in frontend code.
// Use a backend proxy instead.
// ============================================================================

const API_KEY = process.env.ANTHROPIC_API_KEY || '';
const API_URL = "https://api.anthropic.com/v1/messages";

const isApiKeyConfigured = () => {
  return API_KEY && API_KEY !== '' && API_KEY !== 'YOUR_ANTHROPIC_API_KEY_HERE';
};

export const analyzeEmotionFromText = async (text: string, context: string = ""): Promise<Emotion> => {
  if (!text || text.trim().length < 2) return Emotion.Neutral;

  if (!isApiKeyConfigured()) {
    console.warn("Please set your ANTHROPIC_API_KEY in .env.local");
    return Emotion.Neutral;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 150,
        system: `You are an advanced emotion analysis engine for the 'TONUS' app. 
Your task is to map the input text to EXACTLY ONE of these emotions: 
neutral, anger, joy, sad, fear, disgust, embarrassment, anxiety, ennui, envy, sarcasm, burnout, crashout.

"Crashout" means extreme intensity, ranting, or losing control.
"Burnout" implies exhaustion or being overwhelmed by work/life.

Rules:
1. You MUST output valid JSON only.
2. The JSON must look like: { "emotion": "joy" }
3. Do not add markdown code blocks or explanation.
4. Consider the context of previous sentences if provided.`,
        messages: [{ 
          role: "user", 
          content: context 
            ? `Context from previous sentences: "${context}"\n\nText to analyze: "${text}"` 
            : text 
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API Error:", response.status, errorText);
      return Emotion.Neutral;
    }

    const data = await response.json();
    const contentBlock = data.content.find((c: any) => c.type === 'text');
    const jsonText = contentBlock?.text || "{}";
    
    // Clean up any markdown code blocks if Claude slipped up
    const cleanJson = jsonText.replace(/```json\n?|```/g, '').trim();
    
    const parsed = JSON.parse(cleanJson);
    
    // Validate against enum
    const validEmotions = Object.values(Emotion);
    if (validEmotions.includes(parsed.emotion)) {
      return parsed.emotion as Emotion;
    }
    
    return Emotion.Neutral;

  } catch (error) {
    console.error("Claude Analysis Failed:", error);
    return Emotion.Neutral;
  }
};

export const getMentalWealthTips = async (recentEmotions: Emotion[]): Promise<string[]> => {
  if (!isApiKeyConfigured()) {
    return ["Please set your ANTHROPIC_API_KEY in .env.local"];
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: `You are a mental health coach for the TONUS app. Provide advice in valid JSON format only: { "tips": ["tip 1", "tip 2", "tip 3"] }. Do not add markdown code blocks or any other text.`,
        messages: [{ 
          role: "user", 
          content: `Based on these recent emotions: ${recentEmotions.join(', ')}, give me 3 short, actionable mental wealth tips.` 
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API Error:", response.status, errorText);
      return ["Take a deep breath.", "Drink some water.", "Step outside for a moment."];
    }

    const data = await response.json();
    const contentBlock = data.content.find((c: any) => c.type === 'text');
    const cleanJson = (contentBlock?.text || "{}").replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    
    return parsed.tips || ["Breathe deeply.", "Stay hydrated.", "Take a walk."];

  } catch (e) {
    console.error("Claude Tips Failed", e);
    return ["Take a deep breath.", "Drink some water.", "Step outside for a moment."];
  }
};
