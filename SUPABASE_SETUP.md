# Supabase Setup Guide — FisherMart

This guide explains how to connect FisherMart to a real cloud backend using Supabase (free tier).

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up / log in
2. Click **"New Project"**
3. Fill in: Project Name = `fishermart`, Password = (choose a strong password), Region = closest to Nigeria (e.g. **West EU** or **East US**)
4. Click **"Create new project"** and wait ~2 minutes for provisioning

---

## 2. Create the Database Tables

Go to your Supabase dashboard → **SQL Editor** → paste and run this SQL:

```sql
-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  price_per_unit REAL NOT NULL DEFAULT 0,
  description TEXT,
  location TEXT,
  fisher_name TEXT,
  fisher_phone TEXT,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sync_status TEXT NOT NULL DEFAULT 'synced',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  total_price REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  sync_status TEXT NOT NULL DEFAULT 'synced',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- Enable Row Level Security (optional — for production)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for demo purposes
CREATE POLICY "Public products access" ON products FOR ALL USING (true);
CREATE POLICY "Public orders access" ON orders FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_updated ON products(updated_at);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
```

---

## 3. Get Your API Keys

1. In the Supabase dashboard, go to **Settings → API**
2. Copy:
   - **Project URL** (looks like `https://abcxyz.supabase.co`)
   - **anon/public** key (long JWT string)

---

## 4. Add Keys to FisherMart

Open `src/utils/constants.ts` and replace the placeholder values:

```ts
// Supabase — replace these with your project's values from supabase.com
export const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';  // ← Replace
export const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';              // ← Replace
```

**Example:**
```ts
export const SUPABASE_URL = 'https://abcdefghijklmnop.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

## 5. Test the Connection

1. Start the app: `npm start`
2. Add a product in Inventory
3. Go to **Profile → Sync Now** (while connected to internet)
4. Check Supabase dashboard → **Table Editor → products** — your product should appear ✅

---

## Architecture Notes

```
┌─────────────────────────┐     ┌──────────────────────┐
│   FisherMart App        │     │   Supabase Backend   │
│                         │     │                      │
│  SQLite (local DB)      │────▶│  PostgreSQL (cloud)  │
│  - Immediate writes     │     │  - products table    │
│  - Works offline        │◀────│  - orders table      │
│                         │     │                      │
│  Sync Queue             │     │  REST API (auto)     │
│  - Mutations queued     │────▶│  - used by syncService│
│  - Replayed on reconnect│     │                      │
└─────────────────────────┘     └──────────────────────┘
```

**Sync Flow:**
1. User adds/edits item → saved to SQLite immediately
2. Operation queued in `sync_queue` table (SQLite)
3. Network detected → sync engine pushes queue to Supabase
4. Supabase data pulled into local SQLite

---

## Optional: Real-time Updates (Advanced)

To receive live updates from other fishers, add a Supabase Realtime subscription in `syncService.ts`:

```ts
supabase
  .channel('products')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
    // Handle real-time product update
    console.log('Remote change:', payload);
  })
  .subscribe();
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Sync fails silently | Check Supabase API keys in `constants.ts` |
| RLS policy error | Run the CREATE POLICY SQL statements above |
| Products not syncing | Check network status banner in app header |
| Data mismatch | Use Profile → Sync Now to force full sync |
