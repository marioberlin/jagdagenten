/**
 * Merchant Service
 *
 * Service for Merchant Console to fetch store data from UCP backend.
 * Provides order management, product analytics, and sales data.
 */
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types
// ============================================================================

export interface MerchantOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  currency: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  items_count: number;
  created_at: string;
  updated_at: string;
  shipping_address?: {
    city: string;
    state: string;
    country: string;
  };
}

export interface MerchantProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  currency: string;
  stock: number;
  low_stock_threshold: number;
  status: 'active' | 'low_stock' | 'out_of_stock' | 'discontinued';
  sales_count: number;
  revenue: number;
  image_url?: string;
}

export interface SalesMetrics {
  revenue: {
    today: number;
    yesterday: number;
    this_week: number;
    last_week: number;
    this_month: number;
    last_month: number;
  };
  orders: {
    today: number;
    yesterday: number;
    this_week: number;
    last_week: number;
    pending: number;
    processing: number;
  };
  customers: {
    new_today: number;
    new_this_week: number;
    total: number;
    returning_rate: number;
  };
  conversion: {
    rate: number;
    change: number;
  };
}

export interface ChartDataPoint {
  date: string;
  label: string;
  value: number;
}

export interface AnalyticsData {
  revenue_chart: ChartDataPoint[];
  orders_chart: ChartDataPoint[];
  top_products: {
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }[];
  category_breakdown: {
    category: string;
    sales: number;
    revenue: number;
    percentage: number;
  }[];
  hourly_traffic: {
    hour: number;
    visitors: number;
    orders: number;
  }[];
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  description: string;
  created_at: string;
  read: boolean;
  action_url?: string;
}

// ============================================================================
// Mock Data Generators
// ============================================================================

const CUSTOMER_NAMES = [
  'John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Brown', 'Charlie Davis',
  'Eva Martinez', 'Frank Johnson', 'Grace Lee', 'Henry Taylor', 'Ivy Anderson',
  'Jack Thompson', 'Kate White', 'Leo Garcia', 'Mia Robinson', 'Noah Clark',
];

const PRODUCT_NAMES = [
  { id: 'btc-tshirt-classic', name: 'Bitcoin Classic T-Shirt', category: 'apparel', price: 34.99 },
  { id: 'eth-tshirt-logo', name: 'Ethereum Diamond T-Shirt', category: 'apparel', price: 34.99 },
  { id: 'btc-hoodie-premium', name: 'Bitcoin Premium Hoodie', category: 'apparel', price: 89.99 },
  { id: 'ledger-nano-x', name: 'Ledger Nano X', category: 'electronics', price: 149.99 },
  { id: 'trezor-model-t', name: 'Trezor Model T', category: 'electronics', price: 219.99 },
  { id: 'crypto-neon-sign', name: 'Bitcoin Neon Sign', category: 'home-garden', price: 79.99 },
  { id: 'trading-course-beginner', name: 'Crypto Trading 101', category: 'digital', price: 49.99 },
  { id: 'defi-masterclass', name: 'DeFi Masterclass', category: 'digital', price: 149.99 },
  { id: 'signals-monthly', name: 'Trading Signals Monthly', category: 'subscriptions', price: 29.99 },
  { id: 'wagmi-hoodie', name: 'WAGMI Oversized Hoodie', category: 'apparel', price: 79.99 },
];

function generateOrders(count: number): MerchantOrder[] {
  const orders: MerchantOrder[] = [];
  const now = Date.now();
  const statuses: MerchantOrder['status'][] = ['pending', 'processing', 'shipped', 'delivered'];
  const paymentStatuses: MerchantOrder['payment_status'][] = ['pending', 'paid', 'paid', 'paid', 'paid'];

  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const created = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

    orders.push({
      id: uuidv4(),
      order_number: `ORD-${(1000 + i).toString()}`,
      customer_name: CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)],
      customer_email: `customer${i}@example.com`,
      total: Math.round((50 + Math.random() * 400) * 100) / 100,
      currency: 'USD',
      status,
      payment_status: status === 'cancelled' ? 'refunded' : paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
      items_count: 1 + Math.floor(Math.random() * 5),
      created_at: created.toISOString(),
      updated_at: new Date(created.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      shipping_address: {
        city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][Math.floor(Math.random() * 5)],
        state: ['NY', 'CA', 'IL', 'TX', 'AZ'][Math.floor(Math.random() * 5)],
        country: 'US',
      },
    });
  }

  return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function generateProducts(): MerchantProduct[] {
  return PRODUCT_NAMES.map((p, i) => {
    const stock = Math.floor(Math.random() * 100);
    const salesCount = 50 + Math.floor(Math.random() * 500);
    let status: MerchantProduct['status'] = 'active';
    if (stock === 0) status = 'out_of_stock';
    else if (stock < 10) status = 'low_stock';

    return {
      id: p.id,
      name: p.name,
      sku: `SKU-${(1000 + i).toString()}`,
      category: p.category,
      price: p.price,
      currency: 'USD',
      stock,
      low_stock_threshold: 10,
      status,
      sales_count: salesCount,
      revenue: Math.round(salesCount * p.price * 100) / 100,
      image_url: `/products/${p.id}-1.png`,
    };
  });
}

