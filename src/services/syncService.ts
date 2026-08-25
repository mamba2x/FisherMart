// FisherMart — Sync Service
// Handles background data synchronization between local SQLite and remote Supabase database.
// Leverages SQLite sync_queue for offline-first transactional mutations.

import { getDb } from '../database/db';
import { SyncQueueItem } from '../database/types';
import { supabase, getAuthUid } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SYNC_BATCH_SIZE, SUPABASE_CONFIGURED } from '../utils/constants';
import { ensureAnonymousSession } from './authService';

const LAST_SYNC_KEY = '@fishermart_last_sync';
const PROFILE_KEY = '@fishermart_profile';

// Mutex lock to prevent concurrent sync operations
let _syncRunning = false;

// ── Queue a mutation for later syncing ─────────────────────────────────────
export const queueMutation = async (
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'ORDER_STATUS_UPDATE',
  tableName: string,
  recordId: string,
  payload: object
): Promise<void> => {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO sync_queue (operation, table_name, record_id, payload, retry_count, created_at)
     VALUES (?, ?, ?, ?, 0, ?)`,
    [operation, tableName, recordId, JSON.stringify(payload), now]
  );
};

// ── Get all pending items from the sync queue ──────────────────────────────
export const getPendingQueue = async (): Promise<SyncQueueItem[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<SyncQueueItem>(
    `SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT ?`,
    [SYNC_BATCH_SIZE]
  );
  return rows;
};

// ── Remove a successfully synced item from the queue ───────────────────────
export const removeFromQueue = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [id]);
};

// ── Count pending sync items ───────────────────────────────────────────────
export const getPendingSyncCount = async (): Promise<number> => {
  const db = await getDb();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM sync_queue`
  );
  return result?.count ?? 0;
};

// ── Count failed sync items ────────────────────────────────────────────────
export const getFailedSyncCount = async (): Promise<number> => {
  const db = await getDb();
  // Failed items are those in the products/orders table with sync_status = 'failed'
  const pFailed = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM products WHERE sync_status = 'failed'`
  );
  const oFailed = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM orders WHERE sync_status = 'failed'`
  );
  return (pFailed?.count ?? 0) + (oFailed?.count ?? 0);
};

// ── Retry a single failed record ───────────────────────────────────────────
export const retryRecord = async (id: string, tableName: 'products' | 'orders'): Promise<void> => {
  const db = await getDb();
  // 1. Reset sync status in main table
  await db.runAsync(
    `UPDATE ${tableName} SET sync_status = 'pending', last_sync_error = NULL WHERE id = ?`,
    [id]
  );
  // 2. Reset retry count in sync_queue for this record
  await db.runAsync(
    `UPDATE sync_queue SET retry_count = 0 WHERE table_name = ? AND record_id = ?`,
    [tableName, id]
  );
};

// ── Retry all failed records ───────────────────────────────────────────────
export const retryAllFailed = async (): Promise<void> => {
  const db = await getDb();
  await db.runAsync(`UPDATE products SET sync_status = 'pending', last_sync_error = NULL WHERE sync_status = 'failed'`);
  await db.runAsync(`UPDATE orders SET sync_status = 'pending', last_sync_error = NULL WHERE sync_status = 'failed'`);
  await db.runAsync(`UPDATE sync_queue SET retry_count = 0`);
};

