// Centralized API Keys Configuration
// Update your API keys here. These will be used throughout the project.

// Helper to safely access import.meta.env in both browser and Node.js environments
const getMetaEnv = () => {
  try {
    return typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
  } catch (e) {
    return {};
  }
};

// Helper to safely access process.env in both browser and Node.js environments
const getProcessEnv = () => {
  try {
    return typeof process !== 'undefined' && process.env ? process.env : {};
  } catch (e) {
    return {};
  }
};

export const API_KEYS = {
  // Gemini API Key for AI features
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  
  // Google Maps API Key for routing and places
  GOOGLE_MAPS_API_KEY: getMetaEnv().VITE_GOOGLE_MAPS_API_KEY || getProcessEnv().VITE_GOOGLE_MAPS_API_KEY || "",

  // Paid API Key for high-quality models (if applicable)
  PAID_API_KEY: process.env.API_KEY || "",
};
