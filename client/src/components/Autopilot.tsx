
import React, { useState, useEffect, useRef } from 'react';
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
  Video,
  Camera,
  Music2,
  X,
  Save,
  Settings,
  Sparkles,
  Bot,
  Send,
  Activity,
  BarChart3,
  ChevronRight,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { apiClient } from '../utils/apiClient';

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
  maxResponsesPerDay: number;
  minDelaySeconds: number;
  maxDelaySeconds: number;
  skipNegativeSentiment: boolean;
  skipSpam: boolean;
  onlyVerifiedUsers: boolean;
  minFollowerCount?: number;
  createdAt: string;
  updatedAt: string;
  _count?: { logs: number };
}

interface ActivityLog {
  id: string;
  ruleId: string;
  platform: Platform;
  commentText: string;
  commentAuthor: string;
  matchedKeyword?: string;
  responseAction: ResponseAction;
  responseSent: boolean;
  responseText?: string;
  errorMessage?: string;
  triggeredAt: string;
  rule?: { id: string; name: string };
}

interface Stats {
  totalTriggers: number;
  successfulResponses: number;
  responseRate: number;
  topPerformingRules: Array<{ id: string; name: string; triggerCount: number }>;
  platformStats: Array<{ platform: Platform; _count: { id: number } }>;
  todayTotalResponses: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const platformIcons: Record<Platform, React.FC<{ className?: string }>> = {
  YOUTUBE: Video,
  INSTAGRAM: Camera,
  TIKTOK: Music2,
};

const defaultFormData = {
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
};

const Autopilot: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'activity' | 'chat'>('overview');
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autopilotOn, setAutopilotOn] = useState(true);

  // Rule modal state
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your Autopilot assistant. I can help you manage your auto-reply rules, analyze performance, and suggest improvements. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadRules(), loadLogs(), loadStats()]);
    } finally {
      setLoading(false);
    }
  };

  const loadRules = async () => {
    try {
      const res = await apiClient.get('/auto-reply/rules');
      setRules(res.data.rules || []);
    } catch { setRules([]); }
  };

  const loadLogs = async () => {
    try {
      const res = await apiClient.get('/auto-reply/logs?limit=50');
      setLogs(res.data.logs || []);
    } catch { setLogs([]); }
  };

  const loadStats = async () => {
    try {
      const res = await apiClient.get('/auto-reply/stats');
      setStats(res.data.stats || null);
    } catch { setStats(null); }
  };

  const handleCreateRule = async () => {
    try {
      await apiClient.post('/auto-reply/rules', {
        ...formData,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        videoIds: formData.videoIds.split(',').map(v => v.trim()).filter(Boolean),
        minFollowerCount: formData.minFollowerCount > 0 ? formData.minFollowerCount : null,
      });
      await loadRules();
      closeModal();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create rule');
    }
  };

  const handleUpdateRule = async () => {
    if (!editingRule) return;
    try {
      await apiClient.put(`/auto-reply/rules/${editingRule.id}`, {
        ...formData,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        videoIds: formData.videoIds.split(',').map(v => v.trim()).filter(Boolean),
        minFollowerCount: formData.minFollowerCount > 0 ? formData.minFollowerCount : null,
      });
      await loadRules();
      closeModal();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update rule');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    try {
      await apiClient.delete(`/auto-reply/rules/${id}`);
      await loadRules();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete rule');
    }
  };

  const handleToggleRule = async (id: string) => {
    try {
      await apiClient.post(`/auto-reply/rules/${id}/toggle`);
      await loadRules();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle rule');
    }
  };

  const openCreateModal = () => {
    setEditingRule(null);
    setFormData(defaultFormData);
    setShowModal(true);
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
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRule(null);
    setFormData(defaultFormData);
  };

  const handleSendChat = async () => {
    const message = chatInput.trim();
    if (!message || chatLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: message, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const context = `
You are the Autopilot assistant for a social media management platform called Prolium.
Current autopilot status: ${autopilotOn ? 'ON' : 'OFF'}
Active rules: ${rules.filter(r => r.isActive).length} of ${rules.length} total
Total triggers today: ${stats?.todayTotalResponses || 0}
Response rate: ${stats?.responseRate || 0}%
Total successful responses: ${stats?.successfulResponses || 0}
Rules: ${rules.map(r => `"${r.name}" (${r.isActive ? 'active' : 'paused'}, ${r.keywords.join(', ')})`).join('; ')}

Help the user manage their autopilot. Be concise and practical. If they want to create or modify rules, describe what they should configure. If they ask for analysis, use the stats above.
`;

      const conversationHistory = chatMessages.slice(-6).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: context }] },
            contents: [
              ...conversationHistory,
              { role: 'user', parts: [{ text: message }] },
            ],
          }),
        }
      );

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }]);
    } catch {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I ran into an error. Please check your API key and try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const activeRules = rules.filter(r => r.isActive);
  const successfulLogs = logs.filter(l => l.responseSent);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Bot className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Autopilot</h2>
            <p className="text-gray-500 text-sm">AI-powered auto-replies & comment management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{autopilotOn ? 'Active' : 'Paused'}</span>
          <button
            onClick={() => setAutopilotOn(!autopilotOn)}
            className="transition-all"
            title={autopilotOn ? 'Pause Autopilot' : 'Enable Autopilot'}
          >
            {autopilotOn ? (
              <ToggleRight className="w-10 h-10 text-emerald-500" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {!autopilotOn && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-amber-400 text-sm font-medium">Autopilot is paused. Toggle it on to resume automated replies.</p>
        </div>
      )}

      {/* Stat Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-black border border-[#1a1a1a] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg">
              <Zap className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Triggers</p>
          </div>
          <p className="text-3xl font-black text-white">{stats?.totalTriggers?.toLocaleString() ?? '—'}</p>
        </div>
        <div className="bg-black border border-[#1a1a1a] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-blue-500/10 rounded-lg">
              <MessageSquare className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Responses Sent</p>
          </div>
          <p className="text-3xl font-black text-white">{stats?.successfulResponses?.toLocaleString() ?? '—'}</p>
        </div>
        <div className="bg-black border border-[#1a1a1a] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-purple-500/10 rounded-lg">
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Response Rate</p>
          </div>
          <p className="text-3xl font-black text-white">{stats?.responseRate ?? '—'}%</p>
        </div>
        <div className="bg-black border border-[#1a1a1a] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-rose-500/10 rounded-lg">
              <Clock className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Today</p>
          </div>
          <p className="text-3xl font-black text-white">{stats?.todayTotalResponses?.toLocaleString() ?? '—'}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-1">
        {([
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'rules', label: `Rules (${rules.length})`, icon: Settings },
          { id: 'activity', label: 'Activity', icon: Activity },
          { id: 'chat', label: 'Chat', icon: Bot },
        ] as const).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-black text-white shadow-sm border border-[#1a1a1a]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Active Rules Summary */}
          <div className="bg-black border border-[#1a1a1a] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white text-lg">Active Rules</h3>
              <button
                onClick={() => setActiveTab('rules')}
                className="text-xs text-emerald-500 font-bold flex items-center gap-1 hover:text-emerald-400"
              >
                Manage <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
              </div>
            ) : activeRules.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 font-bold">No active rules</p>
                <p className="text-gray-600 text-xs mt-1">Create a rule to start automating replies</p>
                <button
                  onClick={openCreateModal}
                  className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-black px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 mx-auto transition-all"
                >
                  <Plus className="w-4 h-4" /> Create Rule
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeRules.slice(0, 5).map(rule => (
                  <div key={rule.id} className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-xl border border-[#1a1a1a]">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div>
                        <p className="text-sm font-bold text-white">{rule.name}</p>
                        <p className="text-xs text-gray-600">{rule.keywords.slice(0, 3).join(', ')}{rule.keywords.length > 3 ? ` +${rule.keywords.length - 3} more` : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{rule._count?.logs || 0} triggers</span>
                      <span className="text-xs text-gray-600">·</span>
                      <span className="text-xs text-gray-500">{rule.platforms.join(', ')}</span>
                    </div>
                  </div>
                ))}
                {activeRules.length > 5 && (
                  <button onClick={() => setActiveTab('rules')} className="w-full text-center text-xs text-gray-600 hover:text-gray-400 py-2">
                    +{activeRules.length - 5} more rules
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-black border border-[#1a1a1a] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white text-lg">Recent Activity</h3>
              <button
                onClick={() => setActiveTab('activity')}
                className="text-xs text-emerald-500 font-bold flex items-center gap-1 hover:text-emerald-400"
              >
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 font-bold">No activity yet</p>
                <p className="text-gray-600 text-xs mt-1">Triggers will appear here when rules fire</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.slice(0, 5).map(log => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#0a0a0a] transition-all">
                    {log.responseSent ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    ) : log.errorMessage ? (
                      <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-white truncate">{log.rule?.name}</span>
                        <span className="text-xs text-gray-600 flex-shrink-0">{new Date(log.triggeredAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{log.commentText}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Rules by Triggers */}
          {stats && stats.topPerformingRules.length > 0 && (
            <div className="bg-black border border-[#1a1a1a] rounded-2xl p-6">
              <h3 className="font-black text-white text-lg mb-5">Top Rules by Performance</h3>
              <div className="space-y-3">
                {stats.topPerformingRules.map((rule, i) => (
                  <div key={rule.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-gray-700 w-6">#{i + 1}</span>
                      <span className="text-sm font-bold text-white">{rule.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 bg-[#1a1a1a] rounded-full w-24 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, (rule.triggerCount / (stats.topPerformingRules[0]?.triggerCount || 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-emerald-500 w-12 text-right">{rule.triggerCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Rules Tab ── */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openCreateModal}
              className="bg-emerald-500 hover:bg-emerald-600 text-black px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> Create Rule
            </button>
          </div>

          <div className="bg-black border border-[#1a1a1a] rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-12 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
              </div>
            ) : rules.length === 0 ? (
              <div className="p-12 text-center">
                <Sparkles className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 font-bold">No rules yet</p>
                <p className="text-gray-600 text-xs mt-2">Create your first rule to automate replies</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1a1a1a]">
                {rules.map(rule => (
                  <div key={rule.id} className="p-6 hover:bg-[#0a0a0a] transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h4 className="font-bold text-white">{rule.name}</h4>
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-lg border ${
                            rule.isActive
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                          }`}>
                            {rule.isActive ? 'ACTIVE' : 'PAUSED'}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-bold rounded-lg border border-[#1a1a1a] text-gray-600">
                            {rule.triggerType}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-600 mb-3 flex-wrap">
                          <span>{rule.keywords.length} keywords</span>
                          <span>·</span>
                          <span>{rule.platforms.join(', ')}</span>
                          {rule._count && <><span>·</span><span>{rule._count.logs} triggers</span></>}
                        </div>
                        <p className="text-sm text-gray-400 bg-[#0a0a0a] px-3 py-2 rounded-lg border border-[#1a1a1a] font-mono truncate">
                          {rule.responseTemplate}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleToggleRule(rule.id)}
                          className={`p-2 rounded-lg transition-all ${
                            rule.isActive ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
                          }`}
                          title={rule.isActive ? 'Pause' : 'Activate'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(rule)}
                          className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Activity Tab ── */}
      {activeTab === 'activity' && (
        <div className="bg-black border border-[#1a1a1a] rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between">
            <h3 className="font-black text-white">Activity Log</h3>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Success</span>
              <span className="flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-rose-500" /> Error</span>
              <span className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 text-gray-500" /> Skipped</span>
            </div>
          </div>
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 font-bold">No activity yet</p>
              <p className="text-gray-600 text-xs mt-2">Trigger events will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1a1a1a]">
              {logs.map(log => (
                <div key={log.id} className="p-5 hover:bg-[#0a0a0a] transition-all">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-0.5">
                      {log.responseSent ? (
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                      ) : log.errorMessage ? (
                        <div className="p-2 bg-rose-500/10 rounded-lg">
                          <XCircle className="w-4 h-4 text-rose-500" />
                        </div>
                      ) : (
                        <div className="p-2 bg-gray-500/10 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-white text-sm">{log.rule?.name || 'Unknown Rule'}</p>
                        <span className="text-xs text-gray-600">·</span>
                        <span className="text-xs text-gray-500">{log.commentAuthor}</span>
                        <span className="text-xs text-gray-600">·</span>
                        <span className="text-xs text-gray-500">{log.platform}</span>
                        <span className="text-xs text-gray-600">·</span>
                        <span className="text-xs text-gray-600">{new Date(log.triggeredAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2 truncate">{log.commentText}</p>
                      {log.responseText && (
                        <div className="bg-[#0a0a0a] p-3 rounded-lg border border-[#1a1a1a]">
                          <p className="text-xs text-gray-600 mb-1 font-bold uppercase">Response sent:</p>
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
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Chat Tab ── */}
      {activeTab === 'chat' && (
        <div className="bg-black border border-[#1a1a1a] rounded-2xl overflow-hidden flex flex-col" style={{ height: '600px' }}>
          <div className="p-5 border-b border-[#1a1a1a] flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Autopilot Assistant</p>
              <p className="text-xs text-emerald-500">● Online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mr-3 mt-1">
                    <Bot className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-emerald-500 text-black rounded-br-sm'
                    : 'bg-[#0a0a0a] border border-[#1a1a1a] text-gray-300 rounded-bl-sm'
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p className={`text-xs mt-1.5 ${msg.role === 'user' ? 'text-black/50 text-right' : 'text-gray-600'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mr-3 mt-1">
                  <Bot className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggestions */}
          {chatMessages.length <= 2 && (
            <div className="px-5 pb-3 flex gap-2 flex-wrap">
              {[
                'How are my rules performing?',
                'Suggest improvements',
                'Which rule gets most triggers?',
                'How do I set up a new rule?',
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => { setChatInput(suggestion); }}
                  className="text-xs bg-[#0a0a0a] border border-[#1a1a1a] text-gray-400 px-3 py-1.5 rounded-xl hover:border-emerald-500/30 hover:text-emerald-400 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-[#1a1a1a] flex gap-3 flex-shrink-0">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
              placeholder="Ask anything about your autopilot..."
              className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500/40 transition-all"
            />
            <button
              onClick={handleSendChat}
              disabled={!chatInput.trim() || chatLoading}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-black p-3 rounded-xl transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Create/Edit Rule Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-black border border-[#1a1a1a] rounded-2xl w-full max-w-2xl p-8 my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white">
                {editingRule ? 'Edit Rule' : 'Create Rule'}
              </h3>
              <button onClick={closeModal} className="p-2 text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Rule Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/40 transition-all"
                  placeholder="e.g., Course Link Response"
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Keywords</label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={e => setFormData({ ...formData, keywords: e.target.value })}
                  className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/40 transition-all"
                  placeholder="course, COURSE, send course, link"
                />
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Platforms</label>
                <div className="flex gap-3">
                  {(['YOUTUBE', 'INSTAGRAM', 'TIKTOK'] as Platform[]).map(platform => {
                    const Icon = platformIcons[platform];
                    return (
                      <button
                        key={platform}
                        onClick={() => {
                          const next = formData.platforms.includes(platform)
                            ? formData.platforms.filter(p => p !== platform)
                            : [...formData.platforms, platform];
                          setFormData({ ...formData, platforms: next });
                        }}
                        className={`flex-1 p-4 rounded-xl border transition-all ${
                          formData.platforms.includes(platform)
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                            : 'border-[#1a1a1a] text-gray-500 hover:bg-[#1a1a1a]'
                        }`}
                      >
                        <Icon className="w-5 h-5 mx-auto mb-1" />
                        <p className="text-xs font-bold">{platform}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Response Template */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Response Template</label>
                <textarea
                  value={formData.responseTemplate}
                  onChange={e => setFormData({ ...formData, responseTemplate: e.target.value })}
                  className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/40 transition-all h-24 resize-none"
                  placeholder="Hi there! Here's the link you requested."
                />
              </div>

              {/* Custom Link */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Custom Link</label>
                <input
                  type="url"
                  value={formData.customLink}
                  onChange={e => setFormData({ ...formData, customLink: e.target.value })}
                  className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/40 transition-all"
                  placeholder="https://example.com/course"
                />
              </div>

              {/* Rate Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Max Replies/Day</label>
                  <input
                    type="number"
                    value={formData.maxResponsesPerDay}
                    onChange={e => setFormData({ ...formData, maxResponsesPerDay: parseInt(e.target.value) })}
                    className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Delay Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.minDelaySeconds}
                      onChange={e => setFormData({ ...formData, minDelaySeconds: parseInt(e.target.value) })}
                      className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/40 transition-all"
                      placeholder="Min"
                    />
                    <input
                      type="number"
                      value={formData.maxDelaySeconds}
                      onChange={e => setFormData({ ...formData, maxDelaySeconds: parseInt(e.target.value) })}
                      className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/40 transition-all"
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
                    onChange={e => setFormData({ ...formData, skipNegativeSentiment: e.target.checked })}
                    className="w-5 h-5 rounded bg-black border-[#1a1a1a] accent-emerald-500"
                  />
                  <span className="text-sm text-gray-400">Skip negative sentiment comments</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.skipSpam}
                    onChange={e => setFormData({ ...formData, skipSpam: e.target.checked })}
                    className="w-5 h-5 rounded bg-black border-[#1a1a1a] accent-emerald-500"
                  />
                  <span className="text-sm text-gray-400">Skip spam comments</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-[#1a1a1a]">
              <button
                onClick={closeModal}
                className="flex-1 bg-[#1a1a1a] hover:bg-[#0a0a0a] text-gray-400 py-3 rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={editingRule ? handleUpdateRule : handleCreateRule}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Autopilot;
