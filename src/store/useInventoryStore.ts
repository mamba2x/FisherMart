import { create } from 'zustand';
import { Product } from '../database/types';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getInventoryStats,
} from '../services/inventoryService';

interface InventoryState {
  products: Product[];
  loading: boolean;
  error: string | null;
  stats: { totalValue: number; count: number; pendingSync: number };

  fetchProducts: (category?: string) => Promise<void>;
  addProduct: (data: Omit<Product, 'id' | 'owner_id' | 'sync_status' | 'created_at' | 'updated_at' | 'synced_at' | 'is_deleted'>) => Promise<Product>;
  editProduct: (id: string, data: Partial<Product>) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: [],
  loading: false,
  error: null,
  stats: { totalValue: 0, count: 0, pendingSync: 0 },

  fetchProducts: async (category) => {
    set({ loading: true, error: null });
    try {
      const products = await getAllProducts(category);
      set({ products, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  addProduct: async (data) => {
    const product = await createProduct(data);
    set((s) => ({ products: [product, ...s.products] }));
    get().fetchStats();
    return product;
  },

  editProduct: async (id, data) => {
    await updateProduct(id, data);
    await get().fetchProducts();
  },

  removeProduct: async (id) => {
    await deleteProduct(id);
    set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
    get().fetchStats();
  },

  fetchStats: async () => {
    const stats = await getInventoryStats();
    set({ stats });
  },
}));
