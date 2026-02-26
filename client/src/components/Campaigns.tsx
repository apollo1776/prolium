import React, { useState } from 'react';
import {
  Plus, Calendar, Target, TrendingUp, Users, Eye, Heart,
  MessageCircle, Share2, ChevronDown, Filter, Search,
  MoreVertical, Edit, Trash2, Copy, BarChart3, Clock,
  CheckCircle2, AlertCircle, Pause, Play, Settings,
  Zap, Sparkles, Instagram, Youtube, Film, Hash
} from 'lucide-react';

const Campaigns: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'scheduled' | 'completed'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock campaigns data
  const campaigns = [
    {
      id: 1,
      name: 'Product Launch 2026',
      status: 'active',
      platform: 'multi',
      startDate: '2026-02-01',
      endDate: '2026-02-15',
      budget: 5000,
      reach: 45230,
      engagement: 3420,
      posts: 12,
      progress: 65,
      platforms: ['youtube', 'instagram', 'tiktok'],
      objective: 'awareness',
      color: 'purple'
    },
    {
      id: 2,
      name: 'Valentine\'s Day Special',
      status: 'scheduled',
      platform: 'instagram',
      startDate: '2026-02-10',
      endDate: '2026-02-14',
      budget: 2500,
      reach: 0,
      engagement: 0,
      posts: 8,
      progress: 0,
      platforms: ['instagram'],
      objective: 'engagement',
      color: 'pink'
    },
    {
      id: 3,
      name: 'Tutorial Series Q1',
      status: 'active',
      platform: 'youtube',
      startDate: '2026-01-15',
      endDate: '2026-03-31',
      budget: 3000,
      reach: 89450,
      engagement: 12340,
      posts: 6,
      progress: 40,
      platforms: ['youtube'],
      objective: 'conversion',
      color: 'blue'
    },
  ];

  const stats = [
    {
      label: 'Active Campaigns',
      value: campaigns.filter(c => c.status === 'active').length.toString(),
      change: '+2',
      icon: Zap,
      color: 'emerald',
      trend: 'up'
    },
    {
      label: 'Total Reach',
      value: '134.7K',
      change: '+12%',
      icon: Eye,
      color: 'blue',
      trend: 'up'
    },
    {
      label: 'Engagement Rate',
      value: '8.2%',
      change: '+1.4%',
      icon: Heart,
      color: 'rose',
      trend: 'up'
    },
    {
      label: 'Scheduled Posts',
      value: '24',
      change: '6 today',
      icon: Calendar,
      color: 'purple',
      trend: 'neutral'
    },
  ];

  const platformIcons: any = {
    youtube: Youtube,
    instagram: Instagram,
    tiktok: Film,
  };

  const statusConfig: any = {
    active: { label: 'Active', color: 'emerald', icon: CheckCircle2 },
    scheduled: { label: 'Scheduled', color: 'blue', icon: Clock },
    completed: { label: 'Completed', color: 'gray', icon: CheckCircle2 },
    paused: { label: 'Paused', color: 'amber', icon: Pause },
  };

  const objectiveConfig: any = {
    awareness: { label: 'Brand Awareness', icon: Target, color: 'purple' },
    engagement: { label: 'Engagement', icon: Heart, color: 'pink' },
    conversion: { label: 'Conversions', icon: TrendingUp, color: 'blue' },
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    filterStatus === 'all' || campaign.status === filterStatus
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Campaigns</h1>
            </div>
            <p className="text-gray-400 text-sm ml-14">Manage and track your social media campaigns</p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 hover:border-[#2a2a2a] transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/20`}>
                  <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                </div>
                {stat.trend === 'up' && (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.change}
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2 p-1 bg-[#0a0a0a] rounded-xl border border-[#1a1a1a]">
            {['all', 'active', 'scheduled', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                  filterStatus === status
                    ? 'bg-[#1a1a1a] text-white shadow-lg'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search campaigns..."
              className="pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
            />
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <button className="p-2 bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-[#1a1a1a] rounded-lg text-gray-400 hover:text-white transition-all">
            <Filter className="w-4 h-4" />
          </button>
          <button className="p-2 bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-[#1a1a1a] rounded-lg text-gray-400 hover:text-white transition-all">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Campaigns Grid */}
      {filteredCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => {
            const StatusIcon = statusConfig[campaign.status].icon;
            const ObjectiveIcon = objectiveConfig[campaign.objective].icon;

            return (
              <div
                key={campaign.id}
                className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden hover:border-[#2a2a2a] transition-all group"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-[#1a1a1a]">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                        {campaign.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold bg-${statusConfig[campaign.status].color}-500/10 text-${statusConfig[campaign.status].color}-400 border border-${statusConfig[campaign.status].color}-500/20 flex items-center gap-1.5`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[campaign.status].label}
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium bg-${objectiveConfig[campaign.objective].color}-500/10 text-${objectiveConfig[campaign.objective].color}-400 border border-${objectiveConfig[campaign.objective].color}-500/20`}>
                          {objectiveConfig[campaign.objective].label}
                        </span>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-[#1a1a1a] rounded-lg text-gray-500 hover:text-white transition-all">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Platforms */}
                  <div className="flex items-center gap-2">
                    {campaign.platforms.map((platform) => {
                      const PlatformIcon = platformIcons[platform];
                      return (
                        <div
                          key={platform}
                          className="p-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg"
                        >
                          <PlatformIcon className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      );
                    })}
                    <span className="text-xs text-gray-500 ml-1">{campaign.posts} posts</span>
                  </div>
                </div>

                {/* Progress */}
                {campaign.status === 'active' && (
                  <div className="px-5 py-3 bg-black/40 border-b border-[#1a1a1a]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Campaign Progress</span>
                      <span className="text-xs font-semibold text-white">{campaign.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                        style={{ width: `${campaign.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Metrics */}
                <div className="p-5">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Eye className="w-3 h-3 text-blue-400" />
                        <span className="text-xs text-gray-500">Reach</span>
                      </div>
                      <div className="text-base font-bold text-white">
                        {campaign.reach > 0 ? (campaign.reach / 1000).toFixed(1) + 'K' : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Heart className="w-3 h-3 text-rose-400" />
                        <span className="text-xs text-gray-500">Engage</span>
                      </div>
                      <div className="text-base font-bold text-white">
                        {campaign.engagement > 0 ? (campaign.engagement / 1000).toFixed(1) + 'K' : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs text-gray-500">Rate</span>
                      </div>
                      <div className="text-base font-bold text-white">
                        {campaign.engagement > 0 ? ((campaign.engagement / campaign.reach) * 100).toFixed(1) + '%' : '-'}
                      </div>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(campaign.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(campaign.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 px-3 bg-black/60 hover:bg-[#1a1a1a] border border-[#1a1a1a] rounded-lg text-xs font-medium text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5" />
                      Analytics
                    </button>
                    <button className="flex-1 py-2 px-3 bg-black/60 hover:bg-[#1a1a1a] border border-[#1a1a1a] rounded-lg text-xs font-medium text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2">
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
              <Target className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No campaigns yet</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Start organizing your content strategy by creating your first campaign. Group related posts, track performance, and optimize your social media presence.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:scale-[1.02] inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Your First Campaign
            </button>
            <div className="mt-10 grid grid-cols-3 gap-4">
              <div className="p-4 bg-black/40 rounded-xl border border-[#1a1a1a]">
                <div className="text-2xl mb-2">🎯</div>
                <div className="text-xs text-gray-500">Set Goals</div>
              </div>
              <div className="p-4 bg-black/40 rounded-xl border border-[#1a1a1a]">
                <div className="text-2xl mb-2">📊</div>
                <div className="text-xs text-gray-500">Track Results</div>
              </div>
              <div className="p-4 bg-black/40 rounded-xl border border-[#1a1a1a]">
                <div className="text-2xl mb-2">🚀</div>
                <div className="text-xs text-gray-500">Optimize</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
              <div>
                <h2 className="text-xl font-bold text-white">Create New Campaign</h2>
                <p className="text-sm text-gray-400 mt-1">Define your campaign goals and settings</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-[#1a1a1a] rounded-lg text-gray-400 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Campaign Name */}
              <div>
                <label className="text-sm font-semibold text-white mb-2 block">Campaign Name</label>
                <input
                  type="text"
                  placeholder="e.g., Product Launch Q1 2026"
                  className="w-full px-4 py-3 bg-black/50 border border-[#1a1a1a] rounded-xl text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Objective */}
              <div>
                <label className="text-sm font-semibold text-white mb-3 block">Campaign Objective</label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(objectiveConfig).map(([key, config]: [string, any]) => (
                    <button
                      key={key}
                      className="p-4 bg-black/50 hover:bg-purple-500/10 border border-[#1a1a1a] hover:border-purple-500/30 rounded-xl text-left transition-all group"
                    >
                      <config.icon className={`w-5 h-5 text-${config.color}-400 mb-2`} />
                      <div className="text-sm font-semibold text-gray-300 group-hover:text-white">
                        {config.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Platforms */}
              <div>
                <label className="text-sm font-semibold text-white mb-3 block">Select Platforms</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'red' },
                    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'pink' },
                    { id: 'tiktok', name: 'TikTok', icon: Film, color: 'cyan' },
                  ].map((platform) => (
                    <button
                      key={platform.id}
                      className="p-4 bg-black/50 hover:bg-blue-500/10 border border-[#1a1a1a] hover:border-blue-500/30 rounded-xl transition-all group flex items-center gap-3"
                    >
                      <platform.icon className="w-5 h-5 text-gray-400 group-hover:text-blue-400" />
                      <span className="text-sm font-medium text-gray-400 group-hover:text-white">
                        {platform.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-white mb-2 block">Start Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-black/50 border border-[#1a1a1a] rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-white mb-2 block">End Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-black/50 border border-[#1a1a1a] rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="text-sm font-semibold text-white mb-2 block">Budget (Optional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 bg-black/50 border border-[#1a1a1a] rounded-xl text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#1a1a1a] flex items-center justify-end gap-3 sticky bottom-0 bg-[#0a0a0a]">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white font-medium text-sm transition-all"
              >
                Cancel
              </button>
              <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]">
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
