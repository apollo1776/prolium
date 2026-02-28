
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  MessageSquare,
  Video,
  TrendingUp,
  Mail,
  Calendar,
  Settings,
  Menu,
  X,
  AlertCircle,
  UserCircle,
  LogOut,
  Sparkles,
  Music2,
  Camera,
  Bot
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import Collaborations from './components/Collaborations';
import AutoReply from './components/AutoReply';
import Autopilot from './components/Autopilot';
import AgentChat from './components/AgentChat';
import VideoLab from './components/VideoLab';
import Trends from './components/Trends';
import Scheduler from './components/Scheduler';
import Newsletter from './components/Newsletter';
import AccountSettings from './components/AccountSettings';
import YouTubeInsights from './components/YouTubeInsights';
import TikTokInsights from './components/TikTokInsights';
import InstagramInsights from './components/InstagramInsights';
import XInsights from './components/XInsights';
import XIcon from './components/icons/XIcon';
import Login from './components/Login';
import Register from './components/Register';
import { AuthProvider, useAuth } from './contexts/AuthContext';

type View = 'dashboard' | 'agent' | 'autopilot' | 'collabs' | 'replies' | 'video' | 'trends' | 'scheduler' | 'newsletter' | 'youtube-insights' | 'tiktok-insights' | 'instagram-insights' | 'x-insights' | 'account';
type AuthView = 'login' | 'register';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [authView, setAuthView] = useState<AuthView>('login');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isKeySelected, setIsKeySelected] = useState<boolean | null>(null);
  const [accountInitialTab, setAccountInitialTab] = useState<string | undefined>(undefined);
  const [oauthNotification, setOauthNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'denied';
    platform: string;
    message?: string;
    username?: string;
  } | null>(null);

  const navigateTo = (view: string, tab?: string) => {
    setAccountInitialTab(tab);
    setCurrentView(view as View);
  };

  // Check for OAuth callback status in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauth = params.get('oauth');
    const status = params.get('status');
    const username = params.get('username');
    const message = params.get('message');

    if (oauth && status) {
      // Show non-blocking notification
      setOauthNotification({
        show: true,
        type: status as 'success' | 'error' | 'denied',
        platform: oauth,
        message,
        username,
      });

      // Navigate to platforms tab on success
      if (status === 'success') {
        navigateTo('account', 'platforms');
      }

      // Clean URL immediately so user can try again
      window.history.replaceState({}, '', window.location.pathname);

          // Check for email verification result
          const emailVerifiedParam = params.get('success');
          if (window.location.pathname.includes('email-verified') && emailVerifiedParam !== null) {
                  setOauthNotification({
                            show: true,
                            type: emailVerifiedParam === 'true' ? 'success' : 'error',
                            platform: 'Email',
                            message: emailVerifiedParam === 'true'
                                        ? 'Your email has been verified! You can now log in.'
                                        : 'Email verification failed. Please try again or contact support.',
                            username: undefined,
                  });
                  setTimeout(() => { setOauthNotification(null); }, 10000);
          }

      // Auto-hide notification after 8 seconds
      setTimeout(() => {
        setOauthNotification(null);
      }, 8000);
    }
  }, []);

  useEffect(() => {
    const checkKey = async () => {
      if (typeof window.aistudio?.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsKeySelected(hasKey);
      } else {
        setIsKeySelected(true);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (typeof window.aistudio?.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setIsKeySelected(true);
    }
  };

  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'agent', label: 'AI Agent', icon: Sparkles },
        { id: 'autopilot', label: 'Autopilot', icon: Bot },
        { id: 'scheduler', label: 'Schedule', icon: Calendar },
      ],
    },
    {
      title: 'PLATFORMS',
      items: [
        { id: 'youtube-insights', label: 'YouTube', icon: Video },
        { id: 'tiktok-insights', label: 'TikTok', icon: Music2 },
        { id: 'instagram-insights', label: 'Instagram', icon: Camera },
        { id: 'x-insights', label: 'X (Twitter)', icon: XIcon },
      ],
    },
    {
      title: 'RESOURCES',
      items: [
        { id: 'video', label: 'Video Lab', icon: Video },
        { id: 'newsletter', label: 'Newsletter', icon: Mail },
        { id: 'collabs', label: 'Collaborations', icon: Users },
      ],
    },
  ];

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login/register if not authenticated
  if (!isAuthenticated) {
    if (authView === 'login') {
      return <Login onSwitchToRegister={() => setAuthView('register')} />;
    } else {
      return <Register onSwitchToLogin={() => setAuthView('login')} />;
    }
  }

  // Show dashboard if authenticated
  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row font-sans">
      {/* OAuth Notification Toast */}
      {oauthNotification?.show && (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-5 fade-in duration-300">
          <div
            className={`
              min-w-[320px] max-w-md p-4 rounded-xl border shadow-2xl backdrop-blur-sm
              ${oauthNotification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : oauthNotification.type === 'denied'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }
            `}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {oauthNotification.type === 'success' ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <span className="text-emerald-400 text-xs">✓</span>
                    </div>
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <p className="font-bold capitalize">
                    {oauthNotification.type === 'success'
                      ? `${oauthNotification.platform} Connected`
                      : oauthNotification.type === 'denied'
                      ? 'Connection Cancelled'
                      : 'Connection Failed'}
                  </p>
                </div>
                <p className="text-sm opacity-90">
                  {oauthNotification.type === 'success'
                    ? `Successfully connected to ${oauthNotification.platform}${
                        oauthNotification.username ? ` (@${oauthNotification.username})` : ''
                      }`
                    : oauthNotification.type === 'denied'
                    ? `${oauthNotification.platform} connection was cancelled. You can try again anytime.`
                    : oauthNotification.message ||
                      `Failed to connect ${oauthNotification.platform}. Check your app settings in the developer portal.`}
                </p>
                {oauthNotification.type === 'error' && (
                  <button
                    onClick={() => {
                      setOauthNotification(null);
                      navigateTo('account', 'platforms');
                    }}
                    className="mt-2 text-xs font-bold underline hover:no-underline"
                  >
                    Try Again
                  </button>
                )}
              </div>
              <button
                onClick={() => setOauthNotification(null)}
                className="text-current opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Top Nav */}
      <div className="md:hidden bg-black border-b border-[#1a1a1a] px-4 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Prolium" className="w-7 h-7" />
          <span className="font-bold text-lg text-white">Prolium</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCurrentView('account');
              setIsSidebarOpen(false);
            }}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400 hover:text-white transition-colors">
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-black border-r border-[#1a1a1a] transform transition-transform duration-200 ease-in-out
        md:sticky md:top-0 md:h-screen md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-5 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-8 px-2">
            <img src="/logo.png" alt="Prolium" className="w-8 h-8" />
            <span className="font-bold text-lg text-white tracking-tight">Prolium</span>
          </div>

          <nav className="flex-1 overflow-y-auto min-h-0 space-y-6">
            {navSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-wider px-3 mb-2">
                  {section.title}
                </h3>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id as View);
                        if (window.innerWidth < 768) setIsSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                        ${currentView === item.id
                          ? 'bg-[#1a1a1a] text-white'
                          : 'text-gray-400 hover:bg-[#141414] hover:text-white'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className="text-[10px] font-bold text-gray-500 bg-[#1a1a1a] px-1.5 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="pt-4 mt-auto border-t border-[#1a1a1a] space-y-0.5 flex-shrink-0">
            <button
              onClick={() => {
                setCurrentView('account');
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${currentView === 'account'
                  ? 'bg-[#1a1a1a] text-white'
                  : 'text-gray-400 hover:bg-[#141414] hover:text-white'}
              `}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>

            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-gray-400 hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>

            <div className="px-3 py-2">
              <p className="text-xs text-gray-600 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="hidden md:flex bg-black/95 backdrop-blur-md border-b border-[#1a1a1a] h-16 items-center justify-between px-8 sticky top-0 z-50">
          <h2 className="text-lg font-semibold capitalize text-white">{currentView.replace('-', ' ')}</h2>
          <div className="flex items-center gap-3">
            {isKeySelected === false && (
              <button
                onClick={handleOpenKeySelector}
                className="bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-full text-xs font-bold border border-amber-500/20 flex items-center gap-2 hover:bg-amber-500/20 transition-colors"
              >
                <AlertCircle className="w-4 h-4" />
                Connect API Key
              </button>
            )}
            <button
              onClick={() => setCurrentView('account')}
              className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#222222] border border-[#2a2a2a] rounded-full pl-3 pr-1 py-1 transition-colors"
            >
              <span className="text-sm font-medium text-gray-300">{user?.name || user?.email?.split('@')[0] || 'user'}</span>
              <div className="w-8 h-8 rounded-full bg-[#222222] flex items-center justify-center border border-[#2a2a2a] overflow-hidden">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>
          </div>
        </header>

        {/* Dynamic Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {currentView === 'dashboard' && <Dashboard onNavigate={(view) => setCurrentView(view as View)} />}
            {currentView === 'agent' && <AgentChat />}
            {currentView === 'autopilot' && <Autopilot />}
            {currentView === 'youtube-insights' && <YouTubeInsights />}
            {currentView === 'tiktok-insights' && <TikTokInsights />}
            {currentView === 'instagram-insights' && <InstagramInsights />}
            {currentView === 'x-insights' && <XInsights />}
            {currentView === 'collabs' && <Collaborations />}
            {currentView === 'replies' && <AutoReply />}
            {currentView === 'video' && <VideoLab isKeySelected={!!isKeySelected} onOpenKeySelector={handleOpenKeySelector} />}
            {currentView === 'trends' && <Trends onNavigate={(view) => setCurrentView(view as View)} />}
            {currentView === 'scheduler' && <Scheduler onNavigate={navigateTo} />}
            {currentView === 'newsletter' && <Newsletter />}
            {currentView === 'account' && <AccountSettings initialTab={accountInitialTab} />}
          </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