function generateMetrics(orders: MerchantOrder[]): SalesMetrics {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const todayOrders = orders.filter(o => new Date(o.created_at) >= todayStart);
  const yesterdayOrders = orders.filter(o => {
    const d = new Date(o.created_at);
    return d >= yesterdayStart && d < todayStart;
  });
  const weekOrders = orders.filter(o => new Date(o.created_at) >= weekStart);
  const lastWeekOrders = orders.filter(o => {
    const d = new Date(o.created_at);
    return d >= lastWeekStart && d < weekStart;
  });
  const monthOrders = orders.filter(o => new Date(o.created_at) >= monthStart);
  const lastMonthOrders = orders.filter(o => {
    const d = new Date(o.created_at);
    return d >= lastMonthStart && d < monthStart;
  });

  const sum = (arr: MerchantOrder[]) => arr.reduce((acc, o) => acc + o.total, 0);

  return {
    revenue: {
      today: Math.round(sum(todayOrders) * 100) / 100,
      yesterday: Math.round(sum(yesterdayOrders) * 100) / 100,
      this_week: Math.round(sum(weekOrders) * 100) / 100,
      last_week: Math.round(sum(lastWeekOrders) * 100) / 100,
      this_month: Math.round(sum(monthOrders) * 100) / 100,
      last_month: Math.round(sum(lastMonthOrders) * 100) / 100,
    },
    orders: {
      today: todayOrders.length,
      yesterday: yesterdayOrders.length,
      this_week: weekOrders.length,
      last_week: lastWeekOrders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
    },
    customers: {
      new_today: Math.floor(Math.random() * 20) + 5,
      new_this_week: Math.floor(Math.random() * 80) + 30,
      total: 1250 + Math.floor(Math.random() * 200),
      returning_rate: 35 + Math.random() * 15,
    },
    conversion: {
      rate: 2.5 + Math.random() * 2,
      change: -0.5 + Math.random() * 1.5,
    },
  };
}

function generateAnalytics(): AnalyticsData {
  const now = new Date();
  const revenueChart: ChartDataPoint[] = [];
  const ordersChart: ChartDataPoint[] = [];

  // Generate last 14 days of data
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    // Add some variance with weekends being lower
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseRevenue = isWeekend ? 800 : 1500;
    const baseOrders = isWeekend ? 8 : 15;

    revenueChart.push({
      date: dateStr,
      label,
      value: Math.round((baseRevenue + Math.random() * 1000) * 100) / 100,
    });

    ordersChart.push({
      date: dateStr,
      label,
      value: Math.floor(baseOrders + Math.random() * 10),
    });
  }

  const topProducts = PRODUCT_NAMES.slice(0, 5).map(p => ({
    id: p.id,
    name: p.name,
    sales: 50 + Math.floor(Math.random() * 200),
    revenue: Math.round((50 + Math.floor(Math.random() * 200)) * p.price * 100) / 100,
  })).sort((a, b) => b.revenue - a.revenue);

  const categories = ['apparel', 'electronics', 'home-garden', 'digital', 'subscriptions'];
  const totalRevenue = 50000 + Math.random() * 20000;
  let remaining = 100;
  const categoryBreakdown = categories.map((category, i) => {
    const percentage = i === categories.length - 1 ? remaining : Math.floor(10 + Math.random() * (remaining / (categories.length - i)));
    remaining -= percentage;
    return {
      category,
      sales: Math.floor(50 + Math.random() * 500),
      revenue: Math.round(totalRevenue * percentage / 100 * 100) / 100,
      percentage,
    };
  }).sort((a, b) => b.percentage - a.percentage);

  const hourlyTraffic = Array.from({ length: 24 }, (_, hour) => {
    // Higher traffic during business hours
    const isBusinessHours = hour >= 9 && hour <= 21;
    const isPeakHours = hour >= 12 && hour <= 14 || hour >= 18 && hour <= 20;
    const baseVisitors = isBusinessHours ? (isPeakHours ? 150 : 100) : 30;
    const baseOrders = isBusinessHours ? (isPeakHours ? 8 : 5) : 1;

    return {
      hour,
      visitors: Math.floor(baseVisitors + Math.random() * 50),
      orders: Math.floor(baseOrders + Math.random() * 3),
    };
  });

  return {
    revenue_chart: revenueChart,
    orders_chart: ordersChart,
    top_products: topProducts,
    category_breakdown: categoryBreakdown,
    hourly_traffic: hourlyTraffic,
  };
}

