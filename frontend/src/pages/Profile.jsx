import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, Camera, LogOut, Package, Heart, Star, MapPin } from 'lucide-react';
import { selectCurrentUser, logout } from '@store/slices/authSlice';
import { selectWishlistCount } from '@store/slices/wishlistSlice';
import { initials, formatDate, formatCurrency } from '@utils/formatters';
import { nameRules, phoneRules } from '@utils/validators';
import userService from '@services/userService';
import toast from 'react-hot-toast';

export default function Profile() {
  const dispatch = useDispatch();
  const user     = useSelector(selectCurrentUser);
  const wishlistCountFromRedux = useSelector(selectWishlistCount);

  const [stats, setStats] = useState({
    ordersCount: 0,
    wishlistCount: 0,
    reviewsCount: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    let isMounted = true;
    userService.getUserStats()
      .then(data => {
        if (isMounted && data) {
          setStats(data);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName:  user?.lastName  || '',
      email:     user?.email     || '',
      phone:     user?.phone     || '',
    }
  });

  const onSave = () => {
    toast.success('Profile updated successfully!');
  };

  const onPasswordChange = () => {
    toast.success('Password changed successfully!');
  };

  const userRole = user?.roles?.[0] || 'USER';
  const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User' : 'User';

  const STATS = [
    { icon: '📦', label: 'Orders',   value: stats.ordersCount },
    { icon: '❤️', label: 'Wishlist', value: Math.max(stats.wishlistCount, wishlistCountFromRedux) },
    { icon: '⭐', label: 'Reviews',  value: stats.reviewsCount },
    { icon: '💰', label: 'Spent',    value: formatCurrency(stats.totalSpent || 0) },
  ];

  return (
    <div className="page-enter">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Panel ──────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Avatar Card */}
          <div className="bg-dark-surface2 border border-dark-border rounded-2xl p-6 text-center shadow-xs">
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white mx-auto shadow-md">
                {initials(fullName)}
              </div>
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-dark-surface3 border border-dark-border rounded-full flex items-center justify-center text-gray-400 hover:text-[var(--text)] transition-colors shadow-xs">
                <Camera size={12} />
              </button>
            </div>
            <h3 className="font-bold text-base text-[var(--text)]">{fullName}</h3>
            <p className="text-gray-500 text-sm mt-0.5">{user?.email || ''}</p>
            <div className="mt-3 inline-block px-3.5 py-1 bg-brand-500/10 border border-brand-500/20 rounded-full text-xs font-bold text-brand-500 uppercase tracking-wider">
              {userRole}
            </div>
            <p className="text-xs text-gray-500 mt-2.5 font-medium">Member since {formatDate(user?.createdAt || new Date())}</p>
          </div>

          {/* Stats */}
          <div className="bg-dark-surface2 border border-dark-border rounded-2xl p-4 shadow-xs">
            <div className="grid grid-cols-2 gap-3">
              {STATS.map(s => (
                <div key={s.label} className="bg-dark-surface3 rounded-xl p-3 text-center border border-dark-border/20">
                  <div className="text-xl mb-1 select-none">{s.icon}</div>
                  <div className="font-extrabold text-base text-[var(--text)]">{s.value}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-dark-surface2 border border-dark-border rounded-2xl p-4 space-y-1 shadow-xs">
            <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest px-2 mb-3">Quick Access</h3>
            {[
              { icon: <Package size={14}/>, label: 'My Orders',  to: '/orders' },
              { icon: <Heart size={14}/>, label: 'Wishlist',   to: '/wishlist' },
              { icon: <MapPin size={14}/>, label: 'Track Order', to: '/orders/1/tracking' },
            ].map(link => (
              <a key={link.label} href={link.to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-[var(--text)] transition-colors cursor-pointer text-sm font-medium">
                <span className="text-gray-400">{link.icon}</span>
                <span>{link.label}</span>
              </a>
            ))}
            <button onClick={() => dispatch(logout())}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors text-sm font-bold mt-1">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>

        {/* ── Right Panel ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Personal Info */}
          <div className="bg-dark-surface2 border border-dark-border rounded-2xl overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
              <h2 className="font-bold text-sm flex items-center gap-2 text-[var(--text)]"><User size={14}/> Personal Information</h2>
            </div>
            <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">First Name</label>
                  <input {...register('firstName', nameRules)}
                    className="w-full bg-dark-surface3 border border-dark-border rounded-xl px-4 py-2.5 text-xs text-[var(--text)] outline-none focus:border-brand-500/60 focus:ring-4 focus:ring-brand-500/10 transition-all font-medium" />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Last Name</label>
                  <input {...register('lastName', nameRules)}
                    className="w-full bg-dark-surface3 border border-dark-border rounded-xl px-4 py-2.5 text-xs text-[var(--text)] outline-none focus:border-brand-500/60 focus:ring-4 focus:ring-brand-500/10 transition-all font-medium" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  <Mail size={11} className="inline mr-1" /> Email Address
                </label>
                <input {...register('email')} type="email" disabled
                  className="w-full bg-dark-surface3 border border-dark-border/40 rounded-xl px-4 py-2.5 text-xs text-gray-400 outline-none cursor-not-allowed font-medium opacity-65" />
                <p className="text-[10px] text-gray-400 mt-1.5">Email cannot be changed. Contact support if needed.</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  <Phone size={11} className="inline mr-1" /> Phone Number
                </label>
                <input {...register('phone', phoneRules)}
                  className="w-full bg-dark-surface3 border border-dark-border rounded-xl px-4 py-2.5 text-xs text-[var(--text)] outline-none focus:border-brand-500/60 focus:ring-4 focus:ring-brand-500/10 transition-all font-medium" />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>
              <button type="submit"
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm shadow-brand-500/10">
                Save Changes
              </button>
            </form>
          </div>

          {/* Security */}
          <div className="bg-dark-surface2 border border-dark-border rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-dark-border">
              <h2 className="font-bold text-sm flex items-center gap-2 text-[var(--text)]"><Lock size={14}/> Security</h2>
            </div>
            <div className="p-6 space-y-4">
              {['Current Password', 'New Password', 'Confirm New Password'].map((label, i) => (
                <div key={label}>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                  <input type="password" placeholder="••••••••"
                    className="w-full bg-dark-surface3 border border-dark-border rounded-xl px-4 py-2.5 text-xs text-[var(--text)] placeholder-gray-400 outline-none focus:border-brand-500/60 focus:ring-4 focus:ring-brand-500/10 transition-all font-medium" />
                </div>
              ))}
              <button onClick={onPasswordChange}
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm shadow-brand-500/10">
                Update Password
              </button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-dark-surface2 border border-red-500/20 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-red-500/20 bg-red-500/5">
              <h2 className="font-bold text-sm text-red-500">⚠️ Danger Zone</h2>
            </div>
            <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-sm text-[var(--text)]">Delete Account</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">Permanently remove your account and all data. This cannot be undone.</p>
              </div>
              <button className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 text-xs font-bold rounded-xl transition-all flex-shrink-0">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
