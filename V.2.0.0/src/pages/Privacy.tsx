import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Instagram, Globe } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

function Privacy() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-primary max-w-none">
            <p className="text-gray-600 mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p className="text-gray-600 mb-4">
              At invisibl, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>
            <p className="text-gray-600 mb-4">We collect the following types of information:</p>
            <ul className="list-disc text-gray-600 ml-6 mb-4">
              <li className="mb-2">Account information (email, business name)</li>
              <li className="mb-2">E-commerce platform data</li>
              <li className="mb-2">Sales and inventory data</li>
              <li className="mb-2">Usage data and analytics</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">We use your information to:</p>
            <ul className="list-disc text-gray-600 ml-6 mb-4">
              <li className="mb-2">Provide and improve our services</li>
              <li className="mb-2">Generate analytics and insights</li>
              <li className="mb-2">Send important updates and notifications</li>
              <li className="mb-2">Maintain and secure your account</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Security</h2>
            <p className="text-gray-600 mb-4">
              We implement industry-standard security measures to protect your data. This includes encryption, secure servers, and regular security audits.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Data Sharing</h2>
            <p className="text-gray-600 mb-4">
              We do not sell your data. We only share your information with third parties when necessary to provide our services or when required by law.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Your Rights</h2>
            <p className="text-gray-600 mb-4">You have the right to:</p>
            <ul className="list-disc text-gray-600 ml-6 mb-4">
              <li className="mb-2">Access your personal data</li>
              <li className="mb-2">Correct inaccurate data</li>
              <li className="mb-2">Request data deletion</li>
              <li className="mb-2">Export your data</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have questions about this Privacy Policy, please contact us at privacy@invisibl.co
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

export default Privacy;