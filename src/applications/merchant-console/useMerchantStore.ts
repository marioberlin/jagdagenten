/**
 * Merchant Console Store
 *
 * Zustand store for managing merchant console state.
 */
import { create } from 'zustand';
import {
  getMerchantService,
  type MerchantOrder,
  type MerchantProduct,
  type SalesMetrics,
  type AnalyticsData,
  type Alert,
} from '@/services/a2a/MerchantService';

interface MerchantState {
  // Data
  metrics: SalesMetrics | null;
  orders: MerchantOrder[];
  ordersTotal: number;
  products: MerchantProduct[];
  productsTotal: number;
  analytics: AnalyticsData | null;
  alerts: Alert[];

  // Filters
  orderStatusFilter: MerchantOrder['status'] | null;
  productStatusFilter: MerchantProduct['status'] | null;
  productCategoryFilter: string | null;
  productSortBy: 'stock' | 'sales' | 'revenue' | 'name';
  productSortDir: 'asc' | 'desc';

  // UI State
  isLoading: boolean;
  isRefreshing: boolean;
  lastRefresh: Date | null;
  error: string | null;

  // Actions
  fetchMetrics: () => Promise<void>;
  fetchOrders: (status?: MerchantOrder['status']) => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  fetchAlerts: () => Promise<void>;
  refreshAll: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: MerchantOrder['status']) => Promise<void>;
  setOrderStatusFilter: (status: MerchantOrder['status'] | null) => void;
  setProductStatusFilter: (status: MerchantProduct['status'] | null) => void;
  setProductCategoryFilter: (category: string | null) => void;
  setProductSort: (sortBy: 'stock' | 'sales' | 'revenue' | 'name', sortDir: 'asc' | 'desc') => void;
  markAlertRead: (alertId: string) => Promise<void>;
}

export const useMerchantStore = create<MerchantState>((set, get) => ({
  // Initial State
  metrics: null,
  orders: [],
  ordersTotal: 0,
  products: [],
  productsTotal: 0,
  analytics: null,
  alerts: [],

  orderStatusFilter: null,
  productStatusFilter: null,
  productCategoryFilter: null,
  productSortBy: 'sales',
  productSortDir: 'desc',

  isLoading: false,
  isRefreshing: false,
  lastRefresh: null,
  error: null,

  // Actions
  fetchMetrics: async () => {
    try {
      const service = getMerchantService();
      const metrics = await service.getMetrics();
      set({ metrics });
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      set({ error: 'Failed to load metrics' });
    }
  },

  fetchOrders: async (status) => {
    const state = get();
    const filterStatus = status ?? state.orderStatusFilter ?? undefined;
    try {
      set({ isLoading: true });
      const service = getMerchantService();
      const { orders, total } = await service.getOrders({
        status: filterStatus,
        limit: 50,
      });
      set({ orders, ordersTotal: total, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      set({ error: 'Failed to load orders', isLoading: false });
    }
  },

  fetchProducts: async () => {
    const state = get();
    try {
      set({ isLoading: true });
      const service = getMerchantService();
      const { products, total } = await service.getProducts({
        status: state.productStatusFilter ?? undefined,
        category: state.productCategoryFilter ?? undefined,
        sortBy: state.productSortBy,
        sortDir: state.productSortDir,
        limit: 50,
      });
      set({ products, productsTotal: total, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch products:', error);
      set({ error: 'Failed to load products', isLoading: false });
    }
  },

  fetchAnalytics: async () => {
    try {
      const service = getMerchantService();
      const analytics = await service.getAnalytics();
      set({ analytics });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      set({ error: 'Failed to load analytics' });
    }
  },

  fetchAlerts: async () => {
    try {
      const service = getMerchantService();
      const alerts = await service.getAlerts();
      set({ alerts });
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  },

  refreshAll: async () => {
    set({ isRefreshing: true, error: null });
    try {
      const service = getMerchantService();
      await service.refresh();

      // Fetch all data in parallel
      await Promise.all([
        get().fetchMetrics(),
        get().fetchOrders(),
        get().fetchProducts(),
        get().fetchAnalytics(),
        get().fetchAlerts(),
      ]);

      set({ isRefreshing: false, lastRefresh: new Date() });
    } catch (error) {
      console.error('Failed to refresh:', error);
      set({ isRefreshing: false, error: 'Failed to refresh data' });
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      const service = getMerchantService();
      await service.updateOrderStatus(orderId, status);

      // Update local state
      set(state => ({
        orders: state.orders.map(o =>
          o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o
        ),
      }));

      // Refresh metrics
      await get().fetchMetrics();
    } catch (error) {
      console.error('Failed to update order status:', error);
      set({ error: 'Failed to update order' });
    }
  },

  setOrderStatusFilter: (status) => {
    set({ orderStatusFilter: status });
    get().fetchOrders(status ?? undefined);
  },

  setProductStatusFilter: (status) => {
    set({ productStatusFilter: status });
    get().fetchProducts();
  },

  setProductCategoryFilter: (category) => {
    set({ productCategoryFilter: category });
    get().fetchProducts();
  },

  setProductSort: (sortBy, sortDir) => {
    set({ productSortBy: sortBy, productSortDir: sortDir });
    get().fetchProducts();
  },

  markAlertRead: async (alertId) => {
    try {
      const service = getMerchantService();
      await service.markAlertRead(alertId);

      set(state => ({
        alerts: state.alerts.map(a =>
          a.id === alertId ? { ...a, read: true } : a
        ),
      }));
    } catch (error) {
      console.error('Failed to mark alert read:', error);
    }
  },
}));