function generateAlerts(orders: MerchantOrder[], products: MerchantProduct[]): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  // Low stock alerts
  const lowStockProducts = products.filter(p => p.status === 'low_stock' || p.status === 'out_of_stock');
  lowStockProducts.forEach(p => {
    alerts.push({
      id: uuidv4(),
      type: p.status === 'out_of_stock' ? 'error' : 'warning',
      title: p.status === 'out_of_stock' ? 'Out of Stock' : 'Low Stock Alert',
      description: `${p.name} has ${p.stock} units remaining`,
      created_at: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      read: false,
      action_url: `/products/${p.id}`,
    });
  });

  // Pending orders alert
  const pendingOrders = orders.filter(o => o.status === 'pending');
  if (pendingOrders.length > 0) {
    alerts.push({
      id: uuidv4(),
      type: 'info',
      title: 'Pending Orders',
      description: `${pendingOrders.length} order${pendingOrders.length !== 1 ? 's' : ''} awaiting processing`,
      created_at: now.toISOString(),
      read: false,
      action_url: '/orders?status=pending',
    });
  }

  // Random success alert
  if (Math.random() > 0.5) {
    alerts.push({
      id: uuidv4(),
      type: 'success',
      title: 'New Sale',
      description: `Order ${orders[0]?.order_number || 'ORD-1000'} just completed`,
      created_at: now.toISOString(),
      read: false,
    });
  }

  return alerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// ============================================================================
// Merchant Service
// ============================================================================

export class MerchantService {
  private orders: MerchantOrder[];
  private products: MerchantProduct[];

  constructor() {
    // Initialize with mock data
    this.orders = generateOrders(50);
    this.products = generateProducts();
  }

  /**
   * Get dashboard metrics
   */
  async getMetrics(): Promise<SalesMetrics> {
    // In production, this would call the API
    return generateMetrics(this.orders);
  }

  /**
   * Get recent orders
   */
  async getOrders(options?: {
    status?: MerchantOrder['status'];
    limit?: number;
    offset?: number;
  }): Promise<{ orders: MerchantOrder[]; total: number }> {
    let filtered = [...this.orders];

    if (options?.status) {
      filtered = filtered.filter(o => o.status === options.status);
    }

    const total = filtered.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 20;

    return {
      orders: filtered.slice(offset, offset + limit),
      total,
    };
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<MerchantOrder | null> {
    return this.orders.find(o => o.id === orderId) || null;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: MerchantOrder['status']): Promise<MerchantOrder | null> {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      order.updated_at = new Date().toISOString();
    }
    return order || null;
  }

  /**
   * Get products with inventory
   */
  async getProducts(options?: {
    status?: MerchantProduct['status'];
    category?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'stock' | 'sales' | 'revenue' | 'name';
    sortDir?: 'asc' | 'desc';
  }): Promise<{ products: MerchantProduct[]; total: number }> {
    let filtered = [...this.products];

    if (options?.status) {
      filtered = filtered.filter(p => p.status === options.status);
    }
    if (options?.category) {
      filtered = filtered.filter(p => p.category === options.category);
    }

    // Sort
    if (options?.sortBy) {
      const dir = options.sortDir === 'asc' ? 1 : -1;
      filtered.sort((a, b) => {
        switch (options.sortBy) {
          case 'stock': return (a.stock - b.stock) * dir;
          case 'sales': return (a.sales_count - b.sales_count) * dir;
          case 'revenue': return (a.revenue - b.revenue) * dir;
          case 'name': return a.name.localeCompare(b.name) * dir;
          default: return 0;
        }
      });
    }

    const total = filtered.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 20;

    return {
      products: filtered.slice(offset, offset + limit),
      total,
    };
  }

  /**
   * Get analytics data
   */
  async getAnalytics(): Promise<AnalyticsData> {
    return generateAnalytics();
  }

  /**
   * Get alerts
   */
  async getAlerts(): Promise<Alert[]> {
    return generateAlerts(this.orders, this.products);
  }

  /**
   * Mark alert as read
   */
  async markAlertRead(_alertId: string): Promise<void> {
    // In production, this would persist
  }

  /**
   * Refresh data (simulate API refresh)
   */
  async refresh(): Promise<void> {
    this.orders = generateOrders(50);
    this.products = generateProducts();
  }
}

// Singleton instance
let merchantServiceInstance: MerchantService | null = null;

export function getMerchantService(): MerchantService {
  if (!merchantServiceInstance) {
    merchantServiceInstance = new MerchantService();
  }
  return merchantServiceInstance;
}
