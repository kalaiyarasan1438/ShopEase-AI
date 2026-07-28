import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatCompact } from '@utils/formatters';

const MONTHLY = [
  { month: 'Jan', revenue: 3570000, orders: 312 },
  { month: 'Feb', revenue: 3230000, orders: 284 },
  { month: 'Mar', revenue: 4675000, orders: 421 },
  { month: 'Apr', revenue: 5185000, orders: 468 },
  { month: 'May', revenue: 4080000, orders: 356 },
  { month: 'Jun', revenue: 6120000, orders: 542 },
  { month: 'Jul', revenue: 5780000, orders: 511 },
  { month: 'Aug', revenue: 6970000, orders: 618 },
  { month: 'Sep', revenue: 6375000, orders: 563 },
  { month: 'Oct', revenue: 7650000, orders: 672 },
  { month: 'Nov', revenue: 7225000, orders: 638 },
  { month: 'Dec', revenue: 8075000, orders: 714 },
];

const TOP_PRODUCTS = [
  { name: 'Pro Wireless Headphones', revenue: 4143750, units: 325, emoji: '🎧' },
  { name: 'Ergonomic Office Chair',  revenue: 3037080, units: 92,  emoji: '🪑' },
  { name: 'Smart Coffee Maker',      revenue: 2479866, units: 134, emoji: '☕' },
  { name: 'Yoga Mat Premium',        revenue: 1616715, units: 317, emoji: '🧘' },
  { name: 'LED Desk Lamp',           revenue: 1169820, units: 180, emoji: '💡' },
];

const tooltipStyle = {
  backgroundColor: 'var(--bg1, #ffffff)',
  border: '1px solid var(--border, #e2e8f0)',
  borderRadius: 10,
  fontSize: 12,
  color: 'var(--text, #0f172a)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

const KPIS = [
  { label: 'Avg Order Value',  value: '₹3,732', change: '+8%',   up: true },
  { label: 'Conversion Rate',  value: '3.24%',  change: '+0.5%', up: true },
  { label: 'Return Rate',      value: '2.1%',   change: '-0.3%', up: true },
  { label: 'Customer LTV',     value: '₹24,140', change: '+15%',  up: true },
];

export default function Analytics() {
  return (
    <div className="space-y-6 page-enter">
      <div>
        <div className="flex items-center gap-2 text-xs text-[var(--text3)] mb-2">
          <span>Admin</span><span>/</span>
          <span className="text-[var(--text2)] font-medium">Analytics</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Analytics</h1>
        <p className="text-[var(--text2)] text-sm mt-1">Sales performance & business insights</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="bg-dark-surface1 border border-dark-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs text-[var(--text3)] uppercase tracking-wider mb-2">{kpi.label}</p>
            <p className="text-2xl font-bold tracking-tight mb-1 text-[var(--text)]">{kpi.value}</p>
            <p className="text-xs text-green-600">▲ {kpi.change} vs last period</p>
          </div>
        ))}
      </div>

      {/* Revenue Area Chart */}
      <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-sm text-[var(--text)]">Revenue & Orders (2024)</h3>
            <p className="text-xs text-[var(--text3)] mt-0.5">Monthly performance overview</p>
          </div>
          <select className="bg-dark-surface2 border border-dark-border rounded-lg px-3 py-1.5 text-xs text-[var(--text2)] outline-none">
            <option>2024</option><option>2023</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={MONTHLY}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e2e8f0)" />
            <XAxis dataKey="month" tick={{ fill: 'var(--text3, #94a3b8)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `₹${(v/100000).toFixed(1)}L`} tick={{ fill: 'var(--text3, #94a3b8)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => [formatCurrency(v), 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Orders Bar */}
        <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-sm mb-5 text-[var(--text)]">Monthly Orders</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MONTHLY} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e2e8f0)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text3, #94a3b8)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text3, #94a3b8)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [v, 'Orders']} />
              <Bar dataKey="orders" fill="url(#barGrad2)" radius={[4,4,0,0]} />
              <defs>
                <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#a855f7" />
                  <stop offset="100%" stopColor="rgba(168,85,247,0.2)" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-sm mb-5 text-[var(--text)]">Top Performing Products</h3>
          <div className="space-y-4">
            {TOP_PRODUCTS.map((p, i) => {
              const pct = Math.round((p.revenue / TOP_PRODUCTS[0].revenue) * 100);
              return (
                <div key={p.name} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-amber-400 text-black' :
                    i === 1 ? 'bg-gray-300 text-black' :
                    i === 2 ? 'bg-orange-500 text-white' :
                    'bg-dark-surface2 text-[var(--text3)]'
                  }`}>{i+1}</div>
                  <span className="text-base">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate mb-1 text-[var(--text)]">{p.name}</p>
                    <div className="h-1.5 bg-dark-surface3 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-500 to-purple-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[var(--text2)] flex-shrink-0">{formatCompact(p.revenue)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Regional */}
      <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-sm mb-5 text-[var(--text)]">Sales by Region</h3>
        <div className="space-y-4">
          {[
            ['🇺🇸', 'North America', 45],
            ['🇪🇺', 'Europe',        28],
            ['🌏', 'Asia Pacific',   18],
            ['🌍', 'Rest of World',   9],
          ].map(([flag, region, pct]) => (
            <div key={region} className="flex items-center gap-4">
              <span className="text-lg w-7 text-center">{flag}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-[var(--text)]">{region}</span>
                  <span className="text-sm font-bold text-[var(--text)]">{pct}%</span>
                </div>
                <div className="h-2 bg-dark-surface3 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-500 to-purple-600 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
