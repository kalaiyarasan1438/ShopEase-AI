import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Minus, Plus, ArrowLeft, Tag } from 'lucide-react';
import {
  selectCartItems, selectCartTotal,
  updateQuantity, removeFromCart,
} from '@store/slices/cartSlice';
import { formatCurrency } from '@utils/formatters';
import ImageWithFallback from '@components/common/ImageWithFallback';

export default function Cart() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const items     = useSelector(selectCartItems);
  const subtotal  = useSelector(selectCartTotal);
  const shipping  = subtotal >= 999 ? 0 : 99;
  const tax       = subtotal * 0.08;
  const total     = subtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center page-enter">
        <div className="text-7xl mb-5">🛒</div>
        <h2 className="text-xl font-bold mb-2 text-[var(--text)]">Your cart is empty</h2>
        <p className="text-gray-500 text-sm mb-6">Looks like you haven't added anything yet.</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm shadow-sm shadow-brand-500/10"
        >
          <ArrowLeft size={14} /> Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Shopping Cart</h1>
        <p className="text-gray-500 text-sm mt-1">{items.length} item{items.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence mode="popLayout">
            {items.map(item => (
              <motion.div
                key={item.productId}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                className="flex items-center gap-4 bg-dark-surface2 border border-dark-border rounded-2xl p-4 hover:border-brand-500/15 transition-all shadow-xs hover:shadow-md"
              >
                {/* Image */}
                <div className="w-16 h-16 bg-dark-surface3 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
                  <ImageWithFallback src={item.imageUrl} alt={item.name} wrapperClassName="w-full h-full" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm leading-snug text-[var(--text)]">{item.name}</h3>
                  <p className="text-xs text-brand-500 font-bold uppercase tracking-wider mt-0.5">{item.vendorName || 'ShopEasy Store'}</p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Unit: {formatCurrency(item.price)}</p>
                </div>

                {/* Qty Controls */}
                <div className="flex items-center gap-1 bg-dark-surface3 border border-dark-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity - 1 }))}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-[var(--text)]">{item.quantity}</span>
                  <button
                    onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity + 1 }))}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Price + Remove */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="font-bold text-sm text-[var(--text)]">{formatCurrency(item.price * item.quantity)}</span>
                  <button
                    onClick={() => dispatch(removeFromCart(item.productId))}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Coupon */}
          <div className="flex gap-3 mt-4">
            <div className="relative flex-1">
              <Tag size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                placeholder="Enter coupon code"
                className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-[var(--text)] placeholder-gray-400 outline-none focus:border-brand-500/60 focus:ring-4 focus:ring-brand-500/10 transition-all"
              />
            </div>
            <button className="px-5 py-2.5 bg-dark-surface2 hover:bg-dark-surface3 border border-dark-border text-xs font-bold text-[var(--text2)] rounded-xl transition-all shadow-xs hover:border-brand-500/30">
              Apply
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-dark-surface2 border border-dark-border rounded-2xl p-5 sticky top-4 shadow-xs">
            <h3 className="font-bold text-base mb-4 text-[var(--text)]">Order Summary</h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-gray-500 font-medium">
                <span>Subtotal ({items.reduce((s,i) => s+i.quantity, 0)} items)</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500 font-medium">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-emerald-500 font-bold' : ''}>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
              </div>
              <div className="flex justify-between text-gray-500 font-medium">
                <span>Tax (8%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-amber-600 bg-amber-500/10 rounded-xl px-3 py-2 border border-amber-500/20 leading-relaxed font-semibold">
                  Add {formatCurrency(999 - subtotal)} more for free shipping!
                </p>
              )}
              <div className="border-t border-dark-border pt-3 flex justify-between font-extrabold text-base text-[var(--text)]">
                <span>Total</span>
                <span className="text-brand-500">{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full mt-5 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs shadow-md shadow-brand-500/10"
            >
              💳 Proceed to Checkout
            </button>
            <Link
              to="/products"
              className="w-full mt-3 flex items-center justify-center gap-2 text-xs font-bold text-gray-500 hover:text-[var(--text)] transition-colors"
            >
              <ArrowLeft size={13} /> Continue Shopping
            </Link>

            <div className="mt-4 text-center text-[10px] text-gray-400 font-medium flex items-center justify-center gap-1">
              🔒 Secure checkout powered by SSL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
