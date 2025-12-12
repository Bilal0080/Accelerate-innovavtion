import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_MODEL_CHAT, GEMINI_MODEL_ANALYSIS, SYSTEM_INSTRUCTION_CHAT, SYSTEM_INSTRUCTION_ANALYSIS } from "../constants";
import { AnalysisResult, Message, Role } from "../types";

// Initialize the API client
// CRITICAL: process.env.API_KEY is guaranteed to be available in this environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Streams chat response from Gemini
 */
export async function* streamChatResponse(
  history: Message[],
  newMessage: string
): AsyncGenerator<string, void, unknown> {
  
  // Convert internal Message format to Gemini history format if needed,
  // but simpler to just use sendMessageStream with the new message 
  // and let the client manage context if we were using a stateful chat object.
  // However, for a simple stateless-like implementation or to ensure full context control:
  
  const chat = ai.chats.create({
    model: GEMINI_MODEL_CHAT,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_CHAT,
    },
    history: history.map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }))
  });

  const result = await chat.sendMessageStream({ message: newMessage });

  for await (const chunk of result) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}

/**
 * Analyzes an idea and returns structured JSON data
 */
export async function analyzeIdea(ideaText: string): Promise<AnalysisResult> {
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_ANALYSIS,
    contents: `Analyze this innovation idea: "${ideaText}"`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_ANALYSIS,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ideaName: { type: Type.STRING },
          summary: { type: Type.STRING },
          overallScore: { type: Type.NUMBER, description: "Average score out of 100" },
          recommendation: { type: Type.STRING },
          metrics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                metric: { type: Type.STRING, description: "Name of the metric (e.g., Feasibility)" },
                score: { type: Type.NUMBER, description: "Score from 0 to 100" },
                reasoning: { type: Type.STRING, description: "Brief explanation of the score" }
              }
            }
          }
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("No analysis generated");
  }

  return JSON.parse(response.text) as AnalysisResult;
}
