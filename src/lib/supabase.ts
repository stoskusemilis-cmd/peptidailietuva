import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://jgncnbmevixfvrcnistv.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnbmNuYm1ldml4ZnZyY25pc3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNjg1NjAsImV4cCI6MjA3NjY0NDU2MH0.3kD-DhTVdB8uStOqDk7-ArDfWMr3RzRW7X70CdgK3VM';

const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const isCorrectProjectUrl = (url: string | undefined): url is string =>
  !!url && url.includes('jgncnbmevixfvrcnistv.supabase.co');

const supabaseUrl = isCorrectProjectUrl(envUrl) ? envUrl : FALLBACK_SUPABASE_URL;
const supabaseAnonKey = isCorrectProjectUrl(envUrl) && envKey ? envKey : FALLBACK_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const FORCE_OUT_OF_STOCK_NAMES = new Set([
  'MOTS-C 40MG',
  'TESAMORELIN 10MG',
  'GLOW 70MG',
  'KLOW 80MG',
  'HGH 15IU',
  'HGH 24IU',
  'MASTERONE E 2000MG',
]);

const FORCE_OUT_OF_STOCK_SLUGS = new Set([
  'mots-c-40mg',
  'tesamorelin-10mg',
  'glow-70mg',
  'klow-80mg',
  'hgh-15iu',
  'hgh-24iu',
  'masterone-e-2000mg',
]);

export const isForcedOutOfStock = (product: { name?: string | null; slug?: string | null }): boolean => {
  const name = (product.name ?? '').trim().toUpperCase();
  const slug = (product.slug ?? '').trim().toLowerCase();
  return FORCE_OUT_OF_STOCK_NAMES.has(name) || FORCE_OUT_OF_STOCK_SLUGS.has(slug);
};

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
