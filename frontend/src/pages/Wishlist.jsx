import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingCart, Heart } from 'lucide-react';
import { selectWishlistItems, toggleWishlist } from '@store/slices/wishlistSlice';
import { addToCart } from '@store/slices/cartSlice';
import { formatCurrency, calcDiscount } from '@utils/formatters';
import ImageWithFallback from '@components/common/ImageWithFallback';

export default function Wishlist() {
  const dispatch = useDispatch();
  const items    = useSelector(selectWishlistItems);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center page-enter">
        <div className="text-7xl mb-5">💔</div>
        <h2 className="text-xl font-bold mb-2 text-[var(--text)]">Your wishlist is empty</h2>
        <p className="text-gray-500 text-sm mb-6">Save products you love to buy them later.</p>
        <Link to="/products" className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all text-sm shadow-sm shadow-brand-500/10">
          Explore Products
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">My Wishlist ❤️</h1>
          <p className="text-gray-500 text-sm mt-1">{items.length} saved item{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => items.forEach(i => dispatch(toggleWishlist(i)))}
          className="text-xs font-bold text-red-500 hover:text-red-600 border border-red-500/20 hover:bg-red-500/5 px-3.5 py-1.5 rounded-xl transition-all">
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {items.map(product => {
            const discount = calcDiscount(product.price, product.oldPrice);
            return (
              <motion.div key={product.id} layout initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }}
                className="bg-dark-surface2 border border-dark-border rounded-2xl overflow-hidden hover:border-brand-500/20 transition-all shadow-xs hover:shadow-md">
                <Link to={`/products/${product.id}`}>
                  <div className="aspect-square bg-dark-surface3 flex items-center justify-center text-5xl overflow-hidden group">
                    <ImageWithFallback src={product.imageUrl} alt={product.name} wrapperClassName="w-full h-full" imgClassName="group-hover:scale-105 transition-transform duration-500" />
                  </div>
                </Link>
                <div className="p-4">
                  <p className="text-[10px] text-brand-500 font-bold uppercase tracking-wider mb-1">{product.categoryName}</p>
                  <h3 className="font-semibold text-sm line-clamp-2 mb-2 text-[var(--text)] hover:text-brand-500 transition-colors">{product.name}</h3>
                  {product.ratingAvg && (
                    <p className="text-xs text-amber-500 flex items-center gap-1 mb-2">
                      <span className="text-amber-500 fill-amber-500">★</span> <span className="font-bold text-[var(--text)]">{product.ratingAvg}</span>
                    </p>
                  )}
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="font-bold text-[var(--text)]">{formatCurrency(product.price)}</span>
                    {product.oldPrice && <span className="text-xs text-gray-500 line-through">{formatCurrency(product.oldPrice)}</span>}
                    {discount > 0 && <span className="text-xs font-bold text-red-500">-{discount}%</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => dispatch(addToCart({ product, quantity: 1 }))}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-sm shadow-brand-500/10">
                      <ShoppingCart size={12} /> Add to Cart
                    </button>
                    <button onClick={() => dispatch(toggleWishlist(product))}
                      className="w-9 h-9 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-xl transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
