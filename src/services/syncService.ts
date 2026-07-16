import { getDb } from '../database/db';
import { SyncQueueItem } from '../database/types';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SYNC_BATCH_SIZE, SUPABASE_CONFIGURED } from '../utils/constants';

const LAST_SYNC_KEY = '@fishermart_last_sync';

// ── Queue a mutation for later syncing ─────────────────────────────────────
export const queueMutation = async (
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
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

// ── Pull remote data from Supabase ────────────────────────────────────────
const pullFromServer = async (): Promise<void> => {
  if (!SUPABASE_CONFIGURED || !supabase) return; // offline-only mode

  const db = await getDb();
  const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);

  // Pull products updated since last sync
  let query = supabase
    .from('products')
    .select('*')
    .order('updated_at', { ascending: false });

  if (lastSync) {
    query = query.gt('updated_at', lastSync);
  }

  const { data: products, error } = await query.limit(200);

  if (error) throw new Error(`Pull error: ${error.message}`);

  if (products && products.length > 0) {
    for (const p of products) {
      const existing = await db.getFirstAsync(
        `SELECT id FROM products WHERE id = ?`, [p.id]
      );

      if (existing) {
        await db.runAsync(
          `UPDATE products SET
            name=?, category=?, quantity=?, unit=?, price_per_unit=?,
            description=?, location=?, fisher_name=?, fisher_phone=?,
            image_url=?, is_available=?, updated_at=?, synced_at=?, is_deleted=?,
            sync_status='synced'
          WHERE id=?`,
          [
            p.name, p.category, p.quantity, p.unit, p.price_per_unit,
            p.description, p.location, p.fisher_name, p.fisher_phone,
            p.image_url, p.is_available ? 1 : 0, p.updated_at,
            new Date().toISOString(), p.is_deleted ? 1 : 0, p.id,
          ]
        );
      } else {
        await db.runAsync(
          `INSERT OR IGNORE INTO products
            (id, name, category, quantity, unit, price_per_unit, description,
             location, fisher_name, fisher_phone, image_url, is_available,
             sync_status, created_at, updated_at, synced_at, is_deleted)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            p.id, p.name, p.category, p.quantity, p.unit, p.price_per_unit,
            p.description, p.location, p.fisher_name, p.fisher_phone,
            p.image_url, p.is_available ? 1 : 0, 'synced',
            p.created_at, p.updated_at, new Date().toISOString(),
            p.is_deleted ? 1 : 0,
          ]
        );
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
    try {
      const payload = JSON.parse(item.payload);

      if (item.operation === 'INSERT' || item.operation === 'UPDATE') {
        const { error } = await supabase
          .from(item.table_name)
          .upsert(payload, { onConflict: 'id' });

        if (error) throw error;
      } else if (item.operation === 'DELETE') {
        const { error } = await supabase
          .from(item.table_name)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', item.record_id);

        if (error) throw error;
      }

      // Mark local record as synced
      const db = await getDb();
      await db.runAsync(
        `UPDATE ${item.table_name} SET sync_status='synced', synced_at=? WHERE id=?`,
        [new Date().toISOString(), item.record_id]
      );

      await removeFromQueue(item.id!);
      pushed++;
    } catch (err) {
      // Increment retry count
      const db = await getDb();
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
  try {
    // Push local changes first
    const { pushed, failed } = await pushToServer();

    // Pull remote updates
    await pullFromServer();

    // Update last sync timestamp
    const now = new Date().toISOString();
    await AsyncStorage.setItem(LAST_SYNC_KEY, now);

    return { success: true, pushed, pulled: 0 };
  } catch (err: any) {
    return { success: false, pushed: 0, pulled: 0, error: err.message };
  }
};

// ── Get last sync time ─────────────────────────────────────────────────────
export const getLastSyncTime = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(LAST_SYNC_KEY);
};
