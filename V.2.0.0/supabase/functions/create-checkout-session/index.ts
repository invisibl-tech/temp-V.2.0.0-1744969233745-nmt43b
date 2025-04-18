import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'npm:stripe@14.18.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  typescript: true,
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    // Parse and validate request body
    const { priceId, userId, customerEmail, successUrl, cancelUrl } = await req.json();

    if (!priceId || !userId || !customerEmail) {
      throw new Error('Missing required fields: priceId, userId, or customerEmail');
    }

    console.log('Creating checkout session with:', { 
      priceId, 
      userId, 
      customerEmail,
      successUrl,
      cancelUrl
    });

    // Validate the price ID exists
    try {
      const price = await stripe.prices.retrieve(priceId);
      if (!price.active) {
        throw new Error('Price is not active');
      }
    } catch (error) {
      console.error('Error validating price:', error);
      throw new Error('Invalid or inactive price ID');
    }

    // Create or retrieve the customer
    let customer;
    try {
      const customers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      });
      
      if (customers.data.length > 0) {
        customer = customers.data[0];
        console.log('Found existing customer:', customer.id);
      } else {
        customer = await stripe.customers.create({
          email: customerEmail,
          metadata: {
            supabaseUserId: userId,
          },
        });
        console.log('Created new customer:', customer.id);
      }
    } catch (error) {
      console.error('Error managing customer:', error);
      throw new Error('Failed to create or retrieve customer');
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${req.headers.get('origin')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/pricing`,
      subscription_data: {
        metadata: {
          supabaseUserId: userId,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    console.log('Created checkout session:', session.id);

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});