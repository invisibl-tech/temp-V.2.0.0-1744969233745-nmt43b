import React from 'react';
import { Link } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import { useStripePortal } from '../hooks/useStripePortal';
import { format } from 'date-fns';
import { CreditCard, FileText, AlertCircle, ExternalLink, Rocket } from 'lucide-react';

export default function SubscriptionStatus() {
  const { subscription, loading, error } = useSubscription();
  const { redirectToPortal, loading: portalLoading, error: portalError } = useStripePortal();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600">
        Failed to load subscription status
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center mb-4">
          <Rocket className="h-6 w-6 text-primary-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Get Started with invisibl</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Subscribe to access our full suite of e-commerce analytics tools and start optimizing your business today.
        </p>
        <Link
          to="/pricing"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          View Plans
        </Link>
      </div>
    );
  }

  const planName = subscription.plan_id.includes('essential') 
    ? 'Essential'
    : subscription.plan_id.includes('advanced')
    ? 'Advanced'
    : 'Ultimate';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-gray-600">Current Plan: <span className="font-semibold">{planName}</span></p>
          <p className="text-gray-600">
            Next billing date: {format(new Date(subscription.current_period_end), 'MMMM d, yyyy')}
          </p>
        </div>
        {subscription.cancel_at && (
          <div className="text-red-600">
            Cancels on {format(new Date(subscription.cancel_at), 'MMMM d, yyyy')}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Payment Method */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
              <span className="font-medium text-gray-900">Payment</span>
            </div>
            <button
              onClick={redirectToPortal}
              disabled={portalLoading}
              className="text-primary-600 hover:text-primary-700 text-sm flex items-center"
            >
              Update
              <ExternalLink className="h-3 w-3 ml-1" />
            </button>
          </div>
          <p className="text-xs text-gray-500">Manage payment methods</p>
        </div>

        {/* Billing History */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <FileText className="h-4 w-4 text-gray-400 mr-2" />
              <span className="font-medium text-gray-900">Invoices</span>
            </div>
            <button
              onClick={redirectToPortal}
              disabled={portalLoading}
              className="text-primary-600 hover:text-primary-700 text-sm flex items-center"
            >
              View
              <ExternalLink className="h-3 w-3 ml-1" />
            </button>
          </div>
          <p className="text-xs text-gray-500">Access billing history</p>
        </div>

        {/* Plan Management */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
              <span className="font-medium text-gray-900">Plan</span>
            </div>
            <button
              onClick={redirectToPortal}
              disabled={portalLoading}
              className="text-primary-600 hover:text-primary-700 text-sm flex items-center"
            >
              Change
              <ExternalLink className="h-3 w-3 ml-1" />
            </button>
          </div>
          <p className="text-xs text-gray-500">Modify subscription</p>
        </div>
      </div>

      {portalError && (
        <div className="mt-4 text-sm text-red-600">
          {portalError}
        </div>
      )}
    </div>
  );
}