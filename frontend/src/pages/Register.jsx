import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Building2, MapPin, Phone, FileText, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import { registerUser, selectAuthLoading, selectServerWaking } from '@store/slices/authSlice';
import { gmailOnlyRules, passwordRules, nameRules, GMAIL_REGEX } from '@utils/validators';

const ROLES = [
  { value: 'USER',   label: 'Shopper',   icon: '👤', desc: 'Browse & buy products' },
  { value: 'VENDOR', label: 'Vendor',    icon: '🏪', desc: 'Sell your products' },
];

export default function Register() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const isLoading    = useSelector(selectAuthLoading);
  const serverWaking = useSelector(selectServerWaking);
  const [role, setRole] = useState('USER');

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    const rawEmail = data.email ? data.email.trim() : '';
    if (!GMAIL_REGEX.test(rawEmail)) {
      toast.error('Only Gmail addresses (@gmail.com) are allowed.');
      return;
    }

    const payload = { ...data, role };

    // Strip vendor fields if not a vendor
    if (role !== 'VENDOR') {
      delete payload.companyName;
      delete payload.businessAddress;
      delete payload.gstNumber;
      delete payload.businessDescription;
    }

    const result = await dispatch(registerUser(payload));
    if (registerUser.fulfilled.match(result)) {
      const user = result.payload?.user;
      if (user?.vendorStatus === 'PENDING') {
        navigate('/login', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-surface1 border border-dark-border rounded-3xl p-8 shadow-xl"
    >
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
          🛍️
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Create account</h1>
        <p className="text-[var(--text3)] text-sm mt-1">Join thousands of shoppers & vendors</p>
      </div>

      {/* Server wake up banner */}
      {serverWaking && (
        <div className="mb-4 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs font-medium flex items-center gap-2.5 animate-pulse">
          <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin flex-shrink-0" />
          <span>⚡ {serverWaking}</span>
        </div>
      )}

      {/* Role selector */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-2">
          I want to…
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`p-3 rounded-xl border text-center transition-all ${
                role === r.value
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-dark-border bg-dark-surface2 hover:border-dark-border2'
              }`}
            >
              <div className="text-xl mb-1">{r.icon}</div>
              <div className="text-xs font-semibold text-[var(--text)]">{r.label}</div>
              <div className="text-[10px] text-[var(--text3)] mt-0.5 leading-tight">{r.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-1.5">First Name</label>
            <input
              {...register('firstName', nameRules)}
              placeholder="Alex"
              className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors"
            />
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-1.5">Last Name</label>
            <input
              {...register('lastName', nameRules)}
              placeholder="Morgan"
              className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors"
            />
            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-1.5">Email</label>
          <div className="relative">
            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
            <input
              {...register('email', gmailOnlyRules)}
              type="email"
              placeholder="alex@gmail.com"
              className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors"
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-1.5">Password</label>
          <div className="relative">
            <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
            <input
              {...register('password', passwordRules)}
              type="password"
              placeholder="••••••••"
              className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors"
            />
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        {/* Vendor-specific fields */}
        <AnimatePresence>
          {role === 'VENDOR' && (
            <motion.div
              key="vendor-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-2 border-t border-dark-border mt-2">
                <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Business Details</p>

                {/* Company Name */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-1.5">Company Name <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
                    <input
                      {...register('companyName', { required: role === 'VENDOR' ? 'Company name is required' : false })}
                      placeholder="TechWave Store"
                      className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors"
                    />
                  </div>
                  {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
                    <input
                      {...register('phone')}
                      type="tel"
                      placeholder="+91 98765 43210"
                      className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors"
                    />
                  </div>
                </div>

                {/* Business Address */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-1.5">Business Address</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3.5 top-3.5 text-[var(--text3)]" />
                    <textarea
                      {...register('businessAddress')}
                      rows={2}
                      placeholder="123 Business Street, City, State"
                      className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* GST Number */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-1.5">GST Number <span className="text-[var(--text3)] font-normal">(Optional)</span></label>
                  <div className="relative">
                    <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
                    <input
                      {...register('gstNumber')}
                      placeholder="22AAAAA0000A1Z5"
                      className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors"
                    />
                  </div>
                </div>

                {/* Business Description */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-1.5">Business Description <span className="text-[var(--text3)] font-normal">(Optional)</span></label>
                  <div className="relative">
                    <FileText size={14} className="absolute left-3.5 top-3.5 text-[var(--text3)]" />
                    <textarea
                      {...register('businessDescription')}
                      rows={2}
                      placeholder="Tell us about your business..."
                      className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* Vendor pending notice */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-400 flex gap-2">
                  <span className="text-base leading-none">⏳</span>
                  <span>Your vendor account will need to be <strong>approved by an admin</strong> before you can sell products.</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{serverWaking ? 'Server is starting…' : 'Creating…'}</>
          ) : role === 'VENDOR' ? '🏪 Register as Vendor' : '🚀 Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--text3)] mt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-500 hover:text-brand-600 font-medium">Sign in</Link>
      </p>
    </motion.div>
  );
}
