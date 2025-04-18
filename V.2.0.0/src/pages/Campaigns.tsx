import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Percent, ShoppingBag, TrendingUp, Package2, Calculator } from 'lucide-react';
import { format, subDays, addDays, parseISO, differenceInDays } from 'date-fns';

// Mock data for different platforms
const platformData = {
  all: [
    { date: '2024-04-01', sales: 12000, baseline: 8000, cost: 2000, cogs: 6000, items: 120, orders: 80 },
    { date: '2024-04-02', sales: 15000, baseline: 8200, cost: 2500, cogs: 7500, items: 150, orders: 100 },
    { date: '2024-04-03', sales: 18000, baseline: 8400, cost: 3000, cogs: 9000, items: 180, orders: 120 },
    { date: '2024-04-04', sales: 16000, baseline: 8100, cost: 2700, cogs: 8000, items: 160, orders: 105 },
    { date: '2024-04-05', sales: 19000, baseline: 8300, cost: 3200, cogs: 9500, items: 190, orders: 125 },
    { date: '2024-04-06', sales: 22000, baseline: 8600, cost: 3700, cogs: 11000, items: 220, orders: 145 },
    { date: '2024-04-07', sales: 25000, baseline: 8400, cost: 4200, cogs: 12500, items: 250, orders: 165 }
  ],
  shopee: [
    { date: '2024-04-01', sales: 7000, baseline: 4500, cost: 1200, cogs: 3500, items: 70, orders: 45 },
    { date: '2024-04-02', sales: 8500, baseline: 4700, cost: 1400, cogs: 4250, items: 85, orders: 55 },
    { date: '2024-04-03', sales: 10000, baseline: 4800, cost: 1700, cogs: 5000, items: 100, orders: 65 },
    { date: '2024-04-04', sales: 9000, baseline: 4600, cost: 1500, cogs: 4500, items: 90, orders: 60 },
    { date: '2024-04-05', sales: 11000, baseline: 4700, cost: 1800, cogs: 5500, items: 110, orders: 70 },
    { date: '2024-04-06', sales: 13000, baseline: 4900, cost: 2100, cogs: 6500, items: 130, orders: 85 },
    { date: '2024-04-07', sales: 15000, baseline: 4800, cost: 2500, cogs: 7500, items: 150, orders: 95 }
  ],
  lazada: [
    { date: '2024-04-01', sales: 5000, baseline: 3500, cost: 800, cogs: 2500, items: 50, orders: 35 },
    { date: '2024-04-02', sales: 6500, baseline: 3500, cost: 1100, cogs: 3250, items: 65, orders: 45 },
    { date: '2024-04-03', sales: 8000, baseline: 3600, cost: 1300, cogs: 4000, items: 80, orders: 55 },
    { date: '2024-04-04', sales: 7000, baseline: 3500, cost: 1200, cogs: 3500, items: 70, orders: 45 },
    { date: '2024-04-05', sales: 8000, baseline: 3600, cost: 1400, cogs: 4000, items: 80, orders: 55 },
    { date: '2024-04-06', sales: 9000, baseline: 3700, cost: 1600, cogs: 4500, items: 90, orders: 60 },
    { date: '2024-04-07', sales: 10000, baseline: 3600, cost: 1700, cogs: 5000, items: 100, orders: 70 }
  ]
};

