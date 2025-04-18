import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../App';

// Initialize Stripe with error handling
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY).catch(error => {
  console.error('Failed to initialize Stripe:', error);
  return null;
});

export function useStripeSubscription() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribe = async (priceId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Validate Stripe initialization
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Failed to initialize Stripe. Please check your configuration.');
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Please sign in to subscribe');
      }

      if (!priceId) {
        throw new Error('Invalid price ID');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          customerEmail: user.email,
          successUrl: `${window.location.origin}/dashboard`,
          cancelUrl: `${window.location.origin}/pricing`
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Checkout session creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: responseData
        });
        throw new Error(responseData.error || `Failed to create checkout session: ${response.statusText}`);
      }

      const { sessionId } = responseData;
      
      if (!sessionId) {
        throw new Error('No session ID returned from the server');
      }

      const { error: redirectError } = await stripe.redirectToCheckout({ sessionId });
      
      if (redirectError) {
        console.error('Stripe redirect error:', redirectError);
        throw redirectError;
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.message || 'Failed to start subscription process');
    } finally {
      setLoading(false);
    }
  };

  return {
    subscribe,
    loading,
    error
  };
}