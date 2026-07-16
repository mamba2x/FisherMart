import { getDb } from '../database/db';
import { Order, OrderStatus } from '../database/types';
import { queueMutation } from './syncService';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// ── Get all orders ─────────────────────────────────────────────────────────
export const getAllOrders = async (status?: OrderStatus): Promise<Order[]> => {
  const db = await getDb();
  if (status) {
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM orders WHERE is_deleted=0 AND status=? ORDER BY created_at DESC`, [status]
    );
    return rows.map(mapRowToOrder);
  }
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM orders WHERE is_deleted=0 ORDER BY created_at DESC`
  );
  return rows.map(mapRowToOrder);
};

// ── Create a new order ─────────────────────────────────────────────────────
export const createOrder = async (
  data: Omit<Order, 'id' | 'sync_status' | 'created_at' | 'updated_at' | 'is_deleted'>
): Promise<Order> => {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = uuidv4();

  const order: Order = {
    ...data,
    id,
    sync_status: 'pending',
    created_at: now,
    updated_at: now,
    is_deleted: false,
  };

  await db.runAsync(
    `INSERT INTO orders
      (id, product_id, product_name, buyer_name, buyer_phone, quantity, unit,
       total_price, status, notes, sync_status, created_at, updated_at, is_deleted)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      order.id, order.product_id, order.product_name, order.buyer_name,
      order.buyer_phone, order.quantity, order.unit, order.total_price,
      order.status, order.notes ?? null, 'pending',
      order.created_at, order.updated_at, 0,
    ]
  );

  await queueMutation('INSERT', 'orders', id, order);
  return order;
};

// ── Update order status ────────────────────────────────────────────────────
export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<void> => {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE orders SET status=?, sync_status='pending', updated_at=? WHERE id=?`,
    [status, now, id]
  );
  await queueMutation('UPDATE', 'orders', id, { id, status, updated_at: now });
};

// ── Get revenue stats ──────────────────────────────────────────────────────
export const getRevenueStats = async () => {
  const db = await getDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString();

  const todayRev = await db.getFirstAsync<{ total: number }>(
    `SELECT SUM(total_price) as total FROM orders WHERE status='delivered' AND created_at >= ?`,
    [todayStr]
  );

  const weekRev = await db.getFirstAsync<{ total: number }>(
    `SELECT SUM(total_price) as total FROM orders WHERE status='delivered' AND created_at >= ?`,
    [weekStr]
  );

  const pending = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM orders WHERE status='pending'`
  );

  return {
    todayRevenue: todayRev?.total ?? 0,
    weekRevenue: weekRev?.total ?? 0,
    pendingOrders: pending?.count ?? 0,
  };
};

// ── Get monthly revenue for chart ──────────────────────────────────────────
export const getMonthlyRevenue = async (): Promise<{ month: string; revenue: number }[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT
      strftime('%m', created_at) as month,
      SUM(total_price) as revenue
    FROM orders
    WHERE status='delivered'
    GROUP BY strftime('%m', created_at)
    ORDER BY month`
  );
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return rows.map((r: any) => ({
    month: months[parseInt(r.month) - 1],
    revenue: r.revenue ?? 0,
  }));
};

const mapRowToOrder = (row: any): Order => ({
  id: row.id,
  product_id: row.product_id,
  product_name: row.product_name,
  buyer_name: row.buyer_name,
  buyer_phone: row.buyer_phone,
  quantity: row.quantity,
  unit: row.unit,
  total_price: row.total_price,
  status: row.status,
  notes: row.notes,
  sync_status: row.sync_status,
  created_at: row.created_at,
  updated_at: row.updated_at,
  synced_at: row.synced_at,
  is_deleted: row.is_deleted === 1,
});
