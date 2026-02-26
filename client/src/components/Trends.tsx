
import React, { useState, useEffect } from 'react';
import { TrendingUp, Flame, Hash, Globe, ChevronRight, Loader2, Youtube, Sparkles } from 'lucide-react';
import { apiClient } from '../utils/apiClient';

// TikTok and Instagram icons as SVG components
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

type Platform = 'youtube' | 'tiktok' | 'instagram';

interface TrendsProps {
  onNavigate: (view: string) => void;
}

const Trends: React.FC<TrendsProps> = ({ onNavigate }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('youtube');
  const [trendsData, setTrendsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrendsData();
  }, [selectedPlatform]);

  const loadTrendsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(`/trends/${selectedPlatform}`);
      setTrendsData(response.data.data);
    } catch (error: any) {
      console.error('Failed to load trends:', error);
      setError(error.response?.data?.message || 'Failed to load trending data');
    } finally {
      setLoading(false);
    }
  };

  const platforms = [
    { id: 'youtube' as Platform, name: 'YouTube', icon: Youtube, color: 'text-red-400', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/30' },
    { id: 'tiktok' as Platform, name: 'TikTok', icon: TikTokIcon, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', borderColor: 'border-cyan-500/30' },
    { id: 'instagram' as Platform, name: 'Instagram', icon: InstagramIcon, color: 'text-pink-400', bgColor: 'bg-pink-500/20', borderColor: 'border-pink-500/30' },
  ];

  const currentPlatform = platforms.find(p => p.id === selectedPlatform)!;

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h2 className="text-2xl font-bold text-white">Trends Radar</h2>
          <p className="text-slate-500">Real-time signals from {currentPlatform.name}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-300 font-medium">Loading trending data...</p>
          <p className="text-slate-500 text-sm mt-2">Fetching latest trends from {currentPlatform.name}</p>
        </div>
      </div>
    );
  }

  if (error) {
    const PlatformIcon = currentPlatform.icon;
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h2 className="text-2xl font-bold text-white">Trends Radar</h2>
          <p className="text-slate-500">Real-time signals from {currentPlatform.name}</p>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-8 text-center">
          <PlatformIcon className={`w-12 h-12 ${currentPlatform.color} mx-auto mb-4`} />
          <p className="text-rose-400 font-medium mb-2">{error}</p>
          <p className="text-slate-400 text-sm">Connect your {currentPlatform.name} account to see trending data</p>
        </div>
      </div>
    );
  }

  const trends = trendsData?.trendingTopics || [];
  const topicSaturation = trendsData?.topicSaturation || [];
  const nicheIntelligence = trendsData?.nicheIntelligence || '';

  const PlatformIcon = currentPlatform.icon;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Trends Radar</h2>
          <p className="text-slate-500">Real-time signals from {currentPlatform.name} trending content</p>
        </div>
        <div className="flex bg-slate-800/40 p-1.5 rounded-2xl border border-slate-800 gap-1">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  selectedPlatform === platform.id
                    ? `${platform.bgColor} ${platform.color} ${platform.borderColor} border shadow-sm`
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {platform.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#16191f] rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
            <h3 className="font-black text-white text-xs uppercase tracking-[0.2em] flex items-center gap-3">
              <Flame className="w-5 h-5 text-orange-500/70" />
              Trending Topics
            </h3>
            <PlatformIcon className={`w-5 h-5 ${currentPlatform.color}`} />
          </div>
          <div className="divide-y divide-slate-800/50">
            {trends.length > 0 ? (
              trends.map((trend: any, idx: number) => (
                <div key={idx} className="p-8 flex items-center justify-between hover:bg-slate-800/30 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className="bg-[#0f1115] p-4 rounded-2xl border border-slate-800 group-hover:bg-slate-700/50 group-hover:border-[#2a2a2a] group-hover:text-slate-300 transition-all">
                      <Hash className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-black text-lg text-slate-200">#{trend.tag}</p>
                      <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1">{trend.volume} views</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-lg ${trend.status === 'viral' ? 'text-slate-300' : trend.status === 'rising' ? 'text-slate-400' : 'text-slate-500/80'}`}>
                      {trend.growth}
                    </p>
                    <p className="text-[10px] text-slate-700 font-black uppercase tracking-tighter">{trend.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">
                No trending topics available
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-800/30 border border-slate-700 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-sm">
            <Globe className="absolute -bottom-10 -right-10 w-56 h-56 opacity-10 text-slate-600" />
            <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mb-4">Niche Intelligence</p>
            <h3 className="text-3xl font-black mb-6 tracking-tighter text-slate-100 flex items-center gap-3">
              <PlatformIcon className={`w-8 h-8 ${currentPlatform.color}`} />
              {currentPlatform.name} Trends
            </h3>
            <p className="text-slate-400 mb-10 leading-relaxed text-lg font-medium">
              {nicheIntelligence}
            </p>
            <button
              onClick={loadTrendsData}
              className="bg-slate-800 border border-slate-700 text-slate-200 px-8 py-4 rounded-2xl font-black hover:bg-slate-700 hover:scale-[1.02] transition-all flex items-center gap-3 group"
            >
              Refresh Data
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-slate-400" />
            </button>
          </div>

          <div className="bg-[#16191f] rounded-[2.5rem] border border-slate-800 p-10 shadow-sm">
            <h3 className="font-black text-lg text-white mb-8 uppercase text-xs tracking-[0.2em]">Topic Saturation</h3>
            <div className="space-y-8">
              {topicSaturation.length > 0 ? (
                topicSaturation.map((item: any, idx: number) => (
                  <div key={idx}>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                      <span className="text-slate-500">{item.label}</span>
                      <span className="text-slate-600">{item.val}% Saturated</span>
                    </div>
                    <div className="h-2 w-full bg-[#0f1115] rounded-full overflow-hidden border border-slate-800">
                      <div className={`h-full ${item.color} shadow-sm transition-all duration-1000`} style={{ width: `${item.val}%` }}></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 text-sm">
                  No saturation data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-[#16191f] p-10 rounded-3xl border border-slate-800">
        <h3 className="font-black text-xl text-white mb-8 flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-slate-400" />
          AI Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Connect Accounts', desc: 'Sync your profiles for AI insights', action: 'account' },
            { title: 'Define Niche', desc: 'Personalize your AI assistant', action: 'account' },
            { title: 'Explore Trends', desc: 'See what is viral in tech', action: 'trends' },
            { title: 'Try Video Gen', desc: 'Turn text into short videos', action: 'video' },
          ].map((mission, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate(mission.action)}
              className="w-full text-left p-5 rounded-2xl border border-slate-800 hover:border-[#2a2a2a] hover:bg-slate-800/50 transition-all group"
            >
              <p className="font-bold text-slate-300 group-hover:text-white transition-colors">{mission.title}</p>
              <p className="text-sm text-slate-500 mt-1">{mission.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Trends;
