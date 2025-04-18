export interface TikTokShopConfig {
  access_token: string;
  refresh_token: string;
  app_key: string;
  app_secret: string;
  expires_in: number;
  store_id: string;
  store_name: string;
  region: string;
  expires_at: number;
}

export interface TikTokMetrics {
  sales: number;
  orders: number;
  visitors: number;
  conversion_rate: number;
  average_order_value: number;
  product_views: number;
  add_to_cart: number;
  timestamp: string;
}

export interface TikTokProduct {
  id: string;
  name: string;
  sku_id: string;
  price: number;
  stock: number;
  sales: number;
  category: string;
  create_time: string;
}

export interface TikTokOrder {
  order_id: string;
  order_status: string;
  payment_method: string;
  create_time: string;
  paid_time: string;
  buyer: {
    user_id: string;
    user_name: string;
  };
  items: {
    product_id: string;
    sku_id: string;
    quantity: number;
    price: number;
  }[];
  total_amount: number;
  currency: string;
}