import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  ArrowRight, Sparkles, ShieldCheck, Truck, RotateCcw,
  CreditCard, Mail, Star, Heart, CheckCircle2, ShoppingBag,
  Flame, Clock, Award, HelpCircle
} from 'lucide-react';
import { fetchProducts, selectProducts, selectProductsLoading } from '@store/slices/productSlice';
import ProductCard from '@components/product/ProductCard.jsx';
import Skeleton from '@components/common/Skeleton.jsx';

const CATEGORIES = [
  { name: 'Electronics', icon: '📱', color: 'from-blue-500/10 to-indigo-500/5', border: 'border-blue-500/10 hover:border-blue-500/30' },
  { name: 'Fashion',     icon: '🧥', color: 'from-pink-500/10 to-rose-500/5', border: 'border-pink-500/10 hover:border-pink-500/30' },
  { name: 'Sports',      icon: '👟', color: 'from-emerald-500/10 to-teal-500/5', border: 'border-emerald-500/10 hover:border-emerald-500/30' },
  { name: 'Home & Living',icon: '🪑', color: 'from-amber-500/10 to-orange-500/5', border: 'border-amber-500/10 hover:border-amber-500/30' },
  { name: 'Books',       icon: '📚', color: 'from-violet-500/10 to-purple-500/5', border: 'border-violet-500/10 hover:border-violet-500/30' },
  { name: 'Beauty & Care',icon: '💄', color: 'from-fuchsia-500/10 to-purple-500/5', border: 'border-fuchsia-500/10 hover:border-fuchsia-500/30' },
];

const BRANDS = [
  { name: 'AuraTech', logo: '⚡' },
  { name: 'NomadWear', logo: '⛺' },
  { name: 'VibeLiving', logo: '🪴' },
  { name: 'BioCare', logo: '🧬' },
  { name: 'CosmoReads', logo: '🌌' },
  { name: 'ApexSports', logo: '🏔️' },
];

const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    role: 'Verified Customer',
    stars: 5,
    text: 'ShopEasy has completely transformed my online shopping! The AI recommendations are spot on—it feels like having a personal shopper.',
  },
  {
    name: 'David K.',
    role: 'Vendor Proprietor',
    stars: 5,
    text: 'Selling on ShopEasy is a breeze. The vendor dashboard gives me all the analytics I need, and payments are always processed instantly.',
  },
  {
    name: 'Emily L.',
    role: 'Verified Customer',
    stars: 5,
    text: 'Customer support is incredible. The AI assistant answered my order queries in seconds, and my delivery arrived a day early!',
  },
];

