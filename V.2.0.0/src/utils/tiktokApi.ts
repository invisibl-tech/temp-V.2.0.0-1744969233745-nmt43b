import { supabase } from '../App';
import type { TikTokShopConfig } from '../types/tiktok';
import HmacSHA256 from 'crypto-js/hmac-sha256';
import Base64 from 'crypto-js/enc-base64';

const TIKTOK_API_URL = 'https://open-api.tiktokglobal.com';
const APP_KEY = import.meta.env.VITE_TIKTOK_APP_KEY;
const APP_SECRET = import.meta.env.VITE_TIKTOK_APP_SECRET;

export class TikTokApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'TikTokApiError';
  }
}

function generateSignature(path: string, params: Record<string, string>, body?: any): string {
  // Sort parameters alphabetically, excluding access_token and sign
  const sortedParams = Object.keys(params)
    .filter(key => !['access_token', 'sign'].includes(key))
    .sort()
    .map(key => ({ key, value: params[key] }));

  // Create parameter string
  const paramString = sortedParams
    .map(({ key, value }) => `${key}${value}`)
    .join('');

  // Create signature string
  let signString = `${path}${paramString}`;

  // Add body to signature if present
  if (body && Object.keys(body).length > 0) {
    signString += JSON.stringify(body);
  }

  // Add app secret to start and end
  signString = `${APP_SECRET}${signString}${APP_SECRET}`;

  // Generate HMAC-SHA256
  return HmacSHA256(signString, APP_SECRET).toString(Base64);
}

async function refreshToken(config: TikTokShopConfig): Promise<TikTokShopConfig> {
  try {
    console.log("🔄 Refreshing TikTok token...");

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tiktok-refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        refresh_token: config.refresh_token,
        user_id: user.id
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

    // Update connection with new tokens
    const { error: updateError } = await supabase
      .from('platform_connections')
      .update({
        config: {
          ...config,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in,
          expires_at: Date.now() + (data.expires_in * 1000)
        },
        status: 'active',
        updated_at: new Date().toISOString(),
        metadata: {
          last_refresh: new Date().toISOString()
        }
      })
      .eq('platform', 'tiktok')
      .eq('user_id', user.id);

    if (updateError) {
      console.error("❌ Failed to update connection:", updateError);
      throw updateError;
    }

    console.log("✅ Platform connection updated");

    return {
      ...config,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      expires_at: Date.now() + (data.expires_in * 1000)
    };
  } catch (error) {
    console.error("❌ Token refresh error:", error);
    throw new TikTokApiError('Failed to refresh access token');
  }
}

