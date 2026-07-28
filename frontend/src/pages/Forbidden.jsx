import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Forbidden() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dark-bg text-[var(--text)] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
            <ShieldAlert size={48} />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">403 Forbidden</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          You do not have permission to access this page. Please make sure you are logged in with the correct role.
        </p>
        
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
