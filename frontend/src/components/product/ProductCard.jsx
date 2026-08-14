import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { addToCart } from '@store/slices/cartSlice';
import { toggleWishlist, selectIsWishlisted } from '@store/slices/wishlistSlice';
import { formatCurrency } from '@utils/formatters';
import ImageWithFallback from '@components/common/ImageWithFallback';

const ProductCard = memo(({ product }) => {
  const dispatch    = useDispatch();
  const isWishlisted = useSelector((state) => selectIsWishlisted(state, product.id));

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    dispatch(addToCart({ product, quantity: 1 }));
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    dispatch(toggleWishlist(product));
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="group relative bg-dark-surface1 border border-dark-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300"
    >
      {/* Out‑of‑Stock overlay */}
      {product.stockQty === 0 && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl backdrop-blur-sm z-20">
          <span className="text-white text-xl font-bold tracking-wider">Out of Stock</span>
        </div>
      )}
      <Link to={`/products/${product.id}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-[4/3] bg-dark-surface2 overflow-hidden">
          <ImageWithFallback 
            src={product.imageUrl} 
            alt={product.name}
            wrapperClassName="w-full h-full"
            imgClassName="group-hover:scale-105 transition-transform duration-700 ease-out"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
            {discount > 0 && (
              <span className="px-2 py-0.5 bg-red-500/10 text-red-600 border border-red-500/20 rounded-md text-[10px] font-bold tracking-wider">
                -{discount}%
              </span>
            )}
            {product.badge && (
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-md text-[10px] font-bold tracking-wider uppercase">
                {product.badge}
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-white/80 dark:bg-black/60 backdrop-blur-md border border-dark-border text-gray-500 dark:text-gray-400 hover:text-red-500 transition-all shadow-sm hover:scale-110 active:scale-95 z-10"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              size={14}
              className={`transition-all duration-300 ${
                isWishlisted ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-500 hover:text-red-500'
              }`}
            />
          </button>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-[10px] text-brand-500 font-bold uppercase tracking-wider mb-1">{product.categoryName || 'Category'}</p>
          <h3 className="font-semibold text-sm leading-snug mb-1.5 line-clamp-2 text-[var(--text)] group-hover:text-brand-500 transition-colors duration-150">
            {product.name}
          </h3>

          {/* Star Rating */}
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex items-center">
              <Star size={12} className="text-amber-500 fill-amber-500" />
            </div>
            <span className="text-xs font-bold text-[var(--text)]">{product.ratingAvg?.toFixed(1) || '0.0'}</span>
            <span className="text-[10px] text-gray-400 font-medium">({product.ratingCount?.toLocaleString() || 0})</span>
          </div>

          {/* Pricing & Add to Cart */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex flex-col">
              {product.oldPrice && (
                <span className="text-[10px] text-gray-400 line-through mb-0.5">{formatCurrency(product.oldPrice)}</span>
              )}
              <span className="font-bold text-base text-[var(--text)]">{formatCurrency(product.price)}</span>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stockQty === 0}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-brand-500 hover:bg-brand-600 text-white transition-all shadow-sm shadow-brand-500/10 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title={product.stockQty === 0 ? 'Out of Stock' : 'Add to Cart'}
            >
              <ShoppingCart size={14} />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';
export default ProductCard;
