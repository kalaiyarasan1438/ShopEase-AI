import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, LogIn } from 'lucide-react';

/**
 * MockOAuthModal
 *
 * Shown instead of a real OAuth popup when the app is running in DEV mode
 * (i.e., no real Google client ID is configured).
 *
 * It lets the developer type an email + name, and returns a mock token of the
 * form:
 *   mock-google-token-<base64({"email":"...","given_name":"...","family_name":"..."})>
 *
 * The backend OAuthTokenVerifier recognises this prefix and decodes the payload
 * locally instead of calling Google servers.
 *
 * Props:
 *   provider  – "google"
 *   onToken   – callback(idToken: string)
 *   onClose   – callback to dismiss without action
 */
export default function MockOAuthModal({ provider, onToken, onClose }) {
  const [email, setEmail]         = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [error, setError]         = useState('');

  const isGoogle = provider === 'google';
  const label    = 'Google';
  const prefix   = 'mock-google-token-';

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimEmail = email.trim().toLowerCase();
    if (!trimEmail) { setError('Email is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail)) {
      setError('Enter a valid email address');
      return;
    }

    const payload = {
      email:       trimEmail,
      given_name:  firstName.trim() || 'Test',
      family_name: lastName.trim()  || 'User',
    };

    const base64 = btoa(JSON.stringify(payload));
    onToken(`${prefix}${base64}`);
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Panel */}
        <motion.div
          key="panel"
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm mx-4 bg-dark-surface1 border border-dark-border rounded-2xl shadow-2xl p-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <GoogleIcon />
                <h2 className="text-base font-bold text-[var(--text)]">
                  Mock {label} Sign-In
                </h2>
              </div>
              <p className="text-xs text-[var(--text3)]">
                🧪 Dev/Sandbox mode — no real OAuth credentials needed
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[var(--text3)] hover:text-[var(--text)] transition-colors mt-0.5"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@gmail.com"
                  autoComplete="email"
                  className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors"
                />
              </div>
            </div>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-1.5">
                  First Name
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-10 pr-3 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-3 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              <LogIn size={15} />
              Continue as Mock {label} User
            </button>
          </form>

          <p className="text-center text-[10px] text-[var(--text3)] mt-4 leading-relaxed">
            This dialog only appears in development.<br />
            Real {label} OAuth will be used in production.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── SVG Logos ─────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
