import React, { useState, useEffect } from 'react';
import { Sparkles, Youtube, Loader2, TrendingUp, Users, Eye, MessageCircle, Clock } from 'lucide-react';
import { apiClient } from '../utils/apiClient';

const YouTubeInsights: React.FC = () => {
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
      const response = await apiClient.get('/analytics/youtube/stats');
      setStats(response.data);
    } catch (error: any) {
      console.error('Stats error:', error);
      setStatsError(
        error.response?.data?.message || 'Failed to load YouTube statistics'
      );
    } finally {
      setStatsLoading(false);
    }
  };

  const generateAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/analytics/youtube');
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
          <h2 className="text-2xl font-bold text-white">YouTube AI Insights</h2>
          <p className="text-gray-500">AI-powered analysis of your YouTube channel</p>
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
          <p className="text-gray-400 text-sm">Loading YouTube statistics...</p>
        </div>
      )}

      {statsError && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
          <p className="text-rose-400 text-sm">{statsError}</p>
        </div>
      )}

      {stats?.hasChannel && !statsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Subscribers */}
          <div className="bg-black border border-[#1a1a1a] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#0a0a0a] p-2 rounded-lg">
                <Users className="w-5 h-5 text-gray-300" />
              </div>
              <span className="text-gray-400 text-sm">Subscribers</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.stats.subscriberCount.toLocaleString()}
            </p>
          </div>

          {/* Total Comments */}
          <div className="bg-black border border-[#1a1a1a] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#0a0a0a] p-2 rounded-lg">
                <MessageCircle className="w-5 h-5 text-gray-300" />
              </div>
              <span className="text-gray-400 text-sm">Total Comments</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.stats.totalComments.toLocaleString()}
            </p>
          </div>

          {/* Views Last 24h */}
          <div className="bg-black border border-[#1a1a1a] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#0a0a0a] p-2 rounded-lg">
                <Clock className="w-5 h-5 text-gray-300" />
              </div>
              <span className="text-gray-400 text-sm">Views (24h)</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.stats.views24h.toLocaleString()}
            </p>
          </div>

          {/* Views Last 7d */}
          <div className="bg-black border border-[#1a1a1a] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#0a0a0a] p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-gray-300" />
              </div>
              <span className="text-gray-400 text-sm">Views (7 days)</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.stats.views7d.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {stats && !stats.hasChannel && !statsLoading && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <p className="text-amber-400 text-sm">{stats.message}</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
          <p className="text-rose-400 text-sm">{error}</p>
          {error.includes('API key') && (
            <p className="text-gray-400 text-xs mt-2">
              Add your OpenAI API key to <code className="bg-[#1a1a1a] px-2 py-1 rounded">/server/.env</code>
            </p>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && !analysis && (
        <div className="bg-black border border-[#1a1a1a] rounded-xl p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 font-medium">Analyzing your YouTube data...</p>
          <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
        </div>
      )}

      {/* AI Analysis Results */}
      {analysis && !loading && (
        <div className="space-y-6">

          {/* AI Analysis */}
          <div className="bg-black border border-[#1a1a1a] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#0a0a0a] p-2 rounded-lg">
                <Sparkles className="w-6 h-6 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-white">AI-Generated Insights</h3>
            </div>

            <div className="prose prose-invert prose-gray max-w-none">
              <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {analysis.analysis}
              </div>
            </div>
          </div>

          {/* Channel Info */}
          {analysis.data?.channel && (
            <div className="bg-black border border-[#1a1a1a] rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Channel Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400 text-sm">Channel Name:</span>
                  <p className="text-white font-medium">{analysis.data.channel.title}</p>
                </div>
                {analysis.data.channel.customUrl && (
                  <div>
                    <span className="text-gray-400 text-sm">Custom URL:</span>
                    <p className="text-white font-medium">{analysis.data.channel.customUrl}</p>
                  </div>
                )}
                {analysis.data.channel.country && (
                  <div>
                    <span className="text-gray-400 text-sm">Country:</span>
                    <p className="text-white font-medium">{analysis.data.channel.country}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-400 text-sm">Created:</span>
                  <p className="text-white font-medium">
                    {new Date(analysis.data.channel.publishedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* No Channel Message */}
          {analysis.data?.message && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p className="text-amber-400 text-sm">{analysis.data.message}</p>
            </div>
          )}
        </div>
      )}

      {/* AI Analysis Empty State */}
      {!analysis && !loading && !error && stats?.hasChannel && !statsLoading && (
        <div className="bg-black border border-[#1a1a1a] rounded-xl p-12 text-center">
          <div className="bg-[#0a0a0a] p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Get AI-Powered Insights</h3>
          <p className="text-gray-400 mb-6">
            Click "Generate AI Analysis" above to get personalized recommendations and deep insights about your YouTube channel
          </p>
        </div>
      )}
    </div>
  );
};

export default YouTubeInsights;
