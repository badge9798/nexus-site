# Supabase Setup Instructions for NEXUS

This guide will help you set up Supabase to replace localStorage for storing brands and products. This will allow your data to be shared across all devices.

## Why Supabase?

localStorage only stores data on the device you're using. Your phone won't see products added on your laptop, and vice versa. Supabase is a free online database that solves this problem by storing data in the cloud.

## Step 1: Create a Supabase Account

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub or email (it's free)
4. Create a new project:
   - Name: `nexus-site` (or any name you prefer)
   - Database password: Choose a strong password and save it
   - Region: Choose the region closest to you
   - Wait for the project to be created (takes 1-2 minutes)

## Step 2: Get Your Credentials

1. Once your project is ready, go to **Project Settings** (left sidebar)
2. Click on **API** in the settings menu
3. Copy these two values:
   - **Project URL** (looks like `https://xyz.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

## Step 3: Configure the Code

1. Open `js/supabase-client.js` in your project
2. Find these lines at the top:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';
   ```
3. Replace them with your actual credentials:
   ```javascript
   const SUPABASE_URL = 'https://your-project-id.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
   ```

## Step 4: Create Database Tables

1. In Supabase, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy and paste the following SQL and click **Run**:

```sql
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

-- Enable RLS (Row Level Security)
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access for brands" ON brands FOR SELECT USING (true);
CREATE POLICY "Public read access for products" ON products FOR SELECT USING (true);

-- Allow public insert/update/delete
CREATE POLICY "Public write access for brands" ON brands FOR ALL USING (true);
CREATE POLICY "Public write access for products" ON products FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_category ON products(category);
```

## Step 5: Test the Setup

1. Save all your files
2. Open your NEXUS site in a browser
3. Open the browser console (F12)
4. You should see "Loading NEXUS..." briefly, then the site loads
5. If Supabase is configured correctly, you won't see any warnings in the console
6. Try adding a brand or product - it should now save to Supabase

## Step 6: Verify Data is in Supabase

1. In Supabase, go to **Table Editor** (left sidebar)
2. Click on the **brands** table - you should see any brands you added
3. Click on the **products** table - you should see any products you added

## Troubleshooting

**"Supabase credentials not configured" warning in console:**
- Make sure you replaced the placeholder values in `supabase-client.js`
- Refresh your browser after saving the file

**"Failed to initialize Supabase" error:**
- Check that your URL and key are correct
- Make sure you copied the entire anon key (it's long)

**Data not saving to Supabase:**
- Check the browser console for error messages
- Make sure you ran the SQL to create the tables
- Verify your Supabase project is active (not paused)

**Site still uses localStorage:**
- The code automatically falls back to localStorage if Supabase fails
- This is intentional - your site will still work even if Supabase has issues
- Check console warnings to see why Supabase isn't being used

## Security Note

The current setup allows public read/write access to your database. This is fine for a personal project, but for production you should:

1. Add authentication (Supabase Auth)
2. Restrict write operations to authenticated users
3. Use Row Level Security policies to protect your data

For now, this setup is safe for personal use and testing.

## Migrating Existing Data

If you already have brands/products in localStorage:

1. Open your NEXUS site before configuring Supabase
2. Go to Settings page (admin mode required)
3. Click "Export JSON" to download your data
4. Configure Supabase following the steps above
5. After Supabase is working, you can manually re-add your brands/products
   (The export is for backup - there's no automatic import yet)

## Need Help?

- Supabase documentation: https://supabase.com/docs
- Check the browser console for error messages
- Make sure your Supabase project is not paused (free projects pause after inactivity)
