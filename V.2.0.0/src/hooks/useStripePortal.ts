import { useState } from 'react';
import { supabase } from '../App';

export function useStripePortal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectToPortal = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current subscription to get customer ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!subscription?.stripe_customer_id) {
        throw new Error('No active subscription found');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          customerId: subscription.stripe_customer_id,
          returnUrl: `${window.location.origin}/settings`
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create portal session');
      }

      const { url } = await response.json();
      
      if (!url) {
        throw new Error('No portal URL returned');
      }

      // Redirect to the portal
      window.location.href = url;
    } catch (err: any) {
      console.error('Portal redirect error:', err);
      setError(err.message || 'Failed to redirect to customer portal');
    } finally {
      setLoading(false);
    }
  };

  return {
    redirectToPortal,
    loading,
    error
  };
}