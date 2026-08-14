import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, RefreshCw, Eye, Edit2, EyeOff, Trash2, CheckSquare, Square, X, AlertTriangle, Layers, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@services/api';
import { formatCurrency, formatDate } from '@utils/formatters';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, HIDDEN
  
  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [viewProduct, setViewProduct] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [bulkStockModal, setBulkStockModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // { message, onConfirm }
  const [bulkStockVal, setBulkStockVal] = useState(10);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: '',
    stockQty: '',
    categoryId: '',
    imageUrl: '',
    badge: ''
  });

  const fetchProducts = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get('/api/admin/products?size=100');
      // Fix field name mapping: backend returns stockQty, frontend uses stockQuantity/stockQty
      const list = (res.data.content || []).map(p => ({
        ...p,
        stockQuantity: p.stockQty !== undefined ? p.stockQty : p.stockQuantity,
        averageRating: p.ratingAvg !== undefined ? p.ratingAvg : p.averageRating
      }));
      setProducts(list);
    } catch (err) {
      if (!isSilent) toast.error('Failed to load products');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/api/categories');
      setCategories(res.data || []);
    } catch (err) {
      // fallback
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  // 5-second polling timer
  useEffect(() => {
    const timer = setInterval(() => {
      fetchProducts(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [fetchProducts]);

  // Filter products
  const filtered = products.filter(p => {
    const term = search.toLowerCase();
    const matchesSearch = !search || 
      p.name?.toLowerCase().includes(term) ||
      p.vendorName?.toLowerCase().includes(term) ||
      p.categoryName?.toLowerCase().includes(term);

    const isHidden = p.isActive === false;
    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && !isHidden) ||
      (statusFilter === 'HIDDEN' && isHidden);

    return matchesSearch && matchesStatus;
  });

  // Checkbox Selection
  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(p => p.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Actions
  const handleToggleHide = async (p) => {
    const isHidden = p.isActive === false;
    const endpoint = `/api/admin/products/${p.id}/${isHidden ? 'unhide' : 'hide'}`;
    try {
      const res = await api.patch(endpoint);
      setProducts(prev => prev.map(item => item.id === p.id ? { ...item, isActive: res.data.isActive } : item));
      toast.success(`Product "${p.name}" is now ${isHidden ? 'Visible' : 'Hidden'}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDeleteOne = async () => {
    if (!deleteProduct) return;
    try {
      await api.delete(`/api/admin/products/${deleteProduct.id}`);
      setProducts(prev => prev.filter(p => p.id !== deleteProduct.id));
      setSelectedIds(prev => prev.filter(id => id !== deleteProduct.id));
      toast.success(`Product deleted!`);
      setDeleteProduct(null);
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const openEditModal = (p) => {
    setEditProduct(p);
    setEditForm({
      name: p.name || '',
      description: p.description || '',
      price: p.price || 0,
      stockQty: p.stockQuantity || 0,
      categoryId: p.categoryId || '',
      imageUrl: p.imageUrl || '',
      badge: p.badge || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editProduct) return;
    try {
      const payload = {
        ...editForm,
        price: parseFloat(editForm.price),
        stockQty: parseInt(editForm.stockQty, 10),
        categoryId: editForm.categoryId ? parseInt(editForm.categoryId, 10) : null
      };
      const res = await api.put(`/api/admin/products/${editProduct.id}`, payload);
      setProducts(prev => prev.map(item => item.id === editProduct.id ? {
        ...item,
        name: res.data.name,
        description: res.data.description,
        price: res.data.price,
        stockQuantity: res.data.stockQty !== undefined ? res.data.stockQty : res.data.stockQuantity,
        imageUrl: res.data.imageUrl,
        badge: res.data.badge,
        categoryName: res.data.categoryName
      } : item));
      toast.success('Product updated successfully! ✨');
      setEditProduct(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update product');
    }
  };

  // Bulk Actions
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmModal({
      message: `Delete ${selectedIds.length} selected product${selectedIds.length !== 1 ? 's' : ''}? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await api.post('/api/admin/products/bulk-delete', { ids: selectedIds });
          setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
          toast.success(`${selectedIds.length} products deleted!`);
          setSelectedIds([]);
        } catch (err) {
          toast.error('Bulk delete failed');
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  const handleBulkHide = async () => {
    if (selectedIds.length === 0) return;
    try {
      await api.post('/api/admin/products/bulk-hide', { ids: selectedIds });
      setProducts(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, isActive: false } : p));
      toast.success(`${selectedIds.length} products hidden!`);
      setSelectedIds([]);
    } catch (err) {
      toast.error('Bulk hide failed');
    }
  };

  const handleBulkStockSubmit = async () => {
    if (selectedIds.length === 0) return;
    try {
      await api.post('/api/admin/products/bulk-stock', { ids: selectedIds, stockQty: parseInt(bulkStockVal, 10) });
      setProducts(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, stockQuantity: parseInt(bulkStockVal, 10) } : p));
      toast.success(`Stock updated to ${bulkStockVal} for ${selectedIds.length} products!`);
      setSelectedIds([]);
      setBulkStockModal(false);
    } catch (err) {
      toast.error('Bulk stock update failed');
    }
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--text3)] mb-2">
            <span>Admin</span><span>/</span>
            <span className="text-[var(--text2)] font-medium">Product Management</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] flex items-center gap-3">
            <Package className="text-brand-500" size={24} />
            Products
          </h1>
          <p className="text-[var(--text2)] text-sm mt-1">Manage, edit, hide, or update stock for platform inventory.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchProducts(false)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-dark-surface2 border border-dark-border rounded-xl text-sm text-[var(--text2)] hover:text-[var(--text)] hover:border-dark-border2 transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-500/10 border border-brand-500/30 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-500">
            <CheckSquare size={18} />
            <span>{selectedIds.length} Product{selectedIds.length > 1 ? 's' : ''} Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkHide}
              className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 font-medium rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <EyeOff size={14} /> Bulk Hide
            </button>
            <button
              onClick={() => setBulkStockModal(true)}
              className="px-3.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 font-medium rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <Layers size={14} /> Bulk Stock Update
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-medium rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <Trash2 size={14} /> Bulk Delete
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Search & Status Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products, vendors, or categories…"
            className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center bg-dark-surface2 border border-dark-border rounded-xl p-1 text-xs">
          {['ALL', 'ACTIVE', 'HIDDEN'].map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === tab
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'text-[var(--text2)] hover:text-[var(--text)]'
              }`}
            >
              {tab === 'ALL' ? 'All Products' : tab === 'ACTIVE' ? 'Active' : 'Hidden'}
            </button>
          ))}
        </div>

        <button
          onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
          className="text-xs text-[var(--text3)] hover:text-[var(--text)] transition-colors"
        >
          Clear filters
        </button>
      </div>

      {/* Products Table */}
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
            <p className="text-sm">No products found matching filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="px-5 py-3 w-10">
                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white transition-colors">
                      {selectedIds.length === filtered.length && filtered.length > 0 ? (
                        <CheckSquare size={16} className="text-brand-500" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>
                  {['Product', 'Vendor', 'Category', 'Price', 'Stock', 'Visibility', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[var(--text3)] uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => {
                  const isSelected = selectedIds.includes(p.id);
                  const isHidden = p.isActive === false;
                  const stock = p.stockQuantity !== undefined ? p.stockQuantity : p.stockQty || 0;

                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.015 }}
                      className={`border-b border-dark-border last:border-none transition-colors ${
                        isSelected ? 'bg-brand-500/5' : 'hover:bg-dark-surface2'
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <button onClick={() => toggleSelectOne(p.id)} className="text-gray-400 hover:text-white transition-colors">
                          {isSelected ? <CheckSquare size={16} className="text-brand-500" /> : <Square size={16} />}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 flex items-center gap-3">
                        <img src={p.imageUrl || '/placeholder.png'} alt={p.name} className="w-10 h-10 rounded bg-dark-surface3 object-cover border border-dark-border" />
                        <div>
                          <div className="font-semibold text-sm text-[var(--text)] max-w-[200px] truncate">{p.name}</div>
                          {p.badge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 border border-brand-500/20">
                              {p.badge}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[var(--text2)] max-w-[140px] truncate">{p.vendorName || 'Platform'}</td>
                      <td className="px-5 py-3.5 text-sm text-[var(--text2)]">{p.categoryName || 'General'}</td>
                      <td className="px-5 py-3.5 font-bold text-sm text-[var(--text)]">{formatCurrency(p.price)}</td>
                      <td className="px-5 py-3.5 text-sm">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${
                          stock > 5
                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                            : stock > 0
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                          {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          isHidden
                            ? 'bg-gray-500/10 border-gray-500/30 text-gray-400'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        }`}>
                          {isHidden ? '🙈 Hidden' : '👁️ Visible'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {/* View details */}
                          <button
                            onClick={() => setViewProduct(p)}
                            title="View Details"
                            className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                          {/* Edit product */}
                          <button
                            onClick={() => openEditModal(p)}
                            title="Edit Product"
                            className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-500/10 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          {/* Toggle hide/unhide */}
                          <button
                            onClick={() => handleToggleHide(p)}
                            title={isHidden ? 'Unhide Product' : 'Hide Product'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isHidden ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-amber-400 hover:bg-amber-500/10'
                            }`}
                          >
                            <EyeOff size={16} />
                          </button>
                          {/* Delete product */}
                          <button
                            onClick={() => setDeleteProduct(p)}
                            title="Delete Product"
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={16} />
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

      {/* View Details Modal */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--text)]">Product Details</h2>
              <button onClick={() => setViewProduct(null)} className="p-1 text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4 items-start border-b border-dark-border pb-4">
                <img src={viewProduct.imageUrl || '/placeholder.png'} alt={viewProduct.name} className="w-24 h-24 rounded-lg bg-dark-surface3 object-cover border border-dark-border" />
                <div>
                  <div className="text-lg font-semibold text-[var(--text)]">{viewProduct.name}</div>
                  <div className="text-sm text-[var(--text2)] mb-1">Vendor: {viewProduct.vendorName || 'Platform'}</div>
                  <div className="font-bold text-brand-500 text-lg">{formatCurrency(viewProduct.price)}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Description</div>
                <div className="text-sm text-[var(--text2)] leading-relaxed">{viewProduct.description || 'No description provided.'}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Category</div>
                  <div className="text-sm font-medium text-[var(--text)]">{viewProduct.categoryName || 'General'}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Stock</div>
                  <div className="text-sm font-medium text-[var(--text)]">{viewProduct.stockQuantity !== undefined ? viewProduct.stockQuantity : viewProduct.stockQty} units</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Added On</div>
                  <div className="text-sm text-[var(--text2)]">
                    {viewProduct.createdAt ? formatDate(viewProduct.createdAt) : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Visibility Status</div>
                  <div className="text-sm font-medium text-[var(--text)]">
                    {viewProduct.isActive === false ? '🙈 Hidden' : '👁️ Visible'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setViewProduct(null)}
                className="px-4 py-2 bg-dark-surface2 border border-dark-border rounded-xl text-sm font-medium text-[var(--text)] hover:bg-dark-surface3 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--text)]">Edit Product</h2>
              <button onClick={() => setEditProduct(null)} className="p-1 text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text3)] mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text3)] mb-1">Description</label>
                <textarea
                  rows="3"
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2 text-sm text-[var(--text)] outline-none focus:border-brand-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text3)] mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editForm.price}
                    onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text3)] mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={editForm.stockQty}
                    onChange={e => setEditForm({ ...editForm, stockQty: e.target.value })}
                    className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text3)] mb-1">Category</label>
                  <select
                    value={editForm.categoryId}
                    onChange={e => setEditForm({ ...editForm, categoryId: e.target.value })}
                    className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text3)] mb-1">Badge (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Best Seller"
                    value={editForm.badge}
                    onChange={e => setEditForm({ ...editForm, badge: e.target.value })}
                    className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text3)] mb-1">Image URL</label>
                <input
                  type="text"
                  value={editForm.imageUrl}
                  onChange={e => setEditForm({ ...editForm, imageUrl: e.target.value })}
                  className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditProduct(null)}
                  className="px-4 py-2 bg-dark-surface2 border border-dark-border rounded-xl text-sm font-medium text-[var(--text)] hover:bg-dark-surface3 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl text-sm transition-colors shadow-sm shadow-brand-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Single Delete Confirmation Modal */}
      {deleteProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 w-full max-w-md shadow-xl text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-[var(--text)] mb-2">Delete Product?</h3>
            <p className="text-sm text-[var(--text2)] mb-6">
              Are you sure you want to delete <span className="font-semibold text-[var(--text)]">"{deleteProduct.name}"</span>? This action will permanently remove it from the database.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteProduct(null)}
                className="px-4 py-2 bg-dark-surface2 border border-dark-border rounded-xl text-sm font-medium text-[var(--text)] hover:bg-dark-surface3 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOne}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl text-sm transition-colors shadow-sm shadow-red-500/20"
              >
                Yes, Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bulk Stock Modal */}
      {bulkStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 w-full max-w-sm shadow-xl"
          >
            <h3 className="text-lg font-bold text-[var(--text)] mb-4">Update Stock for {selectedIds.length} Products</h3>
            <div className="mb-6">
              <label className="block text-xs font-medium text-[var(--text3)] mb-1">New Stock Quantity</label>
              <input
                type="number"
                min="0"
                value={bulkStockVal}
                onChange={e => setBulkStockVal(e.target.value)}
                className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setBulkStockModal(false)}
                className="px-4 py-2 bg-dark-surface2 border border-dark-border rounded-xl text-sm font-medium text-[var(--text)] hover:bg-dark-surface3 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkStockSubmit}
                className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl text-sm transition-colors"
              >
                Apply Stock
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-2xl w-full max-w-sm">
            <div className="flex items-start gap-3 mb-5">
              <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--text)]">{confirmModal.message}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-dark-surface2 border border-dark-border rounded-xl text-sm font-medium text-[var(--text)] hover:bg-dark-surface3 transition-colors">
                Cancel
              </button>
              <button onClick={confirmModal.onConfirm}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl text-sm transition-colors">
                Confirm Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
