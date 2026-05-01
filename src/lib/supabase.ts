import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://ghupwlhgageynpdegxkf.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdodXB3bGhnYWdleW5wZGVneGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNzQ4MzksImV4cCI6MjA4ODg1MDgzOX0.s5ps1n2QCKytlWfFvqET8ORwtABhGFiP2RFNmiUj7WA';

const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const isCorrectProjectUrl = (url: string | undefined): url is string =>
  !!url && url.includes('ghupwlhgageynpdegxkf.supabase.co');

const supabaseUrl = isCorrectProjectUrl(envUrl) ? envUrl : FALLBACK_SUPABASE_URL;
const supabaseAnonKey = isCorrectProjectUrl(envUrl) && envKey ? envKey : FALLBACK_SUPABASE_ANON_KEY;

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
