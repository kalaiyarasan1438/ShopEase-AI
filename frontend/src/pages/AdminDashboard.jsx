import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import Badge from '@components/common/Badge.jsx';
import { formatCurrency, formatDate, getStatusConfig, formatCompact } from '@utils/formatters';
import api from '@services/api';

const CATEGORY_COLORS = ['#6366f1', '#a855f7', '#f59e0b', '#38bdf8', '#10b981', '#ec4899', '#8b5cf6'];

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
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [statsRes, analyticsRes, ordersRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/analytics'),
        api.get('/api/admin/orders?page=0&size=5')
      ]);
      setStats(statsRes.data);
      setAnalytics(analyticsRes.data);
      setRecentOrders(ordersRes.data.content || []);
    } catch (error) {
      if (!isSilent) console.error("Failed to fetch dashboard data", error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // 5-second polling timer
  useEffect(() => {
    const timer = setInterval(() => {
      fetchDashboardData(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [fetchDashboardData]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  const STATS_CARDS = [
    { label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue || 0), change: 'Real order revenue', icon: '💰' },
    { label: 'Total Orders', value: stats?.totalOrders || 0, change: 'Platform wide', icon: '📦' },
    { label: 'Total Products', value: stats?.totalProducts || 0, change: `${stats?.activeProducts || 0} active • ${stats?.hiddenProducts || 0} hidden`, icon: '🛍️' },
    { label: 'Users & Vendors', value: `${stats?.totalUsers || 0} / ${stats?.totalVendors || 0}`, change: `${stats?.pendingVendors || 0} pending vendors`, icon: '👥' },
  ];

  const monthlyRevenue = analytics?.monthlyData || [];
  const categoryRevenue = analytics?.categoryRevenue || [];
  const lowStockProducts = stats?.lowStockProducts || [];
  const topProducts = stats?.topSellingProducts || [];

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
          Real-time platform overview and system metrics.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS_CARDS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-dark-surface1 border border-dark-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-xs text-[var(--text3)] font-medium uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold tracking-tight mb-1 text-[var(--text)]">{stat.value}</div>
            <div className="text-xs font-medium text-[var(--text3)]">
              {stat.change}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Alert Banners (Pending Refunds / Low Stock) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats?.pendingRefunds > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-lg">
                🔄
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--text)]">{stats.pendingRefunds} Pending Refund Requests</h4>
                <p className="text-xs text-[var(--text2)]">Customers requesting order cancellation/refund</p>
              </div>
            </div>
            <Link to="/admin/orders" className="text-xs font-bold text-amber-500 hover:underline">
              Review →
            </Link>
          </div>
        )}

        {stats?.lowStockCount > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center font-bold text-lg">
                ⚠️
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--text)]">{stats.lowStockCount} Low Stock Items Alert</h4>
                <p className="text-xs text-[var(--text2)]">Products with inventory below 5 units</p>
              </div>
            </div>
            <Link to="/admin/products" className="text-xs font-bold text-red-400 hover:underline">
              Manage →
            </Link>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-dark-surface1 border border-dark-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-sm text-[var(--text)]">Monthly Revenue</h3>
              <p className="text-xs text-[var(--text3)] mt-0.5">Live database sales overview</p>
            </div>
            <Link to="/admin/analytics" className="text-xs text-brand-500 hover:text-brand-600 font-medium">
              View Analytics →
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyRevenue} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e2e8f0)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text3, #94a3b8)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `₹${formatCompact(v)}`} tick={{ fill: 'var(--text3, #94a3b8)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => [formatCurrency(v), 'Revenue']}
                contentStyle={tooltipStyle}
                cursor={{ fill: 'rgba(99,102,241,0.06)' }}
              />
              <Bar dataKey="revenue" fill="url(#barGrad)" radius={[4,4,0,0]} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
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
          {categoryRevenue.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text3)]">No category data yet.</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={categoryRevenue} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="revenue">
                    {categoryRevenue.map((entry, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(v), 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2 max-h-[100px] overflow-y-auto custom-scrollbar">
                {categoryRevenue.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                    <span className="flex-1 text-[var(--text2)] truncate">{c.name}</span>
                    <span className="font-semibold text-[var(--text)]">{formatCurrency(c.revenue)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Widgets & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-dark-surface1 border border-dark-border rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border bg-dark-surface2">
            <h3 className="font-semibold text-sm text-[var(--text)]">Recent Platform Orders</h3>
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
                        <span className="font-bold text-brand-500 text-sm">#{order.orderNumber || order.id}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[var(--text)]">{order.shippingName || order.user?.name || 'Customer'}</td>
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

        {/* Low Stock Items Widget */}
        <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-[var(--text)]">Low Stock Inventory</h3>
              <Link to="/admin/products" className="text-xs text-brand-500 font-medium">Manage</Link>
            </div>
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text3)]">All stock levels are healthy! ✅</div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-dark-surface2 p-2.5 rounded-xl border border-dark-border text-xs">
                    <span className="font-semibold text-[var(--text)] truncate max-w-[150px]">{item.name}</span>
                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 font-bold border border-red-500/20">
                      {item.stockQty} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
