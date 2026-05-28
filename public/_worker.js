// Cloudflare Pages Advanced Mode _worker.js
// This worker acts as the serverless backend on Cloudflare Pages, routing /api/* requests
// and serving static assets from the assets binding (env.ASSETS) for all other requests.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Route API Requests
    if (url.pathname.startsWith('/api/')) {
      // CORS headers for preflight and standard requests
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };

      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }

      // API: Extract Info using Gemini
      if (url.pathname === '/api/extract' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { image } = body;

          if (!image) {
            return new Response(
              JSON.stringify({ error: "داده‌های تصویر الزامی است" }),
              { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
            );
          }

          // Retrieve Gemini API Key from environment
          const apiKey = env.GEMINI_API_KEY;
          if (!apiKey) {
            return new Response(
              JSON.stringify({ error: "کلید API برای مدل هوش مصنوعی (GEMINI_API_KEY) در پنل کلودفلر تعریف نشده است." }),
              { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
            );
          }

          // Build the exact REST payload for Gemini 1.5 Flash
          const geminiPrompt = `Extract details from this headstone photo. Focus on the deceased person's name, father's name (نام پدر), birth date, death date, and any inscription or poem. 
The headstone is likely in Persian (Farsi). Extract the names and text as written in Persian.
Output should be JSON.`;

          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
          
          const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: geminiPrompt },
                  {
                    inlineData: {
                      mimeType: "image/jpeg",
                      data: image
                    }
                  }
                ]
              }],
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: "OBJECT",
                  properties: {
                    fullName: { type: "STRING" },
                    fatherName: { type: "STRING", description: "Father's name (نام پدر) of the deceased" },
                    birthDate: { type: "STRING", description: "Birth date in Persian or Solar Hijri" },
                    deathDate: { type: "STRING", description: "Death date in Persian or Solar Hijri" },
                    inscription: { type: "STRING", description: "Full text of the inscription or poem" }
                  },
                  required: ["fullName", "fatherName", "birthDate", "deathDate", "inscription"]
                }
              }
            })
          });

          if (!response.ok) {
            const rawError = await response.text();
            console.error("Gemini API Error Status:", response.status, rawError);
            return new Response(
              JSON.stringify({ error: `خطا در دریافت پاسخ از هوش مصنوعی گوگل: ${response.statusText}` }),
              { status: response.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
            );
          }

          const responseData = await response.json();
          const geminiText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!geminiText) {
            throw new Error("پاسخ متنی از هوش مصنوعی دریافت نشد.");
          }

          return new Response(geminiText, {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });

        } catch (error) {
          console.error("Processing Extract Error:", error);
          return new Response(
            JSON.stringify({ error: error.message || "خطایی در پردازش رخ داد." }),
            { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
      }

      // API: Health Check
      if (url.pathname === '/api/health' && request.method === 'GET') {
        return new Response(
          JSON.stringify({ status: "ok", timestamp: new Date().toISOString(), platform: "cloudflare-pages" }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Default for unknown API routes
      return new Response(
        JSON.stringify({ error: "مسیر یافت نشد - Route Not Found" }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 2. Serve Static Assets
    // Try serving assets natively from Cloudflare Pages binding
    let response = await env.ASSETS.fetch(request);

    // SPA Fallback: If Asset check returns 404, serve /index.html instead for Client-side Routing
    if (response.status === 404) {
      const indexRequest = new Request(new URL('/index.html', request.url), request);
      response = await env.ASSETS.fetch(indexRequest);
    }

    return response;
  }
};
