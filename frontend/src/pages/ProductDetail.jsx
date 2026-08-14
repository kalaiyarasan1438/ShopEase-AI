import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Star, Truck, RotateCcw, Shield, ChevronRight, Tag } from 'lucide-react';
import { fetchProductById, selectSelectedProduct, selectProducts } from '@store/slices/productSlice';
import { addToCart } from '@store/slices/cartSlice';
import { toggleWishlist, selectIsWishlisted } from '@store/slices/wishlistSlice';
import ProductCard from '@components/product/ProductCard.jsx';
import Skeleton from '@components/common/Skeleton.jsx';
import Badge from '@components/common/Badge.jsx';
import ImageWithFallback from '@components/common/ImageWithFallback.jsx';
import { formatCurrency, calcDiscount } from '@utils/formatters';
import api from '@services/api';
import toast from 'react-hot-toast';

// Mock product for demo when API is not connected
const MOCK_PRODUCT = {
  id: 1, name: 'Pro Wireless Headphones', price: 12999, oldPrice: 16999,
  description: 'Experience studio-quality sound with our Pro Wireless Headphones. Featuring 40mm premium drivers, active noise cancellation, and up to 30 hours of battery life.',
  categoryName: 'Electronics', vendorName: 'TechWave', ratingAvg: 4.8, ratingCount: 2847,
  stockQty: 43, badge: 'Best Seller',
  imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
  galleryImages: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop&sig=1',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop&sig=2',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop&sig=3'
  ]
};

function StarRow({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={size} className={s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-500'} />
      ))}
    </div>
  );
}

