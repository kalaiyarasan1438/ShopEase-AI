import React, { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Grid, List, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchProducts, fetchCategories,
  selectProducts, selectCategories, selectProductsLoading,
  selectProductFilters, selectPagination,
  setFilters, setPage,
} from '@store/slices/productSlice';
import ProductCard from '@components/product/ProductCard.jsx';
import Skeleton from '@components/common/Skeleton.jsx';
import Pagination from '@components/common/Pagination.jsx';
import { formatCurrency } from '@utils/formatters';
import { addToCart } from '@store/slices/cartSlice';

export default function Products() {
  const dispatch    = useDispatch();
  const [searchParams] = useSearchParams();
  const products    = useSelector(selectProducts);
  const categories  = useSelector(selectCategories);
  const isLoading   = useSelector(selectProductsLoading);
  const filters     = useSelector(selectProductFilters);
  const pagination  = useSelector(selectPagination);
  const error       = useSelector(state => state.products.error);
  const [viewMode, setViewMode] = React.useState('grid');
  const [priceMin, setPriceMin] = React.useState(filters.minPrice || '');
  const [priceMax, setPriceMax] = React.useState(filters.maxPrice || '');
  const priceDebounce = useRef(null);

  // Sync URL params → filters
  useEffect(() => {
    const params = {};
    if (searchParams.get('search'))   params.search   = searchParams.get('search');
    if (searchParams.get('category')) params.category = searchParams.get('category');
    if (Object.keys(params).length)   dispatch(setFilters(params));
  }, [searchParams]);

  const loadProducts = useCallback(() => {
    dispatch(fetchProducts({
      page:       pagination.page,
      size:       pagination.size,
      search:     filters.search     || undefined,
      categoryId: filters.categoryId || undefined,
      minPrice:   filters.minPrice   || undefined,
      maxPrice:   filters.maxPrice   || undefined,
      ratingMin:  filters.ratingMin  || undefined,
      sortBy:     filters.sortBy,
      sortDir:    filters.sortDir,
    }));
  }, [dispatch, filters, pagination.page]);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    loadProducts();
  }, [filters, pagination.page]);

  useEffect(() => {
    if (error) {
      toast.error(`Failed to load products: ${error}`);
    }
  }, [error]);

  const handleCategoryClick = (catId) => {
    dispatch(setFilters({ categoryId: catId === filters.categoryId ? '' : catId }));
  };

  const handleRatingChange = (e) => {
    dispatch(setFilters({ ratingMin: e.target.value }));
  };

  const handlePriceDebounce = useCallback((min, max) => {
    if (priceDebounce.current) clearTimeout(priceDebounce.current);
    priceDebounce.current = setTimeout(() => {
      dispatch(setFilters({ minPrice: min, maxPrice: max }));
    }, 500);
  }, [dispatch]);

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Products</h1>
        <p className="text-gray-500 text-sm mt-1">
          {isLoading ? 'Loading…' : `${pagination.totalElements.toLocaleString()} products found`}
          {filters.search && <span className="ml-1">for "<span className="text-brand-500 font-bold">{filters.search}</span>"</span>}
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-sm font-semibold">
          ⚠️ Connection/API Error: {error.toString()}
          <p className="text-xs text-red-400 font-normal mt-1">
            Please make sure the Spring Boot backend is active on port 8080 and CORS is allowed.
          </p>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center flex-wrap gap-2 mb-6">
        {/* Category chips */}
        <button
          onClick={() => dispatch(setFilters({ categoryId: '' }))}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            !filters.categoryId
              ? 'bg-brand-500/10 border-brand-500/30 text-brand-500'
              : 'bg-dark-surface2 border-dark-border text-gray-500 hover:border-brand-500/30 hover:text-[var(--text)]'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filters.categoryId === cat.id
                ? 'bg-brand-500/10 border-brand-500/30 text-brand-500'
                : 'bg-dark-surface2 border-dark-border text-gray-500 hover:border-brand-500/30 hover:text-[var(--text)]'
            }`}
          >
            {cat.name}
          </button>
        ))}

        {/* Rating Filter */}
        <select
          value={filters.ratingMin || ''}
          onChange={handleRatingChange}
          className="bg-dark-surface2 border border-dark-border rounded-xl px-3 py-1.5 text-xs text-[var(--text2)] outline-none cursor-pointer hover:border-brand-500/30 transition-colors"
        >
          <option value="" className="bg-dark-surface1 text-[var(--text)]">All Ratings</option>
          <option value="4.5" className="bg-dark-surface1 text-[var(--text)]">4.5★ & up</option>
          <option value="4.0" className="bg-dark-surface1 text-[var(--text)]">4.0★ & up</option>
          <option value="3.0" className="bg-dark-surface1 text-[var(--text)]">3.0★ & up</option>
        </select>

        {/* Price Filter — debounced 500ms */}
        <div className="flex items-center gap-1.5 bg-dark-surface2 border border-dark-border rounded-xl px-2.5 py-1">
          <input
            type="number"
            placeholder="Min ₹"
            value={priceMin}
            onChange={(e) => {
              setPriceMin(e.target.value);
              handlePriceDebounce(e.target.value, priceMax);
            }}
            className="w-16 bg-transparent text-xs text-[var(--text)] outline-none"
          />
          <span className="text-gray-400 text-xs">-</span>
          <input
            type="number"
            placeholder="Max ₹"
            value={priceMax}
            onChange={(e) => {
              setPriceMax(e.target.value);
              handlePriceDebounce(priceMin, e.target.value);
            }}
            className="w-16 bg-transparent text-xs text-[var(--text)] outline-none"
          />
        </div>

        {/* View Toggle */}
        <div className="ml-auto flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-dark-surface2 border border-dark-border rounded-xl overflow-hidden">
            {[
              { mode: 'grid', Icon: Grid },
              { mode: 'list', Icon: List },
            ].map(({ mode, Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 transition-all ${
                  viewMode === mode
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'text-gray-400 hover:text-[var(--text)]'
                }`}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products */}
      {isLoading ? (
        <Skeleton variant="product-grid" count={12} />
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">😔</div>
          <h3 className="text-lg font-semibold mb-2 text-[var(--text)]">No products found</h3>
          <p className="text-gray-500 text-sm">Try adjusting your filters or search query.</p>
          <button
            onClick={() => dispatch(setFilters({ search: '', categoryId: '' }))}
            className="mt-4 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-brand-500/10"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {products.map(product => (
            <motion.div key={product.id} layout>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {products.map(product => (
            <div
              key={product.id}
              className="flex gap-4 bg-dark-surface2 border border-dark-border rounded-2xl p-4 hover:border-brand-500/30 transition-all shadow-xs hover:shadow-md"
            >
              <div className="w-20 h-20 bg-dark-surface3 rounded-xl flex items-center justify-center text-4xl flex-shrink-0">
                {product.emoji || '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-brand-500 font-bold uppercase tracking-wider mb-1">{product.categoryName}</p>
                <h3 className="font-semibold text-sm leading-snug mb-1 text-[var(--text)]">{product.name}</h3>
                <p className="text-xs text-amber-500 flex items-center gap-1">
                  <span className="text-amber-500 fill-amber-500">★</span> <span className="font-bold text-[var(--text)]">{product.ratingAvg?.toFixed(1)}</span> <span className="text-gray-400">({product.ratingCount?.toLocaleString()})</span>
                </p>
              </div>
              <div className="flex flex-col items-end justify-between flex-shrink-0">
                <div className="text-right">
                  <p className="font-bold text-base text-[var(--text)]">{formatCurrency(product.price)}</p>
                  {product.oldPrice && <p className="text-xs text-gray-400 line-through">{formatCurrency(product.oldPrice)}</p>}
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); if (product.stockQty !== 0) dispatch(addToCart({ product, quantity: 1 })); }}
                  disabled={product.stockQty === 0}
                  className="text-xs bg-brand-500 hover:bg-brand-600 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-sm shadow-brand-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {product.stockQty === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(p) => dispatch(setPage(p))}
      />
    </div>
  );
}
