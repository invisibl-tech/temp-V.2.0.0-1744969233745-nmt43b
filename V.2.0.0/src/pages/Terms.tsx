import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Instagram, Globe } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

function Terms() {
  const { session } = useAuth();

  const handleSignOut = async () => {
    window.location.href = '/auth';
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
                    onClick={handleSignOut}
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
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms and Conditions</h1>
          
          <div className="prose prose-primary max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p className="text-gray-600 mb-4">
              These Terms and Conditions govern your use of invisibl and the services we provide. By using our service, you agree to these terms. Please read them carefully.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Definitions</h2>
            <p className="text-gray-600 mb-4">
              "Service" refers to the invisibl platform, including all features, functionalities, and user interfaces.
              "User" refers to any person or entity that accesses or uses the Service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Account Terms</h2>
            <ul className="list-disc text-gray-600 ml-6 mb-4">
              <li className="mb-2">You must be 18 years or older to use this Service.</li>
              <li className="mb-2">You must provide accurate and complete information when creating an account.</li>
              <li className="mb-2">You are responsible for maintaining the security of your account.</li>
              <li className="mb-2">You must notify us immediately of any unauthorized use of your account.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Payment Terms</h2>
            <p className="text-gray-600 mb-4">
              Subscription fees are billed in advance on a monthly or annual basis. All fees are non-refundable. You will be billed automatically unless you cancel your subscription.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Data Usage</h2>
            <p className="text-gray-600 mb-4">
              We collect and process data in accordance with our Privacy Policy. By using our Service, you agree to our data collection and processing practices.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Termination</h2>
            <p className="text-gray-600 mb-4">
              We reserve the right to suspend or terminate your account at any time for any reason, including violation of these terms.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Changes to Terms</h2>
            <p className="text-gray-600 mb-4">
              We may modify these terms at any time. We will notify you of any material changes via email or through the Service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Contact</h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about these terms, please contact us at legal@invisibl.co
            </p>
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
                AI-powered insights for e-commerce success.
              </p>
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
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Legal</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link to="/terms" className="text-gray-600 hover:text-gray-900">Terms & Conditions</Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-gray-600 hover:text-gray-900">Privacy Policy</Link>
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

export default Terms;