import { X, CheckCircle, Loader, Copy, Wallet, ChevronDown, ChevronUp, Clock, RefreshCw, Tag, Check } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useState, useEffect, useRef } from 'react';
import { supabase, ParcelLocker } from '../lib/supabase';

interface CheckoutProps {
  onClose: () => void;
}

const SOLANA_ADDRESS = 'A8CDFpdaLuzfZWDX2xbCXf8nXSJpz3K5urqTPGL126ai';

type PaymentMethod = 'swaps' | 'paybis' | 'phantom' | 'trust' | 'revolut' | null;
type Step = 'info' | 'payment' | 'pending' | 'success';

export function Checkout({ onClose }: CheckoutProps) {
  const { cart, getTotalPrice, clearCart } = useCart();
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>('info');
  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [solPrice, setSolPrice] = useState<number>(150);
  const [copySuccess, setCopySuccess] = useState<'address' | 'sol' | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(null);
  const [expandedGuide, setExpandedGuide] = useState<PaymentMethod>(null);
  const [snapshotCart, setSnapshotCart] = useState(cart);
  const [snapshotTotalEur, setSnapshotTotalEur] = useState(0);
  const [snapshotShippingFee, setSnapshotShippingFee] = useState(0);
  const [snapshotSolAmount, setSnapshotSolAmount] = useState('0');
  const [snapshotSelectedLocker, setSnapshotSelectedLocker] = useState<import('../lib/supabase').ParcelLocker | undefined>(undefined);
  const [snapshotPaymentMethod, setSnapshotPaymentMethod] = useState<PaymentMethod>(null);
  const [orderId, setOrderId] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentChecking, setPaymentChecking] = useState(false);
  const [nextCheckIn, setNextCheckIn] = useState(60);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittingRef = useRef(false);
  const paymentConfirmedRef = useRef(false);

  const [cities, setCities] = useState<string[]>([]);
  const [parcelLockers, setParcelLockers] = useState<ParcelLocker[]>([]);
  const [filteredLockers, setFilteredLockers] = useState<ParcelLocker[]>([]);

  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number; commission: number } | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);
  const [snapshotDiscount, setSnapshotDiscount] = useState<{ code: string; percent: number; commission: number; amount: number } | null>(null);

  const [formData, setFormData] = useState({
    phone: '',
    city: '',
    parcelLocker: '',
  });

  const [lockedSolPrice, setLockedSolPrice] = useState<number | null>(null);
  const [uniqueSolOffset, setUniqueSolOffset] = useState<number>(0);

  const SHIPPING_FEE_EUR = 3.5;
  const FREE_SHIPPING_THRESHOLD = 50;
  const totalEur = getTotalPrice();
  const discountAmount = appliedDiscount ? parseFloat((totalEur * appliedDiscount.percent / 100).toFixed(2)) : 0;
  const discountedTotal = totalEur - discountAmount;
  const shippingFee = discountedTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE_EUR;
  const totalEurWithFee = discountedTotal + shippingFee;
  const activeSolPrice = lockedSolPrice ?? solPrice;
  const baseSolAmount = parseFloat((totalEurWithFee / activeSolPrice).toFixed(4));
  const solAmount = (baseSolAmount + uniqueSolOffset).toFixed(4);

  useEffect(() => {
    let active = true;
    const fetchAndSet = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=eur');
        const data = await res.json();
        if (active && data.solana?.eur) setSolPrice(data.solana.eur);
      } catch {}
    };
    fetchCitiesAndLockers();
    fetchAndSet();
    const interval = setInterval(fetchAndSet, 60000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (formData.city) {
      setFilteredLockers(parcelLockers.filter(l => l.city === formData.city));
    } else {
      setFilteredLockers([]);
    }
  }, [formData.city, parcelLockers]);

  useEffect(() => {
    if (!orderId || !snapshotSolAmount) return;

    let cancelled = false;

    const checkPayment = async () => {
      if (cancelled) return;
      setPaymentChecking(true);
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const res = await fetch(`${supabaseUrl}/functions/v1/verify-solana-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ order_id: orderId }),
        });
        const data = await res.json();
        if (!cancelled && data.confirmed) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
          paymentConfirmedRef.current = true;
          setPaymentConfirmed(true);
          setStep('success');
        }
      } catch {}
      if (!cancelled) setPaymentChecking(false);
    };

    checkPayment();

    countdownRef.current = setInterval(() => {
      setNextCheckIn(prev => {
        if (prev <= 1) return 60;
        return prev - 1;
      });
    }, 1000);

    pollIntervalRef.current = setInterval(() => {
      setNextCheckIn(60);
      checkPayment();
    }, 60000);

    return () => {
      cancelled = true;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [orderId, snapshotSolAmount]);

  const copyToClipboard = async (text: string, type: 'address' | 'sol') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch {}
  };

  const fetchCitiesAndLockers = async () => {
    try {
      const { data, error } = await supabase
        .from('parcel_lockers')
        .select('*')
        .eq('is_active', true)
        .in('provider', ['Omniva', 'LP Express'])
        .order('city')
        .order('provider')
        .order('address');
      if (error) throw error;
      setParcelLockers(data || []);
      setCities([...new Set(data?.map(l => l.city) || [])]);
    } catch {}
  };

  const handleApplyDiscount = async () => {
    if (!discountCodeInput.trim()) return;
    setDiscountError('');
    setDiscountLoading(true);
    const upperCode = discountCodeInput.trim().toUpperCase();
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('code, discount_percent, referral_commission_percent, is_active')
        .eq('code', upperCode)
        .maybeSingle();

      if (error) throw error;
      if (!data || !data.is_active) {
        setDiscountError(t('checkoutDiscountError'));
        setAppliedDiscount(null);
      } else {
        setAppliedDiscount({ code: data.code, percent: data.discount_percent, commission: data.referral_commission_percent ?? 0 });
        setDiscountCodeInput('');
      }
    } catch {
      setDiscountError(t('checkoutCodeError'));
    } finally {
      setDiscountLoading(false);
    }
  };

  const sanitizeInput = (value: string): string => {
    return value.replace(/[<>"'`]/g, '').slice(0, 200);
  };

  const validatePhone = (phone: string): boolean => {
    return /^[\d\s\+\-\(\)]{6,20}$/.test(phone.trim());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const sanitized = name === 'phone' ? value.replace(/[^0-9\s\+\-\(\)]/g, '').slice(0, 20) : sanitizeInput(value);
    setFormData(prev => ({
      ...prev,
      [name]: sanitized,
      ...(name === 'city' ? { parcelLocker: '' } : {}),
    }));
  };

  const generateUniqueOffset = async (baseAmount: number): Promise<number> => {
    const offsets = [0.0001, 0.0002, 0.0003, 0.0004, 0.0005, 0.0006, 0.0007, 0.0008, 0.0009];
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/get-unique-sol-offset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ base_sol: baseAmount }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.offset === 'number') return data.offset;
      }
    } catch {}
    return offsets[Math.floor(Math.random() * offsets.length)];
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone(formData.phone)) {
      setOrderError(t('invalidPhone') || 'Neteisingas telefono numeris.');
      return;
    }
    setOrderError('');
    const currentSolPrice = solPrice;
    setLockedSolPrice(currentSolPrice);
    const base = parseFloat((totalEurWithFee / currentSolPrice).toFixed(4));
    const offset = await generateUniqueOffset(base);
    setUniqueSolOffset(offset);
    setStep('payment');
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment) return;
    if (cart.length === 0) return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setOrderError('');
    try {
      const selectedLocker = filteredLockers.find(l => l.id === formData.parcelLocker);
      const orderItems = cart.map(item => {
        const tier = item.product.price_tiers?.find(t => t.quantity === item.quantity);
        const lineTotal = tier ? tier.price : item.product.price * item.quantity;
        return {
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: tier ? parseFloat((tier.price / item.quantity).toFixed(4)) : item.product.price,
          line_total: parseFloat(lineTotal.toFixed(2)),
        };
      });

      const fullOrderDetails = {
        items: orderItems,
        phone: formData.phone,
        city: formData.city,
        parcel_locker: selectedLocker
          ? { id: selectedLocker.id, provider: selectedLocker.provider, address: selectedLocker.address, locker_code: selectedLocker.locker_code }
          : null,
        pricing: {
          subtotal_eur: totalEur,
          discount_code: appliedDiscount?.code || null,
          discount_percent: appliedDiscount?.percent || null,
          discount_amount_eur: discountAmount,
          discounted_subtotal_eur: discountedTotal,
          shipping_fee_eur: shippingFee,
          total_eur: totalEurWithFee,
          sol_price_eur: lockedSolPrice ?? solPrice,
          base_sol: baseSolAmount,
          unique_sol_offset: uniqueSolOffset,
          total_sol: solAmount,
          commission_percent: appliedDiscount?.commission || null,
        },
        payment_method: selectedPayment,
        wallet_address: SOLANA_ADDRESS,
        crypto_type: 'SOL',
      };

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          customer_phone: formData.phone,
          customer_city: formData.city,
          delivery_method: 'parcel_locker',
          parcel_locker_id: formData.parcelLocker || null,
          order_items: orderItems,
          total_amount: totalEurWithFee,
          subtotal_amount: totalEur,
          discount_code: appliedDiscount?.code || null,
          discount_percent: appliedDiscount?.percent || null,
          discount_amount: discountAmount,
          crypto_amount: parseFloat(solAmount),
          unique_sol_offset: uniqueSolOffset,
          payment_status: 'pending',
          order_status: 'pending',
          full_order_details: fullOrderDetails,
          shipping_address: {
            crypto_type: 'SOL',
            wallet_address: SOLANA_ADDRESS,
            payment_method: selectedPayment,
            shipping_fee_eur: shippingFee,
            original_total_eur: totalEur,
          },
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!order) throw new Error('Failed to create order');

      if (appliedDiscount) {
        try { await supabase.rpc('increment_discount_usage', { p_code: appliedDiscount.code }); } catch {}
      }

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ order_id: order.id }),
        });
        if (!emailRes.ok) {
          console.error('send-order-email failed:', emailRes.status, await emailRes.text());
        }
      } catch (err) {
        console.error('send-order-email error:', err);
      }

      setSnapshotCart([...cart]);
      setSnapshotTotalEur(totalEur);
      setSnapshotShippingFee(shippingFee);
      setSnapshotSolAmount(solAmount);
      setSnapshotSelectedLocker(selectedLocker);
      setSnapshotDiscount(appliedDiscount ? { ...appliedDiscount, amount: discountAmount, commission: appliedDiscount.commission } : null);
      setSnapshotPaymentMethod(selectedPayment);
      setOrderNumber(order.order_number);
      setOrderId(order.id);
      clearCart();

      if (selectedPayment === 'swaps') {
        const swapsUrl = `https://www.swaps.app/?side=buy&amount=${totalEurWithFee.toFixed(2)}&fiat=EUR&to=SOL%3Asolana&country=LT&method=apple_pay&toAddress=${SOLANA_ADDRESS}`;
        window.open(swapsUrl, '_blank');
      }

      if (selectedPayment === 'paybis') {
        const paybisUrl = `https://paybis.com/buy-solana/?fromCurrencyCode=EUR&fromAmount=${totalEurWithFee.toFixed(2)}&toCurrencyCode=SOL&toAddress=${SOLANA_ADDRESS}`;
        window.open(paybisUrl, '_blank');
      }

      setStep('pending');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (typeof err === 'object' && err !== null && 'message' in err ? String((err as {message: unknown}).message) : String(err));
      setOrderError(msg || t('checkoutCodeError'));
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const toggleGuide = (method: PaymentMethod) => {
    setExpandedGuide(prev => prev === method ? null : method);
  };

  if (step === 'pending') {
    const pendingTotalWithFee = (snapshotTotalEur - (snapshotDiscount?.amount || 0) + snapshotShippingFee).toFixed(2);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-[#0a1929] border border-white/20 rounded-2xl max-w-md w-full p-6 sm:p-8 my-4">
          <div className="text-center">
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-blue-500/30 border-t-blue-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Wallet className="w-7 h-7 text-blue-300" />
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-1">{t('pendingTitle')}</h2>
            <p className="text-white/50 text-sm mb-4">{t('pendingOrder')} <span className="text-white font-bold">{orderNumber}</span></p>

            <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4 mb-4 flex items-center gap-3">
              {paymentChecking ? (
                <RefreshCw className="w-5 h-5 text-blue-300 animate-spin shrink-0" />
              ) : (
                <Clock className="w-5 h-5 text-blue-300 shrink-0" />
              )}
              <p className="text-blue-100 font-medium text-sm text-left">
                {paymentChecking ? t('pendingChecking') : t('pendingNext').replace('{time}', String(nextCheckIn))}
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#0d2137] to-[#0a1929] border-2 border-cyan-400/40 rounded-2xl p-5 mb-4 text-left">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3 text-center">{t('pendingSend')}</p>

              <div className="mb-4">
                <p className="text-white/50 text-xs mb-1">{t('pendingExact')}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/40 border border-cyan-400/30 rounded-xl px-4 py-3">
                    <span className="text-2xl font-black text-cyan-300 font-mono tracking-tight">{snapshotSolAmount} SOL</span>
                    <span className="text-white/40 text-sm ml-2">≈ {pendingTotalWithFee}€</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(snapshotSolAmount, 'sol')}
                    className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl transition-all font-semibold text-xs shrink-0 min-w-[64px] ${copySuccess === 'sol' ? 'bg-green-500 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}
                  >
                    {copySuccess === 'sol' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copySuccess === 'sol' ? t('pendingCopied') : t('pendingCopy')}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-white/50 text-xs mb-1">{t('pendingAddress')}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/40 border border-white/20 rounded-xl px-3 py-3 min-w-0">
                    <p className="text-xs font-mono text-white/80 break-all leading-relaxed">{SOLANA_ADDRESS}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(SOLANA_ADDRESS, 'address')}
                    className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl transition-all font-semibold text-xs shrink-0 min-w-[64px] ${copySuccess === 'address' ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                  >
                    {copySuccess === 'address' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copySuccess === 'address' ? t('pendingCopied') : t('pendingCopy')}
                  </button>
                </div>
              </div>

              <div className="mt-3 bg-red-500/15 border border-red-400/40 rounded-xl p-3">
                <p className="text-red-200 text-xs font-bold text-center">{t('exactSolWarning')}</p>
              </div>
            </div>

            {snapshotPaymentMethod === 'swaps' && (
              <a
                href={`https://www.swaps.app/?side=buy&amount=${(snapshotTotalEur - (snapshotDiscount?.amount || 0) + snapshotShippingFee).toFixed(2)}&fiat=EUR&to=SOL%3Asolana&country=LT&method=apple_pay&toAddress=${SOLANA_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-5 rounded-xl mb-4 transition-colors text-sm"
              >
                <svg viewBox="0 0 128 128" className="w-5 h-5 shrink-0" fill="none">
                  <rect width="128" height="128" rx="26" fill="white" fillOpacity="0.2"/>
                  <path d="M32 80C32 80 40 56 64 56C88 56 96 32 96 32" stroke="white" strokeWidth="10" strokeLinecap="round"/>
                  <path d="M32 48C32 48 40 72 64 72C88 72 96 96 96 96" stroke="white" strokeWidth="10" strokeLinecap="round" strokeOpacity="0.6"/>
                </svg>
                {t('guideSwapsBtn').replace('{amount}', snapshotSolAmount)}
              </a>
            )}

            {snapshotPaymentMethod === 'paybis' && (
              <a
                href={`https://paybis.com/buy-solana/?fromCurrencyCode=EUR&fromAmount=${(snapshotTotalEur - (snapshotDiscount?.amount || 0) + snapshotShippingFee).toFixed(2)}&toCurrencyCode=SOL&toAddress=${SOLANA_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-5 rounded-xl mb-4 transition-colors text-sm"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor">
                  <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                </svg>
                Mokėti kortele per Paybis — {(snapshotTotalEur - (snapshotDiscount?.amount || 0) + snapshotShippingFee).toFixed(2)}€
              </a>
            )}

            <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-xl p-4 mb-4">
              <p className="text-yellow-200/80 text-xs mb-2 font-medium">{t('pendingContact')}</p>
              <a
                href="https://t.me/Peptidai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full bg-blue-700 hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.48 13.86l-2.95-.924c-.642-.204-.654-.642.136-.953l11.57-4.461c.537-.194 1.006.131.826.726z"/>
                </svg>
                @Peptidai Telegram
              </a>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-lg transition-colors text-sm"
            >
              {t('pendingClose')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    const successTotalWithFee = snapshotTotalEur - (snapshotDiscount?.amount || 0) + snapshotShippingFee;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-[#0a1929] border border-white/20 rounded-2xl max-w-2xl w-full p-4 sm:p-8 my-4 sm:my-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-500/20 rounded-full p-4">
                <CheckCircle className="w-16 h-16 text-green-400" />
              </div>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">{t('successTitle')}</h2>

            <div className="bg-white/10 rounded-lg p-5 mb-6">
              <p className="text-base text-white/60 mb-2">{t('successOrderNum')}</p>
              <p className="text-2xl font-bold text-white">{orderNumber}</p>
            </div>

            {(paymentConfirmed || paymentConfirmedRef.current) ? (
              <div className="bg-green-500/20 border-2 border-green-400/50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                  <p className="text-green-300 text-xl font-bold">{t('successConfirmed')}</p>
                </div>
                <p className="text-green-200/70 text-base">{t('successConfirmedMsg')}</p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {paymentChecking ? (
                    <RefreshCw className="w-5 h-5 text-blue-300 animate-spin shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-white/40 shrink-0" />
                  )}
                  <div className="text-left">
                    <p className="text-white/80 text-base font-medium">
                      {paymentChecking ? t('pendingChecking') : t('successAwaitingPayment')}
                    </p>
                    {!paymentChecking && (
                      <p className="text-white/50 text-sm">{t('successNextCheck').replace('{time}', String(nextCheckIn))}</p>
                    )}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center shrink-0">
                  <span className="text-white/50 text-sm font-mono font-bold">{nextCheckIn}</span>
                </div>
              </div>
            )}

            {!(paymentConfirmed || paymentConfirmedRef.current) && (
              <>
                <div className="bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border-2 border-blue-400/40 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <Wallet className="w-8 h-8 text-blue-300 mr-3" />
                    <p className="text-blue-100 text-base sm:text-xl font-bold">{t('successMakePayment')}</p>
                  </div>

                  <div className="bg-white/10 rounded-lg p-4 mb-4">
                    <p className="text-base text-white/60 mb-2">{t('successPaymentAmount')}</p>
                    <p className="text-3xl font-bold text-white mb-1">{snapshotSolAmount} SOL</p>
                    <p className="text-base text-white/60">
                      ≈ {successTotalWithFee.toFixed(2)}€
                      {snapshotShippingFee > 0
                        ? <> ({t('checkoutProducts')} {snapshotTotalEur.toFixed(2)}€ + {t('checkoutShipping')} {snapshotShippingFee.toFixed(2)}€)</>
                        : <> ({t('checkoutProducts')} {snapshotTotalEur.toFixed(2)}€ + {t('cartFree')})</>}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-white/50 text-xs mb-1.5 font-medium">{t('exactSendAmount')}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-black/40 border border-cyan-400/40 rounded-xl px-4 py-3">
                          <span className="text-xl font-black text-cyan-300 font-mono">{snapshotSolAmount} SOL</span>
                          <span className="text-white/40 text-sm ml-2">≈ {successTotalWithFee.toFixed(2)}€</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(snapshotSolAmount, 'sol')}
                          className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl transition-all font-semibold text-xs shrink-0 min-w-[64px] ${copySuccess === 'sol' ? 'bg-green-500 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}
                        >
                          {copySuccess === 'sol' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                          {copySuccess === 'sol' ? t('pendingCopied') : t('pendingCopy')}
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-white/50 text-xs mb-1.5 font-medium">{t('sendToAddress')}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-black/40 border border-white/20 rounded-xl px-3 py-3 min-w-0">
                          <p className="text-xs font-mono text-white/80 break-all leading-relaxed">{SOLANA_ADDRESS}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(SOLANA_ADDRESS, 'address')}
                          className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl transition-all font-semibold text-xs shrink-0 min-w-[64px] ${copySuccess === 'address' ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                        >
                          {copySuccess === 'address' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                          {copySuccess === 'address' ? t('pendingCopied') : t('pendingCopy')}
                        </button>
                      </div>
                    </div>

                    {snapshotPaymentMethod === 'swaps' && (
                      <a
                        href={`https://www.swaps.app/?side=buy&amount=${(snapshotTotalEur - (snapshotDiscount?.amount || 0) + snapshotShippingFee).toFixed(2)}&fiat=EUR&to=SOL%3Asolana&country=LT&method=apple_pay&toAddress=${SOLANA_ADDRESS}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-4 px-6 rounded-xl transition-colors text-base mt-1"
                      >
                        <svg viewBox="0 0 128 128" className="w-5 h-5 shrink-0" fill="none">
                          <rect width="128" height="128" rx="26" fill="white" fillOpacity="0.2"/>
                          <path d="M32 80C32 80 40 56 64 56C88 56 96 32 96 32" stroke="white" strokeWidth="10" strokeLinecap="round"/>
                          <path d="M32 48C32 48 40 72 64 72C88 72 96 96 96 96" stroke="white" strokeWidth="10" strokeLinecap="round" strokeOpacity="0.6"/>
                        </svg>
                        {t('successBuySwaps').replace('{amount}', snapshotSolAmount)}
                      </a>
                    )}

                    {snapshotPaymentMethod === 'paybis' && (
                      <a
                        href={`https://paybis.com/buy-solana/?fromCurrencyCode=EUR&fromAmount=${successTotalWithFee.toFixed(2)}&toCurrencyCode=SOL&toAddress=${SOLANA_ADDRESS}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl transition-colors text-base mt-1"
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor">
                          <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                        </svg>
                        Mokėti kortele per Paybis — {successTotalWithFee.toFixed(2)}€
                      </a>
                    )}
                  </div>
                </div>

                <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-xl p-5 mb-6">
                  <p className="text-yellow-100 text-base font-semibold mb-2">{t('successImportant')}</p>
                  <ul className="text-yellow-100 text-base space-y-2 text-left">
                    {snapshotPaymentMethod === 'swaps' ? (
                      <>
                        <li>• {t('successBullet1Swaps').replace('{amount}', snapshotSolAmount)}</li>
                        <li>• {t('successBullet2Swaps')}</li>
                        <li>• {t('successBullet3')}</li>
                      </>
                    ) : (
                      <>
                        <li>• {t('successBullet1').replace('{amount}', snapshotSolAmount)}</li>
                        <li>• {t('successBullet2')}</li>
                        <li>• {t('successBullet3')}</li>
                      </>
                    )}
                  </ul>
                </div>
              </>
            )}

            <div className="bg-white/10 rounded-lg p-5 mb-6 text-left">
              <h3 className="text-lg font-bold text-white mb-4">{t('successOrderInfo')}</h3>
              <div className="space-y-0 text-base">
                <div className="py-2.5 border-b border-white/10">
                  <p className="text-white/60 text-sm mb-1">{t('successPurchased')}</p>
                  {snapshotCart.map(item => {
                    const tier = item.product.price_tiers?.find(t => t.quantity === item.quantity);
                    const lineTotal = tier ? tier.price : item.product.price * item.quantity;
                    return (
                      <div key={item.product.id} className="flex justify-between items-center gap-4 py-0.5">
                        <span className="text-white">{item.product.name} × {item.quantity}</span>
                        <span className="font-semibold text-white shrink-0">{lineTotal.toFixed(2)}€</span>
                      </div>
                    );
                  })}
                </div>
                {[
                  [t('successPhone'), formData.phone],
                  [t('successCity'), formData.city],
                  [t('successLocker'), snapshotSelectedLocker ? `${snapshotSelectedLocker.provider} - ${snapshotSelectedLocker.address}` : '—'],
                  [t('successSubtotal'), `${snapshotTotalEur.toFixed(2)}€`],
                  [t('successDiscountCode'), snapshotDiscount ? snapshotDiscount.code : '—'],
                  ...(snapshotDiscount ? [
                    [t('successDiscount').replace('{percent}', String(snapshotDiscount.percent)), `-${snapshotDiscount.amount.toFixed(2)}€`],
                  ] : []),
                  [t('successShipping'), snapshotShippingFee > 0 ? `+${snapshotShippingFee.toFixed(2)}€` : t('cartFree')],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-start gap-4 py-2.5 border-b border-white/10">
                    <span className={`shrink-0 ${snapshotDiscount && label === t('successDiscount').replace('{percent}', String(snapshotDiscount.percent)) ? 'text-green-400' : 'text-white/60'}`}>{label}</span>
                    <span className={`font-medium text-right ${snapshotDiscount && label === t('successDiscount').replace('{percent}', String(snapshotDiscount.percent)) ? 'text-green-400' : 'text-white'}`}>{value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-start gap-4 py-2.5">
                  <span className="text-white/60 shrink-0">{t('successTotalPaid')}</span>
                  <span className="font-bold text-white text-right text-lg">{successTotalWithFee.toFixed(2)}€</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-5 mb-6">
              <p className="text-blue-100 text-base mb-3">{t('successContact')}</p>
              <a
                href="https://t.me/Peptidai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-300 hover:text-blue-200 underline font-bold text-lg"
              >
                @Peptidai (Telegram)
              </a>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-white text-[#0a1929] hover:bg-white/90 font-bold py-4 px-6 rounded-lg transition-colors"
            >
              {t('successFinish')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto">
      <div className="bg-[#0a1929] border border-white/20 rounded-t-2xl sm:rounded-2xl max-w-2xl w-full my-0 sm:my-8">
        <div className="bg-[#0a1929] border-b border-white/10 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between sticky top-0 z-10 rounded-t-2xl">
          <h2 className="text-lg sm:text-2xl font-bold text-white">
            {step === 'info' ? t('checkoutDelivery') : t('checkoutPayment')}
          </h2>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 active:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(100vh-120px)] sm:max-h-[calc(100vh-160px)]">
          {step === 'info' ? (
            <form onSubmit={handleInfoSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">{t('checkoutPhone')}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="+370 600 00000"
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-white/50 focus:border-white/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">{t('checkoutCity')}</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:border-white/40 focus:outline-none"
                >
                  <option value="" className="bg-[#0a1929]">{t('checkoutSelectCity')}</option>
                  {cities.map(city => (
                    <option key={city} value={city} className="bg-[#0a1929]">{city}</option>
                  ))}
                </select>
              </div>

              {formData.city && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">{t('checkoutSelectLocker')}</label>
                  <select
                    name="parcelLocker"
                    value={formData.parcelLocker}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:border-white/40 focus:outline-none"
                  >
                    <option value="" className="bg-[#0a1929]">{t('checkoutSelectLocker')}</option>
                    {filteredLockers.map(locker => (
                      <option key={locker.id} value={locker.id} className="bg-[#0a1929]">
                        {locker.provider} - {locker.address}
                      </option>
                    ))}
                  </select>
                  {formData.parcelLocker && (
                    <p className="mt-2 text-sm text-white/60">
                      {t('checkoutLockerCode')} {filteredLockers.find(l => l.id === formData.parcelLocker)?.locker_code}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white mb-2">{t('checkoutDiscount')}</label>
                {appliedDiscount ? (
                  <div className="bg-green-500/20 border-2 border-green-400/50 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Check className="w-5 h-5 text-green-400 shrink-0" />
                      <span className="text-green-300 font-semibold flex-1">
                        {t('checkoutDiscountApplied').replace('{code}', appliedDiscount.code).replace('{percent}', String(appliedDiscount.percent))}
                      </span>
                      <button
                        type="button"
                        onClick={() => setAppliedDiscount(null)}
                        className="text-white/40 hover:text-white/70 text-xs"
                      >
                        {t('checkoutRemove')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCodeInput}
                      onChange={e => { setDiscountCodeInput(e.target.value); setDiscountError(''); }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleApplyDiscount(); } }}
                      placeholder={t('checkoutEnterCode')}
                      className="flex-1 px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-white/50 focus:border-white/40 focus:outline-none uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyDiscount}
                      disabled={discountLoading || !discountCodeInput.trim()}
                      className="flex items-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors shrink-0"
                    >
                      {discountLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                      <span className="hidden sm:inline">{t('checkoutApply')}</span>
                    </button>
                  </div>
                )}
                {discountError && <p className="mt-2 text-sm text-red-400">{discountError}</p>}
              </div>

              <div className="bg-white/10 rounded-lg p-4 mt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-white/80">
                    <span className="text-sm">{t('checkoutProducts')}</span>
                    <span className="font-semibold">{totalEur.toFixed(2)}€</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex items-center justify-between text-green-400">
                      <span className="text-sm">
                        {t('checkoutDiscountLine').replace('{code}', appliedDiscount.code).replace('{percent}', String(appliedDiscount.percent))}
                      </span>
                      <span className="font-semibold">-{discountAmount.toFixed(2)}€</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-white/80">
                    <span className="text-sm">{t('checkoutShipping')}</span>
                    <span className="font-semibold">{shippingFee > 0 ? `${shippingFee.toFixed(2)}€` : t('cartFree')}</span>
                  </div>
                  {totalEur >= FREE_SHIPPING_THRESHOLD && (
                    <div className="flex items-center justify-center py-1">
                      <span className="text-xs text-green-400 font-semibold">{t('checkoutFreeShipping')}</span>
                    </div>
                  )}
                  {totalEur > 0 && totalEur < FREE_SHIPPING_THRESHOLD && (
                    <div className="flex items-center justify-center py-1">
                      <span className="text-xs text-yellow-400 font-semibold">
                        {t('checkoutFreeShippingAdd').replace('{amount}', (FREE_SHIPPING_THRESHOLD - totalEur).toFixed(2))}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-white/20 pt-2 mt-2">
                    <span className="text-lg font-semibold text-white">{t('checkoutTotal')}</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{totalEurWithFee.toFixed(2)}€</div>
                      <div className="text-sm text-white/50 font-mono">≈ {solAmount} SOL</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-400/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Wallet className="w-6 h-6 text-blue-300 shrink-0" />
                  <div>
                    <p className="text-white font-semibold text-sm">{t('paymentMethodSol')}</p>
                    <p className="text-blue-200 font-mono text-lg font-bold">{solAmount} SOL</p>
                    <p className="text-white/50 text-xs">{t('exactAmountNote')}</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-white text-[#0a1929] hover:bg-white/90 font-bold py-4 px-6 rounded-lg transition-colors"
              >
                {t('checkoutContinue')}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="bg-white/10 border border-white/20 rounded-xl p-5">
                <h3 className="font-bold text-white mb-3 text-lg">{t('orderAmount')}</h3>
                <div className="space-y-2 text-base">
                  {cart.map(item => {
                    const tier = item.product.price_tiers?.find(t => t.quantity === item.quantity);
                    const lineTotal = tier ? tier.price : item.product.price * item.quantity;
                    return (
                      <div key={item.product.id} className="flex justify-between text-white/80">
                        <span>{item.product.name} x {item.quantity}</span>
                        <span className="font-semibold text-white">{lineTotal.toFixed(2)}€</span>
                      </div>
                    );
                  })}
                  <div className="border-t border-white/20 pt-2 mt-2 space-y-1">
                    {appliedDiscount && (
                      <div className="flex justify-between text-green-400">
                        <span>
                          {t('checkoutDiscountLine').replace('{code}', appliedDiscount.code).replace('{percent}', String(appliedDiscount.percent))}
                        </span>
                        <span>-{discountAmount.toFixed(2)}€</span>
                      </div>
                    )}
                    <div className="flex justify-between text-white/80">
                      <span>{t('checkoutShipping')}</span>
                      <span>{shippingFee > 0 ? `${shippingFee.toFixed(2)}€` : t('cartFree')}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold text-lg pt-1 border-t border-white/20">
                      <span>{t('checkoutTotal')}</span>
                      <span>{totalEurWithFee.toFixed(2)}€ ≈ {solAmount} SOL</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-3">{t('checkoutPayment')}</h3>

                <div className="space-y-3">
                  <PaymentOption
                    id="swaps"
                    selected={selectedPayment === 'swaps'}
                    onSelect={() => setSelectedPayment('swaps')}
                    expanded={expandedGuide === 'swaps'}
                    onToggleGuide={() => toggleGuide('swaps')}
                    label="Swaps.app"
                    badge={t('swapsBadge')}
                    badgeColor="bg-cyan-500"
                    howLabel={t('howTo')}
                    icon={
                      <svg viewBox="0 0 128 128" className="w-8 h-8" fill="none">
                        <rect width="128" height="128" rx="26" fill="#0B1426"/>
                        <circle cx="64" cy="64" r="36" stroke="#00D2FF" strokeWidth="7" fill="none"/>
                        <path d="M64 28 A36 36 0 0 1 100 64" stroke="#00D2FF" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        <path d="M82 50 L100 64 L82 78" stroke="#00D2FF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                        <path d="M64 100 A36 36 0 0 1 28 64" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.5"/>
                        <path d="M46 78 L28 64 L46 50" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5"/>
                      </svg>
                    }
                    guide={<SwapsGuide solAmount={solAmount} totalEurWithFee={totalEurWithFee} />}
                  />

                  <PaymentOption
                    id="paybis"
                    selected={selectedPayment === 'paybis'}
                    onSelect={() => setSelectedPayment('paybis')}
                    expanded={expandedGuide === 'paybis'}
                    onToggleGuide={() => toggleGuide('paybis')}
                    label="Paybis"
                    badge="KORTELE"
                    badgeColor="bg-blue-600"
                    howLabel={t('howTo')}
                    icon={
                      <svg viewBox="0 0 128 128" className="w-8 h-8" fill="none">
                        <rect width="128" height="128" rx="26" fill="#1A56DB"/>
                        <rect x="20" y="42" width="88" height="44" rx="8" fill="white"/>
                        <rect x="20" y="54" width="88" height="12" fill="#1A56DB" fillOpacity="0.3"/>
                        <rect x="28" y="68" width="20" height="8" rx="2" fill="#1A56DB" fillOpacity="0.5"/>
                        <rect x="80" y="66" width="20" height="10" rx="3" fill="#F59E0B"/>
                        <circle cx="86" cy="71" r="7" fill="#EF4444" fillOpacity="0.9"/>
                        <circle cx="94" cy="71" r="7" fill="#F59E0B" fillOpacity="0.9"/>
                      </svg>
                    }
                    guide={<PaybisGuide totalEurWithFee={totalEurWithFee} />}
                  />

                  <PaymentOption
                    id="phantom"
                    selected={selectedPayment === 'phantom'}
                    onSelect={() => setSelectedPayment('phantom')}
                    expanded={expandedGuide === 'phantom'}
                    onToggleGuide={() => toggleGuide('phantom')}
                    label="Phantom Wallet"
                    badge={t('phantomBadge')}
                    badgeColor="bg-green-500"
                    badgeTextColor="text-white"
                    howLabel={t('howTo')}
                    icon={
                      <svg viewBox="0 0 128 128" className="w-8 h-8" fill="none">
                        <rect width="128" height="128" rx="26" fill="#534BB1"/>
                        <path d="M64 18C42.5 18 25 35.5 25 57C25 67.5 29 77 35.5 84L30 110H44L49 95C53.5 97.5 58.6 99 64 99C69.4 99 74.5 97.5 79 95L84 110H98L92.5 84C99 77 103 67.5 103 57C103 35.5 85.5 18 64 18Z" fill="white"/>
                        <circle cx="50" cy="57" r="7" fill="#534BB1"/>
                        <circle cx="78" cy="57" r="7" fill="#534BB1"/>
                        <circle cx="48" cy="55" r="2.5" fill="white"/>
                        <circle cx="76" cy="55" r="2.5" fill="white"/>
                      </svg>
                    }
                    guide={<PhantomGuide solAmount={solAmount} totalEurWithFee={totalEurWithFee} />}
                  />

                  <PaymentOption
                    id="trust"
                    selected={selectedPayment === 'trust'}
                    onSelect={() => setSelectedPayment('trust')}
                    expanded={expandedGuide === 'trust'}
                    onToggleGuide={() => toggleGuide('trust')}
                    label="Trust Wallet"
                    badge={t('trustBadge')}
                    badgeColor="bg-blue-500"
                    badgeTextColor="text-white"
                    howLabel={t('howTo')}
                    icon={
                      <svg viewBox="0 0 128 128" className="w-8 h-8" fill="none">
                        <rect width="128" height="128" rx="26" fill="#fff"/>
                        <defs>
                          <linearGradient id="twGrad2" x1="64" y1="14" x2="64" y2="114" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#0500FF"/>
                            <stop offset="100%" stopColor="#1FC7D4"/>
                          </linearGradient>
                        </defs>
                        <path d="M64 14L18 32V62C18 85.5 38.5 107 64 114C89.5 107 110 85.5 110 62V32L64 14Z" fill="url(#twGrad2)"/>
                        <path d="M64 26L30 42V62C30 80.2 45.2 98.5 64 104C82.8 98.5 98 80.2 98 62V42L64 26Z" fill="white" fillOpacity="0.15"/>
                        <path d="M50 64L44 58L41 61L50 70L87 33L84 30L50 64Z" fill="white"/>
                      </svg>
                    }
                    guide={<TrustWalletGuide solAmount={solAmount} totalEurWithFee={totalEurWithFee} />}
                  />

                  <PaymentOption
                    id="revolut"
                    selected={selectedPayment === 'revolut'}
                    onSelect={() => setSelectedPayment('revolut')}
                    expanded={expandedGuide === 'revolut'}
                    onToggleGuide={() => toggleGuide('revolut')}
                    label="Revolut"
                    badge={t('revolutBadge')}
                    badgeColor="bg-slate-600"
                    badgeTextColor="text-white"
                    howLabel={t('howTo')}
                    icon={
                      <svg viewBox="0 0 128 128" className="w-8 h-8" fill="none">
                        <rect width="128" height="128" rx="26" fill="#0666EB"/>
                        <path d="M36 24H70C84.4 24 96 35.6 96 50C96 59.8 90.6 68.3 82.5 72.8L96 104H78L65.5 74H54V104H36V24ZM54 40V58H70C74.4 58 78 54.4 78 50C78 45.6 74.4 42 70 42L54 40Z" fill="white"/>
                      </svg>
                    }
                    guide={<RevolutGuide solAmount={solAmount} totalEurWithFee={totalEurWithFee} />}
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#0d2137] to-[#0a1929] border-2 border-cyan-400/30 rounded-2xl p-4">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3 text-center">{t('paymentInfo')}</p>

                <div className="mb-3">
                  <p className="text-white/50 text-xs mb-1">{t('exactSendAmount')}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-black/40 border border-cyan-400/30 rounded-xl px-3 py-2.5">
                      <span className="text-lg font-black text-cyan-300 font-mono">{solAmount} SOL</span>
                      <span className="text-white/40 text-xs ml-2">≈ {totalEurWithFee.toFixed(2)}€</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(solAmount, 'sol')}
                      className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all font-semibold text-xs shrink-0 min-w-[60px] ${copySuccess === 'sol' ? 'bg-green-500 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}
                    >
                      {copySuccess === 'sol' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copySuccess === 'sol' ? t('pendingCopied') : t('pendingCopy')}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-white/50 text-xs mb-1">{t('sendToAddress')}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-black/40 border border-white/20 rounded-xl px-3 py-2.5 min-w-0">
                      <p className="text-xs font-mono text-white/80 break-all leading-relaxed">{SOLANA_ADDRESS}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(SOLANA_ADDRESS, 'address')}
                      className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all font-semibold text-xs shrink-0 min-w-[60px] ${copySuccess === 'address' ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                    >
                      {copySuccess === 'address' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copySuccess === 'address' ? t('pendingCopied') : t('pendingCopy')}
                    </button>
                  </div>
                </div>

                <p className="text-yellow-300/70 text-xs mt-2.5 text-center">{t('sendExact')}</p>
              </div>

              <div className="bg-red-500/15 border-2 border-red-400/50 rounded-xl p-4">
                <p className="text-red-200 text-sm font-bold text-center">{t('exactSolWarning')}</p>
              </div>

              {orderError && (
                <div className="bg-red-500/20 border border-red-400/40 rounded-xl p-4">
                  <p className="text-red-300 text-sm font-semibold">{t('errorTitle')}</p>
                  <p className="text-red-200 text-sm mt-1 break-all">{orderError}</p>
                </div>
              )}

              <button
                onClick={handleConfirmPayment}
                disabled={loading || !selectedPayment}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>{t('checkoutCreating')}</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    <span>
                      {selectedPayment
                        ? t('checkoutConfirm').replace('{amount}', solAmount)
                        : t('checkoutSelectMethod')}
                    </span>
                  </>
                )}
              </button>

              <button
                onClick={() => { setLockedSolPrice(null); setStep('info'); }}
                className="w-full bg-white/10 text-white hover:bg-white/20 font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {t('checkoutBack')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PaymentOptionProps {
  id: PaymentMethod;
  selected: boolean;
  onSelect: () => void;
  expanded: boolean;
  onToggleGuide: () => void;
  label: string;
  badge?: string;
  badgeColor?: string;
  badgeTextColor?: string;
  howLabel: string;
  icon: React.ReactNode;
  guide: React.ReactNode;
}

function PaymentOption({ id, selected, onSelect, expanded, onToggleGuide, label, badge, badgeColor, badgeTextColor = 'text-white', howLabel, icon, guide }: PaymentOptionProps) {
  return (
    <div className={`rounded-xl border-2 transition-all ${selected ? 'border-blue-400 bg-blue-500/10' : 'border-white/20 bg-white/5'}`}>
      <div className="flex items-center gap-4 p-4">
        <button
          onClick={onSelect}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selected ? 'border-blue-400 bg-blue-400' : 'border-white/40'}`}
        >
          {selected && <div className="w-2 h-2 bg-white rounded-full" />}
        </button>
        <div
          onClick={onSelect}
          className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
        >
          {icon}
          <span className="text-white font-semibold text-base shrink-0">{label}</span>
          {badge && (
            <span className={`${badgeColor} ${badgeTextColor} text-xs font-bold px-2 py-0.5 rounded-full shrink-0`}>{badge}</span>
          )}
        </div>
        <button
          onClick={onToggleGuide}
          className="flex items-center gap-1 text-sm text-blue-300 hover:text-blue-200 transition-colors shrink-0"
        >
          <span>{howLabel}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-white/10 p-4">
          {guide}
        </div>
      )}
    </div>
  );
}

function SwapsGuide({ solAmount, totalEurWithFee }: { solAmount: string; totalEurWithFee: number }) {
  const { t } = useLanguage();
  const swapsUrl = `https://www.swaps.app/?side=buy&amount=${totalEurWithFee.toFixed(2)}&fiat=EUR&to=SOL%3Asolana&country=LT&method=apple_pay&toAddress=${SOLANA_ADDRESS}`;
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-400/30 rounded-xl p-4">
        <p className="text-white font-bold text-center text-base">{t('guideSwapsFastest')}</p>
        <p className="text-white/70 text-sm text-center mt-1">{t('guideSwapsFastestDesc')}</p>
      </div>
      <GuideStep number={1} title={t('guideSwaps1T')}>
        <div className="bg-white/10 rounded-lg p-3 space-y-2">
          <p className="text-white/80 text-base">• {t('guideSwaps1B1').replace('Swaps.app', '')} <span className="text-cyan-300 font-semibold">Swaps.app</span></p>
          <p className="text-white/80 text-base">• {t('guideSwaps1B2').replace('{amount}', '')} <span className="text-yellow-300 font-bold">{solAmount} SOL</span></p>
          <p className="text-white/80 text-base">• {t('guideSwaps1B3')}</p>
        </div>
      </GuideStep>
      <GuideStep number={2} title={t('guideSwaps2T')}>
        <div className="bg-white/10 rounded-lg p-3 space-y-2">
          <p className="text-white/80 text-base">• {t('guideSwaps2B1')}</p>
          <p className="text-white/80 text-base">• {t('guideSwaps2B2').replace('{amount}', totalEurWithFee.toFixed(2))}</p>
          <p className="text-white/80 text-base">• {t('guideSwaps2B3')}</p>
        </div>
        <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3 mt-2">
          <p className="text-green-300 text-sm font-semibold">{t('guideSwaps2Note')}</p>
        </div>
      </GuideStep>
      <GuideStep number={3} title={t('guideSwaps3T')}>
        <div className="bg-white/10 rounded-lg p-3 space-y-2">
          <p className="text-white/80 text-base">• {t('guideSwaps3B1')}</p>
          <p className="text-white/80 text-base">• {t('guideSwaps3B2')}</p>
        </div>
        <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3 mt-2">
          <p className="text-green-300 text-base font-semibold"><a href="https://t.me/Peptidai" target="_blank" rel="noopener noreferrer" className="underline">@Peptidai (Telegram)</a></p>
        </div>
      </GuideStep>
      <a
        href={swapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-4 px-6 rounded-xl transition-colors text-base mt-2"
      >
        <svg viewBox="0 0 128 128" className="w-5 h-5 shrink-0" fill="none">
          <rect width="128" height="128" rx="26" fill="white" fillOpacity="0.2"/>
          <path d="M32 80C32 80 40 56 64 56C88 56 96 32 96 32" stroke="white" strokeWidth="10" strokeLinecap="round"/>
          <path d="M32 48C32 48 40 72 64 72C88 72 96 96 96 96" stroke="white" strokeWidth="10" strokeLinecap="round" strokeOpacity="0.6"/>
        </svg>
        {t('guideSwapsBtn').replace('{amount}', solAmount)}
      </a>
    </div>
  );
}

function PhantomGuide({ solAmount, totalEurWithFee }: { solAmount: string; totalEurWithFee: number }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-400/30 rounded-xl p-4 mb-4">
        <p className="text-white font-bold text-center text-base">{t('guideSolanaTitle')}</p>
        <p className="text-white/70 text-sm text-center mt-1">{t('guideSolanaDesc')}</p>
      </div>

      <GuideStep number={1} title={t('guidePhantom1T')}>
        <p className="text-white/70 text-base mb-3">{t('guidePhantom1Desc')}</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <img
            src="https://images.pexels.com/photos/6802042/pexels-photo-6802042.jpeg?auto=compress&cs=tinysrgb&w=400"
            alt="Phantom App Store"
            className="w-full h-32 object-cover rounded-lg opacity-80"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="bg-white/10 rounded-lg p-3 flex flex-col justify-center">
            <p className="text-white/80 text-sm font-semibold mb-1">{t('guidePhantomAppName')}</p>
            <p className="text-white/50 text-sm">{t('guidePhantomDownload')}</p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-yellow-400 text-sm">★★★★★</span>
              <span className="text-white/50 text-sm">4.9</span>
            </div>
          </div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 space-y-2">
          <p className="text-white/80 text-base">• {t('guidePhantom1B1')}</p>
          <p className="text-white/80 text-base">• {t('guidePhantom1B2')}</p>
          <p className="text-yellow-300 text-base font-semibold">• {t('guidePhantom1B3')}</p>
          <p className="text-white/80 text-base">• {t('guidePhantom1B4')}</p>
        </div>
      </GuideStep>

      <GuideStep number={2} title={t('guidePhantom2T')}>
        <div className="bg-white/10 rounded-lg p-3 space-y-2">
          <p className="text-white/80 text-base">• {t('guidePhantom2B1')}</p>
          <p className="text-white/80 text-base">• {t('guidePhantom2B2').replace('{amount}', (totalEurWithFee + 5).toFixed(0))}</p>
          <p className="text-white/80 text-base">• {t('guidePhantom2B3')}</p>
          <p className="text-white/80 text-base">• {t('guidePhantom2B4')}</p>
          <p className="text-white/80 text-base">• {t('guidePhantom2B5')}</p>
          <p className="text-white/80 text-base">• {t('guidePhantom2B6')}</p>
        </div>
        <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3 mt-2">
          <p className="text-green-300 text-sm font-semibold">{t('guidePhantom2Note')}</p>
        </div>
      </GuideStep>

      <GuideStep number={3} title={t('guidePhantom3T')}>
        <div className="bg-white/10 rounded-lg p-3 space-y-2">
          <p className="text-white/80 text-base">• {t('guidePhantom3B1')}</p>
          <p className="text-white/80 text-base">• {t('guidePhantom3B2')}</p>
          <p className="text-white/80 text-base">• {t('guidePhantom3B3')}</p>
          <p className="text-white/80 text-base">• {t('guidePhantom3B4').replace('{amount}', solAmount)}</p>
        </div>
        <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3 mt-3">
          <p className="text-green-300 text-base font-semibold">{t('guidePhantom3Note')}</p>
        </div>
      </GuideStep>
    </div>
  );
}

function TrustWalletGuide({ solAmount, totalEurWithFee }: { solAmount: string; totalEurWithFee: number }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-400/30 rounded-xl p-4">
        <p className="text-white font-bold text-center text-base">{t('guideTrustTitle')}</p>
        <p className="text-white/70 text-sm text-center mt-1">{t('guideTrustDesc')}</p>
      </div>

      <GuideStep number={1} title={t('guideTrust1T')}>
        <div className="bg-white/10 rounded-lg p-3 space-y-2">
          <p className="text-white/80 text-base">• {t('guideTrust1B1')}</p>
          <p className="text-white/80 text-base">• {t('guideTrust1B2')}</p>
          <p className="text-white/80 text-base">• {t('guideTrust1B3')}</p>
        </div>
      </GuideStep>

      <GuideStep number={2} title={t('guideTrust2T')}>
        <div className="bg-white/10 rounded-lg p-3 space-y-2">
          <p className="text-white/80 text-base">• {t('guideTrust2B1')}</p>
          <p className="text-white/80 text-base">• {t('guideTrust2B2')}</p>
          <p className="text-white/80 text-base">• {t('guideTrust2B3')}</p>
          <p className="text-white/80 text-base">• {t('guideTrust2B4')}</p>
          <p className="text-white/80 text-base">• {t('guideTrust2B5')}</p>
          <p className="text-white/80 text-base">• {t('guideTrust2B6').replace('{amount}', (totalEurWithFee + 5).toFixed(0))}</p>
        </div>
        <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3 mt-2">
          <p className="text-green-300 text-sm font-semibold">{t('guideTrust2Note')}</p>
        </div>
      </GuideStep>

      <GuideStep number={3} title={t('guideTrust3T')}>
        <div className="bg-white/10 rounded-lg p-3 space-y-2">
          <p className="text-white/80 text-base">• {t('guideTrust3B1')}</p>
          <p className="text-white/80 text-base">• {t('guideTrust3B2')}</p>
          <p className="text-white/80 text-base">• {t('guideTrust3B3')}</p>
          <p className="text-white/80 text-base">• {t('guideTrust3B4').replace('{amount}', solAmount)}</p>
          <p className="text-white/80 text-base">• {t('guideTrust3B5')}</p>
        </div>
        <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3 mt-3">
          <p className="text-green-300 text-base font-semibold">{t('guideTrust3Note')}</p>
        </div>
      </GuideStep>
    </div>
  );
}

function RevolutGuide({ solAmount, totalEurWithFee }: { solAmount: string; totalEurWithFee: number }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <GuideStep number={1} title={t('guideRevolut1T')}>
        <div className="bg-white/10 rounded-lg p-3 space-y-2">
          <p className="text-white/80 text-base">• {t('guideRevolut1B1')}</p>
          <p className="text-white/80 text-base">• {t('guideRevolut1B2')}</p>
        </div>
      </GuideStep>

      <GuideStep number={2} title={t('guideRevolut2T')}>
        <div className="bg-white/10 rounded-lg p-3 space-y-2">
          <p className="text-white/80 text-base">• {t('guideRevolut2B1')}</p>
          <p className="text-white/80 text-base">• {t('guideRevolut2B2')}</p>
          <p className="text-white/80 text-base">• {t('guideRevolut2B3')}</p>
          <p className="text-white/80 text-base">• {t('guideRevolut2B4').replace('{amount}', (totalEurWithFee + 5).toFixed(0))}</p>
        </div>
      </GuideStep>

      <GuideStep number={3} title={t('guideRevolut3T')}>
        <div className="bg-white/10 rounded-lg p-3 space-y-2">
          <p className="text-white/80 text-base">• {t('guideRevolut3B1')}</p>
          <p className="text-white/80 text-base">• {t('guideRevolut3B2')}</p>
          <p className="text-white/80 text-base">• {t('guideRevolut3B3')}</p>
          <p className="text-white/80 text-base">• {t('guideRevolut3B4')}</p>
          <p className="text-white/80 text-base">• {t('guideRevolut3B5').replace('{amount}', solAmount)}</p>
        </div>
        <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3 mt-3">
          <p className="text-yellow-200 text-sm">{t('guideRevolutWarn')}</p>
        </div>
        <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3 mt-2">
          <p className="text-green-300 text-base font-semibold">{t('guideRevolutNote')}</p>
        </div>
      </GuideStep>
    </div>
  );
}

function PaybisGuide({ totalEurWithFee }: { totalEurWithFee: number }) {
  const paybisUrl = `https://paybis.com/buy-solana/?fromCurrencyCode=EUR&fromAmount=${totalEurWithFee.toFixed(2)}&toCurrencyCode=SOL&toAddress=${SOLANA_ADDRESS}`;
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-400/30 rounded-xl p-4">
        <p className="text-white font-bold text-center text-base">Paybis — mokėjimas kortele</p>
        <p className="text-white/70 text-sm text-center mt-1">Greitas SOL pirkimas kortele be kriptovaliutos žinių</p>
      </div>
      <GuideStep number={1} title="Atidarykite Paybis">
        <div className="bg-white/10 rounded-lg p-3 space-y-2">
          <p className="text-white/80 text-base">• Spauskite mygtuką apačioje — suma jau užpildyta automatiškai</p>
          <p className="text-white/80 text-base">• Bus rodoma: <span className="text-yellow-300 font-bold">{totalEurWithFee.toFixed(2)}€</span></p>
          <p className="text-white/80 text-base">• Gavėjo adresas užpildytas automatiškai</p>
        </div>
      </GuideStep>
      <GuideStep number={2} title="Mokėkite kortele">
        <div className="bg-white/10 rounded-lg p-3 space-y-2">
          <p className="text-white/80 text-base">• Įveskite savo kortelės duomenis</p>
          <p className="text-white/80 text-base">• Gali reikėti patvirtinti el. paštu arba SMS</p>
          <p className="text-white/80 text-base">• Visa suma: <span className="text-yellow-300 font-bold">{totalEurWithFee.toFixed(2)}€</span></p>
        </div>
        <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3 mt-2">
          <p className="text-green-300 text-sm font-semibold">SOL bus automatiškai nusiųstas tiesiai mums.</p>
        </div>
      </GuideStep>
      <GuideStep number={3} title="Laukite patvirtinimo">
        <div className="bg-white/10 rounded-lg p-3 space-y-2">
          <p className="text-white/80 text-base">• Mokėjimas patvirtinamas per kelias minutes</p>
          <p className="text-white/80 text-base">• Sistema automatiškai užfiksuos gavimą</p>
          <p className="text-white/80 text-base">• Klausimais rašykite <a href="https://t.me/Peptidai" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">@Peptidai</a></p>
        </div>
      </GuideStep>
      <a
        href={paybisUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl transition-colors text-base mt-2"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor">
          <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
        </svg>
        Mokėti {totalEurWithFee.toFixed(2)}€ kortele per Paybis
      </a>
    </div>
  );
}

function GuideStep({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="flex-shrink-0 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center font-bold text-white text-sm">{number}</span>
        <p className="text-white font-semibold">{title}</p>
      </div>
      {children}
    </div>
  );
}
