import React, { useState, useEffect } from 'react';
import {
  Store,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../App';
import { tiktokApi } from '../utils/tiktokApi';

// Pre-mount parameter capture
if (
  typeof window !== 'undefined' &&
  window.location.search.includes('code=') &&
  window.location.search.includes('app_key=')
) {
  sessionStorage.setItem('tiktok_callback_params', window.location.search);
}

type ConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'expired'
  | 'connecting';

interface ConnectionError {
  code: string;
  message: string;
  timestamp: string;
}

interface PlatformMetrics {
  total_orders?: number;
  total_sales?: number;
  last_order_date?: string;
}

interface Platform {
  id: string;
  name: string;
  description: string;
  status: ConnectionStatus;
  lastSync?: string;
  lastError?: ConnectionError;
  metrics?: PlatformMetrics;
  config?: {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    shop_name?: string;
    store_id?: string;
    store_name?: string;
    region?: string;
    open_id?: string;
  };
  metadata?: {
    last_auth?: string;
    last_sync?: string;
    error_message?: string;
  };
}

function PlatformManagement() {
  const [platforms, setPlatforms] = useState<Platform[]>([
    {
      id: 'tiktok',
      name: 'TikTok Shop',
      description: 'Integrate your TikTok Shop to track sales and engagement.',
      status: 'disconnected',
    },
    {
      id: 'shopee',
      name: 'Shopee',
      description:
        'Connect your Shopee seller account to sync sales and inventory data.',
      status: 'disconnected',
    },
    {
      id: 'lazada',
      name: 'Lazada',
      description:
        'Connect your Lazada seller center to analyze performance metrics.',
      status: 'disconnected',
    },
  ]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    loadPlatformConnections();
  }, []);

  useEffect(() => {
    const handleTikTokCallback = async () => {
      try {
        // First try URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        
        // If URL params are missing, try sessionStorage
        const storedParams = sessionStorage.getItem('tiktok_callback_params');
        const params = urlParams.get('code') ? urlParams : storedParams ? 
          new URLSearchParams(storedParams) : null;

        if (!params) {
          console.log("ℹ️ No TikTok callback parameters found");
          return;
        }

        const code = params.get('code');
        const appKey = params.get('app_key');
        const shopRegion = params.get('shop_region');
        const state = params.get('state');

        if (!code || !appKey || !shopRegion || !state) {
          console.warn('❌ Missing required parameters');
          return;
        }

        console.log('✅ TikTok callback parameters:', {
          code: code.substring(0, 10) + '...',
          appKey,
          shopRegion,
          state,
          timestamp: new Date().toISOString(),
        });

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || state !== user.id) {
          console.warn('Invalid state or user not found');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error('No Supabase session');

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tiktok-auth`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              app_key: appKey,
              shop_region: shopRegion,
            }),
          }
        );

        const data = await response.json();
        console.log('✅ TikTok auth success:', data);

        // Clean up stored parameters
        sessionStorage.removeItem('tiktok_callback_params');
        
        // Clean up URL after successful processing
        window.history.replaceState({}, '', '/platform-management');

        await loadPlatformConnections();
      } catch (err) {
        console.error('❌ TikTok Auth Error:', err);
      }
    };

    handleTikTokCallback();
  }, []);

  const checkConnectionStatus = async (platform: Platform): Promise<ConnectionStatus> => {
    // 🚨 if status from DB is already active, and token is not expired
    if (platform.status === 'active') {
      if (platform.config?.expires_at && platform.config.expires_at > Date.now()) {
        return 'connected';
      }
      return 'expired';
    }

    if (platform.id === 'tiktok') {
      // ✅ Just rely on Supabase's stored status and expiry
      if (platform.config?.expires_at && platform.config.expires_at > Date.now()) {
        return 'connected';
      }
      return 'expired';
    }

    return platform.status;
  };

  const loadPlatformConnections = async () => {
    try {
      console.log('Loading platform connections...');
      const { data: connections, error: connectionsError } = await supabase
        .from('platform_connections')
        .select('*');

      if (connectionsError) {
        console.error('Error loading connections:', connectionsError);
        throw connectionsError;
      }

      console.log('Loaded connections:', connections);

      // Update platforms with connection data
      const updatedPlatforms = await Promise.all(
        platforms.map(async (platform) => {
          const connection = connections?.find(
            (c) => c.platform === platform.id
          );
          if (connection) {
            const status = await checkConnectionStatus({
              ...platform,
              config: connection.config,
            });

            return {
              ...platform,
              config: connection.config,
              lastSync: connection.last_sync_at,
              status,
              metadata: connection.metadata,
            };
          }
          return platform;
        })
      );

      setPlatforms(updatedPlatforms);
    } catch (err) {
      console.error('Error loading platform connections:', err);
      setError('Failed to load platform connections');
    }
  };

  const handleConnect = async (platformId: string) => {
    setLoading((prev) => ({ ...prev, [platformId]: true }));
    setError(null);

    try {
      if (platformId === 'tiktok') {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Not authenticated');
        }

        // Generate state for security
        const state = user.id;

        // Store state for callback verification
        sessionStorage.setItem('tiktok_oauth_state', state);

        // Generate dynamic redirect URI based on current location
        const redirectUri = `${window.location.origin}/platform-management`;
        sessionStorage.setItem('tiktok_redirect_uri', redirectUri);

        // Construct TikTok auth URL
        const authUrl =
          `https://auth.tiktok-shops.com/oauth/authorize/test?` +
          `app_key=${import.meta.env.VITE_TIKTOK_APP_KEY}&` +
          `state=${state}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `scope=${encodeURIComponent(
            'shop.read,product.read,promotion.read,order.read'
          )}`;

        console.log('Redirecting to TikTok auth URL:', authUrl);

        // Redirect to TikTok auth page
        window.location.href = authUrl;
        return;
      }

      // Handle other platforms...
      setError('Platform connection not implemented yet');
    } catch (err: any) {
      console.error(`Error connecting to ${platformId}:`, err);
      setError(err.message || `Failed to connect to ${platformId}`);
    } finally {
      setLoading((prev) => ({ ...prev, [platformId]: false }));
    }
  };

  const syncPlatformData = async (platformId: string) => {
    setSyncLoading(true);
    setError(null);

    try {
      if (platformId === 'tiktok') {
        // Get shop info to verify connection
        const shopInfo = await tiktokApi.getShopInfo();
        console.log('TikTok Shop Info:', shopInfo);

        // Get recent orders
        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

        const orders = await tiktokApi.getOrders({
          start_time: thirtyDaysAgo.toISOString(),
          end_time: new Date().toISOString(),
        });
        console.log('TikTok Orders:', orders);

        // Get analytics
        const analytics = await tiktokApi.getAnalytics({
          start_date: thirtyDaysAgo.toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          metrics: ['page_views', 'orders', 'sales'],
        });
        console.log('TikTok Analytics:', analytics);

        // Update last sync time
        const { error: updateError } = await supabase
          .from('platform_connections')
          .update({
            last_sync_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: {
              last_sync: new Date().toISOString(),
              sync_details: {
                orders_count: orders.length,
                analytics: analytics,
              },
            },
          })
          .eq('platform', 'tiktok');

        if (updateError) {
          throw updateError;
        }

        // Reload connections to get updated sync time
        await loadPlatformConnections();
      } else {
        // Handle other platforms
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ecommerce-sync`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${
                (
                  await supabase.auth.getSession()
                ).data.session?.access_token
              }`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ platform: platformId }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Failed to sync ${platformId} data`
          );
        }
      }
    } catch (err: any) {
      console.error(`Error syncing ${platformId} data:`, err);
      setError(err.message || `Failed to sync ${platformId} data`);

      // Update connection status to error
      const { error: updateError } = await supabase
        .from('platform_connections')
        .update({
          status: 'error',
          metadata: {
            error_message: err.message,
            error_timestamp: new Date().toISOString(),
          },
        })
        .eq('platform', platformId);

      if (updateError) {
        console.error('Failed to update connection status:', updateError);
      }
    } finally {
      setSyncLoading(false);
    }
  };

  const getConnectionStatusDetails = (platform: Platform) => {
    switch (platform.status) {
      case 'connected':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
          label: 'Connected',
          description: platform.lastSync
            ? `Last synced ${new Date(platform.lastSync).toLocaleDateString()}`
            : 'No sync yet',
        };
      case 'disconnected':
        return {
          icon: <XCircle className="w-5 h-5 text-gray-400" />,
          label: 'Not Connected',
          description: 'Click to connect',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
          label: 'Connection Error',
          description: platform.metadata?.error_message || 'Unknown error',
        };
      case 'expired':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
          label: 'Authorization Expired',
          description: 'Click to reauthorize',
        };
      case 'connecting':
        return {
          icon: <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />,
          label: 'Connecting',
          description: 'Please wait...',
        };
      default:
        return {
          icon: <AlertCircle className="w-5 h-5 text-gray-400" />,
          label: 'Unknown Status',
          description: 'Click to check status',
        };
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Platform Management
            </h2>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle
                    className="h-5 w-5 text-red-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {platforms.map((platform) => {
              const statusDetails = getConnectionStatusDetails(platform);

              return (
                <div
                  key={platform.id}
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Store
                        className="h-8 w-8 text-gray-600"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="focus:outline-none">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {platform.name}
                          </p>
                          <div className="flex items-center space-x-2">
                            {statusDetails.icon}
                            <span className="text-sm text-gray-500">
                              {statusDetails.label}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {platform.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Connection details */}
                  {platform.status === 'connected' && platform.config && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="text-sm">
                        <p className="text-gray-500">
                          Store: {platform.config.store_name}
                        </p>
                        {platform.metadata?.last_sync && (
                          <p className="text-gray-500">
                            Last sync:{' '}
                            {new Date(platform.metadata.last_sync).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status description */}
                  <p className="text-xs text-gray-500 mt-2">
                    {statusDetails.description}
                  </p>

                  {/* Action buttons */}
                  <div className="mt-4 flex justify-end space-x-3">
                    {platform.status === 'connected' && (
                      <button
                        onClick={() => syncPlatformData(platform.id)}
                        disabled={syncLoading}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <RefreshCw
                          className={`h-4 w-4 mr-1.5 ${
                            syncLoading ? 'animate-spin' : ''
                          }`}
                        />
                        Sync Data
                      </button>
                    )}

                    <button
                      onClick={() => handleConnect(platform.id)}
                      disabled={
                        loading[platform.id] || platform.status === 'connecting'
                      }
                      className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white
                        ${
                          platform.status === 'connected'
                            ? 'bg-gray-600 hover:bg-gray-700'
                            : 'bg-primary-600 hover:bg-primary-700'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                    >
                      {loading[platform.id] ? (
                        <RefreshCw className="animate-spin h-4 w-4 mr-1.5" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-1.5" />
                      )}
                      {platform.status === 'connected'
                        ? 'Reconnect'
                        : 'Connect'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default PlatformManagement;