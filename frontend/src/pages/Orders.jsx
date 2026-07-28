import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyOrders, selectOrders, selectOrdersLoading } from '@store/slices/orderSlice';
import Badge from '@components/common/Badge.jsx';
import Skeleton from '@components/common/Skeleton.jsx';
import { formatCurrency, formatDate, getStatusConfig } from '@utils/formatters';
import { ORDER_STATUSES } from '@utils/constants';

// Fallback mock data when API is not available
const MOCK_ORDERS = [
  { id: 8472, orderNumber: 'ORD-8472', status: 'DELIVERED', totalAmount: 12999, createdAt: '2024-01-15', items: [{ productName: 'Pro Wireless Headphones' }] },
  { id: 8471, orderNumber: 'ORD-8471', status: 'SHIPPED',   totalAmount: 32999, createdAt: '2024-01-14', items: [{ productName: 'Ergonomic Office Chair' }] },
  { id: 8470, orderNumber: 'ORD-8470', status: 'PROCESSING',totalAmount: 21998, createdAt: '2024-01-14', items: [{ productName: 'Gaming Keyboard' },{ productName: 'Desk Lamp' }] },
  { id: 8469, orderNumber: 'ORD-8469', status: 'DELIVERED', totalAmount:  4998, createdAt: '2024-01-13', items: [{ productName: 'Yoga Mat + Bottle' }] },
  { id: 8468, orderNumber: 'ORD-8468', status: 'CANCELLED', totalAmount: 18499, createdAt: '2024-01-12', items: [{ productName: 'Smart Coffee Maker' }] },
];


export default function Orders() {
  const dispatch   = useDispatch();
  const orders     = useSelector(selectOrders);
  const isLoading  = useSelector(selectOrdersLoading);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    dispatch(fetchMyOrders({ page: 0, size: 20 }));
  }, [dispatch]);

  // Use mock data if API returns nothing
  const displayOrders = (orders.length > 0 ? orders : MOCK_ORDERS)
    .filter(o => filter === 'ALL' || o.status === filter);

  return (
    <div className="page-enter">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">My Orders</h1>
        <p className="text-gray-500 text-sm mt-1">Track and manage your purchases</p>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['ALL', ...ORDER_STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filter === s
                ? 'bg-brand-500/10 border-brand-500/30 text-brand-500 shadow-xs'
                : 'bg-dark-surface2 border-dark-border text-gray-500 hover:border-brand-500/30 hover:text-[var(--text)]'
            }`}>
            {s === 'ALL' ? 'All Orders' : getStatusConfig(s).icon + ' ' + getStatusConfig(s).label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton variant="table" rows={5} cols={5} />
      ) : displayOrders.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-semibold mb-2 text-[var(--text)]">No orders found</h3>
          <p className="text-gray-500 text-sm mb-6">You haven't placed any orders yet.</p>
          <Link to="/products" className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm transition-all shadow-sm shadow-brand-500/10">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="bg-dark-surface2 border border-dark-border rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Order ID', 'Product', 'Date', 'Amount', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-bold text-gray-400 uppercase tracking-widest px-5 py-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayOrders.map(order => {
                  const sc = getStatusConfig(order.status);
                  const productName = order.items?.[0]?.productName || 'Product';
                  const extraItems  = (order.items?.length || 1) - 1;
                  return (
                    <tr key={order.id} className="border-b border-dark-border/40 last:border-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-bold text-brand-500 text-sm">
                          {order.orderNumber || `ORD-${order.id}`}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-[var(--text)] font-semibold">{productName}</p>
                        {extraItems > 0 && (
                          <p className="text-xs text-gray-400 font-medium">+{extraItems} more item{extraItems > 1 ? 's' : ''}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500 font-medium">{formatDate(order.createdAt)}</td>
                      <td className="px-5 py-4">
                        <span className="font-extrabold text-sm text-[var(--text)]">{formatCurrency(order.totalAmount)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={sc.color} dot>{sc.icon} {sc.label}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <Link to={`/orders/${order.id}/tracking`}
                            className="text-xs font-bold px-3.5 py-1.5 bg-dark-surface3 hover:bg-black/5 dark:hover:bg-white/5 border border-dark-border text-[var(--text2)] rounded-xl transition-all">
                            Track
                          </Link>
                          {order.status === 'DELIVERED' && (
                            <button className="text-xs font-bold px-3.5 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 text-brand-500 rounded-xl transition-all">
                              Review
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
