import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { BadgePercent, TrendingUp, Users, ShoppingBag } from 'lucide-react';

function Promotions() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Voucher & Promotions</h1>
          <p className="text-gray-600">
            Analyze customer behavior and get AI-powered recommendations for your promotional campaigns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BadgePercent className="h-8 w-8 text-blue-500" />
              <h2 className="ml-2 text-lg font-semibold text-gray-700">Active Vouchers</h2>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">12</p>
            <p className="text-sm text-gray-600 mt-1">3 expiring soon</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <h2 className="ml-2 text-lg font-semibold text-gray-700">Conversion Rate</h2>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">4.8%</p>
            <p className="text-sm text-green-600 mt-1">↑ 0.5% from last week</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-500" />
              <h2 className="ml-2 text-lg font-semibold text-gray-700">Voucher Usage</h2>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">856</p>
            <p className="text-sm text-gray-600 mt-1">This month</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ShoppingBag className="h-8 w-8 text-yellow-500" />
              <h2 className="ml-2 text-lg font-semibold text-gray-700">Avg. Order Value</h2>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">฿1,250</p>
            <p className="text-sm text-green-600 mt-1">↑ ฿120 with vouchers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recommended Promotions</h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">Flash Sale - Summer Collection</h3>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">High Impact</span>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  20% off on summer dresses during peak shopping hours (18:00-22:00)
                </p>
                <div className="text-sm text-gray-500">
                  Expected uplift: +45% sales volume
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">Bundle Discount</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Medium Impact</span>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  Buy 2 items, get 15% off on the third item
                </p>
                <div className="text-sm text-gray-500">
                  Expected uplift: +25% average order value
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">First-Time Buyer Discount</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Medium Impact</span>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  10% off first purchase with minimum spend ฿500
                </p>
                <div className="text-sm text-gray-500">
                  Expected uplift: +30% new customer conversion
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Customer Behavior Insights</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Peak Shopping Hours</h3>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <div className="mt-2 flex justify-between text-sm text-gray-500">
                  <span>18:00 - 22:00</span>
                  <span>75% of daily orders</span>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Price Sensitivity</h3>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <div className="mt-2 flex justify-between text-sm text-gray-500">
                  <span>Medium</span>
                  <span>60% price elastic</span>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Repeat Purchase Rate</h3>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '40%' }}></div>
                </div>
                <div className="mt-2 flex justify-between text-sm text-gray-500">
                  <span>Monthly</span>
                  <span>40% of customers</span>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Cart Abandonment Rate</h3>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <div className="mt-2 flex justify-between text-sm text-gray-500">
                  <span>Current</span>
                  <span>65% abandon rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Promotions;