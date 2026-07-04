const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const getGeminiModel = () => {
  // Try different model names in order of preference
  // gemini-1.5-flash is widely available on free tier
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'models/gemini-1.5-flash',
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 8192,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  });
};

// Test function to validate API key and list available models
const listAvailableModels = async () => {
  try {
    const models = await genAI.listModels();
    return models;
  } catch (error) {
    console.error('Failed to list models:', error.message);
    return null;
  }
};

module.exports = { genAI, getGeminiModel, listAvailableModels };
