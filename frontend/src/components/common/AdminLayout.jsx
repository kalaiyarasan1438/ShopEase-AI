import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Store, Package, Users, List, TrendingUp, Settings, User,
  LogOut, Bell, Search, Menu, X, ChevronRight, Sliders, Check, Sparkles, Mic, Image
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logout, selectCurrentUser } from '@store/slices/authSlice';
import ChatBot from '@components/ai/ChatBot.jsx';
import { initials } from '@utils/formatters';
import api from '@services/api';

const ADMIN_NAV = [
  {
    label: 'ADMINISTRATION',
    items: [
      { to: '/admin/dashboard', icon: BarChart3,  label: 'Dashboard' },
      { to: '/admin/users',     icon: Users,      label: 'User Management' },
      { to: '/admin/vendors',   icon: Store,      label: 'Vendor Management' },
      { to: '/admin/products',  icon: Package,    label: 'Product Management' },
      { to: '/admin/orders',    icon: List,       label: 'Orders Management' },
      { to: '/admin/analytics', icon: TrendingUp, label: 'Analytics Panel' },
      { to: '/admin/settings',  icon: Settings,   label: 'Settings' },
      { to: '/admin/profile',   icon: User,       label: 'Profile' },
    ],
  }
];

export default function AdminLayout() {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const user        = useSelector(selectCurrentUser);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search,      setSearch]      = useState('');
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef(null);

  // Dynamic Appearance states
  const [theme, setTheme] = useState(() => localStorage.getItem('shopeasy-theme') || 'light');
  const [accent, setAccent] = useState(() => localStorage.getItem('shopeasy-accent') || 'violet');
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const [prevStats, setPrevStats] = useState(null);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('shopeasy-theme', theme);

    const accentClasses = ['accent-emerald', 'accent-crimson', 'accent-amber', 'accent-sky'];
    accentClasses.forEach(cls => root.classList.remove(cls));
    if (accent !== 'violet') {
      root.classList.add(`accent-${accent}`);
    }
    localStorage.setItem('shopeasy-accent', accent);
  }, [theme, accent]);

  // Admin Live Toast Notifications Poller (5s)
  useEffect(() => {
    let isMounted = true;
    const pollNotifications = async () => {
      try {
        const res = await api.get('/api/admin/stats');
        const next = res.data;

        if (prevStats && isMounted) {
          if (next.totalOrders > prevStats.totalOrders) {
            toast.success(`🛒 New order placed! Total orders: ${next.totalOrders}`, { duration: 5000, icon: '📦' });
          }
          if (next.pendingVendors > prevStats.pendingVendors) {
            toast(`🏪 New vendor registration pending approval!`, { duration: 5000, icon: '🔔' });
          }
          if (next.pendingRefunds > prevStats.pendingRefunds) {
            toast.error(`🔄 New refund request submitted!`, { duration: 5000 });
          }
          if (next.lowStockCount > prevStats.lowStockCount) {
            toast.error(`⚠️ Low stock alert: ${next.lowStockCount} items below threshold!`, { duration: 5000 });
          }
        }
        if (isMounted) setPrevStats(next);
      } catch (err) {
        // silent
      }
    };

    pollNotifications();
    const timer = setInterval(pollNotifications, 5000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [prevStats]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      // Admin product search
      navigate(`/admin/products?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.onstart = () => {
          setIsListening(true);
          toast.success('Voice search listening... Speak now');
        };
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setSearch(transcript);
          setIsListening(false);
          if (transcript.trim()) {
            navigate(`/admin/products?search=${encodeURIComponent(transcript.trim())}`);
          }
        };
        recognition.onerror = () => {
          setIsListening(false);
          toast.error('Voice search failed. Please try typing.');
        };
        recognition.onend = () => setIsListening(false);
        recognition.start();
      } catch {
        toast.success('Voice search activated. Speak your query.');
      }
    } else {
      toast.success('Voice search activated. Speak your query.');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Signed out successfully');
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-dark-bg text-[var(--text)] transition-colors duration-300">
      {/* ── Collapsible Left Sidebar ───────────────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex-shrink-0 overflow-hidden bg-dark-surface1 border-r border-dark-border flex flex-col z-20"
      >
        <div style={{ width: 240 }} className="flex flex-col h-full">
          {/* Sidebar Branded header */}
          <div className="px-6 py-5 border-b border-dark-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                <Sparkles size={14} className="animate-pulse" />
              </div>
              <span className="font-bold text-base tracking-tight text-[var(--text)]">
                Shop<span className="text-brand-500">Easy</span>
              </span>
            </div>
            <div className="px-2 py-0.5 bg-brand-500/10 text-brand-500 rounded-md text-[9px] font-bold tracking-widest uppercase">
              ADMIN
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar space-y-6">
            {ADMIN_NAV.map((section) => (
              <div key={section.label} className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3">
                  {section.label}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/admin/dashboard'}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-brand-500/10 text-brand-500 font-semibold'
                            : 'text-gray-500 hover:bg-dark-surface2 hover:text-[var(--text)]'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-brand-500 rounded-r-full" />
                          )}
                          <item.icon size={16} className={isActive ? 'text-brand-500' : 'text-gray-400 group-hover:text-[var(--text)]'} />
                          <span className="flex-1">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* User Profile bottom tile */}
          <div className="p-4 border-t border-dark-border space-y-2">
            <Link to="/admin/profile" className="flex items-center gap-3 p-2 rounded-xl hover:bg-dark-surface2 transition-colors cursor-pointer group">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {user ? initials(user.firstName + ' ' + user.lastName) : '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-[var(--text)] group-hover:text-brand-500 transition-colors">{user ? `${user.firstName} ${user.lastName}` : '...'}</p>
                <p className="text-[10px] text-gray-400 truncate uppercase font-bold tracking-wider">Admin Portal</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </motion.aside>

      {/* ── Main Layout Wrapper ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* ── Navbar ───────────────────────── */}
        <header className="h-16 flex-shrink-0 bg-dark-surface1/90 backdrop-blur-md border-b border-dark-border flex items-center gap-4 px-6 sticky top-0 z-40 justify-between shadow-sm">
          
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-[var(--text)] hover:bg-dark-surface2 border border-dark-border transition-all"
            >
              {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>

          <div className="relative flex-1 max-w-2xl mx-4 hidden md:flex items-center bg-dark-surface2 border border-dark-border rounded-full hover:border-brand-500/40 focus-within:border-brand-500/60 focus-within:ring-4 focus-within:ring-brand-500/10 transition-all duration-200 overflow-hidden">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search admin records..."
              className="flex-1 bg-transparent pl-5 pr-3 py-2.5 text-xs text-[var(--text)] placeholder-gray-400 outline-none"
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const queryName = file.name.split('.')[0].replace(/[-_]/g, ' ');
                  setSearch(queryName);
                }
              }}
            />
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`p-2 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-brand-500'}`}
              title="Voice Search"
            >
              <Mic size={15} />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-brand-500 transition-colors"
              title="Image Search"
            >
              <Image size={15} />
            </button>
            <button
              type="button"
              onClick={() => search.trim() && navigate(`/admin/products?search=${encodeURIComponent(search.trim())}`)}
              className="px-4 py-2.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 transition-colors rounded-r-full border-l border-dark-border"
              title="Search"
            >
              <Search size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            
            <button
              onClick={() => setCustomizeOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-dark-surface2 border border-dark-border text-gray-400 hover:text-[var(--text)] hover:border-brand-500/40 transition-all shadow-xs"
              title="Appearance Settings"
            >
              <Sliders size={15} />
            </button>

            <div className="relative">
              <button
                onClick={() => setNotifOpen(o => !o)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-dark-surface2 border border-dark-border text-gray-400 hover:text-[var(--text)] hover:border-brand-500/40 transition-all relative shadow-xs"
                title="Notifications"
              >
                <Bell size={15} />
              </button>
            </div>

            <Link to="/admin/profile" className="ml-1 w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-xs hover:opacity-90 transition-opacity" title="Admin Profile">
              {user ? initials(user.firstName + ' ' + user.lastName) : <User size={15} />}
            </Link>
          </div>
        </header>

        <div className="px-6 py-2.5 bg-dark-surface1 border-b border-dark-border flex md:hidden items-center justify-center z-10 shadow-xs">
          <div className="relative w-full flex items-center bg-dark-surface2 border border-dark-border rounded-full overflow-hidden hover:border-brand-500/40">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search..."
              className="w-full bg-transparent pl-4 pr-2 py-2 text-xs text-[var(--text)] outline-none"
            />
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`p-1.5 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-brand-500'}`}
              title="Voice Search"
            >
              <Mic size={14} />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-gray-400 hover:text-brand-500 transition-colors"
              title="Image Search"
            >
              <Image size={14} />
            </button>
            <button
              type="button"
              onClick={() => search.trim() && navigate(`/admin/products?search=${encodeURIComponent(search.trim())}`)}
              className="px-3 py-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 transition-colors border-l border-dark-border"
              title="Search"
            >
              <Search size={14} />
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6 bg-dark-bg transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Slide-over Customization Drawer Panel ───────────────────────── */}
      <AnimatePresence>
        {customizeOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setCustomizeOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-dark-surface1 border-l border-dark-border shadow-2xl z-50 flex flex-col p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-5 border-b border-dark-border">
                <div className="flex items-center gap-2.5">
                  <Sliders className="text-brand-500" size={16} />
                  <span className="font-bold text-base text-[var(--text)]">Appearance Settings</span>
                </div>
                <button
                  onClick={() => setCustomizeOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[var(--text)] hover:bg-dark-surface2 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="py-5 border-b border-dark-border">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Interface Theme</span>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                      theme === 'light'
                        ? 'border-brand-500 bg-brand-500/10 text-brand-500 font-semibold'
                        : 'border-dark-border bg-dark-surface2 text-gray-400 hover:border-brand-500/50'
                    }`}
                  >
                    <span className="text-2xl mb-1">☀️</span>
                    <span className="text-xs font-semibold text-[var(--text)]">Elegant Light</span>
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                      theme === 'dark'
                        ? 'border-brand-500 bg-brand-500/10 text-brand-500 font-semibold'
                        : 'border-dark-border bg-dark-surface2 text-gray-400 hover:border-brand-500/50'
                    }`}
                  >
                    <span className="text-2xl mb-1">🌌</span>
                    <span className="text-xs font-semibold text-[var(--text)]">Sleek Dark</span>
                  </button>
                </div>
              </div>

              <div className="py-5">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Accent Preset</span>
                <div className="space-y-2 mt-3">
                  {[
                    { id: 'violet',   name: 'Royal Violet',  colorClass: 'bg-[#6366f1]' },
                    { id: 'emerald',  name: 'Cyber Emerald', colorClass: 'bg-[#10b981]' },
                    { id: 'crimson',  name: 'Neo Crimson',   colorClass: 'bg-[#f43f5e]' },
                    { id: 'amber',    name: 'Solar Amber',   colorClass: 'bg-[#f59e0b]' },
                    { id: 'sky',      name: 'Ocean Sky',     colorClass: 'bg-[#0ea5e9]' },
                  ].map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setAccent(color.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                        accent === color.id
                          ? 'border-brand-500 bg-brand-500/5 text-brand-500 font-semibold shadow-sm'
                          : 'border-dark-border bg-dark-surface2 text-gray-400 hover:border-brand-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-3.5 h-3.5 rounded-full ${color.colorClass} border border-white/20`} />
                        <span className="text-xs text-[var(--text)]">{color.name}</span>
                      </div>
                      {accent === color.id && <Check className="text-brand-500" size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ChatBot />
    </div>
  );
}