function ReviewsSection({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    api.get(`/api/products/${productId}/reviews?page=0&size=10`)
      .then(res => setReviews(res.data.content || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return (
    <div className="flex items-center justify-center py-10">
      <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  if (reviews.length === 0) return (
    <div className="text-center py-10 text-[var(--text3)]">
      <Star size={32} className="mx-auto mb-2 opacity-30" />
      <p className="text-sm">No reviews yet. Purchase this product to leave a review.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {reviews.map((r, i) => (
        <motion.div key={r.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className="bg-dark-surface2 border border-dark-border rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {r.user?.firstName?.[0] || r.userName?.[0] || 'U'}
              </div>
              <div>
                <p className="font-bold text-sm text-[var(--text)]">
                  {r.user?.firstName && r.user?.lastName ? `${r.user.firstName} ${r.user.lastName}` : r.userName || 'Verified Customer'}
                </p>
                {r.isVerified && (
                  <span className="text-[10px] font-bold text-green-500">✓ Verified Purchase</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StarRow rating={r.rating} />
              <span className="text-xs font-bold text-amber-400">{r.rating}/5</span>
            </div>
          </div>
          {r.title && <p className="font-semibold text-sm text-[var(--text)] mb-1">{r.title}</p>}
          {r.body && <p className="text-sm text-[var(--text2)] leading-relaxed">{r.body}</p>}
          {r.createdAt && (
            <p className="text-[10px] text-[var(--text3)] mt-3 font-medium">
              {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { id }      = useParams();
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const product     = useSelector(selectSelectedProduct) || MOCK_PRODUCT;
  const related     = useSelector(selectProducts).slice(0, 4);
  const isWishlisted = useSelector(state => selectIsWishlisted(state, product?.id));

  const [qty,      setQty]      = useState(1);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  useEffect(() => {
    if (id) dispatch(fetchProductById(id));
  }, [id, dispatch]);

  useEffect(() => {
    setActiveImgIndex(0);
  }, [product?.id]);

  if (!product) return <Skeleton variant="page" />;

  const discount = calcDiscount(product.price, product.oldPrice);
  const allImages = [product.imageUrl, ...(product.galleryImages || [])].filter(Boolean);
  const activeImgUrl = allImages[activeImgIndex] || product.imageUrl;

  const handleAddToCart = () => {
    dispatch(addToCart({ product, quantity: qty }));
  };

  const handleBuyNow = () => {
    if (!product || product.stockQty === 0) {
      toast.error('This product is currently out of stock!');
      return;
    }
    dispatch(addToCart({ product, quantity: qty }));
    navigate('/checkout');
  };

  return (
    <div className="page-enter">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-6 font-medium">
        <span className="cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => navigate('/products')}>Products</span>
        <ChevronRight size={11} />
        <span className="cursor-pointer hover:text-[var(--text)] transition-colors">{product.categoryName}</span>
        <ChevronRight size={11} />
        <span className="text-gray-400 font-bold">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        {/* Images */}
        <div>
          <div className="relative aspect-square bg-dark-surface2 border border-dark-border rounded-3xl flex items-center justify-center overflow-hidden mb-4 shadow-xs group">
            <ImageWithFallback
              src={activeImgUrl}
              alt={product.name}
              wrapperClassName="w-full h-full"
              imgClassName="group-hover:scale-125 transition-transform duration-500 cursor-crosshair"
            />
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {allImages.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImgIndex(idx)}
                  className={`w-20 h-20 flex-shrink-0 bg-dark-surface2 border-2 rounded-2xl flex items-center justify-center overflow-hidden cursor-pointer transition-all ${idx === activeImgIndex ? 'border-brand-500 opacity-100' : 'border-dark-border opacity-60 hover:opacity-100 hover:border-brand-500/30'}`}
                >
                  <ImageWithFallback src={img} alt={`Thumbnail ${idx}`} wrapperClassName="w-full h-full" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            {product.badge && <Badge variant="warning">{product.badge}</Badge>}
            <Badge variant={product.stockQty > 0 ? 'success' : 'danger'}>
              {product.stockQty > 0 ? `✓ In Stock (${product.stockQty})` : 'Out of Stock'}
            </Badge>
          </div>

          <h1 className="text-2xl font-bold tracking-tight leading-tight mb-3 text-[var(--text)]">{product.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <StarRow rating={product.ratingAvg || 0} />
            <span className="font-bold text-sm text-[var(--text)]">{Number(product.ratingAvg || 0).toFixed(1)}</span>
            <span className="text-gray-500 text-sm">({(product.ratingCount || 0).toLocaleString()} reviews)</span>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-extrabold text-[var(--text)]">{formatCurrency(product.price)}</span>
            {product.oldPrice && (
              <>
                <span className="text-lg text-gray-500 line-through">{formatCurrency(product.oldPrice)}</span>
                <span className="px-2.5 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-md text-xs font-bold">
                  Save {discount}%
                </span>
              </>
            )}
          </div>

          {/* Product Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Product Specifications</h2>
              <div className="bg-dark-surface2 border border-dark-border rounded-2xl p-4 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2.5">
                      <div className="mt-0.5 text-brand-500"><Tag size={14} /></div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{key}</p>
                        <p className="text-xs text-[var(--text)] font-medium mt-0.5">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Qty + CTA */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center bg-dark-surface3 border border-dark-border rounded-xl overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1, q-1))}
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/5 transition-all text-lg font-bold">-</button>
              <span className="w-10 text-center font-bold text-sm text-[var(--text)]">{qty}</span>
              <button onClick={() => setQty(q => q+1)}
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/5 transition-all text-lg font-bold">+</button>
            </div>
            <button onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl transition-all text-xs shadow-sm shadow-brand-500/10">
              <ShoppingCart size={15} /> Add to Cart
            </button>
            <button onClick={() => dispatch(toggleWishlist(product))}
              className={`w-11 h-11 flex items-center justify-center rounded-xl border transition-all ${isWishlisted?'bg-red-500/10 border-red-500/20 text-red-500':'bg-dark-surface2 border-dark-border text-gray-400 hover:text-red-500'}`}>
              <Heart size={16} className={isWishlisted ? 'fill-red-500 text-red-500' : ''} />
            </button>
          </div>

          <button onClick={handleBuyNow}
            className="w-full py-3 bg-dark-surface2 hover:bg-dark-surface3 border border-dark-border text-[var(--text2)] font-bold rounded-xl transition-all text-xs mb-5 shadow-xs hover:border-brand-500/30">
            ⚡ Buy Now
          </button>

          {/* Trust */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { icon: <Truck size={16}/>, title: 'Free Delivery', sub: 'Orders over ₹999' },
              { icon: <RotateCcw size={16}/>, title: '30-Day Returns', sub: 'No questions asked' },
              { icon: <Shield size={16}/>, title: 'Secure Payment', sub: '256-bit SSL' },
            ].map(t => (
              <div key={t.title} className="bg-dark-surface2 border border-dark-border rounded-xl p-3 shadow-xs">
                <div className="text-brand-500 flex justify-center mb-1.5">{t.icon}</div>
                <p className="text-xs font-bold text-[var(--text)]">{t.title}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{t.sub}</p>
              </div>
            ))}
          </div>

          {/* Vendor */}
          <div className="mt-4 flex items-center gap-3 p-3 bg-dark-surface2 border border-dark-border rounded-xl shadow-xs">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {product.vendorName?.[0] || 'V'}
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Sold by</p>
              <p className="font-bold text-sm text-[var(--text)]">{product.vendorName || 'ShopEasy Store'}</p>
            </div>
            <Badge variant="success">★ {Number(product.ratingAvg || 0).toFixed(1)}</Badge>
          </div>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="mb-10">
          <h2 className="text-lg font-bold tracking-tight mb-4 text-[var(--text)]">Product Description</h2>
          <div className="bg-dark-surface2 border border-dark-border rounded-2xl p-6 text-gray-500 text-xs leading-relaxed shadow-xs">
            {product.description}
          </div>
        </div>
      )}

      {/* Customer Reviews Section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-5 border-b border-dark-border pb-3">
          <h2 className="text-lg font-bold tracking-tight text-[var(--text)] flex items-center gap-2">
            <Star size={18} className="text-amber-400 fill-amber-400" />
            Customer Reviews
            {product.ratingCount > 0 && (
              <span className="text-sm font-normal text-[var(--text3)]">
                · {Number(product.ratingAvg || 0).toFixed(1)} / 5 ({(product.ratingCount || 0).toLocaleString()} reviews)
              </span>
            )}
          </h2>
          {product.ratingCount > 0 && (
            <div className="flex items-center gap-2">
              <StarRow rating={product.ratingAvg || 0} size={16} />
              <span className="font-bold text-amber-400">{Number(product.ratingAvg || 0).toFixed(1)}</span>
            </div>
          )}
        </div>
        <ReviewsSection productId={product.id} />
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-dark-border pb-3">
            <h2 className="text-lg font-bold tracking-tight text-[var(--text)]">You May Also Like</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
