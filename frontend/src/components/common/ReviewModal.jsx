import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@services/api';

export default function ReviewModal({ order, isOpen, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const firstItem = order.items?.[0];
  const productId = firstItem?.productId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productId) {
      toast.error('Product details missing');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/api/products/${productId}/reviews`, {
        rating,
        title: title.trim() || 'Verified Customer Review',
        body: body.trim(),
      });
      toast.success('Thank you! Your product review has been submitted. ⭐');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-dark-surface1 border border-dark-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between bg-dark-surface2">
            <div>
              <h3 className="font-bold text-base text-[var(--text)]">Write a Review</h3>
              <p className="text-xs text-[var(--text3)] mt-0.5">Order #{order.orderNumber || order.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-[var(--text)] rounded-lg hover:bg-dark-surface3 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Product snapshot */}
            <div className="flex items-center gap-3 p-3 bg-dark-surface2 rounded-xl border border-dark-border">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center text-xl">
                📦
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text)] truncate">{firstItem?.productName || 'Product'}</p>
                <p className="text-xs text-gray-400">Verified Purchase</p>
              </div>
            </div>

            {/* Star Rating */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Overall Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      size={28}
                      className={(hoverRating || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-500'}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm font-bold text-amber-400">{rating} / 5</span>
              </div>
            </div>

            {/* Headline / Title */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Review Headline (Optional)
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Excellent quality & fast delivery!"
                className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] placeholder-gray-500 outline-none focus:border-brand-500/60"
              />
            </div>

            {/* Review Body */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Detailed Review
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="What did you like or dislike about this item? Share your experience to help others..."
                className="w-full bg-dark-surface2 border border-dark-border rounded-xl p-4 text-sm text-[var(--text)] placeholder-gray-500 outline-none focus:border-brand-500/60 custom-scrollbar resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-dark-surface2 border border-dark-border rounded-xl text-sm font-medium text-[var(--text2)] hover:text-[var(--text)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-brand-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? 'Submitting…' : 'Submit Review ⭐'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
