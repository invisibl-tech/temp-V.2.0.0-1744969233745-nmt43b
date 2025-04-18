import React, { useState, useEffect } from 'react';
import { Download, Upload, Trash2, AlertCircle, Check, ChevronDown, ChevronUp, Calendar, DollarSign, Package2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../App';
import { optimizePrice } from '../utils/priceOptimization';
import { addDays, format, isAfter, isBefore, parseISO } from 'date-fns';

interface Product {
  id: string;
  item_id: string;
  name: string;
  cost: number;
  size?: string;
  color?: string;
}

interface SalesData {
  price: number;
  quantity: number;
  timestamp: string;
}

type OptimizationGoal = 'profit' | 'sales' | 'inventory';

interface OptimizationResult {
  optimalDiscount: number;
  optimalPrice: number;
  originalPrice: number;
  expectedRevenue: number;
  expectedProfit: number;
  confidence: number;
  dailyRevenue: number;
  dailyProfit: number;
  campaignDays: number;
  expectedQuantity: {
    daily: number;
    total: number;
  };
  priceElasticity: {
    value: number;
    interpretation: string;
  };
}

interface ProductOptimization extends Product {
  selected: boolean;
  result?: OptimizationResult;
  loading?: boolean;
  error?: string;
}

interface CampaignPeriod {
  startDate: string;
  endDate: string;
}

function PricingTools() {
  const [discountRange, setDiscountRange] = useState({ min: 0, max: 50 });
  const [optimizationGoal, setOptimizationGoal] = useState<OptimizationGoal>('profit');
  const [products, setProducts] = useState<ProductOptimization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [campaignPeriod, setCampaignPeriod] = useState<CampaignPeriod>({
    startDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 14), 'yyyy-MM-dd')
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('product_costs')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts((data || []).map(product => ({
        ...product,
        selected: false
      })));
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products');
    }
  };

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setProducts(products.map(product => ({
      ...product,
      selected: newSelectAll
    })));
  };

  const toggleProductSelection = (itemId: string) => {
    setProducts(products.map(product => {
      if (product.item_id === itemId) {
        return { ...product, selected: !product.selected };
      }
      return product;
    }));
    setSelectAll(products.every(p => p.item_id === itemId ? !p.selected : p.selected));
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const validateCampaignPeriod = (): string | null => {
    const start = parseISO(campaignPeriod.startDate);
    const end = parseISO(campaignPeriod.endDate);
    const today = new Date();

    if (isBefore(start, today)) {
      return 'Campaign start date must be in the future';
    }

    if (isBefore(end, start)) {
      return 'Campaign end date must be after start date';
    }

    return null;
  };

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);

    try {
      const periodError = validateCampaignPeriod();
      if (periodError) {
        throw new Error(periodError);
      }

      const selectedProducts = products.filter(p => p.selected);
      if (selectedProducts.length === 0) {
        throw new Error('Please select at least one product to optimize');
      }

      setProducts(products.map(product => ({
        ...product,
        loading: product.selected,
        error: undefined,
        result: undefined
      })));

      const { data: metricsData, error: metricsError } = await supabase
        .from('platform_metrics')
        .select('*')
        .order('timestamp', { ascending: true });

      if (metricsError) throw metricsError;

      const updatedProducts = await Promise.all(
        products.map(async (product) => {
          if (!product.selected) return product;

          try {
            const salesData: SalesData[] = (metricsData || [])
              .filter(metric => 
                metric.metrics.product_id === product.item_id ||
                metric.metrics.item_id === product.item_id
              )
              .map(metric => ({
                price: metric.metrics.price || 0,
                quantity: metric.metrics.quantity || 0,
                timestamp: metric.timestamp
              }));

            if (salesData.length === 0) {
              return {
                ...product,
                loading: false,
                error: 'No historical sales data available'
              };
            }

            const currentPrice = salesData[salesData.length - 1].price;
            const result = optimizePrice(
              currentPrice,
              product.cost,
              salesData,
              optimizationGoal,
              discountRange.min,
              discountRange.max,
              {
                startDate: campaignPeriod.startDate,
                endDate: campaignPeriod.endDate
              }
            );

            return {
              ...product,
              loading: false,
              result
            };
          } catch (err: any) {
            return {
              ...product,
              loading: false,
              error: err.message
            };
          }
        })
      );

      setProducts(updatedProducts);
    } catch (err: any) {
      console.error('Error optimizing prices:', err);
      setError(err.message || 'Failed to optimize prices');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Bulk Price Optimization</h1>
          <p className="text-gray-600">
            Optimize prices for multiple products simultaneously based on historical sales data and your business objectives.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Period
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={campaignPeriod.startDate}
                      onChange={(e) => setCampaignPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                      min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                      className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={campaignPeriod.endDate}
                      onChange={(e) => setCampaignPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                      min={campaignPeriod.startDate}
                      className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Optimization Goal</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setOptimizationGoal('profit')}
                  className={`p-2 rounded-lg border text-center ${
                    optimizationGoal === 'profit'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <DollarSign className="h-4 w-4 mx-auto mb-1" />
                  <span className="block text-xs font-medium">Profit</span>
                </button>
                <button
                  onClick={() => setOptimizationGoal('sales')}
                  className={`p-2 rounded-lg border text-center ${
                    optimizationGoal === 'sales'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <Package2 className="h-4 w-4 mx-auto mb-1" />
                  <span className="block text-xs font-medium">Sales</span>
                </button>
                <button
                  onClick={() => setOptimizationGoal('inventory')}
                  className={`p-2 rounded-lg border text-center ${
                    optimizationGoal === 'inventory'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <Package2 className="h-4 w-4 mx-auto mb-1" />
                  <span className="block text-xs font-medium">Inventory</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount Range (%)</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountRange.min}
                    onChange={(e) => setDiscountRange({ ...discountRange, min: Number(e.target.value) })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountRange.max}
                    onChange={(e) => setDiscountRange({ ...discountRange, max: Number(e.target.value) })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleOptimize}
                disabled={!products.some(p => p.selected) || loading}
                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Calculating optimal prices...' : 'Calculate Optimal Prices'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2">Select All</span>
                    </label>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Optimal Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <React.Fragment key={product.item_id}>
                    <tr className={product.selected ? 'bg-indigo-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={product.selected}
                            onChange={() => toggleProductSelection(product.item_id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <button
                            onClick={() => toggleExpanded(product.item_id)}
                            className="ml-4 text-gray-400 hover:text-gray-500"
                          >
                            {expandedItems.has(product.item_id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          {product.size && `Size: ${product.size}`}
                          {product.size && product.color && ' • '}
                          {product.color && `Color: ${product.color}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ฿{product.cost.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.result ? (
                          <>
                            <div className="font-medium text-green-600">
                              ฿{product.result.optimalPrice.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              Original: ฿{product.result.originalPrice.toLocaleString()}
                            </div>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {product.result && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {product.result.optimalDiscount}%
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {product.loading ? (
                          <span className="text-gray-500">Calculating...</span>
                        ) : product.error ? (
                          <span className="text-red-600">{product.error}</span>
                        ) : product.result ? (
                          <span className="text-green-600">Optimized</span>
                        ) : (
                          <span className="text-gray-500">Not calculated</span>
                        )}
                      </td>
                    </tr>
                    {expandedItems.has(product.item_id) && product.result && (
                      <tr className={product.selected ? 'bg-indigo-50' : ''}>
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-sm font-medium text-gray-500 mb-2">Campaign Duration</div>
                              <div className="text-lg font-semibold text-gray-900">
                                {product.result.campaignDays} days
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-sm font-medium text-gray-500 mb-2">Price Elasticity</div>
                              <div className="text-lg font-semibold text-gray-900">
                                {product.result.priceElasticity.value}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {product.result.priceElasticity.interpretation}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-sm font-medium text-gray-500 mb-2">Confidence Score</div>
                              <div className={`text-lg font-semibold ${
                                product.result.confidence >= 70 ? 'text-green-600' :
                                product.result.confidence >= 50 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {product.result.confidence}%
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-sm font-medium text-gray-500 mb-2">Price Change</div>
                              <div className="text-lg font-semibold text-gray-900">
                                ฿{product.result.originalPrice.toLocaleString()} → ฿{product.result.optimalPrice.toLocaleString()}
                              </div>
                              <div className="text-sm text-green-600 mt-1">
                                {product.result.optimalDiscount}% discount
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-sm font-medium text-gray-500 mb-1">Daily Metrics</div>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-sm text-gray-600">Revenue:</span>
                                  <span className="ml-2 text-lg font-semibold text-gray-900">
                                    ฿{product.result.dailyRevenue.toLocaleString()}/day
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">Profit:</span>
                                  <span className="ml-2 text-lg font-semibold text-gray-900">
                                    ฿{product.result.dailyProfit.toLocaleString()}/day
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">Expected Units:</span>
                                  <span className="ml-2 text-lg font-semibold text-gray-900">
                                    {product.result.expectedQuantity.daily.toLocaleString()}/day
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-sm font-medium text-gray-500 mb-1">Campaign Total</div>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-sm text-gray-600">Revenue:</span>
                                  <span className="ml-2 text-lg font-semibold text-gray-900">
                                    ฿{product.result.expectedRevenue.toLocaleString()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">Profit:</span>
                                  <span className="ml-2 text-lg font-semibold text-gray-900">
                                    ฿{product.result.expectedProfit.toLocaleString()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">Expected Units:</span>
                                  <span className="ml-2 text-lg font-semibold text-gray-900">
                                    {product.result.expectedQuantity.total.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}

                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                      No products found. Upload your first product cost data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default PricingTools;