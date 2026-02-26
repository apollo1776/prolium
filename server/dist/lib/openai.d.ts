/**
 * OpenAI Client Configuration
 * Used for semantic matching, sentiment analysis, and question detection
 */
import OpenAI from 'openai';
export declare const openai: OpenAI;
/**
 * Generate embedding for semantic similarity
 */
export declare const generateEmbedding: (text: string) => Promise<number[]>;
/**
 * Calculate cosine similarity between two embeddings
 */
export declare const cosineSimilarity: (a: number[], b: number[]) => number;
/**
 * Analyze sentiment of text
 * Returns: { sentiment: 'positive' | 'negative' | 'neutral', score: number }
 */
export declare const analyzeSentiment: (text: string) => Promise<{
    sentiment: "positive" | "negative" | "neutral";
    score: number;
}>;
/**
 * Detect if text is a question
 */
export declare const isQuestion: (text: string) => Promise<boolean>;
/**
 * Detect spam/bot comments
 */
export declare const isSpam: (text: string) => Promise<boolean>;
//# sourceMappingURL=openai.d.ts.map