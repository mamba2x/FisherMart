import * as SQLite from 'expo-sqlite';
import { DB_NAME } from '../utils/constants';

let _db: SQLite.SQLiteDatabase | null = null;

export const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return _db;
};

export const initializeDatabase = async (): Promise<void> => {
  const db = await getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- Products / Inventory
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      owner_id TEXT,
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
      is_available INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      last_sync_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT,
      is_deleted INTEGER NOT NULL DEFAULT 0
    );

    -- Orders
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      owner_id TEXT,
      seller_id TEXT,
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
      sync_status TEXT NOT NULL DEFAULT 'pending',
      last_sync_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- Sync queue (mutations waiting to be sent to server)
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- App settings / profile
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_products_sync ON products(sync_status);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_owner ON products(owner_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_owner ON orders(owner_id);
    CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_table ON sync_queue(table_name);
  `);

  // Safe table migrations for existing installations
  try {
    await db.execAsync(`ALTER TABLE products ADD COLUMN owner_id TEXT;`);
  } catch (e) {}
  try {
    await db.execAsync(`ALTER TABLE products ADD COLUMN fish_species TEXT;`);
  } catch (e) {}
  try {
    await db.execAsync(`ALTER TABLE products ADD COLUMN catch_date TEXT;`);
  } catch (e) {}
  try {
    await db.execAsync(`ALTER TABLE products ADD COLUMN last_sync_error TEXT;`);
  } catch (e) {}

  try {
    await db.execAsync(`ALTER TABLE orders ADD COLUMN owner_id TEXT;`);
  } catch (e) {}
  try {
    await db.execAsync(`ALTER TABLE orders ADD COLUMN seller_id TEXT;`);
  } catch (e) {}
  try {
    await db.execAsync(`ALTER TABLE orders ADD COLUMN seller_name TEXT;`);
  } catch (e) {}
  try {
    await db.execAsync(`ALTER TABLE orders ADD COLUMN seller_phone TEXT;`);
  } catch (e) {}
  try {
    await db.execAsync(`ALTER TABLE orders ADD COLUMN last_sync_error TEXT;`);
  } catch (e) {}
};

export const resetDatabase = async (): Promise<void> => {
  const db = await getDb();
  await db.execAsync(`
    DROP TABLE IF EXISTS sync_queue;
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS settings;
  `);
  await initializeDatabase();
};
