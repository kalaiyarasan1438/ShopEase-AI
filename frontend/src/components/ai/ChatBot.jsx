import React, { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, X, Send, Sparkles, Mic, Image as ImageIcon, ShoppingCart,
  Heart, Star, ArrowRight, RefreshCw, Scale, Eye, Info
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { addToCart } from '@store/slices/cartSlice';
import { toggleWishlist } from '@store/slices/wishlistSlice';
import { selectCurrentUser } from '@store/slices/authSlice';
import api from '@services/api';
import aiService from '@services/aiService';
import { formatCurrency, getStatusConfig } from '@utils/formatters';

const QUICK_CHIPS = [
  'Track my order',
  'Best deals today',
  'Recommend products',
  'Return policy',
];

const BOT_INTRO = {
  id: Date.now(),
  role: 'bot',
  text: "👋 Hi! I'm ShopEasy AI Assistant. Ask me about specific products, recommendations, specs, order tracking, or shopping advice!",
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

// ── General Knowledge Q&A Database ─────────────────────────────────────────────
const GENERAL_QA = [
  {
    keywords: ['oled', 'display', 'screen type'],
    answer: "An **OLED** (Organic Light-Emitting Diode) display uses self-lit pixels where each pixel turns on and off individually. This delivers true, deep blacks, infinite contrast ratio, vibrant colors, and ultra-fast response times compared to traditional LED/LCD screens."
  },
  {
    keywords: ['amoled', 'super amoled'],
    answer: "**AMOLED** (Active-Matrix OLED) uses a thin-film transistor layer for faster pixel switching, lower power consumption, and higher pixel density—commonly used in modern flagship smartphones."
  },
  {
    keywords: ['ram', 'memory'],
    answer: "**RAM** (Random Access Memory) is system short-term memory that stores active application data. More RAM allows smoother multitasking, faster switching between apps, and better performance in demanding programs."
  },
  {
    keywords: ['choose a laptop', 'buying advice laptop', 'laptop guide', 'laptop for programming'],
    answer: "💡 **Key Factors When Choosing a Laptop**:\n1. **Processor (CPU)**: Intel Core i5/i7 (12th+ Gen) or AMD Ryzen 5/7 for performance.\n2. **RAM**: Minimum 16GB for programming, multitasking, or heavy workloads.\n3. **Storage**: At least 512GB NVMe SSD.\n4. **Display**: Full HD IPS or OLED screen with 300+ nits brightness.\n5. **Battery**: 8+ hours battery life for portability."
  },
  {
    keywords: ['return', 'refund', 'policy', 'exchange'],
    answer: " Our **30-day return policy** lets you return unused items in original packaging within 30 days. You can start a return directly from **My Account → Orders → Return Item**."
  },
  {
    keywords: ['payment', 'pay', 'upi', 'cod'],
    answer: "💳 We support **Credit/Debit Cards**, **UPI (Google Pay, PhonePe, Paytm)**, **Net Banking**, and **Cash on Delivery**. All online transactions are protected by 256-bit SSL encryption."
  }
];

// Helper for base token stemming with explicit singular/plural mappings
function getBaseToken(token) {
  if (!token) return '';
  const t = token.toLowerCase();
  if (t === 'earring' || t === 'earrings') return 'earring';
  if (t === 'shirt' || t === 'shirts') return 'shirt';
  if (t === 'shoe' || t === 'shoes') return 'shoe';
  if (t === 'book' || t === 'books') return 'book';
  if (t === 'watch' || t === 'watches') return 'watch';
  if (t === 'table' || t === 'tables') return 'table';
  if (t === 'chair' || t === 'chairs') return 'chair';
  if (t === 'boot' || t === 'boots') return 'boot';
  if (t === 'serum' || t === 'serums') return 'serum';
  if (t === 'shampoo' || t === 'shampoos') return 'shampoo';
  if (t.endsWith('ies') && t.length > 4) return t.slice(0, -3) + 'y';
  if (t.endsWith('es') && t.length > 4) return t.slice(0, -2);
  if (t.endsWith('s') && t.length > 3 && !t.endsWith('ss')) return t.slice(0, -1);
  return t;
}

const DYNAMIC_STOPWORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'you', 'your', 'he', 'she', 'they',
  'give', 'show', 'buy', 'want', 'need', 'please', 'for', 'with', 'under', 'below',
  'within', 'around', 'approx', 'cheap', 'cheapest', 'best', 'good', 'top', 'price',
  'rs', 'inr', 'k', 'lakh', 'l', 'find', 'search', 'get', 'item', 'items', 'products',
  'product', 'is', 'it', 'tell', 'features', 'feature', 'specs', 'spec', 'details',
  'detail', 'about', 'of', 'what', 'are', 'does', 'how', 'which', 'suggest', 'some',
  'something', 'anything', 'whatever', 'thing', 'stuff', 'pair', 'pair of',
  'highly', 'rated', 'recommend', 'recommendation', 'looking', 'like', 'a', 'an', 'the',
  'can', 'could', 'would', 'should', 'have', 'has', 'had', 'or', 'and', 'to', 'in', 'on', 'at', 'from',
  'that', 'does', 'not', 'exist'
]);

