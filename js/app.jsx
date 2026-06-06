const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ── Storage helpers (persistent, with backup) ─────────────
const LS = {
  get: (k, def) => {
    try {
      const v = localStorage.getItem(k);
      if (v) return JSON.parse(v);
    } catch (e) {
      console.warn('LS read failed:', k, e);
    }
    try {
      const b = localStorage.getItem(k + '_backup');
      if (b) return JSON.parse(b);
    } catch (_) {}
    return def;
  },
  set: (k, v) => {
    try {
      const s = JSON.stringify(v);
      localStorage.setItem(k, s);
      try { localStorage.setItem(k + '_backup', s); } catch (_) {}
      return true;
    } catch (e) {
      console.error('LS save failed:', k, e);
      return false;
    }
  },
};

function loadProductsFromStorage() {
  const list = LS.get('nexus_products', []);
  let changed = false;
  const cleaned = list.map((p) => {
    if (p.modelUrl && String(p.modelUrl).startsWith('data:')) {
      changed = true;
      return { ...p, modelUrl: '' };
    }
    return p;
  });
  if (changed) LS.set('nexus_products', cleaned);
  return cleaned;
}

// ── Icons (inline SVG) ─────────────────────────────────────
const Icon = ({ name, size = 18, className = '' }) => {
  const icons = {
    home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>,
    brands: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    search: <><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path strokeLinecap="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    help: <><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth={3}/></>,
    about: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></>,
    contact: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    edit: <><path strokeLinecap="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path strokeLinecap="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path strokeLinecap="round" d="M19 6l-1 14H6L5 6m5 0V4h4v2"/></>,
    arrow: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    menu: <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    chevron: <polyline points="6 9 12 15 18 9"/>,
    chevronup: <polyline points="18 15 12 9 6 15"/>,
    box: <><path strokeLinecap="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
    upload: <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></>,
    globe: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path strokeLinecap="round" d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>,
    admin: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    external: <><path strokeLinecap="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>,
    guidelines: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
    cube: <><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></>,
    building: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      {icons[name] || null}
    </svg>
  );
};

// ── 3D Viewer Component ────────────────────────────────────
const ThreeViewer = ({ modelUrl }) => {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const frameRef = useRef(null);
  const modelRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const el = mountRef.current;
    const url = modelUrl && String(modelUrl).trim();
    if (!el || !url) return;
    setLoaded(false);
    setError(null);

    const w = el.clientWidth || 400;
    const h = el.clientHeight || 400;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1020);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 1000);
    camera.position.set(0, 1, 3);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    el.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.5);
    dir.position.set(5, 10, 5);
    dir.castShadow = true;
    scene.add(dir);
    const fill = new THREE.PointLight(0x6c63ff, 1, 20);
    fill.position.set(-3, 2, -3);
    scene.add(fill);
    const rim = new THREE.PointLight(0x00d4ff, 0.8, 20);
    rim.position.set(3, -1, 3);
    scene.add(rim);

    // Grid
    const grid = new THREE.GridHelper(10, 20, 0x1e2440, 0x1e2440);
    grid.position.y = -1.2;
    scene.add(grid);

    // Controls
    if (THREE.OrbitControls) {
      const controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enableZoom = true;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.5;
      controlsRef.current = controls;
    }

    // Load model directly from URL (CDN / hosted .glb)
    if (!THREE.GLTFLoader) {
      setError('3D viewer could not load. Please refresh the page.');
      return () => {
        cancelAnimationFrame(frameRef.current);
        if (rendererRef.current?.domElement?.parentNode) {
          rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current?.dispose();
        rendererRef.current = null;
      };
    }
    const loader = new THREE.GLTFLoader();
    loader.crossOrigin = 'anonymous';

    loader.load(url, (gltf) => {
      const model = gltf.scene;
      // Center + scale
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      model.scale.setScalar(scale);
      model.position.sub(center.multiplyScalar(scale));
      model.position.y += 0.1;
      scene.add(model);
      modelRef.current = model;
      setLoaded(true);
    }, undefined, (err) => {
      console.error('GLB load error', err);
      setError('Failed to load 3D model from URL. Check the link and CORS on the host.');
    });

    // Animate
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      const w2 = el.clientWidth, h2 = el.clientHeight;
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(frameRef.current);
      if (rendererRef.current) {
        const dom = rendererRef.current.domElement;
        if (dom && dom.parentNode) dom.parentNode.removeChild(dom);
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      ro.disconnect();
    };
  }, [modelUrl]);

  const hasUrl = !!(modelUrl && String(modelUrl).trim());

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      {!loaded && !error && hasUrl && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text3)', pointerEvents: 'none' }}>
          <div className="loader" />
          <span style={{ fontSize: 14 }}>Loading 3D model...</span>
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--accent2)' }}>
          <Icon name="x" size={32} />
          <span style={{ fontSize: 14 }}>{error}</span>
        </div>
      )}
      {!hasUrl && (
        <div className="product-3d-upload" style={{ pointerEvents: 'none' }}>
          <Icon name="cube" size={48} />
          <span style={{ fontSize: 14, marginTop: 8 }}>No 3D model URL set</span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>Add a .glb URL in the product editor</span>
        </div>
      )}
    </div>
  );
};

// ── Notifications ──────────────────────────────────────────
const NotifContext = React.createContext(null);
const useNotif = () => React.useContext(NotifContext);