const stagger = {
  visible: { transition: { staggerChildren: 0.05 } },
};
const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function Home() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const products  = useSelector(selectProducts);
  const isLoading = useSelector(selectProductsLoading);

  // Dynamic countdown timer for Flash Sale
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 32, seconds: 10 });

  useEffect(() => {
    dispatch(fetchProducts({ page: 0, size: 8, sortBy: 'ratingCount', sortDir: 'desc' }));

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 4, minutes: 32, seconds: 10 }; // Reset
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [dispatch]);

  const padTime = (val) => String(val).padStart(2, '0');

  return (
    <div className="space-y-16 page-enter pb-10">
      
      {/* ── Large E-Commerce Hero Banner (Amazon/Flipkart inspired) ─────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-dark-surface1 border border-dark-border rounded-3xl p-8 md:p-14 min-h-[400px] flex items-center shadow-sm"
      >
        {/* Large ambient background blobs */}
        <motion.div
          animate={{ scale: [1, 1.18, 1], x: [0, 24, 0], y: [0, -18, 0] }}
          transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
          className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-tr from-brand-500/20 to-purple-500/15 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.12, 1], x: [0, -18, 0], y: [0, 20, 0] }}
          transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
          className="absolute -bottom-16 right-1/3 w-80 h-80 bg-gradient-to-tr from-pink-300/15 to-indigo-300/10 rounded-full blur-3xl pointer-events-none"
        />
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-brand-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center gap-10 w-full z-10">
          {/* ── Left: Text + CTA ── */}
          <div className="flex-1 space-y-7 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-full text-xs font-bold text-brand-500">
              <Sparkles size={12} className="animate-pulse" />
              AI-Powered Personalized Shopping
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-[var(--text)]">
              Next-Gen Shopping,{' '}
              <span className="text-gradient">Built for You</span>
            </h1>

            <p className="text-sm text-[var(--text2)] max-w-lg mx-auto md:mx-0 leading-relaxed">
              Experience the minimalist precision of Apple combined with the catalog authority of Amazon — powered by real-time AI microservices.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-7 py-3 rounded-full transition-all text-sm shadow-lg shadow-brand-500/25 hover:scale-105 active:scale-95"
              >
                Shop All Deals <ArrowRight size={15} />
              </Link>
              <button
                onClick={() => {
                  const chatbotToggle = document.querySelector('.chat-toggle');
                  if (chatbotToggle) chatbotToggle.click();
                }}
                className="inline-flex items-center gap-2 bg-dark-surface2 hover:bg-dark-surface3 border border-dark-border text-[var(--text)] font-semibold px-7 py-3 rounded-full transition-all text-sm hover:scale-105 active:scale-95 shadow-sm"
              >
                <Sparkles size={14} className="text-brand-500" /> Consult AI
              </button>
            </div>

            {/* Social proof strip */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-5 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text2)]">
                <CheckCircle2 size={14} className="text-green-500" />
                <span className="font-semibold">50,000+</span> customers
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text2)]">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                <span className="font-semibold">4.9/5</span> rating
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text2)]">
                <ShieldCheck size={14} className="text-brand-500" />
                <span className="font-semibold">SSL Secured</span>
              </div>
            </div>
          </div>

          {/* ── Right: Premium Abstract Visual ── */}
          <div className="flex-shrink-0 hidden md:flex relative w-[320px] h-[300px] items-center justify-center">
            {/* Central glow orb */}
            <motion.div
              animate={{ scale: [1, 1.06, 1], opacity: [0.55, 0.85, 0.55] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              className="absolute w-52 h-52 bg-gradient-to-br from-brand-500/25 to-purple-600/20 rounded-full blur-3xl"
            />
            {/* Secondary glow */}
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 80, 0] }}
              transition={{ repeat: Infinity, duration: 9, ease: 'easeInOut' }}
              className="absolute w-40 h-40 bg-gradient-to-tr from-pink-400/15 to-indigo-400/15 rounded-full blur-2xl translate-x-12 translate-y-8"
            />

            {/* Floating glass info card — Secure Checkout */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
              className="absolute top-4 left-2 glass rounded-2xl px-4 py-3 shadow-lg flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center text-green-500">
                <ShieldCheck size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[var(--text)] leading-tight">Secure Checkout</p>
                <p className="text-[9px] text-[var(--text3)] leading-tight">256-bit SSL</p>
              </div>
            </motion.div>

            {/* Floating glass info card — Free Delivery */}
            <motion.div
              animate={{ y: [0, 11, 0] }}
              transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
              className="absolute bottom-8 right-0 glass rounded-2xl px-4 py-3 shadow-lg flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-xl bg-brand-500/15 flex items-center justify-center text-brand-500">
                <Truck size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[var(--text)] leading-tight">Free Delivery</p>
                <p className="text-[9px] text-green-500 font-semibold leading-tight">Orders over ₹999</p>
              </div>
            </motion.div>

            {/* Floating glass info card — Top Rated */}
            <motion.div
              animate={{ y: [0, -7, 0], x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
              className="absolute bottom-3 left-4 glass rounded-2xl px-4 py-3 shadow-lg flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500">
                <Star size={16} className="fill-amber-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[var(--text)] leading-tight">Top Rated</p>
                <p className="text-[9px] text-[var(--text3)] leading-tight">4.9 · 50k reviews</p>
              </div>
            </motion.div>

            {/* Floating emoji orbs */}
            <motion.div
              animate={{ y: [0, -14, 0], rotate: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5.5, ease: 'easeInOut' }}
              className="absolute top-8 right-5 w-12 h-12 bg-gradient-to-br from-purple-500/25 to-pink-500/20 backdrop-blur-sm rounded-full border border-dark-border flex items-center justify-center text-xl shadow-md"
            >
              🛍️
            </motion.div>
            <motion.div
              animate={{ y: [0, 13, 0], rotate: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
              className="absolute top-1/2 right-8 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-indigo-500/25 to-blue-500/20 backdrop-blur-sm rounded-full border border-dark-border flex items-center justify-center text-lg shadow-md"
            >
              ✨
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.14, 1] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
              className="absolute top-2 left-1/2 -translate-x-1/2 w-9 h-9 bg-gradient-to-br from-emerald-500/25 to-green-500/20 backdrop-blur-sm rounded-full border border-dark-border flex items-center justify-center text-base shadow-md"
            >
              🤖
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── Flash Sale Section ( FlipKart / Amazon Style ) ───────────────── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
              <Flame size={18} className="fill-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text)]">Limited Flash Sale</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Top deals running out fast</p>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mr-1">Ends in:</span>
            <div className="flex items-center gap-1">
              <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-bold px-2 py-1 rounded-lg">{padTime(timeLeft.hours)}h</span>
              <span className="text-red-500 font-bold">:</span>
              <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-bold px-2 py-1 rounded-lg">{padTime(timeLeft.minutes)}m</span>
              <span className="text-red-500 font-bold">:</span>
              <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-bold px-2 py-1 rounded-lg">{padTime(timeLeft.seconds)}s</span>
            </div>
          </div>
        </div>

        {/* Carousel Grid (Showing 4 products on discount) */}
        {isLoading ? (
          <Skeleton variant="product-grid" count={4} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(2, 6).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* ── Category Section (Colorful Modern Cards) ────────────────────── */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text)]">Browse by Category</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Curated nodes built for fast delivery</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.name}
              to={`/products?category=${cat.name}`}
              className={`group flex flex-col items-center gap-3 p-6 bg-gradient-to-br ${cat.color} border ${cat.border} rounded-2xl hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer text-center`}
            >
              <span className="text-4xl group-hover:scale-110 transition-transform duration-300 select-none">{cat.icon}</span>
              <span className="text-xs font-bold text-[var(--text)]">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── AI Service Strip ───────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-center gap-4 p-5 bg-gradient-to-r from-brand-500/5 to-purple-600/5 border border-brand-500/15 rounded-2xl shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-2xl flex-shrink-0">
          🤖
        </div>
        <div className="flex-1 text-center md:text-left space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-brand-500 uppercase tracking-wider">
            <Sparkles size={10} />
            AI assistant active
          </div>
          <p className="font-bold text-sm text-[var(--text)]">Compare, decide, and finalize orders inside our smart chatbot.</p>
          <p className="text-xs text-gray-400">Ask the floating assistant in the bottom-right corner for order checks, product lookups, or customized recommendations.</p>
        </div>
        <button
          onClick={() => {
            const chatToggle = document.querySelector('.chat-toggle');
            if (chatToggle) chatToggle.click();
          }}
          className="text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-full transition-all shadow-sm shadow-brand-500/10"
        >
          Activate Chatbot
        </button>
      </div>

      {/* ── Trending & Featured Products Section ───────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-end justify-between border-b border-dark-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text)] font-sans">Trending Store Highlights</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Top-rated items based on active checkouts</p>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-brand-500 hover:text-brand-600 flex items-center gap-1 hover:underline transition-all"
          >
            Shop Full Catalog <ArrowRight size={13} />
          </Link>
        </div>

        {isLoading ? (
          <Skeleton variant="product-grid" count={8} />
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {products.slice(0, 8).map(product => (
              <motion.div key={product.id} variants={fadeUp}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Featured Brands Section (Amazon/Flipkart inspired) ─────────── */}
      <div className="space-y-6">
        <div className="text-center md:text-left">
          <h2 className="text-xl font-bold text-[var(--text)]">Official Store Brands</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Direct checkout from verified product manufacturers</p>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {BRANDS.map(brand => (
            <Link
              key={brand.name}
              to={`/products?search=${encodeURIComponent(brand.name)}`}
              className="flex items-center justify-center gap-2 p-5 bg-dark-surface1 border border-dark-border rounded-2xl hover:border-brand-500/30 transition-all cursor-pointer shadow-xs group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform duration-200">{brand.logo}</span>
              <span className="text-xs font-bold text-[var(--text)]">{brand.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Testimonials Section ───────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-[var(--text)]">Customer Reviews</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Join thousands of verified shoppers</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <div key={idx} className="bg-dark-surface1 border border-dark-border p-6 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center gap-1">
                {[...Array(t.stars)].map((_, i) => (
                  <Star key={i} size={13} className="text-amber-500 fill-amber-500" />
                ))}
              </div>
              <p className="text-xs text-gray-500 italic leading-relaxed">"{t.text}"</p>
              <div className="flex items-center gap-2 pt-2">
                <div className="w-7 h-7 rounded-full bg-brand-500/10 text-brand-500 text-[10px] font-bold flex items-center justify-center uppercase">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text)]">{t.name}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trust Badges Section ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Truck,          title: 'Free Shipping',     desc: 'On orders over ₹999' },
          { icon: RotateCcw,      title: '30-Day Returns',    desc: 'Hassle-free refunds' },
          { icon: ShieldCheck,    title: 'Secure Payments',  desc: 'Fully SSL encrypted' },
          { icon: Award,          title: 'Verified Quality',  desc: 'Strict vendor checks' },
        ].map((b, idx) => (
          <div key={idx} className="flex items-center gap-4 p-5 bg-dark-surface1 border border-dark-border rounded-2xl shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
              <b.icon size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text)]">{b.title}</p>
              <p className="text-xs text-gray-400">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Newsletter Section ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/5 via-brand-500/5 to-transparent border border-dark-border rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto space-y-6">
        <Mail className="mx-auto text-brand-500 animate-bounce" size={32} />
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[var(--text)]">Stay Updated with Deals</h2>
          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
            Subscribe to our weekly newsletter to get exclusive flash sales notifications, coupon releases, and AI store updates.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Enter your email address"
            className="w-full bg-dark-surface2 border border-dark-border rounded-full px-5 py-2.5 text-xs text-[var(--text)] placeholder-gray-400 outline-none focus:border-brand-500/60 focus:ring-4 focus:ring-brand-500/10 transition-all"
          />
          <button className="w-full sm:w-auto bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs px-6 py-2.5 rounded-full shadow-sm shadow-brand-500/10 transition-all hover:scale-105 active:scale-95 flex-shrink-0">
            Subscribe
          </button>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="pt-12 border-t border-dark-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-8 text-left">
          <div className="space-y-4 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <ShoppingBag className="text-brand-500" size={20} />
              <span className="font-bold text-md text-[var(--text)]">ShopEasy</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Premium multi-vendor AI e-commerce marketplace combining the layout authority of Amazon with the minimalism of Apple.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Shop Categories</h4>
            <ul className="space-y-2 text-xs text-gray-500 font-medium">
              <li><Link to="/products?category=Electronics" className="hover:text-brand-500 transition-colors">Electronics</Link></li>
              <li><Link to="/products?category=Fashion" className="hover:text-brand-500 transition-colors">Fashion</Link></li>
              <li><Link to="/products?category=Sports" className="hover:text-brand-500 transition-colors">Sports</Link></li>
              <li><Link to="/products?category=Home%20%26%20Living" className="hover:text-brand-500 transition-colors">Home & Living</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Profile & Orders</h4>
            <ul className="space-y-2 text-xs text-gray-500 font-medium">
              <li><Link to="/profile" className="hover:text-brand-500 transition-colors">My Profile</Link></li>
              <li><Link to="/orders" className="hover:text-brand-500 transition-colors">Returns & Orders</Link></li>
              <li><Link to="/wishlist" className="hover:text-brand-500 transition-colors">Wishlist</Link></li>
              <li><Link to="/cart" className="hover:text-brand-500 transition-colors">Shopping Cart</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Support & Legal</h4>
            <ul className="space-y-2 text-xs text-gray-500 font-medium">
              <li><a href="#" className="hover:text-brand-500 transition-colors">About ShopEasy</a></li>
              <li><a href="#" className="hover:text-brand-500 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-brand-500 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-brand-500 transition-colors flex items-center gap-1">Help Center <HelpCircle size={10} /></a></li>
            </ul>
          </div>
        </div>
        <div className="pt-6 border-t border-dark-border flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
          <p className="text-[10px] text-gray-500 font-medium">
            © {new Date().getFullYear()} ShopEasy Inc. All rights reserved. Combine visual elements designed for modern portfolios.
          </p>
          <div className="flex gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            <a href="#" className="hover:text-brand-500 transition-colors">Twitter</a>
            <a href="#" className="hover:text-brand-500 transition-colors">GitHub</a>
            <a href="#" className="hover:text-brand-500 transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
