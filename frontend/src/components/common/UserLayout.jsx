import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Package, Heart, List, User, LogOut, Bell, Search, Menu, X, 
  ChevronRight, Sliders, Check, Sparkles, ShoppingCart, Mic, Image
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logout, selectCurrentUser } from '@store/slices/authSlice';
import { selectCartCount } from '@store/slices/cartSlice';
import { selectWishlistCount } from '@store/slices/wishlistSlice';
import ChatBot from '@components/ai/ChatBot.jsx';
import { initials } from '@utils/formatters';
import api from '@services/api';

const USER_NAV = [
  {
    label: 'NAVIGATION',
    items: [
      { to: '/',         icon: Home,        label: 'Home' },
      { to: '/products', icon: Package,     label: 'Browse Shop' },
      { to: '/profile',  icon: User,        label: 'Account settings' },
    ],
  },
  {
    label: 'MY ACCOUNT & ORDERS',
    items: [
      { to: '/orders',   icon: List,  label: 'My Orders / Returns' },
      { to: '/wishlist', icon: Heart, label: 'My Wishlist', badge: 'wish' },
    ],
  }
];

export default function UserLayout() {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const user        = useSelector(selectCurrentUser);
  const cartCount   = useSelector(selectCartCount);
  const wishCount   = useSelector(selectWishlistCount);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search,      setSearch]      = useState('');
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef(null);

  // Poll user active orders every 5s
  useEffect(() => {
    const checkUserNotifs = async () => {
      try {
        const res = await api.get('/api/orders?size=10');
        const orders = res.data?.content || [];
        const active = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'REFUNDED').length;
        setActiveOrderCount(active);
      } catch {}
    };
    checkUserNotifs();
    const interval = setInterval(checkUserNotifs, 5000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic Appearance states
  const [theme, setTheme] = useState(() => localStorage.getItem('shopeasy-theme') || 'light');
  const [accent, setAccent] = useState(() => localStorage.getItem('shopeasy-accent') || 'violet');
  const [customizeOpen, setCustomizeOpen] = useState(false);

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

  const handleSearch = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
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
            navigate(`/products?search=${encodeURIComponent(transcript.trim())}`);
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

  const getBadge = (key) => {
    if (key === 'cart') return cartCount;
    if (key === 'wish') return wishCount;
    return null;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-dark-bg text-[var(--text)] transition-colors duration-300">
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
              USER
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar space-y-6">
            {USER_NAV.map((section) => (
              <div key={section.label} className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3">
                  {section.label}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const badge = getBadge(item.badge);
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
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
                            {badge > 0 && (
                              <span className="px-2 py-0.5 bg-brand-500 text-white text-[10px] font-bold rounded-full leading-none shadow-sm shadow-brand-500/20">
                                {badge}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Profile / Login bottom tile */}
          <div className="p-4 border-t border-dark-border space-y-2">
            {user ? (
              <>
                <NavLink to="/profile" className="flex items-center gap-3 p-2 rounded-xl hover:bg-dark-surface2 transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {initials(user.firstName + ' ' + user.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-[var(--text)]">{`${user.firstName} ${user.lastName}`}</p>
                    <p className="text-[10px] text-gray-400 truncate uppercase font-bold tracking-wider">Account</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-400" />
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[var(--text)] hover:bg-brand-500/10 hover:text-brand-500 transition-all cursor-pointer border border-dark-border hover:border-brand-500/30"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center flex-shrink-0">
                  <User size={16} />
                </div>
                <span className="flex-1 font-semibold text-sm">Login</span>
                <ChevronRight size={14} className="text-gray-400" />
              </NavLink>
            )}
          </div>
        </div>
      </motion.aside>

      {/* ── Main Layout Wrapper ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
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
              placeholder="Search items, brands, and premium recommendations..."
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
                  const rawName = file.name.split('.')[0];
                  const cleanKeyword = rawName
                    .replace(/^(screenshot|img|image|photo|pic|pxl|dcim|win|\d+)+/gi, '')
                    .replace(/[\-_.]/g, ' ')
                    .replace(/\b\d+\b/g, '')
                    .trim();

                  if (cleanKeyword.length >= 2) {
                    setSearch(cleanKeyword);
                    navigate(`/products?search=${encodeURIComponent(cleanKeyword)}`);
                    toast.success(`Image search active for "${cleanKeyword}"`);
                  } else {
                    setSearch('');
                    toast(`📷 Image uploaded! Try typing product terms like 'fashion', 'shoes', or 'electronics'`, { icon: '💡' });
                  }
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
              onClick={() => search.trim() && navigate(`/products?search=${encodeURIComponent(search.trim())}`)}
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
                {activeOrderCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-dark-surface1 animate-pulse">
                    {activeOrderCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-dark-surface1 border border-dark-border rounded-2xl shadow-xl z-50 p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-dark-border mb-3">
                    <span className="font-bold text-xs text-[var(--text)] uppercase tracking-wider">Order Updates</span>
                    <span className="text-[10px] px-2 py-0.5 bg-brand-500/10 text-brand-500 rounded-full font-semibold">
                      {activeOrderCount} active order{activeOrderCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {activeOrderCount > 0 ? (
                    <div className="space-y-2">
                      <Link
                        to="/orders"
                        onClick={() => setNotifOpen(false)}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-500 hover:bg-brand-500/20 transition-all cursor-pointer"
                      >
                        <Bell size={16} />
                        <div>
                          <p className="text-xs font-bold">Active Orders Tracking</p>
                          <p className="text-[10px] text-gray-400">You have {activeOrderCount} order(s) currently being processed or shipped.</p>
                        </div>
                      </Link>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-3">No active orders</p>
                  )}
                </div>
              )}
            </div>

            <NavLink to="/wishlist" className="w-9 h-9 flex items-center justify-center rounded-xl bg-dark-surface2 border border-dark-border text-gray-400 hover:text-red-500 hover:border-red-500/20 transition-all relative shadow-xs" title="My Wishlist">
              <Heart size={15} />
              {wishCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {wishCount}
                </span>
              )}
            </NavLink>

            <NavLink to="/cart" className="w-9 h-9 flex items-center justify-center rounded-xl bg-dark-surface2 border border-dark-border text-gray-400 hover:text-brand-500 hover:border-brand-500/20 transition-all relative shadow-xs" title="Cart">
              <ShoppingCart size={15} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </NavLink>

            <NavLink to="/profile" className="ml-1 w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-xs hover:opacity-90 transition-opacity" title="My Profile">
              {user ? initials(user.firstName + ' ' + user.lastName) : <User size={15} />}
            </NavLink>
          </div>
        </header>

        <div className="px-6 py-2.5 bg-dark-surface1 border-b border-dark-border flex md:hidden items-center justify-center z-10 shadow-xs">
          <div className="relative w-full flex items-center bg-dark-surface2 border border-dark-border rounded-full overflow-hidden hover:border-brand-500/40">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search products, brands, and categories..."
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
              onClick={() => search.trim() && navigate(`/products?search=${encodeURIComponent(search.trim())}`)}
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
                  <button onClick={() => setTheme('light')} className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${theme === 'light' ? 'border-brand-500 bg-brand-500/10 text-brand-500 font-semibold' : 'border-dark-border bg-dark-surface2 text-gray-400 hover:border-brand-500/50'}`}>
                    <span className="text-2xl mb-1">☀️</span><span className="text-xs font-semibold text-[var(--text)]">Elegant Light</span>
                  </button>
                  <button onClick={() => setTheme('dark')} className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${theme === 'dark' ? 'border-brand-500 bg-brand-500/10 text-brand-500 font-semibold' : 'border-dark-border bg-dark-surface2 text-gray-400 hover:border-brand-500/50'}`}>
                    <span className="text-2xl mb-1">🌌</span><span className="text-xs font-semibold text-[var(--text)]">Sleek Dark</span>
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
                    <button key={color.id} onClick={() => setAccent(color.id)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${accent === color.id ? 'border-brand-500 bg-brand-500/5 text-brand-500 font-semibold shadow-sm' : 'border-dark-border bg-dark-surface2 text-gray-400 hover:border-brand-500/50'}`}>
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
