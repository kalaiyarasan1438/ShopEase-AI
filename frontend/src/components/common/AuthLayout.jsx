import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col transition-colors duration-300">
      {/* Subtle gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm">
            🛍️
          </div>
          <span className="font-bold text-lg tracking-tight text-[var(--text)]">
            Shop<span className="text-brand-300">Easy</span>
          </span>
        </Link>
        <div className="text-xs text-[var(--text3)]">
          Premium Multi-Vendor Platform
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-[var(--text3)]">
        © 2024 ShopEasy · All rights reserved
      </footer>
    </div>
  );
}
