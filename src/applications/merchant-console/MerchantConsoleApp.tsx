/**
 * Merchant Console App
 *
 * Store management dashboard for the UCP demo store.
 * Features order management, product catalog, and analytics.
 */
import React, { useState, useEffect } from 'react';
import {
  Store, Package, ShoppingCart, TrendingUp, Users, DollarSign,
  BarChart3, Clock, AlertTriangle, CheckCircle, Search, RefreshCw,
  ArrowUpRight, ArrowDownRight, Filter, ChevronDown, Eye, Truck, XCircle,
} from 'lucide-react';
import { useMerchantStore } from './useMerchantStore';
import { LineChart, BarChart, DonutChart, HorizontalBarChart, Sparkline } from './components/Chart';
import type { MerchantOrder, MerchantProduct, Alert as AlertType } from '@/services/a2a/MerchantService';

type TabType = 'overview' | 'orders' | 'products' | 'analytics';

export const MerchantConsoleApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    metrics,
    orders,
    products,
    analytics,
    alerts,
    isRefreshing,
    fetchMetrics,
    fetchOrders,
    fetchProducts,
    fetchAnalytics,
    fetchAlerts,
    refreshAll,
  } = useMerchantStore();

  // Initial data fetch
  useEffect(() => {
    fetchMetrics();
    fetchOrders();
    fetchProducts();
    fetchAnalytics();
    fetchAlerts();
  }, []);

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const outOfStockCount = products.filter(p => p.status === 'out_of_stock').length;

  return (
    <div className="flex flex-col h-full bg-glass-base rounded-b-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <Store size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Merchant Console</h1>
            <p className="text-xs text-white/50">Cymbal Outfitters</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshAll}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 border-b border-white/5">
        <TabButton
          icon={<BarChart3 size={16} />}
          label="Overview"
          isActive={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
        />
        <TabButton
          icon={<ShoppingCart size={16} />}
          label="Orders"
          isActive={activeTab === 'orders'}
          onClick={() => setActiveTab('orders')}
          badge={pendingOrdersCount}
        />
        <TabButton
          icon={<Package size={16} />}
          label="Products"
          isActive={activeTab === 'products'}
          onClick={() => setActiveTab('products')}
          badge={outOfStockCount}
        />
        <TabButton
          icon={<TrendingUp size={16} />}
          label="Analytics"
          isActive={activeTab === 'analytics'}
          onClick={() => setActiveTab('analytics')}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {activeTab === 'overview' && <OverviewTab metrics={metrics} orders={orders} alerts={alerts} analytics={analytics} />}
        {activeTab === 'orders' && <OrdersTab orders={orders} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
        {activeTab === 'products' && <ProductsTab products={products} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
        {activeTab === 'analytics' && <AnalyticsTab analytics={analytics} />}
      </div>
    </div>
  );
};

// Tab button component
const TabButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}> = ({ icon, label, isActive, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
      isActive
        ? 'border-purple-500 text-white'
        : 'border-transparent text-white/50 hover:text-white/80'
    }`}
  >
    {icon}
    <span className="text-sm">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs">
        {badge}
      </span>
    )}
  </button>
);

// Overview Tab
const OverviewTab: React.FC<{
  metrics: ReturnType<typeof useMerchantStore>['metrics'];
  orders: MerchantOrder[];
  alerts: AlertType[];
  analytics: ReturnType<typeof useMerchantStore>['analytics'];
}> = ({ metrics, orders, alerts, analytics }) => {
  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-white/40">Loading...</div>
      </div>
    );
  }

  const revenueChange = metrics.revenue.yesterday > 0
    ? ((metrics.revenue.today - metrics.revenue.yesterday) / metrics.revenue.yesterday) * 100
    : 0;
  const ordersChange = metrics.orders.yesterday > 0
    ? ((metrics.orders.today - metrics.orders.yesterday) / metrics.orders.yesterday) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign size={20} />}
          label="Revenue (Today)"
          value={`$${metrics.revenue.today.toLocaleString()}`}
          change={revenueChange}
          color="green"
          sparkData={analytics?.revenue_chart.slice(-7).map(d => d.value)}
        />
        <StatCard
          icon={<ShoppingCart size={20} />}
          label="Orders (Today)"
          value={metrics.orders.today.toString()}
          change={ordersChange}
          color="blue"
          sparkData={analytics?.orders_chart.slice(-7).map(d => d.value)}
        />
        <StatCard
          icon={<Users size={20} />}
          label="New Customers"
          value={metrics.customers.new_today.toString()}
          change={0}
          color="purple"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Conversion Rate"
          value={`${metrics.conversion.rate.toFixed(1)}%`}
          change={metrics.conversion.change}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-glass-elevated rounded-xl border border-white/5 p-4">
            <h3 className="text-sm font-medium text-white mb-4">Revenue (14 Days)</h3>
            <LineChart
              data={analytics.revenue_chart.map(d => ({ label: d.label.split(' ')[0], value: d.value }))}
              height={180}
              color="#22c55e"
              formatValue={(v) => `$${v.toLocaleString()}`}
            />
          </div>
          <div className="bg-glass-elevated rounded-xl border border-white/5 p-4">
            <h3 className="text-sm font-medium text-white mb-4">Orders (14 Days)</h3>
            <BarChart
              data={analytics.orders_chart.map(d => ({ label: d.label.split(' ')[0], value: d.value }))}
              height={180}
              color="#8b5cf6"
              showLabels={false}
            />
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <div className="bg-glass-elevated rounded-xl border border-white/5 p-4">
          <h3 className="text-sm font-medium text-white mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div>
                  <p className="text-sm font-medium text-white">{order.customer_name}</p>
                  <p className="text-xs text-white/40">{order.order_number} • {order.items_count} items</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">${order.total.toFixed(2)}</p>
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-glass-elevated rounded-xl border border-white/5 p-4">
          <h3 className="text-sm font-medium text-white mb-4">Alerts</h3>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
            {alerts.length === 0 && (
              <div className="text-center py-4 text-white/40 text-sm">
                No alerts
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Orders Tab
const OrdersTab: React.FC<{
  orders: MerchantOrder[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}> = ({ orders, searchQuery, setSearchQuery }) => {
  const { orderStatusFilter, setOrderStatusFilter, updateOrderStatus } = useMerchantStore();

  const filteredOrders = orders.filter(order =>
    order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-white">Orders</h2>
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={orderStatusFilter || ''}
              onChange={(e) => setOrderStatusFilter(e.target.value as MerchantOrder['status'] || null)}
              className="appearance-none px-3 py-2 pr-8 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 text-sm focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>
      </div>

      <div className="bg-glass-elevated rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left p-4 text-xs font-medium text-white/40 uppercase">Order</th>
              <th className="text-left p-4 text-xs font-medium text-white/40 uppercase">Customer</th>
              <th className="text-left p-4 text-xs font-medium text-white/40 uppercase">Date</th>
              <th className="text-left p-4 text-xs font-medium text-white/40 uppercase">Status</th>
              <th className="text-right p-4 text-xs font-medium text-white/40 uppercase">Total</th>
              <th className="text-right p-4 text-xs font-medium text-white/40 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                <td className="p-4">
                  <span className="font-mono text-sm text-white">{order.order_number}</span>
                </td>
                <td className="p-4">
                  <div>
                    <span className="text-sm text-white">{order.customer_name}</span>
                    <p className="text-xs text-white/40">{order.customer_email}</p>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-sm text-white/60">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td className="p-4">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="p-4 text-right">
                  <span className="text-sm font-medium text-white">${order.total.toFixed(2)}</span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition-all" title="View">
                      <Eye size={14} />
                    </button>
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'processing')}
                        className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-blue-400 transition-all"
                        title="Process"
                      >
                        <CheckCircle size={14} />
                      </button>
                    )}
                    {order.status === 'processing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'shipped')}
                        className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-purple-400 transition-all"
                        title="Ship"
                      >
                        <Truck size={14} />
                      </button>
                    )}
                    {(order.status === 'pending' || order.status === 'processing') && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-red-400 transition-all"
                        title="Cancel"
                      >
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredOrders.length === 0 && (
          <div className="text-center py-8 text-white/40">
            No orders found
          </div>
        )}
      </div>
    </div>
  );
};

// Products Tab
const ProductsTab: React.FC<{
  products: MerchantProduct[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}> = ({ products, searchQuery, setSearchQuery }) => {
  const {
    productStatusFilter,
    productCategoryFilter,
    productSortBy,
    productSortDir,
    setProductStatusFilter,
    setProductCategoryFilter,
    setProductSort,
  } = useMerchantStore();

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-white">Products</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <div className="relative">
            <select
              value={productCategoryFilter || ''}
              onChange={(e) => setProductCategoryFilter(e.target.value || null)}
              className="appearance-none px-3 py-2 pr-8 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50 capitalize"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat} className="capitalize">{cat}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          </div>
          {/* Status Filter */}
          <div className="relative">
            <select
              value={productStatusFilter || ''}
              onChange={(e) => setProductStatusFilter(e.target.value as MerchantProduct['status'] || null)}
              className="appearance-none px-3 py-2 pr-8 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          </div>
          {/* Sort */}
          <div className="relative">
            <select
              value={`${productSortBy}-${productSortDir}`}
              onChange={(e) => {
                const [sortBy, sortDir] = e.target.value.split('-') as [typeof productSortBy, typeof productSortDir];
                setProductSort(sortBy, sortDir);
              }}
              className="appearance-none px-3 py-2 pr-8 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
            >
              <option value="sales-desc">Top Sellers</option>
              <option value="sales-asc">Lowest Sales</option>
              <option value="revenue-desc">Highest Revenue</option>
              <option value="stock-asc">Low Stock First</option>
              <option value="stock-desc">High Stock First</option>
              <option value="name-asc">Name A-Z</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 text-sm focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>
      </div>

      <div className="bg-glass-elevated rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left p-4 text-xs font-medium text-white/40 uppercase">Product</th>
              <th className="text-left p-4 text-xs font-medium text-white/40 uppercase">Category</th>
              <th className="text-left p-4 text-xs font-medium text-white/40 uppercase">Stock</th>
              <th className="text-left p-4 text-xs font-medium text-white/40 uppercase">Sales</th>
              <th className="text-left p-4 text-xs font-medium text-white/40 uppercase">Status</th>
              <th className="text-right p-4 text-xs font-medium text-white/40 uppercase">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                          <Package size={16} />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-sm text-white">{product.name}</span>
                      <p className="text-xs text-white/40">{product.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-sm text-white/60 capitalize">{product.category}</span>
                </td>
                <td className="p-4">
                  <span className={`text-sm ${product.stock === 0 ? 'text-red-400' : product.stock < 10 ? 'text-yellow-400' : 'text-white/60'}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="p-4">
                  <span className="text-sm text-white/60">{product.sales_count}</span>
                </td>
                <td className="p-4">
                  <ProductStatusBadge status={product.status} />
                </td>
                <td className="p-4 text-right">
                  <span className="text-sm font-medium text-white">${product.revenue.toLocaleString()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-white/40">
            No products found
          </div>
        )}
      </div>
    </div>
  );
};

