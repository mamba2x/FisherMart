import { getDb } from '../database/db';
import { Product } from '../database/types';
import { queueMutation } from './syncService';
import { getOwnerIdFromAuth } from './authService';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// ── Get all products (not deleted) ─────────────────────────────────────────
export const getAllProducts = async (category?: string): Promise<Product[]> => {
  const db = await getDb();
  if (category && category !== 'All') {
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM products WHERE is_deleted = 0 AND category = ? ORDER BY created_at DESC`,
      [category]
    );
    return rows.map(mapRowToProduct);
  }
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM products WHERE is_deleted = 0 ORDER BY created_at DESC`
  );
  return rows.map(mapRowToProduct);
};

// ── Get marketplace products (all available from all fishers) ──────────────
export const getMarketplaceProducts = async (search?: string, category?: string): Promise<Product[]> => {
  const db = await getDb();
  let query = `SELECT * FROM products WHERE is_deleted = 0 AND is_available = 1`;
  const params: any[] = [];

  if (category && category !== 'All') {
    query += ` AND category = ?`;
    params.push(category);
  }

  if (search && search.trim()) {
    query += ` AND (name LIKE ? OR description LIKE ? OR location LIKE ?)`;
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  query += ` ORDER BY created_at DESC`;

  const rows = await db.getAllAsync<any>(query, params);
  return rows.map(mapRowToProduct);
};

// ── Get single product ─────────────────────────────────────────────────────
export const getProductById = async (id: string): Promise<Product | null> => {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    `SELECT * FROM products WHERE id = ? AND is_deleted = 0`, [id]
  );
  return row ? mapRowToProduct(row) : null;
};

// ── Create product ─────────────────────────────────────────────────────────
export const createProduct = async (
  data: Omit<Product, 'id' | 'owner_id' | 'sync_status' | 'created_at' | 'updated_at' | 'synced_at' | 'is_deleted'>
): Promise<Product> => {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = uuidv4();
  const owner_id = await getOwnerIdFromAuth();

  const product: Product = {
    ...data,
    id,
    owner_id,
    sync_status: 'pending',
    created_at: now,
    updated_at: now,
    is_deleted: false,
  };

  await db.runAsync(
    `INSERT INTO products
      (id, owner_id, name, category, fish_species, catch_date, quantity, unit, price_per_unit, description,
       location, fisher_name, fisher_phone, image_url, is_available,
       sync_status, created_at, updated_at, is_deleted)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      product.id, product.owner_id ?? null, product.name, product.category, product.fish_species ?? null, product.catch_date ?? null,
      product.quantity, product.unit, product.price_per_unit, product.description ?? null,
      product.location ?? null, product.fisher_name ?? null, product.fisher_phone ?? null, product.image_url ?? null,
      product.is_available ? 1 : 0, 'pending',
      product.created_at, product.updated_at, 0,
    ]
  );

  await queueMutation('INSERT', 'products', id, product);
  return product;
};

// ── Update product ─────────────────────────────────────────────────────────
export const updateProduct = async (
  id: string,
  data: Partial<Omit<Product, 'id' | 'created_at' | 'is_deleted'>>
): Promise<void> => {
  const db = await getDb();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE products SET
      name=COALESCE(?,name), category=COALESCE(?,category),
      fish_species=COALESCE(?,fish_species), catch_date=COALESCE(?,catch_date),
      quantity=COALESCE(?,quantity), unit=COALESCE(?,unit),
      price_per_unit=COALESCE(?,price_per_unit), description=COALESCE(?,description),
      location=COALESCE(?,location), fisher_name=COALESCE(?,fisher_name),
      fisher_phone=COALESCE(?,fisher_phone), is_available=COALESCE(?,is_available),
      sync_status='pending', updated_at=?
    WHERE id=?`,
    [
      data.name ?? null, data.category ?? null,
      data.fish_species ?? null, data.catch_date ?? null,
      data.quantity ?? null, data.unit ?? null,
      data.price_per_unit ?? null, data.description ?? null,
      data.location ?? null, data.fisher_name ?? null,
      data.fisher_phone ?? null,
      data.is_available !== undefined ? (data.is_available ? 1 : 0) : null,
      now, id,
    ]
  );

  const updated = await getProductById(id);
  if (updated) await queueMutation('UPDATE', 'products', id, updated);
};

// ── Soft delete product ────────────────────────────────────────────────────
export const deleteProduct = async (id: string): Promise<void> => {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE products SET is_deleted=1, sync_status='pending', updated_at=? WHERE id=?`,
    [now, id]
  );
  await queueMutation('DELETE', 'products', id, { id, is_deleted: true, updated_at: now });
};

// ── Get inventory stats ────────────────────────────────────────────────────
export const getInventoryStats = async () => {
  const db = await getDb();
  const totalValue = await db.getFirstAsync<{ total: number }>(
    `SELECT SUM(quantity * price_per_unit) as total FROM products WHERE is_deleted=0`
  );
  const count = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM products WHERE is_deleted=0`
  );
  const pending = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM products WHERE is_deleted=0 AND sync_status='pending'`
  );
  return {
    totalValue: totalValue?.total ?? 0,
    count: count?.count ?? 0,
    pendingSync: pending?.count ?? 0,
  };
};

// ── Map SQLite row to TypeScript Product ──────────────────────────────────
const mapRowToProduct = (row: any): Product => ({
  id: row.id,
  owner_id: row.owner_id,
  name: row.name,
  category: row.category,
  fish_species: row.fish_species,
  catch_date: row.catch_date,
  quantity: row.quantity,
  unit: row.unit,
  price_per_unit: row.price_per_unit,
  description: row.description,
  location: row.location,
  fisher_name: row.fisher_name,
  fisher_phone: row.fisher_phone,
  image_url: row.image_url,
  is_available: row.is_available === 1,
  sync_status: row.sync_status,
  last_sync_error: row.last_sync_error,
  created_at: row.created_at,
  updated_at: row.updated_at,
  synced_at: row.synced_at,
  is_deleted: row.is_deleted === 1,
});
