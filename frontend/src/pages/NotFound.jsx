
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center page-enter">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.4 }}
        className="text-8xl mb-6"
      >
        😔
      </motion.div>
      <h1 className="text-4xl font-bold tracking-tight mb-3">404 — Not Found</h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link
          to="/"
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Go Home
        </Link>
        <Link
          to="/products"
          className="px-5 py-2.5 bg-dark-surface2 hover:bg-dark-surface3 border border-dark-border text-[var(--text2)] font-medium rounded-xl transition-all text-sm"
        >
          Browse Products
        </Link>
      </div>
    </div>
  );
}
