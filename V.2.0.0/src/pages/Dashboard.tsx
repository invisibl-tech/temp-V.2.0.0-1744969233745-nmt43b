import React, { useState, useEffect, useMemo } from 'react';
import {
  format,
  addDays,
  subDays,
  startOfDay,
  isAfter,
  differenceInDays,
  parseISO,
} from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  CircleDollarSign,
  TrendingUp,
  BarChart3,
  DollarSign,
  RefreshCcw,
  Info,
  Receipt,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../App';
import {
  generateSalesForecast,
  getDaysForRange,
  ForecastRange,
  ForecastResult,
} from '../utils/forecast';

/**
 * Type Definitions
 * @since 15 Apr 2025
 */
interface ForecastMetrics {
  sales: number;
  orders: number;
  salesLower: number;
  salesUpper: number;
  ordersLower: number;
  ordersUpper: number;
  timestamp: string;
}

interface BaseMetrics {
  sales: number;
  orders: number;
  cogs: number;
  grossProfit: number;
  timestamp: string;
}

interface ExtendedMetrics extends BaseMetrics {
  isForecast?: boolean;
  product_name?: string;
  product_type?: string;
  quantity?: number;
  item_id?: string;
  totalSales?: number;
  totalOrders?: number;
  totalCOGS?: number;
  totalGrossProfit?: number;
  avgOrderValue?: number;
  dailyAvgSales?: number;
  dailyAvgOrders?: number;
  dailyAvgCOGS?: number;
  dailyAvgGrossProfit?: number;
  numberOfDays?: number;
  salesLower?: number;
  salesUpper?: number;
  ordersLower?: number;
  ordersUpper?: number;
}

interface ChartDataMetrics extends ExtendedMetrics {
  salesLower?: number;
  salesUpper?: number;
  ordersLower?: number;
  ordersUpper?: number;
}

interface ChartData {
  metrics: ChartDataMetrics;
  timestamp: string;
  isForecast: boolean;
  value?: number;
  forecast?: number;
}

interface ProductInfo {
  name: string;
  type: string;
}

interface LatestMetrics {
  totalSales: number;
  totalOrders: number;
  totalCOGS: number;
  totalGrossProfit: number;
  dailyAvgSales: number;
  dailyAvgOrders: number;
  dailyAvgCOGS: number;
  dailyAvgGrossProfit: number;
}

interface TooltipContentProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload: ChartData;
  }>;
  label?: string;
}

interface MetricsData {
  metrics: {
    quantity?: number;
    sales?: number;
    product_name?: string;
    product_type?: string;
    item_id?: string;
  };
  timestamp: string;
}

interface ProductCost {
  item_id: string;
  cost: number;
}

type ForecastPeriod = '7d' | '14d' | '30d';

/**
 * Dashboard Component
 * Manages the main analytics dashboard displaying platform metrics and forecasts
 */
