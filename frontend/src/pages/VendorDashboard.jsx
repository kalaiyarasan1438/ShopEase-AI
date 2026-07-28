import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw, Plus } from 'lucide-react';
import Badge from '@components/common/Badge.jsx';
import { formatCurrency, formatDate, getStatusConfig } from '@utils/formatters';
import api from '@services/api';

const WEEKLY_PLACEHOLDER = [
  { day: 'Mon', sales: 0 }, { day: 'Tue', sales: 0 },
  { day: 'Wed', sales: 0 }, { day: 'Thu', sales: 0 },
  { day: 'Fri', sales: 0 }, { day: 'Sat', sales: 0 },
  { day: 'Sun', sales: 0 },
];

const tooltipStyle = {
  backgroundColor: 'var(--bg1,#fff)',
  border: '1px solid var(--border,#e2e8f0)',
  borderRadius: 10, fontSize: 12,
  color: 'var(--text,#0f172a)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

export default function VendorDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, productsRes] = await Promise.all([
        api.get('/api/vendor/stats'),
        api.get('/api/vendor/orders?page=0&size=5'),
        api.get('/api/vendor/products?page=0&size=5'),
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.content || []);
      setTopProducts(productsRes.data.content || []);
    } catch (e) {
      console.error('Dashboard load failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  const STATS_CARDS = [
    { label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue || 0), icon: '💰' },
    { label: 'Products',      value: stats?.totalProducts || 0,   icon: '📦' },
    { label: 'Total Orders',  value: stats?.totalOrders || 0,     icon: '🛒' },
    { label: 'Avg Rating',    value: `${Number(stats?.ratingAvg || 0).toFixed(1)} ★`, icon: '⭐' },
  ];

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--text3)] mb-2">
            <span>Vendor</span><span>/</span>
            <span className="text-[var(--text2)] font-medium">Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Vendor Dashboard</h1>
          <p className="text-[var(--text2)] text-sm mt-1">
            {stats?.businessName || 'Your Store'} · Welcome back!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-2 rounded-xl border border-dark-border text-[var(--text3)] hover:text-[var(--text)] hover:bg-dark-surface2 transition-all">
            <RefreshCw size={15} />
          </button>
          <Link to="/vendor/add-product" className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-brand-500/20">
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS_CARDS.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-dark-surface1 border border-dark-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{s.icon}</span>
              <span className="text-xs text-[var(--text3)] uppercase tracking-wider">{s.label}</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-[var(--text)]">{s.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Chart - weekly placeholder (orders are not time-binned by API, show orders total instead) */}
        <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-sm mb-5 text-[var(--text)]">Recent Sales Activity</h3>
          <div className="flex flex-col gap-4">
            {topProducts.length === 0 ? (
              <p className="text-sm text-[var(--text3)] text-center py-8">No products yet. Add your first product!</p>
            ) : topProducts.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <img src={p.imageUrl || 'https://via.placeholder.com/40'} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-dark-surface3 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--text)] truncate">{p.name}</p>
                  <div className="h-1.5 bg-dark-surface3 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-purple-600 rounded-full"
                      style={{ width: `${Math.min((p.stockQty / 200) * 100, 100)}%` }} />
                  </div>
                </div>
                <span className="text-xs font-bold text-[var(--text2)] flex-shrink-0">{formatCurrency(p.price)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-dark-surface1 border border-dark-border rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border bg-dark-surface2">
            <h3 className="font-semibold text-sm text-[var(--text)]">Recent Orders</h3>
            <Link to="/vendor/orders" className="text-xs text-brand-500 hover:text-brand-600 font-medium">View all →</Link>
          </div>
          <div className="divide-y divide-dark-border">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-[var(--text3)] text-center py-8">No orders yet.</p>
            ) : recentOrders.map(o => {
              const sc = getStatusConfig(o.status);
              return (
                <div key={o.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-dark-surface2 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-brand-500">#{o.id}</p>
                    <p className="text-xs text-[var(--text2)] mt-0.5">{o.items?.[0]?.productName || 'Order'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[var(--text)]">{formatCurrency(o.totalAmount)}</p>
                    <Badge variant={sc.color} className="mt-1">{sc.icon} {sc.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
