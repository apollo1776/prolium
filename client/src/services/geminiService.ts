
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

// Standard helper to initialize AI
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeComments = async (comments: string[]) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze these audience comments and provide a JSON summary. Categorize sentiment (positive/negative/neutral), identify top 3 recurring themes, and suggest 1 content idea based on the feedback.
    
    Comments:
    ${comments.join('\n')}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sentiment: {
            type: Type.OBJECT,
            properties: {
              positive: { type: Type.NUMBER },
              negative: { type: Type.NUMBER },
              neutral: { type: Type.NUMBER },
            },
            required: ['positive', 'negative', 'neutral'],
          },
          themes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          suggestion: { type: Type.STRING },
        },
        required: ['sentiment', 'themes', 'suggestion'],
      },
    },
  });
  
  return JSON.parse(response.text || '{}');
};

export const getBrandRecommendations = async (niche: string, followers: number) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on a creator in the "${niche}" niche with ${followers} followers, suggest 3 potential brands for sponsorship. Include an estimated deal value and reasoning.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            brandName: { type: Type.STRING },
            industry: { type: Type.STRING },
            estimatedValue: { type: Type.STRING },
            reasoning: { type: Type.STRING },
          },
          required: ['brandName', 'industry', 'estimatedValue', 'reasoning'],
        },
      },
    },
  });
  return JSON.parse(response.text || '[]');
};

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16' = '9:16') => {
  const ai = getAI();
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Video generation failed:", error);
    throw error;
  }
};
