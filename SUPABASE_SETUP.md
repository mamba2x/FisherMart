# Supabase Setup Guide — FisherMart

This guide explains how to configure a free Supabase cloud database to enable fully secure, offline-first synchronization with RLS policies.

---

## 1. Enable Anonymous Authentication

In your Supabase Dashboard:
1. Go to **Authentication** (sidebar).
2. Go to **Providers** (tab/sub-menu).
3. Select **Anonymous** from the list.
4. Toggle **Enable Anonymous Sign-in** to **ON** and click **Save**.

---

## 2. Run SQL Database Setup

Go to your Supabase Dashboard → **SQL Editor** → click **New query**, paste the following SQL script, and click **Run**:

```sql
-- 1. Profiles Table (Linked to Supabase Auth User ID)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  zone TEXT,
  village TEXT,
  boat_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "profile_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profile_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profile_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);


-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  fish_species TEXT,
  catch_date TEXT,
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
  last_sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products Policies
CREATE POLICY "products_select_available" ON public.products
  FOR SELECT USING (is_available = true AND is_deleted = false);

CREATE POLICY "products_select_own" ON public.products
  FOR SELECT USING (auth.uid()::text = owner_id);

CREATE POLICY "products_insert_own" ON public.products
  FOR INSERT WITH CHECK (auth.uid()::text = owner_id);

CREATE POLICY "products_update_own" ON public.products
  FOR UPDATE USING (auth.uid()::text = owner_id) WITH CHECK (auth.uid()::text = owner_id);

CREATE POLICY "products_delete_own" ON public.products
  FOR DELETE USING (auth.uid()::text = owner_id);


-- 3. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,       -- Buyer's auth.uid()
  seller_id TEXT NOT NULL,      -- Seller's auth.uid()
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  seller_name TEXT,
  seller_phone TEXT,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  total_price REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  last_sync_error TEXT,
  sync_status TEXT NOT NULL DEFAULT 'synced',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Orders Policies
CREATE POLICY "orders_insert_buyer" ON public.orders
  FOR INSERT WITH CHECK (
    auth.uid()::text = owner_id 
    AND auth.uid()::text <> seller_id
  );

CREATE POLICY "orders_select_buyer" ON public.orders
  FOR SELECT USING (auth.uid()::text = owner_id);

CREATE POLICY "orders_select_seller" ON public.orders
  FOR SELECT USING (auth.uid()::text = seller_id);


-- 4. Secure RPC Function for Seller Order Status Updates
CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id TEXT,
  p_new_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Caller must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- 2. Validate allowed status values
  IF p_new_status NOT IN (
    'pending', 'accepted', 'rejected', 'processing', 'completed', 'cancelled'
  ) THEN
    RAISE EXCEPTION 'Invalid status: %', p_new_status;
  END IF;

  -- 3. Caller must be the seller of this order
  IF NOT EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = p_order_id
      AND seller_id = auth.uid()::text
  ) THEN
    RAISE EXCEPTION 'Unauthorised: you are not the seller of this order';
  END IF;

  -- 4. Update ONLY status and updated_at (leaving other columns completely untouched)
  UPDATE public.orders
    SET status = p_new_status,
        updated_at = NOW()
    WHERE id = p_order_id;
END;
$$;

-- Revoke default public execution rights
REVOKE ALL ON FUNCTION public.update_order_status(TEXT, TEXT) FROM PUBLIC;

-- Grant execution permissions only to authenticated users (including anonymous sessions)
GRANT EXECUTE ON FUNCTION public.update_order_status(TEXT, TEXT) TO authenticated;


-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_owner ON public.products(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_updated ON public.products(updated_at);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_owner ON public.orders(owner_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
```

---

## 3. Get Your API Keys

1. In the Supabase dashboard, go to **Project Settings** → **API** (sidebar).
2. Copy:
   - **Project URL** (e.g. `https://abcxyz.supabase.co`)
   - **anon public key** (long token string)
3. Share them in the chat to insert them into `app.json`.
