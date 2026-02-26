
import React, { useState, useEffect } from 'react';
import { apiClient } from '../utils/apiClient';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MessageSquare, ThumbsUp, BrainCircuit, Loader2 } from 'lucide-react';

const COLORS = ['#10b981', '#f43f5e', '#64748b'];

const Analytics: React.FC = () => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(true);

  const performAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/analytics/youtube/comments');
      console.log('[Analytics] Comment analysis response:', response.data);

      if (response.data.hasData) {
        setAnalysis(response.data.analysis);
        setHasData(true);
      } else {
        setHasData(false);
        setError(response.data.message || 'No comments available to analyze');
      }
    } catch (error: any) {
      console.error('[Analytics] Failed to analyze comments:', error);
      setError(error.response?.data?.message || 'Failed to analyze comments');
      setHasData(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performAnalysis();
  }, []);

  const sentimentData = analysis ? [
    { name: 'Positive', value: analysis.sentiment.positive },
    { name: 'Negative', value: analysis.sentiment.negative },
    { name: 'Neutral', value: analysis.sentiment.neutral },
  ] : [];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Audience Analysis</h2>
          <p className="text-gray-500">Deep-dive into cross-platform interactions</p>
        </div>
        <button
          onClick={performAnalysis}
          className="bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-2 rounded-xl text-sm font-bold text-gray-300 hover:bg-[#2a2a2a] flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4 text-gray-400" />}
          {loading ? 'Analyzing...' : 'Run AI Insight'}
        </button>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <p className="text-amber-400 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sentiment Breakdown */}
        <div className="bg-black p-10 rounded-3xl border border-[#1a1a1a] flex flex-col items-center [&_svg]:outline-none [&_svg]:border-none [&_*]:outline-none [&_rect]:hidden [&_.recharts-active-shape]:hidden">
          <h3 className="font-bold text-lg mb-8 w-full text-white">Sentiment Overview</h3>
          <div className="h-[250px] w-full [&_svg]:outline-none [&_svg]:border-none [&_rect]:hidden">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
              </div>
            ) : analysis && hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart style={{ outline: 'none' }}>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={false}
                    activeShape={false}
                    activeIndex={undefined}
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium">
                  {error || 'No comments available yet'}
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-4 mt-8">
             <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#10b981]"></div><span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Pos</span></div>
             <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#f43f5e]"></div><span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Neg</span></div>
             <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#64748b]"></div><span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Neu</span></div>
          </div>
        </div>

        {/* Recurring Themes */}
        <div className="bg-black p-10 rounded-3xl border border-[#1a1a1a] col-span-2">
          <h3 className="font-bold text-lg mb-8 text-white">Top Audience Topics</h3>
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-[#1a1a1a]/50 animate-pulse rounded-2xl"></div>)}
            </div>
          ) : analysis && hasData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.themes.map((theme: string, idx: number) => (
                <div key={idx} className="flex items-center gap-4 p-5 rounded-2xl bg-black border border-[#1a1a1a]">
                  <div className="bg-gray-700/50 text-gray-300 p-3 rounded-xl">
                    <ThumbsUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-100">{theme}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-1">Trending</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">{error || 'Awaiting data sync — connect a platform to see trending topics.'}</p>
          )}

          {analysis && hasData && (
            <div className="mt-8 p-6 bg-[#1a1a1a]/30 border border-[#2a2a2a] rounded-2xl">
              <h4 className="font-bold text-gray-300 flex items-center gap-2 mb-2 uppercase text-xs tracking-widest">
                <BrainCircuit className="w-4 h-4" />
                AI Strategy
              </h4>
              <p className="text-gray-300 italic leading-relaxed">
                "{analysis.suggestion}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
