// Supabase client for NEXUS - replaces localStorage for brands and products
// IMPORTANT: You need to set up Supabase and create tables before this will work
// See SETUP_INSTRUCTIONS below

/* 
=== SETUP INSTRUCTIONS ===

1. Create a free Supabase account at https://supabase.com
2. Create a new project
3. Go to Project Settings > API to get your:
   - SUPABASE_URL (e.g., https://xyz.supabase.co)
   - SUPABASE_ANON_KEY (public anon key)
4. Replace the placeholders below with your actual credentials
5. Run the following SQL in the Supabase SQL Editor to create tables:

-- Brands table
CREATE TABLE brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  verified BOOLEAN DEFAULT false,
  theme JSONB,
  company_bio TEXT,
  company_about TEXT,
  net_worth TEXT,
  employees TEXT,
  branches TEXT,
  founded TEXT,
  headquarters TEXT,
  stock_symbol TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL,
  brand_name TEXT,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  price_currency TEXT DEFAULT '$',
  category TEXT DEFAULT 'Other',
  sponsored BOOLEAN DEFAULT false,
  image_url TEXT,
  model_url TEXT,
  ingredients JSONB DEFAULT '[]',
  ingredients_label TEXT DEFAULT 'Ingredients / Materials',
  specs JSONB DEFAULT '{}',
  purchase_links JSONB DEFAULT '[]',
  theme JSONB,
  verified BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- Enable RLS (Row Level Security) - for public read, admin write
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access for brands" ON brands FOR SELECT USING (true);
CREATE POLICY "Public read access for products" ON products FOR SELECT USING (true);

-- Allow public insert/update/delete (for simplicity - you may want to add auth later)
CREATE POLICY "Public write access for brands" ON brands FOR ALL USING (true);
CREATE POLICY "Public write access for products" ON products FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_category ON products(category);
*/

// ⚠️ REPLACE THESE WITH YOUR ACTUAL SUPABASE CREDENTIALS
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

let supabase = null;

function initSupabase() {
  if (supabase) return supabase;
  
  if (typeof window.supabase === 'undefined') {
    console.error('Supabase client not loaded. Please check the script tag in index.html');
    return null;
  }
  
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
    console.warn('Supabase credentials not configured. Using localStorage as fallback.');
    return null;
  }
  
  try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabase;
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    return null;
  }
}

// Brand operations
async function fetchBrands() {
  const client = initSupabase();
  if (!client) return null; // Fallback to localStorage
  
  try {
    const { data, error } = await client
      .from('brands')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Convert snake_case to camelCase for consistency with existing code
    return data.map(brand => ({
      id: brand.id,
      name: brand.name,
      description: brand.description,
      logoUrl: brand.logo_url,
      website: brand.website,
      verified: brand.verified,
      theme: brand.theme,
      companyBio: brand.company_bio,
      companyAbout: brand.company_about,
      netWorth: brand.net_worth,
      employees: brand.employees,
      branches: brand.branches,
      founded: brand.founded,
      headquarters: brand.headquarters,
      stockSymbol: brand.stock_symbol,
    }));
  } catch (error) {
    console.error('Error fetching brands:', error);
    return null;
  }
}

async function saveBrand(brand) {
  const client = initSupabase();
  if (!client) return false; // Fallback to localStorage
  
  try {
    const dbBrand = {
      id: brand.id,
      name: brand.name,
      description: brand.description,
      logo_url: brand.logoUrl,
      website: brand.website,
      verified: brand.verified,
      theme: brand.theme,
      company_bio: brand.companyBio,
      company_about: brand.companyAbout,
      net_worth: brand.netWorth,
      employees: brand.employees,
      branches: brand.branches,
      founded: brand.founded,
      headquarters: brand.headquarters,
      stock_symbol: brand.stockSymbol,
      updated_at: new Date().toISOString(),
    };
    
    const { error } = await client
      .from('brands')
      .upsert(dbBrand, { onConflict: 'id' });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving brand:', error);
    return false;
  }
}

async function deleteBrand(brandId) {
  const client = initSupabase();
  if (!client) return false; // Fallback to localStorage
  
  try {
    const { error } = await client
      .from('brands')
      .delete()
      .eq('id', brandId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting brand:', error);
    return false;
  }
}

// Product operations
async function fetchProducts() {
  const client = initSupabase();
  if (!client) return null; // Fallback to localStorage
  
  try {
    const { data, error } = await client
      .from('products')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    // Convert snake_case to camelCase
    return data.map(product => ({
      id: product.id,
      brandId: product.brand_id,
      brandName: product.brand_name,
      name: product.name,
      description: product.description,
      price: product.price,
      priceCurrency: product.price_currency,
      category: product.category,
      sponsored: product.sponsored,
      imageUrl: product.image_url,
      modelUrl: product.model_url,
      ingredients: product.ingredients || [],
      ingredientsLabel: product.ingredients_label || 'Ingredients / Materials',
      specs: product.specs || {},
      purchaseLinks: product.purchase_links || [],
      theme: product.theme,
      verified: product.verified,
      updatedAt: product.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return null;
  }
}

async function saveProduct(product) {
  const client = initSupabase();
  if (!client) return false; // Fallback to localStorage
  
  try {
    const dbProduct = {
      id: product.id,
      brand_id: product.brandId,
      brand_name: product.brandName,
      name: product.name,
      description: product.description,
      price: product.price,
      price_currency: product.priceCurrency,
      category: product.category,
      sponsored: product.sponsored,
      image_url: product.imageUrl,
      model_url: product.modelUrl,
      ingredients: product.ingredients || [],
      ingredients_label: product.ingredientsLabel || 'Ingredients / Materials',
      specs: product.specs || {},
      purchase_links: product.purchaseLinks || [],
      theme: product.theme,
      verified: product.verified,
      updated_at: new Date().toISOString(),
    };
    
    const { error } = await client
      .from('products')
      .upsert(dbProduct, { onConflict: 'id' });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving product:', error);
    return false;
  }
}

async function deleteProduct(productId) {
  const client = initSupabase();
  if (!client) return false; // Fallback to localStorage
  
  try {
    const { error } = await client
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
}

// Export to global scope
window.NEXUS_SUPABASE = {
  initSupabase,
  fetchBrands,
  saveBrand,
  deleteBrand,
  fetchProducts,
  saveProduct,
  deleteProduct,
  isConfigured: () => SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE',
};
