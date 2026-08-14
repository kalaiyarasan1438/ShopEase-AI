import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Download, RefreshCw, TrendingUp, DollarSign, ShoppingBag, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@services/api';
import { formatCurrency, formatCompact } from '@utils/formatters';

const CATEGORY_COLORS = ['#6366f1', '#a855f7', '#f59e0b', '#38bdf8', '#10b981', '#ec4899', '#8b5cf6'];

const tooltipStyle = {
  backgroundColor: 'var(--bg1, #ffffff)',
  border: '1px solid var(--border, #e2e8f0)',
  borderRadius: 10,
  fontSize: 12,
  color: 'var(--text, #0f172a)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchAnalytics = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get(`/api/admin/analytics?year=${selectedYear}`);
      setData(res.data);
    } catch (err) {
      if (!isSilent) toast.error('Failed to load analytics data');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // 10-second polling
  useEffect(() => {
    const timer = setInterval(() => {
      fetchAnalytics(true);
    }, 10000);
    return () => clearInterval(timer);
  }, [fetchAnalytics]);

  // Export handlers
  const handleExportCSV = () => {
    if (!data || !data.monthlyData) return;
    let csvContent = 'data:text/csv;charset=utf-8,Month,Revenue,Orders\n';
    data.monthlyData.forEach(row => {
      csvContent += `${row.month},${row.revenue},${row.orders}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ShopEasy_Analytics_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Analytics exported to CSV! 📊');
  };

  const handleExportExcel = () => {
    if (!data || !data.monthlyData) return;
    let tsvContent = 'data:application/vnd.ms-excel;charset=utf-8,Month\tRevenue\tOrders\n';
    data.monthlyData.forEach(row => {
      tsvContent += `${row.month}\t${row.revenue}\t${row.orders}\n`;
    });
    const encodedUri = encodeURI(tsvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ShopEasy_Analytics_${selectedYear}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Analytics exported to Excel! 📈');
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=900');
    if (!printWindow) {
      toast.error('Please allow popups for PDF export');
      return;
    }

    const rowsHtml = (data?.monthlyData || []).map(r => `
      <tr>
        <td style="padding:10px; border-bottom:1px solid #eee;">${r.month}</td>
        <td style="padding:10px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">₹${(r.revenue || 0).toLocaleString()}</td>
        <td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">${r.orders}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ShopEasy Analytics Report ${selectedYear}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #0f172a; }
          h1 { color: #6366f1; }
          .summary { display: flex; gap: 20px; margin-bottom: 30px; }
          .card { background: #f8fafc; padding: 15px; border-radius: 8px; flex: 1; border: 1px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f1f5f9; padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1; }
        </style>
      </head>
      <body>
        <h1>🛍️ ShopEasy Admin Analytics Report (${selectedYear})</h1>
        <div class="summary">
          <div class="card"><h3>Avg Order Value</h3><p>₹${(data?.avgOrderValue || 0).toLocaleString()}</p></div>
          <div class="card"><h3>Refund Rate</h3><p>${data?.refundRate || 0}%</p></div>
          <div class="card"><h3>Total Orders</h3><p>${data?.totalOrders || 0}</p></div>
        </div>
        <table>
          <thead>
            <tr><th>Month</th><th style="text-align:right;">Revenue</th><th style="text-align:right;">Orders</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  const KPIS = [
    { label: 'Avg Order Value', value: formatCurrency(data?.avgOrderValue || 0), change: 'Live orders', icon: '💰', color: 'text-brand-500' },
    { label: 'Total Orders', value: data?.totalOrders || 0, change: `${data?.deliveredOrders || 0} delivered`, icon: '📦', color: 'text-purple-400' },
    { label: 'Refund Rate', value: `${data?.refundRate || 0}%`, change: 'Completed refunds', icon: '🔄', color: 'text-amber-400' },
    { label: 'Conversion Rate', value: '3.85%', change: 'Estimated traffic', icon: '⚡', color: 'text-emerald-400' },
  ];

  const monthlyList = data?.monthlyData || [];
  const topProducts = data?.topProducts || [];
  const topCustomers = data?.topCustomers || [];
  const categoryRev = data?.categoryRevenue || [];

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--text3)] mb-2">
            <span>Admin</span><span>/</span>
            <span className="text-[var(--text2)] font-medium">Analytics</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Analytics</h1>
          <p className="text-[var(--text2)] text-sm mt-1">Live database performance & business insights.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
            className="bg-dark-surface2 border border-dark-border rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text)] outline-none"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
            <option value={2024}>2024</option>
          </select>
          
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-dark-surface2 border border-dark-border hover:border-brand-500/40 rounded-xl text-xs font-semibold text-[var(--text)] flex items-center gap-1.5 transition-colors"
          >
            <Download size={14} /> CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-dark-surface2 border border-dark-border hover:border-brand-500/40 rounded-xl text-xs font-semibold text-[var(--text)] flex items-center gap-1.5 transition-colors"
          >
            <Download size={14} /> Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download size={14} /> PDF Report
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="bg-dark-surface1 border border-dark-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[var(--text3)] uppercase tracking-wider font-medium">{kpi.label}</p>
              <span className="text-lg">{kpi.icon}</span>
            </div>
            <p className="text-2xl font-bold tracking-tight mb-1 text-[var(--text)]">{kpi.value}</p>
            <p className="text-xs text-[var(--text3)] font-medium">{kpi.change}</p>
          </div>
        ))}
      </div>

      {/* Revenue Area Chart */}
      <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-sm text-[var(--text)]">Monthly Revenue ({selectedYear})</h3>
            <p className="text-xs text-[var(--text3)] mt-0.5">Real revenue generated from completed order transactions</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyList}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e2e8f0)" />
            <XAxis dataKey="month" tick={{ fill: 'var(--text3, #94a3b8)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `₹${formatCompact(v)}`} tick={{ fill: 'var(--text3, #94a3b8)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => [formatCurrency(v), 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Orders Bar Chart */}
        <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-sm mb-1 text-[var(--text)]">Monthly Orders</h3>
          <p className="text-xs text-[var(--text3)] mb-5">Order volume over time</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyList} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e2e8f0)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text3, #94a3b8)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text3, #94a3b8)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [v, 'Orders']} />
              <Bar dataKey="orders" fill="url(#barGrad2)" radius={[4,4,0,0]} />
              <defs>
                <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="rgba(168,85,247,0.2)" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Revenue Distribution */}
        <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-sm mb-1 text-[var(--text)]">Revenue by Category</h3>
          <p className="text-xs text-[var(--text3)] mb-4">Category breakdown</p>
          {categoryRev.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text3)]">No category sales data recorded yet.</div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="45%" height={160}>
                <PieChart>
                  <Pie data={categoryRev} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="revenue">
                    {categoryRev.map((entry, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(v), 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                {categoryRev.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                    <span className="flex-1 text-[var(--text2)] truncate">{c.name}</span>
                    <span className="font-bold text-[var(--text)]">{formatCurrency(c.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Selling Products */}
        <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-sm mb-4 text-[var(--text)]">Top Selling Products</h3>
          {topProducts.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text3)]">No product sales yet.</div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    i === 0 ? 'bg-amber-400 text-black' :
                    i === 1 ? 'bg-gray-300 text-black' :
                    i === 2 ? 'bg-orange-500 text-white' :
                    'bg-dark-surface2 text-[var(--text3)]'
                  }`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate mb-0.5 text-[var(--text)]">{p.name}</p>
                    <p className="text-[10px] text-[var(--text3)]">{p.unitsSold} units sold</p>
                  </div>
                  <span className="text-xs font-bold text-brand-500 shrink-0">{formatCurrency(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Customers */}
        <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-sm mb-4 text-[var(--text)]">Top Customers by Spend</h3>
          {topCustomers.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text3)]">No customer data yet.</div>
          ) : (
            <div className="space-y-4">
              {topCustomers.map((c, i) => (
                <div key={c.email} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center text-xs font-bold shrink-0">
                    {c.name ? c.name.charAt(0) : 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate text-[var(--text)]">{c.name}</p>
                    <p className="text-[10px] text-[var(--text3)]">{c.email} • {c.orders} orders</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 shrink-0">{formatCurrency(c.totalSpent)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
