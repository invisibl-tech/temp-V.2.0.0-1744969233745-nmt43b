import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'npm:stripe@14.18.0';
import { createClient } from 'npm:@supabase/supabase-js';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
});

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('No Stripe signature in request headers');
      throw new Error('No Stripe signature found');
    }

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('Webhook secret not found in environment variables');
      throw new Error('Stripe webhook secret not configured');
    }

    // Get the raw body as text
    const rawBody = await req.text();
    
    // Split the signature header
    const signatureParts = signature.split(',');
    const timestampPart = signatureParts[0].split('=')[1];
    const signaturesPart = signatureParts[1].split('=')[1];

    // Manual signature verification
    const encoder = new TextEncoder();
    const payload = `${timestampPart}.${rawBody}`;
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const computedSignature = Array.from(new Uint8Array(signed))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (computedSignature !== signaturesPart) {
      throw new Error('Invalid signature');
    }

    // Parse the event
    const event = JSON.parse(rawBody);
    console.log('Processing webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Processing completed checkout session:', session.id);

        if (!session.subscription) {
          console.log('No subscription in session, skipping');
          break;
        }

        // Fetch the subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const userId = subscription.metadata.supabaseUserId || session.metadata?.supabaseUserId;
        
        if (!userId) {
          console.error('No supabaseUserId found in metadata');
          throw new Error('No user ID found in subscription metadata');
        }

        console.log('Upserting subscription data:', {
          id: subscription.id,
          userId: userId,
          status: subscription.status,
          priceId: subscription.items.data[0].price.id
        });

        const { error: upsertError } = await supabase
          .from('subscriptions')
          .upsert({
            stripe_subscription_id: subscription.id,
            user_id: userId,
            stripe_customer_id: subscription.customer as string,
            plan_id: subscription.items.data[0].price.id,
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at: subscription.cancel_at 
              ? new Date(subscription.cancel_at * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'stripe_subscription_id'
          });

        if (upsertError) {
          console.error('Failed to upsert subscription:', upsertError);
          throw upsertError;
        }

        console.log('Successfully recorded subscription');
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Processing subscription update:', subscription.id);

        const userId = subscription.metadata.supabaseUserId;
        if (!userId) {
          console.error('No supabaseUserId found in metadata');
          throw new Error('No user ID found in subscription metadata');
        }

        const { error: updateError } = await supabase
          .from('subscriptions')
          .upsert({
            stripe_subscription_id: subscription.id,
            user_id: userId,
            stripe_customer_id: subscription.customer as string,
            plan_id: subscription.items.data[0].price.id,
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at: subscription.cancel_at 
              ? new Date(subscription.cancel_at * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'stripe_subscription_id'
          });

        if (updateError) {
          console.error('Failed to update subscription:', updateError);
          throw updateError;
        }

        console.log('Successfully updated subscription');
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Processing subscription deletion:', subscription.id);

        const { error: deleteError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            cancel_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);

        if (deleteError) {
          console.error('Failed to mark subscription as canceled:', deleteError);
          throw deleteError;
        }

        console.log('Successfully marked subscription as canceled');
        break;
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});