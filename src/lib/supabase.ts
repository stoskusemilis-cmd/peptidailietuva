import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface PriceTier {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  description_en: string;
  description_ru: string;
  full_description: string;
  full_description_en: string;
  full_description_ru: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  price_tiers?: PriceTier[];
}

export interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  total_amount: number;
  crypto_amount: number | null;
  wallet_address: string | null;
  transaction_signature: string | null;
  status: string;
  shipping_address: any;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedTierQuantity?: number;
}

export interface ParcelLocker {
  id: string;
  provider: 'DPD' | 'LP Express' | 'Omniva';
  city: string;
  address: string;
  locker_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