// Analytics Tab
const AnalyticsTab: React.FC<{
  analytics: ReturnType<typeof useMerchantStore>['analytics'];
}> = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-white/40">Loading analytics...</div>
      </div>
    );
  }

  const categoryColors = ['#8b5cf6', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Top Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-glass-elevated rounded-xl border border-white/5 p-4">
          <h3 className="text-sm font-medium text-white mb-4">Revenue Trend</h3>
          <LineChart
            data={analytics.revenue_chart.map(d => ({ label: d.label.split(' ')[0], value: d.value }))}
            height={220}
            color="#22c55e"
            formatValue={(v) => `$${v.toLocaleString()}`}
          />
        </div>
        <div className="bg-glass-elevated rounded-xl border border-white/5 p-4">
          <h3 className="text-sm font-medium text-white mb-4">Orders Trend</h3>
          <LineChart
            data={analytics.orders_chart.map(d => ({ label: d.label.split(' ')[0], value: d.value }))}
            height={220}
            color="#8b5cf6"
          />
        </div>
      </div>

      {/* Category & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-glass-elevated rounded-xl border border-white/5 p-4">
          <h3 className="text-sm font-medium text-white mb-4">Sales by Category</h3>
          <DonutChart
            data={analytics.category_breakdown.map((cat, i) => ({
              label: cat.category.charAt(0).toUpperCase() + cat.category.slice(1).replace('-', ' '),
              value: cat.revenue,
              color: categoryColors[i % categoryColors.length],
            }))}
            size={160}
            thickness={24}
          />
        </div>
        <div className="bg-glass-elevated rounded-xl border border-white/5 p-4">
          <h3 className="text-sm font-medium text-white mb-4">Top Products</h3>
          <HorizontalBarChart
            data={analytics.top_products.map(p => ({
              label: p.name,
              value: p.revenue,
              subLabel: `${p.sales} units sold`,
            }))}
            color="#8b5cf6"
            formatValue={(v) => `$${v.toLocaleString()}`}
          />
        </div>
      </div>

      {/* Hourly Traffic */}
      <div className="bg-glass-elevated rounded-xl border border-white/5 p-4">
        <h3 className="text-sm font-medium text-white mb-4">Traffic by Hour (Today)</h3>
        <BarChart
          data={analytics.hourly_traffic.map(h => ({
            label: `${h.hour}:00`,
            value: h.visitors,
          }))}
          height={200}
          color="#3b82f6"
          showLabels={false}
        />
      </div>
    </div>
  );
};

