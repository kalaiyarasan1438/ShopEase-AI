import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  loginUser,
  loginWithOAuth,
  selectAuthLoading,
  selectAuthError,
  selectServerWaking,
} from '@store/slices/authSlice';
import { emailRules, GMAIL_REGEX, ADMIN_EMAIL } from '@utils/validators';

// ── SVG Logos ──────────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

/**
 * Validates if a real Google OAuth Client ID is configured in .env.local
 */
function isGoogleConfigured() {
  return (
    GOOGLE_CLIENT_ID.length > 0 &&
    !GOOGLE_CLIENT_ID.includes('1048684784920-local') &&
    !GOOGLE_CLIENT_ID.startsWith('your-') &&
    !GOOGLE_CLIENT_ID.startsWith('YOUR_')
  );
}

function getRedirectPath(roles, from) {
  if (from !== '/') return from;
  const role = Array.isArray(roles) ? roles[0] : [...(roles || [])][0] || 'USER';
  if (role === 'ADMIN')  return '/admin/dashboard';
  if (role === 'VENDOR') return '/vendor/dashboard';
  return '/';
}

export default function Login() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isLoading    = useSelector(selectAuthLoading);
  const authError    = useSelector(selectAuthError);
  const serverWaking = useSelector(selectServerWaking);

  const [showPwd, setShowPwd]           = useState(false);
  const [oauthLoading, setOAuthLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const { register, handleSubmit, formState: { errors } } = useForm();

  // ── Initialize Google SDK ──────────────────────────────────────────────────
  useEffect(() => {
    // Google Identity Services (GIS) init
    if (isGoogleConfigured() && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      } catch (err) {
        console.warn('Google GIS initialization warning:', err.message);
      }
    }
  }, []);

  // ── Google Credential Response Callback ─────────────────────────────────────
  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      toast.error('Google Sign-In was cancelled or failed.');
      return;
    }

    setOAuthLoading(true);
    try {
      const result = await dispatch(loginWithOAuth({ provider: 'google', idToken: response.credential }));
      if (loginWithOAuth.fulfilled.match(result)) {
        const roles = result.payload?.user?.roles ?? [];
        navigate(getRedirectPath(roles, from), { replace: true });
      }
    } finally {
      setOAuthLoading(false);
    }
  };

  // ── Trigger Google Account Picker ───────────────────────────────────────────
  const handleGoogleClick = () => {
    if (!isGoogleConfigured()) {
      toast.error('Google Client ID is missing. Please set VITE_GOOGLE_CLIENT_ID in frontend/.env.local');
      return;
    }

    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Try Google One Tap prompt first
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.warn('Google One Tap suppressed reason:', notification.getNotDisplayedReason?.() || 'Skipped');
            // Fallback: render hidden GIS button and click it to open Google's account popup window directly
            const hiddenContainer = document.getElementById('google-gis-hidden-btn');
            if (hiddenContainer) {
              hiddenContainer.innerHTML = '';
              window.google.accounts.id.renderButton(hiddenContainer, { theme: 'outline', size: 'large' });
              const btnEl = hiddenContainer.querySelector('div[role=button]') || hiddenContainer.querySelector('iframe') || hiddenContainer.firstElementChild;
              if (btnEl) {
                btnEl.click();
              }
            }
          }
        });
      } catch (err) {
        toast.error('Could not initialize Google Sign-In: ' + err.message);
      }
    } else {
      toast.error('Google Sign-In SDK is loading. Please try again in a moment.');
    }
  };

  // ── Standard Email/Password Login ───────────────────────────────────────────
  const onSubmit = async (data) => {
    const rawEmail   = data.email ? data.email.trim() : '';
    const emailLower = rawEmail.toLowerCase();

    if (emailLower === ADMIN_EMAIL) {
      // Valid admin
    } else if (emailLower.includes('admin') || emailLower.endsWith('@shopeasy.in') || emailLower.endsWith('@shopeasy.com')) {
      toast.error('Invalid Admin credentials.');
      return;
    } else if (!GMAIL_REGEX.test(rawEmail)) {
      toast.error('Only Gmail addresses (@gmail.com) are allowed.');
      return;
    }

    const result = await dispatch(loginUser(data));
    if (loginUser.fulfilled.match(result)) {
      const userObj  = result.payload?.user;
      const roles    = userObj?.roles ?? [];
      navigate(getRedirectPath(roles, from), { replace: true });
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

      {/* Server error & wake up banner */}
      {serverWaking ? (
        <div className="mb-4 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs font-medium flex items-center gap-2.5 animate-pulse">
          <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin flex-shrink-0" />
          <span>⚡ {serverWaking}</span>
        </div>
      ) : authError && (
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
              placeholder="alex@gmail.com"
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
            <Link to="/forgot-password" className="text-xs text-brand-500 hover:text-brand-600 font-medium">
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
          disabled={isLoading || oauthLoading}
          className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {serverWaking ? 'Server is starting…' : 'Signing in…'}
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

      {/* Official Social Login Buttons */}
      <div className="grid grid-cols-1 gap-3">
        {/* Google */}
        <button
          id="btn-oauth-google"
          type="button"
          disabled={oauthLoading || isLoading}
          onClick={handleGoogleClick}
          className="flex items-center justify-center gap-2 py-2.5 bg-dark-surface2 border border-dark-border rounded-xl text-sm text-[var(--text2)] hover:bg-dark-surface3 hover:border-dark-border2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {oauthLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          Google
        </button>
      </div>

      {/* Hidden GIS render target for custom Google button trigger */}
      <div id="google-gis-hidden-btn" className="hidden pointer-events-none w-0 h-0 overflow-hidden" />

      {/* Register Switch */}
      <p className="text-center text-sm text-[var(--text3)] mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-brand-500 hover:text-brand-600 font-medium">
          Create one
        </Link>
      </p>
    </motion.div>
  );
}