// ── Pull remote data from Supabase ────────────────────────────────────────
const pullFromServer = async (): Promise<void> => {
  if (!SUPABASE_CONFIGURED || !supabase) return; // offline-only mode

  const db = await getDb();
  const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
  const uid = await getAuthUid();

  // 1. Pull products updated since last sync
  let productQuery = supabase
    .from('products')
    .select('*')
    .order('updated_at', { ascending: false });

  if (lastSync) {
    productQuery = productQuery.gt('updated_at', lastSync);
  }

  const { data: products, error: productError } = await productQuery.limit(200);
  if (productError) throw new Error(`Pull products error: ${productError.message}`);

  if (products && products.length > 0) {
    for (const p of products) {
      const existing = await db.getFirstAsync<any>(
        `SELECT id, sync_status, updated_at FROM products WHERE id = ?`, [p.id]
      );

      if (existing) {
        // If local mutation is not yet synced, preserve the local version
        if (existing.sync_status === 'synced') {
          const localTime = new Date(existing.updated_at).getTime();
          const remoteTime = new Date(p.updated_at).getTime();
          if (remoteTime > localTime) {
            await db.runAsync(
              `UPDATE products SET
                owner_id=?, name=?, category=?, fish_species=?, catch_date=?, quantity=?, unit=?, price_per_unit=?,
                description=?, location=?, fisher_name=?, fisher_phone=?,
                image_url=?, is_available=?, updated_at=?, synced_at=?, is_deleted=?,
                sync_status='synced'
              WHERE id=?`,
              [
                p.owner_id, p.name, p.category, p.fish_species, p.catch_date, p.quantity, p.unit, p.price_per_unit,
                p.description, p.location, p.fisher_name, p.fisher_phone,
                p.image_url, p.is_available ? 1 : 0, p.updated_at,
                new Date().toISOString(), p.is_deleted ? 1 : 0, p.id,
              ]
            );
          }
        }
      } else {
        await db.runAsync(
          `INSERT OR IGNORE INTO products
            (id, owner_id, name, category, fish_species, catch_date, quantity, unit, price_per_unit, description,
             location, fisher_name, fisher_phone, image_url, is_available,
             sync_status, created_at, updated_at, synced_at, is_deleted)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            p.id, p.owner_id, p.name, p.category, p.fish_species, p.catch_date, p.quantity, p.unit, p.price_per_unit,
            p.description, p.location, p.fisher_name, p.fisher_phone,
            p.image_url, p.is_available ? 1 : 0, 'synced',
            p.created_at, p.updated_at, new Date().toISOString(),
            p.is_deleted ? 1 : 0,
          ]
        );
      }
    }
  }

  // 2. Pull orders where the user is either the buyer (owner_id) or the seller (seller_id)
  if (uid) {
    let orderQuery = supabase
      .from('orders')
      .select('*')
      .or(`seller_id.eq.${uid},owner_id.eq.${uid}`)
      .order('updated_at', { ascending: false });

    if (lastSync) {
      orderQuery = orderQuery.gt('updated_at', lastSync);
    }

    const { data: orders, error: orderError } = await orderQuery.limit(200);
    if (orderError) throw new Error(`Pull orders error: ${orderError.message}`);

    if (orders && orders.length > 0) {
      for (const o of orders) {
        const existing = await db.getFirstAsync<any>(
          `SELECT id, sync_status, updated_at FROM orders WHERE id = ?`, [o.id]
        );

        if (existing) {
          // If local mutation is not yet synced, preserve the local version
          if (existing.sync_status === 'synced') {
            const localTime = new Date(existing.updated_at).getTime();
            const remoteTime = new Date(o.updated_at).getTime();
            if (remoteTime > localTime) {
              await db.runAsync(
                `UPDATE orders SET
                  owner_id=?, seller_id=?, product_id=?, product_name=?, buyer_name=?, buyer_phone=?,
                  seller_name=?, seller_phone=?, quantity=?, unit=?,
                  total_price=?, status=?, notes=?, is_deleted=?, updated_at=?, synced_at=?, sync_status='synced'
                WHERE id=?`,
                [
                  o.owner_id, o.seller_id, o.product_id, o.product_name, o.buyer_name, o.buyer_phone,
                  o.seller_name, o.seller_phone, o.quantity, o.unit,
                  o.total_price, o.status, o.notes, o.is_deleted ? 1 : 0, o.updated_at,
                  new Date().toISOString(), o.id
                ]
              );
            }
          }
        } else {
          await db.runAsync(
            `INSERT OR IGNORE INTO orders
              (id, owner_id, seller_id, product_id, product_name, buyer_name, buyer_phone,
               seller_name, seller_phone, quantity, unit, total_price, status, notes,
               sync_status, created_at, updated_at, synced_at, is_deleted)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
              o.id, o.owner_id, o.seller_id, o.product_id, o.product_name, o.buyer_name, o.buyer_phone,
              o.seller_name, o.seller_phone, o.quantity, o.unit, o.total_price, o.status, o.notes,
              'synced', o.created_at, o.updated_at, new Date().toISOString(), o.is_deleted ? 1 : 0
            ]
          );
        }
      }
    }
  }
};