// ── Main App ───────────────────────────────────────────────
function App() {
  // Persistent state
  const [isAdmin, setIsAdmin] = useState(() => LS.get('nexus_admin', false));
  const [brands, setBrands] = useState(() => LS.get('nexus_brands', []));
  const [products, setProducts] = useState(() => loadProductsFromStorage());
  const [siteSettings, setSiteSettings] = useState(() => LS.get('nexus_settings', {
    siteName: 'NEXUS',
    tagline: 'Discover Every Product. From Every Brand.',
    contactEmail: 'hello@nexus.com',
    founderEmail: 'founder@nexus.com',
    phone1: '+91 98765 43210',
    phone2: '+1 555 123 4567',
    twitter: '@nexusdiscovery',
    instagram: '@nexusdiscovery',
    address: 'Bengaluru, Karnataka, India',
    amazonAffiliateTag: '',
    logoUrl: '',
    theme: {},
  }));
  const [wishlist, setWishlist] = useState(() => LS.get('nexus_wishlist', []));
  const [compareIds, setCompareIds] = useState(() => LS.get('nexus_compare', []));
  const [discoverFilters, setDiscoverFilters] = useState({ category: '', brandId: '', minPrice: '', maxPrice: '', sort: 'newest', sponsoredOnly: false });
  const [searchFilters, setSearchFilters] = useState({ category: '', brandId: '', minPrice: '', maxPrice: '', sort: 'newest', sponsoredOnly: false });

  // Navigation (restore from URL hash on first load so refresh works)
  const [page, setPage] = useState(() => NEXUS.parseHash().page);
  const [selectedBrand, setSelectedBrand] = useState(() => {
    const { page: hp, id } = NEXUS.parseHash();
    if ((hp !== 'brand' && hp !== 'company') || !id) return null;
    return NEXUS.findById(LS.get('nexus_brands', []), id);
  });
  const [selectedProduct, setSelectedProduct] = useState(() => {
    const { page: hp, id } = NEXUS.parseHash();
    if (hp !== 'product' || !id) return null;
    return NEXUS.findById(LS.get('nexus_products', []), id);
  });
  const [searchQ, setSearchQ] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [brandsExpanded, setBrandsExpanded] = useState(true);

  // Modals
  const [modal, setModal] = useState(null); // 'addBrand' | 'addProduct' | 'editProduct' | 'editBrand' | 'adminLogin'

  // Notifications
  const [notifs, setNotifs] = useState([]);
  const dismissNotif = useCallback((id) => {
    setNotifs(n => n.filter(x => x.id !== id));
  }, []);
  const notify = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setNotifs(n => [...n, { id, msg, type }]);
    setTimeout(() => dismissNotif(id), 4000);
  }, [dismissNotif]);

  useEffect(() => { LS.set('nexus_brands', brands); }, [brands]);
  useEffect(() => { LS.set('nexus_products', products); }, [products]);
  useEffect(() => { LS.set('nexus_settings', siteSettings); }, [siteSettings]);
  useEffect(() => { LS.set('nexus_admin', isAdmin); }, [isAdmin]);
  useEffect(() => { LS.set('nexus_wishlist', wishlist); }, [wishlist]);
  useEffect(() => { LS.set('nexus_compare', compareIds); }, [compareIds]);

  // Navigate helpers
  const goHome = () => { setPage('home'); setSelectedBrand(null); setSelectedProduct(null); setSearchQ(''); NEXUS.setHash('home'); };
  const goBrand = (b) => { setSelectedBrand(b); setPage('brand'); setSelectedProduct(null); NEXUS.setHash('brand', b.id); };
  const goProduct = (p) => {
    if (!p?.id) return;
    setSelectedProduct(p);
    setPage('product');
    setSearchQ('');
    NEXUS.setHash('product', p.id);
    NEXUS.trackEvent('product_view', { productId: p.id });
  };
  const goCompany = (brandId) => { const b = brands.find(x => x.id === brandId); if (b) { setSelectedBrand(b); setPage('company'); NEXUS.setHash('company', b.id); } };
  const goPage = (p) => {
    setPage(p);
    setSelectedProduct(null);
    setSelectedBrand(null);
    if (window.NEXUS) NEXUS.setHash(p);
  };

  const toggleWishlist = (id) => {
    setWishlist(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]);
    NEXUS.trackEvent('wishlist_toggle', { productId: id });
  };
  const toggleCompare = (id) => {
    setCompareIds(c => {
      if (c.includes(id)) return c.filter(x => x !== id);
      if (c.length >= 4) return c;
      return [...c, id];
    });
    NEXUS.trackEvent('compare_toggle', { productId: id });
  };
  const clearCompare = () => setCompareIds([]);

  useEffect(() => {
    const syncFromHash = () => {
      const { page: hp, id } = NEXUS.parseHash();
      setPage(hp);
      if (hp === 'brand' || hp === 'company') {
        setSelectedBrand(id ? NEXUS.findById(brands, id) : null);
        setSelectedProduct(null);
      } else if (hp === 'product') {
        const p = id ? NEXUS.findById(products, id) : null;
        if (p) setSelectedProduct(p);
        setSelectedBrand(null);
      } else {
        setSelectedBrand(null);
        setSelectedProduct(null);
      }
    };
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [brands, products]);

  useEffect(() => {
    const { page: hp, id } = NEXUS.parseHash();
    if (hp === 'product' && id) {
      const p = NEXUS.findById(products, id);
      if (p) setSelectedProduct(p);
    } else if ((hp === 'brand' || hp === 'company') && id) {
      const b = NEXUS.findById(brands, id);
      if (b) setSelectedBrand(b);
    }
  }, [brands, products]);

  useEffect(() => {
    const titles = {
      home: siteSettings.siteName + ' — Product Discovery',
      discover: 'Discover — ' + siteSettings.siteName,
      wishlist: 'Wishlist — ' + siteSettings.siteName,
      compare: 'Compare — ' + siteSettings.siteName,
      about: 'About — ' + siteSettings.siteName,
      privacy: 'Privacy — ' + siteSettings.siteName,
      terms: 'Terms — ' + siteSettings.siteName,
      brands: 'For Brands — ' + siteSettings.siteName,
    };
    NEXUS.usePageMeta(titles[page] || siteSettings.siteName, siteSettings.tagline);
    NEXUS.trackEvent('page_view', { page });
  }, [page, siteSettings]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQ.trim()) return [];
    return NEXUS.filterProducts(products, { ...searchFilters, query: searchQ });
  }, [searchQ, products, searchFilters]);

  // Save brands/products
  const saveBrand = (data) => {
    const payload = { ...data, id: data.id || Date.now().toString() };
    const isNew = !data.id;
    setBrands(b => {
      const next = isNew ? [...b, payload] : b.map(x => String(x.id) === String(payload.id) ? { ...x, ...payload } : x);
      if (!LS.set('nexus_brands', next)) notify('Could not save brand to storage.', 'error');
      return next;
    });
    setModal(null);
    notify(isNew ? 'Brand added!' : 'Brand updated!');
  };
  const deleteBrand = (id) => {
    if (!confirm('Delete this brand and all its products?')) return;
    setBrands(b => b.filter(x => x.id !== id));
    setProducts(p => p.filter(x => x.brandId !== id));
    if (selectedBrand?.id === id) goHome();
    notify('Brand deleted!', 'error');
  };
  const saveProduct = (data) => {
    const modelUrl = data.modelUrl && !String(data.modelUrl).startsWith('data:')
      ? String(data.modelUrl).trim()
      : '';
    const payload = NEXUS.enrichProduct({
      ...data,
      modelUrl,
      id: data.id || Date.now().toString(),
      updatedAt: new Date().toISOString(),
    });
    const isNew = !data.id;
    setProducts(p => {
      const next = isNew ? [...p, payload] : p.map(x => String(x.id) === String(payload.id) ? { ...x, ...payload } : x);
      if (!LS.set('nexus_products', next)) notify('Could not save product to storage.', 'error');
      return next;
    });
    if (selectedProduct && String(selectedProduct.id) === String(payload.id)) setSelectedProduct(payload);
    if (payload.price) NEXUS.recordPrice(payload.id, payload.price, payload.priceCurrency);
    setModal(null);
    notify(isNew ? 'Product added!' : 'Product saved!');
    if (isNew) setTimeout(() => goProduct(payload), 50);
  };
  const deleteProduct = (id) => {
    if (!confirm('Delete this product?')) return;
    setProducts(p => p.filter(x => x.id !== id));
    if (selectedProduct?.id === id) goHome();
    notify('Product deleted!', 'error');
  };

  // Get fresh product (after edits)
  const getProduct = (id) => NEXUS.findById(products, id) || selectedProduct;
  const getBrand = (id) => NEXUS.findById(brands, id);
  const activeProduct = page === 'product'
    ? (selectedProduct || NEXUS.findById(products, NEXUS.parseHash().id))
    : null;
  const activeBrand = (page === 'brand' || page === 'company')
    ? (selectedBrand || NEXUS.findById(brands, NEXUS.parseHash().id))
    : null;

  const brandProducts = (brandId) => products.filter(p => p.brandId === brandId);

  return (
    <NotifContext.Provider value={notify}>
      <div id="root">
        {/* Sidebar */}
        <div className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
          <div className="sidebar-logo">
            <div className="logo-icon">
              {siteSettings.logoUrl ? <img src={siteSettings.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} /> : 'N'}
            </div>
            <span className="logo-text">{siteSettings.siteName}</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
            <div className="sidebar-section">Navigation</div>
            <div className={`sidebar-item ${page === 'home' && !selectedBrand ? 'active' : ''}`} onClick={goHome}>
              <Icon name="home" size={18} /><span>Home</span>
            </div>
            <div className={`sidebar-item ${page === 'discover' ? 'active' : ''}`} onClick={() => goPage('discover')}>
              <Icon name="search" size={18} /><span>Discover</span>
            </div>
            <div className={`sidebar-item ${page === 'wishlist' ? 'active' : ''}`} onClick={() => goPage('wishlist')}>
              <Icon name="star" size={18} /><span>Wishlist {wishlist.length ? `(${wishlist.length})` : ''}</span>
            </div>
            <div className={`sidebar-item ${page === 'compare' ? 'active' : ''}`} onClick={() => goPage('compare')}>
              <Icon name="guidelines" size={18} /><span>Compare {compareIds.length ? `(${compareIds.length})` : ''}</span>
            </div>
            <div className={`sidebar-item ${page === 'about' ? 'active' : ''}`} onClick={() => goPage('about')}>
              <Icon name="about" size={18} /><span>About Us</span>
            </div>
            <div className={`sidebar-item ${page === 'contact' ? 'active' : ''}`} onClick={() => goPage('contact')}>
              <Icon name="contact" size={18} /><span>Contact Us</span>
            </div>

            <div className="sidebar-divider" />
            <div className="collapse-brands" onClick={() => setBrandsExpanded(e => !e)}>
              <span className="sidebar-section" style={{ padding: 0, margin: 0 }}>Brands ({brands.length})</span>
              <Icon name={brandsExpanded ? 'chevronup' : 'chevron'} size={14} />
            </div>

            {brandsExpanded && (
              <>
                {isAdmin && (
                  <div className="add-btn-sm" onClick={() => setModal('addBrand')}>
                    <Icon name="plus" size={14} />Add Brand
                  </div>
                )}
                {brands.length === 0 && (
                  <div style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text3)' }}>No brands yet</div>
                )}
                {brands.map(b => (
                  <div key={b.id} className={`brand-item ${selectedBrand?.id === b.id ? 'active' : ''}`} onClick={() => goBrand(b)}
                    style={selectedBrand?.id === b.id ? { background: 'var(--bg4)', color: 'var(--text)' } : {}}>
                    <div className="brand-logo-sm">
                      {b.logoUrl ? <img src={b.logoUrl} alt={b.name} /> : b.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ flex: 1 }}>{b.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{brandProducts(b.id).length}</span>
                  </div>
                ))}
              </>
            )}

            <div className="sidebar-divider" />
            <div className="sidebar-section">More</div>
            <div className={`sidebar-item ${page === 'help' ? 'active' : ''}`} onClick={() => goPage('help')}>
              <Icon name="help" size={18} /><span>Help & Reports</span>
            </div>
            {isAdmin && (
              <div className={`sidebar-item ${page === 'reports' ? 'active' : ''}`} onClick={() => goPage('reports')}>
                <Icon name="help" size={18} /><span>Reports Inbox</span>
              </div>
            )}
            <div className={`sidebar-item ${page === 'guidelines' ? 'active' : ''}`} onClick={() => goPage('guidelines')}>
              <Icon name="guidelines" size={18} /><span>Guidelines</span>
            </div>
            <div className={`sidebar-item ${page === 'brands' ? 'active' : ''}`} onClick={() => goPage('brands')}>
              <Icon name="building" size={18} /><span>For Brands</span>
            </div>
            <div className={`sidebar-item ${page === 'privacy' ? 'active' : ''}`} onClick={() => goPage('privacy')}>
              <Icon name="about" size={18} /><span>Privacy</span>
            </div>
            <div className={`sidebar-item ${page === 'settings' ? 'active' : ''}`} onClick={() => goPage('settings')}>
              <Icon name="settings" size={18} /><span>Settings</span>
            </div>

            <div className="sidebar-divider" />
            {isAdmin ? (
              <div className="sidebar-item" onClick={() => { if (confirm('Exit admin mode?')) { setIsAdmin(false); LS.set('nexus_admin', false); } }}>
                <Icon name="admin" size={18} /><span style={{ color: 'var(--gold)' }}>Admin: ON</span>
              </div>
            ) : (
              <div className="sidebar-item" onClick={() => setModal('adminLogin')}>
                <Icon name="admin" size={18} /><span>Admin Login</span>
              </div>
            )}
          </div>
        </div>

        {/* Main */}
        <div className={`main-content ${sidebarOpen ? '' : 'expanded'}`}>
          {/* Topbar */}
          <div className="topbar">
            <button className="toggle-sidebar" onClick={() => setSidebarOpen(s => !s)}>
              <Icon name="menu" size={18} />
            </button>
            <div className="search-bar">
              <span className="search-icon"><Icon name="search" size={16} /></span>
              <input
                type="text"
                placeholder="Search products, brands..."
                value={searchQ}
                onChange={e => { setSearchQ(e.target.value); if (e.target.value) setPage('search'); else if (page === 'search') goHome(); }}
              />
            </div>
            <div className="topbar-right">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => goPage('wishlist')}>♥ {wishlist.length}</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => goPage('compare')}>Compare {compareIds.length}/4</button>
              {isAdmin && <span className="admin-badge">⚡ ADMIN</span>}
            </div>
          </div>

          {/* Pages */}
          <div>
            {page === 'home' && <HomePage brands={brands} products={products} isAdmin={isAdmin} goProduct={goProduct} goBrand={goBrand} setModal={setModal} siteSettings={siteSettings} deleteProduct={deleteProduct} deleteBrand={deleteBrand} setSearchQ={setSearchQ} setPage={setPage} goPage={goPage} wishlist={wishlist} toggleWishlist={toggleWishlist} compareIds={compareIds} toggleCompare={toggleCompare} />}
            {page === 'reports' && <ReportsAdminPage isAdmin={isAdmin} goHome={goHome} />}
            {page === 'discover' && <DiscoverPage products={products} brands={brands} filters={discoverFilters} setFilters={setDiscoverFilters} goProduct={goProduct} isAdmin={isAdmin} deleteProduct={deleteProduct} wishlist={wishlist} toggleWishlist={toggleWishlist} compareIds={compareIds} toggleCompare={toggleCompare} />}
            {page === 'wishlist' && <WishlistPage products={products} wishlist={wishlist} goProduct={goProduct} isAdmin={isAdmin} deleteProduct={deleteProduct} toggleWishlist={toggleWishlist} compareIds={compareIds} toggleCompare={toggleCompare} />}
            {page === 'compare' && <ComparePage products={products} compareIds={compareIds} goProduct={goProduct} clearCompare={clearCompare} />}
            {page === 'search' && <SearchPage results={searchResults} query={searchQ} goProduct={goProduct} isAdmin={isAdmin} deleteProduct={deleteProduct} filters={searchFilters} setFilters={setSearchFilters} brands={brands} wishlist={wishlist} toggleWishlist={toggleWishlist} compareIds={compareIds} toggleCompare={toggleCompare} />}
            {page === 'brand' && activeBrand && <BrandPage brand={activeBrand} products={brandProducts(activeBrand.id)} isAdmin={isAdmin} goProduct={goProduct} goCompany={goCompany} setModal={setModal} deleteProduct={deleteProduct} deleteBrand={deleteBrand} goHome={goHome} siteSettings={siteSettings} />}
            {page === 'brand' && !activeBrand && (
              <div className="page"><div className="empty-state"><h3>Brand not found</h3><button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={goHome}>Back to Home</button></div></div>
            )}
            {page === 'product' && activeProduct && (
              <ProductErrorBoundary goHome={goHome}>
                <ProductPage product={getProduct(activeProduct.id) || activeProduct} brands={brands} isAdmin={isAdmin} setModal={setModal} goCompany={goCompany} goBrand={goBrand} goHome={goHome} deleteProduct={deleteProduct} siteSettings={siteSettings} wishlist={wishlist} toggleWishlist={toggleWishlist} compareIds={compareIds} toggleCompare={toggleCompare} />
              </ProductErrorBoundary>
            )}
            {page === 'product' && !activeProduct && (
              <div className="page"><div className="empty-state"><Icon name="box" size={48} /><h3>Product not found</h3><p>It may have been removed.</p><button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={goHome}>Back to Home</button></div></div>
            )}
            {page === 'company' && activeBrand && <CompanyPage brand={activeBrand} isAdmin={isAdmin} setModal={setModal} goHome={goHome} goBrand={goBrand} siteSettings={siteSettings} />}
            {page === 'about' && <AboutPage goHome={goHome} />}
            {page === 'contact' && <ContactPage settings={siteSettings} goHome={goHome} isAdmin={isAdmin} saveSettings={s => { setSiteSettings(s); notify('Contact info saved!'); }} />}
            {page === 'help' && <HelpPage goHome={goHome} />}
            {page === 'guidelines' && <GuidelinesPage goHome={goHome} />}
            {page === 'privacy' && <PrivacyPage goHome={goHome} />}
            {page === 'terms' && <TermsPage goHome={goHome} />}
            {page === 'brands' && <ForBrandsPage goHome={goHome} settings={siteSettings} />}
            {page === 'settings' && <SettingsPage isAdmin={isAdmin} settings={siteSettings} saveSettings={s => { setSiteSettings(s); notify('Settings saved!'); }} goHome={goHome} brands={brands} products={products} />}
          </div>
        </div>

        {/* Modals */}
        {modal === 'adminLogin' && <AdminLoginModal onClose={() => setModal(null)} onSuccess={() => { setIsAdmin(true); LS.set('nexus_admin', true); setModal(null); notify('Admin mode activated!'); }} />}
        {modal === 'addBrand' && <AddBrandModal onClose={() => setModal(null)} onSave={saveBrand} />}
        {modal === 'editBrand' && selectedBrand && <AddBrandModal brand={selectedBrand} onClose={() => setModal(null)} onSave={saveBrand} />}
        {modal === 'addProduct' && <AddProductModal brands={brands} defaultBrandId={selectedBrand?.id} onClose={() => setModal(null)} onSave={saveProduct} />}
        {modal === 'editProduct' && selectedProduct && <AddProductModal product={getProduct(selectedProduct.id)} brands={brands} onClose={() => setModal(null)} onSave={saveProduct} />}
        {modal === 'editCompany' && selectedBrand && <EditCompanyModal brand={selectedBrand} onClose={() => setModal(null)} onSave={b => { setBrands(br => br.map(x => x.id === b.id ? { ...x, ...b } : x)); setSelectedBrand({ ...selectedBrand, ...b }); setModal(null); notify('Company info saved!'); }} />}

        <CookieConsent goPrivacy={() => goPage('privacy')} />

        {/* Notifications */}
        <div className="notif">
          {notifs.map(n => (
            <div key={n.id} className={`notif-item ${n.type}`}>
              <span>{n.type === 'success' ? '✓' : '✗'} {n.msg}</span>
              <button type="button" className="notif-close" onClick={() => dismissNotif(n.id)} aria-label="Dismiss">✕</button>
            </div>
          ))}
        </div>
      </div>
    </NotifContext.Provider>
  );
}

