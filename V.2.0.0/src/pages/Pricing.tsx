import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Instagram, Globe, Check } from 'lucide-react';
import { useStripeSubscription } from '../hooks/useStripeSubscription';
import { useAuth } from '../hooks/useAuth';

interface PricingPlan {
  name: string;
  price: number;
  description: string;
  features: string[];
  priceIds: {
    monthly: string;
    yearly: string;
  };
}

const plans: PricingPlan[] = [
  {
    name: 'Essential',
    price: 999,
    description: 'Tailored for small retailers ready to move past guesswork and create smarter, more effective promotions with ease.',
    features: [
      'Up to 3 SKUs',
      'Manual input no API integrations',
      'Data storage up to 6 months',
      'Basic analytics dashboard',
      'Email support'
    ],
    priceIds: {
      monthly: import.meta.env.VITE_STRIPE_PRICE_ESSENTIAL_MONTHLY,
      yearly: import.meta.env.VITE_STRIPE_PRICE_ESSENTIAL_YEARLY
    }
  },
  {
    name: 'Advanced',
    price: 2499,
    description: 'For ambitious retailers looking to elevate their promotions with data-driven insights and campaign tracking.',
    features: [
      'Up to 20 SKUs',
      'API integrations with Shopee and Lazada',
      'Data storage up to 2 years',
      'Advanced analytics & reporting',
      'Priority email support',
      'Campaign tracking'
    ],
    priceIds: {
      monthly: import.meta.env.VITE_STRIPE_PRICE_ADVANCED_MONTHLY,
      yearly: import.meta.env.VITE_STRIPE_PRICE_ADVANCED_YEARLY
    }
  },
  {
    name: 'Ultimate',
    price: 4999,
    description: 'Empower your business to compete like big brands using advanced personalization and testing tools.',
    features: [
      'Up to 50 SKUs',
      'API integrations with Shopee and Lazada',
      'Data storage up to 5 years',
      'Custom analytics solutions',
      '24/7 priority support',
      'A/B testing capabilities',
      'Custom API integrations'
    ],
    priceIds: {
      monthly: import.meta.env.VITE_STRIPE_PRICE_ULTIMATE_MONTHLY,
      yearly: import.meta.env.VITE_STRIPE_PRICE_ULTIMATE_YEARLY
    }
  }
];

function Pricing() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const { subscribe, loading, error } = useStripeSubscription();
  const { session, signOut } = useAuth();

  const handleSubscribe = async (plan: PricingPlan) => {
    const priceId = billingInterval === 'monthly' ? plan.priceIds.monthly : plan.priceIds.yearly;
    await subscribe(priceId);
  };

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

      {/* Pricing Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center px-4 py-1 rounded-full bg-primary-100 mb-8">
              <span className="text-primary-600 text-sm font-medium">Pricing</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Flexible & transparent pricing
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Select a subscription plan that fits the needs of your business.{' '}
              <span className="font-semibold">Try any plan free for 14 days.</span>
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-12">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                  billingInterval === 'monthly'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('yearly')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                  billingInterval === 'yearly'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Yearly
                <span className="ml-1 text-xs">(-20%)</span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    ฿{billingInterval === 'yearly' ? Math.round(plan.price * 0.8) : plan.price}
                  </span>
                  <span className="text-gray-600">/mo</span>
                </div>
                <p className="text-gray-600 mb-8">{plan.description}</p>
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading}
                  className="w-full bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors mb-8 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : '14-day free trial'}
                </button>
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">You can cancel at any time</p>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="font-medium text-gray-900 mb-4">FEATURES</p>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
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

export default Pricing;