// ── Dynamic Intent & Token Extractor ──────────────────────────────────────────
function parseShoppingIntent(rawText) {
  const text = rawText.toLowerCase().trim();

  // Category clause extraction
  const categoryMap = [
    { label: "Fashion", patterns: [/from fashion/i, /in fashion/i, /category fashion/i] },
    { label: "Hair & Care", patterns: [/from hair care/i, /in hair care/i, /from hair & care/i, /in hair & care/i] },
    { label: "Beauty & Care", patterns: [/from beauty care/i, /in beauty care/i, /from beauty & care/i, /in beauty & care/i, /from beauty/i, /in beauty/i] },
    { label: "Sports", patterns: [/from sports/i, /in sports/i] },
    { label: "Electronics", patterns: [/from electronics/i, /in electronics/i] },
    { label: "Home & Living", patterns: [/from home & living/i, /in home & living/i, /from home and living/i, /in home and living/i] },
    { label: "Books", patterns: [/from books/i, /in books/i] }
  ];

  let extractedCategory = null;
  let textForTokens = text;

  for (const catObj of categoryMap) {
    for (const pat of catObj.patterns) {
      if (pat.test(textForTokens)) {
        extractedCategory = catObj.label;
        textForTokens = textForTokens.replace(pat, ' ');
        break;
      }
    }
    if (extractedCategory) break;
  }

  // Budget extraction
  let maxPrice = null;
  let minPrice = null;

  const budgetKeywordMatch = textForTokens.match(/(?:under|below|less than|within|upto|up to|max|budget|around|approx|with|for|of)\s*(?:₹|rs\.?|inr|\$)?\s*(\d{2,6})\b/i);
  const kMatch = textForTokens.match(/(?:under|below|around|approx|budget|with|for|of|less than|within|upto|up to|max)?\s*(?:₹|rs\.?|inr|\$)?\s*(\d+(?:\.\d+)?)\s*k\b/i);

  if (kMatch) maxPrice = parseFloat(kMatch[1]) * 1000;
  else if (budgetKeywordMatch) maxPrice = parseFloat(budgetKeywordMatch[1]);

  // Clean tokens
  const cleanedText = textForTokens
    .replace(/₹|rs\.?|inr|\$/gi, ' ')
    .replace(/[\.,!\?"'\(\):;\/\-_]/g, ' ');

  const queryTokens = cleanedText.split(/\s+/).filter(w => {
    if (w.length <= 1) return false;
    if (DYNAMIC_STOPWORDS.has(w)) return false;
    if (/^\d+k$/i.test(w)) return false;
    if (/^\d+$/.test(w) && (Number(w) >= 100 || (maxPrice && Number(w) === maxPrice))) return false;
    return true;
  });

  const baseTokens = queryTokens.map(t => getBaseToken(t));

  return {
    queryTokens,
    baseTokens,
    extractedCategory,
    maxPrice,
    rawText
  };
}

// ── Generic Head-Entity Database-Driven Product Matching Engine ──────────────────────
function strictFilterProducts(allProducts, rawText) {
  const intent = parseShoppingIntent(rawText);
  const { queryTokens, baseTokens, extractedCategory, maxPrice } = intent;

  const queryLabel = queryTokens.join(' ');

  console.log("[CHATBOT FINAL DEBUG] USER QUERY:", rawText);
  console.log("[CHATBOT FINAL DEBUG] EXTRACTED KEYWORDS:", queryTokens);
  console.log("[CHATBOT FINAL DEBUG] TOTAL PRODUCTS FROM API:", allProducts.length);

  if (queryTokens.length === 0) {
    console.log("[CHATBOT FINAL DEBUG] MATCHED PRODUCTS: []");
    return {
      strictMatches: [],
      exactFound: false,
      intent,
      message: `Sorry, I couldn't find any relevant products on ShopEasy.`
    };
  }

  // STEP 1: MATCH EXTRACTED KEYWORDS ONLY AGAINST PRODUCT NAME (OR CATEGORY NAME IF CATEGORY CONCEPT)
  const matches = allProducts.filter(p => {
    const pName = (p.name || '').toLowerCase();
    const pCat  = (p.categoryName || p.category?.name || '').toLowerCase();

    // Every keyword in queryTokens (or baseToken) must match as a word in pName (or pCat if cat match)
    for (let i = 0; i < queryTokens.length; i++) {
      const token = queryTokens[i];
      const baseToken = baseTokens[i];

      const tokenReg = new RegExp(`\\b${token}s?\\b`, 'i');
      const baseReg  = new RegExp(`\\b${baseToken}s?\\b`, 'i');

      const strictName = tokenReg.test(pName) || baseReg.test(pName);
      const strictCat  = tokenReg.test(pCat) || baseReg.test(pCat);

      if (token.length >= 4) {
        if (!strictName && !strictCat) return false;
      } else {
        const inName = strictName || pName.includes(token) || pName.includes(baseToken);
        const inCat  = strictCat  || pCat.includes(token) || pCat.includes(baseToken);
        if (!inName && !inCat) return false;
      }
    }
    return true;
  });

  let candidatePool = matches;

  // STEP 2: CATEGORY FILTERING (APPLIED AFTER PRODUCT NAME MATCHING)
  if (extractedCategory) {
    const catLower = extractedCategory.toLowerCase();
    candidatePool = candidatePool.filter(p => {
      const pCat = (p.categoryName || p.category?.name || '').toLowerCase();
      return pCat.includes(catLower) || catLower.includes(pCat);
    });
  }

  // STEP 3: PRICE FILTERING (APPLIED AFTER PRODUCT MATCHING)
  if (maxPrice) {
    const budgetMatches = candidatePool.filter(p => Number(p.price) <= maxPrice);
    if (budgetMatches.length === 0) {
      console.log("[CHATBOT FINAL DEBUG] MATCHED PRODUCTS: []");
      const catMsg = extractedCategory ? ` in ${extractedCategory}` : '';
      return {
        strictMatches: [],
        exactFound: false,
        intent,
        message: `Sorry, I couldn't find any ${queryLabel} products${catMsg} under ₹${maxPrice} on ShopEasy.`
      };
    }
    candidatePool = budgetMatches;
  }

  console.log("[CHATBOT FINAL DEBUG] MATCHED PRODUCTS:", candidatePool.map(p => p.name));

  if (candidatePool.length === 0) {
    const catMsg = extractedCategory ? ` in ${extractedCategory}` : '';
    return {
      strictMatches: [],
      exactFound: false,
      intent,
      message: `Sorry, I couldn't find any relevant ${queryLabel} products${catMsg} on ShopEasy.`
    };
  }

  return {
    strictMatches: candidatePool,
    exactFound: candidatePool.length > 0,
    count: candidatePool.length,
    intent
  };
}

const ChatBot = memo(() => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([BOT_INTRO]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isListening, setIsListening] = useState(false);

  // Context memory
  const [lastProduct, setLastProduct] = useState(null);
  const [lastProductsSet, setLastProductsSet] = useState([]);

  const endRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => setSelectedImage(evt.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice dictation is not supported in this browser.');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = (e) => {
        setIsListening(false);
        if (e.error === 'not-allowed') toast.error('Microphone permission denied.');
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
      toast.error('Could not activate microphone.');
    }
  };

  const sendMessage = async (userText) => {
    const messageToSend = userText || input;
    if (!messageToSend.trim() && !selectedImage) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: messageToSend,
      imagePreview: selectedImage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const currentImg = selectedImage;
    setSelectedImage(null);
    const textLower = messageToSend.toLowerCase().trim();
    setLoading(true);

    try {
      const parsedIntent = parseShoppingIntent(messageToSend);
      console.log("[CHATBOT DEBUG] CURRENT USER MESSAGE:", messageToSend);
      if (textLower === 'show all categories' || textLower === 'all categories' || textLower === 'categories' || textLower.includes('show categories')) {
        const catRes = await api.get('/api/categories');
        const catList = catRes.data || [];
        const catNames = catList.map(c => c.name || c).join('\n• ');

        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'bot',
          text: `📂 **ShopEasy Product Categories**:\n\n• ${catNames || 'Fashion\n• Hair & Care\n• Beauty & Care\n• Sports\n• Electronics\n• Home & Living\n• Books'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
        setLoading(false);
        return;
      }

      const isSearchIntent = (parsedIntent.queryTokens.length > 0 ||
                             parsedIntent.maxPrice !== null ||
                             /\b(give|show|want|need|recommend|suggest|buy|find|get|best|good|top|cheap|cheapest|price|under|below|products?|items?|looking for)\b/i.test(messageToSend) ||
                             !!currentImg) && !textLower.includes('show all categories');

      // ── Priority Product Search Execution ──────────────────────────────────────────────
      if (isSearchIntent && parsedIntent.queryTokens.length > 0) {
        const res = await api.get('/api/products?size=1000');
        const allProducts = Array.isArray(res.data) ? res.data : (res.data?.content || []);

        const filterResult = strictFilterProducts(allProducts, messageToSend);
        const { strictMatches, message, intent } = filterResult;

        const queryLabel = (intent.queryTokens && intent.queryTokens.length > 0) ? intent.queryTokens.join(' ') : 'product';

        // Case A: No products matched keyword or budget filter
        if (!strictMatches || strictMatches.length === 0) {
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            role: 'bot',
            text: message || `Sorry, I couldn't find any relevant ${queryLabel} products on ShopEasy.`,
            suggestions: intent.maxPrice ? ['Increase budget', 'Show all categories'] : ['Show all categories'],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }]);
          setLoading(false);
          return;
        }

        // Case B: Products matched -> Display directly in ChatBot UI
        const topMatches = strictMatches.slice(0, 4);
        setLastProduct(topMatches[0]);
        setLastProductsSet(topMatches);

        const budgetStr = intent.maxPrice ? ` under ${formatCurrency(intent.maxPrice)}` : '';

        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'bot',
          text: `Here are top matching **${queryLabel}** products${budgetStr} available on ShopEasy:`,
          products: topMatches,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
        setLoading(false);
        return;
      }

      // ── Actions ─────────────────────────────────────────────────────────────
      if (textLower.includes('add to cart') || textLower.includes('buy this')) {
        if (lastProduct) {
          dispatch(addToCart({ product: lastProduct, quantity: 1 }));
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            role: 'bot',
            text: `🛒 Added **${lastProduct.name}** to your shopping cart!`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }]);
          setLoading(false);
          return;
        }
      }

      if (textLower.includes('add to wishlist')) {
        if (lastProduct) {
          dispatch(toggleWishlist(lastProduct));
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            role: 'bot',
            text: `❤️ Added **${lastProduct.name}** to your wishlist!`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }]);
          setLoading(false);
          return;
        }
      }

      if (textLower.includes('track') || textLower.includes('my order')) {
        try {
          const res = await api.get('/api/orders?size=5');
          const orders = res.data?.content || [];
          if (orders.length > 0) {
            setMessages(prev => [...prev, {
              id: Date.now() + 1,
              role: 'bot',
              text: `📦 Found **${orders.length}** recent order(s) for your account:`,
              orderCards: orders,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }]);
          } else {
            setMessages(prev => [...prev, {
              id: Date.now() + 1,
              role: 'bot',
              text: "You don't have any active orders right now. You can browse our shop to place a new order!",
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }]);
          }
          setLoading(false);
          return;
        } catch {}
      }

      if (textLower.includes('show my wishlist') || textLower.includes('view wishlist')) {
        try {
          const res = await api.get('/api/wishlist');
          const wishList = res.data || [];
          if (wishList.length > 0) {
            setMessages(prev => [...prev, {
              id: Date.now() + 1,
              role: 'bot',
              text: `❤️ Here are the items in your wishlist:`,
              products: wishList,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }]);
          } else {
            setMessages(prev => [...prev, {
              id: Date.now() + 1,
              role: 'bot',
              text: "Your wishlist is currently empty. Click the heart icon on any product to save it!",
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }]);
          }
          setLoading(false);
          return;
        } catch {}
      }

      // ── Follow-Up Product Specs Question ─────────────────────────────────────
      if ((textLower.includes('feature') || textLower.includes('spec') || textLower.includes('detail') || textLower.includes('its') || textLower.includes('this product')) && lastProduct) {
        const specStr = (lastProduct.specifications && Object.keys(lastProduct.specifications).length > 0)
          ? Object.entries(lastProduct.specifications).map(([k, v]) => `• **${k}**: ${v}`).join('\n')
          : 'Not available';

        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'bot',
          text: `📱 **Product Details for ${lastProduct.name}**:\n\n• **Price**: ${formatCurrency(lastProduct.price)}\n• **Rating**: ${lastProduct.ratingAvg || lastProduct.rating || 4.8}★ (${lastProduct.ratingCount || lastProduct.reviewCount || 18} reviews)\n• **Description**: ${lastProduct.description || 'Not available'}\n• **Stock Status**: ${lastProduct.stockQty > 0 ? 'In Stock ✅' : 'Out of Stock ❌'}\n\n**Specifications**:\n${specStr}`,
          singleProduct: lastProduct,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
        setLoading(false);
        return;
      }

      // ── Conversational Follow-Up Context Handler ──────────────────────────────────
      if ((textLower.includes('which one') || textLower.includes('what about') || textLower.includes('which is better')) && parsedIntent.queryTokens.length === 0 && lastProductsSet.length > 0) {
        const topItem = lastProductsSet[0];
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'bot',
          text: `Based on your previously viewed options, **${topItem.name}** is the top recommendation for your request!\n\n• **Price**: ${formatCurrency(topItem.price)}\n• **Rating**: ${topItem.ratingAvg || topItem.rating || 4.8}★\n• **Details**: ${topItem.description || 'Not available'}`,
          singleProduct: topItem,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
        setLoading(false);
        return;
      }

      // ── Side-by-Side Product Comparison Table ──────────────────────────────────
      if (textLower.includes('compare') || textLower.includes('vs') || textLower.includes('which one is better')) {
        const res = await api.get('/api/products?size=100');
        const allProducts = res.data?.content || [];
        const filterResult = strictFilterProducts(allProducts, messageToSend);
        
        let compItems = filterResult.strictMatches.length >= 2 ? filterResult.strictMatches : (lastProductsSet.length >= 2 ? lastProductsSet : allProducts.slice(0, 2));
        compItems = compItems.slice(0, 2);

        if (compItems.length >= 2) {
          const p1 = compItems[0];
          const p2 = compItems[1];
          const spec1 = (p1.specifications && Object.keys(p1.specifications).length > 0) ? Object.entries(p1.specifications).map(([k,v]) => `${k}: ${v}`).join(', ') : 'Not available';
          const spec2 = (p2.specifications && Object.keys(p2.specifications).length > 0) ? Object.entries(p2.specifications).map(([k,v]) => `${k}: ${v}`).join(', ') : 'Not available';

          const tableMarkdown = `📊 **Side-by-Side Product Comparison**:\n\n| Feature | ${p1.name} | ${p2.name} |\n|---|---|---|\n| **Price** | ${formatCurrency(p1.price)} | ${formatCurrency(p2.price)} |\n| **Rating** | ${p1.ratingAvg || p1.rating || 4.8}★ (${p1.ratingCount || p1.reviewCount || 18} reviews) | ${p2.ratingAvg || p2.rating || 4.7}★ (${p2.ratingCount || p2.reviewCount || 20} reviews) |\n| **Category** | ${p1.categoryName || p1.category?.name || 'Not available'} | ${p2.categoryName || p2.category?.name || 'Not available'} |\n| **Specifications** | ${spec1} | ${spec2} |\n| **Stock Status** | ${p1.stockQty > 0 ? 'In Stock ✅' : 'Out of Stock ❌'} | ${p2.stockQty > 0 ? 'In Stock ✅' : 'Out of Stock ❌'} |\n\n💡 **Recommendation**: **${p1.name}** offers superior rating and feature set!`;

          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            role: 'bot',
            text: tableMarkdown,
            comparisonPair: compItems,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }]);
          setLoading(false);
          return;
        }
      }

      // ── General Q&A Knowledge Matching ─────────────────────────────────────
      for (const qa of GENERAL_QA) {
        if (qa.keywords.some(kw => textLower.includes(kw))) {
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            role: 'bot',
            text: qa.answer,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }]);
          setLoading(false);
          return;
        }
      }

      // ── Fallback ───────────────────────────────────────────────────────────
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        text: "I'm here to help with products, specs, orders, and shopping questions. What category or product are you interested in?",
        suggestions: ['Phones', 'Laptops', 'Track my order'],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);

    } catch (err) {
      console.error("ChatBot error:", err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        text: "Sorry, I couldn't find any matching products for your request on ShopEasy.",
        suggestions: ['Show all categories', 'Browse Shop'],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 25 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute bottom-20 right-0 w-[calc(100vw-2rem)] sm:w-[440px] h-[calc(100vh-6rem)] sm:h-[680px] max-w-[450px] max-h-[720px] bg-dark-surface1 border border-dark-border rounded-3xl overflow-hidden shadow-2xl flex flex-col z-50 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-brand-500/20 via-purple-600/15 to-dark-surface1 border-b border-dark-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-brand-500/30">
                  <Sparkles size={16} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-sm text-[var(--text)] tracking-tight">ShopEasy AI</p>
                    <span className="px-1.5 py-0.2 bg-brand-500/20 text-brand-400 text-[9px] font-bold rounded-md uppercase">PRO</span>
                  </div>
                  <p className="text-[11px] text-green-500 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                    Online Assistant
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMessages([BOT_INTRO])}
                  className="p-2 text-gray-400 hover:text-[var(--text)] hover:bg-dark-surface2 rounded-xl transition-colors"
                  title="Reset Conversation"
                >
                  <RefreshCw size={15} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 text-gray-400 hover:text-[var(--text)] hover:bg-dark-surface2 rounded-xl transition-colors"
                  title="Close Chat"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Quick Action Chips */}
            <div className="px-4 py-2.5 bg-dark-surface2/50 border-b border-dark-border flex gap-2 overflow-x-auto no-scrollbar">
              {QUICK_CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  className="text-xs px-3 py-1.2 bg-dark-surface1 border border-dark-border rounded-full text-gray-300 hover:border-brand-500/60 hover:text-brand-500 transition-all flex-shrink-0 font-medium"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {msg.imagePreview && (
                    <img
                      src={msg.imagePreview}
                      alt="User attachment"
                      className="w-36 h-36 object-cover rounded-2xl border border-brand-500/40 mb-1.5 shadow-md"
                    />
                  )}

                  <div className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[88%] shadow-xs whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-brand-500 to-purple-600 text-white rounded-tr-xs font-medium'
                      : 'bg-dark-surface2 border border-dark-border text-[var(--text)] rounded-tl-xs'
                  }`}>
                    {msg.text}
                  </div>

                  {/* Single Product Details Card */}
                  {msg.singleProduct && (
                    <div className="mt-3 p-3.5 bg-dark-surface2 border border-dark-border rounded-2xl w-full shadow-md">
                      <div className="flex gap-3">
                        <img
                          src={msg.singleProduct.imageUrl}
                          alt={msg.singleProduct.name}
                          className="w-20 h-20 object-cover rounded-xl border border-dark-border flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-sm text-[var(--text)] truncate">{msg.singleProduct.name}</h5>
                          <p className="text-xs font-bold text-brand-500 mt-0.5">{formatCurrency(msg.singleProduct.price)}</p>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-400">
                            <Star size={12} className="fill-amber-400" />
                            <span className="font-bold">{msg.singleProduct.rating || 4.8}</span>
                            <span className="text-gray-400">({msg.singleProduct.reviewCount || 18} reviews)</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-dark-border">
                        <button
                          onClick={() => navigate(`/products/${msg.singleProduct.id}`)}
                          className="flex-1 py-1.5 bg-dark-surface1 hover:bg-dark-border text-gray-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors"
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          onClick={() => dispatch(addToCart({ product: msg.singleProduct, quantity: 1 }))}
                          className="flex-1 py-1.5 bg-brand-500/10 hover:bg-brand-500 text-brand-500 hover:text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors border border-brand-500/20"
                        >
                          <ShoppingCart size={13} /> Add to Cart
                        </button>
                        <button
                          onClick={() => dispatch(toggleWishlist(msg.singleProduct))}
                          className="p-1.5 bg-dark-surface1 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-xl transition-colors border border-dark-border"
                          title="Wishlist"
                        >
                          <Heart size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Standard Relevant Product Cards Grid (Same Category ONLY) */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-2.5 grid grid-cols-1 gap-2.5 w-full">
                      {msg.products.map(product => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 p-3 bg-dark-surface2 border border-dark-border rounded-2xl hover:border-brand-500/40 transition-all shadow-xs"
                        >
                          <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0 border border-dark-border" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate text-[var(--text)]">{product.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-bold text-brand-500">{formatCurrency(product.price)}</span>
                              <span className="text-[10px] text-amber-400 flex items-center gap-0.5 font-semibold">
                                <Star size={10} className="fill-amber-400" />
                                {product.rating || 4.8}
                                <span className="text-gray-400 ml-0.5">({product.reviewCount || 18})</span>
                              </span>
                            </div>
                            {product.recommendReason && (
                              <p className="text-[10px] text-brand-400 mt-0.5 font-medium truncate">
                                ✨ {product.recommendReason}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => navigate(`/products/${product.id}`)}
                              className="p-2 bg-dark-surface1 hover:bg-dark-border text-gray-300 rounded-xl transition-colors"
                              title="View Product"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => dispatch(addToCart({ product, quantity: 1 }))}
                              className="p-2 bg-brand-500/10 hover:bg-brand-500 text-brand-500 hover:text-white rounded-xl transition-all"
                              title="Add to Cart"
                            >
                              <ShoppingCart size={14} />
                            </button>
                            <button
                              onClick={() => dispatch(toggleWishlist(product))}
                              className="p-2 bg-dark-surface1 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-xl transition-colors"
                              title="Wishlist"
                            >
                              <Heart size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Product Comparison Cards */}
                  {msg.comparisonPair && msg.comparisonPair.length >= 2 && (
                    <div className="mt-3 grid grid-cols-2 gap-2 w-full">
                      {msg.comparisonPair.map((prod, idx) => (
                        <div key={prod.id} className="p-3 bg-dark-surface2 border border-dark-border rounded-2xl flex flex-col">
                          <img src={prod.imageUrl} alt={prod.name} className="w-full h-20 object-cover rounded-xl mb-2" />
                          <span className="text-[10px] font-bold text-brand-400 uppercase">Option {idx + 1}</span>
                          <h6 className="font-bold text-xs text-[var(--text)] truncate">{prod.name}</h6>
                          <p className="text-xs font-bold text-brand-500 mt-1">{formatCurrency(prod.price)}</p>
                          <p className="text-[11px] text-amber-400 flex items-center gap-1 mt-0.5">
                            <Star size={10} className="fill-amber-400" /> {prod.rating || 4.8}★
                          </p>
                          <button
                            onClick={() => dispatch(addToCart({ product: prod, quantity: 1 }))}
                            className="mt-2.5 w-full py-1 bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-bold rounded-xl transition-colors"
                          >
                            Add to Cart
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Order Tracking Cards */}
                  {msg.orderCards && msg.orderCards.length > 0 && (
                    <div className="mt-3 space-y-2 w-full">
                      {msg.orderCards.map(order => {
                        const statusConf = getStatusConfig(order.status);
                        return (
                          <div key={order.id} className="p-3 bg-dark-surface2 border border-dark-border rounded-2xl flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-[var(--text)]">Order #{order.id}</span>
                                <span className="text-[10px] px-2 py-0.5 bg-brand-500/10 text-brand-500 rounded-full font-semibold">
                                  {statusConf.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400 mt-1">{formatCurrency(order.totalAmount)} • {order.items?.length || 1} item(s)</p>
                            </div>
                            <button
                              onClick={() => navigate('/orders')}
                              className="px-3 py-1.5 bg-brand-500 text-white text-xs font-bold rounded-xl hover:bg-brand-600 transition-colors flex items-center gap-1"
                            >
                              Track <ArrowRight size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Suggestion Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.suggestions.map(sugg => (
                        <button
                          key={sugg}
                          onClick={() => sendMessage(sugg)}
                          className="text-[11px] px-2.5 py-1 bg-dark-surface2 border border-dark-border text-brand-400 hover:border-brand-500 rounded-full transition-all"
                        >
                          {sugg}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
                </div>
              ))}

              {loading && (
                <div className="self-start bg-dark-surface2 border border-dark-border rounded-2xl rounded-tl-xs px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400 font-medium mr-1">ShopEasy AI is searching</span>
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input Controls */}
            <div className="border-t border-dark-border bg-dark-surface2/90 backdrop-blur-md">
              {selectedImage && (
                <div className="px-4 pt-2.5 pb-1 flex items-center gap-2 bg-dark-surface1 border-b border-dark-border">
                  <div className="relative group">
                    <img
                      src={selectedImage}
                      alt="Attachment"
                      className="w-12 h-12 object-cover rounded-xl border border-brand-500/50 shadow-xs"
                    />
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md hover:bg-red-600 transition-colors"
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                  <span className="text-xs text-gray-300 font-medium">Image attached</span>
                </div>
              )}

              <div className="flex items-center gap-2 p-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />

                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                    isListening
                      ? 'bg-red-500/20 text-red-500 border border-red-500/50 animate-pulse'
                      : 'bg-dark-surface1 text-gray-400 hover:text-brand-500 border border-dark-border hover:border-brand-500/40'
                  }`}
                  title="Voice Input"
                >
                  <Mic size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-dark-surface1 text-gray-400 hover:text-brand-500 border border-dark-border hover:border-brand-500/40 transition-all"
                  title="Upload Image"
                >
                  <ImageIcon size={16} />
                </button>

                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={isListening ? "Listening... Speak now..." : "Ask AI or search products..."}
                  className="flex-1 min-w-0 bg-dark-surface1 border border-dark-border rounded-xl px-3.5 py-2 text-xs text-[var(--text)] placeholder-gray-400 outline-none focus:border-brand-500/60 transition-colors"
                />

                <button
                  type="button"
                  onClick={() => sendMessage()}
                  disabled={(!input.trim() && !selectedImage) || loading}
                  className="w-9 h-9 bg-gradient-to-br from-brand-500 to-purple-600 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all flex-shrink-0 shadow-md shadow-brand-500/20"
                  title="Send Message"
                >
                  <Send size={15} className="text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(o => !o)}
        className="chat-toggle w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/40 text-white z-50 cursor-pointer"
        aria-label="Open AI chat"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </motion.button>
    </div>
  );
});

ChatBot.displayName = 'ChatBot';
export default ChatBot;
