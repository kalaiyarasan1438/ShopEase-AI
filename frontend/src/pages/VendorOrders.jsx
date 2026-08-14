import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Search, RefreshCw, Eye, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@services/api';
import { formatCurrency, formatDate, getStatusConfig } from '@utils/formatters';
import Badge from '@components/common/Badge.jsx';
import Pagination from '@components/common/Pagination.jsx';

const ORDER_STATUSES = ['ALL', 'ORDER_PLACED', 'CONFIRMED', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUND_REQUESTED', 'REFUNDED', 'REFUND_REJECTED'];

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(null);

  const fetchOrders = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const params = new URLSearchParams({ size: 10, page });
      if (filterStatus !== 'ALL') params.set('status', filterStatus);
      const res = await api.get(`/api/vendor/orders?${params}`);
      setOrders(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
    } catch {
      if (!isBackground) toast.error('Failed to load vendor orders');
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [filterStatus, page]);

  // Initial fetch + Auto-refresh polling every 4 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 4000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Update status via dropdown
  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const res = await api.patch(`/api/vendor/orders/${orderId}/status?status=${newStatus}`);
      const updatedOrder = res.data;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: updatedOrder.status, paymentStatus: updatedOrder.paymentStatus } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(prev => ({ ...prev, status: updatedOrder.status }));

      let msg = `Order #${orderId} → ${newStatus}`;
      if (newStatus === 'REFUNDED')          msg = `✅ Refund Approved for Order #${orderId}. Payment marked REFUNDED.`;
      else if (newStatus === 'OUT_FOR_DELIVERY') msg = `🚚 Order #${orderId} is Out for Delivery!`;
      else if (newStatus === 'DELIVERED')    msg = `📦 Order #${orderId} marked as Delivered!`;
      else if (newStatus === 'CONFIRMED')    msg = `✅ Order #${orderId} Confirmed!`;
      else if (newStatus === 'PROCESSING')   msg = `⚙️ Order #${orderId} is now Processing!`;
      toast.success(msg);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  // Approve refund — shortcut wrapper
  const approveRefund = (orderId) => updateStatus(orderId, 'REFUNDED');

  // Reject refund — calls dedicated endpoint, reverts order to DELIVERED
  const rejectRefund = async (orderId) => {
    setUpdating(orderId);
    try {
      const res = await api.patch(`/api/vendor/orders/${orderId}/refund/reject`);
      const updatedOrder = res.data;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: updatedOrder.status } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(prev => ({ ...prev, status: updatedOrder.status }));
      toast.success(`Refund request for Order #${orderId} has been Rejected. Order returned to DELIVERED.`, { icon: '🔴' });
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to reject refund');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = orders.filter(o => {
    if (!search) return true;
    const term = search.toLowerCase();
    return `#${o.id}`.includes(term) || o.shippingName?.toLowerCase().includes(term);
  });

  // Count pending refunds for badge in header
  const refundCount = orders.filter(o => o.status === 'REFUND_REQUESTED').length;

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--text3)] mb-2">
            <span>Vendor</span><span>/</span>
            <span className="text-[var(--text2)] font-medium">Orders</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] flex items-center gap-3">
            <ClipboardList className="text-brand-500" size={24} />
            Vendor Orders Management
            {refundCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full animate-pulse">
                {refundCount} Refund{refundCount > 1 ? 's' : ''} Pending
              </span>
            )}
          </h1>
        </div>
        <button onClick={() => fetchOrders()} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-dark-surface2 border border-dark-border rounded-xl text-sm text-[var(--text2)] hover:text-[var(--text)] transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order ID or customer name…"
            className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60 font-medium">
          {ORDER_STATUSES.map(s => (
            <option key={s} value={s}>
              {s === 'ALL' ? 'All Statuses' : s === 'REFUND_REQUESTED' ? `🔄 ${s}` : s === 'ORDER_PLACED' ? `✅ ${s}` : s}
            </option>
          ))}
        </select>
      </div>

      {/* Main Table */}
      <div className="bg-dark-surface1 border border-dark-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-dark-border bg-dark-surface2 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-[var(--text)]">Orders ({filtered.length})</h3>
          <span className="text-xs text-[var(--text3)]">Live Sync (every 4s)</span>
        </div>

        {loading && orders.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[var(--text3)]">
            <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No orders found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Order ID', 'Customer', 'Items', 'Payment', 'Amount', 'Status / Action', 'Date', 'Details'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[var(--text3)] uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, idx) => {
                  const isUpdatingThis = updating === o.id;
                  const isRefundPending = o.status === 'REFUND_REQUESTED';
                  return (
                    <motion.tr key={o.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`border-b border-dark-border last:border-none transition-colors ${isRefundPending ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-dark-surface2'}`}
                    >
                      <td className="px-5 py-3.5 font-semibold text-brand-500 text-sm">#{o.id}</td>
                      <td className="px-5 py-3.5 text-sm text-[var(--text)] font-medium">{o.shippingName || 'Customer'}</td>
                      <td className="px-5 py-3.5 text-sm text-[var(--text2)]">{o.items?.length || 0} item(s)</td>

                      {/* Payment Badge */}
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${
                          o.paymentMethod === 'COD' ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-dark-surface3 border-dark-border text-[var(--text2)]'
                        }`}>
                          {o.paymentMethod === 'COD' ? '💵 COD' : o.paymentMethod || 'CARD'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-bold text-sm text-[var(--text)]">{formatCurrency(o.totalAmount)}</td>

                      {/* Status Selector + Approve/Reject Refund Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <select
                            value={o.status}
                            onChange={(e) => updateStatus(o.id, e.target.value)}
                            disabled={isUpdatingThis}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border outline-none cursor-pointer transition-all ${
                              isUpdatingThis ? 'opacity-50 cursor-not-allowed' : ''
                            } ${
                              o.status === 'DELIVERED'        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' :
                              o.status === 'CANCELLED'        ? 'bg-red-500/10 border-red-500/30 text-red-600' :
                              o.status === 'REFUND_REQUESTED' ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' :
                              o.status === 'REFUNDED'         ? 'bg-gray-400/10 border-gray-400/30 text-gray-400' :
                              o.status === 'REFUND_REJECTED'  ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                              o.status === 'OUT_FOR_DELIVERY' ? 'bg-sky-500/10 border-sky-500/30 text-sky-600' :
                              'bg-brand-500/10 border-brand-500/30 text-brand-500'
                            }`}
                          >
                            {ORDER_STATUSES.filter(s => s !== 'ALL').map(s => (
                              <option key={s} value={s} className="bg-dark-surface1 text-[var(--text)]">{s}</option>
                            ))}
                          </select>

                          {/* Refund action buttons — only when REFUND_REQUESTED */}
                          {isRefundPending && (
                            <>
                              <button
                                onClick={() => approveRefund(o.id)}
                                disabled={isUpdatingThis}
                                title="Approve Refund"
                                className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
                              >
                                <CheckCircle size={12} /> Approve
                              </button>
                              <button
                                onClick={() => rejectRefund(o.id)}
                                disabled={isUpdatingThis}
                                title="Reject Refund"
                                className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                              >
                                <XCircle size={12} /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-xs text-[var(--text3)] whitespace-nowrap">{o.createdAt ? formatDate(o.createdAt) : '—'}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => setSelectedOrder(o)} title="View Details"
                          className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-colors">
                          <Eye size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
      />

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-surface1 border border-dark-border rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-dark-border flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-[var(--text)]">Order #{selectedOrder.id}</h2>
              <Badge variant={getStatusConfig(selectedOrder.status).color}>
                {getStatusConfig(selectedOrder.status).icon} {getStatusConfig(selectedOrder.status).label}
              </Badge>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">

              {/* Refund actions inside modal too */}
              {selectedOrder.status === 'REFUND_REQUESTED' && (
                <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <div className="flex-1">
                    <p className="font-bold text-sm text-amber-600">🔄 Refund Requested by Customer</p>
                    <p className="text-xs text-[var(--text3)] mt-0.5">Approve to refund payment, or Reject to keep order as delivered.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { approveRefund(selectedOrder.id); setSelectedOrder(null); }}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors">
                      <CheckCircle size={13} /> Approve
                    </button>
                    <button onClick={() => { rejectRefund(selectedOrder.id); setSelectedOrder(null); }}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors">
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Status Updater */}
              <div className="bg-dark-surface2 p-4 rounded-xl border border-dark-border flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">Change Order Status</div>
                  <div className="text-xs text-[var(--text3)]">Updates instantly across all dashboards</div>
                </div>
                <select value={selectedOrder.status}
                  onChange={e => updateStatus(selectedOrder.id, e.target.value)}
                  disabled={updating === selectedOrder.id}
                  className="bg-dark-surface1 border border-dark-border rounded-lg px-3 py-1.5 text-sm font-bold text-brand-500 outline-none focus:border-brand-500/60 disabled:opacity-60">
                  {ORDER_STATUSES.filter(s => s !== 'ALL').map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Customer & Payment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Customer</div>
                  <div className="text-sm font-medium text-[var(--text)]">{selectedOrder.shippingName}</div>
                  <div className="text-sm text-[var(--text2)]">{selectedOrder.shippingAddressLine1}, {selectedOrder.shippingCity}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Payment</div>
                  <div className="text-sm text-[var(--text2)]">Method: <span className="font-bold text-[var(--text)]">{selectedOrder.paymentMethod || 'CARD'}</span></div>
                  <div className="text-sm text-[var(--text2)]">Status: <span className="font-bold text-brand-500">{selectedOrder.paymentStatus || 'PAID'}</span></div>
                  <div className="text-sm font-bold text-[var(--text)] mt-1">Total: {formatCurrency(selectedOrder.totalAmount)}</div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-3">Items Purchased</div>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-dark-surface2 rounded-xl border border-dark-border">
                      <div>
                        <div className="text-sm font-semibold text-[var(--text)]">{item.productName}</div>
                        <div className="text-xs text-[var(--text3)]">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</div>
                      </div>
                      <div className="text-sm font-bold text-[var(--text)]">{formatCurrency(item.subtotal)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-dark-border shrink-0 flex justify-end">
              <button onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-dark-surface2 border border-dark-border rounded-xl text-sm font-medium text-[var(--text)] hover:bg-dark-surface3 transition-colors">
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
