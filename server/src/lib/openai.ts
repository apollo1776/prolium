/**
 * OpenAI Client Configuration
 * Used for semantic matching, sentiment analysis, and question detection
 */

import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  console.warn('WARNING: OPENAI_API_KEY not set. AI features will be disabled.');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
});

/**
 * Generate embedding for semantic similarity
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};

/**
 * Calculate cosine similarity between two embeddings
 */
export const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Analyze sentiment of text
 * Returns: { sentiment: 'positive' | 'negative' | 'neutral', score: number }
 */
export const analyzeSentiment = async (
  text: string
): Promise<{ sentiment: 'positive' | 'negative' | 'neutral'; score: number }> => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Analyze the sentiment of the following text. Respond with ONLY a JSON object: {"sentiment": "positive"|"negative"|"neutral", "score": 0.0-1.0}',
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.3,
      max_tokens: 50,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return { sentiment: 'neutral', score: 0.5 };
  }
};

/**
 * Detect if text is a question
 */
export const isQuestion = async (text: string): Promise<boolean> => {
  try {
    // Simple heuristic first
    const questionWords = ['what', 'when', 'where', 'who', 'why', 'how', 'which', 'can', 'could', 'would', 'should'];
    const lowercaseText = text.toLowerCase().trim();

    // Check for question mark
    if (lowercaseText.endsWith('?')) return true;

    // Check for question words at start
    const startsWithQuestion = questionWords.some((word) => lowercaseText.startsWith(word + ' '));
    if (startsWithQuestion) return true;

    // Use AI for edge cases
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Determine if the following text is a question. Respond with ONLY "true" or "false".',
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0,
      max_tokens: 5,
    });

    return response.choices[0].message.content?.toLowerCase().trim() === 'true';
  } catch (error) {
    console.error('Error detecting question:', error);
    return false;
  }
};

/**
 * Detect spam/bot comments
 */
export const isSpam = async (text: string): Promise<boolean> => {
  try {
    // Simple heuristics first
    const spamPatterns = [
      /\b(click here|check out my|subscribe to|follow me|promotion|discount)\b/i,
      /\b(viagra|cialis|lottery|winner|prize)\b/i,
      /(https?:\/\/[^\s]+){2,}/i, // Multiple links
      /(.)\1{10,}/, // Repeated characters
    ];

    if (spamPatterns.some((pattern) => pattern.test(text))) {
      return true;
    }

    // Use AI for sophisticated spam
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Determine if the following comment is spam or from a bot. Consider promotional content, suspicious links, and unnatural language. Respond with ONLY "true" or "false".',
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0,
      max_tokens: 5,
    });

    return response.choices[0].message.content?.toLowerCase().trim() === 'true';
  } catch (error) {
    console.error('Error detecting spam:', error);
    return false;
  }
};
