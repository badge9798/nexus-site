/* NEXUS core — analytics, routing, filters, reviews, affiliates (no JSX) */
(function (global) {
  const CATEGORIES = [
    'Electronics', 'Fashion', 'Beauty', 'Home', 'Sports',
    'Food & Beverage', 'Automotive', 'Health', 'Toys', 'Other',
  ];

  function trackEvent(type, payload) {
    try {
      const key = 'nexus_analytics';
      const log = JSON.parse(localStorage.getItem(key) || '[]');
      log.push({ type, payload: payload || {}, at: new Date().toISOString() });
      if (log.length > 5000) log.splice(0, log.length - 5000);
      localStorage.setItem(key, JSON.stringify(log));
    } catch (_) {}
  }

  function getAnalyticsSummary() {
    const log = JSON.parse(localStorage.getItem('nexus_analytics') || '[]');
    const counts = {};
    log.forEach((e) => { counts[e.type] = (counts[e.type] || 0) + 1; });
    return { total: log.length, counts, recent: log.slice(-20).reverse() };
  }

  function applyAffiliateUrl(url, settings) {
    if (!url || url === '#') return url;
    try {
      const u = new URL(url, window.location.origin);
      const tag = settings?.amazonAffiliateTag;
      if (tag && /amazon\./i.test(u.hostname) && !u.searchParams.has('tag')) {
        u.searchParams.set('tag', tag);
      }
      return u.toString();
    } catch (_) {
      return url;
    }
  }

  function filterProducts(products, filters) {
    let list = [...products];
    const q = (filters.query || '').trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        p.name?.toLowerCase().includes(q) ||
        p.brandName?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }
    if (filters.category) list = list.filter((p) => p.category === filters.category);
    if (filters.brandId) list = list.filter((p) => p.brandId === filters.brandId);
    if (filters.sponsoredOnly) list = list.filter((p) => p.sponsored);
    if (filters.minPrice != null && filters.minPrice !== '') {
      const min = parseFloat(String(filters.minPrice).replace(/,/g, ''));
      if (!isNaN(min)) list = list.filter((p) => parsePrice(p.price) >= min);
    }
    if (filters.maxPrice != null && filters.maxPrice !== '') {
      const max = parseFloat(String(filters.maxPrice).replace(/,/g, ''));
      if (!isNaN(max)) list = list.filter((p) => parsePrice(p.price) <= max);
    }
  const sort = filters.sort || 'newest';
    if (sort === 'price-asc') list.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    else if (sort === 'price-desc') list.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    else if (sort === 'name') list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else list.sort((a, b) => (b.updatedAt || b.id || '').localeCompare(a.updatedAt || a.id || ''));
    return list;
  }

  function parsePrice(price) {
    if (price == null || price === '') return NaN;
    return parseFloat(String(price).replace(/[^0-9.]/g, '')) || NaN;
  }

  function recordPrice(productId, price, currency) {
    const key = 'nexus_price_history';
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    if (!all[productId]) all[productId] = [];
    all[productId].push({ price, currency, at: new Date().toISOString() });
    if (all[productId].length > 30) all[productId] = all[productId].slice(-30);
    localStorage.setItem(key, JSON.stringify(all));
  }

  function getPriceHistory(productId) {
    const all = JSON.parse(localStorage.getItem('nexus_price_history') || '{}');
    return all[productId] || [];
  }

  function getReviews(productId) {
    const all = JSON.parse(localStorage.getItem('nexus_reviews') || '{}');
    return all[productId] || [];
  }

  function addReview(productId, review) {
    const all = JSON.parse(localStorage.getItem('nexus_reviews') || '{}');
    if (!all[productId]) all[productId] = [];
    all[productId].unshift({
      id: Date.now().toString(),
      ...review,
      at: new Date().toISOString(),
      approved: false,
    });
    localStorage.setItem('nexus_reviews', JSON.stringify(all));
  }

  function approveReview(productId, reviewId) {
    const all = JSON.parse(localStorage.getItem('nexus_reviews') || '{}');
    (all[productId] || []).forEach((r) => {
      if (r.id === reviewId) r.approved = true;
    });
    localStorage.setItem('nexus_reviews', JSON.stringify(all));
  }

  function deleteReview(productId, reviewId) {
    const all = JSON.parse(localStorage.getItem('nexus_reviews') || '{}');
    all[productId] = (all[productId] || []).filter((r) => r.id !== reviewId);
    localStorage.setItem('nexus_reviews', JSON.stringify(all));
  }

  function avgRating(productId) {
    const approved = getReviews(productId).filter((r) => r.approved);
    if (!approved.length) return null;
    return approved.reduce((s, r) => s + (r.rating || 0), 0) / approved.length;
  }

  function parseHash() {
    const raw = (location.hash || '#home').replace(/^#/, '');
    const parts = raw.split('/').filter(Boolean);
    const page = parts[0] || 'home';
    const id = parts[1] != null && parts[1] !== '' ? String(parts[1]) : null;
    return { page, id };
  }

  function findById(list, id) {
    if (id == null) return null;
    const sid = String(id);
    return list.find((x) => String(x.id) === sid) || null;
  }

  function setHash(page, id) {
    const next = id ? `#${page}/${id}` : `#${page}`;
    if (location.hash !== next) location.hash = next;
  }

  function usePageMeta(title, description) {
    if (title) document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    if (description) meta.content = description;
  }

  function exportSiteData(brands, products, settings) {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      brands,
      products,
      settings,
      subscribers: JSON.parse(localStorage.getItem('nexus_subscribers') || '[]'),
      analytics: JSON.parse(localStorage.getItem('nexus_analytics') || '[]'),
    }, null, 2);
  }

  function enrichProduct(p) {
    const out = {
      category: 'Other',
      sponsored: false,
      verified: false,
      updatedAt: new Date().toISOString(),
      ...p,
    };
    if (out.ingredients && !Array.isArray(out.ingredients)) out.ingredients = [];
    if (out.specs && typeof out.specs !== 'object') out.specs = {};
    if (out.purchaseLinks && !Array.isArray(out.purchaseLinks)) out.purchaseLinks = [];
    return out;
  }

  const DEFAULT_THEME = {
    accent: '#6c63ff',
    accent2: '#ff6b6b',
    accent3: '#00d4ff',
    bg: '#080a12',
    bg2: '#0d1020',
    text: '#f0f2ff',
    gold: '#ffd700',
  };

  const THEME_KEYS = ['accent', 'accent2', 'accent3', 'bg', 'bg2', 'text', 'gold'];

  function mergeTheme(siteTheme, brandTheme, productTheme) {
    return { ...DEFAULT_THEME, ...(siteTheme || {}), ...(brandTheme || {}), ...(productTheme || {}) };
  }

  function themeToCssVars(theme) {
    const t = { ...DEFAULT_THEME, ...(theme || {}) };
    const style = {};
    THEME_KEYS.forEach((k) => { if (t[k]) style['--' + k] = t[k]; });
    return style;
  }

  function sanitizeForStorage(item) {
    const copy = { ...item };
    if (copy.modelUrl && copy.modelUrl.length > 400000) {
      copy.modelUrl = '';
      copy._modelTooLarge = true;
    }
    return copy;
  }

  function compressImageDataUrl(dataUrl, maxW, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        const max = maxW || 900;
        if (w > max) {
          h = Math.round((h * max) / w);
          w = max;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality || 0.78));
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  function compressImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        compressImageDataUrl(e.target.result).then(resolve).catch(reject);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  global.NEXUS = {
    CATEGORIES,
    trackEvent,
    getAnalyticsSummary,
    applyAffiliateUrl,
    filterProducts,
    parsePrice,
    recordPrice,
    getPriceHistory,
    getReviews,
    addReview,
    approveReview,
    deleteReview,
    avgRating,
    parseHash,
    findById,
    setHash,
    usePageMeta,
    exportSiteData,
    enrichProduct,
    DEFAULT_THEME,
    THEME_KEYS,
    mergeTheme,
    themeToCssVars,
    sanitizeForStorage,
    compressImageFile,
    compressImageDataUrl,
  };
})(window);
