import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3,
  Globe, 
  Instagram,
  ArrowRight,
  LayoutDashboard,
  BrainCircuit,
  LineChart,
  Percent,
  BadgePercent,
  Boxes
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

function Features() {
  const { session, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <nav className="bg-white/80 backdrop-blur-sm fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <BarChart3 className="h-8 w-8 text-primary-500" />
              <span className="ml-2 text-2xl font-bold text-gray-900">invisibl</span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/features" className="text-gray-600 hover:text-gray-900">Features</Link>
              <Link to="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
              <Link to="/faq" className="text-gray-600 hover:text-gray-900">FAQ</Link>
              {session ? (
                <>
                  <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
                  <button
                    onClick={signOut}
                    className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth" className="text-gray-600 hover:text-gray-900">Sign in</Link>
                  <Link
                    to="/auth"
                    className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Unified E-commerce Analytics
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect your Shopee, Lazada, and TikTok Shop stores. Get daily insights and AI-powered recommendations to boost your sales.
          </p>
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-primary-50 to-white p-8 rounded-2xl shadow-sm">
              <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-6">
                <LayoutDashboard className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Unified Dashboard</h3>
              <p className="text-gray-600 mb-6">
                All your e-commerce data in one place, updated daily for comprehensive insights.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-primary-500 mr-2" />
                  Connect multiple e-commerce platforms
                </li>
                <li className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-primary-500 mr-2" />
                  Daily data synchronization
                </li>
                <li className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-primary-500 mr-2" />
                  Historical performance tracking
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-primary-50 to-white p-8 rounded-2xl shadow-sm">
              <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-6">
                <BrainCircuit className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Sales Forecasting</h3>
              <p className="text-gray-600 mb-6">
                Make data-driven decisions with our AI-powered sales prediction tools.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-primary-500 mr-2" />
                  Sales trend analysis
                </li>
                <li className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-primary-500 mr-2" />
                  Inventory planning insights
                </li>
                <li className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-primary-500 mr-2" />
                  Seasonal pattern detection
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-primary-50 to-white p-8 rounded-2xl shadow-sm">
              <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-6">
                <Percent className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Price Optimization</h3>
              <p className="text-gray-600 mb-6">
                Find the perfect price point that maximizes your profits using historical data analysis.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-primary-500 mr-2" />
                  Data-driven price recommendations
                </li>
                <li className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-primary-500 mr-2" />
                  Historical price performance
                </li>
                <li className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-primary-500 mr-2" />
                  Profit margin optimization
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-primary-50 to-white p-8 rounded-2xl shadow-sm">
              <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-6">
                <LineChart className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Campaign Performance</h3>
              <p className="text-gray-600 mb-6">
                Track your marketing campaigns with daily updated metrics and insights.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-primary-500 mr-2" />
                  Daily ROI updates
                </li>
                <li className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-primary-500 mr-2" />
                  Marketing spend tracking
                </li>
                <li className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-primary-500 mr-2" />
                  Performance comparison tools
                </li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="bg-gradient-to-br from-primary-50 to-white p-8 rounded-2xl shadow-sm">
              <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-6">
                <BadgePercent className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Voucher Recommendations</h3>
              <p className="text-gray-600 mb-6">
                Create effective vouchers based on customer purchase patterns and historical performance.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-primary-500 mr-2" />
                  Purchase pattern analysis
                </li>
                <li className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-primary-500 mr-2" />
                  Discount impact prediction
                </li>
                <li className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-primary-500 mr-2" />
                  Bundle recommendations
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-primary-50 to-white p-8 rounded-2xl shadow-sm">
              <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-6">
                <Boxes className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Easy Integration</h3>
              <p className="text-gray-600 mb-6">
                Connect your stores in minutes with our simple setup process. No coding required.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-primary-500 mr-2" />
                  Simple authorization process
                </li>
                <li className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-primary-500 mr-2" />
                  Daily data updates
                </li>
                <li className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-primary-500 mr-2" />
                  No technical skills needed
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 bg-primary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Grow Your Online Business?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of sellers who are already using our tools to boost their sales
          </p>
          {session ? (
            <Link
              to="/dashboard"
              className="inline-block bg-white text-primary-600 px-8 py-3 rounded-md hover:bg-primary-50 transition-colors text-lg font-semibold"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              to="/auth"
              className="inline-block bg-white text-primary-600 px-8 py-3 rounded-md hover:bg-primary-50 transition-colors text-lg font-semibold"
            >
              Start Free Trial
            </Link>
          )}
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-primary-500" />
                <span className="ml-2 text-xl font-bold text-gray-900">invisibl</span>
              </div>
              <p className="mt-4 text-gray-600">
                AI-powered insights for e-commerce success.
              </p>
              <div className="mt-4 flex space-x-4 text-sm text-gray-500">
                <Link to="/terms" className="hover:text-gray-900">Terms</Link>
                <Link to="/privacy" className="hover:text-gray-900">Privacy</Link>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Product</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link to="/features" className="text-gray-600 hover:text-gray-900">Features</Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Support</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link to="/faq" className="text-gray-600 hover:text-gray-900">FAQ</Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Connect</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="https://instagram.com/invisibl.co" target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-600 hover:text-gray-900">
                    <Instagram className="h-5 w-5 mr-2" />
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="https://invisibl.co" target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-600 hover:text-gray-900">
                    <Globe className="h-5 w-5 mr-2" />
                    Website
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-gray-600">
              © {new Date().getFullYear()} Invisible Co., Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Features;