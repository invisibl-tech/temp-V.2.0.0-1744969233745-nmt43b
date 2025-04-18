import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { MessageSquare, Phone, Mail, AlertCircle, Check } from 'lucide-react';
import { supabase } from '../App';

interface UserProfile {
  business_name: string | null;
  email: string | null;
}

interface SupportTicket {
  ticket_id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
}

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

function Help() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    business_name: null,
    email: null
  });
  const [messageForm, setMessageForm] = useState({
    category: 'general' as IssueCategory,
    subject: '',
    message: ''
  });
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    loadUserProfile();
    loadTickets();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('business_name')
          .eq('id', user.id)
          .single();

        setUserProfile({
          business_name: profile?.business_name || null,
          email: user.email
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadTickets = async () => {
    try {
      const { data: tickets, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(tickets || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
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
          userEmail: userProfile.email,
          businessName: userProfile.business_name
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message. Please try again later.');
      }

      setSuccess(data.message || 'Your message has been sent successfully. We will get back to you soon.');
      setMessageForm({ category: 'general', subject: '', message: '' });
      loadTickets(); // Reload tickets after successful submission
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Help & Support</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Methods */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Contact Us</h2>
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

          {/* Email Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Send us a message</h2>
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                <p className="text-green-700">{success}</p>
              </div>
            )}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Your Info</label>
                <input
                  type="text"
                  value={`${userProfile.business_name || 'Loading...'} (${userProfile.email || 'Loading...'})`}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-primary-500 focus:ring-primary-500"
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

        {/* Support Tickets History */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Support Tickets</h2>
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <tr key={ticket.ticket_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ticket.ticket_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ticket.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(ticket.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {tickets.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        No support tickets found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Help;