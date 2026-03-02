
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot,
  Send,
  Plus,
  ChevronLeft,
  Sparkles,
  Loader2,
  CheckCircle2,
  Clock,
  Trash2,
  Settings,
  X,
  Save,
  Copy,
  Check,
  MessageSquare,
  Zap,
  Instagram,
  Video,
  Music2,
  Twitter,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { apiClient, postsApi } from '../utils/apiClient';

// ── Types ───────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  messageType: string;
  agentContext?: any;
  timestamp: string;
}

interface ChatSession {
  id: string;
  sessionName: string | null;
  lastActivityAt: string;
  createdAt: string;
  _count?: { messages: number };
  messages?: ChatMessage[];
}

interface GeneratedPost {
  platform: string;
  caption: string;
  hashtags: string[];
  bestTime: string;
  contentType: string;
  notes?: string;
  estimatedEngagement?: string;
}

interface BrandMemory {
  brandName: string;
  industry: string;
  targetAudience: string;
  brandVoice: string;
  keyMessages: string[];
  prohibitedTopics: string[];
  platforms: string[];
  extraContext: string;
}

// ── Helpers ─────────────────────────────────────────────────────

const platformIcon = (platform: string) => {
  const p = platform.toLowerCase();
  if (p === 'youtube') return <Video className="w-3.5 h-3.5 text-red-500" />;
  if (p === 'instagram') return <Instagram className="w-3.5 h-3.5 text-purple-500" />;
  if (p === 'tiktok') return <Music2 className="w-3.5 h-3.5 text-pink-500" />;
  if (p === 'x') return <Twitter className="w-3.5 h-3.5 text-gray-400" />;
  return <MessageSquare className="w-3.5 h-3.5 text-gray-400" />;
};

const platformColor = (platform: string) => {
  const p = platform.toLowerCase();
  if (p === 'youtube') return 'border-red-500/30 bg-red-500/5';
  if (p === 'instagram') return 'border-purple-500/30 bg-purple-500/5';
  if (p === 'tiktok') return 'border-pink-500/30 bg-pink-500/5';
  if (p === 'x') return 'border-gray-500/30 bg-gray-500/5';
  return 'border-[#1a1a1a] bg-[#0a0a0a]';
};

const formatTime = (ts: string) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatRelative = (ts: string) => {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
};

// ── Generated Post Card ─────────────────────────────────────────

const PostCard: React.FC<{ post: GeneratedPost; onPost?: (post: GeneratedPost, key?: string) => void; onSchedule?: (post: GeneratedPost) => void; posting?: boolean; posted?: boolean }> = ({ post, onPost, onSchedule, posting, posted }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `${post.caption}\n\n${post.hashtags.map(h => `#${h.replace('#', '')}`).join(' ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-xl border p-4 ${platformColor(post.platform)} mt-3`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {platformIcon(post.platform)}
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">{post.platform}</span>
          <span className="text-xs text-gray-600">·</span>
          <span className="text-xs text-gray-500 capitalize">{post.contentType}</span>
          {post.estimatedEngagement && (
            <>
              <span className="text-xs text-gray-600">·</span>
              <span className={`text-xs font-bold ${post.estimatedEngagement === 'high' ? 'text-emerald-500' : post.estimatedEngagement === 'medium' ? 'text-amber-500' : 'text-gray-500'}`}>
                {post.estimatedEngagement} engagement
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {post.bestTime && (
            <span className="text-xs text-gray-600 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {post.bestTime}
            </span>
          )}
          {onPost && post.platform.toLowerCase() === 'x' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onPost(post)}
                  disabled={posting || posted}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    posted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : posting
                      ? 'bg-gray-800 text-gray-500 cursor-wait'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-black'
                  }`}
                >
                  {posted ? (
                    <><Check className="w-3 h-3" /> Posted</>
                  ) : posting ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Posting...</>
                  ) : (
                    <><Send className="w-3 h-3" /> Post Now</>
                  )}
                </button>
                {!posted && !posting && onSchedule && (
                  <button
                    onClick={() => onSchedule(post)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                  >
                    <Clock className="w-3 h-3" /> Schedule
                  </button>
                )}
              </div>
            )}
            <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-black/40 text-gray-500 hover:text-white transition-all"
            title="Copy caption + hashtags"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap mb-3">{post.caption}</p>

      {post.hashtags.length > 0 && (
        <p className="text-xs text-blue-400/80 leading-relaxed">
          {post.hashtags.map(h => `#${h.replace('#', '')}`).join(' ')}
        </p>
      )}

      {post.notes && (
        <p className="text-xs text-gray-600 mt-2 italic border-t border-white/5 pt-2">{post.notes}</p>
      )}
    </div>
  );
};

