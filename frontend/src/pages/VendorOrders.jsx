import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Search, RefreshCw, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@services/api';
import { formatCurrency, formatDate, getStatusConfig } from '@utils/formatters';
import Badge from '@components/common/Badge.jsx';

const ORDER_STATUSES = ['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ size: 100, page: 0 });
      if (filterStatus !== 'ALL') params.set('status', filterStatus);
      const res = await api.get(`/api/vendor/orders?${params}`);
      setOrders(res.data.content || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const res = await api.patch(`/api/vendor/orders/${orderId}/status?status=${newStatus}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: res.data.status } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(prev => ({ ...prev, status: res.data.status }));
      toast.success(`Order status updated to ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = orders.filter(o => {
    if (!search) return true;
    const term = search.toLowerCase();
    return `#${o.id}`.includes(term) || o.shippingName?.toLowerCase().includes(term);
  });

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
            <ClipboardList className="text-brand-500" size={24} /> Orders
          </h1>
        </div>
        <button onClick={fetchOrders} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-dark-surface2 border border-dark-border rounded-xl text-sm text-[var(--text2)] hover:text-[var(--text)] transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order ID or customer…"
            className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60">
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-dark-surface1 border border-dark-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-dark-border bg-dark-surface2">
          <h3 className="font-semibold text-sm text-[var(--text)]">Orders ({filtered.length})</h3>
        </div>

        {loading ? (
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
                  {['Order ID', 'Customer', 'Items', 'Amount', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[var(--text3)] uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, idx) => {
                  const sc = getStatusConfig(o.status);
                  return (
                    <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                      className="border-b border-dark-border last:border-none hover:bg-dark-surface2 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-brand-500 text-sm">#{o.id}</td>
                      <td className="px-5 py-3.5 text-sm text-[var(--text)]">{o.shippingName || 'Customer'}</td>
                      <td className="px-5 py-3.5 text-sm text-[var(--text2)]">{o.items?.length || 0} item(s)</td>
                      <td className="px-5 py-3.5 font-bold text-sm text-[var(--text)]">{formatCurrency(o.totalAmount)}</td>
                      <td className="px-5 py-3.5"><Badge variant={sc.color}>{sc.icon} {sc.label}</Badge></td>
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

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
              {/* Status Update */}
              <div className="bg-dark-surface2 p-4 rounded-xl border border-dark-border flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">Update Status</div>
                  <div className="text-xs text-[var(--text3)]">Change this order's current state</div>
                </div>
                <select value={selectedOrder.status}
                  onChange={e => updateStatus(selectedOrder.id, e.target.value)}
                  disabled={updating === selectedOrder.id}
                  className="bg-dark-surface1 border border-dark-border rounded-lg px-3 py-1.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60 disabled:opacity-60">
                  {ORDER_STATUSES.filter(s => s !== 'ALL').map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Customer</div>
                  <div className="text-sm font-medium text-[var(--text)]">{selectedOrder.shippingName}</div>
                  <div className="text-sm text-[var(--text2)]">{selectedOrder.shippingAddressLine1}, {selectedOrder.shippingCity}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Order Details</div>
                  <div className="text-sm text-[var(--text2)]">Placed: {formatDate(selectedOrder.createdAt)}</div>
                  <div className="text-sm font-bold text-[var(--text)]">Total: {formatCurrency(selectedOrder.totalAmount)}</div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-3">Items</div>
                <div className="space-y-2">
                  {selectedOrder.items?.map(item => (
                    <div key={item.productId} className="flex items-center justify-between p-3 bg-dark-surface2 rounded-xl border border-dark-border">
                      <div>
                        <div className="text-sm font-semibold text-[var(--text)]">{item.productName}</div>
                        <div className="text-xs text-[var(--text3)]">Qty: {item.quantity}</div>
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
