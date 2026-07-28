import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, Lock, Camera, LogOut, Store, Package, List } from 'lucide-react';
import { selectCurrentUser, logout } from '@store/slices/authSlice';
import { initials, formatDate } from '@utils/formatters';
import toast from 'react-hot-toast';

export default function VendorProfile() {
  const dispatch = useDispatch();
  const user     = useSelector(selectCurrentUser);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      firstName: user?.firstName || 'Vendor',
      lastName:  user?.lastName  || 'User',
      email:     user?.email     || 'vendor@shopeasy.com',
      phone:     user?.phone     || '+91 98765 43210',
    }
  });

  const onSave = () => toast.success('Vendor Profile updated successfully!');
  const onPasswordChange = () => toast.success('Password changed successfully!');

  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Vendor User';
  const userRole = 'VENDOR';

  return (
    <div className="page-enter">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-[var(--text3)] mb-2">
          <span>Vendor</span><span>/</span>
          <span className="text-[var(--text2)] font-medium">Profile</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Vendor Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your seller account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Panel ──────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Avatar Card */}
          <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 text-center shadow-xs">
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white mx-auto shadow-md">
                {initials(fullName)}
              </div>
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-dark-surface2 border border-dark-border rounded-full flex items-center justify-center text-gray-400 hover:text-[var(--text)] transition-colors shadow-xs">
                <Camera size={12} />
              </button>
            </div>
            <h3 className="font-bold text-base text-[var(--text)]">{fullName}</h3>
            <p className="text-gray-500 text-sm mt-0.5">{user?.email}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1 bg-brand-500/10 border border-brand-500/20 rounded-full text-xs font-bold text-brand-500 uppercase tracking-wider">
              <Store size={12} /> {userRole}
            </div>
            <p className="text-xs text-gray-500 mt-2.5 font-medium">
              Selling since {user?.createdAt ? formatDate(user.createdAt) : '—'}
            </p>
          </div>

          {/* Quick Links — all point to correct /vendor/* routes */}
          <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-4 space-y-1 shadow-xs">
            <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest px-2 mb-3">Seller Links</h3>
            {[
              { icon: <Store  size={14}/>, label: 'Dashboard',    to: '/vendor/dashboard' },
              { icon: <Package size={14}/>, label: 'My Products', to: '/vendor/products'  },
              { icon: <List   size={14}/>, label: 'Manage Orders', to: '/vendor/orders'   },
            ].map(link => (
              <a key={link.label} href={link.to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-dark-surface2 text-gray-500 hover:text-[var(--text)] transition-colors cursor-pointer text-sm font-medium">
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
          <div className="bg-dark-surface1 border border-dark-border rounded-2xl overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border bg-dark-surface2">
              <h2 className="font-bold text-sm flex items-center gap-2 text-[var(--text)]">
                <User size={14}/> Seller Information
              </h2>
            </div>
            <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">First Name</label>
                  <input {...register('firstName', { required: 'First name required' })}
                    className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-xs text-[var(--text)] outline-none focus:border-brand-500/60 focus:ring-4 focus:ring-brand-500/10 transition-all font-medium" />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Last Name</label>
                  <input {...register('lastName', { required: 'Last name required' })}
                    className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-xs text-[var(--text)] outline-none focus:border-brand-500/60 focus:ring-4 focus:ring-brand-500/10 transition-all font-medium" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  <Mail size={11} className="inline mr-1" /> Email Address
                </label>
                <input {...register('email')} type="email" disabled
                  className="w-full bg-dark-surface2 border border-dark-border/40 rounded-xl px-4 py-2.5 text-xs text-[var(--text2)] outline-none cursor-not-allowed font-medium opacity-80" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  <Phone size={11} className="inline mr-1" /> Phone Number
                </label>
                <input {...register('phone')}
                  className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-xs text-[var(--text)] outline-none focus:border-brand-500/60 focus:ring-4 focus:ring-brand-500/10 transition-all font-medium" />
              </div>
              <button type="submit"
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm shadow-brand-500/10">
                Save Changes
              </button>
            </form>
          </div>

          {/* Security */}
          <div className="bg-dark-surface1 border border-dark-border rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-dark-border bg-dark-surface2">
              <h2 className="font-bold text-sm flex items-center gap-2 text-[var(--text)]">
                <Lock size={14}/> Security
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {['Current Password', 'New Password', 'Confirm New Password'].map((label) => (
                <div key={label}>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                  <input type="password" placeholder="••••••••"
                    className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-xs text-[var(--text)] placeholder-gray-400 outline-none focus:border-brand-500/60 focus:ring-4 focus:ring-brand-500/10 transition-all font-medium" />
                </div>
              ))}
              <button onClick={onPasswordChange}
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm shadow-brand-500/10">
                Update Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
