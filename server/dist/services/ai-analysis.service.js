"use strict";
/**
 * AI Analysis Service
 * Uses OpenAI to analyze platform data
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiAnalysisService = exports.AIAnalysisService = void 0;
const openai_1 = __importDefault(require("openai"));
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
class AIAnalysisService {
    constructor() {
        this.openai = null;
        if (OPENAI_API_KEY && OPENAI_API_KEY !== 'PLACEHOLDER_API_KEY') {
            this.openai = new openai_1.default({
                apiKey: OPENAI_API_KEY,
            });
        }
    }
    /**
     * Analyze YouTube channel data and provide insights
     */
    async analyzeYouTubeData(data) {
        if (!this.openai) {
            throw new Error('OpenAI API key not configured');
        }
        try {
            const prompt = `
You are an expert YouTube content analyst. Analyze the following YouTube channel data and provide a comprehensive summary with insights and recommendations.

Channel Data:
${JSON.stringify(data, null, 2)}

Please provide:
1. Channel Overview - Key metrics and performance summary
2. Content Analysis - Types of content, themes, and patterns
3. Audience Insights - Who watches the content based on available data
4. Strengths - What's working well
5. Opportunities - Areas for improvement and growth
6. Recommendations - 3-5 specific actionable recommendations

Format your response in clear sections with bullet points and specific numbers where available.
`;
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert YouTube content analyst who provides actionable insights and recommendations.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 2000,
            });
            return completion.choices[0].message.content || 'No analysis generated';
        }
        catch (error) {
            console.error('AI Analysis error:', error.message);
            throw new Error('Failed to generate AI analysis');
        }
    }
    /**
     * Analyze comments for sentiment and themes
     */
    async analyzeComments(comments) {
        if (!this.openai) {
            throw new Error('OpenAI API key not configured');
        }
        try {
            const prompt = `
Analyze these audience comments and provide a JSON summary with:
1. Sentiment categorization (counts for positive/negative/neutral)
2. Top 4-6 recurring themes or topics mentioned
3. One actionable content suggestion based on the feedback

Comments:
${comments.slice(0, 100).join('\n---\n')}

Return ONLY a JSON object with this exact structure:
{
  "sentiment": {
    "positive": <number>,
    "negative": <number>,
    "neutral": <number>
  },
  "themes": ["theme1", "theme2", "theme3", "theme4"],
  "suggestion": "Your actionable content suggestion here"
}
`;
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a sentiment analysis expert. Always respond with valid JSON only, no additional text.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 1000,
                response_format: { type: 'json_object' },
            });
            const result = JSON.parse(completion.choices[0].message.content || '{}');
            return {
                sentiment: result.sentiment || { positive: 0, negative: 0, neutral: 0 },
                themes: result.themes || [],
                suggestion: result.suggestion || 'No suggestion available',
            };
        }
        catch (error) {
            console.error('Comment analysis error:', error.message);
            throw new Error('Failed to analyze comments');
        }
    }
    /**
     * Generate quick insights for dashboard
     */
    async generateQuickInsights(platformData) {
        if (!this.openai) {
            return 'AI analysis unavailable - OpenAI API key not configured';
        }
        try {
            const prompt = `
Analyze this multi-platform creator data and provide 3-5 key insights in a concise, actionable format:

Platform Data:
${JSON.stringify(platformData, null, 2)}

Focus on:
- Cross-platform performance trends
- Best performing content types
- Audience engagement patterns
- Quick wins for growth

Keep each insight to 1-2 sentences.
`;
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a social media analytics expert who provides concise, actionable insights.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 500,
            });
            return completion.choices[0].message.content || 'Unable to generate insights';
        }
        catch (error) {
            console.error('Quick insights error:', error.message);
            return 'Unable to generate insights at this time';
        }
    }
}
exports.AIAnalysisService = AIAnalysisService;
exports.aiAnalysisService = new AIAnalysisService();
//# sourceMappingURL=ai-analysis.service.js.map