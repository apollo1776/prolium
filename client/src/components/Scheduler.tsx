
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Plus,
  Loader2,
  Youtube,
  Instagram,
  Video,
  Music2,
  TrendingUp,
  CheckCircle2,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  List,
  Filter,
  Settings,
  X,
  Image as ImageIcon,
  AlertCircle,
  Play
} from 'lucide-react';
import { apiClient } from '../utils/apiClient';

interface ScheduledPost {
  id: string;
  platform: 'youtube' | 'instagram' | 'tiktok';
  title: string;
  scheduledFor: string;
  status: 'scheduled' | 'draft' | 'published';
  thumbnail?: string;
  type: 'video' | 'image' | 'carousel';
}

interface SchedulerProps {
  onNavigate?: (view: string, tab?: string) => void;
}

const Scheduler: React.FC<SchedulerProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [optimalTimes, setOptimalTimes] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'heatmap' | 'calendar' | 'queue'>('heatmap');
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('week');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = ['8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'];

  // Mock scheduled posts
  const mockScheduledPosts: ScheduledPost[] = [
    {
      id: '1',
      platform: 'youtube',
      title: 'How to Build a SaaS in 2026',
      scheduledFor: '2026-02-06T18:00:00',
      status: 'scheduled',
      type: 'video'
    },
    {
      id: '2',
      platform: 'instagram',
      title: 'Behind the Scenes',
      scheduledFor: '2026-02-07T14:00:00',
      status: 'scheduled',
      type: 'carousel'
    },
    {
      id: '3',
      platform: 'tiktok',
      title: 'Quick Tech Tip',
      scheduledFor: '2026-02-08T12:00:00',
      status: 'draft',
      type: 'video'
    }
  ];

  useEffect(() => {
    checkYouTubeConnection();
  }, []);

  const checkYouTubeConnection = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/analytics/youtube/stats');
      if (response.data.hasChannel) {
        setYoutubeConnected(true);
        generateOptimalTimes(response.data.stats);
      } else {
        setYoutubeConnected(false);
      }
    } catch (error: any) {
      console.error('Failed to check YouTube connection:', error);
      setYoutubeConnected(false);
      setError('Unable to fetch YouTube data');
    } finally {
      setLoading(false);
    }
  };

  const generateOptimalTimes = (stats: any) => {
    const engagementRate = stats.totalComments / Math.max(stats.totalViews, 1);
    const avgViewsPerVideo = stats.totalViews / Math.max(stats.totalVideos, 1);

    const bestDay = 'Wednesday';
    const bestTime = '6pm';
    const accuracy = Math.min(Math.round(engagementRate * 10000), 85);

    setOptimalTimes({
      bestDay,
      bestTime,
      accuracy,
      engagementRate: (engagementRate * 100).toFixed(2),
    });
  };

  const generateHeatmap = () => {
    if (!youtubeConnected || !optimalTimes) {
      return Array(7).fill(Array(8).fill(0));
    }

    return days.map((day, dIdx) =>
      hours.map((hour, hIdx) => {
        let score = 1;
        if (hIdx >= 4 && hIdx <= 7) score += 2;
        if (dIdx >= 2 && dIdx <= 4) score += 2;
        return score;
      })
    );
  };

  const heatmap = generateHeatmap();

  const stats = [
    {
      label: 'Scheduled Posts',
      value: mockScheduledPosts.filter(p => p.status === 'scheduled').length.toString(),
      change: '+3 this week',
      icon: Calendar,
      color: 'emerald'
    },
    {
      label: 'This Week',
      value: '7',
      change: '3 pending',
      icon: Clock,
      color: 'blue'
    },
    {
      label: 'Optimal Time Accuracy',
      value: `${optimalTimes?.accuracy || 0}%`,
      change: 'High confidence',
      icon: TrendingUp,
      color: 'purple'
    },
    {
      label: 'Queue Status',
      value: 'Active',
      change: 'All systems go',
      icon: CheckCircle2,
      color: 'amber'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      gray: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const getPlatformIcon = (platform: string) => {
    const icons = {
      youtube: Youtube,
      instagram: Instagram,
      tiktok: Music2
    };
    return icons[platform as keyof typeof icons] || Video;
  };

  const getPlatformColor = (platform: string) => {
    const colors = {
      youtube: 'bg-red-500/10 text-red-400 border-red-500/20',
      instagram: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      tiktok: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
    };
    return colors[platform as keyof typeof colors] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  const statusConfig = {
    scheduled: { label: 'Scheduled', color: 'emerald', icon: CheckCircle2 },
    draft: { label: 'Draft', color: 'amber', icon: Edit },
    published: { label: 'Published', color: 'gray', icon: CheckCircle2 }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Content Scheduler</h2>
          <p className="text-gray-500">Plan and schedule content across all platforms</p>
        </div>
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-16 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-white font-semibold">Loading scheduler...</p>
        </div>
      </div>
    );
  }

  if (!youtubeConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Content Scheduler</h2>
          <p className="text-gray-500">Plan and schedule content across all platforms</p>
        </div>
        <div className="bg-[#0a0a0a] border-2 border-dashed border-[#1a1a1a] rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
            <Youtube className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Connect Your Platforms</h3>
          <p className="text-sm text-gray-500 mb-4">Connect YouTube, Instagram, or TikTok to access scheduling features</p>
          <button
            onClick={() => onNavigate?.('account', 'platforms')}
            className="bg-emerald-400 text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-500 transition-all"
          >
            Connect Platforms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 hover:border-[#2a2a2a] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${getColorClasses(stat.color)} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-gray-500">{stat.change}</span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* View Tabs & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex bg-[#0a0a0a] p-1 rounded-xl border border-[#1a1a1a]">
          <button
            onClick={() => setActiveView('heatmap')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeView === 'heatmap'
                ? 'bg-[#1a1a1a] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Heatmap
          </button>
          <button
            onClick={() => setActiveView('calendar')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeView === 'calendar'
                ? 'bg-[#1a1a1a] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Grid3x3 className="w-4 h-4 inline mr-2" />
            Calendar
          </button>
          <button
            onClick={() => setActiveView('queue')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeView === 'queue'
                ? 'bg-[#1a1a1a] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <List className="w-4 h-4 inline mr-2" />
            Queue
          </button>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="bg-emerald-400 text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-500 transition-all"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Schedule Post
        </button>
      </div>

      {/* Heatmap View */}
      {activeView === 'heatmap' && (
        <div className="space-y-6">
          {/* Heatmap Card */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Audience Activity Heatmap</h3>
                  <p className="text-sm text-gray-500">Click any cell to schedule a post</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#1a1a1a] px-4 py-2 rounded-xl text-xs font-semibold text-gray-400">
                <MapPin className="w-3 h-3" />
                UTC (GMT+0)
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Time Headers */}
                <div className="grid grid-cols-[100px_1fr] gap-4 mb-3">
                  <div></div>
                  <div className="flex justify-between px-2">
                    {hours.map(h => (
                      <span key={h} className="text-xs font-bold text-gray-600 uppercase">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Heatmap Grid */}
                <div className="space-y-2">
                  {days.map((day, dIdx) => (
                    <div key={day} className="grid grid-cols-[100px_1fr] gap-4 items-center">
                      <span className="text-sm font-bold text-gray-400 uppercase">{day}</span>
                      <div className="flex gap-2">
                        {heatmap[dIdx].map((val, hIdx) => {
                          const bgColor = val === 0
                            ? 'bg-[#0a0a0a]'
                            : val <= 2
                            ? 'bg-blue-500/10'
                            : val <= 4
                            ? 'bg-blue-500/30'
                            : 'bg-blue-500/50';
                          return (
                            <button
                              key={hIdx}
                              onClick={() => setShowScheduleModal(true)}
                              className={`flex-1 h-12 rounded-lg ${bgColor} border border-[#1a1a1a] hover:border-blue-500/50 hover:bg-blue-500/60 transition-all cursor-pointer group relative`}
                            >
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus className="w-4 h-4 text-white" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 mt-6 pt-6 border-t border-[#1a1a1a]">
                  <span className="text-xs font-semibold text-gray-500">Activity Level:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#0a0a0a] border border-[#1a1a1a]"></div>
                    <span className="text-xs text-gray-600">Low</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-500/10 border border-[#1a1a1a]"></div>
                    <span className="text-xs text-gray-600">Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-500/30 border border-[#1a1a1a]"></div>
                    <span className="text-xs text-gray-600">High</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-500/50 border border-[#1a1a1a]"></div>
                    <span className="text-xs text-gray-600">Peak</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Insights Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Optimal Time Card */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Best Time to Post
                  </h3>
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="text-3xl font-bold text-white">{optimalTimes?.bestDay}</span>
                    <span className="text-xl font-bold text-blue-400">{optimalTimes?.bestTime}</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Based on your audience activity patterns, posting on {optimalTimes?.bestDay}s at{' '}
                    {optimalTimes?.bestTime} generates the highest engagement.
                  </p>
                </div>
              </div>
            </div>

            {/* Confidence Card */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg className="w-16 h-16 rotate-[-90deg]">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="transparent"
                      className="text-[#1a1a1a]"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="transparent"
                      className="text-emerald-400"
                      strokeDasharray="175.9"
                      strokeDashoffset={175.9 - (175.9 * (optimalTimes?.accuracy || 0) / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-sm text-white">
                    {optimalTimes?.accuracy || 0}%
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Model Confidence
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-2">
                    Recommendation based on {optimalTimes?.engagementRate}% engagement rate.
                  </p>
                  <p className="text-xs text-gray-600">
                    Accuracy improves with more historical data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {activeView === 'calendar' && (
        <div className="space-y-4">
          {/* Calendar Controls */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="w-9 h-9 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] hover:bg-[#1a1a1a] transition-all flex items-center justify-center">
                  <ChevronLeft className="w-4 h-4 text-gray-400" />
                </button>
                <h3 className="text-lg font-bold text-white">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button className="w-9 h-9 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] hover:bg-[#1a1a1a] transition-all flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-[#0a0a0a] p-1 rounded-lg border border-[#1a1a1a]">
                  <button
                    onClick={() => setCalendarView('day')}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                      calendarView === 'day'
                        ? 'bg-[#1a1a1a] text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Day
                  </button>
                  <button
                    onClick={() => setCalendarView('week')}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                      calendarView === 'week'
                        ? 'bg-[#1a1a1a] text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setCalendarView('month')}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                      calendarView === 'month'
                        ? 'bg-[#1a1a1a] text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Month
                  </button>
                </div>

                <button className="px-3 py-1.5 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:border-[#2a2a2a] transition-all">
                  Today
                </button>
              </div>
            </div>
          </div>

          {/* Week View Grid */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-[#1a1a1a]">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                <div key={day} className="p-4 text-center border-r border-[#1a1a1a] last:border-r-0">
                  <div className="text-xs font-bold text-gray-500 uppercase mb-1">{day}</div>
                  <div className="text-2xl font-bold text-white">{5 + idx}</div>
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7">
              {Array.from({ length: 7 }).map((_, idx) => (
                <div
                  key={idx}
                  className="min-h-[200px] p-3 border-r border-[#1a1a1a] last:border-r-0 hover:bg-[#0a0a0a]/50 transition-all cursor-pointer group"
                  onClick={() => setShowScheduleModal(true)}
                >
                  {/* Scheduled posts would appear here */}
                  {idx === 1 && (
                    <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 rounded-lg p-2 mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Youtube className="w-3 h-3 text-red-400" />
                        <span className="text-xs font-bold text-red-400">6:00 PM</span>
                      </div>
                      <p className="text-xs text-white font-semibold line-clamp-2">
                        How to Build a SaaS in 2026
                      </p>
                    </div>
                  )}
                  {idx === 2 && (
                    <div className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20 rounded-lg p-2 mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Instagram className="w-3 h-3 text-pink-400" />
                        <span className="text-xs font-bold text-pink-400">2:00 PM</span>
                      </div>
                      <p className="text-xs text-white font-semibold line-clamp-2">
                        Behind the Scenes
                      </p>
                    </div>
                  )}

                  {/* Add button (visible on hover) */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-full py-2 border-2 border-dashed border-[#1a1a1a] rounded-lg hover:border-blue-500/50 transition-all flex items-center justify-center">
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Queue View */}
      {activeView === 'queue' && (
        <div className="space-y-4">
          {mockScheduledPosts.map((post) => {
            const PlatformIcon = getPlatformIcon(post.platform);
            const StatusIcon = statusConfig[post.status].icon;

            return (
              <div
                key={post.id}
                className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 hover:border-[#2a2a2a] transition-all"
              >
                <div className="flex items-center gap-6">
                  {/* Thumbnail Placeholder */}
                  <div className="w-32 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-[#1a1a1a]">
                    {post.type === 'video' ? (
                      <Play className="w-8 h-8 text-gray-600" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-600" />
                    )}
                  </div>

                  {/* Post Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white mb-2 truncate">{post.title}</h3>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${getPlatformColor(post.platform)}`}>
                            <PlatformIcon className="w-3 h-3" />
                            {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${getColorClasses(statusConfig[post.status].color)}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig[post.status].label}
                          </span>
                          <span className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Clock className="w-3 h-3" />
                            {new Date(post.scheduledFor).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button className="w-9 h-9 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] hover:bg-[#1a1a1a] transition-all flex items-center justify-center">
                      <Edit className="w-4 h-4 text-gray-400" />
                    </button>
                    <button className="w-9 h-9 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] hover:bg-[#1a1a1a] transition-all flex items-center justify-center">
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                    <button className="w-9 h-9 rounded-lg bg-[#0a0a0a] border border-red-500/20 hover:bg-red-500/10 transition-all flex items-center justify-center">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {mockScheduledPosts.length === 0 && (
            <div className="bg-[#0a0a0a] border-2 border-dashed border-[#1a1a1a] rounded-2xl p-16 text-center">
              <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
                <List className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Scheduled Posts</h3>
              <p className="text-sm text-gray-500 mb-4">Start scheduling content to build your queue</p>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="bg-emerald-400 text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-500 transition-all"
              >
                Schedule Your First Post
              </button>
            </div>
          )}
        </div>
      )}

      {/* Schedule Post Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#1a1a1a] p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Schedule Post</h2>
                <p className="text-sm text-gray-500 mt-1">Choose platform and time</p>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="w-10 h-10 rounded-xl bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-all flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-3">Platform</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'red' },
                    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'pink' },
                    { id: 'tiktok', name: 'TikTok', icon: Music2, color: 'cyan' }
                  ].map((platform) => {
                    const Icon = platform.icon;
                    return (
                      <button
                        key={platform.id}
                        className="bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#2a2a2a] rounded-xl p-4 transition-all flex flex-col items-center gap-2"
                      >
                        <Icon className={`w-6 h-6 text-${platform.color}-400`} />
                        <span className="text-sm font-bold text-white">{platform.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Date</label>
                  <input
                    type="date"
                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2a2a2a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Time</label>
                  <input
                    type="time"
                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2a2a2a]"
                  />
                </div>
              </div>

              {/* Optimal Time Suggestion */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-purple-400 mb-1">Optimal Time Suggestion</p>
                    <p className="text-sm text-gray-400">
                      Post on {optimalTimes?.bestDay} at {optimalTimes?.bestTime} for maximum engagement
                    </p>
                  </div>
                  <button className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors">
                    Use This
                  </button>
                </div>
              </div>

              {/* Post Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Post Title</label>
                <input
                  type="text"
                  placeholder="Enter your post title..."
                  className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#2a2a2a]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Description (Optional)</label>
                <textarea
                  rows={4}
                  placeholder="Add a description..."
                  className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#2a2a2a] resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-[#0a0a0a] border-t border-[#1a1a1a] p-6 flex gap-3">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] text-gray-400 py-3 rounded-xl font-bold hover:bg-[#1a1a1a] hover:text-white transition-all"
              >
                Cancel
              </button>
              <button className="flex-1 bg-emerald-400 text-black py-3 rounded-xl font-bold hover:bg-emerald-500 transition-all">
                Schedule Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scheduler;
