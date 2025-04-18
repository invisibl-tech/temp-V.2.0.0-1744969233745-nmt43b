import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, MessageSquare, Phone, Mail, Instagram, Globe } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

type IssueCategory = 'general' | 'api' | 'file-management' | 'account' | 'billing' | 'other';

const issueCategories: { value: IssueCategory; label: string; description: string }[] = [
  {
    value: 'general',
    label: 'General Inquiry',
    description: 'General questions about the platform and its features'
  },
  {
    value: 'api',
    label: 'API Integration',
    description: 'Issues with API connections, data syncing, or platform integrations'
  },
  {
    value: 'file-management',
    label: 'File Management',
    description: 'Questions about uploading, managing, or processing files'
  },
  {
    value: 'account',
    label: 'Account & Settings',
    description: 'Account-related issues, profile settings, or user management'
  },
  {
    value: 'billing',
    label: 'Billing & Subscription',
    description: 'Questions about billing, subscriptions, or payments'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Any other questions or issues not covered above'
  }
];

function Contact() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messageForm, setMessageForm] = useState({
    name: '',
    email: '',
    category: 'general' as IssueCategory,
    subject: '',
    message: ''
  });

  const handleSignOut = async () => {
    window.location.href = '/auth';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-support-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: messageForm.category,
          subject: messageForm.subject,
          message: messageForm.message,
          userEmail: messageForm.email,
          businessName: messageForm.name
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message. Please try again later.');
      }

      setSuccess('Your message has been sent successfully. We will get back to you soon.');
      setMessageForm({
        name: '',
        email: '',
        category: 'general',
        subject: '',
        message: ''
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
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

      {/* Contact Content */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
            <p className="text-xl text-primary-500">Get in touch with our support team</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Methods */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Contact Methods</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <MessageSquare className="h-6 w-6 text-primary-500 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">LINE</h3>
                    <p className="text-gray-600 mt-1">@invisibl.co</p>
                    <p className="text-sm text-gray-500 mt-1">Available 8:00 - 22:00 (GMT+7)</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="h-6 w-6 text-primary-500 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">WhatsApp</h3>
                    <p className="text-gray-600 mt-1">+66 89 123 4567</p>
                    <p className="text-sm text-gray-500 mt-1">Available 8:00 - 22:00 (GMT+7)</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Mail className="h-6 w-6 text-primary-500 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">Email Support</h3>
                    <p className="text-gray-600 mt-1">help@invisibl.co</p>
                    <p className="text-sm text-gray-500 mt-1">Available 8:00 - 22:00 (GMT+7)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Send us a message</h2>
              {success && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
                  {success}
                </div>
              )}
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={messageForm.name}
                    onChange={(e) => setMessageForm({ ...messageForm, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Your name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={messageForm.email}
                    onChange={(e) => setMessageForm({ ...messageForm, email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Issue Category</label>
                  <select
                    value={messageForm.category}
                    onChange={(e) => setMessageForm({ ...messageForm, category: e.target.value as IssueCategory })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  >
                    {issueCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    {issueCategories.find(c => c.value === messageForm.category)?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <input
                    type="text"
                    value={messageForm.subject}
                    onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="What can we help you with?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    rows={4}
                    value={messageForm.message}
                    onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Describe your issue or question"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
            </div>
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

export default Contact;