
// ── Business features (bundled into app.jsx) ─────────────────
class ProductErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (this.state.err) {
      return (
        <div className="page">
          <div className="empty-state">
            <Icon name="x" size={48} />
            <h3>Could not load product page</h3>
            <p style={{ color: 'var(--text2)', maxWidth: 400 }}>Something went wrong displaying this product. Try refreshing or edit the product in admin mode.</p>
            <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={this.props.goHome}>Back to Home</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ThemeScope({ siteTheme, brandTheme, productTheme, children, className }) {
  const style = NEXUS.themeToCssVars(NEXUS.mergeTheme(siteTheme, brandTheme, productTheme));
  return <div className={`theme-scope ${className || ''}`} style={style}>{children}</div>;
}

function ThemeEditor({ theme, onChange, label }) {
  const t = { ...NEXUS.DEFAULT_THEME, ...(theme || {}) };
  const set = (key, val) => onChange({ ...(theme || {}), [key]: val });
  const reset = () => onChange({});
  return (
    <div className="theme-editor">
      {label && <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 12 }}>{label}</p>}
      <div className="theme-editor-grid">
        {NEXUS.THEME_KEYS.map((key) => (
          <div key={key} className="form-group">
            <label className="form-label">{key}</label>
            <div className="theme-color-row">
              <input type="color" value={t[key] || NEXUS.DEFAULT_THEME[key]} onChange={e => set(key, e.target.value)} />
              <input className="form-input" value={theme?.[key] || ''} placeholder={`Default ${NEXUS.DEFAULT_THEME[key]}`} onChange={e => set(key, e.target.value)} />
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-secondary btn-sm" onClick={reset}>Reset to default theme</button>
    </div>
  );
}

function ReportsAdminPage({ isAdmin, goHome }) {
  const [filter, setFilter] = useState('all');
  const [reports, setReports] = useState(() => LS.get('nexus_reports', []));
  const notify = useNotif();

  const refresh = () => setReports(LS.get('nexus_reports', []));
  const filtered = reports.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'bugs') return r.type === 'bug' || r.type === 'report';
    if (filter === 'suggestions') return r.type === 'suggestion' || r.type === 'suggest';
    return true;
  });

  const remove = (id) => {
    const next = reports.filter((r) => r.id !== id);
    LS.set('nexus_reports', next);
    setReports(next);
    notify('Report removed');
  };

