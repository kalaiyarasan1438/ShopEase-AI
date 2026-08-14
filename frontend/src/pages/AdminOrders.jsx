import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Search, RefreshCw, Eye, Download, Printer, CheckCircle, Clock, Truck, PackageCheck, AlertCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@services/api';
import { formatCurrency, formatDate, getStatusConfig } from '@utils/formatters';
import Badge from '@components/common/Badge.jsx';

const ALL_STATUSES = [
  'ALL',
  'ORDER_PLACED',
  'CONFIRMED',
  'PROCESSING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'REFUND_REQUESTED',
  'REFUNDED',
  'REFUND_REJECTED'
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('ALL');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('ALL');

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(null);

  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      let params = new URLSearchParams({ size: '100' });
      if (filterStatus !== 'ALL') params.append('status', filterStatus);
      if (filterPaymentMethod !== 'ALL') params.append('paymentMethod', filterPaymentMethod);
      if (filterPaymentStatus !== 'ALL') params.append('paymentStatus', filterPaymentStatus);

      const res = await api.get(`/api/admin/orders?${params.toString()}`);
      setOrders(res.data.content || []);
    } catch (err) {
      if (!isSilent) toast.error('Failed to load orders');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [filterStatus, filterPaymentMethod, filterPaymentStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 4-second auto-refresh polling timer
  useEffect(() => {
    const timer = setInterval(() => {
      fetchOrders(true);
    }, 4000);
    return () => clearInterval(timer);
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const res = await api.patch(`/api/admin/orders/${orderId}/status?status=${newStatus}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: res.data.status } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: res.data.status }));
      }
      toast.success(`Order #${orderId} status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update order status');
    } finally {
      setUpdating(null);
    }
  };

  // Filtered in memory for search term
  const filtered = orders.filter(o => {
    const term = search.toLowerCase();
    const orderNum = o.orderNumber || `ORD-${o.id}`;
    return !search || 
      orderNum.toLowerCase().includes(term) ||
      o.user?.name?.toLowerCase().includes(term) ||
      o.user?.email?.toLowerCase().includes(term) ||
      o.shippingName?.toLowerCase().includes(term);
  });

  // Invoice Printable PDF generator
  const handleDownloadInvoice = (order) => {
    const invoiceWindow = window.open('', '_blank', 'width=800,height=900');
    if (!invoiceWindow) {
      toast.error('Please allow popups to download invoice');
      return;
    }

    const itemsHtml = (order.items || []).map(i => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px; text-align: left;">${i.productName || 'Product'}</td>
        <td style="padding: 12px; text-align: center;">${i.quantity}</td>
        <td style="padding: 12px; text-align: right;">₹${(i.unitPrice || 0).toLocaleString()}</td>
        <td style="padding: 12px; text-align: right; font-weight: bold;">₹${(i.subtotal || 0).toLocaleString()}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${order.orderNumber || order.id}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 40px; margin: 0; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: 800; color: #6366f1; }
          .invoice-title { font-size: 20px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #475569; }
          .grid { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .box { width: 48%; }
          .box h4 { margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .table th { background: #f8fafc; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #e2e8f0; }
          .totals { width: 300px; margin-left: auto; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
          .totals-row.grand { font-size: 18px; font-weight: bold; color: #6366f1; border-top: 2px solid #e2e8f0; padding-top: 12px; margin-top: 8px; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🛍️ ShopEasy</div>
          <div>
            <div class="invoice-title">Tax Invoice</div>
            <div style="font-size: 14px; color: #64748b;">Order #: ${order.orderNumber || 'ORD-' + order.id}</div>
            <div style="font-size: 12px; color: #94a3b8;">Date: ${formatDate(order.createdAt)}</div>
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <h4>Billed To (Customer)</h4>
            <div style="font-size: 15px; font-weight: 600;">${order.shippingName || order.user?.name || 'Customer'}</div>
            <div style="font-size: 13px; color: #475569; line-height: 1.5; margin-top: 4px;">
              ${order.shippingAddressLine1 || ''}<br/>
              ${order.shippingCity || ''}, ${order.shippingState || ''} ${order.shippingZip || ''}<br/>
              ${order.shippingCountry || 'India'}<br/>
              Email: ${order.user?.email || 'N/A'}
            </div>
          </div>
          <div class="box" style="text-align: right;">
            <h4>Payment Information</h4>
            <div style="font-size: 14px;">Method: <strong>${order.paymentMethod || 'COD'}</strong></div>
            <div style="font-size: 14px;">Status: <strong>${order.paymentStatus || 'PAID'}</strong></div>
            <div style="font-size: 14px; margin-top: 8px;">Order Status: <strong>${order.status}</strong></div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Item Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row"><span>Subtotal:</span> <span>${formatCurrency((order.totalAmount || 0) - (order.shippingAmount || 0) - (order.taxAmount || 0))}</span></div>
          <div class="totals-row"><span>Shipping:</span> <span>${formatCurrency(order.shippingAmount || 0)}</span></div>
          <div class="totals-row"><span>Tax (GST 18%):</span> <span>${formatCurrency(order.taxAmount || 0)}</span></div>
          <div class="totals-row grand"><span>Total Amount:</span> <span>${formatCurrency(order.totalAmount)}</span></div>
        </div>

        <div class="footer">
          <p>Thank you for shopping with ShopEasy! For support, contact support@shopeasy.in</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    invoiceWindow.document.write(htmlContent);
    invoiceWindow.document.close();
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--text3)] mb-2">
            <span>Admin</span><span>/</span>
            <span className="text-[var(--text2)] font-medium">Order Management</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] flex items-center gap-3">
            <ClipboardList className="text-brand-500" size={24} />
            Orders
          </h1>
          <p className="text-[var(--text2)] text-sm mt-1">Monitor, filter, and manage platform order lifecycles and invoices.</p>
        </div>
        <button
          onClick={() => fetchOrders(false)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-dark-surface2 border border-dark-border rounded-xl text-sm text-[var(--text2)] hover:text-[var(--text)] hover:border-dark-border2 transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by Order ID, customer, or address…"
            className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors"
          />
        </div>

        {/* Order Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-dark-surface2 border border-dark-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[var(--text)] outline-none focus:border-brand-500/60"
        >
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>
              {s === 'ALL' ? 'All Statuses' : s}
            </option>
          ))}
        </select>

        {/* Payment Method Filter */}
        <select
          value={filterPaymentMethod}
          onChange={(e) => setFilterPaymentMethod(e.target.value)}
          className="bg-dark-surface2 border border-dark-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[var(--text)] outline-none focus:border-brand-500/60"
        >
          <option value="ALL">All Payment Methods</option>
          <option value="COD">💵 Cash on Delivery (COD)</option>
          <option value="CARD">💳 Online / Card</option>
          <option value="UPI">📱 UPI</option>
          <option value="BANK">🏛️ Net Banking</option>
        </select>

        {/* Payment Status Filter */}
        <select
          value={filterPaymentStatus}
          onChange={(e) => setFilterPaymentStatus(e.target.value)}
          className="bg-dark-surface2 border border-dark-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[var(--text)] outline-none focus:border-brand-500/60"
        >
          <option value="ALL">All Payment Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="REFUNDED">Refunded</option>
        </select>

        <button
          onClick={() => { setSearch(''); setFilterStatus('ALL'); setFilterPaymentMethod('ALL'); setFilterPaymentStatus('ALL'); }}
          className="text-xs text-[var(--text3)] hover:text-[var(--text)] transition-colors"
        >
          Clear filters
        </button>
      </div>

      {/* Orders Table */}
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
            <p className="text-sm">No orders found matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Order ID', 'Customer', 'Payment', 'Amount', 'Status', 'Date', 'Actions'].map(h => (
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
                      transition={{ delay: idx * 0.015 }}
                      className="border-b border-dark-border last:border-none hover:bg-dark-surface2 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-brand-500 text-sm">{o.orderNumber || `ORD-${o.id}`}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-semibold text-[var(--text)]">{o.shippingName || o.user?.name || 'Customer'}</div>
                        <div className="text-xs text-[var(--text3)]">{o.user?.email || ''}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                            o.paymentMethod === 'COD' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                          }`}>
                            {o.paymentMethod || 'CARD'}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            o.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' :
                            o.paymentStatus === 'REFUNDED' ? 'bg-gray-400/10 text-gray-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>
                            {o.paymentStatus || 'PENDING'}
                          </span>
                        </div>
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            title="View Full Order Details"
                            className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-500/10 transition-colors flex items-center gap-1 text-xs font-bold"
                          >
                            <Eye size={16} /> View
                          </button>
                          <button
                            onClick={() => handleDownloadInvoice(o)}
                            title="Download Tax Invoice PDF"
                            className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Complete Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-surface1 border border-dark-border rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-dark-border flex items-center justify-between bg-dark-surface2 shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[var(--text)]">
                  Order #{selectedOrder.orderNumber || selectedOrder.id}
                </h2>
                <Badge variant={getStatusConfig(selectedOrder.status).color}>
                  {getStatusConfig(selectedOrder.status).icon} {getStatusConfig(selectedOrder.status).label}
                </Badge>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-3 py-1.5 bg-dark-surface3 hover:bg-dark-surface1 text-xs text-[var(--text)] font-semibold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              {/* Quick Status Override */}
              <div className="bg-dark-surface2 p-4 rounded-xl border border-dark-border flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--text)] mb-0.5">Admin Order Status Override</div>
                  <div className="text-xs text-[var(--text3)]">Manually update status to any step in the lifecycle</div>
                </div>
                <div className="flex gap-2">
                  <select
                    className="bg-dark-surface1 border border-dark-border rounded-xl px-3 py-1.5 text-xs font-semibold text-[var(--text)] outline-none focus:border-brand-500/60"
                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                    value={selectedOrder.status}
                    disabled={updating === selectedOrder.id}
                  >
                    {ALL_STATUSES.filter(s => s !== 'ALL').map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer & Shipping */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-dark-surface2/50 p-4 rounded-xl border border-dark-border">
                  <div className="text-xs font-bold text-[var(--text3)] uppercase tracking-wider mb-2">Customer Info</div>
                  <div className="text-sm font-bold text-[var(--text)]">{selectedOrder.shippingName || selectedOrder.user?.name || 'Customer'}</div>
                  <div className="text-xs text-[var(--text2)] mt-1">{selectedOrder.user?.email || 'N/A'}</div>
                  <div className="text-xs text-[var(--text3)] mt-1">Placed: {formatDate(selectedOrder.createdAt)}</div>
                </div>

                <div className="bg-dark-surface2/50 p-4 rounded-xl border border-dark-border">
                  <div className="text-xs font-bold text-[var(--text3)] uppercase tracking-wider mb-2">Shipping Address</div>
                  <div className="text-xs text-[var(--text2)] leading-relaxed">
                    <p className="font-semibold text-[var(--text)]">{selectedOrder.shippingName}</p>
                    <p>{selectedOrder.shippingAddressLine1}</p>
                    <p>{selectedOrder.shippingCity}, {selectedOrder.shippingState} {selectedOrder.shippingZip}</p>
                    <p>{selectedOrder.shippingCountry || 'India'}</p>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-dark-surface2/50 p-4 rounded-xl border border-dark-border">
                <div className="text-xs font-bold text-[var(--text3)] uppercase tracking-wider mb-2">Payment Details</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[var(--text3)] block">Method</span>
                    <span className="font-bold text-[var(--text)]">{selectedOrder.paymentMethod || 'COD'}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text3)] block">Payment Status</span>
                    <span className="font-bold text-emerald-400">{selectedOrder.paymentStatus || 'PAID'}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text3)] block">Total Paid</span>
                    <span className="font-bold text-brand-500">{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Order Items Breakdown */}
              <div>
                <div className="text-xs font-bold text-[var(--text3)] uppercase tracking-wider mb-3">Order Items ({selectedOrder.items?.length || 0})</div>
                <div className="space-y-3">
                  {selectedOrder.items?.map(item => (
                    <div key={item.id || item.productId} className="flex items-center gap-4 bg-dark-surface2 p-3 rounded-xl border border-dark-border">
                      <div className="w-12 h-12 rounded-lg bg-dark-surface3 border border-dark-border flex items-center justify-center text-lg font-bold text-brand-500 shrink-0">
                        📦
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[var(--text)] truncate">{item.productName}</div>
                        <div className="text-xs text-[var(--text3)]">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-[var(--text)]">{formatCurrency(item.subtotal)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-dark-border bg-dark-surface2 shrink-0 flex items-center justify-between">
              <button
                onClick={() => handleDownloadInvoice(selectedOrder)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                <Download size={15} /> Download Invoice PDF
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-dark-surface3 hover:bg-dark-surface1 text-xs font-semibold text-[var(--text)] rounded-xl transition-colors"
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
