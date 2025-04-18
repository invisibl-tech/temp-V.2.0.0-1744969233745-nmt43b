import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Plus, Minus, Instagram, Globe } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  items: FAQItem[];
}

const faqData: FAQSection[] = [
  {
    title: 'About The Platform',
    items: [
      {
        question: 'What does this platform do?',
        answer: 'Our platform analyzes your e-commerce data using AI to provide actionable insights for optimizing your sales and inventory management. We help fashion retailers make data-driven decisions to improve their business performance.'
      },
      {
        question: 'How does the AI optimize promotions?',
        answer: 'Our AI analyzes historical sales data, customer behavior patterns, and market trends to recommend optimal pricing strategies and promotional timings. It continuously learns from the results to improve its recommendations.'
      },
      {
        question: 'What e-commerce platforms does this service integrate with?',
        answer: 'We currently integrate with Shopee and Lazada, with more platforms coming soon. Our API-based integration ensures seamless data synchronization and real-time analytics.'
      },
      {
        question: 'How do I know if a promotion is performing well?',
        answer: 'Our dashboard provides real-time performance metrics including sales velocity, conversion rates, and ROI comparisons. We also send alerts when promotions need attention or optimization.'
      }
    ]
  },
  {
    title: 'About Subscription',
    items: [
      {
        question: 'How do I get started with the platform?',
        answer: 'Simply sign up for a 14-day free trial, connect your e-commerce platforms, and start receiving AI-powered insights immediately. No credit card required for the trial.'
      },
      {
        question: 'What happens after my 14-day free trial ends?',
        answer: 'After the trial, you can choose from our flexible pricing plans. Your data and settings will be preserved, and you can continue seamlessly with your selected subscription.'
      },
      {
        question: 'How can I upgrade or change my plan?',
        answer: 'You can upgrade or change your plan at any time from your account settings. Changes take effect immediately, and we\'ll prorate any payments accordingly.'
      },
      {
        question: 'Can I cancel my subscription anytime?',
        answer: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access until the end of your current billing period.'
      }
    ]
  },
  {
    title: 'Others',
    items: [
      {
        question: 'How secure is my data on the platform?',
        answer: 'We use enterprise-grade encryption and security measures to protect your data. All information is stored in secure cloud infrastructure with regular backups and monitoring.'
      },
      {
        question: 'How do I contact support?',
        answer: 'Our support team is available via email, chat, and phone. Premium plans include priority support with dedicated response times.'
      }
    ]
  }
];

function FAQ() {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({});
  const { session, signOut } = useAuth();

  const toggleSection = (sectionTitle: string, questionIndex: number) => {
    const key = `${sectionTitle}-${questionIndex}`;
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key]
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

      {/* FAQ Content */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">FAQ'S</h1>
            <p className="text-xl text-primary-500">Find Solutions To Your Questions</p>
          </div>

          <div className="space-y-16">
            {faqData.map((section) => (
              <div key={section.title}>
                <h2 className="text-2xl font-bold text-gray-900 mb-8">{section.title}</h2>
                <div className="space-y-4">
                  {section.items.map((item, index) => {
                    const isOpen = openSections[`${section.title}-${index}`];
                    return (
                      <div
                        key={index}
                        className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
                      >
                        <button
                          onClick={() => toggleSection(section.title, index)}
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

export default FAQ;