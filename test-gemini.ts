import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  const query = "GTB Hospital in Delhi";
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Find the location and coordinates for: "${query}". Return ONLY a valid JSON array of up to 5 results. Each result must have: "name" (string), "address" (string), "lat" (number), "lng" (number). Do not include any markdown formatting like \`\`\`json, just the raw JSON array.`,
    config: {
      tools: [{ googleMaps: {} }],
    }
  });
  console.log(response.text);
}

test();