// Stat Card
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  change: number;
  color: 'green' | 'blue' | 'purple' | 'orange';
  sparkData?: number[];
}> = ({ icon, label, value, change, color, sparkData }) => {
  const colors = {
    green: 'bg-green-500/10 text-green-400',
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
    orange: 'bg-orange-500/10 text-orange-400',
  };

  const sparkColors = {
    green: '#22c55e',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    orange: '#f59e0b',
  };

  return (
    <div className="bg-glass-elevated rounded-xl border border-white/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
        <div className="flex items-center gap-1">
          {change !== 0 && (
            <>
              {change > 0 ? (
                <ArrowUpRight size={14} className="text-green-400" />
              ) : (
                <ArrowDownRight size={14} className="text-red-400" />
              )}
              <span className={`text-xs font-medium ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-semibold text-white mb-1">{value}</p>
          <p className="text-xs text-white/40">{label}</p>
        </div>
        {sparkData && sparkData.length > 0 && (
          <Sparkline data={sparkData} color={sparkColors[color]} width={60} height={24} />
        )}
      </div>
    </div>
  );
};

// Order Status Badge
const OrderStatusBadge: React.FC<{ status: MerchantOrder['status'] }> = ({ status }) => {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    processing: 'bg-blue-500/20 text-blue-400',
    shipped: 'bg-purple-500/20 text-purple-400',
    delivered: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs capitalize ${styles[status] || 'bg-white/10 text-white/60'}`}>
      {status}
    </span>
  );
};

// Product Status Badge
const ProductStatusBadge: React.FC<{ status: MerchantProduct['status'] }> = ({ status }) => {
  const styles: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    low_stock: 'bg-yellow-500/20 text-yellow-400',
    out_of_stock: 'bg-red-500/20 text-red-400',
    discontinued: 'bg-gray-500/20 text-gray-400',
  };

  const labels: Record<string, string> = {
    active: 'Active',
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock',
    discontinued: 'Discontinued',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${styles[status] || 'bg-white/10 text-white/60'}`}>
      {labels[status] || status}
    </span>
  );
};

// Alert Item
const AlertItem: React.FC<{ alert: AlertType }> = ({ alert }) => {
  const icons = {
    info: <Clock size={16} className="text-blue-400" />,
    warning: <AlertTriangle size={16} className="text-yellow-400" />,
    error: <AlertTriangle size={16} className="text-red-400" />,
    success: <CheckCircle size={16} className="text-green-400" />,
  };

  const colors = {
    info: 'bg-blue-500/10 border-blue-500/20',
    warning: 'bg-yellow-500/10 border-yellow-500/20',
    error: 'bg-red-500/10 border-red-500/20',
    success: 'bg-green-500/10 border-green-500/20',
  };

  return (
    <div className={`p-3 rounded-lg border ${colors[alert.type]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icons[alert.type]}
        <span className="text-sm font-medium text-white">{alert.title}</span>
      </div>
      <p className="text-xs text-white/50 ml-6">{alert.description}</p>
    </div>
  );
};
