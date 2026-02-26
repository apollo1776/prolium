
import React, { useState, useEffect } from 'react';
import { MOCK_CREATORS, MOCK_USER_PROFILE } from '../services/mockData';
import { getBrandRecommendations } from '../services/geminiService';
import {
  Users,
  Building2,
  ExternalLink,
  Sparkles,
  DollarSign,
  Loader2,
  Search,
  UserCircle,
  Filter,
  SlidersHorizontal,
  TrendingUp,
  CheckCircle2,
  Clock,
  MessageSquare,
  Star,
  Briefcase,
  Target,
  Award,
  ArrowUpRight,
  Mail,
  Calendar,
  BarChart3,
  Plus,
  X
} from 'lucide-react';

interface PartnershipStats {
  label: string;
  value: string;
  change: string;
  icon: any;
  color: 'emerald' | 'blue' | 'purple' | 'amber';
}

interface CollaborationStatus {
  id: string;
  name: string;
  partner: string;
  type: 'creator' | 'brand';
  status: 'active' | 'pending' | 'completed';
  revenue: string;
  startDate: string;
  endDate?: string;
  platform: string[];
}

const Collaborations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'discover' | 'active' | 'history'>('discover');
  const [discoverView, setDiscoverView] = useState<'creators' | 'brands'>('creators');
  const [brands, setBrands] = useState<any[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);

  useEffect(() => {
    if (discoverView === 'brands' && brands.length === 0 && MOCK_USER_PROFILE.followers > 0) {
      fetchBrands();
    }
  }, [discoverView]);

  const fetchBrands = async () => {
    setLoadingBrands(true);
    try {
      const result = await getBrandRecommendations(MOCK_USER_PROFILE.niche, MOCK_USER_PROFILE.followers);
      setBrands(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBrands(false);
    }
  };

  // Mock collaboration data
  const mockCollaborations: CollaborationStatus[] = [
    {
      id: '1',
      name: 'Summer Campaign',
      partner: 'TechBrand Co.',
      type: 'brand',
      status: 'active',
      revenue: '$5,200',
      startDate: '2026-01-15',
      endDate: '2026-03-15',
      platform: ['YouTube', 'Instagram']
    },
    {
      id: '2',
      name: 'Collab Video Series',
      partner: '@CreatorName',
      type: 'creator',
      status: 'active',
      revenue: '$0',
      startDate: '2026-01-20',
      platform: ['YouTube']
    },
    {
      id: '3',
      name: 'Product Review',
      partner: 'FashionBrand Inc.',
      type: 'brand',
      status: 'completed',
      revenue: '$2,800',
      startDate: '2025-12-01',
      endDate: '2025-12-31',
      platform: ['Instagram', 'TikTok']
    }
  ];

  const stats: PartnershipStats[] = [
    {
      label: 'Active Partnerships',
      value: mockCollaborations.filter(c => c.status === 'active').length.toString(),
      change: '+1 this month',
      icon: Users,
      color: 'emerald'
    },
    {
      label: 'Total Revenue',
      value: '$8.0K',
      change: '+24%',
      icon: DollarSign,
      color: 'blue'
    },
    {
      label: 'Avg. Deal Value',
      value: '$2.7K',
      change: '+8%',
      icon: TrendingUp,
      color: 'purple'
    },
    {
      label: 'Match Score',
      value: '94%',
      change: 'Excellent',
      icon: Award,
      color: 'amber'
    }
  ];

  const statusConfig = {
    active: { label: 'Active', color: 'emerald', icon: CheckCircle2 },
    pending: { label: 'Pending', color: 'amber', icon: Clock },
    completed: { label: 'Completed', color: 'gray', icon: CheckCircle2 }
  };

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

  const handleContactPartner = (partner: any) => {
    setSelectedPartner(partner);
    setShowContactModal(true);
  };

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

      {/* Main Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex bg-[#0a0a0a] p-1 rounded-xl border border-[#1a1a1a]">
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'discover'
                ? 'bg-[#1a1a1a] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            Discover
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'active'
                ? 'bg-[#1a1a1a] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 inline mr-2" />
            Active
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-[#1a1a1a] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            History
          </button>
        </div>

        {activeTab === 'discover' && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:border-[#2a2a2a] transition-all"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        )}
      </div>

      {/* Discover Tab Content */}
      {activeTab === 'discover' && (
        <div className="space-y-6">
          {/* Creator/Brand Toggle & Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex bg-[#0a0a0a] p-1 rounded-xl border border-[#1a1a1a]">
              <button
                onClick={() => setDiscoverView('creators')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  discoverView === 'creators'
                    ? 'bg-[#1a1a1a] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Creators
              </button>
              <button
                onClick={() => setDiscoverView('brands')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  discoverView === 'brands'
                    ? 'bg-[#1a1a1a] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4 inline mr-2" />
                Brands
              </button>
            </div>

            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder={`Search ${discoverView}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#2a2a2a]"
              />
            </div>
          </div>

          {/* Creators Grid */}
          {discoverView === 'creators' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {MOCK_CREATORS.length > 0 ? MOCK_CREATORS.map((creator) => (
                <div
                  key={creator.id}
                  className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden hover:border-[#2a2a2a] transition-all group"
                >
                  {/* Card Header with Banner */}
                  <div className="relative h-24 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10">
                    <div className="absolute -bottom-8 left-6">
                      <div className="w-16 h-16 rounded-xl bg-[#0a0a0a] border-2 border-[#1a1a1a] flex items-center justify-center overflow-hidden">
                        <UserCircle className="w-10 h-10 text-gray-600" />
                      </div>
                    </div>
                    <div className="absolute top-3 right-3">
                      <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-emerald-400" />
                        95% Match
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="pt-10 p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                        {creator.name}
                      </h3>
                      <p className="text-sm text-gray-500">{creator.handle}</p>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-2 text-center">
                        <div className="text-xs text-gray-500 mb-0.5">Followers</div>
                        <div className="text-sm font-bold text-white">
                          {creator.followers ? `${(creator.followers / 1000).toFixed(0)}K` : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-2 text-center">
                        <div className="text-xs text-gray-500 mb-0.5">Eng. Rate</div>
                        <div className="text-sm font-bold text-white">
                          {creator.engagementRate || '5.2%'}
                        </div>
                      </div>
                      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-2 text-center">
                        <div className="text-xs text-gray-500 mb-0.5">Niche</div>
                        <div className="text-sm font-bold text-white">Tech</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleContactPartner(creator)}
                        className="flex-1 bg-emerald-400 text-black py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-500 transition-all"
                      >
                        <Mail className="w-4 h-4 inline mr-1.5" />
                        Contact
                      </button>
                      <button className="px-3 py-2.5 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl hover:bg-[#1a1a1a] transition-all">
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-full bg-[#0a0a0a] border-2 border-dashed border-[#1a1a1a] rounded-2xl p-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">No Creators Found</h3>
                  <p className="text-sm text-gray-500">Connect your accounts to discover potential partners</p>
                </div>
              )}
            </div>
          )}

          {/* Brands List */}
          {discoverView === 'brands' && (
            <div className="space-y-4">
              {loadingBrands ? (
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-16 text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Analyzing Opportunities...</h3>
                  <p className="text-sm text-gray-500">Matching your profile with premium brands</p>
                </div>
              ) : brands.length > 0 ? (
                brands.map((brand, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 hover:border-[#2a2a2a] transition-all"
                  >
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Brand Logo */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center border border-[#1a1a1a]">
                          <Building2 className="w-10 h-10 text-blue-400" />
                        </div>
                      </div>

                      {/* Brand Info */}
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">{brand.brandName}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Briefcase className="w-3 h-3" />
                              {brand.industry}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl">
                              <div className="text-xs font-semibold mb-0.5">Est. Value</div>
                              <div className="text-lg font-bold">{brand.estimatedValue}</div>
                            </div>
                            <div className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-4 py-2 rounded-xl text-center">
                              <div className="text-xs font-semibold mb-0.5">Match</div>
                              <div className="text-lg font-bold">92%</div>
                            </div>
                          </div>
                        </div>

                        {/* Reasoning */}
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4">
                          <div className="flex items-start gap-2 mb-2">
                            <Target className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Why This Match</span>
                          </div>
                          <p className="text-sm text-gray-400 leading-relaxed">
                            {brand.reasoning}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => handleContactPartner(brand)}
                            className="bg-emerald-400 text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-500 transition-all"
                          >
                            <Mail className="w-4 h-4 inline mr-2" />
                            Draft Proposal
                          </button>
                          <button className="bg-[#0a0a0a] border border-[#1a1a1a] text-gray-400 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#1a1a1a] hover:text-white transition-all">
                            <ExternalLink className="w-4 h-4 inline mr-2" />
                            View Details
                          </button>
                          <button className="bg-[#0a0a0a] border border-[#1a1a1a] text-gray-400 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#1a1a1a] hover:text-white transition-all">
                            <BarChart3 className="w-4 h-4 inline mr-2" />
                            Analytics
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-[#0a0a0a] border-2 border-dashed border-[#1a1a1a] rounded-2xl p-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">No Brand Matches Yet</h3>
                  <p className="text-sm text-gray-500 mb-4">Connect your accounts to unlock sponsorship opportunities</p>
                  <button className="bg-emerald-400 text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-500 transition-all">
                    Connect Accounts
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Active Collaborations Tab */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {mockCollaborations.filter(c => c.status === 'active').map((collab) => {
            const StatusIcon = statusConfig[collab.status].icon;
            return (
              <div
                key={collab.id}
                className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 hover:border-[#2a2a2a] transition-all"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Partner Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-2xl flex items-center justify-center border border-[#1a1a1a]">
                      {collab.type === 'brand' ? (
                        <Building2 className="w-8 h-8 text-emerald-400" />
                      ) : (
                        <Users className="w-8 h-8 text-blue-400" />
                      )}
                    </div>
                  </div>

                  {/* Collaboration Details */}
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-white">{collab.name}</h3>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${getColorClasses(statusConfig[collab.status].color)}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig[collab.status].label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">with {collab.partner}</p>
                      </div>
                      <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl text-center">
                        <div className="text-xs font-semibold mb-0.5">Revenue</div>
                        <div className="text-lg font-bold">{collab.revenue}</div>
                      </div>
                    </div>

                    {/* Metrics Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <Calendar className="w-3 h-3" />
                          Started
                        </div>
                        <div className="text-sm font-bold text-white">
                          {new Date(collab.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      {collab.endDate && (
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <Calendar className="w-3 h-3" />
                            Ends
                          </div>
                          <div className="text-sm font-bold text-white">
                            {new Date(collab.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      )}
                      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <Target className="w-3 h-3" />
                          Platforms
                        </div>
                        <div className="text-sm font-bold text-white">{collab.platform.length}</div>
                      </div>
                      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <BarChart3 className="w-3 h-3" />
                          Progress
                        </div>
                        <div className="text-sm font-bold text-white">65%</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Campaign Progress</span>
                        <span className="text-gray-400 font-bold">65%</span>
                      </div>
                      <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500" style={{ width: '65%' }} />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <button className="bg-[#0a0a0a] border border-[#1a1a1a] text-gray-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#1a1a1a] hover:text-white transition-all">
                        <MessageSquare className="w-4 h-4 inline mr-2" />
                        Messages
                      </button>
                      <button className="bg-[#0a0a0a] border border-[#1a1a1a] text-gray-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#1a1a1a] hover:text-white transition-all">
                        <BarChart3 className="w-4 h-4 inline mr-2" />
                        View Analytics
                      </button>
                      <button className="bg-[#0a0a0a] border border-[#1a1a1a] text-gray-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#1a1a1a] hover:text-white transition-all">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Schedule
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {mockCollaborations.filter(c => c.status === 'active').length === 0 && (
            <div className="bg-[#0a0a0a] border-2 border-dashed border-[#1a1a1a] rounded-2xl p-16 text-center">
              <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Active Collaborations</h3>
              <p className="text-sm text-gray-500 mb-4">Start discovering partners to create your first collaboration</p>
              <button
                onClick={() => setActiveTab('discover')}
                className="bg-emerald-400 text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-500 transition-all"
              >
                Discover Partners
              </button>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {mockCollaborations.filter(c => c.status === 'completed').map((collab) => {
            const StatusIcon = statusConfig[collab.status].icon;
            return (
              <div
                key={collab.id}
                className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 hover:border-[#2a2a2a] transition-all"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-gray-500/10 to-gray-600/10 rounded-xl flex items-center justify-center border border-[#1a1a1a]">
                        {collab.type === 'brand' ? (
                          <Building2 className="w-7 h-7 text-gray-500" />
                        ) : (
                          <Users className="w-7 h-7 text-gray-500" />
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white">{collab.name}</h3>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${getColorClasses(statusConfig[collab.status].color)}`}>
                          <StatusIcon className="w-3 h-3 inline mr-1" />
                          {statusConfig[collab.status].label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">with {collab.partner}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(collab.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {collab.endDate && ` - ${new Date(collab.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl text-center">
                      <div className="text-xs font-semibold mb-0.5">Revenue</div>
                      <div className="text-lg font-bold">{collab.revenue}</div>
                    </div>
                    <button className="px-4 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl hover:bg-[#1a1a1a] transition-all">
                      <BarChart3 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {mockCollaborations.filter(c => c.status === 'completed').length === 0 && (
            <div className="bg-[#0a0a0a] border-2 border-dashed border-[#1a1a1a] rounded-2xl p-16 text-center">
              <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Collaboration History</h3>
              <p className="text-sm text-gray-500">Completed collaborations will appear here</p>
            </div>
          )}
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && selectedPartner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#1a1a1a] p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedPartner.brandName ? 'Send Proposal' : 'Contact Creator'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedPartner.brandName || selectedPartner.name}
                </p>
              </div>
              <button
                onClick={() => setShowContactModal(false)}
                className="w-10 h-10 rounded-xl bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-all flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Subject</label>
                <input
                  type="text"
                  placeholder="Collaboration Proposal"
                  className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#2a2a2a]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Message</label>
                <textarea
                  rows={8}
                  placeholder="Write your message here..."
                  className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#2a2a2a] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Proposed Budget (Optional)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="5,000"
                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#2a2a2a]"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-[#0a0a0a] border-t border-[#1a1a1a] p-6 flex gap-3">
              <button
                onClick={() => setShowContactModal(false)}
                className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] text-gray-400 py-3 rounded-xl font-bold hover:bg-[#1a1a1a] hover:text-white transition-all"
              >
                Cancel
              </button>
              <button className="flex-1 bg-emerald-400 text-black py-3 rounded-xl font-bold hover:bg-emerald-500 transition-all">
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collaborations;