// ── Message Bubble ───────────────────────────────────────────────

const MessageBubble: React.FC<{ msg: ChatMessage; generatedContent?: GeneratedPost[]; onPost?: (post: GeneratedPost, key?: string) => void; onSchedule?: (post: GeneratedPost) => void; postingStates?: Record<string, string> }> = ({ msg, generatedContent, onPost, onSchedule, postingStates }) => {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
          <Bot className="w-4 h-4 text-emerald-500" />
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-emerald-500 text-black rounded-br-sm'
            : 'bg-[#0f0f0f] border border-[#1a1a1a] text-gray-200 rounded-bl-sm'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        </div>

        {/* Generated posts */}
        {!isUser && generatedContent && generatedContent.length > 0 && (
          <div className="w-full mt-1 space-y-2">
            {generatedContent.map((post, i) => (
              <PostCard key={i} post={post} onPost={onPost ? () => onPost(post, msg.id + '-' + i) : undefined} onSchedule={onSchedule} posting={postingStates?.[msg.id + '-' + i] === 'posting'} posted={postingStates?.[msg.id + '-' + i] === 'posted'} />
            ))}
          </div>
        )}

        <span className={`text-xs mt-1 ${isUser ? 'text-gray-600 mr-1' : 'text-gray-700 ml-1'}`}>
          {formatTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
};

// ── Brand Memory Modal ──────────────────────────────────────────

const BrandModal: React.FC<{
  memory: Partial<BrandMemory>;
  onSave: (data: Partial<BrandMemory>) => void;
  onClose: () => void;
}> = ({ memory, onSave, onClose }) => {
  const [form, setForm] = useState<Partial<BrandMemory>>({
    brandName: '',
    industry: '',
    targetAudience: '',
    brandVoice: '',
    keyMessages: [],
    prohibitedTopics: [],
    platforms: [],
    extraContext: '',
    ...memory,
  });
  const [keyMsgInput, setKeyMsgInput] = useState('');
  const [prohibitedInput, setProhibitedInput] = useState('');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-lg font-black text-white">Brand Profile</h3>
            <p className="text-xs text-gray-500 mt-0.5">The agent uses this to stay on-brand</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Brand Name</label>
              <input
                value={form.brandName || ''}
                onChange={e => setForm({ ...form, brandName: e.target.value })}
                className="w-full bg-black border border-[#1a1a1a] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/40"
                placeholder="e.g. FitLife"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Industry</label>
              <input
                value={form.industry || ''}
                onChange={e => setForm({ ...form, industry: e.target.value })}
                className="w-full bg-black border border-[#1a1a1a] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/40"
                placeholder="e.g. Fitness & Wellness"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Target Audience</label>
            <input
              value={form.targetAudience || ''}
              onChange={e => setForm({ ...form, targetAudience: e.target.value })}
              className="w-full bg-black border border-[#1a1a1a] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/40"
              placeholder="e.g. Women 18-30 interested in fitness and healthy lifestyle"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Brand Voice</label>
            <input
              value={form.brandVoice || ''}
              onChange={e => setForm({ ...form, brandVoice: e.target.value })}
              className="w-full bg-black border border-[#1a1a1a] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/40"
              placeholder="e.g. Motivational, energetic, friendly but professional"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
              Key Messages <span className="text-gray-600 normal-case font-normal">(press Enter to add)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(form.keyMessages || []).map((msg, i) => (
                <span key={i} className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  {msg}
                  <button onClick={() => setForm({ ...form, keyMessages: form.keyMessages?.filter((_, j) => j !== i) })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              value={keyMsgInput}
              onChange={e => setKeyMsgInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && keyMsgInput.trim()) {
                  setForm({ ...form, keyMessages: [...(form.keyMessages || []), keyMsgInput.trim()] });
                  setKeyMsgInput('');
                }
              }}
              className="w-full bg-black border border-[#1a1a1a] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/40"
              placeholder="Add a key message and press Enter"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
              Topics to Avoid <span className="text-gray-600 normal-case font-normal">(press Enter to add)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(form.prohibitedTopics || []).map((topic, i) => (
                <span key={i} className="flex items-center gap-1.5 bg-rose-500/10 text-rose-400 text-xs px-2.5 py-1 rounded-lg border border-rose-500/20">
                  {topic}
                  <button onClick={() => setForm({ ...form, prohibitedTopics: form.prohibitedTopics?.filter((_, j) => j !== i) })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              value={prohibitedInput}
              onChange={e => setProhibitedInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && prohibitedInput.trim()) {
                  setForm({ ...form, prohibitedTopics: [...(form.prohibitedTopics || []), prohibitedInput.trim()] });
                  setProhibitedInput('');
                }
              }}
              className="w-full bg-black border border-[#1a1a1a] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/40"
              placeholder="e.g. politics, competitors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Additional Context</label>
            <textarea
              value={form.extraContext || ''}
              onChange={e => setForm({ ...form, extraContext: e.target.value })}
              rows={3}
              className="w-full bg-black border border-[#1a1a1a] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/40 resize-none"
              placeholder="Anything else the agent should know about your brand, content strategy, or goals..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5 pt-4 border-t border-[#1a1a1a]">
          <button onClick={onClose} className="flex-1 bg-[#1a1a1a] text-gray-400 py-2.5 rounded-xl font-bold text-sm hover:bg-[#222] transition-all">
            Cancel
          </button>
          <button
            onClick={() => { onSave(form); onClose(); }}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" /> Save Profile
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────

const AgentChat: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageContent, setMessageContent] = useState<Record<string, GeneratedPost[]>>({});
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandMemory, setBrandMemory] = useState<Partial<BrandMemory>>({});
  const [showSidebar, setShowSidebar] = useState(true);
  const [agentStatus, setAgentStatus] = useState<any>(null);
  const [postingStates, setPostingStates] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Suggestions shown before first message
  const suggestions = [
    'Create 5 Instagram posts about morning workouts for my fitness brand',
    'Write a week of TikTok content for my food blog targeting millennials',
    'Help me set up my brand profile and content strategy',
    'Generate motivational quotes for my YouTube community posts',
    'What hashtag strategy should I use for fitness content on Instagram?',
  ];

  useEffect(() => {
    loadSessions();
    loadBrandMemory();
    loadAgentStatus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await apiClient.get('/agent/chat/sessions');
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadBrandMemory = async () => {
    try {
      const res = await apiClient.get('/agent/memory/brand');
      if (res.data.memory) setBrandMemory(res.data.memory);
    } catch { /* no memory yet */ }
  };

  const loadAgentStatus = async () => {
    try {
      const res = await apiClient.get('/agent/status');
      setAgentStatus(res.data);
    } catch { /* ignore */ }
  };

  const startNewSession = async () => {
    try {
      const res = await apiClient.post('/agent/chat/sessions', {});
      const session = res.data.session;
      setSessions(prev => [{ ...session, _count: { messages: 0 }, messages: [] }, ...prev]);
      setActiveSession(session);
      setMessages([]);
      setMessageContent({});
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const openSession = async (session: ChatSession) => {
    setActiveSession(session);
    try {
      const res = await apiClient.get(`/agent/chat/sessions/${session.id}`);
      setMessages(res.data.session?.messages || []);
    } catch (err) {
      console.error('Failed to load session:', err);
      setMessages([]);
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/agent/chat/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;

    let sessionId = activeSession?.id;

    // Auto-create session if none active
    if (!sessionId) {
      try {
        const res = await apiClient.post('/agent/chat/sessions', {});
        const newSession = res.data.session;
        setActiveSession(newSession);
        setSessions(prev => [{ ...newSession, _count: { messages: 0 } }, ...prev]);
        sessionId = newSession.id;
      } catch (err) {
        console.error('Failed to create session:', err);
        return;
      }
    }

    // Optimistic user message
    const tempId = `temp-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: tempId,
      role: 'user',
      content: msg,
      messageType: 'instruction',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await apiClient.post('/agent/chat/message', {
        sessionId,
        message: msg,
      });

      const { reply, generatedContent } = res.data;

      // Add agent reply
      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: reply,
        messageType: 'text',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, agentMsg]);

      // Store generated content linked to this message
      if (generatedContent?.length > 0) {
        setMessageContent(prev => ({ ...prev, [agentMsg.id]: generatedContent }));
      }

      // Refresh sessions list to update last message / name
      loadSessions();
      loadAgentStatus();
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'agent',
        content: 'Sorry, I ran into an issue. Please try again.',
        messageType: 'text',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const saveBrandMemory = async (data: Partial<BrandMemory>) => {
    try {
      await apiClient.put('/agent/memory/brand', data);
      setBrandMemory(data);
      loadAgentStatus();
    } catch (err) {
      console.error('Failed to save brand memory:', err);
    }
  };

  const handlePostToX = async (post: GeneratedPost, key?: string) => {
    const stateKey = key || 'post-' + Date.now();
    setPostingStates(prev => ({ ...prev, [stateKey]: 'posting' }));
    try {
      await postsApi.publishPost({
        platform: post.platform,
        content: post.caption,
        hashtags: post.hashtags,
      });
      setPostingStates(prev => ({ ...prev, [stateKey]: 'posted' }));
    } catch (err: any) {
      console.error('[Agent] Post failed:', err);
      setPostingStates(prev => ({ ...prev, [stateKey]: 'error' }));
    }
  };

  const handleSchedulePost = (post: GeneratedPost) => {
    // Navigate to schedule page with post data pre-filled
    const postData = {
      platform: post.platform,
      content: post.caption,
      hashtags: post.hashtags,
    };
    // Store in sessionStorage for the scheduler to pick up
    sessionStorage.setItem('scheduledPost', JSON.stringify(postData));
    // For now, show a prompt for scheduling
    const dateStr = prompt('Schedule for when? (e.g. "2026-03-03 10:00 AM")');
    if (dateStr) {
      alert('Post scheduled for ' + dateStr + '! (Scheduler integration coming soon)');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const hasBrand = !!brandMemory.brandName;

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-black rounded-2xl border border-[#1a1a1a] overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      {showSidebar && (
        <div className="w-72 flex-shrink-0 border-r border-[#1a1a1a] flex flex-col bg-[#050505]">
          {/* Header */}
          <div className="p-4 border-b border-[#1a1a1a]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <span className="font-black text-white text-sm">Prolium Agent</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Live
                </span>
              </div>
            </div>

            {/* Brand pill */}
            <button
              onClick={() => setShowBrandModal(true)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                hasBrand
                  ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10'
                  : 'border-dashed border-[#2a2a2a] text-gray-600 hover:border-emerald-500/30 hover:text-emerald-500'
              }`}
            >
              <span className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" />
                {hasBrand ? brandMemory.brandName : 'Set up brand profile'}
              </span>
              <Settings className="w-3 h-3" />
            </button>

            <button
              onClick={startNewSession}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-black py-2 rounded-xl text-xs font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> New Chat
            </button>
          </div>

          {/* Sessions list */}
          <div className="flex-1 overflow-y-auto">
            {loadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-4 text-center">
                <MessageSquare className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-xs text-gray-600">No conversations yet</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {sessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => openSession(session)}
                    className={`w-full text-left px-3 py-3 rounded-xl transition-all group ${
                      activeSession?.id === session.id
                        ? 'bg-[#0f0f0f] border border-[#1a1a1a]'
                        : 'hover:bg-[#0a0a0a]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-white truncate flex-1">
                        {session.sessionName || 'New conversation'}
                      </p>
                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-600 hover:text-rose-400 transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600">{formatRelative(session.lastActivityAt)}</span>
                      {session._count && (
                        <>
                          <span className="text-gray-700">·</span>
                          <span className="text-xs text-gray-700">{session._count.messages} msgs</span>
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Agent stats */}
          {agentStatus && (
            <div className="p-3 border-t border-[#1a1a1a]">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#0a0a0a] rounded-lg p-2 text-center border border-[#1a1a1a]">
                  <p className="text-lg font-black text-white">{agentStatus.totalSessions}</p>
                  <p className="text-xs text-gray-600">Chats</p>
                </div>
                <div className="bg-[#0a0a0a] rounded-lg p-2 text-center border border-[#1a1a1a]">
                  <p className="text-lg font-black text-white">{agentStatus.pendingTasks}</p>
                  <p className="text-xs text-gray-600">Tasks</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Chat Area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-14 border-b border-[#1a1a1a] flex items-center justify-between px-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 text-gray-600 hover:text-white transition-colors"
              title="Toggle sidebar"
            >
              {showSidebar ? <ChevronLeft className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </button>
            <div>
              <p className="text-sm font-bold text-white">
                {activeSession?.sessionName || (activeSession ? 'New conversation' : 'Prolium Agent')}
              </p>
              {hasBrand && (
                <p className="text-xs text-gray-600">{brandMemory.brandName} · {brandMemory.industry}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowBrandModal(true)}
            className="text-xs text-gray-500 hover:text-white flex items-center gap-1.5 transition-all"
          >
            <Settings className="w-3.5 h-3.5" /> Brand
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
                <Sparkles className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-black text-white mb-2">
                {hasBrand ? `Your ${brandMemory.brandName} agent is ready` : "Your Prolium Agent is ready"}
              </h2>
              <p className="text-gray-500 text-sm text-center max-w-sm mb-8">
                {hasBrand
                  ? `Ready to create content for ${brandMemory.targetAudience || "your audience"}. What shall we work on?`
                  : "Tell me about your brand, audience, and goals. I will help you grow your social media presence."}
              </p>

              {!hasBrand && (
                <button
                  onClick={() => setShowBrandModal(true)}
                  className="mb-6 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-500/20 transition-all"
                >
                  <Zap className="w-4 h-4" /> Set up brand profile first
                </button>
              )}

              <div className="grid grid-cols-1 gap-2 w-full max-w-md">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(suggestion)}
                    className="text-left px-4 py-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-sm text-gray-400 hover:border-emerald-500/30 hover:text-gray-200 hover:bg-[#0f0f0f] transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  generatedContent={messageContent[msg.id]}
                  onPost={handlePostToX}
                  onSchedule={handleSchedulePost}
                  postingStates={postingStates}
                />
              ))}
              {sending && (
                <div className="flex justify-start mb-4">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                    <Bot className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1.5 items-center">
                      <span className="w-2 h-2 bg-emerald-500/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-emerald-500/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-emerald-500/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-[#1a1a1a] p-4 flex-shrink-0">
          <div className="flex gap-3 items-end">
            <div className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl px-4 py-3 focus-within:border-emerald-500/40 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={hasBrand ? `Tell ${brandMemory.brandName} agent what to do...` : 'Tell me about your brand or ask me to create content...'}
                rows={1}
                className="w-full bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none resize-none leading-relaxed"
                style={{ maxHeight: '120px', overflowY: 'auto' }}
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || sending}
              className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-black rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-700 mt-2 ml-1">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>

      {/* Brand Modal */}
      {showBrandModal && (
        <BrandModal
          memory={brandMemory}
          onSave={saveBrandMemory}
          onClose={() => setShowBrandModal(false)}
        />
      )}
    </div>
  );
};

export default AgentChat;
