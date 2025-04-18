import { useEffect, useState } from 'react';
import { supabase } from '../App';

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_end: string;
  cancel_at: string | null;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSubscription() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          if (mounted) {
            setSubscription(null);
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (mounted) {
          setSubscription(data);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error loading subscription:', err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    loadSubscription();

    // Subscribe to realtime subscription updates
    const channel = supabase
      .channel('subscription_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subscriptions',
        filter: `status=eq.active`
      }, () => {
        loadSubscription();
      })
      .subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, []);

  return { 
    subscription, 
    loading, 
    error, 
    hasActiveSubscription: subscription?.status === 'active' 
  };
}