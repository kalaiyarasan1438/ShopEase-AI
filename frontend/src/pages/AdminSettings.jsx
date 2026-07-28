import React from 'react';
import { Settings, User, Shield, Bell, Database } from 'lucide-react';
import { useSelector } from 'react-redux';

export default function AdminSettings() {
  const { user } = useSelector(state => state.auth);

  return (
    <div className="space-y-6 page-enter max-w-5xl">
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
        <p className="text-[var(--text2)] text-sm mt-1">Manage admin profile and system configuration.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Sidebar */}
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-brand-500/10 text-brand-500 font-medium rounded-xl transition-colors">
            <User size={18} />
            Admin Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[var(--text2)] hover:bg-dark-surface2 hover:text-[var(--text)] font-medium rounded-xl transition-colors">
            <Shield size={18} />
            Security & Roles
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[var(--text2)] hover:bg-dark-surface2 hover:text-[var(--text)] font-medium rounded-xl transition-colors">
            <Bell size={18} />
            Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[var(--text2)] hover:bg-dark-surface2 hover:text-[var(--text)] font-medium rounded-xl transition-colors">
            <Database size={18} />
            System Info
          </button>
        </div>

        {/* Content area */}
        <div className="col-span-2 space-y-6">
          {/* Profile Settings */}
          <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--text)] mb-4">Admin Profile</h2>
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <img src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6366f1&color=fff`} alt="Admin" className="w-16 h-16 rounded-full" />
                <div>
                  <button className="px-4 py-2 bg-dark-surface2 border border-dark-border hover:bg-dark-surface3 text-sm font-medium text-[var(--text)] rounded-xl transition-colors">
                    Change Avatar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text3)] mb-1">First Name</label>
                  <input type="text" defaultValue={user?.firstName} className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text3)] mb-1">Last Name</label>
                  <input type="text" defaultValue={user?.lastName} className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60 transition-colors" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[var(--text3)] mb-1">Email Address</label>
                  <input type="email" defaultValue={user?.email} disabled className="w-full bg-dark-surface2 border border-dark-border opacity-60 cursor-not-allowed rounded-xl px-4 py-2.5 text-sm text-[var(--text2)] outline-none transition-colors" />
                  <p className="text-xs text-[var(--text3)] mt-1">Admin email cannot be changed.</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl text-sm transition-colors shadow-lg shadow-brand-500/20">
                  Save Changes
                </button>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--text)] mb-4">System Information</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-dark-border">
                <span className="text-sm text-[var(--text2)]">Platform Version</span>
                <span className="text-sm font-medium text-[var(--text)]">v2.1.0</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-dark-border">
                <span className="text-sm text-[var(--text2)]">Environment</span>
                <span className="text-sm font-medium px-2 py-0.5 rounded bg-green-500/10 text-green-400">Production</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-dark-border">
                <span className="text-sm text-[var(--text2)]">Database Status</span>
                <span className="text-sm font-medium px-2 py-0.5 rounded bg-green-500/10 text-green-400">Connected</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-[var(--text2)]">Server Time</span>
                <span className="text-sm font-medium text-[var(--text)]">{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
