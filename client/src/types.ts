
export type Platform = 'youtube' | 'tiktok' | 'instagram';

export interface CreatorProfile {
  id: string;
  name: string;
  handle: string;
  platform: Platform;
  followers: number;
  engagementRate: number;
  niche: string;
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  platform: Platform;
  sentiment?: 'positive' | 'negative' | 'neutral';
  category?: 'question' | 'praise' | 'feedback' | 'spam' | 'tutorial_request';
}

export interface AnalyticsSummary {
  totalViews: number;
  totalFollowers: number;
  sentimentScore: number;
  topTopics: string[];
}

export interface BrandOpportunity {
  brandName: string;
  industry: string;
  estimatedValue: string;
  matchScore: number;
  reason: string;
}

export interface Trend {
  tag: string;
  growth: string;
  platform: string;
  relevance: number;
}
