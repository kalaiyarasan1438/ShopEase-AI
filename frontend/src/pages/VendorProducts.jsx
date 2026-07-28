import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Search, RefreshCw, Edit2, Trash2, Plus, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@services/api';
import { formatCurrency, formatDate } from '@utils/formatters';
import Badge from '@components/common/Badge.jsx';

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [editProduct, setEditProduct] = useState(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ size: 100, page: 0 });
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await api.get(`/api/vendor/products?${params}`);
      setProducts(res.data.content || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeleting(product.id);
    try {
      await api.delete(`/api/vendor/products/${product.id}`);
      setProducts(prev => prev.filter(p => p.id !== product.id));
      toast.success('Product removed successfully');
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--text3)] mb-2">
            <span>Vendor</span><span>/</span>
            <span className="text-[var(--text2)] font-medium">My Products</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] flex items-center gap-3">
            <Package className="text-brand-500" size={24} /> My Products
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchProducts} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-dark-surface2 border border-dark-border rounded-xl text-sm text-[var(--text2)] hover:text-[var(--text)] transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <Link to="/vendor/add-product"
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-brand-500/20">
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search your products…"
          className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors" />
      </div>

      {/* Table */}
      <div className="bg-dark-surface1 border border-dark-border rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border bg-dark-surface2">
          <h3 className="font-semibold text-sm text-[var(--text)]">Products ({products.length})</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-[var(--text3)]">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-4">No products yet.</p>
            <Link to="/vendor/add-product" className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-colors">
              Add Your First Product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Product', 'Category', 'Price', 'Stock', 'Rating', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[var(--text3)] uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, idx) => (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                    className="border-b border-dark-border last:border-none hover:bg-dark-surface2 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img src={p.imageUrl || 'https://via.placeholder.com/40'} alt={p.name}
                          className="w-10 h-10 rounded-lg bg-dark-surface3 object-cover flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-sm text-[var(--text)] max-w-[200px] truncate">{p.name}</div>
                          {p.badge && <span className="text-[10px] px-1.5 py-0.5 bg-brand-500/10 text-brand-500 rounded font-medium">{p.badge}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[var(--text2)]">{p.categoryName || '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-sm text-[var(--text)]">{formatCurrency(p.price)}</div>
                      {p.oldPrice && <div className="text-xs text-[var(--text3)] line-through">{formatCurrency(p.oldPrice)}</div>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        p.stockQty === 0 ? 'bg-red-500/10 text-red-400' :
                        p.stockQty < 10 ? 'bg-amber-500/10 text-amber-400' :
                        'bg-green-500/10 text-green-400'
                      }`}>
                        {p.stockQty === 0 ? 'Out of Stock' : `${p.stockQty} units`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[var(--text2)]">
                      {p.ratingCount > 0 ? `${p.ratingAvg?.toFixed(1)} ★ (${p.ratingCount})` : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditProduct(p)}
                          className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-colors"
                          title="Edit">
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={deleting === p.id}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors disabled:opacity-40"
                          title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editProduct && (
        <EditProductModal product={editProduct} onClose={() => setEditProduct(null)} onSaved={(updated) => {
          setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
          setEditProduct(null);
          toast.success('Product updated!');
        }} />
      )}
    </div>
  );
}

function EditProductModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: product.name || '',
    description: product.description || '',
    price: product.price || '',
    oldPrice: product.oldPrice || '',
    stockQty: product.stockQty || 0,
    categoryId: product.categoryId || '',
    badge: product.badge || '',
    imageUrl: product.imageUrl || '',
  });
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/api/categories').then(res => setCategories(res.data || [])).catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put(`/api/vendor/products/${product.id}`, {
        ...form,
        price: Number(form.price),
        oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
        stockQty: Number(form.stockQty),
        categoryId: Number(form.categoryId),
      });
      onSaved(res.data);
    } catch {
      toast.error('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-dark-surface1 border border-dark-border rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between bg-dark-surface2">
          <h2 className="text-lg font-bold text-[var(--text)]">Edit Product</h2>
          <button onClick={onClose} className="text-[var(--text3)] hover:text-[var(--text)] text-xl">×</button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          <div>
            <label className="block text-xs font-bold text-[var(--text3)] uppercase mb-1">Name *</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text3)] uppercase mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text3)] uppercase mb-1">Price *</label>
              <input required type="number" min="0.01" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text3)] uppercase mb-1">Old Price</label>
              <input type="number" min="0" step="0.01" value={form.oldPrice} onChange={e => setForm(f => ({ ...f, oldPrice: e.target.value }))}
                className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text3)] uppercase mb-1">Stock *</label>
              <input required type="number" min="0" value={form.stockQty} onChange={e => setForm(f => ({ ...f, stockQty: e.target.value }))}
                className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text3)] uppercase mb-1">Category *</label>
              <select required value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60">
                <option value="">Select...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text3)] uppercase mb-1">Image URL</label>
            <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-dark-surface2 border border-dark-border rounded-xl text-sm text-[var(--text)] hover:bg-dark-surface3 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
