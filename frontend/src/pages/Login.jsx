import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { loginUser, selectAuthLoading, selectAuthError } from '@store/slices/authSlice';
import { emailRules } from '@utils/validators';

export default function Login() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);
  const [showPwd, setShowPwd] = React.useState(false);

  const from = location.state?.from?.pathname || '/';

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    const result = await dispatch(loginUser(data));
    if (loginUser.fulfilled.match(result)) {
      const userObj = result.payload?.user;
      // roles come back WITHOUT the ROLE_ prefix: "ADMIN", "VENDOR", "USER"
      const rolesList = userObj?.roles
        ? (Array.isArray(userObj.roles) ? userObj.roles : [...userObj.roles])
        : [];
      const role = rolesList[0] || 'USER';

      let redirectPath = from;
      if (from === '/') {
        if (role === 'ADMIN')       redirectPath = '/admin/dashboard';
        else if (role === 'VENDOR') redirectPath = '/vendor/dashboard';
        else                        redirectPath = '/';
      }
      navigate(redirectPath, { replace: true });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-surface1 border border-dark-border rounded-3xl p-8 shadow-xl"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
          🛍️
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Welcome back</h1>
        <p className="text-[var(--text3)] text-sm mt-1">Sign in to your ShopEasy account</p>
      </div>

      {/* Server error banner */}
      {authError && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
            <input
              {...register('email', emailRules)}
              type="email"
              placeholder="alex@example.com"
              autoComplete="email"
              className={`w-full bg-dark-surface2 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors ${errors.email ? 'border-red-500' : 'border-dark-border'}`}
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs text-brand-500 hover:text-brand-600">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
            <input
              {...register('password', { required: 'Password is required' })}
              type={showPwd ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className={`w-full bg-dark-surface2 border rounded-xl pl-10 pr-10 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors ${errors.password ? 'border-red-500' : 'border-dark-border'}`}
            />
            <button
              type="button"
              onClick={() => setShowPwd(p => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)] transition-colors"
            >
              {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in…
            </>
          ) : (
            '🔐 Sign In'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-dark-border" />
        <span className="text-xs text-[var(--text3)]">or continue with</span>
        <div className="flex-1 h-px bg-dark-border" />
      </div>

      {/* Social */}
      <div className="grid grid-cols-2 gap-3">
        {[{ label: 'Google', icon: '🇬' }, { label: 'Apple', icon: '🍎' }].map(s => (
          <button
            key={s.label}
            type="button"
            className="flex items-center justify-center gap-2 py-2.5 bg-dark-surface2 border border-dark-border rounded-xl text-sm text-[var(--text2)] hover:bg-dark-surface3 hover:border-dark-border2 transition-all"
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Switch */}
      <p className="text-center text-sm text-[var(--text3)] mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-brand-500 hover:text-brand-600 font-medium">
          Create one
        </Link>
      </p>
    </motion.div>
  );
}
