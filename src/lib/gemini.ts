import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = (): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.GEMINI_API_KEY || '';
  }
  return (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export interface ExtractedGraveInfo {
  fullName: string;
  fatherName: string;
  birthDate: string;
  deathDate: string;
  inscription: string;
}

export async function extractGraveInfo(base64Image: string): Promise<ExtractedGraveInfo> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Extract details from this headstone photo. Focus on the deceased person's name, father's name (نام پدر), birth date, death date, and any inscription or poem. 
  The headstone is likely in Persian (Farsi). Extract the names and text as written in Persian.
  If a field is missing, leave it as an empty string. 
  Output should be clean JSON with keys: fullName, fatherName, birthDate, deathDate, inscription.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            fatherName: { type: Type.STRING, description: "Father's name (نام پدر) of the deceased" },
            birthDate: { type: Type.STRING, description: "Birth date as written, or YYYY-MM-DD if possible" },
            deathDate: { type: Type.STRING, description: "Death date as written, or YYYY-MM-DD if possible" },
            inscription: { type: Type.STRING, description: "Full text of the inscription" }
          },
          required: ["fullName", "fatherName", "birthDate", "deathDate", "inscription"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as ExtractedGraveInfo;
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
}
