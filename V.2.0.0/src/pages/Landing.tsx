import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Star, 
  Clock, 
  TrendingUp, 
  Users, 
  Plus, 
  Minus, 
  Instagram, 
  Globe,
  LayoutDashboard,
  BrainCircuit,
  LineChart,
  BadgePercent,
  Boxes
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: 'What does this platform do?',
    answer: 'Our platform analyzes your online store data using AI to provide actionable insights for optimizing your sales and inventory management.'
  },
  {
    question: 'How does the AI optimize promotions?',
    answer: 'By analyzing historical sales data, customer behavior, and market trends, our AI provides recommendations for pricing and inventory decisions.'
  },
  {
    question: 'Is there a free trial available?',
    answer: 'Yes! We offer a 14-day free trial with full access to all features, no credit card required.'
  }
];

function Landing() {
  const [openQuestions, setOpenQuestions] = useState<{ [key: number]: boolean }>({});
  const { session, signOut } = useAuth();

  const toggleQuestion = (index: number) => {
    setOpenQuestions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
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

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            AI-Powered Analytics for
            <span className="text-primary-500"> Online Sellers</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Make smarter decisions with AI-driven insights. Boost your Shopee, Lazada, and TikTok Shop sales while maximizing profits.
          </p>
          <div className="flex justify-center space-x-4">
            {session ? (
              <Link
                to="/dashboard"
                className="bg-primary-500 text-white px-8 py-3 rounded-md hover:bg-primary-600 transition-colors text-lg font-semibold"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="bg-primary-500 text-white px-8 py-3 rounded-md hover:bg-primary-600 transition-colors text-lg font-semibold"
                >
                  Get Started
                </Link>
                <Link
                  to="/demo"
                  className="bg-white text-primary-500 px-8 py-3 rounded-md border-2 border-primary-500 hover:bg-primary-50 transition-colors text-lg font-semibold"
                >
                  View Demo
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Our Analytics Platform?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <Boxes className="h-10 w-10 text-primary-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Setup</h3>
              <p className="text-gray-600">
                Connect your online stores in minutes. No coding needed—just simple, guided integration.
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <LayoutDashboard className="h-10 w-10 text-primary-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Unified View</h3>
              <p className="text-gray-600">
                See all your store data in one place. Track performance across platforms effortlessly.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <BrainCircuit className="h-10 w-10 text-primary-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Insights</h3>
              <p className="text-gray-600">
                Get AI-powered recommendations to improve sales and optimize inventory levels.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <LineChart className="h-10 w-10 text-primary-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Price Optimization</h3>
              <p className="text-gray-600">
                Set the right prices that maximize your sales/ profits using data-driven suggestions.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <BadgePercent className="h-10 w-10 text-primary-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Promotion Tools</h3>
              <p className="text-gray-600">
                Create effective promotions with smart voucher and discount recommendations.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">FAQ'S</h2>
            <p className="text-xl text-primary-500">Find Solutions To Your Questions</p>
          </div>
          <div className="space-y-4">
            {faqData.map((item, index) => {
              const isOpen = openQuestions[index];
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() => toggleQuestion(index)}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <span className="text-lg font-medium text-gray-900">{item.question}</span>
                    {isOpen ? (
                      <Minus className="h-5 w-5 text-primary-500" />
                    ) : (
                      <Plus className="h-5 w-5 text-primary-500" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-gray-600">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="text-center mt-8">
              <Link
                to="/faq"
                className="text-primary-500 hover:text-primary-600 font-medium"
              >
                View all FAQs
              </Link>
            </div>
          </div>
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
                AI-powered insights for online sellers.
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

export default Landing;