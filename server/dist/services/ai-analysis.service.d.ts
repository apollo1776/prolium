/**
 * AI Analysis Service
 * Uses OpenAI to analyze platform data
 */
export declare class AIAnalysisService {
    private openai;
    constructor();
    /**
     * Analyze YouTube channel data and provide insights
     */
    analyzeYouTubeData(data: {
        channelInfo?: any;
        videos?: any[];
        analytics?: any;
    }): Promise<string>;
    /**
     * Analyze comments for sentiment and themes
     */
    analyzeComments(comments: string[]): Promise<{
        sentiment: {
            positive: number;
            negative: number;
            neutral: number;
        };
        themes: string[];
        suggestion: string;
    }>;
    /**
     * Generate quick insights for dashboard
     */
    generateQuickInsights(platformData: any[]): Promise<string>;
}
export declare const aiAnalysisService: AIAnalysisService;
//# sourceMappingURL=ai-analysis.service.d.ts.map