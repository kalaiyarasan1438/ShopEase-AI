import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchMyOrders, cancelOrder, requestRefund, selectOrders, selectOrdersLoading } from '@store/slices/orderSlice';
import Badge from '@components/common/Badge.jsx';
import Skeleton from '@components/common/Skeleton.jsx';
import ReviewModal from '@components/common/ReviewModal.jsx';
import { formatCurrency, formatDate, getStatusConfig } from '@utils/formatters';
import { ORDER_STATUSES } from '@utils/constants';

export default function Orders() {
  const dispatch   = useDispatch();
  const orders     = useSelector(selectOrders);
  const isLoading  = useSelector(selectOrdersLoading);
  const [filter, setFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null);
  const [reviewOrder, setReviewOrder] = useState(null);
  const prevStatusesRef = useRef({});

  // Fetch orders on mount and poll every 4s to sync status changes automatically
  useEffect(() => {
    dispatch(fetchMyOrders({ page: 0, size: 50 }));

    const interval = setInterval(() => {
      dispatch(fetchMyOrders({ page: 0, size: 50 }));
    }, 4000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Status Change Notification Detector
  useEffect(() => {
    if (orders && orders.length > 0) {
      orders.forEach(order => {
        const prevStatus = prevStatusesRef.current[order.id];
        if (prevStatus && prevStatus !== order.status) {
          let message = `Order #${order.orderNumber || order.id} status updated to ${order.status}!`;
          if (order.status === 'CONFIRMED')        message = `Your order #${order.id} has been Confirmed by vendor!`;
          else if (order.status === 'PROCESSING')   message = `Your order #${order.id} is now being Processed!`;
          else if (order.status === 'OUT_FOR_DELIVERY') message = `Your order #${order.id} is Out for Delivery! 🚚`;
          else if (order.status === 'DELIVERED')    message = `Your order #${order.id} was Delivered! 🎉`;
          else if (order.status === 'CANCELLED')    message = `Order #${order.id} was Cancelled.`;
          else if (order.status === 'REFUNDED')     message = `Refund Approved for order #${order.id}! 💵`;
          else if (order.status === 'REFUND_REJECTED') message = `Refund Rejected for order #${order.id}. Order marked Delivered.`;

          toast.success(message, { duration: 5000, icon: '🔔' });
        }
        prevStatusesRef.current[order.id] = order.status;
      });
    }
  }, [orders]);

  // Direct Cancel Order Execution — NO browser confirm popup
  const handleCancel = async (orderId) => {
    setActionLoading(orderId);
    try {
      await dispatch(cancelOrder(orderId)).unwrap();
      dispatch(fetchMyOrders({ page: 0, size: 50 }));
    } catch (err) {
      // slice toasts errors
    } finally {
      setActionLoading(null);
    }
  };

  // Direct Request Refund Execution — NO browser confirm popup
  const handleRefund = async (orderId) => {
    setActionLoading(orderId);
    try {
      await dispatch(requestRefund(orderId)).unwrap();
      dispatch(fetchMyOrders({ page: 0, size: 50 }));
    } catch (err) {
      // slice toasts errors
    } finally {
      setActionLoading(null);
    }
  };

  const displayOrders = (orders || []).filter(o => filter === 'ALL' || o.status === filter);

  return (
    <div className="page-enter">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">My Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Track, manage, cancel, review, or request refunds for purchases</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-brand-500 font-semibold bg-brand-500/10 px-3 py-1.5 rounded-xl border border-brand-500/20">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
          Live Sync Active
        </div>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['ALL', ...ORDER_STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filter === s
                ? 'bg-brand-500/10 border-brand-500/30 text-brand-500 shadow-xs'
                : 'bg-dark-surface2 border-dark-border text-gray-500 hover:border-brand-500/30 hover:text-[var(--text)]'
            }`}>
            {s === 'ALL' ? 'All Orders' : getStatusConfig(s).icon + ' ' + getStatusConfig(s).label}
          </button>
        ))}
      </div>

      {isLoading && orders.length === 0 ? (
        <Skeleton variant="table" rows={5} cols={5} />
      ) : displayOrders.length === 0 ? (
        <div className="text-center py-24 bg-dark-surface2/50 border border-dark-border rounded-2xl">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-semibold mb-2 text-[var(--text)]">No orders found</h3>
          <p className="text-gray-500 text-sm mb-6">You haven't placed any orders matching this filter yet.</p>
          <Link to="/products" className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm transition-all shadow-sm shadow-brand-500/10">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="bg-dark-surface2 border border-dark-border rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Order ID', 'Product', 'Payment', 'Date', 'Amount', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-bold text-gray-400 uppercase tracking-widest px-5 py-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayOrders.map(order => {
                  const sc = getStatusConfig(order.status);
                  const productName = order.items?.[0]?.productName || 'Product Item';
                  const extraItems  = (order.items?.length || 1) - 1;
                  const isCancellable = ['ORDER_PLACED', 'CONFIRMED', 'PROCESSING'].includes(order.status);
                  const isRefundable  = order.status === 'DELIVERED';
                  const isReviewable  = ['DELIVERED', 'REFUNDED'].includes(order.status);
                  const isProcessingAction = actionLoading === order.id;

                  return (
                    <tr key={order.id} className="border-b border-dark-border/40 last:border-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-bold text-brand-500 text-sm">
                          {order.orderNumber || `ORD-${order.id}`}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-[var(--text)] font-semibold">{productName}</p>
                        {extraItems > 0 && (
                          <p className="text-xs text-gray-400 font-medium">+{extraItems} more item{extraItems > 1 ? 's' : ''}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                          order.paymentMethod === 'COD'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                            : 'bg-dark-surface3 border-dark-border text-[var(--text2)]'
                        }`}>
                          {order.paymentMethod === 'COD' ? '💵 COD' : order.paymentMethod || 'CARD'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500 font-medium">{formatDate(order.createdAt)}</td>
                      <td className="px-5 py-4">
                        <span className="font-extrabold text-sm text-[var(--text)]">{formatCurrency(order.totalAmount)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={sc.color} dot>{sc.icon} {sc.label}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Link to={`/orders/${order.id}/tracking`}
                            className="text-xs font-bold px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 text-brand-500 rounded-xl transition-all">
                            Track
                          </Link>

                          {/* Cancel Order Button — ONLY visible for Pending, Confirmed, Processing */}
                          {isCancellable && (
                            <button
                              onClick={() => handleCancel(order.id)}
                              disabled={isProcessingAction}
                              className="text-xs font-bold px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-xl transition-all disabled:opacity-50"
                            >
                              {isProcessingAction ? 'Cancelling…' : 'Cancel'}
                            </button>
                          )}

                          {/* Request Refund Button — ONLY visible when Delivered */}
                          {isRefundable && (
                            <button
                              onClick={() => handleRefund(order.id)}
                              disabled={isProcessingAction}
                              className="text-xs font-bold px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-500 rounded-xl transition-all disabled:opacity-50"
                            >
                              {isProcessingAction ? 'Submitting…' : 'Refund'}
                            </button>
                          )}

                          {/* Review Button — ONLY visible when Delivered or Refunded */}
                          {isReviewable && (
                            <button
                              onClick={() => setReviewOrder(order)}
                              className="text-xs font-bold px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 rounded-xl transition-all"
                            >
                              Review ⭐
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal Component */}
      <ReviewModal
        order={reviewOrder}
        isOpen={!!reviewOrder}
        onClose={() => setReviewOrder(null)}
        onSuccess={() => dispatch(fetchMyOrders({ page: 0, size: 50 }))}
      />
    </div>
  );
}