// ── Home Page ──────────────────────────────────────────────
function HomePage({ brands, products, isAdmin, goProduct, goBrand, setModal, siteSettings, deleteProduct, deleteBrand, setSearchQ, setPage, goPage, wishlist, toggleWishlist, compareIds, toggleCompare }) {
  const [localSearch, setLocalSearch] = useState('');
  const handleSearch = (e) => {
    e.preventDefault();
    if (localSearch.trim()) { setSearchQ(localSearch); setPage('search'); }
  };

  const recentProducts = products.slice(-12).reverse();
  const featuredBrands = brands.slice(0, 8);

  return (
    <ThemeScope siteTheme={siteSettings.theme}>
    <div>
      {/* Hero */}
      <div className="hero">
        <div className="hero-bg" />
        <div className="hero-tag">
          <span>✦</span> The Ultimate Product Discovery Platform
        </div>
        <h1>
          Explore Every Product<br />
          <span>From Every Brand</span>
        </h1>
        <p>Discover thousands of products in stunning 3D. Compare specs, view brand details, and find the best place to buy.</p>
        <form onSubmit={handleSearch}>
          <div className="hero-search">
            <input
              type="text"
              placeholder="Search for any product or brand..."
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
            />
            <button type="submit">Explore →</button>
          </div>
        </form>
        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-num">{brands.length}</div>
            <div className="stat-label">Brands</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">{products.length}</div>
            <div className="stat-label">Products</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">3D</div>
            <div className="stat-label">Interactive</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">∞</div>
            <div className="stat-label">Discovery</div>
          </div>
        </div>
      </div>

      <div className="page" style={{ paddingTop: 0 }}>
        {/* Featured Brands */}
        {brands.length > 0 && (
          <div style={{ marginBottom: 48 }} className="fade-in-up">
            <div className="section-header">
              <div className="section-title">Featured Brands</div>
              {isAdmin && (
                <button className="btn btn-primary btn-sm" onClick={() => setModal('addBrand')}>
                  <Icon name="plus" size={14} /> Add Brand
                </button>
              )}
            </div>
            <div className="brand-grid">
              {featuredBrands.map((b, i) => (
                <div key={b.id} className="brand-card fade-in-up" style={{ animationDelay: `${i * 0.05}s` }} onClick={() => goBrand(b)}>
                  {isAdmin && (
                    <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }} onClick={() => { deleteBrand(b.id); }}>
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                  )}
                  <div className="brand-logo-lg">
                    {b.logoUrl ? <img src={b.logoUrl} alt={b.name} /> : b.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="brand-name">{b.name}</div>
                  <div className="brand-count">{products.filter(p => p.brandId === b.id).length} products</div>
                </div>
              ))}
              {isAdmin && (
                <div className="brand-card" style={{ border: '2px dashed var(--border2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text3)', cursor: 'pointer' }} onClick={() => setModal('addBrand')}>
                  <Icon name="plus" size={32} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Add Brand</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Latest Products */}
        <div style={{ marginBottom: 48 }} className="fade-in-up delay-1">
          <div className="section-header">
            <div className="section-title">Latest Products</div>
            {isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={() => setModal('addProduct')}>
                <Icon name="plus" size={14} /> Add Product
              </button>
            )}
          </div>
          {products.length === 0 ? (
            <div className="empty-state">
              <Icon name="box" size={48} />
              <h3>No products yet</h3>
              <p>{isAdmin ? 'Add your first product using the button above.' : 'Products will appear here once added.'}</p>
            </div>
          ) : (
            <div className="product-grid">
              {recentProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} isAdmin={isAdmin} onClick={() => goProduct(p)} onDelete={() => deleteProduct(p.id)} delay={i * 0.05}
                  wishlisted={wishlist.includes(p.id)} onWishlist={() => toggleWishlist(p.id)} inCompare={compareIds.includes(p.id)} onCompare={() => toggleCompare(p.id)} compareDisabled={!compareIds.includes(p.id) && compareIds.length >= 4} />
              ))}
              {isAdmin && (
                <div className="product-card" style={{ border: '2px dashed var(--border2)', minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text3)', cursor: 'pointer' }} onClick={() => setModal('addProduct')}>
                  <Icon name="plus" size={32} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Add Product</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* All Brands (if any) */}
        {brands.length === 0 && isAdmin && (
          <div className="empty-state">
            <Icon name="brands" size={48} />
            <h3>No brands yet</h3>
            <p>Start by adding brands from the sidebar or the button below.</p>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setModal('addBrand')}>
              <Icon name="plus" size={16} /> Add First Brand
            </button>
          </div>
        )}

        <div style={{ marginBottom: 48 }}>
          <NewsletterBlock />
        </div>

        {/* About teaser */}
        <div style={{ marginBottom: 48 }}>
          <div className="info-card info-card--center fade-in-up delay-2" style={{ background: 'linear-gradient(135deg,rgba(108,99,255,.08),rgba(0,212,255,.04))', padding: '48px 40px' }}>
            <div style={{ fontSize: 14, color: 'var(--accent3)', fontWeight: 600, letterSpacing: 2, marginBottom: 12 }}>ABOUT NEXUS</div>
            <h2 style={{ fontFamily: 'var(--font)', fontSize: 28, fontWeight: 800, marginBottom: 16, borderBottom: 'none', paddingBottom: 0, display: 'block', textAlign: 'center', width: '100%' }}>Your Ultimate Product Discovery Hub</h2>
            <p style={{ color: 'var(--text2)', maxWidth: 560, margin: '0 auto 24px', lineHeight: 1.7 }}>
              We bring thousands of products from hundreds of global brands into one stunning platform. Explore in 3D, compare specs, and buy with confidence.
            </p>
          </div>
        </div>
      </div>
    </div>
    </ThemeScope>
  );
}

// ── Product Card ───────────────────────────────────────────
function ProductCard({ product, isAdmin, onClick, onDelete, delay = 0, wishlisted, onWishlist, inCompare, onCompare, compareDisabled }) {
  const brand = product.brandName || product.brand || 'Unknown Brand';
  const rating = NEXUS.avgRating(product.id);
  return (
    <div className="product-card" style={{ animationDelay: `${delay}s`, position: 'relative' }} onClick={onClick}>
      <div className="product-img">
        {product.imageUrl
          ? <img src={product.imageUrl} alt={product.name} />
          : <div className="product-img-placeholder"><Icon name="image" size={40} /><span style={{ fontSize: 12 }}>No image</span></div>
        }
        {product.sponsored && <div className="product-badge sponsored-badge">Sponsored</div>}
        {product.modelUrl && !product.sponsored && <div className="product-badge">3D</div>}
        {product.modelUrl && product.sponsored && <div className="product-badge" style={{ top: 36 }}>3D</div>}
        {(onWishlist || onCompare) && (
          <div className="card-actions" onClick={e => e.stopPropagation()}>
            {onWishlist && <button type="button" className={`card-action-btn ${wishlisted ? 'active' : ''}`} onClick={onWishlist} title="Wishlist">♥</button>}
            {onCompare && <button type="button" className={`card-action-btn ${inCompare ? 'active' : ''}`} onClick={onCompare} disabled={compareDisabled} title="Compare">⇄</button>}
          </div>
        )}
      </div>
      <div className="product-info">
        <div className="product-brand">{brand}{product.category ? ` · ${product.category}` : ''}</div>
        <div className="product-name">{product.name || 'Unnamed Product'}</div>
        {rating && <div style={{ fontSize: 12, color: 'var(--gold)', marginBottom: 6 }}>{rating.toFixed(1)} ★</div>}
        {product.price
          ? <div className="product-price">{product.priceCurrency || '₹'} {product.price}</div>
          : <div className="no-price">Price not set</div>
        }
      </div>
      {isAdmin && (
        <div className="edit-overlay" onClick={e => e.stopPropagation()}>
          <button type="button" className="admin-card-delete" onClick={onDelete}>
            <Icon name="trash" size={16} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Search Page ────────────────────────────────────────────
function SearchPage({ results, query, goProduct, isAdmin, deleteProduct, filters, setFilters, brands, wishlist, toggleWishlist, compareIds, toggleCompare }) {
  return (
    <div className="page">
      <div className="section-header">
        <div className="section-title">Search Results for "{query}"</div>
        <span style={{ color: 'var(--text3)', fontSize: 14 }}>{results.length} found</span>
      </div>
      <ProductFiltersBar filters={filters} setFilters={setFilters} brands={brands} />
      {results.length === 0
        ? <div className="empty-state"><Icon name="search" size={48} /><h3>No results found</h3><p>Try different keywords.</p></div>
        : <div className="product-grid">{results.map((p, i) => (
          <ProductCard key={p.id} product={p} isAdmin={isAdmin} onClick={() => goProduct(p)} onDelete={() => deleteProduct(p.id)} delay={i * 0.04}
            wishlisted={wishlist.includes(p.id)} onWishlist={() => toggleWishlist(p.id)} inCompare={compareIds.includes(p.id)} onCompare={() => toggleCompare(p.id)} compareDisabled={!compareIds.includes(p.id) && compareIds.length >= 4} />
        ))}</div>
      }
    </div>
  );
}

// ── Brand Page ─────────────────────────────────────────────
function BrandPage({ brand, products, isAdmin, goProduct, goCompany, setModal, deleteProduct, deleteBrand, goHome, siteSettings }) {
  return (
    <ThemeScope siteTheme={siteSettings?.theme} brandTheme={brand.theme}>
    <div className="page">
      <div className="breadcrumb">
        <span onClick={goHome}>Home</span><span className="sep">/</span>
        <span className="current">{brand.name}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
        <div style={{ width: 80, height: 80, borderRadius: 16, background: 'var(--bg4)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: 'var(--accent)', overflow: 'hidden', flexShrink: 0 }}>
          {brand.logoUrl ? <img src={brand.logoUrl} alt={brand.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : brand.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font)', fontSize: 32, fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {brand.name}
            {brand.verified && <span className="chip verified-chip">✓ Verified</span>}
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 15, marginBottom: 16, lineHeight: 1.6 }}>{brand.description || 'No description yet.'}</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => goCompany(brand.id)}>
              <Icon name="building" size={14} /> Company Details
            </button>
            {isAdmin && (
              <>
                <button className="btn btn-secondary btn-sm" onClick={() => setModal('editBrand')}>
                  <Icon name="edit" size={14} /> Edit Brand
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteBrand(brand.id)}>
                  <Icon name="trash" size={14} /> Delete Brand
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => setModal('addProduct')}>
                  <Icon name="plus" size={14} /> Add Product
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="section-header">
        <div className="section-title">All Products ({products.length})</div>
      </div>
      {products.length === 0
        ? <div className="empty-state"><Icon name="box" size={48} /><h3>No products yet</h3><p>{isAdmin ? 'Add products for this brand.' : 'No products for this brand yet.'}</p></div>
        : <div className="product-grid">{products.map((p, i) => <ProductCard key={p.id} product={p} isAdmin={isAdmin} onClick={() => goProduct(p)} onDelete={() => deleteProduct(p.id)} delay={i * 0.04} />)}</div>
      }
    </div>
    </ThemeScope>
  );
}

// ── Product Page ───────────────────────────────────────────
function normalizeProductForPage(raw) {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const specs = raw.specs && typeof raw.specs === 'object' && !Array.isArray(raw.specs) ? raw.specs : {};
  let purchaseLinks = Array.isArray(raw.purchaseLinks) ? raw.purchaseLinks : [];
  purchaseLinks = purchaseLinks
    .filter((l) => l && typeof l === 'object')
    .map((l) => ({
      name: l.name != null ? String(l.name) : 'Store',
      url: l.url != null ? String(l.url) : '',
      unavailable: !!l.unavailable,
    }));
  if (!purchaseLinks.length) {
    purchaseLinks = [
      { name: 'Amazon', url: '', unavailable: false },
      { name: 'Flipkart', url: '', unavailable: false },
      { name: 'Official Website', url: '', unavailable: false },
    ];
  }

  let ingredients = raw.ingredients;
  if (!Array.isArray(ingredients)) {
    ingredients = typeof ingredients === 'string' && ingredients.trim() ? [ingredients] : [];
  }
  ingredients = ingredients.map((i) => (i != null ? String(i) : '')).filter(Boolean);

  let modelUrl = '';
  if (typeof raw.modelUrl === 'string' && raw.modelUrl.trim() && !raw.modelUrl.startsWith('data:')) {
    modelUrl = raw.modelUrl.trim();
  }

  let updatedAt = '';
  if (raw.updatedAt) {
    const d = new Date(raw.updatedAt);
    updatedAt = Number.isNaN(d.getTime()) ? '' : raw.updatedAt;
  }

  return {
    id: raw.id != null ? String(raw.id) : '',
    name: raw.name != null ? String(raw.name) : 'Untitled Product',
    brandId: raw.brandId != null ? String(raw.brandId) : '',
    brandName: raw.brandName != null ? String(raw.brandName) : '',
    price: raw.price != null ? String(raw.price) : '',
    priceCurrency: raw.priceCurrency != null ? String(raw.priceCurrency) : '₹',
    category: raw.category != null ? String(raw.category) : '',
    sponsored: !!raw.sponsored,
    description: raw.description != null ? String(raw.description) : '',
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : '',
    modelUrl,
    ingredients,
    ingredientsLabel: raw.ingredientsLabel != null ? String(raw.ingredientsLabel) : 'Ingredients / Materials',
    specs,
    purchaseLinks,
    theme: raw.theme && typeof raw.theme === 'object' && !Array.isArray(raw.theme) ? raw.theme : {},
    updatedAt,
  };
}

class ProductSectionBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err) { console.warn('Product section error:', err); }
  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}

function ProductPage({ product, brands, isAdmin, setModal, goCompany, goBrand, goHome, deleteProduct, siteSettings, wishlist, toggleWishlist, compareIds, toggleCompare }) {
  const safeProduct = normalizeProductForPage(product);
  const brandList = Array.isArray(brands) ? brands : [];
  const brand = safeProduct?.brandId ? NEXUS.findById(brandList, safeProduct.brandId) : null;
  const wishlistSafe = Array.isArray(wishlist) ? wishlist : [];
  const compareSafe = Array.isArray(compareIds) ? compareIds : [];
  const settingsSafe = siteSettings && typeof siteSettings === 'object' ? siteSettings : {};

  if (!safeProduct) {
    return (
      <div className="page">
        <div className="empty-state">
          <h3>Product not found</h3>
          <p style={{ color: 'var(--text2)' }}>This product data could not be loaded.</p>
          <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={goHome}>Back to Home</button>
        </div>
      </div>
    );
  }

  const modelSrc = safeProduct.modelUrl || null;
  const ingredients = safeProduct.ingredients;
  const specEntries = Object.entries(safeProduct.specs).filter(([k, v]) => k != null && v != null && String(k).trim());

  return (
    <ThemeScope siteTheme={settingsSafe.theme} brandTheme={brand?.theme} productTheme={safeProduct.theme}>
    <div className="page">
      <div className="breadcrumb">
        <span onClick={goHome}>Home</span><span className="sep">/</span>
        {brand?.name && <><span onClick={() => goBrand(brand)}>{brand.name}</span><span className="sep">/</span></>}
        <span className="current">{safeProduct.name}</span>
      </div>
      <div className="product-page">
        {/* Left: 3D + image */}
        <div>
          <div className="product-3d" style={{ marginBottom: 16 }}>
            <ThreeViewer modelUrl={modelSrc} />
            {modelSrc && (
              <div className="product-3d-hint">🖱 Drag to rotate · Scroll to zoom</div>
            )}
          </div>
          {/* Product image */}
          {safeProduct.imageUrl && (
            <div style={{ borderRadius: 'var(--radius2)', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 16 }}>
              <img src={safeProduct.imageUrl} alt={safeProduct.name} style={{ width: '100%', maxHeight: 300, objectFit: 'cover' }} />
            </div>
          )}
        </div>

        {/* Right: details */}
        <div className="product-details">
          {brand?.id && (
            <button className="detail-brand-link" onClick={() => goCompany(brand.id)}>
              {brand.logoUrl && <img src={brand.logoUrl} alt={brand.name || 'Brand'} style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover' }} />}
              <Icon name="building" size={16} />
              <span>{brand.name || 'Brand'} — Company Details</span>
              <Icon name="arrow" size={14} />
            </button>
          )}

          <div>
            {brand?.name && <div style={{ fontSize: 13, color: 'var(--accent3)', fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>{brand.name}</div>}
            <h1 style={{ fontFamily: 'var(--font)', fontSize: 28, fontWeight: 800, marginBottom: 16 }}>{safeProduct.name}</h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {safeProduct.sponsored && <span className="chip sponsored-chip">Sponsored</span>}
              {safeProduct.category && <span className="chip">{safeProduct.category}</span>}
              {safeProduct.updatedAt && <span className="chip" style={{ color: 'var(--text3)' }}>Updated {new Date(safeProduct.updatedAt).toLocaleDateString()}</span>}
            </div>
            {safeProduct.id && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button type="button" className={`btn btn-secondary btn-sm ${wishlistSafe.includes(safeProduct.id) ? 'active' : ''}`} onClick={() => toggleWishlist(safeProduct.id)}>♥ Wishlist</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => toggleCompare(safeProduct.id)} disabled={!compareSafe.includes(safeProduct.id) && compareSafe.length >= 4}>⇄ Compare</button>
              </div>
            )}
            {safeProduct.price && (
              <div className="price-tag">
                <span style={{ fontSize: 14, color: 'var(--text3)' }}>{safeProduct.priceCurrency}</span>
                <span style={{ fontSize: 24 }}>{safeProduct.price}</span>
              </div>
            )}
          </div>

          {/* Ingredients/Materials */}
          {ingredients.length > 0 && (
            <div className="detail-section">
              <h3><Icon name="star" size={16} />{safeProduct.ingredientsLabel}</h3>
              <div>{ingredients.map((item, i) => <span key={i} className="ingredient-tag">{item}</span>)}</div>
            </div>
          )}

          {/* About product */}
          {safeProduct.description && (
            <div className="detail-section">
              <h3><Icon name="about" size={16} />About the Product</h3>
              <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7 }}>{safeProduct.description}</p>
            </div>
          )}

          {/* Specs */}
          {specEntries.length > 0 && (
            <div className="detail-section">
              <h3><Icon name="guidelines" size={16} />Specifications</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {specEntries.map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                    <span style={{ color: 'var(--text3)' }}>{String(k)}</span>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {safeProduct.id && (
            <ProductSectionBoundary>
              <PriceHistoryBlock productId={safeProduct.id} product={safeProduct} />
            </ProductSectionBoundary>
          )}

          {/* Purchase links */}
          <div className="detail-section">
            <h3><Icon name="external" size={16} />Where to Buy</h3>
            <div className="purchase-links">
              {safeProduct.purchaseLinks.map((link, i) => {
                const href = NEXUS.applyAffiliateUrl(link.url, settingsSafe);
                return (
                <a key={i} href={href || '#'} target="_blank" rel="noopener noreferrer"
                  className={`purchase-link ${link.unavailable ? 'unavailable' : ''}`}
                  onClick={e => {
                    if (!link.url || link.unavailable) e.preventDefault();
                    else if (safeProduct.id) NEXUS.trackEvent('outbound_click', { productId: safeProduct.id, store: link.name });
                  }}>
                  <Icon name="external" size={20} />
                  <span className="pl-name">{link.name}</span>
                  <span className="pl-action">{link.unavailable ? 'Not Available' : link.url ? 'Visit →' : 'Link not set'}</span>
                </a>
              );})}
            </div>
          </div>

          {safeProduct.id && (
            <ProductSectionBoundary>
              <ProductReviews productId={safeProduct.id} isAdmin={isAdmin} />
            </ProductSectionBoundary>
          )}

          {/* Disclaimer */}
          <div className="disclaimer">
            <strong>⚠ Disclaimer:</strong> Please be aware that when purchasing products online from websites like Amazon and Flipkart, there is a risk of scams, fake listings, or incorrect deliveries such as empty packages or wrong items.<br /><br />
            We do not sell or ship any products ourselves and are not responsible for any issues, losses, or fraud that may occur from purchases made through third-party platforms.<br /><br />
            Always verify the seller, product details, and reviews carefully before making any purchase. All transactions are made at your own risk.
          </div>

          {/* Admin controls */}
          {isAdmin && safeProduct.id && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => setModal('editProduct')}>
                <Icon name="edit" size={16} /> Edit Product
              </button>
              <button className="btn btn-danger" onClick={() => deleteProduct(safeProduct.id)}>
                <Icon name="trash" size={16} /> Delete Product
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </ThemeScope>
  );
}

// ── Company Page ───────────────────────────────────────────
function CompanyPage({ brand, isAdmin, setModal, goHome, goBrand, siteSettings }) {
  return (
    <ThemeScope siteTheme={siteSettings?.theme} brandTheme={brand.theme}>
    <div className="page">
      <div className="breadcrumb">
        <span onClick={goHome}>Home</span><span className="sep">/</span>
        <span onClick={() => goBrand(brand)} style={{ cursor: 'pointer' }}>{brand.name}</span><span className="sep">/</span>
        <span className="current">Company Details</span>
      </div>

      <div className="company-hero">
        <div style={{ width: 80, height: 80, borderRadius: 16, margin: '0 auto 20px', background: 'var(--bg4)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: 'var(--accent)', overflow: 'hidden' }}>
          {brand.logoUrl ? <img src={brand.logoUrl} alt={brand.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : brand.name?.[0]?.toUpperCase()}
        </div>
        <h1 style={{ fontFamily: 'var(--font)', fontSize: 36, fontWeight: 800, marginBottom: 12 }}>{brand.name}</h1>
        <p style={{ color: 'var(--text2)', maxWidth: 600, margin: '0 auto', lineHeight: 1.7, fontSize: 16 }}>{brand.companyBio || brand.description || 'Company information coming soon.'}</p>
        {isAdmin && (
          <button className="btn btn-secondary" style={{ marginTop: 20 }} onClick={() => setModal('editCompany')}>
            <Icon name="edit" size={16} /> Edit Company Info
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="company-stats-grid">
        {[
          { label: 'Net Worth', val: brand.netWorth || '—', icon: '💰' },
          { label: 'Total Employees', val: brand.employees || '—', icon: '👥' },
          { label: 'Global Branches', val: brand.branches || '—', icon: '🌍' },
          { label: 'Founded', val: brand.founded || '—', icon: '📅' },
          { label: 'Headquarters', val: brand.headquarters || '—', icon: '🏢' },
          { label: 'Stock Symbol', val: brand.stockSymbol || '—', icon: '📈' },
        ].map((s, i) => (
          <div key={i} className="company-stat">
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div className="cs-val">{s.val}</div>
            <div className="cs-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Stock placeholder */}
      <div className="info-card">
        <h2><Icon name="star" size={20} />Stock Information</h2>
        {brand.stockSymbol ? (
          <div style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7 }}>
            <p>Stock symbol: <strong style={{ color: 'var(--accent) '}}>{brand.stockSymbol}</strong></p>
            <p style={{ marginTop: 8 }}>Stock price data and charts will be displayed here when connected to a data source.</p>
          </div>
        ) : (
          <div style={{ color: 'var(--text3)', fontSize: 14 }}>
            No stock information added yet. {isAdmin && 'Edit company info to add stock details.'}
          </div>
        )}
      </div>

      {/* About */}
      {brand.companyAbout && (
        <div className="info-card">
          <h2><Icon name="about" size={20} />About the Company</h2>
          <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.8 }}>{brand.companyAbout}</p>
        </div>
      )}

      {/* Website */}
      {brand.website && (
        <div className="info-card">
          <h2><Icon name="globe" size={20} />Official Website</h2>
          <a href={brand.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent3)', fontSize: 15 }}>{brand.website} ↗</a>
        </div>
      )}
    </div>
    </ThemeScope>
  );
}

// ── About Page ─────────────────────────────────────────────
function AboutPage({ goHome }) {
  const features = [
    { icon: '🔍', title: 'Product Discovery', desc: 'Explore thousands of products from global brands in one unified platform.' },
    { icon: '🎯', title: '3D Visualization', desc: 'View every product in stunning interactive 3D — rotate, zoom, and inspect from all angles.' },
    { icon: '📊', title: 'Brand Intelligence', desc: 'Access company financials, employee counts, global branches, and stock information.' },
    { icon: '🔗', title: 'Trusted Stores', desc: 'Redirected to trusted platforms like Amazon, Flipkart, and official brand websites.' },
    { icon: '⚗️', title: 'Full Transparency', desc: 'View complete ingredients, materials, and product specifications.' },
    { icon: '🌐', title: 'Global Coverage', desc: 'Hundreds of brands from across the world, all in one place.' },
  ];
  return (
    <div className="page">
      <div className="breadcrumb"><span onClick={goHome}>Home</span><span className="sep">/</span><span className="current">About Us</span></div>
      <div className="about-hero">
        <div style={{ fontSize: 14, color: 'var(--accent3)', letterSpacing: 2, fontWeight: 600, marginBottom: 12 }}>WHO WE ARE</div>
        <h1>We're Building the Future<br />of Product Discovery</h1>
        <p style={{ color: 'var(--text2)', fontSize: 17, maxWidth: 600, margin: '16px auto 0', lineHeight: 1.7 }}>
          NEXUS is a premium, all-in-one product exploration platform where users can search and discover products from thousands of global brands, view them in interactive 3D, and access complete product and brand information.
        </p>
      </div>
      <div className="section-title" style={{ marginBottom: 24 }}>What We Offer</div>
      <div className="feature-grid">
        {features.map((f, i) => (
          <div key={i} className="feature-card fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
      <div className="info-card" style={{ marginTop: 32, background: 'linear-gradient(135deg,rgba(108,99,255,.06),rgba(0,212,255,.03))' }}>
        <h2><Icon name="about" size={20} />Our Mission</h2>
        <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.8 }}>
          We believe that discovering products should be an experience — not just a search. NEXUS was built to bridge the gap between product research and purchase decisions, giving consumers access to every detail they need in the most visually stunning way possible. We don't sell — we illuminate.
        </p>
      </div>
    </div>
  );
}

// ── Contact Page ───────────────────────────────────────────
function ContactPage({ settings, goHome, isAdmin, saveSettings }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(settings);
  useEffect(() => { setForm(settings); }, [settings]);

  const contacts = [
    { icon: '📧', label: 'Company Email', val: settings.contactEmail, href: `mailto:${settings.contactEmail}` },
    { icon: '👤', label: "Founder's Email", val: settings.founderEmail, href: `mailto:${settings.founderEmail}` },
    { icon: '📱', label: 'Phone 1', val: settings.phone1, href: `tel:${settings.phone1}` },
    { icon: '📱', label: 'Phone 2', val: settings.phone2, href: `tel:${settings.phone2}` },
    { icon: '🐦', label: 'Twitter / X', val: settings.twitter },
    { icon: '📸', label: 'Instagram', val: settings.instagram },
    { icon: '📍', label: 'Address', val: settings.address },
  ];

  return (
    <div className="page">
      <div className="breadcrumb"><span onClick={goHome}>Home</span><span className="sep">/</span><span className="current">Contact Us</span></div>
      <div className="about-hero" style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
        <h1 style={{ fontSize: 36 }}>Get In Touch</h1>
        <p style={{ color: 'var(--text2)', maxWidth: 500, margin: '12px auto 0' }}>Have questions, feedback, or partnership inquiries? We'd love to hear from you.</p>
      </div>

      {isAdmin && !editing && (
        <div style={{ marginBottom: 20 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
            <Icon name="edit" size={14} /> Edit Contact Info
          </button>
        </div>
      )}

      {editing ? (
        <div className="info-card">
          <h2><Icon name="edit" size={20} />Edit Contact Info</h2>
          <div className="admin-form">
            <div className="form-row">
              <div className="form-group"><label className="form-label">Company Email</label><input className="form-input" value={form.contactEmail || ''} onChange={e => setForm({ ...form, contactEmail: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Founder Email</label><input className="form-input" value={form.founderEmail || ''} onChange={e => setForm({ ...form, founderEmail: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Phone 1</label><input className="form-input" value={form.phone1 || ''} onChange={e => setForm({ ...form, phone1: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Phone 2</label><input className="form-input" value={form.phone2 || ''} onChange={e => setForm({ ...form, phone2: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Twitter</label><input className="form-input" value={form.twitter || ''} onChange={e => setForm({ ...form, twitter: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Instagram</label><input className="form-input" value={form.instagram || ''} onChange={e => setForm({ ...form, instagram: e.target.value })} /></div>
            </div>
            <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" onClick={() => { saveSettings(form); setEditing(false); }}>Save Changes</button>
              <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="contact-grid">
          {contacts.filter(c => c.val).map((c, i) => (
            <div key={i} className="contact-card fade-in-up" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="contact-icon">{c.icon}</div>
              <div>
                <h3>{c.label}</h3>
                {c.href ? <a href={c.href}>{c.val}</a> : <p>{c.val}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Help Page ──────────────────────────────────────────────
function HelpPage({ goHome }) {
  const [tab, setTab] = useState('report');
  const [form, setForm] = useState({ type: 'bug', name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const notify = useNotif();

  const handleSubmit = () => {
    if (!form.message) { notify('Please fill in the message.', 'error'); return; }
    // Save to localStorage for admin to review
    const reports = LS.get('nexus_reports', []);
    const type = tab === 'suggest' ? 'suggestion' : 'bug';
    LS.set('nexus_reports', [...reports, { ...form, type, id: Date.now().toString(), date: new Date().toISOString() }]);
    setSubmitted(true);
    notify('Report submitted successfully!');
  };

  return (
    <div className="page">
      <div className="breadcrumb"><span onClick={goHome}>Home</span><span className="sep">/</span><span className="current">Help</span></div>
      <div className="section-title" style={{ marginBottom: 24 }}>Help & Support</div>

      <div className="tabs">
        <div className={`tab ${tab === 'report' ? 'active' : ''}`} onClick={() => setTab('report')}>Report a Bug</div>
        <div className={`tab ${tab === 'suggest' ? 'active' : ''}`} onClick={() => setTab('suggest')}>Suggest a Brand</div>
        <div className={`tab ${tab === 'faq' ? 'active' : ''}`} onClick={() => setTab('faq')}>FAQ</div>
      </div>

      {(tab === 'report' || tab === 'suggest') && !submitted && (
        <div className="info-card help-form">
          <h2><Icon name="help" size={20} />{tab === 'report' ? 'Report a Bug' : 'Suggest a Brand'}</h2>
          <div className="admin-form">
            <div className="form-row">
              <div className="form-group"><label className="form-label">Your Name</label><input className="form-input" placeholder="Optional" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Email (Optional)</label><input className="form-input" placeholder="For follow-up" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="form-group">
              <label className="form-label">{tab === 'report' ? 'Describe the bug' : 'Which brand & why?'}</label>
              <textarea className="form-input" rows={5} placeholder={tab === 'report' ? 'Describe what happened, what you expected, and steps to reproduce...' : 'Tell us about the brand you\'d like to see and why...'} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
            </div>
            <button className="btn btn-primary" onClick={handleSubmit}>Submit Report</button>
          </div>
        </div>
      )}

      {submitted && (
        <div className="info-card info-card--center" style={{ padding: '48px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ marginBottom: 12, borderBottom: 'none', display: 'block', textAlign: 'center', width: '100%' }}>Thank you!</h2>
          <p style={{ color: 'var(--text2)' }}>Your {tab === 'report' ? 'bug report' : 'brand suggestion'} has been received. We'll review it shortly.</p>
          <button className="btn btn-secondary" style={{ marginTop: 20 }} onClick={() => setSubmitted(false)}>Submit Another</button>
        </div>
      )}

      {tab === 'faq' && (
        <div className="info-card">
          <h2><Icon name="help" size={20} />Frequently Asked Questions</h2>
          {[
            { q: 'How do I view a product in 3D?', a: 'Open any product page that has a 3D model — you\'ll see an interactive viewer. Click and drag to rotate, scroll to zoom.' },
            { q: 'Can I buy products directly from NEXUS?', a: 'No. NEXUS is a discovery platform. We redirect you to trusted stores like Amazon, Flipkart, or brand official websites.' },
            { q: 'Is NEXUS free to use?', a: 'Yes, browsing and discovering products on NEXUS is completely free.' },
            { q: 'How do I suggest a brand?', a: 'Go to Help → Suggest a Brand and fill in the form. We\'ll review and add it if it fits our platform.' },
            { q: 'Are purchase links safe?', a: 'We link to official platforms, but always verify seller ratings and reviews before purchasing. Read our disclaimer on product pages.' },
          ].map((faq, i) => (
            <div key={i} style={{ padding: '16px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text)', fontSize: 15 }}>Q: {faq.q}</div>
              <div style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>A: {faq.a}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Guidelines Page ────────────────────────────────────────
function GuidelinesPage({ goHome }) {
  const guidelines = [
    { title: 'Respect Our Platform', desc: 'NEXUS is a read-only product discovery platform. Do not attempt to manipulate, hack, or misuse any features of the platform.' },
    { title: 'Purchase Responsibility', desc: 'All purchases made through linked third-party stores (Amazon, Flipkart, etc.) are solely between you and that platform. NEXUS is not responsible for any issues.' },
    { title: 'Verify Before Buying', desc: 'Always check seller ratings, product reviews, and authenticity before completing any purchase. Fake listings exist on third-party platforms.' },
    { title: 'Reporting Issues', desc: 'Found incorrect information or a bug? Use our Help section to report it. We strive to maintain accurate and up-to-date data.' },
    { title: 'Intellectual Property', desc: 'All brand logos, product images, and trademarks belong to their respective owners. NEXUS displays them for informational purposes only.' },
    { title: 'Privacy', desc: 'We do not collect personal data from visitors. Bug reports submitted are used only for platform improvement and are kept confidential.' },
    { title: 'Content Accuracy', desc: 'Product prices, specifications, and availability are subject to change. Always verify details on the official brand or retailer website.' },
    { title: 'No Endorsement', desc: 'Listing a product on NEXUS does not imply our endorsement of that product, brand, or seller. We are an independent discovery platform.' },
  ];
  return (
    <div className="page">
      <div className="breadcrumb"><span onClick={goHome}>Home</span><span className="sep">/</span><span className="current">Guidelines</span></div>
      <div className="about-hero" style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
        <h1 style={{ fontSize: 36 }}>Platform Guidelines</h1>
        <p style={{ color: 'var(--text2)', maxWidth: 540, margin: '12px auto 0' }}>Please read these guidelines before using NEXUS to ensure a safe and reliable experience for everyone.</p>
      </div>
      <div className="info-card">
        {guidelines.map((g, i) => (
          <div key={i} className="guideline-item">
            <div className="guideline-num">{i + 1}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'var(--font)', marginBottom: 6 }}>{g.title}</div>
              <div style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7 }}>{g.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Settings Page ──────────────────────────────────────────
function AdminEmailCodeFields({ purpose, notify, onSuccess, submitLabel, showPasswordFields = true }) {
  const [code, setCode] = useState('');
  const [next, setNext] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [sentMsg, setSentMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    setErr('');
    setSentMsg('');
    setLoading(true);
    try {
      const result = await requestAdminEmailCode(purpose);
      if (result.ok) {
        setSentMsg(result.message || 'Verification code sent to owner email.');
        notify('Verification code sent');
      } else {
        setErr(result.error || 'Could not send code.');
      }
    } catch (_) {
      setErr('Email verification works on the live Netlify site after Gmail is configured.');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    setErr('');
    if (!/^\d{6}$/.test(code.trim())) {
      setErr('Enter the 6-digit code from your email.');
      return;
    }
    if (showPasswordFields) {
      if (!next.trim()) {
        setErr('New password cannot be empty.');
        return;
      }
      if (next !== confirmPw) {
        setErr('New passwords do not match.');
        return;
      }
    }
    setLoading(true);
    try {
      const result = await verifyAdminEmailCode(code.trim(), purpose);
      if (!result.ok) {
        setErr(result.error || 'Incorrect verification code.');
        setLoading(false);
        return;
      }
      if (showPasswordFields) setAdminPassword(next);
      setCode('');
      setNext('');
      setConfirmPw('');
      setSentMsg('');
      onSuccess(showPasswordFields ? next : null);
    } catch (_) {
      setErr('Verification failed. Use the deployed Netlify site.');
    }
    setLoading(false);
  };

  return (
    <div className="admin-form">
      <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 8 }}>
        A verification code is sent only to the site owner&apos;s Gmail. Only you can change the admin password.
      </p>
      <button type="button" className="btn btn-secondary btn-sm" onClick={sendCode} disabled={loading}>
        {loading ? 'Sending…' : 'Send verification code to owner email'}
      </button>
      {sentMsg && <p style={{ color: 'var(--green)', fontSize: 13, marginTop: 10 }}>{sentMsg}</p>}
      <div className="form-group" style={{ marginTop: 16 }}>
        <label className="form-label">Verification code</label>
        <input className="form-input" type="text" inputMode="numeric" maxLength={6} placeholder="6-digit code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
      </div>
      {showPasswordFields && (
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">New password</label>
            <input className="form-input" type="password" value={next} onChange={e => setNext(e.target.value)} placeholder="New password" />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm new password</label>
            <input className="form-input" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Confirm new password" onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }} />
          </div>
        </div>
      )}
      {err && <span style={{ color: 'var(--accent2)', fontSize: 13 }}>{err}</span>}
      <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} onClick={handleSubmit} disabled={loading}>
        {loading ? 'Verifying…' : submitLabel}
      </button>
    </div>
  );
}

function AdminPasswordForm({ notify }) {
  return (
    <AdminEmailCodeFields
      purpose="change"
      notify={notify}
      submitLabel="Update admin password"
      onSuccess={() => notify('Admin password updated!')}
    />
  );
}

function SettingsPage({ isAdmin, settings, saveSettings, goHome, brands, products }) {
  const [form, setForm] = useState(settings);
  useEffect(() => { setForm(settings); }, [settings]);
  const notify = useNotif();
  const subscribers = LS.get('nexus_subscribers', []);

  const exportData = () => {
    const blob = new Blob([NEXUS.exportSiteData(brands, products, form)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nexus-export-${Date.now()}.json`;
    a.click();
    notify('Data exported!');
  };

  if (!isAdmin) {
    return (
      <div className="page">
        <div className="breadcrumb"><span onClick={goHome}>Home</span><span className="sep">/</span><span className="current">Settings</span></div>
        <div className="empty-state">
          <Icon name="admin" size={48} />
          <h3>Admin Access Required</h3>
          <p>Please log in as admin to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="breadcrumb"><span onClick={goHome}>Home</span><span className="sep">/</span><span className="current">Settings</span></div>
      <div className="section-title" style={{ marginBottom: 24 }}>Site Settings</div>

      <div className="settings-grid">
        <div className="settings-section">
          <h3>General</h3>
          <div className="admin-form">
            <div className="form-group"><label className="form-label">Site Name</label><input className="form-input" value={form.siteName || ''} onChange={e => setForm({ ...form, siteName: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Tagline</label><input className="form-input" value={form.tagline || ''} onChange={e => setForm({ ...form, tagline: e.target.value })} /></div>
          </div>
        </div>
        <div className="settings-section">
          <h3>Contact Info</h3>
          <div className="admin-form">
            <div className="form-group"><label className="form-label">Company Email</label><input className="form-input" value={form.contactEmail || ''} onChange={e => setForm({ ...form, contactEmail: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Founder Email</label><input className="form-input" value={form.founderEmail || ''} onChange={e => setForm({ ...form, founderEmail: e.target.value })} /></div>
          </div>
        </div>
        <div className="settings-section">
          <h3>Site Logo</h3>
          <div className="admin-form">
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div className="logo-icon" style={{ width: 56, height: 56 }}>
                {form.logoUrl ? <img src={form.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} /> : 'N'}
              </div>
              <input type="file" accept="image/*" className="form-input" onChange={e => {
                const f = e.target.files[0]; if (!f) return;
                const reader = new FileReader();
                reader.onload = ev => setForm({ ...form, logoUrl: ev.target.result });
                reader.readAsDataURL(f);
              }} />
            </div>
          </div>
        </div>
        <div className="settings-section">
          <h3>Global Theme & Colors</h3>
          <ThemeEditor theme={form.theme} onChange={t => setForm({ ...form, theme: t })} label="Default site-wide colors. Brands and products can override these." />
        </div>
        <div className="settings-section">
          <h3>Monetization</h3>
          <div className="admin-form">
            <div className="form-group">
              <label className="form-label">Amazon Affiliate Tag</label>
              <input className="form-input" placeholder="yourtag-20" value={form.amazonAffiliateTag || ''} onChange={e => setForm({ ...form, amazonAffiliateTag: e.target.value })} />
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section" style={{ marginTop: 24 }}>
        <h3>Admin Security</h3>
        <AdminPasswordForm notify={notify} />
      </div>

      <div style={{ marginTop: 24 }}>
        <button className="btn btn-primary" onClick={() => { saveSettings(form); notify('Settings saved!'); }}>
          Save All Settings
        </button>
      </div>

      {/* Data management */}
      <div className="info-card" style={{ marginTop: 32 }}>
        <h2><Icon name="trash" size={20} />Data Management</h2>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 16 }}>Danger zone — these actions cannot be undone.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-danger" onClick={() => {
            if (confirm('Delete ALL products? This cannot be undone.')) {
              LS.set('nexus_products', []);
              window.location.reload();
            }
          }}>Clear All Products</button>
          <button className="btn btn-danger" onClick={() => {
            if (confirm('Delete ALL brands and products? This cannot be undone.')) {
              LS.set('nexus_brands', []);
              LS.set('nexus_products', []);
              window.location.reload();
            }
          }}>Clear All Data</button>
        </div>
      </div>

      <div className="info-card" style={{ marginTop: 24 }}>
        <h2><Icon name="help" size={20} />User reports</h2>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>View all bug reports and brand requests in <strong>Reports Inbox</strong> (sidebar, admin only).</p>
      </div>

      <div className="info-card" style={{ marginTop: 24 }}>
        <h2><Icon name="contact" size={20} />Newsletter subscribers ({subscribers.length})</h2>
        {subscribers.length === 0
          ? <p style={{ color: 'var(--text3)', fontSize: 14 }}>No subscribers yet.</p>
          : <ul style={{ fontSize: 14, color: 'var(--text2)', paddingLeft: 18 }}>{subscribers.map((e, i) => <li key={i}>{e}</li>)}</ul>}
      </div>

      <AdminAnalyticsPanel />

      <div className="info-card" style={{ marginTop: 24 }}>
        <h2><Icon name="upload" size={20} />Export backup</h2>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 12 }}>Download all brands, products, settings, and analytics as JSON before deploying updates.</p>
        <button type="button" className="btn btn-primary" onClick={exportData}>Export JSON</button>
      </div>
    </div>
  );
}

// ── Admin Login Modal ──────────────────────────────────────
function AdminLoginModal({ onClose, onSuccess }) {
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [forgot, setForgot] = useState(false);
  const notify = useNotif();

  const tryLogin = () => {
    if (checkAdminPassword(pass)) onSuccess();
    else setErr('Incorrect password.');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><Icon name="admin" size={20} /> {forgot ? 'Reset Admin Password' : 'Admin Login'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {!forgot ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24, color: 'var(--text2)', fontSize: 14 }}>
              Enter your admin password to manage content.
            </div>
            <div className="admin-form">
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="Enter admin password..." value={pass} onChange={e => setPass(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') tryLogin(); }} />
                {err && <span style={{ color: 'var(--accent2)', fontSize: 13 }}>{err}</span>}
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={tryLogin}>
                Login as Admin
              </button>
              <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text3)', textAlign: 'center' }}>
                Forgot password?{' '}
                <button type="button" className="linkish" onClick={() => { setForgot(true); setErr(''); }}>Reset with email code</button>
              </p>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 16, color: 'var(--text2)', fontSize: 14 }}>
              Only the site owner can reset the password. A code will be sent to your Gmail.
            </div>
            <AdminEmailCodeFields
              purpose="reset"
              notify={notify}
              submitLabel="Set new password"
              onSuccess={() => {
                notify('Password updated. You can log in with your new password.');
                setForgot(false);
                setPass('');
                setErr('');
              }}
            />
            <button type="button" className="linkish" style={{ marginTop: 12, width: '100%' }} onClick={() => setForgot(false)}>
              ← Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Add/Edit Brand Modal ───────────────────────────────────
function AddBrandModal({ brand, onClose, onSave }) {
  const [form, setForm] = useState(brand || { name: '', description: '', logoUrl: '', website: '', verified: false });
  const [logoPreview, setLogoPreview] = useState(brand?.logoUrl || '');
  const notify = useNotif();
  const fileRef = useRef();

  const handleLogo = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => { setLogoPreview(ev.target.result); setForm(prev => ({ ...prev, logoUrl: ev.target.result })); };
    reader.readAsDataURL(f);
  };

  const handleSave = () => {
    if (!form.name) { notify('Brand name is required.', 'error'); return; }
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{brand ? 'Edit Brand' : 'Add New Brand'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="admin-form">
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{ width: 80, height: 80, borderRadius: 16, background: 'var(--bg4)', border: '2px dashed var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
                {logoPreview ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="image" size={28} />}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogo} />
              <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 6 }}>Click to upload logo</div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Brand Name *</label>
                <input className="form-input" placeholder="e.g. Apple, Samsung..." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Official Website</label>
                <input className="form-input" placeholder="https://..." value={form.website || ''} onChange={e => setForm({ ...form, website: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} placeholder="Brief description of the brand..." value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <label className="filter-check">
            <input type="checkbox" checked={!!form.verified} onChange={e => setForm({ ...form, verified: e.target.checked })} /> Verified brand (shows trust badge)
          </label>
          <div className="settings-section" style={{ marginTop: 16 }}>
            <h3>Brand page theme</h3>
            <ThemeEditor theme={form.theme} onChange={t => setForm(prev => ({ ...prev, theme: t }))} label="Custom colors for this brand's pages only. Leave default to use site theme." />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
              {brand ? 'Save Changes' : 'Add Brand'}
            </button>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add/Edit Product Modal ─────────────────────────────────
function AddProductModal({ product, brands, defaultBrandId, onClose, onSave }) {
  const [form, setForm] = useState(product || {
    name: '', brandId: defaultBrandId || '', price: '', priceCurrency: '₹',
    category: 'Other', sponsored: false,
    description: '', imageUrl: '', modelUrl: '',
    ingredients: [], ingredientsLabel: 'Ingredients / Materials',
    purchaseLinks: [
      { name: 'Amazon', url: '', unavailable: false },
      { name: 'Flipkart', url: '', unavailable: false },
      { name: 'Official Website', url: '', unavailable: false },
    ],
    specs: {},
  });
  const [ingInput, setIngInput] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');
  const [imgPreview, setImgPreview] = useState(product?.imageUrl || '');
  const [tab, setTab] = useState('basic');
  const imgRef = useRef();
  const notify = useNotif();

  // Set brand name when brand changes
  const selectedBrand = brands.find(b => b.id === form.brandId);
  useEffect(() => {
    if (selectedBrand) setForm(f => ({ ...f, brandName: selectedBrand.name }));
  }, [form.brandId]);

  const handleImage = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => { setImgPreview(ev.target.result); setForm(prev => ({ ...prev, imageUrl: ev.target.result })); };
    reader.readAsDataURL(f);
  };
  const addIngredient = () => {
    if (!ingInput.trim()) return;
    setForm(f => ({ ...f, ingredients: [...(f.ingredients || []), ingInput.trim()] }));
    setIngInput('');
  };
  const removeIngredient = (i) => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }));
  const addSpec = () => {
    if (!specKey.trim()) return;
    setForm(f => ({ ...f, specs: { ...(f.specs || {}), [specKey]: specVal } }));
    setSpecKey(''); setSpecVal('');
  };
  const updateLink = (i, field, val) => {
    const links = [...(form.purchaseLinks || [])];
    links[i] = { ...links[i], [field]: val };
    setForm(f => ({ ...f, purchaseLinks: links }));
  };

  const handleSave = () => {
    if (!form.name) { notify('Product name is required.', 'error'); return; }
    if (!form.brandId) { notify('Please select a brand.', 'error'); return; }
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="tabs">
          {['basic', 'details', '3d-model', 'links', 'theme'].map(t => (
            <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t === 'basic' ? 'Basic Info' : t === 'details' ? 'Details & Specs' : t === '3d-model' ? '3D Model' : t === 'links' ? 'Purchase Links' : 'Theme'}
            </div>
          ))}
        </div>

        {tab === 'basic' && (
          <div className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input className="form-input" placeholder="Product name..." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Brand *</label>
                <select className="form-input" value={form.brandId} onChange={e => setForm({ ...form, brandId: e.target.value })}>
                  <option value="">Select brand...</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Price</label>
                <input className="form-input" placeholder="e.g. 79,999" value={form.price || ''} onChange={e => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Currency Symbol</label>
                <input className="form-input" placeholder="₹ / $ / €" value={form.priceCurrency || '₹'} onChange={e => setForm({ ...form, priceCurrency: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={form.category || 'Other'} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {NEXUS.CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <label className="filter-check" style={{ marginBottom: 12 }}>
                  <input type="checkbox" checked={!!form.sponsored} onChange={e => setForm({ ...form, sponsored: e.target.checked })} /> Sponsored / Featured listing
                </label>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Product Image</label>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 100, height: 100, borderRadius: 12, background: 'var(--bg4)', border: '2px dashed var(--border2)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }} onClick={() => imgRef.current?.click()}>
                  {imgPreview ? <img src={imgPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="image" size={28} />}
                </div>
                <div>
                  <button className="btn btn-secondary btn-sm" onClick={() => imgRef.current?.click()}><Icon name="upload" size={14} /> Upload Image</button>
                  <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>JPG, PNG, WebP supported</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'details' && (
          <div className="admin-form">
            <div className="form-group">
              <label className="form-label">About the Product</label>
              <textarea className="form-input" rows={4} placeholder="Describe this product..." value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Ingredients/Materials Label</label>
              <input className="form-input" value={form.ingredientsLabel || 'Ingredients / Materials'} onChange={e => setForm({ ...form, ingredientsLabel: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Ingredients / Materials</label>
              <div className="pills-input-wrap" onClick={() => document.getElementById('ing-input').focus()}>
                {(form.ingredients || []).map((item, i) => (
                  <span key={i} className="pill">{item} <span className="remove" onClick={() => removeIngredient(i)}>×</span></span>
                ))}
                <input id="ing-input" value={ingInput} onChange={e => setIngInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addIngredient(); } }}
                  placeholder="Type and press Enter..." />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Press Enter or comma to add an item</div>
            </div>
            <div className="form-group">
              <label className="form-label">Specifications</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input className="form-input" placeholder="Spec name" style={{ flex: 1 }} value={specKey} onChange={e => setSpecKey(e.target.value)} />
                <input className="form-input" placeholder="Value" style={{ flex: 1 }} value={specVal} onChange={e => setSpecVal(e.target.value)} />
                <button className="btn btn-secondary btn-sm" onClick={addSpec}><Icon name="plus" size={14} /></button>
              </div>
              {Object.entries(form.specs || {}).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg4)', borderRadius: 6, marginBottom: 4, fontSize: 13 }}>
                  <span style={{ color: 'var(--text2)' }}>{k}</span>
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span>{v}</span>
                    <span style={{ cursor: 'pointer', color: 'var(--accent2)' }} onClick={() => { const s = { ...form.specs }; delete s[k]; setForm({ ...form, specs: s }); }}>×</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === '3d-model' && (
          <div className="admin-form">
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Icon name="cube" size={24} />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>3D Model URL</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)' }}>Paste a direct link to a hosted .glb file</div>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">3D Model URL (.glb)</label>
                <input
                  className="form-input"
                  type="url"
                  placeholder="https://cdn.jsdelivr.net/gh/username/nexus-assets@main/models/filename.glb"
                  value={form.modelUrl && String(form.modelUrl).startsWith('data:') ? '' : (form.modelUrl || '')}
                  onChange={e => setForm({ ...form, modelUrl: e.target.value.trim() })}
                />
              </div>
              {form.modelUrl && !String(form.modelUrl).startsWith('data:') && (
                <div style={{ marginTop: 12, padding: '8px 14px', background: 'rgba(0,255,157,.08)', border: '1px solid rgba(0,255,157,.2)', borderRadius: 8, fontSize: 13, color: 'var(--green)' }}>
                  ✓ 3D model URL set
                </div>
              )}
            </div>
            <div style={{ color: 'var(--text3)', fontSize: 13, lineHeight: 1.7 }}>
              Host your .glb on GitHub + jsDelivr, Netlify, or any CDN with CORS enabled. The viewer loads the file directly from this URL.
            </div>
          </div>
        )}

        {tab === 'links' && (
          <div className="admin-form">
            {(form.purchaseLinks || []).map((link, i) => (
              <div key={i} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius2)', padding: 16, marginBottom: 12 }}>
                <div className="form-row" style={{ marginBottom: 8 }}>
                  <div className="form-group">
                    <label className="form-label">Store Name</label>
                    <input className="form-input" value={link.name} onChange={e => updateLink(i, 'name', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">URL</label>
                    <input className="form-input" placeholder="https://..." value={link.url || ''} onChange={e => updateLink(i, 'url', e.target.value)} disabled={link.unavailable} />
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text2)' }}>
                  <input type="checkbox" checked={link.unavailable || false} onChange={e => updateLink(i, 'unavailable', e.target.checked)} style={{ accentColor: 'var(--accent2)' }} />
                  Mark as "Not Available"
                </label>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" onClick={() => setForm(f => ({ ...f, purchaseLinks: [...(f.purchaseLinks || []), { name: 'New Store', url: '', unavailable: false }] }))}>
              <Icon name="plus" size={14} /> Add Store Link
            </button>
          </div>
        )}

        {tab === 'theme' && (
          <div className="admin-form">
            <ThemeEditor theme={form.theme} onChange={t => setForm(prev => ({ ...prev, theme: t }))} label="Custom colors for this product page only. Overrides site and brand theme." />
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
            {product ? 'Save Changes' : 'Add Product'}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Company Modal ─────────────────────────────────────
function EditCompanyModal({ brand, onClose, onSave }) {
  const [form, setForm] = useState({
    id: brand.id,
    netWorth: brand.netWorth || '',
    employees: brand.employees || '',
    branches: brand.branches || '',
    founded: brand.founded || '',
    headquarters: brand.headquarters || '',
    stockSymbol: brand.stockSymbol || '',
    companyBio: brand.companyBio || '',
    companyAbout: brand.companyAbout || '',
    website: brand.website || '',
  });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Company: {brand.name}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="admin-form">
          <div className="form-row">
            <div className="form-group"><label className="form-label">Net Worth</label><input className="form-input" placeholder="e.g. $2.9 Trillion" value={form.netWorth} onChange={e => setForm({ ...form, netWorth: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Total Employees</label><input className="form-input" placeholder="e.g. 164,000" value={form.employees} onChange={e => setForm({ ...form, employees: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Global Branches</label><input className="form-input" placeholder="e.g. 500+" value={form.branches} onChange={e => setForm({ ...form, branches: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Founded Year</label><input className="form-input" placeholder="e.g. 1976" value={form.founded} onChange={e => setForm({ ...form, founded: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Headquarters</label><input className="form-input" placeholder="e.g. Cupertino, CA" value={form.headquarters} onChange={e => setForm({ ...form, headquarters: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Stock Symbol</label><input className="form-input" placeholder="e.g. AAPL" value={form.stockSymbol} onChange={e => setForm({ ...form, stockSymbol: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="form-label">Company Bio (short)</label><textarea className="form-input" rows={2} value={form.companyBio} onChange={e => setForm({ ...form, companyBio: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">About the Company (detailed)</label><textarea className="form-input" rows={4} value={form.companyAbout} onChange={e => setForm({ ...form, companyAbout: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Official Website</label><input className="form-input" placeholder="https://..." value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onSave(form)}>Save Company Info</button>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mount
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
