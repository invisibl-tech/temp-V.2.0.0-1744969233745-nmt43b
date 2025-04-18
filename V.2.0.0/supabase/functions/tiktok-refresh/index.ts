import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const TIKTOK_API_URL = 'https://open-api.tiktokglobal.com';
const APP_KEY = Deno.env.get('TIKTOK_APP_KEY') ?? '';
const APP_SECRET = Deno.env.get('TIKTOK_APP_SECRET') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  console.log("🔄 TikTok Refresh Function Triggered", {
    timestamp: new Date().toISOString(),
    method: req.method
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { refresh_token } = await req.json();
    console.log("📥 Refresh request received:", { hasRefreshToken: !!refresh_token });

    if (!refresh_token) {
      throw new Error('Refresh token is required');
    }

    // Request new access token
    console.log("🔄 Requesting new access token...");
    const response = await fetch(`${TIKTOK_API_URL}/oauth/refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_key: APP_KEY,
        app_secret: APP_SECRET,
        refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      console.error("❌ Token refresh failed:", {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    console.log("📦 Token refresh response:", {
      success: !data.error,
      hasData: !!data.access_token
    });
    
    if (data.error) {
      throw new Error(data.error_description || 'Failed to refresh token');
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

    // Update the platform connection with new tokens
    console.log("💾 Updating platform connection...");
    const { error: updateError } = await supabase
      .from('platform_connections')
      .update({
        config: {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in,
          expires_at: Date.now() + (data.expires_in * 1000)
        },
        updated_at: new Date().toISOString(),
        metadata: {
          last_refresh: new Date().toISOString()
        }
      })
      .eq('platform', 'tiktok')
      .eq('config->refresh_token', refresh_token);

    if (updateError) {
      console.error("❌ Failed to update connection:", updateError);
      throw updateError;
    }

    console.log("✅ Platform connection updated successfully");

    return new Response(
      JSON.stringify({ 
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error refreshing token:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});