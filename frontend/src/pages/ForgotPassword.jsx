import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, KeyRound, ArrowLeft, CheckCircle2, ShieldCheck, Eye, EyeOff, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '@services/authService';
import { GMAIL_REGEX, ADMIN_EMAIL } from '@utils/validators';

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Steps: 1 = Email Input, 2 = 6-digit OTP Verification, 3 = New Password Input
  const [step, setStep] = useState(1);

  const [email, setEmail]               = useState('');
  const [otpDigits, setOtpDigits]       = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword]   = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPwd, setShowPwd]           = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [timer, setTimer]               = useState(120); // 2 minutes
  const [canResend, setCanResend]       = useState(false);
  const [otpExpired, setOtpExpired]     = useState(false);

  // ── Countdown Timer for Step 2 ──────────────────────────────────────────────
  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      setOtpExpired(false);
      interval = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            setCanResend(true);
            setOtpExpired(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Format as MM:SS (zero-padded) e.g. 02:00, 01:59 … 00:01, 00:00
  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      toast.error('Please enter your registered email address.');
      return;
    }

    if (cleanEmail !== ADMIN_EMAIL && !GMAIL_REGEX.test(cleanEmail)) {
      toast.error('Only registered Gmail addresses (@gmail.com) are allowed.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(cleanEmail);
      toast.success(res.message || 'OTP sent! Check your Gmail inbox.');
      setStep(2);
      setTimer(120);
      setCanResend(false);
      setOtpExpired(false);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── OTP Inputs Handler ──────────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().slice(0, 6);
    if (/^\d{6}$/.test(pasted)) {
      setOtpDigits(pasted.split(''));
      const lastInput = document.getElementById('otp-input-5');
      if (lastInput) lastInput.focus();
    }
  };

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otp = otpDigits.join('');

    if (otp.length !== 6) {
      toast.error('Please enter all 6 digits of the OTP.');
      return;
    }

    if (otpExpired || timer === 0) {
      toast.error('OTP has expired. Please request a new OTP.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.verifyOtp(email.trim().toLowerCase(), otp);
      toast.success('OTP verified successfully!');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      toast.success('New OTP sent! Check your Gmail inbox.');
      setTimer(120);
      setCanResend(false);
      setOtpExpired(false);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 3: Reset Password ──────────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    const otp = otpDigits.join('');
    setIsLoading(true);

    try {
      const res = await authService.resetPasswordWithOtp(
        email.trim().toLowerCase(),
        otp,
        newPassword
      );
      toast.success(res.message || 'Password reset successfully! Logging you in...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password Strength Score (0 to 4)
  const getPasswordStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const pwdScore = getPasswordStrength(newPassword);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-surface1 border border-dark-border rounded-3xl p-8 shadow-xl max-w-md w-full mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
          🔐
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
          {step === 1 && 'Forgot Password'}
          {step === 2 && 'Verify 6-Digit OTP'}
          {step === 3 && 'Create New Password'}
        </h1>
        <p className="text-[var(--text3)] text-sm mt-1">
          {step === 1 && 'Enter your registered email address to receive an OTP'}
          {step === 2 && `Enter the 6-digit OTP code sent to ${email}`}
          {step === 3 && 'Choose a strong, secure password for your account'}
        </p>
      </div>

      {/* Progress Steps Indicator */}
      <div className="flex items-center justify-between mb-8 px-4">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === s
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30 ring-2 ring-brand-500/50'
                : step > s
                ? 'bg-emerald-500 text-white'
                : 'bg-dark-surface2 text-[var(--text3)] border border-dark-border'
            }`}>
              {step > s ? '✓' : s}
            </div>
            {s < 3 && (
              <div className={`flex-1 h-0.5 mx-2 rounded transition-colors ${step > s ? 'bg-emerald-500' : 'bg-dark-border'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1: Enter Email */}
      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-1.5">
              Registered Email Address
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@gmail.com"
                className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending OTP…
              </>
            ) : (
              <>
                Send 6-Digit OTP
                <KeyRound size={16} />
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 2: Verify 6-Digit OTP */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-3 text-center">
              6-Digit Security Code
            </label>
            <div className="flex items-center justify-center gap-2.5" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-11 h-12 text-center text-lg font-bold bg-dark-surface2 border border-dark-border rounded-xl text-[var(--text)] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              ))}
            </div>
          </div>

          {/* Timer & Resend */}
          <div className="flex items-center justify-between text-xs text-[var(--text3)]">
            <span>
              OTP expires in:{' '}
              <strong className={`font-mono ${timer <= 30 ? 'text-red-400' : 'text-brand-400'}`}>
                {formatTimer(timer)}
              </strong>
            </span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isLoading || (!canResend && timer > 0)}
              className="text-brand-500 hover:text-brand-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-colors"
            >
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
              Resend OTP
            </button>
          </div>

          {/* Expiry warning */}
          {otpExpired && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-2.5 text-xs font-medium">
              <span>⏰</span>
              OTP has expired. Please click <strong>Resend OTP</strong> to request a new code.
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || otpExpired || otpDigits.join('').length !== 6}
            className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying…
              </>
            ) : (
              <>
                Verify OTP
                <ShieldCheck size={16} />
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 3: Create New Password */}
      {step === 3 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
              <input
                type={showPwd ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPwd(p => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)]"
              >
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {/* Password strength meter */}
            {newPassword && (
              <div className="mt-2">
                <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-dark-surface2">
                  <div className={`h-full flex-1 transition-all ${pwdScore >= 1 ? (pwdScore === 1 ? 'bg-red-500' : pwdScore === 2 ? 'bg-yellow-500' : 'bg-emerald-500') : ''}`} />
                  <div className={`h-full flex-1 transition-all ${pwdScore >= 2 ? (pwdScore === 2 ? 'bg-yellow-500' : 'bg-emerald-500') : ''}`} />
                  <div className={`h-full flex-1 transition-all ${pwdScore >= 3 ? 'bg-emerald-500' : ''}`} />
                  <div className={`h-full flex-1 transition-all ${pwdScore >= 4 ? 'bg-emerald-400' : ''}`} />
                </div>
                <span className="text-[10px] text-[var(--text3)] mt-1 block">
                  Strength: {pwdScore <= 1 ? 'Weak' : pwdScore === 2 ? 'Medium' : pwdScore === 3 ? 'Strong' : 'Very Strong'}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
              <input
                type={showPwd ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !newPassword || newPassword !== confirmPassword}
            className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm mt-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Resetting Password…
              </>
            ) : (
              <>
                Reset Password & Log In
                <CheckCircle2 size={16} />
              </>
            )}
          </button>
        </form>
      )}

      {/* Back to Login */}
      <div className="text-center mt-6">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text3)] hover:text-brand-400 transition-colors font-medium"
        >
          <ArrowLeft size={14} />
          Back to Sign In
        </Link>
      </div>
    </motion.div>
  );
}
