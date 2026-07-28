import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, MapPin, Phone } from 'lucide-react';
import Badge from '@components/common/Badge.jsx';
import { formatCurrency } from '@utils/formatters';

const TRACKING_STEPS = [
  { icon: '✅', title: 'Order Placed',        sub: 'Jan 14, 2024 · 10:32 AM',                  state: 'done'    },
  { icon: '✅', title: 'Payment Confirmed',   sub: 'Jan 14, 2024 · 10:35 AM',                  state: 'done'    },
  { icon: '✅', title: 'Packed & Ready',      sub: 'Jan 14, 2024 · 2:00 PM',                   state: 'done'    },
  { icon: '🚚', title: 'Out for Delivery',    sub: 'Jan 15, 2024 · 8:15 AM — In Transit',       state: 'active'  },
  { icon: '📦', title: 'Delivered',           sub: 'Expected: Jan 15, 2024',                   state: 'pending' },
];

export default function OrderTracking() {
  const [orderId, setOrderId] = useState('ORD-8472');

  return (
    <div className="page-enter">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Order Tracking</h1>
        <p className="text-[var(--text2)] text-sm mt-1">Real-time delivery updates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search bar */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
              <input
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                placeholder="Enter order ID"
                className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors"
              />
            </div>
            <button className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-xl transition-colors">
              Track
            </button>
          </div>

          {/* Status banner */}
          <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-[var(--text3)]">Order ID</p>
                  <p className="font-bold text-brand-500">#ORD-8472</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text3)]">Customer</p>
                  <p className="font-medium text-sm text-[var(--text)]">Sarah Kim</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text3)]">Est. Delivery</p>
                  <p className="font-medium text-sm text-green-600">Jan 15, 2024</p>
                </div>
              </div>
              <Badge variant="info" dot>In Transit</Badge>
            </div>

            {/* Driver info */}
            <div className="flex items-center gap-3 p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sm">
              <span className="text-xl">🚚</span>
              <div>
                <p className="font-medium text-sky-600">Your package is on its way!</p>
                <p className="text-xs text-[var(--text3)] mt-0.5">Driver: John D. · Vehicle: White Van XY-1234</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-sm mb-5 text-[var(--text)]">Tracking Timeline</h3>
            <div className="relative">
              {TRACKING_STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4 pb-6 last:pb-0 relative"
                >
                  {/* Connector line */}
                  {i < TRACKING_STEPS.length - 1 && (
                    <div className={`absolute left-4 top-8 bottom-0 w-0.5 ${
                      step.state === 'done' ? 'bg-green-500/50' : 'bg-dark-border'
                    }`} />
                  )}

                  {/* Dot */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 border ${
                    step.state === 'done'
                      ? 'bg-green-50 border-green-300 text-green-600'
                      : step.state === 'active'
                      ? 'bg-brand-500/10 border-brand-500/40 text-brand-500'
                      : 'bg-dark-surface2 border-dark-border text-[var(--text3)]'
                  }`}>
                    {step.icon}
                  </div>

                  {/* Content */}
                  <div className="pt-1 flex-1">
                    <p className={`font-medium text-sm ${step.state === 'pending' ? 'text-[var(--text3)]' : 'text-[var(--text)]'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-[var(--text3)] mt-0.5">{step.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Order Summary */}
        <div className="space-y-4">
          <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-sm mb-4 text-[var(--text)]">Order Details</h3>

            <div className="flex gap-3 pb-4 border-b border-dark-border">
              <div className="w-12 h-12 bg-dark-surface2 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                🎧
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-[var(--text)]">Pro Wireless Headphones</p>
                <p className="text-xs text-[var(--text3)] mt-0.5">Qty: 1 · Color: Black</p>
              </div>
              <div className="font-bold text-sm text-[var(--text)]">{formatCurrency(149.99)}</div>
            </div>

            <div className="space-y-2 mt-4 text-sm">
              <div className="flex justify-between text-[var(--text2)]">
                <span>Product</span><span>{formatCurrency(149.99)}</span>
              </div>
              <div className="flex justify-between text-[var(--text2)]">
                <span>Shipping</span><span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between text-[var(--text2)]">
                <span>Tax</span><span>{formatCurrency(12.00)}</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-dark-border text-[var(--text)]">
                <span>Total Paid</span><span>{formatCurrency(161.99)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-sm mb-3 text-[var(--text)]">Delivery Address</h3>
            <div className="text-sm text-[var(--text2)] space-y-1">
              <p className="font-medium text-[var(--text)]">Sarah Kim</p>
              <p>123 Main St, Apt 4B</p>
              <p>New York, NY 10001</p>
              <p>United States</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button className="w-full py-2.5 bg-dark-surface2 hover:bg-dark-surface3 border border-dark-border text-sm text-[var(--text2)] rounded-xl transition-all flex items-center justify-center gap-2">
              <Phone size={14} /> Contact Support
            </button>
            <button className="w-full py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-sm text-red-600 rounded-xl transition-all">
              ↩️ Request Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
