/**
 * Shared AI Product Matching Engine
 * ---------------------------------
 * Reused by both ChatBot and Main Search Box for consistent, smart product matching.
 * Handles singular/plural stemming, stopword filtering, category detection, and multi-word matching.
 */

// Helper for base token stemming with explicit singular/plural mappings
export function getBaseToken(token) {
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

export const DYNAMIC_STOPWORDS = new Set([
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

// Dynamic Intent & Token Extractor
export function parseShoppingIntent(rawText) {
  if (!rawText) return { queryTokens: [], baseTokens: [], extractedCategory: null, maxPrice: null, rawText: '' };
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

// Generic Head-Entity Database-Driven Product Matching Engine
export function strictFilterProducts(allProducts, rawText, options = {}) {
  const { ignorePriceFilter = false } = options;
  const intent = parseShoppingIntent(rawText);
  const { queryTokens, baseTokens, extractedCategory, maxPrice } = intent;

  const queryLabel = queryTokens.join(' ');

  if (!allProducts || allProducts.length === 0 || queryTokens.length === 0) {
    return {
      strictMatches: [],
      exactFound: false,
      intent,
      message: `Sorry, I couldn't find any relevant products on ShopEasy.`
    };
  }

  // STEP 1: MATCH EXTRACTED KEYWORDS AGAINST PRODUCT NAME AND CATEGORY NAME
  const matches = allProducts.filter(p => {
    const pName = (p.name || '').toLowerCase();
    const pCat  = (p.categoryName || p.category?.name || '').toLowerCase();
    const pDesc = (p.description || '').toLowerCase();

    // Every keyword in queryTokens (or baseToken) must match in pName, pCat, or pDesc
    for (let i = 0; i < queryTokens.length; i++) {
      const token = queryTokens[i];
      const baseToken = baseTokens[i];

      const tokenReg = new RegExp(`\\b${token}s?\\b`, 'i');
      const baseReg  = new RegExp(`\\b${baseToken}s?\\b`, 'i');

      const strictName = tokenReg.test(pName) || baseReg.test(pName);
      const strictCat  = tokenReg.test(pCat) || baseReg.test(pCat);
      const strictDesc = tokenReg.test(pDesc) || baseReg.test(pDesc);

      if (token.length >= 4) {
        if (!strictName && !strictCat && !strictDesc) return false;
      } else {
        const inName = strictName || pName.includes(token) || pName.includes(baseToken);
        const inCat  = strictCat  || pCat.includes(token) || pCat.includes(baseToken);
        const inDesc = strictDesc || pDesc.includes(token) || pDesc.includes(baseToken);
        if (!inName && !inCat && !inDesc) return false;
      }
    }
    return true;
  });

  let candidatePool = matches;

  // STEP 2: CATEGORY FILTERING (IF EXPLICITLY EXTRACTED IN QUERY)
  if (extractedCategory) {
    const catLower = extractedCategory.toLowerCase();
    candidatePool = candidatePool.filter(p => {
      const pCat = (p.categoryName || p.category?.name || '').toLowerCase();
      return pCat.includes(catLower) || catLower.includes(pCat);
    });
  }

  // STEP 3: PRICE FILTERING (APPLIED ONLY IF NOT IGNORED)
  if (maxPrice && !ignorePriceFilter) {
    const budgetMatches = candidatePool.filter(p => Number(p.price) <= maxPrice);
    if (budgetMatches.length === 0) {
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

/**
 * Clean helper function for main product search.
 * Ignores price filter overrides from query text to allow separate UI filters.
 */
export function matchProductsByQuery(allProducts, query) {
  if (!query || !query.trim()) return allProducts;
  const result = strictFilterProducts(allProducts, query, { ignorePriceFilter: true });
  return result.strictMatches || [];
}
