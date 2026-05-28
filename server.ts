import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with custom option as requested
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Endpoint to analyze hosting options and provide optimizations
app.post("/api/analyze", async (req, res) => {
  try {
    if (!ai) {
      return res.status(403).json({
        error: "کلید API مربوط به Gemini تنظیم نشده است. لطفاً ابتدا کلید خود را در منوی تنظیمات (Settings > Secrets) به عنوان GEMINI_API_KEY تعریف کنید."
      });
    }

    const { projectType, techStack, customCode, requirements } = req.body;

    const prompt = `
You are an expert cloud architect, GIS systems specialized devops engineer. Analyze the following project details and provide a comprehensive hosting solution and complete code optimization suggestions.

CRITICAL FOCUS FOR THE PROJECT:
The user is building a "Grave Search & Mobile Navigation/Routing application" (پروژه پیدا کردن آدرس قبر از روی موبایل و مسیریابی). 
Tailor your recommendations to include maps performance optimization, GPS coordinates search, dynamic cemetery blocks querying, caching mapping tiles, CDN strategies, handling heavy GIS/geojson data, offline storage (such as indexDB/localStorage inside a Progressive Web App (PWA)), and cheap database servers suited for storing grave records (e.g. Supabase Postgres with PostGIS, SQLite, or Cloudflare KV for quick lookups).

PROJECT DETAILS:
- Project Type: ${projectType || 'Not specified'}
- Tech Stack: ${techStack || 'Not specified'}
- Key Requirements: ${requirements || 'Standard free tier, low latency, easy deployment'}
- Code Context (package.json, config, or source code):
${customCode || 'No custom code provided.'}

Your response must be in strict valid JSON format. The response should contain:
1. "overview": A summary in Persian (Farsi) of the hosting landscape for this project (e.g. how to host a mobile grave locator & GPS navigation app).
2. "comparison": An array of recommended hosting providers. For each, include:
   - "name": Provider name (e.g. "Cloudflare Pages", "Cloudflare Workers", "Vercel", "Netlify", "Supabase", "Railway", "Render")
   - "type": (e.g. "Jamstack/Static SPA / Mobile PWA", "Edge Worker/Serverless GeoAPI", "Stateful Container")
   - "free_tier_limits": Free tier limits (bandwidth, requests, CPU execution time, database storage)
   - "suitability_score": Score from 0 to 100
   - "match_explanation_fa": Why it matches (or does not match) this mobile GPS grave locator project, in Persian.
   - "pros_fa": List of pros in Persian (such as fast CDN response for Map Tiles, PostGIS support, offline capabilities support, edge functions for geocoding)
   - "cons_fa": List of cons in Persian
3. "cloudflare_deep_dive": A specific comparison of "Cloudflare Pages" vs "Cloudflare Workers" for this mobile grave routing project, explaining which one is better and why, in Persian. Talk about where to host the Leaflet frontend and where to host the route/search API.
4. "configs": An array of configuration files the user can use directly. Each config should have:
   - "filename": e.g. "wrangler.toml", "vercel.json", "netlify.toml", "Dockerfile", "manifest.json" (for PWA)
   - "description_fa": What this file does and how to use it for their grave search site/backend, in Persian.
   - "content": The string content of the configuration file.
5. "optimizations": An array of actionable, specific optimizations to improve or adapt their app for these hosting environments (e.g. caching tile maps, PostGIS or haversine queries for closest graves, geojson database file sizes compression, cold-start reduction, static asset caching headers, serverless environment variables handling). For each, provide:
   - "title_fa": Persian title.
   - "description_fa": Persian explanation of why and how to apply this optimization.
   - "code_example": (Optional) Code snippet demonstrating the fix/optimization.

Ensure all Persian explanations are natural, technical, helpful, and highly polished. Return ONLY the JSON object conforming to the schema below. Do not put any markdown wrapping like \`\`\`json \`\`\` around the response, or if you do, ignore it and just return the direct JSON. To ensure it is parsed correctly, return a JSON matching this TypeScript structure:

{
  "overview": string,
  "comparison": Array<{
    "name": string,
    "type": string,
    "free_tier_limits": string,
    "suitability_score": number,
    "match_explanation_fa": string,
    "pros_fa": string[],
    "cons_fa": string[]
  }>,
  "cloudflare_deep_dive": string,
  "configs": Array<{
    "filename": string,
    "description_fa": string,
    "content": string
  }>,
  "optimizations": Array<{
    "title_fa": string,
    "description_fa": string,
    "code_example"?: string
  }>
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["overview", "comparison", "cloudflare_deep_dive", "configs", "optimizations"],
          properties: {
            overview: { type: Type.STRING },
            comparison: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["name", "type", "free_tier_limits", "suitability_score", "match_explanation_fa", "pros_fa", "cons_fa"],
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                  free_tier_limits: { type: Type.STRING },
                  suitability_score: { type: Type.NUMBER },
                  match_explanation_fa: { type: Type.STRING },
                  pros_fa: { type: Type.ARRAY, items: { type: Type.STRING } },
                  cons_fa: { type: Type.ARRAY, items: { type: Type.STRING } },
                }
              }
            },
            cloudflare_deep_dive: { type: Type.STRING },
            configs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["filename", "description_fa", "content"],
                properties: {
                  filename: { type: Type.STRING },
                  description_fa: { type: Type.STRING },
                  content: { type: Type.STRING },
                }
              }
            },
            optimizations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title_fa", "description_fa"],
                properties: {
                  title_fa: { type: Type.STRING },
                  description_fa: { type: Type.STRING },
                  code_example: { type: Type.STRING },
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    res.json(data);

  } catch (error: any) {
    console.error("Analysis error:", error);
    res.status(500).json({
      error: "خطایی در تحلیل پروژه توسط هوش مصنوعی رخ داده است.",
      details: error.message || error
    });
  }
});

// Vite Integration
async function main() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
});
