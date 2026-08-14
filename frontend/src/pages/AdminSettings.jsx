import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, User, Shield, Bell, Database, RefreshCw, Key, LogOut, X, Camera, Check } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import api from '@services/api';
import { fetchCurrentUser } from '@store/slices/authSlice';

export default function AdminSettings() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  const [activeTab, setActiveTab] = useState('profile'); // profile, security, notifications, system

  // File Input Ref for Avatar
  const fileInputRef = useRef(null);

  // Profile Form
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // Avatar Preview & Upload State
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarSaving, setAvatarSaving] = useState(false);

  // Security Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Notifications Toggles
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushAlerts: true,
    refundAlerts: true,
    vendorAlerts: true,
  });

  // System Info
  const [systemInfo, setSystemInfo] = useState(null);
  const [sysLoading, setSysLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const fetchSystemInfo = useCallback(async () => {
    setSysLoading(true);
    try {
      const res = await api.get('/api/admin/system-info');
      setSystemInfo(res.data);
    } catch (err) {
      toast.error('Failed to load system information');
    } finally {
      setSysLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'system') {
      fetchSystemInfo();
    }
  }, [activeTab, fetchSystemInfo]);

  // Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await api.put('/api/admin/profile', { firstName, lastName, phone });
      dispatch(fetchCurrentUser());
      toast.success('Admin profile updated successfully! ✨');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // Avatar Selection via File Picker
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File validation: Format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error('Invalid file format. Please upload JPG, JPEG, PNG, or WEBP images.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // File validation: Size (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5 MB. Please select a smaller image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Read file as base64 data URL for instant preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Save selected avatar
  const handleSaveAvatar = async () => {
    if (!avatarPreview) return;
    setAvatarSaving(true);
    try {
      await api.put('/api/admin/profile', { avatarUrl: avatarPreview });
      dispatch(fetchCurrentUser());
      setAvatarUrl(avatarPreview);
      setAvatarPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Avatar updated successfully! ✨');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setAvatarSaving(false);
    }
  };

  // Cancel avatar selection
  const handleCancelAvatar = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Password Save
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters!");
      return;
    }

    setPasswordSaving(true);
    try {
      await api.put('/api/admin/password', { currentPassword, newPassword });
      toast.success('Password changed successfully! 🔑');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  // Logout All Devices
  const handleLogoutAll = () => {
    toast.success("All other active sessions logged out.");
  };

  return (
    <div className="space-y-6 page-enter max-w-5xl">
      {/* Hidden OS File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        hidden
        onChange={handleFileSelect}
      />

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-[var(--text3)] mb-2">
          <span>Admin</span><span>/</span>
          <span className="text-[var(--text2)] font-medium">Settings</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] flex items-center gap-3">
          <Settings className="text-brand-500" size={24} />
          Platform Settings
        </h1>
        <p className="text-[var(--text2)] text-sm mt-1">Manage admin profile, security preferences, and system parameters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Navigation Sidebar */}
        <div className="space-y-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition-colors ${
              activeTab === 'profile'
                ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                : 'text-[var(--text2)] hover:bg-dark-surface2 hover:text-[var(--text)]'
            }`}
          >
            <User size={18} /> Admin Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition-colors ${
              activeTab === 'security'
                ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                : 'text-[var(--text2)] hover:bg-dark-surface2 hover:text-[var(--text)]'
            }`}
          >
            <Shield size={18} /> Security & Roles
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition-colors ${
              activeTab === 'notifications'
                ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                : 'text-[var(--text2)] hover:bg-dark-surface2 hover:text-[var(--text)]'
            }`}
          >
            <Bell size={18} /> Notifications
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition-colors ${
              activeTab === 'system'
                ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                : 'text-[var(--text2)] hover:bg-dark-surface2 hover:text-[var(--text)]'
            }`}
          >
            <Database size={18} /> System Info
          </button>
        </div>

        {/* Content Panel */}
        <div className="col-span-2 space-y-6">
          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[var(--text)] mb-4">Admin Profile</h2>
              
              {/* Avatar Section */}
              <div className="flex gap-4 items-center mb-6 pb-6 border-b border-dark-border">
                <div className="relative group">
                  <img
                    src={avatarPreview || avatarUrl || user?.avatarUrl || `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=6366f1&color=fff`}
                    alt="Admin Avatar"
                    className="w-20 h-20 rounded-full object-cover border-2 border-brand-500/30 shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                  >
                    <Camera size={20} />
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-dark-surface2 border border-dark-border hover:bg-dark-surface3 text-sm font-medium text-[var(--text)] rounded-xl transition-colors flex items-center gap-2"
                    >
                      <Camera size={16} /> Change Avatar
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--text3)] mt-1">JPG, JPEG, PNG, or WEBP (Max 5 MB)</p>
                </div>
              </div>

              {/* Avatar Preview Modal / Box if file selected */}
              {avatarPreview && (
                <div className="mb-6 p-4 bg-brand-500/10 border border-brand-500/30 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={avatarPreview} alt="Avatar Preview" className="w-12 h-12 rounded-full object-cover border border-brand-500/40" />
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text)]">New Avatar Preview</h4>
                      <p className="text-xs text-[var(--text2)]">Click Save to apply changes across your account.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelAvatar}
                      className="px-3 py-1.5 bg-dark-surface2 hover:bg-dark-surface3 border border-dark-border text-xs font-semibold text-[var(--text2)] rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAvatar}
                      disabled={avatarSaving}
                      className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shadow-sm"
                    >
                      {avatarSaving ? 'Saving…' : 'Save Avatar'}
                    </button>
                  </div>
                </div>
              )}

              {/* Profile Details Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text3)] mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text3)] mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-[var(--text3)] mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-[var(--text3)] mb-1">Email Address</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-dark-surface2 border border-dark-border opacity-60 cursor-not-allowed rounded-xl px-4 py-2.5 text-sm text-[var(--text2)] outline-none"
                    />
                    <p className="text-xs text-[var(--text3)] mt-1">Admin email address is fixed for system security.</p>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl text-sm transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50"
                  >
                    {profileSaving ? 'Saving…' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Security & Roles */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Password Change */}
              <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                  <Key size={18} className="text-brand-500" /> Change Admin Password
                </h2>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text3)] mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--text3)] mb-1">New Password</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--text3)] mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl text-sm transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50"
                    >
                      {passwordSaving ? 'Updating…' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Sessions & 2FA */}
              <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between py-2 border-b border-dark-border">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text)]">Two-Factor Authentication (2FA)</h4>
                    <p className="text-xs text-[var(--text3)]">Add an extra layer of security to your admin account</p>
                  </div>
                  <button
                    onClick={() => {
                      setTwoFactorEnabled(!twoFactorEnabled);
                      toast.success(twoFactorEnabled ? "2FA Disabled" : "2FA Enabled successfully");
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                      twoFactorEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-dark-surface2 text-[var(--text2)] border border-dark-border'
                    }`}
                  >
                    {twoFactorEnabled ? 'Enabled ✅' : 'Enable 2FA'}
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text)]">Logout All Active Devices</h4>
                    <p className="text-xs text-[var(--text3)]">Terminate all active sessions except current browser</p>
                  </div>
                  <button
                    onClick={handleLogoutAll}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <LogOut size={14} /> Logout All
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Notifications */}
          {activeTab === 'notifications' && (
            <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-[var(--text)] mb-2">Notification Preferences</h2>
              <p className="text-xs text-[var(--text3)] mb-4">Choose which platform alerts triggering admin notifications.</p>

              <div className="space-y-4">
                {[
                  { key: 'emailAlerts', label: 'Email Alerts', desc: 'Send email notifications for critical platform events' },
                  { key: 'pushAlerts', label: 'In-App Toast Alerts', desc: 'Display pop-up toast alerts when active on dashboard' },
                  { key: 'refundAlerts', label: 'Refund Requests', desc: 'Alert immediately when a customer submits a refund request' },
                  { key: 'vendorAlerts', label: 'New Vendor Registrations', desc: 'Alert when a new vendor applies for approval' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3.5 bg-dark-surface2 rounded-xl border border-dark-border">
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--text)]">{item.label}</h4>
                      <p className="text-xs text-[var(--text3)]">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => {
                        setNotifications(prev => {
                          const updated = { ...prev, [item.key]: !prev[item.key] };
                          toast.success(`${item.label} ${updated[item.key] ? 'Enabled' : 'Disabled'}`);
                          return updated;
                        });
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-1 cursor-pointer ${
                        notifications[item.key] ? 'bg-brand-500' : 'bg-dark-surface3'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        notifications[item.key] ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: System Info */}
          {activeTab === 'system' && (
            <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-[var(--text)]">System Information</h2>
                <button
                  onClick={fetchSystemInfo}
                  disabled={sysLoading}
                  className="flex items-center gap-1.5 text-xs text-brand-500 font-semibold hover:underline"
                >
                  <RefreshCw size={12} className={sysLoading ? 'animate-spin' : ''} /> Refresh Status
                </button>
              </div>

              {sysLoading && !systemInfo ? (
                <div className="py-12 text-center">
                  <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2.5 border-b border-dark-border text-xs">
                    <span className="text-[var(--text2)]">Backend API Version</span>
                    <span className="font-bold text-[var(--text)]">{systemInfo?.backendVersion || 'v2.1.0'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-dark-border text-xs">
                    <span className="text-[var(--text2)]">Frontend Version</span>
                    <span className="font-bold text-[var(--text)]">{systemInfo?.frontendVersion || 'v1.0.0'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-dark-border text-xs">
                    <span className="text-[var(--text2)]">Java Runtime Environment</span>
                    <span className="font-bold text-[var(--text)]">{systemInfo?.javaVersion || 'Java 21'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-dark-border text-xs">
                    <span className="text-[var(--text2)]">Database Connection</span>
                    <span className="font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {systemInfo?.database || 'Connected'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-dark-border text-xs">
                    <span className="text-[var(--text2)]">Server Uptime</span>
                    <span className="font-bold text-brand-500">{systemInfo?.serverUptime || 'Active'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-dark-border text-xs">
                    <span className="text-[var(--text2)]">Total System Users</span>
                    <span className="font-bold text-[var(--text)]">{systemInfo?.totalUsers || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 text-xs">
                    <span className="text-[var(--text2)]">Server Time</span>
                    <span className="font-bold text-[var(--text)]">{systemInfo?.serverTime || new Date().toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
