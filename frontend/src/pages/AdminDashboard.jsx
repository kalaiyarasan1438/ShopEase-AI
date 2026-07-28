import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import Badge from '@components/common/Badge.jsx';
import { formatCurrency, formatDate, getStatusConfig } from '@utils/formatters';
import api from '@services/api';

// ── Mock data for charts (can be made real later if needed) ────────────────
const MONTHLY_REVENUE = [
  { month: 'Jan', revenue: 3570000 }, { month: 'Feb', revenue: 3230000 },
  { month: 'Mar', revenue: 4675000 }, { month: 'Apr', revenue: 5185000 },
  { month: 'May', revenue: 4080000 }, { month: 'Jun', revenue: 6120000 },
  { month: 'Jul', revenue: 5780000 }, { month: 'Aug', revenue: 6970000 },
  { month: 'Sep', revenue: 6375000 }, { month: 'Oct', revenue: 7650000 },
  { month: 'Nov', revenue: 7225000 }, { month: 'Dec', revenue: 8075000 },
];

const CATEGORY_DATA = [
  { name: 'Electronics', value: 38, color: '#6366f1' },
  { name: 'Furniture',   value: 28, color: '#a855f7' },
  { name: 'Sports',      value: 18, color: '#f59e0b' },
  { name: 'Others',      value: 16, color: '#38bdf8' },
];

const tooltipStyle = {
  backgroundColor: 'var(--bg1, #ffffff)',
  border: '1px solid var(--border, #e2e8f0)',
  borderRadius: 10,
  fontSize: 12,
  color: 'var(--text, #0f172a)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          api.get('/api/admin/stats'),
          api.get('/api/admin/orders?page=0&size=5')
        ]);
        setStats(statsRes.data);
        setRecentOrders(ordersRes.data.content || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  const STATS_CARDS = [
    { label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue || 0), change: 'From real orders', up: true, icon: '💰' },
    { label: 'Total Orders',  value: stats?.totalOrders || 0,    change: 'Platform wide', up: true, icon: '📦' },
    { label: 'Total Products',value: stats?.totalProducts || 0,  change: 'Active inventory', up: true, icon: '🛍️' },
    { label: 'Users & Vendors',value: `${stats?.totalUsers || 0} / ${stats?.totalVendors || 0}`, change: `${stats?.pendingVendors || 0} pending vendors`, up: true, icon: '👥' },
  ];

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-[var(--text3)] mb-2">
          <span>Admin</span><span>/</span>
          <span className="text-[var(--text2)] font-medium">Dashboard</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Admin Dashboard</h1>
        <p className="text-[var(--text2)] text-sm mt-1">
          Welcome back, Admin. Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS_CARDS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-dark-surface1 border border-dark-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-xs text-[var(--text3)] font-medium uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold tracking-tight mb-1 text-[var(--text)]">{stat.value}</div>
            <div className={`text-xs font-medium text-[var(--text3)]`}>
              {stat.change}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-5">
        {/* Revenue Bar Chart */}
        <div className="col-span-2 bg-dark-surface1 border border-dark-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-sm text-[var(--text)]">Monthly Revenue</h3>
              <p className="text-xs text-[var(--text3)] mt-0.5">Full year 2024</p>
            </div>
            <button className="text-xs text-[var(--text2)] hover:text-[var(--text)] border border-dark-border px-3 py-1.5 rounded-lg transition-colors hover:bg-dark-surface2">
              Export
            </button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MONTHLY_REVENUE} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e2e8f0)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text3, #94a3b8)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `₹${(v/100000).toFixed(1)}L`} tick={{ fill: 'var(--text3, #94a3b8)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => [formatCurrency(v), 'Revenue']}
                contentStyle={tooltipStyle}
                cursor={{ fill: 'rgba(99,102,241,0.06)' }}
              />
              <Bar dataKey="revenue" fill="url(#barGrad)" radius={[4,4,0,0]} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#6366f1" />
                  <stop offset="100%" stopColor="rgba(99,102,241,0.3)" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-sm mb-1 text-[var(--text)]">Sales by Category</h3>
          <p className="text-xs text-[var(--text3)] mb-4">Revenue distribution</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={CATEGORY_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {CATEGORY_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Share']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {CATEGORY_DATA.map(c => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                <span className="flex-1 text-[var(--text2)]">{c.name}</span>
                <span className="font-semibold text-[var(--text)]">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-dark-surface1 border border-dark-border rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border bg-dark-surface2">
          <h3 className="font-semibold text-sm text-[var(--text)]">Recent Orders</h3>
          <Link to="/admin/orders" className="text-xs text-brand-500 hover:text-brand-600 transition-colors font-medium">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                {['Order ID','Customer','Amount','Status','Date'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-[var(--text3)] uppercase tracking-wider px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-8 text-center text-sm text-[var(--text3)]">
                    No recent orders.
                  </td>
                </tr>
              ) : recentOrders.map(order => {
                const sc = getStatusConfig(order.status);
                return (
                  <tr key={order.id} className="border-b border-dark-border last:border-none hover:bg-dark-surface2 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-brand-500 text-sm">#{order.id}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[var(--text)]">{order.user?.name || 'Unknown'}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-sm text-[var(--text)]">{formatCurrency(order.totalAmount)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={sc.color}>{sc.icon} {sc.label}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[var(--text3)]">{formatDate(order.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
