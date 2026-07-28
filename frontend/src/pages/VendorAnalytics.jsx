import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';
import api from '@services/api';
import { formatCurrency } from '@utils/formatters';

const MONTHLY_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const tooltipStyle = {
  backgroundColor: 'var(--bg1,#fff)',
  border: '1px solid var(--border,#e2e8f0)',
  borderRadius: 10, fontSize: 12,
  color: 'var(--text,#0f172a)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

export default function VendorAnalytics() {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sRes, pRes, oRes] = await Promise.all([
          api.get('/api/vendor/stats'),
          api.get('/api/vendor/products?size=10'),
          api.get('/api/vendor/orders?size=100'),
        ]);
        setStats(sRes.data);
        setProducts(pRes.data.content || []);
        setOrders(oRes.data.content || []);
      } catch (e) {
        console.error('Analytics load failed', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Compute monthly order data from orders list
  const monthlySales = MONTHLY_LABELS.map((month, i) => {
    const monthOrders = orders.filter(o => o.createdAt && new Date(o.createdAt).getMonth() === i);
    const revenue = monthOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    return { month, revenue, orders: monthOrders.length };
  });

  // Order status breakdown
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = ['#6366f1', '#a855f7', '#f59e0b', '#10b981', '#f43f5e', '#38bdf8'];

  // KPIs
  const KPIS = [
    { label: 'Total Revenue',  value: formatCurrency(stats?.totalRevenue || 0), icon: '💰' },
    { label: 'Total Orders',   value: stats?.totalOrders || 0, icon: '📦' },
    { label: 'Products Listed', value: stats?.totalProducts || 0, icon: '🛍️' },
    { label: 'Avg Rating',     value: `${Number(stats?.ratingAvg || 0).toFixed(1)} ★`, icon: '⭐' },
  ];

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-[var(--text3)] mb-2">
          <span>Vendor</span><span>/</span>
          <span className="text-[var(--text2)] font-medium">Analytics</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] flex items-center gap-3">
          <TrendingUp className="text-brand-500" size={24} /> Sales Analytics
        </h1>
        <p className="text-[var(--text2)] text-sm mt-1">Performance metrics for your store.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-dark-surface1 border border-dark-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{k.icon}</span>
              <span className="text-xs text-[var(--text3)] uppercase tracking-wider">{k.label}</span>
            </div>
            <div className="text-2xl font-bold text-[var(--text)]">{k.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Monthly Revenue Area Chart */}
      <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-sm mb-5 text-[var(--text)]">Monthly Revenue (Current Year)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlySales}>
            <defs>
              <linearGradient id="areaRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border,#e2e8f0)" />
            <XAxis dataKey="month" tick={{ fill: 'var(--text3,#94a3b8)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} tick={{ fill: 'var(--text3,#94a3b8)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => [formatCurrency(v), 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#areaRev)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Monthly Orders Bar */}
        <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-sm mb-5 text-[var(--text)]">Monthly Order Count</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlySales} barSize={16}>
              <defs>
                <linearGradient id="barOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="rgba(168,85,247,0.2)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border,#e2e8f0)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text3,#94a3b8)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text3,#94a3b8)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [v, 'Orders']} />
              <Bar dataKey="orders" fill="url(#barOrders)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-sm mb-5 text-[var(--text)]">Order Status Breakdown</h3>
          {statusData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-[var(--text3)] text-sm">No order data yet.</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={150}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                    {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={v => [v, 'Orders']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {statusData.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="flex-1 text-[var(--text2)]">{s.name}</span>
                    <span className="font-bold text-[var(--text)]">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      {products.length > 0 && (
        <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-sm mb-5 text-[var(--text)]">Your Products</h3>
          <div className="space-y-3">
            {products.map(p => (
              <div key={p.id} className="flex items-center gap-4">
                <img src={p.imageUrl || 'https://via.placeholder.com/40'} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-dark-surface3 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-[var(--text)]">{p.name}</p>
                  <div className="h-1.5 bg-dark-surface3 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-purple-600 rounded-full"
                      style={{ width: `${Math.min((p.stockQty / 200) * 100, 100)}%` }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-[var(--text)]">{formatCurrency(p.price)}</p>
                  <p className="text-[10px] text-[var(--text3)]">{p.stockQty} in stock</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
