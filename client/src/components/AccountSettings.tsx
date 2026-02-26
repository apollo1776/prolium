
import React, { useState, useEffect } from 'react';
import { User, Shield, Bell, CreditCard, Save, Globe, HelpCircle, MessageCircle, AlertCircle, Lightbulb, Video, Music2, Camera, Twitter, MoreHorizontal, Key, Smartphone, Monitor, Download, Trash2, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { platformApi, oauthApi, apiClient } from '../utils/apiClient';

interface AccountSettingsProps {
  initialTab?: string;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ initialTab }) => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab || 'profile');
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    country: 'United States',
    timezone: 'UTC-08:00 (Pacific Time)'
  });

  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState('free');

  // Profile picture states
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Security & Privacy states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Notification states
  const [emailNotifications, setEmailNotifications] = useState({
    marketing: true,
    productUpdates: true,
    weeklyDigest: true,
    collaborations: false,
    commentReplies: true,
    newFollowers: true,
    analytics: false,
  });

  const countries = [
    "United States", "United Kingdom", "Canada", "Australia", "Germany", 
    "France", "Japan", "India", "Brazil", "South Korea"
  ];

  const timezones = [
    "UTC-12:00", "UTC-08:00 (Pacific Time)", "UTC-05:00 (Eastern Time)",
    "UTC+00:00 (GMT)", "UTC+01:00 (CET)", "UTC+05:30 (IST)",
    "UTC+08:00 (CST)", "UTC+09:00 (JST)", "UTC+10:00 (AEST)"
  ];

  // Fetch connected platforms on mount
  useEffect(() => {
    fetchConnections();
    // Load profile picture from user data (use relative URL)
    if (user?.profilePicture) {
      setProfilePicture(user.profilePicture);
    }
  }, [user]);

  const fetchConnections = async () => {
    try {
      const response = await platformApi.getConnectedPlatforms();
      setConnections(response.data.connections);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('[Upload] File selected:', file);

    if (!file) {
      console.log('[Upload] No file selected');
      return;
    }

    console.log('[Upload] File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      console.error('[Upload] File too large:', file.size);
      alert('File too large. Maximum size is 5MB.');
      e.target.value = '';
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.error('[Upload] Invalid file type:', file.type);
      alert('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
      e.target.value = '';
      return;
    }

    setUploading(true);
    console.log('[Upload] Starting upload...');

    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      console.log('[Upload] Sending request to server...');
      const response = await apiClient.post('/auth/upload-profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('[Upload] Server response:', response.data);

      // Update local state (use relative URL, vite proxy will forward to backend)
      const pictureUrl = response.data.profilePicture;
      console.log('[Upload] Setting profile picture URL:', pictureUrl);
      setProfilePicture(pictureUrl);

      // Refresh user data
      console.log('[Upload] Refreshing user data...');
      await refreshUser();

      console.log('[Upload] Upload successful!');
      alert('Profile picture uploaded successfully!');
    } catch (error: any) {
      console.error('[Upload] Upload failed:', error);
      console.error('[Upload] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      alert(error.response?.data?.message || error.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
      // Reset file input so the same file can be selected again
      e.target.value = '';
      console.log('[Upload] Upload process completed');
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!confirm('Remove profile picture?')) return;

    try {
      await apiClient.delete('/auth/profile-picture');

      setProfilePicture(null);
      await refreshUser();
      alert('Profile picture removed');
    } catch (error: any) {
      alert(error.response?.data?.message || error.message || 'Failed to remove profile picture');
    }
  };

  const handleConnect = (platform: string) => {
    oauthApi.initiateOAuth(platform.toLowerCase() as any);
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Disconnect ${platform}?`)) return;

    try {
      await platformApi.disconnectPlatform(platform.toLowerCase());
      await fetchConnections();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert('Failed to disconnect platform');
    }
  };

  const platforms = [
    { id: 'youtube', name: 'YouTube', color: 'red', icon: Video },
    { id: 'tiktok', name: 'TikTok', color: 'pink', icon: Music2 },
    { id: 'instagram', name: 'Instagram', color: 'purple', icon: Camera },
    { id: 'x', name: 'X (Twitter)', color: 'white', icon: Twitter },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Account Settings</h2>
          <p className="text-gray-500">Manage your profile and preferences</p>
        </div>
        <button className="bg-emerald-500 hover:bg-emerald-600 text-black px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1">
          {[
            { id: 'profile', label: 'Profile Information', icon: User },
            { id: 'security', label: 'Security & Privacy', icon: Shield },
            { id: 'platforms', label: 'Connected Accounts', icon: Globe },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
            { id: 'more', label: 'More', icon: MoreHorizontal },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.id ? 'bg-[#0a0a0a]/50 text-gray-200 border border-[#2a2a2a]' : 'text-gray-500 hover:text-white hover:bg-[#1a1a1a]'}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {activeTab === 'profile' && (
            <div className="bg-black border border-[#1a1a1a] rounded-3xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-white mb-6">Profile Details</h3>

              {/* Profile Picture */}
              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-[#1a1a1a]">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-[#1a1a1a] flex items-center justify-center text-gray-400 border-2 border-[#2a2a2a] overflow-hidden">
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12" />
                    )}
                  </div>
                  <label
                    htmlFor="profile-picture-input"
                    className="absolute bottom-0 right-0 p-2 bg-emerald-500 hover:bg-emerald-600 rounded-full text-black transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </label>
                  <input
                    id="profile-picture-input"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleProfilePictureUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-200 mb-2">Profile Picture</p>
                  <p className="text-xs text-gray-500 mb-3">JPG, PNG or GIF. Max size 5MB.</p>
                  <div className="flex gap-3">
                    <label
                      htmlFor="profile-picture-input"
                      className={`px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-500 rounded-lg text-sm font-bold transition-all cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                    </label>
                    <button
                      onClick={handleRemoveProfilePicture}
                      disabled={!profilePicture}
                      className="px-4 py-2 hover:bg-rose-500/10 border border-[#1a1a1a] hover:border-rose-500/20 text-gray-400 hover:text-rose-500 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-[#2a2a2a] transition-all text-gray-300 font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                  className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-[#2a2a2a] transition-all text-gray-300 font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Country</label>
                <select 
                  value={profile.country}
                  onChange={(e) => setProfile({...profile, country: e.target.value})}
                  className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-[#2a2a2a] transition-all text-gray-300 font-medium appearance-none"
                >
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Time Zone</label>
                <select
                  value={profile.timezone}
                  onChange={(e) => setProfile({...profile, timezone: e.target.value})}
                  className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-[#2a2a2a] transition-all text-gray-300 font-medium appearance-none"
                >
                  {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-[#2a2a2a] transition-all text-gray-300 font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bio</label>
                <textarea
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-[#2a2a2a] transition-all text-gray-300 font-medium resize-none"
                />
              </div>
            </div>
            </div>
          )}

          {activeTab === 'security' && (
            <>
              {/* Change Password */}
              <div className="bg-black border border-[#1a1a1a] rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Key className="w-6 h-6 text-emerald-500" />
                  <h3 className="text-xl font-bold text-white">Change Password</h3>
                </div>
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 pr-10 outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all text-gray-300 font-medium"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 pr-10 outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all text-gray-300 font-medium"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">Minimum 8 characters, including uppercase, number, and special character</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full bg-black border border-[#1a1a1a] rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all text-gray-300 font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                  <button className="bg-emerald-500 hover:bg-emerald-600 text-black px-6 py-3 rounded-xl font-bold transition-all">
                    Update Password
                  </button>
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="bg-black border border-[#1a1a1a] rounded-3xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-6 h-6 text-emerald-500" />
                    <div>
                      <h3 className="text-xl font-bold text-white">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-500 mt-1">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      twoFactorEnabled ? 'bg-emerald-500' : 'bg-[#2a2a2a]'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                {twoFactorEnabled && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <p className="text-sm text-emerald-400 font-medium">
                      ✓ Two-factor authentication is enabled. You'll need to enter a code from your authenticator app when you sign in.
                    </p>
                  </div>
                )}
                {!twoFactorEnabled && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <p className="text-sm text-amber-400">
                      Enable 2FA to protect your account with a verification code in addition to your password.
                    </p>
                  </div>
                )}
              </div>

              {/* Active Sessions */}
              <div className="bg-black border border-[#1a1a1a] rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Monitor className="w-6 h-6 text-emerald-500" />
                  <h3 className="text-xl font-bold text-white">Active Sessions</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { device: 'Chrome on Windows', location: 'San Francisco, CA', current: true, lastActive: 'Active now' },
                    { device: 'Safari on iPhone 15', location: 'San Francisco, CA', current: false, lastActive: '2 hours ago' },
                  ].map((session, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#1a1a1a] rounded-xl">
                          <Monitor className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-200">{session.device}</p>
                            {session.current && (
                              <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{session.location} • {session.lastActive}</p>
                        </div>
                      </div>
                      {!session.current && (
                        <button className="px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all">
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy & Data */}
              <div className="bg-black border border-[#1a1a1a] rounded-3xl p-8 shadow-sm">
                <h3 className="text-xl font-bold text-white mb-6">Privacy & Data</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-xl">
                        <Download className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-200">Download Your Data</p>
                        <p className="text-sm text-gray-500">Export all your data in JSON format</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-500 rounded-xl text-sm font-bold transition-all">
                      Request Export
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-rose-500/10 rounded-xl">
                        <Trash2 className="w-5 h-5 text-rose-500" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-200">Delete Account</p>
                        <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 rounded-xl text-sm font-bold transition-all">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              {/* Email Notifications */}
              <div className="bg-black border border-[#1a1a1a] rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Bell className="w-6 h-6 text-emerald-500" />
                  <h3 className="text-xl font-bold text-white">Email Notifications</h3>
                </div>
                <div className="space-y-4">
                  {Object.entries({
                    marketing: { label: 'Marketing & Promotions', description: 'Receive news about new features and special offers' },
                    productUpdates: { label: 'Product Updates', description: 'Get notified about new features and improvements' },
                    weeklyDigest: { label: 'Weekly Analytics Digest', description: 'Weekly summary of your performance across platforms' },
                    collaborations: { label: 'Collaboration Requests', description: 'Notifications about new collaboration opportunities' },
                    commentReplies: { label: 'Comment Replies', description: 'When someone replies to your comments' },
                    newFollowers: { label: 'New Followers', description: 'When you gain new followers on connected platforms' },
                    analytics: { label: 'Analytics Alerts', description: 'Spike alerts and significant changes in your metrics' },
                  }).map(([key, { label, description }]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl">
                      <div>
                        <p className="font-bold text-gray-200">{label}</p>
                        <p className="text-sm text-gray-500 mt-1">{description}</p>
                      </div>
                      <button
                        onClick={() => setEmailNotifications({ ...emailNotifications, [key]: !emailNotifications[key as keyof typeof emailNotifications] })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          emailNotifications[key as keyof typeof emailNotifications] ? 'bg-emerald-500' : 'bg-[#2a2a2a]'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            emailNotifications[key as keyof typeof emailNotifications] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Push Notifications */}
              <div className="bg-black border border-[#1a1a1a] rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Smartphone className="w-6 h-6 text-emerald-500" />
                  <h3 className="text-xl font-bold text-white">Push Notifications</h3>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-6">
                  <p className="text-sm text-blue-400">
                    Enable push notifications in your browser to receive real-time updates even when Prolium is closed.
                  </p>
                </div>
                <button className="bg-emerald-500 hover:bg-emerald-600 text-black px-6 py-3 rounded-xl font-bold transition-all">
                  Enable Push Notifications
                </button>
              </div>
            </>
          )}

          {activeTab === 'platforms' && (
            <div className="bg-black border border-[#1a1a1a] rounded-3xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-white mb-6">Connected Platforms</h3>

              {/* X Connection Help Banner */}
              <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-blue-400 mb-1">Having trouble connecting X (Twitter)?</p>
                    <p className="text-xs text-blue-400/80">
                      Make sure your X Developer Portal app is configured as a <strong>"Web App"</strong> (not Native App),
                      has <strong>"Write"</strong> permissions enabled, and the callback URL matches exactly:
                      <code className="px-1.5 py-0.5 bg-black/50 rounded text-xs">http://localhost:4000/api/oauth/x/callback</code>
                    </p>
                  </div>
                </div>
              </div>

            {loading ? (
              <p className="text-gray-500">Loading connections...</p>
            ) : (
              <div className="space-y-4">
                {platforms.map((platform) => {
                  const connection = connections.find(
                    (c) => c.platform.toLowerCase() === platform.id
                  );

                  return (
                    <div key={platform.id} className="flex items-center justify-between p-5 rounded-2xl bg-black border border-[#1a1a1a]">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-gray-400 border border-[#2a2a2a]">
                          <platform.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-200">{platform.name}</p>
                          <p className="text-sm text-gray-500 font-medium">
                            {connection && connection.isActive
                              ? connection.platformUsername || 'Connected'
                              : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      {connection && connection.isActive ? (
                        <button
                          onClick={() => handleDisconnect(platform.id)}
                          className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(platform.id)}
                          className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          )}

          {activeTab === 'billing' && (
            <>
              {/* Current Plan */}
              <div className="bg-black border border-[#1a1a1a] rounded-3xl p-8 shadow-sm">
                <h3 className="text-xl font-bold text-white mb-6">Current Plan</h3>
                <div className="flex items-center justify-between p-6 bg-black border border-[#1a1a1a] rounded-2xl">
                  <div>
                    <p className="text-2xl font-bold text-white capitalize">{currentPlan} Plan</p>
                    <p className="text-gray-500 mt-1">
                      {currentPlan === 'free' && '3 platforms, statistics, 3 AI insights/week'}
                      {currentPlan === 'basic' && 'Newsletter, auto-replies, video generation'}
                      {currentPlan === 'plus' && 'Unlimited insights, collaborations, spike alerts'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">
                      {currentPlan === 'free' && '$0'}
                      {currentPlan === 'basic' && '$29'}
                      {currentPlan === 'plus' && '$79'}
                    </p>
                    <p className="text-gray-500 text-sm">/month</p>
                  </div>
                </div>
              </div>

              {/* Available Plans */}
              <div className="bg-black border border-[#1a1a1a] rounded-3xl p-8 shadow-sm">
                <h3 className="text-xl font-bold text-white mb-6">Available Plans</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Free Plan */}
                  <div className="bg-black border border-[#1a1a1a] rounded-2xl p-6 hover:border-[#2a2a2a] transition-all">
                    <div className="mb-4">
                      <h4 className="text-lg font-bold text-white">Free</h4>
                      <p className="text-gray-500 text-sm mt-1">Perfect for individuals</p>
                    </div>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-white">$0</span>
                      <span className="text-gray-500 text-sm">/month</span>
                    </div>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="text-green-500">✓</span> 3 platforms connection
                      </li>
                      <li className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="text-green-500">✓</span> Statistic summary
                      </li>
                      <li className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="text-green-500">✓</span> 3 AI insights a week
                      </li>
                      <li className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="text-gray-700">✗</span> Newsletter
                      </li>
                      <li className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="text-gray-700">✗</span> Video generation
                      </li>
                    </ul>
                    <button
                      disabled={currentPlan === 'free'}
                      className="w-full py-3 rounded-xl font-bold text-sm bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] disabled:opacity-50"
                    >
                      {currentPlan === 'free' ? 'Current Plan' : 'Downgrade'}
                    </button>
                  </div>

                  {/* Basic Plan */}
                  <div className="bg-black border-2 border-emerald-500/30 rounded-2xl p-6 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                      POPULAR
                    </div>
                    <div className="mb-4">
                      <h4 className="text-lg font-bold text-white">Basic</h4>
                      <p className="text-gray-500 text-sm mt-1">For serious creators</p>
                    </div>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-white">$29</span>
                      <span className="text-gray-500 text-sm">/month</span>
                    </div>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="text-green-500">✓</span> 3 platforms connection
                      </li>
                      <li className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="text-green-500">✓</span> Statistic summary
                      </li>
                      <li className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="text-green-500">✓</span> 7 AI insights a week
                      </li>
                      <li className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="text-green-500">✓</span> Newsletter
                      </li>
                      <li className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="text-green-500">✓</span> 80 credits for video generation/day
                      </li>
                      <li className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="text-green-500">✓</span> Up to 100 auto-replies a day
                      </li>
                    </ul>
                    <button
                      disabled={currentPlan === 'basic'}
                      className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-500 text-black hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {currentPlan === 'basic' ? 'Current Plan' : 'Upgrade to Basic'}
                    </button>
                  </div>

                  {/* Plus Plan */}
                  <div className="bg-black border border-[#1a1a1a] rounded-2xl p-6 hover:border-[#2a2a2a] transition-all">
                    <div className="mb-4">
                      <h4 className="text-lg font-bold text-white">Plus</h4>
                      <p className="text-gray-500 text-sm mt-1">For teams & agencies</p>
                    </div>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-white">$79</span>
                      <span className="text-gray-500 text-sm">/month</span>
                    </div>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="text-green-500">✓</span> 3 platforms connection
                      </li>
                      <li className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="text-green-500">✓</span> Statistic summary
                      </li>
                      <li className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="text-green-500">✓</span> Unlimited AI insights
                      </li>
                      <li className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="text-green-500">✓</span> Newsletter
                      </li>
                      <li className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="text-green-500">✓</span> 200 credits for video generation/day
                      </li>
                      <li className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="text-green-500">✓</span> Access to collaborations
                      </li>
                      <li className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="text-green-500">✓</span> Up to 1000 auto-replies a day
                      </li>
                      <li className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="text-green-500">✓</span> Messages spike alert
                      </li>
                    </ul>
                    <button
                      disabled={currentPlan === 'plus'}
                      className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-500 text-black hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {currentPlan === 'plus' ? 'Current Plan' : 'Upgrade to Plus'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-black border border-[#1a1a1a] rounded-3xl p-8 shadow-sm">
                <h3 className="text-xl font-bold text-white mb-6">Payment Methods</h3>

                {/* Plaid Bank Account Connection */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Bank Account</h4>
                  <button className="w-full p-6 bg-black border-2 border-dashed border-[#2a2a2a] rounded-2xl hover:border-[#2a2a2a] transition-all group">
                    <div className="flex items-center justify-center gap-3">
                      <svg className="w-6 h-6 text-gray-500 group-hover:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-gray-400 font-bold group-hover:text-gray-300">Connect Bank Account with Plaid</span>
                    </div>
                    <p className="text-gray-600 text-xs mt-2">Securely link your bank account for payments</p>
                  </button>
                </div>

                {/* Credit/Debit Card */}
                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Credit/Debit Card</h4>
                  <div className="bg-black border border-[#1a1a1a] rounded-2xl p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Card Number</label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-[#2a2a2a] transition-all text-gray-300 font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Expiry Date</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-[#2a2a2a] transition-all text-gray-300 font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">CVV</label>
                          <input
                            type="text"
                            placeholder="123"
                            className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-[#2a2a2a] transition-all text-gray-300 font-medium"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Cardholder Name</label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-[#2a2a2a] transition-all text-gray-300 font-medium"
                        />
                      </div>
                      <button className="w-full mt-4 py-3 rounded-xl font-bold text-sm bg-[#0a0a0a] text-white hover:bg-emerald-600 transition-colors">
                        Add Card
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'more' && (
            <div className="space-y-8">
              {/* FAQ */}
              <div className="bg-black border border-[#1a1a1a] rounded-3xl p-8 shadow-sm">
                <h3 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h3>
                <div className="space-y-4">
                  {[
                    {
                      question: 'How do I connect my social media accounts?',
                      answer: 'Go to Connected Accounts section and click the "Connect" button next to the platform you want to link. You\'ll be redirected to authenticate with that platform.',
                    },
                    {
                      question: 'What platforms are supported?',
                      answer: 'Currently, we support YouTube, TikTok, and Instagram. More platforms will be added soon.',
                    },
                    {
                      question: 'How does the AI video generation work?',
                      answer: 'Our AI video generation uses advanced models to create videos based on your text prompts. Each plan includes a daily credit limit for video generation.',
                    },
                    {
                      question: 'Can I cancel my subscription anytime?',
                      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes will take effect at the start of your next billing cycle.',
                    },
                    {
                      question: 'What are AI insights?',
                      answer: 'AI insights analyze your content performance across platforms and provide actionable recommendations to improve engagement and reach.',
                    },
                    {
                      question: 'How do auto-replies work?',
                      answer: 'Auto-replies use AI to respond to comments and messages on your behalf. You can customize the tone and set up rules for when to reply automatically.',
                    },
                  ].map((item, idx) => (
                    <details key={idx} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 group">
                      <summary className="font-bold text-gray-200 cursor-pointer list-none flex items-center justify-between">
                        {item.question}
                        <span className="text-emerald-500 group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <p className="text-gray-400 text-sm mt-3 leading-relaxed">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </div>

              {/* Support */}
              <div className="bg-black border border-[#1a1a1a] rounded-3xl p-8 shadow-sm">
                <h3 className="text-xl font-bold text-white mb-6">Support</h3>
                <div className="space-y-6">
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-emerald-500/10 rounded-xl">
                        <MessageCircle className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white mb-2">Contact Support Team</h4>
                        <p className="text-gray-400 text-sm mb-4">Our support team is available 24/7 to help you with any questions or issues.</p>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Email</label>
                            <input
                              type="email"
                              placeholder="your.email@example.com"
                              className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all text-gray-300 font-medium"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Subject</label>
                            <input
                              type="text"
                              placeholder="How can we help you?"
                              className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all text-gray-300 font-medium"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Message</label>
                            <textarea
                              rows={5}
                              placeholder="Describe your question or issue..."
                              className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all text-gray-300 font-medium resize-none"
                            />
                          </div>
                          <button className="w-full bg-emerald-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all">
                            Send Message
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5">
                      <h4 className="font-bold text-white mb-2">Email Support</h4>
                      <p className="text-gray-400 text-sm mb-2">support@prolium.ai</p>
                      <p className="text-gray-500 text-xs">Response within 24 hours</p>
                    </div>
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5">
                      <h4 className="font-bold text-white mb-2">Documentation</h4>
                      <p className="text-gray-400 text-sm mb-2">docs.prolium.ai</p>
                      <p className="text-gray-500 text-xs">Guides and tutorials</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Report an Issue */}
              <div className="bg-black border border-[#1a1a1a] rounded-3xl p-8 shadow-sm">
                <h3 className="text-xl font-bold text-white mb-6">Report an Issue</h3>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-red-500/10 rounded-xl">
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-2">Found a Bug?</h4>
                      <p className="text-gray-400 text-sm">Help us improve by reporting any issues you encounter. Please provide as much detail as possible.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Issue Type</label>
                      <select className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-red-500/50 transition-all text-gray-300 font-medium appearance-none">
                        <option>Select issue type</option>
                        <option>Platform Connection Issue</option>
                        <option>Data Not Loading</option>
                        <option>Video Generation Error</option>
                        <option>Auto-Reply Not Working</option>
                        <option>Newsletter Issue</option>
                        <option>UI/Display Bug</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Page/Feature</label>
                      <input
                        type="text"
                        placeholder="e.g., Dashboard, Video Lab, Scheduler"
                        className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-red-500/50 transition-all text-gray-300 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Describe the Issue</label>
                      <textarea
                        rows={6}
                        placeholder="What happened? What did you expect to happen? Steps to reproduce..."
                        className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-red-500/50 transition-all text-gray-300 font-medium resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Browser & Device</label>
                      <input
                        type="text"
                        placeholder="e.g., Chrome on Windows, Safari on iPhone 15"
                        className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-red-500/50 transition-all text-gray-300 font-medium"
                      />
                    </div>

                    <button className="w-full bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition-all">
                      Submit Issue Report
                    </button>
                  </div>
                </div>
              </div>

              {/* Propose an Idea */}
              <div className="bg-black border border-[#1a1a1a] rounded-3xl p-8 shadow-sm">
                <h3 className="text-xl font-bold text-white mb-6">Propose an Idea</h3>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-yellow-500/10 rounded-xl">
                      <Lightbulb className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-2">Share Your Ideas</h4>
                      <p className="text-gray-400 text-sm">We'd love to hear your suggestions for new features or improvements to Prolium.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Idea Category</label>
                      <select className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-yellow-500/50 transition-all text-gray-300 font-medium appearance-none">
                        <option>Select category</option>
                        <option>New Feature</option>
                        <option>Platform Integration</option>
                        <option>Analytics & Insights</option>
                        <option>AI Capabilities</option>
                        <option>User Interface</option>
                        <option>Collaboration Tools</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Idea Title</label>
                      <input
                        type="text"
                        placeholder="Give your idea a catchy name"
                        className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-yellow-500/50 transition-all text-gray-300 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Detailed Description</label>
                      <textarea
                        rows={6}
                        placeholder="Describe your idea in detail. What problem does it solve? How would it work?"
                        className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-yellow-500/50 transition-all text-gray-300 font-medium resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Use Case</label>
                      <textarea
                        rows={3}
                        placeholder="How would this feature benefit you and other users?"
                        className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-yellow-500/50 transition-all text-gray-300 font-medium resize-none"
                      />
                    </div>

                    <button className="w-full bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-600 transition-all">
                      Submit Idea
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
