import { GoogleGenAI } from "@google/genai";
import fs from "fs";

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: 'A high-tech, futuristic command center map showing intelligent emergency route optimization, glowing safe routes, AI-based congestion prediction, and real-time traffic intelligence. Dark mode, neon accents, highly detailed, cinematic lighting.',
        },
      ],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64EncodeString = part.inlineData.data;
      fs.writeFileSync("public/hero-image.png", Buffer.from(base64EncodeString, 'base64'));
      console.log("Image saved to public/hero-image.png");
      break;
    }
  }
}

main().catch(console.error);
