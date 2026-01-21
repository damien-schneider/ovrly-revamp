import { GoogleGenAI, Type } from "@google/genai";
import type { ChatStyle } from "../types";

// Always use process.env.API_KEY for initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateChatTheme = async (
  prompt: string
): Promise<Partial<ChatStyle> | null> => {
  try {
    // Directly use ai.models.generateContent with model name and prompt
    // and provide system instruction via config.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a chat theme based on this description: "${prompt}".
      
      Return a JSON object with these properties:
      - backgroundColor (hex code with alpha or rgba)
      - textColor (hex code)
      - usernameColor (hex code)
      - fontFamily (standard web safe fonts or Google Fonts like 'Roboto', 'Inter', 'Press Start 2P')
      - borderRadius (number in px)
      
      Example output:
      {
        "backgroundColor": "rgba(0, 0, 0, 0.5)",
        "textColor": "#ffffff",
        "usernameColor": "#a855f7",
        "fontFamily": "Inter",
        "borderRadius": 8
      }
      `,
      config: {
        systemInstruction:
          "You are a UI/UX expert specializing in livestream overlays. Generate CSS styles for a chat box based on the user's description. Return strictly JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            backgroundColor: { type: Type.STRING },
            textColor: { type: Type.STRING },
            usernameColor: { type: Type.STRING },
            fontFamily: { type: Type.STRING },
            borderRadius: { type: Type.NUMBER },
          },
        },
      },
    });

    // Extract text directly from the response property
    const text = response.text;
    if (!text) {
      return null;
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};
