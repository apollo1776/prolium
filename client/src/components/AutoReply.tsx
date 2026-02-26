/**
 * Auto-Reply System
 * Complete implementation based on PDF specifications
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Power,
  TrendingUp,
  MessageSquare,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3,
  Video,
  Camera,
  Music2,
  X,
  Save,
  Settings,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../utils/apiClient';

// Types matching the backend Prisma schema
type TriggerType = 'KEYWORD' | 'SEMANTIC' | 'SENTIMENT' | 'QUESTION' | 'MENTION';
type MatchMode = 'EXACT' | 'CONTAINS' | 'STARTS_WITH' | 'REGEX' | 'AI_SIMILARITY';
type ResponseAction = 'REPLY_COMMENT' | 'SEND_DM' | 'SEND_LINK' | 'LOG_ONLY' | 'WEBHOOK';
type Platform = 'YOUTUBE' | 'INSTAGRAM' | 'TIKTOK';

interface AutoReplyRule {
  id: string;
  name: string;
  isActive: boolean;
  triggerType: TriggerType;
  keywords: string[];
  matchMode: MatchMode;
  caseSensitive: boolean;
  aiSimilarityThreshold?: number;
  platforms: Platform[];
  videoIds: string[];
  responseAction: ResponseAction;
  responseTemplate: string;
  customLink?: string;
  attachmentUrl?: string;
  maxResponsesPerDay: number;
  minDelaySeconds: number;
  maxDelaySeconds: number;
  skipNegativeSentiment: boolean;
  skipSpam: boolean;
  onlyVerifiedUsers: boolean;
  minFollowerCount?: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    logs: number;
  };
}

interface ActivityLog {
  id: string;
  ruleId: string;
  platform: Platform;
  videoId: string;
  commentId: string;
  commentText: string;
  commentAuthor: string;
  matchedKeyword?: string;
  aiConfidenceScore?: number;
  sentimentScore?: number;
  responseAction: ResponseAction;
  responseSent: boolean;
  responseText?: string;
  errorMessage?: string;
  triggeredAt: string;
  respondedAt?: string;
  rule?: {
    id: string;
    name: string;
  };
}

interface Stats {
  totalTriggers: number;
  successfulResponses: number;
  responseRate: number;
  topPerformingRules: Array<{
    id: string;
    name: string;
    triggerCount: number;
  }>;
  platformStats: Array<{
    platform: Platform;
    _count: { id: number };
  }>;
  todayTotalResponses: number;
}

const AutoReply: React.FC = () => {
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
  const [activeTab, setActiveTab] = useState<'rules' | 'activity' | 'stats'>('rules');

  // New rule form state
  const [formData, setFormData] = useState({
    name: '',
    triggerType: 'KEYWORD' as TriggerType,
    keywords: '',
    matchMode: 'CONTAINS' as MatchMode,
    caseSensitive: false,
    aiSimilarityThreshold: 0.8,
    platforms: ['YOUTUBE'] as Platform[],
    videoIds: '',
    responseAction: 'REPLY_COMMENT' as ResponseAction,
    responseTemplate: '',
    customLink: '',
    maxResponsesPerDay: 100,
    minDelaySeconds: 30,
    maxDelaySeconds: 120,
    skipNegativeSentiment: true,
    skipSpam: true,
    onlyVerifiedUsers: false,
    minFollowerCount: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadRules(), loadLogs(), loadStats()]);
    } finally {
      setLoading(false);
    }
  };

  const loadRules = async () => {
    try {
      const response = await apiClient.get('/auto-reply/rules');
      setRules(response.data.rules || []);
    } catch (error) {
      console.error('Failed to load rules:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await apiClient.get('/auto-reply/logs?limit=20');
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiClient.get('/auto-reply/stats');
      setStats(response.data.stats || null);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleCreateRule = async () => {
    try {
      const payload = {
        ...formData,
        keywords: formData.keywords.split(',').map((k) => k.trim()).filter(Boolean),
        videoIds: formData.videoIds.split(',').map((v) => v.trim()).filter(Boolean),
        minFollowerCount: formData.minFollowerCount > 0 ? formData.minFollowerCount : null,
      };

      await apiClient.post('/auto-reply/rules', payload);
      await loadRules();
      setShowCreateModal(false);
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create rule');
    }
  };

  const handleUpdateRule = async () => {
    if (!editingRule) return;

    try {
      const payload = {
        ...formData,
        keywords: formData.keywords.split(',').map((k) => k.trim()).filter(Boolean),
        videoIds: formData.videoIds.split(',').map((v) => v.trim()).filter(Boolean),
        minFollowerCount: formData.minFollowerCount > 0 ? formData.minFollowerCount : null,
      };

      await apiClient.put(`/auto-reply/rules/${editingRule.id}`, payload);
      await loadRules();
      setShowEditModal(false);
      setEditingRule(null);
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Delete this rule? This action cannot be undone.')) return;

    try {
      await apiClient.delete(`/auto-reply/rules/${ruleId}`);
      await loadRules();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete rule');
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      await apiClient.post(`/auto-reply/rules/${ruleId}/toggle`);
      await loadRules();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to toggle rule');
    }
  };

  const openEditModal = (rule: AutoReplyRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      triggerType: rule.triggerType,
      keywords: rule.keywords.join(', '),
      matchMode: rule.matchMode,
      caseSensitive: rule.caseSensitive,
      aiSimilarityThreshold: rule.aiSimilarityThreshold || 0.8,
      platforms: rule.platforms,
      videoIds: rule.videoIds.join(', '),
      responseAction: rule.responseAction,
      responseTemplate: rule.responseTemplate,
      customLink: rule.customLink || '',
      maxResponsesPerDay: rule.maxResponsesPerDay,
      minDelaySeconds: rule.minDelaySeconds,
      maxDelaySeconds: rule.maxDelaySeconds,
      skipNegativeSentiment: rule.skipNegativeSentiment,
      skipSpam: rule.skipSpam,
      onlyVerifiedUsers: rule.onlyVerifiedUsers,
      minFollowerCount: rule.minFollowerCount || 0,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      triggerType: 'KEYWORD',
      keywords: '',
      matchMode: 'CONTAINS',
      caseSensitive: false,
      aiSimilarityThreshold: 0.8,
      platforms: ['YOUTUBE'],
      videoIds: '',
      responseAction: 'REPLY_COMMENT',
      responseTemplate: '',
      customLink: '',
      maxResponsesPerDay: 100,
      minDelaySeconds: 30,
      maxDelaySeconds: 120,
      skipNegativeSentiment: true,
      skipSpam: true,
      onlyVerifiedUsers: false,
      minFollowerCount: 0,
    });
  };

  const platformIcons = {
    YOUTUBE: Video,
    INSTAGRAM: Camera,
    TIKTOK: Music2,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">AI Auto-Reply</h2>
          <p className="text-gray-500">Automated comment responses powered by AI</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-black px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Rule
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-black p-6 rounded-2xl border border-[#1a1a1a]">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Zap className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase">Total Triggers</p>
            </div>
            <h3 className="text-3xl font-black text-white">{stats.totalTriggers.toLocaleString()}</h3>
          </div>

          <div className="bg-black p-6 rounded-2xl border border-[#1a1a1a]">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase">Responses Sent</p>
            </div>
            <h3 className="text-3xl font-black text-white">{stats.successfulResponses.toLocaleString()}</h3>
          </div>

          <div className="bg-black p-6 rounded-2xl border border-[#1a1a1a]">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase">Response Rate</p>
            </div>
            <h3 className="text-3xl font-black text-white">{stats.responseRate}%</h3>
          </div>

          <div className="bg-black p-6 rounded-2xl border border-[#1a1a1a]">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-rose-500" />
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase">Today's Responses</p>
            </div>
            <h3 className="text-3xl font-black text-white">{stats.todayTotalResponses.toLocaleString()}</h3>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-black border border-[#1a1a1a] rounded-2xl overflow-hidden">
        <div className="flex border-b border-[#1a1a1a]">
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 px-6 py-4 font-bold text-sm transition-all ${
              activeTab === 'rules'
                ? 'bg-[#1a1a1a] text-white border-b-2 border-emerald-500'
                : 'text-gray-500 hover:text-white hover:bg-[#0a0a0a]'
            }`}
          >
            Rules ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 px-6 py-4 font-bold text-sm transition-all ${
              activeTab === 'activity'
                ? 'bg-[#1a1a1a] text-white border-b-2 border-emerald-500'
                : 'text-gray-500 hover:text-white hover:bg-[#0a0a0a]'
            }`}
          >
            Activity Log
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 px-6 py-4 font-bold text-sm transition-all ${
              activeTab === 'stats'
                ? 'bg-[#1a1a1a] text-white border-b-2 border-emerald-500'
                : 'text-gray-500 hover:text-white hover:bg-[#0a0a0a]'
            }`}
          >
            Statistics
          </button>
        </div>

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="divide-y divide-[#1a1a1a]">
            {rules.length === 0 ? (
              <div className="p-12 text-center">
                <Sparkles className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 font-bold">No auto-reply rules yet</p>
                <p className="text-gray-600 text-xs mt-2">Create your first rule to start automating responses</p>
              </div>
            ) : (
              rules.map((rule) => (
                <div key={rule.id} className="p-6 hover:bg-[#0a0a0a] transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-white">{rule.name}</h4>
                        {rule.isActive ? (
                          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-lg border border-emerald-500/20">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-500/10 text-gray-500 text-xs font-bold rounded-lg border border-gray-500/20">
                            PAUSED
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Settings className="w-3 h-3" />
                          {rule.triggerType}
                        </span>
                        <span>•</span>
                        <span>{rule.keywords.length} keywords</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {rule.platforms.map((platform) => {
                            const Icon = platformIcons[platform];
                            return <Icon key={platform} className="w-3 h-3" />;
                          })}
                          {rule.platforms.length} platforms
                        </span>
                        {rule._count && (
                          <>
                            <span>•</span>
                            <span>{rule._count.logs} triggers</span>
                          </>
                        )}
                      </div>

                      <p className="text-sm text-gray-400 bg-[#0a0a0a] p-3 rounded-lg border border-[#1a1a1a] font-mono">
                        {rule.responseTemplate}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={`p-2 rounded-lg transition-all ${
                          rule.isActive
                            ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                            : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
                        }`}
                        title={rule.isActive ? 'Pause rule' : 'Activate rule'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(rule)}
                        className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-all"
                        title="Edit rule"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg transition-all"
                        title="Delete rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Activity Log Tab */}
        {activeTab === 'activity' && (
          <div className="divide-y divide-[#1a1a1a]">
            {logs.length === 0 ? (
              <div className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 font-bold">No activity yet</p>
                <p className="text-gray-600 text-xs mt-2">Activity will appear here when rules are triggered</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-6 hover:bg-[#0a0a0a] transition-all">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {log.responseSent ? (
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                      ) : log.errorMessage ? (
                        <div className="p-2 bg-rose-500/10 rounded-lg">
                          <XCircle className="w-5 h-5 text-rose-500" />
                        </div>
                      ) : (
                        <div className="p-2 bg-gray-500/10 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-white text-sm">{log.rule?.name || 'Unknown Rule'}</p>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-gray-500">{log.commentAuthor}</span>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-gray-500">
                          {new Date(log.triggeredAt).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-sm text-gray-400 mb-2">{log.commentText}</p>

                      {log.responseText && (
                        <div className="bg-[#0a0a0a] p-3 rounded-lg border border-[#1a1a1a]">
                          <p className="text-xs text-gray-600 mb-1 font-bold uppercase">Response:</p>
                          <p className="text-sm text-gray-300">{log.responseText}</p>
                        </div>
                      )}

                      {log.errorMessage && (
                        <div className="bg-rose-500/5 p-3 rounded-lg border border-rose-500/20">
                          <p className="text-xs text-rose-400">{log.errorMessage}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && stats && (
          <div className="p-8 space-y-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Top Performing Rules</h3>
              <div className="space-y-3">
                {stats.topPerformingRules.map((rule, index) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-xl border border-[#1a1a1a]">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-gray-700">#{index + 1}</span>
                      <span className="font-bold text-white">{rule.name}</span>
                    </div>
                    <span className="text-emerald-500 font-bold">{rule.triggerCount} triggers</span>
                  </div>
                ))}
                {stats.topPerformingRules.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No data yet</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4">Platform Breakdown</h3>
              <div className="grid grid-cols-3 gap-4">
                {stats.platformStats.map((platform) => {
                  const Icon = platformIcons[platform.platform];
                  return (
                    <div key={platform.platform} className="p-6 bg-[#0a0a0a] rounded-xl border border-[#1a1a1a] text-center">
                      <Icon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1">{platform.platform}</p>
                      <p className="text-2xl font-black text-white">{platform._count.id}</p>
                    </div>
                  );
                })}
                {stats.platformStats.length === 0 && (
                  <div className="col-span-3 text-gray-500 text-center py-8">No data yet</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-black border border-[#1a1a1a] rounded-2xl w-full max-w-2xl p-8 my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">
                {showEditModal ? 'Edit Rule' : 'Create New Rule'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setEditingRule(null);
                  resetForm();
                }}
                className="p-2 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* Rule Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Rule Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2a2a2a]"
                  placeholder="e.g., Course Giveaway Response"
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2a2a2a]"
                  placeholder="course, COURSE, send course"
                />
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Platforms</label>
                <div className="flex gap-3">
                  {(['YOUTUBE', 'INSTAGRAM', 'TIKTOK'] as Platform[]).map((platform) => {
                    const Icon = platformIcons[platform];
                    return (
                      <button
                        key={platform}
                        onClick={() => {
                          const newPlatforms = formData.platforms.includes(platform)
                            ? formData.platforms.filter((p) => p !== platform)
                            : [...formData.platforms, platform];
                          setFormData({ ...formData, platforms: newPlatforms });
                        }}
                        className={`flex-1 p-4 rounded-xl border transition-all ${
                          formData.platforms.includes(platform)
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                            : 'border-[#1a1a1a] text-gray-500 hover:bg-[#1a1a1a]'
                        }`}
                      >
                        <Icon className="w-6 h-6 mx-auto mb-2" />
                        <p className="text-xs font-bold">{platform}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Response Template */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Response Template
                </label>
                <textarea
                  value={formData.responseTemplate}
                  onChange={(e) => setFormData({ ...formData, responseTemplate: e.target.value })}
                  className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2a2a2a] h-24 resize-none"
                  placeholder="Hi {{username}}! Here's your link: {{customLink}}"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Variables: {'{'}{'{'} username{'}'}{'}'}, {'{'}{'{'}videoTitle{'}'}{'}'}, {'{'}{'{'}customLink{'}'}
                  {'}'}
                </p>
              </div>

              {/* Custom Link */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Custom Link (optional)
                </label>
                <input
                  type="url"
                  value={formData.customLink}
                  onChange={(e) => setFormData({ ...formData, customLink: e.target.value })}
                  className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2a2a2a]"
                  placeholder="https://example.com/course"
                />
              </div>

              {/* Rate Limiting */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Max Responses/Day
                  </label>
                  <input
                    type="number"
                    value={formData.maxResponsesPerDay}
                    onChange={(e) => setFormData({ ...formData, maxResponsesPerDay: parseInt(e.target.value) })}
                    className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2a2a2a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Delay (seconds)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.minDelaySeconds}
                      onChange={(e) => setFormData({ ...formData, minDelaySeconds: parseInt(e.target.value) })}
                      className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2a2a2a]"
                      placeholder="Min"
                    />
                    <input
                      type="number"
                      value={formData.maxDelaySeconds}
                      onChange={(e) => setFormData({ ...formData, maxDelaySeconds: parseInt(e.target.value) })}
                      className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2a2a2a]"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-500 uppercase">Filters</label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.skipNegativeSentiment}
                    onChange={(e) => setFormData({ ...formData, skipNegativeSentiment: e.target.checked })}
                    className="w-5 h-5 rounded bg-black border-[#1a1a1a]"
                  />
                  <span className="text-sm text-gray-400">Skip negative sentiment comments</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.skipSpam}
                    onChange={(e) => setFormData({ ...formData, skipSpam: e.target.checked })}
                    className="w-5 h-5 rounded bg-black border-[#1a1a1a]"
                  />
                  <span className="text-sm text-gray-400">Skip spam comments</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-[#1a1a1a]">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setEditingRule(null);
                  resetForm();
                }}
                className="flex-1 bg-[#1a1a1a] hover:bg-[#0a0a0a] text-gray-400 py-3 rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={showEditModal ? handleUpdateRule : handleCreateRule}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {showEditModal ? 'Update Rule' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoReply;