  if (!isAdmin) {
    return (
      <div className="page">
        <div className="empty-state"><Icon name="admin" size={48} /><h3>Admin only</h3><p>Log in as admin to view submitted reports.</p></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="breadcrumb"><span onClick={goHome}>Home</span><span className="sep">/</span><span className="current">Reports Inbox</span></div>
      <div className="section-header">
        <div className="section-title">Help & Reports Inbox ({filtered.length})</div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={refresh}>Refresh</button>
      </div>
      <div className="tabs" style={{ marginBottom: 20 }}>
        {[['all', 'All'], ['bugs', 'Bugs'], ['suggestions', 'Brand requests']].map(([k, l]) => (
          <div key={k} className={`tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{l}</div>
        ))}
      </div>
      {filtered.length === 0
        ? <div className="empty-state"><Icon name="help" size={48} /><h3>No reports yet</h3><p>User submissions from Help & Reports appear here.</p></div>
        : filtered.slice().reverse().map((r) => (
          <div key={r.id || r.date} className="info-card report-inbox-item">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <span className="chip">{r.type || 'report'}</span>
              {r.name && <span style={{ color: 'var(--text2)' }}>{r.name}</span>}
              {r.email && <span style={{ color: 'var(--text3)', fontSize: 13 }}>{r.email}</span>}
              <span style={{ color: 'var(--text3)', marginLeft: 'auto', fontSize: 12 }}>{r.date ? new Date(r.date).toLocaleString() : ''}</span>
            </div>
            <p style={{ color: 'var(--text2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{r.message}</p>
            <button type="button" className="btn btn-danger btn-sm" style={{ marginTop: 12 }} onClick={() => remove(r.id)}>Delete</button>
          </div>
        ))}
    </div>
  );
}

function CookieConsent({ goPrivacy }) {
  const [show, setShow] = useState(() => !LS.get('nexus_cookie_ok', false));
  if (!show) return null;
  return (
    <div className="cookie-banner">
      <p>We use local storage for wishlists, analytics, and preferences. No third-party ad cookies yet.</p>
      <div className="cookie-actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={goPrivacy}>Privacy</button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => { LS.set('nexus_cookie_ok', true); setShow(false); NEXUS.trackEvent('cookie_accept'); }}>Accept</button>
      </div>
    </div>
  );
}

function ProductFiltersBar({ filters, setFilters, brands }) {
  return (
    <div className="filter-bar">
      <select className="form-input" value={filters.category || ''} onChange={e => setFilters({ ...filters, category: e.target.value })}>
        <option value="">All categories</option>
        {NEXUS.CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select className="form-input" value={filters.brandId || ''} onChange={e => setFilters({ ...filters, brandId: e.target.value })}>
        <option value="">All brands</option>
        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <input className="form-input" placeholder="Min price" value={filters.minPrice || ''} onChange={e => setFilters({ ...filters, minPrice: e.target.value })} />
      <input className="form-input" placeholder="Max price" value={filters.maxPrice || ''} onChange={e => setFilters({ ...filters, maxPrice: e.target.value })} />
      <select className="form-input" value={filters.sort || 'newest'} onChange={e => setFilters({ ...filters, sort: e.target.value })}>
        <option value="newest">Newest</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
        <option value="name">Name A–Z</option>
      </select>
      <label className="filter-check"><input type="checkbox" checked={!!filters.sponsoredOnly} onChange={e => setFilters({ ...filters, sponsoredOnly: e.target.checked })} /> Sponsored only</label>
    </div>
  );
}

function NewsletterBlock() {
  const [email, setEmail] = useState('');
  const notify = useNotif();
  const submit = (e) => {
    e.preventDefault();
    if (!email.includes('@')) { notify('Enter a valid email.', 'error'); return; }
    const list = LS.get('nexus_subscribers', []);
    if (!list.includes(email)) list.push(email);
    LS.set('nexus_subscribers', list);
    NEXUS.trackEvent('newsletter_signup', { email });
    setEmail('');
    notify('You are on the list! We will email you when alerts go live.');
  };
  return (
    <div className="newsletter-block">
      <h3>Stay ahead</h3>
      <p>Get new products, price drops, and featured brands. (Stored locally until email service is connected.)</p>
      <form className="newsletter-form" onSubmit={submit}>
        <input className="form-input" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        <button type="submit" className="btn btn-primary">Subscribe</button>
      </form>
    </div>
  );
}

function DiscoverPage({ products, brands, filters, setFilters, goProduct, isAdmin, deleteProduct, wishlist, toggleWishlist, compareIds, toggleCompare }) {
  const filtered = useMemo(() => NEXUS.filterProducts(products, { ...filters, query: filters.query || '' }), [products, filters]);
  return (
    <div className="page">
      <div className="section-title" style={{ marginBottom: 16 }}>Discover products</div>
      <ProductFiltersBar filters={filters} setFilters={setFilters} brands={brands} />
      <p style={{ color: 'var(--text3)', fontSize: 14, margin: '12px 0 20px' }}>{filtered.length} products</p>
      {filtered.length === 0
        ? <div className="empty-state"><Icon name="search" size={48} /><h3>No products match</h3><p>Try clearing filters.</p></div>
        : <div className="product-grid">{filtered.map((p, i) => (
          <ProductCard key={p.id} product={p} isAdmin={isAdmin} onClick={() => goProduct(p)} onDelete={() => deleteProduct(p.id)}
            delay={i * 0.03} wishlisted={wishlist.includes(p.id)} onWishlist={() => toggleWishlist(p.id)}
            inCompare={compareIds.includes(p.id)} onCompare={() => toggleCompare(p.id)} compareDisabled={!compareIds.includes(p.id) && compareIds.length >= 4} />
        ))}</div>}
    </div>
  );
}

function WishlistPage({ products, wishlist, goProduct, isAdmin, deleteProduct, toggleWishlist, compareIds, toggleCompare }) {
  const items = products.filter(p => wishlist.includes(p.id));
  return (
    <div className="page">
      <div className="section-title" style={{ marginBottom: 24 }}>My wishlist ({items.length})</div>
      {items.length === 0
        ? <div className="empty-state"><Icon name="star" size={48} /><h3>Wishlist is empty</h3><p>Tap the heart on any product to save it here.</p></div>
        : <div className="product-grid">{items.map((p, i) => (
          <ProductCard key={p.id} product={p} isAdmin={isAdmin} onClick={() => goProduct(p)} onDelete={() => deleteProduct(p.id)}
            delay={i * 0.04} wishlisted onWishlist={() => toggleWishlist(p.id)} inCompare={compareIds.includes(p.id)} onCompare={() => toggleCompare(p.id)} compareDisabled={!compareIds.includes(p.id) && compareIds.length >= 4} />
        ))}</div>}
    </div>
  );
}

function ComparePage({ products, compareIds, goProduct, clearCompare }) {
  const items = products.filter(p => compareIds.includes(p.id));
  const specKeys = [...new Set(items.flatMap(p => Object.keys(p.specs || {})))];
  return (
    <div className="page">
      <div className="section-header">
        <div className="section-title">Compare products ({items.length}/4)</div>
        {items.length > 0 && <button type="button" className="btn btn-secondary btn-sm" onClick={clearCompare}>Clear all</button>}
      </div>
      {items.length < 2
        ? <div className="empty-state"><Icon name="guidelines" size={48} /><h3>Add at least 2 products</h3><p>Use &quot;Compare&quot; on product cards (max 4).</p></div>
        : (
          <div className="compare-wrap">
            <table className="compare-table">
              <thead><tr><th>Feature</th>{items.map(p => <th key={p.id}><button type="button" className="linkish" onClick={() => goProduct(p)}>{p.name}</button></th>)}</tr></thead>
              <tbody>
                <tr><td>Brand</td>{items.map(p => <td key={p.id}>{p.brandName || '—'}</td>)}</tr>
                <tr><td>Category</td>{items.map(p => <td key={p.id}>{p.category || '—'}</td>)}</tr>
                <tr><td>Price</td>{items.map(p => <td key={p.id}>{p.price ? `${p.priceCurrency || '$'} ${p.price}` : '—'}</td>)}</tr>
                <tr><td>Rating</td>{items.map(p => <td key={p.id}>{NEXUS.avgRating(p.id) ? `${NEXUS.avgRating(p.id).toFixed(1)} ★` : '—'}</td>)}</tr>
                {specKeys.map(k => (
                  <tr key={k}><td>{k}</td>{items.map(p => <td key={p.id}>{(p.specs || {})[k] || '—'}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

function ProductReviews({ productId, isAdmin }) {
  const [reviews, setReviews] = useState(() => NEXUS.getReviews(productId));
  const [name, setName] = useState(() => LS.get('nexus_user', {})?.name || '');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const notify = useNotif();
  const refresh = () => setReviews(NEXUS.getReviews(productId));
  const approved = reviews.filter(r => r.approved);
  const pending = reviews.filter(r => !r.approved);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    NEXUS.addReview(productId, { name: name || 'Guest', rating, text: text.trim() });
    NEXUS.trackEvent('review_submit', { productId });
    setText('');
    refresh();
    notify('Review submitted — visible after admin approval.');
  };

  return (
    <div className="detail-section">
      <h3><Icon name="star" size={16} />Reviews {NEXUS.avgRating(productId) ? `(${NEXUS.avgRating(productId).toFixed(1)} ★)` : ''}</h3>
      {approved.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 12 }}>No approved reviews yet.</p>}
      {approved.map(r => (
        <div key={r.id} className="review-item">
          <div className="review-meta"><strong>{r.name}</strong> <span>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span> <span style={{ color: 'var(--text3)', fontSize: 12 }}>{new Date(r.at).toLocaleDateString()}</span></div>
          <p>{r.text}</p>
        </div>
      ))}
      <form className="review-form" onSubmit={submit}>
        <div className="form-row">
          <input className="form-input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
          <select className="form-input" value={rating} onChange={e => setRating(+e.target.value)}>
            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} stars</option>)}
          </select>
        </div>
        <textarea className="form-input" rows={3} placeholder="Share your experience..." value={text} onChange={e => setText(e.target.value)} />
        <button type="submit" className="btn btn-primary btn-sm">Submit review</button>
      </form>
      {isAdmin && pending.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--gold)', marginBottom: 8 }}>Pending approval ({pending.length})</div>
          {pending.map(r => (
            <div key={r.id} className="review-item review-pending">
              <p>{r.text}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => { NEXUS.approveReview(productId, r.id); refresh(); notify('Review approved'); }}>Approve</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => { NEXUS.deleteReview(productId, r.id); refresh(); }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PriceHistoryBlock({ productId, product }) {
  const history = NEXUS.getPriceHistory(productId);
  if (history.length < 2) return null;
  return (
    <div className="detail-section">
      <h3><Icon name="guidelines" size={16} />Price history</h3>
      <ul className="price-history-list">
        {history.slice().reverse().slice(0, 8).map((h, i) => (
          <li key={i}><span>{new Date(h.at).toLocaleDateString()}</span><span>{h.currency || '$'} {h.price}</span></li>
        ))}
      </ul>
    </div>
  );
}

function PrivacyPage({ goHome }) {
  return (
    <div className="page legal-page">
      <div className="breadcrumb"><span onClick={goHome}>Home</span><span className="sep">/</span><span className="current">Privacy Policy</span></div>
      <div className="info-card">
        <h2>Privacy Policy</h2>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <p>NEXUS stores wishlists, compare lists, reviews, and analytics in your browser (localStorage) until a cloud database is connected. We do not sell personal data.</p>
        <p>When you subscribe to updates, your email is stored locally for export by the site owner. Affiliate links may send you to third-party stores with their own policies.</p>
        <p>Contact us via the Contact page for data questions or deletion requests.</p>
      </div>
    </div>
  );
}

function TermsPage({ goHome }) {
  return (
    <div className="page legal-page">
      <div className="breadcrumb"><span onClick={goHome}>Home</span><span className="sep">/</span><span className="current">Terms of Use</span></div>
      <div className="info-card">
        <h2>Terms of Use</h2>
        <p>NEXUS is an information and discovery platform. We do not sell products or process payments.</p>
        <p>Purchase links redirect to third parties (Amazon, Flipkart, brand sites). All transactions are between you and the seller.</p>
        <p>Product data may contain errors. Sponsored listings are labeled. Use of this site is at your own risk.</p>
      </div>
    </div>
  );
}

function ForBrandsPage({ goHome, settings }) {
  return (
    <div className="page">
      <div className="breadcrumb"><span onClick={goHome}>Home</span><span className="sep">/</span><span className="current">For Brands</span></div>
      <div className="about-hero">
        <h1>Partner with {settings.siteName || 'NEXUS'}</h1>
        <p style={{ color: 'var(--text2)', maxWidth: 560, margin: '16px auto 0', lineHeight: 1.7 }}>
          Verified brand profiles, featured placement, 3D product showcases, and click analytics — built for discovery, not checkout.
        </p>
      </div>
      <div className="feature-grid">
        {[
          { t: 'Verified profile', d: 'Official logo, company stats, and trusted badge on listings.' },
          { t: 'Featured & sponsored', d: 'Highlight launches in Discover and home sections.' },
          { t: 'Analytics', d: 'See product views and outbound store clicks (admin dashboard).' },
          { t: 'Affiliate-ready', d: 'Amazon tag and store links configured in site settings.' },
        ].map((x, i) => (
          <div key={i} className="feature-card"><h3>{x.t}</h3><p>{x.d}</p></div>
        ))}
      </div>
      <div className="info-card" style={{ marginTop: 24 }}>
        <p>Interested? Email <strong>{settings.contactEmail || 'hello@nexus.com'}</strong> with your brand name and catalog size.</p>
      </div>
    </div>
  );
}

function AdminAnalyticsPanel() {
  const summary = NEXUS.getAnalyticsSummary();
  return (
    <div className="info-card" style={{ marginTop: 24 }}>
      <h2><Icon name="guidelines" size={20} />Analytics (this browser)</h2>
      <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 12 }}>Connect Google Analytics or Plausible on Netlify later. Until then, basic events are logged locally.</p>
      <div className="analytics-grid">
        {Object.entries(summary.counts).map(([k, v]) => (
          <div key={k} className="company-stat"><div className="cs-val">{v}</div><div className="cs-label">{k}</div></div>
        ))}
      </div>
      {summary.recent.length > 0 && (
        <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text2)' }}>
          <strong>Recent events</strong>
          <ul style={{ marginTop: 8, paddingLeft: 18 }}>
            {summary.recent.map((e, i) => <li key={i}>{e.type} — {new Date(e.at).toLocaleString()}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
