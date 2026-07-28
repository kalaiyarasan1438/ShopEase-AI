import React, { useState } from 'react';
import { Settings, Store, Bell, Lock, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'store', label: 'Store Info', icon: Store },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'billing', label: 'Bank & GST', icon: CreditCard },
];

export default function VendorSettings() {
  const [activeTab, setActiveTab] = useState('store');

  return (
    <div className="space-y-6 page-enter">
      <div>
        <div className="flex items-center gap-2 text-xs text-[var(--text3)] mb-2">
          <span>Vendor</span><span>/</span>
          <span className="text-[var(--text2)] font-medium">Settings</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] flex items-center gap-3">
          <Settings className="text-brand-500" size={24} /> Settings
        </h1>
      </div>

      <div className="flex gap-6">
        {/* Tab Sidebar */}
        <div className="w-48 flex-shrink-0">
          <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-2 space-y-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand-500/10 text-brand-500'
                    : 'text-[var(--text3)] hover:bg-dark-surface2 hover:text-[var(--text)]'
                }`}>
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === 'store' && <StoreInfoTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'billing' && <BillingTab />}
        </div>
      </div>
    </div>
  );
}

function StoreInfoTab() {
  const [form, setForm] = useState({
    businessName: '', description: '', address: '', phone: '',
  });
  return (
    <div className="bg-dark-surface1 border border-dark-border rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-dark-border bg-dark-surface2">
        <h2 className="font-bold text-sm text-[var(--text)]">Store Information</h2>
      </div>
      <div className="p-6 space-y-4">
        {[
          { label: 'Business Name', key: 'businessName', placeholder: 'e.g., TechWave Official Store' },
          { label: 'Store Address', key: 'address', placeholder: 'Full address...' },
          { label: 'Business Phone', key: 'phone', placeholder: '+91 98765 43210' },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-bold text-[var(--text3)] uppercase tracking-wider mb-1.5">{label}</label>
            <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60 transition-colors" />
          </div>
        ))}
        <div>
          <label className="block text-xs font-bold text-[var(--text3)] uppercase tracking-wider mb-1.5">Store Description</label>
          <textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe your store..."
            className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60 transition-colors resize-none" />
        </div>
        <button onClick={() => toast.success('Store information saved!')}
          className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm shadow-brand-500/10">
          Save Store Info
        </button>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    newOrder: true, statusUpdate: true, lowStock: true, promotions: false,
  });
  const togglePref = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));
  return (
    <div className="bg-dark-surface1 border border-dark-border rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-dark-border bg-dark-surface2">
        <h2 className="font-bold text-sm text-[var(--text)]">Notification Preferences</h2>
      </div>
      <div className="p-6 space-y-4">
        {[
          { key: 'newOrder', label: 'New Order Received', desc: 'Get notified when a customer places an order.' },
          { key: 'statusUpdate', label: 'Status Updates', desc: 'Notifications for order status changes.' },
          { key: 'lowStock', label: 'Low Stock Alerts', desc: 'Alert when product stock falls below 10.' },
          { key: 'promotions', label: 'Platform Promotions', desc: 'Promotional emails from ShopEasy.' },
        ].map(item => (
          <div key={item.key} className="flex items-start justify-between gap-4 p-4 rounded-xl border border-dark-border hover:bg-dark-surface2 transition-colors">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">{item.label}</p>
              <p className="text-xs text-[var(--text3)] mt-0.5">{item.desc}</p>
            </div>
            <button onClick={() => togglePref(item.key)}
              className={`relative w-10 h-5.5 rounded-full transition-all flex-shrink-0 ${prefs[item.key] ? 'bg-brand-500' : 'bg-dark-surface3'}`}
              style={{ height: 22, width: 40 }}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${prefs[item.key] ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        ))}
        <button onClick={() => toast.success('Notification preferences saved!')}
          className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm shadow-brand-500/10">
          Save Preferences
        </button>
      </div>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="bg-dark-surface1 border border-dark-border rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-dark-border bg-dark-surface2">
        <h2 className="font-bold text-sm text-[var(--text)]">Password & Security</h2>
      </div>
      <div className="p-6 space-y-4">
        {['Current Password', 'New Password', 'Confirm New Password'].map(label => (
          <div key={label}>
            <label className="block text-xs font-bold text-[var(--text3)] uppercase tracking-wider mb-1.5">{label}</label>
            <input type="password" placeholder="••••••••"
              className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60 transition-colors" />
          </div>
        ))}
        <button onClick={() => toast.success('Password changed successfully!')}
          className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm shadow-brand-500/10">
          Update Password
        </button>
      </div>
    </div>
  );
}

function BillingTab() {
  const [form, setForm] = useState({ gstNumber: '', bankName: '', accountNumber: '', ifscCode: '' });
  return (
    <div className="bg-dark-surface1 border border-dark-border rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-dark-border bg-dark-surface2">
        <h2 className="font-bold text-sm text-[var(--text)]">Bank & GST Details</h2>
      </div>
      <div className="p-6 space-y-4">
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-600 font-medium">
          ⚠️ Your bank details are encrypted and stored securely.
        </div>
        {[
          { label: 'GST Number', key: 'gstNumber', placeholder: '22AAAAA0000A1Z5' },
          { label: 'Bank Name', key: 'bankName', placeholder: 'e.g., HDFC Bank' },
          { label: 'Account Number', key: 'accountNumber', placeholder: '••••••••••••' },
          { label: 'IFSC Code', key: 'ifscCode', placeholder: 'HDFC0001234' },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-bold text-[var(--text3)] uppercase tracking-wider mb-1.5">{label}</label>
            <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60 transition-colors" />
          </div>
        ))}
        <button onClick={() => toast.success('Billing details saved!')}
          className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm shadow-brand-500/10">
          Save Bank Details
        </button>
      </div>
    </div>
  );
}
