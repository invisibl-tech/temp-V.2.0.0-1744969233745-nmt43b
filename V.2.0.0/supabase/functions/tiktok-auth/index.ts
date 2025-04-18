import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

// Update API URL to match TikTok Shop documentation
const TIKTOK_API_URL = 'https://open-api.tiktokglobal.com/oauth/token/app';
const APP_KEY = Deno.env.get('TIKTOK_APP_KEY') ?? '';
const APP_SECRET = Deno.env.get('TIKTOK_APP_SECRET') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log("🔥 TikTok Auth Function Triggered");

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { code, app_key, shop_region } = body;

    console.log("🌐 TikTok OAuth Request:", {
      hasCode: !!code,
      hasAppKey: !!app_key,
      hasShopRegion: !!shop_region,
      code: code?.substring(0, 10) + '...',
      timestamp: new Date().toISOString()
    });

    if (!code || !app_key || !shop_region) {
      throw new Error('Missing required parameters');
    }

    // Exchange code for access token
    console.log("🔄 Exchanging code for access token...");

    // Generate timestamp
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    // Create request body
    const requestBody = {
      app_id: APP_KEY,
      app_secret: APP_SECRET,
      auth_code: code,
      grant_type: 'authorization_code'
    };

    // Log request details for debugging
    console.log("Request details:", {
      url: TIKTOK_API_URL,
      app_id: APP_KEY,
      auth_code: code?.substring(0, 10) + '...',
      timestamp
    });

    const response = await fetch(TIKTOK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log("Raw response:", responseText);

    if (!response.ok) {
      console.error("❌ Token exchange failed:", {
        status: response.status,
        statusText: response.statusText,
        response: responseText
      });
      throw new Error(`Failed to exchange code for token: ${response.statusText}`);
    }

    const data = JSON.parse(responseText);
    console.log("📦 Token response:", {
      success: data.code === 0,
      hasData: !!data.data,
      message: data.message,
      timestamp: new Date().toISOString()
    });

    if (data.code !== 0 || !data.data) {
      throw new Error(data.message || 'Invalid token response');
    }

    // Initialize Supabase client
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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Store connection in database
    console.log("💾 Storing platform connection...");

    const connectionData = {
      user_id: user.id,
      platform: 'tiktok',
      config: {
        access_token: data.data.access_token,
        refresh_token: data.data.refresh_token,
        expires_in: data.data.expires_in,
        expires_at: Date.now() + (data.data.expires_in * 1000),
        store_id: data.data.open_id,
        store_name: data.data.seller_name || 'TikTok Shop',
        region: shop_region,
        open_id: data.data.open_id
      },
      status: 'active',
      metadata: {
        last_auth: new Date().toISOString(),
        shop_info: {
          seller_name: data.data.seller_name || 'TikTok Shop',
          seller_base_region: shop_region,
          open_id: data.data.open_id
        }
      },
      updated_at: new Date().toISOString()
    };

    console.log("Connection data:", {
      userId: user.id,
      platform: 'tiktok',
      hasConfig: !!connectionData.config,
      timestamp: new Date().toISOString()
    });

    const { error: connectionError } = await supabase
      .from('platform_connections')
      .upsert(connectionData, {
        onConflict: 'user_id,platform'
      });

    if (connectionError) {
      console.error("❌ Failed to store connection:", connectionError);
      throw connectionError;
    }

    console.log("✅ TikTok connection completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          token: {
            expires_at: Date.now() + (data.data.expires_in * 1000),
            open_id: data.data.open_id
          },
          shop: {
            seller_name: data.data.seller_name || 'TikTok Shop',
            seller_base_region: shop_region
          }
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error("❌ TikTok auth error:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});