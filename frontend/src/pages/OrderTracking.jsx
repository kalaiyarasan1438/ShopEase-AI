import React, { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Package, MapPin, Phone, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '@components/common/Badge.jsx';
import Skeleton from '@components/common/Skeleton.jsx';
import { fetchOrderById, selectSelectedOrder, selectIsSelectedOrderLoading } from '@store/slices/orderSlice';
import { formatCurrency, formatDate } from '@utils/formatters';

const getTimelineSteps = (status, createdAt) => {
  if (status === 'CANCELLED') {
    return [
      { icon: '❌', title: 'Order Cancelled', sub: 'This order has been cancelled', state: 'active' }
    ];
  }
  if (status === 'REFUND_REQUESTED') {
    return [
      { key: 'ORDER_PLACED',     icon: '✅', title: 'Order Placed',      sub: formatDate(createdAt), state: 'done' },
      { key: 'CONFIRMED',        icon: '📝', title: 'Order Confirmed',  sub: 'Confirmed by vendor', state: 'done' },
      { key: 'PROCESSING',       icon: '⚙️', title: 'Processing',       sub: 'Items packed', state: 'done' },
      { key: 'OUT_FOR_DELIVERY', icon: '🚚', title: 'Out for Delivery', sub: 'Package on the way', state: 'done' },
      { key: 'DELIVERED',        icon: '🎉', title: 'Delivered',        sub: 'Package arrived', state: 'done' },
      { key: 'REFUND_REQUESTED', icon: '🔄', title: 'Refund Requested', sub: 'Waiting for vendor review', state: 'active' }
    ];
  }
  if (status === 'REFUNDED') {
    return [
      { key: 'ORDER_PLACED',     icon: '✅', title: 'Order Placed',      sub: formatDate(createdAt), state: 'done' },
      { key: 'DELIVERED',        icon: '📦', title: 'Order Delivered',   sub: 'Package delivered', state: 'done' },
      { key: 'REFUND_REQUESTED', icon: '🔄', title: 'Refund Approved',  sub: 'Refund confirmed by vendor', state: 'done' },
      { key: 'REFUNDED',         icon: '↩️', title: 'Refund Processed', sub: 'Amount refunded to account', state: 'done' }
    ];
  }
  if (status === 'REFUND_REJECTED') {
    return [
      { key: 'ORDER_PLACED',      icon: '✅', title: 'Order Placed',      sub: formatDate(createdAt), state: 'done' },
      { key: 'DELIVERED',         icon: '📦', title: 'Order Delivered',   sub: 'Package delivered', state: 'done' },
      { key: 'REFUND_REQUESTED',  icon: '🔄', title: 'Refund Requested', sub: 'Refund request made', state: 'done' },
      { key: 'REFUND_REJECTED',   icon: '🚫', title: 'Refund Rejected',  sub: 'Vendor rejected the refund request', state: 'active' }
    ];
  }

  const baseSteps = [
    { key: 'ORDER_PLACED',     icon: '✅', title: 'Order Placed',      sub: formatDate(createdAt) },
    { key: 'CONFIRMED',        icon: '📝', title: 'Order Confirmed',  sub: 'Order confirmed by vendor' },
    { key: 'PROCESSING',       icon: '⚙️', title: 'Processing',       sub: 'Items are being packed' },
    { key: 'OUT_FOR_DELIVERY', icon: '🚚', title: 'Out for Delivery', sub: 'Package is on the way' },
    { key: 'DELIVERED',        icon: '🎉', title: 'Delivered',        sub: 'Package has arrived' },
  ];

  let currentStepIndex = baseSteps.findIndex(s => s.key === status);
  if (currentStepIndex === -1) currentStepIndex = 0; // fallback if unknown status

  return baseSteps.map((step, index) => {
    let state = 'pending';
    if (index < currentStepIndex) state = 'done';
    else if (index === currentStepIndex) state = status === 'DELIVERED' ? 'done' : 'active';
    return { ...step, state };
  });
};

export default function OrderTracking() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const order = useSelector(selectSelectedOrder);
  const isLoading = useSelector(selectIsSelectedOrderLoading);
  const prevStatusRef = useRef(null);

  // Initial fetch and 4s polling for live tracking timeline update
  useEffect(() => {
    if (id) {
      dispatch(fetchOrderById(id));

      const interval = setInterval(() => {
        dispatch(fetchOrderById(id));
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [dispatch, id]);

  // Status Change Notification Detector
  useEffect(() => {
    if (order && order.id === Number(id)) {
      if (prevStatusRef.current && prevStatusRef.current !== order.status) {
        toast.success(`Order Status updated to: ${order.status}!`, {
          duration: 5000,
          icon: '🔔',
        });
      }
      prevStatusRef.current = order.status;
    }
  }, [order, id]);

  if (isLoading || (!order && id)) {
    return (
      <div className="page-enter space-y-6">
        <Skeleton variant="page" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-enter text-center py-20">
        <h2 className="text-xl font-bold text-[var(--text)]">Order not found</h2>
        <Link to="/orders" className="text-brand-500 mt-4 inline-block font-semibold">Back to Orders</Link>
      </div>
    );
  }

  const timelineSteps = getTimelineSteps(order.status, order.createdAt);
  const isCancelled = order.status === 'CANCELLED';
  const isDelivered = order.status === 'DELIVERED';
  const isRefunded  = order.status === 'REFUNDED';
  const inTransit   = order.status === 'OUT_FOR_DELIVERY';

  return (
    <div className="page-enter">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/orders" className="p-2 bg-dark-surface2 rounded-xl text-[var(--text3)] hover:text-[var(--text)] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Order Tracking</h1>
            <p className="text-[var(--text2)] text-sm mt-1">Live status updates from vendor</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-brand-500 font-semibold bg-brand-500/10 px-3 py-1.5 rounded-xl border border-brand-500/20">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
          Live Auto-Sync
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Timeline */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Status banner */}
          <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-[var(--text3)]">Order Number</p>
                  <p className="font-bold text-brand-500">{order.orderNumber || `ORD-${order.id}`}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text3)]">Payment Method</p>
                  <p className="font-semibold text-sm text-[var(--text)]">{order.paymentMethod === 'COD' ? '💵 COD' : order.paymentMethod || 'CARD'}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text3)]">Placed On</p>
                  <p className="font-medium text-sm text-[var(--text)]">{formatDate(order.createdAt)}</p>
                </div>
              </div>
              <Badge variant={isCancelled ? 'error' : isDelivered || isRefunded ? 'success' : 'info'} dot>
                {order.status}
              </Badge>
            </div>

            {/* Banner info */}
            {inTransit && (
              <div className="flex items-center gap-3 p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sm mt-4">
                <span className="text-xl">🚚</span>
                <div>
                  <p className="font-medium text-sky-600">Your package is on its way!</p>
                  {order.trackingNumber && (
                    <p className="text-xs text-[var(--text3)] mt-0.5">Tracking Number: {order.trackingNumber}</p>
                  )}
                </div>
              </div>
            )}

            {order.status === 'REFUND_REQUESTED' && (
              <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm mt-4">
                <span className="text-xl">🔄</span>
                <div>
                  <p className="font-medium text-amber-600">Refund Requested</p>
                  <p className="text-xs text-[var(--text3)] mt-0.5">Your refund request is under review by the vendor.</p>
                </div>
              </div>
            )}

            {order.status === 'REFUNDED' && (
              <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm mt-4">
                <span className="text-xl">↩️</span>
                <div>
                  <p className="font-medium text-emerald-600">Refund Approved & Processed</p>
                  <p className="text-xs text-[var(--text3)] mt-0.5">The total amount has been refunded to your account.</p>
                </div>
              </div>
            )}

            {order.status === 'REFUND_REJECTED' && (
              <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm mt-4">
                <span className="text-xl">🚫</span>
                <div>
                  <p className="font-medium text-red-600">Refund Rejected</p>
                  <p className="text-xs text-[var(--text3)] mt-0.5">The vendor has rejected your refund request. Order is marked Delivered.</p>
                </div>
              </div>
            )}
            
            {isCancelled && (
              <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm mt-4">
                <span className="text-xl">❌</span>
                <div>
                  <p className="font-medium text-red-600">Order has been cancelled</p>
                  <p className="text-xs text-[var(--text3)] mt-0.5">Product stock has been restored.</p>
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-sm mb-5 text-[var(--text)] flex items-center justify-between">
              <span>Tracking Timeline</span>
              <span className="text-xs text-[var(--text3)] font-normal">Real-time status</span>
            </h3>
            <div className="relative">
              {timelineSteps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4 pb-6 last:pb-0 relative"
                >
                  {/* Connector line */}
                  {i < timelineSteps.length - 1 && (
                    <div className={`absolute left-4 top-8 bottom-0 w-0.5 ${
                      step.state === 'done' ? 'bg-green-500/50' : 'bg-dark-border'
                    }`} />
                  )}

                  {/* Dot */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 border ${
                    isCancelled
                      ? 'bg-red-50 border-red-300 text-red-600'
                      : step.state === 'done'
                      ? 'bg-green-50 border-green-300 text-green-600'
                      : step.state === 'active'
                      ? 'bg-brand-500/10 border-brand-500/40 text-brand-500 font-bold'
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

            <div className="space-y-3 pb-4 border-b border-dark-border max-h-60 overflow-y-auto">
              {order.items && order.items.map((item, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-12 h-12 bg-dark-surface2 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    <Package size={20} className="text-[var(--text3)]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-[var(--text)] line-clamp-1" title={item.productName}>
                      {item.productName}
                    </p>
                    <p className="text-xs text-[var(--text3)] mt-0.5">Qty: {item.quantity}</p>
                  </div>
                  <div className="font-bold text-sm text-[var(--text)]">{formatCurrency(item.subtotal)}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2 mt-4 text-sm">
              <div className="flex justify-between text-[var(--text2)]">
                <span>Subtotal</span><span>{formatCurrency(order.totalAmount - (order.shippingAmount || 0) - (order.taxAmount || 0))}</span>
              </div>
              <div className="flex justify-between text-[var(--text2)]">
                <span>Shipping</span>
                <span className={order.shippingAmount === 0 ? "text-green-600" : ""}>
                  {order.shippingAmount === 0 ? "Free" : formatCurrency(order.shippingAmount)}
                </span>
              </div>
              <div className="flex justify-between text-[var(--text2)]">
                <span>Tax</span><span>{formatCurrency(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-dark-border text-[var(--text)]">
                <span>Total Amount</span><span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} className="text-[var(--text3)]" />
              <h3 className="font-semibold text-sm text-[var(--text)]">Delivery Address</h3>
            </div>
            <div className="text-sm text-[var(--text2)] space-y-1">
              <p className="font-medium text-[var(--text)]">{order.shippingName}</p>
              <p>{order.shippingAddressLine1}</p>
              {order.shippingCity && <p>{order.shippingCity}, {order.shippingState} {order.shippingZip}</p>}
              {order.shippingCountry && <p>{order.shippingCountry}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button className="w-full py-2.5 bg-dark-surface2 hover:bg-dark-surface3 border border-dark-border text-sm text-[var(--text2)] rounded-xl transition-all flex items-center justify-center gap-2 font-medium">
              <Phone size={14} /> Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
