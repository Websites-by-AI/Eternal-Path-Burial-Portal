import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with a larger limit for images
app.use(express.json({ limit: "10mb" }));

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// API Routes
app.post("/api/extract", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Image data is required" });
    }

    const model = (ai as any).getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            fatherName: { type: Type.STRING, description: "Father's name (نام پدر) of the deceased" },
            birthDate: { type: Type.STRING, description: "Birth date in Persian or Solar Hijri" },
            deathDate: { type: Type.STRING, description: "Death date in Persian or Solar Hijri" },
            inscription: { type: Type.STRING, description: "Full text of the inscription or poem" }
          },
          required: ["fullName", "fatherName", "birthDate", "deathDate", "inscription"]
        }
      }
    });

    const prompt = `Extract details from this headstone photo. Focus on the deceased person's name, father's name (نام پدر), birth date, death date, and any inscription or poem. 
    The headstone is likely in Persian (Farsi). Extract the names and text as written in Persian.
    Output should be JSON.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: image
        }
      }
    ]);

    const response = result.response;
    const text = response.text();
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Gemini Extraction Error:", error);
    res.status(500).json({ error: error.message || "Failed to process image" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve index.html for all non-API routes (SPA fallback)
    app.get("*", (req, res, next) => {
      if (req.url.startsWith("/api")) return next();
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
