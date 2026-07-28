import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, RefreshCw, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@services/api';
import { formatCurrency, formatDate } from '@utils/formatters';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/products?size=100');
      setProducts(res.data.content || []);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = products.filter(p => {
    const term = search.toLowerCase();
    return !search || 
      p.name?.toLowerCase().includes(term) ||
      p.vendorName?.toLowerCase().includes(term) ||
      p.categoryName?.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--text3)] mb-2">
            <span>Admin</span><span>/</span>
            <span className="text-[var(--text2)] font-medium">Product Management</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] flex items-center gap-3">
            <Package className="text-brand-500" size={24} />
            Products
          </h1>
          <p className="text-[var(--text2)] text-sm mt-1">View all products across the platform.</p>
        </div>
        <button
          onClick={fetchProducts}
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
            placeholder="Search products, vendors, or categories…"
            className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors"
          />
        </div>
        <button
          onClick={() => setSearch('')}
          className="text-xs text-[var(--text3)] hover:text-[var(--text)] transition-colors"
        >
          Clear filters
        </button>
      </div>

      {/* Table */}
      <div className="bg-dark-surface1 border border-dark-border rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border bg-dark-surface2">
          <h3 className="font-semibold text-sm text-[var(--text)]">
            All Products ({filtered.length})
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[var(--text3)]">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No products found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Product', 'Vendor', 'Category', 'Price', 'Stock', 'Added', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[var(--text3)] uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-b border-dark-border last:border-none hover:bg-dark-surface2 transition-colors"
                  >
                    <td className="px-5 py-3.5 flex items-center gap-3">
                      <img src={p.imageUrl || '/placeholder.png'} alt={p.name} className="w-10 h-10 rounded bg-dark-surface3 object-cover" />
                      <div className="font-semibold text-sm text-[var(--text)] max-w-[200px] truncate">{p.name}</div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[var(--text2)] max-w-[150px] truncate">{p.vendorName || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-[var(--text2)]">{p.categoryName || '—'}</td>
                    <td className="px-5 py-3.5 font-bold text-sm text-[var(--text)]">{formatCurrency(p.price)}</td>
                    <td className="px-5 py-3.5 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${p.stockQuantity > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {p.stockQuantity > 0 ? `${p.stockQuantity} in stock` : 'Out of stock'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[var(--text3)] whitespace-nowrap">
                      {p.createdAt ? formatDate(p.createdAt) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setSelectedProduct(p)}
                        title="View Details"
                        className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--text)]">Product Details</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4 items-start border-b border-dark-border pb-4">
                <img src={selectedProduct.imageUrl || '/placeholder.png'} alt={selectedProduct.name} className="w-24 h-24 rounded-lg bg-dark-surface3 object-cover" />
                <div>
                  <div className="text-lg font-semibold text-[var(--text)]">{selectedProduct.name}</div>
                  <div className="text-sm text-[var(--text2)] mb-1">by {selectedProduct.vendorName}</div>
                  <div className="font-bold text-brand-500 text-lg">{formatCurrency(selectedProduct.price)}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Description</div>
                <div className="text-sm text-[var(--text2)] leading-relaxed">{selectedProduct.description || 'No description provided.'}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Category</div>
                  <div className="text-sm font-medium text-[var(--text)]">{selectedProduct.categoryName}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Stock</div>
                  <div className="text-sm font-medium text-[var(--text)]">{selectedProduct.stockQuantity} units</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Added On</div>
                  <div className="text-sm text-[var(--text2)]">
                    {selectedProduct.createdAt ? formatDate(selectedProduct.createdAt) : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Rating</div>
                  <div className="text-sm font-medium text-[var(--text)]">
                    {selectedProduct.ratingCount > 0 ? `${selectedProduct.averageRating.toFixed(1)} ⭐ (${selectedProduct.ratingCount} reviews)` : 'No ratings yet'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setSelectedProduct(null)}
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
