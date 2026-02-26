
import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Users,
  Eye,
  MessageCircle,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ChevronDown,
  ThumbsUp,
  BrainCircuit,
  Loader2,
  Youtube,
  Camera,
  Music2,
  Twitter
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Sector } from 'recharts';
import { apiClient } from '../utils/apiClient';

const COLORS = ['#10b981', '#f43f5e', '#64748b'];

interface DashboardProps {
  onNavigate: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [youtubeStats, setYoutubeStats] = useState<any>(null);
  const [instagramStats, setInstagramStats] = useState<any>(null);
  const [tiktokStats, setTiktokStats] = useState<any>(null);
  const [xStats, setXStats] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [selectedMetric, setSelectedMetric] = useState<string>('views');
  const [timeRangeDropdownOpen, setTimeRangeDropdownOpen] = useState(false);

  // Analytics state
  const [analysis, setAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(true);

  useEffect(() => {
    loadAllPlatformStats();
    performAnalysis();
  }, []);

  useEffect(() => {
    if (youtubeStats?.hasChannel) {
      loadHistoricalData();
    }
  }, [timeRange, youtubeStats?.hasChannel]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const clickedElement = target.closest('.dropdown-container');

      if (!clickedElement) {
        setTimeRangeDropdownOpen(false);
      }
    };

    if (timeRangeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [timeRangeDropdownOpen]);

  const loadAllPlatformStats = async () => {
    setLoading(true);
    try {
      // Load stats from all platforms in parallel
      const [youtubeRes, instagramRes, tiktokRes, xRes] = await Promise.allSettled([
        apiClient.get('/analytics/youtube/stats'),
        apiClient.get('/analytics/instagram/stats'),
        apiClient.get('/analytics/tiktok/stats'),
        apiClient.get('/analytics/x/stats'),
      ]);

      // YouTube stats
      if (youtubeRes.status === 'fulfilled') {
        console.log('[Dashboard] YouTube stats:', youtubeRes.value.data);
        setYoutubeStats(youtubeRes.value.data);
      } else {
        console.log('[Dashboard] YouTube not connected or error');
        setYoutubeStats(null);
      }

      // Instagram stats
      if (instagramRes.status === 'fulfilled') {
        console.log('[Dashboard] Instagram stats:', instagramRes.value.data);
        setInstagramStats(instagramRes.value.data);
      } else {
        console.log('[Dashboard] Instagram not connected or error');
        setInstagramStats(null);
      }

      // TikTok stats
      if (tiktokRes.status === 'fulfilled') {
        console.log('[Dashboard] TikTok stats:', tiktokRes.value.data);
        setTiktokStats(tiktokRes.value.data);
      } else {
        console.log('[Dashboard] TikTok not connected or error');
        setTiktokStats(null);
      }

      // X stats
      if (xRes.status === 'fulfilled') {
        console.log('[Dashboard] X stats:', xRes.value.data);
        setXStats(xRes.value.data);
      } else {
        console.log('[Dashboard] X not connected or error');
        setXStats(null);
      }
    } catch (error: any) {
      console.error('[Dashboard] Failed to load platform stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistoricalData = async () => {
    try {
      console.log('[Dashboard] Loading REAL daily data for:', timeRange);
      const response = await apiClient.get('/analytics/youtube/historical', {
        params: { timeRange }
      });
      console.log('[Dashboard] Historical data loaded:', response.data);
      setHistoricalData(response.data);
    } catch (error: any) {
      console.error('[Dashboard] Failed to load historical data:', error.response?.data || error.message);
      setHistoricalData(null);
    }
  };

  const performAnalysis = async () => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const response = await apiClient.get('/analytics/youtube/comments');
      console.log('[Dashboard] Comment analysis response:', response.data);

      if (response.data.hasData) {
        setAnalysis(response.data.analysis);
        setHasData(true);
      } else {
        setHasData(false);
        setAnalysisError(response.data.message || 'No comments available to analyze');
      }
    } catch (error: any) {
      console.error('[Dashboard] Failed to analyze comments:', error);
      setAnalysisError(error.response?.data?.message || 'Failed to analyze comments');
      setHasData(false);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Time range options
  const timeRangeOptions = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '6m', label: '6 Months' },
    { value: '1y', label: '1 Year' },
    { value: 'ytd', label: 'YTD' },
    { value: 'all', label: 'All Time' },
  ];

  // Metric options with gradient colors
  const metricOptions = [
    { value: 'views', label: 'Total Views', color: 'url(#colorViews)' },
  ];

  const chartData = useMemo(() => {
    if (!youtubeStats?.hasChannel || !youtubeStats?.stats) {
      return [];
    }

    // If we have real historical data from YouTube Analytics API, use it
    if (historicalData?.data?.rows && historicalData.data.rows.length > 0) {
      console.log('[Dashboard] Using REAL daily data from YouTube Analytics API');
      const { columnHeaders, rows } = historicalData.data;

      const dayIndex = columnHeaders.findIndex((h: any) => h.name === 'day');
      const viewsIndex = columnHeaders.findIndex((h: any) => h.name === 'views');

      return rows.map((row: any[]) => {
        const date = new Date(row[dayIndex]);
        return {
          name: timeRange === '24h'
            ? date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
            : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          views: row[viewsIndex] || 0,
        };
      });
    }

    // Fallback: Generate time-series data based on available stats
    console.log('[Dashboard] Generating time-series data from available stats');
    const stats = youtubeStats.stats;
    const now = new Date();
    const registrationDate = youtubeStats.connectedAt ? new Date(youtubeStats.connectedAt) : new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const generateTimeSeries = () => {
      const data: any[] = [];

      switch (timeRange) {
        case '24h': {
          // 12 bars, each representing 2 hours
          for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 2 * 60 * 60 * 1000);
            const hour = date.getHours();
            data.push({
              name: `${hour % 12 || 12}${hour < 12 ? 'AM' : 'PM'}`,
              views: Math.floor((stats.views7d || 0) / 84 + Math.random() * (stats.views7d || 0) / 168) // Distribute 7d views
            });
          }
          break;
        }
        case '7d': {
          // 7 bars, one for each day
          for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            if (date >= registrationDate) {
              data.push({
                name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                views: Math.floor((stats.views7d || 0) / 7 + Math.random() * (stats.views7d || 0) / 14)
              });
            }
          }
          break;
        }
        case '30d': {
          // 30 bars, one for each day
          for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            if (date >= registrationDate) {
              data.push({
                name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                views: Math.floor((stats.totalViews || 0) / 30 + Math.random() * (stats.totalViews || 0) / 60)
              });
            }
          }
          break;
        }
        case '6m': {
          // 6 bars, one for each month
          for (let i = 5; i >= 0; i--) {
            const date = new Date(now);
            date.setMonth(date.getMonth() - i);
            if (date >= registrationDate) {
              data.push({
                name: date.toLocaleDateString('en-US', { month: 'short' }),
                views: Math.floor((stats.totalViews || 0) / 6 + Math.random() * (stats.totalViews || 0) / 12)
              });
            }
          }
          break;
        }
        case '1y': {
          // 12 bars, one for each month
          for (let i = 11; i >= 0; i--) {
            const date = new Date(now);
            date.setMonth(date.getMonth() - i);
            if (date >= registrationDate) {
              data.push({
                name: date.toLocaleDateString('en-US', { month: 'short' }),
                views: Math.floor((stats.totalViews || 0) / 12 + Math.random() * (stats.totalViews || 0) / 24)
              });
            }
          }
          break;
        }
        case 'ytd': {
          // Year to date - one bar per month from Jan 1 to now
          const yearStart = new Date(now.getFullYear(), 0, 1);
          const startDate = yearStart > registrationDate ? yearStart : registrationDate;
          const monthsCount = now.getMonth() - startDate.getMonth() + 1;

          for (let i = 0; i < monthsCount; i++) {
            const date = new Date(startDate);
            date.setMonth(startDate.getMonth() + i);
            data.push({
              name: date.toLocaleDateString('en-US', { month: 'short' }),
              views: Math.floor((stats.totalViews || 0) / monthsCount + Math.random() * (stats.totalViews || 0) / (monthsCount * 2))
            });
          }
          break;
        }
        case 'all': {
          // All time - from registration to now
          const daysSinceRegistration = Math.floor((now.getTime() - registrationDate.getTime()) / (24 * 60 * 60 * 1000));
          const monthsSinceRegistration = Math.max(1, Math.floor(daysSinceRegistration / 30));

          // Show monthly data
          for (let i = 0; i < Math.min(monthsSinceRegistration, 12); i++) {
            const date = new Date(registrationDate);
            date.setMonth(date.getMonth() + Math.floor(i * monthsSinceRegistration / 12));
            data.push({
              name: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
              views: Math.floor((stats.totalViews || 0) / Math.min(monthsSinceRegistration, 12) + Math.random() * (stats.totalViews || 0) / (Math.min(monthsSinceRegistration, 12) * 2))
            });
          }
          break;
        }
        default:
          return data;
      }

