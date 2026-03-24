import { GoogleGenAI, Type, FunctionDeclaration, FunctionCall } from "@google/genai";
import { GenAIResponse, Attachment } from "../types";
import { getWeather } from "./weatherService";

// Use process.env.GEMINI_API_KEY as per guidelines
const API_KEY = process.env.GEMINI_API_KEY;

// Initialize conditionally to prevent crash on load if key is missing
let ai: GoogleGenAI;
if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
}

// 1. Define the Weather Tool
const weatherTool: FunctionDeclaration = {
  name: 'get_current_weather',
  description: 'Get the current weather for a specific location. Use this when the user asks about the weather.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: {
        type: Type.STRING,
        description: "The city and state. If the user says 'here', 'current location', or doesn't specify a location, pass 'current_location'.",
      },
    },
    required: ['location'],
  },
};

// 2. Define the JSON Schema for the FINAL response (Answer + Suggestions)
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    answer: { 
      type: Type.STRING,
      description: "The response to the user's query. Use Markdown and ```code``` blocks where appropriate." 
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 short, relevant follow-up questions."
    },
    imagePrompt: {
        type: Type.STRING,
        description: "If the user explicitly asks to generate an image, create a picture, or draw something, provide a detailed description prompt here. Otherwise, leave empty."
    }
  },
  required: ["answer", "suggestions"]
};

export const generateResponse = async (
  prompt: string,
  attachment: Attachment | null,
  systemInstruction?: string
): Promise<GenAIResponse> => {
  // Strict API Key Validation
  if (!API_KEY) {
     throw new Error("Missing Gemini API Key. Please check your .env file and ensure VITE_API_KEY is set.");
  }

  try {
    const model = 'gemini-3-flash-preview';
    
    // Construct Initial User Content
    const initialParts: any[] = [];
    if (attachment) {
      initialParts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.data
        }
      });
    }
    initialParts.push({ text: prompt });

    // --- STEP 1: First Call (Allow Tools, No JSON Enforcement yet) ---
    // We do NOT set responseSchema here because the model might want to call a function instead.
    const firstResponse = await ai.models.generateContent({
      model: model,
      contents: { role: 'user', parts: initialParts },
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: [weatherTool] }], 
        temperature: 0.7,
      },
    });

    // Check for Function Calls
    const candidates = firstResponse.candidates;
    const functionCalls = candidates?.[0]?.content?.parts?.filter(p => p.functionCall).map(p => p.functionCall);
    
    if (functionCalls && functionCalls.length > 0) {
      // --- STEP 2: Handle Tool Execution ---
      const call = functionCalls[0] as FunctionCall;
      
      if (call.name === 'get_current_weather') {
        const args = call.args as any;
        const location = args.location || 'London, UK'; // Default fallback
        console.log(`[Pairadox AI] Calling Weather Tool for: ${location}`);
        
        const weatherData = await getWeather(location);
        
        // --- STEP 3: Send Tool Output back to Model (Enforcing JSON this time) ---
        // We reconstruct the conversation history for the model
        const toolParts = [
           ...initialParts, // User's original request
           // We technically should include the model's function call turn here, 
           // but for a stateless request to 'generateContent', we can just simulate the context 
           // by saying "User asked X. You checked weather and found Y. Now answer."
        ];

        // Refined Prompt for the final turn
        const finalPrompt = `
          User Request: "${prompt}"
          
          SYSTEM INFO - TOOL RESULT:
          The system checked the weather for ${location}. 
          Result: ${weatherData}
          
          Based on this result, answer the user's request.
        `;

        const finalResponse = await ai.models.generateContent({
            model: model,
            contents: { role: 'user', parts: [{ text: finalPrompt }] },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema // NOW we force the UI schema
            }
        });

        return JSON.parse(finalResponse.text || "{}") as GenAIResponse;
      }
    }

    // --- FALLBACK (No Tool Call) ---
    // If the model didn't want to use a tool, it likely just answered. 
    // But since we didn't enforce JSON schema in Step 1, we might have raw text.
    // We re-run the request *forcing* JSON schema. This adds a slight latency for non-tool queries 
    // but ensures strict type safety for the UI.
    
    const directResponse = await ai.models.generateContent({
        model: model,
        contents: { role: 'user', parts: initialParts },
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });

      return JSON.parse(directResponse.text || "{}") as GenAIResponse;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Parse meaningful errors to propagate to UI
    let friendlyMessage = "Connection to Core AI failed.";
    if (error.message) {
        if (error.message.includes("401") || error.message.includes("API key")) friendlyMessage = "Authentication Failed: Invalid API Key.";
        else if (error.message.includes("429")) friendlyMessage = "System Overload: Rate limit exceeded.";
        else if (error.message.includes("503")) friendlyMessage = "AI Service temporarily unavailable.";
        else if (error.message.includes("fetch failed")) friendlyMessage = "Network Error: Cannot reach Google servers.";
    }
    
    throw new Error(friendlyMessage);
  }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
    if (!ai) return null;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                // responseMimeType and responseSchema are NOT supported for this model
            }
        });

        // The response might contain text or image. We look for inlineData.
        if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (error) {
        console.error("Image Generation Error:", error);
        // We swallow image generation errors usually, but let's log them
        return null;
    }
};