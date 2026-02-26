import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, TrendingUp, Users, Eye, MessageCircle, Clock } from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import XLogo from './icons/XLogo';

const XInsights: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Load stats on component mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setStatsLoading(true);
    setStatsError(null);

    try {
      const response = await apiClient.get('/analytics/x/stats');
      setStats(response.data);
    } catch (error: any) {
      console.error('Stats error:', error);
      setStatsError(
        error.response?.data?.message || 'Failed to load X statistics'
      );
    } finally {
      setStatsLoading(false);
    }
  };

  const generateAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/analytics/x');
      setAnalysis(response.data);
    } catch (error: any) {
      console.error('Analysis error:', error);
      setError(
        error.response?.data?.message ||
        'Failed to generate analysis. Make sure you have an OpenAI API key configured.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">X (Twitter) AI Insights</h2>
          <p className="text-gray-500">AI-powered analysis of your X account</p>
        </div>
        <button
          onClick={generateAnalysis}
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-600 text-black px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate AI Analysis
            </>
          )}
        </button>
      </div>

      {/* Stats Dashboard - Loaded on Page Mount */}
      {statsLoading && (
        <div className="bg-black border border-[#1a1a1a] rounded-xl p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading X (Twitter) statistics...</p>
        </div>
      )}

      {statsError && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
          <p className="text-rose-400 text-sm">{statsError}</p>
        </div>
      )}

      {stats?.hasAccount && !statsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Followers */}
          <div className="bg-black border border-[#1a1a1a] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#0a0a0a] p-2 rounded-lg">
                <Users className="w-5 h-5 text-gray-300" />
              </div>
              <span className="text-gray-400 text-sm">Followers</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.stats.followersCount?.toLocaleString() || '0'}
            </p>
          </div>

          {/* Total Tweets */}
          <div className="bg-black border border-[#1a1a1a] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#0a0a0a] p-2 rounded-lg">
                <MessageCircle className="w-5 h-5 text-gray-300" />
              </div>
              <span className="text-gray-400 text-sm">Total Tweets</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.stats.tweetCount?.toLocaleString() || '0'}
            </p>
          </div>

          {/* Impressions */}
          <div className="bg-black border border-[#1a1a1a] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#0a0a0a] p-2 rounded-lg">
                <Eye className="w-5 h-5 text-gray-300" />
              </div>
              <span className="text-gray-400 text-sm">Total Impressions</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.stats.totalImpressions?.toLocaleString() || '0'}
            </p>
          </div>

          {/* Engagement Rate */}
          <div className="bg-black border border-[#1a1a1a] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#0a0a0a] p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-gray-300" />
              </div>
              <span className="text-gray-400 text-sm">Following</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.stats.followingCount?.toLocaleString() || '0'}
            </p>
          </div>
        </div>
      )}

      {!stats?.hasAccount && !statsLoading && (
        <div className="bg-black border border-[#1a1a1a] rounded-xl p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <XLogo className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            No X (Twitter) Account Connected
          </h3>
          <p className="text-gray-400 mb-6">
            Connect your X account to view analytics and generate AI insights
          </p>
          <button
            onClick={() => (window.location.href = '/account')}
            className="bg-emerald-500 hover:bg-emerald-600 text-black px-6 py-3 rounded-xl font-bold text-sm transition-all"
          >
            Connect X Account
          </button>
        </div>
      )}

      {/* AI Analysis Results */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      )}

      {analysis && (
        <div className="bg-black border border-[#1a1a1a] rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Analysis</h3>
              <p className="text-sm text-gray-500">Generated insights from your X data</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Performance Summary */}
            {analysis.summary && (
              <div>
                <h4 className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-3">
                  Performance Summary
                </h4>
                <p className="text-gray-300 leading-relaxed">{analysis.summary}</p>
              </div>
            )}

            {/* Key Insights */}
            {analysis.insights && analysis.insights.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-3">
                  Key Insights
                </h4>
                <ul className="space-y-2">
                  {analysis.insights.map((insight: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-300">
                      <span className="text-emerald-500 mt-1">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-3">
                  Recommendations
                </h4>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-300">
                      <span className="text-emerald-500 mt-1">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default XInsights;
