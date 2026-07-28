import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Search, RefreshCw, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@services/api';
import { formatCurrency, formatDate, getStatusConfig } from '@utils/formatters';
import Badge from '@components/common/Badge.jsx';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = filterStatus !== 'ALL' ? `&status=${filterStatus}` : '';
      const res = await api.get(`/api/admin/orders?size=100${statusParam}`);
      setOrders(res.data.content || []);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const res = await api.patch(`/api/admin/orders/${orderId}/status?status=${newStatus}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: res.data.status } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: res.data.status }));
      }
      toast.success(`Order status updated to ${newStatus}.`);
    } catch (err) {
      toast.error('Failed to update order status');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = orders.filter(o => {
    const term = search.toLowerCase();
    return !search || 
      `ORD-${o.id}`.toLowerCase().includes(term) ||
      o.user?.name?.toLowerCase().includes(term) ||
      o.user?.email?.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--text3)] mb-2">
            <span>Admin</span><span>/</span>
            <span className="text-[var(--text2)] font-medium">Order Management</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] flex items-center gap-3">
            <ClipboardList className="text-brand-500" size={24} />
            Orders
          </h1>
          <p className="text-[var(--text2)] text-sm mt-1">Monitor and update all platform orders.</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-dark-surface2 border border-dark-border rounded-xl text-sm text-[var(--text2)] hover:text-[var(--text)] hover:border-dark-border2 transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search & filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID, name, or email…"
            className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button
          onClick={() => { setSearch(''); setFilterStatus('ALL'); }}
          className="text-xs text-[var(--text3)] hover:text-[var(--text)] transition-colors"
        >
          Clear filters
        </button>
      </div>

      {/* Table */}
      <div className="bg-dark-surface1 border border-dark-border rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border bg-dark-surface2">
          <h3 className="font-semibold text-sm text-[var(--text)]">
            All Orders ({filtered.length})
          </h3>
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
                  {['Order ID', 'Customer', 'Amount', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[var(--text3)] uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, idx) => {
                  const sc = getStatusConfig(o.status);
                  return (
                    <motion.tr
                      key={o.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="border-b border-dark-border last:border-none hover:bg-dark-surface2 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-brand-500 text-sm">#{o.id}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-medium text-[var(--text)]">{o.user?.name || 'Unknown'}</div>
                        <div className="text-xs text-[var(--text3)]">{o.user?.email || ''}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-sm text-[var(--text)]">{formatCurrency(o.totalAmount)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={sc.color}>{sc.icon} {sc.label}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[var(--text3)] whitespace-nowrap">
                        {o.createdAt ? formatDate(o.createdAt) : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-colors"
                        >
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

      {/* View Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-surface1 border border-dark-border rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-dark-border flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-[var(--text)]">Order #{selectedOrder.id}</h2>
              <Badge variant={getStatusConfig(selectedOrder.status).color}>
                {getStatusConfig(selectedOrder.status).icon} {getStatusConfig(selectedOrder.status).label}
              </Badge>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              {/* Status Update section */}
              <div className="bg-dark-surface2 p-4 rounded-xl border border-dark-border flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--text)] mb-1">Update Status</div>
                  <div className="text-xs text-[var(--text3)]">Manually update the state of this order</div>
                </div>
                <div className="flex gap-2">
                  <select
                    className="bg-dark-surface1 border border-dark-border rounded-lg px-3 py-1.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60"
                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                    value={selectedOrder.status}
                    disabled={updating === selectedOrder.id}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-2">Customer Info</div>
                  <div className="text-sm font-medium text-[var(--text)]">{selectedOrder.user?.name}</div>
                  <div className="text-sm text-[var(--text2)]">{selectedOrder.user?.email}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-2">Order Info</div>
                  <div className="text-sm text-[var(--text2)]">Placed: {formatDate(selectedOrder.createdAt)}</div>
                  <div className="text-sm text-[var(--text2)]">Total: <span className="font-bold text-[var(--text)]">{formatCurrency(selectedOrder.totalAmount)}</span></div>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div>
                  <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-2">Shipping Address</div>
                  <div className="text-sm text-[var(--text2)] bg-dark-surface2 p-3 rounded-xl border border-dark-border">
                    <p>{selectedOrder.shippingAddress.street}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-3">Order Items ({selectedOrder.items?.length || 0})</div>
                <div className="space-y-3">
                  {selectedOrder.items?.map(item => (
                    <div key={item.id} className="flex items-center gap-4 bg-dark-surface2 p-3 rounded-xl border border-dark-border">
                      <img src={item.productImageUrl || '/placeholder.png'} alt={item.productName} className="w-12 h-12 rounded bg-dark-surface3 object-cover" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[var(--text)]">{item.productName}</div>
                        <div className="text-xs text-[var(--text2)]">Vendor: {item.vendorName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-[var(--text)]">{formatCurrency(item.price)}</div>
                        <div className="text-xs text-[var(--text3)]">Qty: {item.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-dark-border shrink-0 flex justify-end gap-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-dark-surface2 border border-dark-border rounded-xl text-sm font-medium text-[var(--text)] hover:bg-dark-surface3 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
