import React, { useState, useEffect } from 'react';
import { Sparkles, Music2, Loader2, TrendingUp, Users, Eye, MessageCircle, Clock } from 'lucide-react';
import { apiClient } from '../utils/apiClient';

const TikTokInsights: React.FC = () => {
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
      const response = await apiClient.get('/analytics/tiktok/stats');
      setStats(response.data);
    } catch (error: any) {
      console.error('Stats error:', error);
      setStatsError(
        error.response?.data?.message || 'Connect your TikTok account to view statistics'
      );
    } finally {
      setStatsLoading(false);
    }
  };

  const generateAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/analytics/tiktok');
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
          <h2 className="text-2xl font-bold text-white">TikTok AI Insights</h2>
          <p className="text-gray-500">AI-powered analysis of your TikTok account</p>
        </div>
        <button
          onClick={generateAnalysis}
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-600 text-black text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
          <p className="text-gray-400 text-sm">Loading TikTok statistics...</p>
        </div>
      )}

      {statsError && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <p className="text-amber-400 text-sm">{statsError}</p>
          <p className="text-gray-400 text-xs mt-2">
            Go to Settings to connect your TikTok account
          </p>
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
              {stats.stats.followerCount?.toLocaleString() || '0'}
            </p>
          </div>

          {/* Total Likes */}
          <div className="bg-black border border-[#1a1a1a] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#0a0a0a] p-2 rounded-lg">
                <MessageCircle className="w-5 h-5 text-gray-300" />
              </div>
              <span className="text-gray-400 text-sm">Total Likes</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.stats.totalLikes?.toLocaleString() || '0'}
            </p>
          </div>

          {/* Total Videos */}
          <div className="bg-black border border-[#1a1a1a] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#0a0a0a] p-2 rounded-lg">
                <Music2 className="w-5 h-5 text-gray-300" />
              </div>
              <span className="text-gray-400 text-sm">Videos</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.stats.videoCount?.toLocaleString() || '0'}
            </p>
          </div>

          {/* Total Views */}
          <div className="bg-black border border-[#1a1a1a] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#0a0a0a] p-2 rounded-lg">
                <Eye className="w-5 h-5 text-gray-300" />
              </div>
              <span className="text-gray-400 text-sm">Total Views</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.stats.totalViews?.toLocaleString() || '0'}
            </p>
          </div>
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
          <p className="text-gray-300 font-medium">Analyzing your TikTok data...</p>
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

            <div className="prose prose-invert prose-slate max-w-none">
              <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {analysis.analysis}
              </div>
            </div>
          </div>

          {/* Account Info */}
          {analysis.data?.account && (
            <div className="bg-black border border-[#1a1a1a] rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Account Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400 text-sm">Username:</span>
                  <p className="text-white font-medium">{analysis.data.account.username}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Display Name:</span>
                  <p className="text-white font-medium">{analysis.data.account.displayName}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!analysis && !loading && !error && stats?.hasAccount && !statsLoading && (
        <div className="bg-[#1a1a1a]/30 border border-slate-700 rounded-xl p-12 text-center">
          <div className="bg-[#1a1a1a] p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Get AI-Powered Insights</h3>
          <p className="text-gray-400 mb-6">
            Click "Generate AI Analysis" above to get personalized recommendations and deep insights about your TikTok account
          </p>
        </div>
      )}
    </div>
  );
};

export default TikTokInsights;
