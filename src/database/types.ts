// TypeScript types for the FisherMart database models

export interface Product {
  id: string;
  owner_id?: string;
  name: string;
  category: string;
  fish_species?: string;
  catch_date?: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  description?: string;
  location?: string;
  fisher_name?: string;
  fisher_phone?: string;
  image_url?: string;
  is_available: boolean;
  sync_status: SyncStatus;
  last_sync_error?: string;
  created_at: string;
  updated_at: string;
  synced_at?: string;
  is_deleted: boolean;
}

export interface Order {
  id: string;
  owner_id?: string;
  seller_id?: string;
  product_id: string;
  product_name: string;
  buyer_name: string;
  buyer_phone: string;
  seller_name?: string;
  seller_phone?: string;
  quantity: number;
  unit: string;
  total_price: number;
  status: OrderStatus;
  notes?: string;
  sync_status: SyncStatus;
  last_sync_error?: string;
  created_at: string;
  updated_at: string;
  synced_at?: string;
  is_deleted: boolean;
}

export interface SyncQueueItem {
  id?: number;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'ORDER_STATUS_UPDATE';
  table_name: string;
  record_id: string;
  payload: string; // JSON stringified data
  retry_count: number;
  created_at: string;
}

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';
export type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'delivered' | 'cancelled';

export interface AppSettings {
  fisher_name?: string;
  fisher_phone?: string;
  fisher_location?: string;
  fisher_zone?: string;
  boat_number?: string;
  last_sync?: string;
}

export interface DashboardStats {
  totalProducts: number;
  pendingOrders: number;
  todayRevenue: number;
  weekRevenue: number;
  pendingSyncCount: number;
  totalInventoryValue: number;
}