      return data;
    };

    return generateTimeSeries();
  }, [timeRange, youtubeStats, historicalData]);

  const sentimentData = analysis ? [
    { name: 'Positive', value: analysis.sentiment.positive },
    { name: 'Negative', value: analysis.sentiment.negative },
    { name: 'Neutral', value: analysis.sentiment.neutral },
  ] : [];

  // Custom active shape for pie chart - scales up on hover without changing color
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="none"
        />
      </g>
    );
  };

  // Aggregate stats from all connected platforms
  const aggregatedStats = useMemo(() => {
    let totalFollowers = 0;
    let totalViews = 0;
    let totalViews7d = 0;
    let totalEngagement = 0;
    let connectedPlatforms = 0;

    // YouTube stats
    if (youtubeStats?.hasChannel && youtubeStats?.stats) {
      totalFollowers += youtubeStats.stats.subscriberCount || 0;
      totalViews += youtubeStats.stats.totalViews || 0;
      totalViews7d += youtubeStats.stats.views7d || 0;
      totalEngagement += youtubeStats.stats.totalComments || 0;
      connectedPlatforms++;
    }

    // Instagram stats
    if (instagramStats?.hasAccount && instagramStats?.stats) {
      totalFollowers += instagramStats.stats.followersCount || 0;
      totalViews += instagramStats.stats.totalReach || 0;
      totalViews7d += instagramStats.stats.reach7d || 0;
      totalEngagement += (instagramStats.stats.totalLikes || 0) + (instagramStats.stats.totalComments || 0);
      connectedPlatforms++;
    }

    // TikTok stats
    if (tiktokStats?.hasAccount && tiktokStats?.stats) {
      totalFollowers += tiktokStats.stats.followerCount || 0;
      totalViews += tiktokStats.stats.totalViews || 0;
      totalViews7d += tiktokStats.stats.views7d || 0;
      totalEngagement += (tiktokStats.stats.totalLikes || 0) + (tiktokStats.stats.totalComments || 0);
      connectedPlatforms++;
    }

    // X stats
    if (xStats?.hasAccount && xStats?.stats) {
      totalFollowers += xStats.stats.followersCount || 0;
      totalViews += xStats.stats.totalImpressions || 0;
      totalViews7d += xStats.stats.impressions7d || 0;
      totalEngagement += (xStats.stats.totalLikes || 0) + (xStats.stats.totalRetweets || 0) + (xStats.stats.totalReplies || 0);
      connectedPlatforms++;
    }

    return {
      totalFollowers,
      totalViews,
      totalViews7d,
      totalEngagement,
      connectedPlatforms,
    };
  }, [youtubeStats, instagramStats, tiktokStats, xStats]);

  const stats = aggregatedStats.connectedPlatforms > 0 ? [
    {
      label: 'Total Followers',
      value: aggregatedStats.totalFollowers.toLocaleString(),
      icon: Users,
      trend: `Across ${aggregatedStats.connectedPlatforms} platform${aggregatedStats.connectedPlatforms > 1 ? 's' : ''}`,
      up: true,
      color: 'indigo'
    },
    {
      label: 'Total Views',
      value: aggregatedStats.totalViews.toLocaleString(),
      icon: Eye,
      trend: 'All Time',
      up: true,
      color: 'emerald'
    },
    {
      label: 'Views (7 days)',
      value: aggregatedStats.totalViews7d.toLocaleString(),
      icon: TrendingUp,
      trend: 'Last Week',
      up: true,
      color: 'blue'
    },
    {
      label: 'Total Engagement',
      value: aggregatedStats.totalEngagement.toLocaleString(),
      icon: MessageCircle,
      trend: 'Likes & Comments',
      up: true,
      color: 'rose'
    },
  ] : [
    { label: 'Total Followers', value: '0', icon: Users, trend: 'Connect platforms', up: true, color: 'indigo' },
    { label: 'Total Views', value: '0', icon: Eye, trend: 'Connect platforms', up: true, color: 'emerald' },
    { label: 'Views (7 days)', value: '0', icon: TrendingUp, trend: 'Connect platforms', up: true, color: 'blue' },
    { label: 'Total Engagement', value: '0', icon: MessageCircle, trend: 'Connect platforms', up: true, color: 'rose' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-black p-8 rounded-2xl border border-[#1a1a1a] hover:border-[#2a2a2a] transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-xl bg-[#0a0a0a] text-gray-400 group-hover:bg-[#1a1a1a] group-hover:text-gray-300 transition-all border border-[#1a1a1a]">
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                {stat.up && <ArrowUpRight className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-3xl font-black text-white mt-2">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Platform Breakdown - Always show all platforms */}
      <div className="bg-black p-8 rounded-2xl border border-[#1a1a1a]">
        <h3 className="font-black text-xl text-white mb-6">Connected Platforms</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* YouTube Platform Card */}
          <div className={`bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 transition-all ${
            youtubeStats?.hasChannel ? 'hover:border-red-500/30' : 'opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Youtube className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">YouTube</h4>
                  <p className="text-xs text-gray-500">
                    {youtubeStats?.hasChannel ? (youtubeStats.channelTitle || 'Connected') : 'Not connected'}
                  </p>
                </div>
              </div>
            </div>
            {youtubeStats?.hasChannel && youtubeStats?.stats ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Subscribers</span>
                  <span className="text-white font-bold">{(youtubeStats.stats.subscriberCount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Total Views</span>
                  <span className="text-white font-bold">{(youtubeStats.stats.totalViews || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Videos</span>
                  <span className="text-white font-bold">{(youtubeStats.stats.videoCount || 0).toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-16">
                <p className="text-xs text-gray-600 text-center">No data available</p>
              </div>
            )}
          </div>

          {/* Instagram Platform Card */}
          <div className={`bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 transition-all ${
            instagramStats?.hasAccount ? 'hover:border-purple-500/30' : 'opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Instagram</h4>
                  <p className="text-xs text-gray-500">
                    {instagramStats?.hasAccount ? (instagramStats.username || 'Connected') : 'Not connected'}
                  </p>
                </div>
              </div>
            </div>
            {instagramStats?.hasAccount && instagramStats?.stats ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Followers</span>
                  <span className="text-white font-bold">{(instagramStats.stats.followersCount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Total Reach</span>
                  <span className="text-white font-bold">{(instagramStats.stats.totalReach || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Media</span>
                  <span className="text-white font-bold">{(instagramStats.stats.mediaCount || 0).toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-16">
                <p className="text-xs text-gray-600 text-center">No data available</p>
              </div>
            )}
          </div>

          {/* TikTok Platform Card */}
          <div className={`bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 transition-all ${
            tiktokStats?.hasAccount ? 'hover:border-pink-500/30' : 'opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                  <Music2 className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">TikTok</h4>
                  <p className="text-xs text-gray-500">
                    {tiktokStats?.hasAccount ? (tiktokStats.username || 'Connected') : 'Not connected'}
                  </p>
                </div>
              </div>
            </div>
            {tiktokStats?.hasAccount && tiktokStats?.stats ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Followers</span>
                  <span className="text-white font-bold">{(tiktokStats.stats.followerCount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Total Views</span>
                  <span className="text-white font-bold">{(tiktokStats.stats.totalViews || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Videos</span>
                  <span className="text-white font-bold">{(tiktokStats.stats.videoCount || 0).toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-16">
                <p className="text-xs text-gray-600 text-center">No data available</p>
              </div>
            )}
          </div>

          {/* X Platform Card */}
          <div className={`bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 transition-all ${
            xStats?.hasAccount ? 'hover:border-white/30' : 'opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <Twitter className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">X (Twitter)</h4>
                  <p className="text-xs text-gray-500">
                    {xStats?.hasAccount ? (xStats.username || 'Connected') : 'Not connected'}
                  </p>
                </div>
              </div>
            </div>
            {xStats?.hasAccount && xStats?.stats ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Followers</span>
                  <span className="text-white font-bold">{(xStats.stats.followersCount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Impressions</span>
                  <span className="text-white font-bold">{(xStats.stats.totalImpressions || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Tweets</span>
                  <span className="text-white font-bold">{(xStats.stats.tweetCount || 0).toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-16">
                <p className="text-xs text-gray-600 text-center">No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-black p-10 rounded-2xl border border-[#1a1a1a] [&_svg]:outline-none [&_svg]:border-none [&_*]:outline-none">
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-black text-xl text-white">Statistics</h3>
            <div className="flex gap-2">
              {/* Time Range Dropdown */}
              <div className="relative dropdown-container">
                <button
                  onClick={() => setTimeRangeDropdownOpen(!timeRangeDropdownOpen)}
                  className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest hover:bg-[#1a1a1a] transition-all flex items-center gap-2"
                >
                  {timeRangeOptions.find(opt => opt.value === timeRange)?.label}
                  <ChevronDown className={`w-3 h-3 transition-transform ${timeRangeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {timeRangeDropdownOpen && (
                  <div className="absolute right-0 mt-2 bg-black border border-[#1a1a1a] rounded-xl shadow-xl z-10 min-w-[140px]">
                    {timeRangeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setTimeRange(option.value);
                          setTimeRangeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all first:rounded-t-xl last:rounded-b-xl ${
                          timeRange === option.value
                            ? 'bg-[#1a1a1a] text-white'
                            : 'text-gray-400 hover:bg-[#0a0a0a] hover:text-white'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full outline-none">
            {aggregatedStats.connectedPlatforms > 0 ? (
              chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} style={{ outline: 'none' }} barSize={40}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.9}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#666666', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#666666', fontSize: 12}} allowDecimals={false} domain={[0, 'auto']} />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      backgroundColor: '#000000',
                      borderRadius: '12px',
                      border: '1px solid #1a1a1a',
                      color: '#ffffff',
                      padding: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                    }}
                    itemStyle={{
                      color: '#10b981',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                    labelStyle={{
                      color: '#ffffff',
                      fontWeight: '600',
                      marginBottom: '4px'
                    }}
                  />
                  <Bar
                    dataKey={selectedMetric}
                    fill={metricOptions.find(m => m.value === selectedMetric)?.color}
                    radius={[8, 8, 0, 0]}
                    name={metricOptions.find(m => m.value === selectedMetric)?.label}
                    isAnimationActive={false}
                    minPointSize={5}
                  />
                </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <Youtube className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-400 text-sm font-medium mb-2">Enable YouTube Analytics API</p>
                    <p className="text-gray-600 text-xs mb-4">
                      To show exact daily view counts, enable the YouTube Analytics API in your Google Cloud Console.
                    </p>
                    <a
                      href="https://console.cloud.google.com/apis/library/youtubeanalytics.googleapis.com?project=715244760791"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold rounded-lg transition-colors"
                    >
                      Enable API
                    </a>
                  </div>
                </div>
              )
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Youtube className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">Connect YouTube to see growth data</p>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Audience Analysis Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Audience Analysis</h2>
            <p className="text-gray-500">AI-powered insights from your comments</p>
          </div>
          <button
            onClick={performAnalysis}
            className="bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-2 rounded-xl text-sm font-bold text-gray-300 hover:bg-[#2a2a2a] flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={analysisLoading}
          >
            {analysisLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4 text-gray-400" />}
            {analysisLoading ? 'Analyzing...' : 'Run AI Insight'}
          </button>
        </div>

        {/* Error State */}
        {analysisError && !analysisLoading && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <p className="text-amber-400 text-sm">{analysisError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sentiment Breakdown */}
          <div className="bg-black p-10 rounded-3xl border border-[#1a1a1a] flex flex-col items-center [&_svg]:outline-none [&_svg]:border-none [&_*]:outline-none [&_rect]:hidden [&_.recharts-active-shape]:hidden">
            <h3 className="font-bold text-lg mb-8 w-full text-white">Sentiment Overview</h3>
            <div className="h-[250px] w-full [&_svg]:outline-none [&_svg]:border-none [&_rect]:hidden">
              {analysisLoading ? (
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
                      activeShape={renderActiveShape}
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
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium">
                    {analysisError || 'No comments available yet'}
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
            {analysisLoading ? (
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
              <p className="text-gray-600 text-sm">{analysisError || 'Awaiting data sync — connect a platform to see trending topics.'}</p>
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

    </div>
  );
};

export default Dashboard;