export default function Dashboard() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [forecastConfidence, setForecastConfidence] = useState<number>(75);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [forecastRange, setForecastRange] = useState<ForecastRange>('1month');
  const [availableProducts, setAvailableProducts] = useState<
    { name: string; type: string }[]
  >([]);
  const [filters, setFilters] = useState({
    platform: 'all',
    productType: 'all',
    productName: 'all',
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  /**
   * State Management
   * Handles loading states, filter selections, and data refresh
   */
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  /**
   * Data Fetching and Processing
   * Retrieves metrics data from Supabase and processes it for display
   */
  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching with filters:', filters);

      let query = supabase
        .from('platform_metrics')
        .select('*')
        .order('timestamp', { ascending: true });

      // Update platform filter to match exact case in database
      if (filters.platform !== 'all') {
        // Keep the exact case as in the platforms array
        const platformName = platforms.find(
          (p) => p.toLowerCase() === filters.platform.toLowerCase()
        );
        if (platformName) {
          query = query.eq('platform', platformName);
          console.log('Filtering by platform:', platformName);
        }
      }

      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('timestamp', `${filters.endDate}T23:59:59`);
      }

      const { data: metricsData, error: metricsError } = await query;

      console.log('Metrics data received:', {
        count: metricsData?.length,
        sample: metricsData?.[0],
      });

      if (metricsError) throw metricsError;

      // Fetch product costs
      const { data: productCosts, error: costsError } = await supabase
        .from('product_costs')
        .select('*');
      if (costsError) throw costsError;

      // Create a map of product costs
      const costMap = new Map(productCosts.map((p) => [p.item_id, p.cost]));

      let filteredData = metricsData || [];
      // Add product type and name filtering
      if (filters.productType !== 'all' || filters.productName !== 'all') {
        console.log('Applying product filters:', {
          type: filters.productType,
          name: filters.productName,
        });

        filteredData = filteredData.filter((item) => {
          if (!item.metrics) return false;

          const matchesType =
            filters.productType === 'all' ||
            (item.metrics.product_type &&
              item.metrics.product_type.toLowerCase() ===
                filters.productType.toLowerCase());

          const matchesName =
            filters.productName === 'all' ||
            (item.metrics.product_name &&
              item.metrics.product_name === filters.productName);

          return matchesType && matchesName;
        });

        console.log('Data after product filtering:', {
          filteredCount: filteredData.length,
          sampleItem: filteredData[0]?.metrics,
        });
      }
      const productsMap = new Map<string, { name: string; type: string }>();

      // Process and aggregate data
      const aggregatedData = new Map();

      filteredData.forEach((item) => {
        // Add product to available products if it has name and type
        if (item.metrics?.product_name && item.metrics?.product_type) {
          productsMap.set(item.metrics.product_name, {
            name: item.metrics.product_name,
            type: item.metrics.product_type,
          });
        }

        // Aggregate metrics by date
        const date = item.timestamp.split('T')[0];
        if (!aggregatedData.has(date)) {
          aggregatedData.set(date, {
            timestamp: date,
            metrics: {
              sales: 0,
              orders: 0,
              cogs: 0,
              grossProfit: 0,
            },
          });
        }

        const entry = aggregatedData.get(date);
        const quantity = Math.round(Number(item.metrics?.quantity || 0));
        const sales = Math.round(Number(item.metrics?.sales || 0));
        const itemId = item.metrics?.item_id;
        const cost = costMap.get(itemId) || 0;
        const cogs = cost * quantity;
        const grossProfit = sales - cogs;

        entry.metrics.sales += sales;
        entry.metrics.orders += quantity;
        entry.metrics.cogs += cogs;
        entry.metrics.grossProfit += grossProfit;
      });

      setAvailableProducts(
        Array.from(productsMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );

      // Calculate totals
      let totalSales = 0;
      let totalOrders = 0;
      let totalCOGS = 0;
      let totalGrossProfit = 0;

      aggregatedData.forEach((entry) => {
        totalSales += entry.metrics.sales;
        totalOrders += entry.metrics.orders;
        totalCOGS += entry.metrics.cogs;
        totalGrossProfit += entry.metrics.grossProfit;
      });

      const startDate = parseISO(filters.startDate);
      const endDate = parseISO(filters.endDate);
      const numberOfDays = differenceInDays(endDate, startDate) + 1;

      const dailyAvgSales = totalSales / numberOfDays;
      const dailyAvgOrders = totalOrders / numberOfDays;
      const dailyAvgCOGS = totalCOGS / numberOfDays;
      const dailyAvgGrossProfit = totalGrossProfit / numberOfDays;

      // Update latest metrics
      setLatestMetrics({
        totalSales,
        totalOrders,
        totalCOGS,
        totalGrossProfit,
        dailyAvgSales,
        dailyAvgOrders,
        dailyAvgCOGS,
        dailyAvgGrossProfit,
      });

      const sortedData = Array.from(aggregatedData.values()).sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const today = startOfDay(new Date());
      const historicalData = sortedData.filter(
        (item) => !isAfter(new Date(item.timestamp), today)
      );

      console.log('Processed metrics:', {
        totalSales,
        totalOrders,
        totalCOGS,
        totalGrossProfit,
        numberOfDays,
        historicalDataPoints: historicalData.length,
      });

      const { forecastData, confidence } = generateSalesForecast(
        historicalData,
        forecastRange
      );

      setMetrics(historicalData);
      setForecastData(forecastData);
      setForecastConfidence(confidence);
    } catch (err: any) {
      console.error('Error fetching metrics:', err);
      setError('Failed to load metrics data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Synchronizes platform data
   * Triggers data refresh from external platforms
   * @param platform - The platform to sync (e.g., 'shopee', 'lazada')
   */
  const syncPlatformData = async (platform: string) => {
    setSyncLoading(true);
    setError(null);
    try {
      // Convert platform name to proper case for API call
      const platformName =
        platform === 'all'
          ? undefined
          : platform.charAt(0).toUpperCase() + platform.slice(1);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ecommerce-sync`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ platform: platformName }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync platform data');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to sync platform data');
      }

      await fetchMetrics();
    } catch (error: any) {
      console.error('Error syncing data:', error);
      setError(error.message || 'Failed to sync platform data');
    } finally {
      setSyncLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [filters, forecastRange]);

  const [latestMetrics, setLatestMetrics] = useState<LatestMetrics>({
    totalSales: 0,
    totalOrders: 0,
    totalCOGS: 0,
    totalGrossProfit: 0,
    dailyAvgSales: 0,
    dailyAvgOrders: 0,
    dailyAvgCOGS: 0,
    dailyAvgGrossProfit: 0,
  });

  const firstForecastDay = forecastData[0]?.metrics || { orders: 0, sales: 0 };
  const lastForecastDay = forecastData[forecastData.length - 1]?.metrics || {
    orders: 0,
    sales: 0,
  };

  const orderGrowth =
    lastForecastDay.orders > firstForecastDay.orders
      ? ((lastForecastDay.orders - firstForecastDay.orders) /
          firstForecastDay.orders) *
        100
      : ((firstForecastDay.orders - lastForecastDay.orders) /
          firstForecastDay.orders) *
        100;
  const isOrderGrowthPositive =
    lastForecastDay.orders >= firstForecastDay.orders;

  const salesGrowth =
    lastForecastDay.sales > firstForecastDay.sales
      ? ((lastForecastDay.sales - firstForecastDay.sales) /
          firstForecastDay.sales) *
        100
      : ((firstForecastDay.sales - lastForecastDay.sales) /
          firstForecastDay.sales) *
        100;
  const isSalesGrowthPositive = lastForecastDay.sales >= firstForecastDay.sales;

  const productTypes = ['Dresses', 'Tops', 'Bottoms', 'Outerwear'];
  const platforms = ['Shopee', 'Lazada'];

  const filteredProducts = availableProducts.filter(
    (product) =>
      filters.productType === 'all' ||
      product.type.toLowerCase() === filters.productType.toLowerCase()
  );

  const handleProductTypeChange = (type: string) => {
    setFilters((prev) => ({
      ...prev,
      productType: type,
      productName: 'all',
    }));
  };

  const handleProductNameChange = (name: string) => {
    setFilters((prev) => ({
      ...prev,
      productName: name,
    }));
  };

  /**
   * Chart Configuration
   * Sets up data visualization options and styling
   */
  const chartOptions = {
    height: 300,
    margin: { top: 10, right: 30, left: 0, bottom: 0 },
    gridStyle: {
      strokeDasharray: '3 3',
      stroke: '#E5E7EB',
    },
    tooltipStyle: {
      backgroundColor: 'white',
      border: '1px solid #E5E7EB',
      borderRadius: '6px',
      padding: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    lineColors: {
      historical: '#4F46E5',
      forecast: '#60A5FA',
    },
  };

  /**
   * Platform Metrics Cards
   * Displays key performance indicators for each platform
   */
  const renderMetricsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <Receipt className="h-8 w-8 text-blue-500" />
          <h2 className="ml-2 text-lg font-semibold text-gray-700">Sales</h2>
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold text-gray-900">
            ฿{Math.round(latestMetrics.totalSales || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Daily Avg: ฿
            {Math.round(latestMetrics.dailyAvgSales || 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <TrendingUp className="h-8 w-8 text-red-500" />
          <h2 className="ml-2 text-lg font-semibold text-gray-700">COGS</h2>
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold text-gray-900">
            ฿{Math.round(latestMetrics.totalCOGS || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Daily Avg: ฿
            {Math.round(latestMetrics.dailyAvgCOGS || 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <CircleDollarSign className="h-8 w-8 text-green-500" />
          <h2 className="ml-2 text-lg font-semibold text-gray-700">
            Gross Profit
          </h2>
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold text-gray-900">
            ฿{Math.round(latestMetrics.totalGrossProfit || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Daily Avg: ฿
            {Math.round(
              latestMetrics.dailyAvgGrossProfit || 0
            ).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <BarChart3 className="h-8 w-8 text-purple-500" />
          <h2 className="ml-2 text-lg font-semibold text-gray-700">Orders</h2>
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold text-gray-900">
            {Math.round(latestMetrics.totalOrders || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Daily Avg:{' '}
            {Math.round(latestMetrics.dailyAvgOrders || 0).toLocaleString()}
          </p>
          <div
            className={`mt-2 text-sm ${
              isOrderGrowthPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isOrderGrowthPositive ? '↑' : '↓'}{' '}
            {Math.abs(orderGrowth).toFixed(1)}% expected by{' '}
            {format(
              addDays(
                new Date(),
                getDaysForRange(forecastRange as ForecastRange)
              ),
              'MMM d'
            )}
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Forecast Display
   * Shows predicted metrics based on historical data
   */
  const ConfidenceInfo = () => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className="relative inline-block">
        <button
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <Info className="h-4 w-4" />
        </button>
        {isVisible && (
          <div className="absolute z-50 w-72 p-4 bg-white rounded-lg shadow-lg border border-gray-200 -right-2 top-6">
            <div className="text-sm text-gray-600 space-y-2">
              <p className="font-semibold mb-2">Forecast Confidence Score</p>
              <p>
                Indicates the reliability of our forecast predictions based on:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Data quality and consistency</li>
                <li>Historical pattern strength</li>
                <li>Seasonal trends</li>
                <li>Amount of available data</li>
              </ul>
              <div className="mt-3">
                <p className="font-medium text-gray-700">Score meanings:</p>
                <div className="space-y-1 mt-1">
                  <p>
                    <span className="text-green-600 font-medium">70-100%:</span>{' '}
                    High confidence, reliable predictions
                  </p>
                  <p>
                    <span className="text-yellow-600 font-medium">50-69%:</span>{' '}
                    Moderate confidence, general trends accurate
                  </p>
                  <p>
                    <span className="text-red-600 font-medium">0-49%:</span> Low
                    confidence, use as rough guidance only
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderForecastSection = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Sales Trend & Forecast
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Confidence:</span>
            <span
              className={`font-semibold ${
                forecastConfidence >= 70
                  ? 'text-green-600'
                  : forecastConfidence >= 50
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {forecastConfidence}%
            </span>
            <ConfidenceInfo />
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart>
              <CartesianGrid {...chartOptions.gridStyle} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                type="category"
                allowDuplicatedCategory={false}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value: string) =>
                  format(new Date(value), 'dd MMM yyyy')
                }
                contentStyle={chartOptions.tooltipStyle}
                content={<CustomTooltip />}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="metrics.sales"
                data={metrics}
                stroke={chartOptions.lineColors.historical}
                name="Historical Sales"
                strokeWidth={2}
                dot={true}
              />
              <Line
                type="monotone"
                dataKey="metrics.sales"
                data={forecastData}
                stroke={chartOptions.lineColors.forecast}
                strokeDasharray="5 5"
                name="Forecasted Sales"
                strokeWidth={2}
                dot={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Order Trend & Forecast
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Confidence:</span>
            <span
              className={`font-semibold ${
                forecastConfidence >= 70
                  ? 'text-green-600'
                  : forecastConfidence >= 50
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {forecastConfidence}%
            </span>
            <ConfidenceInfo />
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart>
              <CartesianGrid {...chartOptions.gridStyle} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                type="category"
                allowDuplicatedCategory={false}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value: string) =>
                  format(new Date(value), 'dd MMM yyyy')
                }
                contentStyle={chartOptions.tooltipStyle}
                content={<CustomTooltip />}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="metrics.orders"
                data={metrics}
                stroke={chartOptions.lineColors.historical}
                name="Historical Orders"
                strokeWidth={2}
                dot={true}
              />
              <Line
                type="monotone"
                dataKey="metrics.orders"
                data={forecastData}
                stroke={chartOptions.lineColors.forecast}
                strokeDasharray="5 5"
                name="Forecasted Orders"
                strokeWidth={2}
                dot={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  // Define ValueType
  type ValueType = string | number | null | undefined;

  // Update helper function with better typing
  const toNumber = (value: string | number | undefined): number => {
    if (value === undefined) return 0;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Update chart data processing with proper typing
  const processChartData = (data: ChartData[]): ChartData[] => {
    return data.map((item) => ({
      ...item,
      value: toNumber(item.value),
      ...(item.forecast !== undefined
        ? { forecast: toNumber(item.forecast) }
        : {}),
    }));
  };

  // Update where the chart values are used
  const chartData = processChartData(metrics);

  /**
   * Processes forecast results into chart data
   * @param forecastResults - Array of forecast results
   * @returns Processed chart data
   */
  const processForecastResults = (
    forecastResults: ForecastResult[]
  ): ChartData[] => {
    return forecastResults.map((result) => ({
      metrics: {
        sales: result.metrics.sales,
        orders: result.metrics.orders,
        cogs: 0, // Forecast doesn't predict COGS
        grossProfit: 0, // Forecast doesn't predict gross profit
        timestamp: result.timestamp,
        salesLower: result.metrics.salesLower,
        salesUpper: result.metrics.salesUpper,
        ordersLower: result.metrics.ordersLower,
        ordersUpper: result.metrics.ordersUpper,
      },
      timestamp: result.timestamp,
      isForecast: true,
    }));
  };

  /**
   * Custom tooltip component for charts
   * @component
   * @since 15 Apr 2025
   */
  const CustomTooltip = ({ active, payload, label }: TooltipContentProps) => {
    if (active && payload && payload.length > 0 && payload[0].dataKey) {
      const data = payload[0].payload as ChartData;
      const value = payload[0].value;
      const dataKeyParts = payload[0].dataKey.toString().split('.');
      const metricName = dataKeyParts.length > 1 ? dataKeyParts[1] : '';

      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="text-sm text-gray-600">
            {format(new Date(label || ''), 'dd MMM yyyy')}
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {metricName === 'orders'
              ? `Orders: ${Math.round(value || 0).toLocaleString()}`
              : `Sales: ฿${Math.round(value || 0).toLocaleString()}`}
          </p>
          {data.isForecast && (
            <p className="text-xs text-blue-600 mt-1">Forecasted Value</p>
          )}
        </div>
      );
    }
    return null;
  };

  /**
   * Renders the dashboard layout with metrics cards and charts
   * Includes filters, forecast controls, and data visualization
   */
  return (
    <DashboardLayout>
      <div className="p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Analytics Dashboard
              </h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => syncPlatformData(filters.platform)}
                  disabled={syncLoading}
                  className={`flex items-center ${
                    syncLoading
                      ? 'bg-primary-400'
                      : 'bg-primary-500 hover:bg-primary-600'
                  } text-white px-4 py-2 rounded-md transition-colors`}
                >
                  {syncLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCcw className="h-5 w-5 mr-2" />
                      Sync Data
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <select
                    value={filters.platform}
                    onChange={(e) => {
                      const value = e.target.value;
                      console.log('Selecting platform:', value);
                      setFilters((prev) => ({ ...prev, platform: value }));
                    }}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="all">All Platforms</option>
                    {platforms.map((platform) => (
                      <option key={platform} value={platform.toLowerCase()}>
                        {platform}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Type
                  </label>
                  <select
                    value={filters.productType}
                    onChange={(e) => handleProductTypeChange(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="all">All Types</option>
                    {productTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <select
                    value={filters.productName}
                    onChange={(e) => handleProductNameChange(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="all">All Products</option>
                    {filteredProducts.map((product) => (
                      <option key={product.name} value={product.name}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forecast Range
                  </label>
                  <select
                    value={forecastRange}
                    onChange={(e) =>
                      setForecastRange(e.target.value as ForecastRange)
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="7d">7 Days</option>
                    <option value="14d">14 Days</option>
                    <option value="1month">1 Month</option>
                    <option value="3months">3 Months</option>
                    <option value="6months">6 Months</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">From</span>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">To</span>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {renderMetricsCards()}
            {renderForecastSection()}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
