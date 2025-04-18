import { createClient } from 'npm:@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is missing');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user ID from auth token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Authentication failed');
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.platform) {
      throw new Error('Platform is required in request body');
    }

    const { platform } = body;

    // Get today's date at midnight UTC
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    // Generate mock metrics with realistic data
    const totalVisitors = Math.floor(Math.random() * 1000) + 500;
    const conversionRate = (Math.random() * 3) + 2;
    const orders = Math.floor(totalVisitors * (conversionRate / 100));
    const avgOrderValue = Math.floor(Math.random() * 1000) + 500;
    const sales = orders * avgOrderValue;
    const cogs = Math.floor(sales * 0.6); // 60% COGS
    const grossProfit = sales - cogs;

    // Create metrics object with all required fields
    const mockMetrics = {
      sales: sales,
      orders: orders,
      visitors: totalVisitors,
      conversion_rate: Number(conversionRate.toFixed(2)),
      average_order_value: avgOrderValue,
      cogs: cogs,
      gross_profit: grossProfit,
      product_type: 'Dresses',
      product_name: 'Summer Collection'
    };

    // Check if metrics already exist for today
    const { data: existingMetrics } = await supabase
      .from('platform_metrics')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .gte('timestamp', today.toISOString())
      .lt(new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle();

    let result;
    if (existingMetrics) {
      // Update existing metrics
      result = await supabase
        .from('platform_metrics')
        .update({
          metrics: mockMetrics,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingMetrics.id)
        .select()
        .single();
    } else {
      // Insert new metrics
      result = await supabase
        .from('platform_metrics')
        .insert({
          platform: platform,
          metrics: mockMetrics,
          timestamp: today.toISOString(),
          user_id: user.id
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Database error:', result.error);
      throw new Error(`Failed to store metrics: ${result.error.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          metrics: mockMetrics,
          timestamp: today.toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in ecommerce-sync:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error instanceof Error && 
          (error.message.includes('Authorization') || error.message.includes('Authentication'))
          ? 401 
          : 500,
      },
    )
  }
})