async function callTikTokApi(endpoint: string, options: {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  params?: Record<string, string>;
} = {}) {
  try {
    console.log("🔄 API call started:", {
      endpoint,
      method: options.method || 'GET',
      hasBody: !!options.body,
      hasParams: !!options.params,
      timestamp: new Date().toISOString()
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("❌ User not authenticated");
      throw new TikTokApiError('User not authenticated');
    }

    const { data: connection, error: connectionError } = await supabase
      .from('platform_connections')
      .select('config, status')
      .eq('user_id', user.id)
      .eq('platform', 'tiktok')
      .single();

    if (connectionError || !connection) {
      console.error("❌ TikTok connection not found:", connectionError);
      throw new TikTokApiError('TikTok Shop not connected');
    }

    if (connection.status === 'error') {
      console.error("❌ TikTok connection is in error state");
      throw new TikTokApiError('TikTok connection is in error state');
    }

    let config = connection.config as TikTokShopConfig;

    // Check if token needs refresh
    const needsRefresh = Date.now() >= config.expires_at - 300000; // 5 minutes buffer
    if (needsRefresh) {
      console.log("🔄 Token needs refresh");
      config = await refreshToken(config);
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params = {
      app_key: APP_KEY,
      timestamp,
      access_token: config.access_token,
      ...options.params
    };

    const signature = generateSignature(endpoint, params, options.body);
    const queryParams = new URLSearchParams({
      ...params,
      sign: signature
    });

    const url = `${TIKTOK_API_URL}${endpoint}?${queryParams}`;
    
    console.log("📤 Making API request:", {
      url: url.replace(config.access_token, '[redacted]'),
      method: options.method || 'GET',
      hasBody: !!options.body
    });

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-tts-access-token': config.access_token,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    console.log("📥 API response status:", response.status);

    const data = await response.json();
    console.log("📦 API response:", {
      code: data.code,
      message: data.message,
      hasData: !!data.data
    });

    if (!response.ok || data.code !== 0) {
      // Update connection status if there's an error
      await supabase
        .from('platform_connections')
        .update({
          status: 'error',
          metadata: {
            last_error: {
              code: data.code,
              message: data.message,
              timestamp: new Date().toISOString()
            }
          },
          updated_at: new Date().toISOString()
        })
        .eq('platform', 'tiktok')
        .eq('user_id', user.id);

      throw new TikTokApiError(
        data.message || 'API request failed',
        response.status,
        data.code
      );
    }

    return data.data;
  } catch (error) {
    console.error("❌ API call failed:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    if (error instanceof TikTokApiError) {
      throw error;
    }
    throw new TikTokApiError('Failed to call TikTok API');
  }
}

export const tiktokApi = {
  async getShopInfo() {
    return callTikTokApi('/authorization/202309/shops');
  },

  async getOrders(params: {
    start_time: string;
    end_time: string;
    order_status?: string;
    page_size?: number;
    page_number?: number;
  }) {
    return callTikTokApi('/orders/search', {
      method: 'POST',
      body: {
        page_size: params.page_size || 100,
        page_number: params.page_number || 1,
        start_time: params.start_time,
        end_time: params.end_time,
        order_status: params.order_status
      }
    });
  },

  async getAnalytics(params: {
    start_date: string;
    end_date: string;
    metrics: string[];
  }) {
    return callTikTokApi('/analytics/shop/stats', {
      method: 'POST',
      body: {
        start_date: params.start_date,
        end_date: params.end_date,
        metrics: params.metrics
      }
    });
  },

  async syncData(startDate: string, endDate: string) {
    try {
      console.log("🔄 Starting data sync...");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new TikTokApiError('User not authenticated');
      }

      const shopInfo = await this.getShopInfo();
      console.log("📦 Shop info retrieved:", {
        hasData: !!shopInfo,
        timestamp: new Date().toISOString()
      });

      const orders = await this.getOrders({
        start_time: startDate,
        end_time: endDate
      });

      const analytics = await this.getAnalytics({
        start_date: startDate.split('T')[0],
        end_date: endDate.split('T')[0],
        metrics: ['page_views', 'orders', 'sales']
      });

      console.log("💾 Storing metrics...");
      const { error: metricsError } = await supabase
        .from('platform_metrics')
        .insert(orders.map((order: any) => ({
          platform: 'tiktok',
          metrics: {
            order_id: order.order_id,
            sales: order.total_amount,
            quantity: order.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
            status: order.order_status,
            created_at: order.create_time
          },
          timestamp: new Date(order.create_time).toISOString(),
          user_id: user.id
        })));

      if (metricsError) {
        console.error("❌ Failed to store metrics:", metricsError);
        throw new Error('Failed to store metrics');
      }

      console.log("📅 Updating last sync time...");
      const { error: updateError } = await supabase
        .from('platform_connections')
        .update({
          last_sync_at: new Date().toISOString(),
          status: 'active',
          updated_at: new Date().toISOString(),
          metadata: {
            last_sync: new Date().toISOString(),
            sync_details: {
              orders_count: orders.length,
              analytics: analytics
            }
          }
        })
        .eq('platform', 'tiktok')
        .eq('user_id', user.id);

      if (updateError) {
        console.error("❌ Failed to update sync time:", updateError);
        throw updateError;
      }

      console.log("✅ Data sync completed successfully");

      return {
        success: true,
        orders: orders.length,
        analytics: analytics
      };
    } catch (error) {
      console.error("❌ Data sync failed:", error);
      throw error;
    }
  }
};