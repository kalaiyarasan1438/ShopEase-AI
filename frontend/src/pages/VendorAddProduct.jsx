import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@services/api';

export default function VendorAddProduct() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', price: '', oldPrice: '',
    stockQty: '', categoryId: '', badge: '', imageUrl: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.get('/api/categories').then(res => setCategories(res.data || [])).catch(() => {});
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.price || Number(form.price) <= 0) errs.price = 'Valid price required';
    if (form.stockQty === '' || Number(form.stockQty) < 0) errs.stockQty = 'Stock quantity required';
    if (!form.categoryId) errs.categoryId = 'Category is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      await api.post('/api/vendor/products', {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
        stockQty: Number(form.stockQty),
        categoryId: Number(form.categoryId),
        badge: form.badge.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
      });
      toast.success('Product created successfully!');
      navigate('/vendor/products');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-bold text-[var(--text3)] uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(e2 => ({ ...e2, [key]: '' })); }}
        placeholder={placeholder}
        className={`w-full bg-dark-surface2 border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60 focus:ring-4 focus:ring-brand-500/10 transition-all ${errors[key] ? 'border-red-500' : 'border-dark-border'}`}
      />
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="page-enter max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-[var(--text3)] mb-2">
          <span>Vendor</span><span>/</span>
          <span>Products</span><span>/</span>
          <span className="text-[var(--text2)] font-medium">Add Product</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/vendor/products')}
            className="p-2 rounded-xl border border-dark-border text-[var(--text3)] hover:text-[var(--text)] hover:bg-dark-surface2 transition-all">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] flex items-center gap-2">
            <Plus className="text-brand-500" size={24} /> Add New Product
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Main Details */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-sm text-[var(--text)] mb-4">Product Information</h2>
            <div className="space-y-4">
              {field('Product Name *', 'name', 'text', 'e.g., Pro Wireless Headphones')}
              <div>
                <label className="block text-xs font-bold text-[var(--text3)] uppercase tracking-wider mb-1.5">Description</label>
                <textarea rows={4} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe your product in detail..."
                  className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60 focus:ring-4 focus:ring-brand-500/10 transition-all resize-none" />
              </div>
            </div>
          </div>

          <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-sm text-[var(--text)] mb-4">Pricing & Stock</h2>
            <div className="grid grid-cols-2 gap-4">
              {field('Selling Price (₹) *', 'price', 'number', '0.00')}
              {field('Original Price (₹)', 'oldPrice', 'number', '0.00')}
              {field('Stock Quantity *', 'stockQty', 'number', '0')}
              <div>
                <label className="block text-xs font-bold text-[var(--text3)] uppercase tracking-wider mb-1.5">Badge Label</label>
                <select value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                  className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60 transition-all">
                  <option value="">None</option>
                  <option value="Best Seller">Best Seller</option>
                  <option value="New">New</option>
                  <option value="Hot Deal">Hot Deal</option>
                  <option value="Limited">Limited</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Category & Image */}
        <div className="space-y-5">
          <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-sm text-[var(--text)] mb-4">Organization</h2>
            <div>
              <label className="block text-xs font-bold text-[var(--text3)] uppercase tracking-wider mb-1.5">Category *</label>
              <select value={form.categoryId}
                onChange={e => { setForm(f => ({ ...f, categoryId: e.target.value })); setErrors(errs => ({ ...errs, categoryId: '' })); }}
                className={`w-full bg-dark-surface2 border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60 transition-all ${errors.categoryId ? 'border-red-500' : 'border-dark-border'}`}>
                <option value="">Select a category…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
            </div>
          </div>

          <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-sm text-[var(--text)] mb-4">Product Image</h2>
            
            {/* File Upload Option */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-[var(--text3)] uppercase tracking-wider mb-1.5">Upload Image File (&lt; 2MB)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (!file.type.startsWith('image/')) {
                    toast.error('Only image files (JPEG, PNG, WEBP, GIF) are allowed.');
                    return;
                  }
                  if (file.size > 2 * 1024 * 1024) {
                    toast.error('File size exceeds maximum limit of 2MB.');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setForm(f => ({ ...f, imageUrl: event.target.result }));
                    toast.success('Image loaded for preview!');
                  };
                  reader.readAsDataURL(file);
                }}
                className="w-full text-xs text-[var(--text3)] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-500/10 file:text-brand-500 hover:file:bg-brand-500/20 cursor-pointer"
              />
            </div>

            <div className="relative flex py-1 items-center mb-3">
              <div className="flex-grow border-t border-dark-border"></div>
              <span className="flex-shrink mx-2 text-[10px] text-gray-500 uppercase font-semibold">or image url</span>
              <div className="flex-grow border-t border-dark-border"></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text3)] uppercase tracking-wider mb-1.5">Image URL</label>
              <input value={form.imageUrl}
                onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-dark-surface2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-brand-500/60 transition-all" />
            </div>
            {form.imageUrl && (
              <div className="mt-3 relative group">
                <img src={form.imageUrl} alt="Preview" className="w-full h-40 object-cover rounded-xl bg-dark-surface3 border border-dark-border" />
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                  className="absolute top-2 right-2 px-2 py-1 bg-red-500/80 hover:bg-red-600 text-white text-[10px] font-bold rounded-md backdrop-blur-xs transition-all"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
            {saving ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
