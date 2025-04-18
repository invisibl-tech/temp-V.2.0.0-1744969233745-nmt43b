import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    // Get all active subscriptions with user details
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        plan_id,
        status,
        current_period_end,
        cancel_at,
        created_at,
        users:user_id (
          email
        ),
        profiles:user_id (
          business_name
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Format the data for display
    const formattedData = data.map(sub => ({
      id: sub.id,
      email: sub.users?.email,
      businessName: sub.profiles?.business_name,
      planId: sub.plan_id,
      status: sub.status,
      currentPeriodEnd: sub.current_period_end,
      cancelAt: sub.cancel_at,
      createdAt: sub.created_at
    }));

    return new Response(
      JSON.stringify({ subscriptions: formattedData }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error checking subscriptions:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});