// ── Push local mutations to Supabase ─────────────────────────────────────
const pushToServer = async (): Promise<{ pushed: number; failed: number }> => {
  if (!SUPABASE_CONFIGURED || !supabase) return { pushed: 0, failed: 0 }; // offline-only mode

  const queue = await getPendingQueue();
  let pushed = 0;
  let failed = 0;

  for (const item of queue) {
    const db = await getDb();
    try {
      const payload = JSON.parse(item.payload);

      // Safety check: abort if the payload contains any temporary owner ID
      const savedProfile = await AsyncStorage.getItem(PROFILE_KEY);
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        if (profile.auth_pending) {
          throw new Error('Awaiting owner ID migration, cannot push');
        }
        if (payload.owner_id === profile.temporary_owner_id) {
          throw new Error('Payload contains temporary owner ID, cannot push');
        }
      }

      // Mark local record status as 'syncing'
      if (item.operation !== 'ORDER_STATUS_UPDATE') {
        await db.runAsync(
          `UPDATE ${item.table_name} SET sync_status = 'syncing' WHERE id = ?`,
          [item.record_id]
        );
      }

      if (item.operation === 'INSERT' || item.operation === 'UPDATE') {
        const { error } = await supabase
          .from(item.table_name)
          .upsert(payload, { onConflict: 'id' });

        if (error) throw error;

        // Mark local record as synced
        await db.runAsync(
          `UPDATE ${item.table_name} SET sync_status='synced', synced_at=?, last_sync_error=NULL WHERE id=?`,
          [new Date().toISOString(), item.record_id]
        );
      } else if (item.operation === 'DELETE') {
        const { error } = await supabase
          .from(item.table_name)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', item.record_id);

        if (error) throw error;

        // Mark local record as synced
        await db.runAsync(
          `UPDATE ${item.table_name} SET sync_status='synced', synced_at=?, last_sync_error=NULL WHERE id=?`,
          [new Date().toISOString(), item.record_id]
        );
      } else if (item.operation === 'ORDER_STATUS_UPDATE') {
        // Seller status changes processed via hardened RPC call
        const { error } = await supabase.rpc('update_order_status', {
          p_order_id: payload.order_id,
          p_new_status: payload.new_status,
        });

        if (error) throw error;

        // Mark order as synced
        await db.runAsync(
          `UPDATE orders SET sync_status='synced', synced_at=?, last_sync_error=NULL WHERE id=?`,
          [new Date().toISOString(), item.record_id]
        );
      }

      await removeFromQueue(item.id!);
      pushed++;
    } catch (err: any) {
      console.error(`Sync error on item ${item.record_id}:`, err.message);

      // Set sync status to failed and store the error message in the record
      if (item.operation !== 'ORDER_STATUS_UPDATE') {
        await db.runAsync(
          `UPDATE ${item.table_name} SET sync_status = 'failed', last_sync_error = ? WHERE id = ?`,
          [err.message || 'Sync failed', item.record_id]
        );
      } else {
        await db.runAsync(
          `UPDATE orders SET sync_status = 'failed', last_sync_error = ? WHERE id = ?`,
          [err.message || 'RPC Status Sync failed', item.record_id]
        );
      }

      // Increment retry count in sync queue
      await db.runAsync(
        `UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?`,
        [item.id!]
      );
      failed++;
    }
  }

  return { pushed, failed };
};

// ── Main sync function — call this whenever online ─────────────────────────
export const syncData = async (): Promise<{
  success: boolean;
  pushed: number;
  pulled: number;
  error?: string;
}> => {
  if (_syncRunning) {
    return { success: false, pushed: 0, pulled: 0, error: 'Synchronization already in progress' };
  }
  _syncRunning = true;

  try {
    // 1. Ensure Supabase anonymous authentication is ready
    const uid = await ensureAnonymousSession();
    if (!uid) {
      throw new Error('Authentication is required to sync data');
    }

    // 2. Abort if migration is still pending
    const savedProfile = await AsyncStorage.getItem(PROFILE_KEY);
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      if (profile.auth_pending) {
        throw new Error('Awaiting owner ID migration before starting sync');
      }
    }

    // 3. Push local changes first
    const { pushed } = await pushToServer();

    // 4. Pull remote updates
    await pullFromServer();

    // 5. Update last sync timestamp
    const now = new Date().toISOString();
    await AsyncStorage.setItem(LAST_SYNC_KEY, now);

    _syncRunning = false;
    return { success: true, pushed, pulled: 0 };
  } catch (err: any) {
    _syncRunning = false;
    return { success: false, pushed: 0, pulled: 0, error: err.message };
  }
};

// ── Get last sync time ─────────────────────────────────────────────────────
export const getLastSyncTime = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(LAST_SYNC_KEY);
};

// ── Get failed records with error messages ─────────────────────────────────
export const getFailedRecords = async (): Promise<any[]> => {
  const db = await getDb();
  const products = await db.getAllAsync<any>(
    `SELECT id, name, 'products' as table_name, last_sync_error FROM products WHERE sync_status = 'failed'`
  );
  const orders = await db.getAllAsync<any>(
    `SELECT id, product_name as name, 'orders' as table_name, last_sync_error FROM orders WHERE sync_status = 'failed'`
  );
  return [...products, ...orders];
};