function Campaigns() {
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '2024-04-01',
    endDate: '2024-04-07'
  });

  // Filter data based on selected platform and date range
  const filteredData = platformData[selectedPlatform as keyof typeof platformData].filter(item => {
    const itemDate = item.date;
    return itemDate >= dateRange.startDate && itemDate <= dateRange.endDate;
  });

  // Calculate metrics based on filtered data
  const calculateMetrics = () => {
    const totalSales = filteredData.reduce((sum, day) => sum + day.sales, 0);
    const totalBaseline = filteredData.reduce((sum, day) => sum + day.baseline, 0);
    const totalCost = filteredData.reduce((sum, day) => sum + day.cost, 0);
    const totalCOGS = filteredData.reduce((sum, day) => sum + day.cogs, 0);
    const totalOrders = filteredData.reduce((sum, day) => sum + day.orders, 0);
    const totalItems = filteredData.reduce((sum, day) => sum + day.items, 0);

    const grossProfit = totalSales - totalCOGS;
    const roi = ((grossProfit - totalCost) / totalCost) * 100;
    const avgOrderValue = totalSales / totalOrders;
    const avgItemsPerOrder = totalItems / totalOrders;

    return {
      totalSales,
      grossProfit,
      campaignCost: totalCost,
      roi,
      totalOrders,
      avgOrderValue,
      avgItemsPerOrder
    };
  };

  const metrics = calculateMetrics();

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Campaign Performance</h1>
          <p className="text-gray-600">
            Track and analyze your promotional campaigns' performance and ROI.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="all">All Platforms</option>
                <option value="shopee">Shopee</option>
                <option value="lazada">Lazada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Period</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    min={dateRange.startDate}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* First Row - Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-500" />
              <h2 className="ml-2 text-lg font-semibold text-gray-700">Total Sales</h2>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">฿{Math.round(metrics.totalSales).toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">Campaign revenue</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-green-500" />
              <h2 className="ml-2 text-lg font-semibold text-gray-700">Gross Profit</h2>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">฿{Math.round(metrics.grossProfit).toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">After COGS</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Percent className="h-8 w-8 text-red-500" />
              <h2 className="ml-2 text-lg font-semibold text-gray-700">Campaign Cost</h2>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">฿{Math.round(metrics.campaignCost).toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">{((metrics.campaignCost / metrics.totalSales) * 100).toFixed(1)}% of revenue</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <h2 className="ml-2 text-lg font-semibold text-gray-700">ROI</h2>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">{Math.round(metrics.roi)}%</p>
            <p className="text-sm text-gray-600 mt-1">Based on gross profit</p>
          </div>
        </div>

        {/* Second Row - Order Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ShoppingBag className="h-8 w-8 text-orange-500" />
              <h2 className="ml-2 text-lg font-semibold text-gray-700">Total Orders</h2>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">{metrics.totalOrders.toLocaleString()}</p>
            <p className="text-sm text-green-600 mt-1">↑ 35% vs baseline</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-teal-500" />
              <h2 className="ml-2 text-lg font-semibold text-gray-700">Avg. Order Value</h2>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">฿{Math.round(metrics.avgOrderValue).toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">Per transaction</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package2 className="h-8 w-8 text-indigo-500" />
              <h2 className="ml-2 text-lg font-semibold text-gray-700">Avg. Items/Order</h2>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">{metrics.avgItemsPerOrder.toFixed(1)}</p>
            <p className="text-sm text-gray-600 mt-1">Items per transaction</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Campaign Performance vs Baseline</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(parseISO(value), 'MMM d')}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => `฿${value.toLocaleString()}`}
                    labelFormatter={(value) => format(parseISO(value as string), 'MMM d, yyyy')}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#4F46E5" 
                    name="Campaign Sales"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="baseline" 
                    stroke="#9CA3AF" 
                    name="Baseline Sales"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Campaign Details</h2>
              <div className="space-y-4">
                <div className="flex justify-between border-b pb-4">
                  <span className="text-gray-600">Campaign Name</span>
                  <span className="font-medium text-gray-900">Summer Sale 2024</span>
                </div>
                <div className="flex justify-between border-b pb-4">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium text-gray-900">
                    {format(parseISO(dateRange.startDate), 'MMM d')} - {format(parseISO(dateRange.endDate), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-4">
                  <span className="text-gray-600">Discount Type</span>
                  <span className="font-medium text-gray-900">Percentage (20% off)</span>
                </div>
                <div className="flex justify-between border-b pb-4">
                  <span className="text-gray-600">Target Audience</span>
                  <span className="font-medium text-gray-900">All Customers</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platforms</span>
                  <span className="font-medium text-gray-900">
                    {selectedPlatform === 'all' ? 'All Platforms' : selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Campaign Cost Breakdown</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Marketing Spend</h3>
                    <p className="text-sm text-gray-500">Ads & Promotions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">฿15,000</p>
                    <p className="text-sm text-gray-600">45% of budget</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Discount Cost</h3>
                    <p className="text-sm text-gray-500">Price Reductions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">฿12,000</p>
                    <p className="text-sm text-gray-600">35% of budget</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Platform Fees</h3>
                    <p className="text-sm text-gray-500">Commission & Fees</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">฿5,000</p>
                    <p className="text-sm text-gray-600">15% of budget</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Other Costs</h3>
                    <p className="text-sm text-gray-500">Miscellaneous</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">฿2,000</p>
                    <p className="text-sm text-gray-600">5% of budget</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Campaigns;